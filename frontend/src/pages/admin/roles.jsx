import React, { useState, useEffect } from "react";
import axios from 'axios';
import { FiEdit, FiTrash2, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./roles.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css"; // Import button styles
import "../../components/styles/search-container.css"; // Import search container styles

const Roles = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ id: "", username: "", password: "", role: "", phone: "", address: "" });
    const [isEditMode, setIsEditMode] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [passwordError, setPasswordError] = useState("");

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
    
           

        if (name === "password") {
            if (value.length < 6) {
                setPasswordError("Password must be at least 6 characters long");
            } else {
                setPasswordError("");
            }
        }
    
        setNewUser({ ...newUser, [name]: value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        let hasError = false;
    
        if (newUser.phone.length !== 10) {
            setPhoneError("Phone number must be exactly 10 digits");
            hasError = true;
        } else {
            setPhoneError("");
        }
    
        if (newUser.password.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            hasError = true;
        } else {
            setPasswordError("");
        }
    
        if (hasError) {
            return;
        }
    
        try {
            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/user/users/${newUser.id}`, newUser);
            } else {
                await axios.post("http://localhost:5000/api/user/users", newUser);
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            console.error("Error saving user:", err);
        }
    };

    const handleEdit = (user) => {
        setNewUser(user);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await axios.delete(`http://localhost:5000/api/user/users/${id}`);
            fetchUsers();
        }
    };

    const openAddModal = () => {
        setNewUser({ id: "", username: "", password: "", role: "", phone: "", address: "" });
        setIsEditMode(false);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="roles-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
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
                                <th>Password</th>
                                <th>Address</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.password}</td>
                                    <td>{user.address}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button className="edit-button" onClick={() => handleEdit(user)}><FiEdit /></button>
                                        <button className="delete-button" onClick={() => handleDelete(user.id)}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showModal && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <form onSubmit={handleSubmit}>
                                    <input name="id" placeholder="User ID" value={newUser.id} onChange={handleChange} required />
                                    <input name="username" placeholder="Username" value={newUser.username} onChange={handleChange} required />
                                    <input name="password" type="password" placeholder="Password" value={newUser.password} onChange={handleChange} required />
                                    {passwordError && <span className="error-message">{passwordError}</span>}
                                    <input name="address" placeholder="Address" value={newUser.address} onChange={handleChange} required />
                                    <input name="phone" placeholder="Phone" value={newUser.phone} onChange={handleChange} required />
                                    {phoneError && <span className="error-message">{phoneError}</span>}
                                    <select name="role" value={newUser.role} onChange={handleChange} required>
                                        <option value="">Select Role</option>
                                        <option value="admin">Admin</option>
                                        <option value="crafter">Crafter</option>
                                        <option value="delivery">Delivery</option>
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

}
export default Roles;