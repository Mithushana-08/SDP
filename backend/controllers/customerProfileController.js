const db = require('../config/db'); // Import your database connection

// Fetch customer profile details
const getCustomerProfile = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user

    // Query to fetch customer details
    const customerQuery = `
        SELECT first_name, last_name,username, email, phone
        FROM Customer
        WHERE Customer_id = ?
    `;

    // Query to fetch the latest saved address
    const addressQuery = `
        SELECT address_line1, address_line2, city, district, postal_code
        FROM addresses
        WHERE Customer_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    // Execute both queries
    db.query(customerQuery, [customerId], (err, customerResults) => {
        if (err) {
            console.error("Error fetching customer details:", err);
            return res.status(500).json({ error: "Failed to fetch customer details" });
        }

        if (customerResults.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customerResults[0];

        db.query(addressQuery, [customerId], (err, addressResults) => {
            if (err) {
                console.error("Error fetching address details:", err);
                return res.status(500).json({ error: "Failed to fetch address details" });
            }

            const address = addressResults.length > 0 ? addressResults[0] : null;

            // Combine customer and address details in the response
            res.status(200).json({
                customer,
                address,
            });
        });
    });
};

// Update customer profile details
const { updateAddress } = require('./customercontroller'); // Import updateAddress function

const updateCustomerProfile = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user
    const { first_name, last_name, email, phone, address_line1, address_line2, city, district, postal_code } = req.body;

    console.log("Request body:", req.body); // Debugging: Log the incoming data

    // Query to update customer details
    const updateCustomerQuery = `
        UPDATE Customer
        SET first_name = ?, last_name = ?, email = ?, phone = ?, username = CONCAT(?, ' ', ?)
        WHERE Customer_id = ?
    `;

    // Execute the customer update query
    db.query(updateCustomerQuery, [first_name, last_name, email, phone, first_name, last_name, customerId], (err) => {
        if (err) {
            console.error("Error updating customer details:", err);
            return res.status(500).json({ error: "Failed to update customer details" });
        }

        // Map property names to match what updateAddress expects
        const addressData = {
            addressLine1: address_line1,
            addressLine2: address_line2,
            city,
            district,
            postalCode: postal_code,
        };

        // Call the updateAddress function to update or insert the address
        updateAddress({ body: addressData, user: { customer_id: customerId } }, res); // Pass req-like object to updateAddress
    });
};
// Fetch all orders for a customer
const getOrdersByCustomer = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user

    // Query to fetch all orders for the customer
    const ordersQuery = `
        SELECT o.order_id, o.order_date, o.status, SUM(oi.quantity * oi.price) AS total_amount
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.customer_id = ?
        GROUP BY o.order_id, o.order_date, o.status
        ORDER BY o.order_date DESC
    `;

    db.query(ordersQuery, [customerId], (err, orders) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }

        res.status(200).json({ orders });
    });
};

// Fetch details of a specific order
const getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    // Query to fetch order details, now including product image and customizations
    const orderDetailsQuery = `
        SELECT o.order_id, o.order_date, o.status, oi.product_id, p.product_name, p.image, oi.quantity, oi.price,
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
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN product_master p ON oi.product_id = p.product_id
        WHERE o.order_id = ?
    `;

    db.query(orderDetailsQuery, [orderId], (err, orderDetails) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }

        if (orderDetails.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Group order details by order, now including product image and customizations
        const order = {
            orderId: orderDetails[0].order_id,
            orderDate: orderDetails[0].order_date,
            status: orderDetails[0].status,
            items: orderDetails.map((item) => {
                // Parse customization JSON and only include if at least one value is not null and type is not null
                let customObj = null;
                if (item.customizations) {
                    try {
                        const parsed = JSON.parse(item.customizations);
                        // If all values are null or type is null, treat as no customization
                        const hasCustomization = Object.values(parsed).some(v => v !== null) && parsed.type !== null;
                        if (hasCustomization) {
                            customObj = parsed;
                        }
                    } catch (e) { /* ignore parse errors */ }
                }
                return {
                    productId: item.product_id,
                    productName: item.product_name,
                    productImage: item.image, // Add image URL
                    quantity: item.quantity,
                    price: item.price,
                    customizations: customObj ? [customObj] : [],
                };
            }),
        };

        res.status(200).json({ order });
    });
};

module.exports = { getCustomerProfile, updateCustomerProfile, getOrdersByCustomer, getOrderDetails };

