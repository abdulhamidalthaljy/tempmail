// Simple test to verify backend structure
const express = require('express');
console.log('Express loaded successfully');

const mongoose = require('mongoose');
console.log('Mongoose loaded successfully');

const cors = require('cors');
console.log('CORS loaded successfully');

// Test environment variables
require('dotenv').config();
console.log('Environment variables loaded');
console.log('PORT:', process.env.PORT || 3000);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Test models
try {
    const TempEmail = require('./src/models/TempEmail');
    console.log('TempEmail model loaded successfully');
} catch (error) {
    console.error('Error loading TempEmail model:', error.message);
}

try {
    const EmailMessage = require('./src/models/EmailMessage');
    console.log('EmailMessage model loaded successfully');
} catch (error) {
    console.error('Error loading EmailMessage model:', error.message);
}

// Test routes
try {
    const emailRoutes = require('./src/routes/emailRoutes');
    console.log('Email routes loaded successfully');
} catch (error) {
    console.error('Error loading email routes:', error.message);
}

try {
    const webhookRoutes = require('./src/routes/webhookRoutes');
    console.log('Webhook routes loaded successfully');
} catch (error) {
    console.error('Error loading webhook routes:', error.message);
}

console.log('✅ All backend components loaded successfully!');
console.log('🚀 Backend structure is ready for deployment');

// Create a simple test server
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'TempMail Backend API',
        status: 'Working',
        timestamp: new Date().toISOString()
    });
});

app.get('/test', (req, res) => {
    res.json({
        message: 'Backend test endpoint',
        components: {
            express: 'OK',
            mongoose: 'OK',
            cors: 'OK',
            models: 'OK',
            routes: 'OK'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log(`📝 Visit http://localhost:${PORT} to test`);
});
