const SMTPServer = require('smtp-server').SMTPServer;
const { simpleParser } = require('mailparser');
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');

class RealSMTPService {
    constructor() {
        this.server = null;
        this.isRunning = false;
    }

    createServer() {
        this.server = new SMTPServer({
            // Server configuration
            secure: false, // Set to true for TLS
            authOptional: true, // Allow emails without authentication
            disabledCommands: ['AUTH'], // Disable authentication for now

            // Handle incoming connections
            onConnect: (session, callback) => {
                console.log(`📧 SMTP Connection from ${session.remoteAddress}`);
                callback(); // Accept connection
            },

            // Handle incoming emails
            onData: this.handleIncomingEmail.bind(this),

            // Handle errors
            onError: (error) => {
                console.error('📧 SMTP Server Error:', error);
            }
        });

        // Handle server errors
        this.server.on('error', (error) => {
            console.error('📧 SMTP Server Error:', error);
        });
    }

    async handleIncomingEmail(stream, session, callback) {
        try {
            console.log('📧 Processing incoming email...');

            // Parse the email
            const parsed = await simpleParser(stream);

            // Log email details
            console.log('📧 Email Details:', {
                from: parsed.from?.text,
                to: parsed.to?.text,
                subject: parsed.subject,
                date: parsed.date
            });

            // Process each recipient
            const recipients = this.extractRecipients(parsed);

            for (const recipientEmail of recipients) {
                await this.processEmailForRecipient(parsed, recipientEmail);
            }

            // Send success response
            callback();
            console.log('✅ Email processed successfully');

        } catch (error) {
            console.error('❌ Error processing email:', error);
            callback(error);
        }
    }

    extractRecipients(parsed) {
        const recipients = [];

        // Extract from 'to' field
        if (parsed.to?.value) {
            parsed.to.value.forEach(addr => {
                if (addr.address) {
                    recipients.push(addr.address.toLowerCase());
                }
            });
        }

        // Extract from 'cc' field
        if (parsed.cc?.value) {
            parsed.cc.value.forEach(addr => {
                if (addr.address) {
                    recipients.push(addr.address.toLowerCase());
                }
            });
        }

        return [...new Set(recipients)]; // Remove duplicates
    }

    async processEmailForRecipient(parsed, recipientEmail) {
        try {
            // Check if this is a valid temporary email
            const tempEmail = await TempEmail.findByAddress(recipientEmail);

            if (!tempEmail) {
                console.log(`📧 Email address not found: ${recipientEmail}`);
                return;
            }

            if (tempEmail.isExpired()) {
                console.log(`📧 Email address expired: ${recipientEmail}`);
                return;
            }

            // Extract attachments
            const attachments = this.processAttachments(parsed.attachments || []);

            // Create email message
            const emailMessage = new EmailMessage({
                tempEmailId: tempEmail._id,
                emailAddress: recipientEmail,
                from: parsed.from?.text || 'unknown@sender.com',
                to: recipientEmail,
                subject: parsed.subject || '(No Subject)',
                body: parsed.text || parsed.html || '',
                bodyHtml: parsed.html || '',
                bodyText: parsed.text || '',
                attachments: attachments,
                headers: this.extractHeaders(parsed.headers),
                source: 'smtp',
                receivedAt: new Date(),
                size: this.calculateEmailSize(parsed)
            });

            await emailMessage.save();
            console.log(`✅ Email saved for: ${recipientEmail}`);

        } catch (error) {
            console.error(`❌ Error processing email for ${recipientEmail}:`, error);
        }
    }

    processAttachments(attachments) {
        return attachments.map(att => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            content: att.content, // Buffer
            contentId: att.contentId
        }));
    }

    extractHeaders(headers) {
        const headerMap = new Map();

        if (headers) {
            // Convert headers to Map format
            for (const [key, value] of headers) {
                headerMap.set(key.toLowerCase(), Array.isArray(value) ? value.join(', ') : value);
            }
        }

        return headerMap;
    }

    calculateEmailSize(parsed) {
        let size = 0;

        if (parsed.text) size += Buffer.byteLength(parsed.text, 'utf8');
        if (parsed.html) size += Buffer.byteLength(parsed.html, 'utf8');

        if (parsed.attachments) {
            parsed.attachments.forEach(att => {
                size += att.size || 0;
            });
        }

        return size;
    }

    start() {
        if (this.isRunning) {
            console.log('📧 SMTP Service is already running');
            return;
        }

        try {
            this.createServer();

            const port = parseInt(process.env.SMTP_PORT) || 2525;
            const host = process.env.SMTP_HOST || '0.0.0.0';

            this.server.listen(port, host, () => {
                this.isRunning = true;
                console.log(`📧 Real SMTP Server listening on ${host}:${port}`);
                console.log(`📧 Domain: ${process.env.EMAIL_DOMAIN || 'temp-mail.local'}`);
                console.log(`📧 Ready to receive emails!`);
            });

        } catch (error) {
            console.error('❌ Failed to start SMTP server:', error);
        }
    }

    stop() {
        if (this.server && this.isRunning) {
            this.server.close(() => {
                this.isRunning = false;
                console.log('📧 SMTP Server stopped');
            });
        }
    }

    getStatus() {
        return {
            running: this.isRunning,
            port: process.env.SMTP_PORT || 2525,
            host: process.env.SMTP_HOST || '0.0.0.0',
            domain: process.env.EMAIL_DOMAIN || 'temp-mail.local'
        };
    }
}

module.exports = new RealSMTPService();
