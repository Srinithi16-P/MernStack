const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        // ─── Core Review Fields ───────────────────────────────────────────
        rating: {
            type: Number,
            required: [true, 'Rating is required.'],
            min: [1, 'Rating must be at least 1.'],
            max: [5, 'Rating cannot exceed 5.'],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Review title cannot exceed 100 characters.'],
            default: '',
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Review description cannot exceed 1000 characters.'],
            default: '',
        },
        // ─── Verified Purchase Flag ───────────────────────────────────────
        // Only users who actually ordered this product can mark as verified
        isVerifiedPurchase: {
            type: Boolean,
            default: false,
        },
        // ─── Helpful Votes ────────────────────────────────────────────────
        // Other users can upvote helpful reviews
        helpfulVotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users',
            },
        ],
        // ─── Admin Moderation ─────────────────────────────────────────────
        isApproved: {
            type: Boolean,
            default: true,   // set to false if you want manual approval
        },
        isDeleted: {
            type: Boolean,
            default: false,  // soft delete
        },
    },
    { timestamps: true }
);

// ─── One review per user per product ─────────────────────────────────────────
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);