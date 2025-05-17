const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const db = require("../config/db");
const authenticateCustomer = require("../middleware/customerAuthMiddleware");
const transporter = require("../utils/nodemailer");

const secretKey = process.env.JWT_SECRET_KEY;

// Generate 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM Customer WHERE email = ?";
    const [user] = await db.query(query, [email]);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        email: user.email,
        customer_id: user.Customer_id,
      },
      secretKey,
      { expiresIn: "1h" }
    );

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

const registerUser = async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  try {
    const emailCheckQuery = "SELECT * FROM Customer WHERE email = ?";
    const existingUser = await db.query(emailCheckQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const username = `${first_name} ${last_name}`;

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

const getCustomerProfile = [
  authenticateCustomer,
  async (req, res) => {
    const customerId = req.user.customer_id;

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

// Step 1: Send verification code
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.query('DELETE FROM reset_codes WHERE email = ?', [email]);
    await db.query(
      'INSERT INTO reset_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Crafttary Password Reset Code',
      text: `Your verification code is: ${code}\nThis code expires in 15 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send code' });
  }
};

// Step 2: Verify code
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM reset_codes WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, code]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    res.json({ message: 'Code verified' });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Step 3: Reset password
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const [codeRows] = await db.query(
      'SELECT * FROM reset_codes WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, code]
    );
    if (codeRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await db.query('UPDATE Customer SET password = ? WHERE email = ?', [newPassword, email]);
    await db.query('DELETE FROM reset_codes WHERE email = ?', [email]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getCustomerProfile,
  forgotPassword,
  verifyCode,
  resetPassword,
};