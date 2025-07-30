const axios = require('axios');
require('dotenv').config();

async function manageMailgunRoutes() {
    console.log('🔧 Mailgun Routes Management');
    console.log('===========================\n');

    try {
        // Create Mailgun API client
        const mailgunAPI = axios.create({
            baseURL: 'https://api.mailgun.net/v3',
            auth: {
                username: 'api',
                password: process.env.MAILGUN_API_KEY
            }
        });

        // Step 1: List existing routes
        console.log('📋 Step 1: Listing existing routes...');
        const routesResponse = await mailgunAPI.get('/routes');
        const routes = routesResponse.data.items;

        console.log(`Found ${routes.length} existing route(s):`);
        routes.forEach((route, index) => {
            console.log(`  ${index + 1}. ID: ${route.id}`);
            console.log(`     Expression: ${route.expression}`);
            console.log(`     Actions: ${route.actions.join(', ')}`);
            console.log(`     Description: ${route.description || 'No description'}`);
            console.log('');
        });

        // Step 2: Delete old TempMail routes
        console.log('🗑️  Step 2: Deleting old TempMail routes...');
        for (const route of routes) {
            if (route.description && route.description.includes('TempMail')) {
                console.log(`Deleting route: ${route.id}`);
                await mailgunAPI.delete(`/routes/${route.id}`);
                console.log('✅ Route deleted successfully');
            }
        }

        // Step 3: Create new route with updated webhook URL
        const newWebhookUrl = 'https://da4effab5e86.ngrok-free.app/api/webhook/mailgun';
        console.log(`\n🔗 Step 3: Creating new route for: ${newWebhookUrl}`);

        const routeData = new URLSearchParams();
        routeData.append('priority', '1');
        routeData.append('expression', `match_recipient(".*@${process.env.MAILGUN_DOMAIN}")`);
        routeData.append('action', `forward("${newWebhookUrl}")`);
        routeData.append('description', 'TempMail webhook route - Updated');

        const newRouteResponse = await mailgunAPI.post('/routes', routeData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ New webhook route created successfully!');
        console.log(`📋 Route ID: ${newRouteResponse.data.route.id}`);
        console.log(`🎯 Expression: ${newRouteResponse.data.route.expression}`);
        console.log(`📡 Action: ${newRouteResponse.data.route.actions[0]}`);

        // Step 4: Update .env file
        console.log('\n💾 Step 4: Updating .env file...');
        const fs = require('fs');
        const envPath = '.env';
        let envContent = fs.readFileSync(envPath, 'utf8');

        if (envContent.includes('MAILGUN_WEBHOOK_URL=')) {
            envContent = envContent.replace(/MAILGUN_WEBHOOK_URL=.*/, `MAILGUN_WEBHOOK_URL=${newWebhookUrl}`);
        } else {
            envContent += `\nMAILGUN_WEBHOOK_URL=${newWebhookUrl}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Webhook URL updated in .env file');

        // Step 5: Test the new webhook
        console.log('\n🧪 Step 5: Testing new webhook...');
        const testData = {
            recipient: `test@${process.env.MAILGUN_DOMAIN}`,
            sender: 'test@example.com',
            subject: 'Webhook Update Test',
            'body-plain': 'This is a test to verify the updated webhook is working.',
            timestamp: Math.floor(Date.now() / 1000),
            'message-id': `test-${Date.now()}@${process.env.MAILGUN_DOMAIN}`
        };

        const testResponse = await axios.post(newWebhookUrl, new URLSearchParams(testData), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (testResponse.status === 200) {
            console.log('✅ Webhook test successful!');
            console.log('🎉 Your email receiving system is now updated and ready!');
        } else {
            console.log('⚠️ Webhook test returned unexpected status:', testResponse.status);
        }

        console.log('\n📧 Ready to receive real emails!');
        console.log('================================');
        console.log(`✅ Webhook URL: ${newWebhookUrl}`);
        console.log(`✅ Domain: ${process.env.MAILGUN_DOMAIN}`);
        console.log(`✅ Backend: http://localhost:3000`);
        console.log(`✅ Frontend: http://localhost:4200`);
        console.log('\n📝 To test:');
        console.log('1. Go to your website and generate a temporary email');
        console.log('2. Send an email to that address from any email provider');
        console.log('3. Check your website inbox - emails should appear immediately!');

    } catch (error) {
        console.error('❌ Error managing routes:', error.response?.data || error.message);
    }
}

// Run the management script
manageMailgunRoutes();
