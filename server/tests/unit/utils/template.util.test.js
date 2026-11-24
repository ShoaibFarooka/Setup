const fs = require('node:fs');
const { renderTemplate, templateExists, getLogoDataUri, LOGO_PATH } = require('../../../src/utils/template.util');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('template.util logo', () => {
    test('the logo file is a PNG (mail apps do not show SVG)', () => {
        expect(fs.readFileSync(LOGO_PATH).subarray(0, 8)).toEqual(PNG_SIGNATURE);
    });

    test('getLogoDataUri returns the logo file as a data: URL', () => {
        const uri = getLogoDataUri();

        expect(uri).toMatch(/^data:image\/png;base64,/);
        expect(Buffer.from(uri.split(',')[1], 'base64')).toEqual(fs.readFileSync(LOGO_PATH));
    });

    test('the email and PDF layouts show the logo with the app name beside it', () => {
        const data = { appName: 'My App', logoSrc: 'cid:logo', name: 'Ada', resetUrl: 'http://x', minutes: 30 };

        const email = renderTemplate('emails/reset-password', data, { layout: 'layouts/email' });
        const pdf = renderTemplate('pdfs/sample-report', { ...data, title: 'Users', rows: [] }, { layout: 'layouts/pdf' });

        for (const html of [email, pdf]) {
            // Decorative image (alt=""): the name next to it still shows when a mail app blocks images
            expect(html).toMatch(/<img src="cid:logo" width="40" height="40" alt=""/);
            expect(html).toMatch(/>\s*My App\s*<\/td>/);
        }
    });
});

const resetData = { appName: 'My App', name: 'Ada', resetUrl: 'http://localhost:5200/reset-password?token=abc', minutes: 30 };

describe('template.util renderTemplate', () => {
    test('renders a template with its data', () => {
        const html = renderTemplate('emails/reset-password', resetData);

        expect(html).toContain('Hi Ada,');
        expect(html).toContain('works for 30 minutes');
        expect(html).not.toContain('<html');
    });

    test('puts the template into a layout, which gets the same data', () => {
        const html = renderTemplate('emails/reset-password', { ...resetData, subject: 'Reset your password' }, { layout: 'layouts/email' });

        expect(html).toMatch(/^<!doctype html>/i);
        expect(html).toContain('<title>Reset your password</title>');
        expect(html).toContain('Hi Ada,');
    });

    test('partials are available by file name', () => {
        const html = renderTemplate('emails/reset-password', resetData);

        // partials/button.hbs. Handlebars writes "=" as &#x3D;, which browsers and email programs read as "="
        expect(html).toContain('<a href="http://localhost:5200/reset-password?token&#x3D;abc"');
        expect(html).toContain('>Reset password</a>');
    });

    test('escapes data in HTML templates, so text from users cannot add markup', () => {
        const html = renderTemplate('emails/reset-password', { ...resetData, name: '<script>alert(1)</script>' });

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });

    test('plain-text templates are not escaped', () => {
        const text = renderTemplate('emails/reset-password.text', { ...resetData, name: "O'Brien & Co" });

        expect(text).toContain("Hi O'Brien & Co,");
        expect(text).toContain(resetData.resetUrl);
    });

    test('a missing template throws', () => {
        expect(() => renderTemplate('emails/does-not-exist')).toThrow(/ENOENT/);
    });

    test('a name outside the templates folder is refused', () => {
        expect(() => renderTemplate('../configs/app.config')).toThrow('Invalid template name');
        expect(() => templateExists('../../package')).toThrow('Invalid template name');
    });

    test('templateExists tells whether a template file is there', () => {
        expect(templateExists('emails/reset-password')).toBe(true);
        expect(templateExists('emails/nope')).toBe(false);
    });
});

describe('template.util languages', () => {
    const data = { appName: 'My App', logoSrc: 'cid:logo', name: 'Ada', resetUrl: 'http://x', minutes: 30 };

    test('{{t}} writes texts in the template\'s lang, filling placeholders from its data', () => {
        const english = renderTemplate('emails/reset-password.text', data);
        const arabic = renderTemplate('emails/reset-password.text', { ...data, lang: 'ar' });

        expect(english).toContain('Hi Ada,');
        expect(english).toContain('works for 30 minutes');
        expect(arabic).toContain('مرحبًا Ada،');
        expect(arabic).toContain('لمدة ٣٠ دقيقة');
    });

    test('layouts get lang and dir; right-to-left puts the logo\'s gap on its left', () => {
        const english = renderTemplate('emails/reset-password', data, { layout: 'layouts/email' });
        const arabic = renderTemplate('emails/reset-password', { ...data, lang: 'ar' }, { layout: 'layouts/email' });

        expect(english).toContain('<html lang="en" dir="ltr">');
        expect(english).toContain('padding:0 12px 0 0;');
        expect(arabic).toContain('<html lang="ar" dir="rtl">');
        expect(arabic).toContain('padding:0 0 0 12px;');
    });

    test('{{t}} output is escaped in HTML templates', () => {
        const html = renderTemplate('emails/reset-password', { ...data, name: '<b>Ada</b>' });

        expect(html).toContain('Hi &lt;b&gt;Ada&lt;/b&gt;,');
    });
});
