const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const productRoutes = require('./routes/productRoutes');  // Double-check this is correct

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);  // Product routes (correct path)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
