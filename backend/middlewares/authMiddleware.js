const JWT = require('jsonwebtoken');
const usermodel = require('../models/usermodel');

// ─── REQUIRE SIGN IN ─────────────────────────────────────────────────────────
const requireSignIn = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is missing.',
            });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.',
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.',
            });
        }
        console.error('Error in requireSignIn:', error);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access.',
        });
    }
};

// ─── IS ADMIN ─────────────────────────────────────────────────────────────────
const isAdmin = async (req, res, next) => {
    try {
        const user = await usermodel.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (user.role !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        next();

    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

module.exports = { requireSignIn, isAdmin };