import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrderAPI, getDeliveryEstimateAPI, createRazorpayOrderAPI, verifyPaymentAPI } from '../api/api';

// ─── Toast helper (matches your existing pattern) ─────────────────────────────
function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
        position:fixed;bottom:28px;right:28px;
        background:${type === 'error' ? '#d93025' : type === 'info' ? '#1a5c9e' : '#c2561a'};
        color:white;padding:12px 22px;border-radius:30px;
        font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
        box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;
        opacity:0;transition:opacity 0.3s;pointer-events:none;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.style.opacity = '1', 10);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── Address field component ───────────────────────────────────────────────────
function Field({ label, name, type = 'text', placeholder, value, onChange, error }) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(name, e.target.value)}
                style={{
                    width: '100%', padding: '11px 14px',
                    border: `1.5px solid ${error ? 'var(--error)' : '#e0d0c4'}`,
                    borderRadius: 10, fontSize: 14,
                    background: 'rgba(255,255,255,0.8)',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : '#e0d0c4'}
            />
            {error && <span style={{ fontSize: 12, color: 'var(--error)', display: 'block', marginTop: 4 }}>{error}</span>}
        </div>
    );
}

// ─── Payment status modal ──────────────────────────────────────────────────────
function PaymentModal({ status, message, onClose }) {
    if (!status) return null;

    const config = {
        loading: { icon: '⏳', title: 'Processing Payment…', color: '#1a5c9e', bg: '#eef7ff' },
        success: { icon: '✅', title: 'Payment Successful!', color: '#2d7a3a', bg: '#f0fdf4' },
        failed:  { icon: '❌', title: 'Payment Failed',      color: '#d93025', bg: '#fff2f2' },
        verify:  { icon: '🔐', title: 'Verifying Payment…', color: '#c2561a', bg: '#fdf5ef' },
    };

    const c = config[status] || config.loading;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: '40px 36px',
                textAlign: 'center', maxWidth: 380, width: '90%',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                animation: 'cardIn 0.3s ease',
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: c.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', margin: '0 auto 16px',
                }}>
                    {status === 'loading' || status === 'verify'
                        ? <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
                        : c.icon
                    }
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 8, color: c.color }}>{c.title}</h3>
                {message && <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>}
                {(status === 'success' || status === 'failed') && (
                    <button onClick={onClose}
                        style={{
                            marginTop: 20, padding: '10px 28px', borderRadius: 30,
                            background: status === 'success' ? 'var(--brand)' : '#d93025',
                            color: 'white', border: 'none', fontWeight: 600,
                            fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        {status === 'success' ? 'View Order →' : 'Try Again'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main checkout component ───────────────────────────────────────────────────
const EMPTY_ADDR = {
    fullName: '', phone: '', addressLine1: '',
    addressLine2: '', city: '', state: '', pincode: '',
};

export default function CheckoutPage() {
    const { cart, cartLoading, totalPrice, fetchCart } = useCart();
    const { auth } = useAuth();
    const navigate  = useNavigate();

    const [addr, setAddr]             = useState(EMPTY_ADDR);
    const [errors, setErrors]         = useState({});
    const [payMethod, setPayMethod]   = useState('COD');
    const [placing, setPlacing]       = useState(false);
    const [delivery, setDelivery]     = useState(null);
    const [modalStatus, setModalStatus] = useState(null);   // null | 'loading' | 'verify' | 'success' | 'failed'
    const [modalMsg, setModalMsg]     = useState('');
    const [successOrderId, setSuccessOrderId] = useState(null);

    const items = cart?.cart?.items || [];

    // ── Prefill from profile ───────────────────────────────────────────────────
    useEffect(() => {
        if (auth?.user) {
            setAddr(a => ({
                ...a,
                fullName: auth.user.name  || '',
                phone:    auth.user.phone || '',
            }));
        }
    }, [auth]);

    // ── Auto delivery estimate ─────────────────────────────────────────────────
    useEffect(() => {
        if (/^\d{6}$/.test(addr.pincode)) {
            getDeliveryEstimateAPI(addr.pincode)
                .then(r => setDelivery(r.data))
                .catch(() => setDelivery(null));
        } else {
            setDelivery(null);
        }
    }, [addr.pincode]);

    // ── Address change handler ─────────────────────────────────────────────────
    const handleAddrChange = (name, value) => {
        setAddr(a => ({ ...a, [name]: value }));
        setErrors(e => ({ ...e, [name]: '' }));
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!addr.fullName.trim())         e.fullName     = 'Full name is required.';
        if (!/^\d{10}$/.test(addr.phone))  e.phone        = 'Enter a valid 10-digit phone number.';
        if (!addr.addressLine1.trim())      e.addressLine1 = 'Address is required.';
        if (!addr.city.trim())              e.city         = 'City is required.';
        if (!addr.state.trim())             e.state        = 'State is required.';
        if (!/^\d{6}$/.test(addr.pincode)) e.pincode      = 'Enter a valid 6-digit pincode.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── COD flow ───────────────────────────────────────────────────────────────
    const handleCOD = async () => {
        setPlacing(true);
        try {
            const result = await placeOrderAPI({
                shippingAddress: addr,
                paymentMethod: 'COD',
            });
            if (result.ok && result.data.success) {
                await fetchCart();
                toast('Order placed successfully! 🎉');
                navigate('/orders/' + result.data.order._id);
            } else {
                const errs = result.data.errors;
                if (Array.isArray(errs)) errs.forEach(e => toast(e, 'error'));
                else toast(result.data.message || 'Could not place order.', 'error');
            }
        } catch {
            toast('Network error. Please try again.', 'error');
        } finally {
            setPlacing(false);
        }
    };

    // ── Razorpay flow ──────────────────────────────────────────────────────────
    const handleRazorpay = async () => {
        // Check Razorpay script is loaded
        if (!window.Razorpay) {
            toast('Payment gateway not loaded. Please refresh the page.', 'error');
            return;
        }

        setPlacing(true);
        setModalStatus('loading');
        setModalMsg('Creating your order…');

        try {
            // Step 1: Create order on backend (reduces stock, saves DB order)
            const res = await createRazorpayOrderAPI({
                shippingAddress: addr,
                paymentMethod: 'Razorpay',
            });

            if (!res.ok || !res.data.success) {
                setModalStatus('failed');
                setModalMsg(res.data.message || 'Could not initiate payment. Please try again.');
                setPlacing(false);
                return;
            }

            const {
                razorpayOrderId,
                orderId,        // our DB order _id
                amount,         // in paise
                keyId,
                prefill,
                estimatedDelivery,
            } = res.data;

            // Close loading modal before opening Razorpay popup
            setModalStatus(null);

            // Step 2: Open Razorpay checkout popup
            const options = {
                key:         keyId,
                amount:      amount,            // paise
                currency:    'INR',
                name:        "Mathi's Secret Organics",
                description: `Order #${orderId?.slice(-8).toUpperCase()}`,
                image:       '',                // optional logo URL
                order_id:    razorpayOrderId,

                prefill: {
                    name:    prefill?.name    || auth?.user?.name    || '',
                    email:   prefill?.email   || auth?.user?.email   || '',
                    contact: prefill?.contact || addr.phone          || '',
                },

                notes: {
                    address:  addr.addressLine1,
                    order_id: orderId,
                },

                theme: {
                    color: '#c2561a',   // your brand color
                },

                // ── Called when payment succeeds ────────────────────────────
                handler: async function (response) {
                    setModalStatus('verify');
                    setModalMsg('Verifying your payment with our server…');

                    try {
                        // Step 3: Verify HMAC signature on backend
                        const verifyRes = await verifyPaymentAPI({
                            razorpayOrderId:   response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            orderId:           orderId,
                        });

                        if (verifyRes.ok && verifyRes.data.success) {
                            await fetchCart();
                            setSuccessOrderId(orderId);
                            setModalStatus('success');
                            setModalMsg(`Payment confirmed! Estimated delivery: ${estimatedDelivery || 'calculated at dispatch'}`);
                        } else {
                            setModalStatus('failed');
                            setModalMsg(verifyRes.data.message || 'Payment verification failed. Contact support with your payment ID: ' + response.razorpay_payment_id);
                        }
                    } catch {
                        setModalStatus('failed');
                        setModalMsg('Verification error. Please contact support with payment ID: ' + response.razorpay_payment_id);
                    }
                },

                // ── Called when user closes popup without paying ────────────
                modal: {
                    ondismiss: function () {
                        toast('Payment cancelled. Your order has been saved — you can retry from My Orders.', 'info');
                        setPlacing(false);
                        // Order exists in DB with paymentStatus: Pending
                        // User can retry — in production you'd show a retry button
                    },
                    confirm_close: true,
                    escape: false,
                },
            };

            const rzp = new window.Razorpay(options);

            // ── Handle payment failures inside the popup ────────────────────
            rzp.on('payment.failed', function (response) {
                setModalStatus('failed');
                setModalMsg(
                    `Payment failed: ${response.error.description}. ` +
                    `Error code: ${response.error.code}`
                );
                setPlacing(false);
            });

            rzp.open();

        } catch (err) {
            setModalStatus('failed');
            setModalMsg('Something went wrong. Please try again.');
            setPlacing(false);
        }
    };

    // ── Modal close handler ────────────────────────────────────────────────────
    const handleModalClose = () => {
        if (modalStatus === 'success' && successOrderId) {
            navigate('/orders/' + successOrderId);
        } else {
            setModalStatus(null);
            setPlacing(false);
        }
    };

    // ── Main place order handler ───────────────────────────────────────────────
    const handlePlace = () => {
        if (!validate()) {
            toast('Please fix the errors below.', 'error');
            return;
        }
        if (items.length === 0) {
            toast('Your cart is empty.', 'error');
            return;
        }
        if (payMethod === 'COD') {
            handleCOD();
        } else {
            handleRazorpay();
        }
    };

    // ── Card style (matches your existing style) ───────────────────────────────
    const cardStyle = {
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 20, padding: 28,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        marginBottom: 20,
    };

    if (cartLoading) {
        return <Layout title="Checkout"><Spinner text="Loading…" /></Layout>;
    }

    return (
        <Layout title="Checkout">
            {/* Payment status modal */}
            <PaymentModal
                status={modalStatus}
                message={modalMsg}
                onClose={handleModalClose}
            />

            <div style={{ padding: '32px 0 80px', margin: '72px 16px 0' }}>
                <div className="container">
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 32 }}>
                        Checkout
                    </h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

                        {/* ── Left: Address + Payment ──────────────────────── */}
                        <div>
                            {/* Address card */}
                            <div style={cardStyle}>
                                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0e8e0' }}>
                                    📍 Delivery Address
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                    <div style={{ gridColumn: '1/-1' }}>
                                        <Field label="Full Name *" name="fullName" placeholder="Recipient's full name"
                                            value={addr.fullName} onChange={handleAddrChange} error={errors.fullName} />
                                    </div>
                                    <Field label="Phone *" name="phone" type="tel" placeholder="10-digit mobile number"
                                        value={addr.phone} onChange={handleAddrChange} error={errors.phone} />
                                    <Field label="Pincode *" name="pincode" placeholder="6-digit pincode"
                                        value={addr.pincode} onChange={handleAddrChange} error={errors.pincode} />
                                    <div style={{ gridColumn: '1/-1' }}>
                                        <Field label="Address Line 1 *" name="addressLine1" placeholder="House/Flat no., Street name"
                                            value={addr.addressLine1} onChange={handleAddrChange} error={errors.addressLine1} />
                                    </div>
                                    <div style={{ gridColumn: '1/-1' }}>
                                        <Field label="Address Line 2 (Optional)" name="addressLine2" placeholder="Landmark, area…"
                                            value={addr.addressLine2} onChange={handleAddrChange} error={errors.addressLine2} />
                                    </div>
                                    <Field label="City *" name="city" placeholder="City"
                                        value={addr.city} onChange={handleAddrChange} error={errors.city} />
                                    <Field label="State *" name="state" placeholder="State"
                                        value={addr.state} onChange={handleAddrChange} error={errors.state} />
                                </div>

                                {/* Delivery estimate */}
                                {delivery && (
                                    <div style={{
                                        padding: '12px 16px', marginTop: 8,
                                        background: 'rgba(240,253,244,0.8)',
                                        borderRadius: 10, border: '1px solid #bbf7d0',
                                    }}>
                                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
                                            🚚 Estimated Delivery: <strong>{delivery.deliveryDate}</strong>
                                        </p>
                                        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{delivery.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment method card */}
                            <div style={cardStyle}>
                                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0e8e0' }}>
                                    💳 Payment Method
                                </h3>

                                {[
                                    {
                                        id: 'COD',
                                        icon: '💵',
                                        label: 'Cash on Delivery',
                                        desc: 'Pay when your order arrives at your door.',
                                        badge: null,
                                    },
                                    {
                                        id: 'Razorpay',
                                        icon: '💳',
                                        label: 'Pay Online (Razorpay)',
                                        desc: 'UPI, Credit/Debit Card, Net Banking, Wallets.',
                                        badge: 'Secure',
                                    },
                                ].map(p => (
                                    <label key={p.id} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 14,
                                        padding: 16, borderRadius: 14, cursor: 'pointer',
                                        marginBottom: 10,
                                        border: payMethod === p.id ? '2px solid var(--brand)' : '1.5px solid #e0d0c4',
                                        background: payMethod === p.id ? 'rgba(194,86,26,0.05)' : 'white',
                                        transition: 'all 0.2s',
                                    }}>
                                        <input
                                            type="radio" name="payment" value={p.id}
                                            checked={payMethod === p.id}
                                            onChange={() => setPayMethod(p.id)}
                                            style={{ accentColor: 'var(--brand)', marginTop: 2 }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.icon} {p.label}</span>
                                                {p.badge && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, color: '#2d7a3a',
                                                        background: 'rgba(45,122,58,0.1)', padding: '2px 8px',
                                                        borderRadius: 10,
                                                    }}>
                                                        {p.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.desc}</div>
                                        </div>
                                    </label>
                                ))}

                                {/* Test mode notice for Razorpay */}
                                {payMethod === 'Razorpay' && (
                                    <div style={{
                                        padding: '10px 14px', marginTop: 4,
                                        background: '#eef7ff', borderRadius: 10,
                                        border: '1px solid #b3d9f5', fontSize: 12,
                                        color: '#1a5c9e', lineHeight: 1.6,
                                    }}>
                                        <strong>Test mode active.</strong> Use card <code>4111 1111 1111 1111</code>,
                                        any future expiry, any CVV. OTP: <code>123456</code>. No real money is deducted.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Right: Order Summary ──────────────────────────── */}
                        <div style={{ ...cardStyle, position: 'sticky', top: 90, marginBottom: 0 }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0e8e0' }}>
                                Order Summary
                            </h3>

                            {items.map(item => (
                                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14 }}>
                                    <span style={{ color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.product?.name || 'Item'} ({item.weight}) ×{item.quantity}
                                    </span>
                                    <span style={{ fontWeight: 600, flexShrink: 0 }}>₹{item.price * item.quantity}</span>
                                </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '7px 0', color: 'var(--muted)' }}>
                                <span>Shipping</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>
                            </div>

                            <div style={{ borderTop: '1px solid #f0e8e0', marginTop: 8, paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                                <span>Total</span>
                                <span>₹{totalPrice}</span>
                            </div>

                            {delivery && (
                                <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginTop: 8 }}>
                                    🚚 Delivery by {delivery.deliveryDate}
                                </p>
                            )}

                            {/* Place order button */}
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: 20, borderRadius: 30, padding: 14, fontSize: 15 }}
                                onClick={handlePlace}
                                disabled={placing || items.length === 0}
                            >
                                {placing ? (
                                    <><span className="spinner" /> Processing…</>
                                ) : payMethod === 'Razorpay' ? (
                                    `Pay ₹${totalPrice} Securely →`
                                ) : (
                                    `Place Order — ₹${totalPrice}`
                                )}
                            </button>

                            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
                                🔒 Your information is secure and encrypted.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}