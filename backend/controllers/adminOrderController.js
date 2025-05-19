const db = require("../config/db");

// Fetch all orders with details
const getOrdersWithDetails = (req, res) => {
    const query = `
        SELECT 
    o.order_id, 
    o.order_date, 
    o.total_amount, 
    o.status, 
    o.shipping_address,
    c.username AS customer_name, 
    c.phone AS customer_phone,
    COUNT(DISTINCT oi.item_id) AS product_count,
    (SELECT COUNT(DISTINCT oi2.item_id) 
     FROM order_items oi2 
     LEFT JOIN customization_details cd2 ON oi2.item_id = cd2.item_id 
     WHERE oi2.order_id = o.order_id AND cd2.customization_id IS NOT NULL) AS customizable_count
FROM orders o
JOIN customer c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
GROUP BY o.order_id, o.order_date, o.total_amount, o.status, o.shipping_address, c.username, c.phone
ORDER BY o.order_date DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }
        res.json(results);
    });
};

const getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
    }

    const query = `
        SELECT 
            oi.item_id, 
            oi.product_id, 
            oi.quantity, 
            oi.price, 
            oi.total_price, 
            p.product_name, 
            oi.status,
            c.CategoryName AS category_name, 
            oi.crafter_id,
            u.username AS crafter_username,
            (SELECT COUNT(*) > 0 FROM customization_details cd2 WHERE cd2.item_id = oi.item_id) AS is_customizable,
            COALESCE(
                (SELECT JSON_OBJECT(
                    'type', 'text',
                    'value', MAX(CASE WHEN cd3.customization_type = 'text' THEN cd3.customization_value ELSE NULL END),
                    'size', MAX(CASE WHEN cd3.customization_type = 'size' THEN cd3.size_type ELSE NULL END),
                    'image', MAX(CASE WHEN cd3.customization_type = 'image' THEN cd3.uploaded_image ELSE NULL END)
                )
                FROM customization_details cd3
                WHERE cd3.item_id = oi.item_id AND cd3.customization_type IN ('text', 'size', 'image')),
                JSON_OBJECT('type', NULL, 'value', NULL, 'size', NULL, 'image', NULL)
            ) AS customizations
        FROM 
            order_items oi
        JOIN 
            product_master p ON oi.product_id = p.product_id
        JOIN 
            Categories c ON p.category_id = c.CategoryID
        LEFT JOIN 
            users u ON oi.crafter_id = u.id
        WHERE 
            oi.order_id = ?
        GROUP BY 
            oi.item_id, oi.product_id, oi.quantity, oi.price, oi.total_price,
            p.product_name, c.CategoryName, oi.status, oi.crafter_id, u.username
    `;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "No order items found for the specified order ID" });
        }

        // Process the results to parse customizations
        const processedResults = results.map(item => ({
            item_id: item.item_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total_price: item.total_price,
            product_name: item.product_name,
            status: item.status,
            category_name: item.category_name,
            crafter_id: item.crafter_id,
            crafter_username: item.crafter_username,
            is_customizable: item.is_customizable,
            customizations: item.customizations ? JSON.parse(item.customizations) : { type: null, value: null, size: null, image: null }
        }));

        res.json(processedResults);
    });
};

const getCrafters = (req, res) => {
    const query = `
        SELECT id, username AS crafter_name
        FROM users
        WHERE role = 'crafter'; -- Assuming 'role' column identifies crafters
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching crafters:", err);
            return res.status(500).json({ error: "Failed to fetch crafters" });
        }
        res.json(results);
    });
};

const assignCrafter = (req, res) => {
    const { item_id, crafter_id } = req.body;

    const query = `
        UPDATE order_items
        SET crafter_id = ?
        WHERE item_id = ?
    `;

    db.query(query, [crafter_id, item_id], (err, result) => {
        if (err) {
            console.error("Error assigning crafter:", err);
            return res.status(500).json({ error: "Failed to assign crafter" });
        }

        res.status(200).json({ message: "Crafter assigned successfully" });
    });
};



const updateStatus = (req, res) => {
    const { orderId } = req.params;
    const { item_id, status } = req.body;
    
    console.log(`Updating status for order: ${orderId}, item: ${item_id}, new status: ${status}`);

    // Validate request body
    if (!item_id || !status) {
        return res.status(400).json({ error: "item_id and status are required" });
    }

    // Validate status value for order items
    const validItemStatuses = ['Pending', 'Confirmed', 'Completed', 'Ready to Deliver'];
    if (!validItemStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    // Update the order item status
    const updateItemQuery = `
        UPDATE order_items
        SET status = ?
        WHERE item_id = ? AND order_id = ?
    `;

    console.log(`Executing query: ${updateItemQuery.replace(/\s+/g, ' ')}`);
    console.log(`With parameters: [${status}, ${item_id}, ${orderId}]`);

    db.query(updateItemQuery, [status, item_id, orderId], (err, result) => {
        if (err) {
            console.error("Error updating status:", err);
            return res.status(500).json({ error: "Failed to update status" });
        }

        console.log("Update item query result:", result);

        // Check if any rows were affected
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Order item not found" });
        }

        // Fetch order details
        const orderDetailsQuery = `
            SELECT 
                oi.item_id, oi.status,
                CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END AS is_customizable
            FROM order_items oi
            LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
            WHERE oi.order_id = ?
        `;

        console.log(`Fetching order details with query: ${orderDetailsQuery.replace(/\s+/g, ' ')}`);
        console.log(`With orderId: ${orderId}`);

        db.query(orderDetailsQuery, [orderId], (err, items) => {
            if (err) {
                console.error("Error fetching order items:", err);
                return res.status(500).json({ error: "Failed to fetch order items" });
            }

            // Log the fetched items
            console.log("Order items fetched:", JSON.stringify(items, null, 2));

            // Extract customizable and non-customizable items
            const customizableItems = items.filter(item => item.is_customizable === 1);
            const nonCustomizableItems = items.filter(item => item.is_customizable === 0);
            
            // Check what types of items we have
            const hasCustomizable = customizableItems.length > 0;
            const hasNonCustomizable = nonCustomizableItems.length > 0;
            
            // Check status conditions
            const allItemsConfirmed = items.every(item => 
                ['Confirmed', 'Completed', 'Ready to Deliver'].includes(item.status));
                
            const allCustomizableCompleted = customizableItems.length > 0 && 
                customizableItems.every(item => 
                    ['Completed', 'Ready to Deliver'].includes(item.status));
                    
            const allNonCustomizableConfirmed = nonCustomizableItems.length > 0 && 
                nonCustomizableItems.every(item => 
                    ['Confirmed', 'Completed', 'Ready to Deliver'].includes(item.status));

            // Debug logs
            console.log("Order Analysis:");
            console.log("hasCustomizable:", hasCustomizable);
            console.log("hasNonCustomizable:", hasNonCustomizable);
            console.log("allItemsConfirmed:", allItemsConfirmed);
            console.log("allCustomizableCompleted:", allCustomizableCompleted);
            console.log("allNonCustomizableConfirmed:", allNonCustomizableConfirmed);
            console.log("customizableItems count:", customizableItems.length);
            console.log("nonCustomizableItems count:", nonCustomizableItems.length);

            let newOrderStatus = null;

            // Determine the new order status - Map to correct database enum values
            const mapStatusToDb = {
                'Ready to Deliver': 'ready to deliver',
                'Confirmed': 'confirmed',
                'Pending': 'pending',
                'Completed': 'completed'
            };

            if (hasCustomizable && hasNonCustomizable) {
                // Case 1: Both customizable and non-customizable items
                if (allCustomizableCompleted && allNonCustomizableConfirmed) {
                    newOrderStatus = mapStatusToDb['Ready to Deliver'];
                    console.log("Case 1: Setting to ready to deliver - all customizable completed & all non-customizable confirmed");
                } else if (allItemsConfirmed) {
                    newOrderStatus = mapStatusToDb['Confirmed'];
                    console.log("Case 1: Setting to confirmed - all items at least confirmed");
                }
            } else if (hasCustomizable && !hasNonCustomizable) {
                // Case 2: Only customizable items
                if (allCustomizableCompleted) {
                    newOrderStatus = mapStatusToDb['Ready to Deliver'];
                    console.log("Case 2: Setting to ready to deliver - all customizable completed");
                } else if (allItemsConfirmed) {
                    newOrderStatus = mapStatusToDb['Confirmed'];
                    console.log("Case 2: Setting to confirmed - all items at least confirmed");
                }
            } else if (!hasCustomizable && hasNonCustomizable) {
                // Case 3: Only non-customizable items
                if (allNonCustomizableConfirmed) {
                    newOrderStatus = mapStatusToDb['Ready to Deliver'];
                    console.log("Case 3: Setting to ready to deliver - all non-customizable confirmed");
                } else if (allItemsConfirmed) {
                    newOrderStatus = mapStatusToDb['Confirmed'];
                    console.log("Case 3.1: Setting to confirmed - all items at least confirmed");
                }
            }

            // Debug log for newOrderStatus
            console.log("New Order Status:", newOrderStatus);

            // Update order status if needed
            if (newOrderStatus) {
                const updateOrderQuery = `
                    UPDATE orders
                    SET status = ?
                    WHERE order_id = ?
                `;
                console.log(`Updating order status with query: ${updateOrderQuery.replace(/\s+/g, ' ')}`);
                console.log(`With parameters: [${newOrderStatus}, ${orderId}]`);
                
                db.query(updateOrderQuery, [newOrderStatus, orderId], (err, updateResult) => {
                    if (err) {
                        console.error("Error updating order status:", err);
                        console.error("SQL error details:", err.sqlMessage || err.message);
                        return res.status(500).json({ error: "Failed to update order status" });
                    }
                    
                    // Log update result to see if rows were affected
                    console.log("Update order status result:", updateResult);
                    
                    res.status(200).json({ 
                        message: "Status updated successfully", 
                        newOrderStatus,
                        updateResult: updateResult
                    });
                });
            } else {
                console.log("No order status update needed");
                res.status(200).json({ 
                    message: "Item status updated successfully, order status unchanged" 
                });
            }
        });
    });
};

const updateOrderStatus = (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: "orderId and status are required" });
    }

    // Only allow valid status transitions
    const validStatuses = ['pending', 'confirmed', 'ready to deliver', 'sent', 'cancelled', 'delivered'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    // Fetch current order status
    db.query('SELECT status FROM orders WHERE order_id = ?', [orderId], (err, results) => {
        if (err) {
            console.error("Error fetching order status:", err);
            return res.status(500).json({ error: "Failed to fetch order status" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        const currentStatus = results[0].status;
        // Only allow 'sent' if current is 'ready to deliver', and 'cancelled' anytime except delivered/sent
        if (status === 'sent' && currentStatus !== 'ready to deliver') {
            return res.status(400).json({ error: "Can only mark as sent after ready to deliver" });
        }
        if (status === 'cancelled' && (currentStatus === 'delivered' || currentStatus === 'sent')) {
            return res.status(400).json({ error: "Cannot cancel after sent or delivered" });
        }
        db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId], (err2, result) => {
            if (err2) {
                console.error("Error updating order status:", err2);
                return res.status(500).json({ error: "Failed to update order status" });
            }
            // If cancelled, update inventory for each order item (one crafter per product)
            if (status === 'cancelled') {
                db.query('SELECT product_id, crafter_id, quantity FROM order_items WHERE order_id = ?', [orderId], (err3, items) => {
                    if (err3) {
                        console.error("Error fetching order items for inventory update:", err3);
                        return res.status(500).json({ error: "Order cancelled, but failed to update inventory." });
                    }
                    let updateCount = 0;
                    if (items.length === 0) {
                        return res.status(200).json({ message: "Order status updated", newStatus: status });
                    }
                    items.forEach(item => {
                        db.query('UPDATE inventory SET stock_qty = stock_qty + ? WHERE product_id = ? AND crafter_id = ?', [item.quantity, item.product_id, item.crafter_id], (err4) => {
                            updateCount++;
                            if (err4) {
                                console.error(`Error updating inventory for product ${item.product_id}, crafter ${item.crafter_id}:`, err4);
                            }
                            // Respond after all updates attempted
                            if (updateCount === items.length) {
                                return res.status(200).json({ message: "Order status updated and inventory restored", newStatus: status });
                            }
                        });
                    });
                });
            } else {
                res.status(200).json({ message: "Order status updated", newStatus: status });
            }
        });
    });
};

module.exports = {
    getOrdersWithDetails,
    getOrderDetails,
    getCrafters,
    assignCrafter,
    updateStatus,
    updateOrderStatus,
};

