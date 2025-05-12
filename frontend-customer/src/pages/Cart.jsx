import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "./Cart.css";
import { FiTrash2, FiShoppingCart, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [address, setAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
const [paymentDetails, setPaymentDetails] = useState({
  email: "",
  cardHolder: "",
  cardNumber: "", // Single field for the full card number
  expiryDate: "",
  cvv: "",
});
  const [paymentErrors, setPaymentErrors] = useState({});

  const navigate = useNavigate();
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
        console.log("Original cart data:", data);

        const groupedMap = new Map();
        data.forEach((item) => {
          const customizationString = item.customizations && item.customizations.length
            ? JSON.stringify(item.customizations)
            : "no_customization";

          const itemKey = `${item.product_id}_${customizationString}`;
          if (groupedMap.has(itemKey)) {
            const existingItem = groupedMap.get(itemKey);
            existingItem.quantity += item.quantity;
            groupedMap.set(itemKey, existingItem);
          } else {
            groupedMap.set(itemKey, { ...item });
          }
        });

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

  // Fetch saved address when checkout form is opened
  useEffect(() => {
    if (showCheckoutForm) {
      fetch("http://localhost:5000/api/customers/save-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.address) {
            setAddress({
              addressLine1: data.address.address_line1 || "",
              addressLine2: data.address.address_line2 || "",
              city: data.address.city || "",
              province: data.address.province || "",
              postalCode: data.address.postal_code || "",
            });
            setIsAddressSaved(true);
          } else {
            setAddress({
              addressLine1: "",
              addressLine2: "",
              city: "",
              province: "",
              postalCode: "",
            });
            setIsAddressSaved(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching saved address:", err);
          setIsAddressSaved(false);
        });
    }
  }, [showCheckoutForm, token]);

  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleQuantityChange = (itemId, change) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cart_item_id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change);
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
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update quantity");
        }
        return response.json();
      })
      .catch((error) => console.error("Error updating quantity:", error));
  };

  const handleRemove = (id) => {
    setCartItems((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.cart_item_id !== id);
      setSelectedItems((prevSelected) => prevSelected.filter((itemId) => itemId !== id));
      return updatedCart;
    });

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

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedItems([]);

    fetch("http://localhost:5000/api/cart/clear", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to clear cart");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Cart cleared successfully:", data);
      })
      .catch((error) => console.error("Error clearing cart:", error));
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleCheckout = () => {
    setShowCheckoutForm(true);
    setCheckoutStep(1);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleSaveAddress = () => {
    if (!address.addressLine1 || !address.city || !address.province || !address.postalCode) {
      alert("Please fill in all required fields.");
      return;
    }

    const endpoint = isAddressSaved
      ? "http://localhost:5000/api/customers/address"
      : "http://localhost:5000/api/customers/save-address";

    const method = isAddressSaved ? "PUT" : "POST";

    fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...address }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save address");
        }
        return res.json();
      })
      .then((data) => {
        setIsAddressSaved(true);
        alert(isAddressSaved ? "Address updated successfully!" : "Address saved successfully!");
        if (data.address) {
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
        console.error("Error saving address:", err);
        alert("Failed to save address. Please try again.");
      });
  };

  const handlePlaceOrder = () => {
  if (!isAddressSaved) {
    alert("Please save your address before placing the order.");
    return;
  }

  if (!address.addressLine1 || !address.city || !address.province || !address.postalCode) {
    alert("Your saved address is incomplete. Please update your address.");
    return;
  }

  if (checkoutStep !== 3) {
    alert("Please complete the payment process before placing the order.");
    return;
  }

  const shippingAddress = `${address.addressLine1}, ${address.addressLine2 || ""}, ${address.city}, ${address.province}, ${address.postalCode}`;

  fetch("http://localhost:5000/api/orders/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipping_address: shippingAddress }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw new Error(data.error || "Failed to place order");
        });
      }
      return res.json();
    })
    .then((data) => {
      console.log("Order placed successfully:", data);
      alert("Order placed successfully!");
      setShowCheckoutForm(false);
      setCartItems([]);
      setSelectedItems([]);
      setCheckoutStep(1);
    })
    .catch((err) => {
      console.error("Error placing order:", err);
      if (err.message.includes("Insufficient stock")) {
        alert("Some items in your cart are out of stock. Please update your cart and try again.");
      } else {
        alert("Failed to place order. Please try again.");
      }
    });
};

 const handlePaymentChange = (e) => {
  const { name, value } = e.target;

  let updatedValue = value;

  if (name === "cardNumber") {
    // Remove all non-digit characters
    updatedValue = value.replace(/\D/g, "");

    // Format as XXXX XXXX XXXX XXXX
    updatedValue = updatedValue
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  } else if (name === "expiryDate") {
    // Remove all non-digit characters
    updatedValue = value.replace(/\D/g, "");

    // Format expiry date as MM/YY
    if (updatedValue.length > 2) {
      const month = parseInt(updatedValue.slice(0, 2), 10);

      // Ensure month is valid (1-12)
      if (month > 12) {
        updatedValue = "12" + updatedValue.slice(2);
      }

      updatedValue = updatedValue.slice(0, 2) + "/" + updatedValue.slice(2, 4);
    }
  }

  setPaymentDetails((prevDetails) => ({
    ...prevDetails,
    [name]: updatedValue,
  }));

  // Clear error for the field being edited
  setPaymentErrors((prevErrors) => ({
    ...prevErrors,
    [name]: "",
  }));
};

  const handleCardNumberFocus = (e) => {
    const { name } = e.target;
    const index = parseInt(name.replace("cardNumber", "")) - 1;
    if (index < 3 && paymentDetails[`cardNumber${index + 2}`]) {
      document.querySelector(`input[name="cardNumber${index + 2}"]`).focus();
    }
  };

const validatePaymentDetails = () => {
  const errors = {};

  // Card number validation
  const cardNumberRegex = /^\d{4} \d{4} \d{4} \d{4}$/;
  if (!paymentDetails.cardNumber || !cardNumberRegex.test(paymentDetails.cardNumber)) {
    errors.cardNumber = "Card number must be in the format XXXX XXXX XXXX XXXX.";
  }

  // Expiry date validation (MM/YY format and future date)
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!paymentDetails.expiryDate || !expiryRegex.test(paymentDetails.expiryDate)) {
    errors.expiryDate = "Expiry date must be in MM/YY format.";
  } else {
    const [month, year] = paymentDetails.expiryDate.split("/").map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Last two digits of the year
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiryDate = "Expiry date must be in the future.";
    }
  }

  // CVV validation
  const cvvRegex = /^\d{3,4}$/;
  if (!paymentDetails.cvv || !cvvRegex.test(paymentDetails.cvv)) {
    errors.cvv = "CVV must be 3 or 4 digits.";
  }

  setPaymentErrors(errors);
  return Object.keys(errors).length === 0;
};
  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (!isAddressSaved) {
        alert("Please save your address before proceeding.");
        return;
      }
      setCheckoutStep(2);
    }
  };

  const handleBackStep = () => {
    if (checkoutStep === 2) {
      setCheckoutStep(1);
    }
  };

  const handleConfirmPayment = () => {
    if (validatePaymentDetails()) {
      setCheckoutStep(3);
    }
  };

  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.cart_item_id));
  const subtotal = selectedCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="cart-container">
        <h2 className="cart-title">Your Cart</h2>
        {cartItems.length > 0 ? (
          <div className="cart-content">
            <div className="cart-items">
              <div className="cart-table-header">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              {cartItems.map((item) => (
                <div className="cart-item" key={item.cart_item_id}>
                  <div className="cart-product">
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
                    <div className="cart-product-details">
                      <h3>{item.name}</h3>
                      {item.customizationDisplay && (
                        <div className="customization-details">
                          <span className="custom-tag">Customized</span>
                          <p className="customization-text">{item.customizationDisplay}</p>
                        </div>
                      )}
                      <button className="remove-btn" onClick={() => handleRemove(item.cart_item_id)}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-price">
                    <p>Rs{item.price.toFixed(2)}</p>
                  </div>
                  <div className="cart-quantity">
                    <button onClick={() => handleQuantityChange(item.cart_item_id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.cart_item_id, 1)}>+</button>
                  </div>
                  <div className="cart-total">
                    <p>Rs{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="cart-actions">
                <button className="clear-cart-btn" onClick={handleClearCart}>Clear Cart</button>
                <button className="continue-shopping-btn" onClick={handleContinueShopping}>Continue Shopping</button>
              </div>
            </div>

            <div className="order-summary">
              <h3>Order Summary</h3>
              {selectedCartItems.length > 0 ? (
                <>
                  <p>Subtotal ({selectedCartItems.reduce((acc, item) => acc + item.quantity, 0)} items): Rs{subtotal.toFixed(2)}</p>
                  <p>Shipping: Calculated at checkout</p>
                  <h4>Total: Rs{total.toFixed(2)}</h4>
                  <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
                  <p className="tax-note">Taxes and shipping calculated at checkout</p>
                </>
              ) : (
                <p>No items selected.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-cart">
            <FiShoppingCart className="empty-cart-icon" />
            <h3>Your cart is empty</h3>
            <p>Looks like you haven’t added any products to your cart yet.</p>
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>Continue Shopping</button>
          </div>
        )}

        {showCheckoutForm && (
          <div className="checkout-popup">
            <div className="popup-content">
              <button className="close-popup-btn" onClick={() => setShowCheckoutForm(false)}>×</button>

              {/* Step Indicator */}
              <div className="step-indicator">
                <div className={`step ${checkoutStep === 1 ? 'active' : ''}`}>1. Address</div>
                <div className={`step ${checkoutStep === 2 ? 'active' : ''}`}>2. Payment</div>
                <div className={`step ${checkoutStep === 3 ? 'active' : ''}`}>3. Success</div>
              </div>

              {checkoutStep === 1 && (
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
                 <div className="button-row">
  <button
    type="button"
    className="action-btn save-address-btn"
    onClick={handleSaveAddress}
  >
    {isAddressSaved ? "Update Address" : "Save Address"}
  </button>
  <button
    type="button"
    className="action-btn next-btn"
    onClick={handleNextStep}
  >
    <FiArrowRight />
  </button>
</div>
                  </form>
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="payment-section">
                  <h3>Enter Your Payment Information</h3>
                  <div className="payment-methods">
                    <div className="payment-option">PayPal</div>
                    <div className="payment-option">MasterCard</div>
                    <div className="payment-option">Visa</div>
                  </div>
                  <form>
               
                    <div className="form-group">
                      <input
                        type="text"
                        name="cardHolder"
                        value={paymentDetails.cardHolder}
                        onChange={handlePaymentChange}
                        placeholder="Card Holder"
                        required
                      />
                      {paymentErrors.cardHolder && <span className="error">{paymentErrors.cardHolder}</span>}
                    </div>
                   <div className="form-group">
  <input
    type="text"
    name="cardNumber"
    value={paymentDetails.cardNumber}
    onChange={handlePaymentChange}
    placeholder="XXXX XXXX XXXX XXXX"
    maxLength="19" // Includes spaces for formatting
    required
  />
  {paymentErrors.cardNumber && <span className="error">{paymentErrors.cardNumber}</span>}
</div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                      {paymentErrors.expiryDate && <span className="error">{paymentErrors.expiryDate}</span>}
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="cvv"
                        value={paymentDetails.cvv}
                        onChange={handlePaymentChange}
                        placeholder="CVV"
                        maxLength="4"
                        required
                      />
                      {paymentErrors.cvv && <span className="error">{paymentErrors.cvv}</span>}
                    </div>
                    <div className="button-group">
                      <button
                        type="button"
                        className="action-btn back-btn"
                        onClick={handleBackStep}
                      >
                        <FiArrowLeft />
                      </button>
                      <button
                        type="button"
                        className="action-btn confirm-payment-btn"
                        onClick={handleConfirmPayment}
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="success-section">
                  <h3>Payment Successful!</h3>
                  <p>Your payment has been processed successfully.</p>
                  <button className="action-btn place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;