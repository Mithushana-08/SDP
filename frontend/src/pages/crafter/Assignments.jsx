import React, { useState } from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./Assignments.css";
import "../../components/styles/table.css"; // Import the common table styles
import "../../components/styles/search-container.css";
import { FiSearch } from 'react-icons/fi';

const Assignments = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const assignments = [
        {
            orderItemId: 501,
            orderId: 1001,
            productName: "Flower Keytag",
            customizationDetails: "Text: Happy B'day",
            status: "Pending",
        },
        {
            orderItemId: 502,
            orderId: 1002,
            productName: "Wooden Spoon",
            customizationDetails: "Engraving: Initials",
            status: "On Work",
        },
        // Add more assignments as needed
    ];

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredAssignments = assignments.filter((assignment) => {
        return (
            assignment.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.customizationDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="assignments-page">
            <CrafterSidebar />
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
                    <table className="table assignments-table">
                        <thead>
                            <tr>
                                <th>Order Item ID</th>
                                <th>Order ID</th>
                                <th>Product Name</th>
                                <th>Customization Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.map((assignment) => (
                                <tr key={assignment.orderItemId}>
                                    <td>{assignment.orderItemId}</td>
                                    <td>{assignment.orderId}</td>
                                    <td>{assignment.productName}</td>
                                    <td>{assignment.customizationDetails}</td>
                                    <td>{assignment.status}</td>
                                    <td>🔄 Update Status</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Assignments;