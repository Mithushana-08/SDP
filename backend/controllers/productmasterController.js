const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',  // Store images in an "uploads" folder
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const getProducts = (req, res) => {
    // If ?all=true is passed, show all products, else only active
    const showAll = req.query.all === 'true';
    const whereClause = showAll ? '' : "WHERE pm.product_status = 'active'";
    const query = `
        SELECT 
            pm.product_id,
            pm.product_name,
            c.CategoryName AS category_name,
            c.CategoryID AS category_id,
            pm.base_price,
            pm.customizable,
            pm.description,
            pm.image,
            pm.product_status,
            CASE
                WHEN SUM(COALESCE(i.stock_qty, 0)) > 10 THEN 'In Stock'
                WHEN SUM(COALESCE(i.stock_qty, 0)) > 0 THEN 'Low Stock'
                ELSE 'Out of Stock'
            END AS status,
            SUM(COALESCE(i.stock_qty, 0)) AS stock_qty
        FROM 
            product_master pm
        JOIN 
            Categories c ON pm.category_id = c.CategoryID
        LEFT JOIN 
            inventory i ON pm.product_id = i.product_id
        ${whereClause}
        GROUP BY 
            pm.product_id, pm.product_name, c.CategoryName, c.CategoryID, 
            pm.base_price, pm.customizable, pm.description, pm.image, pm.product_status
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching product data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

const addProduct = async (req, res) => {
    try {
        const { product_name, category_id, base_price, customizable, description, status, customizations } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const isCustomizable = customizable === 'true' || customizable === true || customizable === '1' || customizable === 1 || customizable === 'yes' ? 'yes' : 'no';
        const productStatus = status || 'out of stock';

        // Start a transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => {
                if (err) reject(err);
                resolve();
            });
        });

        // Get the next product ID
        const getNextProductIdQuery = `
            SELECT COALESCE(MAX(CAST(SUBSTRING(product_id, 3) AS UNSIGNED)), 0) + 1 as next_id 
            FROM product_master
        `;

        const nextIdResult = await new Promise((resolve, reject) => {
            db.query(getNextProductIdQuery, [], (error, results) => {
                if (error) reject(error);
                resolve(results[0].next_id);
            });
        });

        const productId = `P_${String(nextIdResult).padStart(2, '0')}`;

        // Insert into product_master
        const productQuery = `
            INSERT INTO product_master (product_id, product_name, category_id, base_price, customizable, description, image, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
            db.query(productQuery, [
                productId,
                product_name, 
                category_id, 
                base_price, 
                isCustomizable, 
                description, 
                imagePath, 
                productStatus
            ], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        // Handle customizations if product is customizable
        if (isCustomizable === 'yes' && customizations) {
            const customizationsArray = JSON.parse(customizations);

            for (const customization of customizationsArray) {
                // Insert into product_customizations
                const customizationQuery = `
                    INSERT INTO product_customizations (product_id, customization_type, description)
                    VALUES (?, ?, ?)
                `;

                await new Promise((resolve, reject) => {
                    db.query(customizationQuery, [productId, customization.type, ''], (error, results) => {
                        if (error) reject(error);
                        resolve(results);
                    });
                });

                // If customization type is 'size', handle size customizations
                if (customization.type === 'size' && customization.sizes) {
                    for (const size of customization.sizes) {
                        const sizeQuery = `
                            INSERT INTO size_customizations (product_id, size_type, height, width, depth)
                            VALUES (?, ?, ?, ?, ?)
                        `;

                        await new Promise((resolve, reject) => {
                            db.query(sizeQuery, [
                                productId,
                                size.size_type,
                                size.height,
                                size.width,
                                size.depth
                            ], (error, results) => {
                                if (error) reject(error);
                                resolve(results);
                            });
                        });
                    }
                }
            }
        }

        // Commit the transaction
        await new Promise((resolve, reject) => {
            db.commit(err => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({
            message: 'Product added successfully',
            productId: productId
        });

    } catch (error) {
        // Rollback in case of error
        await new Promise((resolve) => {
            db.rollback(() => resolve());
        });

        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { product_name, category_id, base_price, customizable, description, status, customizations } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Start a transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => {
                if (err) reject(err);
                resolve();
            });
        });

        // Update product_master table
        const updateProductQuery = `
            UPDATE product_master 
            SET 
                product_name = ?, 
                category_id = ?, 
                base_price = ?, 
                customizable = ?, 
                description = ?, 
                image = COALESCE(?, image), 
                status = ?
            WHERE product_id = ?
        `;

        await new Promise((resolve, reject) => {
            db.query(updateProductQuery, [
                product_name,
                category_id,
                base_price,
                customizable === 'true' || customizable === true || customizable === '1' || customizable === 1 || customizable === 'yes' ? 'yes' : 'no',
                description,
                imagePath,
                status || 'out of stock',
                productId
            ], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        // Handle customizations if product is customizable
        if (customizable === 'yes' && customizations) {
            const customizationsArray = JSON.parse(customizations);

            // Fetch existing customizations
            const fetchCustomizationsQuery = `SELECT customization_id FROM product_customizations WHERE product_id = ?`;
            const existingCustomizations = await new Promise((resolve, reject) => {
                db.query(fetchCustomizationsQuery, [productId], (error, results) => {
                    if (error) reject(error);
                    resolve(results.map(c => c.customization_id));
                });
            });

            const incomingCustomizationIds = customizationsArray.map(c => c.customization_id).filter(id => id);

            // Delete removed customizations
            const customizationsToDelete = existingCustomizations.filter(id => !incomingCustomizationIds.includes(id));
            if (customizationsToDelete.length > 0) {
                const deleteCustomizationsQuery = `DELETE FROM product_customizations WHERE customization_id IN (?)`;
                await new Promise((resolve, reject) => {
                    db.query(deleteCustomizationsQuery, [customizationsToDelete], (error, results) => {
                        if (error) reject(error);
                        resolve(results);
                    });
                });
            }

            // Update or insert customizations
            for (const customization of customizationsArray) {
                if (customization.customization_id) {
                    // Update existing customization
                    const updateCustomizationQuery = `
                        UPDATE product_customizations 
                        SET customization_type = ?, description = ? 
                        WHERE customization_id = ?
                    `;
                    await new Promise((resolve, reject) => {
                        db.query(updateCustomizationQuery, [
                            customization.type,
                            customization.description || '',
                            customization.customization_id
                        ], (error, results) => {
                            if (error) reject(error);
                            resolve(results);
                        });
                    });
                } else {
                    // Insert new customization
                    const insertCustomizationQuery = `
                        INSERT INTO product_customizations (product_id, customization_type, description)
                        VALUES (?, ?, ?)
                    `;
                    const customizationId = await new Promise((resolve, reject) => {
                        db.query(insertCustomizationQuery, [
                            productId,
                            customization.type,
                            customization.description || ''
                        ], (error, results) => {
                            if (error) reject(error);
                            resolve(results.insertId);
                        });
                    });

                    // Handle size customizations if applicable
                    if (customization.type === 'size' && customization.sizes) {
                        for (const size of customization.sizes) {
                            const sizeQuery = `
                                INSERT INTO size_customizations (product_id, customization_id, size_type, height, width, depth)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `;
                            await new Promise((resolve, reject) => {
                                db.query(sizeQuery, [
                                    productId,
                                    customizationId,
                                    size.size_type,
                                    size.height,
                                    size.width,
                                    size.depth
                                ], (error, results) => {
                                    if (error) reject(error);
                                    resolve(results);
                                });
                            });
                        }
                    }
                }
            }
        }

        // Commit the transaction
        await new Promise((resolve, reject) => {
            db.commit(err => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        // Rollback in case of error
        await new Promise((resolve) => {
            db.rollback(() => resolve());
        });

        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteProduct = (req, res) => {
    const productId = req.params.id;

    const query = `DELETE FROM product_master WHERE product_id = ?`;

    db.query(query, [productId], (error, results) => {
        if (error) {
            console.error('Error deleting product:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    });
};

const softDeleteProduct = (req, res) => {
    const productId = req.params.id;
    // If body contains product_status: 'active', reactivate
    if (req.body && req.body.product_status === 'active') {
        const query = `UPDATE product_master SET product_status = 'active', deleted_at = NULL WHERE product_id = ?`;
        db.query(query, [productId], (error, results) => {
            if (error) {
                console.error('Error reactivating product:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json({ message: 'Product reactivated successfully' });
        });
    } else {
        // Default: terminate
        const query = `UPDATE product_master SET product_status = 'terminated', deleted_at = NOW() WHERE product_id = ?`;
        db.query(query, [productId], (error, results) => {
            if (error) {
                console.error('Error soft deleting product:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json({ message: 'Product terminated (soft deleted) successfully' });
        });
    }
};

const getCategories = (req, res) => {
    const query = `SELECT CategoryID AS category_id, CategoryName AS category_name FROM Categories`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

const getProductsByCategory = (req, res) => {
    const { category_id } = req.query;

    if (!category_id) {
        return res.status(400).json({ message: 'category_id is required' });
    }

    const query = `
        SELECT 
            p.product_id, 
            p.product_name, 
            p.base_price, 
            p.image,
            p.product_status,
            SUM(COALESCE(i.stock_qty, 0)) AS stock_qty
        FROM 
            product_master p
        LEFT JOIN 
            inventory i ON p.product_id = i.product_id
        WHERE 
            p.category_id = ?
        GROUP BY 
            p.product_id, p.product_name, p.base_price, p.image, p.product_status
    `;

    db.query(query, [category_id], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        res.json(results);
    });
};
  

  const getCustomizationDetails = async (req, res) => {
    const { productId } = req.params;
    try {
        const query = `
            SELECT 
                pc.customization_id,
                pc.product_id,
                pc.customization_type,
                pc.description,
                COALESCE(sc.size_type, NULL) AS size_type,
                COALESCE(sc.height, NULL) AS height,
                COALESCE(sc.width, NULL) AS width,
                COALESCE(sc.depth, NULL) AS depth
            FROM product_customizations pc
            LEFT JOIN size_customizations sc 
                ON pc.product_id = sc.product_id
                AND pc.customization_type = 'size'
            WHERE pc.product_id = ?;
        `;
        const results = await new Promise((resolve, reject) => {
            db.query(query, [productId], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        if (results.length === 0) {
            return res.status(404).json({ message: 'No customizations found for this product' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching customization details:', error);
        res.status(500).json({ message: 'Error fetching customization details' });
    }
};

  
module.exports = { getProducts, addProduct, deleteProduct, getCategories, getProductsByCategory, getCustomizationDetails, editProduct, upload, softDeleteProduct };