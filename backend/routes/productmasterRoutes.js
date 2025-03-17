const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productmasterController');

router.get('/', getProducts); // Changed path to '/'

module.exports = router;