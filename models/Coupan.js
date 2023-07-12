const mongoose = require("mongoose");
const schema = mongoose.Schema;
const couponSchema = new mongoose.Schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        serviceId: {
                type: schema.Types.ObjectId,
                ref: "services"
        },
        couponCode: {
                type: String,
        },
        description: {
                type: String,
        },
        discount: {
                type: Number,
        },
        couponType: {
                type: String,
        },
        expirationDate: {
                type: Date,
        },
        activationDate: {
                type: Date,
        },
        status: {
                type: Boolean,
                default: false,
        },
}, { timestamps: true });
module.exports = mongoose.model("coupons", couponSchema);
