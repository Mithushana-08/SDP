import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "../admin/inventory.css";

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/notifications/stock", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (!response.ok) throw new Error("Failed to fetch notifications");
                const data = await response.json();
                setNotifications(data);
            } catch (err) {
                setError("Failed to load notifications");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h2 className="page-title text-2xl">Stock Notifications</h2>
                    {loading ? (
                        <div>Loading notifications...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : notifications.length === 0 ? (
                        <div>No low stock or out of stock notifications.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {notifications.map((item) => (
                                <div key={item.product_id} style={{
                                    background: item.stock_qty === 0 ? '#ffeaea' : '#fffbe6',
                                    border: '1px solid',
                                    borderColor: item.stock_qty === 0 ? '#ff4d4f' : '#faad14',
                                    color: item.stock_qty === 0 ? '#a8071a' : '#ad6800',
                                    borderRadius: 8,
                                    padding: '16px 20px',
                                    fontWeight: 500,
                                    fontSize: 16,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                }}>
                                    <span style={{ fontWeight: 700 }}>{item.product_name}</span> —
                                    {item.stock_qty === 0 ? (
                                        <span style={{ marginLeft: 8 }}>Out of Stock</span>
                                    ) : (
                                        <span style={{ marginLeft: 8 }}>Low Stock ({item.stock_qty})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPage;
