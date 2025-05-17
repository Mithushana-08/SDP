import React, { useState, useEffect } from 'react';
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaUpload, FaShoppingCart, FaClock } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CrafterDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        totalWorkUploads: 0,
        totalOrderAssignments: 0,
        pendingAssignments: 0,
        performanceData: {
            labels: [],
            datasets: [
                {
                    label: 'Work Uploads',
                    data: [],
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Order Assignments',
                    data: [],
                    borderColor: '#e94e77',
                    backgroundColor: 'rgba(233, 78, 119, 0.2)',
                    fill: true,
                    tension: 0.1
                }
            ]
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCrafterDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token'); // Adjust key if different
                if (!token) {
                    throw new Error('No authentication token found. Please log in.');
                }
                const response = await fetch('http://localhost:5000/api/crafter-dashboard/dashboard-report', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.statusText}`);
                }
                const data = await response.json();

                setDashboardData({
                    totalWorkUploads: data.totalWorkUploads || 0,
                    totalOrderAssignments: data.totalOrderAssignments || 0,
                    pendingAssignments: data.pendingAssignments || 0,
                    performanceData: {
                        labels: data.performanceData?.labels || [],
                        datasets: [
                            {
                                label: 'Work Uploads',
                                data: data.performanceData?.datasets?.[0]?.data || [],
                                borderColor: '#4a90e2',
                                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                                fill: true,
                                tension: 0.1
                            },
                            {
                                label: 'Order Assignments',
                                data: data.performanceData?.datasets?.[1]?.data || [],
                                borderColor: '#e94e77',
                                backgroundColor: 'rgba(233, 78, 119, 0.2)',
                                fill: true,
                                tension: 0.1
                            }
                        ]
                    }
                });
            } catch (error) {
                console.error('Error fetching crafter dashboard data:', error);
                setError(error.message || 'Unable to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCrafterDashboardData();
    }, []);

    return (
        <div className="dashboard-container">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="dashboard-content">
                    {loading ? (
                        <p>Loading dashboard data...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <>
                            {/* Dashboard Row: Total Work Uploads, Total Order Assignments, Pending Assignments */}
                            <div className="dashboard-row">
                                <div className="dashboard-box c1">
                                    <div className="icon-wrapper">
                                        <FaUpload />
                                    </div>
                                    <h3>Total Work Uploads</h3>
                                    <p>{dashboardData.totalWorkUploads}</p>
                                </div>
                                <div className="dashboard-box c2">
                                    <div className="icon-wrapper">
                                        <FaShoppingCart />
                                    </div>
                                    <h3>Total Order Assignments</h3>
                                    <p>{dashboardData.totalOrderAssignments}</p>
                                </div>
                                <div className="dashboard-box c3">
                                    <div className="icon-wrapper">
                                        <FaClock />
                                    </div>
                                    <h3>Pending Assignments</h3>
                                    <p>{dashboardData.pendingAssignments}</p>
                                </div>
                            </div>
                            {/* Performance Graph */}
                            <div className="dashboard-graph">
                                <h3>Crafter Performance</h3>
                                {dashboardData.performanceData.labels && dashboardData.performanceData.labels.length > 0 ? (
                                    <Line
                                        data={dashboardData.performanceData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'top' },
                                                title: {
                                                    display: true,
                                                    text: 'Crafter Performance Over Time'
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    title: {
                                                        display: true,
                                                        text: 'Count'
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
                                    <p>No performance data available</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrafterDashboard;