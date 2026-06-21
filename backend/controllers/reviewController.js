const Review   = require('../models/reviewmodel');
const Product  = require('../models/productmodel');
const Order    = require('../models/ordermodel');   // used to verify purchase

// ─── Helper: recalculate and save avg rating on the product ──────────────────
const syncProductRating = async (productId) => {
    const stats = await Review.aggregate([
        { $match: { product: productId, isDeleted: false, isApproved: true } },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                totalReviews:  { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,   // e.g. 4.3
            totalReviews:  stats[0].totalReviews,
        });
    } else {
        // No reviews left — reset
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            totalReviews:  0,
        });
    }
};

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
/*
  POST /api/review/:productId
  Auth: requireSignIn
  Body: { rating, title?, description? }
*/
const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;
        const { rating, title, description } = req.body;

        // ── Validate ──────────────────────────────────────────────────────
        const errors = {};
        if (!rating)                                errors.rating = 'Rating is required.';
        else if (rating < 1 || rating > 5)          errors.rating = 'Rating must be between 1 and 5.';
        if (description && description.length > 1000) errors.description = 'Description too long (max 1000 chars).';
        if (title && title.length > 100)              errors.title = 'Title too long (max 100 chars).';
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Validation failed.', errors });
        }

        // ── Product must exist ─────────────────────────────────────────────
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // ── Check for duplicate review (unique index will also catch this) ─
        const existing = await Review.findOne({ product: productId, user: userId, isDeleted: false });
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product. You can edit your existing review.' });
        }

        // ── Check if user is a verified buyer ─────────────────────────────
        // Looks for any delivered order containing this product
        let isVerifiedPurchase = false;
        try {
            const order = await Order.findOne({
                user:   userId,
                status: 'Delivered',
                'items.product': productId,
            });
            isVerifiedPurchase = !!order;
        } catch (_) {
            // Order model may not exist yet — skip gracefully
        }

        // ── Save review ───────────────────────────────────────────────────
        const review = await new Review({
            product:            productId,
            user:               userId,
            rating:             Number(rating),
            title:              title?.trim()       || '',
            description:        description?.trim() || '',
            isVerifiedPurchase,
        }).save();

        // ── Update product's avg rating ───────────────────────────────────
        await syncProductRating(product._id);

        const populated = await review.populate('user', 'name email');

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully!',
            review:  populated,
        });

    } catch (error) {
        // Mongoose duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
        }
        console.error('Error in createReview:', error);
        return res.status(500).json({ success: false, message: 'Server error while submitting review.' });
    }
};

// ─── GET ALL REVIEWS FOR A PRODUCT ───────────────────────────────────────────
/*
  GET /api/review/:productId?page=1&limit=10&sort=newest|helpful|rating_high|rating_low&rating=5
  Public
*/
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page   = parseInt(req.query.page)   || 1;
        const limit  = parseInt(req.query.limit)  || 10;
        const sort   = req.query.sort             || 'newest';
        const ratingFilter = req.query.rating;       // optional: filter by star (1-5)

        const query = {
            product:   productId,
            isDeleted: false,
            isApproved: true,
        };
        if (ratingFilter) query.rating = Number(ratingFilter);

        // Sort options
        const sortMap = {
            newest:      { createdAt: -1 },
            oldest:      { createdAt:  1 },
            helpful:     { helpfulVotes: -1 },   // most votes first (array length)
            rating_high: { rating: -1 },
            rating_low:  { rating:  1 },
        };
        const sortOption = sortMap[sort] || sortMap.newest;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('user', 'name'),
            Review.countDocuments(query),
        ]);

        // ── Rating breakdown (1★ to 5★ counts) ──────────────────────────
        const breakdown = await Review.aggregate([
            { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId), isDeleted: false, isApproved: true } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ]);

        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        breakdown.forEach(b => { ratingBreakdown[b._id] = b.count; });

        return res.status(200).json({
            success: true,
            total,
            page,
            pages:           Math.ceil(total / limit),
            ratingBreakdown,
            reviews,
        });

    } catch (error) {
        console.error('Error in getProductReviews:', error);
        return res.status(500).json({ success: false, message: 'Server error while fetching reviews.' });
    }
};

// ─── GET LOGGED-IN USER'S OWN REVIEW FOR A PRODUCT ───────────────────────────
/*
  GET /api/review/:productId/mine
  Auth: requireSignIn
*/
const getMyReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            product:   req.params.productId,
            user:      req.user._id,
            isDeleted: false,
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'You have not reviewed this product yet.' });
        }

        return res.status(200).json({ success: true, review });

    } catch (error) {
        console.error('Error in getMyReview:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── UPDATE REVIEW ────────────────────────────────────────────────────────────
/*
  PUT /api/review/:reviewId
  Auth: requireSignIn (owner only)
  Body: { rating?, title?, description? }
*/
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, description } = req.body;

        const review = await Review.findOne({ _id: reviewId, isDeleted: false });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Only the review owner can edit
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only edit your own reviews.' });
        }

        // Validate updated fields
        const errors = {};
        if (rating !== undefined && (rating < 1 || rating > 5)) errors.rating = 'Rating must be between 1 and 5.';
        if (description && description.length > 1000) errors.description = 'Description too long (max 1000 chars).';
        if (title && title.length > 100)              errors.title = 'Title too long (max 100 chars).';
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Validation failed.', errors });
        }

        if (rating !== undefined) review.rating      = Number(rating);
        if (title !== undefined)  review.title       = title.trim();
        if (description !== undefined) review.description = description.trim();

        await review.save();
        await syncProductRating(review.product);

        return res.status(200).json({ success: true, message: 'Review updated successfully!', review });

    } catch (error) {
        console.error('Error in updateReview:', error);
        return res.status(500).json({ success: false, message: 'Server error while updating review.' });
    }
};

// ─── DELETE REVIEW (Soft Delete) ──────────────────────────────────────────────
/*
  DELETE /api/review/:reviewId
  Auth: requireSignIn (owner or admin)
*/
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findOne({ _id: reviewId, isDeleted: false });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Allow owner or admin (role === 1)
        const isOwner = review.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 1;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
        }

        review.isDeleted = true;
        await review.save();
        await syncProductRating(review.product);

        return res.status(200).json({ success: true, message: 'Review deleted successfully.' });

    } catch (error) {
        console.error('Error in deleteReview:', error);
        return res.status(500).json({ success: false, message: 'Server error while deleting review.' });
    }
};

// ─── TOGGLE HELPFUL VOTE ──────────────────────────────────────────────────────
/*
  POST /api/review/:reviewId/helpful
  Auth: requireSignIn
  Toggles: adds vote if not voted, removes if already voted
*/
const toggleHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id.toString();

        const review = await Review.findOne({ _id: reviewId, isDeleted: false });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Cannot vote on your own review
        if (review.user.toString() === userId) {
            return res.status(400).json({ success: false, message: 'You cannot vote on your own review.' });
        }

        const alreadyVoted = review.helpfulVotes.map(id => id.toString()).includes(userId);

        if (alreadyVoted) {
            review.helpfulVotes = review.helpfulVotes.filter(id => id.toString() !== userId);
        } else {
            review.helpfulVotes.push(req.user._id);
        }

        await review.save();

        return res.status(200).json({
            success:      true,
            message:      alreadyVoted ? 'Vote removed.' : 'Marked as helpful!',
            helpfulCount: review.helpfulVotes.length,
            voted:        !alreadyVoted,
        });

    } catch (error) {
        console.error('Error in toggleHelpful:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── ADMIN: GET ALL REVIEWS (moderation) ─────────────────────────────────────
/*
  GET /api/review/admin/all?page=1&limit=20&approved=true|false
  Auth: requireSignIn + isAdmin
*/
const adminGetAllReviews = async (req, res) => {
    try {
        const page     = parseInt(req.query.page)  || 1;
        const limit    = parseInt(req.query.limit) || 20;
        const approved = req.query.approved;

        const query = { isDeleted: false };
        if (approved !== undefined) query.isApproved = approved === 'true';

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('user', 'name email')
                .populate('product', 'name'),
            Review.countDocuments(query),
        ]);

        return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), reviews });

    } catch (error) {
        console.error('Error in adminGetAllReviews:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── ADMIN: APPROVE / REJECT REVIEW ──────────────────────────────────────────
/*
  PATCH /api/review/admin/:reviewId/approve
  Auth: requireSignIn + isAdmin
  Body: { isApproved: true | false }
*/
const adminApproveReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { isApproved } = req.body;

        if (typeof isApproved !== 'boolean') {
            return res.status(422).json({ success: false, message: 'isApproved must be true or false.' });
        }

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isApproved },
            { new: true }
        ).populate('user', 'name').populate('product', 'name');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        await syncProductRating(review.product._id);

        return res.status(200).json({
            success: true,
            message: isApproved ? 'Review approved.' : 'Review hidden.',
            review,
        });

    } catch (error) {
        console.error('Error in adminApproveReview:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    getMyReview,
    updateReview,
    deleteReview,
    toggleHelpful,
    adminGetAllReviews,
    adminApproveReview,
};