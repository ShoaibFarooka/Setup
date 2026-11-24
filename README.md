# Web App Boilerplate

A full-stack starting point for web apps: an **Express 5 + MongoDB API** and a **React 19 + Vite client**, wired together and tested end to end.

**What you get**

- **Auth:** login by email or username, short-lived access tokens kept in memory, rotating refresh tokens in httpOnly cookies, sessions per device, "log out everywhere", forgot / reset password by email, roles (`admin`, `user`).
- **Server:** one response shape for every request, validation on every route, paginated lists, file uploads, emails and PDFs from Handlebars templates, structured logs with request ids, rate limits, CORS, no-store caching, graceful shutdown.
- **Client:** TanStack Query data layer, protected routes by role, paginated and searchable lists kept in the URL, an own UI kit (Ant Design only for complex parts), light / dark / system theme, English and Arabic (right to left) with a language switch, responsive layout, accessible by default.
- **Tests:** unit and integration tests on both sides, plus Playwright end-to-end tests against the real API (user flows, accessibility checks, visual screenshots in both themes on desktop and phone).
- **Docs for people and AI agents:** a `README.md` and a `CLAUDE.md` in each part.

## Two versions: pick one per project

The repository keeps two versions of the boilerplate on purpose, as two long-lived branches. A new project starts from one of them:

| Branch | Version | Start from it when |
|---|---|---|
| `main` | English only | the app needs one language |
| `i18n` | English and Arabic (right to left), with a language switch and the server answering in the chosen language; more languages can be added | the app needs more than one language |

The commands to start a project from one of them are in "Starting a new project" below.

The multilingual branch is `main` plus the language work: everything else is developed on `main` and merged into it, so both stay at the same level. The language branch is never merged into `main`. The rules for keeping them in step are in [`CLAUDE.md`](CLAUDE.md) ("Branches"). They are for this repository only: a project has just the version it picked, and replaces them with its own (step 2 below).

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

1. **Pick the version** (above) and make it the project's own repository, on its own `main`. After a plain `git clone`, `origin` is still this Setup repository: a `git push` from the project would send project work here. Choose one of two ways:

   **a) Detach** (the usual way): the project starts with a fresh history and never pulls from the Setup again.

   ```bash
   git clone -b main https://github.com/ShoaibFarooka/Setup.git my-app   # or -b i18n for multilingual
   cd my-app
   rm -rf .git                                   # forget the Setup's history and remote
   git init -b main
   git add . && git commit -m "Start from the Setup (main)"
   git remote add origin <the project's repository URL>
   git push -u origin main
   ```

   **b) Keep pulling Setup fixes** (for a young project, while the Setup is still being improved): the Setup stays as a second remote named `setup`, which can be pulled from but never pushed to.

   ```bash
   git clone -b i18n https://github.com/ShoaibFarooka/Setup.git my-app   # or -b main
   cd my-app
   git remote rename origin setup
   git remote set-url --push setup no-push       # any push to the Setup now fails
   git branch -M main                            # the project's branch is main, whatever was cloned
   git remote add origin <the project's repository URL>
   git push -u origin main

   git pull setup i18n                           # later: take the Setup's fixes (the branch that was cloned)
   ```

   When the project no longer needs Setup fixes, `git remote remove setup` detaches it. Either way, **nothing is ever pushed from a project to the Setup**.

2. **Make the rules the project's own:** in the root `CLAUDE.md`, replace the section "Branches (two versions, on purpose)" (it describes how the Setup keeps its two versions in step, which is wrong for a project) with:

   ```markdown
   ## Branches

   One long-lived branch, `main`, always working. Larger changes go on a short branch (`feature/<name>`, `fix/<name>`) that is merged into `main` when its tests pass. Push only to this project's `origin`, never to the Setup.
   ```

   With way (b), add: "Setup fixes come in with `git pull setup <branch>`; in a conflict, keep the project's change and add the Setup's fix to it." In this README, delete "Two versions" and this section ("Starting a new project"), and in "For AI agents" drop "it starts with which branch a change belongs to".
3. **Rename and rebrand:** `APP_NAME` in `client/src/constants/appConstants.js`, the `<title>` in `client/index.html`, the brand colours at the top of `client/src/styles/theme.css`, the icons in `client/public/`, the logo of emails and PDFs (`server/static/images/logo.png`, `appName` in `server/src/configs/app.config.js`). Then the places that still say "boilerplate": the title and introduction of this `README.md`, of `server/README.md` and of `client/README.md`, the first line of the root `CLAUDE.md`, and the `name` in all three `package.json` files (root `boilerplate`, `server/` `boilerplate-server`, `client/` `boilerplate-client`); `npm install` in each of those folders updates the matching `package-lock.json`.
4. **First run:** `npm install` in the root installs the git hooks (a fresh clone has none until then; there is no CI yet, so the pre-push hook is the only automatic check), then the "Quick start" above. The committed screenshots are Windows ones (`-win32`): on macOS or Linux the first `cd client && npm run e2e` fails every visual test, so run `npm run e2e:update` once and **look at every new screenshot** before committing them (client README, "Screenshots").
5. **Replace the example content:** the dashboard's cards show how a page loads data in sections (README "Loading data" in `client/`); the profile page and the admin "Users" page are working examples.
6. **Add features** the way the examples do it: "Edit profile" (a form) and the admin "Users" page (a paginated, searchable list) go through every layer (server route, validation, service, client hook, page, tests). Both READMEs have an "Adding a new feature" section.

## For AI agents

Read [`CLAUDE.md`](CLAUDE.md) first (it starts with which branch a change belongs to), then the `CLAUDE.md` of the part you change. They hold the rules, the contract and what "done" means (including running the end-to-end tests and looking at the screenshots).
