const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
var newOTP = require("otp-generators");
const User = require("../models/user.model");
const Category = require("../models/CategoryModel");
const ContactDetail = require("../models/ContactDetail");
const service = require('../models/service')
const storeModel = require('../models/store');
const Cart = require('../models/cartModel');
const transactionModel = require('../models/transactionModel');
const Address = require("../models/AddressModel");
const orderModel = require('../models/orderModel');
const helpandSupport = require('../models/helpAndSupport');
const serviceCategory = require('../models/serviceCategory')
const rating = require('../models/ratingModel');
const orderRatingModel = require('../models/orderRatingModel');
const Charges = require('../models/Charges');
const Coupan = require('../models/Coupan');
const freeService = require('../models/freeService');
const feedback = require('../models/feedback');
const ticket = require('../models/ticket');
const favouriteBooking = require('../models/favouriteBooking');
const cityModel = require('../models/city');
const slot = require('../models/slot');
exports.registration = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id });
                if (user) {
                        if (req.body.refferalCode == null || req.body.refferalCode == undefined || req.body.refferalCode == "") {
                                req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                                req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                                req.body.accountVerification = false;
                                req.body.refferalCode = await reffralCode();
                                req.body.completeProfile = true;
                                const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                                let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.phone }
                                return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                        } else {
                                const findUser = await User.findOne({ refferalCode: req.body.refferalCode });
                                if (findUser) {
                                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                                        req.body.accountVerification = false;
                                        req.body.userType = "USER";
                                        req.body.refferalCode = await reffralCode();
                                        req.body.refferUserId = findUser._id;
                                        req.body.completeProfile = true;
                                        const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                                        if (userCreate) {
                                                let updateWallet = await User.findOneAndUpdate({ _id: findUser._id }, { $push: { joinUser: userCreate._id } }, { new: true });
                                                let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.phone }
                                                return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                                        }
                                } else {
                                        return res.status(404).send({ status: 404, message: "Invalid refferal code", data: {} });
                                }
                        }
                } else {
                        return res.status(404).send({ status: 404, msg: "Not found" });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
        }
};
exports.socialLogin = async (req, res) => {
        try {
                const { firstName, lastName, email, phone } = req.body;
                console.log(req.body);
                const user = await User.findOne({ $and: [{ $or: [{ email }, { phone }] }, { userType: "USER" }] });
                if (user) {
                        jwt.sign({ id: user._id }, authConfig.secret, (err, token) => {
                                if (err) {
                                        return res.status(401).send("Invalid Credentials");
                                } else {
                                        return res.status(200).json({ status: 200, msg: "Login successfully", userId: user._id, token: token, });
                                }
                        });
                } else {
                        let refferalCode = await reffralCode();
                        const newUser = await User.create({ firstName, lastName, phone, email, refferalCode, userType: "USER" });
                        if (newUser) {
                                jwt.sign({ id: newUser._id }, authConfig.secret, (err, token) => {
                                        if (err) {
                                                return res.status(401).send("Invalid Credentials");
                                        } else {
                                                console.log(token);
                                                return res.status(200).json({ status: 200, msg: "Login successfully", userId: newUser._id, token: token, });
                                        }
                                });
                        }
                }
        } catch (err) {
                console.error(err);
                return createResponse(res, 500, "Internal server error");
        }
};
exports.loginWithPhone = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: "USER" });
                if (!user) {
                        let otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        let otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        let accountVerification = false;
                        const newUser = await User.create({ phone: phone, otp, otpExpiration, accountVerification, userType: "USER" });
                        let obj = { id: newUser._id, otp: newUser.otp, phone: newUser.phone }
                        return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
                } else {
                        const userObj = {};
                        userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        userObj.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        userObj.accountVerification = false;
                        const updated = await User.findOneAndUpdate({ phone: phone, userType: "USER" }, userObj, { new: true, });
                        let obj = { id: updated._id, otp: updated.otp, phone: updated.phone }
                        return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
        }
};
exports.verifyOtp = async (req, res) => {
        try {
                const { otp } = req.body;
                const user = await User.findById(req.params.id);
                if (!user) {
                        return res.status(404).send({ message: "user not found" });
                }
                if (user.otp !== otp || user.otpExpiration < Date.now()) {
                        return res.status(400).json({ message: "Invalid OTP" });
                }
                const updated = await User.findByIdAndUpdate({ _id: user._id }, { accountVerification: true }, { new: true });
                const accessToken = await jwt.sign({ id: user._id }, authConfig.secret, {
                        expiresIn: authConfig.accessTokenTime,
                });
                let obj = {
                        userId: updated._id,
                        otp: updated.otp,
                        phone: updated.phone,
                        token: accessToken,
                        completeProfile: updated.completeProfile
                }
                return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, }).select('fullName email phone gender alternatePhone dob address1 address2 image refferalCode completeProfile');
                if (data) {
                        return res.status(200).json({ status: 200, message: "get Profile", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.updateProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let image;
                        if (req.file) {
                                image = req.file.path
                        }
                        let obj = {
                                fullName: req.body.fullName || data.fullName,
                                email: req.body.email || data.email,
                                phone: req.body.phone || data.phone,
                                gender: req.body.gender || data.gender,
                                alternatePhone: req.body.alternatePhone || data.alternatePhone,
                                dob: req.body.dob || data.dob,
                                address1: req.body.address1 || data.address1,
                                address2: req.body.address2 || data.address2,
                                image: image || data.image
                        }
                        console.log(obj);
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).json({ status: 200, message: "Update profile successfully.", data: update });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.resendOTP = async (req, res) => {
        const { id } = req.params;
        try {
                const user = await User.findOne({ _id: id, userType: "USER" });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                }
                const otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                const accountVerification = false;
                const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, otpExpiration, accountVerification }, { new: true });
                let obj = {
                        id: updated._id,
                        otp: updated.otp,
                        phone: updated.phone
                }
                return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.updateLocation = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        if (req.body.currentLat || req.body.currentLong) {
                                coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)]
                                req.body.currentLocation = { type: "Point", coordinates };
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: { currentLocation: req.body.currentLocation, city: req.body.city, sector: req.body.sector } }, { new: true });
                        if (update) {
                                return res.status(200).send({ status: 200, message: "Location update successfully.", data: update.currentLocation });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "All category found successfully.", data: categories })
};
exports.getserviceCategory = async (req, res) => {
        const categories = await serviceCategory.find({});
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "All Service Category found successfully.", data: categories })
};
exports.getVendorbyserviceCategory = async (req, res) => {
        const categories = await User.find({ serviceCategoryId: { $in: req.params.serviceCategoryId } }).select('likeUser address1 address2 servieImages serviceName');
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "All vendor found successfully.", data: categories, serviceCategoryId: req.params.serviceCategoryId })
};
exports.viewContactDetails = async (req, res) => {
        try {
                let findcontactDetails = await ContactDetail.findOne();
                if (!findcontactDetails) {
                        return res.status(404).send({ status: 404, message: "Contact Detail not found.", data: {} });
                } else {
                        return res.status(200).send({ status: 200, message: "Contact Detail fetch successfully", data: findcontactDetails });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ status: 500, msg: "internal server error", error: err.message, });
        }
};
exports.listStore = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.find({ categoryId: req.params.categoryId });
                        if (findStore.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Store Data found successfully.', data: findStore });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.params.vendorId }).select('address1 address2 servieImages likeUser Monday Tuesday Wednesday Thursday Friday Saturday Sunday serviceName');;
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                }
                const staff = await User.find({ vendorId: req.params.vendorId, userType: "STAFF" }).populate('serviceCategoryId').select('_id fullName firstName lastName image');
                let findService = await service.find({ serviceCategoryId: req.params.serviceCategoryId, vendorId: vendorData._id })
                if (findService.length == 0) {
                        return res.status(404).send({ status: 404, message: "Data not found" });
                } else {
                        res.json({ status: 200, message: 'Store Data found successfully.', service: findService, vendorId: vendorData, staff: staff });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addMoney = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: data.wallet + parseInt(req.body.balance) } }, { new: true });
                        if (update) {
                                const date = new Date();
                                let month = date.getMonth() + 1
                                let obj = {
                                        user: req.user._id,
                                        date: date,
                                        month: month,
                                        amount: req.body.balance,
                                        type: "Credit",
                                };
                                const data1 = await transactionModel.create(obj);
                                if (data1) {
                                        return res.status(200).json({ status: 200, message: "Money has been added.", data: update, });
                                }

                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.removeMoney = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: data.wallet - parseInt(req.body.balance) } }, { new: true });
                        if (update) {
                                const date = new Date();
                                let month = date.getMonth() + 1;
                                let obj;
                                if (req.body.orderId) {
                                        obj = {
                                                orderId: req.body.orderId,
                                                user: req.user._id,
                                                date: date,
                                                month: month,
                                                amount: req.body.balance,
                                                type: "Debit",
                                        };
                                }
                                if (req.body.subscriptionId) {
                                        obj = {
                                                subscriptionId: req.body.subscriptionId,
                                                user: req.user._id,
                                                date: date,
                                                month: month,
                                                amount: req.body.balance,
                                                type: "Debit",
                                        };
                                }
                                const data1 = await transactionModel.create(obj);
                                if (data1) {
                                        return res.status(200).json({ status: 200, message: "Money has been deducted.", data: update, });
                                }
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getWallet = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        return res.status(200).json({ message: "Wallet balance found.", data: data.wallet });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.allTransactionUser = async (req, res) => {
        try {
                if (req.query.month != (null || undefined)) {
                        const data = await transactionModel.find({ user: req.user._id, month: req.query.month }).populate("user subscriptionId orderId");
                        if (data.length > 0) {
                                return res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                        } else {
                                return res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                        }
                } else {
                        const data = await transactionModel.find({ user: req.user._id }).populate("user subscriptionId orderId");
                        if (data.length > 0) {
                                return res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                        } else {
                                return res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                        }
                }
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.allcreditTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Credit" });
                if (data.length > 0) {
                        return res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                }
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.allDebitTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Debit" });
                if (data.length > 0) {
                        return res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                }
        } catch (err) {
                return res.status(400).json({ message: err.message });
        }
};
exports.getStaff = async (req, res) => {
        try {
                const staff = await User.find({ vendorId: req.params.vendorId, userType: "STAFF" }).select('_id fullName firstName lastName');
                if (staff.length == 0) {
                        return res.status(404).send({ status: 404, message: "Staff not found" });
                } else {
                        return res.status(200).json({ message: "Staff Category Found", status: 200, data: staff, });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.createAddress = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        req.body.user = data._id;
                        const address = await Address.create(req.body);
                        return res.status(200).json({ message: "Address create successfully.", data: address });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getallAddress = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const allAddress = await Address.find({ user: data._id });
                        return res.status(200).json({ message: "Address data found.", data: allAddress });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.updateAddress = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await Address.findById({ _id: req.params.id });
                        if (data1) {
                                const newAddressData = req.body;
                                let update = await Address.findByIdAndUpdate(data1._id, newAddressData, { new: true, });
                                return res.status(200).json({ status: 200, message: "Address update successfully.", data: update });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deleteAddress = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await Address.findById({ _id: req.params.id });
                        if (data1) {
                                let update = await Address.findByIdAndDelete(data1._id);
                                return res.status(200).json({ status: 200, message: "Address Deleted Successfully", });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getAddressbyId = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await Address.findById({ _id: req.params.id });
                        if (data1) {
                                return res.status(200).json({ status: 200, message: "Address found successfully.", data: data1 });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.reOrder = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findUserOrder = await orderModel.findOne({ orderId: req.params.orderId });
                        if (findUserOrder) {
                                const staff = await User.findOne({ _id: req.body.staffId, vendorId: findUserOrder.vendorId, userType: "STAFF" });
                                if (staff) {
                                        let orderId = await reffralCode()
                                        let obj = {
                                                orderId: orderId,
                                                userId: findUserOrder.userId,
                                                vendorId: findUserOrder.vendorId,
                                                staffId: staff._id,
                                                Date: req.body.date,
                                                time: req.body.time,
                                                services: findUserOrder.services,
                                                totalAmount: findUserOrder.totalAmount,
                                                totalItem: findUserOrder.totalItem,
                                                address: req.body.address,
                                        }
                                        let SaveOrder = await orderModel.create(obj);
                                        if (SaveOrder) {
                                                return res.status(200).json({ status: 200, message: "order create successfully.", data: SaveOrder });
                                        }
                                } else {
                                        return res.status(404).send({ status: 404, message: "Staff id not found" });
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.cancelOrder = async (req, res) => {
        try {
                let findUserOrder = await orderModel.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let update = await orderModel.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "cancel" } }, { new: true });
                        return res.status(200).json({ message: "Payment success.", status: 200, data: update })
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOngoingOrders = async (req, res) => {
        try {
                const data = await orderModel.find({ userId: req.user._id, serviceStatus: "Pending" })
                if (data.length > 0) {
                        return res.status(200).json({ message: "All orders", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getCompleteOrders = async (req, res) => {
        try {
                const data = await orderModel.find({ userId: req.user._id, serviceStatus: "Complete" })
                if (data.length > 0) {
                        return res.status(200).json({ message: "All orders", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrder = async (req, res) => {
        try {
                const data = await orderModel.findById({ _id: req.params.id }).populate("services.serviceId").populate({ path: 'services.serviceId', populate: { path: 'serviceCategoryId', model: 'serviceCategory', select: "name" }, });;
                if (data) {
                        return res.status(200).json({ message: "view order", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.AddQuery = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data = {
                                user: data._id,
                                name: req.body.name,
                                email: req.body.email,
                                mobile: req.body.mobile,
                                query: req.body.query
                        }
                        const Data = await helpandSupport.create(data);
                        return res.status(200).json({ status: 200, message: "Send successfully.", data: Data })
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (err) {
                console.log(err);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getAllQuery = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const Data = await helpandSupport.find({ user: req.user._id });
                        if (data.length == 0) {
                                return res.status(404).json({ status: 404, message: "Help and support data not found", data: {} });
                        } else {
                                return res.status(200).json({ status: 200, message: "Data found successfully.", data: Data })
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (err) {
                console.log(err);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.giveRating = async (req, res) => {
        try {
                console.log(req.user._id);
                let findUser = await User.findOne({ _id: req.user._id });
                if (!findUser) {
                        return res.status(404).json({ message: "Token Expired or invalid.", status: 404 });
                } else {
                        let month = new Date(Date.now()).getMonth() + 1;
                        let findUsers = await User.findOne({ _id: req.params.id });
                        if (findUsers) {
                                let findRating = await rating.findOne({ userId: findUsers._id, month: month })
                                if (findRating) {
                                        let obj = { userId: findUser._id, rating: req.body.rating, comment: req.body.comment, date: Date.now() };
                                        let averageRating = (((findRating.averageRating * findRating.rating.length) + req.body.rating) / (findRating.rating.length + 1));
                                        let update = await rating.findByIdAndUpdate({ _id: findRating._id }, { $set: { averageRating: parseFloat(averageRating).toFixed(2), totalRating: findRating.rating.length + 1 }, $push: { rating: obj } }, { new: true });
                                        if (update) {
                                                let findVendorRating = await rating.findOne({ userId: findUsers.vendorId, month: month })
                                                if (findVendorRating) {
                                                        let obj = { staffId: findUsers._id, userId: findUser._id, rating: req.body.rating, comment: req.body.comment, date: Date.now() };
                                                        let averageRating = (((findVendorRating.averageRating * findVendorRating.rating.length) + req.body.rating) / (findVendorRating.rating.length + 1));
                                                        let update = await rating.findByIdAndUpdate({ _id: findVendorRating._id }, { $set: { averageRating: parseFloat(averageRating).toFixed(2), totalRating: findVendorRating.rating.length + 1 }, $push: { rating: obj } }, { new: true });
                                                        if (update) {
                                                                let obj2 = {
                                                                        vendorId: findUsers.vendorId,
                                                                        orderId: req.params.orderId,
                                                                        staffId: findUsers._id,
                                                                        userId: findUser._id,
                                                                        rating: req.body.rating,
                                                                        comment: req.body.comment,
                                                                        date: Date.now(),
                                                                        month: month,
                                                                }
                                                                const Datas = await orderRatingModel.create(obj2);
                                                                if (Datas) {
                                                                        return res.status(200).json({ status: 200, message: "Rating given successfully.", data: update });
                                                                }
                                                        }
                                                }
                                        }
                                } else {
                                        let data = {
                                                userId: findUsers._id,
                                                rating: [{
                                                        userId: findUser._id,
                                                        rating: req.body.rating,
                                                        comment: req.body.comment,
                                                        date: Date.now(),
                                                }],
                                                month: month,
                                                averageRating: req.body.rating,
                                                totalRating: 1
                                        }
                                        const Data = await rating.create(data);
                                        if (Data) {
                                                let obj = {
                                                        userId: findUsers.vendorId,
                                                        rating: [{
                                                                staffId: findUsers._id,
                                                                userId: findUser._id,
                                                                rating: req.body.rating,
                                                                comment: req.body.comment,
                                                                date: Date.now(),
                                                        }],
                                                        month: month,
                                                        averageRating: req.body.rating,
                                                        totalRating: 1
                                                }
                                                const objs = await rating.create(obj);
                                                if (objs) {
                                                        let obj2 = {
                                                                vendorId: findUsers.vendorId,
                                                                orderId: req.params.orderId,
                                                                staffId: findUsers._id,
                                                                userId: findUser._id,
                                                                rating: req.body.rating,
                                                                comment: req.body.comment,
                                                                date: Date.now(),
                                                                month: month,
                                                        }
                                                        const Datas = await orderRatingModel.create(obj2);
                                                        return res.status(200).json({ status: 200, message: "Rating given successfully.", data: Data });
                                                }
                                        }
                                }
                        } else {
                                return res.status(404).json({ message: "User Not found.", status: 404 });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ message: "server error.", data: {}, });
        }
};
exports.addLike = async (req, res) => {
        try {
                const { id } = req.params;
                let findUser = await User.findOne({ _id: req.user._id });
                if (!findUser) {
                        return res.status(404).json({ message: "Token Expired or invalid.", status: 404 });
                } else {
                        const post = await User.findById(id);
                        if (!post) {
                                return res.status(404).json({ error: 'not found' });
                        } else {
                                if (post.likeUser.includes(findUser._id)) {
                                        const update = await User.findByIdAndUpdate({ _id: post._id }, { $pull: { likeUser: findUser._id }, $set: { likeCount: post.likeCount - 1 } }, { new: true });
                                        if (update) {
                                                return res.status(200).json({ status: 200, message: "Un like successfully", likeUser: update.likeUser, likeCount: update.likeCount });
                                        }
                                } else {
                                        const update = await User.findByIdAndUpdate({ _id: post._id }, { $push: { likeUser: findUser._id }, $set: { likeCount: post.likeCount + 1 } }, { new: true });
                                        if (update) {
                                                return res.status(200).json({ status: 200, message: "Like successfully", likeUser: update.likeUser, likeCount: update.likeCount });
                                        }
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ error: 'An error occurred while adding the like' });
        }
};
// exports.addToCart1 = async (req, res) => {
//         try {
//                 let userData = await User.findOne({ _id: req.user._id });
//                 if (!userData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findCart = await Cart.findOne({ userId: userData._id });
//                         if (findCart) {
//                                 if (findCart.services.length == 0) {
//                                         let findService = await service.findById({ _id: req.body._id });
//                                         if (findService) {
//                                                 let Charged = [], totalAmount = 0, paidAmount = 0, additionalFee = 0, coupan = 0, wallet = 0, tipProvided = 0;
//                                                 const findCharge = await Charges.find({});
//                                                 if (findCharge.length > 0) {
//                                                         for (let i = 0; i < findCharge.length; i++) {
//                                                                 let obj1 = {
//                                                                         chargeId: findCharge[i]._id,
//                                                                         charge: findCharge[i].charge,
//                                                                         discountCharge: findCharge[i].discountCharge,
//                                                                         discount: findCharge[i].discount,
//                                                                         cancelation: findCharge[i].cancelation,
//                                                                 }
//                                                                 if (findCharge[i].cancelation == false) {
//                                                                         if (findCharge[i].discount == true) {
//                                                                                 additionalFee = additionalFee + findCharge[i].discountCharge
//                                                                         } else {
//                                                                                 additionalFee = additionalFee + findCharge[i].charge
//                                                                         }
//                                                                 }
//                                                                 Charged.push(obj1)
//                                                         }
//                                                 }
//                                                 if (findCart.coupanUsed == true) {
//                                                         let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
//                                                         coupan = findCoupan.discount;
//                                                 } else {
//                                                         coupan = 0
//                                                 }
//                                                 if (findCart.walletUsed == true) {
//                                                         wallet = userData.wallet;
//                                                 } else {
//                                                         wallet = 0
//                                                 }
//                                                 if (findCart.tip == true) {
//                                                         tipProvided = findCart.tipProvided
//                                                 } else {
//                                                         tipProvided = 0;
//                                                 }
//                                                 let total = findService.price * req.body.quantity;
//                                                 let obj = {
//                                                         serviceId: findService._id,
//                                                         price: findService.price,
//                                                         quantity: req.body.quantity,
//                                                         total: total,
//                                                 }
//                                                 let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { services: obj } }, { new: true });
//                                                 if (update) {
//                                                         for (let j = 0; j < update.services.length; j++) {
//                                                                 totalAmount = totalAmount + update.services[j].total
//                                                         }
//                                                         paidAmount = totalAmount + additionalFee + tipProvided - wallet - coupan;
//                                                         let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { Charges: Charged, totalAmount: totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
//                                                         return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
//                                                 }
//                                         } else {
//                                                 return res.status(404).send({ status: 404, message: "Service not found" });
//                                         }
//                                 } else {
//                                        const obj = findCart.services.find((user) => { return (user.serviceId).toString() === req.body._id });
//                                         if (obj) { 
//                                                 let Charged = [], services = [], totalAmount = 0, paidAmount = 0, additionalFee = 0, coupan = 0, wallet = 0, tipProvided = 0;
//                                                 const findCharge = await Charges.find({});
//                                                 if (findCharge.length > 0) {
//                                                         for (let i = 0; i < findCharge.length; i++) {
//                                                                 let obj1 = {
//                                                                         chargeId: findCharge[i]._id,
//                                                                         charge: findCharge[i].charge,
//                                                                         discountCharge: findCharge[i].discountCharge,
//                                                                         discount: findCharge[i].discount,
//                                                                         cancelation: findCharge[i].cancelation,
//                                                                 }
//                                                                 if (findCharge[i].cancelation == false) {
//                                                                         if (findCharge[i].discount == true) {
//                                                                                 additionalFee = additionalFee + findCharge[i].discountCharge
//                                                                         } else {
//                                                                                 additionalFee = additionalFee + findCharge[i].charge
//                                                                         }
//                                                                 }
//                                                                 Charged.push(obj1)
//                                                         }
//                                                 }
//                                                 if (findCart.coupanUsed == true) {
//                                                         let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
//                                                         coupan = findCoupan.discount;
//                                                 } else {
//                                                         coupan = 0
//                                                 }
//                                                 if (findCart.walletUsed == true) {
//                                                         wallet = userData.wallet;
//                                                 } else {
//                                                         wallet = 0
//                                                 }
//                                                 if (findCart.tip == true) {
//                                                         tipProvided = findCart.tipProvided
//                                                 } else {
//                                                         tipProvided = 0;
//                                                 }
//                                                 if (findCart.services.length > 1) {
//                                                         for (let i = 0; i < findCart.services.length; i++) {
//                                                                 if ((findCart.services[i].serviceId).toString() != req.body._id) {
//                                                                         let findService = await service.findById({ _id: findCart.services[i].serviceId });
//                                                                         if (findService) {
//                                                                                 let total = findService.price * findCart.services[i].quantity;
//                                                                                 let obj = {
//                                                                                         serviceId: findService._id,
//                                                                                         price: findService.price,
//                                                                                         quantity: req.body.quantity,
//                                                                                         total: total,
//                                                                                 }
//                                                                                 services.push(obj)
//                                                                         }
//                                                                 }
//                                                         }
//                                                         let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { services: services } }, { new: true });
//                                                         if (update) {
//                                                                 for (let j = 0; j < update.services.length; j++) {
//                                                                         totalAmount = totalAmount + update.services[j].total
//                                                                 }
//                                                                 paidAmount = totalAmount + additionalFee + tipProvided - wallet - coupan;
//                                                                 let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { Charges: Charged, totalAmount: totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
//                                                                 return res.status(200).json({ status: 200, message: "Service remove from cart Successfully.", data: update1 })
//                                                         }
//                                                 } else {
//                                                         let update1 = await Cart.findByIdAndDelete({ _id: findCart._id });
//                                                         return res.status(200).json({ status: 200, message: "Cart is empty.", data: update1 })
//                                                 }
//                                         } else {
//                                                 let findService = await service.findById({ _id: req.body._id });
//                                                 if (findService) {
//                                                         let Charged = [], totalAmount = 0, paidAmount = 0, additionalFee = 0, coupan = 0, wallet = 0, tipProvided = 0;
//                                                         const findCharge = await Charges.find({});
//                                                         if (findCharge.length > 0) {
//                                                                 for (let i = 0; i < findCharge.length; i++) {
//                                                                         let obj1 = {
//                                                                                 chargeId: findCharge[i]._id,
//                                                                                 charge: findCharge[i].charge,
//                                                                                 discountCharge: findCharge[i].discountCharge,
//                                                                                 discount: findCharge[i].discount,
//                                                                                 cancelation: findCharge[i].cancelation,
//                                                                         }
//                                                                         if (findCharge[i].cancelation == false) {
//                                                                                 if (findCharge[i].discount == true) {
//                                                                                         additionalFee = additionalFee + findCharge[i].discountCharge
//                                                                                 } else {
//                                                                                         additionalFee = additionalFee + findCharge[i].charge
//                                                                                 }
//                                                                         }
//                                                                         Charged.push(obj1)
//                                                                 }
//                                                         }
//                                                         if (findCart.coupanUsed == true) {
//                                                                 let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
//                                                                 coupan = findCoupan.discount;
//                                                         } else {
//                                                                 coupan = 0
//                                                         }
//                                                         if (findCart.walletUsed == true) {
//                                                                 wallet = userData.wallet;
//                                                         } else {
//                                                                 wallet = 0
//                                                         }
//                                                         if (findCart.tip == true) {
//                                                                 tipProvided = findCart.tipProvided
//                                                         } else {
//                                                                 tipProvided = 0;
//                                                         }
//                                                         let total = findService.price * req.body.quantity;
//                                                         let obj = {
//                                                                 serviceId: findService._id,
//                                                                 price: findService.price,
//                                                                 quantity: req.body.quantity,
//                                                                 total: total,
//                                                         }
//                                                         let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { services: obj } }, { new: true });
//                                                         if (update) {
//                                                                 for (let j = 0; j < update.services.length; j++) {
//                                                                         totalAmount = totalAmount + update.services[j].total
//                                                                 }
//                                                                 paidAmount = totalAmount + additionalFee + tipProvided - wallet - coupan;
//                                                                 let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { Charges: Charged, totalAmount: totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
//                                                                 return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
//                                                         }
//                                                 } else {
//                                                         return res.status(404).send({ status: 404, message: "Service not found" });
//                                                 }
//                                         }
//                                 }
//                         } else {
//                                 let findService = await service.findById({ _id: req.body._id });
//                                 if (findService) {
//                                         let Charged = [], paidAmount = 0, totalAmount = 0, additionalFee = 0;
//                                         const findCharge = await Charges.find({});
//                                         if (findCharge.length > 0) {
//                                                 for (let i = 0; i < findCharge.length; i++) {
//                                                         let obj1 = {
//                                                                 chargeId: findCharge[i]._id,
//                                                                 charge: findCharge[i].charge,
//                                                                 discountCharge: findCharge[i].discountCharge,
//                                                                 discount: findCharge[i].discount,
//                                                                 cancelation: findCharge[i].cancelation,
//                                                         }
//                                                         if (findCharge[i].cancelation == false) {
//                                                                 if (findCharge[i].discount == true) {
//                                                                         additionalFee = additionalFee + findCharge[i].discountCharge
//                                                                 } else {
//                                                                         additionalFee = additionalFee + findCharge[i].charge
//                                                                 }
//                                                         }
//                                                         Charged.push(obj1)
//                                                 }
//                                         }
//                                         totalAmount = findService.price * req.body.quantity;
//                                         paidAmount = totalAmount + additionalFee;
//                                         let obj = {
//                                                 userId: userData._id,
//                                                 vendorId: findService.vendorId,
//                                                 Charges: Charged,
//                                                 services: [{
//                                                         serviceId: findService._id,
//                                                         price: findService.price,
//                                                         quantity: req.body.quantity,
//                                                         total: findService.price * req.body.quantity,
//                                                 }],
//                                                 totalAmount: totalAmount,
//                                                 additionalFee: additionalFee,
//                                                 paidAmount: paidAmount,
//                                                 totalItem: 1,
//                                         }
//                                         const Data = await Cart.create(obj);
//                                         console.log(Data);
//                                         return res.status(200).json({ status: 200, message: "Service successfully add to cart. ", data: Data })
//                                 } else {
//                                         return res.status(404).send({ status: 404, message: "Service not found" });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//                 return res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
exports.getCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id }).populate("coupanId services.serviceId Charges.chargeId").populate({ path: 'freeService.freeServiceId', populate: { path: 'serviceId', model: 'services', select: "name" }, })
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                let totalTime = 0;
                                if (findCart.fromTime != (null || undefined)) {
                                        if (findCart.services.length > 0) {
                                                for (let i = 0; i < findCart.services.length; i++) {
                                                        totalTime = totalTime + findCart.services[i].totalMin;
                                                }
                                        }
                                        var dateTimeString = findCart.fromTime;
                                        var dateTimeObject = new Date(dateTimeString);
                                        let d = dateTimeObject.toISOString().split('T')[0];
                                        var hours1 = dateTimeObject.getUTCHours();
                                        var minutes1 = dateTimeObject.getUTCMinutes();
                                        const hours = parseInt(hours1);
                                        const minutes = parseInt(minutes1);
                                        const providedTimeInMinutes = hours * 60 + minutes + 30;
                                        let toTimeInMinutes = providedTimeInMinutes + totalTime;
                                        const toTime = new Date(d);
                                        toTime.setMinutes(toTimeInMinutes);
                                        findCart.toTime = toTime;
                                        findCart.save();
                                }
                                return res.status(200).json({ message: "cart data found.", status: 200, data: findCart });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addStafftoCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).send({ status: 404, message: "Your cart have no service found." });
                                } else {
                                        const staff = await User.findOne({ _id: req.body.staffId, vendorId: findCart.vendorId, userType: "STAFF" });
                                        if (staff) {
                                                const d = new Date(req.body.date);
                                                let text = d.toISOString();
                                                let totalTime = 0;
                                                if (findCart.services.length > 0) {
                                                        for (let i = 0; i < findCart.services.length; i++) {
                                                                totalTime += findCart.services[i].totalMin;
                                                        }
                                                }
                                                let x = `${req.body.date}T${req.body.time}:00.000Z`;
                                                const timeArray = req.body.time.split(':');
                                                const hours = parseInt(timeArray[0]);
                                                const minutes = parseInt(timeArray[1]);
                                                const providedTimeInMinutes = hours * 60 + minutes + 30;
                                                let toTimeInMinutes = providedTimeInMinutes + totalTime;
                                                const toTime = new Date(d);
                                                toTime.setMinutes(toTimeInMinutes);
                                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { Date: text, fromTime: x, toTime: toTime, staffId: staff._id } }, { new: true });
                                                if (update) {
                                                        return res.status(200).send({ status: 200, message: "Cart update successfully.", data: update });
                                                }
                                        } else {
                                                return res.status(404).send({ status: 404, message: "Staff id not found" });
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Your cart is not found." });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.provideTip = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        let Charged = [], paidAmount = 0, additionalFee = 0, coupan = 0, wallet = 0, tip;
                                        const findCharge = await Charges.find({});
                                        if (findCharge.length > 0) {
                                                for (let i = 0; i < findCharge.length; i++) {
                                                        let obj1 = {
                                                                chargeId: findCharge[i]._id,
                                                                charge: findCharge[i].charge,
                                                                discountCharge: findCharge[i].discountCharge,
                                                                discount: findCharge[i].discount,
                                                                cancelation: findCharge[i].cancelation,
                                                        }
                                                        if (findCharge[i].cancelation == false) {
                                                                if (findCharge[i].discount == true) {
                                                                        additionalFee = additionalFee + findCharge[i].discountCharge
                                                                } else {
                                                                        additionalFee = additionalFee + findCharge[i].charge
                                                                }
                                                        }
                                                        Charged.push(obj1)
                                                }
                                        }
                                        if (findCart.coupanUsed == true) {
                                                let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
                                                coupan = findCoupan.discount;
                                        } else {
                                                coupan = 0
                                        }
                                        if (findCart.walletUsed == true) {
                                                wallet = userData.wallet;
                                        } else {
                                                wallet = 0
                                        }
                                        if (req.body.tipProvided > 0) {
                                                tip = true
                                        } else {
                                                tip = false
                                        }
                                        paidAmount = findCart.totalAmount + additionalFee + req.body.tipProvided - wallet - coupan;
                                        let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { Charges: Charged, tip: tip, tipProvided: req.body.tipProvided, walletUsed: findCart.walletUsed, coupanUsed: findCart.coupanUsed, freeServiceUsed: findCart.freeServiceUsed, wallet: wallet, coupan: coupan, freeService: findCart.freeService, totalAmount: findCart.totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: findCart.totalItem } }, { new: true });
                                        return res.status(200).json({ status: 200, message: "Tip add to cart Successfully.", data: update1 })
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listCoupan = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await Coupan.find({ userId: vendorData._id });
                        if (findService.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Coupan Data found successfully.', service: findService });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.applyCoupan = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        let Charged = [], paidAmount = 0, additionalFee = 0, coupan = 0, coupanUsed, wallet = 0, tipProvided = 0;
                                        const findCharge = await Charges.find({});
                                        if (findCharge.length > 0) {
                                                for (let i = 0; i < findCharge.length; i++) {
                                                        let obj1 = {
                                                                chargeId: findCharge[i]._id,
                                                                charge: findCharge[i].charge,
                                                                discountCharge: findCharge[i].discountCharge,
                                                                discount: findCharge[i].discount,
                                                                cancelation: findCharge[i].cancelation,
                                                        }
                                                        if (findCharge[i].cancelation == false) {
                                                                if (findCharge[i].discount == true) {
                                                                        additionalFee = additionalFee + findCharge[i].discountCharge
                                                                } else {
                                                                        additionalFee = additionalFee + findCharge[i].charge
                                                                }
                                                        }
                                                        Charged.push(obj1)
                                                }
                                        }
                                        let findCoupan = await Coupan.findOne({ couponCode: req.body.couponCode });
                                        if (!findCoupan) {
                                                return res.status(404).json({ status: 404, message: "Coupan not found", data: {} });
                                        } else {
                                                if (findCoupan.status == true) {
                                                        return res.status(409).json({ status: 409, message: "Coupan Already used", data: {} });
                                                } else {
                                                        if (findCoupan.expirationDate > Date.now()) {
                                                                coupan = findCoupan.discount;
                                                                coupanUsed = true;
                                                                if (findCart.walletUsed == true) {
                                                                        wallet = userData.wallet;
                                                                } else {
                                                                        wallet = 0
                                                                }
                                                                if (findCart.tip == true) {
                                                                        tipProvided = findCart.tipProvided
                                                                } else {
                                                                        tipProvided = 0;
                                                                }
                                                                paidAmount = findCart.totalAmount + additionalFee + tipProvided - wallet - coupan;
                                                                let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, {
                                                                        $set: { coupanId: findCoupan._id, Charges: Charged, tip: findCart.tip, tipProvided: tipProvided, walletUsed: findCart.walletUsed, coupanUsed: coupanUsed, freeServiceUsed: findCart.freeServiceUsed, wallet: wallet, coupan: coupan, freeService: findCart.freeService, totalAmount: findCart.totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: findCart.totalItem }
                                                                }, { new: true });
                                                                return res.status(200).json({ status: 200, message: "Tip add to cart Successfully.", data: update1 })
                                                        } else {
                                                                return res.status(409).json({ status: 409, message: "Coupan expired", data: {} });
                                                        }
                                                }
                                        }
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.applyWallet = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        let Charged = [], paidAmount = 0, totalPaidAmount = 0, additionalFee = 0, coupan = 0, wallet = 0, walletUsed, userWallet;
                                        const findCharge = await Charges.find({});
                                        if (findCharge.length > 0) {
                                                for (let i = 0; i < findCharge.length; i++) {
                                                        let obj1 = {
                                                                chargeId: findCharge[i]._id,
                                                                charge: findCharge[i].charge,
                                                                discountCharge: findCharge[i].discountCharge,
                                                                discount: findCharge[i].discount,
                                                                cancelation: findCharge[i].cancelation,
                                                        }
                                                        if (findCharge[i].cancelation == false) {
                                                                if (findCharge[i].discount == true) {
                                                                        additionalFee = additionalFee + findCharge[i].discountCharge
                                                                } else {
                                                                        additionalFee = additionalFee + findCharge[i].charge
                                                                }
                                                        }
                                                        Charged.push(obj1)
                                                }
                                        }
                                        if (findCart.coupanUsed == true) {
                                                let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
                                                coupan = findCoupan.discount;
                                        } else {
                                                coupan = 0
                                        }
                                        if (userData.wallet > 0) {
                                                wallet = userData.wallet;
                                                walletUsed = true;
                                        } else {
                                                return res.status(200).json({ status: 404, message: "wallet balance zero.", data: findCart });
                                        }
                                        if (findCart.tip == true) {
                                                tipProvided = findCart.tipProvided
                                        } else {
                                                tipProvided = 0;
                                        }
                                        paidAmount = findCart.totalAmount + additionalFee + tipProvided - coupan;
                                        totalPaidAmount = findCart.totalAmount + additionalFee + tipProvided - coupan;
                                        if (wallet > totalPaidAmount) {
                                                userWallet = wallet - totalPaidAmount;
                                                wallet = totalPaidAmount;
                                                totalPaidAmount = 0;
                                        } else {
                                                totalPaidAmount = totalPaidAmount - wallet;
                                        }
                                        let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, {
                                                $set: {
                                                        Charges: Charged, tip: findCart.tip, tipProvided: tipProvided, walletUsed: walletUsed, coupanUsed: findCart.coupanUsed,
                                                        freeServiceUsed: findCart.freeServiceUsed, wallet: wallet, coupan: coupan, freeService: findCart.freeService, totalAmount: findCart.totalAmount, additionalFee: additionalFee,
                                                        paidAmount: paidAmount,
                                                        totalPaidAmount: totalPaidAmount,
                                                        totalItem: findCart.totalItem
                                                }
                                        }, { new: true });
                                        if (update1) {
                                                return res.status(200).json({ status: 200, message: "wallet apply on cart Successfully.", data: update1 })
                                        }
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addFreeServiceToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        const findFreeService = await freeService.findOne({ _id: req.body.freeServiceId, userId: req.user._id })
                                        if (findFreeService) {
                                                let obj = {
                                                        freeServiceId: findFreeService._id
                                                }
                                                let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { freeServiceUsed: true, freeServiceCount: findCart.freeServiceCount + 1 }, $push: { freeService: obj } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "Free service add to cart Successfully.", data: update1 })
                                        } else {
                                                return res.status(404).send({ status: 404, message: "Free service not found" });
                                        }
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addSuggestionToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { suggestion: req.body.suggestion }, }, { new: true });
                                        return res.status(200).json({ status: 200, message: "suggestion add to cart Successfully.", data: update1 })
                                }
                        } else {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addAdressToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id })
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                if (findCart.services.length == 0) {
                                        return res.status(404).json({ status: 404, message: "First add service in your cart.", data: {} });
                                } else {
                                        const data1 = await Address.findById({ _id: req.params.id });
                                        if (data1) {
                                                let update1 = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { houseFlat: data1.houseFlat, appartment: data1.appartment, landMark: data1.landMark, houseType: data1.houseType }, }, { new: true });
                                                return res.status(200).json({ status: 200, message: "suggestion add to cart Successfully.", data: update1 })
                                        } else {
                                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                                        }
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.checkout = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id })
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                console.log(findCart)
                                let orderId = await reffralCode()
                                let obj = {
                                        orderId: orderId,
                                        userId: findCart.userId,
                                        vendorId: findCart.vendorId,
                                        staffId: findCart.staffId,
                                        coupanId: findCart.coupanId,
                                        freeService: findCart.freeService,
                                        Charges: findCart.Charges,
                                        tipProvided: findCart.tipProvided,
                                        tip: findCart.tip,
                                        freeServiceUsed: findCart.freeServiceUsed,
                                        coupanUsed: findCart.coupanUsed,
                                        walletUsed: findCart.walletUsed,
                                        wallet: findCart.wallet,
                                        coupan: findCart.coupan,
                                        freeServiceCount: findCart.freeServiceCount,
                                        suggestion: findCart.suggestion,
                                        houseFlat: findCart.houseFlat,
                                        appartment: findCart.appartment,
                                        landMark: findCart.landMark,
                                        houseType: findCart.houseType,
                                        services: findCart.services,
                                        totalAmount: findCart.totalAmount,
                                        additionalFee: findCart.additionalFee,
                                        paidAmount: findCart.paidAmount,
                                        totalPaidAmount: findCart.totalPaidAmount,
                                        totalItem: findCart.totalItem,
                                        Date: findCart.Date,
                                        fromTime: findCart.fromTime,
                                        toTime: findCart.toTime,
                                }
                                let SaveOrder = await orderModel.create(obj);
                                if (SaveOrder) {
                                        return res.status(200).json({ status: 200, message: "order create successfully.", data: SaveOrder });
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.placeOrder = async (req, res) => {
        try {
                let findUserOrder = await orderModel.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        if (req.body.paymentStatus == "paid") {
                                let update = await orderModel.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", status: "confirmed", paymentStatus: "paid" } }, { new: true });
                                if (update) {
                                        const dateObject = new Date(update.Date);
                                        const dateString = dateObject.toISOString().split('T')[0];
                                        const newTime = "00:00:00.000+00:00";
                                        const replacedDateString = `${dateString}T${newTime}`;
                                        let findSlot = await slot.find({ to: { $lte: update.toTime }, from: { $gte: update.fromTime }, staffId: update.staffId, date: replacedDateString, isBooked: false });
                                        if (findSlot.length > 0) {
                                                const slotIds = findSlot.map(slot => slot._id);
                                                const updateResult = await slot.updateMany({ _id: { $in: slotIds } }, { $set: { isBooked: true } });
                                                console.log(`Slot with ID ${slotIds} is now booked.`);
                                        }
                                }
                                return res.status(200).json({ message: "Payment success.", status: 200, data: update });
                        }
                        if (req.body.paymentStatus == "failed") {
                                return res.status(201).json({ message: "Payment failed.", status: 201, orderId: orderId });
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error)
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.AddFeedback = async (req, res) => {
        try {
                const { type, Feedback, rating } = req.body;
                if (!type && Feedback && rating) {
                        return res.status(201).send({ message: "All filds are required" })
                } else {
                        let obj = {
                                userId: req.user._id,
                                type: type,
                                Feedback: Feedback,
                                rating: rating
                        }
                        const data = await feedback.create(obj);
                        return res.status(200).json({ details: data })
                }
        } catch (err) {
                console.log(err);
                return res.status(400).json({ message: err.message })
        }
}
exports.listOffer = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await offer.find({ $and: [{ $or: [{ userId: vendorData._id }, { type: "other" }] }] });
                        if (findService.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Offer Data found successfully.', service: findService });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getFreeServices = async (req, res) => {
        const findFreeService = await freeService.find({ userId: req.user._id }).populate([{ path: 'userId', select: 'fullName firstName lastName' }, { path: 'serviceId', select: 'name price totalTime timeInMin discountPrice discount discountActive ' }]);
        return res.status(201).json({ message: "Free Service Found", status: 200, data: findFreeService, });
};
exports.createTicket = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let tiketId = await ticketCode();
                        let obj = {
                                userId: data._id,
                                tiketId: tiketId,
                                title: req.body.title,
                                description: req.body.description,
                        }
                        const newUser = await ticket.create(obj);
                        if (newUser) {
                                return res.status(200).json({ status: 200, message: "Ticket create successfully.", data: newUser });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getTicketbyId = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await ticket.findById({ _id: req.params.id });
                        if (data1) {
                                return res.status(200).json({ status: 200, message: "Ticket found successfully.", data: data1 });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.listTicket = async (req, res) => {
        try {
                let findUser = await User.findOne({ _id: req.user._id });
                if (!findUser) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findTicket = await ticket.find({ userId: findUser._id });
                        if (findTicket.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Ticket Data found successfully.', data: findTicket });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.replyOnTicket = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await ticket.findById({ _id: req.params.id });
                        if (data1) {
                                let obj = {
                                        comment: req.body.comment,
                                        byUser: true,
                                        byAdmin: false,
                                        date: Date.now(),
                                }
                                let update = await ticket.findByIdAndUpdate({ _id: data1._id }, { $push: { messageDetails: obj } }, { new: true })
                                return res.status(200).json({ status: 200, message: "Ticket found successfully.", data: update });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addFavouriteBooking = async (req, res) => {
        try {
                const data = await orderModel.findById({ _id: req.params.orderId });
                if (data) {
                        let obj = {
                                userId: req.user._id,
                                services: data.services,
                                totalAmount: data.paidAmount,
                                totalItem: data.totalItem
                        }
                        const newUser = await favouriteBooking.create(obj);
                        if (newUser) {
                                return res.status(200).json({ status: 200, message: "Add to favourite booking.", data: newUser });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.listFavouriteBooking = async (req, res) => {
        try {
                let findUser = await User.findOne({ _id: req.user._id });
                if (!findUser) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findTicket = await favouriteBooking.find({ userId: findUser._id });
                        if (findTicket.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Favourite Booking found successfully.', data: findTicket });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.joinAsPartner = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: "VENDOR" });
                if (!user) {
                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        req.body.accountVerification = false;
                        req.body.userType = "VENDOR";
                        req.body.booking = 3;
                        const userCreate = await User.create(req.body);
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: userCreate, });
                } else {
                        return res.status(409).send({ status: 409, msg: "Already Exit" });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
        }
};
exports.listCity = async (req, res) => {
        try {
                let findCity = await cityModel.find({ status: "ACTIVE" });
                if (findCity.length == 0) {
                        return res.status(404).send({ status: 404, message: "Data not found" });
                } else {
                        res.json({ status: 200, message: 'city Data found successfully.', data: findCity });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listServiceforSearch = async (req, res, next) => {
        try {
                const productsCount = await service.count();
                if (req.query.search != (null || undefined)) {
                        let data1 = [
                                {
                                        $lookup: { from: "users", localField: "vendorId", foreignField: "_id", as: "vendorId" },
                                },
                                { $unwind: "$vendorId" },
                                {
                                        $lookup: { from: "servicecategories", localField: "serviceCategoryId", foreignField: "_id", as: "serviceCategoryId", },
                                },
                                { $unwind: "$serviceCategoryId" },
                                {
                                        $match: {
                                                $or: [
                                                        { "vendorId.fullName": { $regex: req.query.search, $options: "i" }, },
                                                        { "vendorId.firstName": { $regex: req.query.search, $options: "i" }, },
                                                        { "vendorId.lastName": { $regex: req.query.search, $options: "i" }, },
                                                        { "serviceCategoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "name": { $regex: req.query.search, $options: "i" }, },
                                                ]
                                        }
                                },
                        ]
                        let apiFeature = await service.aggregate(data1);
                        await service.populate(apiFeature, [{ path: 'vendorId', select: 'address1 address2 servieImages likeUser Monday Tuesday Wednesday Thursday Friday Saturday Sunday serviceName' }])
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                } else {
                        let apiFeature = await service.aggregate([
                                { $lookup: { from: "users", localField: "vendorId", foreignField: "_id", as: "vendorId" } },
                                { $unwind: "$vendorId" },
                                { $lookup: { from: "servicecategories", localField: "serviceCategoryId", foreignField: "_id", as: "serviceCategoryId", }, },
                                { $unwind: "$serviceCategoryId" },
                        ]);
                        await service.populate(apiFeature, [{ path: 'vendorId', select: 'address1 address2 servieImages likeUser Monday Tuesday Wednesday Thursday Friday Saturday Sunday serviceName' }])
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.addToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        console.log(findCart);
                        if (findCart) {
                                console.log("===============================");
                                if (findCart.services.length == 0) {
                                        let coupan = 0, wallet = 0, tipProvided = 0, services = [], Charged = [], paidAmount = 0, totalAmount = 0, additionalFee = 0;
                                        const findCharge = await Charges.find({});
                                        if (findCharge.length > 0) {
                                                for (let i = 0; i < findCharge.length; i++) {
                                                        let obj1 = {
                                                                chargeId: findCharge[i]._id,
                                                                charge: findCharge[i].charge,
                                                                discountCharge: findCharge[i].discountCharge,
                                                                discount: findCharge[i].discount,
                                                                cancelation: findCharge[i].cancelation,
                                                        }
                                                        if (findCharge[i].cancelation == false) {
                                                                if (findCharge[i].discount == true) {
                                                                        additionalFee = additionalFee + findCharge[i].discountCharge
                                                                } else {
                                                                        additionalFee = additionalFee + findCharge[i].charge
                                                                }
                                                        }
                                                        Charged.push(obj1)
                                                }
                                        }
                                        for (let l = 0; l < req.body.serviceArray.length; l++) {
                                                let findService = await service.findById({ _id: req.body.serviceArray[l] });
                                                if (findService) {
                                                        totalAmount = totalAmount + (findService.price * 1);
                                                        let obj = {
                                                                serviceId: findService._id,
                                                                price: findService.price,
                                                                quantity: 1,
                                                                total: totalAmount,
                                                                totalTime: findService.totalTime,
                                                                totalMin: findService.totalMin,
                                                        }
                                                        services.push(obj)
                                                }
                                        }
                                        paidAmount = totalAmount + additionalFee;
                                        if (findCart.coupanUsed == true) {
                                                let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
                                                coupan = findCoupan.discount;
                                        } else {
                                                coupan = 0
                                        }
                                        if (findCart.walletUsed == true) {
                                                wallet = userData.wallet;
                                        } else {
                                                wallet = 0
                                        }
                                        if (findCart.tip == true) {
                                                tipProvided = findCart.tipProvided
                                        } else {
                                                tipProvided = 0;
                                        }
                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { services: services } }, { new: true });
                                        if (update) {
                                                let totalTime = 0, totalAmount1 = 0;
                                                if (update.fromTime != (null || undefined)) {
                                                        if (update.services.length > 0) {
                                                                for (let i = 0; i < update.services.length; i++) {
                                                                        totalTime = totalTime + update.services[i].totalMin;
                                                                }
                                                        }
                                                        var dateTimeString = update.fromTime;
                                                        var dateTimeObject = new Date(dateTimeString);
                                                        let d = dateTimeObject.toISOString().split('T')[0];
                                                        var hours1 = dateTimeObject.getUTCHours();
                                                        var minutes1 = dateTimeObject.getUTCMinutes();
                                                        const hours = parseInt(hours1);
                                                        const minutes = parseInt(minutes1);
                                                        const providedTimeInMinutes = hours * 60 + minutes + 30;
                                                        let toTimeInMinutes = providedTimeInMinutes + totalTime;
                                                        let toTime = new Date(d);
                                                        toTime.setMinutes(toTimeInMinutes);
                                                        update.toTime = toTime;
                                                        update.save();
                                                }
                                                for (let j = 0; j < update.services.length; j++) {
                                                        totalAmount1 = totalAmount1 + update.services[j].total
                                                }
                                                paidAmount = totalAmount1 + additionalFee + tipProvided - wallet - coupan;
                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { Charges: Charged, totalAmount: totalAmount1, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
                                        }
                                }
                                else {
                                        let Charged = [], services = [], additionalFee = 0, coupan = 0, wallet = 0, tipProvided = 0;
                                        const findCharge = await Charges.find({});
                                        if (findCharge.length > 0) {
                                                for (let i = 0; i < findCharge.length; i++) {
                                                        let obj1 = {
                                                                chargeId: findCharge[i]._id,
                                                                charge: findCharge[i].charge,
                                                                discountCharge: findCharge[i].discountCharge,
                                                                discount: findCharge[i].discount,
                                                                cancelation: findCharge[i].cancelation,
                                                        }
                                                        if (findCharge[i].cancelation == false) {
                                                                if (findCharge[i].discount == true) {
                                                                        additionalFee = additionalFee + findCharge[i].discountCharge
                                                                } else {
                                                                        additionalFee = additionalFee + findCharge[i].charge
                                                                }
                                                        }
                                                        Charged.push(obj1)
                                                }
                                        }
                                        if (findCart.coupanUsed == true) {
                                                let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
                                                coupan = findCoupan.discount;
                                        } else {
                                                coupan = 0
                                        }
                                        if (findCart.walletUsed == true) {
                                                wallet = userData.wallet;
                                        } else {
                                                wallet = 0
                                        }
                                        if (findCart.tip == true) {
                                                tipProvided = findCart.tipProvided
                                        } else {
                                                tipProvided = 0;
                                        }
                                        for (let l = 0; l < req.body.serviceArray.length; l++) {
                                                let findService = await service.findById({ _id: req.body.serviceArray[l] });
                                                if (findService) {
                                                        let totalAmount = 0;
                                                        totalAmount = totalAmount + (findService.price * 1);
                                                        let obj = {
                                                                serviceId: findService._id,
                                                                price: findService.price,
                                                                quantity: 1,
                                                                total: totalAmount,
                                                                totalTime: findService.totalTime,
                                                                totalMin: findService.totalMin,
                                                        }
                                                        services.push(obj)
                                                }
                                        }
                                        if (findCart.coupanUsed == true) {
                                                let findCoupan = await Coupan.findById({ _id: findCart.coupanId });
                                                coupan = findCoupan.discount;
                                        } else {
                                                coupan = 0
                                        }
                                        if (findCart.walletUsed == true) {
                                                wallet = userData.wallet;
                                        } else {
                                                wallet = 0
                                        }
                                        if (findCart.tip == true) {
                                                tipProvided = findCart.tipProvided
                                        } else {
                                                tipProvided = 0;
                                        }
                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { services: services } }, { new: true });
                                        if (update) {
                                                let totalAmount1 = 0, paidAmount = 0, totalTime = 0;
                                                for (let j = 0; j < update.services.length; j++) {
                                                        totalAmount1 = totalAmount1 + update.services[j].total
                                                }
                                                paidAmount = totalAmount1 + additionalFee + tipProvided - coupan;
                                                if (wallet > paidAmount) {
                                                        wallet = paidAmount;
                                                        paidAmount = 0;
                                                } else {
                                                        wallet = 0;
                                                        paidAmount = paidAmount - wallet;
                                                }
                                                if (update.fromTime != (null || undefined)) {
                                                        if (update.services.length > 0) {
                                                                for (let i = 0; i < update.services.length; i++) {
                                                                        totalTime = totalTime + update.services[i].totalMin;
                                                                }
                                                        }
                                                        var dateTimeString = update.fromTime;
                                                        var dateTimeObject = new Date(dateTimeString);
                                                        let d = dateTimeObject.toISOString().split('T')[0];
                                                        var hours1 = dateTimeObject.getUTCHours();
                                                        var minutes1 = dateTimeObject.getUTCMinutes();
                                                        const hours = parseInt(hours1);
                                                        const minutes = parseInt(minutes1);
                                                        const providedTimeInMinutes = hours * 60 + minutes + 30;
                                                        let toTimeInMinutes = providedTimeInMinutes + totalTime;
                                                        let toTime = new Date(d);
                                                        toTime.setMinutes(toTimeInMinutes);
                                                        update.toTime = toTime;
                                                        update.save();
                                                }
                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { wallet: wallet, Charges: Charged, totalAmount: totalAmount1, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
                                        }
                                }
                        } else {
                                console.log("---------------------------------------------------");
                                let services = [], Charged = [], paidAmount = 0, totalAmount = 0, additionalFee = 0, vendorId;
                                const findCharge = await Charges.find({});
                                if (findCharge.length > 0) {
                                        for (let i = 0; i < findCharge.length; i++) {
                                                let obj1 = {
                                                        chargeId: findCharge[i]._id,
                                                        charge: findCharge[i].charge,
                                                        discountCharge: findCharge[i].discountCharge,
                                                        discount: findCharge[i].discount,
                                                        cancelation: findCharge[i].cancelation,
                                                }
                                                if (findCharge[i].cancelation == false) {
                                                        if (findCharge[i].discount == true) {
                                                                additionalFee = additionalFee + findCharge[i].discountCharge
                                                        } else {
                                                                additionalFee = additionalFee + findCharge[i].charge
                                                        }
                                                }
                                                Charged.push(obj1)
                                        }
                                }
                                for (let l = 0; l < req.body.serviceArray.length; l++) {
                                        let findService = await service.findById({ _id: req.body.serviceArray[l] });
                                        if (findService) {
                                                totalAmount = totalAmount + (findService.price * 1);
                                                let obj = {
                                                        serviceId: findService._id,
                                                        price: findService.price,
                                                        quantity: 1,
                                                        total: findService.price * 1,
                                                        totalTime: findService.totalTime,
                                                        totalMin: findService.totalMin,
                                                };
                                                vendorId = findService.vendorId
                                                services.push(obj)
                                        }
                                }
                                paidAmount = totalAmount + additionalFee;
                                let obj1 = {
                                        userId: userData._id,
                                        vendorId: vendorId,
                                        Charges: Charged,
                                        services: services,
                                        totalAmount: totalAmount,
                                        additionalFee: additionalFee,
                                        paidAmount: paidAmount,
                                        totalItem: 1,
                                }
                                const Data = await Cart.create(obj1);
                                return res.status(200).json({ status: 200, message: "Service successfully add to cart. ", data: Data })
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};

// exports.addToCart = async (req, res) => {
//         try {
//                 const userData = await User.findOne({ _id: req.user._id });
//                 if (!userData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 }
//                 let findCart = await Cart.findOne({ userId: userData._id });
//                 let isNewCart = false;
//                 if (!findCart) {
//                         isNewCart = true;
//                         findCart = new Cart({ userId: userData._id });
//                 }
//                 const services = [];
//                 let totalAmount = 0;
//                 const additionalFee = 0; // Assuming additionalFee calculation doesn't depend on data in the document
//                 for (const serviceId of req.body.serviceArray) {
//                         const findService = await service.findById(serviceId);
//                         if (findService) {
//                                 totalAmount += findService.price;
//                                 services.push({
//                                         serviceId: findService._id,
//                                         price: findService.price,
//                                         quantity: 1,
//                                         total: findService.price,
//                                         totalTime: findService.totalTime,
//                                         totalMin: findService.totalMin,
//                                 });
//                         }
//                 }
//                 const coupon = findCart.coupanUsed ? (await Coupon.findById(findCart.coupanId)).discount : 0;
//                 const wallet = findCart.walletUsed ? userData.wallet : 0;
//                 const tipProvided = findCart.tip ? findCart.tipProvided : 0;
//                 findCart.services = isNewCart ? services : [...findCart.services, ...services];
//                 findCart.totalAmount += totalAmount;
//                 findCart.additionalFee += additionalFee;
//                 if (isNewCart) {
//                         findCart.totalItem = services.length;
//                 }
//                 let updatedWallet = wallet;
//                 let updatedPaidAmount = findCart.totalAmount + findCart.additionalFee + tipProvided - updatedWallet - coupon;
//                 if (updatedWallet > updatedPaidAmount) {
//                         updatedWallet -= updatedPaidAmount;
//                         updatedPaidAmount = 0;
//                 } else {
//                         updatedPaidAmount -= updatedWallet;
//                         updatedWallet = 0;
//                 }
//                 findCart.wallet = updatedWallet;
//                 findCart.paidAmount = updatedPaidAmount;
//                 const updatedCart = await findCart.save();
//                 return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: updatedCart });
//         } catch (error) {
//                 console.error(error);
//                 return res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };

//////////////////////////////////////////////////////////
exports.updateQuantity = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                let services = [], Charged = [], additionalFee = 0, coupan = 0;
                                const findCharge = await Charges.find({});
                                if (findCharge.length > 0) {
                                        for (let i = 0; i < findCharge.length; i++) {
                                                let obj1 = { chargeId: findCharge[i]._id, charge: findCharge[i].charge, discountCharge: findCharge[i].discountCharge, discount: findCharge[i].discount, cancelation: findCharge[i].cancelation, }
                                                if (findCharge[i].cancelation == false) { if (findCharge[i].discount == true) { additionalFee = additionalFee + findCharge[i].discountCharge } else { additionalFee = additionalFee + findCharge[i].charge } }
                                                Charged.push(obj1)
                                        }
                                }
                                if (findCart.coupanUsed == true) { let findCoupan = await Coupan.findById({ _id: findCart.coupanId }); coupan = findCoupan.discount; } else { coupan = 0 }
                                if (findCart.walletUsed == true) { wallet = userData.wallet; } else { wallet = 0 }
                                if (findCart.tip == true) { tipProvided = findCart.tipProvided } else { tipProvided = 0; }
                                let on = [], off = [];
                                findCart.services.find((user) => {
                                        if (((user.serviceId).toString() === req.params.id) == true) {
                                                on.push(user)
                                        }
                                        if (((user.serviceId).toString() === req.params.id) == false) {
                                                off.push(user)
                                        }
                                });
                                if (on) {
                                        for (let k = 0; k < on.length; k++) {
                                                let totalAmount = 0;
                                                let findService = await service.findById({ _id: on[k].serviceId });
                                                if (findService) {
                                                        totalAmount = totalAmount + (findService.price * req.body.quantity);
                                                        let obj = {
                                                                serviceId: findService._id,
                                                                price: findService.price,
                                                                quantity: req.body.quantity,
                                                                total: totalAmount,
                                                                totalTime: findService.totalTime,
                                                                totalMin: findService.totalMin,
                                                        }
                                                        services.push(obj)
                                                }
                                        }
                                }
                                if (off) {
                                        for (let k = 0; k < off.length; k++) {
                                                let totalAmount = 0;
                                                let findService = await service.findById({ _id: off[k].serviceId });
                                                if (findService) {
                                                        totalAmount = totalAmount + (findService.price * off[k].quantity);
                                                        let obj = {
                                                                serviceId: findService._id,
                                                                price: findService.price,
                                                                quantity: off[k].quantity,
                                                                total: totalAmount,
                                                                totalTime: findService.totalTime,
                                                                totalMin: findService.totalMin,
                                                        }
                                                        services.push(obj)
                                                }
                                        }
                                }
                                console.log(services);
                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { services: services } }, { new: true });
                                if (update) {
                                        let totalAmount = 0, paidAmount = 0;
                                        for (let j = 0; j < update.services.length; j++) {
                                                totalAmount = totalAmount + update.services[j].total
                                        }
                                        paidAmount = totalAmount + additionalFee + tipProvided - coupan;
                                        if (wallet > paidAmount) {
                                                wallet = paidAmount;
                                                paidAmount = 0;
                                        } else {
                                                wallet = 0;
                                                paidAmount = paidAmount - wallet;
                                        }
                                        let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { wallet: wallet, Charges: Charged, totalAmount: totalAmount, additionalFee: additionalFee, paidAmount: paidAmount, totalItem: update.services.length } }, { new: true });
                                        return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}