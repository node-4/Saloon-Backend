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

exports.registration = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: "USER" });
                if (!user) {
                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        req.body.accountVerification = false;
                        req.body.userType = "USER";
                        const userCreate = await User.create(req.body);
                        let obj = {
                                id: userCreate._id,
                                otp: userCreate.otp,
                                phone: userCreate.phone
                        }
                        res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                } else {
                        return res.status(409).send({ status: 409, msg: "Already Exit" });
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
        }
};
exports.loginWithPhone = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: "USER" });
                if (!user) {
                        return res.status(400).send({ msg: "not found" });
                }
                const userObj = {};
                userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                userObj.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                userObj.accountVerification = false;
                const updated = await User.findOneAndUpdate({ phone: phone, userType: "USER" }, userObj, { new: true, });
                let obj = { id: updated._id, otp: updated.otp, phone: updated.phone }
                res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
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
                        id: updated._id,
                        otp: updated.otp,
                        phone: updated.phone,
                        accessToken: accessToken
                }
                res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (err) {
                console.log(err.message);
                res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user.id, });
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
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        if (req.body.currentLat || req.body.currentLong) {
                                coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)]
                                req.body.currentLocation = { type: "Point", coordinates };
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: { currentLocation: req.body.currentLocation, city: req.body.city, sector: req.body.sector } }, { new: true });
                        if (update) {
                                res.status(200).send({ status: 200, message: "Location update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        res.status(201).json({ success: true, categories, });
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
                let vendorData = await User.findOne({ _id: req.user.id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.find({});
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
                let vendorData = await User.findOne({ _id: req.user.id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ _id: req.params.storeId });
                        if (findStore) {
                                let findService = await service.find({ storeId: findStore._id });
                                if (findService.length == 0) {
                                        return res.status(404).send({ status: 404, message: "Data not found" });
                                } else {
                                        res.json({ status: 200, message: 'Store Data found successfully.', service: findService, store: findStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addToCart = async (req, res) => {
        try {
                let userData = await User.findOne({ _id: req.user.id });
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
                let userData = await User.findOne({ _id: req.user.id });
                if (!userData) {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                } else {
                        let findCart = await Cart.findOne({ userId: userData._id }).populate("userId")
                                .populate("services.serviceId")
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
exports.addMoney = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user.id, });
                if (data) {
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: wallet + parseInt(req.body.balance) } }, { new: true });
                        if (update) {
                                let obj = {
                                        user: req.user.id,
                                        date: Date.now(),
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
                const data = await User.findOne({ _id: req.user.id, });
                if (data) {
                        let update = await User.findByIdAndUpdate({ _id: data._id }, { $set: { wallet: data.wallet - parseInt(req.body.balance) } }, { new: true });
                        if (update) {
                                let obj = {
                                        user: req.user.id,
                                        date: Date.now(),
                                        amount: req.body.balance,
                                        type: "Debit",
                                };
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
                const data = await User.findOne({ _id: req.user.id, });
                if (data) {
                        return res.status(200).json({ message: "get Profile", data: data.wallet });
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
                const data = await transactionModel.find({ user: req.user._id }).populate("user subscriptionId");
                res.status(200).json({ data: data });
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};
exports.allcreditTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Credit" });
                res.status(200).json({ data: data });
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};
exports.allDebitTransactionUser = async (req, res) => {
        try {
                const data = await transactionModel.find({ user: req.user._id, type: "Debit" });
                res.status(200).json({ data: data });
        } catch (err) {
                res.status(400).json({ message: err.message });
        }
};