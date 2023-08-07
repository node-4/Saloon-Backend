const mongoose = require("mongoose");
const schema = mongoose.Schema;
const bannerSchema = mongoose.Schema({
    categoryId: {
        type: schema.Types.ObjectId,
        ref: "Category"
    },
    image: {
        type: String,
        require: true,
    },
    position: {
        type: String,
        enum: ["TOP", "MID", "BOTTOM", "MB"],
    },
    desc: {
        type: String,
        require: false,
    },
}, { timestamps: true });
const banner = mongoose.model("banner", bannerSchema);
module.exports = banner;
