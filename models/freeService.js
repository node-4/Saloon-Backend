const mongoose = require("mongoose");
const schema = mongoose.Schema;
const couponSchema = new mongoose.Schema({
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        serviceId: {
                type: schema.Types.ObjectId,
                ref: "services"
        },
        used: {
                type: Boolean,
                default: false,
        },
}, { timestamps: true });
module.exports = mongoose.model("freeService", couponSchema);
