import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./inventory.css";
import "../../components/styles/table.css";
import "../../components/styles/buttons.css";
import "../../components/styles/search-container.css";

const Inventory = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({
        CategoryID: '',
        CategoryName: '',
        Description: '',
        CategoryImage: null // Updated to match the backend field name
    });
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/categories");
            if (!response.ok) throw new Error("Failed to fetch categories");
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // Fetch categories on page load
    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "CategoryImage" && files && files[0]) {
            setNewCategory({ ...newCategory, [name]: files[0] });
        } else {
            setNewCategory({ ...newCategory, [name]: value });
        }
    };

    // Handle search input
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Add new category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        const { CategoryID, CategoryImage, ...categoryData } = newCategory; // Exclude CategoryID

        const formData = new FormData();
        Object.keys(categoryData).forEach((key) => formData.append(key, categoryData[key]));
        if (CategoryImage) formData.append("CategoryImage", CategoryImage); // Match the backend field name

        try {
            const response = await fetch("http://localhost:5000/api/categories", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to add category");

            await fetchCategories(); // Refresh data after adding
            setNewCategory({ CategoryID: "", CategoryName: "", Description: "", CategoryImage: null });
            setShowForm(false);
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    // Update category
    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        const { CategoryID, CategoryImage, ...categoryData } = newCategory; // Exclude CategoryID

        const formData = new FormData();
        Object.keys(categoryData).forEach((key) => formData.append(key, categoryData[key]));
        if (CategoryImage) formData.append("CategoryImage", CategoryImage); // Match the backend field name

        try {
            const response = await fetch(`http://localhost:5000/api/categories/${newCategory.CategoryID}`, {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to update category");

            await fetchCategories(); // Refresh data after updating
            setNewCategory({ CategoryID: "", CategoryName: "", Description: "", CategoryImage: null });
            setShowForm(false);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    // Delete category
    const handleDeleteCategory = async (CategoryID) => {
        try {
            await fetch(`http://localhost:5000/api/categories/${CategoryID}`, {
                method: "DELETE",
            });

            await fetchCategories(); // Refresh data after deletion
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    // Show form for adding/editing
    const handleShowForm = () => {
        setShowForm(true);
    };

    // Close form
    const handleCloseForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setNewCategory({ CategoryID: "", CategoryName: "", Description: "", CategoryImage: null });
    };

    // Edit category
    const handleEditCategory = (category) => {
        setNewCategory(category);
        setIsEditing(true);
        setShowForm(true);
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.CategoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <button className="add-button" onClick={handleShowForm}>
                            <span className="plus-icon">+</span> Add
                        </button>
                        <div className="search-container">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                className="search-bar"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    {showForm && (
                        <div className="overlay">
                            <div className="add-category-form">
                                <h2>{isEditing ? "Edit Category" : "Add New Category"}</h2>
                                <form onSubmit={isEditing ? handleUpdateCategory : handleAddCategory}>
                                    <input
                                        type="text"
                                        name="CategoryName"
                                        placeholder="Category Name"
                                        value={newCategory.CategoryName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="Description"
                                        placeholder="Description"
                                        value={newCategory.Description}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <input
                                        type="file"
                                        name="CategoryImage" // Match the backend field name
                                        accept="image/*"
                                        onChange={handleInputChange}
                                    />
                                    <div className="form-buttons">
                                        <button type="submit" className="btn-adding">
                                            <i className="fas fa-check"></i>
                                        </button>
                                        <button type="button" className="btn-close" onClick={handleCloseForm}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <table className="table category-table">
                        <thead>
                            <tr>
                                <th>Category ID</th>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Image</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map(category => (
                                <tr key={category.CategoryID}>
                                    <td>{category.CategoryID}</td>
                                    <td>{category.CategoryName}</td>
                                    <td>{category.Description}</td>
                                    <td>
                                        <img
                                            src={
                                                category.CategoryImage?.startsWith("/uploads")
                                                    ? `http://localhost:5000${category.CategoryImage}`
                                                    : `http://localhost:5000/uploads/${category.CategoryImage}`
                                            }
                                            alt={category.CategoryName}
                                            width="50"
                                            onError={(e) => {
                                                if (e.target.src !== "http://localhost:5000/uploads/placeholder.png") {
                                                    e.target.src = "http://localhost:5000/uploads/placeholder.png";
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <i className="edit-button" onClick={() => handleEditCategory(category)}><FiEdit /></i>
                                        <i className="delete-button" onClick={() => handleDeleteCategory(category.CategoryID)}><FiTrash2 /></i>
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

export default Inventory;