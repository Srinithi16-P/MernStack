import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useCart } from '../context/CartContext';
import { getProductPhotoAPI } from '../api/api';

const FALLBACK = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect fill='%23f0e8d8' width='80' height='80'/><text y='50' x='50%25' font-size='30' text-anchor='middle'>🌿</text></svg>`;

export default function CartPage() {
  const { cart, cartLoading, totalPrice, updateCartItem, removeCartItem, clearCart } = useCart();
  const navigate = useNavigate();
  const items    = cart?.cart?.items || [];

  if (cartLoading) return <Layout title="Cart"><Spinner text="Loading cart…" /></Layout>;

  return (
    <Layout title="Cart">
      <div style={{ padding:'32px 0 80px', margin:'72px 16px 0' }}>
        <div className="container">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem' }}>Shopping Cart</h1>
              <p style={{ color:'var(--muted)', fontSize:14, marginTop:4 }}>{items.length} item{items.length!==1?'s':''}</p>
            </div>
            {items.length > 0 && (
              <button onClick={clearCart}
                style={{ background:'none', border:'1.5px solid #e0d0c4', color:'var(--muted)', padding:'7px 16px', borderRadius:20, fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.target.style.borderColor='var(--error)';e.target.style.color='var(--error)';}}
                onMouseLeave={e=>{e.target.style.borderColor='#e0d0c4';e.target.style.color='var(--muted)';}}
              >
                🗑 Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Discover our organic products and add some to your cart.</p>
              <Link to="/products" className="btn btn-primary" style={{ borderRadius:30 }}>Shop Now</Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}>

              {/* Items */}
              <div>
                {items.map(item => (
                  <div key={item._id} style={{
                    display:'grid', gridTemplateColumns:'80px 1fr auto',
                    gap:16, alignItems:'center', padding:16,
                    background:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.4)',
                    borderRadius:16, boxShadow:'0 4px 12px rgba(0,0,0,0.06)',
                    marginBottom:12,
                  }}>
                    <img
                      src={getProductPhotoAPI(item.product?._id || item.product)}
                      alt={item.product?.name || 'Product'}
                      style={{ width:80, height:80, borderRadius:10, objectFit:'cover' }}
                      onError={e => { e.target.src = FALLBACK; }}
                    />
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:3 }}>
                        {item.product?.name || 'Product'}
                      </div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>{item.weight}</div>
                      <div style={{ fontWeight:700, color:'var(--brand)', fontSize:15 }}>₹{item.price * item.quantity}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid #e0d0c4', borderRadius:20, overflow:'hidden', marginTop:8, width:'fit-content' }}>
                        <button className="qty-btn" onClick={() => updateCartItem(item._id, item.quantity-1)}>−</button>
                        <span style={{ minWidth:28, textAlign:'center', fontWeight:700, fontSize:14 }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateCartItem(item._id, item.quantity+1)}>+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCartItem(item._id)}
                      style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'1.4rem', cursor:'pointer', padding:8, borderRadius:8, transition:'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color='var(--error)'}
                      onMouseLeave={e => e.target.style.color='var(--muted)'}
                      title="Remove"
                    >×</button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{
                background:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.4)',
                borderRadius:20, padding:28, boxShadow:'0 8px 24px rgba(0,0,0,0.08)',
                position:'sticky', top:90,
              }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:20, paddingBottom:12, borderBottom:'1px solid #f0e8e0' }}>
                  Order Summary
                </h3>
                {items.map(item => (
                  <div key={item._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:14 }}>
                    <span style={{ color:'var(--muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.product?.name || 'Item'} × {item.quantity}
                    </span>
                    <span style={{ fontWeight:600 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'var(--muted)', padding:'6px 0' }}>
                  <span>Shipping</span><span style={{ color:'var(--success)', fontWeight:600 }}>Free</span>
                </div>
                <div style={{ borderTop:'1px solid #f0e8e0', marginTop:8, paddingTop:14, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1.1rem' }}>
                  <span>Total</span><span>₹{totalPrice}</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width:'100%', marginTop:20, borderRadius:30, padding:'13px', fontSize:15 }}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout →
                </button>
                <Link to="/products" style={{ display:'block', textAlign:'center', marginTop:12, color:'var(--brand)', fontSize:13, fontWeight:500 }}>
                  ← Continue Shopping
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}