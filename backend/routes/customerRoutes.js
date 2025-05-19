const express = require('express');
const router = express.Router();
const { getCustomers, saveAddress , updateAddress , deleteCustomer } = require('../controllers/customercontroller');
const authenticateCustomer = require("../middleware/customerAuthMiddleware");

// Existing route to get customers
router.get('/customers', getCustomers);

// New route to save address with authCustomer middleware
router.post('/save-address', authenticateCustomer, saveAddress);

router.put('/address', authenticateCustomer, updateAddress);

router.delete('/customer/:customer_id', deleteCustomer);

// Soft delete (deactivate) own account
router.put('/delete-account', authenticateCustomer, (req, res) => {
  // Use authenticated user's customer_id
  req.params.customer_id = req.user.customer_id;
  deleteCustomer(req, res);
});

module.exports = router;