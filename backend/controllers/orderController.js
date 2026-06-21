// ─── orderController.js ───────────────────────────────────────────────────────
const Order   = require('../models/ordermodel');
const Cart    = require('../models/cartmodel');
const Product = require('../models/productmodel');
const User    = require('../models/usermodel');
const { getExpectedDelivery, formatDate } = require('../helpers/deliveryHelper');
const { sendOrderConfirmationEmail, sendStatusUpdateEmail, sendCancellationEmail } = require('../helpers/emailHelper');

// ─── STATUS FLOW RULES ────────────────────────────────────────────────────────
const ADMIN_STATUS_FLOW = {
    'Placed':           'Processing',
    'Processing':       'Shipped',
    'Shipped':          'Out for Delivery',
    'Out for Delivery': 'Delivered',
};

const CANCELLABLE_STATUSES  = ['Placed', 'Processing'];
const RETURNABLE_STATUSES   = ['Delivered'];

// ─── PLACE ORDER ──────────────────────────────────────────────────────────────
/*
  POST /api/order/place
  Auth: requireSignIn
  Body: { shippingAddress: { fullName, phone, addressLine1, addressLine2, city, state, pincode }, paymentMethod }

  Flow:
  1. Load cart
  2. Validate stock for every item
  3. Reduce stock
  4. Calculate delivery date
  5. Create order
  6. Clear cart
  7. Send email
*/
const placeOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod = 'COD' } = req.body;
        const userId = req.user._id;

        // ── Validate address ───────────────────────────────────────────────
        const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
        const errors = {};
        required.forEach(field => {
            if (!shippingAddress?.[field] || shippingAddress[field].trim() === '') {
                errors[field] = `${field} is required.`;
            }
        });
        if (!/^\d{6}$/.test(shippingAddress?.pincode)) errors.pincode = 'Pincode must be 6 digits.';
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Address validation failed.', errors });
        }

        // ── Load cart ──────────────────────────────────────────────────────
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });
        }

        // ── Validate stock for every item (double check) ───────────────────
        const stockErrors = [];
        for (const item of cart.items) {
            const product = item.product;
            if (!product) {
                stockErrors.push(`A product in your cart no longer exists.`);
                continue;
            }
            const variant = product.variants.find(v => v.weight === item.weight);
            if (!variant) {
                stockErrors.push(`Variant "${item.weight}" for "${product.name}" is no longer available.`);
                continue;
            }
            if (variant.stock < item.quantity) {
                stockErrors.push(`"${product.name} (${item.weight})" has only ${variant.stock} unit(s) left (you need ${item.quantity}).`);
            }
        }

        if (stockErrors.length > 0) {
            return res.status(400).json({ success: false, message: 'Stock issues found.', errors: stockErrors });
        }

        // ── Reduce stock for each item ─────────────────────────────────────
        for (const item of cart.items) {
            const product = item.product;
            const variantIndex = product.variants.findIndex(v => v.weight === item.weight);
            product.variants[variantIndex].stock -= item.quantity;
            await product.save();
        }

        // ── Calculate total price ──────────────────────────────────────────
        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // ── Calculate delivery date ────────────────────────────────────────
        let deliveryInfo;
        try {
            deliveryInfo = getExpectedDelivery(shippingAddress.pincode);
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        // ── Build order items snapshot ─────────────────────────────────────
        const orderItems = cart.items.map(item => ({
            product:  item.product._id,
            name:     item.product.name,
            weight:   item.weight,
            price:    item.price,
            quantity: item.quantity,
        }));

        // ── Create order ───────────────────────────────────────────────────
        const order = await new Order({
            user:            userId,
            items:           orderItems,
            totalPrice,
            shippingAddress,
            paymentMethod,
            paymentStatus:   paymentMethod === 'COD' ? 'Pending' : 'Pending',
            estimatedDelivery: deliveryInfo.deliveryDate,
            statusHistory:   [{ status: 'Placed', note: 'Order placed by customer.' }],
            notifications:   [{ message: 'Your order has been placed successfully!' }],
        }).save();

        // ── Clear cart ─────────────────────────────────────────────────────
        await Cart.findOneAndUpdate({ user: userId }, { items: [] });

        // ── Send confirmation email (non-blocking) ─────────────────────────
        try {
            const user = await User.findById(userId);
            await sendOrderConfirmationEmail(user, order, formatDate(deliveryInfo.deliveryDate));
        } catch (emailErr) {
            console.error('Order email failed (non-critical):', emailErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order,
            estimatedDelivery: formatDate(deliveryInfo.deliveryDate),
            deliveryNote:      deliveryInfo.note,
        });

    } catch (error) {
        console.error('Error in placeOrder:', error);
        return res.status(500).json({ success: false, message: 'Server error while placing order.' });
    }
};

// ─── GET MY ORDERS (user) ─────────────────────────────────────────────────────
/*
  GET /api/order/my-orders?page=1&limit=10
  Auth: requireSignIn
*/
const getMyOrders = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;

        const [orders, total] = await Promise.all([
            Order.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('items.product', 'name photo'),
            Order.countDocuments({ user: req.user._id }),
        ]);

        return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), orders });

    } catch (error) {
        console.error('Error in getMyOrders:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
/*
  GET /api/order/:orderId
  Auth: requireSignIn (owner or admin)
*/
const getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('items.product', 'name photo');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Only owner or admin can view
        const isOwner = order.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 1;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        return res.status(200).json({ success: true, order });

    } catch (error) {
        console.error('Error in getSingleOrder:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── CANCEL ORDER (user) ──────────────────────────────────────────────────────
/*
  POST /api/order/:orderId/cancel
  Auth: requireSignIn
  Body: { reason? }
  Rule: Only before "Shipped"
*/
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (!CANCELLABLE_STATUSES.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled. Current status: "${order.status}". Cancellation is only allowed before shipping.`,
            });
        }

        // ── Restore stock ──────────────────────────────────────────────────
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const variantIndex = product.variants.findIndex(v => v.weight === item.weight);
                if (variantIndex > -1) {
                    product.variants[variantIndex].stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.status       = 'Cancelled';
        order.cancelReason = req.body.reason || '';
        order.statusHistory.push({ status: 'Cancelled', note: req.body.reason || 'Cancelled by customer.' });
        order.notifications.push({ message: 'Your order has been cancelled.' });
        await order.save();

        // Send cancellation email (non-blocking)
        try {
            const user = await User.findById(req.user._id);
            await sendCancellationEmail(user, order);
        } catch (_) {}

        return res.status(200).json({ success: true, message: 'Order cancelled successfully. Stock has been restored.', order });

    } catch (error) {
        console.error('Error in cancelOrder:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── REQUEST RETURN (user) ────────────────────────────────────────────────────
/*
  POST /api/order/:orderId/return
  Auth: requireSignIn
  Body: { reason }
  Rule: Only after "Delivered"
*/
const requestReturn = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            return res.status(422).json({ success: false, message: 'Return reason is required.' });
        }

        const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (!RETURNABLE_STATUSES.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Return can only be requested for delivered orders. Current status: "${order.status}".`,
            });
        }

        order.status             = 'Returned';
        order.returnReason       = reason.trim();
        order.returnRequestedAt  = new Date();
        order.statusHistory.push({ status: 'Returned', note: `Return requested: ${reason}` });
        order.notifications.push({ message: 'Your return request has been submitted. Refund will be processed in 5–7 days.' });
        await order.save();

        return res.status(200).json({ success: true, message: 'Return request submitted successfully.', order });

    } catch (error) {
        console.error('Error in requestReturn:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── ADMIN: GET ALL ORDERS ────────────────────────────────────────────────────
/*
  GET /api/order/admin/all?page=1&limit=20&status=Placed
  Auth: requireSignIn + isAdmin
*/
const adminGetAllOrders = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 20;
        const status = req.query.status;

        const query = status ? { status } : {};

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('user', 'name email phone')
                .populate('items.product', 'name'),
            Order.countDocuments(query),
        ]);

        return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), orders });

    } catch (error) {
        console.error('Error in adminGetAllOrders:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── ADMIN: UPDATE ORDER STATUS ───────────────────────────────────────────────
/*
  PATCH /api/order/admin/:orderId/status
  Auth: requireSignIn + isAdmin
  Body: { note?, trackingId?, partnerName? }

  Flow is fixed: Placed → Processing → Shipped → Out for Delivery → Delivered
*/
const adminGetSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email phone role')
      .populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const adminUpdateStatus = async (req, res) => {
    try {
        const { note = '', trackingId = '', partnerName = '' } = req.body;

        const order = await Order.findById(req.params.orderId).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const nextStatus = ADMIN_STATUS_FLOW[order.status];
        if (!nextStatus) {
            return res.status(400).json({
                success: false,
                message: `Order is already at final status: "${order.status}". No further updates possible.`,
            });
        }

        order.status = nextStatus;
        order.statusHistory.push({ status: nextStatus, note: note || `Status updated to ${nextStatus} by admin.` });
        order.notifications.push({ message: `Your order status has been updated to: ${nextStatus}.` });

        // Mark delivered timestamp
        if (nextStatus === 'Delivered') {
            order.deliveredAt      = new Date();
            order.paymentStatus    = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
        }

        // Save tracking info if provided
        if (trackingId) order.deliveryPartner.trackingId = trackingId;
        if (partnerName) order.deliveryPartner.name      = partnerName;

        await order.save();

        // Send status email (non-blocking)
        try {
            await sendStatusUpdateEmail(order.user, order, nextStatus);
        } catch (_) {}

        return res.status(200).json({
            success: true,
            message: `Order status updated to "${nextStatus}".`,
            order,
        });

    } catch (error) {
        console.error('Error in adminUpdateStatus:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── MARK NOTIFICATIONS AS READ (user) ───────────────────────────────────────
/*
  PATCH /api/order/:orderId/notifications/read
  Auth: requireSignIn
*/
const markNotificationsRead = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        order.notifications.forEach(n => { n.isRead = true; });
        await order.save();

        return res.status(200).json({ success: true, message: 'Notifications marked as read.' });

    } catch (error) {
        console.error('Error in markNotificationsRead:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── COURIER WEBHOOK (simulate or real courier integration) ───────────────────
/*
  POST /api/order/webhook/courier
  No auth — secured by secret header
  Body: { trackingId, status }

  Used by courier (e.g. Shiprocket/Delhivery) to auto-update order status
  Also can be triggered via Postman to simulate real tracking
*/
const courierWebhook = async (req, res) => {
    try {
        // Basic secret check (set WEBHOOK_SECRET in .env)
        const secret = req.headers['x-webhook-secret'];
        if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
            return res.status(401).json({ success: false, message: 'Unauthorized webhook.' });
        }

        const { trackingId, status } = req.body;
        if (!trackingId || !status) {
            return res.status(422).json({ success: false, message: 'trackingId and status are required.' });
        }

        // Map courier statuses to your system's statuses
        const statusMap = {
            'Manifested':        'Shipped',
            'In Transit':        'Shipped',
            'Out for Delivery':  'Out for Delivery',
            'Delivered':         'Delivered',
        };

        const mappedStatus = statusMap[status] || status;

        const order = await Order.findOne({ 'deliveryPartner.trackingId': trackingId }).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: 'No order found for this tracking ID.' });
        }

        order.status = mappedStatus;
        order.statusHistory.push({ status: mappedStatus, note: `Auto-updated via courier webhook. Raw status: "${status}"` });
        order.notifications.push({ message: `Your order is now: ${mappedStatus}` });

        if (mappedStatus === 'Delivered') {
            order.deliveredAt   = new Date();
            order.paymentStatus = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
        }

        await order.save();

        // Real-time socket emit (if Socket.io is set up)
        if (req.app.get('io')) {
            req.app.get('io').emit('orderUpdate', { orderId: order._id, status: mappedStatus });
        }

        // Email notification
        try {
            await sendStatusUpdateEmail(order.user, order, mappedStatus);
        } catch (_) {}

        return res.status(200).json({ success: true, message: `Order updated to "${mappedStatus}".` });

    } catch (error) {
        console.error('Error in courierWebhook:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    requestReturn,
    adminGetAllOrders,
    adminGetSingleOrder,
    adminUpdateStatus,
    markNotificationsRead,
    courierWebhook,
};
