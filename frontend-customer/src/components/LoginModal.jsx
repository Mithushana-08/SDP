import React, { useState } from 'react';
import './LoginModal.css';
import { UserCircle, Lock, Eye, EyeOff, LogIn, X } from 'lucide-react';
import Logo1 from '../assets/login.jpg';
import Log from '../assets/wood.webp';

const LoginModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
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
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate phone number (10 digits)
      const phoneRegex = /^\d{10}$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Validate password match
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
            first_name: formData.first_name,
            last_name: formData.last_name,
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
            email: formData.email,
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
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
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
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
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