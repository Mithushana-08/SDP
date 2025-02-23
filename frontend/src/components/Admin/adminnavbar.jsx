import { useState, useEffect } from "react";
import { FiBell, FiSun, FiMoon,  FiLogOut } from "react-icons/fi"; // Icons
import "./adminnavbar.css"; // Import styles

const AdminNavbar = () => {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        document.body.classList.toggle("dark-mode", newMode);
        localStorage.setItem("theme", newMode ? "dark" : "light");
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
                
            </div>
            <div className="navbar-right">
                <button className="icon-btn" onClick={toggleDarkMode}>
                    {darkMode ? <FiSun /> : <FiMoon />}
                </button>
                <button className="icon-btn">
                    <FiBell />
                </button>
                 <button className="auth-btn logout-btn">
                    <FiLogOut /> <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminNavbar;
