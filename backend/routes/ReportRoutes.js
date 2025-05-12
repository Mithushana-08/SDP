const express = require('express');
const router = express.Router();
const { getInventoryReport } = require('../controllers/ReportController');

// Inventory report endpoint
router.get('/inventory-report', getInventoryReport);

module.exports = router;