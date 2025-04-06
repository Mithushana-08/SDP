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
  const [customizations, setCustomizations] = useState([]); // State for customizations
  const [selectedCustomizations, setSelectedCustomizations] = useState({}); // State for selected customizations

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
    fetchCustomizations(product.product_id); // Fetch customizations for the selected product
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setCustomizations([]); // Clear customizations
    setSelectedCustomizations({}); // Clear selected customizations
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
        // Deselect the radio button using delete
        const newState = { ...prevState };
        delete newState[customization.customization_id];
        return newState;
      } else {
        // Select the radio button
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
        // Deselect the radio button using delete
        const newState = { ...prevState };
        delete newState[customization.customization_id];
        return newState;
      } else {
        // Select the radio button
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

  const handleAddToCart = () => {
    const cartItem = {
      product_id: selectedProduct.product_id,
      quantity: quantities[selectedProduct.product_id],
      customizations: Object.values(selectedCustomizations),
    };

    // Send cartItem to the backend or update the cart state
    console.log('Adding to cart:', cartItem);
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
                      <button onClick={() => decrementQuantity(product.product_id)}>-</button>
                      <span>{quantities[product.product_id]}</span>
                      <button onClick={() => incrementQuantity(product.product_id)}>+</button>
                    </div>
                  </div>
                  <button
                    className="add-to-cart"
                    disabled={product.stock_qty === 0 || quantities[product.product_id] === 0}
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

      {/* Product Modal */}
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
              {/* Stock Availability */}
              {selectedProduct.stock_qty > 0 ? (
                <p className="available">Available: {selectedProduct.stock_qty}</p>
              ) : (
                <p className="out-of-stock">Out of Stock</p>
              )}
              {/* Customizations */}
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
                name={`size-${customization.customization_id}`} // Unique name for each size customization
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
        name={`text-${customization.customization_id}`} // Unique name for each text customization
        value={customization.customization_id}
        checked={selectedCustomizations[customization.customization_id]?.customization_type === 'text'}
        onClick={() => handleTextRadioChange(customization)} // Use onClick for toggling
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
        name={`photo-${customization.customization_id}`} // Unique name for each photo customization
        value={customization.customization_id}
        checked={selectedCustomizations[customization.customization_id]?.customization_type === 'photo'}
        onClick={() => handlePhotoRadioChange(customization)} // Use onClick for toggling
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
                onClick={handleAddToCart}
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