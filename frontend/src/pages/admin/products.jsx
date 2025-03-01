import React from 'react';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./products.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const Products = () => {                                                                                                                                 
    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Products Page</h1>
                    <table className="products-table">
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
                            <tr>
                                <td>1</td>
                                <td>Handmade Vase</td>
                                <td>Decor</td>
                                <td>$25</td>
                                <td>10</td>
                                <td>$250</td>
                                <td>John Doe</td>
                                <td>Available</td>
                                <td className="actions">
                                    <button><FontAwesomeIcon icon={faEdit} /></button>
                                    <button><FontAwesomeIcon icon={faTrashAlt} /></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};  

export default Products;