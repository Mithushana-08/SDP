// Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section footer-company">
          <h3>Crafttary</h3>
          <p>Bringing high-quality, handcrafted products to your doorstep with love and care.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-section footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/#about">About Us</Link></li>
            <li><Link to="/profile">My Account</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section footer-contact">
          <h3>Contact Us</h3>
          <p><strong>Address:</strong> Crafttary, Jaffna, Sri Lanka</p>
          <p><strong>Email:</strong> <a href="mailto:info@crafttary.com">info@crafttary.com</a></p>
          <p><strong>Phone:</strong> <a href="tel:+94123456789">+94 123 456 789</a></p>
        </div>

        {/* Our Services */}
        <div className="footer-section footer-services">
          <h3>Our Services</h3>
          <ul>
            <li>Free Shipping on Orders Over $50</li>
            <li>100% Handmade Products</li>
            <li>24/7 Customer Support</li>
            <li>Easy Returns & Exchanges</li>
          </ul>
        </div>
      </div>

      {/* Copyright Notice */}
      <div className="footer-bottom">
        <p>© {currentYear} Crafttary. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;