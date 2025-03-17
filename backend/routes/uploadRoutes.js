const express = require("express");
const router = express.Router();
const { getAllUploads, getAllUploadsForAdmin, getAllProducts, addUpload } = require("../controllers/uploadcontroller");

router.get("/", getAllUploads);
router.get("/admin", getAllUploadsForAdmin);
router.get("/products", getAllProducts); // Fetch product list for dropdown
router.post("/", addUpload); // Ensure this line is present

module.exports = router;