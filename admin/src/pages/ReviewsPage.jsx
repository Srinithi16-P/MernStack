import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Spinner, EmptyState, Pagination } from '../components/shared';
import { useToast } from '../components/useToast';
import { adminGetReviewsAPI, adminApproveReviewAPI, deleteReviewAPI } from '../api/api';

export default function ReviewsPage() {
  const { toast, ToastContainer } = useToast();
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [filter,   setFilter]   = useState('');

  const load = async (p = page, f = filter) => {
    setLoading(true);
    try {
      const r = await adminGetReviewsAPI(p, f);
      setReviews(r.data.reviews || []);
      setPages(r.data.pages || 1);
      setTotal(r.data.total || 0);
    } catch { toast('Error loading reviews','error'); }
    setLoading(false);
  };
  useEffect(() => { load(page, filter); }, [page, filter]);

  const toggleApproval = async (id, current) => {
    try {
      const r = await adminApproveReviewAPI(id, { isApproved: !current });
      if (r.ok) { toast(!current ? 'Review approved ✓' : 'Review hidden'); load(page, filter); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
  };

  const del = async id => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const r = await deleteReviewAPI(id);
      if (r.ok) { toast('Review deleted'); load(page, filter); }
      else toast(r.data.message||'Error','error');
    } catch { toast('Error','error'); }
  };

  const stars = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

  return (
    <AdminLayout title="Reviews" subtitle={`${total} total reviews`}>
      <ToastContainer />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:'1.1rem', color:'var(--text)' }}>Customer Reviews</h2>
        <select className="filter-select" value={filter} onChange={e=>{ setFilter(e.target.value); setPage(1); }}>
          <option value="">All Reviews</option>
          <option value="true">Approved Only</option>
          <option value="false">Pending Approval</option>
        </select>
      </div>

      {loading ? <Spinner text="Loading reviews…" /> : reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews found" desc="Reviews from your customers will appear here." />
      ) : (
        <>
          {reviews.map(r => (
            <div key={r._id} className="review-card">
              <div className="review-header">
                <div>
                  <strong style={{ fontSize:14 }}>{r.user?.name || 'Customer'}</strong>
                  {r.isVerifiedPurchase && <span className="verified-tag">✓ Verified</span>}
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
                    {r.user?.email} · {r.product?.name} · {fmtDate(r.createdAt)}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="stars">{stars(r.rating)}</div>
                  <div style={{ fontSize:11, marginTop:4, color: r.isApproved ? 'var(--success)' : 'var(--gold)', fontWeight:600 }}>
                    {r.isApproved ? '✓ Approved' : '⏳ Pending'}
                  </div>
                </div>
              </div>
              {r.title && <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{r.title}</div>}
              {r.description && <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>{r.description}</div>}
              <div style={{ display:'flex', gap:8, marginTop:14, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'var(--muted)' }}>
                  👍 {r.helpfulVotes?.length || 0} helpful votes
                </span>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <button
                    className={`btn btn-sm ${r.isApproved ? 'btn-ghost' : 'btn-success'}`}
                    onClick={() => toggleApproval(r._id, r.isApproved)}
                  >
                    {r.isApproved ? 'Hide' : '✓ Approve'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(r._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          <Pagination page={page} pages={pages} total={total}
            onPrev={() => setPage(p=>p-1)} onNext={() => setPage(p=>p+1)} />
        </>
      )}
    </AdminLayout>
  );
}