// ── Sidebar.jsx ───────────────────────────────────────────────────────────────
/*
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV = [
  { id:'overview',    label:'Overview',    icon:'📊', path:'/admin' },
  { id:'orders',      label:'Orders',      icon:'📦', path:'/admin/orders' },
  { id:'products',    label:'Products',    icon:'🛍', path:'/admin/products' },
  { id:'categories',  label:'Categories',  icon:'🏷', path:'/admin/categories' },
  { id:'reviews',     label:'Reviews',     icon:'⭐', path:'/admin/reviews' },
];

export function Sidebar({ pendingCount }) {
  const { auth, logout } = useAdminAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isActive = path => path === '/admin'
    ? location.pathname === '/admin' || location.pathname === '/admin/'
    : location.pathname.startsWith(path);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">🌿</div>
        <div className="sidebar-brand-text">
          <span className="name">Mathi's Secret</span>
          <span className="sub">Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item${isActive(n.path) ? ' active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            <span className="icon">{n.icon}</span>
            {n.label}
            {n.id === 'orders' && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {auth?.user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="sidebar-user-info">
            <strong>{auth?.user?.name || 'Admin'}</strong>
            <small>{auth?.user?.email || ''}</small>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
*/
// ── Sidebar.jsx ───────────────────────────────────────────────────────────────
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV = [
  { id:'overview',    label:'Overview',    icon:'📊', path:'/admin' },
  { id:'orders',      label:'Orders',      icon:'📦', path:'/admin/orders' },
  { id:'products',    label:'Products',    icon:'🛍', path:'/admin/products' },
  { id:'categories',  label:'Categories',  icon:'🏷', path:'/admin/categories' },
  { id:'reviews',     label:'Reviews',     icon:'⭐', path:'/admin/reviews' },
];

export function Sidebar({ pendingCount }) {
  const { auth, logout } = useAdminAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isActive = path => path === '/admin'
    ? location.pathname === '/admin' || location.pathname === '/admin/'
    : location.pathname.startsWith(path);

  return (
    <aside className="sidebar">
      
  <div className="sidebar-brand" style={{ flexDirection:'column', alignItems:'center', gap:4 }}>
  <img
    src="/logo.png"
    alt="Mathi's Secret Organics"
    style={{ width: 110, objectFit:'contain', display:'block', borderRadius: 8 }}
  />
  <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:3, textTransform:'uppercase' }}>
    Admin Panel
  </span>
</div>

      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item${isActive(n.path) ? ' active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            <span className="icon">{n.icon}</span>
            {n.label}
            {n.id === 'orders' && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {auth?.user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="sidebar-user-info">
            <strong>{auth?.user?.name || 'Admin'}</strong>
            <small>{auth?.user?.email || ''}</small>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
  