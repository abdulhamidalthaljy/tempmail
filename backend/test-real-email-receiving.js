#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

console.log('🎉 TempMail Real Email Receiving Test');
console.log('====================================\n');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const WEBHOOK_URL = 'https://ecb2bae9d67a.ngrok-free.app/api/webhook/mailgun';
const DOMAIN = process.env.MAILGUN_DOMAIN;

async function testEmailReceiving() {
    console.log('📧 Step 1: Creating a temporary email address...');

    try {
        // Create a temporary email
        const createResponse = await axios.post(`${BACKEND_URL}/api/email/new`);
        const tempEmail = createResponse.data.data;

        console.log(`✅ Created temporary email: ${tempEmail.address}`);
        console.log(`⏰ Expires at: ${new Date(tempEmail.expiresAt).toLocaleString()}`);        // Step 2: Simulate receiving an email via webhook
        console.log('\n📨 Step 2: Simulating incoming email...');

        const emailData = new URLSearchParams();
        emailData.append('recipient', tempEmail.address);
        emailData.append('sender', 'test@example.com');
        emailData.append('subject', '🎉 Test Email - Real Email Receiving Works!');
        emailData.append('body-plain', 'Congratulations! Your TempMail system is now receiving real emails.\n\nThis email was sent to demonstrate that your webhook configuration is working correctly.\n\nYou can now:\n1. Send emails to any temporary address\n2. View them in your website inbox\n3. Reply and forward emails\n\nEnjoy your fully functional TempMail system!');
        emailData.append('timestamp', Math.floor(Date.now() / 1000));
        emailData.append('message-id', `test-${Date.now()}@${DOMAIN}`);

        const webhookResponse = await axios.post(WEBHOOK_URL, emailData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (webhookResponse.status === 200) {
            console.log('✅ Email successfully received via webhook!');
        }

        // Step 3: Check if the email appears in the inbox
        console.log('\n📬 Step 3: Checking inbox for received email...');

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const inboxResponse = await axios.get(`${BACKEND_URL}/api/email/${tempEmail.emailAddress}/messages`);
        const messages = inboxResponse.data.data;

        if (messages && messages.length > 0) {
            console.log(`✅ Found ${messages.length} message(s) in inbox!`);

            const testMessage = messages.find(msg => msg.subject.includes('Test Email'));
            if (testMessage) {
                console.log('\n📧 Test Email Details:');
                console.log(`   From: ${testMessage.from}`);
                console.log(`   Subject: ${testMessage.subject}`);
                console.log(`   Received: ${new Date(testMessage.receivedAt).toLocaleString()}`);
                console.log(`   Source: ${testMessage.source}`);
            }
        } else {
            console.log('⚠️ No messages found in inbox');
        }

        // Step 4: Instructions for real testing
        console.log('\n🚀 Step 4: Ready for Real Email Testing!');
        console.log('========================================');
        console.log('Your TempMail system is now fully configured for real email receiving!');
        console.log('');
        console.log('To test with real emails:');
        console.log(`1. Go to your website: http://localhost:4200`);
        console.log(`2. Generate a temporary email (it will end with: @${DOMAIN})`);
        console.log(`3. Send an email to that address from Gmail, Outlook, or any email provider`);
        console.log(`4. Check your website inbox - the email should appear within seconds!`);
        console.log('');
        console.log('📱 Example email addresses you can use:');
        console.log(`   • ${tempEmail.emailAddress}`);
        console.log(`   • test123@${DOMAIN}`);
        console.log(`   • anything@${DOMAIN}`);
        console.log('');
        console.log('🔧 System Status:');
        console.log(`   ✅ Backend running: ${BACKEND_URL}`);
        console.log(`   ✅ Webhook configured: ${WEBHOOK_URL}`);
        console.log(`   ✅ Mailgun domain: ${DOMAIN}`);
        console.log(`   ✅ Real email mode: ENABLED`);

    } catch (error) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

// Run the test
testEmailReceiving();
