import React, { useState } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./orders.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css"; // Import button styles
import "../../components/styles/search-container.css";
import { FiSearch } from 'react-icons/fi';

const Orders = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const orders = [
        {
            id: 1001,
            date: "2025-03-02",
            customer: "John Doe",
            phone: "0711234567",
            address: "Address",
            productCount: 3,
            customizable: "Yes",
            status: "Partly On Work",
        },
        {
            id: 1002,
            date: "2025-03-02",
            customer: "John Doe",
            phone: "0751234567",
            address: "Address",
            productCount: 1,
            customizable: "No",
            status: "Pending",
        },
    ];

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredOrders = orders.filter((order) => {
        return (
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.phone.includes(searchTerm)
        );
    });

    return (
        <div className="orders-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    
                    <div className="top-bar">
                    <div className="top-bar-content">
                            <button className="add-button" >
                                <span className="plus-icon">+</span> Add Order
                            </button>
                        <div className="search-container">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="search-bar"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            </div>
                        </div>
                    </div>
                    <table className="table orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Order Date</th>
                                <th>Customer Name</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Products Count</th>
                                <th>Customizable</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.date}</td>
                                    <td>{order.customer}</td>
                                    <td>{order.phone}</td>
                                    <td>{order.address}</td>
                                    <td>{order.productCount}</td>
                                    <td>{order.customizable}</td>
                                    <td>{order.status}</td>
                                    <td>
                                        <Link to="/admin/order_items" state={{ orderId: order.id }}>
                                            📄 View Details
                                        </Link>
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

export default Orders;