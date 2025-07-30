const validator = require('validator');

// Email validation middleware
const validateEmail = (req, res, next) => {
    const { address } = req.params;

    if (!address) {
        return res.status(400).json({
            success: false,
            error: 'Email address is required'
        });
    }

    if (!validator.isEmail(address)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email address format'
        });
    }

    // Check if email is from our domain (optional)
    const emailDomain = process.env.EMAIL_DOMAIN || 'temp-mail.local';
    if (!address.toLowerCase().endsWith(`@${emailDomain}`)) {
        return res.status(400).json({
            success: false,
            error: `Email address must be from domain: ${emailDomain}`
        });
    }

    next();
};

// Request body validation
const validateCreateEmail = (req, res, next) => {
    const { domain } = req.body;

    if (domain && !validator.isFQDN(domain)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid domain format'
        });
    }

    next();
};

// Message validation
const validateMessage = (req, res, next) => {
    const { to, from, subject, body } = req.body;

    if (!to || !from) {
        return res.status(400).json({
            success: false,
            error: 'Both "to" and "from" fields are required'
        });
    }

    if (!validator.isEmail(to)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid "to" email address'
        });
    }

    if (!validator.isEmail(from)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid "from" email address'
        });
    }

    // Optional: Validate subject length
    if (subject && subject.length > 200) {
        return res.status(400).json({
            success: false,
            error: 'Subject line too long (max 200 characters)'
        });
    }

    // Optional: Validate body length
    if (body && body.length > 1000000) { // 1MB limit
        return res.status(400).json({
            success: false,
            error: 'Message body too large (max 1MB)'
        });
    }

    next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (!validator.isInt(page.toString()) || parseInt(page) < 1)) {
        return res.status(400).json({
            success: false,
            error: 'Page must be a positive integer'
        });
    }

    if (limit && (!validator.isInt(limit.toString()) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
        return res.status(400).json({
            success: false,
            error: 'Limit must be between 1 and 100'
        });
    }

    next();
};

// Sanitize input
const sanitizeInput = (req, res, next) => {
    // Recursively sanitize all string inputs
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = validator.escape(obj[key].trim());
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
        sanitizeObject(req.params);
    }

    next();
};

module.exports = {
    validateEmail,
    validateCreateEmail,
    validateMessage,
    validatePagination,
    sanitizeInput
};
