# MOTOGRIP Staging Owner Bootstrap

This startup safeguard applies only to the isolated MOTOGRIP admin staging service.

## Permanent staging login

- URL: `https://devoted-hope-production-8f21.up.railway.app/admin`
- Email: `info@motogripgear.com`
- Password: stored only in the protected Railway staging secret `STAGING_OWNER_PASSWORD`

The password must never be committed, logged, documented, returned through an API, or copied from `ADMIN_PASSWORD`.

## Required staging variables

```text
APP_ENV=staging
STAGING_OWNER_BOOTSTRAP_ENABLED=true
STAGING_EXPECTED_RAILWAY_PROJECT_ID=d5c47465-86d7-4238-91d9-4525ac74f4fa
STAGING_EXPECTED_RAILWAY_SERVICE_ID=59f8b31e-19eb-4119-a4eb-b24fb5e13569
STAGING_OWNER_PASSWORD=<protected staging-only Railway secret>
```

Railway supplies `RAILWAY_PROJECT_ID` and `RAILWAY_SERVICE_ID`. Both runtime values and both expected values must match the hard-coded approved staging identifiers.

## Behavior

At process startup:

1. All staging gates are checked.
2. If any Owner exists, startup continues without changing the Owner.
3. If no Owner exists, the existing identity service creates exactly one active Named Owner using the protected staging password.
4. The existing password policy and Argon2id hashing remain authoritative.
5. Safe bootstrap metadata is committed atomically with the Owner record in the protected identity store.
6. A missing password or bootstrap failure prevents the staging server from starting.

The Named Owner-only diagnostic endpoint is:

```text
GET /admin/system/bootstrap-status
```

It returns only bootstrap enablement, Owner existence, bootstrap version, and last bootstrap time.

## Production isolation

Do not configure any `STAGING_*` variables or `APP_ENV=staging` in production. The approved staging Railway project and service IDs are fixed in code, so the bootstrap cannot run in the production Railway service.

This safeguard supports ephemeral staging, but an isolated staging volume mounted at `/app/data` is still recommended for durable sessions, audits, and other runtime state.
