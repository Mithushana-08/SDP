const express = require('express');
const { getUsers } = require('../controllers/userController');

const router = express.Router();

// Get all users
router.get('/users', getUsers);

module.exports = router;
