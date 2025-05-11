import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./orders.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css";
import "../../components/styles/search-container.css";
import { FiSearch } from "react-icons/fi";

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
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
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