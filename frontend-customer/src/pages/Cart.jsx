import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "./Cart.css"; // Import styles for the cart page

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retrieve the token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch cart items from the backend
    fetch("http://localhost:5000/api/cart/items", {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch cart items");
        }
        return response.json();
      })
      .then((data) => {
        setCartItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching cart items:", error);
        setLoading(false);
      });
  }, [token]);

  const handleAddToCart = (product_id, quantity, price, customizations = []) => {
    // Add item to the cart in the backend
    fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
      body: JSON.stringify({ product_id, quantity, price, customizations }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add item to cart");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Item added to cart:", data);
        // Optionally, refresh the cart items after adding
        setCartItems((prevCart) => [...prevCart, data.item]);
      })
      .catch((error) => {
        console.error("Error adding item to cart:", error);
      });
  };

  const handleQuantityChange = (id, change) => {
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.cart_item_id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );

    // Update quantity in the backend
    fetch(`http://localhost:5000/api/cart/update-quantity`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
      body: JSON.stringify({ cart_item_id: id, change }),
    }).catch((error) => console.error("Error updating quantity:", error));
  };

  const handleRemove = (id) => {
    console.log("Removing cart item with ID:", id); // Debugging

    setCartItems((prevCart) => prevCart.filter((item) => item.cart_item_id !== id));

    // Remove item from the backend
    fetch(`http://localhost:5000/api/cart/remove-item/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Failed to remove cart item");
        }
        return response.json();
    })
    .then((data) => {
        console.log("Cart item removed successfully:", data);
    })
    .catch((error) => console.error("Error removing item:", error));
};
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar /> {/* Add Navbar */}
      <div className="cart-container">
        <h2>Shopping Cart ({cartItems.length} items)</h2>
        <div className="cart-content">
          {/* Cart Items Section */}
          <div className="cart-items">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div className="cart-item" key={item.cart_item_id}>
                  <img
                    src={item.image.startsWith("/uploads") ? `http://localhost:5000${item.image}` : item.image}
                    alt={item.name}
                    className="cart-image"
                  />
                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    {item.customized && <span className="custom-tag">Customized</span>}
                    <div className="cart-actions">
                      <button onClick={() => handleQuantityChange(item.cart_item_id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.cart_item_id, 1)}>+</button>
                    </div>
                    <p>Rs{(item.price * item.quantity).toFixed(2)}</p>
                    <button className="remove-btn" onClick={() => handleRemove(item.cart_item_id)}>X</button>
                  </div>
                </div>
              ))
            ) : (
              <p>Your cart is empty.</p>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <p>Subtotal: Rs{subtotal.toFixed(2)}</p>
            <p>Shipping: Free</p>
            <h3>Total: Rs{total.toFixed(2)}</h3>
           
            <button className="checkout-btn">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;