import React, { useState } from 'react';
import Navbar from '../components/Navbar'; // Import the Navbar component
import './Cart.css'; // Import styles for the cart page

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Coconut Shell Candle Holder",
      price: 24.99,
      quantity: 2,
      image: "https://via.placeholder.com/80", // Replace with actual image
    },
    {
      id: 2,
      name: "Wooden Photo Frame (Customized)",
      price: 39.99,
      quantity: 1,
      image: "https://via.placeholder.com/80", // Replace with actual image
      customized: true,
    },
  ]);

  const handleQuantityChange = (id, change) => {
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const handleRemove = (id) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div>
      <Navbar /> {/* Add Navbar */}
      <div className="cart-container">
        <h2>Shopping Cart ({cartItems.length} items)</h2>
        <div className="cart-content">
          {/* Cart Items Section */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-image" />
                <div className="cart-details">
                  <h3>{item.name}</h3>
                  {item.customized && <span className="custom-tag">Customized</span>}
                  <div className="cart-actions">
                    <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                  </div>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                  <button className="remove-btn" onClick={() => handleRemove(item.id)}>X</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Section */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Shipping: Free</p>
            <h3>Total: ${total.toFixed(2)}</h3>
            <div className="promo">
              <input type="text" placeholder="Enter code" />
              <button className="apply-btn">Apply</button>
            </div>
            <button className="checkout-btn">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;