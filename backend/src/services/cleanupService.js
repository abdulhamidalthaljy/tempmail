const cron = require('node-cron');
const TempEmail = require('../models/TempEmail');
const EmailMessage = require('../models/EmailMessage');

class CleanupService {
    constructor() {
        this.isRunning = false;
        this.task = null;
    }

    start() {
        if (this.isRunning) {
            console.log('🧹 Cleanup service is already running');
            return;
        }

        const intervalMinutes = parseInt(process.env.CLEANUP_INTERVAL_MINUTES) || 5;

        // Schedule cleanup every X minutes
        this.task = cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
            await this.performCleanup();
        }, {
            scheduled: false
        });

        this.task.start();
        this.isRunning = true;

        console.log(`🧹 Cleanup service started - running every ${intervalMinutes} minutes`);

        // Run initial cleanup
        setTimeout(() => this.performCleanup(), 5000);
    }

    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
        this.isRunning = false;
        console.log('🧹 Cleanup service stopped');
    }

    async performCleanup() {
        try {
            console.log('🧹 Starting cleanup process...');

            const cleanupResults = {
                expiredEmails: 0,
                deletedMessages: 0,
                oldMessages: 0,
                timestamp: new Date().toISOString()
            };

            // 1. Clean up expired temporary emails
            const expiredEmails = await TempEmail.cleanupExpired();
            cleanupResults.expiredEmails = expiredEmails.deletedCount;

            // 2. Clean up messages marked as deleted
            const deletedMessages = await EmailMessage.cleanupDeleted();
            cleanupResults.deletedMessages = deletedMessages.deletedCount;

            // 3. Clean up old messages (older than 7 days)
            const oldMessages = await EmailMessage.cleanupOldMessages(7);
            cleanupResults.oldMessages = oldMessages.deletedCount;

            // 4. Clean up messages for expired emails
            const expiredEmailAddresses = await TempEmail.find({
                isActive: false
            }).select('address');

            let orphanedMessages = 0;
            for (const email of expiredEmailAddresses) {
                const result = await EmailMessage.deleteByEmailAddress(email.address);
                orphanedMessages += result.modifiedCount;
            }

            // 5. Remove inactive email records
            await TempEmail.deleteMany({ isActive: false });

            // 6. Enforce message limits per email
            await this.enforceMessageLimits();

            const totalCleaned = cleanupResults.expiredEmails +
                cleanupResults.deletedMessages +
                cleanupResults.oldMessages +
                orphanedMessages;

            if (totalCleaned > 0) {
                console.log(`🧹 Cleanup completed:`, {
                    ...cleanupResults,
                    orphanedMessages,
                    totalCleaned
                });
            }

            // Log system statistics
            await this.logSystemStats();

        } catch (error) {
            console.error('❌ Cleanup service error:', error);
        }
    }

    async enforceMessageLimits() {
        try {
            const maxMessages = parseInt(process.env.MAX_MESSAGES_PER_EMAIL) || 50;

            // Find emails with too many messages
            const emailsWithTooManyMessages = await EmailMessage.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: '$emailAddress',
                        count: { $sum: 1 },
                        messages: { $push: { messageId: '$messageId', receivedAt: '$receivedAt' } }
                    }
                },
                { $match: { count: { $gt: maxMessages } } }
            ]);

            for (const email of emailsWithTooManyMessages) {
                // Sort messages by receivedAt and keep only the most recent ones
                const sortedMessages = email.messages
                    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
                    .slice(maxMessages); // Remove the oldest messages

                const messageIdsToDelete = sortedMessages.map(m => m.messageId);

                if (messageIdsToDelete.length > 0) {
                    await EmailMessage.updateMany(
                        { messageId: { $in: messageIdsToDelete } },
                        { isDeleted: true }
                    );

                    console.log(`🧹 Enforced message limit for ${email._id}: removed ${messageIdsToDelete.length} old messages`);
                }
            }
        } catch (error) {
            console.error('❌ Error enforcing message limits:', error);
        }
    }

    async logSystemStats() {
        try {
            const stats = await this.getSystemStats();

            if (process.env.NODE_ENV === 'development') {
                console.log('📊 System Stats:', stats);
            }
        } catch (error) {
            console.error('❌ Error getting system stats:', error);
        }
    }

    async getSystemStats() {
        const [
            activeEmails,
            totalMessages,
            unreadMessages,
            oldestEmail,
            newestEmail
        ] = await Promise.all([
            TempEmail.getActiveCount(),
            EmailMessage.countDocuments({ isDeleted: false }),
            EmailMessage.countDocuments({ isDeleted: false, isRead: false }),
            TempEmail.findOne({ isActive: true }).sort({ createdAt: 1 }),
            TempEmail.findOne({ isActive: true }).sort({ createdAt: -1 })
        ]);

        return {
            activeEmails,
            totalMessages,
            unreadMessages,
            readMessages: totalMessages - unreadMessages,
            oldestEmailAge: oldestEmail ?
                Math.floor((Date.now() - oldestEmail.createdAt.getTime()) / (1000 * 60 * 60)) + ' hours' :
                'N/A',
            newestEmailAge: newestEmail ?
                Math.floor((Date.now() - newestEmail.createdAt.getTime()) / (1000 * 60)) + ' minutes' :
                'N/A'
        };
    }

    // Manual cleanup methods
    async forceCleanup() {
        console.log('🧹 Forcing immediate cleanup...');
        await this.performCleanup();
    }

    async cleanupOldData(daysOld = 1) {
        console.log(`🧹 Cleaning up data older than ${daysOld} days...`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // Delete old emails
        const oldEmails = await TempEmail.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        // Delete old messages
        const oldMessages = await EmailMessage.deleteMany({
            receivedAt: { $lt: cutoffDate }
        });

        console.log(`🧹 Cleanup completed: ${oldEmails.deletedCount} emails, ${oldMessages.deletedCount} messages`);

        return {
            deletedEmails: oldEmails.deletedCount,
            deletedMessages: oldMessages.deletedCount
        };
    }

    async deleteAllData() {
        console.log('🧹 Deleting all data (USE WITH CAUTION)...');

        const [deletedMessages, deletedEmails] = await Promise.all([
            EmailMessage.deleteMany({}),
            TempEmail.deleteMany({})
        ]);

        console.log(`🧹 All data deleted: ${deletedEmails.deletedCount} emails, ${deletedMessages.deletedCount} messages`);

        return {
            deletedEmails: deletedEmails.deletedCount,
            deletedMessages: deletedMessages.deletedCount
        };
    }
}

// Create singleton instance
const cleanupService = new CleanupService();

module.exports = cleanupService;
