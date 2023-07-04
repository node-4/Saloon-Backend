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
        address: {
                street1: {
                        type: String,
                },
                street2: {
                        type: String
                },
                city: {
                        type: String,
                },
                state: {
                        type: String,
                },
                country: {
                        type: String
                }
        },
        orderStatus: {
                type: String,
                enum: ["unconfirmed", "confirmed"],
                default: "unconfirmed",
        },
        paymentStatus: {
                type: String,
                enum: ["pending", "paid", "failed"],
                default: "pending"
        },
}, { timestamps: true })
module.exports = mongoose.model("order", DocumentSchema);