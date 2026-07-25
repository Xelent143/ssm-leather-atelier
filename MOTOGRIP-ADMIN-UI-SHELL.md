# MOTOGRIP OS Admin UI Shell

## Scope

This branch introduces only the authenticated MOTOGRIP OS information-architecture shell. It does not add commerce, marketing, AI, factory, financial, team, publishing, payment, or external integration logic.

The Phase 1 security foundation and Phase 2A named-owner authentication remain unchanged. The current product manager remains available at `/admin/products/current` with its existing store read/write behavior.

## Navigation

- Workspace: Dashboard, My Work, Approvals, Activity
- Commerce: Products, Categories, Collections, Inventory, Orders, Customers, Reviews, Coupons
- Growth: Marketing Center, Social Media, SEO Center, Google Merchant, Email Marketing, Wholesale CRM
- AI Studio: AI Product Studio, Media Library, AI Settings
- Operations: Factory Management, Production Tracking, Team Management
- Insights: Reports & Analytics, Financial Overview
- Configuration: Website Settings, System Settings

Every route is a client-side admin route served beneath `/admin`. Browser back and forward navigation are supported. Direct requests continue to use the existing server fallback to `admin.html`.

## Status language

- **Active**: a current foundation is operational.
- **Existing**: a pre-shell workflow remains available.
- **Planned**: information architecture only.
- **Coming Soon**: visible interface preview with no working action.
- **Restricted**: requires future permission and data boundaries.
- **Demo**: illustrative values only, never represented as live business data.

All future actions are disabled. The shell contains no new API calls for planned modules.

## Existing product workflow

`/admin/products` is a read-only overview of compatible store product records. “Open Current Product Manager” leads to `/admin/products/current`, where the prior product editor is preserved. This separation prevents future-shell controls from being mistaken for operational catalog features.

## Responsive and accessibility behavior

- Desktop: persistent, collapsible grouped sidebar.
- Tablet/mobile: off-canvas navigation opened from the top bar.
- Mobile: stacked cards, actions, filters, and workflow stages.
- Semantic navigation, labels, current-page state, keyboard focus styles, disabled-action states, and screen-reader text are included.
- The local sidebar preference is the only browser-stored UI preference; no session token is exposed to JavaScript.

## Verification

Run with Node.js 20 or newer:

```sh
npm run check
npm test
```

For a local smoke test, provide a non-production `ADMIN_PASSWORD`, use a temporary `DATA_DIR`, start the server, sign in at `/admin`, and verify:

1. Dashboard renders after authentication.
2. All navigation groups and routes open without a full-page error.
3. Planned actions remain disabled and labelled.
4. The Current Product Manager loads at `/admin/products/current`.
5. Logout returns to the login view and revokes the session.
6. Desktop, tablet, and mobile widths remain usable.

## Known limitations

- Search is a lightweight current-product filter, not a global search service.
- Notification, approval, quick-create, reporting, AI, social, marketing, factory, financial, and publishing controls are intentionally non-operational.
- Demo dashboard values are explicitly labelled.
- Role-aware navigation awaits the approved Phase 2B authorization model.
- This branch has no production deployment or Railway configuration changes.

## Future implementation boundary

Each module must receive an approved data model, permissions, audit events, service/API contract, validation, tests, and rollout plan before its disabled shell actions are activated. Payment execution, production customer/order data, and publishing integrations must be treated as separately approved scopes.
