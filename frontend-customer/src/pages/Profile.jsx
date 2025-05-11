import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile'); // Default to 'profile'
  const [user, setUser] = useState(null); // State to store user details
  const [orders, setOrders] = useState([]); // State to store order history
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [formData, setFormData] = useState({}); // State to store form input values
  const [error, setError] = useState(null); // State to store error messages

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
      setOrders(data.orders || []); // Include orders if available
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

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

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
          {true ? (
            [
              {
                orderId: 'ORD-1234',
                orderDate: '2023-04-15',
                status: 'Delivered',
                items: [
                  { productId: '1', productName: 'Wooden Tray', quantity: 1, price: 45.59 },
                  { productId: '2', productName: 'Coconut Bowl', quantity: 2, price: 29.99 },
                ],
                total: 105.57,
              },
              {
                orderId: 'ORD-5678',
                orderDate: '2023-04-20',
                status: 'Processing',
                items: [
                  { productId: '3', productName: 'Bamboo Spoon Set', quantity: 3, price: 15.99 },
                ],
                total: 47.97,
              },
            ].map((order) => (
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
                    {order.items.map((item) => (
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