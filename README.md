# SSM Leather Atelier

A luxury leather house — Brooklyn-cut jackets, vests and trousers, hand-numbered.
This repo is the public site: a static React prototype with a Made-to-Order
configurator, a journal, a lookbook, and the rest of the house.

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

This is a static site. `vercel.json` handles caching headers and the JSX
content-type so Vercel serves the app correctly. To deploy:

```bash
vercel --prod
```

## Stack

* React 18 (UMD)
* Babel-standalone for in-browser JSX (no build step)
* Cormorant Garamond + Inter + JetBrains Mono
* CSS variables for the dark / light / heritage palettes

When the site graduates to production, port the JSX into a Vite + React
toolchain (see `SSM_AUDIT_AND_BUILD_PLAN.md` for the full migration plan).

## Brand voice

Concrete over abstract. Italicized second clause. Roman section markers,
mono caption labels. Every product piece is signed by the maker who cut it.
