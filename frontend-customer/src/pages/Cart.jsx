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
 // Replace only the useEffect hook that fetches cart items

useEffect(() => {
  fetch("http://localhost:5000/api/cart/items", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Original cart data:", data);
      
      // Create a map to group items with the same product_id and customizations
      const groupedMap = new Map();
      
      data.forEach((item) => {
        // Create a unique key based on product_id and serialized customizations
        const customizationString = item.customizations && item.customizations.length 
          ? JSON.stringify(item.customizations) 
          : "no_customization";
          
        const itemKey = `${item.product_id}_${customizationString}`;
        
        if (groupedMap.has(itemKey)) {
          // If this item already exists in our map, update its quantity
          const existingItem = groupedMap.get(itemKey);
          existingItem.quantity += item.quantity;
          
          // Update the map
          groupedMap.set(itemKey, existingItem);
        } else {
          // If this is a new item, add it to the map
          groupedMap.set(itemKey, { ...item });
        }
      });
      
      // Convert the map values back to an array
      const groupedItems = Array.from(groupedMap.values());
      console.log("Grouped cart items:", groupedItems);
      
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

  const handleQuantityChange = (itemId, change) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.cart_item_id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change);
          
          // Update quantity on the server
          updateItemQuantity(itemId, newQuantity);
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };
  
  const updateItemQuantity = (itemId, newQuantity) => {
    fetch(`http://localhost:5000/api/cart/update-quantity/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: newQuantity }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to update quantity");
        }
        return response.json();
      })
      .catch(error => console.error("Error updating quantity:", error));
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
                    src={item.image?.startsWith("/uploads") ? `http://localhost:5000${item.image}` : item.image}
                    alt={item.name}
                    className="cart-image"
                  />
                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    
                    {/* Display customization details if they exist */}
                    {item.customizationDisplay && (
                      <div className="customization-details">
                        <span className="custom-tag">Customized</span>
                        <p className="customization-text">{item.customizationDisplay}</p>
                      </div>
                    )}
                    
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
                    {item.name} {item.customizationDisplay ? `(${item.customizationDisplay})` : ""} x {item.quantity}: Rs{(item.price * item.quantity).toFixed(2)}
                  </p>
                ))}
                <p>Subtotal: Rs{subtotal.toFixed(2)}</p>
                
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
                <h3>Delivery Address</h3>
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