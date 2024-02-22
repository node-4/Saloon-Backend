const mongoose = require('mongoose');
const schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');
const DocumentSchema = schema({
    city: {
        type: schema.Types.ObjectId,
        ref: "city"
    },
    area: {
        type: String
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCKED"],
        default: "ACTIVE"
    }
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("cityArea", DocumentSchema);