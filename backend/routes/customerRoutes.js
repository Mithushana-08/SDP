const express = require('express');
const { getCustomers } = require('../controllers/customercontroller');

const router = express.Router();

router.get('/customers', getCustomers);

module.exports = router;