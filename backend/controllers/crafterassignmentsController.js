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
                cd.customization_type,
                cd.customization_value,
                cd.uploaded_image,
                cd.size_type
            FROM order_items oi
            INNER JOIN product_master pm ON oi.product_id = pm.product_id
            LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
            WHERE oi.crafter_id = ?
        `;

        // Execute the query and log the full result
        const result = await pool.query(query, [crafterId]);
        console.log("Full query result:", result);

        // Extract rows from the result
        const rows = Array.isArray(result) ? result : result[0];
        console.log("Extracted rows:", rows);

        // Ensure rows is an array
        if (!Array.isArray(rows)) {
            throw new Error("Query result is not an array");
        }

        // Map rows to formatted assignments
        const formattedAssignments = rows.map((row) => {
            const customizationDetails = row.customization_type
                ? `Type: ${row.customization_type || "N/A"}, Value: ${row.customization_value || "N/A"}, Image: ${row.uploaded_image || "N/A"}, Size: ${row.size_type || "N/A"}`
                : "No customization";

            return {
                item_id: row.item_id,
                order_id: row.order_id,
                product_name: row.product_name,
                customization_details: customizationDetails,
                status: row.status,
            };
        });

        console.log("Formatted assignments:", formattedAssignments);
        res.status(200).json(formattedAssignments); // Send all formatted assignments
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