const mongoose = require("mongoose");
const subscriptionSchema = mongoose.Schema({
        name: {
                type: String,
                enum: [ "Week","Monthly", "Yearly"]
        },
        price: {
                type: Number
        },
        description: {
                type: String
        },
});
module.exports = mongoose.model("subscription", subscriptionSchema);