const axios = require('axios');
require('dotenv').config();

async function configureMailgunWebhook() {
    console.log('🔧 Mailgun Webhook Configuration Tool');
    console.log('=====================================\n');

    // Check if required environment variables are set
    if (!process.env.MAILGUN_API_KEY) {
        console.log('❌ MAILGUN_API_KEY not found in environment variables');
        return;
    }

    if (!process.env.MAILGUN_DOMAIN) {
        console.log('❌ MAILGUN_DOMAIN not found in environment variables');
        return;
    }

    console.log(`📧 Domain: ${process.env.MAILGUN_DOMAIN}`);
    console.log(`🔑 API Key: ${process.env.MAILGUN_API_KEY.substring(0, 10)}...`);

    // Step 1: Test local backend connection
    console.log('\n📡 Step 1: Testing local backend connection...');
    try {
        const localResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Local backend is running');
        console.log(`📊 Backend status: ${localResponse.data.status}`);
    } catch (error) {
        console.log('❌ Local backend is not responding');
        console.log('💡 Make sure your backend server is running on port 3000');
        return;
    }

    // Step 2: Instructions for ngrok
    console.log('\n🌐 Step 2: Setting up public URL with ngrok');
    console.log('===========================================');
    console.log('1. Make sure ngrok is running in another terminal with: ngrok http 3000');
    console.log('2. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)');
    console.log('3. Your webhook URL will be: [NGROK_URL]/api/webhook/mailgun');
    console.log('\nExample:');
    console.log('  If ngrok shows: https://abc123.ngrok.io');
    console.log('  Your webhook URL is: https://abc123.ngrok.io/api/webhook/mailgun');

    // Step 3: Manual configuration instructions
    console.log('\n⚙️  Step 3: Configure Mailgun Webhook');
    console.log('====================================');
    console.log('Option A - Manual Configuration (Recommended):');
    console.log('1. Go to: https://app.mailgun.com/mg/dashboard');
    console.log('2. Select your domain: ' + process.env.MAILGUN_DOMAIN);
    console.log('3. Go to "Routes" section');
    console.log('4. Create a new route with:');
    console.log('   - Expression Type: "Catch All"');
    console.log('   - Actions: "Forward" to your webhook URL');
    console.log('   - URL: [YOUR_NGROK_URL]/api/webhook/mailgun');
    console.log('   - Method: POST');

    console.log('\nOption B - Automated Configuration:');
    console.log('If you have your ngrok URL ready, you can run:');
    console.log('node configure-webhook.js setup [YOUR_NGROK_URL]');

    // Step 4: Test webhook
    console.log('\n🧪 Step 4: Test the webhook');
    console.log('===========================');
    console.log('After configuring the webhook, test it with:');
    console.log('node configure-webhook.js test [YOUR_NGROK_URL]');

    console.log('\n📝 Step 5: Testing real email');
    console.log('=============================');
    console.log('1. Create a temporary email on your website');
    console.log('2. Send an email to that address from any email provider');
    console.log('3. Check your website inbox - the email should appear!');
}

async function setupWebhook(ngrokUrl) {
    console.log(`🔧 Setting up webhook for: ${ngrokUrl}`);

    const webhookUrl = `${ngrokUrl}/api/webhook/mailgun`;
    console.log(`📡 Webhook URL: ${webhookUrl}`);

    try {
        // Create Mailgun API client
        const mailgunAPI = axios.create({
            baseURL: 'https://api.mailgun.net/v3',
            auth: {
                username: 'api',
                password: process.env.MAILGUN_API_KEY
            }
        });

        // Create a route for all incoming emails
        const routeData = new URLSearchParams();
        routeData.append('priority', '1');
        routeData.append('expression', `match_recipient(".*@${process.env.MAILGUN_DOMAIN}")`);
        routeData.append('action', `forward("${webhookUrl}")`);
        routeData.append('description', 'TempMail webhook route');

        const response = await mailgunAPI.post('/routes', routeData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Webhook route created successfully!');
        console.log(`📋 Route ID: ${response.data.route.id}`);
        console.log(`🎯 Expression: ${response.data.route.expression}`);
        console.log(`📡 Action: ${response.data.route.actions[0]}`);

        // Save webhook URL to environment
        console.log('\n💾 Saving webhook URL to environment...');
        const fs = require('fs');
        const envPath = '.env';
        let envContent = fs.readFileSync(envPath, 'utf8');

        if (envContent.includes('MAILGUN_WEBHOOK_URL=')) {
            envContent = envContent.replace(/MAILGUN_WEBHOOK_URL=.*/, `MAILGUN_WEBHOOK_URL=${webhookUrl}`);
        } else {
            envContent += `\nMAILGUN_WEBHOOK_URL=${webhookUrl}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Webhook URL saved to .env file');

    } catch (error) {
        console.error('❌ Failed to setup webhook:');
        console.error(error.response?.data || error.message);
    }
}

async function testWebhook(ngrokUrl) {
    console.log(`🧪 Testing webhook: ${ngrokUrl}`);

    const webhookUrl = `${ngrokUrl}/api/webhook/mailgun`;

    try {
        // Test webhook endpoint
        const testData = {
            recipient: `test@${process.env.MAILGUN_DOMAIN}`,
            sender: 'test@example.com',
            subject: 'Test Webhook Email',
            'body-plain': 'This is a test email to verify webhook functionality.',
            timestamp: Math.floor(Date.now() / 1000),
            'message-id': `test-${Date.now()}@${process.env.MAILGUN_DOMAIN}`
        };

        console.log('📤 Sending test webhook data...');
        const response = await axios.post(webhookUrl, testData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 200) {
            console.log('✅ Webhook test successful!');
            console.log('🎉 Your email receiving system is working correctly');
        } else {
            console.log('⚠️ Webhook responded but with unexpected status:', response.status);
        }

    } catch (error) {
        console.error('❌ Webhook test failed:');
        console.error(error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure ngrok is running and the URL is correct');
        }
    }
}

// Main execution
const command = process.argv[2];
const ngrokUrl = process.argv[3];

if (command === 'setup' && ngrokUrl) {
    setupWebhook(ngrokUrl);
} else if (command === 'test' && ngrokUrl) {
    testWebhook(ngrokUrl);
} else {
    configureMailgunWebhook();
}
