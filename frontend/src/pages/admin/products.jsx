import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./products.css";
import "../../components/styles/table.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const Products = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/products');
            setProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Products Page</h1>
                    <table className="table products-table">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th>Crafter Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.product_id}>
                                    <td>{product.product_id}</td>
                                    <td>{product.product_name}</td>
                                    <td>{product.category}</td>
                                    <td>Rs.{product.price.toFixed(2)}</td>
                                    <td>{product.stock_qty}</td>
                                    <td>Rs.{product.total_price.toFixed(2)}</td>
                                    <td>{product.crafter_name}</td>
                                    <td>{product.status}</td>
                                    <td className="actions">
                                        <button><FontAwesomeIcon icon={faEdit} /></button>
                                        <button><FontAwesomeIcon icon={faTrashAlt} /></button>
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

export default Products;