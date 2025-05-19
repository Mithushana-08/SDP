import React, { useState, useEffect } from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./Assignments.css";
import "../../components/styles/table.css";
import "../../components/styles/search-container.css";
import { FiSearch } from "react-icons/fi";
import axios from "axios";

const Assignments = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch assigned orders on component mount
    useEffect(() => {
        axios
            .get("http://localhost:5000/api/crafter/assigned-orders", {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
            })
            .then((response) => {
                console.log("Frontend received assignments:", response.data);
                setAssignments(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching assigned orders:", error);
                setLoading(false);
            });
    }, []);

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Format customizations for display
    const formatCustomizations = (customizations, isCustomizable) => {
        if (!isCustomizable || !customizations || (!customizations.value && !customizations.size && !customizations.image)) {
            return "No customization";
        }
        const parts = [];
        if (customizations.value) parts.push(`Text: ${customizations.value}`);
        if (customizations.size) parts.push(`Size: ${customizations.size}`);
        if (customizations.image) parts.push(`Image: ${customizations.image}`);
        return parts.join(", ") || "No customization";
    };

    // Filter assignments based on search term
    const filteredAssignments = assignments.filter((assignment) => {
        const customizationsString = formatCustomizations(assignment.customizations, assignment.is_customizable);
        return (
            (assignment.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            customizationsString.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (assignment.status || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Handle status change in dropdown
    const handleStatusChange = (e, itemId) => {
        const newStatus = e.target.value;

        // Update the status in the local state
        setAssignments((prevAssignments) =>
            prevAssignments.map((assignment) =>
                assignment.item_id === itemId
                    ? { ...assignment, status: newStatus }
                    : assignment
            )
        );

        // Update the status in the database
        updateStatusInDatabase(itemId, newStatus);
    };

    // Update status in the database
    const updateStatusInDatabase = (itemId, status) => {
        axios
            .put(
                "http://localhost:5000/api/crafter/update-status",
                {
                    item_id: itemId,
                    status: status,
                },
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                    },
                }
            )
            .then((response) => {
                console.log("Status updated successfully:", response.data);
                alert("Status updated successfully!");
            })
            .catch((error) => {
                console.error("Error updating status:", error);
                alert("Failed to update status. Please try again.");
            });
    };

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
                    {loading ? (
                        <p>Loading assignments...</p>
                    ) : (
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
                                    <tr key={assignment.item_id}>
                                        <td>{assignment.item_id}</td>
                                        <td>{assignment.order_id}</td>
                                        <td>{assignment.product_name}</td>
                                        <td>{formatCustomizations(assignment.customizations, assignment.is_customizable)}</td>
                                        <td>{assignment.status}</td>
                                        <td>
                                            <select
                                                value={assignment.status}
                                                onChange={(e) => handleStatusChange(e, assignment.item_id)}
                                                className="styled-status-dropdown"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Completed">Completed</option>
                                            </select>
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

export default Assignments;