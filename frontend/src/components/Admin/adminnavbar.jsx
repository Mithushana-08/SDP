import { useState, useEffect } from "react";
import { FiBell, FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./adminnavbar.css";

const AdminNavbar = () => {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    // Fetch user profile to get username
    useEffect(() => {
        const token = sessionStorage.getItem("token"); // Changed from localStorage
        if (!token) {
            console.warn("No token found, skipping profile fetch");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/profile/profile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user profile");
                }

                const userData = await response.json();
                setUsername(userData.username || "User");
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setUsername("User"); // Fallback username
            }
        };

        fetchUserProfile();
    }, []);

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        document.body.classList.toggle("dark-mode", newMode);
        localStorage.setItem("theme", newMode ? "dark" : "light");
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            const token = sessionStorage.getItem("token"); // Changed from localStorage
            if (!token) {
                sessionStorage.removeItem("token"); // Changed from localStorage
                navigate("/");
                return;
            }

            const response = await fetch("http://localhost:5000/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Logout request failed");
            }

            sessionStorage.removeItem("token"); // Changed from localStorage
            navigate("/");
        } catch (error) {
            console.error("Error during logout:", error);
            sessionStorage.removeItem("token"); // Changed from localStorage
            navigate("/");
        }
    };

    // Load theme on component mount
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }, [darkMode]);

    return (
        <div className="admin-navbar">
            <div className="navbar-left">
                <span className="welcome-message">Welcome, {username}</span>
            </div>
            <div className="navbar-right">
                <button className="icon-btn" onClick={toggleDarkMode}>
                    {darkMode ? <FiSun /> : <FiMoon />}
                </button>
                <button className="icon-btn">
                    <FiBell />
                </button>
                <button className="auth-btn logout-btn" onClick={handleLogout}>
                    <FiLogOut /> <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminNavbar;