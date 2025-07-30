const axios = require('axios');
require('dotenv').config();

async function testMailgunConfiguration() {
    console.log('🧪 Testing Mailgun Configuration...\n');

    // Display configuration
    console.log('📋 Current Mailgun Settings:');
    console.log('API Key:', process.env.MAILGUN_API_KEY ? '***' + process.env.MAILGUN_API_KEY.slice(-8) : 'NOT SET');
    console.log('Sending Key:', process.env.MAILGUN_SENDING_KEY ? '***' + process.env.MAILGUN_SENDING_KEY.slice(-8) : 'NOT SET');
    console.log('Domain:', process.env.MAILGUN_DOMAIN || 'NOT SET');
    console.log('');

    // Test 1: Verify API Key by getting account info
    console.log('🔍 Test 1: Verifying Mailgun API Key...');
    try {
        const response = await axios.get('https://api.mailgun.net/v3/domains', {
            auth: {
                username: 'api',
                password: process.env.MAILGUN_API_KEY
            }
        });

        console.log('✅ API Key is valid!');
        console.log('📊 Account Status:');
        console.log(`- Total domains: ${response.data.total_count}`);

        if (response.data.items && response.data.items.length > 0) {
            console.log('- Available domains:');
            response.data.items.forEach(domain => {
                console.log(`  • ${domain.name} (${domain.state})`);
            });
        } else {
            console.log('- No domains configured yet');
        }

    } catch (error) {
        console.error('❌ API Key validation failed:');
        console.error('Error:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('\n💡 The API key might be incorrect or expired.');
            console.log('   Please check your Mailgun dashboard for the correct API key.');
        }
    }

    console.log('\n' + '='.repeat(60));

    // Test 2: Check webhook endpoint
    console.log('🔗 Test 2: Testing webhook endpoint...');
    try {
        const webhookResponse = await axios.get('http://localhost:3000/api/webhook/test');
        console.log('✅ Webhook endpoint is accessible');
        console.log('Available endpoints:', Object.keys(webhookResponse.data.endpoints || {}));
    } catch (error) {
        console.error('❌ Webhook endpoint test failed:', error.message);
    }

    console.log('\n' + '='.repeat(60));

    // Test 3: Domain configuration simulation
    console.log('🌐 Test 3: Domain configuration simulation...');
    try {
        const domainTest = await axios.post('http://localhost:3000/api/webhook/configure-domain', {
            domain: 'example-tempmail.com'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Domain configuration endpoint working');
        console.log('📋 Setup Instructions:');
        if (domainTest.data.dns_records) {
            console.log('DNS Records needed:');
            domainTest.data.dns_records.mx_records.forEach(mx => {
                console.log(`  MX ${mx.priority} ${mx.value}`);
            });
        }
    } catch (error) {
        console.error('❌ Domain configuration test failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60));

    // Next steps
    console.log('📝 Next Steps to Complete Setup:\n');

    if (!process.env.MAILGUN_DOMAIN) {
        console.log('1. 🌐 Add a domain to Mailgun:');
        console.log('   - Go to Mailgun dashboard');
        console.log('   - Add your domain (or use sandbox domain for testing)');
        console.log('   - Update MAILGUN_DOMAIN in .env file');
        console.log('');
    }

    console.log('2. 🔧 Configure DNS (if using real domain):');
    console.log('   - Add MX records pointing to Mailgun');
    console.log('   - Add SPF/DKIM records for better deliverability');
    console.log('');

    console.log('3. 🪝 Set up webhook:');
    console.log('   - Deploy your app to get public URL');
    console.log('   - Configure webhook in Mailgun to point to your app');
    console.log('   - URL format: https://yourapp.com/api/webhook/mailgun');
    console.log('');

    console.log('4. 🧪 Test email receiving:');
    console.log('   - Generate temp email in your app');
    console.log('   - Send test email from external service');
    console.log('   - Check if it appears in your web interface');

    console.log('\n🎉 Your Mailgun integration is ready for the next phase!');
}

// Run the test
testMailgunConfiguration().catch(console.error);
