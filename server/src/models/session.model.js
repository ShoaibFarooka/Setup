const mongoose = require('mongoose');

// One document per logged-in device; deleting it logs that device out
const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // SHA-256 of the refresh token, so a database leak does not expose usable tokens
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        // TTL index: MongoDB deletes the session automatically once it expires
        expiresAt: {
            type: Date,
            required: true,
            expires: 0,
        },
    },
    { timestamps: true },
);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
