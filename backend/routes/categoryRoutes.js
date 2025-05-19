const express = require('express');
const { getCategories, addCategory, updateCategory, deleteCategory, reactivateCategory, upload } = require('../controllers/categoryController');

const router = express.Router();

// Routes
router.get('/', getCategories);
router.post('/', upload.single('CategoryImage'), addCategory); // Apply upload middleware for image upload
router.put('/:CategoryID', upload.single('CategoryImage'), updateCategory); // Apply upload middleware for image upload
router.delete('/:CategoryID', deleteCategory);
router.patch('/:CategoryID/reactivate', reactivateCategory);

module.exports = router;