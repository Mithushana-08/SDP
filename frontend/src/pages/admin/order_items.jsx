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
                    // Group items by product and customization
                    const rawItems = response.data;
                    console.log("Original order items:", rawItems);
                    
                    // Create a map to group items with the same product and customization
                    const groupedMap = new Map();
                    
                    rawItems.forEach((item) => {
                        // Create a unique key based on product_id and customization details
                        const customizationKey = item.customizable_count > 0 
                            ? JSON.stringify({
                                type: item.customization_type || null,
                                value: item.customization_value || null,
                                image: item.uploaded_image || null,
                                size: item.size_type || null
                              })
                            : "no_customization";
                            
                        const itemKey = `${item.product_id}_${customizationKey}`;
                        
                        if (groupedMap.has(itemKey)) {
                            // If this item already exists in our map, update its quantity and total price
                            const existingItem = groupedMap.get(itemKey);
                            existingItem.quantity += item.quantity;
                            existingItem.total_price = (existingItem.price * existingItem.quantity).toFixed(2);
                            
                            // Update the map
                            groupedMap.set(itemKey, existingItem);
                        } else {
                            // If this is a new item, add it to the map
                            const newItem = { 
                                ...item,
                                // Ensure total_price is calculated correctly
                                total_price: (item.price * item.quantity).toFixed(2)
                            };
                            groupedMap.set(itemKey, newItem);
                        }
                    });
                    
                    // Convert the map values back to an array
                    const groupedItems = Array.from(groupedMap.values());
                    console.log("Grouped order items:", groupedItems);
                    
                    setOrderItems(groupedItems);
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
                setCrafters(response.data); // Set the fetched crafters
            })
            .catch((error) => {
                console.error("Error fetching crafters:", error);
            });
        }
    }, [orderId, navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleViewCustomization = (item) => {
        const customizationDetails = `
            Customization Type: ${item.customization_type || "N/A"}
            Customization Value: ${item.customization_value || "N/A"}
            Uploaded Image: ${item.uploaded_image || "N/A"}
            Size Type: ${item.size_type || "N/A"}
        `;
        alert(customizationDetails); // Replace with a modal for better UI
    };

    const handleCrafterChange = (itemId, crafterId) => {
        // Find the selected crafter's name
        const selectedCrafter = crafters.find((crafter) => crafter.id === crafterId);
    
        // Update crafter assignment in the backend
        axios
            .post(`http://localhost:5000/api/admin/orders/${orderId}/assign-crafter`, {
                item_id: itemId,
                crafter_id: crafterId,
            })
            .then((response) => {
                console.log("Crafter assigned successfully:", response.data);
                // Update the local state with the selected crafter's name
                setOrderItems((prevItems) =>
                    prevItems.map((item) =>
                        item.item_id === itemId
                            ? { ...item, crafter: crafterId, crafter_name: selectedCrafter?.crafter_name || "" }
                            : item
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
                                    <tr key={item.item_id || index}>
                                        <td>{index + 1}</td>
                                        <td>{item.product_name}</td>
                                        <td>{item.category_name}</td>
                                        <td>
                                            {item.customizable_count > 0 ? (
                                                <>
                                                    Yes{" "}
                                                    <button
                                                        className="view-customization-btn"
                                                        onClick={() => handleViewCustomization(item)}
                                                    >
                                                        View
                                                    </button>
                                                </>
                                            ) : (
                                                "No"
                                            )}
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{item.price}</td>
                                        <td>{item.total_price}</td>
                                        <td>
    {item.customizable_count > 0 ? ( // Check if customization is "Yes"
        <>
            <select
                value={item.crafter || ""}
                onChange={(e) => handleCrafterChange(item.item_id, e.target.value)}
            >
                <option value="">Select Crafter</option>
                {crafters.map((crafter) => (
                    <option key={crafter.id} value={crafter.id}>
                        {crafter.crafter_name}
                    </option>
                ))}
            </select>
            {item.crafter_name && <p className="selected-crafter"></p>}
        </>
    ) : (
        <p>-</p> // Show "Not Applicable" if customization is "No"
    )}
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