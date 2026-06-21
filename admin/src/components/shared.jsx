// Spinner.jsx
export function Spinner({ text = '' }) {
  return (
    <div className="page-loader">
      <div className="spinner spinner-dark" />
      {text && <span>{text}</span>}
    </div>
  );
}

// StatusBadge.jsx
export function StatusBadge({ status }) {
  const map = {
    'Placed':           { cls:'placed',       icon:'🕐' },
    'Processing':       { cls:'processing',   icon:'⚙️' },
    'Shipped':          { cls:'shipped',      icon:'📦' },
    'Out for Delivery': { cls:'outdelivery',  icon:'🚚' },
    'Delivered':        { cls:'delivered',    icon:'✅' },
    'Cancelled':        { cls:'cancelled',    icon:'❌' },
    'Returned':         { cls:'returned',     icon:'🔄' },
    'Paid':             { cls:'paid',         icon:'💚' },
    'Pending':          { cls:'pending',      icon:'⏳' },
    'COD':              { cls:'cod',          icon:'💵' },
    'Razorpay':         { cls:'processing',   icon:'💳' },
  };
  const info = map[status] || { cls:'pending', icon:'•' };
  return <span className={`badge badge-${info.cls}`}>{info.icon} {status}</span>;
}

// EmptyState.jsx
export function EmptyState({ icon='📭', title='Nothing here', desc='', action=null }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  );
}

// Modal.jsx
export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Pagination.jsx
export function Pagination({ page, pages, total, onPrev, onNext }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <span>Page {page} of {pages} · {total} total</span>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={onPrev}>← Prev</button>
        <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={onNext}>Next →</button>
      </div>
    </div>
  );
}