import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, failure } from '../mocks/responses';

// Opens the language menu (the globe button) and picks a language by its own name
const chooseLanguage = async (user, name) => {
    await user.click(screen.getByRole('button', { name: /^(Language|اللغة):/ }));
    await user.click(await screen.findByRole('menuitem', { name }));
};

describe('language', () => {
    test('English by default, left to right', async () => {
        renderApp({ route: '/login' });

        expect(await screen.findByRole('heading', { name: 'Log into your Account' })).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute('lang', 'en');
        expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    });

    test('switching to Arabic on the login page translates everything, turns the page right to left and remembers it', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByRole('heading', { name: 'Log into your Account' });

        await chooseLanguage(user, 'العربية');

        expect(await screen.findByRole('heading', { name: 'تسجيل الدخول إلى حسابك' })).toBeInTheDocument();
        expect(screen.getByLabelText('البريد الإلكتروني أو اسم المستخدم')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'نسيت كلمة المرور؟' })).toBeInTheDocument();
        // The ui kit's own words too (the eye button)
        expect(screen.getByRole('button', { name: 'إظهار كلمة المرور' })).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute('lang', 'ar');
        expect(document.documentElement).toHaveAttribute('dir', 'rtl');
        expect(localStorage.getItem('language')).toBe('ar');
    });

    test('form errors switch language with the page', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByRole('heading', { name: 'Log into your Account' });
        await user.click(screen.getByRole('button', { name: 'Log In' }));
        expect(screen.getByText('Email or username is required!')).toBeInTheDocument();

        await chooseLanguage(user, 'العربية');

        expect(await screen.findByText('البريد الإلكتروني أو اسم المستخدم مطلوب!')).toBeInTheDocument();
        expect(screen.queryByText('Email or username is required!')).not.toBeInTheDocument();
    });

    test('requests ask the server for the chosen language, and its messages are shown as they come', async () => {
        const languages = [];
        server.use(http.post(`${API}/api/auth/login`, ({ request }) => {
            languages.push(request.headers.get('Accept-Language'));
            return failure(401, 'بيانات الدخول غير صحيحة!');
        }));
        const { user } = renderApp({ route: '/login' });
        await screen.findByRole('heading', { name: 'Log into your Account' });
        await chooseLanguage(user, 'العربية');
        await screen.findByRole('heading', { name: 'تسجيل الدخول إلى حسابك' });

        await user.type(screen.getByLabelText('البريد الإلكتروني أو اسم المستخدم'), 'admin');
        await user.type(screen.getByLabelText('كلمة المرور'), 'wrong');
        await user.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

        expect(await screen.findByText('بيانات الدخول غير صحيحة!')).toBeInTheDocument();
        expect(languages).toEqual(['ar']);
    });

    test('a saved Arabic choice opens the app in Arabic: sidebar, page, role, dates and numbers (Arabic-Indic digits)', async () => {
        localStorage.setItem('language', 'ar');
        loggedIn();
        renderApp({ route: '/users' });

        expect(await screen.findByRole('heading', { level: 1, name: 'المستخدمون' })).toBeInTheDocument();
        // The sidebar (the pagination is the other, named navigation)
        const nav = screen.getByRole('navigation', { name: '' });
        expect(within(nav).getByText('لوحة التحكم')).toBeInTheDocument();
        expect(within(nav).getByText('تسجيل الخروج')).toBeInTheDocument();
        expect(within(nav).getByText('مسؤول')).toBeInTheDocument();
        expect(await screen.findByText('عرض ٢٠ من ٢٥ (الصفحة ١ من ٢)')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'تاريخ الانضمام' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الصفحة التالية' })).toBeInTheDocument();
        // Page buttons show their number in Arabic digits, and say it the same way
        expect(screen.getByRole('button', { name: 'الصفحة ٢' })).toHaveTextContent('٢');
        expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    });

    test('switching back to English from the sidebar', async () => {
        localStorage.setItem('language', 'ar');
        loggedIn();
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' });

        await chooseLanguage(user, 'English');

        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
        await waitFor(() => expect(document.documentElement).toHaveAttribute('dir', 'ltr'));
        expect(localStorage.getItem('language')).toBe('en');
    });

    test('the language menu shows each language in its own language and marks the current one', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByRole('heading', { name: 'Log into your Account' });

        await user.click(screen.getByRole('button', { name: 'Language: English. Choose a language' }));

        const items = await screen.findAllByRole('menuitem');
        expect(items.map((item) => item.textContent)).toEqual(['English', 'العربية']);
        expect(within(items[1]).getByText('العربية')).toHaveAttribute('lang', 'ar');
    });
});
