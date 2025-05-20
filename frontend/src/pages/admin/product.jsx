import React, { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import './product.css';
import '../../components/styles/buttons.css';
import '../../components/styles/search-container.css';
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false); // New state for image modal
    const [selectedImage, setSelectedImage] = useState(''); // Store the selected image URL
    const [customizationDetails, setCustomizationDetails] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch products (include all statuses for admin)
    useEffect(() => {
        fetch('http://localhost:5000/api/productmaster?all=true')
            .then(response => response.json())
            .then(data => {
                setProducts(data);
            })
            .catch(error => console.error('Error fetching product data:', error));
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // SweetAlert2-based soft delete (terminate)
    const handleTerminate = async (productId) => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        swalWithBootstrapButtons.fire({
            title: "Are you sure?",
            text: "Do you want to terminate this product?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, terminate!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/api/productmaster/terminate/${productId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                        setProducts(prevProducts => prevProducts.map(product =>
                            product.product_id === productId ? { ...product, product_status: 'terminated' } : product
                        ));
                        swalWithBootstrapButtons.fire({
                            title: "Terminated!",
                            text: "Product has been set to terminated.",
                            icon: "success",
                            customClass: { confirmButton: "btn btn-success" },
                            buttonsStyling: false
                        });
                    } else {
                        swalWithBootstrapButtons.fire({
                            title: "Error!",
                            text: "Failed to terminate product.",
                            icon: "error",
                            customClass: { confirmButton: "btn btn-danger" },
                            buttonsStyling: false
                        });
                    }
                } catch (error) {
                    swalWithBootstrapButtons.fire({
                        title: "Error!",
                        text: "Failed to terminate product.",
                        icon: "error",
                        customClass: { confirmButton: "btn btn-danger" },
                        buttonsStyling: false
                    });
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled",
                    text: "Product is still active.",
                    icon: "error",
                    customClass: { confirmButton: "btn btn-danger" },
                    buttonsStyling: false
                });
            }
        });
    };

    // Reactivate product
    const handleReactivate = async (productId) => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        swalWithBootstrapButtons.fire({
            title: "Are you sure?",
            text: "Do you want to reactivate this product?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, activate!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/api/productmaster/terminate/${productId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product_status: 'active' })
                    });
                    if (response.ok) {
                        setProducts(prevProducts => prevProducts.map(product =>
                            product.product_id === productId ? { ...product, product_status: 'active' } : product
                        ));
                        swalWithBootstrapButtons.fire({
                            title: "Activated!",
                            text: "Product has been set to active.",
                            icon: "success",
                            customClass: { confirmButton: "btn btn-success" },
                            buttonsStyling: false
                        });
                    } else {
                        swalWithBootstrapButtons.fire({
                            title: "Error!",
                            text: "Failed to activate product.",
                            icon: "error",
                            customClass: { confirmButton: "btn btn-danger" },
                            buttonsStyling: false
                        });
                    }
                } catch (error) {
                    swalWithBootstrapButtons.fire({
                        title: "Error!",
                        text: "Failed to activate product.",
                        icon: "error",
                        customClass: { confirmButton: "btn btn-danger" },
                        buttonsStyling: false
                    });
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled",
                    text: "Product is still terminated.",
                    icon: "error",
                    customClass: { confirmButton: "btn btn-danger" },
                    buttonsStyling: false
                });
            }
        });
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

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const filteredProducts = products.filter(product => {
        const matchesName = product.product_name && product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
        // Show all by default, or filter by status if needed
        return matchesName && (
            statusFilter === 'all' ? true :
            statusFilter === 'active' ? (product.product_status === 'active' || product.product_status === 'Active') :
            (product.product_status === 'terminated' || product.product_status === 'Terminated')
        );
    });

    return (
        <div className="reports-page">
            <AdminSidebar />
            <div className="main-user-content">
                <AdminNavbar />
                <div className="user-content">
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
                        <select
                            className="status-filter"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ marginLeft: '1rem', padding: '0.5rem', borderRadius: '5px' }}
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="terminated">Terminated</option>
                        </select>
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
                                    <td>
                                      <span className={
                                        product.product_status === 'terminated' ? 'status-terminated' : 'status-active'
                                      }>
                                        {product.product_status ? (product.product_status.charAt(0).toUpperCase() + product.product_status.slice(1)) : 'Active'}
                                      </span>
                                      <br />
                                      <span className={
                                        product.stock_qty > 10 ? 'stock-in' : product.stock_qty > 0 && product.stock_qty <= 10 ? 'stock-low' : 'stock-out'
                                      }>
                                        {product.stock_qty > 10 ? 'In Stock' : product.stock_qty > 0 && product.stock_qty <= 10 ? 'Low Stock' : 'Out of Stock'}
                                      </span>
                                    </td>
                                    <td>
                                      {product.stock_qty || 0}
                                    </td>
                                    <td>
                                        <img
                                            src={product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : `http://localhost:5000/uploads/${product.image}`}
                                            alt={product.product_name}
                                            width="50"
                                            onClick={() => handleImageClick(product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : `http://localhost:5000/uploads/${product.image}`)}
                                            style={{ cursor: 'pointer' }}
                                            onError={(e) => {
                                                if (e.target.src !== 'http://localhost:5000/uploads/placeholder.png') {
                                                    e.target.src = 'http://localhost:5000/uploads/placeholder.png';
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                        {product.product_status !== 'terminated' && product.product_status !== 'Terminated' ? (
                                            <div className="action-buttons">
                                                <button className="edit-button" onClick={() => handleEdit(product)}><FiEdit /></button>
                                                <button className="delete-button" onClick={() => handleTerminate(product.product_id)}><FiTrash2 /></button>
                                                <button className="edit-button" onClick={() => handleViewCustomizations(product.product_id)}>
                                                    <FiEye />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="reactivate-button btn-success" onClick={() => handleReactivate(product.product_id)} title="Reactivate Product">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0020.49 15"></path></svg>
                                            </button>
                                        )}
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
                            productToEdit={productToEdit}
                        />
                    )}
                    {isViewModalOpen && (
                        <div className="overlay">
                            <div className="modal-content">
                                <span className="close" onClick={() => setIsViewModalOpen(false)}>×</span>
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
                    {isImageModalOpen && (
                        <div className="overlay">
                            <div className="modal-content image-modal">
                                <span className="close" onClick={() => setIsImageModalOpen(false)}>×</span>
                                <img
                                    src={selectedImage}
                                    alt="Enlarged Product"
                                    className="enlarged-product-image"
                                    onError={(e) => {
                                        if (e.target.src !== 'http://localhost:5000/uploads/placeholder.png') {
                                            e.target.src = 'http://localhost:5000/uploads/placeholder.png';
                                        }
                                    }}
                                />
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
        // Fetch categories
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

        // If editing a product, fetch its customizations and populate the form
        if (productToEdit) {
            const fetchCustomizations = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/productmaster/customizations/${productToEdit.product_id}`);
                    const customizationsData = await response.json();
                    setProductData({
                        product_name: productToEdit.product_name || '',
                        category_id: productToEdit.category_id || '',
                        base_price: productToEdit.base_price || '',
                        customizable: productToEdit.customizable === 'yes' || productToEdit.customizable === true,
                        customizations: customizationsData.map(cust => ({
                            customization_id: cust.customization_id,
                            type: cust.customization_type,
                            description: cust.description || '',
                            sizes: cust.size_type ? [{ size_type: cust.size_type, height: cust.height, width: cust.width, depth: cust.depth }] : [],
                        })) || [],
                        description: productToEdit.description || '',
                        image: null,
                    });
                } catch (error) {
                    console.error('Error fetching customizations:', error);
                }
            };
            fetchCustomizations();
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
                { type: '', description: '', sizes: [] },
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
            } else if (productData[key] !== '' && productData[key] !== null) {
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
                              product.product_id === productToEdit.product_id ? { ...product, ...updatedProduct } : product
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
            <div className="modal-content add-edit-modal">
                <span className="close modal-close" onClick={onClose}>×</span>
                <form onSubmit={handleSubmit} className="add-product-form">
                    <h2 className="modal-title">{productToEdit ? 'Edit Product' : 'Add Product'}</h2>
                    <input
                        type="text"
                        name="product_name"
                        placeholder="Product Name"
                        value={productData.product_name}
                        onChange={handleChange}
                        required
                        className="input-field"
                    />
                    <input
                        type="number"
                        name="base_price"
                        placeholder="Base Price"
                        value={productData.base_price}
                        onChange={handleChange}
                        required
                        className="input-field"
                    />
                    <select
                        name="category_id"
                        onChange={handleChange}
                        value={productData.category_id}
                        required
                        className="input-field"
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
                            className="checkbox-field"
                        />
                    </label>
                    {productData.customizable && (
                        <>
                            <button
                                type="button"
                                onClick={handleAddCustomization}
                                disabled={productData.customizations.length >= 3}
                                className="add-customization-btn"
                            >
                                Add Customization
                            </button>
                            {productData.customizations.map((customization, index) => {
                                const selectedTypes = productData.customizations.map(c => c.type);
                                return (
                                    <div key={index} className="customization-section">
                                        <label className="customization-type-label">
                                            Customization Type:
                                            <select
                                                value={customization.type}
                                                onChange={(e) =>
                                                    handleCustomizationChange(index, 'type', e.target.value)
                                                }
                                                required
                                                className="input-field customization-type-select"
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
                                            className="remove-button customization-remove-btn"
                                            onClick={() => handleRemoveCustomization(index)}
                                        >
                                            ×
                                        </button>
                                        {customization.type === 'size' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSize(index)}
                                                    disabled={customization.sizes.length >= 3}
                                                    className="add-size-btn"
                                                >
                                                    Add Size
                                                </button>
                                                {customization.sizes.map((size, sizeIndex) => {
                                                    const selectedSizeTypes = customization.sizes.map(s => s.size_type);
                                                    return (
                                                        <div key={sizeIndex} className="size-section">
                                                            <label className="size-type-label">
                                                                Size Type:
                                                                <select
                                                                    value={size.size_type}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'size_type', e.target.value)
                                                                    }
                                                                    required
                                                                    className="input-field size-type-select"
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
                                                                className="remove-button size-remove-btn"
                                                                onClick={() => handleRemoveSize(index, sizeIndex)}
                                                            >
                                                                ×
                                                            </button>
                                                            <label className="size-label">
                                                                Height:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Height"
                                                                    value={size.height}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'height', e.target.value)
                                                                    }
                                                                    required
                                                                    className="input-field size-input"
                                                                />
                                                            </label>
                                                            <label className="size-label">
                                                                Width:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Width"
                                                                    value={size.width}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'width', e.target.value)
                                                                    }
                                                                    required
                                                                    className="input-field size-input"
                                                                />
                                                            </label>
                                                            <label className="size-label">
                                                                Depth:
                                                                <input
                                                                    type="number"
                                                                    placeholder="Depth"
                                                                    value={size.depth}
                                                                    onChange={(e) =>
                                                                        handleSizeChange(index, sizeIndex, 'depth', e.target.value)
                                                                    }
                                                                    required
                                                                    className="input-field size-input"
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
                        className="input-field textarea-field"
                    ></textarea>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                        className="input-field file-input"
                    />
                    <div className="form-buttons">
                        <button type="submit" className="btn-adding">
                            <i className="fas fa-check"></i> {productToEdit ? '' : ''}
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