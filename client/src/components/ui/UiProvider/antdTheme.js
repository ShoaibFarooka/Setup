import { theme as antdThemes } from 'antd';

// Ant Design takes colours as JS values, not CSS variables, so its theme is read from theme.css at runtime:
// theme.css stays the only place colours are defined. Called again whenever the theme changes.
const TOKEN_VARIABLES = {
    colorPrimary: '--color-primary',
    colorSuccess: '--color-success',
    colorWarning: '--color-warning',
    colorError: '--color-danger',
    colorInfo: '--color-info',
    colorText: '--color-text',
    colorTextSecondary: '--color-text-muted',
    colorTextPlaceholder: '--color-text-subtle',
    colorBgLayout: '--color-bg',
    colorBgContainer: '--color-surface',
    colorBgElevated: '--color-surface-raised',
    colorBgMask: '--color-overlay',
    colorBorder: '--color-border',
    colorBorderSecondary: '--color-border',
    // Text on solid buttons: white on the light theme's dark colours, dark on the dark theme's bright ones
    colorTextLightSolid: '--color-on-primary',
    fontFamily: '--font-family',
};

const NUMBER_VARIABLES = {
    borderRadius: '--radius-md',
    controlHeight: '--control-height-md',
};

export const getAntdTheme = (theme) => {
    const styles = getComputedStyle(document.documentElement);
    const read = (variable) => styles.getPropertyValue(variable).trim();
    const token = {};

    Object.entries(TOKEN_VARIABLES).forEach(([key, variable]) => {
        const value = read(variable);
        if (value) {
            token[key] = value;
        }
    });
    Object.entries(NUMBER_VARIABLES).forEach(([key, variable]) => {
        const value = parseFloat(read(variable));
        if (!Number.isNaN(value)) {
            token[key] = value;
        }
    });

    return {
        algorithm: theme === 'dark' ? antdThemes.darkAlgorithm : antdThemes.defaultAlgorithm,
        token,
    };
};
