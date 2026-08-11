# Audit Report — Mini ERP + CRM Operations Portal

Scope: full read of every backend/frontend file, a real `tsc`/`vite build` run against the actual PDF requirements, and a real backend boot against a local PostgreSQL instance. Not just a lint pass.

## Verdict

**Backend logic: strong.** The challan-confirm transaction (pre-flight check → atomic counter → row-locked re-check → snapshot → deduct) is correctly implemented and matches the PDF's hardest requirement. RBAC, validation, and the customer/product modules are solid.

**Frontend: was largely non-functional as shipped.** The entry point never rendered the app at all, and there was no UI for adding/editing anything or creating a challan — only read-only lists. This has been built out (see below); it's the reason this took real engineering time rather than a quick lint-and-fix pass.

## Critical (app did not work) — fixed

1. **Frontend never rendered.** `index.html` loaded the default Vite vanilla-JS template (`main.ts`), not `App.tsx` — opening the app showed the Vite starter page, not the login screen. Rewired to a proper `main.tsx` → `ReactDOM.createRoot`.
2. **No UI existed to create, confirm, or cancel a challan** — the single most-weighted module in the assignment. Only a read-only list existed. Built a full create form (customer + multi-product selector with live stock/price awareness), a detail view, and confirm/cancel actions.
3. **No add/edit/search UI for customers or products**, despite being explicitly required features. Built modal forms for both, plus a customer detail view with an append-only follow-up-notes log.
4. **Backend didn't compile** (`npm run build`): zod v4 no longer exports `AnyZodObject` (used in `validate.ts`); Express 5's stricter query/param types (`string | string[]`) weren't cast in `challans.ts`, `customers.ts`, `products.ts`. Fixed; `tsc --noEmit` is now clean.
5. **Frontend didn't compile**: `tsconfig.json` had no `"jsx"` option at all — any `.tsx` file failed with `TS17004`. This predates my changes; every page file would have hit it. Fixed.
6. **Tailwind v4 was installed, configured with v3 syntax** (`@tailwind` directives, `tailwindcss` as the direct PostCSS plugin) — would have produced a completely unstyled app. Migrated `postcss.config.js` and `index.css` to v4's syntax, installed `@tailwindcss/postcss`.
7. **All 4 frontend API calls hardcoded `http://localhost:4000`** — would break immediately once frontend and backend are deployed to different hosts. Replaced with a centralized `api.ts` client reading `VITE_API_URL`.
8. **No `.gitignore` anywhere** — pushing as-is would have committed `node_modules` (hundreds of MB) and `.env` (real JWT secret + DB credentials). Added.
9. **`.env.example` didn't exist**, but the README instructed `cp .env.example .env` — first-time setup as documented would fail immediately. Created both `backend/.env.example` and `frontend/.env.example`.
10. **Server crashed on startup on a fresh Linux host.** The committed `node_modules/.prisma/client` only had a Windows query-engine binary — confirmed by actually starting the server against a real local Postgres, which crashed the instant `PrismaClient` was constructed. Added explicit `binaryTargets` (`native`, `debian-openssl-3.0.x`, `linux-musl-openssl-3.0.x`) to `schema.prisma` so a fresh `npm install` on any deploy target generates the right engine. (`node_modules` is gitignored now regardless, so this was never going to reach GitHub — but it confirms the code had literally never been run outside the developer's Windows machine.)
11. **`dotenv.config()` ran after the route imports that read `process.env.JWT_SECRET`** — confirmed empirically (adding a required-secret guard immediately started throwing on boot). `JWT_SECRET` from `.env` was silently never actually applied; the original hardcoded fallback was the only secret ever in effect, even in "correctly configured" local dev. Fixed by preloading dotenv (`tsx -r dotenv/config`) rather than relying on import order.

## High (security / correctness) — fixed

12. **JWT signing had a silent hardcoded fallback secret**, no production guard — anyone could forge a valid token for any role if `JWT_SECRET` wasn't set on the host. Now throws on startup instead.
13. **No rate limiting on `/api/auth/login`** — unlimited brute-force attempts. Added (10 attempts / 15 min / IP).
14. **`followUpDate` existed in the Prisma schema (a named PDF requirement) but was missing from the Zod write-schema** — it could be read but never actually set through the API, since Zod strips unknown keys by default. Fixed.
15. **Low-stock filter was applied after pagination**, and the `total` count ignored it — both the page contents and the reported total were wrong whenever `lowStock=true`. Fixed by filtering before paginating.
16. **No Prisma error-code mapping** — a duplicate SKU/email or bad foreign key surfaced as a raw 500 with an internal error string, not the "proper HTTP status codes / clear error messages" the PDF asks for. Added mapping for unique-constraint, FK, and not-found errors → 400/404.
17. **Dockerfile copied `package.json` and ran `npm ci` before copying `prisma/schema.prisma`** — Prisma's install-time auto-generate would run before the schema existed in the build context. Fixed the copy order.
18. **`react`/`react-dom` weren't declared in `frontend/package.json`** — present only as transitively-installed peers of `react-router-dom`. Declared explicitly, along with `@types/react`, `@types/react-dom`, and `@vitejs/plugin-react` (also previously missing — no `vite.config.ts` existed at all).

## Medium / documentation — fixed

19. **README instructed `npm run prisma:seed`**, a script that doesn't exist (only a `prisma.seed` config key does) — first-time setup as documented would fail. Corrected to `npx prisma db seed` in both `README.md` and `DEPLOYMENT.md`.
20. Seed script only created the 4 users — a fresh install had nothing to click through or screenshot. Added 5 sample products (including two intentionally under their low-stock threshold) and 3 sample customers.
21. `DEPLOYMENT.md` never mentioned setting `VITE_API_URL` on the frontend host — now that the URL isn't hardcoded, this step is required, not optional. Added.

## What I could not verify directly

My sandbox's network is restricted (no access to `binaries.prisma.sh`, Prisma's engine CDN), so I could not run a full live request against Postgres end-to-end, and I have no browser available to generate real screenshots. I did confirm, against a real local PostgreSQL instance:
- the server correctly loads `JWT_SECRET` and boots (after the dotenv fix)
- the schema, migrations-equivalent (`db push` shape), and TypeScript types are internally consistent
- both `npm run build` commands (backend `tsc`, frontend `tsc && vite build`) succeed for real, not just superficially

I was not able to personally click through the challan-confirm flow against a running instance. Given the logic review (transaction structure, row locking, snapshot writes) I'm confident in it, but **you or Antigravity should do one real end-to-end run** — create a draft challan, confirm it, and check stock actually decrements correctly — before submitting. `scripts/take-screenshots.mjs` doubles as a smoke test for this, since it clicks through the real UI.
