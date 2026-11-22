const request = require('supertest');
const app = require('../../src/app');

// Logs in through the API; returns the access token and the refresh token cookie
const loginAs = async (identifier, password) => {
    const res = await request(app).post('/api/auth/login').send({ identifier, password });
    return { token: res.body.data?.token, cookie: res.headers['set-cookie'], res };
};

module.exports = { loginAs };
