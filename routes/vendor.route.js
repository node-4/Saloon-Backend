const { validateUser } = require("../middlewares");
const auth = require("../controllers/vendorController");
const { authJwt, authorizeRoles } = require("../middlewares");
var multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "uploads"); }, filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); },
});
const upload = multer({ storage: storage });
const express = require("express");
const router = express()
router.post("/registration", auth.registration);
router.post("/loginWithPhone", auth.loginWithPhone);
router.post("/:id", auth.verifyOtp);
router.post("/resendOtp/:id", auth.resendOTP);
router.get("/getProfile", [authJwt.verifyToken], auth.getProfile);
router.put("/updateProfile", [authJwt.verifyToken], auth.updateProfile);
router.put("/updateDocument", [authJwt.verifyToken], auth.updateDocument);
router.get('/getSubscription', auth.getSubscription);
router.post("/takeSubscription/:id", [authJwt.verifyToken], auth.takeSubscription);
router.post("/verifySubscription/:transactionId", [authJwt.verifyToken], auth.verifySubscription);
router.post("/Store/addStore", [authJwt.verifyToken], auth.addStore);
router.get("/listStore", [authJwt.verifyToken], auth.listStore);
router.get("/viewStore/:id", auth.viewStore);
router.put("/Store/editStore", [authJwt.verifyToken], auth.editStore);
router.delete("/deleteStore/:id", [authJwt.verifyToken], auth.deleteStore);
router.put("/updateStoreLocation/:id", [authJwt.verifyToken], auth.updateStoreLocation);
router.post("/Service/addService", [authJwt.verifyToken], auth.addService);
router.get("/listService/:storeId", [authJwt.verifyToken], auth.listService);
module.exports = router;