const express = require('express');
const router = express.Router();
const { getCustomers, saveAddress , updateAddress } = require('../controllers/customercontroller');
const authenticateCustomer = require("../middleware/customerAuthMiddleware");

// Existing route to get customers
router.get('/customers', getCustomers);

// New route to save address with authCustomer middleware
router.post('/save-address', authenticateCustomer, saveAddress);

router.put('/address', authenticateCustomer, updateAddress);

module.exports = router;