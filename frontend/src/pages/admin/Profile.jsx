import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./profile.css"; // Add styles for the profile page

const Profile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        phone: "",
        address: "",
    });
    const [isEditing, setIsEditing] = useState(false);

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
                setFormData({
                    username: response.data.username,
                    phone: response.data.phone,
                    address: response.data.address,
                });
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError("Failed to fetch user profile.");
            }
        };

        fetchUserProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                "http://localhost:5000/api/profile/profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUser((prev) => ({ ...prev, ...formData }));
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile.");
        }
    };

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
                        <div className="form-group">
                            <label><strong>Username:</strong></label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <span>{user.username}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><strong>Role:</strong></label>
                            <span>{user.role}</span>
                        </div>
                        <div className="form-group">
                            <label><strong>Phone:</strong></label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <span>{user.phone}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><strong>Address:</strong></label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <span>{user.address}</span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (isEditing) {
                                    handleUpdate();
                                } else {
                                    setIsEditing(true);
                                }
                            }}
                            className="update-button"
                        >
                            {isEditing ? "Save" : "Update Profile"}
                        </button>
                        {isEditing && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;