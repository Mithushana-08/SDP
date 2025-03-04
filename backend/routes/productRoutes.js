const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productController');

router.get('/', getProducts);  // Maps to: GET /api/products
module.exports = router;
