import React, { useEffect, useState } from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "../admin/inventory.css";
import Swal from 'sweetalert2';

const CrafterNotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [readIds, setReadIds] = useState(() => JSON.parse(localStorage.getItem("crafterReadNotifications") || "[]"));

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/crafter/notifications", {
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

    // Mark notification as read when clicked
    const handleNotificationClick = (item_id) => {
        if (!readIds.includes(item_id)) {
            const updatedRead = [...readIds, item_id];
            setReadIds(updatedRead);
            localStorage.setItem("crafterReadNotifications", JSON.stringify(updatedRead));
        }
    };

    // Handle close/delete notification
    const handleClose = (item_id) => {
        Swal.fire({
            title: 'Remove Notification?',
            text: 'Do you want to remove this notification?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setNotifications((prev) => prev.filter(n => n.item_id !== item_id));
                // Add to deleted notifications in localStorage
                const deleted = JSON.parse(localStorage.getItem("crafterDeletedNotifications") || "[]");
                const updatedDeleted = [...new Set([...deleted, item_id])];
                localStorage.setItem("crafterDeletedNotifications", JSON.stringify(updatedDeleted));
                // Remove from readIds as well
                const updatedRead = readIds.filter(id => id !== item_id);
                setReadIds(updatedRead);
                localStorage.setItem("crafterReadNotifications", JSON.stringify(updatedRead));
                Swal.fire('Removed!', 'Notification has been removed.', 'success');
            }
        });
    };

    // Filter out deleted notifications
    const filteredNotifications = notifications.filter(n => {
        const deleted = JSON.parse(localStorage.getItem("crafterDeletedNotifications") || "[]");
        return !deleted.includes(n.item_id);
    });

    return (
        <div className="products-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h2 className="page-title text-2xl">Notifications</h2>
                    {loading ? (
                        <div>Loading notifications...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div>No notifications.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[...filteredNotifications].sort((a, b) => new Date(b.assigned_date || b.order_date) - new Date(a.assigned_date || a.order_date)).map((item) => {
                                const isNew = !readIds.includes(item.item_id);
                                // Determine color based on status and read state
                                let background, border, color;
                                if (item.status && item.status.toLowerCase() === 'completed') {
                                    background = '#e6ffed'; // green background for completed
                                    border = '1px solid #52c41a';
                                    color = '#237804';
                                } else if (isNew) {
                                    background = '#fff7e6'; // orange background for new
                                    border = '1px solid #fa8c16';
                                    color = '#ad6800';
                                } else {
                                    background = '#e6f7ff'; // blue background for read
                                    border = '1px solid #1890ff';
                                    color = '#0050b3';
                                }
                                return (
                                    <div key={item.item_id} 
                                         style={{
                                            background,
                                            border,
                                            color,
                                            borderRadius: 8,
                                            padding: '16px 20px',
                                            fontWeight: 500,
                                            fontSize: 16,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => handleNotificationClick(item.item_id)}
                                    >
                                        <span>
                                            <span style={{ fontWeight: 700 }}>Order Assignment</span> —
                                            <span style={{ marginLeft: 8 }}>
                                                Order #{item.order_id}, Product: {item.product_name}, Quantity: {item.quantity}, Order Received on {item.order_date ? new Date(item.order_date).toLocaleDateString() : 'Unknown'}
                                                {item.status && item.status.toLowerCase() === 'completed' && <span style={{ color: '#52c41a', marginLeft: 10 }}>(Completed)</span>}
                                            </span>
                                        </span>
                                        <span style={{ marginLeft: 16, cursor: 'pointer', fontSize: 20 }} onClick={(e) => { e.stopPropagation(); handleClose(item.item_id); }} title="Remove notification">&times;</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrafterNotificationPage;
