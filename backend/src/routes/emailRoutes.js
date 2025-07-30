const express = require('express');
const router = express.Router();
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');
const { validateEmail } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const smtpEmailService = require('../services/smtpEmailService');

// POST /api/email/new - Generate new temporary email
router.post('/new', asyncHandler(async (req, res) => {
    try {
        // Generate unique email address
        const { address, localPart, domain } = await TempEmail.generateUniqueAddress();

        // Calculate expiration time
        const expiryHours = parseInt(process.env.EMAIL_EXPIRY_HOURS) || 1;
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        // Create new temporary email
        const tempEmail = new TempEmail({
            address,
            localPart,
            domain,
            expiresAt
        });

        await tempEmail.save();

        res.status(201).json({
            success: true,
            data: {
                address: tempEmail.address,
                domain: tempEmail.domain,
                createdAt: tempEmail.createdAt,
                expiresAt: tempEmail.expiresAt,
                timeRemaining: tempEmail.getTimeRemaining()
            }
        });
    } catch (error) {
        console.error('Error generating new email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate new email address'
        });
    }
}));

// POST /api/email/test-mock - Simple test mock endpoint (no validation)
router.post('/test-mock', asyncHandler(async (req, res) => {
    console.log('Test mock endpoint hit:', req.body);
    res.json({
        success: true,
        message: 'Test mock endpoint working',
        body: req.body
    });
}));

// POST /api/email/:address/mock-message - Add mock message for testing
router.post('/:address/mock-message', asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { from, subject, body } = req.body;

    console.log('Mock email request:', { address, body: req.body });

    // Simple validation without strict middleware
    if (!address || !address.includes('@')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email address format'
        });
    }

    // Check if email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        console.log('Email not found:', address);
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    if (tempEmail.isExpired()) {
        console.log('Email expired:', address);
        return res.status(410).json({
            success: false,
            error: 'Email address has expired'
        });
    }

    // Create mock message with default values
    const mockMessage = new EmailMessage({
        messageId: EmailMessage.generateMessageId(), // Explicitly generate messageId
        tempEmailId: tempEmail._id,
        emailAddress: address.toLowerCase(),
        from: from || 'test@example.com',
        to: address,
        subject: subject || 'Test Email',
        body: body || 'This is a test email message.',
        bodyText: body || 'This is a test email message.',
        source: 'mock',
        receivedAt: new Date()
    });

    await mockMessage.save();
    console.log('Mock email created:', mockMessage.messageId);

    res.status(201).json({
        success: true,
        data: {
            messageId: mockMessage.messageId,
            from: mockMessage.from,
            subject: mockMessage.subject,
            receivedAt: mockMessage.receivedAt
        }
    });
}));

// GET /api/email/:address - Get email details and time remaining
router.get('/:address', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;

    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    if (tempEmail.isExpired()) {
        // Mark as inactive and clean up
        tempEmail.isActive = false;
        await tempEmail.save();

        return res.status(410).json({
            success: false,
            error: 'Email address has expired'
        });
    }

    // Update last accessed time
    await tempEmail.updateLastAccessed();

    res.json({
        success: true,
        data: {
            address: tempEmail.address,
            domain: tempEmail.domain,
            createdAt: tempEmail.createdAt,
            expiresAt: tempEmail.expiresAt,
            timeRemaining: tempEmail.getTimeRemaining(),
            messageCount: tempEmail.messageCount,
            lastAccessedAt: tempEmail.lastAccessedAt
        }
    });
}));

// GET /api/email/:address/messages - Get messages for email address
router.get('/:address/messages', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { page = 1, limit = 50, unread } = req.query;

    // Check if email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    if (tempEmail.isExpired()) {
        return res.status(410).json({
            success: false,
            error: 'Email address has expired'
        });
    }

    // Update last accessed time
    await tempEmail.updateLastAccessed();

    // Build query
    const query = {
        emailAddress: address.toLowerCase(),
        isDeleted: false
    };

    if (unread === 'true') {
        query.isRead = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages
    const messages = await EmailMessage.find(query)
        .sort({ receivedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-rawMessage -tempEmailId');

    // Get total count
    const totalMessages = await EmailMessage.countDocuments(query);
    const unreadCount = await EmailMessage.getUnreadCount(address);

    res.json({
        success: true,
        data: {
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalMessages,
                pages: Math.ceil(totalMessages / parseInt(limit))
            },
            unreadCount,
            emailInfo: {
                address: tempEmail.address,
                timeRemaining: tempEmail.getTimeRemaining()
            }
        }
    });
}));

// GET /api/email/:address/message/:messageId - Get specific message
router.get('/:address/message/:messageId', validateEmail, asyncHandler(async (req, res) => {
    const { address, messageId } = req.params;

    // Check if email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    if (tempEmail.isExpired()) {
        return res.status(410).json({
            success: false,
            error: 'Email address has expired'
        });
    }

    // Find the message
    const message = await EmailMessage.findOne({
        messageId,
        emailAddress: address.toLowerCase(),
        isDeleted: false
    }).select('-rawMessage -tempEmailId');

    if (!message) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    // Update last accessed time
    await tempEmail.updateLastAccessed();

    res.json({
        success: true,
        data: message
    });
}));

// PUT /api/email/:address/message/:messageId/read - Mark message as read
router.put('/:address/message/:messageId/read', validateEmail, asyncHandler(async (req, res) => {
    const { address, messageId } = req.params;

    // Find and update the message
    const message = await EmailMessage.findOne({
        messageId,
        emailAddress: address.toLowerCase(),
        isDeleted: false
    });

    if (!message) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    if (!message.isRead) {
        await message.markAsRead();
    }

    res.json({
        success: true,
        data: {
            messageId: message.messageId,
            isRead: message.isRead
        }
    });
}));

// PUT /api/email/:address/messages/read-all - Mark all messages as read
router.put('/:address/messages/read-all', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;

    // Check if email exists
    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    // Mark all messages as read
    const result = await EmailMessage.markAllAsRead(address);

    res.json({
        success: true,
        data: {
            markedAsRead: result.modifiedCount
        }
    });
}));

// DELETE /api/email/:address/message/:messageId - Delete specific message
router.delete('/:address/message/:messageId', validateEmail, asyncHandler(async (req, res) => {
    const { address, messageId } = req.params;

    // Find and mark message as deleted
    const message = await EmailMessage.findOne({
        messageId,
        emailAddress: address.toLowerCase(),
        isDeleted: false
    });

    if (!message) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    await message.markAsDeleted();

    res.json({
        success: true,
        data: {
            messageId: message.messageId,
            deleted: true
        }
    });
}));

// DELETE /api/email/:address - Delete email address and all messages
router.delete('/:address', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;

    // Find and deactivate email
    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found'
        });
    }

    // Deactivate email and mark all messages as deleted
    tempEmail.isActive = false;
    await tempEmail.save();

    await EmailMessage.deleteByEmailAddress(address);

    res.json({
        success: true,
        data: {
            address: tempEmail.address,
            deleted: true
        }
    });
}));

// GET /api/email/:address/stats - Get email statistics
router.get('/:address/stats', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;

    const tempEmail = await TempEmail.findByAddress(address);

    if (!tempEmail) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    const totalMessages = await EmailMessage.countDocuments({
        emailAddress: address.toLowerCase(),
        isDeleted: false
    });

    const unreadCount = await EmailMessage.getUnreadCount(address);

    const recentMessages = await EmailMessage.find({
        emailAddress: address.toLowerCase(),
        isDeleted: false
    })
        .sort({ receivedAt: -1 })
        .limit(5)
        .select('from subject receivedAt isRead');

    res.json({
        success: true,
        data: {
            address: tempEmail.address,
            totalMessages,
            unreadCount,
            readCount: totalMessages - unreadCount,
            timeRemaining: tempEmail.getTimeRemaining(),
            recentMessages,
            createdAt: tempEmail.createdAt,
            lastAccessedAt: tempEmail.lastAccessedAt
        }
    });
}));

// POST /api/email/:address/reply/:messageId - Reply to a message
router.post('/:address/reply/:messageId', validateEmail, asyncHandler(async (req, res) => {
    const { address, messageId } = req.params;
    const { message, subject } = req.body;

    if (!message || !subject) {
        return res.status(400).json({
            success: false,
            error: 'Message and subject are required'
        });
    }

    // Find the original message
    const originalMessage = await EmailMessage.findOne({
        messageId,
        emailAddress: address.toLowerCase(),
        isDeleted: false
    });

    if (!originalMessage) {
        return res.status(404).json({
            success: false,
            error: 'Original message not found'
        });
    }

    // Verify email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);
    if (!tempEmail || tempEmail.isExpired()) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    try {
        const result = await smtpEmailService.sendReply(originalMessage, {
            message,
            subject,
            tempEmailAddress: address
        });

        res.json({
            success: true,
            data: {
                messageId: result.messageId,
                message: 'Reply sent successfully'
            }
        });
    } catch (error) {
        console.error('Failed to send reply:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
}));

// POST /api/email/:address/forward/:messageId - Forward a message
router.post('/:address/forward/:messageId', validateEmail, asyncHandler(async (req, res) => {
    const { address, messageId } = req.params;
    const { to, message, subject } = req.body;

    if (!to) {
        return res.status(400).json({
            success: false,
            error: 'Recipient email is required'
        });
    }

    // Find the original message
    const originalMessage = await EmailMessage.findOne({
        messageId,
        emailAddress: address.toLowerCase(),
        isDeleted: false
    });

    if (!originalMessage) {
        return res.status(404).json({
            success: false,
            error: 'Original message not found'
        });
    }

    // Verify email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);
    if (!tempEmail || tempEmail.isExpired()) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    try {
        const result = await smtpEmailService.sendForward(originalMessage, {
            to,
            message: message || '',
            subject: subject || originalMessage.subject,
            tempEmailAddress: address
        });

        res.json({
            success: true,
            data: {
                messageId: result.messageId,
                message: 'Message forwarded successfully'
            }
        });
    } catch (error) {
        console.error('Failed to forward message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to forward message'
        });
    }
}));

// POST /api/email/:address/send - Send a new email
router.post('/:address/send', validateEmail, asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({
            success: false,
            error: 'Recipient, subject, and message text are required'
        });
    }

    // Verify email exists and is active
    const tempEmail = await TempEmail.findByAddress(address);
    if (!tempEmail || tempEmail.isExpired()) {
        return res.status(404).json({
            success: false,
            error: 'Email address not found or expired'
        });
    }

    try {
        const result = await smtpEmailService.sendCustomEmail({
            to,
            subject,
            text,
            html,
            fromAddress: address
        });

        res.json({
            success: true,
            data: {
                messageId: result.messageId,
                message: 'Email sent successfully'
            }
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email'
        });
    }
}));

// GET /api/email/smtp/verify - Verify SMTP connection
router.get('/smtp/verify', asyncHandler(async (req, res) => {
    try {
        const result = await smtpEmailService.verifyConnection();
        res.json({
            success: true,
            data: {
                connected: result.success,
                message: result.message
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify SMTP connection'
        });
    }
}));

module.exports = router;
