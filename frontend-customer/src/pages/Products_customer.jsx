import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import './Products_customer.css';

const ProductsPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products for the selected category
    fetch(`http://localhost:5000/api/productmaster/by-category?category_id=${categoryId}`)
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Error fetching products:', error));
  }, [categoryId]);

  return (
    <div>
      <Navbar />
      <section id="products" className="section">
        <h1>Products</h1>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map(product => (
              <div key={product.product_id} className="product-card">
                <img
                  src={product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : `http://localhost:5000/uploads/${product.image}`}
                  alt={product.product_name}
                />
                <h3>{product.product_name}</h3>
                <p>Rs.{product.base_price.toFixed(2)}</p>
                <button className="add-to-cart">
                  <FontAwesomeIcon icon={faShoppingCart} />
                </button>
              </div>
            ))
          ) : (
            <p>No products available for this category.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;