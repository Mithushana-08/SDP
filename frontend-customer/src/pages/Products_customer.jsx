import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart } from "lucide-react";
import Navbar from '../components/Navbar';
import './Products_customer.css';

const ProductsPage = () => {
  const { categoryId } = useParams(); // Get categoryId from the URL
  const navigate = useNavigate(); // For navigating between categories
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizations, setCustomizations] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Fetch products based on categoryId
  useEffect(() => {
    if (categoryId) {
      fetch(`http://localhost:5000/api/productmaster/by-category?category_id=${categoryId}`)
        .then(response => response.json())
        .then(data => {
          setProducts(data);
          setFilteredProducts(data); // Initialize filtered products
          const initialQuantities = {};
          data.forEach(product => {
            initialQuantities[product.product_id] = product.stock_qty > 0 ? 1 : 0;
          });
          setQuantities(initialQuantities);
        })
        .catch(error => console.error('Error fetching products:', error));
    }
  }, [categoryId]);

  // Fetch categories
  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(response => response.json())
      .then(data => {
        setCategories(data);
      })
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  // Filter products based on search, category, and price
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_name === selectedCategory);
    }

    // Filter by price range
    if (priceRange.min !== '') {
      filtered = filtered.filter(product => product.base_price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(product => product.base_price <= parseFloat(priceRange.max));
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, priceRange, products]);

  // Handle category click
  const handleCategoryClick = (categoryID) => {
    navigate(`/products/${categoryID}`); // Update the URL with the selected categoryId
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    fetchCustomizations(product.product_id);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setCustomizations([]);
    setSelectedCustomizations({});
  };

  const fetchCustomizations = (productId) => {
    fetch(`http://localhost:5000/api/productmaster/customizations/${productId}`)
      .then(response => response.json())
      .then(data => setCustomizations(data))
      .catch(error => console.error('Error fetching customizations:', error));
  };

  const incrementQuantity = (productId) => {
    setQuantities((prevQuantities) => {
      const product = products.find((p) => p.product_id === productId);
      if (prevQuantities[productId] < product.stock_qty) {
        return {
          ...prevQuantities,
          [productId]: prevQuantities[productId] + 1,
        };
      }
      return prevQuantities;
    });
  };

  const decrementQuantity = (productId) => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: Math.max(prevQuantities[productId] - 1, 1),
    }));
  };

  // Handle size customization selection
  const handleCustomizationChange = (customization) => {
    setSelectedCustomizations(prevState => ({
      ...prevState,
      [customization.customization_id]: customization,
    }));
  };

  // Handle text customization radio selection (with toggle functionality)
  const handleTextRadioChange = (customization) => {
    setSelectedCustomizations(prevState => {
      const isSelected = prevState[customization.customization_id]?.customization_type === 'text';
      if (isSelected) {
        const newState = { ...prevState };
        delete newState[customization.customization_id];
        return newState;
      } else {
        return {
          ...prevState,
          [customization.customization_id]: { ...customization, customization_type: 'text', customization_value: '' },
        };
      }
    });
  };

  // Handle text input for text customization
  const handleTextCustomizationChange = (e, customization) => {
    const textValue = e.target.value;
    setSelectedCustomizations(prevState => ({
      ...prevState,
      [customization.customization_id]: {
        ...customization,
        customization_value: textValue,
      },
    }));
  };

  // Handle photo customization radio selection (with toggle functionality)
  const handlePhotoRadioChange = (customization) => {
    setSelectedCustomizations(prevState => {
      const isSelected = prevState[customization.customization_id]?.customization_type === 'photo';
      if (isSelected) {
        const newState = { ...prevState };
        delete newState[customization.customization_id];
        return newState;
      } else {
        return {
          ...prevState,
          [customization.customization_id]: { ...customization, customization_type: 'photo', uploaded_image: null },
        };
      }
    });
  };

  // Handle photo upload for photo customization
  const handlePhotoUpload = (e, customization) => {
    const file = e.target.files[0];
    setSelectedCustomizations(prevState => ({
      ...prevState,
      [customization.customization_id]: { ...customization, uploaded_image: file },
    }));
  };

  const handleAddToCart = (product) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to add items to the cart.");
      return;
    }

    const cartItem = {
      product_id: product.product_id,
      quantity: quantities[product.product_id],
      price: product.base_price,
      customizations: Object.values(selectedCustomizations),
    };

    fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cartItem),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add item to cart");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Item added to cart:", data);
        alert("Item added to cart successfully!");
        closeProductModal(); // Close the modal after successful addition
      })
      .catch((error) => {
        console.error("Error adding item to cart:", error);
        alert("Failed to add item to cart. Please login to add items to cart.");
      });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  return (
    <div>
      <Navbar />
      <section id="products" className="section products-section">
        <h1>Products</h1>
        <div className="products-container">
          {/* Filter Sidebar */}
          <div className="filter-sidebar">
            <h2>Filter</h2>

            {/* Search */}
            <div className="filter-section">
              <h3>Search</h3>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="filter-section">
              <h3>Category</h3>
              <ul>
                {categories.map(category => (
                  <li
                    key={category.CategoryID}
                    className={categoryId === category.CategoryID ? 'selected' : ''}
                    onClick={() => handleCategoryClick(category.CategoryID)} // Navigate to the selected category
                  >
                    {category.CategoryName}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price */}
            <div className="filter-section">
              <h3>Price</h3>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* Clear Filters */}
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>

          {/* Product Grid */}
          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.product_id} className="product-card" onClick={() => openProductModal(product)}>
                  <img
                    src={product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : `http://localhost:5000/uploads/${product.image}`}
                    alt={product.product_name}
                  />
                  <h3>{product.product_name}</h3>
                  <p className="price">Rs.{product.base_price.toFixed(2)}</p>
                  <div className="cart-and-stock">
                    <div className="stock-and-quantity">
                      {product.stock_qty > 0 ? (
                        <p className="available">Available: {product.stock_qty}</p>
                      ) : (
                        <p className="out-of-stock">Out of Stock</p>
                      )}
                      <div className="quantity-selector">
                        <button onClick={(e) => { e.stopPropagation(); decrementQuantity(product.product_id); }}>-</button>
                        <span>{quantities[product.product_id]}</span>
                        <button onClick={(e) => { e.stopPropagation(); incrementQuantity(product.product_id); }}>+</button>
                      </div>
                    </div>
                    <button
                      className="add-to-cart"
                      disabled={product.stock_qty === 0 || quantities[product.product_id] === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No products match your filters.</p>
            )}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="product-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closeProductModal}>X</button>
            <div className="modal-left">
              <img
                src={selectedProduct.image.startsWith('/uploads') ? `http://localhost:5000${selectedProduct.image}` : `http://localhost:5000/uploads/${selectedProduct.image}`}
                alt={selectedProduct.product_name}
              />
            </div>
            <div className="modal-right">
              <h2>{selectedProduct.product_name}</h2>
              <p className="price">Rs.{selectedProduct.base_price.toFixed(2)}</p>
              <p>{selectedProduct.description}</p>
              {selectedProduct.stock_qty > 0 ? (
                <p className="available">Available: {selectedProduct.stock_qty}</p>
              ) : (
                <p className="out-of-stock">Out of Stock</p>
              )}
              {customizations.length > 0 && (
                <div className="customizations">
                  <h3>Available Customizations:</h3>
                  {customizations.map(customization => (
                    <div key={customization.customization_id} className="customization-item">
                      <p>Type: {customization.customization_type}</p>
                      {customization.customization_type === 'size' && (
                        <div>
                          <label>
                            <input
                              type="radio"
                              name={`size-${customization.customization_id}`}
                              value={customization.size_type}
                              checked={selectedCustomizations[customization.customization_id]?.size_type === customization.size_type}
                              onChange={() => handleCustomizationChange(customization)}
                            />
                            Size: {customization.size_type} (H: {customization.height}, W: {customization.width}, D: {customization.depth})
                          </label>
                        </div>
                      )}
                      {customization.customization_type === 'text' && (
                        <div>
                          <label>
                            <input
                              type="radio"
                              name={`text-${customization.customization_id}`}
                              value={customization.customization_id}
                              checked={selectedCustomizations[customization.customization_id]?.customization_type === 'text'}
                              onClick={() => handleTextRadioChange(customization)}
                            />
                            Add Text
                          </label>
                          {selectedCustomizations[customization.customization_id]?.customization_type === 'text' && (
                            <input
                              type="text"
                              placeholder="Enter text"
                              value={selectedCustomizations[customization.customization_id]?.customization_value || ''}
                              onChange={(e) => handleTextCustomizationChange(e, customization)}
                            />
                          )}
                        </div>
                      )}
                      {customization.customization_type === 'photo' && (
                        <div>
                          <label>
                            <input
                              type="radio"
                              name={`photo-${customization.customization_id}`}
                              value={customization.customization_id}
                              checked={selectedCustomizations[customization.customization_id]?.customization_type === 'photo'}
                              onClick={() => handlePhotoRadioChange(customization)}
                            />
                            Add Photo
                          </label>
                          {selectedCustomizations[customization.customization_id]?.customization_type === 'photo' && (
                            <input
                              type="file"
                              name="photo"
                              onChange={(e) => handlePhotoUpload(e, customization)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="quantity-selector">
                <button onClick={() => decrementQuantity(selectedProduct.product_id)}>-</button>
                <span>{quantities[selectedProduct.product_id]}</span>
                <button onClick={() => incrementQuantity(selectedProduct.product_id)}>+</button>
              </div>
              <button
                className="add-to-cart"
                disabled={selectedProduct.stock_qty === 0 || quantities[selectedProduct.product_id] === 0}
                onClick={() => handleAddToCart(selectedProduct)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;