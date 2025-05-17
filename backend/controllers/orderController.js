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

    // Fetch complete cart details with each item and its customizations
    const fetchCartQuery = `
        SELECT 
            ci.cart_item_id,
            ci.product_id, 
            ci.quantity, 
            ci.price
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.cart_id
        WHERE c.Customer_id = ?
    `;

    const fetchCustomizationsQuery = `
        SELECT 
            cc.cart_item_id,
            cc.customization_type,
            cc.customization_value,
            cc.uploaded_image,
            cc.size_type
        FROM cart_customizations cc
        JOIN cart_items ci ON cc.cart_item_id = ci.cart_item_id
        JOIN cart c ON ci.cart_id = c.cart_id
        WHERE c.Customer_id = ?
    `;

    // Execute both queries
    db.query(fetchCartQuery, [customerId], (err, cartItems) => {
        if (err || cartItems.length === 0) {
            console.error("Error fetching cart details:", err);
            return res.status(500).json({ error: "Failed to fetch cart details or cart is empty" });
        }

        db.query(fetchCustomizationsQuery, [customerId], (err, customizations) => {
            if (err) {
                console.error("Error fetching cart customizations:", err);
                return res.status(500).json({ error: "Failed to fetch cart customizations" });
            }

            // Create a mapping of cart_item_id to its customizations
            const customizationsMap = {};
            customizations.forEach(cust => {
                if (!customizationsMap[cust.cart_item_id]) {
                    customizationsMap[cust.cart_item_id] = [];
                }
                customizationsMap[cust.cart_item_id].push({
                    type: cust.customization_type,
                    value: cust.customization_value,
                    image: cust.uploaded_image,
                    size: cust.size_type
                });
            });

            // Process cart items with their customizations
            const processedItems = cartItems.map(item => ({
                cart_item_id: item.cart_item_id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                customizations: customizationsMap[item.cart_item_id] || []
            }));

            console.log("Processed cart items:", JSON.stringify(processedItems, null, 2));

            // Calculate total amount for the order
            const totalAmount = processedItems.reduce(
                (sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 
                0
            );

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

                    // Fetch the last item_id to generate new ones
                    const fetchLastItemIdQuery = `
                        SELECT item_id
                        FROM order_items
                        ORDER BY item_id DESC
                        LIMIT 1
                    `;

                    db.query(fetchLastItemIdQuery, (err, lastItemIdResult) => {
                        if (err) {
                            console.error("Error fetching last item ID:", err);
                            return res.status(500).json({ error: "Failed to fetch last item ID" });
                        }

                        let lastItemId = lastItemIdResult.length > 0 ? lastItemIdResult[0].item_id : '#OI000';
                        let nextItemIdNumber = parseInt(lastItemId.replace('#OI', ''));

                        // Create array to store order items data
                        const orderItemsData = [];
                        const orderItemsMapping = {}; // To map cart_item_id to the new item_id

                        // Prepare order items data for insertion
                        processedItems.forEach(cartItem => {
                            nextItemIdNumber++;
                            const newItemId = `#OI${String(nextItemIdNumber).padStart(3, '0')}`;
                            
                            orderItemsData.push([
                                newItemId,
                                orderId,
                                cartItem.product_id,
                                cartItem.quantity,
                                cartItem.price,
                                'Pending',
                                null // crafter_id
                            ]);
                            
                            // Store mapping from cart_item_id to new item_id
                            orderItemsMapping[cartItem.cart_item_id] = newItemId;
                        });

                        console.log("Order items to insert:", JSON.stringify(orderItemsData, null, 2));

                        // Insert items into order_items table
                        const insertOrderItemsQuery = `
                            INSERT INTO order_items (item_id, order_id, product_id, quantity, price, status, crafter_id)
                            VALUES ?
                        `;

                        db.query(insertOrderItemsQuery, [orderItemsData], (err) => {
                            if (err) {
                                console.error("Error adding items to order:", err);
                                return res.status(500).json({ error: "Failed to add items to order" });
                            }

                            // Fetch the last customization_id for new IDs
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
                                let nextIdNumber = parseInt(lastId.replace('#OC', ''));

                                // Prepare customization details for insertion
                                const customizationDetails = [];

                                processedItems.forEach(cartItem => {
                                    const newItemId = orderItemsMapping[cartItem.cart_item_id];
                                    
                                    // Process each customization for this cart item
                                    if (cartItem.customizations && cartItem.customizations.length > 0) {
                                        cartItem.customizations.forEach(cust => {
                                            nextIdNumber++;
                                            const customization_id = `#OC${String(nextIdNumber).padStart(3, '0')}`;
                                            
                                            customizationDetails.push([
                                                customization_id,
                                                newItemId,
                                                cust.type,
                                                cust.value,
                                                cust.image,
                                                cust.size
                                            ]);
                                        });
                                    }
                                });

                                console.log("Customization details to insert:", JSON.stringify(customizationDetails, null, 2));

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

                                        // Process complete - reduce stock and clear cart
                                        reduceStockSequentially(processedItems, (err) => {
                                            if (err) {
                                                console.error("Error reducing stock:", err);
                                                return res.status(500).json({ error: "Failed to reduce stock" });
                                            }

                                            clearCart(customerId, res);
                                        });
                                    });
                                } else {
                                    // No customizations - reduce stock and clear cart
                                    reduceStockSequentially(processedItems, (err) => {
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
    // Delete cart_customizations
    const deleteCustomizationsQuery = `
        DELETE cc FROM cart_customizations cc
        JOIN cart_items ci ON cc.cart_item_id = ci.cart_item_id
        JOIN cart c ON ci.cart_id = c.cart_id
        WHERE c.Customer_id = ?
    `;

    db.query(deleteCustomizationsQuery, [customerId], (err, result) => {
        if (err) {
            console.error("Error deleting cart customizations:", err);
            return res.status(500).json({ error: "Failed to clear cart customizations" });
        }

        console.log(`Deleted ${result.affectedRows} cart customizations`);

        // Delete cart_items
        const deleteCartItemsQuery = `
            DELETE ci FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.cart_id
            WHERE c.Customer_id = ?
        `;

        db.query(deleteCartItemsQuery, [customerId], (err, result) => {
            if (err) {
                console.error("Error deleting cart items:", err);
                return res.status(500).json({ error: "Failed to clear cart items" });
            }

            console.log(`Deleted ${result.affectedRows} cart items`);

            // Delete cart
            const deleteCartQuery = `
                DELETE FROM cart
                WHERE Customer_id = ?
            `;

            db.query(deleteCartQuery, [customerId], (err, result) => {
                if (err) {
                    console.error("Error deleting cart:", err);
                    return res.status(500).json({ error: "Failed to clear cart" });
                }

                console.log(`Deleted ${result.affectedRows} cart records`);

                res.status(200).json({ message: "Order placed successfully and cart cleared." });
            });
        });
    });
};

module.exports = { proceedToCheckout };