const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    status: {
        type: String,
        enum: ["Active", "Block"],
        default: "Active"
    },
});

module.exports = mongoose.model("staffCategory", categorySchema);
