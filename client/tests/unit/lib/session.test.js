import { session } from '@/lib/session';

describe('session', () => {
    test('starts as checking (restoring after a page load)', () => {
        expect(session.getState()).toEqual({ status: 'checking', accessToken: null, endedByUser: false });
    });

    test('start keeps the access token in memory', () => {
        session.start('token-1');

        expect(session.getState()).toEqual({ status: 'authenticated', accessToken: 'token-1', endedByUser: false });
    });

    test('end forgets the token and remembers whether the user logged out themselves', () => {
        session.start('token-1');

        session.end({ byUser: true });

        expect(session.getState()).toEqual({ status: 'anonymous', accessToken: null, endedByUser: true });
    });

    test('subscribers are told about every change until they unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = session.subscribe(listener);

        session.start('token-1');
        unsubscribe();
        session.end();

        expect(listener).toHaveBeenCalledTimes(1);
    });
});
