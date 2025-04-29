// ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile'); // Default to 'profile'

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'orders') setActiveTab('orders');
    else if (path === 'wishlist') setActiveTab('wishlist');
    else setActiveTab('profile');
  }, [location]);

  // Mock user data
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    },
  };

  // Mock orders data (updated to match the image)
  const orders = [
    {
      orderId: 'ORD-1234',
      orderDate: '2023-04-15',
      status: 'Delivered',
      items: [
        { productId: '1', productName: 'Wooden Serving Tray', quantity: 1, price: 45.59 },
        { productId: '2', productName: 'Coconut Bowl Set', quantity: 1, price: 29.99 },
        { productId: '3', productName: 'Wooden Bangle Set', quantity: 1, price: 24.39 },
      ],
      total: 99.97,
    },
    {
      orderId: '67890',
      orderDate: '2023-03-15',
      status: 'Shipped',
      items: [
        { productId: '4', productName: 'Product C', quantity: 1, price: 30.0 },
      ],
      total: 30.0,
    },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('token'); // Clear token
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile/${tab}`);
  };

  return (
    <div className="profile-page">
   
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <span className="icon">👤</span> Profile
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <span className="icon">📦</span> Orders
        </button>
      
      </div>

    
      {activeTab === 'profile' && user && (
  <div className="profile-section">
    <h2>Personal Information</h2>
    <div className="info-grid">
      <div className="info-item">
        <label>First Name</label>
        <p>{user.firstName}</p>
      </div>
      <div className="info-item">
        <label>Last Name</label>
        <p>{user.lastName}</p>
      </div>
      <div className="info-item"> {/* Fixed the missing '=' */}
        <label>Email</label>
        <p>{user.email}</p>
      </div>
      <div className="info-item">
        <label>Phone Number</label>
        <p>{user.phone}</p>
      </div>
    </div>

    <h2>Shipping Address</h2>
    <div className="info-grid">
      <div className="info-item">
        <label>Street Address</label>
        <p>{user.address.street}</p>
      </div>
      <div className="info-item">
        <label>City</label>
        <p>{user.address.city}</p>
      </div>
      <div className="info-item">
        <label>State</label>
        <p>{user.address.state}</p>
      </div>
      <div className="info-item">
        <label>Zip Code</label>
        <p>{user.address.zip}</p>
      </div>
    </div>

    <button className="update-profile-btn">Update Profile</button>
    <button className="sign-out-btn" onClick={handleSignOut}>
      <span className="icon">←</span> Sign Out
    </button>
  </div>
)}

{activeTab === 'orders' && (
        <div className="orders-section">
          <h2>Order History</h2>
          {orders.length > 0 ? (
            orders.map(order => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.orderId}</h3>
                    <p>Placed on {new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <table className="order-items">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.productId}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-footer">
                  <strong className="order-total">Total: ${order.total.toFixed(2)}</strong>
                  <button className="view-details-btn">View Details</button>
                </div>
              </div>
            ))
          ) : (
            <p>No orders found.</p>
          )}
        </div>
      )}
     
      
    </div>
  );
};

export default ProfilePage;