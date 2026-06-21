// ════ cartRoutes.js ════
const express = require('express');
const router  = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { requireSignIn } = require('../middlewares/authMiddleware');

router.get('/',                      requireSignIn, getCart);
router.post('/add',                  requireSignIn, addToCart);
router.put('/update',                requireSignIn, updateCartItem);
router.delete('/remove/:cartItemId', requireSignIn, removeCartItem);
router.delete('/clear',              requireSignIn, clearCart);

module.exports = router;