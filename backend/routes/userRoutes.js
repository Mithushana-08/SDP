const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define the route for getting users
router.get('/users', userController.getUsers);

// Define the route for adding a new user
router.post('/users', userController.addUser);

// Define the route for updating a user
router.put('/users/:id', userController.updateUser);

// Define the route for deleting a user
router.delete('/users/:id', userController.deleteUser);

module.exports = router;