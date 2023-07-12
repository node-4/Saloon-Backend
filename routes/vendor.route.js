const { validateUser } = require("../middlewares");
const auth = require("../controllers/vendorController");
const user = require("../controllers/user.controller");
const { authJwt, authorizeRoles } = require("../middlewares");
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: "dbrvq9uxa",
    api_key: "567113285751718",
    api_secret: "rjTsz9ksqzlDtsrlOPcTs_-QtW4",
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "images/image",
        allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"],
    },
});
const upload = multer({ storage: storage });
var cpUpload = upload.fields([{ name: 'panCard', maxCount: 1 },{ name: 'aadharCard', maxCount: 1 }, { name: 'otherImage', maxCount: 1 }]);

const express = require("express");
const router = express()
router.post("/registration", auth.registration);
router.post("/:id", auth.verifyOtp);
router.put("/updateProfile", [authJwt.verifyToken], auth.updateProfile);
router.put("/updateDocument", [authJwt.verifyToken],cpUpload, auth.updateDocument);
router.get('/getSubscription', auth.getSubscription);
router.post("/takeSubscription/:id", [authJwt.verifyToken], auth.takeSubscription);
router.post("/verifySubscription/:transactionId", [authJwt.verifyToken], auth.verifySubscription);
router.post("/login/WithPhone", auth.loginWithPhone);
router.post("/resendOtp/:id", auth.resendOTP);
router.get("/getProfile", [authJwt.verifyToken], auth.getProfile);
router.post("/socialLogin", auth.socialLogin);
router.post("/forgetPassword/:email", auth.forgetPassword);
router.post("/resetPassword/:email", auth.resetPassword);
router.post("/login/withPassword", auth.signin);
router.put("/updateWorkdetails", [authJwt.verifyToken], auth.updateWorkdetails);
router.post("/Staff/addStaff", [authJwt.verifyToken], auth.addStaff);
router.get("/Staff/getStaff", [authJwt.verifyToken], auth.getStaff);
router.delete("/Staff/deleteStaff/:id", [authJwt.verifyToken], auth.removeStaff);
router.put("/Staff/updateStaff/:id", [authJwt.verifyToken], auth.updateStaff);
router.post("/Service/addService", [authJwt.verifyToken], auth.addService);
router.get("/listService/:serviceCategoryId", [authJwt.verifyToken], auth.listService);
router.post("/Coupan/addCoupan", [authJwt.verifyToken], auth.addCoupan);
router.get("/Coupan/listCoupan", [authJwt.verifyToken], auth.listCoupan);
router.get("/rating/listRating", [authJwt.verifyToken], auth.listRating);





// router.post("/Store/addStore", [authJwt.verifyToken], auth.addStore);
// router.get("/listStore", [authJwt.verifyToken], auth.listStore);
// router.get("/viewStore/:id", auth.viewStore);
// router.put("/Store/editStore", [authJwt.verifyToken], auth.editStore);
// router.delete("/deleteStore/:id", [authJwt.verifyToken], auth.deleteStore);
// router.put("/updateStoreLocation/:id", [authJwt.verifyToken], auth.updateStoreLocation);
// router.post('/wallet/addWallet', [authJwt.verifyToken], user.addMoney);
// router.post('/wallet/removeWallet', [authJwt.verifyToken], user.removeMoney);
// router.get('/wallet/getwallet', [authJwt.verifyToken], user.getWallet);
// router.get("/allTransactionUser", [authJwt.verifyToken], user.allTransactionUser);
// router.get("/allcreditTransactionUser", [authJwt.verifyToken], user.allcreditTransactionUser);
// router.get("/allDebitTransactionUser", [authJwt.verifyToken], user.allDebitTransactionUser);
module.exports = router;