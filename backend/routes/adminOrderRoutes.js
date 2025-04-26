const express = require("express");
const { getOrdersWithDetails, getOrderDetails, getCrafters , assignCrafter} = require("../controllers/adminOrderController");

const router = express.Router();

router.get("/orders", getOrdersWithDetails);
router.get("/orders/:orderId", getOrderDetails);
router.get("/crafters", getCrafters); // New route for fetching crafters
router.post("/orders/:orderId/assign-crafter", assignCrafter);
module.exports = router;