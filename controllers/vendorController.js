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
                res.status(200).send({ status: 200, message: "OTP resent", data: obj });
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
exports.resetPassword = async (req, res) => {
        const { email } = req.params;
        try {
                const user = await User.findOne({ email: email });
                if (!user) {
                        return res.status(400).send({ message: "User not found" });
                } else {
                        if (user.otp !== req.body.otp || user.otpExpiration < Date.now()) {
                                return res.status(400).json({ message: "Invalid OTP" });
                        } else {
                                if (req.body.newPassword == req.body.confirmPassword) {
                                        const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: { password: bcrypt.hashSync(req.body.newPassword) } }, { new: true });
                                        res.status(200).send({ message: "Password update successfully.", data: updated, });
                                } else {
                                        res.status(501).send({ message: "Password Not matched.", data: {}, });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" + error.message });
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
                res.status(201).send({ data: user, accessToken: accessToken });
        } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.updateWorkdetails = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
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
                                res.status(200).send({ status: 200, message: "update successfully.", data: update });
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
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
                                                res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
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
                                let obj = { id: userCreate._id, otp: userCreate.otp, phone: userCreate.phone }
                                res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                        } else {
                                return res.status(409).send({ status: 409, msg: "Already Exit" });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(500).json({ message: "Server error" });
        }
};
exports.getStaff = async (req, res) => {
        try {
                const staff = await User.find({ vendorId: req.user.id, userType: "STAFF" });
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
exports.removeStaff = async (req, res) => {
        try {
                const { id } = req.params;
                const staff = await User.findOne({ _id: id, vendorId: req.user.id, userType: "STAFF" });
                if (!staff) {
                        res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
                } else {
                        await User.findByIdAndDelete(staff._id);
                        res.status(200).json({ message: "Staff Category Deleted Successfully !" });
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }

};
exports.updateStaff = async (req, res) => {
        try {
                const user = await User.findOne({ _id: req.user.id, });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found" });
                } else {
                        const staff = await User.findOne({ _id: req.params.id, vendorId: user._id, userType: "STAFF" });
                        if (!staff) {
                                res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
                        } else {
                                let serviceCategoryId = []
                                for (let i = 0; i < req.body.service.length; i++) {
                                        const category = await serviceCategory.findById({ _id: req.body.service[i] });
                                        if (!category) {
                                                res.status(404).json({ message: "Staff Category Not Found", status: 404, data: {} });
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
                                        res.status(200).send({ status: 200, message: "update successfully.", data: update });
                                }
                        }
                }
        } catch (error) {
                console.error(error);
                res.status(500).send({ status: 500, message: "Server error" + error.message });
        }
};
































// exports.addStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.editStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.deleteStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.listStore = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id, userType: "VENDOR" });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
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
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.addService = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ _id: req.body.storeId, vendorId: vendorData._id });
//                         if (!findStore) {
//                                 return res.status(404).send({ status: 404, message: "Data not found" });
//                         } else {
//                                 let findService = await service.findOne({ name: req.body.name, storeId: findStore._id, vendorId: vendorData._id });
//                                 if (findService) {
//                                         return res.status(409).send({ status: 409, message: "Already exit." });
//                                 } else {
//                                         req.body.vendorId = vendorData._id;
//                                         let saveStore = await service(req.body).save();
//                                         if (saveStore) {
//                                                 res.json({ status: 200, message: 'Service add successfully.', data: saveStore });
//                                         }
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
// exports.listService = async (req, res) => {
//         try {
//                 let vendorData = await User.findOne({ _id: req.user.id });
//                 if (!vendorData) {
//                         return res.status(404).send({ status: 404, message: "User not found" });
//                 } else {
//                         let findStore = await storeModel.findOne({ _id: req.params.storeId });
//                         if (findStore) {
//                                 let findService = await service.find({ storeId: findStore._id });
//                                 if (findService.length == 0) {
//                                         return res.status(404).send({ status: 404, message: "Data not found" });
//                                 } else {
//                                         res.json({ status: 200, message: 'Store Data found successfully.', service: findService, store: findStore });
//                                 }
//                         }
//                 }
//         } catch (error) {
//                 console.error(error);
//                 res.status(500).send({ status: 500, message: "Server error" + error.message });
//         }
// };
