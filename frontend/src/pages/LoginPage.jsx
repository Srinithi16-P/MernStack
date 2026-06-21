// LoginPage.jsx — keeps your exact existing style and logic
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAPI } from '../api/api';
import Layout from '../components/Layout';

export default function LoginPage() {
  var { login }    = useAuth();
  var navigate     = useNavigate();
  var location     = useLocation();
  var from = (location.state?.from?.pathname) || '/';
  var [form, setForm]             = useState({ email:'', password:'' });
  var [errors, setErrors]         = useState({});
  var [serverError, setServerError] = useState('');
  var [loading, setLoading]       = useState(false);
  var [showPassword, setShowPassword] = useState(false);
  function handleChange(e) {
    var { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]:'' }));
    setServerError('');
  }

  function validate() {
    var errs = {};
    if (!form.email.trim())    errs.email    = 'Email is required.';
    if (!form.password.trim()) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      var result = await loginAPI({ email: form.email, password: form.password });
      // fetch-based api returns { ok, status, data }
      if (result.ok && result.data.success) {
        login(result.data.user, result.data.token);
        navigate(from, { replace: true });
      } else {
        if (result.data.errors) setErrors(result.data.errors);
        else setServerError(result.data.message || 'Login failed.');
      }
    } catch(err) {
      setServerError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <Layout title="Login">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🌿</div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className={errors.email ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" autoComplete="email"
                placeholder="you@gmail.com" value={form.email} onChange={handleChange} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className={errors.password ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="password">Password</label>
              <div className="input-with-toggle">
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" placeholder="Your password"
                  value={form.password} onChange={handleChange} />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-forgot">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            New here? <Link to="/register">Create Account</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}