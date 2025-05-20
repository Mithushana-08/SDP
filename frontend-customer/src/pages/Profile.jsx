import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import Swal from 'sweetalert2';
import './Profile.css';
import LoginModal from '../components/LoginModal';

const ProfilePage = ({ onShowLoginPrompt }) => {
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // Add a state to track login status
  const [showLoginModal, setShowLoginModal] = useState(false);
  // State for password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
      if (!token) {
        setShowLoginPrompt(true);
        return;
      }
      console.log('Fetching profile with token:', token);
      const response = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        setShowLoginPrompt(true);
        return;
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
      setShowLoginPrompt(true);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/profile/orders', {
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
      // Use the correct endpoint for order details
      const response = await fetch(`http://localhost:5000/api/customer/profile/orders/${orderId}`, {
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

  useEffect(() => {
    if (typeof onShowLoginPrompt === 'function') {
      onShowLoginPrompt(showLoginPrompt);
    }
  }, [showLoginPrompt, onShowLoginPrompt]);

  // Soft delete (deactivate) account
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Are you sure you want to delete your account?',
      text: 'This will deactivate your account. You can contact support to reactivate. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete my account',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/customer/delete-account`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete account');
      await Swal.fire({
        icon: 'success',
        title: 'Account deleted',
        text: 'Your account has been deactivated.',
        showConfirmButton: false,
        timer: 1800,
      });
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Failed to delete account',
        text: err.message || 'Please try again.',
      });
    }
  };

  // Confirm sign out
  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: 'Sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sign Out',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem('token');
    navigate('/');
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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/profile/change-password', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
      await Swal.fire({
        icon: 'success',
        title: 'Password changed successfully!',
        showConfirmButton: false,
        timer: 1500,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
      await Swal.fire({
        icon: 'error',
        title: 'Failed to change password',
        text: err.message || 'Please try again.',
      });
    }
  };

  console.log('Rendering district dropdown, formData.district:', formData.district);
  console.log('sriLankanDistricts:', sriLankanDistricts);

  if (showLoginPrompt) {
    return (
      <div className="profile-page" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>Login Required</h2>
        <p style={{ marginBottom: 24 }}>You must be logged in to view your profile and orders.</p>
        <button className="update-profile-btn" style={{ width: 180 }} onClick={() => setShowLoginModal(true)}>Go to Login</button>
        {showLoginModal && <LoginModal onClose={() => {
          setShowLoginModal(false);
          // If token is now present, refetch profile and orders
          if (localStorage.getItem('token')) {
            setShowLoginPrompt(false);
            fetchProfile();
            fetchOrders();
          }
        }} />}
      </div>
    );
  }

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
              
            </>
          )}

          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword} className="profile-form" style={{ marginBottom: 24 }}>
            <div className="info-grid" style={{ display: 'flex', gap: 24 }}>
              <div className="info-item" style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                  autoComplete="current-password"
                  placeholder="Current Password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showCurrentPassword ? 'Hide' : 'Show'}
                  tabIndex={0}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 1l22 22M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 2.1-3.36 4.06-5.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88"/></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="info-item" style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  autoComplete="new-password"
                  placeholder="New Password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showNewPassword ? 'Hide' : 'Show'}
                  tabIndex={0}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 1l22 22M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 2.1-3.36 4.06-5.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88"/></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="info-item" style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm New Password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showConfirmPassword ? 'Hide' : 'Show'}
                  tabIndex={0}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 1l22 22M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 2.1-3.36 4.06-5.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88"/></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            {passwordError && <p className="error-message">{passwordError}</p>}
            <div className="form-actions">
              <button type="submit" className="update-profile-btn">Save Password</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'space-between' }}>
              <button className="sign-out-btn" style={{ background: '#d32f2f', color: '#fff', borderRadius: '8px', width: '160px', height: '40px' }} onClick={handleSignOut}>
                <span className="icon">←</span> Sign Out
              </button>
              <button className="delete-account-btn" style={{ background: '#d32f2f', color: '#fff', borderRadius: '8px', width: '160px', height: '40px' }} onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </form>
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
              {selectedOrder.status === 'sent' && (
                <button
                  className="delivered-btn"
                  onClick={async () => {
                    const Swal = (await import('sweetalert2')).default;
                    const result = await Swal.fire({
                      title: 'Are you sure you want to update status as delivered? Once updated, you cannot change or get a refund if not delivered.',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Yes, mark as delivered',
                      cancelButtonText: 'Cancel',
                    });
                    if (result.isConfirmed) {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:5000/api/customer/profile/orders/${selectedOrder.orderId}/mark-delivered`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        if (!response.ok) throw new Error('Failed to update order status');
                        await Swal.fire({
                          icon: 'success',
                          title: 'Order marked as delivered!',
                          showConfirmButton: false,
                          timer: 1500,
                        });
                        setSelectedOrder({ ...selectedOrder, status: 'delivered' });
                        fetchOrders();
                      } catch (err) {
                        await Swal.fire({
                          icon: 'error',
                          title: 'Failed to update order status',
                          text: err.message || 'Please try again.',
                        });
                      }
                    }
                  }}
                >
                  Mark as Delivered
                </button>
              )}
              <button onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;