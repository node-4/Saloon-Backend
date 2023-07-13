const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "user",
        },
        orderId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "order",
        },
        staffId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "user",
        },
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "user",
        },
        rating: {
            type: Number,
        },
        comment: {
            type: String,
        },
        date: {
            type: Date,
        },
        month: {
            type: String,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("orderRating", schema);