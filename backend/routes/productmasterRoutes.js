const express = require('express');
const router = express.Router();
const { getProducts, addProduct, deleteProduct, getCategories,upload } = require('../controllers/productmasterController');

router.get('/', getProducts);
router.post('/add', upload.single('image'), addProduct);  // Add image upload route
router.delete('/:id', deleteProduct);
router.get('/categories', getCategories); 

module.exports = router;