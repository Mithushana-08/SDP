import React, { useState } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./crafter_assign.css";
import "../../components/styles/buttons.css"; // Import button styles
import "../../components/styles/search-container.css";
import { FiSearch } from 'react-icons/fi';

const CrafterAssign = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const orderItems = [
        {
            orderItemId: 501,
            orderId: 1001,
            productName: "Flower Keytag",
            crafter: "Kumara",
            status: "On Work",
        },
        {
            orderItemId: 502,
            orderId: 1002,
            productName: "Wooden Spoon",
            crafter: "Nimal",
            status: "Pending",
        },
        // Add more order items as needed
    ];

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredOrderItems = orderItems.filter((item) => {
        return (
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.crafter.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="crafter-assign-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                           
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                    <table className="table crafter-assign-table">
                        <thead>
                            <tr>
                                <th>Order Item ID</th>
                                <th>Order ID</th>
                                <th>Product Name</th>
                                <th>Crafter</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrderItems.map((item) => (
                                <tr key={item.orderItemId}>
                                    <td>{item.orderItemId}</td>
                                    <td>{item.orderId}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.crafter}</td>
                                    <td>{item.status}</td>
                                    <td>🔄 Reassign</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CrafterAssign;