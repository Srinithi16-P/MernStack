import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import {
  getProductsAPI, getCategoriesAPI,
  createProductAPI, updateProductAPI, deleteProductAPI,
  createCategoryAPI, deleteCategoryAPI,
  adminGetOrdersAPI, adminUpdateStatusAPI,
  getProductPhotoAPI,
} from '../api/api';

function toast(msg, type='success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:28px;right:28px;background:${type==='error'?'#d93025':'#c2561a'};color:white;padding:12px 22px;border-radius:30px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;opacity:0;transition:opacity 0.3s;`;
  document.body.appendChild(el);
  setTimeout(()=>el.style.opacity='1',10);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),300);},2500);
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto]           = useState(null);
  const [form, setForm] = useState({ name:'', description:'', category:'', variants:'[{"weight":"100g","price":100,"stock":10}]' });

  const load = () => {
    Promise.all([getProductsAPI(), getCategoriesAPI()])
      .then(([p,c]) => { setProducts(p.data.products||[]); setCategories(c.data.data||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const openEdit = p => {
    setEditing(p._id);
    setForm({ name:p.name, description:p.description||'', category:p.category?._id||'', variants:JSON.stringify(p.variants) });
    setShowForm(true);
  };
  const resetForm = () => { setShowForm(false); setEditing(null); setPhoto(null); setForm({ name:'', description:'', category:'', variants:'[{"weight":"100g","price":100,"stock":10}]' }); };

  const handleSubmit = async e => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if (photo) fd.append('photo', photo);
      const r = editing ? await updateProductAPI(editing, fd) : await createProductAPI(fd);
      if (r.ok) { toast(editing?'Product updated!':'Product created!'); resetForm(); load(); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    try { const r = await deleteProductAPI(id); if(r.ok){toast('Deleted');load();} }
    catch { toast('Delete failed','error'); }
  };

  if (loading) return <Spinner text="Loading products…" />;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ fontFamily:'var(--font-display)', color:'var(--text)' }}>Products ({products.length})</h3>
        <button className="btn btn-primary btn-sm" style={{ borderRadius:20 }} onClick={() => showForm?resetForm():setShowForm(true)}>
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background:'var(--brand-light)', borderRadius:16, padding:24, marginBottom:24 }}>
          <h4 style={{ marginBottom:16 }}>{editing?'Edit Product':'New Product'}</h4>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <div className="form-group"><label>Name *</label><input style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #e0d0c4',borderRadius:10,fontSize:14,outline:'none',background:'white' }} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div className="form-group"><label>Category *</label>
              <select style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #e0d0c4',borderRadius:10,fontSize:14,outline:'none',background:'white',fontFamily:'inherit' }} value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required>
                <option value="">Select…</option>
                {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Description</label><textarea style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #e0d0c4',borderRadius:10,fontSize:14,outline:'none',resize:'vertical',fontFamily:'inherit',background:'white' }} rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Variants JSON</label><textarea style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #e0d0c4',borderRadius:10,fontSize:13,outline:'none',resize:'vertical',fontFamily:'monospace',background:'white' }} rows={2} value={form.variants} onChange={e=>setForm({...form,variants:e.target.value})} /></div>
            <div className="form-group"><label>Photo {editing&&'(blank = keep current)'}</label><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])} style={{ fontSize:13 }} /></div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ borderRadius:30 }}>
            {submitting?<><span className="spinner"/>Saving…</>:editing?'Update Product':'Create Product'}
          </button>
        </form>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {products.map(p=>(
          <div key={p._id} style={{ background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ height:130, background:'var(--parchment)', overflow:'hidden' }}>
              <img src={getProductPhotoAPI(p._id)} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} />
            </div>
            <div style={{ padding:14 }}>
              <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', marginBottom:3 }}>{p.name}</p>
              <p style={{ fontSize:11, color:'var(--brand)', marginBottom:8 }}>{p.category?.name}</p>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                {p.variants?.map(v=>(
                  <span key={v.weight} style={{ fontSize:11, background:'var(--brand-light)', padding:'3px 8px', borderRadius:20, color:'var(--text)' }}>
                    {v.weight} ₹{v.price} (qty:{v.stock})
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-sm" style={{ flex:1, background:'var(--parchment)', border:'none', borderRadius:20, color:'var(--text)', fontWeight:600 }} onClick={()=>openEdit(p)}>✏️ Edit</button>
                <button className="btn btn-sm" style={{ background:'#fef2f2', border:'none', borderRadius:20, color:'var(--error)', fontWeight:600, padding:'8px 14px' }} onClick={()=>handleDelete(p._id)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [name, setName]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => getCategoriesAPI().then(r=>setCats(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(load,[]);

  const handleCreate = async e => {
    e.preventDefault(); if (!name.trim()) return;
    setSubmitting(true);
    try { const r = await createCategoryAPI({name}); if(r.ok){toast('Category created!');setName('');load();}else toast(r.data.message||'Error','error'); }
    catch { toast('Error','error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this category?')) return;
    try { const r = await deleteCategoryAPI(id); if(r.ok){toast('Deleted');load();}else toast('Delete failed','error'); }
    catch { toast('Delete failed','error'); }
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <h3 style={{ fontFamily:'var(--font-display)', marginBottom:20 }}>Categories</h3>
      <form onSubmit={handleCreate} style={{ display:'flex', gap:10, marginBottom:24 }}>
        <input style={{ flex:1, padding:'10px 14px', border:'1.5px solid #e0d0c4', borderRadius:20, fontSize:14, outline:'none', fontFamily:'inherit' }} placeholder="New category name…" value={name} onChange={e=>setName(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius:20 }} disabled={submitting}>
          {submitting?<span className="spinner" style={{width:14,height:14}}/>:'Add'}
        </button>
      </form>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {cats.map(c=>(
          <div key={c._id} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:20, padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' }}>
            <span style={{ fontWeight:600, fontSize:14 }}>🏷 {c.name}</span>
            <button onClick={()=>handleDelete(c._id)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1.1rem', transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color='var(--error)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetOrdersAPI(page, statusFilter)
      .then(r=>{ setOrders(r.data.orders||[]); setPages(r.data.pages||1); setTotal(r.data.total||0); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };
  useEffect(load,[page,statusFilter]);

  const handleAdvance = async id => {
    setUpdating(id);
    try {
      const r = await adminUpdateStatusAPI(id, {});
      if(r.ok){toast('Status updated!');load();}else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)' }}>Orders ({total})</h3>
        <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
          style={{ padding:'8px 14px', borderRadius:20, fontSize:13, border:'1.5px solid #e0d0c4', background:'white', fontFamily:'inherit', outline:'none' }}>
          <option value="">All Statuses</option>
          {['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner text="Loading orders…" /> : orders.length===0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><h3>No orders found</h3></div>
      ) : (
        <>
          {orders.map(order=>(
            <div key={order._id} style={{ background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:20, boxShadow:'0 4px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:12, color:'var(--muted)', marginBottom:3 }}>#{order._id.slice(-8).toUpperCase()}</p>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:14, color:'var(--text)', marginBottom:2 }}>
                    {order.user?.name} — <span style={{ fontSize:13, color:'var(--muted)' }}>{order.user?.email}</span>
                  </p>
                  <p style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>
                    {order.items?.map(i=>`${i.name}(${i.weight}×${i.quantity})`).join(', ').slice(0,80)}
                  </p>
                  <p style={{ fontWeight:700, fontSize:14 }}>₹{order.totalPrice} · {order.paymentMethod} · <span style={{ color: order.paymentStatus==='Paid'?'var(--success)':'var(--muted)' }}>{order.paymentStatus}</span></p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                  <StatusBadge status={order.status} />
                  {!['Delivered','Cancelled','Returned'].includes(order.status) && (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius:20 }} onClick={()=>handleAdvance(order._id)} disabled={updating===order._id}>
                      {updating===order._id?<span className="spinner" style={{width:14,height:14}}/>:'→ Advance Status'}
                    </button>
                  )}
                  <p style={{ fontSize:11, color:'var(--muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
          {pages>1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16 }}>
              <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
              <span style={{ padding:'8px 16px', fontSize:13 }}>Page {page} of {pages}</span>
              <button className="btn btn-outline btn-sm" style={{ borderRadius:20 }} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [tab, setTab]   = useState('products');
  const [stats, setStats] = useState({ products:0, pendingOrders:0 });

  useEffect(() => {
    Promise.all([getProductsAPI(), adminGetOrdersAPI(1,'Placed')])
      .then(([p,o]) => setStats({ products: p.data.products?.length||0, pendingOrders: o.data.total||0 }))
      .catch(()=>{});
  }, []);

  const TABS = [
    { id:'products',   label:'🛍 Products'   },
    { id:'categories', label:'🏷 Categories' },
    { id:'orders',     label:'📦 Orders'     },
  ];

  return (
    <Layout title="Admin Panel">
      <div className="page-hero" style={{ minHeight:'auto', padding:'40px 20px' }}>
        <h1 style={{ fontSize:'2rem' }}>⚙️ Admin Dashboard</h1>
        <p>Manage your Mathi's Secret Organics store</p>
      </div>

      <div style={{ padding:'32px 0 80px', margin:'0 16px' }}>
        <div className="container">

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
            {[
              { icon:'🛍', label:'Total Products',  value: stats.products,      color:'var(--brand)' },
              { icon:'⏳', label:'Pending Orders',  value: stats.pendingOrders, color:'#e65c00' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:20, boxShadow:'0 4px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</p>
                  <p style={{ fontSize:'1.6rem', fontWeight:800, color:s.color, lineHeight:1.2 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ background:'rgba(255,255,255,0.5)', backdropFilter:'blur(16px)', borderRadius:20, padding:28, boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
            {tab==='products'   && <ProductsTab />}
            {tab==='categories' && <CategoriesTab />}
            {tab==='orders'     && <OrdersTab />}
          </div>

        </div>
      </div>
    </Layout>
  );
}