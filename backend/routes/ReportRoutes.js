const express = require('express');
const router = express.Router();
const { getInventoryReport, getOrdersReport } = require('../controllers/ReportController');

// Inventory report endpoint
router.get('/inventory-report', getInventoryReport);

// Orders report endpoint
router.get('/orders-report', getOrdersReport);

module.exports = router;