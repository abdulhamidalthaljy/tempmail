const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');

async function setupDatabase() {
    try {
        console.log('🚀 Setting up TempMail database...');

        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tempmail';
        await mongoose.connect(mongoUri);

        console.log('📦 Connected to MongoDB');

        // Drop existing collections (optional - for clean setup)
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            if (collection.collectionName === 'tempemails' || collection.collectionName === 'emailmessages') {
                await collection.drop();
                console.log(`🗑️  Dropped collection: ${collection.collectionName}`);
            }
        }

        // Create indexes
        console.log('📋 Creating indexes...');

        // TempEmail indexes
        await TempEmail.collection.createIndex({ address: 1 }, { unique: true });
        await TempEmail.collection.createIndex({ expiresAt: 1 });
        await TempEmail.collection.createIndex({ createdAt: -1 });
        await TempEmail.collection.createIndex({ isActive: 1 });

        // EmailMessage indexes
        await EmailMessage.collection.createIndex({ tempEmailId: 1, receivedAt: -1 });
        await EmailMessage.collection.createIndex({ emailAddress: 1, receivedAt: -1 });
        await EmailMessage.collection.createIndex({ messageId: 1 }, { unique: true });
        await EmailMessage.collection.createIndex({ receivedAt: -1 });
        await EmailMessage.collection.createIndex({ isRead: 1 });
        await EmailMessage.collection.createIndex({ isDeleted: 1 });

        console.log('✅ Indexes created successfully');

        // Create sample data (optional)
        if (process.argv.includes('--sample-data')) {
            console.log('📝 Creating sample data...');
            await createSampleData();
        }

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('📦 MongoDB connection closed');
    }
}

async function createSampleData() {
    try {
        // Create sample temporary email
        const sampleEmail = new TempEmail({
            address: 'sample123@temp-mail.local',
            localPart: 'sample123',
            domain: 'temp-mail.local'
        });

        await sampleEmail.save();
        console.log(`📧 Created sample email: ${sampleEmail.address}`);

        // Create sample messages
        const sampleMessages = [
            {
                messageId: EmailMessage.generateMessageId(),
                tempEmailId: sampleEmail._id,
                emailAddress: sampleEmail.address,
                from: 'welcome@example.com',
                to: sampleEmail.address,
                subject: 'Welcome to our service!',
                body: 'Thank you for signing up. Please verify your email address.',
                source: 'mock'
            },
            {
                messageId: EmailMessage.generateMessageId(),
                tempEmailId: sampleEmail._id,
                emailAddress: sampleEmail.address,
                from: 'noreply@testsite.com',
                to: sampleEmail.address,
                subject: 'Your verification code',
                body: 'Your verification code is: 123456',
                source: 'mock'
            },
            {
                messageId: EmailMessage.generateMessageId(),
                tempEmailId: sampleEmail._id,
                emailAddress: sampleEmail.address,
                from: 'support@company.org',
                to: sampleEmail.address,
                subject: 'Password reset request',
                body: 'Someone requested a password reset for your account.',
                source: 'mock'
            }
        ];

        for (const messageData of sampleMessages) {
            const message = new EmailMessage(messageData);
            await message.save();
            console.log(`📨 Created sample message: ${message.subject}`);
        }

        console.log('✅ Sample data created successfully');

    } catch (error) {
        console.error('❌ Failed to create sample data:', error);
        throw error;
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = {
    setupDatabase,
    createSampleData
};
