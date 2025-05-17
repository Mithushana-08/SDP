const express = require('express');
const router = express.Router();
const { getDashboardReport } = require('../controllers/dashboardController');

// Dashboard report endpoint
router.get('/dashboard-report', getDashboardReport);

module.exports = router;