const nodemailer = require('nodemailer');
require('dotenv').config();

async function testBothSMTPServices() {
    console.log('📧 Testing Both SMTP Services (Gmail & Mailgun)...\n');

    // Test 1: Gmail SMTP
    console.log('🔍 Test 1: Gmail SMTP Configuration');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT_REAL);
    console.log('User:', process.env.GMAIL_USER);
    console.log('Password:', process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'NOT SET');

    const gmailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT_REAL),
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔍 Verifying Gmail SMTP...');
        await gmailTransporter.verify();
        console.log('✅ Gmail SMTP connection successful!\n');

        // Send test email via Gmail
        console.log('📤 Sending test email via Gmail SMTP...');
        const gmailInfo = await gmailTransporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: 'TempMail - Gmail SMTP Test ✅',
            text: 'This email was sent via Gmail SMTP from your TempMail application.',
            html: `
                <h2>✅ Gmail SMTP Test Successful!</h2>
                <p>This email was sent via <strong>Gmail SMTP</strong> from your TempMail application.</p>
                <p><strong>Configuration:</strong></p>
                <ul>
                    <li>Host: ${process.env.SMTP_HOST}</li>
                    <li>Port: ${process.env.SMTP_PORT_REAL}</li>
                    <li>User: ${process.env.GMAIL_USER}</li>
                </ul>
            `
        });
        console.log('✅ Gmail email sent! Message ID:', gmailInfo.messageId);

    } catch (error) {
        console.error('❌ Gmail SMTP failed:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Mailgun SMTP
    console.log('🔍 Test 2: Mailgun SMTP Configuration');
    console.log('Host:', process.env.MAILGUN_SMTP_HOST || 'NOT SET');
    console.log('Port:', process.env.MAILGUN_SMTP_PORT || 'NOT SET');
    console.log('User:', process.env.MAILGUN_SMTP_USER || 'NOT SET');
    console.log('Password:', process.env.MAILGUN_SMTP_PASSWORD ? '***' + process.env.MAILGUN_SMTP_PASSWORD.slice(-4) : 'NOT SET');

    if (!process.env.MAILGUN_SMTP_PASSWORD) {
        console.log('⚠️  Please add your Mailgun SMTP password to .env file');
        console.log('   Add: MAILGUN_SMTP_PASSWORD=your_mailgun_smtp_password');
        return;
    }

    const mailgunTransporter = nodemailer.createTransport({
        host: process.env.MAILGUN_SMTP_HOST,
        port: parseInt(process.env.MAILGUN_SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.MAILGUN_SMTP_USER,
            pass: process.env.MAILGUN_SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔍 Verifying Mailgun SMTP...');
        await mailgunTransporter.verify();
        console.log('✅ Mailgun SMTP connection successful!\n');

        // Send test email via Mailgun SMTP
        console.log('📤 Sending test email via Mailgun SMTP...');
        const mailgunInfo = await mailgunTransporter.sendMail({
            from: process.env.MAILGUN_SMTP_USER,
            to: 'abdalhamed9699@gmail.com', // Your authorized recipient
            subject: 'TempMail - Mailgun SMTP Test ✅',
            text: 'This email was sent via Mailgun SMTP from your TempMail application.',
            html: `
                <h2>✅ Mailgun SMTP Test Successful!</h2>
                <p>This email was sent via <strong>Mailgun SMTP</strong> from your TempMail application.</p>
                <p><strong>Configuration:</strong></p>
                <ul>
                    <li>Host: ${process.env.MAILGUN_SMTP_HOST}</li>
                    <li>Port: ${process.env.MAILGUN_SMTP_PORT}</li>
                    <li>User: ${process.env.MAILGUN_SMTP_USER}</li>
                </ul>
                <p><strong>Domain:</strong> ${process.env.MAILGUN_DOMAIN}</p>
            `
        });
        console.log('✅ Mailgun email sent! Message ID:', mailgunInfo.messageId);

    } catch (error) {
        console.error('❌ Mailgun SMTP failed:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 Authentication Error Solutions:');
            console.log('1. Check if MAILGUN_SMTP_PASSWORD is correct');
            console.log('2. Verify the SMTP credentials in Mailgun dashboard');
            console.log('3. Make sure you created an SMTP password (not API key)');
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SMTP Testing Complete!');
    console.log('📧 Check your Gmail inbox for test emails from both services.');
    console.log('\n💡 You now have TWO ways to send emails:');
    console.log('   1. Gmail SMTP (using your personal Gmail)');
    console.log('   2. Mailgun SMTP (using Mailgun service)');
}

// Run the test
testBothSMTPServices().catch(console.error);
