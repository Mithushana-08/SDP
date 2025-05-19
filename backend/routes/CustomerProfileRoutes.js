const express = require('express');
const router = express.Router();
const {
    getCustomerProfile,
    updateCustomerProfile,
    getOrdersByCustomer,
    getOrderDetails,
    markOrderAsDelivered
} = require('../controllers/customerProfileController');
const authenticateCustomer = require('../middleware/customerAuthMiddleware');

// Route to fetch customer profile details
router.get('/profile', authenticateCustomer, getCustomerProfile);

// Route to update customer profile details
router.put('/profile', authenticateCustomer, updateCustomerProfile);

// Route to fetch all orders for a customer
router.get('/orders', authenticateCustomer, getOrdersByCustomer);

// Route to fetch details of a specific order
router.get('/orders/:orderId', authenticateCustomer, getOrderDetails);

// Mark order as delivered (customer action)
router.post('/orders/:orderId/mark-delivered', authenticateCustomer, markOrderAsDelivered);

module.exports = router;