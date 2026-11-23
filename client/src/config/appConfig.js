// The only place that reads import.meta.env: everything else imports appConfig
const apiUrl = import.meta.env.VITE_BASE_URL;

if (!apiUrl) {
    throw new Error('VITE_BASE_URL is not set: copy client/.env.example to client/.env and set the server address');
}

export const appConfig = {
    // The server's address, e.g. http://localhost:5000
    apiUrl,
};
