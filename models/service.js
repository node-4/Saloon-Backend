const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
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
                enum: ["Male", "Female", "Both"]
        }
}, { timestamps: true });
storeSchema.plugin(mongoosePaginate);
storeSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("services", storeSchema);
