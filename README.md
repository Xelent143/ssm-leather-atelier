# MOTOGRIP GEAR

Premium motorcycle leather gear — road-cut jackets, vests and trousers with
made-to-measure fit options. This repo is the public site: a static React
prototype with a product page, made-to-measure cart flow, journal, lookbook,
and brand system.

## What's inside

```
index.html              – self-contained entry (all JSX inlined, opens in any browser)
SSM Leather.html        – mirror of index.html (preserved for the original link)
ssm-data.jsx            – product catalog, leather/hardware/lining, journal, FAQ, SEO
ssm-shell.jsx           – header, footer, cart drawer, search overlay, marquee
ssm-home.jsx            – home page (3 hero variants, category strip, editorial)
ssm-shop.jsx            – PLP with working filter, sort, active pills, empty state
ssm-pdp.jsx             – PDP with per-product stories, fit table, reviews, notify-me
ssm-mto.jsx             – Made-to-Order 6-step configurator
ssm-misc.jsx            – Lookbook, About / Heritage, Account, Checkout
ssm-pages.jsx           – Journal, Care, Repairs, Concierge, Sustainability,
                          Stockists, Press, Gift Cards, FAQ, Size Guide,
                          Shipping, Contact, 404, Search results
ssm-app.jsx             – router + cart state + SEO sync + tweaks panel
tweaks-panel.jsx        – live design tweaks UI shell (palette / hero / type)
assets/generated/       – PNG imagery (hero, products, atelier, tannery, care)
SSM_AUDIT_AND_BUILD_PLAN.md  – full audit + 12-week buildout plan
```

## Run locally

```bash
npm run dev
# → http://127.0.0.1:5173/
```

Or just open `index.html` directly — it's self-contained.

## Deploy

This is a static site. Railway runs `npm start`, which serves `index.html`
and assets through `server.js` on the required `$PORT`.

### Stripe and PayPal Checkout

Payments use Stripe-hosted Checkout or PayPal-hosted approval so payment
credentials never pass through the storefront. Configure these environment
variables in Railway, never in GitHub:

- `STRIPE_SECRET_KEY` — start with a Stripe test-mode secret key, then replace
  it with the live-mode secret key after a successful test order.
- `STRIPE_WEBHOOK_SECRET` — the signing secret for `POST /api/stripe/webhook`.
  Subscribe to `checkout.session.completed` and
  `checkout.session.async_payment_succeeded` in Stripe.
- `PUBLIC_BASE_URL` — set to `https://motogripgear.com` so Stripe returns the
  customer to the production storefront.
- `PAYPAL_CLIENT_ID` — the live REST app client ID from PayPal Developer.
- `PAYPAL_CLIENT_SECRET` — the matching live REST app secret.
- `PAYPAL_API_BASE` — optional; defaults to `https://api-m.paypal.com` for live
  payments. Use `https://api-m.sandbox.paypal.com` only with sandbox credentials.

Checkout prices are rebuilt from `merchant-catalog.json` on the server for both
providers. Values submitted by the browser are treated only as product
selections and are never trusted as payment amounts. Confirmed Stripe and
PayPal payments are saved as orders and appear in the protected `/admin`
Orders panel. Stripe webhooks are the primary confirmation path; the Stripe
success return also performs a server-side confirmation fallback.

```bash
npm start
```

### Admin product database

The admin panel is available at `/admin`. When Railway PostgreSQL is linked to
the web service, expose its connection string as `DATABASE_URL` and set a
strong `ADMIN_PASSWORD`. On the first boot, the server creates the database
tables and imports the current verified catalog from `admin-store.json`.

The Products panel then supports manual product drafts, image uploads (stored
as PostgreSQL binary data), category creation/removal, and direct publishing.
Published products are read from PostgreSQL by the storefront catalog, product
pages, sitemap, and merchant feeds. Keep `ADMIN_DATA_DIR=/app/data` if you
want the existing JSON fallback and non-product admin records to remain
durable on a Railway volume.

Railway CLI deployment:

```bash
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
```

Vercel is still supported. `vercel.json` handles caching headers and the JSX
content-type so Vercel serves the app correctly:

```bash
vercel --prod
```

## Stack

* React 18 (UMD)
* Babel-standalone for in-browser JSX (no build step)
* Cormorant Garamond + Inter + JetBrains Mono
* CSS variables for the light / dark / heritage palettes

When the site graduates to production, port the JSX into a Vite + React
toolchain (see `SSM_AUDIT_AND_BUILD_PLAN.md` for the full migration plan).

## Brand voice

Direct, road-tested, fit-aware, and precise. See
`MOTOGRIP_BRAND_IDENTITY.md` for the full identity, voice, logo, and imagery
prompt system.
