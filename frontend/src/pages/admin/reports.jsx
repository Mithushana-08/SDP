import React from 'react';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./reports.css";

const Reports = () => {                                                                                                                                 
    return (
        <div className="reports-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Reports Page</h1>
                    {/* Add more content here */}
                </div>
            </div>
        </div>
    );
};  

export default Reports;