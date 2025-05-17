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
    resetEmail: '',
    verificationCode: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      resetEmail: '',
      verificationCode: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setError('');
  };

  const handleLogin = async (email, password) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Login failed');
        return false;
      }
      localStorage.setItem('token', data.token);
      resetForm();
      onClose();
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const handleRegister = async () => {
    const { first_name, last_name, email, phone, password, confirmPassword } = formData;
    if (!first_name || !last_name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return false;
      }
      resetForm();
      onClose();
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const handleForgotPassword = async () => {
    if (forgotPasswordStep === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.resetEmail)) {
        setError('Please enter a valid email address');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/customer/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.resetEmail }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || 'Failed to send code');
          return;
        }
        setForgotPasswordStep(2);
        setError('');
      } catch (err) {
        console.error('Send code error:', err);
        setError('Network error. Please try again.');
      }
    } else if (forgotPasswordStep === 2) {
      if (!/^\d{6}$/.test(formData.verificationCode)) {
        setError('Please enter a valid 6-digit code');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/customer/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.resetEmail, code: formData.verificationCode }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || 'Invalid or expired code');
          return;
        }
        setForgotPasswordStep(3);
        setError('');
      } catch (err) {
        console.error('Verify code error:', err);
        setError('Network error. Please try again.');
      }
    } else if (forgotPasswordStep === 3) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError('Passwords do not match');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/customer/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.resetEmail,
            code: formData.verificationCode,
            newPassword: formData.newPassword,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || 'Failed to reset password');
          return;
        }
        setForgotPasswordStep(4);
        setError('');
      } catch (err) {
        console.error('Reset password error:', err);
        setError('Network error. Please try again.');
      }
    } else if (forgotPasswordStep === 4) {
      setForgotPasswordStep(0);
      resetForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    if (isRegistering) {
      await handleRegister();
    } else if (forgotPasswordStep > 0) {
      await handleForgotPassword();
    } else {
      await handleLogin(formData.email, formData.password);
    }

    setIsLoading(false);
  };

  return (
    <div className="login-container" role="dialog" aria-labelledby="login-title">
      <div
        className={`login-card ${
          forgotPasswordStep > 0
            ? 'forgot-password-height'
            : isRegistering
            ? 'register-height'
            : 'login-height'
        }`}
      >
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close modal"
          disabled={isLoading}
        >
          <X size={20} />
        </button>
        <div className="login-image">
          <img src={Logo1} alt="Login Illustration" className="login-image-item" />
          <img src={Log} alt="Wood Illustration" className="login-image-item" />
        </div>
        <div className="login-form-container">
          <div className="login-header">
            <h1 id="login-title" className="login-title">
              {forgotPasswordStep === 1
                ? 'Reset Password'
                : forgotPasswordStep === 2
                ? 'Enter Verification Code'
                : forgotPasswordStep === 3
                ? 'Set New Password'
                : forgotPasswordStep === 4
                ? 'Password Updated'
                : isRegistering
                ? 'Create Your Account'
                : 'Welcome to Crafttary!'}
            </h1>
            <p className="login-subtitle">
              {forgotPasswordStep === 1
                ? 'Enter your email to receive a verification code'
                : forgotPasswordStep === 2
                ? 'Enter the 6-digit code sent to your email'
                : forgotPasswordStep === 3
                ? 'Enter your new password'
                : forgotPasswordStep === 4
                ? 'Your password has been successfully updated'
                : isRegistering
                ? 'Please fill in your account details below'
                : 'Please login to continue'}
            </p>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <form
            className={`login-form ${
              forgotPasswordStep === 1 || forgotPasswordStep === 2
                ? 'forgot-password-form'
                : forgotPasswordStep === 3
                ? 'forgot-password-form new-password-form'
                : forgotPasswordStep === 4
                ? 'success-form'
                : isRegistering
                ? 'register-form'
                : 'login-form'
            }`}
            onSubmit={handleSubmit}
            noValidate
          >
            {forgotPasswordStep === 1 ? (
              <>
                <div className="input-group">
                  <UserCircle className="input-icon" size={20} aria-hidden="true" />
                  <input
                    type="email"
                    name="resetEmail"
                    value={formData.resetEmail}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="form-input"
                    required
                    aria-label="Email address for password reset"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
                <p className="register-text">
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPasswordStep(0);
                      setError('');
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </>
            ) : forgotPasswordStep === 2 ? (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    placeholder="Verification Code"
                    className="form-input"
                    required
                    aria-label="6-digit verification code"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <p className="register-text">
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPasswordStep(0);
                      setError('');
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </>
            ) : forgotPasswordStep === 3 ? (
              <>
                <div className="input-group">
                  <Lock className="input-icon" size={20} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="New Password"
                    className="form-input"
                    required
                    aria-label="New password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="input-group">
                  <Lock className="input-icon" size={20} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    placeholder="Confirm New Password"
                    className="form-input"
                    required
                    aria-label="Confirm new password"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <p className="register-text">
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPasswordStep(0);
                      setError('');
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </>
            ) : forgotPasswordStep === 4 ? (
              <>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  Back to Login
                </button>
              </>
            ) : isRegistering ? (
              <>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="form-input"
                  required
                  aria-label="First name"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="form-input"
                  required
                  aria-label="Last name"
                  disabled={isLoading}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="form-input"
                  required
                  aria-label="Email address"
                  disabled={isLoading}
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="form-input"
                  aria-label="Phone number"
                  disabled={isLoading}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="form-input"
                  required
                  aria-label="Password"
                  disabled={isLoading}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="form-input"
                  required
                  aria-label="Confirm password"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
                <p className="register-text">
                  Already have an account?{' '}
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsRegistering(false);
                      setError('');
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </>
            ) : (
              <>
                <div className="input-group">
                  <UserCircle className="input-icon" size={20} aria-hidden="true" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="form-input"
                    required
                    aria-label="Email address"
                    disabled={isLoading}
                  />
                </div>
                <div className="input-group">
                  <Lock className="input-icon" size={20} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="form-input"
                    required
                    aria-label="Password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="register-text">
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPasswordStep(1);
                      setError('');
                    }}
                  >
                    Forgot Password?
                  </a>
                </p>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  <LogIn size={20} aria-hidden="true" />
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <p className="register-text">
                  Don't have an account?{' '}
                  <a
                    href="#"
                    className="link-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsRegistering(true);
                      setError('');
                    }}
                  >
                    Register
                  </a>
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