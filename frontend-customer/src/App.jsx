// src/App.jsx
import React from 'react';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  // Sample categories for the shop section
  const categories = [
    { id: 1, name: 'Electronics', imageUrl: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Clothing', imageUrl: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Furniture', imageUrl: 'https://via.placeholder.com/150' },
    { id: 4, name: 'Toys', imageUrl: 'https://via.placeholder.com/150' },
    { id: 5, name: 'Books', imageUrl: 'https://via.placeholder.com/150' },
    { id: 6, name: 'Beauty', imageUrl: 'https://via.placeholder.com/150' },
    { id: 7, name: 'Sports', imageUrl: 'https://via.placeholder.com/150' },  // New
    { id: 8, name: 'Jewelry', imageUrl: 'https://via.placeholder.com/150' }, // New
    { id: 9, name: 'Home Decor', imageUrl: 'https://via.placeholder.com/150' }
  ];

  return (
    <div>
      <Navbar />
      
      <section id="home" className="section">
        <h1>Welcome to our E-Shop!</h1>
        <p>Find the best products here!</p>
      </section>

      <section id="shop" className="section">
        <h1>Shop</h1>
        <p>Browse through our amazing collection of products!</p>
        
        <div className="category-grid">
          {categories.map(category => (
            <div key={category.id} className="category-card">
              <img src={category.imageUrl} alt={category.name} />
              <h3>{category.name}</h3>
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
