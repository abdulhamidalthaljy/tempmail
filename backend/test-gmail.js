const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmailConnection() {
    console.log('🧪 Testing Gmail SMTP Connection...');
    console.log('📧 Email:', process.env.GMAIL_USER);
    console.log('🔐 App Password:', process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'NOT SET');
    console.log('🌐 Host:', process.env.SMTP_HOST);
    console.log('🔌 Port:', process.env.SMTP_PORT_REAL);
    console.log('');

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT_REAL) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        // Test connection
        console.log('🔍 Verifying connection...');
        await transporter.verify();
        console.log('✅ Gmail SMTP connection successful!');

        // Send test email
        console.log('📤 Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself
            subject: 'TempMail SMTP Test ✅',
            text: 'This is a test email from your TempMail application. Gmail SMTP is working correctly!',
            html: `
                <h2>🎉 Gmail SMTP Test Successful!</h2>
                <p>This email confirms that your Gmail SMTP configuration is working correctly.</p>
                <p><strong>Configuration Details:</strong></p>
                <ul>
                    <li>Host: ${process.env.SMTP_HOST}</li>
                    <li>Port: ${process.env.SMTP_PORT_REAL}</li>
                    <li>Email: ${process.env.GMAIL_USER}</li>
                </ul>
                <p>Your TempMail application can now send emails! 🚀</p>
            `
        });

        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('🎯 Check your Gmail inbox for the test email.');

    } catch (error) {
        console.error('❌ Gmail SMTP test failed:');
        console.error('Error Type:', error.code || 'Unknown');
        console.error('Error Message:', error.message);

        // Provide specific troubleshooting based on error
        if (error.code === 'EAUTH') {
            console.log('\n🔧 Authentication Error - Try these steps:');
            console.log('1. Verify your Gmail address is correct');
            console.log('2. Check if 2-factor authentication is enabled');
            console.log('3. Generate a new App Password from Google Account settings');
            console.log('4. Make sure you\'re using the App Password, not your regular password');
        } else if (error.code === 'ECONNECTION') {
            console.log('\n🔧 Connection Error - Try these steps:');
            console.log('1. Check your internet connection');
            console.log('2. Verify firewall/antivirus isn\'t blocking the connection');
            console.log('3. Try using port 465 with secure: true');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\n🔧 Timeout Error - Try these steps:');
            console.log('1. Check your network connection');
            console.log('2. Try again in a few minutes');
            console.log('3. Check if your ISP blocks SMTP connections');
        }
    }
}

// Run the test
testGmailConnection().catch(console.error);
