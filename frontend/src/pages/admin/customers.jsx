import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./customers.css";
import "../../components/styles/table.css";

import { FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState([]); // Ensure this is an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/customers/customers");
                if (!response.ok) {
                    throw new Error("Failed to fetch customers");
                }
                const data = await response.json();
                console.log("Fetched customers:", data); // Log the response
                setCustomers(Array.isArray(data) ? data : []); // Ensure customers is an array
                setLoading(false);
            } catch (err) {
                console.error("Error fetching customers:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredCustomers = Array.isArray(customers)
        ? customers.filter((customer) =>
              (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];

    return (
        <div className="customers-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <button className="add-button">
                                <span className="plus-icon">+</span> Add Customer
                            </button>
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <p>Loading customers...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <table className="table customers-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone Number</th>
                                    <th>Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.username}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.address || "N/A"}</td>
                                        <td>
                                            <button className="edit-button">
                                                <FiEdit />
                                            </button>
                                            <button className="delete-button">
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Customers;