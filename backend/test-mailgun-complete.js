// Test script to verify Mailgun sandbox setup after adding authorized recipients

const axios = require('axios');
require('dotenv').config();

async function testMailgunSandbox() {
    console.log('🧪 Testing Mailgun Sandbox Setup...\n');

    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_SENDING_KEY || process.env.MAILGUN_API_KEY;
    const authorizedEmail = 'abdalhamed9699@gmail.com';

    console.log('📋 Configuration:');
    console.log('Domain:', domain);
    console.log('API Key:', apiKey ? '***' + apiKey.slice(-8) : 'NOT SET');
    console.log('Authorized Email:', authorizedEmail);
    console.log('');

    // Test 1: Send email via Mailgun API
    console.log('📧 Test 1: Sending test email via Mailgun...');
    try {
        const response = await axios.post(
            `https://api.mailgun.net/v3/${domain}/messages`,
            new URLSearchParams({
                from: `Mailgun Test <postmaster@${domain}>`,
                to: authorizedEmail,
                subject: 'TempMail Mailgun Test ✅',
                text: 'Congratulations! Your Mailgun sandbox is working correctly with your TempMail application.',
                html: `
                    <h2>🎉 Mailgun Test Successful!</h2>
                    <p>This email confirms that your Mailgun sandbox setup is working correctly.</p>
                    <p><strong>Configuration Details:</strong></p>
                    <ul>
                        <li>Domain: ${domain}</li>
                        <li>Authorized Recipient: ${authorizedEmail}</li>
                        <li>Status: ✅ Working</li>
                    </ul>
                    <p>Your TempMail application can now send emails through Mailgun! 🚀</p>
                `
            }),
            {
                auth: {
                    username: 'api',
                    password: apiKey
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', response.data.id);
        console.log('🎯 Check your Gmail inbox for the test email.');

    } catch (error) {
        console.error('❌ Failed to send email:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);

        if (error.response?.status === 400) {
            console.log('\n🔧 Common issues:');
            console.log('1. Gmail not added as authorized recipient');
            console.log('2. Authorized recipient email not verified');
            console.log('3. Invalid API key');
        }
    }

    console.log('\n' + '='.repeat(60));

    // Test 2: Check if webhook endpoint is ready
    console.log('🔗 Test 2: Checking webhook endpoint...');
    try {
        const webhookResponse = await axios.get('http://localhost:3000/api/webhook/test');
        console.log('✅ Webhook endpoint is ready');
        console.log('📡 Available endpoints:', Object.keys(webhookResponse.data.endpoints || {}));
    } catch (error) {
        console.error('❌ Webhook endpoint not accessible:', error.message);
        console.log('💡 Make sure your backend server is running on port 3000');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. ✅ Add authorized recipient in Mailgun dashboard');
    console.log('2. ✅ Verify the recipient email');
    console.log('3. 🚀 Test sending emails from your TempMail app');
    console.log('4. 🌐 For production: get real domain and deploy publicly');
}

// Check if authorized recipient setup is needed
async function checkAuthorizedRecipients() {
    console.log('🔍 Checking Mailgun authorized recipients...\n');

    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;

    try {
        const response = await axios.get(
            `https://api.mailgun.net/v3/${domain}/authorized_recipients`,
            {
                auth: {
                    username: 'api',
                    password: apiKey
                }
            }
        );

        console.log('📋 Current authorized recipients:');
        if (response.data.items && response.data.items.length > 0) {
            response.data.items.forEach(recipient => {
                console.log(`- ${recipient.email} (${recipient.created_at})`);
            });
        } else {
            console.log('❌ No authorized recipients found');
            console.log('🔧 You need to add abdalhamed9699@gmail.com as authorized recipient');
        }

    } catch (error) {
        console.error('❌ Failed to check authorized recipients:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
async function runTests() {
    await checkAuthorizedRecipients();
    await testMailgunSandbox();
}

runTests().catch(console.error);
