import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, failure, success, testUser } from '../mocks/responses';

// Names in the table body, top to bottom (the name cell also holds the avatar's initials; take the name's own text)
const rowNames = () => screen.getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].querySelector('span').lastChild.textContent);

// Opens the page and waits until the table has rows (any page, search or sort)
const openUsers = async (route = '/users') => {
    const view = renderApp({ route });
    await screen.findByRole('heading', { name: 'Users' });
    await screen.findAllByRole('cell');
    return view;
};

describe('users page (admins)', () => {
    beforeEach(() => loggedIn());
    afterEach(() => server.events.removeAllListeners());

    test('shows the first page, newest first, with the totals', async () => {
        await openUsers();

        expect(await screen.findByText('Showing 20 / 25 (Page 1 of 2)')).toBeInTheDocument();
        expect(rowNames().slice(0, 2)).toEqual(['Person 25', 'Person 24']);
    });

    test('the next page continues the list', async () => {
        const { user } = await openUsers();

        await user.click(screen.getByRole('button', { name: 'Next page' }));

        expect(await screen.findByText('Showing 5 / 25 (Page 2 of 2)')).toBeInTheDocument();
        expect(rowNames()).toEqual(['Person 05', 'Person 04', 'Person 03', 'Person 02', 'Person 01']);
    });

    test('searching waits until typing stops, then shows the matches from page 1', async () => {
        let requests = 0;
        server.events.on('request:start', ({ request }) => {
            if (request.method === 'GET' && request.url.includes('/api/users?') && request.url.includes('search=')) {
                requests += 1;
            }
        });
        const { user } = await openUsers('/users?page=2');

        await user.type(screen.getByRole('searchbox', { name: 'Search users' }), 'person1');

        expect(await screen.findByText(/Page 1 of 1/)).toBeInTheDocument();
        expect(rowNames()).toEqual(expect.arrayContaining(['Person 01', 'Person 10', 'Person 19']));
        // One request for the whole word, not one per letter
        expect(requests).toBe(1);
    });

    test('no match says so', async () => {
        const { user } = await openUsers();

        await user.type(screen.getByRole('searchbox', { name: 'Search users' }), 'nobody');

        expect(await screen.findByText('No users match "nobody"')).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });

    test('sorting by name reorders the list', async () => {
        const { user } = await openUsers();

        await user.selectOptions(screen.getByRole('combobox', { name: 'Sort users' }), 'name');

        expect(await screen.findByRole('cell', { name: /Person 01/ })).toBeInTheDocument();
        expect(rowNames().slice(0, 2)).toEqual(['Person 01', 'Person 02']);
    });

    test('the page, search and sort come from the address (reload and shared links keep them)', async () => {
        await openUsers('/users?search=person2&sort=name');

        expect(screen.getByRole('searchbox', { name: 'Search users' })).toHaveValue('person2');
        expect(screen.getByRole('combobox', { name: 'Sort users' })).toHaveValue('name');
        expect(await screen.findByRole('cell', { name: /Person 02/ })).toBeInTheDocument();
        expect(rowNames()[0]).toBe('Person 02');
    });

    test('a failed request shows the error with a way to try again', async () => {
        server.use(http.get(`${API}/api/users`, () => failure(500, 'Internal Server Error')));
        const { user } = await openUsers();

        expect(await screen.findByText('The users could not be loaded')).toBeInTheDocument();

        server.resetHandlers();
        loggedIn();
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Showing 20 / 25 (Page 1 of 2)')).toBeInTheDocument();
    });
});

describe('users page (other roles)', () => {
    beforeEach(() => {
        loggedIn();
        server.use(http.get(`${API}/api/users/me`, () => success({ user: { ...testUser, role: 'user' } })));
    });

    test('is not in the menu and its address shows "Access denied"', async () => {
        renderApp({ route: '/users' });

        expect(await screen.findByText('Access denied')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Users/ })).not.toBeInTheDocument();
    });
});
