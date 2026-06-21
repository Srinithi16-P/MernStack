import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Spinner, EmptyState, Modal } from '../components/shared';
import { useToast } from '../components/useToast';
import { getProductsAPI, getCategoriesAPI, createProductAPI, updateProductAPI, deleteProductAPI, getPhotoURL } from '../api/api';

const EMPTY = { name:'', description:'', category:'', variants:'[{"weight":"100g","price":150,"stock":20}]' };

export default function ProductsPage() {
  const { toast, ToastContainer } = useToast();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catF,       setCatF]       = useState('');
  const [modal,      setModal]      = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [photo,      setPhoto]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});

  const load = async () => {
    try {
      const [pr, cr] = await Promise.all([getProductsAPI(), getCategoriesAPI()]);
      setProducts(pr.data.products  || []);
      setCategories(cr.data.data    || []);
    } catch { toast('Error loading products','error'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = products
    .filter(p => !catF || p.category?._id === catF)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditId(null); setForm(EMPTY); setPhoto(null); setErrors({}); setModal(true); };
  const openEdit = p => {
    setEditId(p._id);
    setForm({ name:p.name, description:p.description||'', category:p.category?._id||'', variants:JSON.stringify(p.variants||[]) });
    setPhoto(null); setErrors({}); setModal(true);
  };
  const closeModal = () => { setModal(false); setEditId(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.category)    e.category = 'Required';
    try { JSON.parse(form.variants); } catch { e.variants = 'Invalid JSON'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('variants', form.variants);
      if (photo) fd.append('photo', photo);

      const res = editId ? await updateProductAPI(editId, fd) : await createProductAPI(fd);
      if (res.success !== false) {
        toast(editId ? 'Product updated ✓' : 'Product created ✓');
        closeModal(); load();
      } else { toast(res.message || 'Error saving','error'); }
    } catch { toast('Network error','error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const r = await deleteProductAPI(id);
      if (r.ok) { toast('Product deleted'); load(); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
  };

  return (
    <AdminLayout title="Products" subtitle={`${products.length} products in catalog`}>
      <ToastContainer />

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-wrap" style={{ maxWidth:280 }}>
          <span className="s-icon">🔍</span>
          <input className="search-input" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catF} onChange={e=>setCatF(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div style={{ marginLeft:'auto' }}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {loading ? <Spinner text="Loading products…" /> : filtered.length === 0 ? (
        <EmptyState icon="🛍" title="No products found" desc="Add your first product to get started."
          action={<button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>} />
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <div key={p._id} className="product-card">
              <div className="product-card-img">
                <img src={getPhotoURL(p._id)} alt={p.name}
                  onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}} />
                <div className="fallback" style={{display:'none'}}>🌿</div>
              </div>
              <div className="product-card-body">
                <div className="product-cat">{p.category?.name||'Uncategorized'}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-variants">
                  {p.variants?.map(v=>(
                    <span key={v.weight} className={`variant-tag${v.stock<5?' ':''}` } style={v.stock===0?{borderColor:'var(--error)',color:'var(--error)'}:v.stock<5?{borderColor:'var(--gold)',color:'var(--gold)'}:{}}>
                      {v.weight} ₹{v.price} ({v.stock===0?'OOS':v.stock})
                    </span>
                  ))}
                </div>
                {p.averageRating > 0 && (
                  <div style={{ fontSize:12, color:'var(--gold)', marginBottom:10 }}>
                    ★ {p.averageRating.toFixed(1)} ({p.totalReviews} reviews)
                  </div>
                )}
                <div className="product-actions">
                  <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={()=>openEdit(p)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(p._id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal open={modal} title={editId ? 'Edit Product' : 'Add New Product'} onClose={closeModal}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner"/>Saving…</> : editId ? 'Update Product' : 'Create Product'}
          </button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Product Name *</label>
            <input className={`form-input${errors.name?' error':''}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Neem Hair Oil" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className={`form-input${errors.category?' error':''}`} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Select category…</option>
              {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.category && <span className="form-error">{errors.category}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Photo {editId && '(blank = keep current)'}</label>
            <input className="form-input" type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])} style={{padding:'6px 10px'}} />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Product description…" />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Variants JSON *</label>
            <textarea className="form-input" rows={2} style={{fontFamily:'monospace',fontSize:12}} value={form.variants} onChange={e=>setForm({...form,variants:e.target.value})} />
            {errors.variants && <span className="form-error">{errors.variants}</span>}
            <span style={{fontSize:11,color:'var(--muted)',display:'block',marginTop:4}}>Format: [{"{"}"weight":"100g","price":150,"stock":20{"}"}]</span>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}