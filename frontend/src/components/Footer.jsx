// ── Footer.jsx ────────────────────────────────────────────────────────────────
import { useState } from 'react';

export default function Footer() {
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const [sent, setSent]  = useState(false);

  function handleSubmit(e) {
    e.preventDefault(); setSent(true);
    setForm({ name:'', email:'', message:'' });
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <footer id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Contact Us</h4>
            <p>Have doubts about our organic products? We would love to help you.</p>
            <div className="footer-info">
              <div className="info-row"><span className="info-icon">📍</span><span>Tamil Nadu, India</span></div>
              <div className="info-row"><span className="info-icon">📞</span><span>+91 9876543210</span></div>
              <div className="info-row"><span className="info-icon">✉️</span><span>mathisecrets@gmail.com</span></div>
            </div>
            <div className="social-links">
              <strong>Follow Us</strong>
              <div className="social-row">
                <a href="#" className="social-link">Instagram</a>
                <span className="sep"> | </span>
                <a href="#" className="social-link">Facebook</a>
              </div>
            </div>
          </div>
          <div className="footer-col">
            <h4>Send us a Message</h4>
            {sent && <div className="success-toast">Message sent! We will get back to you soon.</div>}
            <form onSubmit={handleSubmit} className="footer-form">
              <input className="footer-input" type="text"  placeholder="Your Name"    value={form.name}    onChange={e=>setForm({...form,name:e.target.value})} required />
              <input className="footer-input" type="email" placeholder="Email"         value={form.email}   onChange={e=>setForm({...form,email:e.target.value})} required />
              <textarea className="footer-input" rows="4"  placeholder="Message"       value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required />
              <button type="submit" className="btn-shop">Send Message</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Mathi's Secret Organics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}