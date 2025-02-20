// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');  // Ensure this import is correct

// Define the route for getting users
router.get('/users', userController.getUsers);  // Ensure you're using the function here

module.exports = router;
