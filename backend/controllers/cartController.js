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
          p.product_name AS name,  -- Corrected column name
          p.image, 
          GROUP_CONCAT(cc.customization_type, ':', cc.customization_value) AS customizations
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

  db.query(cartItemsQuery, [customerId], (err, results) => {
      if (err) {
          console.error("Error fetching cart items:", err);
          return res.status(500).json({ error: "Failed to fetch cart items" });
      }

      res.status(200).json(results);
  });
};

const removeCartItem = (req, res) => {
  const cartItemId = req.params.id; // Get the cart item ID from the request parameters

  if (!cartItemId) {
      return res.status(400).json({ error: "Cart item ID is required" });
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

      res.status(200).json({ message: "Cart item removed successfully" });
  });
};

module.exports = { addToCart, getCartItems, removeCartItem };