jest.mock('../../src/configs/email.config', () => ({ sendMail: jest.fn() }));

const request = require('supertest');
const config = require('../../src/configs/app.config');
const transporter = require('../../src/configs/email.config');
const logger = require('../../src/utils/logger.util');
const app = require('../../src/app');
const db = require('../helpers/db');
const PasswordReset = require('../../src/models/password-reset.model');
const Session = require('../../src/models/session.model');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');
const { hashToken } = require('../../src/utils/auth.util');

const NEW_PASSWORD = 'NewPassword123';
const GENERIC_ANSWER = {
    success: true,
    message: 'If an account exists for that email, we have sent a link to reset the password',
    data: null,
};

const forgot = (email) => request(app).post('/api/auth/forgot-password').send({ email });
const reset = (body) => request(app).post('/api/auth/reset-password').send(body);

// The email is sent after the answer (so the answer time does not reveal the account): wait for it
const waitForMail = async () => {
    for (let i = 0; i < 100 && transporter.sendMail.mock.calls.length === 0; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return transporter.sendMail.mock.calls.at(-1)?.[0];
};

const tokenFrom = (mail) => mail.text.match(/token=([a-f\d]{64})/)[1];

// Asks for a link and returns the token from the email
const requestToken = async (email) => {
    transporter.sendMail.mockClear();
    await forgot(email);
    return tokenFrom(await waitForMail());
};

beforeAll(db.connect);
beforeEach(() => {
    config.email.enabled = true;
    config.email.from = 'no-reply@example.com';
    transporter.sendMail.mockResolvedValue({ messageId: '1' });
});
afterEach(async () => {
    jest.clearAllMocks();
    await db.clear();
});
afterAll(db.close);

describe('POST /api/auth/forgot-password', () => {
    test('emails a reset link to the account (HTML and plain text) and stores only the token hash', async () => {
        const { user } = await createUser({ name: 'Ada Lovelace', email: 'ada@example.com' });

        const res = await forgot('  ADA@example.com ');
        const mail = await waitForMail();

        expect(res.status).toBe(200);
        expect(res.body).toEqual(GENERIC_ANSWER);
        expect(mail).toMatchObject({ from: 'no-reply@example.com', to: 'ada@example.com', subject: 'Reset your password' });
        expect(mail.text).toContain('Hi Ada Lovelace,');
        expect(mail.text).toContain(`${config.clientUrl}/reset-password?token=`);
        expect(mail.html).toContain('Reset password</a>');

        const token = tokenFrom(mail);
        const stored = await PasswordReset.findOne({ user: user._id }).lean();
        expect(stored.tokenHash).toBe(hashToken(token));
        expect(stored.tokenHash).not.toBe(token);
        const minutes = (stored.expiresAt - Date.now()) / 60000;
        expect(minutes).toBeGreaterThan(29);
        expect(minutes).toBeLessThanOrEqual(30);
    });

    test('an unknown email gets the same answer and no email is sent', async () => {
        const res = await forgot('nobody@example.com');
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(res.status).toBe(200);
        expect(res.body).toEqual(GENERIC_ANSWER);
        expect(transporter.sendMail).not.toHaveBeenCalled();
        expect(await PasswordReset.countDocuments()).toBe(0);
    });

    test('a new request replaces the earlier link: only the newest works', async () => {
        const { user } = await createUser();
        const first = await requestToken(user.email);
        const second = await requestToken(user.email);

        expect(await PasswordReset.countDocuments({ user: user._id })).toBe(1);
        expect((await reset({ token: first, password: NEW_PASSWORD })).status).toBe(400);
        expect((await reset({ token: second, password: NEW_PASSWORD })).status).toBe(200);
    });

    test('when sending fails the answer is still the same; the failure is logged', async () => {
        const { user } = await createUser();
        transporter.sendMail.mockRejectedValue(new Error('SMTP down'));

        const res = await forgot(user.email);
        await waitForMail();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(res.status).toBe(200);
        expect(logger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Error sending email');
    });

    test('email disabled -> 500 for every address, so it does not reveal which accounts exist', async () => {
        config.email.enabled = false;
        const { user } = await createUser();

        const known = await forgot(user.email);
        const unknown = await forgot('nobody@example.com');

        expect(known.status).toBe(500);
        expect(unknown.status).toBe(500);
        expect(known.body).toEqual(unknown.body);
        expect(known.body.message).toBe('Email is not configured!');
    });

    test('an invalid email -> 400 with details', async () => {
        const res = await forgot('not-an-email');

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual({ email: 'Enter a valid email address' });
    });

    test('NoSQL injection in the email is rejected', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: { $ne: null } });

        expect(res.status).toBe(400);
        expect(transporter.sendMail).not.toHaveBeenCalled();
    });
});

describe('POST /api/auth/reset-password', () => {
    test('sets the new password: the new one logs in, the old one no longer does', async () => {
        const { user, password } = await createUser();
        const token = await requestToken(user.email);

        const res = await reset({ token, password: NEW_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Your password has been changed. Log in with the new password', data: null });
        expect((await loginAs(user.email, password)).res.status).toBe(401);
        expect((await loginAs(user.email, NEW_PASSWORD)).res.status).toBe(200);
    });

    test('ends every session of the account and clears the refresh cookie', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);
        await loginAs(user.email, password);
        expect(await Session.countDocuments({ user: user._id })).toBe(2);
        const token = await requestToken(user.email);

        const res = await reset({ token, password: NEW_PASSWORD });

        expect(await Session.countDocuments({ user: user._id })).toBe(0);
        expect(res.headers['set-cookie'][0]).toMatch(/^refreshToken=;/);
        const refreshed = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);
        expect(refreshed.status).toBe(401);
    });

    test('a link works only once', async () => {
        const { user } = await createUser();
        const token = await requestToken(user.email);

        await reset({ token, password: NEW_PASSWORD });
        const again = await reset({ token, password: 'Another123' });

        expect(again.status).toBe(400);
        expect(again.body).toEqual({ success: false, message: 'This reset link is invalid or has expired' });
    });

    test('an expired link -> 400', async () => {
        const { user } = await createUser();
        const token = await requestToken(user.email);
        await PasswordReset.updateOne({ user: user._id }, { expiresAt: new Date(Date.now() - 1000) });

        const res = await reset({ token, password: NEW_PASSWORD });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This reset link is invalid or has expired');
    });

    test('an unknown token -> 400', async () => {
        const res = await reset({ token: 'a'.repeat(64), password: NEW_PASSWORD });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This reset link is invalid or has expired');
    });

    test('a weak password -> 400 with details, and the link still works afterwards', async () => {
        const { user } = await createUser();
        const token = await requestToken(user.email);

        const res = await reset({ token, password: 'short1' });

        expect(res.status).toBe(400);
        expect(res.body.errors.password).toBe('Password must be at least 8 characters');
        expect((await reset({ token, password: NEW_PASSWORD })).status).toBe(200);
    });

    test('a malformed token or unknown fields -> 400', async () => {
        const malformed = await reset({ token: 'not-hex', password: NEW_PASSWORD });
        const extra = await reset({ token: 'a'.repeat(64), password: NEW_PASSWORD, role: 'admin' });

        expect(malformed.body.errors).toEqual({ token: 'Reset token is invalid' });
        expect(extra.status).toBe(400);
        expect(extra.body.errors).toEqual({ unknownFields: ['role'] });
    });
});
