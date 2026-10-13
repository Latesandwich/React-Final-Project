# CinemaGo — Supabase online, separate SQLite locally

The live site uses the separate Supabase project `yehxktdbumrifffobyii` in **Sandwich ORG**. Registration, expiring sessions and bookings persist in Postgres. Existing local SQLite accounts/bookings remain local; they were not copied to the cloud. Register on the live site to demo it.

The small server adapter is `src/lib/backend.ts`; the reviewable schema and atomic booking RPC are in `supabase/schema.sql`. `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are server-only Vercel environment variables. All six tables have RLS enabled and deny browser roles; only the backend can invoke the RPC. The existing bcrypt and session-cookie login flow is retained, rather than using Supabase Auth.

Start with [คู่มืออ่านโค้ดและพรีเซนต์ (Thai)](CODE_GUIDE_TH.md) for the requirement map, numbered key blocks, Server/Client explanations, and manual verification steps.

This version is shared in [Latesandwich/React-Final-Project](https://github.com/Latesandwich/React-Final-Project/tree/feat/local-sqlite-backend), on branch `feat/local-sqlite-backend`, based on `d1449e0` with the reviewed ISR changes adapted from your friend's commits. The original repository's `main` contains separate work and has not been overwritten.

Clone the collaboration version:

```powershell
git clone --branch feat/local-sqlite-backend https://github.com/Latesandwich/React-Final-Project.git
cd React-Final-Project
```

Follow the local setup below; Supabase credentials are not needed for local SQLite. Never commit server secrets or database files.

## Run locally

Requires Node.js 22.13 or later (Node's built-in SQLite currently prints an experimental-feature warning on Node 22).

```powershell
npm ci
npm run db:init
npm run dev
```

Open http://localhost:3000 and register a new account. No database provider account, API keys, or paid services are required. The separate database is `data/cinemago.sqlite` inside this repository. Do not delete it if you want to preserve your data.

Optional configuration: copy `.env.example` to `.env.local`. Relative database paths resolve from the repository directory. Set both Supabase variables to use hosted storage; without them the app uses separate SQLite locally. `CINEMAGO_DATA_MODE=mock` enables a read-only demo catalogue. Local SQLite is disabled on Vercel; hosted storage is used there.

## What changed

- Movies and showtimes are seeded once from the original mock catalogue. Existing pre-booked demo seats remain unavailable; demo people, passwords, and ticket records are not imported.
- Registration, accounts, expiring sessions, bookings, and seat reservations persist in SQLite.
- Session cookies contain random tokens; only hashes are stored in the database. Logout revokes the stored session.
- Prices, discounts, film details, and seat availability are checked by the server. Seat reservations use a transaction and a unique seat constraint.
- Ticket history and confirmations require the owner. Unknown booking IDs return 404 instead of fabricated tickets.
- The original mock catalogue remains a labelled fallback when SQLite is unavailable. Account and booking writes fail safely; they never turn into fake successful reservations.
- Payments remain pending: no payment gateway or email service is configured. There is no real payment collection or automatic email delivery.
- The public Vercel Blob credential-seeding endpoint is disabled.
- Legacy `data/users.json` remains in the cloned source for reference but is not read, copied into SQLite, or used for authentication.

## Hosting

The site is deployed at [CinemaGo](https://cinemago-final-project.vercel.app/) in the separate `cinemago-final-project` Vercel project. Supabase in Sandwich ORG supplies persistent online storage. The local SQLite database was not uploaded. The original site, other projects, Windsurf organisation and GitHub remote were not changed. Deployment uses local source based on `d1449e0` with the reviewed ISR changes from `origin/main`; it is not a Git-connected automatic deployment.

Back up the database after stopping the app, or use SQLite's backup API. WAL mode may create `-wal` and `-shm` files while the app is running; do not copy only the main file during active writes.

## Verification

```powershell
npm test
npm run lint
npm run build
```

Tests cover persistence in another process, account uniqueness, session forgery/expiry/revocation, ticket ownership, server-side pricing, duplicate/invalid seats, the eight-seat limit, rollback, disabled-database writes, malformed checkout storage, and contact validation. The checkout storage effect was replaced with an external-store subscription. Images use Next Image. npm audit previously reported five high-severity findings in the existing ESLint toolchain; a forced major-version downgrade was not applied.

Seats are reserved at confirmation. The misleading seat-hold countdown and fake checkout defaults were removed. There is no payment expiry/cancellation workflow yet.

## Final-project checklist evidence

- App Router pages: `/`, `/movies/[id]`, `/booking/[showtimeId]`, `/checkout`, `/confirmation/[bookingId]`, `/my-ticket`, `/login`, and `/register`.
- Intentional ISR: the homepage exports `revalidate = 3600` for an hourly public catalogue refresh. The ISR/AuthProvider changes from your friend's commit `e9c82b6` (merged in `origin/main` at `5f8d83b`) were adapted into the refined UI without replacing the separate SQLite authentication backend. The catalogue now contains nine demo movies and ten screenings; the six added movies are fictional and use illustrative photographs.
- Intentional SSR: movie details and booking still use `src/lib/data.ts` with `connection()` so seat availability is read per request. React `cache()` deduplicates reads within that request. The public layout does not read cookies; `/api/me` supplies private, uncached session information to AuthProvider.
- Mutations: registration/login/logout and booking confirmation use Server Actions with independent server validation and database writes.
- Global client state: `BookingContext.tsx` shares the selected booking between `SeatSelector.tsx` and `CheckoutForm.tsx`. Existing session storage preserves the selection on refresh.
- Validated forms: `/register` and checkout use React Hook Form with Zod resolvers, accessible inline errors, and Server Actions. Contact validation is shared with the database boundary.
- Responsive layouts use Tailwind breakpoints; the header can wrap on narrow screens. Online persistence uses the separate Sandwich Supabase project.

### Why each rendering file is server or client

Paths below are relative to `src/`.

| File | Boundary and reason |
| --- | --- |
| `app/layout.tsx` | Server: reads public catalogue mode and wraps children in AuthProvider and BookingProvider; avoids cookies so homepage ISR works. |
| `app/page.tsx` | Server: reads the movie catalogue without sending database access to the browser. |
| `app/movies/[id]/page.tsx` | Server: reads movie details and showtimes. |
| `app/booking/[showtimeId]/page.tsx` | Server: checks authentication and loads current seats before rendering the selector. |
| `app/checkout/page.tsx` | Server: checks authentication before rendering the interactive form. |
| `app/confirmation/[bookingId]/page.tsx` | Server: reads a booking only for its owner. |
| `app/my-ticket/page.tsx` | Server: reads only the signed-in member's tickets. |
| `app/login/page.tsx` | Client: manages action feedback and the callback URL. |
| `app/register/page.tsx` | Client: runs React Hook Form validation and displays action feedback. |
| `components/Navbar.tsx` | Client: uses usePathname for active navigation and AuthProvider for user details from the uncached /api/me endpoint. |
| `components/BookingContext.tsx` | Client: owns shared state across booking navigation. |
| `components/SeatSelector.tsx` | Client: handles seat clicks and saves the selection. |
| `components/CheckoutForm.tsx` | Client: handles contact validation, discounts, the shared booking draft, and submission feedback. |
| `components/TicketCard.tsx` | Server: presents an owner-checked booking without browser state. |
| `app/not-found.tsx` | Server: presents missing or inaccessible resources. |
