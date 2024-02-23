const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        orderId: {
                type: String
        },
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
                totalTime: {
                        type: String
                },
                totalMin: {
                        type: Number
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
        orderStatus: {
                type: String,
                enum: ["unconfirmed", "confirmed", "cancel"],
                default: "unconfirmed",
        },
        serviceStatus: {
                type: String,
                enum: ["Pending", "Complete"],
                default: "Pending",
        },
        status: {
                type: String,
                enum: ["Pending", "confirmed", "OnTheWay", "Arrived", "Complete", "Review"],
                default: "Pending",
        },
        paymentStatus: {
                type: String,
                enum: ["Pending", "Paid", "Failed"],
                default: "Pending"
        },
}, { timestamps: true })
module.exports = mongoose.model("order", DocumentSchema);