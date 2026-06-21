/*
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};
const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};
module.exports = { hashPassword, comparePassword };
*/
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// ─── PASSWORD HASHING ───────────────────────────────────────────────────────
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// ─── VALIDATION HELPERS ─────────────────────────────────────────────────────

/**
 * Name: Only letters and spaces, trimmed, 2–50 chars
 */
const validateName = (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return 'Name is required.';
    if (!/^[a-zA-Z\s]{2,50}$/.test(trimmed)) return 'Name must be 2–50 characters and contain only letters and spaces.';
    return null;
};

/**
 * Email: Lowercase, no spaces, must end with @gmail.com
 */
const validateEmail = (email) => {
    if (!email) return 'Email is required.';
    if (email !== email.toLowerCase()) return 'Email must be in lowercase.';
    if (/\s/.test(email)) return 'Email must not contain spaces.';
    if (!/^[a-z0-9._%+\-]+@gmail\.com$/.test(email)) return 'Email must be a valid @gmail.com address.';
    return null;
};

/**
 * Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
 */
const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Password must contain at least one special character.';
    if (/\s/.test(password)) return 'Password must not contain spaces.';
    return null;
};

/**
 * Phone: Exactly 10 digits, Tamil Nadu prefixes (6,7,8,9)
 * Tamil Nadu numbers start with 6, 7, 8, or 9
 */
const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required.';
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be exactly 10 digits with no spaces or symbols.';
    if (!/^[6-9]/.test(phone)) return 'Phone number must start with 6, 7, 8, or 9 (valid Indian/Tamil Nadu mobile number).';
    return null;
};

/**
 * Address: Required, 10–200 chars
 */
const validateAddress = (address) => {
    const trimmed = address?.trim();
    if (!trimmed) return 'Address is required.';
    if (trimmed.length < 10) return 'Address must be at least 10 characters.';
    if (trimmed.length > 200) return 'Address must not exceed 200 characters.';
    return null;
};

module.exports = {
    hashPassword,
    comparePassword,
    validateName,
    validateEmail,
    validatePassword,
    validatePhone,
    validateAddress,
};