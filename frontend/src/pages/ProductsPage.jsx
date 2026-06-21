import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import { getProductsAPI, getCategoriesAPI } from '../api/api';

export default function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [sort, setSort]             = useState('default');

  useEffect(() => {
    Promise.all([getProductsAPI(), getCategoriesAPI()])
      .then(([pr, cr]) => {
        setProducts(pr.data.products || []);
        setCategories(cr.data.data   || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter(p => catFilter === 'all' || p.category?._id === catFilter)
    .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc')  return (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0);
      if (sort === 'price_desc') return (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0);
      if (sort === 'rating')     return (b.averageRating || 0) - (a.averageRating || 0);
      return 0;
    });

  return (
    <Layout title="Products">
      {/* Hero */}
      <div className="page-hero">
        <h1>Our Products</h1>
        <p>Pure, handcrafted organic formulations from Tamil Nadu</p>
      </div>

      <section style={{ padding:'40px 0 80px', margin:'0 16px' }}>
        <div className="container">

          {/* Filters */}
          <div style={{
            background:'var(--glass)', backdropFilter:'blur(16px)',
            borderRadius:16, padding:'16px 20px', marginBottom:28,
            boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            display:'flex', gap:12, flexWrap:'wrap', alignItems:'center',
          }}>
            {/* Search */}
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.5 }}>🔍</span>
              <input
                style={{
                  width:'100%', padding:'9px 14px 9px 34px',
                  border:'1.5px solid #e0d0c4', borderRadius:30,
                  fontSize:14, fontFamily:'inherit',
                  background:'rgba(255,255,255,0.8)', outline:'none',
                }}
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button
                onClick={() => setCatFilter('all')}
                style={{
                  padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:500,
                  border:'1.5px solid', cursor:'pointer',
                  borderColor: catFilter === 'all' ? 'var(--brand)' : '#e0d0c4',
                  background:  catFilter === 'all' ? 'var(--brand)' : 'none',
                  color:       catFilter === 'all' ? 'white' : 'var(--muted)',
                  transition:'all 0.2s',
                }}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c._id}
                  onClick={() => setCatFilter(c._id)}
                  style={{
                    padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:500,
                    border:'1.5px solid', cursor:'pointer',
                    borderColor: catFilter === c._id ? 'var(--brand)' : '#e0d0c4',
                    background:  catFilter === c._id ? 'var(--brand)' : 'none',
                    color:       catFilter === c._id ? 'white' : 'var(--muted)',
                    transition:'all 0.2s',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding:'8px 14px', borderRadius:20, fontSize:13,
                border:'1.5px solid #e0d0c4', background:'rgba(255,255,255,0.8)',
                color:'var(--text)', outline:'none', cursor:'pointer',
                fontFamily:'inherit',
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <p style={{ color:'var(--muted)', fontSize:14, marginBottom:20 }}>
            Showing <strong style={{ color:'var(--text)' }}>{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}
          </p>

          {loading ? (
            <Spinner text="Loading products…" />
          ) : filtered.length > 0 ? (
            <div className="products-grid">
              {filtered.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌱</div>
              <h3>No products found</h3>
              <p>Try a different search or category.</p>
              <button
                onClick={() => { setSearch(''); setCatFilter('all'); }}
                className="btn btn-primary"
                style={{ borderRadius:30 }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}