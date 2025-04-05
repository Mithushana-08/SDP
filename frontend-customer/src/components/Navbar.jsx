import React, { useState } from 'react';
import { FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';
import LoginModal from './LoginModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLoginModal = () => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const handleCartClick = () => {
    navigate('/cart'); // Navigate to the cart page
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-image" />
          <Link to="/">CRAFTTARY</Link>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search here..." />
          <FiSearch className="search-icon" />
        </div>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={() => handleScrollToSection('home')}>Home</Link>
          </li>
          <li>
            <Link to="/" onClick={() => handleScrollToSection('shop')}>Shop</Link>
          </li>
          <li>
            <Link to="/" onClick={() => handleScrollToSection('about')}>About</Link>
          </li>
          <li>
            <Link to="/" onClick={() => handleScrollToSection('contact')}>Contact</Link>
          </li>
        </ul>
        <div className="navbar-icons">
          <button className="login-button" onClick={toggleLoginModal}>Login</button>
          <button className="signup-button">Sign Up</button>
          <FiShoppingCart className="icon" onClick={handleCartClick} /> {/* Add onClick handler */}
          <FiUser className="icon" />
        </div>
        <div className="menu-toggle" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
      {isLoginModalOpen && <LoginModal onClose={toggleLoginModal} />}
    </nav>
  );
};

export default Navbar;