const express = require('express');
const router = express.Router();
const { getCustomers, saveAddress } = require('../controllers/customercontroller');
const authenticateCustomer = require("../middleware/customerAuthMiddleware");

// Existing route to get customers
router.get('/customers', getCustomers);

// New route to save address with authCustomer middleware
router.post('/save-address', authenticateCustomer, saveAddress);

module.exports = router;