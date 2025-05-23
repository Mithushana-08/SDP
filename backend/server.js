const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const customerAuthRoutes = require("./routes/customer_authRoutes"); // Import customer_authRoutes
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const productRoutes = require("./routes/productRoutes");
const productmaster = require("./routes/productmasterRoutes");
const customerRoutes = require("./routes/customerRoutes"); // Import 
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes"); // Import the admin order routes
const profileRoutes = require("./routes/ProfileRoutes");
const customerProfileRoutes = require('./routes/CustomerProfileRoutes');
const crafterRoutes = require("./routes/crafterassignmentsRoutes");
const ReportRoutes = require('./routes/ReportRoutes'); // Import the report routes
const dashboardRoutes = require("./routes/dashboardRoutes"); // Import the dashboard routes
const crafterDashboardRoutes = require("./routes/cdashboardRoutes"); // Import the crafter dashboard routes
const notificationRoutes = require("./routes/notificationRoutes"); // Import notification routes
const crafterNotificationRoutes = require("./routes/crafterNotificationRoutes"); // Import crafter notification routes
// Mount the admin order routes


const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer/auth", customerAuthRoutes); // Add customer authentication routes
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/productmaster", productmaster);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images
app.use("/api/customers", customerRoutes);
app.use("/api/customer", customerRoutes); // Handles /api/customer/delete-account, etc.
app.use("/api/customer/profile", customerProfileRoutes); // Mount profile routes at a subpath to avoid shadowing
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminOrderRoutes);
app.use("/api/profile", profileRoutes); // Add profile routes
app.use("/api/crafter", crafterRoutes);
app.use('/api/reports', ReportRoutes); 
app.use('/api/dashboard', dashboardRoutes); // Add dashboard routes
app.use('/api/crafter-dashboard', crafterDashboardRoutes); // Add crafter dashboard routes
app.use("/api/notifications", notificationRoutes); // Add notification routes
app.use("/api/crafter", crafterNotificationRoutes); // Add crafter notification routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});