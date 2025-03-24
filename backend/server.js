const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const productRoutes = require('./routes/productRoutes'); 
const productmaster = require('./routes/productmasterRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());  // Use express.json() instead of bodyParser.json()

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/productmaster", productmaster); 
app.use('/uploads', express.static('uploads')); // Serve images

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});