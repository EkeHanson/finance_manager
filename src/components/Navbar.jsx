import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Demo', path: '/demo' },
  // Add more pages here as needed
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen(prev => !prev);
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">Rodrimine</div>
        <button
          className="navbar-toggle"
          aria-label="Toggle menu"
          onClick={handleMenuToggle}
        >
          <span className="navbar-toggle-bar"></span>
          <span className="navbar-toggle-bar"></span>
          <span className="navbar-toggle-bar"></span>
        </button>
        <ul className={`navbar-list${menuOpen ? ' open' : ''}`}>
          {pages.map(page => (
            <li key={page.path} className="navbar-item">
              <NavLink
                to={page.path}
                className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
                end={page.path === '/'}
                onClick={handleLinkClick}
              >
                {page.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
