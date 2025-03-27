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
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster')
            .then(response => response.json())
            .then(data => {
                updateStockStatus(data);
            })
            .catch(error => console.error('Error fetching product data:', error));
    }, []);

    const updateStockStatus = (products) => {
        const updatedProductsPromises = products.map(product => {
            return fetch(`http://localhost:5000/api/inventory/${product.product_id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.quantity > 10) {
                        product.stock_status = 'In Stock';
                    } else if (data.quantity > 0) {
                        product.stock_status = 'Low Stock';
                    } else {
                        product.stock_status = 'Out of Stock';
                    }
                    return product;
                })
                .catch(error => {
                    console.error('Error fetching inventory data:', error);
                    return product;
                });
        });

        Promise.all(updatedProductsPromises).then(updatedProducts => {
            setProducts(updatedProducts);
        });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDelete = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/productmaster/${productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setProducts(prevProducts => prevProducts.filter(product => product.product_id !== productId));
                alert('Product deleted successfully!');
            } else {
                alert('Error deleting product');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredProducts = products.filter(product => 
        product.product_name && product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reports-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="top-bar">
                        <button className="add-button" onClick={() => setIsModalOpen(true)}>Add Product</button>
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
    <td>
      <img
        src={product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : `http://localhost:5000/uploads/${product.image}`}
        alt={product.product_name}
        width="50"
        onError={(e) => {
          if (e.target.src !== 'http://localhost:5000/uploads/placeholder.png') {
            e.target.src = 'http://localhost:5000/uploads/placeholder.png';
          }
        }}
      />
    </td>
    <td>
      <button className="edit-button"><FiEdit /></button>
      <button className="delete-button" onClick={() => handleDelete(product.product_id)}><FiTrash2 /></button>
    </td>
  </tr>
))}
                            
                        </tbody>
                    </table>
                    {isModalOpen && <AddProductModal setProducts={setProducts} onClose={() => setIsModalOpen(false)} />}
                </div>
            </div>
        </div>
    );
};

const AddProductModal = ({ setProducts, onClose }) => {
    const [productData, setProductData] = useState({
        product_name: '',
        category_id: '',
        base_price: '',
        customizable: '',
        description: '',
        image: null
    });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster/categories')
            .then(response => response.json())
            .then(data => {
                setCategories(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        if (e.target.name === "image") {
            setProductData({ ...productData, image: e.target.files[0] });
        } else {
            setProductData({ ...productData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        for (let key in productData) {
            formData.append(key, productData[key]);
        }

        try {
            const response = await fetch('http://localhost:5000/api/productmaster/add', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Product added successfully!');
                const newProduct = await response.json();
                setProducts(prevProducts => [...prevProducts, newProduct]);
                onClose();
            } else {
                alert('Error adding product');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="overlay">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <form onSubmit={handleSubmit} className="add-product-form">
                    <h2>Add Product</h2>
                    <input type="text" name="product_name" placeholder="Product Name" onChange={handleChange} required />
                    <input type="number" name="base_price" placeholder="Base Price" onChange={handleChange} required />
                    <select name="category_id" onChange={handleChange} value={productData.category_id} required>
                        <option value="">Select Category</option>
                        {isLoading ? (
                            <option disabled>Loading categories...</option>
                        ) : (
                            categories.length > 0 ? (
                                categories.map((category) => (
                                    <option key={category.category_id} value={category.category_id}>
                                        {category.category_name}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No categories available</option>
                            )
                        )}
                    </select>
                    <input type="text" name="customizable" placeholder="Customizable (true/false)" onChange={handleChange} required />
                    <textarea name="description" placeholder="Description" onChange={handleChange} required></textarea>
                    <input type="file" name="image" accept="image/*" onChange={handleChange}  />
                    <div className="form-buttons">
                        <button type="submit" className="btn-adding"><i className="fas fa-check"></i></button>
                        <button type="button" className="btn-close" onClick={onClose}><i className="fas fa-times"></i></button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Product;