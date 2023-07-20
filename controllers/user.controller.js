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
exports.registration = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id });
                if (user) {
                        if (req.body.refferalCode == null || req.body.refferalCode == undefined) {
                                req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                                req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                                req.body.accountVerification = false;
                                req.body.refferalCode = await reffralCode();
                                req.body.completeProfile = true;
                                const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                                let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.phone }
                                res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
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
                                                res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                                        }
                                } else {
                                        res.status(404).send({ status: 404, message: "Invalid refferal code", data: {} });
                                }
                        }
                } else {
                        return res.status(404).send({ status: 404, msg: "Not found" });
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
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
                        res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
                } else {
                        const userObj = {};
                        userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        userObj.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        userObj.accountVerification = false;
                        const updated = await User.findOneAndUpdate({ phone: phone, userType: "USER" }, userObj, { new: true, });
                        let obj = { id: updated._id, otp: updated.otp, phone: updated.phone }
                        res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
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
                res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (err) {
                console.log(err.message);
                res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        return res.status(200).json({ status: 200, message: "get Profile", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.updateProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        let obj = {
                                fullName: req.body.fullName || data.fullName,
                                email: req.body.email || data.email,
                                phone: req.body.phone || data.phone,
                                gender: req.body.gender || data.gender,
                                alternatePhone: req.body.alternatePhone || data.alternatePhone,
                                dob: req.body.dob || data.dob,
                                address1: req.body.address1 || data.address1,
                                address2: req.body.address2 || data.address2,
                        }
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).json({ status: 200, message: "Update profile successfully.", data: update });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                                res.status(200).send({ status: 200, message: "Location update successfully.", data: update.currentLocation });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        res.status(200).json({ status: 200, message: "All category found successfully.", data: categories })
};
exports.getserviceCategory = async (req, res) => {
        const categories = await serviceCategory.find({});
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        res.status(200).json({ status: 200, message: "All Service Category found successfully.", data: categories })
};
exports.getVendorbyserviceCategory = async (req, res) => {
        const categories = await User.find({ serviceCategoryId: { $in: req.params.serviceCategoryId } });
        if (categories.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        res.status(200).json({ status: 200, message: "All vendor found successfully.", data: categories })
};
exports.viewContactDetails = async (req, res) => {
        try {
                let findcontactDetails = await ContactDetail.findOne();
                if (!findcontactDetails) {
                        res.status(404).send({ status: 404, message: "Contact Detail not found.", data: {} });
                } else {
                        res.status(200).send({ status: 200, message: "Contact Detail fetch successfully", data: findcontactDetails });
                }
        } catch (err) {
                console.log(err);
                res.status(500).send({ status: 500, msg: "internal server error", error: err.message, });
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
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.params.vendorId });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                }
                const staff = await User.find({ vendorId: req.params.vendorId, userType: "STAFF" }).select('_id fullName firstName lastName image');

                let findService = await service.find({ serviceCategoryId: req.params.serviceCategoryId, vendorId: vendorData._id })
                if (findService.length == 0) {
                        return res.status(404).send({ status: 404, message: "Data not found" });
                } else {
                        res.json({ status: 200, message: 'Store Data found successfully.', service: findService, vendorId: vendorData, staff: staff });
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id });
                        if (findCart) {
                                if (findCart.services.length == 0) {
                                        let total = findService.price * req.body.quantity;
                                        let obj = {
                                                serviceId: findService._id,
                                                price: findService.price,
                                                quantity: req.body.quantity,
                                                total: total,
                                        }
                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { services: obj }, $set: { totalAmount: findCart.totalAmount + total, totalItem: findCart.totalItem + 1 } }, { new: true });
                                        if (update) {
                                                return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update })
                                        }
                                } else {
                                        for (let i = 0; i < findCart.services.length; i++) {
                                                console.log(findCart.services);
                                                let findService = await service.findById({ _id: req.body._id });
                                                if (findService) {
                                                        if (((findCart.services[i].serviceId).toString() == findService._id) == true) {
                                                                console.log("-----------------------------5555-");
                                                                let obj = {
                                                                        serviceId: findService._id,
                                                                        price: findService.price,
                                                                        quantity: req.body.quantity,
                                                                        total: findService.price * req.body.quantity,
                                                                }
                                                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id, 'services.serviceId': req.body._id }, { $set: { services: obj } }, { new: true });
                                                                if (update) {
                                                                        let totals = 0;
                                                                        for (let j = 0; j < update.services.length; j++) {
                                                                                totals = totals + update.services[j].total
                                                                        }
                                                                        let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { totalAmount: totals, totalItem: update.services.length } }, { new: true });
                                                                        return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update1 })
                                                                }
                                                        } else {
                                                                let total = findService.price * req.body.quantity;
                                                                let obj = {
                                                                        serviceId: findService._id,
                                                                        price: findService.price,
                                                                        quantity: req.body.quantity,
                                                                        total: total,
                                                                }
                                                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { services: obj }, $set: { totalAmount: findCart.totalAmount + total, totalItem: findCart.totalItem + 1 } }, { new: true });
                                                                if (update) {
                                                                        return res.status(200).json({ status: 200, message: "Service add to cart Successfully.", data: update })
                                                                }
                                                        }
                                                } else {
                                                        return res.status(404).send({ status: 404, message: "Service not found" });
                                                }
                                        }
                                }
                        } else {
                                let findService = await service.findById({ _id: req.body._id });
                                if (findService) {
                                        let obj = {
                                                userId: userData._id,
                                                vendorId: findService.vendorId,
                                                services: [{
                                                        serviceId: findService._id,
                                                        price: findService.price,
                                                        quantity: req.body.quantity,
                                                        total: findService.price * req.body.quantity,
                                                }],
                                                totalAmount: findService.price * req.body.quantity,
                                                totalItem: 1,
                                        }
                                        const Data = await Cart.create(obj);
                                        res.status(200).json({ status: 200, message: "Service successfully add to cart. ", data: Data })
                                } else {
                                        return res.status(404).send({ status: 404, message: "Service not found" });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user._id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id }).populate("userId").populate("services.serviceId")
                        if (!findCart) {
                                return res.status(404).json({ status: 404, message: "Cart is empty.", data: {} });
                        } else {
                                res.status(200).json({ message: "cart data found.", status: 200, data: findCart });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { Date: text, time: req.body.time, staffId: staff._id } }, { new: true });
                                                if (update) {
                                                        return res.status(200).send({ status: 200, message: "Cart found successfully.", data: update });
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
                res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                                        res.status(200).json({ status: 200, message: "Money has been added.", data: update, });
                                }

                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                        res.status(200).json({ status: 200, message: "Money has been deducted.", data: update, });
                                }
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.allTransactionUser = async (req, res) => {
        try {
                if (req.query.month != (null || undefined)) {
                        const data = await transactionModel.find({ user: req.user._id, month: req.query.month }).populate("user subscriptionId orderId");
                        if (data.length > 0) {
                                res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                        } else {
                                res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                        }
                } else {
                        const data = await transactionModel.find({ user: req.user._id }).populate("user subscriptionId orderId");
                        if (data.length > 0) {
                                res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                        } else {
                                res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                        }
                }
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};
exports.allcreditTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Credit" });
                if (data.length > 0) {
                        res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                } else {
                        res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                }
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};
exports.allDebitTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Debit" });
                if (data.length > 0) {
                        res.status(200).json({ status: 200, message: "Data found successfully.", data: data });
                } else {
                        res.status(404).json({ status: 404, message: "Data not found.", data: {} });
                }
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};
exports.getStaff = async (req, res) => {
        try {
                const staff = await User.find({ vendorId: req.params.vendorId, userType: "STAFF" }).select('_id fullName firstName lastName');
                if (staff.length == 0) {
                        return res.status(404).send({ status: 404, message: "Staff not found" });
                } else {
                        res.status(200).json({ message: "Staff Category Found", status: 200, data: staff, });
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deleteAddress = async (req, res, next) => {
        try {
                const data = await User.findOne({ _id: req.user._id, });
                if (data) {
                        const data1 = await Address.findById({ _id: req.params.id });
                        if (data1) {
                                let update = await Address.findByIdAndDelete(data1._id);
                                res.status(200).json({ status: 200, message: "Address Deleted Successfully", });
                        } else {
                                return res.status(404).json({ status: 404, message: "No data found", data: {} });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                let orderId = await reffralCode()
                                let obj = {
                                        orderId: orderId,
                                        userId: findCart.userId,
                                        vendorId: findCart.vendorId,
                                        staffId: findCart.staffId,
                                        Date: findCart.Date,
                                        time: findCart.time,
                                        services: findCart.services,
                                        totalAmount: findCart.totalAmount,
                                        totalItem: findCart.totalItem,
                                        address: req.body.address,
                                }
                                let SaveOrder = await orderModel.create(obj);
                                if (SaveOrder) {
                                        return res.status(200).json({ status: 200, message: "order create successfully.", data: SaveOrder });
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.placeOrder = async (req, res) => {
        try {
                let findUserOrder = await orderModel.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        if (req.body.paymentStatus == "paid") {
                                let update = await orderModel.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                res.status(200).json({ message: "Payment success.", status: 200, data: update });
                        }
                        if (req.body.paymentStatus == "failed") {
                                res.status(201).json({ message: "Payment failed.", status: 201, orderId: orderId });
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.cancelOrder = async (req, res) => {
        try {
                let findUserOrder = await orderModel.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let update = await orderModel.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "cancel" } }, { new: true });
                        res.status(200).json({ message: "Payment success.", status: 200, data: update })
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOngoingOrders = async (req, res) => {
        try {
                const data = await orderModel.find({ userId: req.user._id, serviceStatus: "Pending" });
                if (data.length > 0) {
                        return res.status(200).json({ message: "All orders", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getCompleteOrders = async (req, res) => {
        try {
                const data = await orderModel.find({ userId: req.user._id, serviceStatus: "Complete" });
                if (data.length > 0) {
                        return res.status(200).json({ message: "All orders", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrder = async (req, res) => {
        try {
                const data = await orderModel.findById({ _id: req.params.id });
                if (data) {
                        return res.status(200).json({ message: "view order", data: data });
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                        res.status(200).json({ status: 200, message: "Send successfully.", data: Data })
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (err) {
                console.log(err);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                res.status(200).json({ status: 200, message: "Data found successfully.", data: Data })
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (err) {
                console.log(err);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.giveRating = async (req, res) => {
        try {
                console.log(req.user._id);
                let findUser = await User.findOne({ _id: req.user._id });
                if (!findUser) {
                        res.status(404).json({ message: "Token Expired or invalid.", status: 404 });
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
                                res.status(404).json({ message: "User Not found.", status: 404 });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ message: "server error.", data: {}, });
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