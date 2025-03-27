const express = require('express');
const router = express.Router();
const { getProducts, deleteProduct } = require('../controllers/productController');

router.get('/', getProducts);  // Maps to: GET /api/products
router.delete('/:productId', deleteProduct);  // Maps to: DELETE /api/products/:productId

module.exports = router;