const pool = require("../config/db");

const getAssignedOrders = async (req, res) => {
    try {
        const crafterId = req.user.id;
        console.log("Decoded JWT user:", req.user);
        console.log("Fetching orders for crafterId:", crafterId);

        const query = `
            SELECT 
                oi.item_id,
                oi.order_id,
                pm.product_name,
                oi.status,
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
            FROM order_items oi
            INNER JOIN product_master pm ON oi.product_id = pm.product_id
            WHERE oi.crafter_id = ?
            GROUP BY oi.item_id, oi.order_id, pm.product_name, oi.status
        `;

        // Execute the query
        const result = await pool.query(query, [crafterId]);
        console.log("Full query result:", result);

        // Extract rows from the result
        const rows = Array.isArray(result) ? result : result[0];
        console.log("Extracted rows:", rows);

        // Ensure rows is an array
        if (!Array.isArray(rows)) {
            throw new Error("Query result is not an array");
        }

        // Process the results to parse customizations
        const formattedAssignments = rows.map(item => ({
            item_id: item.item_id,
            order_id: item.order_id,
            product_name: item.product_name,
            status: item.status,
            is_customizable: item.is_customizable,
            customizations: item.customizations ? JSON.parse(item.customizations) : { type: null, value: null, size: null, image: null }
        }));

        console.log("Formatted assignments:", formattedAssignments);
        res.status(200).json(formattedAssignments);
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const updateOrderItemStatus = (req, res) => {
    const { item_id, status } = req.body;

    console.log("Request body:", req.body); // Log the request body

    if (!item_id || !status) {
        return res.status(400).json({ error: "Item ID and status are required" });
    }

    const validItemStatuses = ['Pending', 'Confirmed', 'Completed', 'Ready to Deliver'];
    if (!validItemStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    const updateItemQuery = `
        UPDATE order_items
        SET status = ?
        WHERE item_id = ?
    `;

    pool.query(updateItemQuery, [status, item_id], (err, result) => {
        if (err) {
            console.error("Error updating order item status:", err);
            return res.status(500).json({ error: "Failed to update order item status" });
        }

        console.log("Query result:", result); // Log the query result

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Order item not found" });
        }

        // Fetch the order ID for the updated item
        const fetchOrderIdQuery = `
            SELECT order_id
            FROM order_items
            WHERE item_id = ?
        `;

        pool.query(fetchOrderIdQuery, [item_id], (err, orderResult) => {
            if (err) {
                console.error("Error fetching order ID:", err);
                return res.status(500).json({ error: "Failed to fetch order ID" });
            }

            if (orderResult.length === 0) {
                return res.status(404).json({ error: "Order not found for the given item" });
            }

            const orderId = orderResult[0].order_id;

            // Fetch all items for the order to determine the overall status
            const orderDetailsQuery = `
                SELECT 
                    oi.item_id, oi.status,
                    CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END AS is_customizable
                FROM order_items oi
                LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
                WHERE oi.order_id = ?
            `;

            pool.query(orderDetailsQuery, [orderId], (err, items) => {
                if (err) {
                    console.error("Error fetching order items:", err);
                    return res.status(500).json({ error: "Failed to fetch order items" });
                }

                console.log("Order items fetched:", JSON.stringify(items, null, 2));

                // Extract customizable and non-customizable items
                const customizableItems = items.filter(item => item.is_customizable === 1);
                const nonCustomizableItems = items.filter(item => item.is_customizable === 0);

                const hasCustomizable = customizableItems.length > 0;
                const hasNonCustomizable = nonCustomizableItems.length > 0;

                const allItemsConfirmed = items.every(item =>
                    ['Confirmed', 'Completed', 'Ready to Deliver'].includes(item.status)
                );

                const allCustomizableCompleted = customizableItems.length > 0 &&
                    customizableItems.every(item =>
                        ['Completed', 'Ready to Deliver'].includes(item.status)
                    );

                const allNonCustomizableConfirmed = nonCustomizableItems.length > 0 &&
                    nonCustomizableItems.every(item =>
                        ['Confirmed', 'Completed', 'Ready to Deliver'].includes(item.status)
                    );

                console.log("Order Analysis:");
                console.log("hasCustomizable:", hasCustomizable);
                console.log("hasNonCustomizable:", hasNonCustomizable);
                console.log("allItemsConfirmed:", allItemsConfirmed);
                console.log("allCustomizableCompleted:", allCustomizableCompleted);
                console.log("allNonCustomizableConfirmed:", allNonCustomizableConfirmed);

                let newOrderStatus = null;

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

                console.log("New Order Status:", newOrderStatus);

                if (newOrderStatus) {
                    const updateOrderQuery = `
                        UPDATE orders
                        SET status = ?
                        WHERE order_id = ?
                    `;

                    pool.query(updateOrderQuery, [newOrderStatus, orderId], (err, updateResult) => {
                        if (err) {
                            console.error("Error updating order status:", err);
                            return res.status(500).json({ error: "Failed to update order status" });
                        }

                        console.log("Update order status result:", updateResult);

                        res.status(200).json({
                            message: "Order item status updated successfully",
                            newOrderStatus,
                        });
                    });
                } else {
                    res.status(200).json({
                        message: "Order item status updated successfully, order status unchanged",
                    });
                }
            });
        });
    });
};
module.exports = { getAssignedOrders , updateOrderItemStatus };