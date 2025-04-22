const express = require("express");
const { proceedToCheckout } = require("../controllers/orderController");
const router = express.Router();
const authenticateCustomer = require("../middleware/customerAuthMiddleware");

// Proceed to checkout route
router.post("/checkout", authenticateCustomer, proceedToCheckout);

module.exports = router;