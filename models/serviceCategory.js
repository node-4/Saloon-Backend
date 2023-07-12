const mongoose = require("mongoose");

const schema = mongoose.Schema;
const categorySchema = schema({
    name: {
        type: String
    },
    status: {
        type: String,
        enum: ["Active", "Block"],
        default: "Active"
    },
},{ timestamps: true });

module.exports = mongoose.model("serviceCategory", categorySchema);
