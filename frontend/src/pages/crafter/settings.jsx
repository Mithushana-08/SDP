import React, { useEffect, useState } from "react";
import axios from "axios";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { FiEdit, FiLock } from "react-icons/fi";

const CrafterSettings = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        lane1: "",
        lane2: "",
        city: "",
    });
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            setError("No token found. Please log in.");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/profile/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = response.data;
                if (userData.role !== "crafter") {
                    setError("Access denied. This page is for crafters only.");
                    return;
                }
                setUser(userData);
                setFormData({
                    firstName: userData.username?.split(" ")[0] || "",
                    lastName: userData.username?.split(" ").slice(1).join(" ") || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    lane1: userData.lane1 || "",
                    lane2: userData.lane2 || "",
                    city: userData.city || "",
                });
            } catch (err) {
                console.error("Error fetching crafter profile:", err);
                setError(err.response?.data?.message || "Failed to fetch crafter profile.");
            }
        };

        fetchUserProfile();
    }, []);

    // Handle profile image change
    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setProfileImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
        if (name === "currentPassword" && !value.trim()) setPasswordErrors((prev) => ({ ...prev, currentPassword: "Current password is required" }));
        else if (name === "currentPassword") setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
        if (name === "newPassword") {
            if (value.length < 6) setPasswordErrors((prev) => ({ ...prev, newPassword: "New password must be at least 6 characters long" }));
            else setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
            if (passwordData.confirmPassword && value !== passwordData.confirmPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
            else if (passwordData.confirmPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
        if (name === "confirmPassword") {
            if (value !== passwordData.newPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
            else setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
    };

    const validateForm = (section) => {
        let hasError = false;
        const newErrors = {};
        if (section === "personal") {
            if (!formData.firstName.trim()) { newErrors.firstName = "First name is required"; hasError = true; }
            if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = "Valid email is required"; hasError = true; }
            if (!formData.phone.trim() || formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) { newErrors.phone = "Phone must be 10 digits"; hasError = true; }
        } else if (section === "address") {
            if (!formData.lane1.trim()) { newErrors.lane1 = "Lane 1 is required"; hasError = true; }
            if (!formData.city.trim()) { newErrors.city = "City is required"; hasError = true; }
        }
        setPasswordErrors((prev) => ({ ...prev, ...newErrors }));
        return !hasError;
    };

    const validatePasswordForm = () => {
        let hasError = false;
        const newErrors = {};
        if (!passwordData.currentPassword.trim()) { newErrors.currentPassword = "Current password is required"; hasError = true; }
        if (!passwordData.newPassword.trim() || passwordData.newPassword.length < 6) { newErrors.newPassword = "New password must be at least 6 characters"; hasError = true; }
        if (!passwordData.confirmPassword.trim() || passwordData.confirmPassword !== passwordData.newPassword) { newErrors.confirmPassword = "Passwords must match"; hasError = true; }
        setPasswordErrors((prev) => ({ ...prev, ...newErrors }));
        return !hasError;
    };

    const handleUpdatePersonal = async () => {
        if (!validateForm("personal")) return;
        const token = sessionStorage.getItem("token");
        try {
            const form = new FormData();
            form.append("username", `${formData.firstName} ${formData.lastName}`.trim());
            form.append("email", formData.email);
            form.append("phone", formData.phone);
            if (profileImage) form.append("profileImage", profileImage);
            if (user?.profile_image) form.append("existingImage", user.profile_image);
            const response = await axios.put(
                "http://localhost:5000/api/profile/profile",
                form,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );
            setUser((prev) => ({
                ...prev,
                username: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone,
                profile_image: response.data.profileImage || prev.profile_image
            }));
            setIsEditingPersonal(false);
            alert("Personal information updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.message || "Failed to update profile.");
        }
    };

    const handleUpdateAddress = async () => {
        if (!validateForm("address")) return;
        const token = sessionStorage.getItem("token");
        try {
            const response = await axios.put(
                "http://localhost:5000/api/profile/profile",
                { lane1: formData.lane1, lane2: formData.lane2, city: formData.city },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser((prev) => ({ ...prev, lane1: formData.lane1, lane2: formData.lane2, city: formData.city }));
            setIsEditingAddress(false);
            alert("Address updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.message || "Failed to update profile.");
        }
    };

    const handlePasswordUpdate = async () => {
        if (!validatePasswordForm()) return;
        const token = sessionStorage.getItem("token");
        try {
            await axios.put(
                "http://localhost:5000/api/profile/password",
                { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEditingPassword(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
            alert("Password updated successfully!");
        } catch (err) {
            console.error("Error updating password:", err);
            setError(err.response?.data?.message || "Failed to update password.");
        }
    };

    const cancelEdit = (section) => {
        if (section === "personal") setIsEditingPersonal(false);
        if (section === "address") setIsEditingAddress(false);
        if (section === "password") setIsEditingPassword(false);
        setFormData({
            firstName: user?.username?.split(" ")[0] || "",
            lastName: user?.username?.split(" ").slice(1).join(" ") || "",
            email: user?.email || "",
            phone: user?.phone || "",
            lane1: user?.lane1 || "",
            lane2: user?.lane2 || "",
            city: user?.city || "",
        });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
    };

    if (error) return <p className="error-message text-base">{error}</p>;
    if (!user) return <p className="text-base">Loading...</p>;

    return (
        <div className="profile-page">
            <CrafterSidebar />
            <div className="main-user-content">
                <AdminNavbar />
                <div className="user-content">
                    <h1 className="page-title text-2xl">My Profile</h1>
                    <div className="profile-card border border-gray-300 rounded-lg">
                        <div className="profile-header">
                            <img src={previewImage || (user?.profile_image ? `http://localhost:5000${user.profile_image}` : "/path/to/profile-image.jpg")} alt="Profile" className="profile-image" />
                            <div>
                                <h2 className="profile-name text-xl">{user.username}</h2>
                                <p className="profile-role text-lg">{user.role}, {user.city || "Unknown"}</p>
                                {isEditingPersonal && (
                                    <div style={{ marginTop: 10 }}>
                                        <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="profile-card border border-gray-300 rounded-lg">
                        <div className="card-header">
                            <h3 className="card-title text-xl">Personal Information</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    className="edit-button text-lg"
                                    onClick={() => {
                                        if (isEditingPersonal) {
                                            handleUpdatePersonal();
                                        } else {
                                            setIsEditingPersonal(true);
                                        }
                                    }}
                                >
                                    <FiEdit />
                                </button>
                                {isEditingPersonal && (
                                    <button className="cancel-button text-lg" onClick={() => cancelEdit("personal")}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label text-lg">First Name</span>
                                    {isEditingPersonal ? (
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.username.split(" ")[0] || "N/A"}</span>
                                    )}
                                    {passwordErrors.firstName && <span className="error-message text-base">{passwordErrors.firstName}</span>}
                                </div>
                               
                                <div className="info-item">
                                    <span className="info-label text-lg">Email Address</span>
                                    {isEditingPersonal ? (
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.email || "N/A"}</span>
                                    )}
                                    {passwordErrors.email && <span className="error-message text-base">{passwordErrors.email}</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label text-lg">Phone Number</span>
                                    {isEditingPersonal ? (
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            pattern="[0-9]{10}"
                                            title="10 digits"
                                            required
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.phone || "N/A"}</span>
                                    )}
                                    {passwordErrors.phone && <span className="error-message text-base">{passwordErrors.phone}</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label text-lg">User Role</span>
                                    <span className="info-value text-lg">{user.role || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="profile-card border border-gray-300 rounded-lg">
                        <div className="card-header">
                            <h3 className="card-title text-xl">Address</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    className="edit-button text-lg"
                                    onClick={() => {
                                        if (isEditingAddress) {
                                            handleUpdateAddress();
                                        } else {
                                            setIsEditingAddress(true);
                                        }
                                    }}
                                >
                                    <FiEdit />
                                </button>
                                {isEditingAddress && (
                                    <button className="cancel-button text-lg" onClick={() => cancelEdit("address")}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label text-lg">Lane 1</span>
                                    {isEditingAddress ? (
                                        <input
                                            type="text"
                                            name="lane1"
                                            value={formData.lane1}
                                            onChange={handleInputChange}
                                            required
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.lane1 || "N/A"}</span>
                                    )}
                                    {passwordErrors.lane1 && <span className="error-message text-base">{passwordErrors.lane1}</span>}
                                </div>
                               
                                <div className="info-item">
                                    <span className="info-label text-lg">Lane 2</span>
                                    {isEditingAddress ? (
                                        <input
                                            type="text"
                                            name="lane2"
                                            value={formData.lane2}
                                            onChange={handleInputChange}
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.lane2 || "N/A"}</span>
                                    )}
                                </div>
                                 <div className="info-item">
                                    <span className="info-label text-lg">City</span>
                                    {isEditingAddress ? (
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                            className="text-lg"
                                        />
                                    ) : (
                                        <span className="info-value text-lg">{user.city || "N/A"}</span>
                                    )}
                                    {passwordErrors.city && <span className="error-message text-base">{passwordErrors.city}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="profile-card border border-gray-300 rounded-lg">
                        <div className="card-header">
                            <h3 className="card-title text-xl">Change Password</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    className="edit-button text-lg"
                                    onClick={() => {
                                        if (isEditingPassword) {
                                            handlePasswordUpdate();
                                        } else {
                                            setIsEditingPassword(true);
                                        }
                                    }}
                                >
                                    <FiLock />
                                </button>
                                {isEditingPassword && (
                                    <button className="cancel-button text-lg" onClick={() => cancelEdit("password")}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        {isEditingPassword && (
                            <div className="card-content">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label text-lg">Current Password</span>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="text-lg"
                                        />
                                        {passwordErrors.currentPassword && (
                                            <span className="error-message text-base">{passwordErrors.currentPassword}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label text-lg">New Password</span>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="text-lg"
                                        />
                                        {passwordErrors.newPassword && (
                                            <span className="error-message text-base">{passwordErrors.newPassword}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label text-lg">Confirm New Password</span>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="text-lg"
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <span className="error-message text-base">{passwordErrors.confirmPassword}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrafterSettings;