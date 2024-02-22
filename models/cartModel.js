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
        offerId: {
                type: schema.Types.ObjectId,
                ref: "offer"
        },
        freeService: [{
                freeServiceId: {
                        type: schema.Types.ObjectId,
                        ref: "freeService"
                }
        }],
        Charges: [{
                chargeId: {
                        type: schema.Types.ObjectId,
                        ref: "Charges"
                },
                charge: {
                        type: Number,
                        default: 0
                },
                discountCharge: {
                        type: Number,
                        default: 0
                },
                discount: {
                        type: Boolean,
                        default: false
                },
                cancelation: {
                        type: Boolean,
                        default: false
                },
        }],
        tipProvided: {
                type: Number,
                default: 0
        },
        tip: {
                type: Boolean,
                default: false
        },
        freeServiceUsed: {
                type: Boolean,
                default: false
        },
        coupanUsed: {
                type: Boolean,
                default: false
        },
        offerUsed: {
                type: Boolean,
                default: false
        },
        walletUsed: {
                type: Boolean,
                default: false
        },
        wallet: {
                type: Number,
                default: 0
        },
        offer: {
                type: Number,
                default: 0
        },
        coupan: {
                type: Number,
                default: 0
        },
        freeServiceCount: {
                type: Number,
                default: 0
        },
        suggestion: {
                type: String,
        },
        houseFlat: {
                type: String,
        },
        appartment: {
                type: String,
        },
        landMark: {
                type: String,
        },
        houseType: {
                type: String,
                enum: ["home", "Other"],
        },
        Date: {
                type: Date,
        },
        fromTime: {
                type: Date,
        },
        toTime: {
                type: Date,
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
        additionalFee: {
                type: Number,
                default: 0
        },
        paidAmount: {
                type: Number,
                default: 0
        },
        totalItem: {
                type: Number
        },
}, { timestamps: true })
module.exports = mongoose.model("cart", DocumentSchema);