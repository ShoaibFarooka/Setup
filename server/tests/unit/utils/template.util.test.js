const { renderTemplate, templateExists } = require('../../../src/utils/template.util');

const resetData = { appName: 'My App', name: 'Ada', resetUrl: 'http://localhost:5200/reset-password?token=abc', expiresInMinutes: 30 };

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
