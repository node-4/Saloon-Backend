const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
var newOTP = require("otp-generators");
const User = require("../models/user.model");
const Category = require("../models/CategoryModel");
const ContactDetail = require("../models/ContactDetail");
const subscription = require('../models/subscription');
const transactionModel = require('../models/transactionModel');
const storeModel = require('../models/store');
const service = require('../models/service')
exports.registration = async (req, res) => {
        try {
                const { phone } = req.body;
                const user = await User.findOne({ phone: phone, userType: "VENDOR" });
                if (!user) {
                        req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                        req.body.accountVerification = false;
                        req.body.userType = "VENDOR";
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
                const user = await User.findOne({ phone: phone, userType: "VENDOR" });
                if (!user) {
                        return res.status(400).send({ msg: "not found" });
                }
                const userObj = {};
                userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                userObj.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                userObj.accountVerification = false;
                const updated = await User.findOneAndUpdate({ phone: phone, userType: "VENDOR" }, userObj, { new: true, });
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
                const user = await User.findById({ _id: req.params.id, userType: "VENDOR" });
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
                const user = await User.findOne({ _id: id, userType: "VENDOR" });
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
exports.updateProfile = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let id = req.body.categoryId;
                        const category = await Category.findById(id);
                        if (!category) {
                                res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
                        }
                        let obj = {
                                categoryId: category._id || user.categoryId,
                                city: req.body.city || user.city,
                                sector: req.body.sector || user.sector,
                                km: req.body.km || user.km
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.updateDocument = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let obj = {
                                fullName: req.body.fullName || user.fullName,
                                email: req.body.email || user.email,
                                phone: req.body.phone || user.phone,
                                alternatePhone: req.body.alternatePhone || user.alternatePhone,
                                gender: req.body.gender || user.gender,
                                dob: req.body.dob || user.dob,
                                address1: req.body.address1 || user.address1,
                                address2: req.body.address2 || user.address2,
                                panCard: req.body.panCard || user.panCard,
                                aadharCard: req.body.aadharCard || user.aadharCard,
                                otherDocument: req.body.otherDocument || user.otherDocument
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getSubscription = async (req, res) => {
        try {
                const findSubscription = await subscription.find();
                res.status(200).json({ status: 200, message: "Subscription detail successfully.", data: findSubscription });
        } catch (err) {
                res.status(500).json({ message: err.message });
        }
};
exports.takeSubscription = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let id = req.params.id;
                        const findSubscription = await subscription.findById(id);
                        if (findSubscription) {
                                const findTransaction = await transactionModel.findOne({ user: user._id, type: "Subscription", Status: "pending" });
                                if (findTransaction) {
                                        let deleteData = await transactionModel.findByIdAndDelete({ _id: findTransaction._id })
                                        let obj = {
                                                user: user._id,
                                                subscriptionId: findSubscription._id,
                                                amount: findSubscription.price,
                                                paymentMode: req.body.paymentMode,
                                                type: "Subscription",
                                                Status: "pending",
                                        }
                                        let update = await transactionModel.create(obj);
                                        if (update) {
                                                res.status(200).send({ status: 200, message: "update successfully.", data: update });
                                        }
                                } else {
                                        let obj = {
                                                user: user._id,
                                                subscriptionId: findSubscription._id,
                                                amount: findSubscription.price,
                                                paymentMode: req.body.paymentMode,
                                                type: "Subscription",
                                                Status: "pending",
                                        }
                                        let update = await transactionModel.create(obj);
                                        if (update) {
                                                res.status(200).send({ status: 200, message: "update successfully.", data: update });
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "User not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.verifySubscription = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findTransaction = await transactionModel.findById({ _id: req.params.transactionId, type: "Subscription", Status: "pending", });
                        if (findTransaction) {
                                if (req.body.Status == "Paid") {
                                        let update = await transactionModel.findByIdAndUpdate({ _id: findTransaction._id }, { $set: { Status: "Paid" } }, { new: true });
                                        if (update) {
                                                const findSubscription = await subscription.findById(update.subscriptionId);
                                                if (findSubscription) {
                                                        if (findSubscription.name == "Monthly") {
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                        if (findSubscription.name == "Week") {
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                        if (findSubscription.name == "Yearly") {
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                }
                                        }
                                }
                                if (req.body.Status == "failed") {
                                        let update = await transactionModel.findByIdAndUpdate({ _id: findTransaction._id }, { $Set: { Status: "failed" } }, { new: true });
                                        if (update) {
                                                res.json({ status: 200, message: 'subscription not subscribe successfully.', data: update });
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Transaction not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addStore = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user.id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ storeName: req.body.storeName, vendorId: vendorData._id });
                        if (findStore) {
                                return res.status(409).send({ status: 409, message: "Already exit." });
                        } else {
                                if (req.file) {
                                        req.body.storeImage = req.file.filename
                                }
                                req.body.vendorId = vendorData._id;
                                let saveStore = await storeModel(req.body).save();
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Store add successfully.', data: saveStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.viewStore = async (req, res) => {
        try {
                let findStore = await storeModel.findOne({ _id: req.params.id }).populate('vendorId');
                if (!findStore) {
                        return res.status(404).send({ status: 404, message: "Data not found" });
                } else {
                        res.json({ status: 200, message: 'Store found successfully.', data: findStore });
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.editStore = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ _id: req.body._id, vendorId: vendorData._id });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                if (req.file) {
                                        req.body.storeImage = req.file.filename
                                        // req.body.storeImage  = await commonFunction.uploadProfileImage(req.file.path);
                                }
                                let saveStore = await storeModel.findByIdAndUpdate({ _id: findStore._id }, { $set: req.body }, { new: true })
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Store update successfully.', data: saveStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.deleteStore = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ _id: req.params.id });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                let update = await storeModel.findByIdAndDelete({ _id: findStore._id });
                                if (update) {
                                        res.json({ status: 200, message: 'Store Delete successfully.', data: findStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listStore = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.find({ vendorId: vendorData._id });
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
exports.updateStoreLocation = async (req, res) => {
        try {
                let user = await User.findOne({ _id: req.userId, status: "ACTIVE" });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ _id: req.params.id });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                if (req.body.currentLat || req.body.currentLong) {
                                        coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)]
                                        req.body.storeLocation = { type: "Point", coordinates };
                                }
                                let city, state, city1;
                                let smsResult = await commonFunction.findLocation(req.body.currentLat, req.body.currentLong);
                                for (let i = 0; i < smsResult.results[0].address_components.length; i++) {
                                        if (smsResult.results[0].address_components[i].types[0] === 'locality') {
                                                city = smsResult.results[0].address_components[i].long_name
                                                console.log("===========================>", city);
                                        }
                                        if (smsResult.results[0].address_components[i].types[0] === 'administrative_area_level_1') {
                                                state = smsResult.results[0].address_components[i].long_name;
                                                console.log("===========================>", state);
                                        }
                                        if (smsResult.results[0].address_components[i].types[0] === 'administrative_area_level_2') {
                                                city1 = smsResult.results[0].address_components[i].long_name;
                                                console.log("===========>", city1);
                                        }
                                }
                                let update = await storeModel.findByIdAndUpdate({ _id: findStore._id }, { $set: { city: city, subcity: city1, state: state, storeLocation: req.body.storeLocation } }, { new: true });
                                if (update) {
                                        res.json({ status: 200, message: 'Store update successfully.', data: update });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user.id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await storeModel.findOne({ _id: req.body.storeId, vendorId: vendorData._id });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                let findService = await service.findOne({ name: req.body.name, storeId: findStore._id, vendorId: vendorData._id });
                                if (findService) {
                                        return res.status(409).send({ status: 409, message: "Already exit." });
                                } else {
                                        req.body.vendorId = vendorData._id;
                                        let saveStore = await service(req.body).save();
                                        if (saveStore) {
                                                res.json({ status: 200, message: 'Service add successfully.', data: saveStore });
                                        }
                                }
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