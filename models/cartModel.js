const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        staffId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        coupanId: {
                type: schema.Types.ObjectId,
                ref: "coupons"
        },
        freeServiceId: {
                type: schema.Types.ObjectId,
                ref: "freeService"
        },
        Charges: [{
                chargeId: {
                        type: schema.Types.ObjectId,
                        ref: "Charges"
                },
                charge: {
                        type: Number,
                        default: 0
                },
        }],
        tipProvided: {
                type: Number,
                default: 0
        },
        walletUsed: {
                type: Boolean,
                default: false
        },
        wallet: {
                type: Number,
                default: 0
        },
        suggestion: {
                type: String,
        },
        Date: {
                type: Date
        },
        time: {
                type: String
        },
        services: [{
                serviceId: {
                        type: schema.Types.ObjectId,
                        ref: "services"
                },
                price: {
                        type: Number
                },
                quantity: {
                        type: Number,
                        default: 1
                },
                total: {
                        type: Number,
                        default: 0
                },
        }],
        totalAmount: {
                type: Number,
                default: 0
        },
        totalItem: {
                type: Number
        },
}, { timestamps: true })
module.exports = mongoose.model("cart", DocumentSchema);