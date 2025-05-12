import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./customers.css";
import "../../components/styles/table.css";

import { FiSearch, FiTrash2 } from "react-icons/fi";

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState([]); // Ensure this is an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/customers/customers");
                if (!response.ok) {
                    throw new Error("Failed to fetch customers");
                }
                const data = await response.json();
                console.log("Fetched customers:", data); // Log the response
                setCustomers(Array.isArray(data) ? data : []); // Ensure customers is an array
                setLoading(false);
            } catch (err) {
                console.error("Error fetching customers:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Combine address fields into a single string
    const formatAddress = (customer) => {
        const { address_line1, address_line2, city, province, postal_code } = customer;
        const addressParts = [address_line1, address_line2, city, province, postal_code].filter(Boolean); // Remove null/undefined
        return addressParts.length > 0 ? addressParts.join(", ") : "N/A";
    };

    const handleDeleteCustomer = async (customer_id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/customers/customer/${encodeURIComponent(customer_id)}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete customer");
            }

            // Remove the deleted customer from the state
            setCustomers((prevCustomers) =>
                prevCustomers.filter((customer) => customer.customer_id !== customer_id)
            );

            alert("Customer deleted successfully");
        } catch (err) {
            console.error("Error deleting customer:", err);
            alert(err.message || "Failed to delete customer");
        }
    };

    const filteredCustomers = Array.isArray(customers)
        ? customers.filter((customer) =>
              (customer.username || "").toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];

    return (
        <div className="customers-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <div className="top-bar-content">
                            <button className="add-button">
                                <span className="plus-icon">+</span> Add Customer
                            </button>
                            <div className="search-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <p>Loading customers...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <table className="table customers-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone Number</th>
                                    <th>Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.customer_id}>
                                        <td>{customer.username || "N/A"}</td>
                                        <td>{customer.email || "N/A"}</td>
                                        <td>{customer.phone || "N/A"}</td>
                                        <td>{formatAddress(customer)}</td> {/* Format and display the address */}
                                        <td>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteCustomer(customer.customer_id)}
                                            >
                                                <FiTrash2 />
                                            </button>
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

export default Customers;