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

        // Aggregate all customizations by cart_item_id from cartItems
        const cartItemCustomizations = new Map();
        cartItems.forEach(item => {
            const key = item.cart_item_id;
            if (!cartItemCustomizations.has(key)) {
                cartItemCustomizations.set(key, {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    customization_type: null,
                    customization_value: null,
                    uploaded_image: null,
                    size_type: null
                });
            }
            const customization = cartItemCustomizations.get(key);
            if (item.customization_value !== null && item.customization_value !== undefined) {
                customization.customization_type = 'text';
                customization.customization_value = item.customization_value;
            }
            if (item.uploaded_image) {
                customization.uploaded_image = item.uploaded_image;
            }
            if (item.size_type) {
                customization.size_type = item.size_type;
            }
        });
// Filter duplicates, include both customizable and non-customizable items
let filteredCartItems = [];
const productIdMap = new Map(); // Map to track products and their customizable/non-customizable items

for (const item of cartItems) {
    const hasCustomizations = item.customization_type || item.customization_value || 
                              item.uploaded_image || item.size_type;

    if (!productIdMap.has(item.product_id)) {
        // Add the first occurrence of the product
        productIdMap.set(item.product_id, { customizable: null, nonCustomizable: null });
    }

    const productEntry = productIdMap.get(item.product_id);

    if (hasCustomizations) {
        // Prioritize customizable items
        productEntry.customizable = item;
    } else {
        // Add non-customizable items if no customizable item exists
        productEntry.nonCustomizable = item;
    }
}

// Add both customizable and non-customizable items to filteredCartItems
for (const { customizable, nonCustomizable } of productIdMap.values()) {
    if (customizable) filteredCartItems.push(customizable);
    if (nonCustomizable) filteredCartItems.push(nonCustomizable);
}

// Log filtered cart items for debugging
console.log("Filtered cart items:", JSON.stringify(filteredCartItems, null, 2));


        // Calculate total amount
        const totalAmount = filteredCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                const orderItems = filteredCartItems.map(item => [
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

                    // Retrieve the inserted order_item IDs
                    const fetchOrderItemsQuery = `
                        SELECT item_id, product_id
                        FROM order_items
                        WHERE order_id = ?
                    `;

                    db.query(fetchOrderItemsQuery, [orderId], (err, orderItemsResult) => {
                        if (err || orderItemsResult.length === 0) {
                            console.error("Error fetching order items:", err);
                            return res.status(500).json({ error: "Failed to fetch order items" });
                        }

                        // Map customizations to item_id
                        const customizationDetails = [];
                        const fetchLastCustomizationIdQuery = `
                            SELECT customization_id
                            FROM customization_details
                            ORDER BY customization_id DESC
                            LIMIT 1
                        `;

                        db.query(fetchLastCustomizationIdQuery, (err, lastIdResult) => {
                            if (err) {
                                console.error("Error fetching last customization ID:", err);
                                return res.status(500).json({ error: "Failed to fetch last customization ID" });
                            }

                            let lastId = lastIdResult.length > 0 ? lastIdResult[0].customization_id : '#OC000';
                            const nextIdNumber = parseInt(lastId.replace('#OC', '')) + 1;

                            filteredCartItems.forEach(cartItem => {
                                const orderItem = orderItemsResult.find(item => item.product_id === cartItem.product_id);
                                if (!orderItem) return;

                                const item_id = orderItem.item_id;
                                const customization = cartItemCustomizations.get(cartItem.cart_item_id);
                                if (customization && (customization.customization_type || customization.uploaded_image || customization.size_type)) {
                                    const customization_id = `#OC${String(nextIdNumber + customizationDetails.length).padStart(3, '0')}`;
                                    customizationDetails.push([
                                        customization_id,
                                        item_id,
                                        customization.customization_type || 'text', // Default to 'text' if NULL
                                        customization.customization_value || null, // Ensure NULL if not set
                                        customization.uploaded_image,
                                        customization.size_type
                                    ]);
                                }
                            });

                            if (customizationDetails.length > 0) {
                                const insertCustomizationsQuery = `
                                    INSERT INTO customization_details (customization_id, item_id, customization_type, customization_value, uploaded_image, size_type)
                                    VALUES ?
                                `;

                                db.query(insertCustomizationsQuery, [customizationDetails], (err) => {
                                    if (err) {
                                        console.error("Error adding customizations to order:", err);
                                        return res.status(500).json({ error: "Failed to add customizations to order" });
                                    }

                                    // Proceed with reducing stock and clearing the cart
                                    reduceStockSequentially(filteredCartItems, (err) => {
                                        if (err) {
                                            console.error("Error reducing stock:", err);
                                            return res.status(500).json({ error: "Failed to reduce stock" });
                                        }

                                        clearCart(customerId, res);
                                    });
                                });
                            } else {
                                // Proceed with reducing stock and clearing the cart if no customizations
                                reduceStockSequentially(filteredCartItems, (err) => {
                                    if (err) {
                                        console.error("Error reducing stock:", err);
                                        return res.status(500).json({ error: "Failed to reduce stock" });
                                    }

                                    clearCart(customerId, res);
                                });
                            }
                        });
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