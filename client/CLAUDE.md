# Client: instructions for AI agents

React 19 + Vite web app for the server in `../server`. `README.md` explains everything in detail (data flow, response contract, auth, routes, testing); read the relevant section before changing an area.

**Read `../CLAUDE.md` first:** it holds the contract with the server (including lists and pagination) and the approval rule. A task that would break or bend a rule here, or needs something not covered, is stopped and asked about before doing it.

## Commands

- `npm test`: unit and integration tests (Vitest + React Testing Library + MSW, no server needed)
- `npm run e2e`: end-to-end tests in a real browser (Playwright) against the real API; starts everything itself
- `npm run e2e:ui`: the same, interactive · `npm run e2e:update`: accept new screenshots (after looking at them)
- `npm run lint` / `npm run lint:fix`: ESLint (bugs, React rules, style)
- `npm run dev`: dev server on port 5200 · `npm run build`: production build

**Done means:** the change has its tests and passes the testing level it needs (`../CLAUDE.md`, "Testing levels"): while working, the related unit tests (`npx vitest related --run <files>`) and the affected E2E spec; when done, the full `npm test` and the affected specs on both devices. The full `npm run build` and `npm run e2e` only for shared parts (router, layout, theme or `base.css`, `lib/`, widely used ui components, the E2E setup) or before a push. For anything people can see, the screenshots of the changed pages are looked at in both themes (below).

## End-to-end tests and checking the UI (required)

Unit tests run in jsdom: no layout, no media queries, no real server. They cannot catch overlaps, overflow, clipped text, bad contrast, a broken dark theme or a flow that breaks against the real API. `e2e/` (Playwright, README "End-to-end tests") covers that.

- **Flows:** every user-facing flow gets an E2E test (log in, a form, a role's access, ...), next to the existing ones in `e2e/*.spec.js`. Use `loginAs(account)` and `openMenu()` from `e2e/fixtures.js`, the accounts from `server/scripts/e2e-accounts.json`, and find elements by role and name.
- **Accessibility:** `e2e/a11y.spec.js` runs axe on every page in both themes; a new page goes into its `PAGES`. Serious problems are fixed, never ignored.
- **`PAGES` entries** (in `a11y.spec.js` and `visual.spec.js`): `account: 'admin'` for pages behind a role, `waitFor: '<text>'` when the page loads data after its heading, and values that change between runs (dates, ids) are masked in screenshots (table date cells already are).
- **Looks:** `e2e/visual.spec.js` compares screenshots with the approved ones in `e2e/__screenshots__` (desktop 1440 and 768px, a phone; light and dark). A new page or a new menu or dialog goes into it.
  - **An unintended difference is a bug:** read the expected, actual and diff images in `test-results/`, and fix the cause.
  - **After an intended change:** update only the changed pages' screenshots (`npx playwright test e2e/visual.spec.js -g "<page>" --update-snapshots`; `npm run e2e:update` redoes all of them, for shared changes), then **open and read every new or changed screenshot** before saying the work is done. Never update screenshots without looking at them.
- **Data:** never confirm actions on shared accounts that would disturb other tests running in parallel (for example "log out everywhere" and the password reset: each has its own account and runs on one project only). A new account in `e2e-accounts.json` means one sample user fewer in `e2e-server.js` (the lists expect 28 users).
- **Emails:** the E2E server writes them to a temporary outbox instead of sending; read them with `clearEmail(to)` / `readEmail(to)` from `e2e/fixtures.js`.
- **Report** what was run, which screenshots you looked at, what you found and fixed, and anything not covered.
- **Exploring something the tests don't reach** (a hover state, a long text): use a connected browser tool (Claude in Chrome), or a temporary Playwright script in your scratchpad, and delete it afterwards.

## Data layer (the main rules)

- **Every API call goes through a hook.** Components never import axios, `lib/axiosInstance.js` or the services. Flow: component → hook (`hooks/`) → service (`services/*Service.js`) → `lib/axiosInstance.js`.
- **Fetching:** `useQuery` in a hook (`hooks/useMe.js` is the example). **Actions:** `useMutation` in a hook (`hooks/useLogin.js`, `hooks/useLogout.js`).
- **Services:** one function per server route in `services/<feature>Service.js`, using `api.get/post/put/patch/delete` from `lib/axiosInstance.js`. `services/` holds feature services only; shared infrastructure (axios instance, `ApiError`, session, query client) lives in `lib/`. Services only make HTTP calls (no React, no state). They return the response's `data` (the client unwraps `{ success, message, data }`) and throw `ApiError` on failure. Never read `response.data.data` or the raw axios error elsewhere.
- **Errors:** always `ApiError` (`status`, `message`, `errors`, `data`, `requestId`). Display text via `getErrorMessage(error)`. Failed mutations show a message automatically; set `meta: { silentError: true }` only when the component shows the error itself.
- **Query keys** only from `hooks/queryKeys.js`. After a mutation changes data, invalidate the affected keys in its `onSuccess`.
- **State:** server data in the TanStack Query cache (never copied into context or state); the session in `AuthProvider` / `useAuth()`; component UI state in `useState`. No Redux.
- **Config:** only `src/config/appConfig.js` reads `import.meta.env`. A new variable needs `appConfig`, `.env.example` and the README table. Never put secrets in `VITE_` variables (they are built into the app).

## Lists (details in README "Lists with pagination"; copy the admin Users page)

- The server pages every list (contract in `../CLAUDE.md`); never fetch everything and page in the browser.
- Page, search, sort and filters live in the URL via `useListParams`; search inputs use `useDebouncedValue`; query keys include every parameter (`queryKeys.<feature>.list(params)`) and the hook uses `placeholderData: keepPreviousData`.
- Every state is designed: `Skeleton` on the first load, the table dimmed (`loading={isPlaceholderData}`) while the next page loads, an empty message naming the search, an `Alert` with a retry on errors. New search, sort or filter → page 1. `Table` gets a `label`.

## Performance and security (details in README "Performance" and "Security")

- First-page JavaScript stays under 250 KB gzip; compare `npm run build` sizes before and after a change that adds code to it. New dependencies need approval with their size.
- Heavy parts (charts, editors, maps) behind `lazy()` too; images with `loading="lazy"`, width and height, a fitting size and a modern format; long lists paged or virtualized; no `memo` / `useMemo` / `useCallback` without a measured reason; independent queries in parallel.
- Never `dangerouslySetInnerHTML` (ask first; sanitize with DOMPurify if unavoidable); external links `rel="noopener noreferrer"`; never log tokens or personal data; redirects only to paths inside the app; no secrets in client code or `VITE_` variables.

## Languages (details in README "Languages")

- Every visible text, label, `aria-label`, placeholder and toast comes from `src/locales/en.json` **and** `ar.json` (same keys; `tests/unit/lib/i18n.test.js` fails when one is missing): `const { t } = useLanguage(); t('users.title')`, outside React `t` from `@/lib/i18n`. Never write visible English in a component.
- Dates and numbers through `formatDate` / `formatNumber` from `useLanguage()` (never `toLocaleString()` without the locale).
- ui components stay language-free: their own words come from `UiProvider texts` (`App.jsx`); a new one adds its text there and in `uiTexts.js`.
- Right to left: only logical CSS properties; what has no logical form (`translateX`, `background-position`, icons that point a way) gets a `:global([dir='rtl'])` rule. A new page is checked in Arabic too (a11y, and screenshots for a new layout).

## Forms

- Validation rules live in Yup schemas in `validations/<feature>Validations.js`, never inline in components. Their messages are keys (`'validation.emailRequired'`): keep the errors in state and show them with `t(errors.email)`. Forms check them with `validateForm(schema, values)` (`utils/validationUtils.js`) before calling the mutation.
- The schemas mirror the server's rules for quick feedback; the server stays the authority. When a server rule changes, update the matching schema and its test in `tests/unit/validations/`.

## Auth and routes

- The access token lives in memory only (`lib/session.js`). Never store tokens in localStorage, sessionStorage or JS-readable cookies.
- Routes in `router/RouteConfig.jsx` (`protected`, `roles`, `guestOnly`, `showSidebar`). Every protected route lists its `roles` (from `ROLES` / `ALL_ROLES`, matching the server's); that alone decides access. `constants/menuItems.jsx` is navigation only.
- Pages are imported with `lazy()` in `RouteConfig.jsx`. `Router.jsx` groups them as layout routes (session check → `AppLayout` → `RequireRole` → `PageFrame`); the layout stays mounted between pages, so never re-create it inside a page. Don't import pages directly elsewhere (it would put them back into the main bundle).
- Every page starts with exactly one `<h1>` (use `PageHeader`): after a navigation, focus moves to it for screen readers (without a focus ring), unless the page focused one of its own fields (`autoFocus`). Never give `tabindex="-1"` elements a visible focus style. Keep the "Skip to content" link and `id="main-content"` in `AppLayout`.
- Logout only through `useLogout()` (it clears the query cache).

## Structure and style

- New feature: follow "Adding a new feature" in `README.md` (service, query keys, hooks, validation schema, page, route + menu, tests).
- Pages grouped by feature (`pages/<feature>/<Page>/`), never by role: who may open a page is decided only by the route's `roles`.
- Components/providers PascalCase in their own folder with their CSS module; hooks `useX.js`; other modules camelCase.
- Imports from `src/` use the `@/` alias (`@/hooks/useMe`), in `src` and in tests; `./` only for files in the same folder or below (a page's own CSS or subcomponents). Never `../` into another part of `src`.
- Interactive elements are real `<button>`s / links with accessible names (tests find them by role and name).
- ESLint enforces the style (4 spaces, single quotes, double quotes in JSX, semicolons, trailing commas, LF). Run `npm run lint:fix` after editing.
- Comments explain *why*, not what the code does. Update `README.md` when behaviour or conventions change.

## UI components (details in README "UI components")

The UI must stay restylable per project: every control and building block comes from `components/ui`.

- Import from `@/components/ui` (the index) only. Never import `antd` outside `components/ui`, and never a ui component's own file; ESLint refuses both.
- No raw styled `<button>`, `<input>`, `<select>`, link or card markup in pages: use `Button`, `IconButton`, `TextLink`, `FormField` + `Input`/`PasswordInput`/`Select`/..., `Card`, `EmptyState`, `toast`, `confirm`, ...
- Missing a component: add it to `ui/` (own component if simple, an Ant Design wrapper if complex), export it from `ui/index.js`, test it in `tests/unit/ui/`, add it to the README table.
- ui components are app-agnostic (props in, callbacks out; no API calls, routes or feature hooks). App-specific pieces built from them: the app's frame in `components/layout/` (AppLayout, Sidebar, AuthContainer, PageHeader), other shared pieces directly in `components/`, parts used by one page in that page's own `components/`.
- Variants via props (`variant`, `size`, `tone`); a page's `className` on a ui component is for layout only, never colours or shapes.

## Theme and CSS (details in README "Theme" and "Styling")

- Tokens in `styles/theme.css`: brand palette (`--brand-*`) + semantic tokens (`--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, ...). Light on `:root`, dark on `:root[data-theme='dark']`. Components use semantic tokens only, never `--brand-*` or typed colours; a new colour token needs a light and a dark value.
- The theme is `data-theme` on `<html>`: set before paint by `index.html`, then by `ThemeProvider` / `useTheme()`. Ant Design follows through `UiProvider`. SVG icons use `currentColor`.
- CSS Modules only: `X.module.css` next to `X.jsx`, `import styles from './X.module.css'`, `className={styles.name}`. The only global CSS is `styles/base.css` and `styles/theme.css`; never add another plain `.css` file or global class.
- Shared looks: a ui component, a layout component or an app component in `components/` first, otherwise a shared module in `styles/`.
- camelCase class names; flat selectors (one class, or a state class plus one child); no IDs, no `!important`; no inline `style` except runtime values; logical properties (`inline-start`/`inline-end`).
- Responsive (README "Responsive design"): only the breakpoints 480 / 768 / 1024px as `max-width` queries in the component's module; heading sizes from the fluid tokens; body text never below 16px; no fixed widths without `max-width: 100%`; `100dvh` after a `100vh` fallback; sizes of controls from `--control-height-*` (they grow on touch screens). Check new screens at 360px, 768px and desktop in both themes.
- Spacing, sizes, radius, shadows and durations from tokens too. Combine classes with `clsx`; never use `composes` (it makes every build print a PostCSS warning). Classes that set the same property belong in one module, so their order is fixed. Ant Design's own classes only via `:global(.ant-...)` inside its ui wrapper.

## Motion and states (details in README "Motion and states")

- Every interactive element has hover, `:active`, `:focus-visible` and disabled states (and loading when it starts work); new ui components too.
- Durations and easings only from tokens (`--duration-fast/base/slow`, `--easing`, `--easing-out`); entry animations from `styles/motion.module.css` (`fadeIn`, `fadeUp`, `popIn`).
- Never position an interactive element with `transform` (e.g. centring with `translateY(-50%)`): its pressed state sets its own `transform`, the element jumps while pressed and the click is lost. Centre with layout instead (`inset-block: 0; margin-block: auto`, flex or grid).
- Animate only `transform`, `opacity` and colours; keep motion short and subtle; no looping animation except loading. Reduced motion is handled globally in `base.css`; never let an animation carry information.
- Spinners wait `--loader-delay`; prefer `Skeleton` when the content's shape is known.

## Tests

- Every change comes with tests; never skip, delete or loosen tests to make them pass.
- Fake the server with MSW: default routes in `tests/mocks/handlers.js`, per test with `server.use(...)`. Always answer with `success()` / `failure()` from `tests/mocks/responses.js` so responses match the server's contract (and carry its CORS headers).
- Page tests: `renderApp({ route })` and `loggedIn()` from `tests/helpers/renderApp.jsx`; find elements by role and accessible name, as a user would.
- `tests/unit/` for modules, `tests/integration/` for the whole app.
