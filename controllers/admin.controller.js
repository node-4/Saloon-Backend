const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
var newOTP = require("otp-generators");
const User = require("../models/user.model");
const Category = require("../models/CategoryModel");
const ContactDetail = require("../models/ContactDetail");
const subscription = require('../models/subscription');
const banner = require('../models/banner')
const serviceCategory = require('../models/serviceCategory')
const Charges = require('../models/Charges');
const freeService = require('../models/freeService');
const Brand = require('../models/brand');
const weCanhelpyou = require('../models/weCanhelpyou');
const e4u = require('../models/e4u')
const feedback = require('../models/feedback');
const ticket = require('../models/ticket');
const state = require('../models/state');
const cityModel = require('../models/city');
const cityArea = require('../models/cityArea');
exports.registration = async (req, res) => {
    const { phone, email } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
        if (!user) {
            req.body.password = bcrypt.hashSync(req.body.password, 8);
            req.body.userType = "ADMIN";
            req.body.accountVerification = true;
            const userCreate = await User.create(req.body);
            return res.status(200).send({ message: "registered successfully ", data: userCreate, });
        } else {
            return res.status(409).send({ message: "Already Exist", data: [] });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email, userType: "ADMIN" });
        if (!user) {
            return res
                .status(404)
                .send({ message: "user not found ! not registered" });
        }
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).send({ message: "Wrong password" });
        }
        const accessToken = jwt.sign({ id: user._id }, authConfig.secret, {
            expiresIn: authConfig.accessTokenTime,
        });
        return res.status(201).send({ data: user, accessToken: accessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" + error.message });
    }
};
exports.update = async (req, res) => {
    try {
        const { fullName, firstName, lastName, email, phone, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: "not found" });
        }
        user.fullName = fullName || user.fullName;
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        if (req.body.password) {
            user.password = bcrypt.hashSync(password, 8) || user.password;
        }
        const updated = await user.save();
        return res.status(200).send({ message: "updated", data: updated });
    } catch (err) {
        console.log(err);
        return res.status(500).send({
            message: "internal server error " + err.message,
        });
    }
};
exports.createCategory = async (req, res) => {
    try {
        let findCategory = await Category.findOne({ name: req.body.name });
        if (findCategory) {
            return res.status(409).json({ message: "category already exit.", status: 404, data: {} });
        } else {
            const data = { name: req.body.name };
            const category = await Category.create(data);
            return res.status(200).json({ message: "category add successfully.", status: 200, data: category });
        }

    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getCategories = async (req, res) => {
    const categories = await Category.find({});
    return res.status(201).json({ success: true, categories, });
};
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
    }
    category.name = req.body.name;
    let update = await category.save();
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeCategory = async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
    } else {
        await Category.findByIdAndDelete(category._id);
        return res.status(200).json({ message: "Category Deleted Successfully !" });
    }
};
exports.createServiceCategory = async (req, res) => {
    try {
        let findCategory = await serviceCategory.findOne({ name: req.body.name });
        if (findCategory) {
            return res.status(409).json({ message: "Service Category already exit.", status: 404, data: {} });
        } else {
            let fileUrl;
            if (req.file) {
                fileUrl = req.file ? req.file.path : "";
            }
            const data = { name: req.body.name, image: fileUrl };
            const category = await serviceCategory.create(data);
            return res.status(200).json({ message: "Service Category add successfully.", status: 200, data: category });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getServiceCategory = async (req, res) => {
    const categories = await serviceCategory.find({});
    return res.status(201).json({ message: "Service Category Found", status: 200, data: categories, });
};
exports.updateServiceCategory = async (req, res) => {
    const { id } = req.params;
    const category = await serviceCategory.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Service Category Not Found", status: 404, data: {} });
    }
    let fileUrl;
    if (req.file) {
        fileUrl = req.file ? req.file.path : "";
    }
    category.image = fileUrl || category.image;
    category.name = req.body.name || category.name;
    let update = await category.save();
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeServiceCategory = async (req, res) => {
    const { id } = req.params;
    const category = await serviceCategory.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Service Category Not Found", status: 404, data: {} });
    } else {
        await serviceCategory.findByIdAndDelete(category._id);
        return res.status(200).json({ message: "Service Category Deleted Successfully !" });
    }
};
exports.createCharge = async (req, res) => {
    try {
        let findCharges = await Charges.findOne({ name: req.body.name });
        if (findCharges) {
            return res.status(409).json({ message: "Charges already exit.", status: 404, data: {} });
        } else {
            const data = {
                name: req.body.name,
                charge: req.body.charge,
                cancelation: req.body.cancelation,
                discountCharge: req.body.discountCharge,
                discount: req.body.discount
            };
            const findCharge = await Charges.create(data);
            return res.status(200).json({ message: "Charges add successfully.", status: 200, data: findCharge });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getCharges = async (req, res) => {
    const findCharge = await Charges.find({});
    return res.status(201).json({ message: "Charges Found", status: 200, data: findCharge, });
};
exports.updateCharge = async (req, res) => {
    const { id } = req.params;
    const findCharge = await Charges.findById(id);
    if (!findCharge) {
        return res.status(404).json({ message: "Charges Not Found", status: 404, data: {} });
    }
    let data = {
        charge: req.body.charge || findCharge.charge,
        name: req.body.name || findCharge.name,
        cancelation: req.body.cancelation || findCharge.cancelation,
        discountCharge: req.body.discountCharge || findCharge.discountCharge,
        discount: req.body.discount || findCharge.discount,
    }
    const update = await Charges.findByIdAndUpdate({ _id: findCharge._id }, { $set: data }, { new: true });
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeCharge = async (req, res) => {
    const { id } = req.params;
    const findCharge = await Charges.findById(id);
    if (!findCharge) {
        return res.status(404).json({ message: "Charges Not Found", status: 404, data: {} });
    } else {
        await Charges.findByIdAndDelete(findCharge._id);
        return res.status(200).json({ message: "Charges Deleted Successfully !" });
    }
};
exports.createFreeService = async (req, res) => {
    try {
        let findUser = await User.findById({ _id: req.body.userId });
        if (!findUser) {
            return res.status(404).json({ message: "user not found.", status: 404, data: {} });
        }
        let findService = await service.findById({ _id: req.body.serviceId });
        if (!findService) {
            return res.status(404).json({ message: "Service not found.", status: 404, data: {} });
        }
        let findFreeService = await freeService.findOne({ userId: req.body.userId, serviceId: findService._id, used: false });
        if (findFreeService) {
            return res.status(409).json({ message: "This free service already exit.", status: 404, data: {} });
        } else {
            const data = {
                userId: req.body.userId,
                serviceId: findService._id,
                used: false
            };
            const findCharge = await freeService.create(data);
            return res.status(200).json({ message: "free service add successfully.", status: 200, data: findCharge });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getFreeServices = async (req, res) => {
    const findFreeService = await freeService.find({}).populate([{ path: 'userId', select: 'fullName firstName lastName' }, { path: 'serviceId', select: 'name price totalTime' }]);
    return res.status(201).json({ message: "Free Service Found", status: 200, data: findFreeService, });
};
exports.updateFreeServices = async (req, res) => {
    const { id } = req.params;
    const findCharge = await freeService.findById(id);
    if (!findCharge) {
        return res.status(404).json({ message: "Free service Not Found", status: 404, data: {} });
    }
    let findUser = await User.findById({ _id: req.body.userId });
    if (!findUser) {
        return res.status(404).json({ message: "user not found.", status: 404, data: {} });
    }
    let findService = await service.findById({ _id: req.body.serviceId });
    if (!findService) {
        return res.status(404).json({ message: "Service not found.", status: 404, data: {} });
    }
    let findFreeService = await freeService.findOne({ _id: { $ne: findCharge._id }, userId: req.body.userId, serviceId: findService._id, used: false });
    if (findFreeService) {
        return res.status(409).json({ message: "This free service already exit.", status: 404, data: {} });
    }
    let data = {
        userId: req.body.userId || findCharge.userId,
        serviceId: req.body.serviceId || findCharge.serviceId,
        used: false || findCharge.used,
    }
    const update = await freeService.findByIdAndUpdate({ _id: findCharge._id }, { $set: data }, { new: true });
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeFreeServices = async (req, res) => {
    const { id } = req.params;
    const findCharge = await freeService.findById(id);
    if (!findCharge) {
        return res.status(404).json({ message: "freeService Not Found", status: 404, data: {} });
    } else {
        await freeService.findByIdAndDelete(findCharge._id);
        return res.status(200).json({ message: "freeService Deleted Successfully !" });
    }
};
exports.addContactDetails = async (req, res) => {
    try {
        let findContact = await ContactDetail.findOne();
        if (findContact) {
            req.body.mobileNumber = req.body.mobileNumber || findContact.mobileNumber;
            req.body.mobileNumberDescription = req.body.mobileNumberDescription || findContact.mobileNumberDescription;
            req.body.email = req.body.email || findContact.email;
            req.body.emailDescription = req.body.emailDescription || findContact.emailDescription;
            req.body.whatAppchat = req.body.whatAppchat || findContact.whatAppchat;
            req.body.whatAppchatDescription = req.body.whatAppchatDescription || findContact.whatAppchatDescription;
            let updateContact = await ContactDetail.findByIdAndUpdate({ _id: findContact._id }, { $set: req.body }, { new: true });
            if (updateContact) {
                return res.status(200).send({ status: 200, message: "Contact Detail update successfully", data: updateContact });
            }
        } else {
            let result2 = await ContactDetail.create(req.body);
            if (result2) {
                return res.status(200).send({ status: 200, message: "Contact Detail update successfully", data: result2 });
            }
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: 500, msg: "internal server error", error: err.message, });
    }
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
exports.createSubscription = async (req, res) => {
    try {
        let findSubscription = await subscription.findOne({ name: req.body.name });
        if (findSubscription) {
            res.json({ status: 409, message: 'subscription already created.', data: {} });
        } else {
            const newsubscription = await subscription.create(req.body);
            res.json({ status: 200, message: 'subscription create successfully', data: newsubscription });
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
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
exports.AddBanner = async (req, res) => {
    try {
        let fileUrl;
        if (req.file) {
            fileUrl = req.file ? req.file.path : "";
        }
        const data = { image: fileUrl, desc: req.body.desc, position: req.body.position }
        const Data = await banner.create(data);
        return res.status(200).json({ status: 200, message: "Banner is Addded ", data: Data })
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.getBanner = async (req, res) => {
    try {
        if (req.params.position == "BOTTOM") {
            const Banner = await banner.findOne({ position: req.params.position });
            if (!Banner) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
            }
            return res.status(200).json({ status: 200, message: "All banner Data found successfully.", data: Banner })
        } else {
            const Banner = await banner.find({});
            if (Banner.length == 0) {
                return res.status(404).json({ status: 404, message: "No data found", data: {} });
            }
            return res.status(200).json({ status: 200, message: "All banner Data found successfully.", data: Banner })
        }
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.getBannerById = async (req, res) => {
    try {
        const Banner = await banner.findById({ _id: req.params.id });
        if (!Banner) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "Data found successfully.", data: Banner })
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.DeleteBanner = async (req, res) => {
    try {
        const Banner = await banner.findById({ _id: req.params.id });
        if (!Banner) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        await banner.findByIdAndDelete({ _id: req.params.id });
        return res.status(200).json({ status: 200, message: "Banner delete successfully.", data: {} })
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.createBrands = async (req, res) => {
    try {
        let findBrand = await Brand.findOne({ name: req.body.name });
        if (findBrand) {
            return res.status(409).json({ message: "Brand already exit.", status: 404, data: {} });
        } else {
            let fileUrl;
            if (req.file) {
                fileUrl = req.file ? req.file.path : "";
            }
            const data = { name: req.body.name, image: fileUrl };
            const category = await Brand.create(data);
            return res.status(200).json({ message: "Brand add successfully.", status: 200, data: category });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getBrands = async (req, res) => {
    const categories = await Brand.find({});
    if (categories.length > 0) {
        return res.status(201).json({ message: "Brand Found", status: 200, data: categories, });
    }
    return res.status(201).json({ message: "Brand not Found", status: 404, data: {}, });

};
exports.updateBrand = async (req, res) => {
    const { id } = req.params;
    const category = await Brand.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Brand Not Found", status: 404, data: {} });
    }
    let fileUrl;
    if (req.file) {
        fileUrl = req.file ? req.file.path : "";
    }
    category.image = fileUrl || category.image;
    category.name = req.body.name || category.name;
    let update = await category.save();
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeBrand = async (req, res) => {
    const { id } = req.params;
    const category = await Brand.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Brand Not Found", status: 404, data: {} });
    } else {
        await Brand.findByIdAndDelete(category._id);
        return res.status(200).json({ message: "Brand Deleted Successfully !" });
    }
};
exports.createweCanhelpyou = async (req, res) => {
    const { question, answer, type } = req.body;
    try {
        if (!question || !answer || !type) {
            return res.status(400).json({ message: "questions, answers and type cannot be blank " });
        }
        const findData = await weCanhelpyou.create(req.body);
        return res.status(200).json({ status: 200, message: "We Can help you Added Successfully ", data: findData });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error ", status: 500, data: err.message });
    }
};
exports.getAllweCanhelpyou = async (req, res) => {
    try {
        const findData = await weCanhelpyou.find({ type: req.params.type }).lean();
        if (findData.length == 0) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "We Can help you retrieved successfully ", data: findData });
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.getweCanhelpyouById = async (req, res) => {
    const { id } = req.params;
    try {
        const findData = await weCanhelpyou.findById(id);
        if (!findData) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(200).json({ status: 200, message: "We Can help you retrieved successfully ", data: findData });
    } catch (err) {
        console.log(err);
        return res.status(501).send({ status: 501, message: "server error.", data: {}, });
    }
};
exports.updateweCanhelpyou = async (req, res) => {
    const { id } = req.params;
    try {
        const { question, answer, type } = req.body;
        const findData = await weCanhelpyou.findById(id);
        if (!findData) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        let obj = {
            question: question || findData.question,
            answer: answer || findData.answer,
            type: type || findData.type,
        }
        const update = await weCanhelpyou.findByIdAndUpdate(id, { $set: obj }, { new: true });
        return res.status(200).json({ status: 200, message: "update successfully.", data: update });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong ", status: 500, data: err.message });
    }
};
exports.deleteweCanhelpyou = async (req, res) => {
    const { id } = req.params;
    try {
        const findData = await weCanhelpyou.findById(id);
        if (!findData) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        const faq = await weCanhelpyou.findByIdAndDelete(findData._id);
        return res.status(200).json({ status: 200, message: "We Can help you Deleted Successfully ", data: faq });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong ", status: 500, data: err.message });
    }
};
exports.createE4u = async (req, res) => {
    try {
        let findE4U = await e4u.findOne({ title: req.body.title, type: req.body.type });
        if (findE4U) {
            return res.status(409).json({ message: "E4u already exit.", status: 404, data: {} });
        } else {
            let fileUrl;
            if (req.file) {
                fileUrl = req.file ? req.file.path : "";
            }
            const data = { title: req.body.title, type: req.body.type, description: req.body.description, image: fileUrl };
            const saved = await e4u.create(data);
            return res.status(200).json({ message: "E4u add successfully.", status: 200, data: saved });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.getE4uByType = async (req, res) => {
    if (req.params.type == "FR") {
        const findE4U = await e4u.findOne({ type: req.params.type });
        if (!findE4U) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(201).json({ message: "E4u Found", status: 200, data: findE4U, });
    } else {
        const findE4U = await e4u.find({ type: req.params.type });
        if (findE4U.length == 0) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(201).json({ message: "E4u Found", status: 200, data: findE4U, });
    }
};
exports.getE4u = async (req, res) => {
    const findE4U = await e4u.find({});
    if (findE4U.length == 0) {
        return res.status(404).json({ status: 404, message: "No data found", data: {} });
    }
    return res.status(201).json({ message: "E4u Found", status: 200, data: findE4U, });
};
exports.updateE4u = async (req, res) => {
    const { id } = req.params;
    const findE4U = await e4u.findById(id);
    if (!findE4U) {
        return res.status(404).json({ message: "E4u Not Found", status: 404, data: {} });
    }
    let fileUrl;
    if (req.file) {
        fileUrl = req.file ? req.file.path : "";
    }
    findE4U.title = req.body.title || findE4U.title;
    findE4U.type = req.body.type || findE4U.type;
    findE4U.description = req.body.description || findE4U.description;
    findE4U.image = fileUrl || findE4U.image;
    let update = await findE4U.save();
    return res.status(200).json({ message: "Updated Successfully", data: update });
};
exports.removeE4u = async (req, res) => {
    const { id } = req.params;
    const category = await e4u.findById(id);
    if (!category) {
        return res.status(404).json({ message: "E4u Not Found", status: 404, data: {} });
    } else {
        await e4u.findByIdAndDelete(category._id);
        return res.status(200).json({ message: "E4u Deleted Successfully !" });
    }
};
exports.getAllfeedback = async (req, res) => {
    try {
        const data = await feedback.find().populate('userId');
        if (data.length == 0) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(201).json({ message: "feedback Found", status: 200, data: data, });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong ", status: 500, data: err.message });
    }
}
exports.getByIdfeedback = async (req, res) => {
    try {
        const data = await feedback.findOne({ _id: req.params.id });
        if (!data) {
            return res.status(404).json({ status: 404, message: "No data found", data: {} });
        }
        return res.status(201).json({ message: "feedback Found", status: 200, data: data, });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message })
    }
}
exports.DeleteFeedback = async (req, res) => {
    try {
        const category = await feedback.findById(id);
        if (!category) {
            return res.status(404).json({ message: "feedback Not Found", status: 404, data: {} });
        } else {
            await feedback.findByIdAndDelete(category._id);
            return res.status(200).json({ message: "feedback Deleted Successfully !" });
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({ message: "Deleted " })
    }
}
exports.listTicket = async (req, res) => {
    try {
        let findUser = await User.findOne({ _id: req.user._id });
        if (!findUser) {
            return res.status(404).send({ status: 404, message: "User not found" });
        } else {
            let findTicket = await ticket.find({});
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
                    byUser: false,
                    byAdmin: true,
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
exports.closeTicket = async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.user._id, });
        if (data) {
            const data1 = await ticket.findById({ _id: req.params.id });
            if (data1) {
                let update = await ticket.findByIdAndUpdate({ _id: data1._id }, { $set: { close: true } }, { new: true })
                return res.status(200).json({ status: 200, message: "Ticket close successfully.", data: update });
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
exports.createState = async (req, res) => {
    try {
        for (let i = 0; i < req.body.state.length; i++) {
            let findState = await state.findOne(req.body.state[i])
            if (!findState) {
                const category = await state.create(req.body.state[i]);
            }
        }
        return res.status(200).json({ message: "state add successfully.", status: 200, data: {} });
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};
exports.listCity = async (req, res) => {
    try {
        let findCity = await cityModel.find({});
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
exports.activeBlockCity = async (req, res) => {
    try {
        let result = await cityModel.findOne({ _id: req.body._id });
        if (!result) {
            response(res, ErrorCode.NOT_FOUND, {}, ErrorMessage.NOT_FOUND);
        }
        else {
            if (result.status == "ACTIVE") {
                let updateResult = await cityModel.findOneAndUpdate({ _id: result._id }, { $set: { status: "BLOCKED" } }, { new: true });
                if (updateResult) {
                    response(res, SuccessCode.SUCCESS, updateResult, SuccessMessage.BLOCK_SUCCESS);
                }
            } else if (result.status == "BLOCKED") {
                let updateResult = await cityModel.findOneAndUpdate({ _id: result._id }, { $set: { status: "ACTIVE" } }, { new: true });
                if (updateResult) {
                    response(res, SuccessCode.SUCCESS, updateResult, SuccessMessage.UNBLOCK_SUCCESS);
                }
            }
        }

    } catch (error) {
        response(res, ErrorCode.WENT_WRONG, {}, ErrorMessage.SOMETHING_WRONG);
    }
};
exports.addcityArea = async (req, res) => {
    try {
        let findCity = await cityModel.findOne({ _id: req.body.city });
        if (!findCity) {
            return res.status(404).send({ status: 404, message: "Data not found" });
        } else {
            let findE4U = await cityArea.findOne({ city: findCity._id, area: req.body.area });
            if (findE4U) {
                return res.status(409).json({ message: "cityArea already exit.", status: 404, data: {} });
            } else {
                let saveStore = await cityArea(req.body).save();
                if (saveStore) {
                    res.json({ status: 200, message: 'cityArea add successfully.', data: saveStore });
                }
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};
exports.listCityArea = async (req, res) => {
    try {
        let findCity = await cityModel.findById({ _id: req.params.city });
        if (findCity.length == 0) {
            return res.status(404).send({ status: 404, message: "Data not found" });
        }
        let findcityArea = await cityArea.find({ city: findCity._id });
        if (findcityArea.length == 0) {
            return res.status(404).send({ status: 404, message: "Data not found" });
        } else {
            res.json({ status: 200, message: 'City Area Data found successfully.', data: { totalSector: findcityArea.length, city: findCity.cityName, area: findcityArea } });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};