const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
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
module.exports = mongoose.model("favouriteBooking", DocumentSchema);