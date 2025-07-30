const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    content: {
        type: Buffer
    },
    contentId: String,
    downloadUrl: String
}, { _id: false });

const emailMessageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true
    },
    tempEmailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TempEmail',
        required: true
    },
    emailAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    from: {
        type: String,
        required: true,
        trim: true
    },
    to: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        default: '',
        trim: true
    },
    body: {
        type: String,
        default: ''
    },
    bodyHtml: {
        type: String,
        default: ''
    },
    bodyText: {
        type: String,
        default: ''
    },
    attachments: [attachmentSchema],
    headers: {
        type: Map,
        of: String,
        default: new Map()
    },
    receivedAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['high', 'normal', 'low'],
        default: 'normal'
    },
    size: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        enum: ['smtp', 'webhook', 'mock', 'api', 'mailgun'],
        default: 'smtp'
    },
    rawMessage: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.rawMessage; // Don't include raw message in JSON response
            delete ret.tempEmailId; // Don't expose internal reference
            return ret;
        }
    }
});

// Indexes for performance
emailMessageSchema.index({ tempEmailId: 1, receivedAt: -1 });
emailMessageSchema.index({ emailAddress: 1, receivedAt: -1 });
emailMessageSchema.index({ messageId: 1 }, { unique: true });
emailMessageSchema.index({ receivedAt: -1 });
emailMessageSchema.index({ isRead: 1 });
emailMessageSchema.index({ isDeleted: 1 });

// Instance methods
emailMessageSchema.methods.markAsRead = function () {
    this.isRead = true;
    return this.save();
};

emailMessageSchema.methods.markAsDeleted = function () {
    this.isDeleted = true;
    return this.save();
};

emailMessageSchema.methods.getPreview = function (length = 100) {
    const text = this.bodyText || this.body.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
};

emailMessageSchema.methods.hasAttachments = function () {
    return this.attachments && this.attachments.length > 0;
};

emailMessageSchema.methods.getFormattedSize = function () {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Static methods
emailMessageSchema.statics.findByEmailAddress = function (emailAddress, options = {}) {
    const query = {
        emailAddress: emailAddress.toLowerCase(),
        isDeleted: false
    };

    return this.find(query)
        .sort({ receivedAt: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
};

emailMessageSchema.statics.findByMessageId = function (messageId) {
    return this.findOne({ messageId, isDeleted: false });
};

emailMessageSchema.statics.getUnreadCount = function (emailAddress) {
    return this.countDocuments({
        emailAddress: emailAddress.toLowerCase(),
        isRead: false,
        isDeleted: false
    });
};

emailMessageSchema.statics.markAllAsRead = function (emailAddress) {
    return this.updateMany(
        {
            emailAddress: emailAddress.toLowerCase(),
            isRead: false,
            isDeleted: false
        },
        { isRead: true }
    );
};

emailMessageSchema.statics.deleteByEmailAddress = function (emailAddress) {
    return this.updateMany(
        { emailAddress: emailAddress.toLowerCase() },
        { isDeleted: true }
    );
};

emailMessageSchema.statics.cleanupDeleted = function () {
    return this.deleteMany({ isDeleted: true });
};

emailMessageSchema.statics.cleanupOldMessages = function (daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.deleteMany({
        receivedAt: { $lt: cutoffDate }
    });
};

emailMessageSchema.statics.generateMessageId = function () {
    const { v4: uuidv4 } = require('uuid');
    return `${uuidv4()}@${process.env.EMAIL_DOMAIN || 'temp-mail.local'}`;
};

// Pre-save middleware
emailMessageSchema.pre('save', function (next) {
    if (this.isNew) {
        // Generate message ID if not provided
        if (!this.messageId) {
            this.messageId = this.constructor.generateMessageId();
        }

        // Calculate message size
        this.size = Buffer.byteLength(this.body || '', 'utf8') +
            Buffer.byteLength(this.bodyHtml || '', 'utf8') +
            (this.attachments || []).reduce((total, att) => total + (att.size || 0), 0);

        // Extract text content if only HTML is provided
        if (this.bodyHtml && !this.bodyText) {
            this.bodyText = this.bodyHtml.replace(/<[^>]*>/g, '').trim();
        }

        // Use bodyText as body if body is empty
        if (!this.body && this.bodyText) {
            this.body = this.bodyText;
        }
    }

    next();
});

// Post-save middleware to update TempEmail message count
emailMessageSchema.post('save', async function (doc) {
    if (doc.tempEmailId && !doc.isDeleted) {
        try {
            await mongoose.model('TempEmail').findByIdAndUpdate(
                doc.tempEmailId,
                {
                    $inc: { messageCount: 1 },
                    $set: { lastAccessedAt: new Date() }
                }
            );
        } catch (error) {
            console.error('Error updating TempEmail message count:', error);
        }
    }
});

module.exports = mongoose.model('EmailMessage', emailMessageSchema);
