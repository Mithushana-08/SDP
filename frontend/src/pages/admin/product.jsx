import React, { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import './product.css';
import '../../components/styles/buttons.css';
import '../../components/styles/search-container.css';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster')  // Point to backend
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => setProducts(data))
            .catch(error => {
                console.error('Error fetching product data:', error);
                setProducts([]);  // Set products to an empty array on error
            });
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredProducts = Array.isArray(products) ? products.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="reports-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <button className="add-button"><span className="plus-icon">+</span> Add Product</button>
                        <div className="search-container">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-bar"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Category Name</th>
                                <th>Base Price</th>
                                <th>Customizable</th>
                                <th>Description</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.product_id}>
                                    <td>{product.product_id}</td>
                                    <td>{product.product_name}</td>
                                    <td>{product.category_name}</td>
                                    <td>Rs.{product.base_price.toFixed(2)}</td>
                                    <td>{product.customizable}</td>
                                    <td>{product.description}</td>
                                    <td><img src={product.image} alt={product.product_name} width="50" /></td>
                                    <td>
                                        <button className="edit-button"><FiEdit /></button>
                                        <button className="delete-button"><FiTrash2 /></button>
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

export default Product;