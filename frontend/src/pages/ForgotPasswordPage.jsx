import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordAPI } from '../api/api';
import Layout from '../components/Layout';

export default function ForgotPasswordPage() {
  var [email, setEmail] = useState('');
  var [error, setError] = useState('');
  var [success, setSuccess] = useState('');
  var [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^[a-z0-9._%+\-]+@gmail\.com$/.test(email)) {
      setError('Please enter a valid lowercase @gmail.com address.');
      return;
    }
    setLoading(true);
    try {
      var result = await forgotPasswordAPI({ email: email });
      setSuccess(result.data.message || 'If this email is registered, a reset link has been sent.');
    } catch(err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <Layout title="Forgot Password">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔑</div>
            <h2>Forgot Password?</h2>
            <p>Enter your email and we will send you a reset link</p>
          </div>

          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success"><strong>Check your inbox!</strong><br />{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className={error ? 'form-group has-error' : 'form-group'}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email" type="email" autoComplete="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={function(e) { setEmail(e.target.value); setError(''); }}
                />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="auth-switch"><Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </Layout>
  );
}