import React from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./customers.css";

const Customers = () => {
    return (
        <div className="customers-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Customers Page</h1>
                    {/* Add more content here */}
                </div>
            </div>
        </div>
    );
}           

export default Customers;