const mongoose = require('mongoose');

const tempEmailSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    localPart: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        required: true,
        trim: true,
        default: process.env.EMAIL_DOMAIN || 'temp-mail.local'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
tempEmailSchema.index({ address: 1 }, { unique: true });
tempEmailSchema.index({ expiresAt: 1 });
tempEmailSchema.index({ createdAt: -1 });
tempEmailSchema.index({ isActive: 1 });

// Instance methods
tempEmailSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};

tempEmailSchema.methods.getTimeRemaining = function () {
    const now = new Date();
    const remaining = this.expiresAt - now;

    if (remaining <= 0) {
        return { expired: true, hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return { expired: false, hours, minutes, seconds };
};

tempEmailSchema.methods.updateLastAccessed = function () {
    this.lastAccessedAt = new Date();
    return this.save();
};

// Static methods
tempEmailSchema.statics.generateUniqueAddress = async function (domain = null) {
    const emailDomain = domain || process.env.EMAIL_DOMAIN || 'temp-mail.local';
    const { v4: uuidv4 } = require('uuid');

    let attempts = 0;
    let address;

    while (attempts < 10) {
        const localPart = uuidv4().split('-').join('').substring(0, 12);
        address = `${localPart}@${emailDomain}`;

        const existing = await this.findOne({ address });
        if (!existing) {
            return { address, localPart, domain: emailDomain };
        }

        attempts++;
    }

    throw new Error('Failed to generate unique email address after 10 attempts');
};

tempEmailSchema.statics.findByAddress = function (address) {
    return this.findOne({ address: address.toLowerCase(), isActive: true });
};

tempEmailSchema.statics.cleanupExpired = function () {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { isActive: false }
        ]
    });
};

tempEmailSchema.statics.getActiveCount = function () {
    return this.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } });
};

// Pre-save middleware
tempEmailSchema.pre('save', function (next) {
    if (this.isNew) {
        // Set expiration time if not set
        if (!this.expiresAt) {
            const expiryHours = parseInt(process.env.EMAIL_EXPIRY_HOURS) || 1;
            this.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
        }

        // Extract local part and domain from address
        if (this.address && !this.localPart) {
            const parts = this.address.split('@');
            this.localPart = parts[0];
            this.domain = parts[1] || this.domain;
        }
    }

    next();
});

module.exports = mongoose.model('TempEmail', tempEmailSchema);
