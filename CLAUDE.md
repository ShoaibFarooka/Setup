# Project: instructions for AI agents

Web app boilerplate with two parts, each with its own `CLAUDE.md` and `README.md`:

- `server/`: Express 5 + MongoDB API (Jest tests)
- `client/`: React 19 + Vite app (Vitest tests, Playwright end-to-end tests)

Work inside the part you change, and follow its `CLAUDE.md`. This file holds the **contract between them**: change it on both sides together, with tests on both sides.

## Running both

- Server: `cd server && npm run dev` (port 5000). Client: `cd client && npm run dev` (port 5200).
- The client finds the server through `VITE_BASE_URL` (`client/.env`); the server allows the client through `CORS_ORIGINS` (`http://localhost:5200` by default in development).

## End-to-end tests (both parts together)

- `cd client && npm run e2e` runs Playwright against the real API. It starts `server`'s `npm run e2e:server` (in-memory database, port 5100, accounts from `server/scripts/e2e-accounts.json`) and a production build of the client on port 5300 (`vite preview`), so the development servers keep running and no real data is touched.
- A change to the contract or to a flow updates the E2E tests too (`client/e2e/`), and, when a flow needs data, `server/scripts/e2e-server.js` / `e2e-accounts.json` in the same change.
- Done for a change people can see: `npm run e2e` passes and the new or changed screenshots have been looked at (see `client/CLAUDE.md`).

## Response contract

Every server response, success or failure, has the same shape (`server/src/utils/response.util.js`):

```js
{ success: true,  message, data }             // data is null when there is nothing to return
{ success: false, message, errors?, data? }   // errors: message per field; data: extra facts
```

- The client unwraps it in one place (`client/src/lib/axiosInstance.js`): service functions return `data`; every failure becomes an `ApiError` (`status`, `message`, `errors`, `data`, `requestId`).
- The client's fake server (`client/tests/mocks/responses.js`) builds responses with the same shape. If the contract changes, update `server/src/utils/response.util.js`, `client/src/lib/apiError.js`, `client/tests/mocks/responses.js` and both READMEs together.
- Every response carries `X-Request-Id` (exposed to the browser through CORS); `ApiError.requestId` holds it, so a reported error can be found in the server logs.

## Auth contract

- `POST /api/auth/login` `{ identifier, password }` → `data: { token, sessionExpiresAt }` + httpOnly `refreshToken` cookie.
- `POST /api/auth/refresh-token` (cookie) → new token + new cookie; the old refresh token stops working (rotation).
- `POST /api/auth/logout` (cookie) ends this device; `POST /api/auth/logout-all` (access token) ends every device.
- `GET /api/users/me` (access token) → `data: { user: { name, username, email, role } }`.
- `PATCH /api/users/me` (access token) `{ name?, email? }` → `data: { user }` (same shape); other fields are refused (`400`, `errors.unknownFields`), an email of another account is `409`.
- Access token: `Authorization: Bearer <token>`, short-lived; kept in memory by the client, refreshed on 401 and on page load.
- Roles: `admin`, `user` (`server/src/models/user.model.js`). The client lists them in `ROLES` (`client/src/constants/appConstants.js`), sets each page's `roles` in `client/src/router/RouteConfig.jsx` and each role's sidebar in `client/src/constants/menuItems.jsx`; a new role needs the server and all three.
- Status codes the client relies on: 401 = not logged in / session expired (triggers a refresh), 403 = not allowed, 503 = database unavailable (shown as such), 429 = rate limited.
