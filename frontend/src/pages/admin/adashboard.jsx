import React from 'react';
import Sidebar from "../../components/Admin/adminsidebar";
import Navbar from "../../components/Admin/adminnavbar";
import './adashboard.css'; // Import styles for the dashboard

const AdminDashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="dashboard-content">
          <div className="dashboard-box">
            <h3>Total categories</h3>
            <p>10</p>
          </div>
          <div className="dashboard-box">
            <h3>Pending Orders</h3>
            <p>25</p>
          </div>
          <div className="dashboard-box">
            <h3>Balance Stock</h3>
            <p>300</p>
          </div>
          <div className="dashboard-box">
            <h3>Total Sales</h3>
            <p>5000</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;