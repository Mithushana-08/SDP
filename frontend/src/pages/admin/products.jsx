import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./products.css";
import "../../components/styles/table.css";
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import '../../components/styles/buttons.css';
import '../../components/styles/search-container.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/products');  // Matches backend
            console.log("Fetched products:", response.data);  // Log the fetched data
            setProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            setError("Failed to fetch products. Please try again later.");
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleDeleteCategory = async (productId) => {
        try {
            await axios.delete(`http://localhost:5000/api/products/${productId}`);
            setProducts(products.filter(product => product.product_id !== productId));
        } catch (error) {
            console.error("Failed to delete product:", error);
            setError("Failed to delete product. Please try again later.");
        }
    };

    const filteredProducts = products.filter((product) => {
        return (
            product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.crafter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="products-page">
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
                                    placeholder="Search here..."
                                    className="search-bar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <table className="table products-table">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Base Price</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th>Crafter Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.product_id}>
                                    <td>{product.product_id}</td>
                                    <td>{product.product_name}</td>
                                    <td>{product.category}</td>
                                    <td>Rs.{product.base_price ? product.base_price.toFixed(2) : 'N/A'}</td>
                                    <td>{product.stock_qty}</td>
                                    <td>Rs.{product.base_price && product.stock_qty ? (product.base_price * product.stock_qty).toFixed(2) : 'N/A'}</td>
                                    <td>{product.crafter_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Products;