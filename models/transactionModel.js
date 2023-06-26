const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
    },
    subscriptionId: {
        type: mongoose.Schema.ObjectId,
        ref: "subscription",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
    },
    paymentMode: {
        type: String,
    },
    type:{
        type: String,
    },
    Status: {
        type: String,
    },
});

const transaction = mongoose.model("transaction", transactionSchema);
module.exports = transaction;
