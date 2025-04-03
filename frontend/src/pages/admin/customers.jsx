import React, { useState } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./customers.css";
import "../../components/styles/table.css";


import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const customers = [
        {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            phone: "0712345678",
            status: "Active",
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "0723456789",
            status: "Inactive",
        },
        // Add more customers as needed
    ];

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredCustomers = customers.filter((customer) => {
        return customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="customers-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                    <div className="top-bar-content">
                            <button className="add-button" >
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
                    <table className="table customers-table">
                        <thead>
                            <tr>
                                <th>Customer ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td>{customer.name}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.status}</td>
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
                </div>
            </div>
        </div>
    );
};

export default Customers;