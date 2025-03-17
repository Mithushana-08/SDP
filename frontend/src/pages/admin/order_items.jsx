import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./order_items.css";
import "../../components/styles/table.css";
import "../../components/styles/search-container.css";
import { FiSearch } from 'react-icons/fi';

const Items = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const orderId = location.state?.orderId;

    useEffect(() => {
        if (!orderId) {
            navigate("/admin/orders");
        }
    }, [orderId, navigate]);

    const allOrdersItems = {
        1001: [
            { itemNo: 1, product: "Keytag", category: "Keychains", customizable: "Yes", quantity: 10, price: 5, crafter: "Not Assigned", status: "Pending" },
            { itemNo: 2, product: "Photo Frame", category: "Frames", customizable: "No", quantity: 2, price: 15, crafter: "", status: "Ready to Deliver" },
        ],
        1002: [
            { itemNo: 1, product: "Wooden Spoon", category: "Kitchen", customizable: "No", quantity: 5, price: 3, crafter: "", status: "Ready to Deliver" },
        ],
    };

    const checkStockAvailability = (item) => {
        // Simulate stock check - in real case, call API to check stock
        return item.quantity <= 10;  // Assume <=10 means in stock
    };

    const [orderItems, setOrderItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (orderId && allOrdersItems[orderId]) {
            const itemsWithStatus = allOrdersItems[orderId].map(item => {
                const isCustomizable = item.customizable === "Yes";
                const inStock = checkStockAvailability(item);

                let status = "Pending";
                if (!isCustomizable) {
                    status = inStock ? "Ready to Deliver" : "Pending";
                }
                return { ...item, status };
            });

            setOrderItems(itemsWithStatus);
        }
    }, [orderId]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleCrafterChange = (itemNo, newCrafter) => {
        setOrderItems((prevItems) =>
            prevItems.map((item) => {
                if (item.itemNo === itemNo) {
                    const isCustomizable = item.customizable === "Yes";
                    const inStock = checkStockAvailability(item);
                    let newStatus = item.status;

                    if (isCustomizable || !inStock) {
                        newStatus = newCrafter === "Not Assigned" ? "Pending" : "In Progress";
                    }

                    return { ...item, crafter: newCrafter, status: newStatus };
                }
                return item;
            })
        );
    };

    const filteredOrderItems = orderItems.filter((item) =>
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crafter.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="order-details-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <button className="add-button">
                                <span className="plus-icon">+</span> Add items
                            </button>
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

                    {filteredOrderItems.length === 0 ? (
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
                                {filteredOrderItems.map((item) => {
                                    const isCustomizable = item.customizable === "Yes";
                                    const inStock = checkStockAvailability(item);
                                    const needCrafter = isCustomizable || !inStock;

                                    return (
                                        <tr key={item.itemNo}>
                                            <td>{item.itemNo}</td>
                                            <td>{item.product}</td>
                                            <td>{item.category}</td>
                                            <td>{item.customizable}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.price}</td>
                                            <td>{item.quantity * item.price}</td>
                                            <td>
                                                {needCrafter ? (
                                                    <select
                                                        value={item.crafter}
                                                        onChange={(e) =>
                                                            handleCrafterChange(item.itemNo, e.target.value)
                                                        }
                                                    >
                                                        <option value="Not Assigned">Not Assigned</option>
                                                        <option value="Crafter1">Crafter1</option>
                                                        <option value="Crafter2">Crafter2</option>
                                                        <option value="Crafter3">Crafter3</option>
                                                    </select>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td>{item.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Items;
