const mongoose = require("mongoose");

const schema = mongoose.Schema;
const categorySchema = schema({
    vendorId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
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
