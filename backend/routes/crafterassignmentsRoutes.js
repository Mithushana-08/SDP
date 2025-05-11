const express = require("express");
const router = express.Router();
const { getAssignedOrders, updateOrderItemStatus } = require("../controllers/crafterassignmentsController");
const authenticateUser = require("../middleware/authMiddleware");

// Route to get assigned order items for the authenticated crafter
router.get("/assigned-orders", authenticateUser, getAssignedOrders);

// Route to update the status of an order item
router.put("/update-status", updateOrderItemStatus);

module.exports = router;