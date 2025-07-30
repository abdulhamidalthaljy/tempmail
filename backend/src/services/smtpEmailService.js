const nodemailer = require('nodemailer');

class SMTPEmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT_REAL) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            console.log('📧 Gmail SMTP transporter initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize SMTP transporter:', error);
        }
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection verified successfully');
            return { success: true, message: 'SMTP connection verified successfully' };
        } catch (error) {
            console.error('❌ SMTP connection verification failed:', error.message);
            return { success: false, message: `SMTP connection failed: ${error.message}` };
        }
    }

    async sendEmail(options) {
        try {
            if (!this.transporter) {
                throw new Error('SMTP transporter not initialized');
            }

            const mailOptions = {
                from: `"${options.fromName || 'TempMail'}" <${process.env.GMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html || options.text,
                replyTo: options.replyTo,
                ...options.extraOptions
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('📧 Email sent successfully:', {
                messageId: result.messageId,
                to: options.to,
                subject: options.subject
            });

            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendReply(originalMessage, replyData) {
        try {
            const subject = replyData.subject.startsWith('Re: ')
                ? replyData.subject
                : `Re: ${originalMessage.subject}`;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <div style="margin-bottom: 20px;">
                        ${replyData.message}
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <div style="color: #666; font-size: 12px;">
                        <p><strong>On ${new Date(originalMessage.receivedAt).toLocaleString()}, ${originalMessage.from} wrote:</strong></p>
                        <blockquote style="margin: 0; padding-left: 10px; border-left: 3px solid #ddd; color: #888;">
                            ${originalMessage.body}
                        </blockquote>
                    </div>
                </div>
            `;

            return await this.sendEmail({
                to: originalMessage.from,
                subject: subject,
                html: htmlContent,
                text: replyData.message,
                replyTo: replyData.tempEmailAddress,
                fromName: `TempMail (${replyData.tempEmailAddress})`
            });
        } catch (error) {
            console.error('❌ Failed to send reply:', error);
            throw error;
        }
    }

    async sendForward(originalMessage, forwardData) {
        try {
            const subject = forwardData.subject.startsWith('Fwd: ')
                ? forwardData.subject
                : `Fwd: ${originalMessage.subject}`;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    ${forwardData.message ? `
                        <div style="margin-bottom: 20px;">
                            ${forwardData.message}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    ` : ''}
                    
                    <div style="color: #666; font-size: 12px;">
                        <p><strong>---------- Forwarded message ----------</strong></p>
                        <p><strong>From:</strong> ${originalMessage.from}</p>
                        <p><strong>Date:</strong> ${new Date(originalMessage.receivedAt).toLocaleString()}</p>
                        <p><strong>Subject:</strong> ${originalMessage.subject}</p>
                        <p><strong>To:</strong> ${originalMessage.to}</p>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        ${originalMessage.body}
                    </div>
                </div>
            `;

            return await this.sendEmail({
                to: forwardData.to,
                subject: subject,
                html: htmlContent,
                text: `${forwardData.message || ''}\n\n---------- Forwarded message ----------\nFrom: ${originalMessage.from}\nDate: ${new Date(originalMessage.receivedAt).toLocaleString()}\nSubject: ${originalMessage.subject}\n\n${originalMessage.body}`,
                replyTo: forwardData.tempEmailAddress,
                fromName: `TempMail (${forwardData.tempEmailAddress})`
            });
        } catch (error) {
            console.error('❌ Failed to send forward:', error);
            throw error;
        }
    }

    async sendCustomEmail(emailData) {
        try {
            return await this.sendEmail({
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html || emailData.text,
                text: emailData.text,
                replyTo: emailData.fromAddress,
                fromName: `TempMail (${emailData.fromAddress})`
            });
        } catch (error) {
            console.error('❌ Failed to send custom email:', error);
            throw error;
        }
    }
}

module.exports = new SMTPEmailService();
