import { theme as antdThemes } from 'antd';
import { getAntdTheme } from '@/components/ui/UiProvider/antdTheme';

const html = document.documentElement;

describe('Ant Design theme', () => {
    afterEach(() => html.removeAttribute('style'));

    test('takes its colours and sizes from the CSS variables, so theme.css is the only source', () => {
        html.style.setProperty('--color-primary', '#1F4D3A');
        html.style.setProperty('--color-surface', '#FFFFFF');
        html.style.setProperty('--radius-md', '8px');
        html.style.setProperty('--control-height-md', '40px');

        const { token } = getAntdTheme('light');

        expect(token).toMatchObject({ colorPrimary: '#1F4D3A', colorBgContainer: '#FFFFFF', borderRadius: 8, controlHeight: 40 });
    });

    test('variables that are not set are left to Ant Design\'s defaults', () => {
        const { token } = getAntdTheme('light');

        expect(token).not.toHaveProperty('colorPrimary');
        expect(token).not.toHaveProperty('borderRadius');
    });

    test('uses Ant Design\'s dark algorithm for the dark theme', () => {
        expect(getAntdTheme('dark').algorithm).toBe(antdThemes.darkAlgorithm);
        expect(getAntdTheme('light').algorithm).toBe(antdThemes.defaultAlgorithm);
    });
});
