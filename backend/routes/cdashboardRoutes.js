const express = require('express');
const router = express.Router();
const { getCrafterDashboardReport } = require('../controllers/cdashboardController');
const authenticateUser = require('../middleware/authMiddleware');

// Crafter dashboard report endpoint
router.get('/dashboard-report', authenticateUser, getCrafterDashboardReport);

module.exports = router;