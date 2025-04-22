import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "./Cart.css"; // Import styles for the cart page

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false); // State to toggle the form
  const [address, setAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const token = localStorage.getItem("token");

  // Fetch cart items
  useEffect(() => {
    fetch("http://localhost:5000/api/cart/items", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const groupedItems = [];
        data.forEach((item) => {
          const normalizedCustomization = item.customizations?.length ? item.customizations : null;
          const match = groupedItems.find((existing) => {
            const existingCustomization = existing.customizations?.length ? existing.customizations : null;
            return (
              existing.product_id === item.product_id &&
              JSON.stringify(existingCustomization) === JSON.stringify(normalizedCustomization)
            );
          });
          if (match) {
            match.quantity += item.quantity;
          } else {
            groupedItems.push({ ...item, customizations: normalizedCustomization });
          }
        });
        setCartItems(groupedItems);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cart items:", err);
        setLoading(false);
      });
  }, [token]);

  // Fetch saved address
  useEffect(() => {
    fetch("http://localhost:5000/api/customers/save-address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
      body: JSON.stringify({}), // No address details needed for fetching
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.address) {
          // Map backend keys to frontend state keys
          setAddress({
            addressLine1: data.address.address_line1 || "",
            addressLine2: data.address.address_line2 || "",
            city: data.address.city || "",
            province: data.address.province || "",
            postalCode: data.address.postal_code || "",
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching saved address:", err);
      });
  }, [token]);
  
  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleRemove = (id) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.cart_item_id !== id));
    setSelectedItems((prevSelected) => prevSelected.filter((itemId) => itemId !== id));

    fetch(`http://localhost:5000/api/cart/remove-item/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
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

  const handleCheckout = () => {
    setShowCheckoutForm(true); // Show the checkout form
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleSaveAddress = () => {
    fetch("http://localhost:5000/api/customers/save-address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
      body: JSON.stringify({ ...address }), // Send only the address details
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save address");
        }
        return res.json();
      })
      .then((data) => {
        if (data.address) {
          // If an address already exists, pre-fill the form
          setAddress(data.address);
          alert("Address already exists and has been loaded.");
        } else {
          alert("Address saved successfully!");
        }
      })
      .catch((err) => {
        console.error("Error saving address:", err);
        alert("Failed to save address. Please try again.");
      });
  };

  const handlePlaceOrder = () => {
    const shippingAddress = `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.province}, ${address.postalCode}`;

    fetch("http://localhost:5000/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include the token for authentication
      },
      body: JSON.stringify({ shipping_address: shippingAddress }), // Send the shipping address
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to place order");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Order placed successfully:", data);
        alert("Order placed successfully!");
        // Optionally, redirect to an order confirmation page or clear the cart
      })
      .catch((err) => {
        console.error("Error placing order:", err);
        alert("Failed to place order. Please try again.");
      });
  };

  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.cart_item_id));
  const subtotal = selectedCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="cart-container">
        <h2>Shopping Cart ({cartItems.length} items)</h2>
        <div className="cart-content">
          {/* Cart Items Section */}
          <div className="cart-items">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div className="cart-item" key={item.cart_item_id}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.cart_item_id)}
                    onChange={() => handleSelectItem(item.cart_item_id)}
                  />
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
            {selectedCartItems.length > 0 ? (
              <>
                {selectedCartItems.map((item) => (
                  <p key={item.cart_item_id}>
                    {item.name} x {item.quantity}: Rs{(item.price * item.quantity).toFixed(2)}
                  </p>
                ))}
                <p>Subtotal: Rs{subtotal.toFixed(2)}</p>
                <p>Shipping: Free</p>
                <h3>Total: Rs{total.toFixed(2)}</h3>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <p>No items selected.</p>
            )}
          </div>
        </div>

        {showCheckoutForm && (
          <div className="checkout-popup">
            <div className="popup-content">
              {/* Close Button */}
              <button className="close-popup-btn" onClick={() => setShowCheckoutForm(false)}>
                &times;
              </button>
              {/* Address Section */}
              <div className="address-section">
                <h3>Shipping Address</h3>
                <form>
                  <div className="form-group">
                    <input
                      type="text"
                      name="addressLine1"
                      value={address.addressLine1}
                      onChange={handleAddressChange}
                      placeholder="Address Line 1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="addressLine2"
                      value={address.addressLine2}
                      onChange={handleAddressChange}
                      placeholder="Address Line 2"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="province"
                      value={address.province}
                      onChange={handleAddressChange}
                      placeholder="Province"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={handleAddressChange}
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                  <button type="button" className="save-address-btn" onClick={handleSaveAddress}>
                    Save Address
                  </button>
                </form>
              </div>

              {/* Payment Section */}
              <div className="payment-section">
                <h3>Payment Details</h3>
                <p>Payment process will go here (e.g., card details, etc.).</p>
              </div>
            </div>

            {/* Place Order Button */}
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;