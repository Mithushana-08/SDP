import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./order_items.css";

const Items = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Read orderId from state (sent from Link)
    const orderId = location.state?.orderId;

    // If orderId is missing, redirect to some fallback page (optional)
    useEffect(() => {
        if (!orderId) {
            navigate("/admin/orders"); // Redirect to orders list if no orderId
        }
    }, [orderId, navigate]);

    const allOrdersItems = {
        1001: [
            {
                itemNo: 1,
                product: "Keytag",
                category: "Keychains",
                customizable: "Yes",
                crafter: "Not Assigned",
                status: "Pending",
            },
            {
                itemNo: 2,
                product: "Photo Frame",
                category: "Frames",
                customizable: "No",
                crafter: "Assigned to John",
                status: "In Progress",
            },
        ],
        1002: [
            {
                itemNo: 1,
                product: "Wooden Spoon",
                category: "Kitchen",
                customizable: "No",
                crafter: "Not Assigned",
                status: "Pending",
            },
        ],
    };

    const [orderItems, setOrderItems] = useState([]);

    useEffect(() => {
        if (orderId && allOrdersItems[orderId]) {
            setOrderItems(allOrdersItems[orderId]);
        } else {
            setOrderItems([]);
        }
    }, [orderId]);

    return (
        <div className="order-details-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Order Details - #{orderId}</h1>

                    {orderItems.length === 0 ? (
                        <p>No items found for this order.</p>
                    ) : (
                        <table className="order-items-table">
                            <thead>
                                <tr>
                                    <th>Item No.</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Customizable</th>
                                    <th>Crafter</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.map((item) => (
                                    <tr key={item.itemNo}>
                                        <td>{item.itemNo}</td>
                                        <td>{item.product}</td>
                                        <td>{item.category}</td>
                                        <td>{item.customizable}</td>
                                        <td>{item.crafter}</td>
                                        <td>{item.status}</td>
                                        <td>
                                            <button>Assign Crafter</button>
                                        </td>
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
