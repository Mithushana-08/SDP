import React from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./Assignments.css";
import "../../components/styles/table.css"; // Import the common table styles

const Assignments = () => {
    return (
        <div className="assignments-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Order Assignments</h1>
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
                            <tr>
                                <td>501</td>
                                <td>1001</td>
                                <td>Flower Keytag</td>
                                <td>Text: Happy B'day</td>
                                <td>Pending</td>
                                <td>🔄 Update Status</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Assignments;