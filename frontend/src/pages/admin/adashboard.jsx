import React, { useState, useEffect } from 'react';
import Sidebar from "../../components/Admin/adminsidebar";
import Navbar from "../../components/Admin/adminnavbar";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaTags, FaBox, FaWarehouse, FaShoppingCart, FaClock, FaCheckCircle } from 'react-icons/fa';
import './adashboard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalStock: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    salesData: {
      labels: [],
      datasets: [{
        label: 'Sales ($)',
        data: [],
        borderColor: '#4a90e2', // Blue to match image
        backgroundColor: 'rgba(74, 144, 226, 0.2)', // Shaded fill to match image
        fill: true, // Enable fill below the line
        tension: 0.1
      }]
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/api/dashboard/dashboard-report', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const text = await response.text();
          console.log('Fetch error response:', {
            status: response.status,
            statusText: response.statusText,
            body: text
          });
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }
        const data = await response.json();

        setDashboardData({
          totalCategories: data.totalCategories || 0,
          totalProducts: data.totalProducts || 0,
          totalStock: data.totalStock || 0,
          totalOrders: data.totalOrders || 0,
          pendingOrders: data.pendingOrders || 0,
          confirmedOrders: data.confirmedOrders || 0,
          salesData: {
            labels: data.salesData?.labels || [],
            datasets: [{
              label: 'Sales ($)',
              data: data.salesData?.datasets?.[0]?.data || [],
              borderColor: '#4a90e2', // Blue to match image
              backgroundColor: 'rgba(74, 144, 226, 0.2)', // Shaded fill to match image
              fill: true, // Enable fill below the line
              tension: 0.1
            }]
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="dashboard-content">
          {loading ? (
            <p>Loading dashboard data...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <>
              {/* First Row: Total Categories, Total Products, Total Stock */}
              <div className="dashboard-row">
                <div className="dashboard-box c1">
                  <div className="icon-wrapper">
                    <FaTags />
                  </div>
                  <h3>Total Categories</h3>
                  <p>{dashboardData.totalCategories}</p>
                </div>
                <div className="dashboard-box c2">
                  <div className="icon-wrapper">
                    <FaBox />
                  </div>
                  <h3>Total Products</h3>
                  <p>{dashboardData.totalProducts}</p>
                </div>
                <div className="dashboard-box c3">
                  <div className="icon-wrapper">
                    <FaWarehouse />
                  </div>
                  <h3>Total Stock</h3>
                  <p>{dashboardData.totalStock}</p>
                </div>
              </div>
              {/* Second Row: Total Orders, Pending Orders, Confirmed Orders */}
              <div className="dashboard-row">
                <div className="dashboard-box c4">
                  <div className="icon-wrapper">
                    <FaShoppingCart />
                  </div>
                  <h3>Total Orders</h3>
                  <p>{dashboardData.totalOrders}</p>
                </div>
                <div className="dashboard-box c5">
                  <div className="icon-wrapper">
                    <FaClock />
                  </div>
                  <h3>Pending Orders</h3>
                  <p>{dashboardData.pendingOrders}</p>
                </div>
                <div className="dashboard-box c6">
                  <div className="icon-wrapper">
                    <FaCheckCircle />
                  </div>
                  <h3>Confirmed Orders</h3>
                  <p>{dashboardData.confirmedOrders}</p>
                </div>
              </div>
              {/* Sales Graph */}
              <div className="dashboard-graph">
                <h3>Sales Over Time</h3>
                {dashboardData.salesData.labels && dashboardData.salesData.labels.length > 0 ? (
                  <Line
                    data={dashboardData.salesData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: {
                          display: true,
                          text: 'Sales Trend'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Sales Amount ($)'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <p>No sales data available</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;