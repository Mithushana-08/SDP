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

                db.query(insertOrderItemsQuery, [orderItems], (err) => {
                    if (err) {
                        console.error("Error adding items to order:", err);
                        return res.status(500).json({ error: "Failed to add items to order" });
                    }

                    // Reduce stock for each product in the cart
                    reduceStockSequentially(cartItems, (err) => {
                        if (err) {
                            console.error("Error reducing stock:", err);
                            return res.status(500).json({ error: "Failed to reduce stock" });
                        }

                        // Clear the cart after successful checkout
                        clearCart(customerId, res);
                    });
                });
            });
        });
    });
};

// Function to reduce stock sequentially for each product
const reduceStockSequentially = (cartItems, callback) => {
    const reduceStockForItem = (index) => {
        if (index >= cartItems.length) {
            return callback(null); // All items processed
        }

        const item = cartItems[index];
        const { product_id, quantity } = item;

        // Fetch inventory records for the product, sorted by stock_qty
        const fetchInventoryQuery = `
            SELECT crafter_id, stock_qty
            FROM inventory
            WHERE product_id = ? AND stock_qty > 0
            ORDER BY stock_qty DESC
        `;

        db.query(fetchInventoryQuery, [product_id], (err, inventoryRecords) => {
            if (err || inventoryRecords.length === 0) {
                return callback(new Error(`Insufficient stock for product ID: ${product_id}`));
            }

            let remainingQuantity = quantity;

            const reduceStockForCrafter = (crafterIndex) => {
                if (crafterIndex >= inventoryRecords.length || remainingQuantity <= 0) {
                    if (remainingQuantity > 0) {
                        return callback(new Error(`Insufficient stock for product ID: ${product_id}`));
                    }
                    return reduceStockForItem(index + 1); // Move to the next product
                }

                const { crafter_id, stock_qty } = inventoryRecords[crafterIndex];
                const quantityToReduce = Math.min(stock_qty, remainingQuantity);

                // Reduce stock for the current crafter
                const updateInventoryQuery = `
                    UPDATE inventory
                    SET stock_qty = stock_qty - ?
                    WHERE product_id = ? AND crafter_id = ? AND stock_qty >= ?
                `;

                db.query(updateInventoryQuery, [quantityToReduce, product_id, crafter_id, quantityToReduce], (err, result) => {
                    if (err || result.affectedRows === 0) {
                        return callback(new Error(`Failed to reduce stock for product ID: ${product_id}`));
                    }

                    remainingQuantity -= quantityToReduce;
                    reduceStockForCrafter(crafterIndex + 1); // Move to the next crafter
                });
            };

            reduceStockForCrafter(0); // Start with the first crafter
        });
    };

    reduceStockForItem(0); // Start processing the first product
};

// Function to clear the cart
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

        res.status(200).json({ message: "Order placed successfully and cart cleared." });
    });
};

module.exports = { proceedToCheckout };