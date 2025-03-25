import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories from the backend
    fetch('http://localhost:5000/api/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  return (
    <div>
      <Navbar />
      
      <section id="home" className="section">
       
      </section>

      <section id="shop" className="section">
        <h1>Shop</h1>
        <p>Browse through our amazing collection of products!</p>
        
        <div className="category-grid">
          {categories.map(category => (
            <div key={category.CategoryID} className="category-card">
              <img src={category.imageUrl || 'https://via.placeholder.com/150'} alt={category.CategoryName} />
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

export default App;