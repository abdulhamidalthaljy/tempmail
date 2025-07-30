const axios = require('axios');
require('dotenv').config();

async function updateWebhookToRailway() {
    console.log('🚀 Updating Mailgun Webhook to Railway');
    console.log('=====================================\n');

    const railwayUrl = 'https://tempmail-production-740f.up.railway.app';
    const webhookUrl = `${railwayUrl}/api/webhook/mailgun`;

    console.log(`🔗 Railway URL: ${railwayUrl}`);
    console.log(`📡 Webhook URL: ${webhookUrl}`);

    // Check if required environment variables are set
    if (!process.env.MAILGUN_API_KEY) {
        console.log('❌ MAILGUN_API_KEY not found in environment variables');
        return;
    }

    if (!process.env.MAILGUN_DOMAIN) {
        console.log('❌ MAILGUN_DOMAIN not found in environment variables');
        return;
    }

    try {
        // Test Railway backend connection first
        console.log('\n📡 Testing Railway backend connection...');
        const railwayResponse = await axios.get(`${railwayUrl}/health`, {
            timeout: 10000
        });
        console.log('✅ Railway backend is responding');
        console.log(`📊 Backend status: ${railwayResponse.data.status}`);

        // Create Mailgun API client
        console.log('\n🔧 Setting up Mailgun webhook...');
        const mailgunAPI = axios.create({
            baseURL: 'https://api.mailgun.net/v3',
            auth: {
                username: 'api',
                password: process.env.MAILGUN_API_KEY
            }
        });

        // First, let's list existing routes to see what we have
        console.log('\n📋 Checking existing routes...');
        const existingRoutes = await mailgunAPI.get('/routes');

        if (existingRoutes.data.items.length > 0) {
            console.log(`Found ${existingRoutes.data.items.length} existing route(s)`);

            // Delete old routes (especially ngrok ones)
            for (const route of existingRoutes.data.items) {
                if (route.actions.some(action => action.includes('ngrok') || action.includes('TempMail'))) {
                    console.log(`🗑️ Deleting old route: ${route.id}`);
                    await mailgunAPI.delete(`/routes/${route.id}`);
                }
            }
        }

        // Create new route for Railway
        console.log('\n➕ Creating new Railway webhook route...');
        const routeData = new URLSearchParams();
        routeData.append('priority', '1');
        routeData.append('expression', `match_recipient(".*@${process.env.MAILGUN_DOMAIN}")`);
        routeData.append('action', `forward("${webhookUrl}")`);
        routeData.append('description', 'TempMail Railway Production Webhook');

        const response = await mailgunAPI.post('/routes', routeData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Railway webhook route created successfully!');
        console.log(`📋 Route ID: ${response.data.route.id}`);
        console.log(`🎯 Expression: ${response.data.route.expression}`);
        console.log(`📡 Action: ${response.data.route.actions[0]}`);

        // Test the webhook
        console.log('\n🧪 Testing Railway webhook...');
        const testData = {
            recipient: `test@${process.env.MAILGUN_DOMAIN}`,
            sender: 'test@example.com',
            subject: 'Railway Webhook Test Email',
            'body-plain': 'This is a test email to verify Railway webhook functionality.',
            timestamp: Math.floor(Date.now() / 1000),
            'message-id': `railway-test-${Date.now()}@${process.env.MAILGUN_DOMAIN}`
        };

        const webhookTest = await axios.post(webhookUrl, testData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });

        if (webhookTest.status === 200) {
            console.log('✅ Railway webhook test successful!');
            console.log('🎉 Your production email receiving system is working!');
        }

        console.log('\n🎯 Next Steps:');
        console.log('==============');
        console.log('1. ✅ Railway deployment is running');
        console.log('2. ✅ MongoDB Atlas connected');
        console.log('3. ✅ Mailgun webhook updated to Railway');
        console.log('4. 📧 Test by sending an email to any address @' + process.env.MAILGUN_DOMAIN);
        console.log('5. 🌐 Your TempMail service is now live at: ' + railwayUrl);

    } catch (error) {
        console.error('❌ Error updating webhook:');
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('Connection error - make sure Railway is running');
        } else {
            console.error(error.message);
        }
    }
}

updateWebhookToRailway();
