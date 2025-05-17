
const express = require('express');
const router = express.Router();
const { getInventoryReport, getOrdersReport, getCrafters, getCrafterPerformanceReport } = require('../controllers/ReportController');

// Inventory report endpoint
router.get('/inventory-report', getInventoryReport);

// Orders report endpoint
router.get('/orders-report', getOrdersReport);

// Crafters list endpoint
router.get('/crafters', getCrafters);

// Crafter performance report endpoint
router.get('/crafter-performance', getCrafterPerformanceReport);

module.exports = router;
