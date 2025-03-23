const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadcontroller");

router.get("/", uploadController.getAllUploads);
router.get("/admin", uploadController.getAllUploadsForAdmin);
router.get("/products", uploadController.getAllProducts);
router.post("/", uploadController.addUpload);
router.put("/:id", uploadController.updateUpload);
router.delete("/:id", uploadController.deleteUpload);

module.exports = router;