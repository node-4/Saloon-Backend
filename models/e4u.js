const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    type: {
        type: String,
        enum: ["STANDARD", "PROMISE", "FR"],
    },
}, { timestamps: true });

const brand = mongoose.model("E4u", brandSchema);

module.exports = brand;