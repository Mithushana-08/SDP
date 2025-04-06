import React, { useState } from 'react';
import './LoginModal.css';
import { UserCircle, Lock, Eye, EyeOff, LogIn, X } from 'lucide-react';
import Logo1 from '../assets/login.jpg';
import Log from '../assets/wood.webp';

const LoginModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegistering) {
      // Validate account info
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/customer/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Registration failed');
          return;
        }

        console.log('Registration successful:', data);
        setError('');
        onClose(); // Close the modal
      } catch (err) {
        console.error('Error during registration:', err);
        setError('An error occurred. Please try again.');
      }
    } else {
      // Login logic
      try {
        const response = await fetch('http://localhost:5000/api/customer/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.username,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Login failed');
          return;
        }

        // Save the token to localStorage
        localStorage.setItem('token', data.token);

        console.log('Login successful:', data);
        setError('');
        onClose(); // Close the modal
      } catch (err) {
        console.error('Error during login:', err);
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Close button */}
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="login-image">
          <img src={Logo1} alt="Login Illustration" className="login-image-item" />
          <img src={Log} alt="Login Illustration" className="login-image-item" />
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <h1 className="login-title">
              {isRegistering ? 'Create Your Account' : 'Welcome to Crafttary!'}
            </h1>
            <p className="login-subtitle">
              {isRegistering
                ? 'Please fill in your account details below'
                : 'Please login to continue'}
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <form
            className={`login-form ${isRegistering ? 'register-form' : 'login-form'}`}
            onSubmit={handleSubmit}
          >
            {isRegistering ? (
              <>
                {/* Account Info */}
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="form-input"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="form-input"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="form-input"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="form-input"
                  required
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="form-input"
                  required
                />
                <button type="submit" className="login-button">
                  Register
                </button>
              </>
            ) : (
              <>
                {/* Login Form */}
                <div className="input-group">
                  <UserCircle className="input-icon" size={20} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="form-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <Lock className="input-icon" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="form-input"
                    required
                  />
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className="password-toggle-icon"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="password-toggle-icon"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>

                <button type="submit" className="login-button">
                  <LogIn size={20} />
                  Login
                </button>
                <p className="register-text">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setIsRegistering(true)}
                  >
                    Register
                  </button>
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;