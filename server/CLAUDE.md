# Server: instructions for AI agents

Express 5 + MongoDB (Mongoose 9) API. `README.md` explains everything in detail (setup, env variables, endpoints, auth, CORS, logging, testing); read the relevant section before changing an area.

## Commands

- `npm test`: all tests (in-memory MongoDB, no `.env` or database needed)
- `npm run lint` / `npm run lint:fix`: ESLint (bugs + style)
- `npm run dev`: start with auto-reload · `npm run seed`: create the admin account
- `npm run e2e:server`: the API for the client's Playwright tests (in-memory database, accounts from `scripts/e2e-accounts.json`, port 5100); the client's `npm run e2e` starts it

**Done means:** `npm run lint` and `npm test` both pass, with tests for the change.

## Architecture

- Request flow: route → route middleware → controller → service → repository → model.
- **Controllers:** HTTP only (read `req`, call a service, send `res.status(...).json(successBody(message, data))`). No try/catch: Express 5 forwards async errors.
- **Services:** business rules. **Repositories:** the only place that uses Mongoose models.
- Routes, controllers, services and validations are organised by feature (`auth`, `user`); models and repositories by collection.
- File names: `name.type.js` in kebab-case (`order-item.service.js`). Model names in PascalCase (`mongoose.model('Order', ...)`).
- New feature: follow "Adding a new feature" in `README.md` (model, repository, service, validation, controller, routes, tests). REST-style routes for resources.

## Rules

- **Responses:** success via `successBody(message, data)` from `src/utils/response.util.js`. Never build error responses by hand.
- **Errors:** `throwError(message, statusCode, { errors, data })` or `new AppError(...)` from `src/utils/app-error.util.js`; in middleware pass them with `next(error)`. The error handler formats every failure.
- **Validation:** every route that takes input gets a Yup schema in `src/validations/` and `validateRequest` / `validateParams` / `validateQuery`. Handlers use the validated `req.body` / `req.params` / `req.query`.
- **Config:** only `src/configs/app.config.js` reads `process.env`. Everything else imports `config`. A new variable needs: the Yup schema (with `string()` / `number()` / `boolean()` helpers so empty values count as not set), the `config` object, `.env.example`, the README env table and a config test.
- **Logging:** `logger` from `src/utils/logger.util.js`, or `req.log` inside a request (adds the request id). Fields first, short fixed message second: `logger.info({ orderId }, 'Order created')`, `logger.error({ err }, 'Payment failed')`. Never `console.*` (only exception: config startup errors).
- **Database:** `sanitizeFilter` is on globally; operators built dynamically in our own code must be wrapped in `mongoose.trusted(...)`. Never pass raw user input as a query object.
- **Auth:** protect routes with `authenticateRequest`, then `verifyRole([...])` when needed.

## Security

- Never read, print or edit `.env`, and never put secrets, tokens or passwords in code, logs or test output.
- Do not weaken security settings (rate limits, CORS checks, cookie flags, secret length, bcrypt cost, redaction, `sanitizeFilter`) without asking first.

## Tests

- Every change comes with tests; never skip, delete or loosen tests to make them pass.
- `tests/unit/` mirrors `src/` (dependencies mocked); `tests/integration/` sends real requests with supertest against the in-memory database.
- Helpers: `createUser()` (`tests/helpers/user.factory.js`), `loginAs()` (`tests/helpers/auth.helper.js`), `db.connect / clear / close` (`tests/helpers/db.js`), `createCapturingLogger()` (`tests/helpers/log-capture.js`).
- Logger methods are spied on in every test: `expect(logger.error).toHaveBeenCalledWith({ err }, 'Message')`.
- To change a config value for one test file, change it on `config` **before** requiring the app.
- In-memory databases left by interrupted runs are removed by `tests/setup/global-setup.js` (older than a day, not in use); keep it when changing the test setup.
- A route the client uses in a new flow may need data in `scripts/e2e-server.js` / `scripts/e2e-accounts.json` for the client's E2E tests; change them together.
- Keep `runtimeAdapters: { os }` in `tests/helpers/db.js` until the MongoDB driver fix NODE-7832 is released (see README).

## Style and docs

- ESLint enforces the style: 4 spaces, single quotes, semicolons, trailing commas, LF line endings. Run `npm run lint:fix` after editing.
- Comments explain *why*, not what the code does.
- Update `README.md` when behaviour, endpoints, env variables or conventions change.
