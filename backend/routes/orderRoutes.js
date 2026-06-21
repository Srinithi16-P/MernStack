const express = require('express');
const router  = express.Router();
const {
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
} = require('../controllers/orderController');

const { requireSignIn, isAdmin } = require('../middlewares/authMiddleware');

// ─── Public (webhook secured by secret header, not JWT) ───────────────────────
router.post('/webhook/courier', courierWebhook);
// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/admin/all',                       requireSignIn, isAdmin, adminGetAllOrders);
router.get('/admin/:orderId',                  requireSignIn, isAdmin, adminGetSingleOrder); // ADD THIS
router.patch('/admin/:orderId/status',         requireSignIn, isAdmin, adminUpdateStatus);

// ─── User Routes ──────────────────────────────────────────────────────────────
router.post('/place',                          requireSignIn, placeOrder);
router.get('/my-orders',                       requireSignIn, getMyOrders);
//router.get('/:orderId',                        requireSignIn, getSingleOrder);
router.post('/:orderId/cancel',                requireSignIn, cancelOrder);
router.post('/:orderId/return',                requireSignIn, requestReturn);
router.patch('/:orderId/notifications/read',   requireSignIn, markNotificationsRead);

router.get('/:orderId',                        requireSignIn, getSingleOrder);

module.exports = router;