const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    addProduct, 
    deleteProduct, 
    getCategories, 
    upload, 
    getProductsByCategory, 
    getCustomizationDetails 
} = require('../controllers/productmasterController'); // Import all required methods

router.get('/', getProducts); // Route to fetch all products
router.post('/add', upload.single('image'), addProduct); // Route to add a product with image upload
router.delete('/:id', deleteProduct); // Route to delete a product by ID
router.get('/categories', getCategories); // Route to fetch all categories
router.get('/by-category', getProductsByCategory); // Route to fetch products by category
router.get('/customizations/:productId', getCustomizationDetails); // Route to fetch customization details for a product

module.exports = router;