import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductsPage from './pages/Products_customer';
import CartPage from './pages/Cart';
import ProfilePage from './pages/Profile';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './App.css';
import Log from "./assets/login.jpg"; // Adjust the path to your logo image
import Login from "./assets/image2.jpg"; 
import Image3 from "./assets/Home4.jpg"; 
import Image4 from "./assets/Home3.jpg"; 

const images = [
  { id: 1, src: Log, title: "Image 1" },
  { id: 2, src: Login, title: "Image 2" },
  { id: 3, src: Image3, title: "Image 3" },
  { id: 4, src: Image4, title: "Image 4" },
  
];

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories from the backend
    fetch('http://localhost:5000/api/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  useEffect(() => {
    // Rotate images every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (categoryId) => {
    navigate(`/products/${categoryId}`);
  };

  const getPositionClass = (index) => {
    const position = (index - currentIndex + images.length) % images.length;
    return `position-${position}`;
  };

  return (
    <div className="home-container">
      <section id="home" className="section hero-section">
        <div className="hero-content">
          {/* Welcome Message */}
          <div className="hero-text-area">
  <h1 className="neon-text">Handcrafted with Love and Nature</h1>
  <p className="hero-subtitle">Your one-stop shop for unique handcrafted products.</p>
  <button
      className="get-started-btn"
      onClick={() => navigate('/products/C_01')}
    >
      Get Started
    </button>
  

          </div>
{/* Carousel Section */}
<div className="carousel-container">
            <div className="carousel-wrapper">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`carousel-image ${getPositionClass(index)}`}
                  style={{ backgroundImage: `url(${image.src})` }}
                >
                  
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="section">
        <h1>Explore By Categories</h1>
       
        
        <div className="category-grid">
          {categories.map(category => (
            <div 
              key={category.CategoryID} 
              className="category-card"
              onClick={() => handleCategoryClick(category.CategoryID)}
            >
              <div className="category-image-container">
              <img 
                  src={
                    category.CategoryImage?.startsWith('/uploads')
                      ? `http://localhost:5000${category.CategoryImage}`
                      : category.CategoryImage || 'https://via.placeholder.com/150'
                  } 
                  alt={category.CategoryName} 
                  className="category-image"
                />
                <div className="category-overlay"></div>
              </div>
              <h3>{category.CategoryName}</h3>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="section about-section">
      <div className="about-container">
        <h1>About Us</h1>
        <p className='about-p'>We are a team of passionate individuals who love to bring high-quality products to your doorstep!</p>
        <div className="about-content">
          {/* Left Column: Mission and Vision */}
          <div className="about-mission-vision">
            <h3>Our Mission</h3>
            <p>To provide exceptional products with outstanding customer service that enhances your everyday life.</p>
            <h3>Our Vision</h3>
            <p>To be the leading provider of innovative and sustainable products that inspire and delight our customers.</p>
          </div>

          {/* Right Column: Location and Visit Us */}
          <div className="about-location">
          
            <h3>Visit Us Here</h3>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.436270412491!2d80.0587271!3d9.7145343!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afe55004ee697a9%3A0xb8c884de5a420ba4!2sCrafttary!5e0!3m2!1sen!2sus!4v1697654321!5m2!1sen!2sus"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Crafttary Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

      <section id="contact-image" className="section contact-image-section">
  <div className="contact-image-container">
    {/* Get In Touch Section */}
    <div className="contact-image-info">
      <h2 className="contact-image-title">Get In Touch</h2>
      <p className="contact-image-description">
        We're here to help with any questions, orders, or collaborations. Reach out to us through any of these channels:
      </p>
      <ul className="contact-image-details">
        <li>
          <FiMail className="contact-image-icon" />
          <span>info@coconutcrafthaven.com</span>
        </li>
        <li>
          <FiPhone className="contact-image-icon" />
          <span>(555) 123-4567</span>
        </li>
        <li>
          <FiMapPin className="contact-image-icon" />
          <span>123 Craft City, Artisan City, AC 98765, United States</span>
        </li>
      </ul>
      <div className="contact-image-business-hours">
        <h3>Business Hours</h3>
        <p>Monday – Friday: <span>9:00 AM – 6:00 PM</span></p>
        <p>Saturday: <span>10:00 AM – 4:00 PM</span></p>
        <p>Sunday: <span>Closed</span></p>
      </div>
    </div>

    {/* Send Us a Message Section */}
    <div className="contact-image-form">
      <h2 className="contact-image-title">Send Us a Message</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = {
          name: e.target.name.value,
          email: e.target.email.value,
          subject: e.target.subject.value,
          message: e.target.message.value,
        };
        console.log('Form submitted:', formData);
        e.target.reset(); // Reset form after submission
      }}>
       <div class="form-group-row">
  <div class="form-group">
    <input type="text" placeholder="Name" />
  </div>
  <div class="form-group">
    <input type="email" placeholder="Email" />
  </div>
</div>
        <div className="form-group">
          <input type="text" name="subject" placeholder="Subject" required />
        </div>
        <div className="form-group">
          <textarea name="message" placeholder="Message" rows="5" required></textarea>
        </div>
        <button type="submit" className="contact-image-send-button">Send Message</button>
      </form>
    </div>
  </div>
</section>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:categoryId" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} /> {/* Cart route */}
          {/* Add ProfilePage routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:tab" element={<ProfilePage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;