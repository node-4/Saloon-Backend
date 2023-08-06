// let Country = require('country-state-city').Country;
// let State = require('country-state-city').State;
// let City = require('country-state-city').City;
// const cronJob = require('cron').CronJob;
// let cityModel = require('../../models/city');
// let stateModel = require('../../models/state');
// const listCityArea = require('../../models/cityArea');
// ////////////////////////////////////////////////////////////////////////////////////////////////////
// new cronJob('*/10 * * * * *', async function () {
//     let findCity = await cityModel.findOne({ _id: "64cf6caa69eec54d5a4df240" });
//     if (findCity) {
//         for (let i = 0; i < 168; i++) {
//             let findE4U = await listCityArea.findOne({ city: findCity._id, area: `Sec ${i + 1}` });
//             if (findE4U) {
//                 console.log(`already Sec ${i + 1}`);
//             } else {
//                 if (((i + 1) == 13)) {
//                     console.log(`Sec ${i + 1}`);
//                 } else if (((i + 1) == 103)) {
//                     console.log(`Sec ${i + 1}`);
//                 } else if (((i + 1) == 109)) {
//                     console.log(`Sec ${i + 1}`);
//                 } else if (((i + 1) == 114)) {
//                     console.log(`Sec ${i + 1}`);
//                 } else if (((i + 1) == 111)) {
//                     console.log(`Sec ${i + 1}`);
//                 } else {
//                     let obj = {
//                         city: findCity._id,
//                         area: `Sec ${i + 1}`,
//                     }
//                     await listCityArea(obj).save();
//                 }
//             }
//         }
//     } else {
//         console.log("dhfsjdgfjk");
//     }
//     // }).start();
// }).stop()
// // Sector 13, Sector 103, Sector 109, Sector 114, and Sector 111 do not exist for noida



// let Country = require('country-state-city').Country;
// let State = require('country-state-city').State;
// let City = require('country-state-city').City;
// const cronJob = require('cron').CronJob;
// let cityModel = require('../../models/city');
// let stateModel = require('../../models/state');
// const listCityArea = require('../../models/cityArea');
// ////////////////////////////////////////////////////////////////////////////////////////////////////
// new cronJob('*/10 * * * * *', async function () {
//     let findCity = await cityModel.findOne({ _id: "64cf6ca069eec54d5a4df075" });
//     if (findCity) {
//         let array = [
//             "Sec 11",
//             "Sec 12",
//             "Sec 14",
//             "Sec 15",
//             "Sec 15a",
//             "Sec 17",
//             "Sec 19",
//             "Sec 20",
//             "Sec 21",
//             "Sec 22",
//             "Sec 23",
//             "Sec 25",
//             "Sec 26",
//             "Sec 27",
//             "Sec 28",
//             "Sec 29",
//             "Sec 30",
//             "Sec 31",
//             "Sec 33",
//             "Sec 34",
//             "Sec 35",
//             "Sec 36",
//             "Sec 37",
//             "Sec 39",
//             "Sec 40",
//             "Sec 41",
//             "Sec 42",
//             "Sec 43",
//             "Sec 44",
//             "Sec 45",
//             "Sec 46",
//             "Sec 47",
//             "Sec 48",
//             "Sec 49",
//             "Sec 50",
//             "Sec 51",
//             "Sec 52",
//             "Sec 53",
//             "Sec 55",
//             "Sec 56",
//             "Sec 61",
//             "Sec 62",
//             "Sec 66",
//             "Sec 70",
//             "Sec 71",
//             "Sec 72",
//             "Sec 73",
//             "Sec 74",
//             "Sec 75",
//             "Sec 76",
//             "Sec 77",
//             "Sec 78",
//             "Sec 79",
//             "Sec 82",
//             "Sec 92",
//             "Sec 93",
//             "Sec 99",
//             "Sec 100",
//             "Sec 104",
//             "Sec 105",
//             "Sec 107",
//             "Sec 108",
//             "Sec 110",
//             "Sec 112",
//             "Sec 113",
//             "Sec 115",
//             "Sec 116",
//             "Sec 117",
//             "Sec 118",
//             "Sec 119",
//             "Sec 120",
//             "Sec 121",
//             "Sec 122",
//             "Sec 128",
//             "Sec 130",
//             "Sec 131",
//             "Sec 133",
//             "Sec 134",
//             "Sec 135",
//             "Sec 137",
//             "Sec 141",
//             "Sec 142",
//             "Sec 143",
//             "Sec 150",
//             "Sec 151",
//             "Sec 158",
//             "Sec 162",
//             "Sec 168"
//         ]
//         for (let i = 0; i < array.length; i++) {
//             let findE4U = await listCityArea.findOne({ city: findCity._id, area: array[i] });
//             if (findE4U) {
//                 console.log(`already Sec ${array[i]}`);
//             } else {
//                 let obj = {
//                     city: findCity._id,
//                     area: array[i],
//                 }
//                 await listCityArea(obj).save();
//             }
//         }
//     } else {
//         console.log("dhfsjdgfjk");
//     }
//     // }).start();
// }).stop()
//  for greata noida



let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;
const cronJob = require('cron').CronJob;
let cityModel = require('../../models/city');
let stateModel = require('../../models/state');
const listCityArea = require('../../models/cityArea');
////////////////////////////////////////////////////////////////////////////////////////////////////
new cronJob('*/10 * * * * *', async function () {
    let findCity = await cityModel.findOne({ _id: "64cf6c1769eec54d5a4dd8cf" });
    if (findCity) {
        let array = [
            "Sabhapur",
            "Adrash Nagar",
            "Alipur",
            "Anandvas Shakurpur",
            "Ashok Vihar",
            "Auchandi",
            "Badli",
            "Bakhtawar Pur",
            "Bakoli",
            "Bankner",
            "Barwala",
            "Bawana",
            "Begumpur",
            "Bhalaswa",
            "Bhorgarh",
            "Budh Vihar",
            "Chand Pur",
            "Daryapur Kalan",
            "Delhi Engg. College",
            "Dr.Mukerjee Nagar",
            "G.T.B.Nagar",
            "Ganeshpura",
            "Gheora",
            "Ghoga",
            "Gujranwala Colony",
            "H.S.Sangh",
            "Haiderpur",
            "Hareveli",
            "Hiranki",
            "Holambi Kalan",
            "Jahangir Puri A Block",
            "Jahangir Puri D Block",
            "Jahangir Puri H Block",
            "Jat Khore",
            "Jaunti",
            "Kadipur",
            "Kanjhawla",
            "Kanya Gurukul",
            "Karala",
            "Katewara",
            "Keshav Puram",
            "Khampur",
            "Khera Kalan",
            "Khera Khurd",
            "Lad Pur",
            "Lampur",
            "Majra Dabas",
            "Mangolpuri A Block",
            "Mangolpuri I Block",
            "Mangolpuri N Block",
            "Mangolpuri S Block ",
            "Maurya Enclave",
            "Model Town II",
            "Model Town III",
            "Mubarak Pur Dabas",
            "Mukhmelpur",
            "Mungeshpur",
            "N.S.Mandi",
            "Naharpur North West",
            "Nangal Poona",
            "Nangal Thakran",
            "Narela",
            "Naya Bans",
            "New Multan Nagar",
            "Nimri",
            "Nirankari Colony",
            "Nizampur",
            "Onkar Nagar",
            "Palla",
            "Pehlad Pur",
            "Pooth Kalan",
            "Pooth Kalan Resettlement",
            "Pooth Khurd",
            "Power House",
            "Prashant Vihar",
            "Prem Nagar",
            "Punjab Khor Delhi",
            "Qutabagarh Delhi",
            "Rampura Delhi",
            "Rani Bagh Delhi",
            "Rani Khera Delhi",
            "Rithala Delhi",
            "Rohini Courts",
            "Rohini sec 11",
            "Rohini Sector 15",
            "Rohini Sector 5",
            "Rohini Sector 7",
            "Samai Pur",
            "Sanoth",
            "Sarai Rohilla",
            "Saraswati Vihar",
            "Satyawati Nagar",
            "Shahbad Daulatpur",
            "Shakur Basti Depot",
            "Shakur Pur I Block",
            "Shakurbasti Rs",
            "Shalamar",
            "Shalimar Bagh",
            "Shastri Nagar",
            "Singhu",
            "Siraspur",
            "Sri Nagar Colony",
            "Sultanpuri B Block",
            "Sultanpuri C Block",
            "Tajpur Kalan",
            "Tikri Khurd",
            "Wazir Pur III"
        ]
        for (let i = 0; i < array.length; i++) {
            let findE4U = await listCityArea.findOne({ city: findCity._id, area: array[i] });
            if (findE4U) {
                console.log(`already Sec ${array[i]}`);
            } else {
                let obj = {
                    city: findCity._id,
                    area: array[i],
                }
                await listCityArea(obj).save();
            }
        }
    } else {
        console.log("dhfsjdgfjk");
    }
    // }).start();
}).stop()