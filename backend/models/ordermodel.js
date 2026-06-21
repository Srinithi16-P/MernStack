const mongoose = require('mongoose');

// ─── Status history entry ─────────────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
}, { _id: false });

// ─── In-app notification entry ────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
}, { _id: true });

// ─── Order item (snapshot of product at time of purchase) ────────────────────
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name:     { type: String, required: true },   // snapshot
    weight:   { type: String, required: true },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: true });

// ─── Main Order schema ────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },

    items: [orderItemSchema],

    // ─── Pricing ──────────────────────────────────────────────────────────
    totalPrice: { type: Number, required: true },

    // ─── Delivery address snapshot ────────────────────────────────────────
    shippingAddress: {
        fullName:     { type: String, required: true },
        phone:        { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: '' },
        city:         { type: String, required: true },
        state:        { type: String, required: true },
        pincode:      { type: String, required: true },
    },

    // ─── Status lifecycle ─────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Placed',
    },
    statusHistory: [statusHistorySchema],

    // ─── Delivery date ────────────────────────────────────────────────────
    estimatedDelivery: { type: Date },
    deliveredAt:       { type: Date },

    // ─── Delivery partner (for tracking) ─────────────────────────────────
    deliveryPartner: {
        name:       { type: String, default: '' },
        trackingId: { type: String, default: '' },
    },

    // ─── Payment ──────────────────────────────────────────────────────────
    paymentMethod: {
        type: String,
        enum: ['COD', 'Razorpay', 'Stripe'],
        default: 'COD',
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
        default: 'Pending',
    },
    razorpayOrderId:   { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },

    // ─── Cancel / Return ──────────────────────────────────────────────────
    cancelReason: { type: String, default: '' },
    returnReason: { type: String, default: '' },
    returnRequestedAt: { type: Date },

    // ─── In-app notifications ─────────────────────────────────────────────
    notifications: [notificationSchema],

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);