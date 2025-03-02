import React from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";


const CrafterDashboard = () => {
    return (
        <div className="dashboard-container">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
               
            </div>
        </div>
    );
};

export default CrafterDashboard;