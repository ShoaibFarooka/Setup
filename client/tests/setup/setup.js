import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { message, Modal } from 'antd';
import { server } from '../mocks/server';
import { session } from '@/lib/session';

// Ant Design uses window.matchMedia (responsive layouts), which jsdom does not have
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

// Pages are lazy-loaded: the first test of a file waits for the page's code, which takes over the 1s default
// when all files run at once. Only the wait gets longer; every findBy still fails if the element never appears.
configure({ asyncUtilTimeout: 5000 });

// Ant Design's tables, tabs and menus watch their size with ResizeObserver, which jsdom does not have
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// A request no handler answers fails the test, so every API call in a test is intended
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
    cleanup();
    // Ant Design's dialogs and messages live outside the rendered tree, so they are closed separately
    Modal.destroyAll();
    message.destroy();
    // Closing animations never finish in jsdom, so closed dialogs would stay in the page for the next test
    document.querySelectorAll('.ant-modal-root').forEach((element) => element.remove());
    server.resetHandlers();
    // Each test starts like a fresh page load: no session, no remembered theme
    session.reset();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove('theme-transition');
});

afterAll(() => server.close());
