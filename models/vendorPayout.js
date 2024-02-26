const mongoose = require('mongoose');
const schema = mongoose.Schema;
const leaveSchema = new mongoose.Schema({
        vendorId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        startDate: {
                type: Date,
        },
        endDate: {
                type: Date,
        },
        amount: {
                type: Number,
        },
}, { timestamps: true });
module.exports = mongoose.model('vendorPayout', leaveSchema);