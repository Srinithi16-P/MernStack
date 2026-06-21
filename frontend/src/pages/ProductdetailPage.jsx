import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import {
  getSingleProductAPI, getProductPhotoAPI,
  getDeliveryEstimateAPI, getReviewsAPI, createReviewAPI,
} from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const FALLBACK = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f0e8d8' width='400' height='400'/><text y='220' x='50%25' font-size='120' text-anchor='middle'>🌿</text></svg>`;

function toast(msg, type='success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:28px;right:28px;
    background:${type==='error'?'#d93025':'#c2561a'};
    color:white;padding:12px 22px;border-radius:30px;
    font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;
    opacity:0;transition:opacity 0.3s;pointer-events:none;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity='1', 10);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2500);
}

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const { addToCart } = useCart();
  const { auth }    = useAuth();

  const [product, setProduct]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selVariant, setSelVariant]   = useState(0);
  const [quantity, setQuantity]       = useState(1);
  const [adding, setAdding]           = useState(false);
  const [pincode, setPincode]         = useState('');
  const [delivery, setDelivery]       = useState(null);
  const [delivLoading, setDelivLoading] = useState(false);
  const [reviews, setReviews]         = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [reviewForm, setReviewForm]   = useState({ rating:5, title:'', description:'' });
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    getSingleProductAPI(slug)
      .then(r => setProduct(r.data.product))
      .catch(() => toast('Product not found','error'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product) {
      getReviewsAPI(product._id, '?sort=newest&limit=5')
        .then(r => setReviews(r.data.reviews || []))
        .catch(() => {});
    }
  }, [product]);

  const checkDelivery = async () => {
    if (!/^\d{6}$/.test(pincode)) { toast('Enter a valid 6-digit pincode','error'); return; }
    setDelivLoading(true);
    try {
      const r = await getDeliveryEstimateAPI(pincode);
      setDelivery(r.data);
    } catch { toast('Pincode not serviceable','error'); }
    finally { setDelivLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const v = product.variants[selVariant];
    if (v.stock < 1) { toast('Out of stock','error'); return; }
    setAdding(true);
    await addToCart(product._id, v.weight, quantity);
    setAdding(false);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth?.token) { toast('Login to write a review','error'); return; }
    setSubmitting(true);
    try {
      await createReviewAPI(product._id, reviewForm);
      toast('Review submitted!');
      setShowForm(false);
      setReviewForm({ rating:5, title:'', description:'' });
      const r = await getReviewsAPI(product._id, '?sort=newest&limit=5');
      setReviews(r.data.reviews || []);
    } catch(err) { toast(err.message || 'Could not submit','error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Layout><Spinner text="Loading product…" /></Layout>;
  if (!product) return (
    <Layout title="Not Found">
      <div className="empty-state" style={{ paddingTop:80 }}>
        <div className="empty-icon">❌</div>
        <h3>Product not found</h3>
        <Link to="/products" className="btn btn-primary" style={{ borderRadius:30 }}>Back to Products</Link>
      </div>
    </Layout>
  );

  const variant      = product.variants?.[selVariant];
  const isOutOfStock = !variant || variant.stock < 1;
  const stars        = n => '★'.repeat(n) + '☆'.repeat(5-n);

  return (
    <Layout title={product.name}>
      <div style={{ padding:'32px 0 80px', margin:'72px 16px 0' }}>
        <div className="container">

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/">Home</Link><span>/</span>
            <Link to="/products">Products</Link><span>/</span>
            <span>{product.name}</span>
          </div>

          {/* Product grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, marginBottom:60, alignItems:'start' }}>

            {/* Image */}
            <div style={{
              borderRadius:20, overflow:'hidden',
              background:'rgba(255,255,255,0.5)', aspectRatio:'1',
              boxShadow:'0 20px 40px rgba(0,0,0,0.12)',
            }}>
              <img src={getProductPhotoAPI(product._id)} alt={product.name}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { e.target.src = FALLBACK; }} />
            </div>

            {/* Details */}
            <div style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px)', borderRadius:20, padding:32, boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--brand)', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>
                {product.category?.name}
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,3vw,2.2rem)', color:'var(--text)', marginBottom:12 }}>
                {product.name}
              </h1>

              {product.averageRating > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={{ color:'var(--gold)', fontSize:'1.1rem', letterSpacing:-2 }}>{stars(Math.round(product.averageRating))}</span>
                  <strong style={{ color:'var(--text)' }}>{product.averageRating.toFixed(1)}</strong>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>({product.totalReviews} reviews)</span>
                </div>
              )}

              <p style={{ color:'var(--muted)', lineHeight:1.8, marginBottom:24, fontSize:15 }}>{product.description}</p>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:10 }}>Choose Size / Weight</p>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {product.variants.map((v, i) => (
                      <button key={i}
                        onClick={() => { setSelVariant(i); setQuantity(1); }}
                        style={{
                          padding:'10px 18px', borderRadius:20,
                          border: i===selVariant ? '2px solid var(--brand)' : '1.5px solid #e0d0c4',
                          background: i===selVariant ? 'var(--brand)' : 'white',
                          color: i===selVariant ? 'white' : 'var(--text)',
                          fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                          opacity: v.stock<1 ? 0.4 : 1,
                        }}
                      >
                        {v.weight} — ₹{v.price}
                        {v.stock < 1 && ' (Out of stock)'}
                        {v.stock > 0 && v.stock < 5 && (
                          <span style={{ display:'block', fontSize:10, color: i===selVariant?'rgba(255,255,255,0.8)':'var(--error)' }}>
                            Only {v.stock} left!
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div style={{ fontSize:'2rem', fontWeight:800, color:'var(--brand)', marginBottom:20 }}>
                ₹{variant?.price || 0}
              </div>

              {/* Qty + Add to cart */}
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:24, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e0d0c4', borderRadius:30, overflow:'hidden' }}>
                  <button onClick={() => setQuantity(q => Math.max(1,q-1))} className="qty-btn">−</button>
                  <span style={{ minWidth:32, textAlign:'center', fontWeight:700, fontSize:15 }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(variant?.stock||1, q+1))} className="qty-btn">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={adding || isOutOfStock}
                  className="btn btn-primary"
                  style={{ flex:1, minWidth:180, borderRadius:30, fontSize:15, padding:'12px 24px' }}
                >
                  {adding ? <><span className="spinner" /> Adding…</> : isOutOfStock ? '❌ Out of Stock' : '🛒 Add to Cart'}
                </button>
              </div>

              {/* Delivery check */}
              <div style={{ background:'rgba(255,255,255,0.5)', border:'1px solid #e0d0c4', borderRadius:14, padding:16 }}>
                <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>🚚 Check Delivery Date</p>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    style={{ flex:1, padding:'9px 14px', border:'1.5px solid #e0d0c4', borderRadius:20, fontSize:13, outline:'none', fontFamily:'inherit', background:'white' }}
                    placeholder="Enter 6-digit pincode"
                    value={pincode}
                    onChange={e => { setPincode(e.target.value); setDelivery(null); }}
                    maxLength={6}
                  />
                  <button
                    onClick={checkDelivery}
                    disabled={delivLoading}
                    className="btn btn-primary btn-sm"
                    style={{ borderRadius:20 }}
                  >
                    {delivLoading ? <span className="spinner" style={{ width:14,height:14 }} /> : 'Check'}
                  </button>
                </div>
                {delivery && (
                  <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(240,253,244,0.8)', borderRadius:10, border:'1px solid #bbf7d0' }}>
                    <p style={{ fontWeight:700, fontSize:14, color:'var(--success)' }}>
                      📅 Deliver by <strong>{delivery.deliveryDate}</strong>
                    </p>
                    <p style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{delivery.note}</p>
                    <p style={{ fontSize:12, color:'var(--muted)' }}>Zone: {delivery.zone} · {delivery.shippingDays} shipping days</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px)', borderRadius:20, padding:32, boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem' }}>Customer Reviews</h2>
              {auth?.token && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius:20 }}
                >
                  {showForm ? 'Cancel' : '✍️ Write Review'}
                </button>
              )}
            </div>

            {showForm && (
              <form onSubmit={submitReview} style={{ background:'var(--brand-light)', borderRadius:14, padding:24, marginBottom:24 }}>
                <h4 style={{ marginBottom:16, color:'var(--text)' }}>Your Review</h4>
                <div className="form-group">
                  <label>Rating</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        onClick={() => setReviewForm({...reviewForm, rating:n})}
                        style={{ fontSize:'1.5rem', background:'none', border:'none', color: n<=reviewForm.rating ? '#c9a84c' : '#ddd', cursor:'pointer' }}
                      >★</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Title (optional)</label>
                  <input className="form-group" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e0d0c4', borderRadius:10, fontSize:14, outline:'none' }}
                    value={reviewForm.title} onChange={e => setReviewForm({...reviewForm,title:e.target.value})}
                    placeholder="Summary of your experience" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e0d0c4', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', fontFamily:'inherit' }}
                    rows={4} value={reviewForm.description}
                    onChange={e => setReviewForm({...reviewForm,description:e.target.value})}
                    placeholder="Share your experience…" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ borderRadius:30 }}>
                  {submitting ? <><span className="spinner" /> Submitting…</> : 'Submit Review'}
                </button>
              </form>
            )}

            {reviews.length > 0 ? reviews.map(r => (
              <div key={r._id} style={{ borderBottom:'1px solid #f0e8e0', paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div>
                    <strong style={{ fontSize:14 }}>{r.user?.name || 'Customer'}</strong>
                    {r.isVerifiedPurchase && (
                      <span style={{ marginLeft:8, fontSize:11, fontWeight:700, color:'var(--success)', background:'rgba(240,253,244,0.8)', padding:'2px 8px', borderRadius:10 }}>
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <span style={{ color:'#c9a84c', letterSpacing:-2 }}>{stars(r.rating)}</span>
                </div>
                {r.title && <p style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{r.title}</p>}
                {r.description && <p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.7 }}>{r.description}</p>}
                <p style={{ fontSize:11, color:'var(--muted)', opacity:0.6, marginTop:6 }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                </p>
              </div>
            )) : (
              <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
                <div style={{ fontSize:'2rem', marginBottom:12 }}>⭐</div>
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}