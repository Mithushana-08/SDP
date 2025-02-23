import React from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./orders.css";

const Orders = () => {
    return (
        <div className="ordders-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Orders Page</h1>
                    {/* Add more content here */}
                </div>
            </div>
        </div>
    );
};

export default Orders;