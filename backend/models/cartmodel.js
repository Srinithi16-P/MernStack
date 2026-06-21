const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    weight: {
        type: String,
        required: true,   // e.g. "100g", "250g"
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1.'],
        default: 1,
    },
    price: {
        type: Number,
        required: true,   // snapshot of price at time of adding
    },
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true,   // one cart per user
    },
    items: [cartItemSchema],
}, { timestamps: true });

// ─── Virtual: total cart price ────────────────────────────────────────────────
cartSchema.virtual('totalPrice').get(function () {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);