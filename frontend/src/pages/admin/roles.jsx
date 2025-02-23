import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import "./roles.css"; 

const Roles = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false); // State for popup
    const [newUser, setNewUser] = useState({ username: "", password: "", role: "" });
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch users from the backend
    const fetchUsers = () => {
        axios.get("http://localhost:5000/api/user/users") // Ensure correct endpoint
            .then((response) => {
                setUsers(response.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the users!", error);
            });
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle input changes in the form
    const handleChange = (e) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                // Update user
                const response = await axios.put(`http://localhost:5000/api/user/users/${editingUser.id}`, newUser);
                setUsers(users.map(user => user.id === editingUser.id ? response.data : user));
            } else {
                // Add new user
                const response = await axios.post("http://localhost:5000/api/user/users", newUser);
                setUsers([...users, response.data]); // Update user list with new user
            }
            setShowModal(false); // Close modal
            setNewUser({ username: "", password: "", role: "" }); // Reset form
            setIsEditMode(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error adding/updating user:", error);
        }
    };

    // Handle edit button click
    const handleEditClick = (user) => {
        setNewUser({ username: user.username, password: user.password, role: user.role });
        setEditingUser(user);
        setIsEditMode(true);
        setShowModal(true);
    };

    // Handle delete button click
    const handleDeleteClick = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/user/users/${id}`);
            setUsers(users.filter(user => user.id !== id)); // Remove user from state
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <div className="roles-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <button className="add-role-button" onClick={() => {
                            setShowModal(true);
                            setIsEditMode(false);
                            setNewUser({ username: "", password: "", role: "" });
                        }}>
                            <span className="plus-icon">+</span> Add User
                        </button>
                        
                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search here..." 
                                className="search-bar" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <table className="roles-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>User Name</th>
                                <th>Password</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.password}</td> 
                                    <td>{user.role}</td>
                                    <td>
                                        <button className="edit-button" onClick={() => handleEditClick(user)}>
                                            <FaEdit />
                                        </button>
                                        <button className="delete-button" onClick={() => handleDeleteClick(user.id)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Popup Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{isEditMode ? "Edit User" : "Add New User"}</h3>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={newUser.username}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={newUser.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                            <input
                                type="text"
                                name="role"
                                placeholder="Role"
                                value={newUser.role}
                                onChange={handleChange}
                                required
                                autoComplete="role"
                            />
                            <div className="modal-buttons">
                                <button type="submit">{isEditMode ? "Change" : "Add"}</button>
                                <button type="button" onClick={() => {
                                    setShowModal(false);
                                    setIsEditMode(false);
                                    setNewUser({ username: "", password: "", role: "" });
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;