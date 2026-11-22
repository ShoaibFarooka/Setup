const Session = require('../models/session.model');

const createSession = (data) => Session.create(data);

const findSessionByTokenHash = (tokenHash) => Session.findOne({ tokenHash });

const updateSessionById = (sessionId, update) =>
    Session.findByIdAndUpdate(sessionId, update, { returnDocument: 'after' });

const deleteSessionById = (sessionId) => Session.findByIdAndDelete(sessionId);

const deleteSessionByTokenHash = (tokenHash) => Session.deleteOne({ tokenHash });

const deleteSessionsByUserId = (userId) => Session.deleteMany({ user: userId });

module.exports = {
    createSession,
    findSessionByTokenHash,
    updateSessionById,
    deleteSessionById,
    deleteSessionByTokenHash,
    deleteSessionsByUserId,
};
