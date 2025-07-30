const express = require('express');
const multer = require('multer');
const router = express.Router();
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');
const { asyncHandler } = require('../middleware/errorHandler');
const mailgunService = require('../services/mailgunService');

// Multer for handling multipart/form-data from Mailgun
const upload = multer();

// POST /api/webhook/mailgun - Mailgun webhook for real email receiving
router.post('/mailgun', upload.none(), asyncHandler(async (req, res) => {
    try {
        console.log('📧 Received real email via Mailgun webhook');
        console.log('Mailgun data:', req.body);

        // Extract email data from Mailgun webhook
        const {
            recipient,
            sender,
            subject,
            'body-plain': textBody,
            'body-html': htmlBody,
            timestamp,
            'message-id': messageId,
            'stripped-text': strippedText,
            'stripped-html': strippedHtml
        } = req.body;

        if (!recipient || !sender) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: recipient, sender'
            });
        }

        console.log(`📨 To: ${recipient}, From: ${sender}, Subject: ${subject}`);

        // Find the temporary email in database
        const tempEmail = await TempEmail.findByAddress(recipient);

        if (!tempEmail) {
            console.log('❌ Email address not found or expired');
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

        // Create new email message from real email
        const emailMessage = new EmailMessage({
            messageId: messageId || `mailgun-${Date.now()}@${recipient.split('@')[1]}`,
            tempEmailId: tempEmail._id,
            emailAddress: recipient.toLowerCase(),
            from: sender,
            to: recipient,
            subject: subject || '(No Subject)',
            body: strippedHtml || htmlBody || strippedText || textBody || 'Empty message',
            bodyHtml: strippedHtml || htmlBody || '',
            bodyText: strippedText || textBody || '',
            receivedAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
            source: 'mailgun',
            isRead: false
        });

        await emailMessage.save();

        console.log('✅ Real email saved successfully');
        console.log(`📧 Message ID: ${emailMessage.messageId}`);

        // TODO: Add real-time notifications here (WebSocket, SSE, etc.)

        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error processing Mailgun webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing real email'
        });
    }
}));

// POST /api/webhook/email - Receive email via webhook (for testing/mock)
router.post('/email', asyncHandler(async (req, res) => {
    try {
        const {
            to,
            from,
            subject,
            body,
            bodyHtml,
            bodyText,
            attachments = [],
            headers = {},
            messageId
        } = req.body;

        if (!to || !from) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, from'
            });
        }

        // Find the temporary email
        const tempEmail = await TempEmail.findByAddress(to);

        if (!tempEmail) {
            return res.status(404).json({
                success: false,
                error: 'Recipient email address not found or expired'
            });
        }

        if (tempEmail.isExpired()) {
            return res.status(410).json({
                success: false,
                error: 'Recipient email address has expired'
            });
        }

        // Create new email message
        const emailMessage = new EmailMessage({
            messageId: messageId || EmailMessage.generateMessageId(),
            tempEmailId: tempEmail._id,
            emailAddress: to.toLowerCase(),
            from: from,
            to: to,
            subject: subject || '',
            body: body || bodyText || '',
            bodyHtml: bodyHtml || '',
            bodyText: bodyText || body || '',
            attachments: attachments || [],
            headers: new Map(Object.entries(headers)),
            source: 'webhook'
        });

        await emailMessage.save();

        res.status(201).json({
            success: true,
            data: {
                messageId: emailMessage.messageId,
                to: emailMessage.to,
                from: emailMessage.from,
                subject: emailMessage.subject,
                receivedAt: emailMessage.receivedAt
            }
        });

    } catch (error) {
        console.error('Webhook email processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process incoming email'
        });
    }
}));

// POST /api/webhook/mock-email - Generate mock email for testing
router.post('/mock-email', asyncHandler(async (req, res) => {
    try {
        const { emailAddress, count = 1 } = req.body;

        if (!emailAddress) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        // Find the temporary email
        const tempEmail = await TempEmail.findByAddress(emailAddress);

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

        const mockEmails = [];
        const mockSenders = [
            'noreply@example.com',
            'support@testsite.com',
            'newsletter@company.org',
            'alerts@service.net',
            'notifications@app.io'
        ];

        const mockSubjects = [
            'Welcome to our service!',
            'Your account verification',
            'Important security update',
            'Newsletter - Weekly Updates',
            'Password reset request',
            'Order confirmation #12345',
            'Meeting reminder',
            'System maintenance notice'
        ];

        const mockBodies = [
            'Thank you for signing up! Please verify your email address to get started.',
            'Your verification code is: 123456. This code will expire in 10 minutes.',
            'We have detected unusual activity on your account. Please review your recent activity.',
            'Here are this week\'s top stories and updates from our team.',
            'Someone requested a password reset for your account. If this wasn\'t you, please ignore this email.',
            'Your order has been confirmed and will be shipped within 2-3 business days.',
            'This is a reminder about your upcoming meeting scheduled for tomorrow at 2 PM.',
            'We will be performing scheduled maintenance on our servers tonight from 2-4 AM EST.'
        ];

        for (let i = 0; i < Math.min(count, 10); i++) {
            const randomSender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
            const randomSubject = mockSubjects[Math.floor(Math.random() * mockSubjects.length)];
            const randomBody = mockBodies[Math.floor(Math.random() * mockBodies.length)];

            const emailMessage = new EmailMessage({
                messageId: EmailMessage.generateMessageId(),
                tempEmailId: tempEmail._id,
                emailAddress: emailAddress.toLowerCase(),
                from: randomSender,
                to: emailAddress,
                subject: randomSubject,
                body: randomBody,
                bodyText: randomBody,
                source: 'mock',
                receivedAt: new Date(Date.now() - Math.random() * 3600000) // Random time within last hour
            });

            await emailMessage.save();
            mockEmails.push({
                messageId: emailMessage.messageId,
                from: emailMessage.from,
                subject: emailMessage.subject,
                receivedAt: emailMessage.receivedAt
            });
        }

        res.status(201).json({
            success: true,
            data: {
                generated: mockEmails.length,
                emails: mockEmails
            }
        });

    } catch (error) {
        console.error('Mock email generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate mock emails'
        });
    }
}));

// GET /api/webhook/test - Test webhook endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook endpoint is working',
        timestamp: new Date().toISOString(),
        endpoints: {
            email: 'POST /api/webhook/email',
            mockEmail: 'POST /api/webhook/mock-email',
            mailgun: 'POST /api/webhook/mailgun'
        }
    });
});

// POST /api/webhook/configure-domain - Configure domain for real email receiving
router.post('/configure-domain', asyncHandler(async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain is required'
            });
        }

        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain format'
            });
        }

        res.json({
            success: true,
            message: `Domain ready for configuration: ${domain}`,
            steps: {
                step1: 'Buy domain and set up DNS',
                step2: 'Add MX records',
                step3: 'Configure Mailgun',
                step4: 'Update environment variables'
            },
            dns_records: {
                mx_records: [
                    { priority: 10, value: 'mxa.mailgun.org' },
                    { priority: 10, value: 'mxb.mailgun.org' }
                ],
                txt_record: 'v=spf1 include:mailgun.org ~all'
            },
            mailgun_settings: {
                webhook_url: `${req.protocol}://${req.get('host')}/api/webhook/mailgun`,
                domain_to_configure: domain
            },
            environment_update: {
                EMAIL_DOMAIN: domain,
                MAILGUN_DOMAIN: domain,
                MAILGUN_API_KEY: 'your-mailgun-api-key'
            }
        });

    } catch (error) {
        console.error('Domain configuration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure domain'
        });
    }
}));

// GET /api/webhook/mailgun/test - Test Mailgun API connection
router.get('/mailgun/test', asyncHandler(async (req, res) => {
    try {
        const result = await mailgunService.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to test Mailgun connection'
        });
    }
}));

// POST /api/webhook/mailgun/add-domain - Add domain to Mailgun
router.post('/mailgun/add-domain', asyncHandler(async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain is required'
            });
        }

        const result = await mailgunService.addDomain(domain);

        if (result.success) {
            // Update environment domain
            process.env.EMAIL_DOMAIN = domain;
            process.env.MAILGUN_DOMAIN = domain;
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to add domain to Mailgun'
        });
    }
}));

// GET /api/webhook/mailgun/verify-domain/:domain - Verify domain setup
router.get('/mailgun/verify-domain/:domain', asyncHandler(async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await mailgunService.verifyDomain(domain);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify domain'
        });
    }
}));

// GET /api/webhook/mailgun/dns/:domain - Get DNS setup instructions
router.get('/mailgun/dns/:domain', asyncHandler(async (req, res) => {
    try {
        const { domain } = req.params;
        const instructions = mailgunService.getDNSInstructions(domain);

        res.json({
            success: true,
            data: instructions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get DNS instructions'
        });
    }
}));

module.exports = router;
