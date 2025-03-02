import React from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./crafter_assign.css";

const CrafterAssign = () => {
    return (
        <div className="crafter-assign-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Crafter Assignment Page</h1>
                    <table className="crafter-assign-table">
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
                            <tr>
                                <td>501</td>
                                <td>1001</td>
                                <td>Flower Keytag</td>
                                <td>Kumara</td>
                                <td>On Work</td>
                                <td>🔄 Reassign</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CrafterAssign;