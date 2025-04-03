import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductsPage from './pages/Products_customer';
import './App.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories from the backend
    fetch('http://localhost:5000/api/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  const handleCategoryClick = (categoryId) => {
    navigate(`/products/${categoryId}`);
  };

  return (
    <div>
      <Navbar />
      
      <section id="home" className="section">
        {/* Add a banner or introductory content here if needed */}
      </section>

      <section id="shop" className="section">
        <h1>Shop Here</h1>
        <p>Explore our products by category and discover the perfect picks for you!</p>
        
        <div className="category-grid">
          {categories.map(category => (
            <div 
              key={category.CategoryID} 
              className="category-card" 
              onClick={() => handleCategoryClick(category.CategoryID)}
            >
              <img 
                src={
                  category.CategoryImage?.startsWith('/uploads')
                    ? `http://localhost:5000${category.CategoryImage}`
                    : category.CategoryImage || 'https://via.placeholder.com/150'
                } 
                alt={category.CategoryName} 
                className="category-image"
              />
              <h3>{category.CategoryName}</h3>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="section">
        <h1>About Us</h1>
        <p>We are a team of passionate individuals who love to bring high-quality products to your doorstep!</p>
      </section>

      <section id="contact" className="section">
        <h1>Contact Us</h1>
        <p>Have any questions? Feel free to reach out to us!</p>
      </section>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:categoryId" element={<ProductsPage />} />
      </Routes>
    </Router>
  );
};

export default App;