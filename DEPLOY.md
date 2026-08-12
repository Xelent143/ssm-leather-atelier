# Deploy MOTOGRIP GEAR

The repo is already initialized and committed (`main`, commit `9dc0735`). Two
short blocks below: one pushes to GitHub, one deploys to Vercel. Run both from
your Mac Terminal.

## 1. Push to GitHub

### Option A — using the GitHub CLI (`gh`)

If you have the `gh` CLI installed and signed in, this is the one-liner path:

```bash
cd "~/Downloads/leather luxury"
gh repo create ssm-leather-atelier --public --source=. --remote=origin --push
```

That creates the repo on your account, sets `origin`, and pushes `main` in
one go.

If `gh` isn't installed: `brew install gh` then `gh auth login`.

### Option B — manual (any GitHub account)

1. Open <https://github.com/new>, name the repo `ssm-leather-atelier`,
   leave everything else blank (no README, no .gitignore, no license — we
   already have those), and click **Create repository**.
2. GitHub will show a "push an existing repository" block. Use these commands
   from the project folder:

```bash
cd "~/Downloads/leather luxury"
git remote add origin git@github.com:YOUR_USERNAME/ssm-leather-atelier.git
git push -u origin main
```

(or use the `https://...` URL if you prefer HTTPS auth)

## 2. Deploy to Railway

The site is Railway-ready: `npm start` runs `server.js`, which serves the
static app on Railway's `$PORT`.

```bash
cd "~/Downloads/leather luxury"
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
```

If the project is already created in Railway, use `npx @railway/cli link`
instead of `init`, then run `npx @railway/cli up`.

### Add the product database

1. In Railway, add a PostgreSQL service to the same project.
2. Link the web service to PostgreSQL and provide the linked connection string
   as `DATABASE_URL`.
3. Set a strong `ADMIN_PASSWORD`; do not keep the local fallback password in
   production.
4. Keep `ADMIN_DATA_DIR=/app/data` if the existing JSON volume is still used
   for non-product records.
5. Configure the payment variables from `README.md`, including
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, and
   `PAYPAL_CLIENT_SECRET`. In Stripe, point a webhook at
   `https://motogripgear.com/api/stripe/webhook` and subscribe to
   `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`.

The first web boot creates `admin_categories`, `admin_products`, and
`admin_store_state`, then imports the current admin catalog if the product table
is empty. Open `/admin`, create a draft, upload an image, choose a category,
save, and use **Publish now** when the listing is ready. PostgreSQL is the
source of truth for products, categories, publication status, and uploaded
product images.

## 3. Deploy to Vercel

### One-shot deploy (no GitHub needed)

```bash
cd "~/Downloads/leather luxury"
npx vercel --prod --yes
```

The first time, Vercel will ask you to log in (it opens a browser). After
that, every `npx vercel --prod` from this folder ships a new build.

### Or, set up the GitHub-Vercel integration (recommended)

If you push to GitHub first (step 1), then go to <https://vercel.com/new>,
"Import" your `ssm-leather-atelier` repo, click **Deploy**. From then on,
every `git push` redeploys automatically.

This is the long-term setup — no CLI needed for future deploys, preview URLs
on every branch, automatic rollback if you need it.

## What to expect

- **Build time:** about 5–10 seconds. The site is static.
- **First request:** ~250 KB HTML + React/Babel from CDN. Lighthouse will
  flag the in-browser Babel transform; that's expected for a prototype and
  the audit doc has the production migration plan when you're ready.
- **Custom domain:** in the Vercel dashboard under the project's
  **Domains** tab. Add `ssm.example` (or whatever you own), follow the DNS
  instructions, and Vercel handles HTTPS automatically.

## Updating the site

Once it's live, every change is two commands:

```bash
git add -A && git commit -m "tweak: ..."
git push                 # if Vercel-GitHub integration is on
# or:  npx vercel --prod # if you're deploying via CLI
```

## Files Railway/Vercel care about

- `index.html` — the entry point (self-contained, all JSX inlined)
- `server.js` — Railway static file server
- `railway.json` — Railway start command and restart policy
- `vercel.json` — caching headers and the JSX content-type fix
- `assets/generated/*.png` — long-cached, immutable
- `ssm-*.jsx` — the source files (also in the bundle, kept for diffs)

Nothing else needs configuration.
