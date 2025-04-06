import React, { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi'; // Added FiEye for the view icon
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import './product.css';
import '../../components/styles/buttons.css';
import '../../components/styles/search-container.css';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State for the view modal
    const [customizationDetails, setCustomizationDetails] = useState([]); // State for customization details
    const [selectedProduct, setSelectedProduct] = useState(null); // State for the selected product
    const [productToEdit, setProductToEdit] = useState(null); // State for the product to edit

    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster')
            .then(response => response.json())
            .then(data => {
                setProducts(data);
            })
            .catch(error => console.error('Error fetching product data:', error));
    }, []);

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

    const handleViewCustomizations = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/productmaster/customizations/${productId}`);
            if (response.ok) {
                const data = await response.json();
                setCustomizationDetails(data);
                setSelectedProduct(productId);
                setIsViewModalOpen(true);
            } else {
                alert('Error fetching customization details');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsEditModalOpen(true);
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
                                <th>Status</th>
                                <th>Quantity</th>
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
                                <td>{product.status}</td>
                                <td>{product.stock_qty || 0}</td>
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
                                    <button className="edit-button" onClick={() => handleEdit(product)}><FiEdit /></button>
                                    <button className="delete-button" onClick={() => handleDelete(product.product_id)}><FiTrash2 /></button>
                                    <button className="view-button" onClick={() => handleViewCustomizations(product.product_id)}>
                                        <FiEye />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {isModalOpen && <AddProductModal setProducts={setProducts} onClose={() => setIsModalOpen(false)} />}
                    {isEditModalOpen && (
                        <AddProductModal
                            setProducts={setProducts}
                            onClose={() => setIsEditModalOpen(false)}
                            productToEdit={productToEdit} // Pass product to edit
                        />
                    )}
                    {isViewModalOpen && (
                        <div className="overlay">
                            <div className="modal-content">
                                <span className="close" onClick={() => setIsViewModalOpen(false)}>&times;</span>
                                <h2>Customization Details</h2>
                                {customizationDetails.length > 0 ? (
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Customization ID</th>
                                                <th>Type</th>
                                                <th>Description</th>
                                                <th>Size Type</th>
                                                <th>Height</th>
                                                <th>Width</th>
                                                <th>Depth</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customizationDetails.map(detail => (
                                                <tr key={detail.customization_id}>
                                                    <td>{detail.customization_id}</td>
                                                    <td>{detail.customization_type}</td>
                                                    <td>{detail.description}</td>
                                                    <td>{detail.size_type || 'N/A'}</td>
                                                    <td>{detail.height || 'N/A'}</td>
                                                    <td>{detail.width || 'N/A'}</td>
                                                    <td>{detail.depth || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No customization details available.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AddProductModal = ({ setProducts, onClose, productToEdit = null }) => {
    const [productData, setProductData] = useState({
        product_name: '',
        category_id: '',
        base_price: '',
        customizable: false,
        customizations: [],
        description: '',
        image: null,
    });

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster/categories')
            .then((response) => response.json())
            .then((data) => {
                setCategories(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching categories:', error);
                setIsLoading(false);
            });

        if (productToEdit) {
            setProductData({
                ...productToEdit,
                category_id: productToEdit.category_id || '',
                customizable: productToEdit.customizable || false,
                customizations: productToEdit.customizations || [],
                image: null, // Reset image field
            });
        }
    }, [productToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') {
            setProductData({ ...productData, [name]: checked });
        } else if (type === 'file') {
            setProductData({ ...productData, [name]: files[0] });
        } else {
            setProductData({ ...productData, [name]: value });
        }
    };

    const handleAddCustomization = () => {
        setProductData({
            ...productData,
            customizations: [
                ...productData.customizations,
                { type: '', sizes: [{ size_type: '', height: '', width: '', depth: '' }] },
            ],
        });
    };

    const handleRemoveCustomization = (index) => {
        const updatedCustomizations = [...productData.customizations];
        updatedCustomizations.splice(index, 1);
        setProductData({ ...productData, customizations: updatedCustomizations });
    };

    const handleCustomizationChange = (index, field, value) => {
        const updatedCustomizations = [...productData.customizations];
        updatedCustomizations[index][field] = value;
        setProductData({ ...productData, customizations: updatedCustomizations });
    };

    const handleAddSize = (customizationIndex) => {
        const updatedCustomizations = [...productData.customizations];
        updatedCustomizations[customizationIndex].sizes.push({ size_type: '', height: '', width: '', depth: '' });
        setProductData({ ...productData, customizations: updatedCustomizations });
    };

    const handleRemoveSize = (customizationIndex, sizeIndex) => {
        const updatedCustomizations = [...productData.customizations];
        updatedCustomizations[customizationIndex].sizes.splice(sizeIndex, 1);
        setProductData({ ...productData, customizations: updatedCustomizations });
    };

    const handleSizeChange = (customizationIndex, sizeIndex, field, value) => {
        const updatedCustomizations = [...productData.customizations];
        updatedCustomizations[customizationIndex].sizes[sizeIndex][field] = value;
        setProductData({ ...productData, customizations: updatedCustomizations });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        for (let key in productData) {
            if (key === 'customizations') {
                formData.append(key, JSON.stringify(productData[key]));
            } else if (productData[key] !== '') {
                formData.append(key, productData[key]);
            }
        }

        try {
            const url = productToEdit
                ? `http://localhost:5000/api/productmaster/update/${productToEdit.product_id}`
                : 'http://localhost:5000/api/productmaster/add';
            const method = productToEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (response.ok) {
                alert(productToEdit ? 'Product updated successfully!' : 'Product added successfully!');
                const updatedProduct = await response.json();
                setProducts((prevProducts) =>
                    productToEdit
                        ? prevProducts.map((product) =>
                              product.product_id === updatedProduct.product_id ? updatedProduct : product
                          )
                        : [...prevProducts, updatedProduct]
                );
                onClose();
            } else {
                alert('Error saving product');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="overlay">
            <div className="modal-content">
                <span className="close" onClick={onClose}>
                    &times;
                </span>
                <form onSubmit={handleSubmit} className="add-product-form" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <h2>{productToEdit ? 'Edit Product' : 'Add Product'}</h2>
                    <input
                        type="text"
                        name="product_name"
                        placeholder="Product Name"
                        value={productData.product_name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="number"
                        name="base_price"
                        placeholder="Base Price"
                        value={productData.base_price}
                        onChange={handleChange}
                        required
                    />
                    <select
                        name="category_id"
                        onChange={handleChange}
                        value={productData.category_id}
                        required
                    >
                        <option value="">Select Category</option>
                        {isLoading ? (
                            <option disabled>Loading categories...</option>
                        ) : categories.length > 0 ? (
                            categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))
                        ) : (
                            <option disabled>No categories available</option>
                        )}
                    </select>
                    <label className="customizable-field">
                        Customizable:
                        <input
                            type="checkbox"
                            name="customizable"
                            checked={productData.customizable}
                            onChange={handleChange}
                        />
                    </label>
                    {productData.customizable && (
                        <>
                            <button
                                type="button"
                                onClick={handleAddCustomization}
                                disabled={productData.customizations.length >= 3}
                            >
                                Add Customization
                            </button>
                            {productData.customizations.map((customization, index) => {
                                const selectedTypes = productData.customizations.map(c => c.type);

                                return (
                                    <div key={index} className="customization-section">
                                        <label>
                                            Customization Type:
                                            <select
                                                value={customization.type}
                                                onChange={(e) =>
                                                    handleCustomizationChange(index, 'type', e.target.value)
                                                }
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                {['text', 'photo', 'size']
                                                    .filter(option => !selectedTypes.includes(option) || option === customization.type)
                                                    .map(option => (
                                                        <option key={option} value={option}>
                                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            className="remove-button"
                                            onClick={() => handleRemoveCustomization(index)}
                                        >
                                            &times;
                                        </button>
                                        {customization.type === 'size' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSize(index)}
                                                    disabled={customization.sizes.length >= 3}
                                                >
                                                    Add Size
                                                </button>
                                                {customization.sizes.map((size, sizeIndex) => {
                                                    const selectedSizeTypes = customization.sizes.map(s => s.size_type);

                                                    return (
                                                        <div key={sizeIndex} className="size-section">
                                                            <label>
                                                                Size Type:
                                                                <select
                                                                    value={size.size_type}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'size_type', e.target.value)
                                                                    }
                                                                    required
                                                                >
                                                                    <option value="">Select Size</option>
                                                                    {['small', 'medium', 'large']
                                                                        .filter(option => !selectedSizeTypes.includes(option) || option === size.size_type)
                                                                        .map(option => (
                                                                            <option key={option} value={option}>
                                                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </label>
                                                            <button
                                                                type="button"
                                                                className="remove-button"
                                                                onClick={() => handleRemoveSize(index, sizeIndex)}
                                                            >
                                                                &times;
                                                            </button>
                                                            <label>
                                                                Height:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Height"
                                                                    value={size.height}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'height', e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </label>
                                                            <label>
                                                                Width:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Width"
                                                                    value={size.width}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'width', e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </label>
                                                            <label>
                                                                Depth:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Depth"
                                                                    value={size.depth}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'depth', e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                    <textarea
                        name="description"
                        placeholder="Product Description"
                        value={productData.description}
                        onChange={handleChange}
                        required
                    ></textarea>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    <div className="form-buttons">
                        <button type="submit" className="btn-adding">
                            <i className="fas fa-check"></i>
                        </button>
                        <button type="button" className="btn-close" onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Product;