const express = require('express');
const router = express.Router();
const { getCrafterNotifications } = require('../controllers/crafterNotificationController');
const authenticateUser = require('../middleware/authMiddleware');

// GET /api/crafter/notifications
router.get('/notifications', authenticateUser, getCrafterNotifications);

module.exports = router;
