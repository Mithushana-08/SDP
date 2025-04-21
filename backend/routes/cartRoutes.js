const express = require("express");
const { addToCart , getCartItems , removeCartItem } = require("../controllers/cartController");
const authenticateCustomer = require("../middleware/customerAuthMiddleware");

const router = express.Router();

// Define the route for adding items to the cart
router.post("/add", authenticateCustomer, addToCart);
router.get("/items", authenticateCustomer, getCartItems);
router.delete("/remove-item/:id", authenticateCustomer, removeCartItem);

module.exports = router;