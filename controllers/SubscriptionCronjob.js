const cronJob = require("cron").CronJob;
let user = require("../models/user.model");
new cronJob("0 0 * * *", async function () {
    let findAll = await user.find({ subscriptionStatus: true, userType: "VENDOR" });
    if (findAll.length == 0) {
        for (let i = 0; i < findAll.length; i++) {
            if (findAll[i].subscriptionExpire < Date.now()) {
                let update = await user.findByIdAndUpdate({ _id: findAll[i]._id }, { $set: { subscriptionStatus: false } }, { new: true });
                if (update) {
                    console.log("subcription update");
                }
            }
        }
    } else {
        console.log("subcription not found");
    }
}).start();
// }).stop()
