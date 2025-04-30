const db = require("../config/db");

const proceedToCheckout = (req, res) => {
    const customerId = req.user.customer_id;

    if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
    }

    const { shipping_address } = req.body;

    if (!shipping_address) {
        return res.status(400).json({ error: "Shipping address is required" });
    }

    // Fetch cart details for the customer
    const fetchCartQuery = `
        SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.price, cc.customization_type, 
               cc.customization_value, cc.uploaded_image, cc.size_type
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.cart_id
        LEFT JOIN cart_customizations cc ON ci.cart_item_id = cc.cart_item_id
        WHERE c.Customer_id = ?
    `;

    db.query(fetchCartQuery, [customerId], (err, cartItems) => {
        if (err || cartItems.length === 0) {
            console.error("Error fetching cart details:", err);
            return res.status(500).json({ error: "Failed to fetch cart details or cart is empty" });
        }

        // Calculate total amount
        const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Insert into orders table
        const insertOrderQuery = `
            INSERT INTO orders (customer_id, total_amount, shipping_address)
            VALUES (?, ?, ?)
        `;

        db.query(insertOrderQuery, [customerId, totalAmount, shipping_address], (err) => {
            if (err) {
                console.error("Error creating order:", err);
                return res.status(500).json({ error: "Failed to create order" });
            }

            // Retrieve the generated order_id
            const fetchOrderIdQuery = `
                SELECT order_id FROM orders
                WHERE customer_id = ?
                ORDER BY order_date DESC
                LIMIT 1
            `;

            db.query(fetchOrderIdQuery, [customerId], (err, orderResult) => {
                if (err || orderResult.length === 0) {
                    console.error("Error fetching order ID:", err);
                    return res.status(500).json({ error: "Failed to fetch order ID" });
                }

                const orderId = orderResult[0].order_id;

                // Insert items into order_items table
                const orderItems = cartItems.map(item => [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                ]);

                const insertOrderItemsQuery = `
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES ?
                `;

                db.query(insertOrderItemsQuery, [orderItems], (err, result) => {
                    if (err) {
                        console.error("Error adding items to order:", err);
                        return res.status(500).json({ error: "Failed to add items to order" });
                    }

                    // Retrieve the generated item_ids for the inserted order_items
                    const fetchItemIdsQuery = `
                        SELECT item_id, product_id FROM order_items
                        WHERE order_id = ?
                    `;

                    db.query(fetchItemIdsQuery, [orderId], (err, itemIds) => {
                        if (err || itemIds.length === 0) {
                            console.error("Error fetching item IDs:", err);
                            return res.status(500).json({ error: "Failed to fetch item IDs" });
                        }

                        // Map cart_item_id to the corresponding item_id
                        const itemIdMap = {};
                        itemIds.forEach(item => {
                            itemIdMap[item.product_id] = item.item_id;
                        });

                        // Insert customizations into customization_details table
                        const customizations = cartItems
                            .filter(item => item.customization_type)
                            .map(item => [
                                itemIdMap[item.product_id], // Map product_id to item_id
                                item.customization_type,
                                item.customization_value,
                                item.uploaded_image,
                                item.size_type
                            ]);

                        if (customizations.length > 0) {
                            const insertCustomizationsQuery = `
                                INSERT INTO customization_details (item_id, customization_type, customization_value, uploaded_image, size_type)
                                VALUES ?
                            `;

                            db.query(insertCustomizationsQuery, [customizations], (err) => {
                                if (err) {
                                    console.error("Error adding customizations:", err);
                                    return res.status(500).json({ error: "Failed to add customizations" });
                                }

                                // Clear the cart after successful checkout
                                clearCart(customerId, res);
                            });
                        } else {
                            // Clear the cart if no customizations exist
                            clearCart(customerId, res);
                        }
                    });
                });
            });
        });
    });
};

const clearCart = (customerId, res) => {
    const clearCartQuery = `
        DELETE cc, ci, c
        FROM cart_customizations cc
        RIGHT JOIN cart_items ci ON cc.cart_item_id = ci.cart_item_id
        RIGHT JOIN cart c ON ci.cart_id = c.cart_id
        WHERE c.Customer_id = ?
    `;

    db.query(clearCartQuery, [customerId], (err) => {
        if (err) {
            console.error("Error clearing cart, items, and customizations:", err);
            return res.status(500).json({ error: "Failed to clear cart, items, and customizations" });
        }

        res.status(200).json({ message: "Cart cleared successfully, including all items and customizations" });
    });
};

module.exports = { proceedToCheckout };