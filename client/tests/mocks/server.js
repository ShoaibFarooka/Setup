import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Intercepts the app's real HTTP requests in tests and answers them like the server would
export const server = setupServer(...handlers);
