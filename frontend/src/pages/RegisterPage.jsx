import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAPI } from '../api/api';
import Layout from '../components/Layout';

export default function RegisterPage() {
  var navigate = useNavigate();
  var [form, setForm]               = useState({ name:'', email:'', password:'', phone:'', address:'' });
  var [errors, setErrors]           = useState({});
  var [serverError, setServerError] = useState('');
  var [successMsg, setSuccessMsg]   = useState('');
  var [loading, setLoading]         = useState(false);
  var [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    var { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]:'' }));
    setServerError('');
  }

  function validate() {
    var errs = {};
    var name = form.name.trim();
    if (!name) errs.name = 'Name is required.';
    else if (!/^[a-zA-Z\s]{2,50}$/.test(name)) errs.name = 'Name must be 2-50 letters and spaces only.';

    if (!form.email) errs.email = 'Email is required.';
    else if (!/^[a-z0-9._%+\-]+@gmail\.com$/.test(form.email)) errs.email = 'Must be a valid lowercase @gmail.com address.';

    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'At least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter.';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain a lowercase letter.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a digit.';
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(form.password)) errs.password = 'Must contain a special character.';

    if (!form.phone) errs.phone = 'Phone is required.';
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Must be exactly 10 digits.';
    else if (!/^[6-9]/.test(form.phone)) errs.phone = 'Must start with 6, 7, 8 or 9.';

    var addr = form.address.trim();
    if (!addr) errs.address = 'Address is required.';
    else if (addr.length < 10) errs.address = 'At least 10 characters.';
    else if (addr.length > 200) errs.address = 'Max 200 characters.';

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      var result = await registerAPI(form);
      if (result.ok && result.data.success) {
        setSuccessMsg('Account created! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        if (result.data.errors) setErrors(result.data.errors);
        else setServerError(result.data.message || 'Registration failed.');
      }
    } catch(err) {
      setServerError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <Layout title="Create Account">
      <div className="auth-page">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="auth-icon">🌱</div>
            <h2>Create Account</h2>
            <p>Join our organic community</p>
          </div>

          {serverError && <div className="alert alert-error">{serverError}</div>}
          {successMsg  && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className={errors.name ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className={errors.email ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className={errors.password ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="password">Password</label>
              <div className="input-with-toggle">
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, upper, lower, digit, symbol"
                  value={form.password} onChange={handleChange} />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className={errors.phone ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} maxLength={10} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className={errors.address ? 'form-group has-error' : 'form-group'}>
              <label htmlFor="address">Delivery Address</label>
              <textarea id="address" name="address" rows={3} placeholder="Your full delivery address (min 10 characters)" value={form.address} onChange={handleChange} />
              <span className="char-count">{form.address.trim().length}/200</span>
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </Layout>
  );
}