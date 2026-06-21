/*
const express = require('express');
const router = express.Router();
const { registerController, loginController, testController } = require('../controllers/authController');
const { requireSignIn, isAdmin } = require('../middlewares/authMiddleware');
router.post('/register', registerController);
//login post
router.post('/login', loginController);
//test routes
router.get('/test', requireSignIn, isAdmin, testController);
module.exports = router;
*/
const express = require('express');
const router  = express.Router();

const {
    registerController,
    loginController,
    testController,
    forgotPasswordController,
    resetPasswordController,
} = require('../controllers/authController');

const { requireSignIn, isAdmin } = require('../middlewares/authMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register',              registerController);
router.post('/login',                 loginController);
router.post('/forgot-password',       forgotPasswordController);    // Step 1: send reset email
router.post('/reset-password/:token', resetPasswordController);     // Step 2: save new password

// ─── Protected Route (Admin only) ────────────────────────────────────────────
router.get('/test', requireSignIn, isAdmin, testController);

module.exports = router;