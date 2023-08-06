const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
    state: {
        type: String
    },
    isoCode: {
        type: String
    },
    countryCode: {
        type: String
    },
    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCKED", "DELETE"],
        default: "ACTIVE"
    }
}, { timestamps: true })
module.exports = mongoose.model("state", DocumentSchema);

