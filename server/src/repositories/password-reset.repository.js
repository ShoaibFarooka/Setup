const mongoose = require('mongoose');
const PasswordReset = require('../models/password-reset.model');

const createPasswordReset = (data) => PasswordReset.create(data);

// Finds and deletes in one step, so a link works only once even when two requests use it at the same time.
// Only a link that has not expired yet: the TTL index removes expired ones a little later.
const consumePasswordReset = (tokenHash) => PasswordReset.findOneAndDelete(
    { tokenHash, expiresAt: mongoose.trusted({ $gt: new Date() }) },
    { projection: { user: 1 }, lean: true },
);

const deletePasswordResetsByUserId = (userId) => PasswordReset.deleteMany({ user: userId });

module.exports = {
    createPasswordReset,
    consumePasswordReset,
    deletePasswordResetsByUserId,
};
