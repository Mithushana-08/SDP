import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./orders.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css";
import "../../components/styles/search-container.css";
import { FiSearch } from "react-icons/fi";
import Swal from 'sweetalert2';

const Orders = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5000/api/admin/orders", {
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setOrders(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching orders:", err);
                setLoading(false);
            });
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleStatusChange = (orderId, newStatus) => {
        // Update order status in backend (use correct route)
        fetch(`http://localhost:5000/api/admin/orders/${orderId}/update-order-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    if (window.Swal && typeof window.Swal.fire === 'function') {
                        window.Swal.fire('Error', data.error, 'error');
                    } else {
                        alert(data.error);
                    }
                    return;
                }
                setOrders((prev) => prev.map((order) =>
                    order.order_id === orderId ? { ...order, status: newStatus } : order
                ));
                if (window.Swal && typeof window.Swal.fire === 'function') {
                    window.Swal.fire('Success', `Order status updated to ${newStatus}`, 'success');
                } else {
                    alert(`Order status updated to ${newStatus}`);
                }
            })
            .catch((err) => {
                if (window.Swal && typeof window.Swal.fire === 'function') {
                    window.Swal.fire('Error', 'Failed to update order status', 'error');
                } else {
                    alert('Failed to update order status');
                }
            });
    };

    const filteredOrders = orders.filter((order) => {
        return (
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_phone.includes(searchTerm)
        );
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="orders-page">
            <AdminSidebar />
            <div className="main-user-content">
                <AdminNavbar />
                <div className="user-content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <button className="add-button">
                                <span className="plus-icon">+</span> Add Order
                            </button>
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                    <table className="table orders-table">
                        <thead>
                            <tr>
                                
                                <th>Order Date</th>
                                <th>Customer Name</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Products Count</th>
                                <th>Customizable</th>
                                <th>Status</th>
                                <th>Update Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.order_id}>
                                   
                                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                    <td>{order.customer_name}</td>
                                    <td>{order.customer_phone}</td>
                                    <td>{order.shipping_address}</td>
                                    <td>{order.product_count}</td>
                                    <td>{order.customizable_count > 0 ? "Yes" : "No"}</td>
                                    <td>{order.status}</td>
                                    <td>
                                        <select
                                            className="styled-status-dropdown"
                                            value={order.status}
                                            onChange={e => {
                                                if (e.target.value === 'cancelled') {
                                                    if (order.status === 'sent' || order.status === 'delivered') {
                                                        const swalWithBootstrapButtons = Swal.mixin({
                                                          customClass: {
                                                            confirmButton: 'btn btn-success',
                                                            cancelButton: 'btn btn-danger'
                                                          },
                                                          buttonsStyling: false
                                                        });
                                                        swalWithBootstrapButtons.fire({
                                                          title: 'Not Allowed',
                                                          text: 'Cannot cancel after sent or delivered.',
                                                          icon: 'info',
                                                          confirmButtonText: 'OK',
                                                          showCancelButton: false
                                                        });
                                                        return;
                                                    }
                                                    const swalWithBootstrapButtons = Swal.mixin({
                                                      customClass: {
                                                        confirmButton: 'btn btn-success',
                                                        cancelButton: 'btn btn-danger'
                                                      },
                                                      buttonsStyling: false
                                                    });
                                                    swalWithBootstrapButtons.fire({
                                                        title: 'Are you sure?',
                                                        text: "You won't be able to revert this!",
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Yes, cancel it!',
                                                        cancelButtonText: 'No, keep it',
                                                        reverseButtons: true
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            handleStatusChange(order.order_id, 'cancelled');
                                                            swalWithBootstrapButtons.fire({
                                                                title: 'Cancelled!',
                                                                text: 'Order has been cancelled.',
                                                                icon: 'success'
                                                            });
                                                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                                                            swalWithBootstrapButtons.fire({
                                                                title: 'Cancelled',
                                                                text: 'Order is not cancelled.',
                                                                icon: 'error'
                                                            });
                                                        }
                                                    });
                                                } else if (e.target.value === 'sent') {
                                                    if (order.status === 'ready to deliver') {
                                                        handleStatusChange(order.order_id, 'sent');
                                                    } else {
                                                        const swalWithBootstrapButtons = Swal.mixin({
                                                          customClass: {
                                                            confirmButton: 'btn btn-success',
                                                            cancelButton: 'btn btn-danger'
                                                          },
                                                          buttonsStyling: false
                                                        });
                                                        swalWithBootstrapButtons.fire({
                                                          title: 'Not Allowed',
                                                          text: 'You can only mark as sent after status is "ready to deliver".',
                                                          icon: 'info',
                                                          confirmButtonText: 'OK',
                                                          showCancelButton: false
                                                        });
                                                    }
                                                }
                                            }}
                                        >
                                            <option value={order.status}>{order.status}</option>
                                            <option value="sent">sent</option>
                                            <option value="cancelled">cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <Link to={`/admin/order_items/${order.order_id}`}>
                                            📄 View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Orders;