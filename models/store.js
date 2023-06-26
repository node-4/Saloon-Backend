const mongoose = require('mongoose');
const schema = mongoose.Schema;
var storeSchema = new schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        storeName: {
                type: String
        },
        storeEmail: {
                type: String
        },
        description: {
                type: String
        },
        storeImage: {
                type: String
        },
        country: {
                type: String
        },
        city: {
                type: String
        },
        subcity: {
                type: String
        },
        state: {
                type: String
        },
        address: {
                type: String
        },
        countryCode: {
                type: String,
                default: "+91"
        },
        mobileNumber: {
                type: String
        },
        status: {
                type: String,
                enum: ["Active", "Block"],
                default: "Active"
        },
        openClose: {
                type: String,
                enum: ["OPEN", "Close"],
                default: "OPEN"
        },
        storeLocation: {
                type: {
                        type: String,
                        default: "Point"
                },
                coordinates: {
                        type: [Number],
                        default: [0, 0]
                },
        },
        Monday: {
                type: String
        },
        Tuesday: {
                type: String
        },
        Wednesday: {
                type: String
        },
        Thursday: {
                type: String
        },
        Friday: {
                type: String
        },
        Saturday: {
                type: String
        },
        Sunday: {
                type: String
        },
},
        { timestamps: true });
storeSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("store", storeSchema);
