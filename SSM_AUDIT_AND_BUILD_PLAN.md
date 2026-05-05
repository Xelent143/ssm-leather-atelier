# SSM Leather Atelier — Full Audit, Optimizations & Build Plan

A senior full-stack + design + copy review of the current prototype, with a concrete plan
for the remaining shop, product and inner pages — written so the brand voice and visual
system stay coherent across every page.

---

## 1. Executive summary

What you have today is a **high-fidelity React prototype** of a luxury leather house —
home, shop (PLP), product (PDP), made-to-order configurator, lookbook, about, account
and a checkout. The visual language (Cormorant Garamond display, oxblood + aged brass
accents, vegetable-tanned dark palette, mono caption labels, Roman-numeral section
markers) is already strong and consistent — better than 80% of working luxury sites.

The work to do falls into four buckets, in order of impact:

1. **Production-readiness.** It ships Babel-in-the-browser, has no SEO, no real
   responsiveness, no accessibility, no real cart/checkout backend. It will not survive
   contact with a real customer or Google.
2. **System hardening.** Tokens, components and copy patterns are good but inconsistent
   in a few places. Lock them into a real design system before adding pages.
3. **Page completion.** ~12 inner pages are missing (journal, care, FAQ, repairs,
   contact, gift cards, sustainability, stockists, size guide, policies, 404, search
   results) plus several account sub-tabs. The shop and PDP both need a second pass.
4. **Conversion + storytelling.** Luxury sites convert on trust, story, fit and finish
   — not pop-ups. There are concrete, on-brand patterns to add.

---

## 2. Current state — what is good, what is broken

### 2.1 What's good (do not lose this)

- **Brand identity is intact.** "Atelier · Est. 2014," "N° 047 / 250 · MMXXVI,"
  "Hourwitch — the winter film," numbered Roman section markers — this is the kind of
  detail that reads as old-house, not Shopify-template. Keep it.
- **Typography pairing.** Cormorant Garamond display + Inter body + JetBrains Mono
  for caption-grade text is correct for the segment. The italic accent in "quiet
  rebellion / a small vow" carries the whole hero.
- **Token architecture.** `--bg`, `--fg`, `--accent`, `--accent-2`, `--line` etc. are
  the right primitives. Three palette themes (dark / light / heritage) are
  well-considered.
- **Made-to-Order configurator is a real differentiator.** Six steps, live summary,
  craftsperson narrative, deposit terms — this is the page that justifies the price.
- **Editorial copy is tonally locked.** "Hides that remember." "Every stitch, a small
  vow." "We do not make leather goods. We begin friendships with hides." This voice is
  the moat — keep one writer on it.

### 2.2 What's broken (technical, will block launch)

| # | Issue | Why it matters |
|---|-------|----------------|
| 1 | Babel-standalone compiles JSX in the browser on every load (3 large CDN scripts) | First contentful paint will be 3–6s on 4G; Lighthouse fails |
| 2 | No build step (no Vite, Next, Astro) | No code-splitting, no tree-shake, no SSG |
| 3 | No SEO — `index.html` is a meta-refresh; no `<title>`, `<meta description>`, OG, JSON-LD | Will not rank; will not preview in iMessage/Slack/WhatsApp |
| 4 | All routing is React state (`view`) — no real URLs | No deep-linking, no analytics funnels, no back-button |
| 5 | No image optimization — single PNGs at native size, no `<picture>`, no AVIF/WebP, no `srcset`, no `loading="lazy"` | Hero PNG is the heaviest asset on the page |
| 6 | Inline styles everywhere; only CSS vars are tokenized | Hard to maintain, no hover/focus state coverage |
| 7 | Clickable `<span>`s with `onClick` (header, cart icon, swatches, sizes, filter chips) | Not keyboard-reachable, no focus ring, fails WCAG 2.1 |
| 8 | No `alt` text on product imagery, no `aria-label` on icon-only buttons | Fails screen readers; bad for SEO |
| 9 | Hardcoded 48px desktop padding everywhere; no breakpoints, no mobile hamburger | Site is currently desktop-only |
| 10 | `addToCart` always pushes a new line, never merges same-SKU + size + leather | Cart fills with duplicates; subtotal correct but UX wrong |
| 11 | Filter checkboxes render but don't filter; sort "Featured" / "New" don't sort | Looks built, isn't |
| 12 | Search icon, language switcher, "wishlist," "size guide," "write to maker" are decorative | Same |
| 13 | Cart, wishlist, addresses, fit profile not persisted (no localStorage, no backend) | Refresh wipes everything |
| 14 | Duplicate `fontSize` keys in `ssm-mto.jsx` line 65 (`fontSize: 13` then `fontSize: 18`) | The 13 is silently overridden — minor, but indicative |
| 15 | `'instant'` is not a valid `behavior` for `window.scrollTo` (line 26 of `ssm-app.jsx`) | Browser falls back to default; minor |

### 2.3 What's broken (design + UX)

- **No mobile design at all.** Grid templates of `repeat(4, 1fr)` etc. will collapse to
  a single squashed column at <900px.
- **Header is heavy.** Five nav items + logo + 3 right-side actions on every page; on
  scroll the chrome appears suddenly with a hard `0.3s` fade. A real luxury header
  shrinks vertically.
- **PDP has no reviews, no Q&A, no recently-viewed, no fabric-care icons, no
  "back-in-stock" capture.** Customers buying a $1,280 jacket will not convert without
  social proof and granular fit/care detail.
- **Quick View** has no "Save to wishlist."
- **PLP "Filters" panel** has placeholder swatches with no checked state and no
  "Active filter" pills. There is no count next to filter values
  (e.g. "Cognac (3)").
- **Cart drawer** has no "Estimated delivery," no promo-code field, no upsell strip.
- **Account → Wishlist / Fit Profile / Addresses / Atelier Notes** all read "This
  section is under stitch." That's charming once and dead weight five times.
- **Checkout** has only the happy path. No address validation, no "saved address,"
  no error states, no Apple Pay / shop-pay button at top of bag (express checkout is
  the single highest-leverage conversion add for a luxury brand).
- **Lookbook** is a single chapter. The model is "chapters" (Spring/Resort/Winter) so
  it should hold an archive.

### 2.4 What's broken (copy)

- **Product blurbs are repeating their generic description format** ("Asymmetric zip ·
  vegetable-tanned lambskin"). Each piece deserves a 2-sentence story (origin,
  detail, who it was made for). The Saoirse Trouser and Marlowe Vest read identically
  to the Voltaire — that's a content gap, not a layout gap.
- **PDP accordion sections are generic** ("`${blurb}`. Cut from a single hide…"). The
  same paragraph appears under every product. This is the thing customers read before
  spending $1,300, so it is the highest-value writing on the site.
- **No FAQ, no shipping policy, no returns copy.** Currently only inferred in PDP
  accordion.
- **No journal / editorial.** The Lookbook is single-issue. Heritage page is one
  scroll. There is no recurring content to bring repeat traffic.
- **No metadata.** Every page needs a title + description + OG image.
- **Newsletter capture** is "Email for atelier dispatches → Subscribe." Good voice,
  but no value exchange (preview, early-access, atelier visit) and no double opt-in
  language.

---

## 3. Optimization plan (priority-ranked)

### P0 — Pre-launch, non-negotiable

1. **Move to a real build** — port the JSX into Vite + React (or Next.js if you want
   SSR). Keep the file structure (`ssm-home.jsx`, `ssm-shop.jsx`, etc.) and convert the
   `<script type="text/babel">` tags into ESM imports. About a day.
2. **Real routing** with React Router (or Next file routing). URLs needed:
   `/`, `/shop`, `/shop/women`, `/shop/men`, `/shop/jackets`, `/shop/vests`,
   `/shop/pants`, `/product/[slug]`, `/atelier`, `/lookbook`, `/lookbook/[slug]`,
   `/heritage`, `/journal`, `/journal/[slug]`, `/care`, `/repairs`, `/concierge`,
   `/contact`, `/faq`, `/size-guide`, `/shipping-returns`, `/sustainability`,
   `/gift-cards`, `/account`, `/account/orders/[id]`, `/cart`, `/checkout`, `/search`,
   `/404`.
3. **SEO baseline** — `<title>` and `<meta name="description">` per page; Open Graph
   (`og:image` should be a curated 1200×630 hero crop per page, not the same hero
   everywhere); Product JSON-LD on PDP; Organization JSON-LD in root layout;
   `sitemap.xml` and `robots.txt`.
4. **Image pipeline** — convert all generated PNGs to AVIF + WebP fallbacks; ship
   responsive `<picture>` with `srcset` for 400/800/1200/1600 widths; add
   `loading="lazy"` on everything below the fold and `fetchpriority="high"` on the LCP
   hero only. Expect ~70% size reduction.
5. **Accessibility pass** — replace all `<span onClick>` with `<button>` (size, swatch,
   filter chip, cart icon, account icon, all "ulink" elements). Add focus-visible
   styling. Add `alt` text to every product image (template:
   `${product.name}, ${leather.name} ${product.cat}, ${product.gender}`).
   Provide keyboard escape on drawer + modal; trap focus in cart drawer.
6. **Mobile breakpoints** — at minimum 360, 768, 1024, 1440. Hamburger nav under 900px,
   PDP becomes single-column with sticky bottom add-to-bag bar, shop becomes
   2-up grid with a slide-up filter sheet, hero clamps to `min(100svh, 720px)` not
   `100vh` (avoids iOS address-bar jump).
7. **Cart merging logic** — when adding, dedupe on `productId + size + leather`; if
   match, increment `qty`. Persist cart in `localStorage` (it's the one place
   localStorage is defensible).

### P1 — First post-launch

8. **CMS for content** — Sanity, Contentful or even MDX in the repo for: products,
   journal, lookbook chapters, atelier makers, FAQ, policies, homepage editorial
   blocks. The team should not need a developer to update a model name.
9. **Real checkout backend** — Stripe (or Shop Pay if you go Shopify Hydrogen). Add
   express-pay buttons at the top of the bag drawer (Apple Pay + Google Pay + PayPal).
10. **Working filters + sort + URL-synced query params** so a category page is
    shareable (`/shop/jackets?leather=cognac&size=m&sort=new`).
11. **Real search** — Algolia or Meilisearch indexed on product name, category,
    leather, blurb, story. Surface as an instant-search overlay from the header.
12. **Reviews** — Yotpo or Stamped (Trustpilot is too mass-market for this segment;
    Yotpo with photo reviews works).
13. **Analytics + measurement** — GA4 + a server-side proxy (Stape) so iOS17 doesn't
    eat your data; ecommerce events for view_item, add_to_cart, begin_checkout,
    purchase. Heatmap with Microsoft Clarity (free) or Hotjar.
14. **Performance budget** — JS < 180KB gz on first load; LCP < 2.0s; CLS < 0.05.
    Lighthouse 95+ on PDP.

### P2 — Quality of life

15. **Recently viewed** strip on PDP and shop.
16. **Wishlist that actually persists** (cookie-based for guests, account-bound for
    members).
17. **"Notify me when restocked"** for sold-out sizes — single highest-value
    conversion-recovery tool for a hand-numbered house.
18. **Concierge / virtual fitting booking** (Calendly-style, with the maker's name on
    it).
19. **Care reminders** — six months after purchase, email "Time to condition your
    Voltaire" with a link to the care page and the conditioning kit. This is on-brand
    AND drives repeat revenue.
20. **A/B harness** — even a coin-flip helper on the hero variant tweak you already
    have.

---

## 4. Theme system — what to keep, what to formalize

You already have the bones. Promote the inline tokens to a documented design system so
every new page reaches for the same primitives.

### 4.1 Tokens (lock these)

```
COLOR
  surface/0     #0a0908   page background, dark
  surface/1     #131110   cards, drawer
  surface/2     #1c1917   inputs, raised
  ink/0         #e8e2d5   primary text on dark
  ink/1         #c9c1ad   secondary
  ink/2         62% e8e2d5
  ink/3         40% e8e2d5
  line/1        10% e8e2d5
  line/2        18% e8e2d5
  accent/oxblood   #8b3a2e   action, hover
  accent/brass     #b08a4c   marker, italic emphasis
  feedback/positive #c8a45c (heritage gold) — never green
  feedback/error    #8b3a2e (oxblood, used sparingly)

TYPE
  display/xl   clamp(64,11vw,180)/0.92  Cormorant Garamond 400
  display/l    clamp(48,7vw,104)/0.95
  display/m    clamp(36,4.5vw,64)/1
  display/s    32/1.1
  body/l       16/1.7
  body/m       14/1.7
  body/s       13/1.6
  caption      11mono/0.14em uppercase
  micro        9mono/0.18em uppercase

SPACE
  page-pad: clamp(20px, 4vw, 48px)
  block-y:  clamp(64px, 10vw, 120px)
  gutter:   clamp(16px, 2vw, 32px)

RADIUS    0 (luxury = no rounded corners; keep it)
SHADOW    almost none; rely on 1px lines + grain overlay
MOTION    cubic-bezier(.2,.6,.2,1) for product/image, 0.4s
          cubic-bezier(.7,0,.3,1) for chrome/drawer, 0.4s
```

### 4.2 Component primitives (build these once)

Each new page should be assembled from this kit, never one-off:

- `Section.Eyebrow` — "I · CATEGORIES" (Roman numeral + caption)
- `Section.Display` — clamp display heading
- `Section.Lede` — body/l description
- `Card.Product` — image + tag + price + blurb (already exists, just extract)
- `Card.Editorial` — image + caption + label (used in lookbook, journal grid,
  category strip)
- `Card.Maker` — portrait + name + role + year (used in About, About maker page,
  PDP "made by")
- `Strip.Marquee` — already exists, parametrize text array
- `Pill.Mono` — uppercase 10px tag
- `Tag.Atelier` — outlined accent-2 border (already exists for "Atelier" tag)
- `Button.Primary` / `Button.Ghost` — already correct
- `Field.Underline` — already correct
- `Accordion.Section` — used in PDP, FAQ, Care, Heritage
- `Drawer.Right` — cart, filters, search overlay
- `Modal.Center` — quick view, size guide, image zoom
- `Stat.Trio` — "6–10 / 40+ / 1 of 1" pattern (used in MTO, repeat in Heritage)
- `Quote.Editorial` — italic display, attributed mono caption
- `MediaCaption.Scrim` — gradient at bottom, big serif word, mono sub-label

### 4.3 Page-architectural pattern

Every new page follows this rhythm to keep the house voice:

```
HEADER
  Eyebrow (Roman numeral · category)
  Display heading (1 line, italicized clause)
  Optional: lede (body/l, max 540px)
  Optional: deck pair — meta on the right (e.g. "16 FRAMES · 4:32 FILM")
EDITORIAL MEDIA
  one full-bleed frame OR a 12-col asymmetric mosaic
BODY
  three-column "principles" block (I / II / III) OR accordion
PROOF
  pull quote OR press strip OR maker portrait
CTA
  Primary action + ghost secondary
```

This is what `Lookbook` and `About` already do. Replicating that arc on every inner
page is what will make the site feel like one house, not a stitched template.

---

## 5. Shop page (PLP) — full plan

### 5.1 What's missing right now

- Search inside category
- Working filters (leather, size, price, availability, color, fit)
- Active filter pills + clear
- Counts per filter value
- URL-synced filter state
- Pagination or infinite scroll (currently shows all 12 — what about 60?)
- Empty state
- Editorial header per category (a bit of writing per shop landing — Jackets, Vests,
  Pants, Women, Men)
- Cross-link strip at the bottom ("You may also be looking at: Atelier · Lookbook")
- Mobile filter sheet
- Skeleton loader

### 5.2 New shop page anatomy

```
1. CATEGORY EYEBROW         "II · WOMEN · JACKETS"
2. DISPLAY HEADING          "For her."  (clamp display/l)
3. EDITORIAL LEDE (optional, 1–2 sentences per category)
                            "Asymmetric, cropped, double-rider — twelve silhouettes,
                             cut for movement and softened by season."
4. STICKY SUB-NAV           gender chips · category chips · sort
5. ACTIVE FILTER PILLS      (only when filters applied) with × and Clear all
6. RESULT GRID              3-up desktop, 2-up tablet, 1-up mobile
                            each card: image (3:4) · tag · name · blurb · price · hover quick-view
7. PAGINATION               "Showing 12 of 24 — Load more" (button, not infinite scroll)
8. CATEGORY ESSAY           (after grid, max 720px) one short paragraph for SEO + brand voice
9. DISCOVERY STRIP          "Continue in: Atelier — Made to Order"
```

### 5.3 Filter spec (build, don't fake)

```
LEATHER          checkbox list, swatch chip + name + count
SIZE             pill grid; click toggles; multi-select
PRICE            two-thumb range with input boxes
HUE              color dot grid (use the `hue` already in product data)
AVAILABILITY     in atelier · made to order · final pieces (radio? no — checkbox)
FIT              slim · regular · relaxed
```

URL spec: `/shop/jackets?leather=cognac,tobacco&size=m,l&price=800-1500&sort=new`.

### 5.4 Copy per shop landing

You need a 1–2 sentence editorial for each:

- **Jackets:** "Asymmetric, classic, cropped, long. Twelve silhouettes; one hide
  doctrine."
- **Vests:** "Layering, made obvious. Quilted yokes, raw selvedge, four-pocket
  utility."
- **Pants:** "Tailored from the central panels. High-rise, straight, riding."
- **Women:** "Cut to a woman's frame, not a smaller man's."
- **Men:** "Built for shoulder, not for show."

These belong on the category landing as the lede.

---

## 6. Product page (PDP) — full plan

The current PDP is the most complete page. To take it from prototype to luxury-grade:

### 6.1 Add these sections (in order, after the buy-block)

```
A. PIECE STORY                    1 short editorial paragraph per product, bylined to the cutter
                                  e.g. "Sigrid cut the first Voltaire from a single hide in 2018,
                                       working from a borrowed pattern and three nights of sketches.
                                       Six years on, this is the seventh evolution."
B. THE HIDE                       large detail image + leather origin (Tuscany, vegetable-tanned,
                                  oak/chestnut, 12 months) + "How it ages" microcopy
C. FIT & MEASUREMENTS             size table (chest/sleeve/length/shoulder per size),
                                  "Model is 5'10", wearing M" already there — keep
D. CARE                           four icons: brush · cloth · shade · condition every 6 mo
                                  Link out to /care
E. SHIPPING & RETURNS             "Complimentary express, 30-day returns on stock pieces"
                                  already there — keep
F. PRESS & PEER                   1-line press quotes ("The Voltaire arrived. I have not taken
                                  it off in three weeks." — Vogue Paris) + 3 customer reviews
                                  with star + photo
G. PAIRS WELL WITH                Trousers + vest combos hand-curated, not algorithmic
H. RECENTLY VIEWED                tail strip
I. STILL DECIDING?                soft form: "Ask the atelier" — opens a contact modal
                                  with the maker's portrait
```

### 6.2 PDP UX additions

- **Sticky bottom add-to-bag** on mobile (price + size dropdown + add).
- **Image gallery upgrades**: pinch-zoom, video slot, "ON BODY / IN STUDIO / DETAIL"
  view tabs.
- **"Notify me when this size returns"** — appears when a size is sold out.
- **"Reserve a fitting"** — link to concierge for the ≥$1,200 silhouettes.
- **Out-of-stock state** — preserve the page for SEO, replace ATB with notify form.
- **Stock urgency, on-brand only** — "3 pieces remain in this size" in mono caption,
  never a red countdown.
- **Trust strip** above add-to-bag, not below — repeats already exist (hand-numbered ·
  free shipping · lifetime repair) — keep.

### 6.3 Product data schema (extend `ssm-data.jsx`)

```js
{
  id, slug, name, gender, cat,
  price, currency,
  hues: [...],           // multi swatch w/ stock
  sizes: [{ size, stock }],
  shortBlurb,            // current `blurb`
  story,                 // 60–80 word piece-of-the-piece narrative
  hide: { name, origin, tannage, ageNotes },
  fit: { silhouette, model, chest, length, sleeve },
  care: ['Wipe with soft cloth', 'Condition twice yearly', ...],
  ships: 'In atelier' | 'Made to order' | 'Final pieces',
  maker: 'Sigrid K.',
  pressQuotes: [...],
  pairsWith: [productId, productId],
  images: { hero, detail1, detail2, back, flat, video? },
  meta: { title, description, ogImage },
}
```

### 6.4 Per-product copy (replace the generic accordion text)

For each of the 12 products, write four short blocks:
**The Piece** (the story), **The Craft** (this hide, this stitch, this maker),
**Fit & Care** (concrete), **Why we made it**.

Budget: ~250 words per product, ~3,000 words total. Half a day for a writer who has
read your existing voice.

---

## 7. Inner pages — what to build, in order

### Tier A — required for launch

#### A1. Journal (`/journal`)
**Why:** repeat traffic, SEO long-tail, the "house voice" needs an outlet.
**Content model:** chapter, slug, hero, dek, body (MDX), publish date, related
products, tagged maker.
**Anatomy:**
```
HERO            "VI · JOURNAL"  "Sleeve Notes."  / lede
GRID            3-up of latest essays with category chip + duration ("4 min")
CATEGORIES      The Hide · The Maker · The Wardrobe · From the Bench
ARCHIVE         year sections (MMXXVI, MMXXV)
SUBSCRIBE       same email field as footer, one short pitch
```

#### A2. Journal article (`/journal/[slug]`)
**Anatomy:** breadcrumb · eyebrow · display title · byline (cutter or founder) ·
date · body MDX · pull quote · 1–2 inline images · "Pieces from this essay" strip.

#### A3. Care guide (`/care`)
Single long-form page in the same voice as `About`.
**Sections:** When to condition · How to condition · Storing in summer · Caught in
rain · Scratches and patina · The aftercare kit (sell the conditioning kit here).

#### A4. Repairs & Restoration (`/repairs`)
**Anatomy:** hero ("Bring it back at fifty.") · the promise · the process (3 steps:
post · assess · return) · timeline (~6 weeks) · what's covered / what's not ·
"Begin a repair" form (CTA).

#### A5. Atelier / Made-to-Order landing (`/atelier`)
You already have the configurator. The configurator should sit at `/atelier/begin`.
The landing at `/atelier` should be a story: how MTO works, who the makers are, sample
delivered pieces, sample pricing, FAQ, then a single CTA to `/atelier/begin`.

#### A6. Concierge / Bespoke (`/concierge`)
Different from MTO — bespoke is the ground-up commission (custom silhouette, in-person
fitting, $5,000+). Anatomy: short hero, eligibility (≥$5k or repeat client),
process, schedule a fitting form (Calendly), confidentiality note.

#### A7. Heritage / About (`/heritage`)
You have it; expand:
- Founders' note (longer)
- Timeline (2014 → 2026 milestones)
- The tannery in Tuscany (single sub-page or accordion)
- The makers (you have the grid; each card → /heritage/maker/[slug])
- Press archive

#### A8. Maker bio (`/heritage/makers/[slug]`)
**Anatomy:** portrait (4:5) · eyebrow ("Stitcher · since 2017") · name · biography ·
favourite hide · pieces they've signed (product strip).

#### A9. FAQ (`/faq`)
Accordion grouped: Sizing & Fit · Leather & Care · Made to Order · Shipping ·
Returns · Repairs · Account · Sustainability.
~30 questions. Use the same accordion component as PDP.

#### A10. Size guide (`/size-guide` and modal-from-PDP)
Numerical tables per silhouette. How to measure (line drawing). Conversion (US /
UK / EU / JP).

#### A11. Shipping & Returns (`/shipping-returns`)
Tabular by region; service levels; duties; signature-on-delivery; the 30-day window;
how to start a return.

#### A12. Contact (`/contact`)
Three pathways, on-brand: Atelier (general), Concierge (high-value), Press.
Each is a single email + a one-line description, plus the Brooklyn address.

#### A13. Search results (`/search?q=`)
Layout = shop grid filtered by query, with "Did you mean…" and journal/article hits
underneath products.

#### A14. 404
Copy: "This piece is no longer in the atelier." plus a small `Featured` strip.

### Tier B — within first quarter

#### B1. Sustainability (`/sustainability`)
The honest version. Vegetable-tanning specifics, water use, single tannery, transport
(sea not air), repair rate, lifetime promise. Resist green-marketing. This is
buyer's-remorse insurance for $1,200 customers.

#### B2. Stockists / Find us (`/stockists`)
Even if you only have the Brooklyn studio, this is the page. Map (Mapbox), hours,
"by appointment" link.

#### B3. Press (`/press`)
Logos strip, downloadable press kit, single contact email, archive of mentions.

#### B4. Gift cards (`/gift-cards`)
Denominations $250–$2,500, optional handwritten note (mono caption), email or postal
delivery.

#### B5. Trade / Wholesale (`/trade`)
Form-gated; account application; minimum order; lookbook download.

#### B6. Privacy / Terms / Imprint
Plain-text, mono headings, body in Inter. Required for EU/UK trade.

### Tier C — account sub-pages (replace "under stitch" stubs)

- `/account/orders/[id]` — order detail with timeline (Cut → Stitch → Finish → QC →
  Ship), shipping tracker iframe, "write to your maker" CTA for MTO orders.
- `/account/wishlist` — saved products grid, "move to bag" + "remove."
- `/account/fit-profile` — saved measurements, fit photo upload, T-shirt size
  reference, "request virtual fitting."
- `/account/addresses` — multiple addresses, default shipping/billing.
- `/account/atelier-notes` — newsletter prefs, repair reminders, restoration history.

### Tier D — niceties

- `/lookbook/[chapter]` archive (Spring, Resort, Winter MMXXVI, prior years)
- `/journal/tag/[tag]`
- A `/wear-it-three-ways` style merchandising page per silhouette

---

## 8. Copywriting recommendations

### 8.1 Voice rules (write these into the brand book)

1. **Concrete over abstract.** "Twelve months in the tanning pit" beats "Ethically
   sourced leather." You're already doing this; never drift.
2. **One line, one comma.** Italicize the second clause for emphasis ("Built for the
   *quiet rebellion*"). It's your tic. Use it three times max per page.
3. **Numbers in Roman where it's a marker, in Arabic where it's a quantity.** Section
   markers Roman (I · II · III), counts Arabic (250 pieces, 6–10 weeks).
4. **No exclamation marks. No emojis. No "Shop now." No "Limited time."** Replace
   with "Discover," "Begin," "Step inside," "Continue."
5. **Press quotes go below body, not in hero.** A luxury hero should not need help.
6. **Email captures lead with a gift, not a discount.** "First viewing of every new
   chapter" not "10% off your first order."

### 8.2 Concrete writes-to-do

- 12 product stories (~250 words each, 4 sub-blocks)
- 4 category landing ledes (Jackets, Vests, Pants, Women, Men, Atelier)
- /care, /repairs, /faq long copy (~3,500 words combined)
- 6 maker bios (~150 words each)
- 4 launch journal entries (~600 words each — "Why we tan for twelve months,"
  "How to break in a Voltaire," "The first sleeve note from Sigrid," "Ten years,
  one Tuscan tannery")
- Page-level meta titles + descriptions for ~25 pages

Realistic: a single writer who has the brief above can do this in ~8–10 days.

### 8.3 Suggested meta patterns

```
HOME       SSM | Hand-cut leather, made in Brooklyn since 2014
SHOP       The Collection | SSM Atelier
CATEGORY   Leather Jackets, Hand-numbered | SSM
PDP        ${name} — ${cat}, ${gender} | SSM Atelier
ATELIER    Made to Order | SSM Atelier
HERITAGE   Heritage | SSM, A small house, built slowly
JOURNAL    Sleeve Notes | The SSM Journal
```

Description target: 150–158 chars, one sentence, ends in a period.

---

## 9. Implementation roadmap

| Phase | Span | Outcome |
|-------|------|---------|
| 0. Stabilize | week 1 | Vite + React port, real routing, environment vars, Git hygiene |
| 1. Production polish | weeks 2–3 | Mobile breakpoints, a11y pass, image pipeline, SEO baseline, cart merging + persistence |
| 2. Real commerce | weeks 4–5 | Stripe (or Shopify Hydrogen), express pay, working filters with URL sync, search (Algolia) |
| 3. Page completion (Tier A) | weeks 6–8 | Journal, Care, Repairs, Concierge, Heritage expanded, FAQ, Size guide, Contact, Shipping/Returns, Search, 404 |
| 4. Content pour | weeks 6–8 (parallel) | 12 product stories, 6 maker bios, 4 launch journal pieces, all category ledes |
| 5. Tier B + measurement | weeks 9–10 | Sustainability, Stockists, Press, Gift cards, Trade; analytics + heatmap; reviews live |
| 6. Conversion + retention | weeks 11–12 | Wishlist, recently-viewed, restock notifications, care reminder email flow, A/B harness |

A two-person team (one senior dev, one designer/copy hybrid) hits all of P0+P1 in
~6 weeks, the rest in another ~6.

---

## 10. The single highest-leverage thing

If you do nothing else from this document for two weeks, do this:

**Rewrite the 12 product accordions with real, specific, signed-by-the-maker stories,
and add 3–5 customer photo reviews per piece.** No layout changes. Pure content.

A luxury site converts on the line "Sigrid cut the first Voltaire from a single hide
in 2018." It does not convert on a hero. The infrastructure is good; what is missing
is the writing under each $1,200 piece. That is the work that makes the brand defensible.

---

*Audited against the current files: `ssm-app.jsx`, `ssm-shell.jsx`, `ssm-home.jsx`,
`ssm-shop.jsx`, `ssm-pdp.jsx`, `ssm-mto.jsx`, `ssm-misc.jsx`, `ssm-data.jsx`,
`tweaks-panel.jsx`, `index.html`, `SSM Leather.html`, `package.json`.*
