const { validateUser } = require("../middlewares");
const auth = require("../controllers/user.controller");
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
router.put("/updateLocation", [authJwt.verifyToken], auth.updateLocation);
router.get("/Category/allCategory", auth.getCategories);
router.get("/viewContactDetails", auth.viewContactDetails);
router.get("/listStore", [authJwt.verifyToken], auth.listStore);
router.get("/listService/:storeId", [authJwt.verifyToken], auth.listService);
router.get("/getCart", [authJwt.verifyToken], auth.getCart);
router.post("/Cart/addToCart", [authJwt.verifyToken], auth.addToCart);
router.post("/Cart/addStafftoCart", [authJwt.verifyToken], auth.addStafftoCart);
router.post('/wallet/addWallet', [authJwt.verifyToken], auth.addMoney);
router.post('/wallet/removeWallet', [authJwt.verifyToken], auth.removeMoney);
router.get('/wallet/getwallet', [authJwt.verifyToken], auth.getWallet);
router.get("/allTransactionUser", [authJwt.verifyToken], auth.allTransactionUser);
router.get("/allcreditTransactionUser", [authJwt.verifyToken], auth.allcreditTransactionUser);
router.get("/allDebitTransactionUser", [authJwt.verifyToken], auth.allDebitTransactionUser);
router.get("/staff/:vendorId", [authJwt.verifyToken], auth.getStaff);
router.post("/address/new", [authJwt.verifyToken], auth.createAddress);
router.get("/getAddress", [authJwt.verifyToken], auth.getallAddress);
router.put("/address/:id", [authJwt.verifyToken], auth.updateAddress)
router.delete('/address/:id', [authJwt.verifyToken], auth.deleteAddress);
router.get('/address/:id', [authJwt.verifyToken], auth.getAddressbyId);
router.post("/Cart/checkout", [authJwt.verifyToken], auth.checkout);
router.post("/Cart/placeOrder/:orderId", [authJwt.verifyToken], auth.placeOrder);
module.exports = router;