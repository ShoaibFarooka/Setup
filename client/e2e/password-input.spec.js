import { expect, pageReady, test } from './fixtures';

// The show / hide password button, pressed like a person does: the mouse held for a moment (long enough for the
// pressed style to apply) at its top, middle and bottom. A button that moves while pressed loses the click when
// the mouse is released outside it, which only shows with real presses like these.
const pressAt = async (page, button, fraction) => {
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * fraction);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
};

const SCREENS = [
    { name: 'login', path: '/login', heading: 'Log into your Account', fields: ['Password'] },
    { name: 'reset password', path: `/reset-password?token=${'a'.repeat(64)}`, heading: 'Set a new password', fields: ['New password', 'Repeat new password'] },
];

for (const { name, path, heading, fields } of SCREENS) {
    test(`${name}: the eye button shows and hides the password wherever it is pressed`, async ({ page }) => {
        await page.goto(path);
        await pageReady(page, heading);
        for (const label of fields) {
            await page.getByLabel(label, { exact: true }).fill('Secret123');
        }

        // Alternating between the fields, so each button also works right after the other one was used
        for (const fraction of [0.1, 0.5, 0.9]) {
            for (const [index, label] of fields.entries()) {
                const input = page.getByLabel(label, { exact: true });
                const button = page.getByRole('button', { name: /^(Show|Hide) password$/ }).nth(index);

                await pressAt(page, button, fraction);
                await expect(input, `${label}, pressed at ${fraction * 100}% of the button's height`).toHaveAttribute('type', 'text');
                await expect(button).toHaveAccessibleName('Hide password');

                await pressAt(page, button, fraction);
                await expect(input).toHaveAttribute('type', 'password');
                await expect(button).toHaveAccessibleName('Show password');
            }
        }
        // Typing still works after toggling, and the value was kept
        await expect(page.getByLabel(fields[0], { exact: true })).toHaveValue('Secret123');
    });
}
