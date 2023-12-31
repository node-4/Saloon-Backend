const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name Category Required"],
    },
    status: {
        type: String,
        default: true
    },
});

module.exports = mongoose.model("Category", categorySchema);
