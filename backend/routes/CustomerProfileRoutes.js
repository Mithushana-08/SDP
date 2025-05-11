const express = require('express');
const router = express.Router();
const { getCustomerProfile, updateCustomerProfile } = require('../controllers/customerProfileController');
const authenticateCustomer = require('../middleware/customerAuthMiddleware');

// Route to fetch customer profile details
router.get('/profile', authenticateCustomer, getCustomerProfile);

// Route to update customer profile details
router.put('/profile', authenticateCustomer, updateCustomerProfile);

module.exports = router;