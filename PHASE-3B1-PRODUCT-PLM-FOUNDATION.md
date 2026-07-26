# MOTOGRIP OS Phase 3B.1 — Product & PLM Identity Foundation

## Scope

Phase 3B.1 adds a backward-compatible Product/PLM sidecar for durable product identity. It does not replace or modify the current Product Manager, storefront catalog, product URLs, checkout, payment providers, Merchant feeds, inventory, pricing, product hierarchy, versions, releases, approvals, AI, manufacturing or marketplace publishing.

The implementation introduces:

- Versioned JSON Product/PLM persistence
- Atomic writes and optimistic store revisions
- Stable UUID v4 product identities
- MOTOGRIP GEAR brand identity
- MOTOGRIP GEAR LLC legal ownership
- Source-specific legacy mappings
- Read-only migration previews
- Explicit Named Owner migration apply
- Append-only Product/PLM audit events
- Read-only Product DNA
- Reserved Product Brain extension references

## Runtime files

Under `ADMIN_DATA_DIR`:

```text
product-plm.json
product-audit.ndjson
```

Temporary atomic-write files use:

```text
product-plm.json.<pid>.<random>.tmp
```

These files must be placed on persistent storage before durable staging or production PLM use. They are excluded from Git.

## Existing data remains authoritative

Phase 3B.1 does not change:

- `data/admin-store.json`
- `merchant-catalog.json`
- `readPublicStore()`
- `/api/catalog`
- `/api/admin/store`
- `/admin/products/current`
- Product pages
- Sitemap
- Google Merchant feed
- Meta catalog feed
- Stripe
- PayPal

The PLM sidecar is an identity and lineage foundation only.

## Migration behavior

Migration never runs during server startup.

1. A Named Owner requests a migration preview.
2. The preview reads current admin products and Merchant catalog products.
3. Records are matched using unique SKU, MPN or slug evidence.
4. Existing admin products are marked for the default migration set.
5. Merchant-only products remain preview-only.
6. Conflicts block apply.
7. The source snapshot hash must still match at apply time.
8. A Named Owner explicitly applies the preview.
9. Merchant-only products require both:
   - Their exact legacy IDs in `merchantOnlyLegacyIds`
   - `confirmMerchantOnly: true`
10. Legacy mappings keep the assigned Product UUID stable across future source edits.

The approved repository snapshot currently produces:

- 6 current admin products
- 14 Merchant catalog products
- 6 matching/overlapping Merchant records
- 8 Merchant-only preview records

These repository counts are not claims about production runtime data.

## Identity model

Phase 3B.1 persists:

- Brands
- Legal entities
- Product identities
- Legacy mappings
- Migration previews
- Migration batches

Product families, styles, components, sellable items, versions, releases and configurable approval workflows remain Phase 3B.2+ work.

## Product DNA

Product DNA is a read-only derived response. Phase 3B.1 returns:

- Product UUID
- Brand reference
- Legal entity reference
- Original media references
- Legacy mappings
- Empty future-domain references
- Completeness state
- Unresolved future relationships

Reserved Product Brain references are empty arrays:

- AI Analysis
- Leather Expert Notes
- Manufacturing Notes
- Photography Notes
- SEO Notes
- Marketplace Notes
- QC History
- Customer Issue History
- Marketing Assets
- Video Assets
- Prompt Library
- Brand Knowledge

No behavior, generation, publishing or mutation logic exists for these references.

## API

Authenticated reads:

```text
GET /api/admin/plm/status
GET /api/admin/plm/products/:productUuid/dna
```

Named Owner mutations:

```text
POST /api/admin/plm/migrations/preview
POST /api/admin/plm/migrations/apply
```

All mutations inherit the existing server-side authentication, same-origin and CSRF enforcement. Legacy compatibility sessions cannot create or apply PLM migrations.

## JSON concurrency boundary

The repository layer provides:

- Atomic file replacement
- In-process mutation serialization
- Expected-revision checks
- Corruption fail-closed behavior

The JSON phase supports one application writer/replica. Multiple replicas must not write the same Product/PLM store.

## Security

- Runtime stores use mode `0600`.
- Audit events contain identifiers, field names and hashes—not complete product payloads.
- Passwords, session tokens, CSRF tokens, cookies, payment credentials and customer/order payloads are prohibited.
- IP addresses are privacy-masked.
- Product/PLM mutation errors are safely mapped.
- Named Owner status is checked immediately before migration mutations.

## Test commands

```sh
npm run check
npm test
```

The Phase 3B.1 test suite covers:

- Versioned empty stores
- Atomic writes and revision conflicts
- Corrupt-store failure
- Migration preview classification
- Default admin-product migration
- Merchant-only explicit confirmation
- Source-change rejection
- UUID stability
- Product Brain reference reservation
- Audit redaction
- Authentication
- Named Owner restrictions
- CSRF
- Source-file compatibility

## Rollback

Application rollback:

1. Restore the prior application commit.
2. Do not modify `admin-store.json` or `merchant-catalog.json`.
3. Preserve `product-plm.json` and `product-audit.ndjson` for investigation.
4. The existing Product Manager and storefront continue using their original paths.

Data rollback:

- Before any staging migration apply, back up `product-plm.json` and `product-audit.ndjson`.
- Phase 3B.1 writes only sidecar files.
- Removing the sidecar files removes the Phase 3B.1 identity projection but does not alter existing products, storefront behavior, checkout or feeds.
- Do not remove sidecar files after later phases create dependent entities; use a future compensating migration instead.
