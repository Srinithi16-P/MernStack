import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import { getProductsAPI } from '../api/api';

/* ── Counter ── */
function Counter({ target }) {
  const [count, setCount] = useState(0);
  const ref     = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        let current = 0;
        const increment = target / 80;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.ceil(current));
        }, 20);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}+</span>;
}

/* ── Reveal ── */
function Reveal({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={visible ? 'reveal active' : 'reveal'}>{children}</div>
  );
}

/* ── HomePage ── */
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getProductsAPI()
      .then(r => setProducts(r.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = products.slice(0, 4);

  return (
    <Layout title="Home">

      {/* ── HERO ── */}
      <Reveal>
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-content">
                <p className="tag">100% NATURAL &amp; CHEMICAL-FREE</p>
                <h1>Nature's <span>Secret</span><br />Reinvented.</h1>
                <p className="hero-desc">
                  Natural organic products for a healthy life. Mathi's Secret provides
                  homemade hair oils, herbal powders and skincare products made from nature.
                </p>
                <div className="hero-btns">
                  <Link to="/products" className="btn-shop">SHOP NOW →</Link>
                  <button className="btn-story">▶ WATCH STORY</button>
                </div>
              </div>
              <div className="hero-cards">
                <div className="feature-card">
                  <span className="fc-icon">🌿</span>
                  <div><strong>100% Organic</strong><p>No chemicals ever</p></div>
                </div>
                <div className="feature-card">
                  <span className="fc-icon">🧴</span>
                  <div><strong>Handmade Products</strong><p>Hair oils &amp; skincare</p></div>
                </div>
                <div className="feature-card">
                  <span className="fc-icon">🌱</span>
                  <div><strong>Farm to Home</strong><p>Directly from nature</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── FEATURED PRODUCTS ── */}
      <Reveal>
        <section style={{ padding:'48px 0', margin:'0 16px' }}>
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32, flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,3vw,2rem)', color:'var(--text)', marginBottom:6 }}>
                  Featured Products
                </h2>
                <p style={{ color:'var(--muted)', fontSize:14 }}>Our most loved organic formulations</p>
              </div>
              <Link to="/products" style={{ color:'var(--brand)', fontWeight:600, fontSize:14, background:'var(--brand-light)', padding:'8px 18px', borderRadius:20, display:'inline-block' }}>
                View All →
              </Link>
            </div>

            {loading ? (
              <Spinner text="Loading products…" />
            ) : featured.length > 0 ? (
              <div className="products-grid">
                {featured.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <h3>No products yet</h3>
                <p>Check back soon!</p>
                <Link to="/products" className="btn btn-primary">Browse All</Link>
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* ── STATS ── */}
      <Reveal>
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <h2><Counter target={products.length || 6} /></h2>
                <p>Organic Products</p>
              </div>
              <div className="stat-item">
                <h2><Counter target={5000} /></h2>
                <p>Happy Customers</p>
              </div>
              <div className="stat-item">
                <h2>Zero</h2>
                <p>Chemicals Used</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── WHY US ── */}
      <Reveal>
        <section style={{ background:'var(--glass)', backdropFilter:'blur(20px)', padding:'60px 40px', borderRadius:20, margin:'0 16px 24px', boxShadow:'var(--shadow)' }}>
          <div className="container">
            <h2 style={{ fontFamily:'var(--font-display)', textAlign:'center', fontSize:'clamp(1.4rem,3vw,2rem)', marginBottom:8 }}>Why Choose Us?</h2>
            <p style={{ color:'var(--muted)', textAlign:'center', marginBottom:36, fontSize:14 }}>Made the traditional Tamil Nadu way</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20 }}>
              {[
                { icon:'🌾', title:'Farm Sourced',   desc:'Ingredients from trusted Tamil Nadu farms.' },
                { icon:'🧪', title:'No Chemicals',   desc:'Zero parabens, sulfates, or fragrances.' },
                { icon:'👩‍🍳', title:'Handcrafted',  desc:'Small-batch, traditional recipes.' },
                { icon:'📦', title:'Eco Packaging',  desc:'Recyclable, minimal packaging.' },
              ].map(c => (
                <div key={c.title} className="feature-card" style={{ flexDirection:'column', alignItems:'flex-start', padding:'20px' }}>
                  <span style={{ fontSize:'2rem', marginBottom:10 }}>{c.icon}</span>
                  <strong style={{ fontSize:15, marginBottom:4, color:'var(--text)' }}>{c.title}</strong>
                  <p style={{ fontSize:13, margin:0, lineHeight:1.6 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

    </Layout>
  );
}