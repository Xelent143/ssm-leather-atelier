// Product catalog + leather material data + nav + content for inner pages.
// Public copy now follows the MOTOGRIP GEAR voice: direct, road-tested,
// fit-aware, and precise. Edit copy here and every page picks it up.

const A = (name) => `assets/generated/${name}`;

const SSM_ASSETS = {
  hero: A('hero-atelier-campaign.png'),
  biker: A('womens-biker-jacket.png'),
  cafe: A('mens-cafe-racer.png'),
  vest: A('moto-vest.png'),
  trouser: A('leather-trouser.png'),
  coat: A('long-coat.png'),
  atelier: A('atelier-workbench.png'),
  lookbook: A('lookbook-loft.png'),
  shearlingBanner: A('shearling-couple-banner.png'),
  detail: A('leather-detail.png'),
  // optional (generated). Pages fall back to atelier/detail if these are missing.
  tannery: A('tannery-tuscany.png'),
  care: A('leather-care-detail.png'),
};

// ── Products ────────────────────────────────────────────────────────────────
// Each product carries its own story — never use a generic blurb in the PDP.
// Copy blocks: piece (the narrative), craft (the making), fit (concrete),
// origin (the maker line). Stock is illustrative but realistic for a hand-house.

const SSM_PRODUCTS = [
  {
    id: 'p3', slug: 'marlowe-moto-vest',
    name: 'Marlowe Moto Vest', cat: 'Vests', gender: 'Men',
    price: 640, hue: 30, tag: null,
    blurb: 'Quilted yoke · raw selvedge edge',
    img: SSM_ASSETS.vest, alt: SSM_ASSETS.atelier,
    maker: 'Theo M.', signedSince: 2019,
    stock: { XS: 1, S: 2, M: 3, L: 2, XL: 1, XXL: 1 },
    story: {
      piece: "Built for the in-between weather, when a jacket is too much and a knit is not enough. The Marlowe layers under a coat in November and stands alone in May. The yoke is quilted by hand with a contrast thread.",
      craft: "Oiled hide, raw-cut selvedge edge — the leather is not finished, by design. It will darken at the hem first, then through the chest. Side adjusters in aged brass. Four pockets; one welt, one chest, two slip.",
      fit: "Cut close to the torso to layer cleanly. Size up if you intend to wear it over heavier knits.",
      origin: "Stitched by Theo, who joined the workshop in 2019 after seven years cutting saddlery in Galway.",
    },
  },
  {
    id: 'p4', slug: 'saoirse-trouser',
    name: 'Saoirse Trouser', cat: 'Pants', gender: 'Women',
    price: 920, hue: 200, tag: 'New',
    blurb: 'High-rise · stretch napa',
    img: SSM_ASSETS.trouser, alt: SSM_ASSETS.detail,
    maker: 'Helena A.', signedSince: 2020,
    stock: { XS: 1, S: 2, M: 2, L: 3, XL: 1, XXL: 0 },
    story: {
      piece: "We did not want to make leather trousers until we found a hide that moved like cloth. Two years in development with our Tuscan tannery; the result is a stretch napa that holds its line and moves with the leg. The Saoirse is the first piece cut from it.",
      craft: "Stretch napa with 4% elastane in the warp — invisible, essential. Hidden waistband stay; concealed zip; satin stripe down the inseam. No back yoke seam. Hand-finished hem.",
      fit: "High-rise, slim through thigh, gently flared at the ankle. Sized to a size up from your denim. Hems can be shortened in the fit room within 60 days, complimentary.",
      origin: "Cut and stitched by Helena, our pattern-cutter for women's tailoring since 2020.",
    },
  },
  {
    id: 'p5', slug: 'ridgemont-double-rider',
    name: 'Ridgemont Double Rider', cat: 'Jackets', gender: 'Men',
    price: 1450, hue: 5, tag: 'Fit Lab',
    blurb: 'Heritage cut · cordovan trim',
    img: SSM_ASSETS.cafe, alt: SSM_ASSETS.biker,
    maker: 'Bayard T.', signedSince: 2014,
    stock: { XS: 0, S: 1, M: 2, L: 1, XL: 0, XXL: 0 },
    story: {
      piece: "The Ridgemont is the oldest pattern in the house — cut to a 1953 American sloper, modified once in 2017 and never since. We make twelve a year. It is the jacket the founders wore on the day we opened in 2014, and the jacket Bayard still wears most days.",
      craft: "Heavyweight horse-front shell, cordovan piping at the lapel and cuff. Belted waist with a brass single-prong. Quilted satin lining; inner ticket pocket; 'MOTOGRIP · ROAD ARMOR' embossed at the placket.",
      fit: "Heritage cut — broader through chest and shoulder than the Hadley, intentionally. Wear over a knit or a heavy shirt. Consider sizing down if you prefer a closer line.",
      origin: "Bayard has cut every Ridgemont since the day we opened. He is the only person in the workshop who can.",
    },
  },
  {
    id: 'p9', slug: 'idris-long-coat',
    name: 'Idris Long Coat', cat: 'Jackets', gender: 'Men',
    price: 1490, hue: 200, tag: 'New',
    blurb: 'Three-quarter · merino lined',
    img: SSM_ASSETS.coat, alt: SSM_ASSETS.detail,
    maker: 'Bayard T.', signedSince: 2014,
    stock: { XS: 0, S: 1, M: 2, L: 2, XL: 1, XXL: 1 },
    story: {
      piece: "Bayard wanted a coat he could wear over a Hadley without bunching at the shoulder. The Idris is the answer — three-quarter, single-breasted, with a clean drop from collar to hem. The wool comes from the same mill in Yorkshire we use for the Ridgemont lining.",
      craft: "Heavyweight calf, merino-lined through the body, satin sleeves. Two welt pockets, one chest, one inner. Horn buttons; raglan shoulder so it rides cleanly over a jacket.",
      fit: "Cut to be worn over tailoring. True to size; do not size up.",
      origin: "Bayard. As ever.",
    },
  },
  {
    id: 'p12', slug: 'maren-statement',
    name: 'Maren Statement Jacket', cat: 'Jackets', gender: 'Women',
    price: 1350, hue: 0, tag: 'Fit Lab',
    blurb: 'Sculpted shoulder · waxed lamb',
    img: SSM_ASSETS.biker, alt: SSM_ASSETS.detail,
    maker: 'Iola V.', signedSince: 2017,
    stock: { XS: 1, S: 1, M: 2, L: 1, XL: 0, XXL: 0 },
    story: {
      piece: "The Maren is a small protest. We were told no one buys a sculpted shoulder anymore. We made twelve and sold them in a week. We will keep making twelve a year for as long as that holds.",
      craft: "Waxed lambskin with a structured shoulder pad cut from horsehair canvas. Hand-pad-stitched lapel; bound buttonholes; satin lining.",
      fit: "Tailored, sculpted. Cut to be worn open. Sleeves soften within two weeks; the shoulder will not.",
      origin: "Iola, who pad-stitches every lapel by hand. There is no machine in the workshop that can do it.",
    },
  },
];

// ── Imagery map ─────────────────────────────────────────────────────────────

const SSM_IMAGES = {
  heroFullbleed: SSM_ASSETS.hero,
  heroSplit:     SSM_ASSETS.biker,
  heroCentered:  SSM_ASSETS.hero,
  heroSecondary: SSM_ASSETS.coat,
  heroDetail:    SSM_ASSETS.detail,
  catJackets: SSM_ASSETS.biker,
  catVests:   SSM_ASSETS.vest,
  catPants:   SSM_ASSETS.trouser,
  catAtelier: SSM_ASSETS.atelier,
  atelier:    SSM_ASSETS.atelier,
  edWide:     SSM_ASSETS.lookbook,
  edDetail1:  SSM_ASSETS.detail,
  edDetail2:  SSM_ASSETS.atelier,
  edPortrait: SSM_ASSETS.coat,
  edInterior: SSM_ASSETS.shearlingBanner,
  workshop:   SSM_ASSETS.atelier,
  lookOpen:   SSM_ASSETS.lookbook,
  lookA:      SSM_ASSETS.biker,
  lookB:      SSM_ASSETS.cafe,
  lookC:      SSM_ASSETS.detail,
  lookD:      SSM_ASSETS.atelier,
  lookE:      SSM_ASSETS.trouser,
  lookF:      SSM_ASSETS.hero,
  // inner pages
  care:       SSM_ASSETS.care || SSM_ASSETS.detail,
  repairs:    SSM_ASSETS.atelier,
  journal:    SSM_ASSETS.detail,
  concierge:  SSM_ASSETS.hero,
  sustain:    SSM_ASSETS.tannery || SSM_ASSETS.atelier,
  press:      SSM_ASSETS.lookbook,
  stockists:  SSM_ASSETS.atelier,
  giftcard:   SSM_ASSETS.detail,
};

// ── Materials ───────────────────────────────────────────────────────────────

const SSM_LEATHERS = [
  { id: 'noir',     name: 'Obsidian Noir',     swatch: '#0a0908', desc: 'Glass-finish full-grain calfskin' },
  { id: 'oxblood',  name: 'Oxblood',           swatch: '#5a1a14', desc: 'Hand-rubbed aniline' },
  { id: 'cognac',   name: 'Cognac',            swatch: '#6e3a1c', desc: 'Vegetable-tanned, develops patina' },
  { id: 'tobacco',  name: 'Tobacco',           swatch: '#3a2615', desc: 'Waxed pull-up' },
  { id: 'bone',     name: 'Bone',              swatch: '#d6c9b0', desc: 'Naked nappa, aniline-dyed' },
  { id: 'ink',      name: 'Midnight Ink',      swatch: '#161b2a', desc: 'Smoked navy lambskin' },
];

const SSM_HARDWARE = [
  { id: 'gun',  name: 'Gunmetal',     css: 'linear-gradient(145deg,#3a3a3e,#1a1a1c)' },
  { id: 'br',   name: 'Aged Brass',   css: 'linear-gradient(145deg,#b08a4c,#7a5a30)' },
  { id: 'sil',  name: 'Polished Steel', css: 'linear-gradient(145deg,#d4d4d6,#8a8a8c)' },
  { id: 'ant',  name: 'Antique Nickel', css: 'linear-gradient(145deg,#7a7a76,#42423e)' },
];

const SSM_LININGS = [
  { id: 'silk',  name: 'Silk Twill',    desc: 'Hand-finished, monogrammed', pattern: 'linear-gradient(135deg,#e9dfc8,#b89f73 48%,#f7efd9)' },
  { id: 'cup',   name: 'Cupro',         desc: 'Breathable, satin hand', pattern: 'linear-gradient(135deg,#c9c0b5,#7f756c 50%,#e7ded3)' },
  { id: 'wool',  name: 'Merino Wool',   desc: 'Cold-weather warmth', pattern: 'repeating-linear-gradient(45deg,#30332e 0 8px,#43483f 8px 16px)' },
  { id: 'cot',   name: 'Cotton Sateen', desc: 'Lightweight everyday', pattern: 'repeating-linear-gradient(90deg,#f1eadf 0 6px,#ded2bd 6px 12px)' },
];

// ── Navigation ──────────────────────────────────────────────────────────────

const SSM_NAV = [
  { label: 'Women', view: 'shop', filter: 'Women' },
  { label: 'Men', view: 'shop', filter: 'Men' },
  { label: 'Fit Lab', view: 'mto' },
  { label: 'Lookbook', view: 'lookbook' },
  { label: 'Journal', view: 'journal' },
  { label: 'Heritage', view: 'about' },
];

// ── Journal entries (used by /journal grid + article page) ──────────────────

const SSM_JOURNAL = [
  {
    id: 'how-to-buy-your-first-leather-jacket',
    cat: 'Buying Guide',
    title: 'How to buy your first leather jacket.',
    seoTitle: 'How to Buy Your First Leather Jacket | MOTOGRIP GEAR',
    metaDescription: 'Learn how to choose leather type, fit, lining, hardware and construction before buying your first leather jacket with this practical MOTOGRIP GEAR guide.',
    dek: 'A practical guide to leather type, construction, fit and value—so your first jacket becomes one you will keep wearing.',
    duration: '12 min',
    date: 'July 25, 2026',
    isoDate: '2026-07-25',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/first-leather-jacket-hero.jpg',
    quickAnswer: 'Choose the jacket for its intended use first, then compare the hide, construction, hardware, lining and fit. A good leather jacket should sit cleanly at the shoulders, allow comfortable movement, use dependable components and make its material details clear.',
    body: [
      'A leather jacket is one of the few garments expected to improve as it is worn. That only happens when the material, pattern and construction suit the way you will actually use it. The right first jacket is not automatically the heaviest, softest or most expensive one; it is the jacket whose purpose, feel and fit are right for you.',
      'Use this guide as a product-page checklist. Good brands should explain what the jacket is made from, how it fits and what features are included. If important details are missing, ask before you buy.'
    ],
    sections: [
      {
        title: '1. Start with how you will wear it',
        paragraphs: [
          'Begin with use, not colour. A jacket for everyday city wear can prioritize softness, light weight and easy layering. A cold-weather jacket may need insulation or shearling. A jacket sold for motorcycle use should be assessed for its intended riding function, secure closures, coverage, movement and any clearly stated protective features.',
          'Do not assume every leather jacket is protective motorcycle equipment. Fashion styling and road use are different briefs. For riding, verify the manufacturer’s intended-use claims and whether armour, impact protection or relevant certification is included or supported.'
        ],
        bullets: [
          'Daily wear: comfort, versatility and manageable weight.',
          'Motorcycle use: secure fit, reach, coverage and verified protective features.',
          'Cold weather: room for layers, wind control and suitable insulation.',
          'Occasional dress wear: clean lines, refined grain and minimal bulk.'
        ]
      },
      {
        title: '2. Choose the hide by feel and purpose',
        paragraphs: [
          'Animal species influences weight, grain and hand-feel. Lambskin is usually supple, smooth and lighter, which suits refined everyday jackets. Cowhide is generally firmer and more substantial, making it a common choice for structured and motorcycle-inspired styles. Goatskin often has a more visible pebbled grain with a useful balance of softness and resilience. Shearling combines the hide and fleece for natural insulation.',
          'These are tendencies rather than guarantees. Thickness, tanning, finishing and garment construction can change how any hide behaves. The product description should name the leather species instead of relying only on the broad phrase “genuine leather.”'
        ],
        image: '/assets/generated/blog/leather-materials-construction.jpg',
        imageAlt: 'Cowhide, lambskin, goatskin and shearling samples with jacket hardware and stitching',
        imageCaption: 'Species, finish and thickness work together. Judge the actual specification, not one marketing word.'
      },
      {
        title: '3. Understand grain and finish without getting lost in labels',
        paragraphs: [
          'Full-grain leather retains the natural outer surface and can show pores, scars and variation. Top-grain leather has been lightly corrected or refined for a more uniform appearance. Corrected-grain leather is altered more heavily and then finished for consistency. None of these labels alone tells you whether the pattern, stitching or hardware is good.',
          'Finish matters too. Aniline finishes reveal more natural character but can be more sensitive to marks. Semi-aniline finishes add a light protective layer while preserving much of the grain. More heavily pigmented finishes offer colour consistency and easier maintenance. Choose the balance that fits your lifestyle.'
        ]
      },
      {
        title: '4. Read the construction, not only the surface',
        paragraphs: [
          'Look at the number and placement of panels. Fewer large panels can create a cleaner visual line, but well-designed multi-panel construction may improve shaping and movement. The important questions are whether the panels are symmetrical, the grain is matched thoughtfully and the seams lie flat without puckering.',
          'Check stress areas such as shoulders, pocket openings, cuffs, armholes and the base of the main zipper. Neat reinforcement and consistent seam allowance are better quality signals than decorative claims.'
        ]
      },
      {
        title: '5. Inspect stitching, hardware and lining',
        paragraphs: [
          'Stitches should run evenly with no loose thread, skipped sections or accidental double lines. Edge finishing should be tidy, and pocket corners should feel secure. Operate every zipper, snap and buckle. Hardware should move smoothly, align correctly and feel appropriate for the jacket’s weight.',
          'The lining affects comfort and service life. Breathable woven linings are useful for general wear; quilted or insulated linings add warmth. Check that the lining sits cleanly inside the sleeves, allows movement and is attached without pulling at the hem.'
        ],
        bullets: [
          'Zip the jacket fully and check that the front hangs straight.',
          'Open and close every pocket with one hand.',
          'Look for reinforcement at pocket ends and major stress points.',
          'Check that the lining does not twist, sag or protrude past the leather.'
        ]
      },
      {
        title: '6. Get the fit right at the shoulders first',
        paragraphs: [
          'The shoulder seam should finish close to the edge of your shoulder unless the design intentionally drops lower. The chest should close without strain, but excess folds can indicate too much room. Armholes should allow you to reach forward comfortably without lifting the whole jacket.',
          'Sleeves normally finish around the wrist bone for fashion wear; riding designs may run slightly longer to maintain coverage when the arms are extended. Jacket length depends on the silhouette, but the hem should look balanced with your torso and should not bunch heavily when you sit.'
        ],
        image: '/assets/generated/blog/leather-jacket-fit-men-women.jpg',
        imageAlt: 'Man and woman wearing correctly fitted brown and black leather jackets',
        imageCaption: 'Check the shoulder, chest, armhole, sleeve and hem together—not as separate measurements.'
      },
      {
        title: '7. Choose a silhouette you can repeat',
        paragraphs: [
          'A cafe racer has a clean front and band collar, making it one of the easiest first jackets to combine with casual or smart-casual clothing. A classic biker jacket brings an asymmetric zip, lapels and stronger visual attitude. Bombers offer a relaxed shape with ribbed edges, while trucker and blazer-inspired jackets feel familiar and versatile.',
          'The best style is the one you will reach for regularly. Start with a colour that works with most of your wardrobe—black and deep brown are dependable—then use cut, collar and hardware to express your preference.'
        ]
      },
      {
        title: '8. Compare value, not just the ticket price',
        paragraphs: [
          'A higher price can reflect better hides, stronger components, more careful pattern work, lower-volume production or after-sales support—but price is not proof by itself. Compare the specification, construction details, size guidance, return terms and repair options.',
          'Before ordering, confirm the leather species, lining, hardware, fit notes, available sizes, care instructions, delivery estimate and return eligibility. For made-to-measure pieces, confirm which measurements and design choices become final once production begins.'
        ]
      },
      {
        title: '9. Plan for care from the first wear',
        paragraphs: [
          'Let a new jacket settle through normal wear. Store it on a broad hanger in a cool, dry place and avoid plastic garment bags for long-term storage. If it becomes wet, blot gently and let it dry naturally away from direct heat.',
          'Use only a cleaner or conditioner suitable for the specific finish, test it on a hidden area and apply sparingly. Over-conditioning can change colour and soften the structure more than intended.'
        ]
      }
    ],
    checklist: [
      'Purpose is clear: daily wear, cold weather, dress wear or verified motorcycle use.',
      'Leather species, finish and lining are stated.',
      'Seams, grain matching and reinforcement look clean.',
      'Zippers, snaps and pockets operate smoothly.',
      'Shoulders sit correctly and the closed jacket allows comfortable movement.',
      'Sleeve and body length suit how you will wear it.',
      'Size chart, delivery timing, care and return terms are clear.'
    ],
    faq: [
      {
        q: 'Should I size up when buying a leather jacket?',
        a: 'Not automatically. Compare your body measurements with the brand’s chart and consider what you will wear underneath. Size up only when the chart, layering plan or fit notes support it.'
      },
      {
        q: 'Does a leather jacket stretch?',
        a: 'Leather can soften and mould slightly with wear, especially at movement points, but it will not correct a jacket that is substantially too small. Start with a sound shoulder and chest fit.'
      },
      {
        q: 'Is cowhide or lambskin better for a first jacket?',
        a: 'Choose cowhide when you prefer a firmer, more structured feel; choose lambskin when lightness and softness matter more. Construction and intended use remain just as important as species.'
      },
      {
        q: 'Is full-grain leather always the best choice?',
        a: 'Full-grain preserves more natural surface character, but the best choice depends on appearance, maintenance and use. A well-made top-grain jacket may suit someone who prefers a more uniform finish.'
      },
      {
        q: 'What is the most versatile first leather jacket style?',
        a: 'A clean cafe racer or bomber is easy to wear across many settings. A classic biker jacket is equally valid if its stronger hardware and asymmetric shape fit your wardrobe.'
      },
      {
        q: 'How long should a good leather jacket last?',
        a: 'With suitable materials, sound construction, appropriate use and regular care, a quality leather jacket can remain wearable for many years. Service life depends on wear, climate, storage and maintenance.'
      }
    ],
    pull: 'Buy the jacket whose material, pattern and purpose fit your life—not the one with the loudest label.',
  },
];

// ── FAQ data (used by /faq) ─────────────────────────────────────────────────

const SSM_FAQ = [
  { group: 'Sizing & Fit', items: [
    { q: 'How does MOTOGRIP GEAR jacket sizing run?', a: 'Most jackets run true to size over a fitted shirt. Ride-cut pieces leave room for reach through the shoulder; close-cut styles may need one size up over a heavy layer. Each PDP carries a model-and-size note.' },
    { q: 'I am between sizes. What do you recommend?', a: 'Size up if you intend to layer; size down if you prefer a closer line. Choose made to measure when chest, shoulder, sleeve, or waist fit needs rider-specific adjustment.' },
    { q: 'Do you make extended sizes?', a: 'Currently XS through XXL on stock pieces. For sizes outside this range, begin a Made-to-Order commission — we cut from your measurements.' },
    { q: 'How are leather trousers supposed to fit?', a: 'Sized to a size up from your usual denim. The waistband softens within a week; the seat softens within a month. Hems can be shortened in the fit room, complimentary, within 60 days of receipt.' },
  ] },
  { group: 'Leather & Care', items: [
    { q: 'How do I care for my piece?', a: 'Wipe with a soft dry cloth after wear. Condition twice a year with a small amount of neatsfoot oil or a beeswax-based conditioner. Avoid prolonged direct sun. Store on a wide wooden hanger, never on a wire.' },
    { q: 'What if my piece gets caught in the rain?', a: 'Blot — do not rub — with a dry towel. Hang to dry at room temperature, away from radiators and direct sun. Once dry, condition lightly. Do not panic; vegetable-tanned leather handles weather.' },
    { q: 'Will the colour change over time?', a: 'Yes, beautifully. Vegetable-tanned hides darken and develop patina with wear, sun, and conditioning. The Cognac and Tobacco hides change the most; Obsidian Noir and Midnight Ink change the least.' },
    { q: 'Can I get small scratches removed?', a: 'Most surface scratches buff out with a clean, dry cloth and time. Deep scratches can be addressed by our repairs team — see Repairs & Restoration.' },
  ] },
  { group: 'Made to Order', items: [
    { q: 'How long does a Made-to-Order commission take?', a: 'Six to ten weeks from final approval to delivery, depending on the silhouette and the time of year. We will write within 48 hours of submission to confirm timing for your piece.' },
    { q: 'Can I customize a silhouette beyond the standard options?', a: 'Yes. Begin a commission and write to us in the comments — sleeve length, hem length, an additional pocket, a contrasting lining. Anything within reason. Anything beyond reason, we call bespoke; see Concierge.' },
    { q: 'Are MTO pieces final sale?', a: 'Yes, with one exception: complimentary fit alterations within 60 days of receipt. We will not refund a commission, but we will alter it until it sits the way you want.' },
    { q: 'How is payment structured?', a: 'Fifty percent at submission, fifty percent at delivery. We hold the deposit until the commission ships.' },
  ] },
  { group: 'Shipping', items: [
    { q: 'Where do you ship?', a: 'Worldwide shipping is available. Shipping costs, delivery estimates, and applicable duties are shown at checkout.' },
    { q: 'How long does shipping take?', a: 'Your estimated delivery window is shown at checkout and depends on the destination and selected shipping service.' },
    { q: 'Are duties included?', a: 'Applicable duties and taxes depend on the destination. Any available charges or guidance are shown during checkout.' },
  ] },
  { group: 'Returns', items: [
    { q: 'What is your return policy?', a: 'Eligible standard-size, non-personalized pieces may be returned or exchanged within 30 days of signed delivery when they are unworn, unused and complete. Custom, made-to-measure, personalized and final-sale pieces are not eligible for a standard return.' },
    { q: 'How do I start a return?', a: 'Use the File a Return form with your order details before shipping anything. MOTOGRIP GEAR will review the request and send the authorized return instructions.' },
    { q: 'How long do refunds take?', a: 'We normally inspect a return within 72 hours of delivery. If approved, the refund is initiated within 7 business days to the original payment method; your bank or card provider may take up to 10 working days to show the credit.' },
  ] },
  { group: 'Repairs', items: [
    { q: 'Do you offer lifetime repairs?', a: 'Yes — every piece carries a lifetime repair promise. Bring it back at fifty; we will know how it was made.' },
    { q: 'What does the lifetime repair cover?', a: 'Stitching, hardware, lining, edge burnishing, conditioning. We do not cover damage from misuse — see Repairs & Restoration for the full scope.' },
    { q: 'How long does a repair take?', a: 'Approximately six weeks from receipt at the workshop. We write when the piece arrives, when work begins, and when it ships back.' },
  ] },
  { group: 'Account', items: [
    { q: 'Do I need an account to order?', a: 'No. Guest checkout is available. An account lets you track orders, save addresses, and write to your maker on Made-to-Order commissions.' },
    { q: 'How do I update my fit profile?', a: 'Account → Fit Profile. We hold your last three measurements; if you commission an MTO piece, we work from these unless you tell us otherwise.' },
  ] },
  { group: 'Sustainability', items: [
    { q: 'Where do you source your leather?', a: 'A single tannery in the hills outside Pisa, since 2014. All vegetable-tanned, all by-product hides from the Italian beef and lamb trade.' },
    { q: 'Are MOTOGRIP pieces sustainable?', a: 'We do not use the word lightly. Durable gear is the starting point: repairable leather, replaceable hardware, slower tanning where available, and fit options that keep the piece in rotation longer.' },
  ] },
];

// ── Care steps (used by /care) ──────────────────────────────────────────────

const SSM_CARE = [
  { n: 'I',  t: 'After every wear', c: 'Wipe with a soft dry cloth. Hang on a wide wooden hanger. Never on wire — it deforms the shoulder.' },
  { n: 'II', t: 'Twice a year',     c: 'Condition with a small amount of neatsfoot oil or a beeswax-based conditioner. Less is more — a teaspoon for a jacket. Wait 24 hours before wearing.' },
  { n: 'III', t: 'Caught in rain',  c: 'Blot dry with a clean towel. Hang at room temperature, away from radiators. Once dry, condition lightly.' },
  { n: 'IV', t: 'Storing in summer', c: 'Hung, breathable cotton garment bag, away from direct sun. Never plastic — leather needs to breathe.' },
  { n: 'V',  t: 'Scratches & patina', c: 'Most surface scratches buff out with a dry cloth and a few weeks. Deep marks become character. Bring it in for restoration if you want it gone.' },
];

// ── Stockists (used by /stockists) ──────────────────────────────────────────

const SSM_STOCKISTS = [
  {
    name: 'MOTOGRIP GEAR LLC', region: 'United States', city: 'Waterbury, CT',
    addr: '1172 N Main St, Waterbury, CT 06704, United States',
    phone: '+1 860 397 3707', whatsapp: '+1 860 397 3707', email: 'info@motogripgear.com', primary: true,
  },
  {
    name: 'MOTOGRIP LIMITED', region: 'United Kingdom', city: 'Bradford',
    addr: 'Unit 16, Lonsdale Works, Bradford BD3 9TF, United Kingdom',
    phone: '+44 7309 114348', whatsapp: '+44 7309 114348', email: 'info@motogripgear.com', primary: false,
  },
];

// ── Press (used by /press) ──────────────────────────────────────────────────

const SSM_PRESS = [
  { o: 'Vogue Paris',         q: 'The Voltaire arrived. I have not taken it off in three weeks.', who: 'Editor at Large', date: 'MMXXVI · February' },
  { o: 'Mr Porter Journal',   q: 'A house that understands restraint is the truest form of luxury.', who: 'Style Council', date: 'MMXXV · November' },
  { o: 'The Gentleman\'s Journal', q: 'You can feel the patience in the leather.', who: 'Features', date: 'MMXXV · September' },
  { o: 'AnOther Magazine',    q: 'Brooklyn\'s smallest house, with the longest patience.', who: 'Profile', date: 'MMXXV · July' },
  { o: 'Monocle',             q: 'A study in slow.', who: 'Quality of Life', date: 'MMXXV · April' },
  { o: 'The Financial Times', q: 'The kind of leather goods that argue for themselves.', who: 'How to Spend It', date: 'MMXXV · February' },
];

// ── SEO defaults (used by ssm-app to set <title> + meta) ────────────────────

const SSM_SEO = {
  home:       { title: 'MOTOGRIP GEAR — Road-Cut Leather Jackets & Moto Gear', desc: 'Premium motorcycle leather jackets, vests, and trousers with made-to-measure fit options. Built for grip, weather, and daily miles.' },
  shop:       { title: 'The Gear · MOTOGRIP GEAR', desc: 'Road-cut leather jackets, vests, trousers, and long coats with reinforced hardware and made-to-measure fit options.' },
  shopWomen:  { title: 'Women\'s Moto Leather Gear · MOTOGRIP GEAR', desc: 'Leather jackets, vests, and trousers cut for movement, structure, and made-to-measure fit.' },
  shopMen:    { title: 'Men\'s Moto Leather Gear · MOTOGRIP GEAR', desc: 'Cafe racers, double riders, long coats, vests, and leather trousers built for shoulder, reach, and road wear.' },
  pdp:        { title: '%name% — %cat%, %gender% · MOTOGRIP GEAR' },
  mto:        { title: 'Made to Measure · MOTOGRIP GEAR', desc: 'Choose the silhouette, leather, hardware, lining, and measurements. Road-cut custom leather gear with a precise fit.' },
  lookbook:   { title: 'Lookbook · MOTOGRIP GEAR', desc: 'Road-tested leather gear photographed with asphalt, speed, weather, and controlled studio detail.' },
  journal:    { title: 'Road Notes · MOTOGRIP GEAR', desc: 'Fit notes, hide notes, product testing, and care guidance from MOTOGRIP GEAR.' },
  about:      { title: 'Brand · MOTOGRIP GEAR', desc: 'Premium motorcycle leather gear built around grip, guard, motion, and precision.' },
  care:       { title: 'Leather Care Guide · MOTOGRIP GEAR', desc: 'How to clean, condition, store, and keep your MOTOGRIP leather gear road-ready.' },
  repairs:    { title: 'Repairs & Restoration · MOTOGRIP GEAR', desc: 'Repairable leather, replaceable hardware, and service guidance for long-term gear ownership.' },
  concierge:  { title: 'Custom & Concierge · MOTOGRIP GEAR', desc: 'Custom leather gear, fit support, and private measurement guidance.' },
  sustain:    { title: 'Sustainability · MOTOGRIP GEAR', desc: 'Repairable construction, durable leather, and fit options designed to keep gear in rotation longer.' },
  stockists:  { title: 'Find MOTOGRIP GEAR · Stockists & Fit Garage', desc: 'MOTOGRIP fitting locations, showroom appointments, and trunk shows.' },
  press:      { title: 'Press · MOTOGRIP GEAR', desc: 'Brand notes, product imagery, and press contact for MOTOGRIP GEAR.' },
  giftcard:   { title: 'Gift Cards · MOTOGRIP GEAR', desc: 'Give road-cut leather gear without guessing the size.' },
  faq:        { title: 'Frequently Asked · MOTOGRIP GEAR', desc: 'Sizing, leather, made-to-measure, shipping, returns, repairs.' },
  size:       { title: 'Size Guide · MOTOGRIP GEAR', desc: 'How to measure for jackets, vests, and leather trousers.' },
  ship:       { title: 'Shipping Information · MOTOGRIP GEAR', desc: 'Worldwide shipping is available. Review delivery regions, costs, tracking, and duties.' },
  returns:    { title: 'Returns & Refunds Policy · MOTOGRIP GEAR', desc: 'Read MOTOGRIP GEAR return eligibility, exchanges, custom-order exclusions, cancellation terms, and refund processing timelines.' },
  'file-return': { title: 'File a Return · MOTOGRIP GEAR', desc: 'Submit a return, exchange, store-credit, or fit-alteration request to MOTOGRIP GEAR.' },
  track:      { title: 'Track Your Order · MOTOGRIP GEAR', desc: 'Check the current fulfillment and delivery status of your MOTOGRIP GEAR order.' },
  privacy:    { title: 'Privacy Policy · MOTOGRIP GEAR', desc: 'How MOTOGRIP GEAR collects, uses, shares, and protects personal information.' },
  terms:      { title: 'Terms of Service · MOTOGRIP GEAR', desc: 'Terms governing use of the MOTOGRIP GEAR website, products, orders, and services.' },
  contact:    { title: 'Contact · MOTOGRIP GEAR', desc: 'Fit support, custom orders, press, and service.' },
  account:    { title: 'Your Garage · MOTOGRIP GEAR', desc: 'Orders, custom builds, fit profile, and service notes.' },
  cart:       { title: 'Your Bag · MOTOGRIP GEAR' },
  checkout:   { title: 'Checkout · MOTOGRIP GEAR' },
  notfound:   { title: 'This gear is no longer available · MOTOGRIP GEAR', desc: '' },
};

Object.assign(window, {
  SSM_PRODUCTS, SSM_LEATHERS, SSM_HARDWARE, SSM_LININGS, SSM_NAV,
  SSM_IMAGES, SSM_ASSETS, SSM_JOURNAL, SSM_FAQ, SSM_CARE,
  SSM_STOCKISTS, SSM_PRESS, SSM_SEO,
});
