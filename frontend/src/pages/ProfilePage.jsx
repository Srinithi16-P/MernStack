import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const { auth, logout } = useAuth();
  const user = auth?.user;

  const rows = [
    { label:'Name',    value: user?.name },
    { label:'Email',   value: user?.email },
    { label:'Phone',   value: user?.phone },
    { label:'Address', value: user?.address },
    { label:'Role',    value: user?.role === 1 ? '⚙️ Admin' : '👤 Customer' },
  ];

  return (
    <Layout title="Profile">
      <div className="auth-page" style={{ paddingTop:40 }}>
        <div className="auth-card auth-card-wide">

          {/* Avatar header */}
          <div className="auth-header">
            <div style={{
              width:72, height:72, borderRadius:18,
              background:'var(--brand)', color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'2rem', fontWeight:700, margin:'0 auto 12px',
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem' }}>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>

          {/* Info rows */}
          <div className="profile-info" style={{ marginBottom:24 }}>
            {rows.map(r => (
              <div key={r.label} className="profile-row">
                <span className="profile-label">{r.label}</span>
                <span className="profile-value">{r.value || '—'}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            <Link to="/orders" className="btn btn-primary" style={{ flex:1, minWidth:130, justifyContent:'center', borderRadius:30 }}>
              📦 My Orders
            </Link>
            <Link to="/dashboard" className="btn btn-outline" style={{ flex:1, minWidth:130, justifyContent:'center', borderRadius:30 }}>
              🏠 Dashboard
            </Link>
          </div>

          {user?.role === 1 && (
            <Link to="/admin/dashboard" style={{ display:'block', textAlign:'center', padding:'10px', color:'#7c3aed', fontWeight:600, fontSize:14, background:'rgba(124,58,237,0.06)', borderRadius:10, marginBottom:12 }}>
              ⚙️ Admin Panel
            </Link>
          )}

          <button
            onClick={logout}
            style={{
              width:'100%', padding:13, borderRadius:10,
              background:'transparent', color:'var(--error)',
              border:'1.5px solid var(--error)', fontSize:14,
              fontWeight:600, cursor:'pointer', transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background='#fff5f5'; }}
            onMouseLeave={e => { e.target.style.background='transparent'; }}
          >
            🚪 Logout
          </button>

        </div>
      </div>
    </Layout>
  );
}