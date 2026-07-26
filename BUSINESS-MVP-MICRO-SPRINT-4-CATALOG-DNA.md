# Business MVP Micro Sprint 4 — Catalog Review and Product DNA Linking

## Purpose

This package adds an Owner-controlled relationship between the read-only website Catalog projection and existing Product DNA identities. It does not edit website products, create Product DNA records, publish listings, or bypass PLM governance.

## Runtime data

`ADMIN_DATA_DIR/catalog-product-dna-links.json` stores:

- one-to-one Catalog-to-Product-DNA links;
- ignored Catalog identities;
- rejected suggestions;
- append-only link audit events;
- the optimistic-concurrency store revision.

The file is written atomically with mode `0600`, is excluded from Git, and should reside under `/app/data` on Railway.

## Matching order

1. Existing legacy or website identifier
2. Exact SKU
3. Case-insensitive SKU
4. Existing marketplace identity
5. Strong normalized title similarity

Every suggestion requires explicit Named Owner confirmation. Title similarity is never trusted automatically.

## Authorization

Link, unlink, ignore, and suggestion-rejection actions require:

- an authenticated active Named Owner;
- a valid same-origin request;
- the current CSRF token;
- the current link-store revision.

Legacy compatibility sessions remain read-only for this workflow.

## Governance boundary

Catalog linking establishes identity only. Listing Studio still requires:

- Product Version;
- Owner Approval;
- approved or active Product Release;
- valid Knowledge Lock.

## Rollback

1. Stop the application.
2. Restore the prior application commit.
3. Preserve `catalog-product-dna-links.json` for audit and possible forward recovery, or move it to a restricted backup location.
4. Restart the prior application.

The earlier Catalog sync store remains compatible because this package does not change `catalog-sync.json` schema or website product records.
