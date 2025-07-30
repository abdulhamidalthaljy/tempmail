const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const emailRoutes = require('./routes/emailRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const cleanupService = require('./services/cleanupService');
const smtpService = require('./services/smtpService');
const realSMTPService = require('./services/realSMTPService');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable for API
}));

// CORS configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:4200',
        'http://localhost:3000',
        /\.railway\.app$/,  // Allow all Railway domains
        /\.vercel\.app$/,   // Allow Vercel domains
        /\.netlify\.app$/   // Allow Netlify domains
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: require('../package.json').version
    });
});

// API routes
app.use('/api/email', emailRoutes);
app.use('/api/webhook', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TempMail API Server',
        version: require('../package.json').version,
        endpoints: {
            health: '/health',
            email: '/api/email',
            webhook: '/api/webhook'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.NODE_ENV === 'test'
            ? process.env.MONGODB_TEST_URI
            : process.env.MONGODB_URI || 'mongodb://localhost:27017/tempmail';

        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('📍 Connection URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB connected successfully: ${mongoUri}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);

        if (mongoUri.includes('mongodb+srv')) {
            console.log('\n🔧 MongoDB Atlas connection failed. This might be due to:');
            console.log('   1. Incorrect cluster URL - please verify your Atlas cluster');
            console.log('   2. Network/firewall restrictions');
            console.log('   3. Atlas cluster not available (free tier limitations)');
            console.log('   4. IP address not whitelisted in Atlas');
            console.log('\n💡 To fix this:');
            console.log('   - Check your MongoDB Atlas cluster URL');
            console.log('   - Ensure your IP is whitelisted (0.0.0.0/0 for development)');
            console.log('   - Or switch to local MongoDB by updating MONGODB_URI in .env');
        } else {
            console.log('\n🔧 Local MongoDB connection failed. Please:');
            console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
            console.log('   2. Start MongoDB service');
            console.log('   3. Or update MONGODB_URI in .env file');
        }

        console.log('\n⚠️  Server will continue in limited mode without database...');
        // Don't exit - allow server to start for testing
    }
};

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start cleanup service
        cleanupService.start();
        console.log('🧹 Cleanup service started');

        // Start SMTP service based on configuration
        if (process.env.MOCK_EMAIL_ENABLED === 'true') {
            console.log('📧 Mock email mode enabled');
        } else {
            realSMTPService.start();
            console.log('📧 Real SMTP service started');
        }

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📝 API Documentation: http://localhost:${PORT}/`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received');
            server.close(() => {
                console.log('Process terminated');
                mongoose.connection.close();
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received');
            server.close(() => {
                console.log('Process terminated');
                mongoose.connection.close();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server only if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app;
