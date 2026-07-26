# Business MVP Micro Sprint 8 — Operational Launch

## Scope

This package introduces staging-ready daily listing operations while preserving the
existing React 18 storefront, plain Node.js server, JSON persistence, Product PLM
governance, Product Identity, Catalog links, checkout, Stripe, and PayPal behavior.

No production deployment, marketplace publishing, image generation, or production
data migration is included.

## Runtime data

The following runtime files belong under `ADMIN_DATA_DIR` (Railway staging:
`/app/data`) and are excluded from Git:

- `admin-identities.json` — named Owner and Listing Editor identities; password
  hashes never leave this store.
- `operational-launch.json` — workflow revisions, publication records,
  idempotency keys, and safe mutation audit events.
- `listing-studio.json` — immutable listing input and generated draft versions.
- `catalog-sync.json` and `catalog-product-dna-links.json` — dashboard projections
  and Product DNA links.
- Existing PLM, Product Identity, session, security, and audit stores.

## Authorization

- Named Owner: manages Listing Editors, approves, requests changes, publishes,
  retries, exports, and revokes sessions.
- Listing Editor: edits factual listing inputs and drafts, runs Copy Intelligence,
  compares versions, and submits for review.
- Listing Editor cannot approve, publish, export approved packages, mutate Product
  DNA, Catalog links, Product Identity, Product Releases, Knowledge Locks, users,
  or the legacy Product Manager store.
- Codex: no public route. The local service contract requires explicit product
  identity, expected operational and website revisions, idempotency, existing
  Owner approval, and an internal authorization flag.

## Publishing and synchronization

`WebsiteWriteAdapter` is the only new website publishing boundary. It:

1. Resolves the stable website product identity.
2. Verifies the expected website revision.
3. Validates the allowlisted product fields.
4. Rejects duplicate handles.
5. Writes a complete product override atomically with mode `0600`.
6. Refreshes the Catalog projection.
7. emits a same-origin Server-Sent Event for open admin screens.
8. records publication and audit results without full product payloads or secrets.

Website content uses the existing `admin-store.json` runtime override behavior. The
repository seed `merchant-catalog.json` is never changed.

## Conflict and retry behavior

- Operational and website records use independent expected revisions.
- Stale writes return `409`; no automatic merge occurs.
- Publication requires an idempotency key.
- Repeating an accepted idempotency key does not create another publication or
  website product.
- Failed validation or revision checks preserve the approved draft.

## Local verification

```sh
node --check operational-launch-store.js
node --check operational-launch-service.js
node --check website-write-adapter.js
node --test test/*.test.js
```

Browser QA must use disposable `ADMIN_DATA_DIR` data and must never reuse staging
or production credentials.

## Known limitations

- One application replica remains required for JSON mutation serialization.
- Media uploads are not added; existing image metadata is preserved when supported.
- Unpublish is intentionally deferred until the current storefront status semantics
  and checkout behavior receive a separate acceptance test.
- Retry uses the same approved draft but requires a fresh expected revision and
  idempotency key after a failed, non-accepted attempt.
- SSE has browser-native reconnection; short polling is not separately implemented.
- The UI keeps the internal historical `shopify` content key for backward-compatible
  draft storage while presenting it as the primary Website tab.
