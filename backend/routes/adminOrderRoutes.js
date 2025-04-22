const express = require("express");
const router = express.Router();
const { getOrdersWithDetails, getOrderDetails } = require("../controllers/adminOrderController");

// Route to fetch all orders with details
router.get("/orders", getOrdersWithDetails);

// Route to fetch details of a specific order
router.get("/orders/:orderId", getOrderDetails);

module.exports = router;