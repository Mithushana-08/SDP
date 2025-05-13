const db = require("../config/db");

// Fetch all orders with details
const getOrdersWithDetails = (req, res) => {
    const query = `
        SELECT 
            o.order_id, o.order_date, o.total_amount, o.status, o.shipping_address,
            c.username AS customer_name, c.phone AS customer_phone,
            COUNT(oi.item_id) AS product_count,
            SUM(CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END) AS customizable_count
        FROM orders o
        JOIN customer c ON o.customer_id = c.customer_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
        GROUP BY o.order_id
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

// Fetch details of a specific order
const getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    const query = `
       SELECT 
    oi.item_id, oi.product_id, oi.quantity, oi.price, oi.total_price, p.product_name, oi.status,
    c.CategoryName AS category_name, cd.customization_type, cd.customization_value, cd.uploaded_image, cd.size_type,
    oi.crafter_id, -- Added
    u.username AS crafter_username,
    SUM(CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END) AS customizable_count
FROM order_items oi
JOIN product_master p ON oi.product_id = p.product_id
JOIN Categories c ON p.category_id = c.CategoryID
LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
LEFT JOIN users u ON oi.crafter_id = u.id
WHERE oi.order_id = ?
GROUP BY 
    oi.item_id, oi.product_id, oi.quantity, oi.price, oi.total_price, 
    p.product_name, c.CategoryName, 
    cd.customization_type, cd.customization_value, cd.uploaded_image, cd.size_type,
    oi.crafter_id, -- Added
    u.username;

    
`

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }
        res.json(results);
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

module.exports = {
    getOrdersWithDetails,
    getOrderDetails,
    getCrafters,
    assignCrafter,
    updateStatus,
};

