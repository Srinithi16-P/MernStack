import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children }) {
  const { auth, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{
            width:44, height:44, border:'3px solid rgba(194,86,26,0.2)',
            borderTopColor:'var(--brand)', borderRadius:'50%',
            animation:'spin 0.7s linear infinite', margin:'0 auto 12px',
          }} />
          <p style={{ color:'var(--muted)', fontSize:14 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!auth?.token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { auth, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return null;
  if (!auth?.token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!auth.user || auth.user.role !== 1) return <Navigate to="/" replace />;
  return children;
}