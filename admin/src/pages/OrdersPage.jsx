import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Spinner, StatusBadge, EmptyState, Pagination } from '../components/shared';
import { useToast } from '../components/useToast';
import { adminGetOrdersAPI, getSingleOrderAPI, adminUpdateStatusAPI } from '../api/api';

const STEPS = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const NEXT_STATUS = {
  'Placed':           'Processing',
  'Processing':       'Shipped',
  'Shipped':          'Out for Delivery',
  'Out for Delivery': 'Delivered',
};

// ─── Order stepper ─────────────────────────────────────────────────────────────
function OrderStepper({ status }) {
  if (['Cancelled', 'Returned'].includes(status)) {
    return (
      <div style={{ color: 'var(--error)', fontWeight: 600, padding: '12px 0' }}>
        {status === 'Cancelled' ? '❌ Order Cancelled' : '🔄 Return Requested'}
      </div>
    );
  }
  const cur = STEPS.indexOf(status);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'contents' }}>
          <div className={`step${i < cur ? ' done' : i === cur ? ' active' : ''}`}>
            <div className="step-dot">{i < cur ? '✓' : i === cur ? '●' : ''}</div>
            <div className="step-lbl">{s}</div>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line${i < cur ? ' done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Advance status modal ──────────────────────────────────────────────────────
function AdvanceModal({ order, onClose, onSuccess, toast }) {
  const [trackingId,  setTrackingId]  = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [note,        setNote]        = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => { setTrackingId(''); setPartnerName(''); setNote(''); }, [order?._id]);

  if (!order) return null;
  const nextSt    = NEXT_STATUS[order.status];
  const needsShip = order.status === 'Processing';

  const submit = async () => {
    if (needsShip && !trackingId.trim()) {
      toast('Tracking ID is required when shipping', 'error'); return;
    }
    setLoading(true);
    try {
      const r = await adminUpdateStatusAPI(order._id, {
        note: note.trim(), trackingId: trackingId.trim(), partnerName: partnerName.trim(),
      });
      if (r.ok) { toast(`Status → "${nextSt}" ✓`); onSuccess(); onClose(); }
      else toast(r.data.message || 'Error', 'error');
    } catch { toast('Network error', 'error'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Advance Order Status</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--parchment)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:5 }}>Current</div>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize:'1.5rem', color:'var(--brand)', fontWeight:700 }}>→</div>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:5 }}>New Status</div>
              <StatusBadge status={nextSt || '—'} />
            </div>
          </div>

          {needsShip && (
            <div style={{ background:'rgba(45,74,30,0.05)', border:'1px solid rgba(45,74,30,0.18)', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--forest)', marginBottom:12 }}>
                🚚 Shipping Details
                <span style={{ fontSize:10, color:'var(--error)', background:'rgba(217,48,37,0.08)', padding:'2px 8px', borderRadius:10, marginLeft:8 }}>required</span>
              </div>
              <div className="form-group">
                <label className="form-label">Tracking ID *</label>
                <input className="form-input" placeholder="e.g. DL1234567890IN"
                  value={trackingId} onChange={e => setTrackingId(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Courier Partner</label>
                <input className="form-input" placeholder="e.g. Delhivery, BlueDart, Ekart"
                  value={partnerName} onChange={e => setPartnerName(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Note for customer (optional)</label>
            <textarea className="form-input" rows={2}
              placeholder="e.g. Package dispatched from Tamil Nadu warehouse"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading || !nextSt}>
            {loading ? <><span className="spinner" />Updating…</> : `Mark as "${nextSt}"`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Excel export helper ───────────────────────────────────────────────────────
// Uses SheetJS (xlsx) which is available as a CDN import in React artifacts,
// but in your Vite project install it: npm install xlsx
// Then import at the top: import * as XLSX from 'xlsx';
function exportToExcel(orders) {
  // Dynamically import xlsx so the page doesn't break if not installed yet
  import('xlsx').then(XLSX => {
    const rows = orders.map(o => ({
      'Order ID':         o._id?.slice(-8).toUpperCase() || '',
      'Full Order ID':    o._id || '',
      'Date':             o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '',
      'Customer Name':    o.user?.name || '',
      'Email':            o.user?.email || '',
      'Phone (Profile)':  o.user?.phone || '',
      'Ship To Name':     o.shippingAddress?.fullName || '',
      'Ship Phone':       o.shippingAddress?.phone || '',
      'Address Line 1':   o.shippingAddress?.addressLine1 || '',
      'Address Line 2':   o.shippingAddress?.addressLine2 || '',
      'City':             o.shippingAddress?.city || '',
      'State':            o.shippingAddress?.state || '',
      'Pincode':          o.shippingAddress?.pincode || '',
      'Products':         o.items?.map(i => `${i.name} (${i.weight}) x${i.quantity}`).join('; ') || '',
      'Total Qty':        o.items?.reduce((s, i) => s + i.quantity, 0) || 0,
      'Total Amount (₹)': o.totalPrice || 0,
      'Payment Method':   o.paymentMethod || '',
      'Payment Status':   o.paymentStatus || '',
      'Order Status':     o.status || '',
      'Est. Delivery':    o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleDateString('en-IN') : '',
      'Delivered At':     o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : '',
      'Tracking ID':      o.deliveryPartner?.trackingId || '',
      'Courier Partner':  o.deliveryPartner?.name || '',
      'Razorpay Order ID':  o.razorpayOrderId || '',
      'Razorpay Payment ID': o.razorpayPaymentId || '',
      'Cancel Reason':    o.cancelReason || '',
      'Return Reason':    o.returnReason || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    const colWidths = [12,28,20,22,32,16,22,16,30,22,16,16,12,50,10,16,16,16,16,18,18,20,18,26,28,25,25];
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Orders");

    // Summary sheet
    const statusGroups = {};
    orders.forEach(o => {
      if (!statusGroups[o.status]) statusGroups[o.status] = { count: 0, revenue: 0 };
      statusGroups[o.status].count++;
      if (o.status === 'Delivered') statusGroups[o.status].revenue += (o.totalPrice || 0);
    });

    const summaryRows = Object.entries(statusGroups).map(([status, d]) => ({
      'Order Status': status,
      'Count':        d.count,
      'Revenue (₹)':  d.revenue || '—',
    }));
    summaryRows.push({
      'Order Status': 'TOTAL',
      'Count':        orders.length,
      'Revenue (₹)':  orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.totalPrice || 0), 0),
    });

    const ws2 = XLSX.utils.json_to_sheet(summaryRows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    // Download
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `mathis_secret_orders_${date}.xlsx`);
  }).catch(() => {
    alert('xlsx package not installed. Run: npm install xlsx');
  });
}

// ─── Main Orders Page ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { toast, ToastContainer } = useToast();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [statusF, setStatusF] = useState('');
  const [search,  setSearch]  = useState('');

  // Panel state
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [selOrder,      setSelOrder]      = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Advance modal state
  const [advanceTarget, setAdvanceTarget] = useState(null);

  // Export loading
  const [exporting, setExporting] = useState(false);

  const load = async (p = page, s = statusF) => {
    setLoading(true);
    try {
      const r = await adminGetOrdersAPI(p, s);
      setOrders(r.data.orders || []);
      setPages(r.data.pages   || 1);
      setTotal(r.data.total   || 0);
    } catch { toast('Error loading orders', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(page, statusF); }, [page, statusF]);

  const filtered = search
    ? orders.filter(o =>
        o._id?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        o.shippingAddress?.phone?.includes(search)
      )
    : orders;

  // ── Open detail panel ────────────────────────────────────────────────────────
  const openDetail = async (id) => {
    setSelOrder(null);
    setDetailLoading(true);
    setPanelOpen(true);
    try {
      const r = await getSingleOrderAPI(id);
      if (r.ok && r.data.order) {
        setSelOrder(r.data.order);
      } else {
        toast('Could not load order details', 'error');
        setPanelOpen(false);
      }
    } catch {
      toast('Error loading order', 'error');
      setPanelOpen(false);
    }
    setDetailLoading(false);
  };

  const closePanel = () => { setPanelOpen(false); setSelOrder(null); };

  // ── After advancing status, refresh list and re-fetch open order ─────────────
  const afterAdvance = async () => {
    load(page, statusF);
    if (selOrder?._id) {
      try {
        const r = await getSingleOrderAPI(selOrder._id);
        if (r.ok && r.data.order) setSelOrder(r.data.order);
      } catch {}
    }
  };

  // ── Export: fetch ALL orders (all pages) then export ────────────────────────
  const handleExport = async () => {
    setExporting(true);
    toast('Fetching all orders for export…', 'info');
    try {
      // Fetch all pages
      const firstPage = await adminGetOrdersAPI(1, statusF, 200);
      const totalPages = firstPage.data.pages || 1;
      let allOrders = firstPage.data.orders || [];

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            adminGetOrdersAPI(i + 2, statusF, 200).then(r => r.data.orders || [])
          )
        );
        allOrders = allOrders.concat(...rest);
      }

      exportToExcel(allOrders);
      toast(`Exported ${allOrders.length} orders to Excel ✓`);
    } catch {
      toast('Export failed. Check console.', 'error');
    }
    setExporting(false);
  };

  const canAdvance = o => !!NEXT_STATUS[o.status];
  const fmtCur  = n => '₹' + Number(n).toLocaleString('en-IN');
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const fmtFull = d => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <AdminLayout title="Orders" subtitle={`${total} total orders`}>
      <ToastContainer />

      {/* Advance status modal */}
      <AdvanceModal
        order={advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        onSuccess={afterAdvance}
        toast={toast}
      />

      {/* ── Filter + Export bar ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="s-icon">🔍</span>
            <input className="search-input" placeholder="Search by order ID, name, email or phone…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusF}
            onChange={e => { setStatusF(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].map(s =>
              <option key={s}>{s}</option>
            )}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => load(page, statusF)}>↻ Refresh</button>

          {/* Excel Export button */}
          <button
            className="btn btn-sm"
            onClick={handleExport}
            disabled={exporting}
            style={{
              background:'rgba(45,74,30,0.1)', color:'var(--forest)',
              border:'1px solid rgba(45,74,30,0.25)', borderRadius:20,
              display:'flex', alignItems:'center', gap:6,
            }}
          >
            {exporting
              ? <><span className="spinner spinner-dark" style={{ width:14, height:14 }} />Exporting…</>
              : <>📥 Export Excel</>
            }
          </button>
        </div>

        {/* ── Orders table ──────────────────────────────────────────────────── */}
        {loading ? <Spinner text="Loading orders…" /> : filtered.length === 0 ? (
          <EmptyState icon="📦" title="No orders found" />
        ) : (
          <div className="table-outer">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th>
                  <th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o._id}>
                    <td>
                      <code style={{ fontSize:12, color:'var(--brand)', fontWeight:700 }}>
                        #{o._id?.slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{o.user?.name || '—'}</div>
                      <div className="td-muted">{o.user?.email}</div>
                      {o.shippingAddress?.phone && (
                        <div className="td-muted" style={{ fontSize:11 }}>📞 {o.shippingAddress.phone}</div>
                      )}
                    </td>
                    <td className="td-muted" style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.items?.map(i => `${i.name}(${i.weight})`).join(', ')}
                    </td>
                    <td style={{ fontWeight:700 }}>{fmtCur(o.totalPrice)}</td>
                    <td>
                      <div className="td-muted" style={{ fontSize:11, marginBottom:3 }}>{o.paymentMethod}</div>
                      <StatusBadge status={o.paymentStatus} />
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="td-muted">{fmtDate(o.createdAt)}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(o._id)}>
                          View
                        </button>
                        {canAdvance(o) && (
                          <button className="btn btn-sm" onClick={() => setAdvanceTarget(o)}
                            style={{ background:'rgba(45,74,30,0.08)', color:'var(--forest)', border:'1px solid rgba(45,74,30,0.2)' }}>
                            → {NEXT_STATUS[o.status]?.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pages={pages} total={total}
          onPrev={() => setPage(p => p-1)} onNext={() => setPage(p => p+1)} />
      </div>

      {/* ── Order Detail Side Panel ──────────────────────────────────────────── */}
      {/* Backdrop */}
      {panelOpen && (
        <div
          onClick={closePanel}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.25)',
            zIndex:299, backdropFilter:'blur(2px)',
          }}
        />
      )}

      <div className="side-panel" style={{ transform: panelOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="side-panel-header">
          <h3>Order Details</h3>
          <button className="modal-close" onClick={closePanel}>✕</button>
        </div>

        <div className="side-panel-body">
          {detailLoading && <Spinner text="Loading order…" />}

          {!detailLoading && !selOrder && (
            <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>📋</div>
              <p>No order selected</p>
            </div>
          )}

          {!detailLoading && selOrder && (
            <>
              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="detail-section">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <code style={{ color:'var(--brand)', fontWeight:700, fontSize:14 }}>
                    #{selOrder._id?.slice(-8).toUpperCase()}
                  </code>
                  <StatusBadge status={selOrder.status} />
                </div>
                <div className="td-muted" style={{ fontSize:12 }}>
                  Placed: {fmtFull(selOrder.createdAt)}
                </div>
                {selOrder.deliveredAt && (
                  <div style={{ fontSize:12, color:'var(--success)', marginTop:4 }}>
                    ✅ Delivered: {fmtFull(selOrder.deliveredAt)}
                  </div>
                )}
              </div>

              {/* ── Tracking stepper ──────────────────────────────────────── */}
              <div className="detail-section">
                <h4>Tracking</h4>
                <OrderStepper status={selOrder.status} />

                {selOrder.deliveryPartner?.trackingId && (
                  <div style={{ background:'rgba(45,74,30,0.06)', border:'1px solid rgba(45,74,30,0.15)', borderRadius:10, padding:'12px 14px', marginTop:12 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:'var(--forest)', marginBottom:6 }}>📦 Shipping Info</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>
                      Courier: <strong style={{ color:'var(--text)' }}>{selOrder.deliveryPartner.name || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>
                      Tracking: <strong style={{ color:'var(--brand)', fontFamily:'monospace' }}>{selOrder.deliveryPartner.trackingId}</strong>
                    </div>
                  </div>
                )}

                {selOrder.estimatedDelivery && !['Delivered','Cancelled','Returned'].includes(selOrder.status) && (
                  <div style={{ fontSize:12, color:'var(--success)', fontWeight:600, marginTop:10 }}>
                    📅 Est. Delivery: {fmtDate(selOrder.estimatedDelivery)}
                  </div>
                )}

                {canAdvance(selOrder) && (
                  <button className="btn btn-primary btn-sm btn-full" style={{ marginTop:14 }}
                    onClick={() => setAdvanceTarget(selOrder)}>
                    → Advance to "{NEXT_STATUS[selOrder.status]}"
                  </button>
                )}
              </div>

              {/* ── Customer details ───────────────────────────────────────── */}
              <div className="detail-section">
                <h4>Customer</h4>
                {[
                  ['Name',    selOrder.user?.name],
                  ['Email',   selOrder.user?.email],
                  ['Phone',   selOrder.user?.phone],
                  ['Role',    selOrder.user?.role === 1 ? 'Admin' : 'Customer'],
                ].map(([l, v]) => v ? (
                  <div key={l} className="detail-row">
                    <span className="lbl">{l}</span>
                    <span className="val">{v}</span>
                  </div>
                ) : null)}
              </div>

              {/* ── Delivery address ───────────────────────────────────────── */}
              <div className="detail-section">
                <h4>Delivery Address</h4>
                <div style={{ background:'var(--parchment)', borderRadius:10, padding:'12px 14px', fontSize:13, lineHeight:1.9 }}>
                  <strong style={{ color:'var(--text)', fontSize:14 }}>
                    {selOrder.shippingAddress?.fullName}
                  </strong>
                  <br />
                  {selOrder.shippingAddress?.addressLine1}
                  {selOrder.shippingAddress?.addressLine2 && (
                    <>, {selOrder.shippingAddress.addressLine2}</>
                  )}
                  <br />
                  {selOrder.shippingAddress?.city}, {selOrder.shippingAddress?.state} — {selOrder.shippingAddress?.pincode}
                  <br />
                  <span style={{ color:'var(--brand)', fontWeight:600 }}>
                    📞 {selOrder.shippingAddress?.phone}
                  </span>
                </div>
              </div>

              {/* ── Order items ────────────────────────────────────────────── */}
              <div className="detail-section">
                <h4>Items Ordered</h4>
                {selOrder.items?.map(item => (
                  <div key={item._id} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--parchment)', fontSize:13 }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{item.name}</div>
                      <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>
                        {item.weight} × {item.quantity} @ ₹{item.price} each
                      </div>
                    </div>
                    <span style={{ fontWeight:700, flexShrink:0 }}>
                      {fmtCur(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:12, fontWeight:800, fontSize:15 }}>
                  <span>Total</span>
                  <span>{fmtCur(selOrder.totalPrice)}</span>
                </div>
              </div>

              {/* ── Payment ─────────────────────────────────────────────────── */}
              <div className="detail-section">
                <h4>Payment</h4>
                {[
                  ['Method',      selOrder.paymentMethod],
                  ['Status',      selOrder.paymentStatus],
                  ['Razorpay ID', selOrder.razorpayPaymentId || null],
                  ['Order ID',    selOrder.razorpayOrderId   || null],
                ].map(([l, v]) => v ? (
                  <div key={l} className="detail-row">
                    <span className="lbl">{l}</span>
                    <span className="val" style={{ fontFamily: l.includes('razorpay') || l.includes('ID') ? 'monospace' : 'inherit', fontSize: l.includes('ID') ? 11 : 13 }}>
                      {l === 'Status' ? <StatusBadge status={v} /> : v}
                    </span>
                  </div>
                ) : null)}
              </div>

              {/* ── Status history ─────────────────────────────────────────── */}
              {selOrder.statusHistory?.length > 0 && (
                <div className="detail-section">
                  <h4>Status History</h4>
                  {[...selOrder.statusHistory].reverse().map((h, i) => (
                    <div key={i} style={{ display:'flex', gap:10, paddingBottom:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--brand)', marginTop:5, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{h.status}</div>
                        {h.note && <div style={{ fontSize:12, color:'var(--muted)' }}>{h.note}</div>}
                        <div style={{ fontSize:11, color:'var(--muted)', opacity:0.6 }}>
                          {new Date(h.changedAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Cancel / Return reason ─────────────────────────────────── */}
              {selOrder.cancelReason && (
                <div className="detail-section">
                  <h4>Cancel Reason</h4>
                  <p style={{ fontSize:13, color:'var(--muted)', background:'rgba(217,48,37,0.05)', borderRadius:8, padding:'10px 12px' }}>
                    {selOrder.cancelReason}
                  </p>
                </div>
              )}
              {selOrder.returnReason && (
                <div className="detail-section">
                  <h4>Return Reason</h4>
                  <p style={{ fontSize:13, color:'var(--muted)', background:'rgba(107,107,107,0.06)', borderRadius:8, padding:'10px 12px' }}>
                    {selOrder.returnReason}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}