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

    const query = `
        UPDATE order_items
        SET status = ?
        WHERE item_id = ?
    `;

    pool.query(query, [status, item_id], (err, result) => {
        if (err) {
            console.error("Error updating order item status:", err);
            return res.status(500).json({ error: "Failed to update order item status" });
        }

        console.log("Query result:", result); // Log the query result

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Order item not found" });
        }

        res.status(200).json({ message: "Order item status updated successfully" });
    });
};

module.exports = { getAssignedOrders , updateOrderItemStatus };