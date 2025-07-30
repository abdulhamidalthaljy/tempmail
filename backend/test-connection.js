// Quick test to verify MongoDB Atlas connection
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('🔗 Testing MongoDB Atlas connection...');
        console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ MongoDB Atlas connected successfully!');

        // Test creating a simple document
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);

        const testDoc = new TestModel({ test: 'connection-test' });
        await testDoc.save();
        console.log('✅ Database write test successful!');

        await TestModel.deleteOne({ test: 'connection-test' });
        console.log('✅ Database delete test successful!');

        await mongoose.connection.close();
        console.log('🎉 All tests passed! Your backend is ready to run.');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
