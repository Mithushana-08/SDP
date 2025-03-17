import React, { useState } from "react";
import { UserCircle, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import for page redirection
import "./LoginPopup.css";
import Logo1 from "../../assets/logo1.png";

const LoginPopup = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Use navigate for redirection

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error

    console.log("Form submitted", formData); // Log form data

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log("Response received", data); // Log response data

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store Token in LocalStorage
      localStorage.setItem("token", data.token);

      // Fetch protected data
      fetchProtectedData(data.token);

      // Redirect based on role
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
      console.error("Error during login", error); // Log any errors
      setError("Server error. Please try again later.");
    }
  };

  const fetchProtectedData = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/protected", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("Protected route data:", data); // Log protected route data

      if (!response.ok) {
        setError(data.message || "Failed to fetch protected data");
        return;
      }

      // Handle the protected data as needed
    } catch (error) {
      console.error("Error accessing protected route:", error); // Log any errors
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
            <p className="login-subtitle">Please login to continue</p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;