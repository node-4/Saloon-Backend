const mongoose = require("mongoose");
const schema = mongoose.Schema;
var userSchema = new schema(
    {
        staffCategoryId: {
            type: mongoose.Schema.ObjectId,
            ref: 'staffCategory'
        },
        categoryId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Category'
        },
        vendorId: {
            type: schema.Types.ObjectId,
            ref: "user"
        },
        fullName: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        language: {
            type: String,
        },
        image: {
            type: String,
        },
        gender: {
            type: String,
        },
        dob: {
            type: String,
        },
        phone: {
            type: String,
        },
        alternatePhone: {
            type: String,
        },
        email: {
            type: String,
            minLength: 10,
        },
        password: {
            type: String,
        },
        address1: {
            type: String,
        },
        address2: {
            type: String,
        },
        panCard: {
            type: String,
        },
        aadharCard: {
            type: String,
        },
        otherDocument: {
            type: String,
        },
        documentVerification: {
            type: Boolean,
            default: false,
        },
        city: {
            type: String,
        },
        sector: {
            type: String,
        },
        km: {
            type: Number,
            default: 0,
        },
        country: {
            type: String,
        },
        state: {
            type: String,
        },
        district: {
            type: String,
        },
        pincode: {
            type: Number,
        },
        otp: {
            type: String,
        },
        otpExpiration: {
            type: Date,
        },
        accountVerification: {
            type: Boolean,
            default: false,
        },
        userType: {
            type: String,
            enum: ["USER", "VENDOR", "STAFF", "ADMIN"],
        },
        status: {
            type: String,
            enum: ["Approved", "Reject", "Pending"],
        },
        currentLocation: {
            type: {
                type: String,
                default: "Point"
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            },
        },
        subscriptionStatus: {
            type: Boolean,
            default: false,
        },
        subscriptionExpire: {
            type: Date,
        },
        wallet: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("user", userSchema);
