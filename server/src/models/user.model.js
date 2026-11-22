const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9._-]{3,30}$/, 'Username must be 3-30 letters, digits, dots, underscores or hyphens'],
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            default: 'user',
            enum: ['admin', 'user'],
        },
    },
    { timestamps: true },
);

const User = mongoose.model('User', userSchema);

module.exports = User;
