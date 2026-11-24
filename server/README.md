# Boilerplate Server

Express 5 + MongoDB (Mongoose) API boilerplate with authentication, multi-device sessions, validation, a standard response format and a full test suite.

**Stack:** Node.js · Express 5 · Mongoose 9 · Yup · JSON Web Tokens · bcrypt · pino · Jest + Supertest · ESLint

---

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Folder structure](#folder-structure)
- [How a request flows](#how-a-request-flows)
- [Conventions](#conventions)
- [Adding a new feature](#adding-a-new-feature)
- [API endpoints](#api-endpoints)
- [Authentication](#authentication)
- [CORS](#cors)
- [Testing](#testing)
- [Linting and formatting](#linting-and-formatting)
- [Deploying to production](#deploying-to-production)

---

## Requirements

- **Node.js 20.19 or newer**, required by Mongoose 9 (`.nvmrc` pins 24; run `nvm use` if you use nvm).
- **MongoDB**, local or hosted (e.g. Atlas). Not needed to run the tests.

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in `.env`. At minimum:

- `DB_URI`: your MongoDB connection string
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`: two **different** random strings of at least 32 characters. Generate each with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the first admin account

Then:

```bash
npm run seed   # creates the admin account (safe to run again; skips if it exists)
npm run dev    # starts the server with auto-reload on http://127.0.0.1:5000
```

Check it is running: `GET http://127.0.0.1:5000/api/health`.

The server starts even when the database is not reachable yet: it keeps retrying in the background and answers `503` meanwhile.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start` | Start (production) |
| `npm run seed` | Create the admin account from the `ADMIN_*` variables |
| `npm run e2e:server` | The API for the client's end-to-end tests: in-memory database, test accounts, port 5100 (the client's `npm run e2e` starts it) |
| `npm test` | Run all tests |
| `npm run test:watch` | Re-run affected tests on every save |
| `npm run test:coverage` | Run tests and report coverage (also written to `coverage/`) |
| `npm run lint` | Check for bugs and style problems |
| `npm run lint:fix` | Fix what can be fixed automatically |

## Environment variables

All variables are read and validated in **one place**: `src/configs/app.config.js`. A missing or invalid value stops the server at startup with a message naming the variable. The rest of the code uses the `config` object and never reads `process.env` directly. Empty values (`PORT=`) count as not set.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | | `development` | `development`, `production` or `test` |
| `PORT` | | `5000` | |
| `HOST` | | `127.0.0.1` | `0.0.0.0` to accept connections from other machines |
| `TRUST_PROXY` | | `0` | Number of proxies in front of the server (`1` behind Nginx, a load balancer or a hosting platform) |
| `LOG_LEVEL` | | dev: `debug`, prod: `info`, test: `silent` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `CORS_ORIGINS` | | dev: `http://localhost:5200`, prod: none | Front-end URLs allowed to call the API, comma-separated, no trailing slash |
| `DB_URI` | ✔ | | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | ✔ | | At least 32 characters |
| `REFRESH_TOKEN_SECRET` | ✔ | | At least 32 characters, different from the access secret |
| `ACCESS_TOKEN_EXPIRY_TIME` | | `5m` | e.g. `5m`, `15m`, `1h` |
| `REFRESH_TOKEN_EXPIRY_TIME` | | `7d` | How long a login lasts without activity |
| `ADMIN_NAME` | | `Admin` | Used by `npm run seed` |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for seeding | | Used by `npm run seed` |
| `EMAIL_ENABLED` | | `false` | Email is optional; the settings below are required only when `true` |
| `EMAIL_HOST` | if email enabled | | SMTP host |
| `EMAIL_PORT` | | `587` | |
| `EMAIL_SECURE` | | `false` | `true` for port 465 |
| `SENDER_EMAIL` / `SENDER_EMAIL_PASSWORD` | if email enabled | | SMTP login, also the "from" address |
| `CLIENT_URL` | in production if email enabled | `http://localhost:5200` outside production | Where the browser app runs (an origin, no trailing slash); links in emails point there (password reset) |

To add a variable: add it to the schema in `app.config.js`, expose it on the `config` object, and document it in `.env.example` and here.

## Folder structure

```
server/
├── index.js                 Starts the server; graceful shutdown; crash handlers
├── src/
│   ├── app.js               Express app: middleware, routes, 404, error handler (no listening; used by tests)
│   ├── configs/             app.config.js (all settings, validated), email.config.js (SMTP transporter)
│   ├── routes/              URL → middleware → controller. index.routes.js mounts the feature routers
│   ├── controllers/         HTTP only: read the request, call a service, send the response
│   ├── services/            Business rules; throw AppError when something is not allowed
│   ├── repositories/        The only code that talks to Mongoose (queries)
│   ├── models/              Mongoose schemas (User, Session, PasswordReset)
│   ├── validations/         Yup schemas for request bodies, params and queries
│   ├── middlewares/         request logging, auth, validation, uploads, rate limits, trimming, error handler
│   ├── database/            MongoDB connection with retry, global Mongoose settings
│   ├── seeders/             One-off scripts (npm run seed)
│   ├── templates/           Handlebars templates: layouts/, partials/, emails/, pdfs/ (see "Emails and PDFs")
│   └── utils/               AppError, response wrapper, tokens and hashing, logger (pino), templates, pagination
├── static/                  Files used as they are (not served over HTTP)
│   └── images/              logo.png: the logo in every email and PDF
└── tests/
    ├── setup/               Test environment variables, logger spies
    ├── helpers/             In-memory database, user factory, login helper, log capture
    ├── unit/                One module at a time, dependencies mocked
    └── integration/         Real HTTP requests against the app and an in-memory MongoDB
```

**Naming:** files are `name.type.js` in kebab-case (`auth.controller.js`, `error-handler.middleware.js`). Routes, controllers, services and validations are organised by **feature** (`auth`, `user`); models and repositories by **data** (one per collection). That is why `auth.service.js` uses `user.repository.js` and `session.repository.js`: auth has no collection of its own.

## How a request flows

```
request
  → app.js middleware      (request log + id, JSON up to 100kb, cookies, CORS, helmet, compression, trim; no-store and rate limit on /api)
  → route                  (routes/*.routes.js)
  → route middleware       (authenticateRequest, verifyRole, validateRequest, loginLimiter, ...)
  → controller             (controllers/*.controller.js)
  → service                (services/*.service.js)
  → repository → model     (repositories/*.repository.js → models/*.model.js)
  ← successBody(...)       sent by the controller
  ← errorBody(...)         sent by the error handler for anything thrown or passed to next(error)
```

## Conventions

### Response format

Every response, success or failure, uses the same wrapper (`src/utils/response.util.js`):

```js
// success
{ "success": true, "message": "Logged in successfully", "data": { "token": "...", "sessionExpiresAt": "..." } }

// failure
{ "success": false, "message": "Request validation failed", "errors": { "identifier": "Email or username is required" } }
```

- `data` is `null` when there is nothing to return.
- `errors` (message per field) and `data` (extra facts) appear on failures only when they exist.
- Controllers send success with `res.status(...).json(successBody(message, data))`.
- Never build failure responses by hand: throw an error (below).

### Errors

Throw from anywhere (services, middleware); the error handler (`src/middlewares/error-handler.middleware.js`) turns it into a response:

```js
const { throwError } = require('../utils/app-error.util');

throwError('User not found!', 404);
throwError('Order already paid', 409, { data: { orderId } });
throwError('Invalid input', 400, { errors: { email: 'Already taken' } });
```

- Express 5 forwards errors from `async` handlers automatically, so controllers have **no try/catch**.
- In middleware, pass errors on with `next(error)` (or `next(new AppError(...))`).
- The handler also maps database errors: unreachable → `503`, duplicate key → `409`, invalid ID → `400`, Mongoose validation → `400`, malformed JSON → `400`. Anything unexpected is logged and answered with a generic `500` (details are never sent to the client).

### Validation

Write a Yup schema in `src/validations/` and put the middleware on the route:

```js
router.post('/', validateRequest(schemas.createProductSchema), controller.create); // req.body
router.get('/:id', validateParams(schemas.idSchema), controller.getOne);          // req.params
router.get('/', validateQuery(schemas.listSchema), controller.list);              // req.query
```

- Fields the schema does not list are rejected (`400`, `errors.unknownFields`).
- After validation, `req.body` / `req.params` / `req.query` hold the **validated values** (trimmed, converted: `?page=2` becomes the number `2`).
- A MongoDB id in the URL: `validateParams(idParams)` (`src/validations/common.validation.js`), so a malformed id gets a clear `400` before reaching the database.
- Uploads: see "File uploads" below.

### Lists and pagination

Every list endpoint is paginated (the contract is in `../CLAUDE.md`): `?page=1&limit=20&sort=-createdAt&search=text` → `data: { items, pagination: { page, limit, totalItems, totalPages } }`. Never return all documents of a collection.

```js
// validations: the allowed sorts (indexed fields only) and the default
const listProductsQuery = paginationQuery({ sort: ['name', '-name', 'createdAt', '-createdAt'], defaultSort: '-createdAt' });

// route
router.get('/', authenticateRequest, validateQuery(listProductsQuery), productController.list);

// repository: paginate() reads lean, counts in parallel, sorts with _id as a tie-breaker (stable pages)
const listProducts = ({ search, page, limit, sort }) => paginate(Product, {
    filter: searchFilter(search, ['name', 'sku']),   // escaped, case-insensitive "contains"
    projection: { name: 1, price: 1, createdAt: 1 },
    page, limit, sort,
});
```

- `limit` is at most 100 (default 20); `sort` only accepts the values you list, so nobody sorts by an unindexed or private field.
- A page after the last one is `items: []`, not a `404`.
- Every field you sort or filter by needs an index in the model (`schema.index({ createdAt: -1, _id: -1 })`), including `_id` as the tie-breaker.
- `searchFilter` uses a regular expression, which is fine for small and medium collections. For large ones (hundreds of thousands of documents), use a MongoDB text index or Atlas Search instead.
- The example is `GET /api/users` (`user.validation.js`, `user.repository.js`, `tests/integration/users-list.test.js`).

### Database queries

- Only repositories use Mongoose models.
- `sanitizeFilter` is on globally: query operators coming from user input (e.g. `{ $ne: null }`) are treated as plain values, which blocks NoSQL injection. If your own code builds an operator dynamically, wrap it: `User.find({ age: mongoose.trusted({ $gte: minAge }) })`. `trusted()` wraps the object that holds the operator, not the whole filter.
- **Performance:**
  - **Read-only queries are lean** (`.lean()`, or `{ lean: true }` in the options): plain objects instead of Mongoose documents, much faster. Use a full document only when you change it and call `save()`.
  - **Always a projection:** ask only for the fields you need, and never send private ones (`password` is `select: false`).
  - **Index every field you filter, sort or look up by,** declared in the model's schema. `unique` fields are indexed already.
  - **`populate`** only the fields you need (`populate('author', 'name')`), and never inside a loop. One query with `$in` beats one query per item.
  - **Writes to several documents that must succeed or fail together** go in a transaction (`mongoose.startSession()`, `session.withTransaction(...)`); this needs a replica set (Atlas has one).
- **Updates** with `findByIdAndUpdate` apply a projection only through `.select()` (see `updateUserById`), not through its options.

### File uploads

`uploadFile(field, { maxSizeMb, types })` (`src/middlewares/upload.middleware.js`, multer) reads one file from a `multipart/form-data` request **into memory**: `req.file` has `buffer`, `mimetype`, `size` and `originalname`. Nothing is written to disk; the route decides where the file goes (a cloud bucket such as S3, a folder, the database).

```js
router.post(
    '/me/avatar',
    authenticateRequest,
    uploadFile('avatar', { maxSizeMb: 2, types: ['image/png', 'image/jpeg', 'image/webp'] }),
    validateFile({ required: true }),
    userController.updateAvatar,
);
```

- Too large or the wrong type: `400` with a clear message; the size limit stops reading early, so large uploads cost nothing.
- Allow only the types you need, and never trust `originalname` as a file path: generate your own names.
- Serving uploaded files is not set up (a decision per project: usually a bucket with signed URLs or a CDN).
- Tests: `tests/integration/upload.test.js` shows how to test an upload route with supertest's `.attach()`.

### Emails and PDFs

Both are built from **Handlebars templates** in `src/templates/`, rendered by `renderTemplate()` (`src/utils/template.util.js`). Never build HTML strings in code.

```
src/templates/
├── layouts/   email.hbs (the frame of every email), pdf.hbs (of every PDF); they print the page with {{{body}}}
├── partials/  shared pieces, used by file name: {{> button url=resetUrl label="Reset password"}}
├── emails/    <name>.hbs (HTML) + <name>.text.hbs (plain text) per email, e.g. reset-password
└── pdfs/      <name>.hbs per PDF; sample-report.hbs is an example to copy (then delete it)
```

- `{{value}}` is HTML-escaped, so data from users is safe to print; `{{{value}}}` is not escaped and is only for HTML we produce ourselves. Plain-text templates (`.text.hbs`) are never escaped.
- Every template gets `appName` (`config.appName`; keep it the same as the client's `APP_NAME`) and `logoSrc`. Emails also get `subject`.
- **Logo:** `static/images/logo.png`, shown by `partials/logo.hbs` with the app name beside it (so the name still shows when a mail app blocks images) in the header of both layouts. A PNG, because Gmail and Outlook do not show SVG; about 4x the 40px it is shown at, under ~20 KB, on a solid tile so it survives mail apps' dark mode. To rebrand, replace the file (same name). Emails carry it as an **inline attachment** (`src="cid:logo"`, added by `sendTemplateEmail`): it needs no public address and shows in development too. PDFs embed it as a `data:` URL (`renderPdf`). Never use `data:` URLs in emails (Gmail removes them). Once a project has public file hosting (a CDN or bucket), an `https://` address in `partials/logo.hbs` makes emails smaller; mail apps may then hide it until the reader allows images.
- Compiled templates are cached; in development they are read again on every use, so edits show without a restart.

**Sending email.** `sendTemplateEmail({ to, subject, template, data, cc, bcc, attachments })` (`src/services/email.service.js`) renders `emails/<template>.hbs` inside `layouts/email.hbs` plus `emails/<template>.text.hbs`, and sends both, with the logo and any other `attachments` (nodemailer format), through `sendEmail(to, subject, text, html, cc, bcc, attachments)` (nodemailer). Email is sent when `EMAIL_ENABLED=true` and the `EMAIL_*` / `SENDER_*` variables are set; when it is disabled, `sendEmail` logs an error and throws `Email is not configured!` (`500`), so a feature that needs email fails loudly instead of silently.

- Call them from a service, never from a controller.
- Email programs ignore `<style>` blocks and most modern CSS: email templates use inline styles and tables (see `layouts/email.hbs`).
- When the email is a side effect (a "welcome" message), catch and log a failure instead of failing the whole request. When the email *is* the point, let the error reach the client, unless that would reveal private facts: "forgot password" sends after answering, so neither the answer nor its timing tells whether an account exists.

**Building a PDF.** `renderPdf(template, data, options)` (`src/services/pdf.service.js`) renders `pdfs/<template>.hbs` inside `layouts/pdf.hbs` and prints it with headless Chrome ([Puppeteer](https://pptr.dev)), returning a `Buffer`; `htmlToPdf(html, options)` prints any HTML. Options are Puppeteer's [`page.pdf()`](https://pptr.dev/api/puppeteer.pdfoptions) options (default A4, backgrounds on, 16–20mm margins).

```js
const pdf = await renderPdf('sample-report', { title: 'Users', generatedAt, rows });
res.type('application/pdf').attachment('users.pdf').send(pdf);
```

- Normal CSS works (it is Chrome). **Nothing is loaded from the network or the disk** and JavaScript is off, so data printed into a template can never make the server fetch an address: put images and fonts in as `data:` URLs.
- One browser is started on the first PDF and reused (about a second to start); each PDF gets its own tab, closed afterwards. `closePdfBrowser()` ends it on shutdown (`index.js`).
- `npm install` downloads Puppeteer's Chrome (several hundred MB, into `~/.cache/puppeteer`). On a Linux server or in a container, Chrome needs its system libraries (see Puppeteer's [troubleshooting](https://pptr.dev/troubleshooting)); never turn off Chrome's sandbox (`--no-sandbox`) without a container that isolates it.
- Puppeteer stays on version 24: version 25 is published as ES modules only, which Jest cannot load without an experimental Node flag.
- **Known `npm audit` findings (accepted):** Puppeteer 24's own dependencies report "high" advisories: `extract-zip` (path traversal when unzipping), `basic-ftp` via `proxy-agent` (crashes on malicious FTP listings) and `zod` via `chromium-bidi` (memory on huge inputs). None of them handles data from API requests: the first two run only while Puppeteer downloads Chrome (from Google, at `npm install`), and `chromium-bidi` only for the WebDriver BiDi protocol, which `renderPdf` does not use. The fix is Puppeteer 25 or newer: upgrade when Jest can load it without the flag, or earlier if a project needs it (then load it with `await import('puppeteer')` and run Jest with `--experimental-vm-modules`). Any new audit finding outside this list is not accepted by this note.

### Languages

The server answers in the language the client asks for (`Accept-Language`; `en` by default, `ar`): response messages, validation messages, emails and PDFs. The contract is in `../CLAUDE.md` ("Languages").

- **Texts:** `src/locales/en.json` and `ar.json`, the same keys in both (`tests/unit/utils/i18n.util.test.js` fails when a key or a `{placeholder}` is missing). Code uses keys:

  ```js
  res.status(200).json(successBody(req.t('users.fetched'), { user }));   // in a controller
  throwError('users.notFound', 404);                                     // in a service: the error handler translates it
  throwError('errors.duplicateField', 409, { values: { field: 'email' } });
  yup.string().required('validation.emailRequired');                     // in a schema: the validation middleware translates it
  ```

- **Per request:** `src/middlewares/language.middleware.js` (first, after the request logger) sets `req.language` and `req.t(key, values)` and answers with `Content-Language`. A message that is not a key (from a library) is sent as it is.
- **Emails and PDFs:** `{{t "email.resetPassword.greeting"}}` in templates (placeholders come from the template's data); pass the language (`sendTemplateEmail({ ..., language: req.language })`, `renderPdf(name, { ..., lang: req.language })`). Layouts get `lang`, `dir` and `rtl` for right-to-left.
- **Logs stay English** (and show the key): they are for developers.
- **A new language:** `src/locales/<code>.json` and an entry in `src/utils/i18n.util.js` (and the client's, see `../CLAUDE.md`).

### HTTP caching and body size

- Every `/api` response has `Cache-Control: no-store`: answers are personal or change often, so browsers and proxies must not keep copies.
- JSON bodies are limited to **100kb** (larger: `413`). Files go through `uploadFile`, which has its own limit.

### Logging

Structured logging with [pino](https://getpino.io): every log line is one JSON object, so log services can search and filter it.

- **Production:** JSON lines on **stdout**. Whatever runs the server collects them: `docker logs`, the hosting platform's log viewer, PM2 (`pm2 logs`), systemd (`journalctl`) or a log service agent (Datadog, Loki, Elastic, ...). The app writes no log files.
- **Development:** the same lines shown readable and coloured (pino-pretty).
- **Level:** `LOG_LEVEL`, by default `debug` in development and `info` in production.

Use `src/utils/logger.util.js`, never `console.log`. Put data in fields (first argument) and a short fixed message (second); errors go in `err`:

```js
logger.info({ orderId, total }, 'Order created');
logger.error({ err: error }, 'Payment failed');
```

Inside a request (middleware, controllers), use `req.log` instead: same methods, and every line carries the request's `reqId`.

**Request logging** (`src/middlewares/request-logger.middleware.js`): one line per request with `reqId`, method, URL, status and duration; `info` for success, `warn` for 4xx, `error` for 5xx. For a 5xx the line also has the real error in `err` (message, type, status and the stack of where it was thrown): the error handler hands it over (`res.err`), so a 500 never shows up as a bare "failed with status code 500". 4xx lines have no `err`: they are expected answers (wrong password, validation), and their message is in the response. Health checks are not logged. Every response has an `X-Request-Id` header (a safe incoming one is reused, e.g. from a proxy), so a user or the client can report it and you can find every line of that request.

**Never logged:** request headers (tokens, cookies) and any `password`, `token` or `refreshToken` field; they are replaced by `[REDACTED]`.

**Exception:** `app.config.js` reports invalid environment variables with `console.error`, because the logger itself depends on that config.

## Adding a new feature

Example: `products`.

1. **Model**: `src/models/product.model.js` (`mongoose.model('Product', schema)`)
2. **Repository**: `src/repositories/product.repository.js` with the queries you need
3. **Service**: `src/services/product.service.js` with the business rules; `throwError(...)` for not found, conflicts, ...
4. **Validation**: `src/validations/product.validation.js` with Yup schemas
5. **Controller**: `src/controllers/product.controller.js`; read `req`, call the service, `res.json(successBody(...))`
6. **Routes**: `src/routes/product.routes.js`, then mount it in `src/routes/index.routes.js`: `router.use('/products', productRoutes)`
7. **Tests**: `tests/unit/services/product.service.test.js` and `tests/integration/products.test.js`

Use REST-style routes for resources:

```
GET    /api/products        list
GET    /api/products/:id    one
POST   /api/products        create
PATCH  /api/products/:id    update
DELETE /api/products/:id    delete
```

Protect routes with `authenticateRequest`, and restrict by role with `verifyRole(['admin'])` after it.

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | | Server status |
| `GET` | `/api/health` | | `200` when the database is connected, `503` otherwise (not rate limited) |
| `POST` | `/api/auth/login` | | Body: `{ identifier, password }` (identifier = email or username). Returns the access token, sets the refresh cookie |
| `POST` | `/api/auth/refresh-token` | refresh cookie | New access token; the refresh token is replaced |
| `POST` | `/api/auth/logout` | refresh cookie | Ends this device's session |
| `POST` | `/api/auth/logout-all` | access token | Ends the sessions of every device |
| `POST` | `/api/auth/forgot-password` | | Body: `{ email }`. Emails a reset link when the account exists; the answer is the same either way. `500` when email is not configured |
| `POST` | `/api/auth/reset-password` | | Body: `{ token, password }` (token from the link). Sets the new password and ends every session; `400` when the link is invalid, expired or used |
| `GET` | `/api/users` | access token, **admin** | Paginated list of users: `?page`, `limit` (max 100), `sort` (`name`, `-name`, `createdAt`, `-createdAt`), `search` (name, username or email) |
| `GET` | `/api/users/me` | access token | The logged-in user |
| `PATCH` | `/api/users/me` | access token | Change your own `name` and / or `email` (other fields, such as `role`, are refused); `409` when the email belongs to another account |

Rate limits: 1000 requests per 15 minutes per IP on `/api`; 10 **failed** logins per 15 minutes per IP on `/api/auth/login`; 5 "forgot password" requests per 15 minutes per IP **and email address** (nobody can flood one inbox, and people behind one office IP can each ask for their own link); 10 **failed** password resets per 15 minutes per IP.

## Authentication

- **Access token** (JWT, default 5 minutes): returned in the login/refresh response; the client sends it as `Authorization: Bearer <token>`.
- **Refresh token** (JWT, default 7 days): stored in an `httpOnly` cookie the browser sends automatically; JavaScript cannot read it.
- **Sessions**: every login creates a document in the `sessions` collection, so each device stays logged in independently. Only a SHA-256 hash of the refresh token is stored. Refreshing replaces the token; the old one stops working at once. Expired sessions are deleted by MongoDB automatically (TTL index).
- **Logout** ends one device; **logout-all** ends every device. Access tokens already issued stay valid until they expire (at most `ACCESS_TOKEN_EXPIRY_TIME`), because they are checked without a database lookup.
- Passwords are hashed with bcrypt (cost 12). A new password (reset) has 8–72 characters with a letter and a number (`passwordRule` in `src/validations/auth.validation.js`); bcrypt only uses 72 bytes, so longer ones are refused instead of silently cut.
- **Forgot password**: `forgot-password` creates a random token (32 bytes), stores only its SHA-256 hash in `passwordresets` (TTL index, valid for `config.auth.passwordResetExpiryMinutes`, 30 by default) and emails `CLIENT_URL/reset-password?token=...` (template `emails/reset-password`). Only the newest link works. The answer is the same whether the email has an account or not, and the email is sent after answering, so neither the answer nor its timing reveals accounts. `reset-password` takes the token and deletes it in the same step (`findOneAndDelete`: a link works once, even when used twice at the same moment), saves the new password and ends every session of the account.

## CORS

Browsers only let other websites call the API if the API allows their origin. Every request with an `Origin` header is checked in `src/app.js` and **allowed** when:

1. it has **no** `Origin` header (Postman, curl, server-to-server calls, mobile apps), or
2. it is **same-origin** (the page was served by this server), or
3. its origin is listed in **`CORS_ORIGINS`**.

Anything else gets `403 Not allowed by CORS`. Allowed requests may send cookies (needed for the refresh token). The `X-Request-Id` response header is exposed to them, so the browser app can read it (browsers hide other headers unless the server allows them).

| `CORS_ORIGINS` | Development | Production |
|---|---|---|
| not set or empty | `http://localhost:5200` (the Vite client) | none: only same-origin requests and requests without `Origin` |
| set | exactly the listed origins | exactly the listed origins |

**Adding an origin**

- **Development:** in `server/.env`, comma-separated:
  ```
  CORS_ORIGINS=http://localhost:5200, http://localhost:3000
  ```
  Then restart. nodemon does not watch `.env`: type `rs` + Enter in the `npm run dev` terminal.
- **Production:** set the variable where the server's environment is configured (hosting dashboard, Docker Compose `environment:`, systemd/PM2 settings), then redeploy or restart:
  ```
  CORS_ORIGINS=https://app.example.com,https://admin.example.com
  ```

**Writing an origin** (checked at startup; a wrong one stops the server with a message):

- An origin is exactly **protocol + host + port**: `https://app.example.com`, `http://localhost:5200`.
- No trailing slash (`https://app.example.com/`), no path (`https://app.example.com/login`), and always the protocol.
- These are all **different** origins, so list each one you use: `https://example.com` / `https://www.example.com`, `http://` / `https://`, `localhost` / `127.0.0.1`.
- No wildcards (`*.example.com`) on purpose: with cookies allowed, a wildcard would let any site act with your users' logins.

CORS only restricts **browsers**; tools like Postman and other servers ignore it. It is not a replacement for authentication: it stops other websites from calling the API with a visitor's cookies.

## Testing

```bash
npm test
npm test -- tests/unit                       # only unit tests
npm test -- tests/integration/auth.test.js   # one file
npm test -- -t "wrong password"              # tests whose name contains this text
```

- No MongoDB or `.env` needed: integration tests start a temporary in-memory MongoDB (`tests/helpers/db.js`), and `tests/setup/env.js` provides the variables. Tests never read `server/.env` (dotenv is replaced in that setup file), so results do not depend on your local settings, such as `EMAIL_ENABLED=true`. The first run on a machine downloads the MongoDB binary once.
- Logs are silent during tests; run `LOG_LEVEL=debug npm test` to see them while debugging. The logger's methods are spied on before every test (`tests/setup/spy-logger.js`), so tests can check what was logged: `expect(logger.error).toHaveBeenCalledWith({ err }, 'Seeding failed')`.
- To check the actual log lines (JSON, redaction), use `createCapturingLogger()` from `tests/helpers/log-capture.js` (see `tests/unit/utils/logger.util.test.js`).
- Helpers: `createUser(overrides, role)` creates a user and returns its plain password; `loginAs(identifier, password)` returns `{ token, cookie, res }`.
- Changing a config value for one test file: change it on the `config` object **before** requiring the app (see `tests/integration/rate-limit.test.js`).
- **No leftovers:** a normal run deletes its in-memory databases. A cancelled or crashed run cannot, so before every run `tests/setup/global-setup.js` deletes `mongo-mem-*` folders in the system temp folder that are older than a day and not in use (`tests/helpers/stale-mongo-dirs.js`). Leftovers never pile up.

**End-to-end server** (`npm run e2e:server`, `scripts/e2e-server.js`): the API the client's Playwright tests run against. It starts an in-memory MongoDB, creates the accounts in `scripts/e2e-accounts.json` (they exist only in that temporary database, so they are safe to commit), sets its own variables (it does not use `.env`) and listens on port 5100, allowing the E2E client on `http://localhost:5300`. Its database lives in one fixed temp folder (`e2e-mongo-db`) that is emptied at every start, because Playwright may end the process without letting it clean up. Run it from `server/`, where the MongoDB download is cached.

**Known workaround** (only in tests): `tests/helpers/db.js` passes `runtimeAdapters: { os }` to `mongoose.connect`. MongoDB driver 7.6+ loads `os` with a dynamic `import()` that fails inside Jest and breaks the connection handshake. Remove it once the driver ships the fix (NODE-7832).

## Linting and formatting

ESLint checks for bugs and enforces the style (4 spaces, single quotes, semicolons, trailing commas, LF line endings): `npm run lint`, `npm run lint:fix`.

For fixes on save in VS Code, install the **ESLint** extension (and **EditorConfig** for `.editorconfig`) and add to your settings:

```json
"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
```

`.gitattributes` keeps LF line endings in git on every operating system.

## Deploying to production

- `NODE_ENV=production`: cookies become `Secure` (HTTPS only) and `SameSite=Strict`; `debug` logs are silent.
- **HTTPS is required**, otherwise the browser will not store the refresh cookie.
- `SameSite=Strict` means the client and API must be on the **same site** (e.g. `app.example.com` and `api.example.com` are fine; `example.com` and `example-api.net` are not).
- `CORS_ORIGINS=https://your-frontend-domain` (no other origin is allowed in production by default).
- `CLIENT_URL=https://your-frontend-domain` when email is enabled (reset links point there).
- `TRUST_PROXY=1` (or the number of proxies) when running behind Nginx, a load balancer or a hosting platform, so rate limits apply per visitor and the server knows requests arrived over HTTPS (needed for the CORS same-origin check and `req.protocol`).
- Generate new secrets for production; never reuse development ones.
- `HOST=0.0.0.0` if the server must be reachable from outside the machine or container.
- **Running more than one instance** (several containers or processes behind a load balancer): rate limits are counted in memory, separately in each instance, so with 3 instances the login limit becomes 30 failed attempts instead of 10. Give the limiters in `src/middlewares/rate-limit.middleware.js` a shared store such as Redis ([`rate-limit-redis`](https://www.npmjs.com/package/rate-limit-redis)). With a single instance nothing needs to change.
