const axios = require('axios');

async function testCompleteEmailFlow() {
    const baseURL = 'http://localhost:3000/api/email';

    try {
        console.log('🎯 Testing Complete TempMail SMTP Flow...\n');

        // Step 1: Create a new temporary email
        console.log('📧 Step 1: Creating temporary email...');
        const newEmailResponse = await axios.post(`${baseURL}/new`);
        const emailAddress = newEmailResponse.data.data.emailAddress;
        console.log(`✅ Created: ${emailAddress}\n`);

        // Step 2: Add a mock message
        console.log('📨 Step 2: Adding mock message...');
        const mockMessage = {
            subject: 'SMTP Test Message',
            from: 'test@example.com',
            body: 'This is a test message to demonstrate Reply and Forward functionality through Gmail SMTP.'
        };

        const mockResponse = await axios.post(`${baseURL}/${emailAddress}/mock-message`, mockMessage);
        const messageId = mockResponse.data.data.messageId;
        console.log(`✅ Mock message added with ID: ${messageId}\n`);

        // Step 3: Test SMTP Reply
        console.log('↩️  Step 3: Testing SMTP Reply...');
        const replyData = {
            subject: 'Re: SMTP Test Message',
            message: 'This is a reply sent through Gmail SMTP from TempMail!'
        };

        try {
            const replyResponse = await axios.post(`${baseURL}/${emailAddress}/reply/${messageId}`, replyData);
            console.log('✅ Reply sent successfully!');
            console.log('📧 Check your Gmail inbox for the reply email.\n');
        } catch (error) {
            console.log('❌ Reply failed:', error.response?.data?.error || error.message, '\n');
        }

        // Step 4: Test SMTP Forward
        console.log('↗️  Step 4: Testing SMTP Forward...');
        const forwardData = {
            to: 'abdalhamed9699@gmail.com', // Forward to your Gmail
            subject: 'Fwd: SMTP Test Message',
            message: 'This message was forwarded through Gmail SMTP from TempMail!'
        };

        try {
            const forwardResponse = await axios.post(`${baseURL}/${emailAddress}/forward/${messageId}`, forwardData);
            console.log('✅ Forward sent successfully!');
            console.log('📧 Check your Gmail inbox for the forwarded email.\n');
        } catch (error) {
            console.log('❌ Forward failed:', error.response?.data?.error || error.message, '\n');
        }

        // Step 5: Test SMTP verification
        console.log('🔍 Step 5: Verifying SMTP connection...');
        const verifyResponse = await axios.get(`${baseURL}/smtp/verify`);
        console.log('✅ SMTP Status:', verifyResponse.data.data.message);

        console.log('\n🎉 Complete SMTP test finished!');
        console.log('📧 Your temporary email:', emailAddress);
        console.log('💡 You can now use the frontend to test Reply and Forward buttons!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Install axios if not available
async function checkAxios() {
    try {
        require('axios');
        return true;
    } catch {
        console.log('📦 Installing axios...');
        const { execSync } = require('child_process');
        execSync('npm install axios', { stdio: 'inherit' });
        return true;
    }
}

checkAxios().then(() => testCompleteEmailFlow());
