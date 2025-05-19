const express = require('express');
const router = express.Router();
const {
    getOrdersWithDetails,
    getOrderDetails,
    getCrafters,
    assignCrafter,
    updateStatus,
    updateOrderStatus
} = require('../controllers/adminOrderController');

// Get all orders with details
router.get('/orders', getOrdersWithDetails);

// Get details of a specific order
router.get('/orders/:orderId', getOrderDetails);

// Get all crafters
router.get('/crafters', getCrafters);

// Assign a crafter to an order item
router.post('/orders/:orderId/assign-crafter', assignCrafter);

// Update the status of an order item
router.post('/orders/:orderId/update-status', updateStatus);

// Update the status of an order (not item)
router.post('/orders/:orderId/update-order-status', updateOrderStatus);

module.exports = router;