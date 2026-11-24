# Project: instructions for AI agents

Web app boilerplate with two parts, each with its own `CLAUDE.md` and `README.md`:

- `server/`: Express 5 + MongoDB API (Jest tests)
- `client/`: React 19 + Vite app (Vitest tests, Playwright end-to-end tests)

Work inside the part you change, and follow its `CLAUDE.md`. This file holds the **contract between them**: change it on both sides together, with tests on both sides.

## Where the rules are

Read them in this order; a later file adds detail, it never silently overrides an earlier one:

1. The user's personal instructions (`~/.claude/CLAUDE.md`): commits, scope, temporary files.
2. This file: branches, approvals, testing levels, the contract between server and client, end-to-end tests.
3. `server/CLAUDE.md` or `client/CLAUDE.md` for the part you change, then the matching `README.md` section for details.

## Branches (two versions, on purpose)

The boilerplate has two long-lived branches; a new project is cloned from one of them (README "Two versions"):

- `main`: English only.
- `feature/i18n-arabic`: `main` plus languages (English and Arabic, right to left; contract "Languages" there).

Keep them in step, always in this direction:

1. **Check the branch first.** Every change starts by knowing which branch it belongs to.
2. **Anything that is not about languages** (features, fixes, rules, tests, tooling) is made on `main` first, with its tests, then `main` is merged into `feature/i18n-arabic`. There, its new visible texts get keys in both language files (the parity tests fail otherwise), and it is checked in Arabic too (the testing level it needs). Both branches are pushed.
3. **Language work** (texts, translations, right to left, the language switch, `Accept-Language`) is made only on `feature/i18n-arabic`.
4. **Never merge `feature/i18n-arabic` into `main`,** and never cherry-pick language work into it. A request on the language branch that is not about languages is made on `main` first; if that is unclear, ask.
5. Merge conflicts keep both sides' intent: `main`'s change, in the language branch's translated form.

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

## Testing levels

Test in proportion to what the change touches; the full run is for shared parts, not every change. Every change still comes with its own tests (new or updated), and the pre-commit hook lints the staged files.

| Level | When | What runs |
|---|---|---|
| **1. Targeted** (while working) | every change | unit tests of the changed files; the E2E spec of the affected flow or page (desktop only while iterating); for a visible change, the screenshots of that page only, looked at |
| **2. Part** (task done) | before reporting a task as done | the full unit suite of each part that changed; the affected E2E specs on both devices (desktop and mobile) |
| **3. Full** | the change touches something shared (below), before a push, or when the user asks | both parts: `npm run lint`, `npm test`; client `npm run build` and the full `npm run e2e` |

**Shared (level 3):** the API contract or an endpoint the client uses, auth and sessions, `router/`, `components/layout/`, `styles/theme.css` or `base.css`, a ui component used on many pages, `lib/`, `app.js` and global middleware, `app.config.js`, the E2E setup (`e2e-server.js`, accounts, `fixtures.js`, `playwright.config.js`), dependencies. Unsure: choose the higher level.

**Commands (level 1):**

```bash
# server/
npx jest --findRelatedTests src/services/auth.service.js         # tests that load the changed files
npx jest tests/integration/password-reset.test.js                # one test file
# client/
npx vitest related --run src/pages/users/Users/Users.jsx          # tests that import the changed files
npx playwright test e2e/users.spec.js --project=desktop           # one spec, desktop only
npx playwright test e2e/visual.spec.js -g "users" --update-snapshots   # one page's screenshots (then look at them)
```

- **Bug fixes:** add a test that reproduces the bug. Prove it fails without the fix (by undoing it once) only when the cause is not obvious.
- **No repeat runs:** do not run the same suite again when nothing it covers changed since it passed (for example when splitting work into several commits), unless the user asks.
- **Report** which level ran and what it did not cover, so the user knows what is and is not verified.
- **Coverage thresholds** (both parts): statements, functions and lines 90%, branches 85% (`server/jest.config.js`, `client/vite.config.js`); `npm run test:coverage` fails below them. Coverage is ~99% today; raise the floor when it stays higher, never lower it without the user's approval.
- Until CI exists, the pre-push hook (both unit suites with coverage) is the automatic check, and level 3 is the full one: run it whenever the list above applies. When CI is added, it runs level 3 on every push.

## Lists and pagination (contract)

Every endpoint that returns a list is paginated; none returns all documents at once.

- **Query:** `?page=1&limit=20`. `page` starts at 1; `limit` defaults to 20 and is at most 100. Optional `sort` (only values the endpoint allows, `-` prefix for descending, e.g. `sort=-createdAt`) and `search` (free text, trimmed).
- **Response:** `data: { items: [...], pagination: { page, limit, totalItems, totalPages } }`. An empty list is `items: []` with `totalItems: 0`, never a 404.
- **Server:** validate with `paginationQuery(...)` and read with `paginate(...)` (`server/README.md`, "Lists and pagination"). **Client:** `PaginationHandler` plus a query hook keyed by the parameters (`client/README.md`, "Lists with pagination"); the example is the admin **Users** page (`GET /api/users`).

## Running both

- Server: `cd server && npm run dev` (port 5000). Client: `cd client && npm run dev` (port 5200).
- The client finds the server through `VITE_BASE_URL` (`client/.env`); the server allows the client through `CORS_ORIGINS` (`http://localhost:5200` by default in development).
- Node: `.nvmrc` (24). The root `package.json` only holds repository tooling (husky): a **pre-commit** hook lints and fixes the staged files of both parts (lint-staged); a **pre-push** hook runs both unit suites with their coverage thresholds (`test:coverage`, about 3 minutes). Never skip them (`--no-verify`) without the user's approval; fix the reported error instead.

## End-to-end tests (both parts together)

- `cd client && npm run e2e` runs Playwright against the real API. It starts `server`'s `npm run e2e:server` (in-memory database, port 5100, accounts from `server/scripts/e2e-accounts.json`) and a production build of the client on port 5300 (`vite preview`), so the development servers keep running and no real data is touched.
- A change to the contract or to a flow updates the E2E tests too (`client/e2e/`), and, when a flow needs data, `server/scripts/e2e-server.js` / `e2e-accounts.json` in the same change.
- Which E2E tests a change needs: "Testing levels" above. For a change people can see, the new or changed screenshots are always looked at (see `client/CLAUDE.md`).

## Response contract

Every server response, success or failure, has the same shape (`server/src/utils/response.util.js`):

```js
{ success: true,  message, data }             // data is null when there is nothing to return
{ success: false, message, errors?, data? }   // errors: message per field; data: extra facts
```

- The client unwraps it in one place (`client/src/lib/axiosInstance.js`): service functions return `data`; every failure becomes an `ApiError` (`status`, `message`, `errors`, `data`, `requestId`).
- The client's fake server (`client/tests/mocks/responses.js`) builds responses with the same shape. If the contract changes, update `server/src/utils/response.util.js`, `client/src/lib/apiError.js`, `client/tests/mocks/responses.js` and both READMEs together.
- Every response carries `X-Request-Id` (exposed to the browser through CORS); `ApiError.requestId` holds it, so a reported error can be found in the server logs.

## Languages (contract)

- Languages: `en` (default) and `ar` (right to left). The client sends the user's choice as `Accept-Language` on every request; the server answers every `message`, every validation message in `errors` and the emails it sends because of that request in that language, and says which in `Content-Language` (with `Vary: Accept-Language`). Anything else, or no header, is English.
- Texts live in `src/locales/<code>.json` on each side (the client's for the UI, the server's for its messages, emails and PDFs), with the same keys in every language; a parity test on each side fails when a key or `{placeholder}` is missing. Code uses keys, never visible text.
- A new language: a `<code>.json` on both sides, an entry in `client/src/lib/i18n.js`, `client/index.html` and `server/src/utils/i18n.util.js`, and E2E pages for it.

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
