import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./profile.css"; // Add styles for the profile page

const Profile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("No token found. Please log in.");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/profile/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError("Failed to fetch user profile.");
            }
        };

        fetchUserProfile();
    }, []);

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="profile-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>User Profile</h1>
                    <div className="profile-details">
                       
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                        <p><strong>Phone:</strong> {user.phone}</p>
                        <p><strong>Address:</strong> {user.address}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
