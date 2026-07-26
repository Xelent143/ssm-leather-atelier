# MOTOGRIP Catalog Sync Foundation

## Scope

Micro Sprint 3 adds a read-only Website → Dashboard catalog projection. It does
not edit website products, publish changes, update inventory, migrate products,
or call an external marketplace.

## Runtime architecture

1. `readPublicStore()` remains the source adapter. It uses the same
   repository-plus-runtime merge already used by the storefront.
2. `catalog-sync-service.js` deduplicates that projection by canonical product
   URL and then SKU.
3. Every imported record receives a deterministic `catalogProductId` based on
   its existing website identity. Repeated syncs therefore do not create a new
   catalog identity.
4. Existing PLM identities are resolved by legacy mapping first and
   case-insensitive SKU second. Missing or ambiguous matches are marked
   `Needs Review`; they are never migrated automatically.
5. `catalog-sync-store.js` saves only the read-only projection and sync
   metadata to `${ADMIN_DATA_DIR}/catalog-sync.json` using atomic writes,
   restrictive file permissions, and revision checks.

## Sync statuses

- `Synced`
- `Needs Review`
- `Missing SKU`
- `Inventory Mismatch`
- `Import Error`

## Security and compatibility boundaries

- Catalog reads require an authenticated admin session.
- Manual sync additionally requires an active Named Owner and existing CSRF
  protection.
- The sync endpoint accepts no product payload.
- No product update, publish, archive, price, inventory, or delete endpoint is
  introduced.
- `merchant-catalog.json`, `data/admin-store.json`, storefront files, checkout,
  Stripe, PayPal, merchant feeds, and existing product URLs remain unchanged.
- `catalog-sync.json` is runtime data and is excluded from Git.

## Future Sync Engine extension points

The current adapter/service/store boundary can later support approved
connectors for Website, AI Studio, Inventory, Listings, Media, and
Marketplaces. Two-way synchronization must be introduced as a separate,
approval-gated phase with conflict policies, idempotency, per-field ownership,
and audit events. This sprint provides no write connector.
