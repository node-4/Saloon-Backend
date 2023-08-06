let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;
const cronJob = require('cron').CronJob;
let cityModel = require('../models/city');
let stateModel = require('../models/state');
////////////////////////////////////////////////////////////////////////////////////////////////////
new cronJob('*/10 * * * * *', async function () {
    let findCity = await cityModel.find();
    if (findCity.length == 0) {
        let findState = await stateModel.find();
        for (let j = 0; j < findState.length; j++) {
            let getcity = await City.getCitiesOfState("IN", findState[j].isoCode);
            if (getcity.length == 0) {
                console.log("=================");
            } else {
                for (let i = 0; i < getcity.length; i++) {
                    let obj = {
                        cityName: getcity[i].name,
                        countryCode: getcity[i].countryCode,
                        stateCode: getcity[i].stateCode,
                    }
                    await cityModel(obj).save();
                }
            }
        }

    } else {
        console.log("dhfsjdgfjk");
    }
// }).start();
}).stop()