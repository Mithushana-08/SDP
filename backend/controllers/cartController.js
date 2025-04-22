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

        const cartIdQuery = `SELECT cart_id FROM cart WHERE Customer_id = ?`;
        db.query(cartIdQuery, [customerId], (err, cartIdResult) => {
            if (err || cartIdResult.length === 0) {
                console.error("Error fetching cart ID:", err);
                return res.status(500).json({ error: "Failed to fetch cart ID" });
            }

            const cart_id = cartIdResult[0].cart_id;

            const cartItemQuery = `
                INSERT INTO cart_items (cart_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)
            `;

            db.query(cartItemQuery, [cart_id, product_id, quantity, price], (err) => {
                if (err) {
                    console.error("Error adding item to cart:", err);
                    return res.status(500).json({ error: "Failed to add item to cart" });
                }

                // Fetch the generated cart_item_id
                const cartItemIdQuery = `
                    SELECT cart_item_id FROM cart_items
                    WHERE cart_id = ? AND product_id = ?
                    ORDER BY cart_item_id DESC LIMIT 1
                `;

                db.query(cartItemIdQuery, [cart_id, product_id], (err, cartItemResult) => {
                    if (err || cartItemResult.length === 0) {
                        console.error("Error fetching cart_item_id:", err);
                        return res.status(500).json({ error: "Failed to fetch cart item ID" });
                    }

                    const cart_item_id = cartItemResult[0].cart_item_id;
                    console.log("Generated cart_item_id:", cart_item_id);

                    if (customizations && customizations.length > 0) {
                        const customizationQuery = `
                            INSERT INTO cart_customizations (cart_item_id, customization_type, customization_value, uploaded_image, size_type)
                            VALUES ?
                        `;

                        const customizationValues = customizations.map((customization) => [
                            cart_item_id,
                            customization.customization_type,
                            customization.customization_value || null,
                            customization.uploaded_image || null,
                            customization.size_type || null,
                        ]);

                        db.query(customizationQuery, [customizationValues], (err) => {
                            if (err) {
                                console.error("Error adding customizations:", err);
                                return res.status(500).json({ error: "Failed to add customizations" });
                            }

                            res.status(200).json({ message: "Item added to cart with customizations" });
                        });
                    } else {
                        res.status(200).json({ message: "Item added to cart" });
                    }
                });
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
    const cartItemId = req.params.id; // Get the cart item ID from the request parameters

    if (!cartItemId) {
        return res.status(400).json({ error: "Cart item ID is required" });
    }

    // First, delete customizations associated with the cart item
    const deleteCustomizationsQuery = `
        DELETE FROM cart_customizations
        WHERE cart_item_id = ?
    `;

    db.query(deleteCustomizationsQuery, [cartItemId], (err) => {
        if (err) {
            console.error("Error removing customizations:", err);
            return res.status(500).json({ error: "Failed to remove customizations" });
        }

        // Then, delete the cart item
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

            // Finally, check if the cart is empty and delete the cart if it is
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