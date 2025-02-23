import React from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./products.css";

const Products = () => {
    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Products Page</h1>
                    {/* Add more content here */}
                </div>
            </div>
        </div>
    );
};

export default Products;