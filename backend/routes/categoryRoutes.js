const express = require('express');
const { getCategories, addCategory, updateCategory, deleteCategory, upload } = require('../controllers/categoryController');

const router = express.Router();

// Routes
router.get('/', getCategories);
router.post('/', upload.single('CategoryImage'), addCategory); // Apply upload middleware for image upload
router.put('/:CategoryID', upload.single('CategoryImage'), updateCategory); // Apply upload middleware for image upload
router.delete('/:CategoryID', deleteCategory);

module.exports = router;