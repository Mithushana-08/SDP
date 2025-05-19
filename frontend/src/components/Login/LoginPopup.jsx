import React, { useState } from "react";
import { UserCircle, Lock, Eye, EyeOff, LogIn, Mail, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LoginPopup.css";
import Logo1 from "../../assets/logo1.png";

const LoginPopup = () => {
  const [formData, setFormData] = useState({ username: "", password: "", email: "", resetCode: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("login");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      sessionStorage.setItem("token", data.token); // Changed to sessionStorage
      fetchProtectedData(data.token);

      if (data.user.role === "admin") {
        console.log("Redirecting to /admin-dashboard");
        navigate("/admin-dashboard");
      } else if (data.user.role === "crafter") {
        console.log("Redirecting to /crafter/cdashboard");
        navigate("/crafter/cdashboard");
      } else if (data.user.role === "delivery") {
        console.log("Redirecting to /delivery-dashboard");
        navigate("/delivery-dashboard");
      } else {
        setError("Invalid user role.");
      }
    } catch (error) {
      console.error("Error during login", error);
      setError("Server error. Please try again later.");
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send reset code");
        return;
      }

      setStage("verifyCode");
    } catch (error) {
      console.error("Error sending reset code", error);
      setError("Server error. Please try again later.");
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, resetCode: formData.resetCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid or expired reset code");
        return;
      }

      setStage("resetPassword");
    } catch (error) {
      console.error("Error verifying reset code", error);
      setError("Server error. Please try again later.");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          resetCode: formData.resetCode,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setStage("login");
      setFormData({ username: "", password: "", email: "", resetCode: "", newPassword: "", confirmPassword: "" });
      setError("Password updated successfully. Please login.");
    } catch (error) {
      console.error("Error resetting password", error);
      setError("Server error. Please try again later.");
    }
  };

  const fetchProtectedData = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/protected", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to fetch protected data");
        return;
      }
    } catch (error) {
      console.error("Error accessing protected route:", error);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-image">
          <img src={Logo1} alt="Login Illustration" />
        </div>
        <div className="login-form-container">
          <div className="login-header">
            <h1 className="login-title">Welcome to Crafttary!</h1>
            <p className="login-subtitle">
              {stage === "login" ? "Please login to continue" :
               stage === "forgotPassword" ? "Enter your email to reset password" :
               stage === "verifyCode" ? "Enter the reset code sent to your email" :
               "Set your new password"}
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          {stage === "login" && (
            <form className="login-form" onSubmit={handleLoginSubmit}>
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
                  autoComplete="username"
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="form-input"
                  required
                  autoComplete="current-password"
                />
                {showPassword ? (
                  <EyeOff size={20} onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye size={20} onClick={() => setShowPassword(true)} />
                )}
              </div>

              <button type="submit" className="login-button">
                <LogIn size={20} />
                Login
              </button>
              <p className="forgot-password-link">
                <a href="#" onClick={() => setStage("forgotPassword")}>Forgot Password?</a>
              </p>
            </form>
          )}

          {stage === "forgotPassword" && (
            <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="form-input"
                  required
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="login-button">
                Send Reset Code
              </button>
              <p className="forgot-password-link">
                <a href="#" onClick={() => setStage("login")}>Back to Login</a>
              </p>
            </form>
          )}

          {stage === "verifyCode" && (
            <form className="login-form" onSubmit={handleVerifyCodeSubmit}>
              <div className="input-group">
                <Key className="input-icon" size={20} />
                <input
                  type="text"
                  name="resetCode"
                  value={formData.resetCode}
                  onChange={handleChange}
                  placeholder="Reset Code"
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="login-button">
                Verify Code
              </button>
              <p className="forgot-password-link">
                <a href="#" onClick={() => setStage("login")}>Back to Login</a>
              </p>
            </form>
          )}

          {stage === "resetPassword" && (
            <form className="login-form" onSubmit={handleResetPasswordSubmit}>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="New Password"
                  className="form-input"
                  required
                />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="form-input"
                  required
                />
                {showPassword ? (
                  <EyeOff size={20} onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye size={20} onClick={() => setShowPassword(true)} />
                )}
              </div>
              <button type="submit" className="login-button">
                Reset Password
              </button>
              <p className="forgot-password-link">
                <a href="#" onClick={() => setStage("login")}>Back to Login</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;