# Project: instructions for AI agents

Web app boilerplate with two parts, each with its own `CLAUDE.md` and `README.md`:

- `server/`: Express 5 + MongoDB API (Jest tests)
- `client/`: React 19 + Vite app (Vitest tests, Playwright end-to-end tests)

Work inside the part you change, and follow its `CLAUDE.md`. This file holds the **contract between them**: change it on both sides together, with tests on both sides.

## Where the rules are

Read them in this order; a later file adds detail, it never silently overrides an earlier one:

1. The user's personal instructions (`~/.claude/CLAUDE.md`): commits, scope, temporary files.
2. This file: approvals, the contract between server and client, end-to-end tests.
3. `server/CLAUDE.md` or `client/CLAUDE.md` for the part you change, then the matching `README.md` section for details.

## Rules and approvals

The rule files are this project's standard. **When a task would break or bend a rule, conflicts with the contract below, or needs something the rules do not cover, stop and ask before doing it.** Say which rule, why the task conflicts with it, and the options (for example: follow the rule another way, make a one-off exception, or change the rule).

Always ask first, even when the task seems to require it:

- adding, removing or replacing a dependency (say what it adds to the bundle or the server, and why nothing existing fits)
- changing the API contract, a response shape or an endpoint the client uses
- changing security settings (auth, cookies, CORS, rate limits, secrets, bcrypt cost, sanitising, redaction, caching headers)
- schema or data changes that affect existing documents (renamed or removed fields, new required fields, changed indexes)
- deleting, skipping or loosening tests, or accepting new screenshots without looking at them
- changing these rule files (`CLAUDE.md`) or the conventions in the READMEs
- anything outside the requested scope

An approval covers that task only. When the user approves a lasting exception, update the rule in the same change, so the files never disagree with what the code does.

## Lists and pagination (contract)

Every endpoint that returns a list is paginated; none returns all documents at once.

- **Query:** `?page=1&limit=20`. `page` starts at 1; `limit` defaults to 20 and is at most 100. Optional `sort` (only values the endpoint allows, `-` prefix for descending, e.g. `sort=-createdAt`) and `search` (free text, trimmed).
- **Response:** `data: { items: [...], pagination: { page, limit, totalItems, totalPages } }`. An empty list is `items: []` with `totalItems: 0`, never a 404.
- **Server:** validate with `paginationQuery(...)` and read with `paginate(...)` (`server/README.md`, "Lists and pagination"). **Client:** `PaginationHandler` plus a query hook keyed by the parameters (`client/README.md`, "Lists with pagination"); the example is the admin **Users** page (`GET /api/users`).

## Running both

- Server: `cd server && npm run dev` (port 5000). Client: `cd client && npm run dev` (port 5200).
- The client finds the server through `VITE_BASE_URL` (`client/.env`); the server allows the client through `CORS_ORIGINS` (`http://localhost:5200` by default in development).
- Node: `.nvmrc` (24). The root `package.json` only holds repository tooling: a pre-commit hook (husky + lint-staged) lints and fixes the staged files of both parts. Never skip it (`--no-verify`) without the user's approval; fix the reported error instead.

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
- `POST /api/auth/forgot-password` `{ email }` → always the same `200` answer (never reveals whether the account exists); emails a link to `<CLIENT_URL>/reset-password?token=<64 hex>`, valid 30 minutes and once. `500` when email is not configured.
- `POST /api/auth/reset-password` `{ token, password }` → `200`, ends every session of the account and clears the cookie; `400` with "This reset link is invalid or has expired" for an unknown, used or expired token. New passwords: 8–72 characters with a letter and a number (server `passwordRule`, client `resetPasswordSchema`).
- `GET /api/users/me` (access token) → `data: { user: { name, username, email, role } }`.
- `GET /api/users` (access token, **admin only**) → a paginated list of users (see "Lists and pagination"); `search` matches name, username or email; `sort` is one of `name`, `-name`, `createdAt`, `-createdAt` (default `-createdAt`). Each item: `{ id, name, username, email, role, createdAt }`.
- `PATCH /api/users/me` (access token) `{ name?, email? }` → `data: { user }` (same shape); other fields are refused (`400`, `errors.unknownFields`), an email of another account is `409`.
- Access token: `Authorization: Bearer <token>`, short-lived; kept in memory by the client, refreshed on 401 and on page load.
- Roles: `admin`, `user` (`server/src/models/user.model.js`). The client lists them in `ROLES` (`client/src/constants/appConstants.js`), sets each page's `roles` in `client/src/router/RouteConfig.jsx` and each role's sidebar in `client/src/constants/menuItems.jsx`; a new role needs the server and all three.
- Status codes the client relies on: 401 = not logged in / session expired (triggers a refresh), 403 = not allowed, 503 = database unavailable (shown as such), 429 = rate limited.
