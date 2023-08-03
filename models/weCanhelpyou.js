const mongoose = require("mongoose");
const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["Account", "E4u", "PaymentE4uCredit", "E4uSafety", "Warrenty", "E4uPlusMemberShip"],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("weCanhelpyou", faqSchema);