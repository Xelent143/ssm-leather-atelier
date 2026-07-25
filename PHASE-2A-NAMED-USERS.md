# MOTOGRIP Admin — Phase 2A Named Users

## Scope

Phase 2A adds the first named Owner identity, email/password login, user-status enforcement, session identity, and password-reset/invitation token foundations. It preserves the Phase 1 `ADMIN_PASSWORD` compatibility login and does not implement roles, permissions, approvals, MFA enforcement, staff invitations, production email delivery, or legacy cutover.

## Persistence architecture

Phase 2A uses a transitional structured store:

```text
ADMIN_DATA_DIR/admin-identities.json
```

The file uses restrictive permissions and atomic replacement. Owner bootstrap uses an exclusive `admin-identities.bootstrap.lock` so concurrent requests cannot create two Owners.

This is not the long-term identity database. MySQL + Drizzle remains the approved direction. JSON was selected only because no isolated staging MySQL database is configured or authorized in this subphase. It is suitable for one staging/application instance, not concurrent replicas.

## Named-user data model

The Owner record includes:

- Immutable UUID
- Normalized unique email
- Display name
- Status
- Argon2id password hash
- Email/bootstrap verification timestamps
- Failed-login count and lockout expiry
- Last-login timestamp
- Creator and lifecycle timestamps
- Disabled timestamp
- Password-changed timestamp
- Session-revocation version
- MFA, locale, timezone, recovery-method and future-role extension points

Supported statuses:

```text
invited
active
suspended
disabled
recovery_hold
```

Only `active` users may complete ordinary named login.

## Password security

- Argon2id through `@node-rs/argon2`
- Minimum 19 MiB memory, two iterations, parallelism one
- Per-password random salt inside the encoded Argon2id hash
- Minimum 15 and maximum 128 Unicode characters
- Spaces and passphrases supported
- No arbitrary character-class rules
- Predictable company/account-based passwords rejected
- Encoded parameters are inspected so weaker hashes can be upgraded after a successful future login
- Plaintext passwords and password hashes are never logged
- The legacy `ADMIN_PASSWORD` is never copied into the named Owner record

## Owner bootstrap flow

1. Sign in through the existing legacy compatibility login.
2. The session must be a recently created `legacy_owner` session.
3. If no named Owner exists, the admin shows the one-time bootstrap screen.
4. Enter Owner email, display name and a new unique passphrase.
5. The server obtains an exclusive bootstrap lock and rechecks the identity store.
6. Exactly one active named Owner is created.
7. Bootstrap audit and high-severity security events are recorded.
8. The legacy login remains enabled.
9. The Owner logs out and verifies the new named login separately.

Bootstrap is rejected for unauthenticated, named-user, stale legacy or duplicate requests.

## Named login flow

```text
Email + password
→ IP rate limit
→ normalized email lookup
→ constant-work password verification
→ account lockout/status check
→ update last login
→ create Phase 1-compatible server session
```

Named sessions contain `actorType=named_user`, user ID, session-revocation version and `authMethod=email_password`. Legacy sessions contain `actorType=legacy_owner` and `authMethod=legacy_password`.

Responses do not reveal whether an email exists or which credential/account condition failed.

## Compatibility mode

The existing `/api/admin/login` and `ADMIN_PASSWORD` behavior remain available. A legacy session cannot create another Owner after bootstrap. Every successful legacy login after a named Owner exists creates a high-severity security event.

The admin displays:

> Legacy compatibility login is still enabled and must be removed only after later security phases and explicit Owner approval.

## Password reset and invitation foundation

Reset and invitation tokens:

- Are random 256-bit values
- Are stored only as SHA-256 hashes
- Revoke older active tokens of the same type
- Expire
- Are single-use
- Can be explicitly revoked

Reset tokens expire after 30 minutes. Invitation tokens expire after 48 hours.

No live email provider is connected in Phase 2A. The forgot-password endpoint always returns a generic accepted response and never logs or returns the raw token. A staging-safe email-delivery integration is required before password reset is usable outside automated tests.

## APIs

```text
GET  /api/admin/bootstrap/status
POST /api/admin/bootstrap/owner
POST /api/admin/auth/named-login
GET  /api/admin/auth/session
POST /api/admin/auth/logout
POST /api/admin/auth/password/forgot
POST /api/admin/auth/password/reset
GET  /api/admin/me
```

Existing compatibility APIs remain:

```text
GET  /api/admin/session
POST /api/admin/login
POST /api/admin/logout
```

Authenticated mutations require valid origin, session and CSRF token. Unauthenticated authentication/reset mutations receive origin checks and operation-specific rate limits.

## Runtime files

Under `/app/data` when `ADMIN_DATA_DIR=/app/data`:

```text
admin-identities.json
admin-identities.json.<pid>.<random>.tmp
admin-identities.bootstrap.lock
admin-security.json
admin-security-events.ndjson
admin-audit.ndjson
admin-store.json
```

The temporary identity file is atomically renamed. The bootstrap lock normally exists only during Owner creation.

## Environment variables

Required:

```text
ADMIN_PASSWORD=<existing staging-only compatibility secret>
ADMIN_DATA_DIR=/app/data
NODE_ENV=production
```

Staging:

```text
DISABLE_INDEXING=true
PUBLIC_BASE_URL=https://<staging-domain>
```

Do not configure production payment credentials in Phase 2A staging.

## Local tests

```sh
pnpm install
pnpm run check
pnpm test
```

Use a temporary `ADMIN_DATA_DIR`. Never run authentication tests against a production volume.

## Isolated Railway staging

1. Use only the separate staging project/service.
2. Source this Phase 2A feature branch after explicit commit/push approval.
3. Attach a new empty staging volume at `/app/data`.
4. Do not copy production users, sessions, audit events, customers or orders.
5. Set a staging-only `ADMIN_PASSWORD`.
6. Set `ADMIN_DATA_DIR=/app/data`, `NODE_ENV=production` and `DISABLE_INDEXING=true`.
7. Do not set Stripe or PayPal production credentials.
8. Confirm the service installs the Argon2 native package successfully.
9. Verify legacy login before bootstrap.
10. Create the named Owner using a staging email and new passphrase.
11. Log out and verify named login.
12. Confirm legacy login still works and creates the compatibility warning/security event.
13. Restart staging and verify named login, sessions and the Owner record persist.
14. Verify protected storefront and payment behavior without executing a payment.

## Security assumptions and limitations

- One application instance only; JSON writes are not a multi-replica transactional identity store.
- Named-user rate-limit memory resets after restart; named-account lockout is durable.
- Phase 2A has one named Owner and no staff invitation UI.
- MFA fields are preparatory only; MFA is not enforced.
- No role or permission enforcement has been added.
- Reset email delivery is not connected.
- A crash that leaves the bootstrap lock requires manual staging investigation; automatic lock deletion is intentionally avoided.
- The legacy password remains a valid compatibility credential by requirement.

## Rollback

1. Stop or remove only the Phase 2A staging deployment.
2. Return staging source to Phase 1 commit `82f80bd8d33faead445bd7b26da683283827fc60`.
3. Preserve `admin-audit.ndjson` and `admin-security-events.ndjson`.
4. Archive `admin-identities.json` securely for investigation; do not delete it without approval.
5. Confirm the existing staging-only `ADMIN_PASSWORD` login works.
6. Revoke any Phase 2A named sessions if the application is restored temporarily.
7. Do not change production or its volume.

## Phase 2B prerequisites

Before roles and permissions:

- Approve and provision isolated MySQL staging
- Define Drizzle migration and rollback discipline
- Migrate the named Owner without changing its identity
- Add roles, permissions, role-permissions and user-roles tables
- Define deny-by-default server middleware
- Retest session-revocation behavior after role changes
- Obtain explicit Phase 2B implementation authorization
