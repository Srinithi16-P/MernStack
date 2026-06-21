// CategoriesPage.jsx
import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Spinner, EmptyState } from '../components/shared';
import { useToast } from '../components/useToast';
import { getCategoriesAPI, createCategoryAPI, updateCategoryAPI, deleteCategoryAPI } from '../api/api';

export function CategoriesPage() {
  const { toast, ToastContainer } = useToast();
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState('');
  const [editId,  setEditId]  = useState(null);
  const [editName,setEditName]= useState('');
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    try { const r = await getCategoriesAPI(); setCats(r.data.data||[]); }
    catch { toast('Error loading','error'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await createCategoryAPI({ name: name.trim() });
      if (r.ok && r.data.success) { toast('Category created ✓'); setName(''); load(); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
    setSaving(false);
  };

  const update = async id => {
    if (!editName.trim()) return;
    try {
      const r = await updateCategoryAPI(id, { name: editName.trim() });
      if (r.ok) { toast('Updated ✓'); setEditId(null); load(); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
  };

  const del = async id => {
    if (!confirm('Delete this category?')) return;
    try {
      const r = await deleteCategoryAPI(id);
      if (r.ok) { toast('Deleted'); load(); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
  };

  return (
    <AdminLayout title="Categories" subtitle={`${cats.length} categories`}>
      <ToastContainer />
      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, alignItems:'start' }}>
        {/* Add form */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ marginBottom:20, fontSize:'0.95rem' }}>Add New Category</h3>
          <form onSubmit={create}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input className="form-input" placeholder="e.g. Hair Oils" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <><span className="spinner"/>Creating…</> : '+ Create Category'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="card">
          {loading ? <Spinner text="Loading…" /> : cats.length === 0 ? (
            <EmptyState icon="🏷" title="No categories yet" />
          ) : (
            <div className="table-outer">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
                <tbody>
                  {cats.map((c,i) => (
                    <tr key={c._id}>
                      <td className="td-muted">{i+1}</td>
                      <td>
                        {editId === c._id ? (
                          <div style={{ display:'flex', gap:8 }}>
                            <input className="form-input" value={editName} onChange={e=>setEditName(e.target.value)} style={{ padding:'6px 10px', fontSize:13 }} />
                            <button className="btn btn-success btn-sm" onClick={()=>update(c._id)}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={()=>setEditId(null)}>✕</button>
                          </div>
                        ) : (
                          <span style={{ fontWeight:600 }}>{c.name}</span>
                        )}
                      </td>
                      <td><code style={{ fontSize:11, color:'var(--muted)' }}>{c.slug||'—'}</code></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{ setEditId(c._id); setEditName(c.name); }}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>del(c._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default CategoriesPage;