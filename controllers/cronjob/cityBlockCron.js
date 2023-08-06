let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;
const cronJob = require('cron').CronJob;
let cityModel = require('../../models/city');
let stateModel = require('../../models/state');
////////////////////////////////////////////////////////////////////////////////////////////////////
// new cronJob('*/10 * * * * *', async function () {
//     let findCity = await cityModel.find({ status: "ACTIVE" });
//     if (findCity.length > 0) {
//         for (let j = 0; j < findCity.length; j++) {
//             if ((findCity[j].cityName != "Noida") && (findCity[j].cityName != "Greater Noida")) {
//                 let updateResult = await cityModel.findOneAndUpdate({ _id: findCity[j]._id }, { $set: { status: "BLOCKED" } }, { new: true });
//             }
//             if ((findCity[j].cityName == "Noida") || (findCity[j].cityName == "Greater Noida")) {
//                 let updateResult = await cityModel.findOneAndUpdate({ _id: findCity[j]._id }, { $set: { status: "ACTIVE" } }, { new: true });
//             }
//         }

//     } else {
//         console.log("dhfsjdgfjk");
//     }
// // }).start();
// }).stop()

new cronJob('*/10 * * * * *', async function () {
    let findCity = await cityModel.find({ stateCode: "DL" });
    if (findCity.length > 0) {
        for (let j = 0; j < findCity.length; j++) {
            let updateResult = await cityModel.findOneAndUpdate({ _id: findCity[j]._id }, { $set: { status: "ACTIVE" } }, { new: true });
        }

    } else {
        console.log("dhfsjdgfjk");
    }
// }).start();
}).stop()