const nodemailer = require('nodemailer');
require('dotenv').config();

async function testMailgunSMTP() {
    console.log('📧 Testing Mailgun SMTP Configuration...\n');

    console.log('🔧 Configuration:');
    console.log('Host:', process.env.MAILGUN_SMTP_HOST);
    console.log('Port:', process.env.MAILGUN_SMTP_PORT);
    console.log('User:', process.env.MAILGUN_SMTP_USER);
    console.log('Password:', process.env.MAILGUN_SMTP_PASSWORD ? '***' + process.env.MAILGUN_SMTP_PASSWORD.slice(-4) : 'NOT SET');
    console.log('');

    // Create Mailgun SMTP transporter
    const transporter = nodemailer.createTransport({
        host: process.env.MAILGUN_SMTP_HOST,
        port: parseInt(process.env.MAILGUN_SMTP_PORT),
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.MAILGUN_SMTP_USER,
            pass: process.env.MAILGUN_SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        // Test connection
        console.log('🔍 Verifying Mailgun SMTP connection...');
        await transporter.verify();
        console.log('✅ Mailgun SMTP connection successful!\n');

        // Send test email
        console.log('📤 Sending test email via Mailgun SMTP...');
        const mailOptions = {
            from: process.env.MAILGUN_SMTP_USER,
            to: 'abdalhamed9699@gmail.com',
            subject: 'TempMail - Mailgun SMTP Test ✅',
            text: 'Hello! This is a test email sent via Mailgun SMTP from your TempMail application.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">✅ Mailgun SMTP Test Successful!</h2>
                    <p>Hello Abdul!</p>
                    <p>This email was successfully sent via <strong>Mailgun SMTP</strong> from your TempMail application.</p>
                    
                    <h3>📊 Configuration Details:</h3>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Host:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILGUN_SMTP_HOST}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Port:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILGUN_SMTP_PORT}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>User:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILGUN_SMTP_USER}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Domain:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILGUN_DOMAIN}</td></tr>
                    </table>
                    
                    <h3>🎉 Your TempMail application now supports:</h3>
                    <ul>
                        <li>✅ Gmail SMTP for sending emails</li>
                        <li>✅ Mailgun SMTP for sending emails</li>
                        <li>✅ Mailgun API for receiving emails</li>
                        <li>✅ MongoDB for storing emails</li>
                        <li>✅ Angular frontend for user interface</li>
                    </ul>
                    
                    <p style="background: #f0f8ff; padding: 15px; border-left: 4px solid #2196F3;">
                        <strong>Next Step:</strong> Deploy your application to a public server to enable real email receiving via webhooks!
                    </p>
                    
                    <p>Best regards,<br>Your TempMail Application 🚀</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Check your Gmail inbox (abdalhamed9699@gmail.com) for the test email.');

        console.log('\n🎉 Mailgun SMTP is working perfectly!');
        console.log('💡 You now have multiple email sending options:');
        console.log('   1. Gmail SMTP (personal Gmail account)');
        console.log('   2. Mailgun SMTP (professional email service)');

    } catch (error) {
        console.error('❌ Mailgun SMTP test failed:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 Authentication Error Solutions:');
            console.log('1. Verify SMTP password is correct: 755445@Abduu');
            console.log('2. Check SMTP username: 01306fa22f28@sandbox180c032f0d354414b01d862910b553da.mailgun.org');
            console.log('3. Try resetting SMTP password in Mailgun dashboard');
        } else if (error.code === 'ECONNECTION') {
            console.log('\n💡 Connection Error Solutions:');
            console.log('1. Check internet connection');
            console.log('2. Verify Mailgun SMTP host: smtp.mailgun.org');
            console.log('3. Confirm port 587 is not blocked');
        }
    }
}

// Run the test
testMailgunSMTP().catch(console.error);
