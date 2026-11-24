jest.mock('../../src/configs/email.config', () => ({ sendMail: jest.fn() }));

const request = require('supertest');
const config = require('../../src/configs/app.config');
const transporter = require('../../src/configs/email.config');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');

beforeAll(db.connect);
afterEach(async () => {
    jest.clearAllMocks();
    await db.clear();
});
afterAll(db.close);

const arabic = (req) => req.set('Accept-Language', 'ar');

describe('response language (Accept-Language)', () => {
    test('without the header: English, and the response says so', async () => {
        const res = await request(app).get('/');

        expect(res.body.message).toBe('Server is up!');
        expect(res.headers['content-language']).toBe('en');
        expect(res.headers.vary).toMatch(/Accept-Language/);
    });

    test('Arabic: success messages', async () => {
        const res = await arabic(request(app).get('/'));

        expect(res.body.message).toBe('الخادم يعمل!');
        expect(res.headers['content-language']).toBe('ar');
    });

    test('Arabic: errors thrown by services (AppError keys)', async () => {
        const res = await arabic(request(app).post('/api/auth/login')).send({ identifier: 'nobody', password: 'x' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'بيانات الدخول غير صحيحة!' });
    });

    test('Arabic: validation messages per field, with their values filled in', async () => {
        const { user } = await createUser({}, 'admin');
        const { token } = await loginAs(user.email, 'Password123!');

        const res = await arabic(request(app).get('/api/users?limit=101&sort=password').set('Authorization', `Bearer ${token}`));

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('فشل التحقق من معاملات الاستعلام');
        expect(res.body.errors).toEqual({
            limit: 'يجب ألا يزيد عدد العناصر عن ١٠٠',
            sort: 'يجب أن يكون الترتيب أحد القيم: name, -name, createdAt, -createdAt',
        });
    });

    test('Arabic: errors from the error handler itself (unknown route, malformed JSON)', async () => {
        const notFound = await arabic(request(app).get('/api/nothing-here'));
        const malformed = await arabic(request(app).post('/api/auth/login')).set('Content-Type', 'application/json').send('{"identifier":');

        expect(notFound.body.message).toBe('المسار غير موجود');
        expect(malformed.status).toBe(400);
        expect(malformed.body.message).toBe('محتوى الطلب ليس JSON صالحًا');
    });

    test('a language the server does not have falls back to English', async () => {
        const res = await request(app).get('/').set('Accept-Language', 'fr-FR,fr;q=0.9');

        expect(res.body.message).toBe('Server is up!');
        expect(res.headers['content-language']).toBe('en');
    });
});

describe('forgot password email language', () => {
    const waitForMail = async () => {
        for (let i = 0; i < 100 && transporter.sendMail.mock.calls.length === 0; i++) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return transporter.sendMail.mock.calls.at(-1)?.[0];
    };

    beforeEach(() => {
        config.email.enabled = true;
        transporter.sendMail.mockResolvedValue({ messageId: '1' });
    });

    test('is written in the language of the request: subject, text, HTML and its direction', async () => {
        const { user } = await createUser({ name: 'Ada' });

        const res = await arabic(request(app).post('/api/auth/forgot-password')).send({ email: user.email });
        const mail = await waitForMail();

        expect(res.body.message).toBe('إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فقد أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور');
        expect(mail.subject).toBe('إعادة تعيين كلمة المرور');
        expect(mail.text).toContain('مرحبًا Ada،');
        expect(mail.text).toContain('يعمل الرابط لمدة ٣٠ دقيقة');
        expect(mail.html).toContain('<html lang="ar" dir="rtl">');
        expect(mail.html).toContain('>إعادة تعيين كلمة المرور</a>');
    });

    test('is English without Accept-Language', async () => {
        const { user } = await createUser({ name: 'Ada' });

        await request(app).post('/api/auth/forgot-password').send({ email: user.email });
        const mail = await waitForMail();

        expect(mail.subject).toBe('Reset your password');
        expect(mail.text).toContain('Hi Ada,');
        expect(mail.html).toContain('<html lang="en" dir="ltr">');
    });
});
