import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart } from "lucide-react";
import Navbar from '../components/Navbar';
import './Products_customer.css';

const ProductsPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizations, setCustomizations] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});

  useEffect(() => {
    fetch(`http://localhost:5000/api/productmaster/by-category?category_id=${categoryId}`)
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        const initialQuantities = {};
        data.forEach(product => {
          initialQuantities[product.product_id] = product.stock_qty > 0 ? 1 : 0;
        });
        setQuantities(initialQuantities);
      })
      .catch(error => console.error('Error fetching products:', error));
  }, [categoryId]);

  const fetchCustomizations = (productId) => {
    fetch(`http://localhost:5000/api/productmaster/customizations/${productId}`)
      .then(response => response.json())
      .then(data => setCustomizations(data))
      .catch(error => console.error('Error fetching customizations:', error));
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

  const handleCustomizationChange = (customization) => {
    setSelectedCustomizations(prevState => ({
      ...prevState,
      [customization.customization_id]: customization,
    }));
  };

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

  const handlePhotoUpload = (e, customization) => {
    const file = e.target.files[0];
    setSelectedCustomizations(prevState => ({
      ...prevState,
      [customization.customization_id]: { ...customization, uploaded_image: file },
    }));
  };

  const incrementQuantity = (productId) => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: prevQuantities[productId] + 1,
    }));
  };

  const decrementQuantity = (productId) => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: Math.max(prevQuantities[productId] - 1, 1),
    }));
  };

  const handleAddToCart = (product) => {
    // Retrieve the token from localStorage
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
        Authorization: `Bearer ${token}`, // Ensure the token is prefixed with "Bearer"
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
      })
      .catch((error) => {
        console.error("Error adding item to cart:", error);
        alert("Failed to add item to cart.");
      });
  };
  return (
    <div>
      <Navbar />
      <section id="products" className="section">
        <h1>Products</h1>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map(product => (
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
            <p>No products available for this category.</p>
          )}
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