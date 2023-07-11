const auth = require("../controllers/admin.controller");
const { authJwt } = require("../middlewares");
var multer = require("multer");
const path = require("path");
const express = require("express");
const router = express()
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
router.post("/registration", auth.registration);
router.post("/login", auth.signin);
router.put("/update", [authJwt.verifyToken], auth.update);
router.post("/Category/addCategory", [authJwt.verifyToken], auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.post("/service/addCategory", [authJwt.verifyToken], auth.createServiceCategory);
router.get("/service/allCategory", auth.getServiceCategory);
router.put("/service/updateCategory/:id", [authJwt.verifyToken], auth.updateServiceCategory);
router.delete("/service/deleteCategory/:id", [authJwt.verifyToken], auth.removeServiceCategory);
router.post("/addContactDetails", [authJwt.verifyToken], auth.addContactDetails);
router.get("/viewContactDetails", auth.viewContactDetails);
router.post('/createSubscription', auth.createSubscription);
router.get('/getSubscription', auth.getSubscription);
router.post("/Banner/AddBanner", [authJwt.verifyToken], upload.single('image'), auth.AddBanner);
router.get("/Banner/allBanner", auth.getBanner);
router.get("/Banner/getBannerById/:id", auth.getBannerById);
router.delete("/Banner/deleteBanner/:id", [authJwt.verifyToken], auth.DeleteBanner);
module.exports = router;