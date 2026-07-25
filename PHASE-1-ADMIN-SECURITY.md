# MOTOGRIP Admin Security — Phase 1

## Scope and changes

This phase hardens the existing single-owner `/admin` implementation without changing the storefront, catalog, checkout, payment providers, feeds, product URLs, or `data/admin-store.json` schema.

- Removed the hard-coded fallback password. Admin login fails closed with a safe configuration message when `ADMIN_PASSWORD` is absent.
- Retained server-side sessions and made them durable in `data/admin-security.json`. Only SHA-256 hashes of random session tokens are stored.
- Added session rotation at login, 12-hour expiry, immediate logout revocation, and `HttpOnly`, `SameSite=Lax`, `Path=/`, expiration-bearing cookies. Cookies are `Secure` in production or behind HTTPS.
- Added server-side per-IP login throttling (20 attempts per five minutes) and a 15-minute owner lockout after five consecutive failures.
- Added same-origin validation and session-bound CSRF tokens for authenticated admin mutations.
- Added append-only, structured audit events in `data/admin-audit.ndjson` for login success/failure, lockout, logout, CSRF rejection, and admin-store updates.
- Preserved the existing admin design, endpoint paths, single-owner workflow, and visible logout button.

Runtime security files are created in the same `data` directory as `admin-store.json`. With the Railway volume mounted at `/app/data` and the application rooted at `/app`, these records persist on that volume.

Exact staging runtime paths when `ADMIN_DATA_DIR=/app/data`:

- `/app/data/admin-store.json`: existing compatible admin product/order store; created from the existing default structure only if absent.
- `/app/data/admin-security.json`: durable hashed sessions and the single-owner lockout record.
- `/app/data/admin-audit.ndjson`: append-only security audit events.
- `/app/data/admin-security.json.<pid>.<random>.tmp`: transient atomic-write file, immediately renamed to `admin-security.json`.
- `/app/data/admin-store.json.<pid>.tmp`: existing transient atomic-write file, immediately renamed to `admin-store.json`.

There are no separate session or lockout files in Phase 1; both are contained in `admin-security.json`.

## Environment variables

Required:

- `ADMIN_PASSWORD`: strong, unique owner password. There is no fallback.

Optional:

- `NODE_ENV=production`: forces the session cookie `Secure` attribute. Railway production should set this.
- `ADMIN_DATA_DIR`: test/local override for the runtime data directory. Do not set this on Railway unless it remains inside the persistent `/app/data` mount.
- `DISABLE_INDEXING=true`: emits `X-Robots-Tag: noindex, nofollow, noarchive` and a `robots.txt` that disallows all crawling. Required for staging only.

Existing variable names remain unchanged: `PORT`, `HOST`, `PUBLIC_BASE_URL`, `ASSET_CDN_BASE`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_API_BASE`.

Never place secret values in source, logs, screenshots, documentation, or Git history.

## Local test steps

```sh
npm test
npm run check
ADMIN_PASSWORD='use-a-local-secret' PORT=5173 NODE_ENV=development npm start
```

Open `http://localhost:5173/admin`, sign in, reload the page, save a harmless non-production test change only when using copied test data, and log out. Confirm that the old cookie cannot access `/api/admin/store`.

## Railway staging test steps

1. Create or use an isolated Railway staging service sourced from `feature/motogrip-admin-security-phase-1`; do not change the production service or its `main` deployment source.
2. Attach a separate staging volume at `/app/data`. Seed it only with approved non-production copies.
3. Add a staging-only `ADMIN_PASSWORD` as a masked variable. Set `NODE_ENV=production`, `ADMIN_DATA_DIR=/app/data`, and `DISABLE_INDEXING=true`. Confirm all existing required variable **names** are present without exposing values.
4. Deploy the branch to staging only.
5. Verify `/admin` reports a safe configuration error when `ADMIN_PASSWORD` is intentionally absent, then restore the masked variable.
6. Verify valid/invalid login, refresh persistence, cookie flags in browser developer tools, lockout, CSRF rejection, logout, and revoked-cookie rejection.
7. Confirm `admin-security.json` and `admin-audit.ndjson` persist after a staging restart, contain no raw tokens/passwords, and are stored on `/app/data`.
8. Smoke-test public routes and compare Stripe/PayPal endpoint behavior without completing a live payment.
9. Do not merge or point production at this branch until staging evidence is reviewed and approved.

## Security assumptions and known limitations

- Phase 1 intentionally retains a single shared owner credential. It does not add named users, MFA, password reset, or RBAC enforcement.
- The lockout is global to the single owner after five failed attempts. This slows password guessing but can temporarily deny administrator access.
- Durable JSON state is appropriate for one Railway application instance. Multiple concurrent instances would require a transactional shared session/rate-limit store.
- Origin checks accept requests with no `Origin` header for non-browser compatibility; authenticated mutations still require the unpredictable session-bound CSRF token.
- IP addresses are masked to IPv4 `/24` or IPv6 `/64` in audit records. A one-way full-IP hash is used internally for throttling and is not logged.
- Audit files are append-only at the application layer but do not yet have rotation, export, alerting, or tamper-evident signing.
- Railway must terminate HTTPS correctly and retain the `/app/data` volume. Verify both in staging.

## Rollback

1. Stop or remove the staging deployment of this feature branch.
2. Point staging back to the previously approved commit. Do not alter production.
3. Preserve `admin-audit.ndjson` for review. The new `admin-security.json` can be archived and removed from staging only after explicit approval; removing it revokes all sessions.
4. Restore the local `data/admin-store.json` backup only if checksum comparison shows a test changed it. `merchant-catalog.json` is not written by this implementation.
5. The source rollback is the branch base commit `51879767a8eb76458cb61c685822e71193c87dda`.

## Phase 2 recommendation: named users, roles, and permissions

Keep an authentication-provider boundary with this proposed schema:

- `users`: `id`, `email`, `displayName`, `passwordHash`, `status`, `mfaState`, `createdAt`, `updatedAt`, `lastLoginAt`
- `roles`: `id`, `name`, `description`
- `permissions`: stable keys such as `catalog:read`, `catalog:write`, `orders:read`, `orders:write`, `settings:write`, `audit:read`
- `userRoles`: `userId`, `roleId`
- `rolePermissions`: `roleId`, `permissionId`
- `sessions`: hashed token, `userId`, expiry, revocation, device metadata

Recommended Phase 2 sequence: choose a transactional identity store, use Argon2id password hashing, migrate the owner to a named account, add MFA and recovery controls, enforce permissions per endpoint, add user/session management, then retire the single-owner provider only after parallel staging tests and an approved rollback checkpoint.
