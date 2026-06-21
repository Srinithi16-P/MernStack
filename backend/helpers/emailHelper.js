// ─── emailHelper.js ───────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
    });

// ─── Order Confirmation Email ─────────────────────────────────────────────────
const sendOrderConfirmationEmail = async (user, order, deliveryDate) => {
    const transporter = createTransporter();

    const itemsHTML = order.items.map(item => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name} (${item.weight})</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    await transporter.sendMail({
        from: `"Ecommerce Store" <${process.env.EMAIL_USER}>`,
        to:   user.email,
        subject: `Order Confirmed #${order._id}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#22c55e">✅ Order Confirmed!</h2>
                <p>Hello <strong>${user.name}</strong>, your order has been placed successfully.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">
                    <thead>
                        <tr style="background:#f3f4f6">
                            <th style="padding:8px;text-align:left">Item</th>
                            <th style="padding:8px;text-align:center">Qty</th>
                            <th style="padding:8px;text-align:right">Price</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding:8px;font-weight:bold">Total</td>
                            <td style="padding:8px;text-align:right;font-weight:bold">₹${order.totalPrice}</td>
                        </tr>
                    </tfoot>
                </table>
                <p>🚚 <strong>Estimated Delivery:</strong> ${deliveryDate}</p>
                <p style="color:#888;font-size:13px">Order ID: ${order._id}</p>
            </div>
        `,
    });
};

// ─── Order Status Update Email ────────────────────────────────────────────────
const sendStatusUpdateEmail = async (user, order, newStatus) => {
    const transporter = createTransporter();

    const statusMessages = {
        'Processing':       { emoji: '⚙️', msg: 'Your order is being processed.' },
        'Shipped':          { emoji: '📦', msg: 'Your order has been shipped!' },
        'Out for Delivery': { emoji: '🚚', msg: 'Your order is out for delivery today!' },
        'Delivered':        { emoji: '✅', msg: 'Your order has been delivered. Enjoy!' },
        'Cancelled':        { emoji: '❌', msg: 'Your order has been cancelled.' },
        'Returned':         { emoji: '🔄', msg: 'Your return request has been initiated.' },
    };

    const info = statusMessages[newStatus] || { emoji: 'ℹ️', msg: `Order status updated to ${newStatus}.` };

    await transporter.sendMail({
        from: `"Ecommerce Store" <${process.env.EMAIL_USER}>`,
        to:   user.email,
        subject: `Order Update: ${newStatus} #${order._id}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2>${info.emoji} Order ${newStatus}</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>${info.msg}</p>
                <p style="color:#888;font-size:13px">Order ID: ${order._id}</p>
                ${order.deliveryPartner?.trackingId
                    ? `<p>📍 Tracking ID: <strong>${order.deliveryPartner.trackingId}</strong></p>`
                    : ''}
            </div>
        `,
    });
};

// ─── Cancellation Email ───────────────────────────────────────────────────────
const sendCancellationEmail = async (user, order) => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"Ecommerce Store" <${process.env.EMAIL_USER}>`,
        to:   user.email,
        subject: `Order Cancelled #${order._id}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#ef4444">❌ Order Cancelled</h2>
                <p>Hello <strong>${user.name}</strong>, your order <strong>#${order._id}</strong> has been cancelled.</p>
                ${order.cancelReason ? `<p>Reason: ${order.cancelReason}</p>` : ''}
                <p style="color:#888;font-size:13px">If you paid online, a refund will be processed in 5–7 business days.</p>
            </div>
        `,
    });
};

module.exports = { sendOrderConfirmationEmail, sendStatusUpdateEmail, sendCancellationEmail };