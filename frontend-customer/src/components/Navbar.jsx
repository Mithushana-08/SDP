import React, { useState } from 'react';
import { FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import './Navbar.css';
import logo from '../assets/logo.png'; // Adjust the path as needed
import LoginModal from './LoginModal'; // Import the LoginModal component

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for LoginModal

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLoginModal = () => {
    setIsLoginModalOpen(!isLoginModalOpen); // Toggle the modal visibility
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-image" />
          <a href="#home">CRAFTTARY</a>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search here..." />
          <FiSearch className="search-icon" />
        </div>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li><a href="#home">Home</a></li>
          <li><a href="#shop">Shop</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="navbar-icons">
          <button className="login-button" onClick={toggleLoginModal}>Login</button>
          <button className="signup-button">Sign Up</button>
          <FiShoppingCart className="icon" />
          <FiUser className="icon" />
        </div>
        <div className="menu-toggle" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
      {isLoginModalOpen && <LoginModal onClose={toggleLoginModal} />} {/* Conditionally render LoginModal */}
    </nav>
  );
};

export default Navbar;