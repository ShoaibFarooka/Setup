# Boilerplate Client

React web app boilerplate for the [server](../server/README.md): login with multi-device sessions, protected pages by role, a layout with sidebar, and one data layer for every API call.

**Stack:** React 19 · Vite · TanStack Query · React Router · own UI kit + Ant Design · CSS Modules · axios · Yup · Vitest + React Testing Library + MSW · ESLint

---

## Contents

- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Folder structure](#folder-structure)
- [How data flows](#how-data-flows)
- [API calls and the response contract](#api-calls-and-the-response-contract)
- [Where state lives](#where-state-lives)
- [Authentication](#authentication)
- [Form validation](#form-validation)
- [Languages](#languages)
- [Pages, routes and roles](#pages-routes-and-roles)
- [Adding a new feature](#adding-a-new-feature)
- [Loading data](#loading-data)
- [Lists with pagination](#lists-with-pagination)
- [UI components](#ui-components)
- [Theme (light and dark)](#theme-light-and-dark)
- [Motion and states](#motion-and-states)
- [Styling](#styling)
- [Performance](#performance)
- [Security](#security)
- [Testing](#testing)
- [End-to-end tests](#end-to-end-tests)
- [Linting and formatting](#linting-and-formatting)
- [Deploying](#deploying)

---

## Getting started

Requirements: Node.js 20.19 or newer, and the server running (see its README).

```bash
npm install
cp .env.example .env    # VITE_BASE_URL = the server's address
npm run dev             # http://localhost:5200
```

The server must allow this address in its `CORS_ORIGINS` (`http://localhost:5200` is allowed by default in development). Log in with the admin account created by the server's `npm run seed`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload on port 5200 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests on every save |
| `npm run test:coverage` | Run tests and report coverage (also written to `coverage/`) |
| `npm run lint` / `npm run lint:fix` | Check / fix bugs and style problems |
| `npm run e2e` | End-to-end tests in a real browser against the real API (Playwright); starts everything itself |
| `npm run e2e:ui` | The same, in Playwright's interactive mode (step through tests, see the browser) |
| `npm run e2e:update` | Accept new screenshots after an intended design change (look at them first) |

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_BASE_URL` | ✔ | The server's address, e.g. `http://localhost:5000` (no trailing slash) |

Only `src/config/appConfig.js` reads `import.meta.env`; everything else imports `appConfig`. The app stops at startup with a clear message when a required variable is missing.

Vite **builds the values into the app**: they are visible to anyone using it, so never put secrets here, and rebuild after changing them. `.env` is for development; for production builds use `.env.production` or set the variables in the build environment.

## Folder structure

```
client/
├── index.html               Page shell (title, icon)
├── jsconfig.json            The @/ import alias for the editor
├── src/
│   ├── main.jsx             Providers: ThemeProvider, TanStack Query, AuthProvider, router
│   ├── App.jsx              UiProvider (themes Ant Design) + routes
│   ├── config/              appConfig.js: settings only, the one place that reads import.meta.env
│   ├── lib/                 App infrastructure: set up once, rarely changed
│   │   ├── axiosInstance.js axios instance: token, refresh on 401, unwrapping, ApiError
│   │   ├── apiError.js      The one error type for every failed request
│   │   ├── session.js       The session in memory (access token, status)
│   │   ├── queryClient.js   TanStack Query setup: retries, caching, error messages for actions
│   │   └── theme.js         Light / dark / system: remembering, resolving, applying to <html>
│   ├── services/            One file per server feature, HTTP calls only
│   │   ├── authService.js   /api/auth/* calls
│   │   └── userService.js   /api/users/* calls
│   ├── hooks/               TanStack Query on top of the services: useMe, useLogin, useLogout, ...
│   │   └── queryKeys.js     All TanStack Query keys
│   ├── contexts/            AuthProvider (the session), ThemeProvider (light / dark)
│   ├── components/          Shared by several pages (a part only one page uses lives in that page's own components/)
│   │   ├── ui/              The UI kit, app-agnostic: Button, Input, FormField, Card, Table, Modal, toast, ... (index.js)
│   │   ├── layout/          The frame of the app: AppLayout, Sidebar, AuthContainer, PageHeader
│   │   └── ...              Other app pieces: ErrorBoundary, Loader, ConnectionError, QueryBoundary, BrandLogo, ThemeToggle
│   ├── pages/               One folder per feature (auth/, errors/, dashboard/, profile/, users/), one subfolder per page
│   ├── router/              RouteConfig.jsx (the routes), Router.jsx, ProtectedRoute / GuestRoute (access), LandingRedirect.jsx (/ → start page)
│   ├── constants/           App name, role labels, menu per role
│   ├── validations/         Yup schemas for forms, one file per feature (authValidations.js)
│   ├── utils/               Pure helpers (error text, access by role, validateForm)
│   └── styles/              theme.css (tokens, light + dark) + base.css: the only global CSS; shared modules
└── tests/
    ├── setup/               Test environment (MSW, jsdom fixes, reset between tests)
    ├── mocks/               Fake server in the server's response format (MSW)
    ├── helpers/             renderApp(), loggedIn()
    ├── unit/                One module at a time
    └── integration/         The whole app, driven like a user against the fake server
```

**Imports:** `@/` points to `src/` (`import useMe from '@/hooks/useMe'`), so imports read the same from any folder and survive moving a file. Use it for everything outside the file's own folder, and `./` for files next to it or below (a page's CSS, its subcomponents). Tests import app code the same way (`@/lib/session`). Set up in `vite.config.js` (`resolve.alias`, also used by Vitest) and `jsconfig.json` (so VS Code autocompletes and follows the paths).

**Naming:** components and providers in PascalCase (`Sidebar.jsx`, `AuthProvider.jsx`) with their CSS module next to them (`Sidebar.module.css`); hooks `useSomething.js`; other modules camelCase (`authService.js`, `errorUtils.js`).

## How data flows

```
page / component
  → hook               hooks/useMe.js, hooks/useLogin.js, ...   (TanStack Query: useQuery / useMutation)
  → service            services/userService.js, ...             (one function per server route)
  → axios instance     lib/axiosInstance.js                     (token, refresh, unwrapping, ApiError)
  → server
```

**Components never call axios or the services directly.** They use a hook, which gives them the data plus `isPending` / `isError` / `error` (queries) or `mutate` / `isPending` (actions).

## API calls and the response contract

The server answers every request in the same shape, and the client handles it in one place (`lib/axiosInstance.js`):

| Server sends | Service functions give you |
|---|---|
| `{ success: true, message, data }` | the `data` (e.g. `userService.getMe()` resolves to the user) |
| `{ success: false, message, errors?, data? }` | a thrown **`ApiError`** |
| no answer (server down, no network) | a thrown `ApiError` with `status: 0` |

`ApiError` (`lib/apiError.js`) always has:

- `status`: HTTP status (0 when unreachable)
- `message`: the server's message
- `errors`: message per field (validation), or `null`
- `data`: extra facts from the server, or `null`
- `requestId`: the server's `X-Request-Id`, which finds every server log line of the request

`getErrorMessage(error)` (`utils/errorUtils.js`) turns it into display text: the message plus the first field error.

**Errors of actions** (mutations: login, save, delete, ...) are shown automatically as a message with the server's text. A mutation that shows its error itself sets `meta: { silentError: true }`. **Errors of queries** are shown by the page (e.g. `ConnectionError`).

**Retries:** queries are retried twice when the server was unreachable or failed (0, 5xx), never for client errors (4xx). Actions are never retried automatically.

**Caching:** query data counts as fresh for 30 seconds; every component using the same query shares one request and one copy. All query keys are in `hooks/queryKeys.js`; after an action changes data, refresh it with `queryClient.invalidateQueries({ queryKey: queryKeys.users.all })`.

## Where state lives

| What | Where | Example |
|---|---|---|
| Data from the server | TanStack Query cache, through hooks | `const { data: user } = useMe();` |
| The session: logged in or not, the access token | `AuthProvider` (`useAuth()`), backed by `lib/session.js` | `const { isAuthenticated } = useAuth();` |
| UI state of one component | `useState` | form inputs, an open dialog |
| The colour theme | `ThemeProvider` (`useTheme()`), remembered in `localStorage` | `const { theme, setPreference } = useTheme();` |
| Other app-wide UI settings | a new context in `contexts/` when needed | |

There is no Redux: server data does not belong in a global store, and the rest is small.

## Authentication

- **Access token:** kept **in memory only** (`lib/session.js`), never in localStorage or a cookie scripts can read, so an injected script cannot steal it. Sent as `Authorization: Bearer ...` by the axios instance.
- **Refresh token:** an httpOnly cookie set by the server, invisible to JavaScript.
- **Page load:** the access token is gone after a reload, so `AuthProvider` calls `/api/auth/refresh-token` once. A valid cookie restores the session; otherwise the visitor sees the login page. Meanwhile protected pages show a loader (`status: 'checking'`).
- **Expired access token:** a request answered with 401 triggers one refresh, then is sent again. Requests failing at the same time share that refresh (the server replaces the refresh token on every refresh, so a second one would fail). If refreshing fails, the session ends and the login page opens.
- **Logout:** `useLogout()` → `logout.mutate()` (this device) or `logout.mutate({ allDevices: true })` (every device). This device is logged out even if the server call fails. On every logout the TanStack Query cache is cleared, so the next user never sees the previous user's data.
- **Forgot password:** "Forgot password?" on the login page opens `/forgot-password` (`useForgotPassword`), which asks the server to email a reset link and then always shows the same "Check your email" message (it never says whether the account exists). The link opens `/reset-password?token=...` (`useResetPassword`): the new password twice (`resetPasswordSchema`, the confirmation never leaves the browser), then the server ends every session of the account, the session in this browser ends too, and the login page opens. An invalid, used or expired link shows why, with "Request a new link". `/reset-password` is open to everyone (neither `protected` nor `guestOnly`), so the emailed link works in a browser where someone is logged in.

## Form validation

Forms check their values in the browser with **Yup** schemas from `src/validations/` (one file per feature, like the server's), so obvious mistakes show at once without a request:

```js
// validations/authValidations.js
export const loginSchema = yup.object({
    identifier: yup.string().trim().max(254, 'Email or username is too long!').required('Email or username is required!'),
    password: yup.string().trim().required('Password is required!'),
});

// in the form's submit handler
const errors = await validateForm(loginSchema, values);   // {} when valid, else { field: 'first message' }
setErrors(errors);
if (Object.keys(errors).length === 0) {
    login.mutate(values);
}
```

- `validateForm(schema, values)` (`utils/validationUtils.js`) returns the first message per field. It is async, so schemas may use async tests.
- The schemas mirror the server's rules for quick feedback only: the **server still validates every request** and stays the authority. When the server's rules change, update the matching client schema.
- Each schema has a unit test in `tests/unit/validations/`.

## Languages

English and Arabic (right to left), switched with the globe button next to the theme toggle (sidebar footer, auth pages). The choice is remembered (`localStorage`); without one the browser's language decides, otherwise English. The server answers in the same language (contract: `../CLAUDE.md`, "Languages").

| Piece | Where |
|---|---|
| Texts | `src/locales/en.json`, `ar.json`: the same keys, grouped by feature. English is bundled; Arabic (2.6 KB) downloads the first time it is used |
| Translating | `const { t } = useLanguage(); t('dashboard.welcome', { name })`; outside React: `import { t } from '@/lib/i18n'` |
| Counts | a text with plural forms (`{ "one": "...", "other": "..." }`, Arabic also `zero`, `two`, `few`, `many`): `t('key', { count })` picks the form |
| Dates, numbers | `formatDate(date)`, `formatNumber(n)` from `useLanguage()`; Arabic writes Arabic-Indic digits (٠-٩), also inside its texts and in the server's messages (`locale` in `lib/i18n.js` and the server's `i18n.util.js`) |
| Direction | `<html lang dir>`, set before the first paint by `index.html`, then by `LanguageProvider`; Ant Design follows through `UiProvider direction` |
| ui kit words | passed translated to `UiProvider texts` in `App.jsx` (the kit itself knows no languages) |
| Font | Inter for Latin letters, Noto Sans Arabic for Arabic ones; the Arabic font downloads only when Arabic text is shown |
| Requests | `Accept-Language` on every request (`lib/axiosInstance.js`) |

**Rules**

1. **No visible text in code:** labels, `aria-label`s, placeholders, toasts, validation messages (schemas hold keys; forms show `t(errors.field)`, so errors change language with the page). A missing key shows the key itself, and the parity test (`tests/unit/lib/i18n.test.js`) fails until both files have it.
2. **Right to left:** logical CSS properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`). What has no logical form gets a `:global([dir='rtl'])` rule: `translateX` (the phone drawer), `background-position` (the select arrow), icons that point a way (pagination arrows, log out).
3. **Check new pages in Arabic:** `e2e/a11y.spec.js` runs every page in both languages (`ar` headings in `PAGES`); `e2e/visual.spec.js` has Arabic screenshots of the main layouts. `useLanguage(page, 'ar')` from `e2e/fixtures.js` opens a test in Arabic.
4. **A new language:** `src/locales/<code>.json`, its entry in `LANGUAGES` (`lib/i18n.js`) and in `index.html`, the server's (`../CLAUDE.md`), and its pages in the E2E specs.

## Pages, routes and roles

Routes are in `router/RouteConfig.jsx`:

```js
const Profile = lazy(() => import('@/pages/profile/Profile/Profile'));

{ path: '/profile', element: <Profile />, protected: true, roles: ALL_ROLES, showSidebar: true },   // logged-in users
{ path: '/users/:id', element: <UserDetails />, protected: true, roles: [ROLES.admin] },            // admins only
{ path: '/login', element: <Login />, guestOnly: true },                                             // visitors only
{ path: '/reset-password', element: <ResetPassword /> },                                             // everyone
{ path: '*', element: <NotFound /> },                                                                // everyone
```

- **Layout routes** (`router/Router.jsx`): the routes are grouped under the session check and the layout, which render once and **stay mounted while moving between pages**; only the page inside (React Router's `<Outlet />`) changes. So the sidebar, its state and the user are not rebuilt on every navigation.
  - `protected` pages sit under `router/ProtectedRoute.jsx`, which waits for the session and the user and sends visitors to login (and back to the page afterwards). Inside it, `components/layout/AppLayout` draws the sidebar (for routes with `showSidebar`) and the content area, and `router/RequireRole.jsx` shows **Access denied** for roles without the page.
  - `guestOnly` pages sit under `router/GuestRoute.jsx`, which sends logged-in users on.
  - Pages that are neither (404, reset password) open for everyone, logged in or not.
  - Every page goes through `router/PageFrame.jsx`: its error boundary, the loader while its code downloads, and the entry animation.
- **Keyboard and screen readers:** the first link on app pages is **Skip to content** (visible when focused), which jumps over the sidebar. After moving to another page (a redirect included), focus goes to the new page's `<h1>`, so screen readers announce the change (single-page apps don't do this by themselves). A page that puts focus in itself first keeps it (the login form's `autoFocus` email field), and the first page load keeps the browser's focus. The heading and the skip link's `<main>` target show no focus ring (`[tabindex='-1']:focus` in `base.css`): they are focused only to guide screen readers, not to be operated; controls keep their ring. Every page therefore starts with one `<h1>` (`PageHeader` renders it).
- **Access by role** is the route's `roles` (required for protected routes; a protected route without it is open to no one). Roles are in `ROLES` / `ALL_ROLES` (`constants/appConstants.js`) and match the server's (`admin`, `user`); their names people see are `roles.<role>` in `src/locales/*.json`.
- **The menu** of each role is `constants/menuItems.jsx`; it is navigation only. The first page is where the role lands after login. Pages that are not in the menu (details, edit forms) and paths with parameters work like any other route. A test checks that every menu item leads to a page the role may open.
  - **Many pages:** only the menu scrolls; the logo and the footer (language, theme, user) stay in view, and the current page's link scrolls into view. A project with many pages can **group** them: an entry is either a page `{ path, labelKey, icon }` or a group `{ key, labelKey, icon?, items: [pages] }` (`labelKey`: a text in `src/locales/*.json`; `label` instead shows a text as it is, e.g. a name), and a role's list can mix both (or stay flat, like the example). Groups are one level deep, start folded, open by themselves when they hold the current page (and keep their name in the brand colour when folded), and their button tells screen readers whether it is open (`aria-expanded`); the current page's link has `aria-current="page"`. `utils/menuUtils.js` (`menuPages`, `groupOfPath`) reads both kinds of entries.
- **Lazy pages:** each page is imported with `lazy()`, so it is downloaded the first time it is opened instead of with the app. A loader shows meanwhile.
- **Errors:** every page is wrapped in an `ErrorBoundary`. If a page crashes while rendering, or its code fails to download (e.g. after a new deploy), it shows "Something went wrong" with **Reload page** instead of a blank screen, and the sidebar keeps working. A second boundary in `App.jsx` catches failures outside pages. Errors in event handlers and requests are not render errors: those go through `ApiError` and the error messages above.

## Adding a new feature

**A working example to copy: editing your profile** (Profile page → **Edit**). It goes through every layer:

| Layer | File |
|---|---|
| Server route, validation, service | `PATCH /api/users/me` (`server/src/routes/user.routes.js`, `validations/user.validation.js`, `services/user.service.js`) |
| Service function | `userService.updateMe` (`services/userService.js`) |
| Mutation hook | `hooks/useUpdateMe.js`: puts the server's answer into the cache, so the sidebar, profile and greeting update at once; shows a toast |
| Browser validation | `validations/userValidations.js` (mirrors the server's rules) |
| Form in a dialog | `pages/profile/Profile/components/EditProfileForm` with `Modal`, `FormField`, `Input`, `Button` |
| Tests | unit (`tests/unit/validations`), page (`tests/integration/profile.test.jsx`, fake `PATCH` in `tests/mocks/handlers.js`), E2E (`e2e/profile.spec.js`, the dialog in `a11y.spec.js` and `visual.spec.js`), server (`server/tests/integration/users.test.js`) |

The steps for a new feature, with `products` (a list and a create form) as the example:

1. **Service:** `src/services/productService.js`, one function per server route:
   ```js
   export const productService = {
       // A paginated list: { items, pagination } (contract in ../CLAUDE.md)
       list: (params) => api.get('/api/products', { params }),
       create: (product) => api.post('/api/products', product).then((data) => data.product),
   };
   ```
2. **Query keys:** add `products: { all: ['products'], list: (params) => ['products', 'list', params] }` to `hooks/queryKeys.js`.
3. **Hooks:** `hooks/useProducts.js` (`useQuery` with `keepPreviousData`, like `useUsers`) and `hooks/useCreateProduct.js` (`useMutation` that invalidates `queryKeys.products.all` on success). The list page follows "Lists with pagination" below.
4. **Validation:** `src/validations/productValidations.js` with a Yup schema for the create form (mirroring the server's rules).
5. **Page:** `pages/products/Products/Products.jsx` with `PageHeader` and parts from `@/components/ui` (`Card`, `Table`, `FormField`, `Button`, ...), using the hooks and `validateForm(productSchema, values)`; static parts render at once, and each data section gets its states through `QueryBoundary` (see "Loading data").
6. **Route and menu:** add it to `router/RouteConfig.jsx` with `lazy()` and the `roles` that may open it, and to those roles' menus in `constants/menuItems.jsx` if it should appear in the sidebar.
7. **Tests:** fake the server routes in `tests/mocks/handlers.js` (or per test with `server.use(...)`) using `success()` / `failure()`, then test the page with `renderApp({ route: '/products' })` and the schema in `tests/unit/validations/`. Add an E2E test for the flow in `e2e/`, the page to `e2e/a11y.spec.js` and `e2e/visual.spec.js`, then run those specs (`npx playwright test e2e/products.spec.js`, and `e2e/visual.spec.js -g "products"`) and look at the new screenshots. Which tests a change needs: "Testing levels" in `../CLAUDE.md`.

## Loading data

A page never waits for all of its data before showing anything, and never covers itself with a loader for its data.

1. **Static parts show at once:** the heading, texts, buttons and forms that need no data render right away.
2. **Each data section loads on its own:** one query hook per section, wrapped in `components/QueryBoundary`, which gives it every state: a `Skeleton` shaped like the content on the first load (marked `aria-busy`), an `Alert` with **Try again** (refetches only this section) when it fails, an `empty` message, or the content. One slow or failing request never holds up or breaks the others, and independent sections load in parallel.

   ```jsx
   <Card title={t('dashboard.newestUsers')}>
       <QueryBoundary query={useUsers(NEWEST)} skeleton={<Skeleton lines={5} />} errorTitle={t('dashboard.usersFailed')}
           isEmpty={(data) => data.items.length === 0} empty={<EmptyState title={t('dashboard.noUsers')} titleAs="p" />}>
           {({ items }) => <UserList users={items} />}
       </QueryBoundary>
   </Card>
   ```

3. **Refreshing keeps what is there:** a refetch, or the next page of a list, shows the current content (dimmed if useful, like the users table) instead of a skeleton again; a failed refresh keeps the data already shown.
4. **Full-screen loaders only for the app frame:** the session check when the app opens, a page's code downloading (inside the content area; the sidebar stays usable), and actions that must block (logging out). Never for a page's data.

The dashboard is the example: its heading and "Getting started" card render at once, "Your account" and (for admins) "Newest users" each load, fail and retry on their own (`tests/integration/dashboard.test.jsx`). Lists add their own rules (next section).

## Lists with pagination

Every list follows the pagination contract in `../CLAUDE.md`: the client sends `?page=1&limit=20&sort=-createdAt&search=text`, the server answers `data: { items, pagination: { page, limit, totalItems, totalPages } }`.

**The working example is the admin Users page** (`/users`, admins only): copy it for a new list.

| Piece | File | What it does |
|---|---|---|
| Service | `userService.list(params)` | `GET /api/users` with the parameters (empty ones left out of the URL) |
| Query key | `queryKeys.users.list(params)` | each page / search / sort is cached on its own |
| Hook | `hooks/useUsers.js` | `useQuery` with `placeholderData: keepPreviousData`: the current page stays on screen while the next one loads (`isPlaceholderData` is then true) |
| URL state | `hooks/useListParams.js` | page, search and sort live in the address (`?page=2&search=ada&sort=name`), so reload, back button and shared links show the same list. A new search or sort goes back to page 1; page and sort changes are history steps, typing a search is not |
| Search | `hooks/useDebouncedValue.js` | the request waits until typing stops (300ms): one request per word, not per letter |
| Page | `pages/users/Users/Users.jsx` | search box, sort, `Table`, `PaginationHandler`, and every state: `Skeleton` on the first load, the table dimmed while the next page loads, `EmptyState` text when nothing matches, an `Alert` with **Try again** on errors |
| Tests | `tests/integration/users.test.jsx`, `e2e/users.spec.js` | paging, search (and that it sends one request), sort, the address, errors, other roles |

`components/ui/PaginationHandler` shows "Showing 20 / 28 (Page 1 of 2)" with previous / page numbers / next buttons. It only displays pages and reports clicks.

- Pages start at 1. Previous / next are disabled on the first / last page; clicking the current page does nothing.
- It is accessible: real buttons ("Previous page", "Page 3", "Next page") inside `<nav aria-label="Pagination">`, with `aria-current="page"` on the current page.
- Hide it when there is nothing to page through (`totalItems === 0`).

**Rules for list pages**

1. The server pages the data; never fetch everything and page in the browser.
2. Page, search, sort and filters live in the URL (`useListParams`), never only in component state.
3. Search inputs are debounced (`useDebouncedValue`).
4. Query keys include every parameter; use `keepPreviousData`.
5. Every state is designed: first load, loading the next page, empty (with the search in the message), error with a retry.
6. Changing search, sort or a filter goes back to page 1.
7. Very long lists that must show many rows at once are virtualized (Ant Design `Table` has `virtual`), not rendered all at once.

## UI components

Every piece of UI comes from **`components/ui`**, imported from its index:

```jsx
import { Button, Card, FormField, Input, toast, confirm } from '@/components/ui';
```

The simple components are our own (CSS Modules + theme tokens), so every project can restyle them freely. Ant Design is used only for complex components that are hard to get right (focus trapping, keyboard menus, tables), **wrapped** in `ui/` and themed from the same tokens. Pages never import `antd`: ESLint refuses it outside `components/ui`.

| Group | Components | Built on |
|---|---|---|
| Actions | `Button` (primary, secondary, ghost, ghostInverse for brand-coloured areas, danger, dangerOutline; sm/md/lg; `loading`), `IconButton` (icon only, `label` required), `TextLink` (a link in text: `to` for a page of the app, `href` for another site, opened safely in a new tab; primary/muted), `DropdownMenu` | own; DropdownMenu: Ant Design |
| Forms | `FormField` (label + control + hint + error, linked for screen readers), `Input`, `PasswordInput`, `Textarea`, `Select` (native), `Checkbox`, `RadioGroup`, `Switch` | own |
| Content | `Card` (`title`, `actions`, `padding`), `DescriptionList`, `Table`, `Tabs`, `Badge`, `Avatar`, `Divider`, `PaginationHandler` | own; Table, Tabs: Ant Design |
| Feedback | `Alert`, `EmptyState` (empty lists, 404, errors), `Spinner`, `Skeleton`, `Tooltip`, `Modal`, `toast.success/error/warning/info()`, `confirm({ title, confirmText, danger, onConfirm })` | own; Tooltip, Modal, toast, confirm: Ant Design |
| Setup | `UiProvider` (themes Ant Design, used once in `App.jsx`) | |

Each component's file starts with a comment describing its props. Examples:

```jsx
// Every visible text from src/locales/*.json (README "Languages")
<FormField label={t('profile.email')} error={errors.email && t(errors.email)} hint={t('products.emailHint')}>
    <Input name="email" value={values.email} onChange={handleChange} />
</FormField>

<Button variant="secondary" icon={<FiPlus />} loading={create.isPending} onClick={handleCreate}>{t('products.new')}</Button>

<Card title={t('orders.title')} actions={<Button size="sm">{t('orders.export')}</Button>}>...</Card>

confirm({ title: 'Delete product?', confirmText: 'Delete', danger: true, onConfirm: () => remove.mutateAsync(id) });
```

**Rules**

1. **Use `ui/` for every control and building block.** No raw `<button>`, `<input>` or `<select>` styled in a page, and never `antd` directly. Import from `@/components/ui`, not from a component's own file (ESLint checks both).
2. **Missing something? Add it to `ui/`**, never inside a page: an own component if it is simple, an Ant Design wrapper if it is complex (`ui/DatePicker` wrapping Ant Design's, for example). Then export it from `ui/index.js`, add tests in `tests/unit/ui/` and a row to the table above.
3. **A ui component knows nothing about the app:** no API calls, feature hooks, routes or business words. It takes props and reports through callbacks (`onChange`, `onClick`). App-specific pieces built from them live next to `ui/`: the frame of the app in `components/layout/` (`Sidebar`, `PageHeader`), other shared pieces directly in `components/` (`ThemeToggle`).
4. **Variants through props** (`variant`, `size`, `tone`), not by restyling in a page. A page may pass `className` for layout only (margins, width, flex), never colours or shapes. A look several pages need becomes a new variant.
5. **Accessible by default:** every interactive element is a real button, link or form control with a name (`IconButton` requires `label`; `FormField` links label, hint and error). Tests find them by role and name.
6. **Only tokens in ui CSS:** colours, spacing, radius, font sizes and timing from `theme.css`. That is what lets a project restyle everything from one file.
7. **Restyling a project:** first `theme.css` (the brand palette, then the semantic tokens if needed), then the ui components' modules. Pages should not need changes.

## Theme (light and dark)

- **Tokens** live in `styles/theme.css`: a small **brand palette** (`--brand-*`, the colours to change per project) and the **semantic tokens** components use:
  - surfaces: `--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-surface-raised`, `--color-overlay`
  - text: `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-text-inverse`
  - borders: `--color-border`, `--color-border-strong`
  - brand roles: `--color-primary` (+ `-hover`, `-soft`), `--color-on-primary`, `--color-accent`, `--color-focus-ring`, `--color-hover`
  - large brand areas (the login page): `--color-brand-bg`, `--color-on-brand`, `--color-on-brand-hover` (deep indigo in dark mode, where the bright primary would glare)
  - status: `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, each with a `-soft` background
  - shadows (`--shadow-sm/md/lg`), typography (`--font-family`, `--font-size-xs` to `--font-size-4xl`, weights, line heights, `--letter-spacing-tight` for large headings), spacing (`--space-1` to `--space-16`, a 4px scale), radius, control heights, motion, z-index layers
- **Dark theme:** `:root` holds the light values and `:root[data-theme='dark']` the dark ones. The theme in use is the `data-theme` attribute on `<html>`.
- **No flash:** a tiny script in `index.html` sets `data-theme` before the first paint, from the remembered choice or the system setting.
- **Choice:** `ThemeToggle` (in the sidebar and on the login page) cycles **light → dark → system**. `ThemeProvider` (`contexts/`) applies it, remembers it in `localStorage` (only the theme name, nothing sensitive), and on "system" follows the OS switching live. In code: `const { theme, preference, setPreference } = useTheme();`.
- **Ant Design follows automatically:** `UiProvider` reads the CSS variables and passes them to Ant Design with its dark algorithm, so `theme.css` stays the only place colours are defined. Toasts and confirm dialogs go through Ant Design's `App` context, so they follow the theme too.
- `color-scheme` is set per theme, so scrollbars, native pickers and autofill match.

**Rules**

1. Components use **semantic tokens only** (`--color-surface`, `--color-text-muted`), never `--brand-*` and never typed colours. Name a token by its role, not its look (`--color-danger`, not `--red`).
2. **A new colour token needs a light and a dark value.** Check new screens in both themes.
3. Text on coloured backgrounds uses the matching "on" token (`--color-on-primary`) or `--color-text-inverse`; status messages use the status colour on its `-soft` background.
4. SVG icons use `currentColor`, so they take the text colour of their parent in both themes.

## Motion and states

Small, quick feedback makes the app feel responsive. What is built in:

| Where | What happens |
|---|---|
| `Button`, `IconButton` | hover colour (solid buttons lift with a small shadow), a push down when pressed, a soft brand-coloured focus ring for the keyboard, a spinner while `loading` |
| Text controls | border darkens on hover; on focus the field brightens and gets the brand ring |
| `FormField` errors, `Alert` | fade in when they appear |
| Pages | rise into place on every navigation (`router/Router.jsx`) |
| Sidebar | items change colour smoothly; on phones it is a drawer that slides in over a dimmed backdrop, and is hidden from the keyboard and screen readers while closed |
| Theme switch | colours fade over instead of jumping; the toggle's icon turns into place |
| `Loader` | appears only after `--loader-delay` (300ms), so quick loads never flash a spinner |
| `Switch`, `Skeleton`, Ant Design parts | their own transitions (thumb slide, shimmer, dialog and menu animations) |

Tokens (`theme.css`): `--duration-fast` (150ms: hover, press), `--duration-base` (250ms: toggles, menus, theme switch), `--duration-slow` (400ms: things entering the screen), `--easing` (between two states), `--easing-out` (entering), `--loader-delay`.

Shared entry animations live in `styles/motion.module.css`: `fadeIn`, `fadeUp`, `popIn`. Add them next to the component's own class: `className={clsx(styles.error, motion.fadeIn)}`.

**Rules**

1. **Every interactive element has all its states:** hover, pressed (`:active`), keyboard focus (`:focus-visible`) and disabled; plus loading when it starts work. The ui components already do; new ones must too.
2. **Only durations and easings from the tokens**, never typed values: the app then moves at one rhythm, and a project can make it snappier or calmer in one place.
3. **Animate `transform` and `opacity`** (and colours); never width, height, top or left, which make the page stutter. And never **position** an interactive element with `transform` (such as centring it with `translateY(-50%)`): its pressed state sets its own `transform`, so it jumps while pressed and a click released outside it is lost (the password eye button did this). Centre it with layout: `inset-block: 0; margin-block: auto`, flex or grid. `e2e/password-input.spec.js` shows how to test presses like a person makes them.
4. **Motion explains, it does not decorate:** something appearing, moving or responding to the user. Keep it short and subtle (a few pixels, under half a second); no looping animations except loading indicators.
5. **Reduced motion is respected automatically** (`base.css` turns animations and transitions off when the system asks for less motion). Never rely on an animation to carry information.
6. **Loading:** wait `--loader-delay` before showing a spinner; prefer `Skeleton` for content whose shape is known (lists, cards).

## Styling

Plain CSS, written as **CSS Modules**: every class gets a unique name at build time (`.menu` becomes `_menu_x7k2`), so a class in one component can never restyle another, whatever order pages load in.

```jsx
import clsx from 'clsx';
import styles from './Sidebar.module.css';

<nav className={styles.sidebar}>
    <Link className={clsx(styles.item, isActive && styles.active)}>...</Link>
</nav>
```

```css
/* Sidebar.module.css: short camelCase names are safe, they cannot clash */
.item { padding: var(--space-3) 0; color: var(--color-text-muted); }
.active { background-color: var(--color-primary-soft); color: var(--color-primary); }
```

**Where styles go**

| Need | Use |
|---|---|
| Applies to every page (reset, body, fonts, links, focus ring) | `styles/base.css` (global) |
| A colour, size, spacing, radius or timing | a token in `styles/theme.css` (global) |
| A control or building block (button, input, card, ...) | `components/ui` (see "UI components") |
| Part of the app's frame (sidebar, page header, auth screen) | `components/layout/` |
| Another app-specific block several pages repeat | a shared component in `components/` with its module (`ConnectionError`) |
| A part only one page uses | that page's own `components/` folder (`pages/auth/Login/components/Form`) |
| Layout classes several components reuse | a shared module in `styles/` (`authForm.module.css`), imported where needed |
| Everything else | the component's own `X.module.css` next to `X.jsx` |

**Rules**

1. **One module per component or page**, named `X.module.css`. A plain `.css` file is global: only `base.css` and `theme.css` (imported once through `index.css`) may be.
2. **Class names in camelCase** (`.pageButton`, `.inputError`) so they read as `styles.pageButton`.
3. **Flat selectors:** one class, or a state class plus one child (`.active .label`). No chains like `.page .content .card`, no IDs, no `!important` (the one exception is the reduced-motion rule in `base.css`). Nothing then depends on which selector is "stronger".
4. **Only tokens:** colours, spacing, font sizes and weights, radius, shadows and durations come from `theme.css`, never typed directly. Plain numbers are fine for one-off sizes of a component (an icon's width, a panel's max width).
5. **No inline `style`**, except for values computed at runtime (a progress bar's width, a Skeleton's size).
6. **Combining classes:** `clsx(...)` for module classes, global classes and conditions together: `clsx(styles.button, isPrimary && styles.primary, 'some-global-class')`. `false`, `null` and `''` are skipped.
7. **Reusing a shared class: add it in JSX with `clsx`, never with `composes`.** `composes ... from` another file makes every build print a PostCSS warning (Vite's CSS Modules tool copies the rules without their source file), and a warning on every build teaches people to ignore real ones. When the shared class and your own set the same property (e.g. padding), keep them in **one** module so the order is fixed: Textarea and Select are variants (`.multiline`, `.select`) inside `Input.module.css`.
8. **Ant Design** is themed through `UiProvider` from the tokens. When one of its own classes must be changed, do it inside the ui wrapper's module with `:global(.ant-btn) { ... }` so the change stays in that component.
9. **Logical properties** (`margin-inline-start`, `inset-inline-end`) instead of left / right, so a right-to-left language works without new CSS.

**Responsive design**

Every screen works from a 320px phone to a wide desktop. What is in place:

- **Text:** sizes are in `rem`, so they follow the size people set in their browser. Body text stays 16px everywhere; headings (`--font-size-xl` to `--font-size-4xl`) scale with the screen width between a phone and a desktop size (`clamp()`).
- **Breakpoints:** only `480px` (phone), `768px` (tablet: the sidebar becomes a drawer) and `1024px` (small laptop), as `@media (max-width: ...)`. Media queries cannot read variables, so these values are agreed in `theme.css`.
- **Touch screens** (`@media (pointer: coarse)`): controls grow to at least 44px (`--control-height-*`), and small inputs keep 16px text so phones don't zoom in.
- **Full-height areas** use `min-height: 100dvh` (after a `100vh` fallback), which follows the mobile browser's address bar instead of jumping.
- **Layout per screen:** the login page puts a compact brand above the form on tablets and phones; the app shows the logo in the top bar next to the menu button; page headers stack their actions under the title on phones; cards use less padding; description lists stack; tables scroll inside their box; pagination wraps.
- Long words and URLs wrap (`overflow-wrap`), images never overflow their container, and phones don't inflate text in landscape.

Rules:

1. **Check every new screen at 360px, 768px and desktop**, in both themes.
2. **No fixed widths that can overflow:** pair a width with `max-width: 100%`, or use `minmax()`, `%` and flex / grid.
3. **Use only the agreed breakpoints**, and put a component's media queries in its own module.
4. **Heading sizes from the tokens** (they are already fluid); never shrink body text below `--font-size-md` on phones.
5. **Touch targets come from `--control-height-*`**, so they grow on touch screens automatically.

Other notes:

- Font: Inter, bundled with the app through `@fontsource/inter` (imported in `src/index.css`, no request to Google Fonts). Another font: install its `@fontsource/...` package, import its weights in `src/index.css`, change `--font-family` in `theme.css`.
- Branding: the brand palette in `styles/theme.css`, `APP_NAME` in `constants/appConstants.js`, `<title>` in `index.html`, `components/BrandLogo`, and the icons in `public/`: `favicon.svg` (sharp, has a dark-mode version), `favicon.ico` (16 / 32 / 48px, for older browsers) and `apple-touch-icon.png` (180×180, iOS home screens; a full square, iOS rounds the corners). When the logo changes, regenerate the PNG / ICO from the SVG (any SVG-to-ICO tool, or a browser screenshot at those sizes).
- Tests should not depend on class names (find elements by role and name). When a test must check a style state, import the module and compare with its class: `expect(nav).toHaveClass(styles.open)`.

## Performance

What is in place: pages load on first use (`lazy()`), so do Ant Design's heavy parts (Table, Tabs, Modal: see below), each package is its own cached file except Ant Design, which is split by use (`manualChunks` in `vite.config.js`), server data is cached and shared (TanStack Query, 30s fresh), lists are paged on the server, search is debounced, spinners wait before showing, the font is bundled.

**Size budget:** the first page downloads about **220 KB of JavaScript (gzip)**: React, the router, TanStack Query, axios and the part of Ant Design every page needs (its theme provider, toasts, `confirm()`, Tooltip). Keep it **under 250 KB**. Measure it after `npm run build`: everything `dist/index.html` loads up front, gzipped (`npm run build`'s own list shows every file, including those only some pages load):

```bash
node -e "const fs=require('fs'),z=require('zlib');const h=fs.readFileSync('dist/index.html','utf8');const f=[...h.matchAll(/(?:src|href)=\"\/(assets\/[^\"]+\.js)\"/g)].map(m=>m[1]);console.log((f.reduce((s,x)=>s+z.gzipSync(fs.readFileSync('dist/'+x)).length,0)/1024).toFixed(1)+' KB')"
```

**Ant Design on demand:** `components/ui` wrappers of heavy Ant Design components load them with `lazy()` from their own path (`lazy(() => import('antd/es/table'))`), so only pages that show one download it: `Table` and `Tabs` show a skeleton meanwhile, `Modal` loads when it first opens, and `DropdownMenu` (the language switch is on every page) loads when the page with it opens: a click on its trigger before the code has arrived is remembered and the menu opens as soon as it has. Tooltip stays on the first page: its code is shared with toasts and `confirm()`, which load anyway. A new wrapper of a heavy Ant Design component does the same; check the budget before and after. Every Ant Design import inside `components/ui` (tests too) uses these per-component paths, never `'antd'`: the test runner resolves `'antd'` to another copy (`antd/lib`), whose theme and direction would not reach the parts loaded from `antd/es` (ESLint refuses it).

**Rules**

1. **New dependencies need approval** (see `../CLAUDE.md`): say what it adds to the bundle (`npm run build` before / after, or bundlephobia.com) and why nothing existing does the job. Prefer small, tree-shakable packages; import only what you use (`import { debounce } from 'x'`, not the whole library).
2. **Heavy parts load on demand,** not just pages: charts, rich-text editors, maps, PDF viewers go behind `lazy()` inside the page that uses them.
3. **Images:** `loading="lazy"` below the fold, a `width` and `height` (or `aspect-ratio`) so the page does not jump, a size close to how big they are shown, and a modern format (WebP / AVIF) where possible.
4. **Lists:** paged on the server; virtualized when many rows must be on screen at once.
5. **No `memo` / `useMemo` / `useCallback` by default.** Add them where profiling (React DevTools Profiler) shows a slow render, not "just in case".
6. **No request waterfalls:** queries that don't depend on each other run in parallel (several hooks in the same component do); don't fetch in a child what the parent could fetch together.

## Security

What is in place: the access token lives in memory only, the refresh token is an httpOnly cookie, every request goes through one client that handles 401 / refresh, React escapes what it renders, and the server sends security headers and no-store caching.

**Rules**

1. **Never `dangerouslySetInnerHTML`.** If HTML from users or the server must really be shown, sanitize it first (DOMPurify) and ask before adding it.
2. **Links to other sites** use `rel="noopener noreferrer"` (with `target="_blank"`).
3. **Never log tokens or personal data** (no `console.log` of responses with emails, names, tokens); remove debug logging before committing.
4. **Redirects only go to paths inside the app** (as `GuestRoute` does with the page asked for), never to a URL taken from the address or a response.
5. **No secrets in the client:** everything in `VITE_` variables and in the code is visible to anyone using the app.
6. The server is the authority: hiding a button or a page is for convenience; the server checks the role on every request.

## Testing

```bash
npm test
npm test -- tests/integration/auth.test.jsx   # one file
npm test -- -t "wrong credentials"            # tests whose name contains this text
```

- **Vitest** (Jest-like API: `describe`, `test`, `expect`, `vi.fn()`), **React Testing Library** (render and use components like a user) and **MSW** (fakes the server at the network level, so the real API client, hooks and components run).
- `tests/mocks/handlers.js` is the default fake server: a visitor without a session and one valid account (`VALID_CREDENTIALS`). Its responses use `success()` / `failure()` from `tests/mocks/responses.js`, which follow the server's contract exactly.
- `renderApp({ route })` renders the whole app at a page with fresh providers; `loggedIn()` makes the page load restore a session.
- Change a route for one test with `server.use(http.get(..., () => failure(503, '...')))`. A request no handler answers fails the test.
- The test browser (jsdom) runs at `http://localhost:5200` and **enforces CORS like a real browser**, so fake responses carry the server's CORS headers (`corsHeaders`) and pre-flights are answered.
- Between tests: the session, the theme, the fake server, the query cache and Ant Design dialogs are reset (`tests/setup/setup.js`). `tests/helpers/matchMedia.js` fakes the system's light / dark setting.

## End-to-end tests

`npm test` runs in jsdom: fast, but with no layout, no media queries and a fake server. The end-to-end tests in `e2e/` run **the real app in a real browser (Chromium, through Playwright) against the real API**, so they catch what unit tests cannot: flows that break against the server, overlaps and overflow, contrast, a broken dark theme.

```bash
npm run e2e                                  # everything, headless
npm run e2e -- e2e/auth.spec.js              # one file
npm run e2e:ui                               # interactive: step through tests and watch the browser
npm run e2e:update                           # accept new screenshots after an intended design change
npx playwright show-report                   # the HTML report of the last run
```

**How it runs:** `playwright.config.js` starts its own API (`cd ../server && npm run e2e:server`: an in-memory database with known test accounts, port 5100) and its own client: a **production build** (`dist-e2e/`, git-ignored) served by `vite preview` on port 5300, as users get it. The dev server would compile files on first use, which makes parallel tests slow and flaky. Your development servers on 5000 / 5200 keep running, and no real data is touched. Each test runs on two projects: **desktop** (Chrome, 1440px) and **mobile** (a phone: small screen, touch).

| File | Covers |
|---|---|
| `auth.spec.js` | logging in (right, wrong, empty), returning to the page asked for, the session surviving a reload, logging out, "log out of all devices" ending another device's session |
| `access.spec.js` | visitors sent to login, the 404 page, each role's pages and details, sidebar navigation and the phone menu drawer |
| `sidebar.spec.js` | a menu with many pages (40 added by `fillMenu()` from `fixtures.js`): only the menu scrolls, the logo and the footer stay in view, on desktop and in the phone drawer |
| `users.spec.js` | the admin users list: pages, search (also after a reload), no matches; other roles without access |
| `language.spec.js` | switching to Arabic: texts, direction, a server message in Arabic, the choice remembered after a reload; the sidebar on the right; switching back |
| `password-input.spec.js` | the show / hide password button on login and reset password, pressed like a person does (held, at its top, middle and bottom, alternating between fields) |
| `password-reset.spec.js` | forgot password end to end: the email the server wrote, its link, the new password logging in and the old one refused, the link working only once; an unknown email; a link without a token |
| `profile.spec.js` | editing the profile: saving and seeing the change everywhere (also after a reload), an email of another account refused, invalid values |
| `a11y.spec.js` | axe accessibility checks of every page and the edit dialog, in light and dark; serious or critical problems fail |
| `visual.spec.js` | screenshots compared with the approved ones in `e2e/__screenshots__`: every page at 1440px, 768px and phone size, the dialogs and the phone menu, light and dark |

**Writing tests:** import `test`, `expect`, `accounts`, `pageReady` from `e2e/fixtures.js`. `loginAs(account)` logs in through the API (each test gets its own session; the server replaces the refresh token on every use, so a shared saved login would not work); `openMenu()` opens the phone drawer. Find elements by role and name, as in the unit tests. The accounts are in `server/scripts/e2e-accounts.json` and only exist in the E2E server's temporary database.

**Emails:** the E2E server sends nothing; it writes every email to a temporary folder (`<temp>/e2e-outbox/<recipient>.json`, the newest per recipient). `clearEmail(to)` forgets the last one, `readEmail(to)` waits for the next and returns `{ to, subject, text, html }` (see `password-reset.spec.js`). A test that changes an account (password, "log out everywhere") gets its own account and runs on one project only.

**Screenshots:**

- A visual test fails when a page looks different from its approved screenshot; `test-results/` then has the expected, actual and diff images.
- After an intended change, `npm run e2e:update` saves the new ones. **Look at them before committing**: an approved screenshot is a promise that the page looks right.
- Screenshots are stored per operating system (`-win32`, `-linux`, ...), because fonts render slightly differently. In CI they are usually made inside Playwright's Docker image so they match exactly.
- Animations are turned off and the web font is awaited, so runs are stable. Up to 100 differing pixels are allowed (a fixed count, not a percentage, so even a small new button in a corner fails the test).
- Assertions wait up to 10 seconds: logging in hashes the password on a real server, which takes a moment on a busy machine.

**Disk:** `test-results/` and `playwright-report/` are replaced on every run (and git-ignored). The E2E server keeps its database in one fixed temp folder that every run empties. The Chromium download (in `%LOCALAPPDATA%\ms-playwright` on Windows) is shared by all projects.

## Linting and formatting

ESLint checks for bugs and React mistakes and enforces the same style as the server (4 spaces, single quotes, double quotes in JSX attributes, semicolons, trailing commas, LF): `npm run lint`, `npm run lint:fix`. For fixes on save in VS Code, install the ESLint extension and set `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }`.

## Deploying

- `npm run build` creates static files in `dist/`; serve them from any static host or CDN, with every unknown path answered by `index.html` (the router handles the pages).
- Set `VITE_BASE_URL` to the production server **at build time**.
- Add the client's address to the server's `CORS_ORIGINS`.
- The server's refresh cookie is `SameSite=Strict` in production: client and server must be on the **same site** (e.g. `app.example.com` and `api.example.com`), served over HTTPS.
