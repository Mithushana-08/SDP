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
    const { orderId } = useParams();

    const [orderItems, setOrderItems] = useState([]);
    const [crafters, setCrafters] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            navigate("/admin/orders");
        } else {
            axios
                .get(`http://localhost:5000/api/admin/orders/${orderId}`)
                .then((response) => {
                    setOrderItems(response.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching order items:", error);
                    setLoading(false);
                });

            // Fetch crafters
            axios
                .get("http://localhost:5000/api/admin/crafters")
                .then((response) => {
                    setCrafters(response.data);
                })
                .catch((error) => {
                    console.error("Error fetching crafters:", error);
                });
        }
    }, [orderId, navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleCrafterChange = (itemId, crafterId) => {
        // Update crafter assignment in the backend
        axios
            .post(`http://localhost:5000/api/admin/orders/${orderId}/assign-crafter`, {
                item_id: itemId,
                crafter_id: crafterId,
            })
            .then((response) => {
                console.log("Crafter assigned successfully:", response.data);
                // Optionally update the local state
                setOrderItems((prevItems) =>
                    prevItems.map((item) =>
                        item.item_id === itemId ? { ...item, crafter: crafterId } : item
                    )
                );
            })
            .catch((error) => {
                console.error("Error assigning crafter:", error);
            });
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
                                    <th>Category</th>
                                    <th>Customizable</th>
                                    <th>Quantity</th>
                                    <th>Price (per unit)</th>
                                    <th>Total Price</th>
                                    <th>Crafter</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrderItems.map((item, index) => (
                                    <tr key={item.item_id}>
                                        <td>{index + 1}</td>
                                        <td>{item.product_name}</td>
                                        <td>{item.category}</td>
                                        <td>{item.customizable ? "Yes" : "No"}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.price}</td>
                                        <td>{item.total_price}</td>
                                        <td>
                                            <select
                                                value={item.crafter || ""}
                                                onChange={(e) =>
                                                    handleCrafterChange(item.item_id, e.target.value)
                                                }
                                            >
                                                <option value="">Select Crafter</option>
                                                {crafters.map((crafter) => (
                                                    <option key={crafter.id} value={crafter.id}>
                                                        {crafter.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>{item.status}</td>
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