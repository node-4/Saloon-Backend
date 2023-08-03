const mongoose = require('mongoose');
const schema = mongoose.Schema;
const FeedbackSchema = new mongoose.Schema({
    userId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    Feedback: {
        type: String
    },
    type: {
        type: String,
        enum: ["ServiceQuality", "Products", "Customer Care", "Hygiene", "Punctual", "Beautician"],
    },
    rating: {
        type: Number,
        max: [5, 'too many arguments']
    },

},
    { timestamps: true });

module.exports = mongoose.model('feedback', FeedbackSchema);