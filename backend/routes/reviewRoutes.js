const express = require('express');
const router  = express.Router();
const {
    createReview,
    getProductReviews,
    getMyReview,
    updateReview,
    deleteReview,
    toggleHelpful,
    adminGetAllReviews,
    adminApproveReview,
} = require('../controllers/reviewController');
const { requireSignIn, isAdmin } = require('../middlewares/authMiddleware');
// ─── Public Routes ────────────────────────────────────────────────────────────
// Get all reviews for a product (with pagination, sorting, star filter)
router.get('/:productId', getProductReviews);

// ─── User Routes (must be logged in) ─────────────────────────────────────────
// Submit a new review
router.post('/:productId',          requireSignIn, createReview);

// Get your own review for a product
router.get('/:productId/mine',      requireSignIn, getMyReview);

// Edit your own review
router.put('/:reviewId',            requireSignIn, updateReview);

// Delete your own review (or admin deletes any)
router.delete('/:reviewId',         requireSignIn, deleteReview);

// Mark a review as helpful (toggle)
router.post('/:reviewId/helpful',   requireSignIn, toggleHelpful);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// Get all reviews for moderation dashboard
router.get('/admin/all',                          requireSignIn, isAdmin, adminGetAllReviews);

// Approve or hide a specific review
router.patch('/admin/:reviewId/approve',          requireSignIn, isAdmin, adminApproveReview);

module.exports = router;