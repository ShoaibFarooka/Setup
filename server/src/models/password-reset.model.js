const mongoose = require('mongoose');

// One document per open "forgot password" request; the link in the email carries the token
const passwordResetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // SHA-256 of the token, so a database leak does not expose working reset links
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        // TTL index: MongoDB deletes the document once it expires (within about a minute, so reads also
        // check expiresAt themselves)
        expiresAt: {
            type: Date,
            required: true,
            expires: 0,
        },
    },
    { timestamps: true },
);

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
