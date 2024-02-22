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
const service = require('../models/service');
const serviceCategory = require('../models/serviceCategory')
const Coupan = require('../models/Coupan')
const rating = require('../models/ratingModel');
const orderModel = require('../models/orderModel');
const orderRatingModel = require('../models/orderRatingModel');
const moment = require('moment');
const slot = require('../models/slot');
exports.registration = async (req, res) => {
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
                        let obj = {
                                id: userCreate._id,
                                otp: userCreate.otp,
                                phone: userCreate.phone
                        }
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                } else {
                        return res.status(409).send({ status: 409, msg: "Already Exit" });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
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
                return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ error: "internal server error" + err.message });
        }
};
exports.updateProfile = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let id = req.body.categoryId;
                        const category = await Category.findById(id);
                        if (!category) {
                                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
                        }
                        let obj = {
                                categoryId: category._id || user.categoryId,
                                city: req.body.city || user.city,
                                sector: req.body.sector || user.sector,
                                km: req.body.km || user.km
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.updateDocument = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        if (req.files['panCard']) {
                                let barRegist = req.files['panCard'];
                                req.body.panCard = barRegist[0].path;
                        }
                        if (req.files['aadharCard']) {
                                let barCert = req.files['aadharCard'];
                                req.body.aadharCard = barCert[0].path;
                        }
                        if (req.files['otherImage']) {
                                let aad = req.files['otherImage'];
                                req.body.otherImage = aad[0].path;
                        }
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
                                otherDocument: req.body.otherDocument || user.otherDocument,
                                otherImage: req.body.otherImage || user.otherImage
                        }
                        console.log(obj);
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getSubscription = async (req, res) => {
        try {
                const findSubscription = await subscription.find();
                return res.status(200).json({ status: 200, message: "Subscription detail successfully.", data: findSubscription });
        } catch (err) {
                return res.status(500).json({ message: err.message });
        }
};
exports.takeSubscription = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
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
                                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
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
                                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Subscription not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.verifySubscription = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
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
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionId: findTransaction.subscriptionId, subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                        if (findSubscription.name == "Week") {
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionId: findTransaction.subscriptionId, subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                        if (findSubscription.name == "Yearly") {
                                                                let updateUser = await User.findByIdAndUpdate({ _id: user._id }, { $set: { subscriptionId: findTransaction.subscriptionId, subscriptionStatus: true, subscriptionExpire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } }, { new: true })
                                                                res.json({ status: 200, message: 'subscription subscribe successfully.', data: update });
                                                        }
                                                }
                                        }
                                }
                                if (req.body.Status == "failed") {
                                        let update = await transactionModel.findByIdAndUpdate({ _id: findTransaction._id }, { $set: { Status: "failed" } }, { new: true });
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
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error" });
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
                return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.socialLogin = async (req, res) => {
        try {
                const { firstName, lastName, email, phone } = req.body;
                console.log(req.body);
                const user = await User.findOne({ $and: [{ $or: [{ email }, { phone }] }, { userType: "VENDOR" }] });
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
                        const newUser = await User.create({ firstName, lastName, phone, email, refferalCode, userType: "VENDOR" });
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
exports.forgetPassword = async (req, res) => {
        const { email } = req.params;
        try {
                const user = await User.findOne({ email: email, userType: "VENDOR" });
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
exports.resetPassword = async (req, res) => {
        const { email } = req.params;
        try {
                const user = await User.findOne({ email: email });
                if (!user) {
                        return res.status(404).send({ message: "User not found" });
                } else {
                        if (user.otp !== req.body.otp || user.otpExpiration < Date.now()) {
                                return res.status(400).json({ message: "Invalid OTP" });
                        } else {
                                if (req.body.newPassword == req.body.confirmPassword) {
                                        const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: { password: bcrypt.hashSync(req.body.newPassword) } }, { new: true });
                                        return res.status(200).send({ message: "Password update successfully.", data: updated, });
                                } else {
                                        return res.status(501).send({ message: "Password Not matched.", data: {}, });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.signin = async (req, res) => {
        try {
                const { email, password } = req.body;
                const user = await User.findOne({ email: email, userType: "VENDOR" });
                if (!user) {
                        return res.status(404).send({ message: "user not found ! not registered" });
                }
                const isValidPassword = bcrypt.compareSync(password, user.password);
                if (!isValidPassword) {
                        return res.status(401).send({ message: "Wrong password" });
                }
                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                return res.status(201).send({ data: user, accessToken: accessToken });
        } catch (error) {
                console.error(error);
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.updateWorkdetails = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let obj = {
                                workcity: req.body.workcity || user.workcity,
                                mainHub: req.body.mainHub || user.mainHub,
                                secondaryHub: req.body.secondaryHub || user.secondaryHub,
                                averageRating: req.body.averageRating || user.averageRating,
                                serviceCategoryId: req.body.serviceCategoryId || user.serviceCategoryId,
                        }
                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addStaff = async (req, res) => {
        try {
                const data = await User.findOne({ _id: req.user._id, userType: "VENDOR" });
                if (data) {
                        const { phone } = req.body;
                        const user = await User.findOne({ phone: phone, userType: "STAFF" });
                        if (!user) {
                                let serviceCategoryId = []
                                for (let i = 0; i < req.body.service.length; i++) {
                                        const category = await serviceCategory.findById({ _id: req.body.service[i] });
                                        if (!category) {
                                                return res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
                                        }
                                        serviceCategoryId.push(req.body.service[i])
                                }
                                req.body.vendorId = data._id;
                                req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                                req.body.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                                req.body.accountVerification = false;
                                req.body.userType = "STAFF";
                                req.body.serviceCategoryId = serviceCategoryId;
                                const userCreate = await User.create(req.body);
                                return res.status(200).send({ status: 200, message: "Staff add successfully ", data: userCreate, });
                        } else {
                                return res.status(409).send({ status: 409, msg: "Already Exit" });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(500).json({ message: "Server error" });
        }
};
exports.getStaff = async (req, res) => {
        try {
                const staff = await User.find({ vendorId: req.user._id, userType: "STAFF" });
                if (staff.length == 0) {
                        return res.status(404).send({ status: 404, message: "Staff not found" });
                } else {
                        return res.status(200).json({ message: "Staff Found", status: 200, data: staff, });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.removeStaff = async (req, res) => {
        try {
                const { id } = req.params;
                const staff = await User.findOne({ _id: id, vendorId: req.user._id, userType: "STAFF" });
                if (!staff) {
                        return res.status(404).json({ status: 404, message: "Staff Not Found" });
                } else {
                        await User.findByIdAndDelete(staff._id);
                        return res.status(200).json({ status: 200, message: "Staff Deleted Successfully !" });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }

};
exports.updateStaff = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        const staff = await User.findOne({ _id: req.params.id, vendorId: user._id, userType: "STAFF" });
                        if (!staff) {
                                return res.status(404).json({ message: "Staff Not Found", status: 404 });
                        } else {
                                let serviceCategoryId = []
                                for (let i = 0; i < req.body.service.length; i++) {
                                        const category = await serviceCategory.findById({ _id: req.body.service[i] });
                                        if (!category) {
                                                return res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
                                        }
                                        serviceCategoryId.push(req.body.service[i])
                                }
                                let obj = {
                                        fullName: req.body.fullName || staff.fullName,
                                        email: req.body.email || staff.email,
                                        phone: req.body.phone || staff.phone,
                                        gender: req.body.gender || staff.gender,
                                        alternatePhone: req.body.alternatePhone || staff.alternatePhone,
                                        dob: req.body.dob || staff.dob,
                                        address1: req.body.address1 || staff.address1,
                                        address2: req.body.address2 || staff.address2,
                                        serviceCategoryId: serviceCategoryId || staff.serviceCategoryId,
                                        vendorId: staff.vendorId,
                                }
                                let update = await User.findByIdAndUpdate({ _id: staff._id }, { $set: obj }, { new: true });
                                if (update) {
                                        return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await serviceCategory.findOne({ _id: req.body.serviceCategoryId });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                req.body.vendorId = vendorData._id;
                                let saveStore = await service(req.body).save();
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Service add successfully.', data: saveStore });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.editService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await service.findById({ _id: req.params.id })
                        if (findService) {
                                if (req.body.serviceCategoryId != (null || undefined)) {
                                        let findStore = await serviceCategory.findOne({ _id: req.body.serviceCategoryId });
                                        if (!findStore) {
                                                return res.status(404).send({ status: 404, message: "Data not found" });
                                        }
                                }
                                let obj = {
                                        vendorId: vendorData._id || findService.vendorId,
                                        serviceCategoryId: req.body.serviceCategoryId || findService.serviceCategoryId,
                                        name: req.body.name || findService.name,
                                        toHr: req.body.toHr || findService.toHr,
                                        fromHr: req.body.fromHr || findService.fromHr,
                                        price: req.body.price || findService.price,
                                        useBy: req.body.useBy || findService.useBy,
                                }
                                let saveStore = await service.findByIdAndUpdate({ _id: findService._id }, { $set: obj }, { new: true })
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Service update successfully.', data: saveStore });
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await service.findById({ _id: req.params.id })
                        if (findService) {
                                res.json({ status: 200, message: 'Service found successfully.', data: findService });
                        } else {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.deleteService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findService = await service.findById({ _id: req.params.id })
                        if (findService) {
                                let saveStore = await service.findByIdAndDelete({ _id: findService._id })
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Service Delete successfully.', data: {} });
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.listService = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await serviceCategory.findOne({ _id: req.params.serviceCategoryId });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                let findService = await service.find({ serviceCategoryId: findStore._id });
                                if (findService.length == 0) {
                                        return res.status(404).send({ status: 404, message: "Data not found" });
                                } else {
                                        res.json({ status: 200, message: 'Service Data found successfully.', service: findService, serviceCategory: findStore, images: vendorData.servieImages });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.addCoupan = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findStore = await service.findOne({ _id: req.body.serviceId });
                        if (!findStore) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                const d = new Date(req.body.expirationDate);
                                req.body.expirationDate = d.toISOString();
                                const de = new Date(req.body.activationDate);
                                req.body.activationDate = de.toISOString();
                                req.body.vendorId = vendorData._id;
                                req.body.couponCode = await reffralCode();
                                let saveStore = await Coupan(req.body).save();
                                if (saveStore) {
                                        res.json({ status: 200, message: 'Coupan add successfully.', data: saveStore });
                                }
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
                        let findService = await Coupan.find({ vendorId: vendorData._id });
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
exports.listRating = async (req, res) => {
        try {
                console.log(req.user._id);
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let findRating = await rating.find({ userId: vendorData._id }).populate({ path: 'rating.userId' });
                        if (findRating.length == 0) {
                                return res.status(404).send({ status: 404, message: "Data not found" });
                        } else {
                                res.json({ status: 200, message: 'Rating Data found successfully.', service: findRating });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.reportRating = async (req, res) => {
        try {
                let vendorData = await User.findOne({ _id: req.user._id });
                if (!vendorData) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let month = new Date(Date.now()).getMonth() + 1;
                        let date = new Date(Date.now()).getDate();
                        let last50Job, overAllrating = 0, rat = 0, rats = 0, thisMonth = 0, lastsMonth = 0;
                        let year = new Date(Date.now()).getFullYear();
                        const xmas95 = new Date(`${vendorData.createdAt}`);
                        const startMonth = xmas95.getMonth() + 1;
                        const startYear = xmas95.getFullYear();
                        const startDate = xmas95.getDate();
                        let lastMonth = new Date(Date.now()).getMonth();
                        let findRating = await rating.findOne({ userId: vendorData._id, month: month })
                        if (findRating) {
                                thisMonth = findRating.averageRating
                        }
                        let findLastRating = await rating.findOne({ userId: vendorData._id, month: lastMonth })
                        if (findLastRating) {
                                lastsMonth = findLastRating.averageRating
                        }
                        let findLast50JobRating = await orderRatingModel.find({ $or: [{ vendorId: vendorData._id }, { staffId: vendorData._id }] }).sort({ 'createdAt': -1 });
                        if (findLast50JobRating.length > 0) {
                                for (let i = 0; i < 50; i++) {
                                        rat = rat + findLast50JobRating[i].rating
                                }
                        }
                        last50Job = rat / 50;
                        let findoverAllrating = await orderRatingModel.find({ $or: [{ vendorId: vendorData._id }, { staffId: vendorData._id }] }).sort({ 'createdAt': -1 });
                        if (findoverAllrating.length > 0) {
                                for (let i = 0; i < findoverAllrating.length; i++) {
                                        rats = rats + findoverAllrating[i].rating
                                }
                                overAllrating = rats / findoverAllrating.length;
                        }
                        var start = moment(`${startYear}-${startMonth}-${startDate}`);
                        var end = moment(`${year}-${month}-${date}`);
                        let noOfDays = end.diff(start, "days")
                        let obj = {
                                overAllrating: overAllrating,
                                thisMonth: thisMonth,
                                lastMonth: lastsMonth,
                                last50Job: last50Job,
                                jobTillDate: findLast50JobRating.length,
                                noOfDays: noOfDays
                        }
                        res.json({ status: 200, message: 'Data found successfully.', data: obj });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.getOngoingOrders = async (req, res) => {
        try {
                const data = await orderModel.find({ vendorId: req.user._id, serviceStatus: "Pending" });
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
                const data = await orderModel.find({ vendorId: req.user._id, serviceStatus: "Complete" });
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
exports.getOrders = async (req, res) => {
        try {
                let query = { vendorId: req.user._id }
                const { orderId, fromDate, toDate, status } = req.query;
                if (orderId) {
                        query.orderId = orderId;
                }
                if (status) {
                        query.serviceStatus = status;
                }
                if (fromDate && !toDate) {
                        query.createdAt = { $gte: fromDate };
                }
                if (!fromDate && toDate) {
                        query.createdAt = { $lte: toDate };
                }
                if (fromDate && toDate) {
                        query.$and = [
                                { createdAt: { $gte: fromDate } },
                                { createdAt: { $lte: toDate } },
                        ]
                }
                const data = await orderModel.find(query);
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
exports.updateServiceImages = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user._id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        let servieImages = []
                        if (req.files) {
                                for (let i = 0; i < req.files.length; i++) {
                                        servieImages.push(req.files[i].path)
                                }
                        }
                        let obj = {
                                Monday: req.body.Monday || user.Monday,
                                Tuesday: req.body.Tuesday || user.Tuesday,
                                Wednesday: req.body.Wednesday || user.Wednesday,
                                Thursday: req.body.Thursday || user.Thursday,
                                Friday: req.body.Friday || user.Friday,
                                Saturday: req.body.Saturday || user.Saturday,
                                Sunday: req.body.Sunday || user.Sunday,
                                serviceName: req.body.serviceName || user.serviceName,
                                servieImages: servieImages || user.servieImages
                        }

                        let update = await User.findByIdAndUpdate({ _id: user._id }, { $set: obj }, { new: true });
                        if (update) {
                                return res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                return res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let OTP = '';
        for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}










exports.createSlot = async (req, res) => {
        try {
                const staff = await User.findOne({ _id: req.body.staffId, userType: "STAFF" });
                if (!staff) {
                        return res.status(404).json({ message: "Staff Not Found", status: 404 });
                } else {
                        let findSlot = await generateSlots(req.body.startDate, staff._id, staff.vendorId)
                        return res.status(200).json({ message: "Slots added successfully.", status: 200, data: findSlot, });
                }
        } catch (error) {
                return res.status(500).json({ status: 500, message: "Internal server error ", data: error.message, });
        }
};

exports.createSlot1 = async (req, res) => {
        try {
                const fromTime = new Date(req.body.from);
                const toTime = new Date(req.body.to);
                const halfHour = 15 * 60 * 1000;
                while (fromTime.getTime() < toTime.getTime()) {
                        const slotEndTime = new Date(fromTime.getTime() + halfHour);
                        let findSlot = await slot.findOne({ date: req.body.date, from: fromTime.toISOString(), to: slotEndTime.toISOString() });
                        if (!findSlot) {
                                const slot1 = new slot({
                                        date: req.body.date,
                                        from: fromTime.toISOString(),
                                        to: slotEndTime.toISOString(),
                                });
                                await slot1.save();
                                fromTime.setTime(slotEndTime.getTime());
                        }
                }
                return res.status(200).json({ message: "Slots added successfully.", status: 200, data: {}, });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "Internal server error ", data: error.message, });
        }
};
exports.getSlot = async (req, res) => {
        try {
                const findCart = await Cart.findOne({ user: req.user._id });
                if (!findCart) {
                        return res.status(200).json({ success: false, msg: "Cart is empty", cart: {} });
                }
                let currentDate = new Date(req.query.date);
                let totalTime = 0;
                if (findCart.services.length > 0) {
                        for (let i = 0; i < findCart.services.length; i++) {
                                totalTime += findCart.services[i].totalMin;
                        }
                }
                if (findCart.AddOnservicesSchema.length > 0) {
                        for (let i = 0; i < findCart.AddOnservicesSchema.length; i++) {
                                totalTime += findCart.AddOnservicesSchema[i].totalMin;
                        }
                }
                const slots = [];
                const categories = await slot.find({ date: currentDate.toISOString().split('T')[0], isBooked: false, slotBlocked: false });
                if (categories.length > 0) {
                        console.log(categories)
                        for (let i = 0; i < categories.length; i++) {
                                findCart.toTime = categories[i].from;
                                let dateTimeObject = new Date(categories[i].from);
                                let d = dateTimeObject.toISOString().split('T')[0];
                                let hours = dateTimeObject.getUTCHours();
                                let minutes = dateTimeObject.getUTCMinutes();
                                const providedTimeInMinutes = hours * 60 + minutes;
                                let fromTimeInMinutes = providedTimeInMinutes + totalTime;
                                const fromTime = new Date(d);
                                fromTime.setMinutes(fromTimeInMinutes);
                                findCart.fromTime = fromTime;
                                const desiredTime = "17:01:00.000+00:00";
                                const findCartTime = findCart.fromTime.toISOString().split('T')[1];
                                if (findCartTime < desiredTime) {
                                        console.log(findCart.toTime, findCart.fromTime)
                                        let findSlot1 = await slot.find({ to: { $lte: findCart.fromTime }, from: { $gte: findCart.toTime }, date: req.query.date });
                                        if (findSlot1.length > 0) {
                                                let allSlotsAvailable = true;
                                                for (let k = 0; k < findSlot1.length; k++) {
                                                        if (findSlot1[k].isBooked) {
                                                                allSlotsAvailable = false;
                                                                break;
                                                        }
                                                }
                                                if (allSlotsAvailable) {
                                                        const obj = {
                                                                date: req.query.date,
                                                                from: findCart.toTime,
                                                                to: findCart.fromTime,
                                                                isBooked: false,
                                                                slotBlocked: false,
                                                        };
                                                        slots.push(obj);
                                                }
                                        }
                                }
                        }
                }
                if (slots.length > 0) {
                        let x = [];
                        const startingSlots = slots.filter(slot => {
                                const startTime = new Date(slot.from).getUTCHours();
                                return [10, 11, 12, 13, 14, 15, 16, 17].includes(startTime);
                        });
                        const selectedHours = new Set();
                        for (let i = 0; i < startingSlots.length; i++) {
                                const startTime = new Date(startingSlots[i].from).getUTCHours();
                                if ([10, 11, 12, 13, 14, 15, 16, 17].includes(startTime) && !selectedHours.has(startTime)) {
                                        x.push(startingSlots[i]);
                                        selectedHours.add(startTime);
                                }
                        }
                        if (startingSlots.length > 0) {
                                return res.status(200).json({ message: "Starting Slots Found", status: 200, data: x });
                        } else {
                                return res.status(404).json({ message: "Starting Slots not Found", status: 404, data: {} });
                        }
                } else {
                        return res.status(404).json({ message: "Slots not Found", status: 404, data: {} });
                }
        } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal Server Error", status: 500, data: {} });
        }
};
exports.getAvailableSlotOnwhichDate = async (req, res) => {
        try {
                const { year, month } = req.query;
                if ((year == null || year == undefined) && (month == null || month == undefined)) {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth() + 1;
                        const startDate = moment(`${currentYear}-${currentMonth}-01`).startOf('month');
                        const endDate = moment(startDate).endOf('month');
                        const slots = await slot.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });
                        if (slots.length === 0) {
                                return res.json({ allSlot: [] });
                        }
                        let uniqueDates = new Set();
                        let allSlot = [];
                        for (let i = 0; i < slots.length; i++) {
                                if (!uniqueDates.has(slots[i].date.toString())) {
                                        const categories = await slot.find({ date: slots[i].date, slotBlocked: false, isBooked: false }).count();
                                        const allBooked = categories === 0 ? 'yes' : 'no';
                                        let obj = {
                                                date: slots[i].date,
                                                allBooked: allBooked,
                                        };
                                        allSlot.push(obj);
                                        uniqueDates.add(slots[i].date.toString());
                                }
                        }
                        return res.json({ allSlot });
                } else {
                        const startDate = moment(`${year}-${month}-01`).startOf('month');
                        const endDate = moment(startDate).endOf('month');
                        const slots = await slot.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });
                        if (slots.length === 0) {
                                return res.json({ allSlot: [] });
                        }
                        let uniqueDates = new Set();
                        let allSlot = [];
                        for (let i = 0; i < slots.length; i++) {
                                if (!uniqueDates.has(slots[i].date.toString())) {
                                        const categories = await slot.find({ date: slots[i].date, slotBlocked: false, isBooked: false }).count();
                                        const allBooked = categories === 0 ? 'yes' : 'no';
                                        let obj = {
                                                date: slots[i].date,
                                                allBooked: allBooked,
                                        };
                                        allSlot.push(obj);
                                        uniqueDates.add(slots[i].date.toString());
                                }
                        }
                        return res.json({ allSlot });
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
        }
};
exports.getSlotForAdmin = async (req, res) => {
        try {
                const { fromDate, date, toDate, page, limit } = req.query;
                let query = {};
                const categories = await slot.find({});
                if (date) {
                        query.date = date;
                }
                if (fromDate && !toDate) {
                        query.date = { $gte: fromDate };
                }
                if (!fromDate && toDate) {
                        query.date = { $lte: toDate };
                }
                if (fromDate && toDate) {
                        query.$and = [
                                { date: { $gte: fromDate } },
                                { date: { $lte: toDate } },
                        ]
                }
                let options = {
                        page: Number(page) || 1,
                        limit: Number(limit) || categories.length,
                        sort: { from: 1 },
                };
                let data = await slot.paginate(query, options);
                return res.status(200).json({ status: 200, message: "Slot data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.updateSlot = async (req, res) => {
        const { id } = req.params;
        const category = await slot.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Slot Not Found", status: 404, data: {} });
        }
        category.date = req.body.date || category.date;
        category.from = req.body.from || category.from;
        category.to = req.body.to || category.to;
        let update = await category.save();
        return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeSlot = async (req, res) => {
        const { id } = req.params;
        const category = await slot.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Slot Not Found", status: 404, data: {} });
        } else {
                await slot.findByIdAndDelete(category._id);
                return res.status(200).json({ message: "Slot Deleted Successfully !" });
        }
};
async function generateSlots(startDate, staffId, vendorId) {
        try {
                function getAmPm(date) {
                        const hours = date.getUTCHours();
                        return hours >= 12 && hours < 24 ? 'PM' : 'AM';
                }
                const intervalMilliseconds = 24 * 60 * 60 * 1000;
                let currentDate = new Date(startDate);
                currentDate.setUTCHours(10, 0, 0, 0);
                const endDate = new Date(currentDate.getTime() + 1 * intervalMilliseconds);
                const slots = [];
                for (; currentDate.getTime() < endDate.getTime(); currentDate.setDate(currentDate.getDate() + 1)) {
                        const startTime = new Date(currentDate.getTime());
                        const endTime = new Date(currentDate.getTime() + 9 * 60 * 60 * 1000);
                        const halfHour = 15 * 60 * 1000;
                        while (startTime.getTime() < endTime.getTime()) {
                                const slotEndTime = new Date(startTime.getTime() + halfHour);
                                const obj = {
                                        date: currentDate.toISOString().split('T')[0],
                                        from: startTime.toISOString(),
                                        to: slotEndTime.toISOString(),
                                        fromAmPm: getAmPm(startTime),
                                        toAmPm: getAmPm(slotEndTime),
                                        staffId: staffId,
                                        vendorId: vendorId
                                };
                                console.log(obj);
                                const findSlot = await slot.findOne(obj);
                                if (!findSlot) {
                                        const slot1 = new slot(obj);
                                        await slot1.save();
                                        slots.push(obj);
                                }
                                startTime.setTime(slotEndTime.getTime());
                        }
                }
                return slots;
        } catch (error) {
                console.log("Slots error.", error);
        }
}

















// exports.addStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user._id });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ storeName: req.body.storeName, vendorId: vendorData._id });
//                         if (findStore) {
//                                 return res.status(409).send({ status: 409, message: "Already exit." });
//                         } else {
//                                 if (req.file) {
//                                         req.body.storeImage = req.file.filename
//                                 }
//                                 req.body.vendorId = vendorData._id;
//                                 req.body.categoryId = vendorData.categoryId;
//                                 let saveStore = await storeModel(req.body).save();
//                                 if (saveStore) {
//                                         res.json({ status: 200, message: 'Store add successfully.', data: saveStore });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.viewStore = async (req, res) => {
//         try {
//                 let findStore = await storeModel.findOne({ _id: req.params.id }).populate('vendorId');
//                 if (!findStore) {
//                         return res.status(404).send({ status: 404, message: "Data not found" });
//                 } else {
//                         res.json({ status: 200, message: 'Store found successfully.', data: findStore });
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.editStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user._id, userType: "VENDOR" });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ _id: req.body._id, vendorId: vendorData._id });
//                         if (!findStore) {
//                                 return res.status(404).send({ status: 404, message: "Data not found" });
//                         } else {
//                                 if (req.file) {
//                                         req.body.storeImage = req.file.filename
//                                         // req.body.storeImage  = await commonFunction.uploadProfileImage(req.file.path);
//                                 }
//                                 let saveStore = await storeModel.findByIdAndUpdate({ _id: findStore._id }, { $set: req.body }, { new: true })
//                                 if (saveStore) {
//                                         res.json({ status: 200, message: 'Store update successfully.', data: saveStore });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.deleteStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user._id, userType: "VENDOR" });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ _id: req.params.id });
//                         if (!findStore) {
//                                 return res.status(404).send({ status: 404, message: "Data not found" });
//                         } else {
//                                 let update = await storeModel.findByIdAndDelete({ _id: findStore._id });
//                                 if (update) {
//                                         res.json({ status: 200, message: 'Store Delete successfully.', data: findStore });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.listStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user._id, userType: "VENDOR" });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.find({ vendorId: vendorData._id });
//                         if (findStore.length == 0) {
//                                 return res.status(404).send({ status: 404, message: "Data not found" });
//                         } else {
//                                 res.json({ status: 200, message: 'Store Data found successfully.', data: findStore });
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.updateStoreLocation = async (req, res) => {
//         try {
//                 let user = await User.findOne({ _id: req.userId, status: "ACTIVE" });
//                 if (!user) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ _id: req.params.id });
//                         if (!findStore) {
//                                 return res.status(404).send({ status: 404, message: "Data not found" });
//                         } else {
//                                 if (req.body.currentLat || req.body.currentLong) {
//                                         coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)]
//                                         req.body.storeLocation = { type: "Point", coordinates };
//                                 }
//                                 let city, state, city1;
//                                 let smsResult = await commonFunction.findLocation(req.body.currentLat, req.body.currentLong);
//                                 for (let i = 0; i < smsResult.results[0].address_components.length; i++) {
//                                         if (smsResult.results[0].address_components[i].types[0] === 'locality') {
//                                                 city = smsResult.results[0].address_components[i].long_name
//                                                 console.log("===========================>", city);
//                                         }
//                                         if (smsResult.results[0].address_components[i].types[0] === 'administrative_area_level_1') {
//                                                 state = smsResult.results[0].address_components[i].long_name;
//                                                 console.log("===========================>", state);
//                                         }
//                                         if (smsResult.results[0].address_components[i].types[0] === 'administrative_area_level_2') {
//                                                 city1 = smsResult.results[0].address_components[i].long_name;
//                                                 console.log("===========>", city1);
//                                         }
//                                 }
//                                 let update = await storeModel.findByIdAndUpdate({ _id: findStore._id }, { $set: { city: city, subcity: city1, state: state, storeLocation: req.body.storeLocation } }, { new: true });
//                                 if (update) {
//                                         res.json({ status: 200, message: 'Store update successfully.', data: update });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//              return   res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
//