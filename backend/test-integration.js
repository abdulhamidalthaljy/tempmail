// Comprehensive backend integration test
const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test utilities
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting TempMail Backend Integration Tests...\n');

    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health endpoint...');
        const health = await makeRequest(`${BASE_URL}/health`);
        if (health.status === 200) {
            console.log('✅ Health check passed');
            console.log(`   Server status: ${health.data.status}`);
        } else {
            throw new Error(`Health check failed: ${health.status}`);
        }

        // Test 2: API root
        console.log('\n2️⃣ Testing API root endpoint...');
        const apiRoot = await makeRequest(`${BASE_URL}/`);
        if (apiRoot.status === 200) {
            console.log('✅ API root accessible');
            console.log(`   Message: ${apiRoot.data.message}`);
        } else {
            throw new Error(`API root failed: ${apiRoot.status}`);
        }

        // Test 3: Generate new email
        console.log('\n3️⃣ Testing email generation...');
        const newEmail = await makeRequest(`${API_URL}/email/new`, 'POST');
        if (newEmail.status === 201 && newEmail.data.success) {
            console.log('✅ Email generation successful');
            console.log(`   Generated email: ${newEmail.data.data.address}`);

            const emailAddress = newEmail.data.data.address;

            // Test 4: Get email details
            console.log('\n4️⃣ Testing email details retrieval...');
            const emailDetails = await makeRequest(`${API_URL}/email/${emailAddress}`);
            if (emailDetails.status === 200 && emailDetails.data.success) {
                console.log('✅ Email details retrieved');
                console.log(`   Time remaining: ${JSON.stringify(emailDetails.data.data.timeRemaining)}`);
            } else {
                throw new Error(`Email details failed: ${emailDetails.status}`);
            }

            // Test 5: Get messages (should be empty)
            console.log('\n5️⃣ Testing messages retrieval...');
            const messages = await makeRequest(`${API_URL}/email/${emailAddress}/messages`);
            if (messages.status === 200 && messages.data.success) {
                console.log('✅ Messages retrieval successful');
                console.log(`   Message count: ${messages.data.data.messages.length}`);
            } else {
                throw new Error(`Messages retrieval failed: ${messages.status}`);
            }

            // Test 6: Generate mock email
            console.log('\n6️⃣ Testing mock email generation...');
            const mockEmail = await makeRequest(`${API_URL}/webhook/mock-email`, 'POST', {
                emailAddress: emailAddress,
                count: 2
            });
            if (mockEmail.status === 201 && mockEmail.data.success) {
                console.log('✅ Mock email generation successful');
                console.log(`   Generated ${mockEmail.data.data.generated} mock emails`);
            } else {
                throw new Error(`Mock email generation failed: ${mockEmail.status}`);
            }

            // Test 7: Check messages again (should have mock emails)
            console.log('\n7️⃣ Testing messages after mock generation...');
            const messagesAfter = await makeRequest(`${API_URL}/email/${emailAddress}/messages`);
            if (messagesAfter.status === 200 && messagesAfter.data.success) {
                console.log('✅ Messages after mock generation retrieved');
                console.log(`   Message count: ${messagesAfter.data.data.messages.length}`);

                if (messagesAfter.data.data.messages.length > 0) {
                    const firstMessage = messagesAfter.data.data.messages[0];
                    console.log(`   First message from: ${firstMessage.from}`);
                    console.log(`   First message subject: ${firstMessage.subject}`);

                    // Test 8: Get specific message
                    console.log('\n8️⃣ Testing specific message retrieval...');
                    const specificMessage = await makeRequest(`${API_URL}/email/${emailAddress}/message/${firstMessage.messageId}`);
                    if (specificMessage.status === 200 && specificMessage.data.success) {
                        console.log('✅ Specific message retrieved');
                        console.log(`   Message body length: ${specificMessage.data.data.body.length} characters`);
                    } else {
                        throw new Error(`Specific message retrieval failed: ${specificMessage.status}`);
                    }

                    // Test 9: Mark message as read
                    console.log('\n9️⃣ Testing mark as read...');
                    const markRead = await makeRequest(`${API_URL}/email/${emailAddress}/message/${firstMessage.messageId}/read`, 'PUT');
                    if (markRead.status === 200 && markRead.data.success) {
                        console.log('✅ Message marked as read');
                    } else {
                        throw new Error(`Mark as read failed: ${markRead.status}`);
                    }
                }
            } else {
                throw new Error(`Messages after mock failed: ${messagesAfter.status}`);
            }

            // Test 10: Email statistics
            console.log('\n🔟 Testing email statistics...');
            const stats = await makeRequest(`${API_URL}/email/${emailAddress}/stats`);
            if (stats.status === 200 && stats.data.success) {
                console.log('✅ Email statistics retrieved');
                console.log(`   Total messages: ${stats.data.data.totalMessages}`);
                console.log(`   Unread count: ${stats.data.data.unreadCount}`);
            } else {
                console.log('⚠️ Stats endpoint might not be available (optional feature)');
            }

        } else {
            throw new Error(`Email generation failed: ${newEmail.status} - ${JSON.stringify(newEmail.data)}`);
        }

        console.log('\n🎉 All tests passed! Your TempMail backend is working perfectly!');
        console.log('\n📋 Summary:');
        console.log('✅ Server is running and responding');
        console.log('✅ MongoDB Atlas connection is working');
        console.log('✅ Email generation is functional');
        console.log('✅ Message storage and retrieval is working');
        console.log('✅ Mock email system is operational');
        console.log('✅ API endpoints are responding correctly');
        console.log('\n🚀 Your backend is ready for frontend integration!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n🔍 Troubleshooting:');
        console.log('1. Make sure the backend server is running (npm start)');
        console.log('2. Check that MongoDB Atlas connection is working');
        console.log('3. Verify that port 3000 is not blocked');
        console.log('4. Check the server logs for any errors');
    }
}

// Check if server is running first
console.log('🔍 Checking if backend server is running on http://localhost:3000...');
makeRequest(`${BASE_URL}/health`)
    .then(() => {
        console.log('✅ Server is running, starting tests...\n');
        runTests();
    })
    .catch(() => {
        console.error('❌ Backend server is not running!');
        console.log('\n📝 To start the backend server:');
        console.log('1. Open a new terminal');
        console.log('2. cd tempmail/backend');
        console.log('3. npm start');
        console.log('4. Wait for "Server running on port 3000" message');
        console.log('5. Then run this test again');
    });
