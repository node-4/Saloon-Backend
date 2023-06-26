const auth = require("../controllers/admin.controller");
const { authJwt } = require("../middlewares");
var multer = require("multer");
const path = require("path");
const express = require("express");
const router = express()
router.post("/registration", auth.registration);
router.post("/login", auth.signin);
router.put("/update", [authJwt.verifyToken], auth.update);
router.post("/Category/addCategory", [authJwt.verifyToken], auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.post("/addContactDetails", [authJwt.verifyToken], auth.addContactDetails);
router.get("/viewContactDetails", auth.viewContactDetails);
router.post('/createSubscription', auth.createSubscription);
router.get('/getSubscription', auth.getSubscription);
module.exports = router;