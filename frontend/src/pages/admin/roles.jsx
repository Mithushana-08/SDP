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
            const response = await axios.post("http://localhost:5000/api/user/users", newUser);
            setUsers([...users, response.data]); // Update user list with new user
            setShowModal(false); // Close modal
            setNewUser({ username: "", password: "", role: "" }); // Reset form
        } catch (error) {
            console.error("Error adding user:", error);
        }
    };

    return (
        <div className="roles-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <button className="add-role-button" onClick={() => setShowModal(true)}>
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
                                        <button className="edit-button">
                                            <FaEdit />
                                        </button>
                                        <button className="delete-button">
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
                        <h3>Add New User</h3>
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
                                <button type="submit">Add</button>
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;