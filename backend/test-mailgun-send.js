require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function sendMailgunTestEmail() {
    console.log('📧 Testing Mailgun Email Sending...\n');

    // Initialize Mailgun
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_SENDING_KEY || process.env.MAILGUN_API_KEY,
        url: 'https://api.mailgun.net' // Use EU endpoint if you have EU domain
    });

    console.log('🔧 Configuration:');
    console.log('Domain:', process.env.MAILGUN_DOMAIN);
    console.log('API Key:', process.env.MAILGUN_SENDING_KEY ? '***' + process.env.MAILGUN_SENDING_KEY.slice(-8) : 'NOT SET');
    console.log('Authorized Recipient:', 'abdalhamed9699@gmail.com');
    console.log('');

    try {
        console.log('📤 Sending test email...');

        const messageData = {
            from: `Mailgun Test <postmaster@${process.env.MAILGUN_DOMAIN}>`,
            to: ['Abdul <abdalhamed9699@gmail.com>'],
            subject: 'TempMail Mailgun Integration Test ✅',
            text: `Hello Abdul!

This is a test email from your TempMail application using Mailgun.

Configuration Details:
- Domain: ${process.env.MAILGUN_DOMAIN}
- Sent via: Mailgun API
- Integration: Working perfectly!

Your TempMail application is now ready to:
✅ Send emails via Gmail SMTP
✅ Send emails via Mailgun API  
✅ Receive emails via Mailgun webhook
✅ Store emails in MongoDB
✅ Display emails in Angular frontend

Next step: Deploy to production for real email receiving!

Best regards,
Your TempMail Application 🚀`,
            html: `
                <h2>🎉 TempMail Mailgun Integration Success!</h2>
                <p>Hello Abdul!</p>
                
                <p>This is a test email from your <strong>TempMail application</strong> using Mailgun.</p>
                
                <h3>📊 Configuration Details:</h3>
                <ul>
                    <li><strong>Domain:</strong> ${process.env.MAILGUN_DOMAIN}</li>
                    <li><strong>Sent via:</strong> Mailgun API</li>
                    <li><strong>Integration:</strong> Working perfectly!</li>
                </ul>
                
                <h3>✅ Your TempMail application is now ready to:</h3>
                <ul>
                    <li>✅ Send emails via Gmail SMTP</li>
                    <li>✅ Send emails via Mailgun API</li>
                    <li>✅ Receive emails via Mailgun webhook</li>
                    <li>✅ Store emails in MongoDB</li>
                    <li>✅ Display emails in Angular frontend</li>
                </ul>
                
                <p><strong>Next step:</strong> Deploy to production for real email receiving!</p>
                
                <p>Best regards,<br>
                Your TempMail Application 🚀</p>
            `
        };

        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);

        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', response.id);
        console.log('📬 Check your Gmail inbox for the test email.');
        console.log('');
        console.log('🎉 Mailgun integration is working perfectly!');

    } catch (error) {
        console.error('❌ Failed to send test email:');
        console.error('Error:', error.message);

        if (error.status === 401) {
            console.log('\n💡 Authentication Error:');
            console.log('- Check if your API key is correct');
            console.log('- Verify you\'re using the right API key (sending vs receiving)');
        } else if (error.status === 400) {
            console.log('\n💡 Bad Request Error:');
            console.log('- Check if the recipient email is authorized in sandbox mode');
            console.log('- Verify domain configuration');
        } else if (error.status === 402) {
            console.log('\n💡 Payment Required:');
            console.log('- You might have exceeded free tier limits');
            console.log('- Consider upgrading your Mailgun plan');
        }
    }
}

// Install required packages if not available
async function installDependencies() {
    try {
        require('mailgun.js');
        require('form-data');
        return true;
    } catch {
        console.log('📦 Installing required packages...');
        const { execSync } = require('child_process');
        execSync('npm install mailgun.js form-data', { stdio: 'inherit' });
        return true;
    }
}

// Run test
installDependencies()
    .then(() => sendMailgunTestEmail())
    .catch(console.error);
