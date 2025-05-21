import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./order_items.css";
import "../../components/styles/table.css";
import "../../components/styles/search-container.css";
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import axios from "axios";

const Items = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [orderItems, setOrderItems] = useState([]);
  const [crafters, setCrafters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    if (!orderId) {
      navigate("/admin/orders");
    } else {
      axios
        .get(`http://localhost:5000/api/admin/orders/${orderId}`)
        .then((response) => {
          // If response is an array, fetch order status separately
          let items = response.data;
          let status = "";
          if (Array.isArray(items)) {
            axios.get(`http://localhost:5000/api/admin/orders`).then((ordersRes) => {
              const order = ordersRes.data.find((o) => o.order_id == orderId);
              status = order ? order.status : "";
              setOrderStatus(status);
            });
          } else {
            // If backend returns {items, status}
            items = response.data.items;
            status = response.data.status;
            setOrderStatus(status);
          }
          const processedItems = (items || []).map((item) => ({
            ...item,
            total_price: (item.price * item.quantity).toFixed(2),
          }));
          setOrderItems(processedItems);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching order items:", error);
          setLoading(false);
        });

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

  const handleViewCustomization = (item) => {
    const { customizations } = item;
    const customizationDetails = `
      Customization Type: ${customizations.type || "N/A"}
      Customization Value: ${customizations.value || "N/A"}
      Size: ${customizations.size || "N/A"}
      Uploaded Image: ${customizations.image || "N/A"}
    `;
    alert(customizationDetails); // Replace with a modal for better UI
  };

  const handleCrafterChange = (itemId, crafterId) => {
    axios
      .post(`http://localhost:5000/api/admin/orders/${orderId}/assign-crafter`, {
        item_id: itemId,
        crafter_id: crafterId,
      })
      .then((response) => {
        console.log("Crafter assigned successfully:", response.data);
        setOrderItems((prevItems) =>
          prevItems.map((item) =>
            item.item_id === itemId
              ? {
                  ...item,
                  crafter_id: crafterId,
                  crafter_username:
                    crafters.find((crafter) => crafter.id === parseInt(crafterId))
                      ?.crafter_name || "",
                }
              : item
          )
        );
      })
      .catch((error) => {
        console.error("Error assigning crafter:", error);
      });
  };

  const handleConfirm = (itemId) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.item_id === itemId ? { ...item, status: "Confirmed" } : item
      )
    );

    axios
      .post(`http://localhost:5000/api/admin/orders/${orderId}/update-status`, {
        item_id: itemId,
        status: "Confirmed",
      })
      .then((response) => {
        console.log("Status updated successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        setOrderItems((prevItems) =>
          prevItems.map((item) =>
            item.item_id === itemId ? { ...item, status: item.status } : item
          )
        );
      });
  };

  const filteredOrderItems = orderItems.filter((item) =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="order-details-page">
      <AdminSidebar />
      <div className="main-user-content">
        <AdminNavbar />
        <div className="user-content">
          <div className="top-bar">
            <div className="top-bar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                className="back-button styled-back-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#333', padding: 0 }}
                onClick={() => navigate('/admin/orders')}
                title="Back to Orders"
              >
                <FiArrowLeft style={{ fontSize: 22 }} /> 
              </button>
              <div className="search-container" style={{ marginLeft: 'auto' }}>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrderItems.map((item, index) => (
                  <tr key={item.item_id || index}>
                    <td>{index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>{item.category_name}</td>
                    <td>
                      {item.is_customizable ? (
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
                      {item.is_customizable ? (
                        <select
                          value={item.crafter_id || ""}
                          onChange={(e) =>
                            handleCrafterChange(item.item_id, e.target.value)
                          }
                          disabled={orderStatus === "cancelled" || item.status === "Confirmed" || item.status === "Completed"}
                        >
                          <option value="">Select Crafter</option>
                          {crafters.map((crafter) => (
                            <option key={crafter.id} value={crafter.id}>
                              {crafter.crafter_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p>-</p>
                      )}
                      {item.crafter_username && (
                        <p className="selected-crafter">{item.crafter_username}</p>
                      )}
                    </td>
                    <td className={item.status === "Confirmed" ? "status-confirmed" : ""}>
                      {item.status}
                    </td>
                    <td>
                      {!item.is_customizable && item.status !== "Confirmed" ? (
                        <button
                          className="confirm-button"
                          onClick={() => handleConfirm(item.item_id)}
                        >
                          Confirm
                        </button>
                      ) : (
                        "-"
                      )}
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