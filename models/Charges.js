const mongoose = require("mongoose");
const schema = mongoose.Schema;
const couponSchema = new mongoose.Schema({
        name: {
                type: String,
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
        status: {
                type: Boolean,
                default: true,
        },
}, { timestamps: true });
module.exports = mongoose.model("Charges", couponSchema);
