import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import './Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [orderDetailsError, setOrderDetailsError] = useState(null);

  const sriLankanDistricts = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
    'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
    'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
  ].map(district => ({ value: district, label: district }));

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'orders') setActiveTab('orders');
    else setActiveTab('profile');
  }, [location]);

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
        address: data.address || null,
      };
      setUser(userData);
      console.log('Updated user state:', JSON.stringify(userData, null, 2));
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address_line1: userData.address?.address_line1 || '',
        address_line2: userData.address?.address_line2 || '',
        city: userData.address?.city || '',
        district: userData.address?.district || '',
        postal_code: userData.address?.postal_code || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login');
    }
  };

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
      const normalizedOrders = Array.isArray(data.orders)
        ? data.orders.map((order) => ({
            ...order,
            orderId: order.order_id,
            items: Array.isArray(order.items) ? order.items : [],
            total_amount: typeof order.total_amount === 'number' ? order.total_amount : 0,
          }))
        : [];
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

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
      const normalizedOrder = {
        ...data.order,
        orderId: data.order.order_id || data.order.orderId,
        items: Array.isArray(data.order.items)
          ? data.order.items.map((item, index) => ({
              ...item,
              productId: item.productId || `temp-id-${index}`,
            }))
          : [],
        total_amount: typeof data.order.total_amount === 'number' ? data.order.total_amount : 0,
      };
      setSelectedOrder(normalizedOrder);
      setOrderDetailsError(null);
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
    localStorage.removeItem('token');
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

  const handleDistrictChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      district: selectedOption ? selectedOption.value : '',
    }));
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

  console.log('Rendering district dropdown, formData.district:', formData.district);
  console.log('sriLankanDistricts:', sriLankanDistricts);

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
                    value={formData.first_name || ''}
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
                    value={formData.last_name || ''}
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
                    value={formData.email || ''}
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
                    value={formData.phone || ''}
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
                    value={formData.address_line1 || ''}
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
                    value={formData.address_line2 || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="district">District</label>
                  <Select
                    id="district"
                    name="district"
                    options={sriLankanDistricts}
                    value={sriLankanDistricts.find(option => option.value === formData.district) || null}
                    onChange={handleDistrictChange}
                    placeholder="Select District"
                    isClearable
                    isSearchable
                    className="district-select"
                    classNamePrefix="react-select"
                    required
                  />
                </div>
                <div className="info-item">
                  <label htmlFor="postal_code">Postal Code</label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code || ''}
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
                    <label>District</label>
                    <p>{user.address.district || 'Not set'}</p>
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
                  <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}`}>
                    {order.status}
                  </span>
                </div>
                {/* Show a row of product images (thumbnails) for each order above the order footer */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="order-items-image-row">
                    {order.items.map((item, index) => (
                      <div key={item.productId || `item-${index}`} className="order-item-image-thumb">
                        {item.productImage ? (
                          <img
                            src={
                              item.productImage.startsWith('http://') || item.productImage.startsWith('https://')
                                ? item.productImage
                                : item.productImage.startsWith('/uploads')
                                  ? `http://localhost:5000${item.productImage}`
                                  : `http://localhost:5000/uploads/${item.productImage}`
                            }
                            alt={item.productName || 'Product'}
                            className="order-item-thumb-image"
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', marginRight: 8 }}
                            onError={e => { e.target.onerror = null; e.target.src = '/vite.svg'; }}
                          />
                        ) : (
                          <img
                            src="/vite.svg"
                            alt="No product"
                            className="order-item-thumb-image"
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', opacity: 0.5, marginRight: 8 }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="order-footer">
                  <strong className="order-total">
                    Total: Rs
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
              <p>
                Status: <span className={`status-badge status-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
              </p>
              <p>Placed on: {new Date(selectedOrder.orderDate || selectedOrder.order_date).toLocaleDateString()}</p>
              <h4>Items:</h4>
              <div className="order-details-items-table-wrapper">
                <table className="order-details-items-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Customization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <tr key={item.productId || `item-${index}`}> 
                          <td>
                            {item.productImage ? (
                              <img
                                src={
                                  item.productImage.startsWith('http://') || item.productImage.startsWith('https://')
                                    ? item.productImage
                                    : item.productImage.startsWith('/uploads')
                                      ? `http://localhost:5000${item.productImage}`
                                      : `http://localhost:5000/uploads/${item.productImage}`
                                }
                                alt={item.productName || 'Product'}
                                className="order-details-item-image"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                                onError={e => { e.target.onerror = null; e.target.src = '/vite.svg'; }}
                              />
                            ) : (
                              <img
                                src="/vite.svg"
                                alt="No product"
                                className="order-details-item-image"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', opacity: 0.5 }}
                              />
                            )}
                          </td>
                          <td>{item.productName || 'Unknown Product'}</td>
                          <td>{item.quantity || 0}</td>
                          <td>Rs{(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</td>
                          <td>
                            {item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0 && item.customizations.some(c => (c.value || c.size || c.image)) ? (
                              <ul className="customization-list">
                                {item.customizations.map((c, ci) => (
                                  (c.value || c.size || c.image) && (
                                    <li key={ci}>
                                      {c.type && (c.value || c.size || c.image) && <span><b>Type:</b> {c.type} </span>}
                                      {c.value && <span><b>Value:</b> {c.value} </span>}
                                      {c.size && <span><b>Size:</b> {c.size} </span>}
                                      {c.image && (
                                        <span>
                                          <b>Image:</b> <a href={c.image.startsWith('http') ? c.image : `http://localhost:5000/uploads/${c.image}`} target="_blank" rel="noopener noreferrer">View</a>
                                        </span>
                                      )}
                                    </li>
                                  )
                                ))}
                              </ul>
                            ) : (
                              <span style={{ color: '#aaa' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5}>No items found for this order.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p>
                Total: Rs
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