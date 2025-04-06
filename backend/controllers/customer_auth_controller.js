const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const db = require("../config/db"); 

const secretKey = process.env.JWT_SECRET_KEY;

// Mock database (replace with actual database queries)
const users = [];

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
                id: user.id, // User ID
                email: user.email, // User email
            },
            secretKey, // Secret key for signing the token
            { expiresIn: "1h" } // Token expiry time
        );

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
};

// Register a new user


// Register a new user
const registerUser = async (req, res) => {
    const { username, email, phone, password, address_line1, address_line2, city, province, postal_code } = req.body;

    try {
        // Check if the email already exists
        const emailCheckQuery = "SELECT * FROM Customer WHERE email = ?";
        const existingUser = await db.query(emailCheckQuery, [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Insert the new user into the Customer table
        const customerId = uuidv4().slice(0, 10); // Trim UUID to match VARCHAR(10)
        const insertCustomerQuery = `
            INSERT INTO Customer (Customer_id, username, email, phone, password)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(insertCustomerQuery, [customerId, username, email, phone, password]);

      

        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "An error occurred during registration" });
    }
};


module.exports = { loginUser, registerUser };