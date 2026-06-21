import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPasswordAPI } from '../api/api';
import Layout from '../components/Layout';

export default function ResetPasswordPage() {
  var [searchParams] = useSearchParams();
  var token = searchParams.get('token');
  var navigate = useNavigate();

  var [form, setForm] = useState({ password: '', confirmPassword: '' });
  var [errors, setErrors] = useState({});
  var [serverError, setServerError] = useState('');
  var [success, setSuccess] = useState('');
  var [loading, setLoading] = useState(false);
  var [showPwd, setShowPwd] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);

  if (!token) {
    return (
      <Layout title="Invalid Link">
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon">⚠️</div>
              <h2>Invalid Reset Link</h2>
              <p>This link is missing the reset token.</p>
            </div>
            <Link to="/forgot-password" className="btn-submit" style={{ textAlign: 'center', display: 'block' }}>
              Request a New Link
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  function validate() {
    var errs = {};
    if (!form.password) errs.password = 'New password is required.';
    else if (form.password.length < 8) errs.password = 'At least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter.';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain a lowercase letter.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a digit.';
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(form.password)) errs.password = 'Must contain a special character.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  }

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.value;
    setForm(function(prev) { return Object.assign({}, prev, { [name]: value }); });
    if (errors[name]) setErrors(function(prev) { return Object.assign({}, prev, { [name]: '' }); });
    setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      var result = await resetPasswordAPI(token, form);
      if (result.ok && result.data.success) {
        setSuccess(result.data.message);
        setTimeout(function() { navigate('/login'); }, 3000);
      } else {
        if (result.data.errors) setErrors(result.data.errors);
        else setServerError(result.data.message || 'Reset failed. The link may have expired.');
      }
    } catch(err) {
      setServerError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <Layout title="Reset Password">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔒</div>
            <h2>Set New Password</h2>
            <p>Choose a strong password for your account</p>
          </div>

          {serverError && <div className="alert-error">{serverError}</div>}
          {success && <div className="alert-success">{success}<br /><small>Redirecting to login...</small></div>}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className={errors.password ? 'form-group has-error' : 'form-group'}>
                <label htmlFor="password">New Password</label>
                <div className="input-with-toggle">
                  <input
                    id="password" name="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min 8 chars, upper, lower, digit, symbol"
                    value={form.password} onChange={handleChange}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className={errors.confirmPassword ? 'form-group has-error' : 'form-group'}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-toggle">
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={form.confirmPassword} onChange={handleChange}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="auth-switch"><Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </Layout>
  );
}