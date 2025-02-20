// server.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/user", userRoutes); // User routes

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
