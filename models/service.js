const mongoose = require('mongoose');
const schema = mongoose.Schema;
var storeSchema = new schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        serviceCategoryId: {
                type: schema.Types.ObjectId,
                ref: "serviceCategory"
        },
        name: {
                type: String
        },
        toHr: {
                type: String
        },
        fromHr: {
                type: String
        },
        price: {
                type: Number
        },
        useBy: {
                type: String,
                enum: ["Male", "Female","Both"]
        }
}, { timestamps: true });
module.exports = mongoose.model("services", storeSchema);
