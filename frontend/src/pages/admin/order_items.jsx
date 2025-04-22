import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./order_items.css";
import "../../components/styles/table.css";
import "../../components/styles/search-container.css";
import { FiSearch } from "react-icons/fi";
import axios from "axios";

const Items = () => {
    const navigate = useNavigate();
    const { orderId } = useParams(); // Extract orderId from the URL path

    const [orderItems, setOrderItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            console.error("Order ID is missing. Redirecting to orders page.");
            navigate("/admin/orders"); // Redirect if orderId is missing
        } else {
            console.log("Fetching order items for orderId:", orderId); // Debugging log
            // Fetch order items from the backend
            axios
                .get(`http://localhost:5000/api/admin/orders/${orderId}`)
                .then((response) => {
                    console.log("Fetched order items:", response.data); // Debugging log
                    setOrderItems(response.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching order items:", error);
                    setLoading(false);
                });
        }
    }, [orderId, navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredOrderItems = orderItems.filter((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="order-details-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading order items...</p>
                    ) : filteredOrderItems.length === 0 ? (
                        <p>No items found for this order.</p>
                    ) : (
                        <table className="table order-items-table">
                            <thead>
                                <tr>
                                    <th>Item No.</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrderItems.map((item, index) => (
                                    <tr key={item.item_id}>
                                        <td>{index + 1}</td>
                                        <td>{item.product_name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.price}</td>
                                        <td>{item.total_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Items;