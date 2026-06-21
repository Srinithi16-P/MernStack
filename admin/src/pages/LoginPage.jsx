import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminLoginAPI } from '../api/api';

export default function LoginPage() {
  const { login }  = useAdminAuth();
  const navigate   = useNavigate();
  const [form, setForm]         = useState({ email:'', password:'' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = e => { const {name,value}=e.target; setForm(f=>({...f,[name]:value})); setError(''); };

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    setLoading(true);
    try {
      const r = await adminLoginAPI(form);
      if (r.ok && r.data.success) {
        if (r.data.user.role !== 1) { setError('Access denied. Admin accounts only.'); setLoading(false); return; }
        login(r.data.user, r.data.token);
        navigate('/admin');
      } else {
        setError(r.data.message || 'Invalid credentials.');
      }
    } catch { setError('Network error. Is the backend running on port 5001?'); }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🌿</div>
        <h1 className="login-title">Admin Portal</h1>
        <p className="login-sub">Mathi's Secret Organics — Staff only</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" name="email"
              placeholder="admin@gmail.com" value={form.email} onChange={handle} autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-toggle">
              <input className="form-input" type={showPass?'text':'password'} name="password"
                placeholder="••••••••" value={form.password} onChange={handle} autoComplete="current-password" />
              <button type="button" className="toggle-password" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop:8 }}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In to Admin'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted)' }}>
          <a href="http://localhost:3000" style={{ color:'var(--brand)' }}>← Back to Store</a>
        </p>
      </div>
    </div>
  );
}