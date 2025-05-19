// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getStockNotifications } = require('../controllers/notificationController');
const authenticateUser = require('../middleware/authMiddleware');

// GET /api/notifications/stock
router.get('/stock', authenticateUser, getStockNotifications);

module.exports = router;
