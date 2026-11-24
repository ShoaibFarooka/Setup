# Web App Boilerplate

A full-stack starting point for web apps: an **Express 5 + MongoDB API** and a **React 19 + Vite client**, wired together and tested end to end.

**What you get**

- **Auth:** login by email or username, short-lived access tokens kept in memory, rotating refresh tokens in httpOnly cookies, sessions per device, "log out everywhere", forgot / reset password by email, roles (`admin`, `user`).
- **Server:** one response shape for every request, validation on every route, paginated lists, file uploads, emails and PDFs from Handlebars templates, structured logs with request ids, rate limits, CORS, no-store caching, graceful shutdown.
- **Client:** TanStack Query data layer, protected routes by role, paginated and searchable lists kept in the URL, an own UI kit (Ant Design only for complex parts), light / dark / system theme, responsive layout, accessible by default.
- **Tests:** unit and integration tests on both sides, plus Playwright end-to-end tests against the real API (user flows, accessibility checks, visual screenshots in both themes on desktop and phone).
- **Docs for people and AI agents:** a `README.md` and a `CLAUDE.md` in each part.

## Two versions: pick one per project

The repository keeps two versions of the boilerplate on purpose, as two long-lived branches. A new project starts from one of them:

| Branch | Version | Start from it when |
|---|---|---|
| `main` | English only | the app needs one language |
| `feature/i18n-arabic` | English and Arabic (right to left), with a language switch and the server answering in the chosen language; more languages can be added | the app needs more than one language |

```bash
git clone -b main https://github.com/ShoaibFarooka/Setup.git my-app                  # English only
git clone -b feature/i18n-arabic https://github.com/ShoaibFarooka/Setup.git my-app    # multilingual
```

The multilingual branch is `main` plus the language work: everything else is developed on `main` and merged into it, so both stay at the same level. The language branch is never merged into `main`. The rules for keeping them in step are in [`CLAUDE.md`](CLAUDE.md) ("Branches").

## Structure

| Folder | What | Details |
|---|---|---|
| [`server/`](server/README.md) | Express 5 API with MongoDB (Mongoose 9), Jest tests | setup, environment variables, endpoints, auth, logging |
| [`client/`](client/README.md) | React 19 + Vite app, Vitest and Playwright tests | data flow, UI kit, theme, routes, testing |

The contract between them (response shape, auth endpoints, status codes) is in [`CLAUDE.md`](CLAUDE.md).

## Quick start

Requirements: **Node.js 20.19 or newer** (24 recommended, see `.nvmrc`: `nvm use`) and a **MongoDB** database (local or Atlas).

```bash
# 0. Once, in the repository root: installs the pre-commit hook (lints the files you commit)
npm install

# 1. Server: http://127.0.0.1:5000
cd server
npm install
cp .env.example .env      # fill in DB_URI, the two token secrets and the ADMIN_* account (EMAIL_* for "forgot password")
npm run seed              # creates the admin account
npm run dev

# 2. Client: http://localhost:5200 (in a second terminal)
cd client
npm install
cp .env.example .env      # VITE_BASE_URL=http://localhost:5000
npm run dev
```

Open http://localhost:5200 and log in with the admin account from `server/.env`. The server README explains each variable and how to generate the secrets.

## Tests

| Command | Runs | Needs |
|---|---|---|
| `cd server && npm test` | API unit and integration tests | nothing (in-memory MongoDB) |
| `cd client && npm test` | client unit and page tests (fake server) | nothing |
| `cd client && npm run e2e` | the real app in a real browser against the real API | `npx playwright install chromium` once; starts its own API and database |

`npm run lint` in each part checks code and style. On every commit, a pre-commit hook (husky + lint-staged, set up by `npm install` in the root) lints and auto-fixes the staged files inside their own part, with that part's ESLint config (`server/.lintstagedrc.json`, `client/.lintstagedrc.json`); a commit with an error that cannot be fixed automatically stops, so it can be fixed first. Before every push, a pre-push hook runs both unit suites with their coverage thresholds (90% statements, functions and lines, 85% branches; about 3 minutes); a failing test or a drop below the thresholds stops the push. The end-to-end tests are not in the hook (too slow): run `cd client && npm run e2e` before pushing changes to shared parts (see "Testing levels" in `CLAUDE.md`).

## Starting a new project from it

1. **Pick the version** (above) and clone that branch into the new project's repository, where it becomes the project's own `main`. The boilerplate's other branch is not needed there.
2. **Rename and rebrand:** `APP_NAME` in `client/src/constants/appConstants.js`, the `<title>` in `client/index.html`, the brand colours at the top of `client/src/styles/theme.css`, the icons in `client/public/`, the logo of emails and PDFs (`server/static/images/logo.png`, `appName` in `server/src/configs/app.config.js`), and the `name` fields in both `package.json` files.
3. **Replace the example content:** the dashboard's cards show how a page loads data in sections (README "Loading data" in `client/`); the profile page and the admin "Users" page are working examples.
4. **Add features** the way the examples do it: "Edit profile" (a form) and the admin "Users" page (a paginated, searchable list) go through every layer (server route, validation, service, client hook, page, tests). Both READMEs have an "Adding a new feature" section.

## For AI agents

Read [`CLAUDE.md`](CLAUDE.md) first (it starts with which branch a change belongs to), then the `CLAUDE.md` of the part you change. They hold the rules, the contract and what "done" means (including running the end-to-end tests and looking at the screenshots).
