import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Spinner, StatusBadge } from '../components/shared';
import { adminGetOrdersAPI, getProductsAPI } from '../api/api';

function StatCard({ icon, label, value, sub, subType='', onClick }) {
  return (
    <div className="stat-card" style={{ cursor: onClick?'pointer':'default' }} onClick={onClick}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub ${subType}`}>{sub}</div>}
    </div>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [orders,   setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([adminGetOrdersAPI(1,''), getProductsAPI()])
      .then(([or, pr]) => {
        setOrders(or.data.orders || []);
        setProducts(pr.data.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revenue  = orders.filter(o=>o.status==='Delivered').reduce((s,o)=>s+o.totalPrice,0);
  const pending  = orders.filter(o=>['Placed','Processing'].includes(o.status)).length;
  const lowStock = products.filter(p=>p.variants?.some(v=>v.stock<5));

  const STATUSES = ['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Returned'];
  const counts   = STATUSES.map(s=>orders.filter(o=>o.status===s).length);
  const maxCount = Math.max(...counts, 1);
  const colors   = ['#e8c96a','#6db3e8','#c9a84c','#e89632','#3d7a4a','#d93025','#6d5c51'];

  const fmtCur = n => '₹' + Number(n).toLocaleString('en-IN');
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'});

  return (
    <AdminLayout title="Overview" subtitle="Your store at a glance">
      {loading ? <Spinner text="Loading dashboard…" /> : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <StatCard icon="📦" label="Total Orders"   value={orders.length}    sub="All time" onClick={() => navigate('/admin/orders')} />
            <StatCard icon="₹"  label="Revenue"        value={fmtCur(revenue)}  sub="From delivered" subType="up" />
            <StatCard icon="🛍" label="Products"       value={products.length}  sub="In catalog"  onClick={() => navigate('/admin/products')} />
            <StatCard icon="⏳" label="Pending"        value={pending}          sub={pending>0?'Needs action':'All clear'} subType={pending>0?'down':'up'} onClick={() => navigate('/admin/orders')} />
          </div>

          {/* Charts + Recent */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:28 }}>
            {/* Bar chart */}
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ marginBottom:20, fontSize:'0.95rem' }}>Order Status Distribution</h3>
              <div className="bar-chart">
                {STATUSES.map((s,i) => (
                  <div key={s} className="bar-item">
                    <div className="bar-fill" style={{ height:`${Math.max((counts[i]/maxCount)*100,2)}%`, background:colors[i] }} title={`${s}: ${counts[i]}`} />
                    <div className="bar-lbl">{s.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:16 }}>
                {STATUSES.map((s,i) => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--muted)' }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:colors[i] }} />
                    {s} ({counts[i]})
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ marginBottom:16, fontSize:'0.95rem' }}>Recent Orders</h3>
              {orders.slice(0,7).map(o => (
                <div key={o._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--parchment)' }}>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{o.user?.name||'Customer'}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>#{o._id.slice(-6).toUpperCase()} · {fmtDate(o.createdAt)}</div>
                  </div>
                  <StatusBadge status={o.status} />
                  <div style={{ fontSize:13, fontWeight:700, flexShrink:0 }}>{fmtCur(o.totalPrice)}</div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop:14 }} onClick={() => navigate('/admin/orders')}>
                View All Orders →
              </button>
            </div>
          </div>

          {/* Low stock */}
          {lowStock.length > 0 && (
            <>
              <div className="section-header">
                <h2>⚠️ Low Stock Alert</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/products')}>Manage Products</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                {lowStock.map(p => (
                  <div key={p._id} style={{ background:'var(--glass)', backdropFilter:'blur(20px)', border:'1px solid rgba(217,48,37,0.15)', borderRadius:'var(--radius)', padding:16 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:8 }}>{p.name}</div>
                    {p.variants.filter(v=>v.stock<5).map(v => (
                      <div key={v.weight} style={{ fontSize:12, color: v.stock===0?'var(--error)':'var(--gold)', marginBottom:2 }}>
                        {v.weight}: {v.stock===0 ? '🔴 Out of Stock' : `🟡 Only ${v.stock} left`}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}