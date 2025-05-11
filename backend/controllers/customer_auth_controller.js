const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const db = require("../config/db");
const authenticateCustomer = require("../middleware/customerAuthMiddleware"); // Import middleware

const secretKey = process.env.JWT_SECRET_KEY;

// Login a user and generate a token
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query the database for the user
        const query = "SELECT * FROM Customer WHERE email = ?";
        const [user] = await db.query(query, [email]);

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords (assuming plain text for simplicity)
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            {
                email: user.email, // User email
                customer_id: user.Customer_id, // Customer ID
            },
            secretKey, // Secret key for signing the token
            { expiresIn: "1h" } // Token expiry time
        );

        // Include user data in the response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                customer_id: user.Customer_id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                address_line1: user.address_line1,
                address_line2: user.address_line2,
                city: user.city,
                province: user.province,
                postal_code: user.postal_code,
            },
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
};
// Register a new user
// Register a new user
const registerUser = async (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;

    try {
        // Check if the email already exists
        const emailCheckQuery = "SELECT * FROM Customer WHERE email = ?";
        const existingUser = await db.query(emailCheckQuery, [email]); // Use promisified query

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Concatenate first_name and last_name to create the username
        const username = `${first_name} ${last_name}`;

        // Insert the new user into the Customer table
        const insertCustomerQuery = `
            INSERT INTO Customer (first_name, last_name, username, email, phone, password)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(insertCustomerQuery, [first_name, last_name, username, email, phone, password]);

        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "An error occurred during registration" });
    }
};
// Example of a protected route using the middleware
const getCustomerProfile = [
    authenticateCustomer, // Use the middleware to authenticate the customer
    async (req, res) => {
        const customerId = req.user.customer_id; // Extract customer_id from the token

        try {
            const query = "SELECT * FROM Customer WHERE Customer_id = ?";
            const [customer] = await db.query(query, [customerId]);

            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }

            res.status(200).json({ customer });
        } catch (error) {
            console.error("Error fetching customer profile:", error);
            res.status(500).json({ message: "An error occurred while fetching the profile" });
        }
    },
];

module.exports = { loginUser, registerUser, getCustomerProfile };