
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { FiEdit, FiTrash2, FiSearch, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./roles.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css";
import "../../components/styles/search-container.css";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';

const Roles = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ id: "", username: "", password: "", email: "", role: "", phone: "", lane1: "", lane2: "", city: "" });
    const [isEditMode, setIsEditMode] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [lane1Error, setLane1Error] = useState("");
    const [cityError, setCityError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        axios.get("http://localhost:5000/api/user/users")
            .then(response => setUsers(response.data))
            .catch(err => console.error("Error fetching users:", err));
    };

    const handleSearch = e => setSearchTerm(e.target.value);

    const handleChange = e => {
        const { name, value } = e.target;

        if (name === "phone") {
            if (value.length !== 10 || !/^\d+$/.test(value)) {
                setPhoneError("Phone number must be exactly 10 digits");
            } else {
                setPhoneError("");
            }
        }

        if (name === "password") {
            if (value.length < 6) {
                setPasswordError("Password must be at least 6 characters long");
            } else {
                setPasswordError("");
            }
        }

        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setEmailError("Please enter a valid email address");
            } else {
                setEmailError("");
            }
        }

        if (name === "lane1") {
            if (!value.trim()) {
                setLane1Error("Lane 1 is required");
            } else {
                setLane1Error("");
            }
        }

        if (name === "city") {
            if (!value.trim()) {
                setCityError("City is required");
            } else {
                setCityError("");
            }
        }

        setNewUser({ ...newUser, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let hasError = false;

        if (newUser.phone.length !== 10 || !/^\d+$/.test(newUser.phone)) {
            setPhoneError("Phone number must be exactly 10 digits");
            hasError = true;
        } else {
            setPhoneError("");
        }

        if (!isEditMode && newUser.password.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            hasError = true;
        } else {
            setPasswordError("");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUser.email)) {
            setEmailError("Please enter a valid email address");
            hasError = true;
        } else {
            setEmailError("");
        }

        if (!newUser.lane1.trim()) {
            setLane1Error("Lane 1 is required");
            hasError = true;
        } else {
            setLane1Error("");
        }

        if (!newUser.city.trim()) {
            setCityError("City is required");
            hasError = true;
        } else {
            setCityError("");
        }

        if (hasError) {
            return;
        }

        try {
            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/user/users/${newUser.id}`, {
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone,
                    lane1: newUser.lane1,
                    lane2: newUser.lane2,
                    city: newUser.city
                });
            } else {
                await axios.post("http://localhost:5000/api/user/users", {
                    username: newUser.username,
                    password: newUser.password,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone,
                    lane1: newUser.lane1,
                    lane2: newUser.lane2,
                    city: newUser.city
                });
            }
            closeModal();
            fetchUsers();
            Swal.fire({
                title: isEditMode ? "Updated!" : "Added!",
                text: `User has been ${isEditMode ? "updated" : "added"} successfully.`,
                icon: "success",
                customClass: {
                    confirmButton: "btn btn-success"
                },
                buttonsStyling: false
            });
        } catch (err) {
            console.error("Error saving user:", err);
            Swal.fire({
                title: "Error!",
                text: `Failed to ${isEditMode ? "update" : "add"} user.`,
                icon: "error",
                customClass: {
                    confirmButton: "btn btn-danger"
                },
                buttonsStyling: false
            });
        }
    };

    const handleEdit = (user) => {
        setNewUser({ ...user, password: "" }); // Reset password field for edit
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        swalWithBootstrapButtons.fire({
            title: "Are you sure?",
            text: "Do you want to terminate this user? (User will be set to non-active)",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, terminate!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`http://localhost:5000/api/user/users/${id}/status`, { status: 'non-active' });
                    fetchUsers();
                    swalWithBootstrapButtons.fire({
                        title: "Terminated!",
                        text: "User has been set to non-active.",
                        icon: "success",
                        customClass: {
                            confirmButton: "btn btn-success"
                        },
                        buttonsStyling: false
                    });
                } catch (err) {
                    swalWithBootstrapButtons.fire({
                        title: "Error!",
                        text: "Failed to terminate user.",
                        icon: "error",
                        customClass: {
                            confirmButton: "btn btn-danger"
                        },
                        buttonsStyling: false
                    });
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled",
                    text: "User is still active.",
                    icon: "error",
                    customClass: {
                        confirmButton: "btn btn-danger"
                    },
                    buttonsStyling: false
                });
            }
        });
    };

    const handleReactivate = async (id) => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        swalWithBootstrapButtons.fire({
            title: "Are you sure?",
            text: "Do you want to activate this user?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, activate!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`http://localhost:5000/api/user/users/${id}/status`, { status: 'active' });
                    fetchUsers();
                    swalWithBootstrapButtons.fire({
                        title: "Activated!",
                        text: "User has been set to active.",
                        icon: "success",
                        customClass: {
                            confirmButton: "btn btn-success"
                        },
                        buttonsStyling: false
                    });
                } catch (err) {
                    swalWithBootstrapButtons.fire({
                        title: "Error!",
                        text: "Failed to activate user.",
                        icon: "error",
                        customClass: {
                            confirmButton: "btn btn-danger"
                        },
                        buttonsStyling: false
                    });
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled",
                    text: "User is still non-active.",
                    icon: "error",
                    customClass: {
                        confirmButton: "btn btn-danger"
                    },
                    buttonsStyling: false
                });
            }
        });
    };

    const openAddModal = () => {
        setNewUser({ id: "", username: "", password: "", email: "", role: "", phone: "", lane1: "", lane2: "", city: "" });
        setIsEditMode(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setPhoneError("");
        setPasswordError("");
        setEmailError("");
        setLane1Error("");
        setCityError("");
    };

    const formatAddress = (user) => {
        const parts = [user.lane1];
        if (user.lane2) parts.push(user.lane2);
        parts.push(user.city);
        return parts.join(", ");
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatAddress(user).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="roles-page">
            <AdminSidebar />
            <div className="main-user-content">
                <AdminNavbar />
                <div className="user-content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <button className="add-button" onClick={openAddModal}>
                                <span className="plus-icon">+</span> Add User
                            </button>
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>
                    </div>
                    <table className="table roles-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{formatAddress(user)}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.role}</td>
                                    <td>{user.status || 'active'}</td>
                                    <td>
                                        {(!user.status || user.status === 'active') && (
                                            <>
                                                <button className="edit-button" onClick={() => handleEdit(user)}><FiEdit /></button>
                                                <button className="delete-button" onClick={() => handleDelete(user.id)}><FiTrash2 /></button>
                                            </>
                                        )}
                                        {user.status === 'non-active' && (
                                            <button className="reactivate-button" onClick={() => handleReactivate(user.id)} title="Reactivate User">
                                                <FiRefreshCw />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showModal && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <form onSubmit={handleSubmit}>
                                    {isEditMode && (
                                        <input
                                            name="id"
                                            placeholder="User ID"
                                            value={newUser.id}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    )}
                                    <input
                                        name="username"
                                        placeholder="Username"
                                        value={newUser.username}
                                        onChange={handleChange}
                                        required
                                    />
                                    {!isEditMode && (
                                        <input
                                            name="password"
                                            type="password"
                                            placeholder="Password"
                                            value={newUser.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    )}
                                    {passwordError && <span className="error-message">{passwordError}</span>}
                                    <input
                                        name="email"
                                        placeholder="Email"
                                        value={newUser.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {emailError && <span className="error-message">{emailError}</span>}
                                    <input
                                        name="lane1"
                                        placeholder="Lane 1"
                                        value={newUser.lane1}
                                        onChange={handleChange}
                                        required
                                    />
                                    {lane1Error && <span className="error-message">{lane1Error}</span>}
                                    <input
                                        name="lane2"
                                        placeholder="Lane 2 (Optional)"
                                        value={newUser.lane2}
                                        onChange={handleChange}
                                    />
                                    <input
                                        name="city"
                                        placeholder="City"
                                        value={newUser.city}
                                        onChange={handleChange}
                                        required
                                    />
                                    {cityError && <span className="error-message">{cityError}</span>}
                                    <input
                                        name="phone"
                                        placeholder="Phone"
                                        value={newUser.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                    {phoneError && <span className="error-message">{phoneError}</span>}
                                    <select
                                        name="role"
                                        value={newUser.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        <option value="admin">Admin</option>
                                        <option value="crafter">Crafter</option>
                                        
                                    </select>
                                    <div className="modal-buttons">
                                        <button type="submit"><FiCheck /> {isEditMode ? "Update" : "Add"}</button>
                                        <button type="button" onClick={closeModal}><FiX /> Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Roles;