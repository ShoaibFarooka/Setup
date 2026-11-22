const os = require('node:os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Starts a temporary MongoDB in memory, so tests never touch a real database
const connect = async () => {
    mongoServer = await MongoMemoryServer.create();
    // The driver loads `os` with a dynamic import(), which fails inside Jest's sandbox and breaks the
    // connection handshake; passing it in directly avoids that (upstream fix: NODE-7832)
    await mongoose.connect(mongoServer.getUri(), { runtimeAdapters: { os } });
};

const clear = async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const close = async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
};

module.exports = { connect, clear, close };
