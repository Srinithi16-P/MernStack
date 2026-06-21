// ── AdminLayout.jsx ───────────────────────────────────────────────────────────
/*
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { adminGetOrdersAPI } from '../api/api';

export default function AdminLayout({ children, title, subtitle }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    document.title = title ? `${title} — Admin` : 'Admin Dashboard';
    adminGetOrdersAPI(1, 'Placed')
      .then(r => setPending(r.data.total || 0))
      .catch(() => {});
  }, [title]);

  return (
    <div className="admin-layout">
      <Sidebar pendingCount={pending} />
      <div className="admin-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{title || 'Dashboard'}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar-right">
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="topbar-btn">
              ↗ View Store
            </a>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
*/
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { adminGetOrdersAPI } from '../api/api';

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:3000';

export default function AdminLayout({ children, title, subtitle }) {
  const [pending,      setPending]      = useState(0);
  const [showPreview,  setShowPreview]  = useState(false);
  const [previewLoaded,setPreviewLoaded]= useState(false);

  useEffect(() => {
    document.title = title ? `${title} — Admin` : 'Admin Dashboard';
    adminGetOrdersAPI(1, 'Placed').then(r => setPending(r.data.total || 0)).catch(() => {});
  }, [title]);

  return (
    <div className="admin-layout">
      <Sidebar pendingCount={pending} />

      <div className="admin-main">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>{title || 'Dashboard'}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar-right">
            {/* View Store button — opens side preview */}
            <button className="topbar-btn" onClick={() => { setShowPreview(true); setPreviewLoaded(false); }}>
              👁 Preview Store
            </button>
            <a href={STORE_URL} target="_blank" rel="noreferrer" className="topbar-btn">
              ↗ Open Store
            </a>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content">{children}</div>
      </div>

      {/* ── Store Preview Panel ─────────────────────────────────────── */}
      {showPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 500,
          display: 'flex', alignItems: 'stretch',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Backdrop click closes */}
          <div style={{ flex: 1 }} onClick={() => setShowPreview(false)} />

          {/* Panel */}
          <div style={{
            width: 'min(860px, 90vw)', background: 'white',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-16px 0 48px rgba(0,0,0,0.2)',
            animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--parchment)',
              background: 'var(--glass)', backdropFilter: 'blur(20px)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3d7a4a' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                  Store Preview
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--parchment)', padding: '2px 10px', borderRadius: 20 }}>
                  {STORE_URL}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <a href={STORE_URL} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--brand-light)', background: 'white' }}>
                  Open in New Tab ↗
                </a>
                <button onClick={() => setShowPreview(false)}
                  style={{ background: 'var(--parchment)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Page selector tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '10px 16px', borderBottom: '1px solid var(--parchment)', background: 'var(--cream)', flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: '🏠 Home',     path: '' },
                { label: '🛍 Products', path: '/products' },
                { label: '🔐 Login',    path: '/login' },
                { label: '📝 Register', path: '/register' },
              ].map(p => (
                <button key={p.path}
                  onClick={() => {
                    setPreviewLoaded(false);
                    document.getElementById('storeFrame').src = STORE_URL + p.path;
                  }}
                  style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #e0d0c4', background: 'white', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.color = 'var(--brand)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#e0d0c4'; e.target.style.color = 'var(--text)'; }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* iframe */}
            <div style={{ flex: 1, position: 'relative', background: 'var(--cream)' }}>
              {!previewLoaded && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--muted)', fontSize: 14,
                }}>
                  <div style={{ fontSize: '2rem' }}>🌿</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Loading Store…</div>
                  <div style={{ width: 32, height: 32, border: '3px solid rgba(194,86,26,0.15)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
                    Make sure your user frontend is running on <strong>{STORE_URL}</strong>
                  </p>
                </div>
              )}
              <iframe
                id="storeFrame"
                src={STORE_URL}
                style={{ width: '100%', height: '100%', border: 'none', opacity: previewLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                title="Store Preview"
                onLoad={() => setPreviewLoaded(true)}
                onError={() => setPreviewLoaded(true)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
//how the admin see the customer address for placing courier