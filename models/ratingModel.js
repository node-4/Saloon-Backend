const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "user",
        },
        rating: [{
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
        }],
        month: {
            type: String,
        },
        averageRating: {
            type: Number,
            default: 0
        },
        totalRating: {
            type: Number,
            default: 0
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("rating", schema);