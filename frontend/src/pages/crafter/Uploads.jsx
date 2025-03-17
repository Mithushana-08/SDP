import React, { useEffect, useState } from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import "./Uploads.css";
import "../../components/styles/table.css";

const Uploads = () => {
    const [uploads, setUploads] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        product_id: "",
        product_name: "",
        category_id: "",
        CategoryName: "",    // This will be populated from backend response
        customizable: "",
        quantity: 1,
        crafter_id: "CRAFT123"  // Replace with actual logged-in crafter ID if available
    });

    useEffect(() => {
        fetchUploads();
        fetchProducts();
    }, []);

    const fetchUploads = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/upload");   // Adjust if your route differs
            if (!response.ok) throw new Error("Failed to fetch uploads");
            const data = await response.json();
            setUploads(data);
        } catch (error) {
            console.error("Error fetching uploads:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/products");  // Adjust if your route differs
            if (!response.ok) throw new Error("Failed to fetch products");
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleProductSelect = (e) => {
        const productId = e.target.value;
        const selectedProduct = products.find(p => p.product_id === productId);

        if (selectedProduct) {
            console.log("Selected Product:", selectedProduct); // Log selected product details
            setFormData({
                ...formData,
                product_id: selectedProduct.product_id,
                product_name: selectedProduct.product_name,
                category_id: selectedProduct.category_id,  // Ensure this matches the data structure
                CategoryName: selectedProduct.category,  // Ensure this matches the data structure
                customizable: selectedProduct.customizable || "No",  // Default to "No" if 'customizable' is missing
            });
        } else {
            console.log("Product not found");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form Data to be sent:", formData); // Log form data to ensure it's correct

        try {
            const response = await fetch("http://localhost:5000/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("Failed to add upload");
            setShowModal(false);
            fetchUploads();
        } catch (error) {
            console.error("Error adding upload:", error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredUploads = uploads.filter(upload =>
        upload.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="uploads-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="header">
                        <button className="add-button" onClick={() => setShowModal(true)}>+ Add Upload</button>
                        <div className="search-container">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-bar"
                                placeholder="Search by product name..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    <table className="table uploads-table">
                        <thead>
                            <tr>
                               
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUploads.length > 0 ? (
                                filteredUploads.map((upload) => (
                                    <tr key={upload.work_id}>
                                       
                                        <td>{upload.product_name}</td>
                                        <td>{upload.CategoryName}</td> {/* Category name coming from backend */}
                                        <td>{upload.quantity}</td>
                                        <td>{upload.status}</td>
                                        <td>
                                            <FiEdit className="icon" />
                                            <FiTrash2 className="icon" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6">No uploads found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Add Upload Modal */}
                    {showModal && (
                        <div className="modal">
                            <div className="modal-content">
                                <h2>Add Work Upload</h2>
                                <form onSubmit={handleSubmit}>
                                    <label>Product</label>
                                    <select onChange={handleProductSelect} required>
                                        <option value="">Select Product</option>
                                        {products.map((product) => (
                                            <option key={product.product_id} value={product.product_id}>
                                                {product.product_name}
                                            </option>
                                        ))}
                                    </select>

                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        min="1"
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                    />

                                   

                                    <label>Category</label>
                                    <input type="text" value={formData.CategoryName} disabled />  {/* Display category name */}

                                    <label>Customizable</label>
                                    <input type="text" value={formData.customizable} disabled />

                                    <button type="submit">Submit</button>
                                    <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Uploads;