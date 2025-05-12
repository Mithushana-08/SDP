import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile'); // Default to 'profile'
  const [user, setUser] = useState(null); // State to store user details
  const [orders, setOrders] = useState([]); // State to store order history
  const [selectedOrder, setSelectedOrder] = useState(null); // State to store selected order details
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [formData, setFormData] = useState({}); // State to store form input values
  const [error, setError] = useState(null); // State to store error messages
  const [orderDetailsError, setOrderDetailsError] = useState(null); // State for order details fetch errors

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'orders') setActiveTab('orders');
    else setActiveTab('profile');
  }, [location]);

  // Fetch customer profile details
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching profile with token:', token);
      const response = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile details');
      }

      const data = await response.json();
      console.log('Profile fetch response:', JSON.stringify(data, null, 2));
      const userData = {
        ...data.customer,
        address: data.address || null, // Include address if available
      };
      setUser(userData);
      console.log('Updated user state:', JSON.stringify(userData, null, 2));
      // Initialize form data with user data
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address_line1: userData.address?.address_line1 || '',
        address_line2: userData.address?.address_line2 || '',
        city: userData.address?.city || '',
        province: userData.address?.province || '',
        postal_code: userData.address?.postal_code || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login'); // Redirect to login if token is invalid
    }
  };

  // Fetch order history
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      console.log('Orders fetch response:', JSON.stringify(data, null, 2));
      // Normalize orders: rename order_id to orderId, ensure items and total_amount
      const normalizedOrders = Array.isArray(data.orders)
        ? data.orders.map((order) => ({
            ...order,
            orderId: order.order_id, // Rename order_id to orderId
            items: Array.isArray(order.items) ? order.items : [],
            total_amount: typeof order.total_amount === 'number' ? order.total_amount : 0,
          }))
        : [];
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set to empty array on error
    }
  };

  // Fetch details of a specific order
  const fetchOrderDetails = async (orderId) => {
    if (!orderId) {
      setOrderDetailsError('Invalid order ID');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/customer/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      console.log('Order details response:', JSON.stringify(data, null, 2));
      // Normalize selected order to ensure items and total_amount are valid
      const normalizedOrder = {
        ...data.order,
        orderId: data.order.order_id || data.order.orderId, // Handle both cases
        items: Array.isArray(data.order.items)
          ? data.order.items.map((item, index) => ({
              ...item,
              productId: item.productId || `temp-id-${index}`, // Ensure productId exists
            }))
          : [],
        total_amount: typeof data.order.total_amount === 'number' ? data.order.total_amount : 0,
      };
      setSelectedOrder(normalizedOrder);
      setOrderDetailsError(null); // Clear any previous error
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrderDetailsError(error.message || 'Failed to fetch order details');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleSignOut = () => {
    localStorage.removeItem('token'); // Clear token
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile/${tab}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Updating profile with data:', JSON.stringify(formData, null, 2));
      const response = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', response.status, JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Profile update response:', JSON.stringify(data, null, 2));
      // Refresh profile data from server to ensure UI reflects latest data
      await fetchProfile();
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    setError(null);
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
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="info-grid">
                <div className="info-item">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <h2>Shipping Address</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label htmlFor="address_line1">Street Address</label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="address_line2">Address Line 2</label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="province">Province</label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="postal_code">Postal Code</label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
              <div className="form-actions">
                <button type="submit" className="update-profile-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={toggleEditMode}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="info-grid">
                <div className="info-item">
                  <label>First Name</label>
                  <p>{user.first_name}</p>
                </div>
                <div className="info-item">
                  <label>Last Name</label>
                  <p>{user.last_name}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone Number</label>
                  <p>{user.phone}</p>
                </div>
              </div>

              <h2>Shipping Address</h2>
              {user.address ? (
                <div className="info-grid">
                  <div className="info-item">
                    <label>Street Address</label>
                    <p>{user.address.address_line1}</p>
                  </div>
                  {user.address.address_line2 && (
                    <div className="info-item">
                      <label>Address Line 2</label>
                      <p>{user.address.address_line2}</p>
                    </div>
                  )}
                  <div className="info-item">
                    <label>City</label>
                    <p>{user.address.city}</p>
                  </div>
                  <div className="info-item">
                    <label>Province</label>
                    <p>{user.address.province}</p>
                  </div>
                  <div className="info-item">
                    <label>Postal Code</label>
                    <p>{user.address.postal_code}</p>
                  </div>
                </div>
              ) : (
                <p>No shipping address available.</p>
              )}
              <button
                className="update-profile-btn"
                onClick={toggleEditMode}
              >
                Update Profile
              </button>
              <button className="sign-out-btn" onClick={handleSignOut}>
                <span className="icon">←</span> Sign Out
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-section">
          <h2>Order History</h2>
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.orderId}</h3>
                    <p>Placed on {new Date(order.orderDate || order.order_date).toLocaleDateString()}</p>
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
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        console.log('Order item key:', item.productId || `item-${index}`);
                        return (
                          <tr key={item.productId || `item-${index}`}>
                            <td>{item.productName || 'Unknown Product'}</td>
                            <td>{item.quantity || 0}</td>
                            <td>
                              ${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3">No items found for this order.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="order-footer">
                  <strong className="order-total">
                    Total: $
                    {(typeof order.total_amount === 'number' ? order.total_amount : 0).toFixed(2)}
                  </strong>
                  <button
                    className="view-details-btn"
                    onClick={() => fetchOrderDetails(order.orderId)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No orders found.</p>
          )}

          {orderDetailsError && (
            <div className="error-message">
              <p>{orderDetailsError}</p>
            </div>
          )}

          {selectedOrder && (
            <div className="order-details-popup">
              <h3>Order Details</h3>
              <p>Order ID: {selectedOrder.orderId}</p>
              <p>Status: {selectedOrder.status}</p>
              <p>Placed on: {new Date(selectedOrder.orderDate || selectedOrder.order_date).toLocaleDateString()}</p>
              <h4>Items:</h4>
              <ul>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => {
                    console.log('Selected order item key:', item.productId || `item-${index}`);
                    return (
                      <li key={item.productId || `item-${index}`}>
                        {item.productName || 'Unknown Product'} - {item.quantity || 0} x $
                        {(typeof item.price === 'number' ? item.price : 0).toFixed(2)}
                      </li>
                    );
                  })
                ) : (
                  <li key="no-items">No items found for this order.</li>
                )}
              </ul>
              <p>
                Total: $
                {(typeof selectedOrder.total_amount === 'number'
                  ? selectedOrder.total_amount
                  : 0
                ).toFixed(2)}
              </p>
              <button onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;