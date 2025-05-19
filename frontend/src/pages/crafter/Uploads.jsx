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
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        product_id: "",
        product_name: "",
        category_id: "",
        CategoryName: "",
        customizable: "",
        base_price: 0,
        quantity: 1,
        crafter_id: ""
    });

    const [editMode, setEditMode] = useState(false);
    const [selectedUploadId, setSelectedUploadId] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token"); // Changed from localStorage

        if (!token) {
            console.error("No token found, please login again.");
            return;
        }

        const fetchCrafterId = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/user/users/crafter", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error("Failed to fetch crafter ID");
        
                const crafters = await response.json();
                console.log("Crafter response:", crafters);
        
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                const loggedInUserId = decodedToken.id;
                
                const currentCrafter = crafters.find(crafter => crafter.id === loggedInUserId);
        
                if (currentCrafter) {
                    setFormData(prevData => ({
                        ...prevData,
                        crafter_id: currentCrafter.id,
                    }));
                    fetchUploads(currentCrafter.id);
                } else {
                    console.error("No matching crafter found for logged-in user.");
                }
            } catch (error) {
                console.error("Error fetching crafter ID:", error);
            }
        };

        fetchCrafterId();
        fetchProducts();
    }, []);

    const fetchUploads = async (crafterId) => {
        const token = sessionStorage.getItem("token"); // Changed from localStorage

        if (!token) {
            console.error("No token found for fetching uploads.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/upload?crafter_id=${crafterId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch uploads");
            const data = await response.json();
            setUploads(data);
        } catch (error) {
            console.error("Error fetching uploads:", error);
        }
    };

    const fetchProducts = async () => {
        const token = sessionStorage.getItem("token"); // Changed from localStorage

        if (!token) {
            console.error("No token found for fetching products.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/productmaster", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
            const data = await response.json();
            setProducts(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setIsLoading(false);
        }
    };

    const handleProductSelect = (e) => {
        const productId = e.target.value;
        const selectedProduct = products.find(p => p.product_id === productId);

        if (selectedProduct) {
            setFormData({
                ...formData,
                product_id: selectedProduct.product_id,
                product_name: selectedProduct.product_name,
                category_id: selectedProduct.category_id,
                CategoryName: selectedProduct.category_name,
                customizable: selectedProduct.customizable || "No",
                base_price: selectedProduct.base_price
            });
        } else {
            console.log("Product not found");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form Data to be sent:", formData);

        const token = sessionStorage.getItem("token"); // Changed from localStorage

        if (!token) {
            console.error("No token found for submitting upload.");
            return;
        }

        try {
            let response;
            if (editMode) {
                response = await fetch(`http://localhost:5000/api/upload/${selectedUploadId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(formData),
                });
            } else {
                response = await fetch("http://localhost:5000/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(formData),
                });
            }

            if (!response.ok) throw new Error("Failed to save upload");
            setShowModal(false);
            fetchUploads(formData.crafter_id);
        } catch (error) {
            console.error("Error saving upload:", error);
        }
    };

    const handleEdit = (uploadId) => {
        const uploadToEdit = uploads.find(upload => upload.work_id === uploadId);
        if (uploadToEdit) {
            setFormData({
                ...formData,
                product_id: uploadToEdit.product_id,
                product_name: uploadToEdit.product_name,
                category_id: uploadToEdit.category_id,
                CategoryName: uploadToEdit.CategoryName,
                customizable: uploadToEdit.customizable,
                base_price: uploadToEdit.base_price,
                quantity: uploadToEdit.quantity,
            });
            setSelectedUploadId(uploadId);
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = async (workId) => {
        const token = sessionStorage.getItem("token"); // Changed from localStorage
    
        if (!token) {
            console.error("No token found for deleting upload.");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:5000/api/upload/${workId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to delete upload");
            fetchUploads(formData.crafter_id);
        } catch (error) {
            console.error("Error deleting upload:", error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredUploads = uploads.filter(upload =>
        upload.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="Uploads-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="header">
                        <button className="add-button" onClick={() => { setEditMode(false); setShowModal(true); }}>+ Add Upload</button>
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
                                        <td>{upload.CategoryName}</td>
                                        <td>{upload.quantity}</td>
                                        <td>{upload.status}</td>
                                        <td>
                                            <FiEdit className="icon" onClick={() => handleEdit(upload.work_id)} />
                                            <FiTrash2 className="icon" onClick={() => handleDelete(upload.work_id)}/>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6">No uploads found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {showModal && (
                        <div className="modal">
                            <div className="modal-content">
                                <h2>{editMode ? "Edit Work Upload" : "Add Work Upload"}</h2>
                                <form onSubmit={handleSubmit}>
                                    <label>Product</label>
                                    <select className="styled-status-dropdown" onChange={handleProductSelect} value={formData.product_id} required>
                                        <option value="">Select Product</option>
                                        {isLoading ? (
                                            <option disabled>Loading products...</option>
                                        ) : (
                                            products.length > 0 ? (
                                                products.map((product) => (
                                                    <option key={product.product_id} value={product.product_id}>
                                                        {product.product_name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>No products available</option>
                                            )
                                        )}
                                    </select>

                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        min="1"
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                    />
                                    <label>CategoryID</label>
                                    <input type="text" value={formData.category_id} disabled />

                                    <label>Category</label>
                                    <input type="text" value={formData.CategoryName} disabled />

                                    <label>Customizable</label>
                                    <input type="text" value={formData.customizable} disabled />

                                    <label>Base Price</label>
                                    <input type="number" value={formData.base_price} disabled />

                                    <button type="submit">{editMode ? "Update" : "Submit"}</button>
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