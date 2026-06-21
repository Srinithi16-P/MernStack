import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFoundPage() {
  return (
    <Layout title="404 - Not Found">
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh', padding:'60px 16px' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:60, marginBottom:12 }}>🌿</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:80, fontWeight:700, color:'var(--brand)', lineHeight:1, marginBottom:8 }}>
            404
          </div>
          <h2 style={{ fontSize:24, marginBottom:10, fontFamily:'var(--font-display)' }}>Page Not Found</h2>
          <p style={{ color:'var(--muted)', marginBottom:28, fontSize:15 }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/" className="btn btn-primary" style={{ borderRadius:30 }}>← Go Home</Link>
            <Link to="/products" className="btn btn-outline" style={{ borderRadius:30 }}>Browse Products</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}