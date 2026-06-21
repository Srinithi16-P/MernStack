import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { getMyOrdersAPI } from '../api/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getMyOrdersAPI(page)
      .then(r => {
        setOrders(r.data.orders || []);
        setPages(r.data.pages || 1);
        setTotal(r.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout title="My Orders">
      <div style={{ padding:'32px 0 80px', margin:'72px 16px 0' }}>
        <div className="container" style={{ maxWidth:800 }}>

          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', marginBottom:6 }}>My Orders</h1>
          <p style={{ color:'var(--muted)', fontSize:14, marginBottom:32 }}>{total} order{total!==1?'s':''} placed</p>

          {loading ? <Spinner text="Loading orders…" /> : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Start shopping and your orders will appear here.</p>
              <Link to="/products" className="btn btn-primary" style={{ borderRadius:30 }}>Shop Now</Link>
            </div>
          ) : (
            <>
              {orders.map(order => (
                <Link key={order._id} to={`/orders/${order._id}`} style={{ textDecoration:'none', display:'block', marginBottom:12 }}>
                  <div style={{
                    background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)',
                    borderRadius:16, padding:20, boxShadow:'0 4px 12px rgba(0,0,0,0.06)',
                    transition:'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:12, color:'var(--muted)', marginBottom:4 }}>
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:15, color:'var(--text)', marginBottom:4 }}>
                          {order.items?.map(i=>i.name).join(', ').slice(0,60)}{order.items?.length>2?'…':''}
                        </p>
                        <p style={{ fontSize:13, color:'var(--muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                          {' · '}₹{order.totalPrice}
                        </p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <StatusBadge status={order.status} />
                        {order.estimatedDelivery && !['Delivered','Cancelled','Returned'].includes(order.status) && (
                          <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
                            Est. {new Date(order.estimatedDelivery).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {pages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:24 }}>
                  <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
                  <span style={{ padding:'8px 16px', fontSize:13, color:'var(--muted)' }}>Page {page} of {pages}</span>
                  <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} disabled={page===pages} onClick={() => setPage(p=>p+1)}>Next →</button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}