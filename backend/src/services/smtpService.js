const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');

class SMTPService {
    constructor() {
        this.server = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('📧 SMTP service is already running');
            return;
        }

        const port = parseInt(process.env.SMTP_PORT) || 2525;

        this.server = new SMTPServer({
            // Allow all connections
            secure: false,
            authOptional: true,
            allowInsecureAuth: true,

            // Connection handler
            onConnect(session, callback) {
                console.log(`📧 SMTP connection from ${session.remoteAddress}`);
                return callback();
            },

            // Mail handler
            onMailFrom(address, session, callback) {
                console.log(`📧 Mail from: ${address.address}`);
                return callback();
            },

            // Recipient handler
            onRcptTo: async (address, session, callback) => {
                try {
                    console.log(`📧 Mail to: ${address.address}`);

                    // Check if the recipient email exists and is active
                    const tempEmail = await TempEmail.findByAddress(address.address);

                    if (!tempEmail) {
                        console.log(`📧 Rejected: Email ${address.address} not found`);
                        return callback(new Error('Mailbox does not exist'));
                    }

                    if (tempEmail.isExpired()) {
                        console.log(`📧 Rejected: Email ${address.address} has expired`);
                        return callback(new Error('Mailbox has expired'));
                    }

                    // Store recipient for later use
                    session.tempEmail = tempEmail;
                    return callback();

                } catch (error) {
                    console.error('📧 SMTP recipient validation error:', error);
                    return callback(new Error('Temporary failure'));
                }
            },

            // Message handler
            onData: async (stream, session, callback) => {
                try {
                    console.log('📧 Processing incoming message...');

                    // Parse the email
                    const parsed = await simpleParser(stream);

                    if (!session.tempEmail) {
                        return callback(new Error('No valid recipient'));
                    }

                    // Process attachments
                    const attachments = [];
                    if (parsed.attachments && parsed.attachments.length > 0) {
                        for (const attachment of parsed.attachments) {
                            attachments.push({
                                filename: attachment.filename || 'unnamed',
                                contentType: attachment.contentType || 'application/octet-stream',
                                size: attachment.size || 0,
                                content: attachment.content,
                                contentId: attachment.cid
                            });
                        }
                    }

                    // Create email message
                    const emailMessage = new EmailMessage({
                        messageId: parsed.messageId || EmailMessage.generateMessageId(),
                        tempEmailId: session.tempEmail._id,
                        emailAddress: session.tempEmail.address,
                        from: parsed.from?.text || 'unknown@sender.com',
                        to: session.tempEmail.address,
                        subject: parsed.subject || '',
                        body: parsed.text || '',
                        bodyHtml: parsed.html || '',
                        bodyText: parsed.text || '',
                        attachments: attachments,
                        headers: new Map(Object.entries(parsed.headers || {})),
                        source: 'smtp',
                        rawMessage: parsed.text || ''
                    });

                    await emailMessage.save();

                    console.log(`📧 Message saved: ${emailMessage.messageId} to ${session.tempEmail.address}`);

                    return callback();

                } catch (error) {
                    console.error('📧 SMTP message processing error:', error);
                    return callback(new Error('Message processing failed'));
                }
            },

            // Error handler
            onError(error) {
                console.error('📧 SMTP server error:', error);
            }
        });

        // Start the server
        this.server.listen(port, (error) => {
            if (error) {
                console.error('📧 Failed to start SMTP server:', error);
                return;
            }

            console.log(`📧 SMTP server listening on port ${port}`);
            this.isRunning = true;
        });

        // Handle server errors
        this.server.on('error', (error) => {
            console.error('📧 SMTP server error:', error);
        });
    }

    stop() {
        if (this.server && this.isRunning) {
            this.server.close(() => {
                console.log('📧 SMTP server stopped');
                this.isRunning = false;
            });
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            port: process.env.SMTP_PORT || 2525
        };
    }

    // Test method to send a test email through the system
    async sendTestEmail(toAddress, options = {}) {
        try {
            const {
                from = 'test@example.com',
                subject = 'Test Email',
                body = 'This is a test email sent through the SMTP service.',
                html = null
            } = options;

            // Find the temporary email
            const tempEmail = await TempEmail.findByAddress(toAddress);

            if (!tempEmail) {
                throw new Error('Recipient email address not found');
            }

            if (tempEmail.isExpired()) {
                throw new Error('Recipient email address has expired');
            }

            // Create email message directly (simulating SMTP processing)
            const emailMessage = new EmailMessage({
                messageId: EmailMessage.generateMessageId(),
                tempEmailId: tempEmail._id,
                emailAddress: toAddress,
                from: from,
                to: toAddress,
                subject: subject,
                body: body,
                bodyHtml: html || body,
                bodyText: body,
                source: 'smtp'
            });

            await emailMessage.save();

            console.log(`📧 Test email sent to ${toAddress}`);

            return {
                success: true,
                messageId: emailMessage.messageId,
                message: 'Test email sent successfully'
            };

        } catch (error) {
            console.error('📧 Test email failed:', error);
            throw error;
        }
    }
}

// Create singleton instance
const smtpService = new SMTPService();

module.exports = smtpService;
