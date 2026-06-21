/*
const usermodel = require('../models/usermodel');
const JWT = require('jsonwebtoken');
const {
    hashPassword,
    comparePassword,
    validateName,
    validateEmail,
    validatePassword,
    validatePhone,
    validateAddress,
} = require('../helpers/authHelper');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // ── Step 1: Collect ALL validation errors at once (real-time UX) ──
        const errors = {};

        const nameErr    = validateName(name);
        const emailErr   = validateEmail(email);
        const passErr    = validatePassword(password);
        const phoneErr   = validatePhone(phone);
        const addressErr = validateAddress(address);

        if (nameErr)    errors.name    = nameErr;
        if (emailErr)   errors.email   = emailErr;
        if (passErr)    errors.password = passErr;
        if (phoneErr)   errors.phone   = phoneErr;
        if (addressErr) errors.address = addressErr;

        // If any field-level error exists, return ALL errors at once
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Validation failed. Please fix the errors below.',
                errors,
            });
        }

        // ── Step 2: Duplicate checks (DB lookups) ──
        const existingEmail = await usermodel.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered. Please login.',
                errors: { email: 'Email already in use.' },
            });
        }

        const existingPhone = await usermodel.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: 'This phone number is already registered.',
                errors: { phone: 'Phone number already in use.' },
            });
        }

        // ── Step 3: Save user ──
        const hashedPassword = await hashPassword(password);
        const user = await new usermodel({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone,
            address: address.trim(),
        }).save();

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to our store.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Error in registerController:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again.',
        });
    }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        const errors = {};

        // Basic presence check first
        if (!email || email.toString().trim() === '') {
            errors.email = 'Email is required.';
        }
        if (!password || password.toString().trim() === '') {
            errors.password = 'Password is required.';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Please fill in all required fields.',
                errors,
            });
        }

        // Email format check for login
        const emailErr = validateEmail(email);
        if (emailErr) {
            return res.status(422).json({
                success: false,
                message: 'Invalid email format.',
                errors: { email: emailErr },
            });
        }

        // DB lookup
        const user = await usermodel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email.',
                errors: { email: 'Email not registered.' },
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please try again.',
                errors: { password: 'Invalid password.' },
            });
        }

        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            success: true,
            message: 'Login successful! Welcome back.',
            token,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Error in loginController:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again.',
        });
    }
};

// ─── TEST (Protected) ────────────────────────────────────────────────────────
const testController = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Protected Route Accessed',
            userId: req.user._id,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { registerController, loginController, testController };
*/
const usermodel = require('../models/usermodel');
const JWT = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
    hashPassword,
    comparePassword,
    validateName,
    validateEmail,
    validatePassword,
    validatePhone,
    validateAddress,
} = require('../helpers/authHelper');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const errors = {};
        const nameErr    = validateName(name);
        const emailErr   = validateEmail(email);
        const passErr    = validatePassword(password);
        const phoneErr   = validatePhone(phone);
        const addressErr = validateAddress(address);
        if (nameErr)    errors.name     = nameErr;
        if (emailErr)   errors.email    = emailErr;
        if (passErr)    errors.password = passErr;
        if (phoneErr)   errors.phone    = phoneErr;
        if (addressErr) errors.address  = addressErr;
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Validation failed.', errors });
        }
        const existingEmail = await usermodel.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email already registered.', errors: { email: 'Email already in use.' } });
        }
        const existingPhone = await usermodel.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({ success: false, message: 'Phone already registered.', errors: { phone: 'Phone number already in use.' } });
        }
        const hashedPassword = await hashPassword(password);
        const user = await new usermodel({
            name: name.trim(), email: email.toLowerCase().trim(),
            password: hashedPassword, phone, address: address.trim(),
        }).save();
        return res.status(201).json({
            success: true, message: 'Registration successful!',
            user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
        });
    } catch (error) {
        console.error('Error in registerController:', error);
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = {};
        if (!email || email.toString().trim() === '') errors.email = 'Email is required.';
        if (!password || password.toString().trim() === '') errors.password = 'Password is required.';
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Please fill all fields.', errors });
        }
        const emailErr = validateEmail(email);
        if (emailErr) return res.status(422).json({ success: false, message: 'Invalid email format.', errors: { email: emailErr } });
        const user = await usermodel.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ success: false, message: 'Email not registered.', errors: { email: 'Email not registered.' } });
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password.', errors: { password: 'Invalid password.' } });
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
            success: true, message: 'Login successful!', token,
            user: { name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
        });
    } catch (error) {
        console.error('Error in loginController:', error);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
/*
  1. User submits their email from the frontend "Forgot Password" page
  2. Server generates rawToken → hashes it → saves hashedToken + 10-min expiry to DB
  3. Sends email with link: FRONTEND_URL/reset-password.html?token=<rawToken>
  4. User clicks link → lands on reset-password.html (the new frontend page)
*/
const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || email.trim() === '') {
            return res.status(422).json({ success: false, message: 'Email is required.', errors: { email: 'Email is required.' } });
        }
        const emailErr = validateEmail(email);
        if (emailErr) return res.status(422).json({ success: false, message: 'Invalid email.', errors: { email: emailErr } });

        const user = await usermodel.findOne({ email: email.toLowerCase().trim() });

        // Security: always return same message whether email exists or not
        // This prevents attackers from knowing which emails are registered
        if (!user) {
            return res.status(200).json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
        }

        // Generate raw token (sent to user in email link) and hashed token (stored in DB)
        const rawToken    = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Save hashed token + expiry to DB
        user.resetPasswordToken  = hashedToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // The link points to your FRONTEND page (not the API), with rawToken as a query param
        const resetURL = `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;
       console.log("RESET TOKEN:", rawToken);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,   // Use Gmail App Password, not your real password
            },
            tls: {
        rejectUnauthorized: false   // 🔥 FIX FOR YOUR ERROR
       }
        });

        await transporter.sendMail({
            from: `"Ecommerce Store" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                    <h2 style="color:#333">Password Reset Request</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Someone requested a password reset for your account. Click the button below to set a new password:</p>
                    <a href="${resetURL}"
                       style="display:inline-block;padding:12px 28px;background:#e53e3e;color:#fff;
                              text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0">
                        Reset My Password
                    </a>
                    <p style="color:#888;font-size:13px">
                        This link expires in <strong>10 minutes</strong>.<br/>
                        If you did not request this, you can safely ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
                    <p style="color:#aaa;font-size:11px">Or copy this link:<br/><a href="${resetURL}">${resetURL}</a></p>
                </div>
            `,
        });

        return res.status(200).json({ success: true, message: 'If this email is registered, a reset link has been sent.' });

    } catch (error) {
        console.error('Error in forgotPasswordController:', error);
        // Clean up any partial token save so user can retry
        try {
            const user = await usermodel.findOne({ email: req.body.email?.toLowerCase().trim() });
            if (user) { user.resetPasswordToken = null; user.resetPasswordExpire = null; await user.save(); }
        } catch (_) {}
        return res.status(500).json({ success: false, message: 'Could not send reset email. Please try again.' });
    }
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
/*
  1. User lands on reset-password.html → types new password → form submits here
  2. token comes from the URL query param (?token=xxx) — sent by the frontend page
  3. Server hashes token → looks up DB → verifies not expired
  4. Updates password, clears reset fields
*/
const resetPasswordController = async (req, res) => {
    try {
        const { token } = req.params;               // raw token from URL
        const { password, confirmPassword } = req.body;

        if (!token) return res.status(400).json({ success: false, message: 'Reset token is missing.' });

        const errors = {};
        if (!password)        errors.password        = 'New password is required.';
        if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: 'Please fill all fields.', errors });
        }

        if (password !== confirmPassword) {
            return res.status(422).json({ success: false, message: 'Passwords do not match.', errors: { confirmPassword: 'Passwords do not match.' } });
        }

        const passErr = validatePassword(password);
        if (passErr) return res.status(422).json({ success: false, message: 'Password too weak.', errors: { password: passErr } });

        // Hash the raw token from URL and look up the user in DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await usermodel.findOne({
            resetPasswordToken:  hashedToken,
            resetPasswordExpire: { $gt: Date.now() },   // must not be expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Please request a new one.' });
        }

        // Save new hashed password and clear reset fields from DB
        user.password            = await hashPassword(password);
        user.resetPasswordToken  = null;
        user.resetPasswordExpire = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successful! You can now login with your new password.' });

    } catch (error) {
        console.error('Error in resetPasswordController:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ─── TEST (Protected) ────────────────────────────────────────────────────────
const testController = (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Protected Route Accessed', userId: req.user._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { registerController, loginController, testController, forgotPasswordController, resetPasswordController };