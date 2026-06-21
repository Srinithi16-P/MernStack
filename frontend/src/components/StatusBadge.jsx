// StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    'Placed':           { cls:'status-placed',     icon:'🕐' },
    'Processing':       { cls:'status-processing', icon:'⚙️' },
    'Shipped':          { cls:'status-shipped',    icon:'📦' },
    'Out for Delivery': { cls:'status-out',        icon:'🚚' },
    'Delivered':        { cls:'status-delivered',  icon:'✅' },
    'Cancelled':        { cls:'status-cancelled',  icon:'❌' },
    'Returned':         { cls:'status-returned',   icon:'🔄' },
  };
  const info = map[status] || { cls:'status-placed', icon:'ℹ️' };
  return <span className={`status-badge ${info.cls}`}>{info.icon} {status}</span>;
}