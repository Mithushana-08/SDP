import { useState, useEffect } from "react";
import { FiBell, FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./adminnavbar.css";

const AdminNavbar = () => {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // Fetch user profile to get username
    useEffect(() => {
        const token = sessionStorage.getItem("token");
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
                setRole(userData.role || "");
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setUsername("User");
                setRole("");
            }
        };

        fetchUserProfile();
    }, []);

    // Fetch notifications for low/out of stock
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/notifications/stock", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (!response.ok) throw new Error("Failed to fetch notifications");
                const data = await response.json();
                setNotifications(data);
                // Check localStorage for read notifications
                const readIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");
                const unread = data.filter(n => !readIds.includes(n.product_id));
                setUnreadCount(unread.length);
            } catch (error) {
                setNotifications([]);
                setUnreadCount(0);
            }
        };
        fetchNotifications();
    }, []);

    // Mark all as read when navigating to notification page
    useEffect(() => {
        if (window.location.pathname === "/admin/notifications" && notifications.length > 0) {
            const ids = notifications.map(n => n.product_id);
            localStorage.setItem("readNotifications", JSON.stringify(ids));
            setUnreadCount(0);
        }
    }, [notifications]);

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
                {role === "admin" ? (
                    <button className="icon-btn" onClick={() => navigate('/admin/notifications')}>
                        <FiBell />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                fontSize: '0.7em',
                                width: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2
                            }}>{unreadCount}</span>
                        )}
                    </button>
                ) : role === "crafter" ? (
                    <button className="icon-btn" onClick={() => navigate('/crafter/notifications')}>
                        <FiBell />
                    </button>
                ) : null}
                <button className="auth-btn logout-btn" onClick={handleLogout}>
                    <FiLogOut /> <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminNavbar;