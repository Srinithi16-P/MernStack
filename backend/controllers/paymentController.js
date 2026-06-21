const crypto    = require('crypto');
const razorpay  = require('../helpers/razorpayHelper');
const Order     = require('../models/ordermodel');
const Cart      = require('../models/cartmodel');
const Product   = require('../models/productmodel');
const User      = require('../models/usermodel');
const { getExpectedDelivery, formatDate } = require('../helpers/deliveryHelper');
const { sendOrderConfirmationEmail, sendStatusUpdateEmail } = require('../helpers/emailHelper');

// ─── STEP 1: Create Razorpay order + place our DB order ──────────────────────
/*
  POST /api/payment/create-order
  Auth: requireSignIn
  Body: { shippingAddress, paymentMethod: 'Razorpay' }

  Creates both a Razorpay order AND our DB order (status: Placed, paymentStatus: Pending).
  Returns razorpayOrderId + amount to the frontend so it can open the checkout popup.
*/
const createRazorpayOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;
        const userId = req.user._id;

        // ── Validate address ───────────────────────────────────────────────
        const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
        const errors = {};
        required.forEach(field => {
            if (!shippingAddress?.[field] || shippingAddress[field].trim() === '')
                errors[field] = `${field} is required.`;
        });
        if (!/^\d{6}$/.test(shippingAddress?.pincode)) errors.pincode = 'Pincode must be 6 digits.';
        if (Object.keys(errors).length > 0)
            return res.status(422).json({ success: false, message: 'Address validation failed.', errors });

        // ── Load cart ──────────────────────────────────────────────────────
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0)
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });

        // ── Stock check ────────────────────────────────────────────────────
        const stockErrors = [];
        for (const item of cart.items) {
            if (!item.product) { stockErrors.push('A product in your cart no longer exists.'); continue; }
            const variant = item.product.variants.find(v => v.weight === item.weight);
            if (!variant) { stockErrors.push(`Variant "${item.weight}" for "${item.product.name}" unavailable.`); continue; }
            if (variant.stock < item.quantity)
                stockErrors.push(`"${item.product.name} (${item.weight})" has only ${variant.stock} unit(s) left.`);
        }
        if (stockErrors.length > 0)
            return res.status(400).json({ success: false, message: 'Stock issues found.', errors: stockErrors });

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // ── Create Razorpay order ──────────────────────────────────────────
        const rzpOrder = await razorpay.orders.create({
            amount:   Math.round(totalPrice * 100),   // paise
            currency: 'INR',
            receipt:  `rcpt_${Date.now()}`,
            notes:    { userId: userId.toString() },
        });

        // ── Delivery estimate ──────────────────────────────────────────────
        let deliveryInfo;
        try { deliveryInfo = getExpectedDelivery(shippingAddress.pincode); }
        catch (err) { return res.status(400).json({ success: false, message: err.message }); }

        // ── Reduce stock ───────────────────────────────────────────────────
        for (const item of cart.items) {
            const variantIndex = item.product.variants.findIndex(v => v.weight === item.weight);
            item.product.variants[variantIndex].stock -= item.quantity;
            await item.product.save();
        }

        // ── Save DB order (pending payment) ────────────────────────────────
        const orderItems = cart.items.map(item => ({
            product:  item.product._id,
            name:     item.product.name,
            weight:   item.weight,
            price:    item.price,
            quantity: item.quantity,
        }));

        const order = await new Order({
            user:              userId,
            items:             orderItems,
            totalPrice,
            shippingAddress,
            paymentMethod:     'Razorpay',
            paymentStatus:     'Pending',
            razorpayOrderId:   rzpOrder.id,
            estimatedDelivery: deliveryInfo.deliveryDate,
            statusHistory:     [{ status: 'Placed', note: 'Order placed, awaiting payment.' }],
            notifications:     [{ message: 'Your order has been created. Complete payment to confirm.' }],
        }).save();

        // ── Clear cart ─────────────────────────────────────────────────────
        await Cart.findOneAndUpdate({ user: userId }, { items: [] });

        return res.status(201).json({
            success:         true,
            message:         'Razorpay order created. Complete payment.',
            orderId:         order._id,           // our DB order ID
            razorpayOrderId: rzpOrder.id,
            amount:          rzpOrder.amount,      // in paise
            currency:        'INR',
            keyId:           process.env.RAZORPAY_KEY_ID,
            prefill: {
                name:  shippingAddress.fullName,
                email: (await User.findById(userId))?.email || '',
                contact: shippingAddress.phone,
            },
            estimatedDelivery: formatDate(deliveryInfo.deliveryDate),
        });

    } catch (error) {
        console.error('Error in createRazorpayOrder:', error);
        return res.status(500).json({ success: false, message: 'Server error creating payment.' });
    }
};

// ─── STEP 2: Verify payment after Razorpay popup success ─────────────────────
/*
  POST /api/payment/verify
  Auth: requireSignIn
  Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }

  Verifies HMAC signature. If valid → marks order Paid and sends confirmation email.
*/
const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId)
            return res.status(422).json({ success: false, message: 'All payment fields are required.' });

        // ── HMAC signature verification ────────────────────────────────────
        const body     = razorpayOrderId + '|' + razorpayPaymentId;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== razorpaySignature)
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });

        // ── Update order ───────────────────────────────────────────────────
        const order = await Order.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found.' });

        order.paymentStatus      = 'Paid';
        order.razorpayPaymentId  = razorpayPaymentId;
        order.statusHistory.push({ status: 'Placed', note: 'Payment verified successfully.' });
        order.notifications.push({ message: 'Payment confirmed! Your order is being processed.' });
        await order.save();

        // ── Send confirmation email ────────────────────────────────────────
        try {
            const user = await User.findById(order.user);
            const deliveryDate = formatDate(order.estimatedDelivery);
            await sendOrderConfirmationEmail(user, order, deliveryDate);
        } catch (_) {}

        return res.status(200).json({
            success: true,
            message: 'Payment verified! Order confirmed.',
            order,
        });

    } catch (error) {
        console.error('Error in verifyPayment:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying payment.' });
    }
};

// ─── REFUND ───────────────────────────────────────────────────────────────────
/*
  Internal helper — called from cancelOrder and requestReturn in orderController.
  Initiates a Razorpay refund if the order was paid online.
*/
const initiateRefund = async (order) => {
    if (order.paymentMethod !== 'Razorpay' || order.paymentStatus !== 'Paid' || !order.razorpayPaymentId)
        return null;   // COD or unpaid — no refund needed

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(order.totalPrice * 100),   // full refund in paise
        notes:  { orderId: order._id.toString(), reason: order.cancelReason || order.returnReason },
    });

    order.paymentStatus = 'Refunded';
    return refund;
};

// ─── RAZORPAY WEBHOOK ─────────────────────────────────────────────────────────
/*
  POST /api/payment/webhook
  No JWT auth — verified via X-Razorpay-Signature header
  Handles: payment.captured, payment.failed, refund.processed
*/
const razorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body      = JSON.stringify(req.body);

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== signature)
            return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });

        const { event, payload } = req.body;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const order   = await Order.findOne({ razorpayOrderId: payment.order_id }).populate('user', 'name email');
            if (order && order.paymentStatus !== 'Paid') {
                order.paymentStatus     = 'Paid';
                order.razorpayPaymentId = payment.id;
                order.statusHistory.push({ status: order.status, note: 'Payment captured via webhook.' });
                await order.save();
                try { await sendStatusUpdateEmail(order.user, order, 'Placed'); } catch (_) {}
            }
        }

        if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const order   = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (order) {
                order.paymentStatus = 'Failed';
                order.statusHistory.push({ status: order.status, note: 'Payment failed via webhook.' });
                order.notifications.push({ message: 'Your payment failed. Please retry or contact support.' });
                await order.save();
                // Restore stock on failed payment
                for (const item of order.items) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        const vi = product.variants.findIndex(v => v.weight === item.weight);
                        if (vi > -1) { product.variants[vi].stock += item.quantity; await product.save(); }
                    }
                }
            }
        }

        if (event === 'refund.processed') {
            const refund = payload.refund.entity;
            const order  = await Order.findOne({ razorpayPaymentId: refund.payment_id });
            if (order) {
                order.paymentStatus = 'Refunded';
                order.notifications.push({ message: 'Your refund has been processed. It will reflect in 5-7 business days.' });
                await order.save();
            }
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error in razorpayWebhook:', error);
        return res.status(500).json({ success: false, message: 'Webhook processing error.' });
    }
};

module.exports = { createRazorpayOrder, verifyPayment, initiateRefund, razorpayWebhook };