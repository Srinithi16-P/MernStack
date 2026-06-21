import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import OrderStepper from '../components/OrderStepper';
import { getSingleOrderAPI, cancelOrderAPI, returnOrderAPI, markNotifReadAPI } from '../api/api';

function toast(msg, type='success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:28px;right:28px;background:${type==='error'?'#d93025':'#c2561a'};color:white;padding:12px 22px;border-radius:30px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;opacity:0;transition:opacity 0.3s;`;
  document.body.appendChild(el);
  setTimeout(()=>el.style.opacity='1',10);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),300);},2500);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showCancel, setShowCancel]   = useState(false);
  const [showReturn, setShowReturn]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    getSingleOrderAPI(id)
      .then(r => setOrder(r.data.order))
      .catch(() => toast('Order not found','error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (order) markNotifReadAPI(id).catch(()=>{}); }, [order]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const r = await cancelOrderAPI(id, { reason: cancelReason });
      if (r.ok) { toast('Order cancelled successfully'); load(); }
      else toast(r.data.message || 'Cannot cancel','error');
    } catch { toast('Error','error'); }
    finally { setActionLoading(false); setShowCancel(false); }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) { toast('Return reason is required','error'); return; }
    setActionLoading(true);
    try {
      const r = await returnOrderAPI(id, { reason: returnReason });
      if (r.ok) { toast('Return request submitted!'); load(); }
      else toast(r.data.message || 'Cannot return','error');
    } catch { toast('Error','error'); }
    finally { setActionLoading(false); setShowReturn(false); }
  };

  const cardStyle = {
    background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)',
    borderRadius:16, padding:24, boxShadow:'0 4px 12px rgba(0,0,0,0.06)', marginBottom:16,
  };

  if (loading) return <Layout title="Order"><Spinner text="Loading order…" /></Layout>;
  if (!order)  return (
    <Layout title="Order">
      <div className="empty-state" style={{ paddingTop:80 }}>
        <div className="empty-icon">❌</div><h3>Order not found</h3>
        <Link to="/orders" className="btn btn-primary" style={{ borderRadius:30 }}>My Orders</Link>
      </div>
    </Layout>
  );

  const canCancel = ['Placed','Processing'].includes(order.status);
  const canReturn = order.status === 'Delivered';

  return (
    <Layout title={`Order #${order._id.slice(-8).toUpperCase()}`}>
      <div style={{ padding:'32px 0 80px', margin:'72px 16px 0' }}>
        <div className="container" style={{ maxWidth:860 }}>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/orders">My Orders</Link><span>/</span>
            <span>#{order._id.slice(-8).toUpperCase()}</span>
          </div>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem' }}>Order Details</h1>
              <p style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Tracking stepper */}
          <div style={cardStyle}>
            <h3 style={{ fontSize:15, marginBottom:16 }}>📍 Order Tracking</h3>
            <OrderStepper status={order.status} />
            {order.deliveryPartner?.trackingId && (
              <p style={{ marginTop:12, fontSize:13, color:'var(--muted)' }}>
                🚚 Carrier: <strong>{order.deliveryPartner.name}</strong> · Tracking: <strong>{order.deliveryPartner.trackingId}</strong>
              </p>
            )}
            {order.estimatedDelivery && !['Delivered','Cancelled','Returned'].includes(order.status) && (
              <p style={{ marginTop:8, fontSize:13, color:'var(--success)', fontWeight:600 }}>
                📅 Estimated: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long'})}
              </p>
            )}
            {order.deliveredAt && (
              <p style={{ marginTop:8, fontSize:13, color:'var(--success)', fontWeight:600 }}>
                ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
              </p>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'start' }}>
            <div>
              {/* Items */}
              <div style={cardStyle}>
                <h3 style={{ fontSize:15, marginBottom:16 }}>🛍 Items Ordered</h3>
                {order.items?.map(item => (
                  <div key={item._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f0e8e0' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:14 }}>{item.name}</p>
                      <p style={{ fontSize:12, color:'var(--muted)' }}>{item.weight} × {item.quantity}</p>
                    </div>
                    <span style={{ fontWeight:700 }}>₹{item.price*item.quantity}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:14, fontWeight:800, fontSize:'1rem' }}>
                  <span>Total</span><span>₹{order.totalPrice}</span>
                </div>
              </div>

              {/* Status history */}
              {order.statusHistory?.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={{ fontSize:15, marginBottom:16 }}>📋 Status History</h3>
                  {[...order.statusHistory].reverse().map((h,i) => (
                    <div key={i} style={{ display:'flex', gap:12, paddingBottom:12 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--brand)', marginTop:4, flexShrink:0 }} />
                      <div>
                        <p style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{h.status}</p>
                        {h.note && <p style={{ fontSize:12, color:'var(--muted)' }}>{h.note}</p>}
                        <p style={{ fontSize:11, color:'var(--muted)', opacity:0.6 }}>
                          {new Date(h.changedAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div>
              {/* Address */}
              <div style={cardStyle}>
                <h3 style={{ fontSize:14, marginBottom:12 }}>📍 Delivery Address</h3>
                <p style={{ fontWeight:700, fontSize:14 }}>{order.shippingAddress?.fullName}</p>
                <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginTop:4 }}>
                  {order.shippingAddress?.addressLine1}<br/>
                  {order.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br/></>}
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}<br/>
                  📞 {order.shippingAddress?.phone}
                </p>
              </div>

              {/* Payment */}
              <div style={cardStyle}>
                <h3 style={{ fontSize:14, marginBottom:12 }}>💳 Payment</h3>
                <p style={{ fontSize:13 }}>{order.paymentMethod}</p>
                <p style={{ fontSize:14, fontWeight:700, color: order.paymentStatus==='Paid'?'var(--success)':'var(--muted)', marginTop:4 }}>
                  {order.paymentStatus}
                </p>
              </div>

              {/* Actions */}
              {(canCancel || canReturn) && (
                <div style={cardStyle}>
                  <h3 style={{ fontSize:14, marginBottom:12 }}>⚡ Actions</h3>

                  {canCancel && !showCancel && (
                    <button className="btn btn-danger btn-sm" style={{ width:'100%', borderRadius:20 }} onClick={() => setShowCancel(true)}>
                      Cancel Order
                    </button>
                  )}
                  {showCancel && (
                    <div>
                      <textarea
                        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e0d0c4', borderRadius:10, fontSize:13, resize:'vertical', marginBottom:8, fontFamily:'inherit' }}
                        rows={3} placeholder="Reason (optional)" value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                      />
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-danger btn-sm" style={{ flex:1, borderRadius:20 }} onClick={handleCancel} disabled={actionLoading}>
                          {actionLoading ? <span className="spinner" style={{width:14,height:14}} /> : 'Confirm Cancel'}
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} onClick={() => setShowCancel(false)}>Back</button>
                      </div>
                    </div>
                  )}

                  {canReturn && !showReturn && (
                    <button className="btn btn-outline btn-sm" style={{ width:'100%', borderRadius:20, marginTop:8 }} onClick={() => setShowReturn(true)}>
                      Request Return
                    </button>
                  )}
                  {showReturn && (
                    <div style={{ marginTop:8 }}>
                      <textarea
                        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e0d0c4', borderRadius:10, fontSize:13, resize:'vertical', marginBottom:8, fontFamily:'inherit' }}
                        rows={3} placeholder="Reason for return (required)" value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                      />
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-primary btn-sm" style={{ flex:1, borderRadius:20 }} onClick={handleReturn} disabled={actionLoading}>
                          {actionLoading ? <span className="spinner" style={{width:14,height:14}} /> : 'Submit Return'}
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} onClick={() => setShowReturn(false)}>Back</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}