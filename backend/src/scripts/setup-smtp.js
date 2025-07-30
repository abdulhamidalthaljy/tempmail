#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 TempMail SMTP Configuration Setup');
console.log('=====================================\n');

const envPath = path.join(__dirname, '../.env');

function readEnvFile() {
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (error) {
        console.error('❌ Error reading .env file:', error.message);
        process.exit(1);
    }
}

function writeEnvFile(env) {
    try {
        const content = Object.entries(env)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n') + '\n';

        fs.writeFileSync(envPath, content);
        console.log('✅ .env file updated successfully!');
    } catch (error) {
        console.error('❌ Error writing .env file:', error.message);
        process.exit(1);
    }
}

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function setupSMTP() {
    console.log('Choose your SMTP setup option:\n');
    console.log('1. Keep Mock Email Mode (Development)');
    console.log('2. Enable Real SMTP Server (Production)');
    console.log('3. Configure Webhook Integration');

    const choice = await askQuestion('\nEnter your choice (1-3): ');

    const env = readEnvFile();

    switch (choice) {
        case '1':
            env.MOCK_EMAIL_ENABLED = 'true';
            console.log('\n✅ Mock email mode will remain enabled');
            break;

        case '2':
            await setupRealSMTP(env);
            break;

        case '3':
            await setupWebhooks(env);
            break;

        default:
            console.log('❌ Invalid choice. Keeping current configuration.');
            break;
    }

    writeEnvFile(env);
    rl.close();
}

async function setupRealSMTP(env) {
    console.log('\n🔧 Real SMTP Server Configuration');
    console.log('==================================\n');

    const domain = await askQuestion('Enter your domain (e.g., yourdomain.com): ');
    const port = await askQuestion('Enter SMTP port (default: 25): ') || '25';
    const host = await askQuestion('Enter SMTP host (default: 0.0.0.0): ') || '0.0.0.0';

    env.MOCK_EMAIL_ENABLED = 'false';
    env.EMAIL_DOMAIN = domain;
    env.SMTP_PORT = port;
    env.SMTP_HOST = host;

    console.log('\n✅ Real SMTP configuration saved!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up MX record: mail.' + domain + ' -> YOUR_SERVER_IP');
    console.log('2. Set up A record: mail.' + domain + ' -> YOUR_SERVER_IP');
    console.log('3. Open port ' + port + ' on your server firewall');
    console.log('4. Deploy your application to a server with public IP');
}

async function setupWebhooks(env) {
    console.log('\n🔧 Webhook Integration Configuration');
    console.log('====================================\n');

    console.log('Choose webhook provider:');
    console.log('1. Mailgun');
    console.log('2. SendGrid');
    console.log('3. Custom webhook');

    const provider = await askQuestion('Enter your choice (1-3): ');
    const domain = await askQuestion('Enter your domain: ');

    env.MOCK_EMAIL_ENABLED = 'false';
    env.EMAIL_DOMAIN = domain;
    env.WEBHOOK_PROVIDER = provider === '1' ? 'mailgun' : provider === '2' ? 'sendgrid' : 'custom';

    console.log('\n✅ Webhook configuration saved!');
    console.log('\n📋 Configure your webhook provider to send POST requests to:');
    console.log('https://yourdomain.com/api/webhook/' + env.WEBHOOK_PROVIDER);
}

// Run setup
setupSMTP().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
});
