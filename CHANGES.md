# Fix log

## Security
- **JWT secret**: removed the hardcoded fallback (it was public in the README). The server now refuses to start without a strong `JWT_SECRET`, and refuses the old default. Tokens are signed/verified with HS256 pinned (`utils/jwt.js`).
- **Chat**: REST and Socket.IO now verify the user belongs to the conversation (join, send, post, delete). Messages are length/type validated.
- **Mentorship**: only the addressed mentor can accept/decline a request. Requests to non-existent mentors return 404.
- **Jobs**: deleting a job now always checks ownership (previously skipped for users without a profile).
- **Alumni**: public list/detail no longer expose `email` or `userId` (admins still see everything). Query params are coerced to strings (blocks `?batch[$ne]=x`) and search text is regex-escaped. Lists capped at 500.
- **CORS**: the allowlist is now actually enforced for REST and Socket.IO (both branches previously allowed everything).
- **Rate limiting + security headers** (dependency-free): login (per account and per IP), registration, and a general API limit; `nosniff`, `X-Frame-Options`, HSTS in production, `x-powered-by` removed. `TRUST_PROXY` supported for Render/Vercel.
- **Validation**: admin-created users validated with zod (10+ char password); registration passwords are 8-72 chars; `PATCH /api/events/:id` only accepts whitelisted fields.
- **Login** now takes the same time whether or not the email exists.
- **Errors**: Mongoose errors map to 400/409; 500s no longer leak internals in production; invalid JSON returns 400.
- **Logs**: connection strings are redacted before logging (they used to print the full URI including password).
- **Seed**: `seed:admin` requires `ADMIN_SEED_PASSWORD` (10+ chars); no weak default.

## Bugs
- `GET /api/alumni/me` was swallowed by `/:id` (500). Routes reordered; invalid ids return 404.
- Server no longer starts without a database: it exits with a clear message.
- Dashboard shows real counts (no invented fallback numbers); sample values are flagged (`isSampleData`, `X-Data-Source: sample`).
- Donations: atomic `$inc` for fund/alumni totals, unique crypto-random `txId` (unique index), integer amounts up to 10,000,000.
- Chat: thread de-duplication by display name only used when no concrete target id exists.

## Project hygiene
- Added `.gitignore` (`.env`, `node_modules`, `dist`) and a safe `server/.env.example`.
- Cross-platform `dev` script (removed Windows-only `cmd /c`), added `build` script and `engines`.
- Removed leftover single-app files from the repo root (`src/`, `index.html`, `vite.config.js`, `dist/`) and build output folders.
- README: removed published credentials, documented the real security model and env setup.
- Tests: new `tests/security.test.js` (40 tests, no database needed). Existing DB tests now fail loudly instead of silently passing when no database is reachable, and can never run against a non-local database (they delete data).

## Not changed (needs frontend work or a decision)
- Chat message times are stored as display strings ("10:32 AM", "Just now").
- Employment/salary figures on the admin dashboard are still sample data (no source data exists yet).
- Auth token still lives in `sessionStorage` (readable by any XSS).
