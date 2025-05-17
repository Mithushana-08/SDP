import React, { useEffect, useState } from "react";
import axios from "axios";
import CrafterSidebar from "../../components/Admin/craftersidebar"; // Updated to crafter-specific sidebar
import AdminNavbar from "../../components/Admin/adminnavbar"; // Reused for consistency

const CrafterSettings = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        phone: "",
        address: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("No token found. Please log in.");
            setIsLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/profile/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const userData = response.data;
                if (userData.role !== "crafter") {
                    setError("Access denied. This page is for crafters only.");
                    setIsLoading(false);
                    return;
                }

                setUser(userData);
                setFormData({
                    username: userData.username || "",
                    phone: userData.phone || "",
                    address: userData.address || "",
                });
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching crafter profile:", err);
                setError("Failed to fetch crafter profile.");
                setIsLoading(false);
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
            alert("Profile updated successfully!"); // Replace with toast for better UX
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile.");
        }
    };

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!user) {
        return <p>No crafter profile found.</p>;
    }

    return (
        <div className="crafter-settings-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Crafter Profile</h1>
                    <div className="profile-details">
                        <div className="form-group">
                            <label><strong>Username:</strong></label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
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
                                    pattern="[0-9]{10}"
                                    title="Phone number must be 10 digits"
                                />
                            ) : (
                                <span>{user.phone || "Not provided"}</span>
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
                                <span>{user.address || "Not provided"}</span>
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

export default CrafterSettings;