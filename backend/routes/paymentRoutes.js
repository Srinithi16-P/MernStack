const express = require('express');
const router  = express.Router();
const {
    createRazorpayOrder,
    verifyPayment,
    razorpayWebhook,
} = require('../controllers/paymentController');
const { requireSignIn } = require('../middlewares/authMiddleware');

// Webhook — no JWT, raw body needed for signature check
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Protected routes
router.post('/create-order', requireSignIn, createRazorpayOrder);
router.post('/verify',       requireSignIn, verifyPayment);

module.exports = router;