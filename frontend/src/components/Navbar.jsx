import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { auth, logout }  = useAuth();
  const { cartCount }     = useCart();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() { logout(); navigate('/'); setDropOpen(false); }

  function scrollToFooter(e) {
    e.preventDefault();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setMenuOpen(false);
  }

  function isActive(path) { return location.pathname === path; }

  return (
    <nav className="navbar" style={scrolled ? { boxShadow: '0 24px 48px rgba(0,0,0,0.2)' } : {}}>
      <div className="nav-inner">
        <Link to="/" className="navbar-brand">
          <img
            src="/logo.png"
            alt="Mathi's Secret Organics"
            style={{ height: 52, objectFit: 'contain', display: 'block' }}
          />
          <span className="brand-text">Mathi's Secret <em>Organics</em></span>
        </Link>

        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <div className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <Link to="/"         className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>
          <Link to="/products" className={`nav-link${isActive('/products') ? ' active' : ''}`}>Products</Link>
          <a href="#contact" className="nav-link" onClick={scrollToFooter}>Contact</a>

          {auth?.token && (
            <Link to="/cart" className="nav-cart" title="Cart">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {auth?.user ? (
            <div className="user-dropdown" ref={dropRef}>
              <button className="user-btn" onClick={() => setDropOpen(!dropOpen)}>
                <span className="user-avatar">
                  {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-name">
                  {auth.user.name ? auth.user.name.split(' ')[0] : 'User'}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>

              {dropOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <strong>{auth.user.name}</strong>
                    <small>{auth.user.email}</small>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/orders"    className="dropdown-item" onClick={() => setDropOpen(false)}>📦 My Orders</Link>
                  <Link to="/profile"   className="dropdown-item" onClick={() => setDropOpen(false)}>👤 Profile</Link>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setDropOpen(false)}>🏠 Dashboard</Link>
                  {auth.user.role === 1 && (
                    <>
                      <div className="dropdown-divider" />
                      <Link to="/admin/dashboard" className="dropdown-item admin-item" onClick={() => setDropOpen(false)}>
                        ⚙️ Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
