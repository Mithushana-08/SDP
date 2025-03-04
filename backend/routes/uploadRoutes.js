const express = require("express");
const router = express.Router();
const { getAllUploads, getAllUploadsForAdmin, updateUploadStatus, updateUploadPrice } = require("../controllers/uploadcontroller"); // Controller functions

// Define GET /api/upload (this is what your frontend is calling)
router.get("/", getAllUploads);
router.get("/admin", getAllUploadsForAdmin);  // <- For your admin page

module.exports = router;