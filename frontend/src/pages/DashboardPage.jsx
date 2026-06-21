// DashboardPage.jsx — keeping your existing dashboard
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function DashboardPage() {
  const { auth, logout } = useAuth();
  const user = auth?.user;

  return (
    <Layout title="Dashboard">
      <div className="auth-page">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="auth-icon">👤</div>
            <h2>My Account</h2>
            <p>Welcome back, {user?.name?.split(' ')[0] || 'there'}!</p>
          </div>

          <div className="profile-info">
            {[
              { label:'Name',    value: user?.name },
              { label:'Email',   value: user?.email },
              { label:'Phone',   value: user?.phone },
              { label:'Address', value: user?.address },
              { label:'Role',    value: user?.role === 1 ? '⚙️ Admin' : '👤 Customer' },
            ].map(r => (
              <div key={r.label} className="profile-row">
                <span className="profile-label">{r.label}</span>
                <span className="profile-value">{r.value || '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:20 }}>
            <Link to="/orders"  className="btn btn-primary" style={{ flex:1, minWidth:130, justifyContent:'center', borderRadius:20 }}>📦 My Orders</Link>
            <Link to="/profile" className="btn btn-outline"  style={{ flex:1, minWidth:130, justifyContent:'center', borderRadius:20 }}>👤 Profile</Link>
          </div>

          {user?.role === 1 && (
            <Link to="/admin/dashboard" style={{ display:'block', textAlign:'center', marginTop:12, color:'#7c3aed', fontWeight:600, fontSize:14 }}>
              ⚙️ Go to Admin Panel
            </Link>
          )}

          <button
            onClick={logout}
            className="btn-submit"
            style={{ marginTop:16, background:'transparent', color:'var(--error)', border:'1.5px solid var(--error)' }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}