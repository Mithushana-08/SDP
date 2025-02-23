import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./products.css";

const Products = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({
        CategoryID: '',
        CategoryName: '',
        Description: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch("http://localhost:5000/api/categories")
            .then(response => response.json())
            .then(data => setCategories(data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCategory({ ...newCategory, [name]: value });
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        fetch("http://localhost:5000/api/categories", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCategory)
        })
        .then(response => response.json())
        .then(data => {
            setCategories([...categories, data]);
            setNewCategory({ CategoryID: '', CategoryName: '', Description: '' });
            setShowForm(false);
        })
        .catch(error => console.error("Error adding category:", error));
    };

    const handleUpdateCategory = (e) => {
        e.preventDefault();
        fetch(`http://localhost:5000/api/categories/${newCategory.CategoryID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCategory)
        })
        .then(response => response.json())
        .then(data => {
            const updatedCategories = categories.map(category =>
                category.CategoryID === data.CategoryID ? data : category
            );
            setCategories(updatedCategories);
            setNewCategory({ CategoryID: '', CategoryName: '', Description: '' });
            setShowForm(false);
            setIsEditing(false);
        })
        .catch(error => console.error("Error updating category:", error));
    };

    const handleDeleteCategory = (CategoryID) => {
        fetch(`http://localhost:5000/api/categories/${CategoryID}`, {
            method: 'DELETE'
        })
        .then(() => {
            const updatedCategories = categories.filter(category => category.CategoryID !== CategoryID);
            setCategories(updatedCategories);
        })
        .catch(error => console.error("Error deleting category:", error));
    };

    const handleShowForm = () => {
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setNewCategory({ CategoryID: '', CategoryName: '', Description: '' });
    };

    const handleEditCategory = (category) => {
        setNewCategory(category);
        setIsEditing(true);
        setShowForm(true);
    };

    return (
        <div className="products-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <button className="btn-add" onClick={handleShowForm}>
                        <span className="plus-icon">+</span> Add
                    </button>
                    {showForm && (
                        <div className="overlay">
                            <div className="add-category-form">
                                <h2>{isEditing ? "Edit Category" : "Add New Category"}</h2>
                                <form onSubmit={isEditing ? handleUpdateCategory : handleAddCategory}>
                                    <input
                                        type="text"
                                        name="CategoryID"
                                        placeholder="Category ID"
                                        value={newCategory.CategoryID}
                                        onChange={handleInputChange}
                                        disabled={isEditing}
                                        required
                                    />
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
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th>Category ID</th>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(category => (
                                <tr key={category.CategoryID}>
                                    <td>{category.CategoryID}</td>
                                    <td>{category.CategoryName}</td>
                                    <td>{category.Description}</td>
                                    <td>
                                        <i className="fas fa-eye view-icon"></i>
                                        <i className="fas fa-edit view-icon" onClick={() => handleEditCategory(category)}></i>
                                        <i className="fas fa-trash view-icon" onClick={() => handleDeleteCategory(category.CategoryID)}></i>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Add more content here */}
                </div>
            </div>
        </div>
    );
};

export default Products;