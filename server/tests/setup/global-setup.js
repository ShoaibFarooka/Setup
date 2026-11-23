const { removeStaleMongoDirs } = require('../helpers/stale-mongo-dirs');

// Runs once before all tests: clears in-memory databases that interrupted runs left in the temp folder,
// so cancelled runs cost at most one leftover until the next run instead of piling up
module.exports = async () => {
    removeStaleMongoDirs();
};
