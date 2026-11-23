describe('appConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    test('uses VITE_BASE_URL as the server address', async () => {
        const { appConfig } = await import('@/config/appConfig');

        expect(appConfig.apiUrl).toBe('http://api.test');
    });

    test('stops with a clear message when VITE_BASE_URL is missing', async () => {
        vi.stubEnv('VITE_BASE_URL', '');
        vi.resetModules();

        await expect(import('@/config/appConfig')).rejects.toThrow('VITE_BASE_URL is not set');
    });
});
