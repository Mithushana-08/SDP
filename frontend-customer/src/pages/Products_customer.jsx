import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart } from "lucide-react"; // Import the ShoppingCart icon
import Navbar from '../components/Navbar';
import './Products_customer.css';

const ProductsPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null); // State for the selected product

  useEffect(() => {
    // Fetch products for the selected category
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

  const openProductModal = (product) => {
    setSelectedProduct(product); // Set the selected product
  };

  const closeProductModal = () => {
    setSelectedProduct(null); // Clear the selected product
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
              <div className="quantity-selector">
                <button onClick={() => decrementQuantity(selectedProduct.product_id)}>-</button>
                <span>{quantities[selectedProduct.product_id]}</span>
                <button onClick={() => incrementQuantity(selectedProduct.product_id)}>+</button>
              </div>
              <button className="add-to-cart">Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;