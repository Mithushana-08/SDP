import React from 'react';
import './LoginModal.css'; // Create a CSS file for styling the modal

const LoginModal = ({ onClose }) => {
  return (
    <div className="login-modal">
      <div className="modal-content">
        <h2>Login</h2>
        <form>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <button className="close-modal" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default LoginModal;