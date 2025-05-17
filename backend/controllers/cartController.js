const db = require("../config/db");

const addToCart = (req, res) => {
    const customerId = req.user.customer_id;

    if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
    }

    const { product_id, quantity, price, customizations } = req.body;

    if (!product_id || !quantity || !price) {
        return res.status(400).json({ error: "Product ID, quantity, and price are required" });
    }

    // Normalize customizations to an array, default to empty if not provided
    const normalizedCustomizations = Array.isArray(customizations) ? customizations : [];

    // Sort customizations by customization_type for consistent comparison
    const sortedCustomizations = normalizedCustomizations
        .map((c, index) => ({
            customization_type: c.customization_type || `type${index}`,
            customization_value: c.customization_value || null,
            uploaded_image: c.uploaded_image || null,
            size_type: c.size_type || null,
        }))
        .sort((a, b) => a.customization_type.localeCompare(b.customization_type));

    // Ensure a cart exists (trigger generates cart_id)
    const cartQuery = `
        INSERT INTO cart (Customer_id)
        VALUES (?)
        ON DUPLICATE KEY UPDATE cart_id = cart_id
    `;

    db.query(cartQuery, [customerId], (err) => {
        if (err) {
            console.error("Error creating cart:", err);
            return res.status(500).json({ error: "Failed to create cart" });
        }

        // Fetch cart_id
        const cartIdQuery = `SELECT cart_id FROM cart WHERE Customer_id = ?`;
        db.query(cartIdQuery, [customerId], (err, cartIdResult) => {
            if (err || cartIdResult.length === 0) {
                console.error("Error fetching cart ID:", err);
                return res.status(500).json({ error: "Failed to fetch cart ID" });
            }

            const cart_id = cartIdResult[0].cart_id;

            // Find cart items with same product_id
            const findItemsQuery = `
                SELECT ci.cart_item_id, ci.quantity
                FROM cart_items ci
                WHERE ci.cart_id = ? AND ci.product_id = ?
            `;

            db.query(findItemsQuery, [cart_id, product_id], (err, items) => {
                if (err) {
                    console.error("Error fetching cart items:", err);
                    return res.status(500).json({ error: "Failed to fetch cart items" });
                }

                // Expected customizations as a sorted JSON string for comparison
                const expectedCustomizationJson = JSON.stringify(sortedCustomizations.map(c => ({
                    type: c.customization_type,
                    value: c.customization_value,
                    image: c.uploaded_image,
                    size: c.size_type,
                })));

                let matchingItem = null;

                // Check each item for matching customizations
                const checkCustomizations = (index) => {
                    if (index >= items.length) {
                        // No matching item found, proceed to insert
                        insertNewItem();
                        return;
                    }

                    const item = items[index];
                    const customizationQuery = `
                        SELECT customization_type, customization_value, uploaded_image, size_type
                        FROM cart_customizations
                        WHERE cart_item_id = ?
                        ORDER BY customization_type
                    `;

                    db.query(customizationQuery, [item.cart_item_id], (err, dbCustomizations) => {
                        if (err) {
                            console.error("Error fetching customizations:", err);
                            return res.status(500).json({ error: "Failed to fetch customizations" });
                        }

                        // Convert db customizations to match expected format
                        const dbCustomizationJson = JSON.stringify(dbCustomizations.map(c => ({
                            type: c.customization_type,
                            value: c.customization_value,
                            image: c.uploaded_image,
                            size: c.size_type,
                        })));

                        // Compare customizations
                        if (
                            dbCustomizationJson === expectedCustomizationJson &&
                            dbCustomizations.length === sortedCustomizations.length
                        ) {
                            matchingItem = item;
                            updateItemQuantity();
                        } else {
                            // Check next item
                            checkCustomizations(index + 1);
                        }
                    });
                };

                const updateItemQuantity = () => {
                    const newQuantity = matchingItem.quantity + quantity;
                    const updateQuantityQuery = `
                        UPDATE cart_items
                        SET quantity = ?
                        WHERE cart_item_id = ?
                    `;

                    db.query(updateQuantityQuery, [newQuantity, matchingItem.cart_item_id], (err) => {
                        if (err) {
                            console.error("Error updating item quantity:", err);
                            return res.status(500).json({ error: "Failed to update item quantity" });
                        }

                        res.status(200).json({ message: "Item quantity updated in cart" });
                    });
                };

                const insertNewItem = () => {
                    const cartItemQuery = `
                        INSERT INTO cart_items (cart_id, product_id, quantity, price)
                        VALUES (?, ?, ?, ?)
                    `;

                    db.query(cartItemQuery, [cart_id, product_id, quantity, price], (err) => {
                        if (err) {
                            console.error("Error adding item to cart:", err);
                            return res.status(500).json({ error: "Failed to add item to cart" });
                        }

                        if (sortedCustomizations.length > 0) {
                            // Fetch the latest cart_item_id
                            const cartItemIdQuery = `
                                SELECT cart_item_id FROM cart_items
                                WHERE cart_id = ? AND product_id = ? AND quantity = ? AND price = ?
                                ORDER BY cart_item_id DESC LIMIT 1
                            `;

                            db.query(cartItemIdQuery, [cart_id, product_id, quantity, price], (err, cartItemResult) => {
                                if (err || cartItemResult.length === 0) {
                                    console.error("Error fetching cart_item_id:", err);
                                    return res.status(500).json({ error: "Failed to fetch cart item ID" });
                                }

                                const cart_item_id = cartItemResult[0].cart_item_id;

                                const customizationQuery = `
                                    INSERT INTO cart_customizations (cart_item_id, customization_type, customization_value, uploaded_image, size_type)
                                    VALUES ?
                                `;

                                const customizationValues = sortedCustomizations.map((customization) => [
                                    cart_item_id,
                                    customization.customization_type,
                                    customization.customization_value,
                                    customization.uploaded_image,
                                    customization.size_type,
                                ]);

                                db.query(customizationQuery, [customizationValues], (err) => {
                                    if (err) {
                                        console.error("Error adding customizations:", err);
                                        return res.status(500).json({ error: "Failed to add customizations" });
                                    }

                                    res.status(200).json({ message: "Item added to cart with customizations" });
                                });
                            });
                        } else {
                            res.status(200).json({ message: "Item added to cart" });
                        }
                    });
                };

                if (items.length === 0) {
                    // No items exist, insert new
                    insertNewItem();
                } else {
                    // Check for matching customizations
                    checkCustomizations(0);
                }
            });
        });
    });
};

const getCartItems = (req, res) => {
    const customerId = req.user.customer_id;
  
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }
  
    const cartItemsQuery = `
      SELECT 
    ci.cart_item_id, 
    ci.product_id, 
    ci.quantity, 
    ci.price, 
    p.product_name AS name,
    p.image, 
    COALESCE(
      JSON_ARRAYAGG(
        IF(cc.cart_item_id IS NOT NULL,
          JSON_OBJECT(
            'type', cc.customization_type,
            'value', cc.customization_value,
            'image', cc.uploaded_image,
            'size', cc.size_type
          ),
          NULL
        )
      ), JSON_ARRAY()
    ) AS customizations
FROM 
    cart_items ci
JOIN 
    cart c ON ci.cart_id = c.cart_id
JOIN 
    product_master p ON ci.product_id = p.product_id
LEFT JOIN 
    cart_customizations cc ON ci.cart_item_id = cc.cart_item_id
WHERE 
    c.Customer_id = ?
GROUP BY 
    ci.cart_item_id;

    `;
  
    db.query(cartItemsQuery, [customerId], (err, cartItems) => {
      if (err) {
        console.error("Error fetching cart items:", err);
        return res.status(500).json({ error: "Failed to fetch cart items" });
      }
  
      // Fetch all customizations in one query
      const itemIds = cartItems.map(item => item.cart_item_id);
      if (itemIds.length === 0) {
        return res.status(200).json([]);
      }
  
      const customizationQuery = `
        SELECT * FROM cart_customizations
        WHERE cart_item_id IN (?)
      `;
  
      db.query(customizationQuery, [itemIds], (err, customizations) => {
        if (err) {
          console.error("Error fetching customizations:", err);
          return res.status(500).json({ error: "Failed to fetch customizations" });
        }
  
        // Merge customizations with corresponding items
        const itemsWithCustomizations = cartItems.map(item => {
          const itemCustomizations = customizations.filter(c => c.cart_item_id === item.cart_item_id);
          return {
            ...item,
            customization: itemCustomizations
          };
        });
  
        res.status(200).json(itemsWithCustomizations);
      });
    });
};
  
const removeCartItem = (req, res) => {
    const cartItemId = req.params.id;

    if (!cartItemId) {
        return res.status(400).json({ error: "Cart item ID is required" });
    }

    const deleteCustomizationsQuery = `
        DELETE FROM cart_customizations
        WHERE cart_item_id = ?
    `;

    db.query(deleteCustomizationsQuery, [cartItemId], (err) => {
        if (err) {
            console.error("Error removing customizations:", err);
            return res.status(500).json({ error: "Failed to remove customizations" });
        }

        const deleteCartItemQuery = `
            DELETE FROM cart_items
            WHERE cart_item_id = ?
        `;

        db.query(deleteCartItemQuery, [cartItemId], (err, result) => {
            if (err) {
                console.error("Error removing cart item:", err);
                return res.status(500).json({ error: "Failed to remove cart item" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Cart item not found" });
            }

            const checkCartQuery = `
                SELECT COUNT(*) AS itemCount
                FROM cart_items
                WHERE cart_id = (SELECT cart_id FROM cart_items WHERE cart_item_id = ? LIMIT 1)
            `;

            db.query(checkCartQuery, [cartItemId], (err, countResult) => {
                if (err) {
                    console.error("Error checking cart items:", err);
                    return res.status(500).json({ error: "Failed to check cart items" });
                }

                const itemCount = countResult[0].itemCount;

                if (itemCount === 0) {
                    const deleteCartQuery = `
                        DELETE FROM cart
                        WHERE cart_id = (SELECT cart_id FROM cart_items WHERE cart_item_id = ? LIMIT 1)
                    `;

                    db.query(deleteCartQuery, [cartItemId], (err) => {
                        if (err) {
                            console.error("Error removing cart:", err);
                            return res.status(500).json({ error: "Failed to remove cart" });
                        }

                        res.status(200).json({ message: "Cart item and cart removed successfully" });
                    });
                } else {
                    res.status(200).json({ message: "Cart item removed successfully" });
                }
            });
        });
    });
};

module.exports = { addToCart, getCartItems, removeCartItem };