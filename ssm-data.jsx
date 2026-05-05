// Product catalog + leather material data + nav + content for inner pages.
// All copy is in the SSM voice: concrete over abstract, italicized second clause,
// Roman section markers, mono captions. Edit copy here and every page picks it up.

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
    id: 'p1', slug: 'voltaire-biker',
    name: 'Voltaire Biker Jacket', cat: 'Jackets', gender: 'Women',
    price: 1280, hue: 220, tag: 'Signature',
    blurb: 'Asymmetric zip · vegetable-tanned lambskin',
    img: SSM_ASSETS.biker, alt: SSM_ASSETS.detail,
    maker: 'Sigrid K.', signedSince: 2018,
    stock: { XS: 2, S: 0, M: 3, L: 4, XL: 1, XXL: 0 },
    story: {
      piece: "Sigrid cut the first Voltaire from a single hide in 2018, working from a borrowed pattern and three nights of sketches. Six years on, this is the seventh evolution — shoulders cleaner, asymmetric line softened, hand-rubbed at the placket so it wears in faster.",
      craft: "Vegetable-tanned lambskin, twelve months in the pit. Cut from the central panels for unbroken grain. Eight stitches per inch on a vintage Singer 31-15. YKK Excella in aged brass. Edges burnished by hand with beeswax.",
      fit: "Slim through chest and shoulder, slightly cropped at the hip. Model is 5'10\" wearing M. Consider sizing up over a heavier knit. Sleeves shorten on request — write to your maker.",
      origin: "Cut and signed by Sigrid in our Brooklyn workshop. Yours will carry her initials inside the placket.",
    },
  },
  {
    id: 'p2', slug: 'hadley-cafe-racer',
    name: 'Hadley Café Racer', cat: 'Jackets', gender: 'Men',
    price: 1180, hue: 18, tag: 'Bestseller',
    blurb: 'Banded collar · waxed nappa',
    img: SSM_ASSETS.cafe, alt: SSM_ASSETS.detail,
    maker: 'Caspian R.', signedSince: 2016,
    stock: { XS: 0, S: 1, M: 4, L: 5, XL: 2, XXL: 0 },
    story: {
      piece: "Named after a road in the Hudson Valley that Caspian rides every spring. The Hadley is the simplest jacket we make and the hardest to get right — a banded collar, a single zip, no surprises. Patience is the only ornament.",
      craft: "Waxed nappa, two-tone hand-rubbed at the cuff. Single-piece back panel; you will not find a seam down the spine. Knit-rib hem; brass two-way zip; placket monogrammed in cognac.",
      fit: "Regular through chest, trim through sleeve. True to size for most. Shoulders soften within two weeks of wear; do not panic at first fitting.",
      origin: "Caspian has cut every Hadley sold since 2016 — over four hundred jackets, no two identical.",
    },
  },
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
      fit: "High-rise, slim through thigh, gently flared at the ankle. Sized to a size up from your denim. Hems can be shortened in atelier within 60 days, complimentary.",
      origin: "Cut and stitched by Helena, our pattern-cutter for women's tailoring since 2020.",
    },
  },
  {
    id: 'p5', slug: 'ridgemont-double-rider',
    name: 'Ridgemont Double Rider', cat: 'Jackets', gender: 'Men',
    price: 1450, hue: 5, tag: 'Atelier',
    blurb: 'Heritage cut · cordovan trim',
    img: SSM_ASSETS.cafe, alt: SSM_ASSETS.biker,
    maker: 'Bayard T.', signedSince: 2014,
    stock: { XS: 0, S: 1, M: 2, L: 1, XL: 0, XXL: 0 },
    story: {
      piece: "The Ridgemont is the oldest pattern in the house — cut to a 1953 American sloper, modified once in 2017 and never since. We make twelve a year. It is the jacket the founders wore on the day we opened in 2014, and the jacket Bayard still wears most days.",
      craft: "Heavyweight horse-front shell, cordovan piping at the lapel and cuff. Belted waist with a brass single-prong. Quilted satin lining; inner ticket pocket; 'SSM · MMXIV' embossed at the placket.",
      fit: "Heritage cut — broader through chest and shoulder than the Hadley, intentionally. Wear over a knit or a heavy shirt. Consider sizing down if you prefer a closer line.",
      origin: "Bayard has cut every Ridgemont since the day we opened. He is the only person in the workshop who can.",
    },
  },
  {
    id: 'p6', slug: 'solene-crop',
    name: 'Solene Crop Jacket', cat: 'Jackets', gender: 'Women',
    price: 1080, hue: 340, tag: null,
    blurb: 'Cropped silhouette · whipstitch',
    img: SSM_ASSETS.biker, alt: SSM_ASSETS.detail,
    maker: 'Iola V.', signedSince: 2017,
    stock: { XS: 2, S: 3, M: 2, L: 1, XL: 0, XXL: 0 },
    story: {
      piece: "A small jacket. Cropped at the rib, narrow at the wrist, high in the collar. The whipstitch at the shoulder seam is hand-done by Iola — twenty minutes per jacket, finished by feel.",
      craft: "Lambskin, hand-rubbed for a soft sheen. Whipstitch in a contrast cognac thread along both shoulder seams. Concealed front zip; bracelet-length sleeves; satin lining.",
      fit: "Cut close. Sleeves are intentionally short — meant to break at the wrist over a long-sleeve knit or a buttoned cuff.",
      origin: "Iola has been with the workshop since 2017 and finishes every Solene by hand.",
    },
  },
  {
    id: 'p7', slug: 'ainsley-vest',
    name: 'Ainsley Vest', cat: 'Vests', gender: 'Women',
    price: 580, hue: 25, tag: null,
    blurb: 'Tailored · pearl snap',
    img: SSM_ASSETS.vest, alt: SSM_ASSETS.trouser,
    maker: 'Marlowe P.', signedSince: 2019,
    stock: { XS: 1, S: 3, M: 2, L: 2, XL: 1, XXL: 0 },
    story: {
      piece: "The Ainsley is what we wear in the studio — over a shirt, under a coat, on its own in summer. Cut to a tailored line so it sits flat across the shoulder; closed with mother-of-pearl snaps because zippers, on this piece, would say too much.",
      craft: "Naked nappa, aniline-dyed. Princess seams front and back for a clean line. Mother-of-pearl snaps at the placket; bound buttonholes at the chest pockets.",
      fit: "Slim, tailored. Sized to wear over a shirt; size up if layering under outerwear.",
      origin: "Stitched by Marlowe, our finisher since 2019 and the steadiest hand in the workshop.",
    },
  },
  {
    id: 'p8', slug: 'bishop-field-pant',
    name: 'Bishop Field Pant', cat: 'Pants', gender: 'Men',
    price: 880, hue: 35, tag: null,
    blurb: 'Straight leg · oiled hide',
    img: SSM_ASSETS.trouser, alt: SSM_ASSETS.cafe,
    maker: 'Aram B.', signedSince: 2015,
    stock: { XS: 0, S: 1, M: 3, L: 4, XL: 2, XXL: 1 },
    story: {
      piece: "A leather trouser you can wear to the office and to the woods. Straight leg, no break, mid-rise. The hide is oiled rather than waxed — softer in the hand, faster to break in, and it patinas at the knee within a season.",
      craft: "Oiled hide. Reinforced inseam; gusseted crotch; brass YKK fly. Two slash, two welt, no back patch. Hidden hem so you can take them up without a seam line.",
      fit: "Straight, mid-rise, regular through thigh. Sized to a size up from your denim.",
      origin: "Aram cuts every Bishop himself; the inseam is hand-finished against a wooden last.",
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
    id: 'p10', slug: 'lior-riding-trouser',
    name: 'Lior Riding Trouser', cat: 'Pants', gender: 'Women',
    price: 940, hue: 15, tag: null,
    blurb: 'Articulated knee · stretch panel',
    img: SSM_ASSETS.trouser, alt: SSM_ASSETS.biker,
    maker: 'Helena A.', signedSince: 2020,
    stock: { XS: 1, S: 2, M: 2, L: 1, XL: 1, XXL: 0 },
    story: {
      piece: "Drawn from a 1970s motorcycle pattern, softened for the studio. The Lior has an articulated knee and a discreet stretch panel behind the calf — built originally to ride, kept because it walks well too.",
      craft: "Stretch napa with rear-calf gusset. Articulated knee panel; reinforced inseam; concealed side zip. Hand-finished hem, no break.",
      fit: "Slim, mid-rise, straight at the ankle. Built for movement; size to your usual.",
      origin: "Helena.",
    },
  },
  {
    id: 'p11', slug: 'calder-utility-vest',
    name: 'Calder Utility Vest', cat: 'Vests', gender: 'Men',
    price: 720, hue: 80, tag: null,
    blurb: 'Four-pocket · waxed canvas trim',
    img: SSM_ASSETS.vest, alt: SSM_ASSETS.atelier,
    maker: 'Theo M.', signedSince: 2019,
    stock: { XS: 0, S: 1, M: 3, L: 3, XL: 2, XXL: 1 },
    story: {
      piece: "A workshop vest. Four pockets at the chest and waist, brass D-rings at the placket, waxed canvas piping on the inside seam. The closest we will come to a uniform.",
      craft: "Tobacco hide; waxed canvas trim; aged-brass D-rings. Side adjusters; ticket pocket; pen slip at the chest.",
      fit: "Regular through torso. Designed for layering — size to your shirt size, not your jacket.",
      origin: "Theo. Stitched, side-adjusted, and side-eyed for crookedness before it leaves the bench.",
    },
  },
  {
    id: 'p12', slug: 'maren-statement',
    name: 'Maren Statement Jacket', cat: 'Jackets', gender: 'Women',
    price: 1350, hue: 0, tag: 'Atelier',
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
  edInterior: SSM_ASSETS.lookbook,
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
  { label: 'Atelier', view: 'mto' },
  { label: 'Lookbook', view: 'lookbook' },
  { label: 'Journal', view: 'journal' },
  { label: 'Heritage', view: 'about' },
];

// ── Journal entries (used by /journal grid + article page) ──────────────────

const SSM_JOURNAL = [
  {
    id: 'why-we-tan-twelve-months',
    cat: 'The Hide',
    title: 'Why we tan for twelve months.',
    dek: 'A short essay on patience, pits, and the smell of oak bark.',
    duration: '4 min',
    date: 'April 12, MMXXVI',
    byline: 'The Founder',
    hero: SSM_ASSETS.detail,
    body: [
      "There is a faster way. Most of the leather sold under the word 'luxury' is chrome-tanned in twelve hours. It is consistent, it is cheap, it is dead. We do not use it.",
      "Our hides come from a single tannery in the hills outside Pisa, where they sit in oak-bark and chestnut-bark pits for between ten and fourteen months. The tannins do their work slowly. The leather is not finished by the time it leaves the pit; it is barely beginning. What you receive in a Voltaire or a Hadley is leather that has had a slow life and now begins a new one with you.",
      "We are sometimes asked whether twelve months is necessary. The honest answer is that we have tried six and we have tried eighteen, and twelve is the number at which the hide is supple enough to cut and dense enough to age. There is no science here we did not learn from the people in Pisa. We are guests on a road they have been walking since the seventeenth century.",
      "The other answer, less honest, is that we wanted a number we could put on a page that would make us slow down. Twelve months is a long time. We needed to be the kind of house that would wait."
    ],
    pull: "We needed to be the kind of house that would wait.",
  },
  {
    id: 'breaking-in-a-voltaire',
    cat: 'The Wardrobe',
    title: 'How to break in a Voltaire.',
    dek: 'Three weeks of small attentions, with notes from Sigrid.',
    duration: '5 min',
    date: 'March 04, MMXXVI',
    byline: 'Sigrid K.',
    hero: SSM_ASSETS.biker,
    body: [
      "A Voltaire arrives stiff. This is intentional. A jacket that is soft on day one will be slack by year three. The first three weeks are the work of breaking it in.",
      "Week one. Wear it. Not over a coat, not in a closet — wear it. The shoulder seam softens against the back of your neck. The asymmetric placket learns where your hip falls. Do not condition it. Do not press it. Do nothing.",
      "Week two. Wear it again. By now the cuffs will have softened slightly; the placket will no longer fight the zip. If you wear a watch on the left, you will notice a small dent forming at the cuff. Good. The leather is taking your shape.",
      "Week three. Now condition. A small amount of neatsfoot oil on a soft cloth, rubbed gently into the placket, the cuff, the seat of the back panel where the jacket meets your jeans. Wait twenty-four hours before wearing. The leather will look slightly darker for a day; this is the oil settling.",
      "After that — wear. Wear it through one winter. By spring the leather will be yours and not ours. That is the whole point."
    ],
    pull: "After that — wear. Wear it through one winter.",
  },
  {
    id: 'first-sleeve-note-from-sigrid',
    cat: 'The Maker',
    title: "First sleeve note from Sigrid.",
    dek: "On cutting the first hide of the season.",
    duration: '3 min',
    date: 'February 08, MMXXVI',
    byline: 'Sigrid K.',
    hero: SSM_ASSETS.atelier,
    body: [
      "The first hide of the season arrived on Tuesday. I had been waiting since November. Antonio sent it himself, wrapped in paper and string, with a small note that read only: 'this one is good.'",
      "I left it on the bench overnight. A leather that has travelled wants a night to settle. The grain is tighter than last year's; the colour, deeper. I cut a strip from the corner and held it to the light. There is a small scar at the shoulder that will become someone's favourite spot.",
      "The Voltaire that comes from this hide will be number two hundred and thirty. I will sign it Sigrid K., MMXXVI, by hand, on the inside of the placket. Whoever wears it will read my handwriting some day, perhaps in fifty years, perhaps in five.",
      "I think about that often. I do not think it is sentimental. I think it is the most honest thing about the work."
    ],
    pull: "Whoever wears it will read my handwriting some day.",
  },
  {
    id: 'ten-years-one-tannery',
    cat: 'From the Bench',
    title: 'Ten years, one Tuscan tannery.',
    dek: 'A note on the people we have stayed with since the beginning.',
    duration: '6 min',
    date: 'January 18, MMXXVI',
    byline: 'The Founder',
    hero: SSM_ASSETS.detail,
    body: [
      "We met Antonio in 2014, three months before we opened. He was sixty-one. His tannery, then as now, sat in a stone building outside Pisa. We were three friends from Brooklyn with a sketchbook, a half-formed plan, and no track record. He gave us a tour, fed us lunch, and offered us a credit line we had not asked for.",
      "Twelve years on, every hide we have ever cut has come from his pits. We have been offered cheaper. We have been offered larger. We have not switched.",
      "There is a story we tell about the Ridgemont — that Bayard cut the first one from the first hide Antonio sent. It is true. The hide was the second-grade he had on the bench that week; he sent it because he did not have a first-grade ready. That second-grade hide became the founders' jackets. We still have one of them, in the workshop, on a hook above Bayard's bench.",
      "Antonio is seventy-three now. His son, Marco, has taken on the day-to-day. We will be with them for as long as they will have us."
    ],
    pull: "We have been offered cheaper. We have not switched.",
  },
];

// ── FAQ data (used by /faq) ─────────────────────────────────────────────────

const SSM_FAQ = [
  { group: 'Sizing & Fit', items: [
    { q: 'How does the SSM jacket sizing run?', a: 'Most of our jackets run true to size against a fitted shirt. The Voltaire and Solene are intentionally close — consider sizing up over a heavy knit. The Ridgemont and Idris are heritage cuts and run slightly larger. Each PDP carries a model-and-size note.' },
    { q: 'I am between sizes. What do you recommend?', a: 'Size up if you intend to layer; size down if you prefer a closer line. We offer complimentary fit alterations on stock pieces within 30 days of receipt, in person at the Brooklyn studio or by post.' },
    { q: 'Do you make extended sizes?', a: 'Currently XS through XXL on stock pieces. For sizes outside this range, begin a Made-to-Order commission — we cut from your measurements.' },
    { q: 'How are leather trousers supposed to fit?', a: 'Sized to a size up from your usual denim. The waistband softens within a week; the seat softens within a month. Hems can be shortened in atelier, complimentary, within 60 days of receipt.' },
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
    { q: 'Where do you ship?', a: 'Worldwide. Complimentary express shipping on all orders, signed for at receipt.' },
    { q: 'How long does shipping take?', a: 'Atelier Express is 2–3 working days within North America, 3–5 within Europe, 5–7 elsewhere. White Glove (5–7 days, by appointment) is available within New York City and London.' },
    { q: 'Are duties included?', a: 'Yes — all prices include duties for shipments within the US, EU, UK, Switzerland, Norway, Canada, Australia, and Japan. Duties for other regions are calculated at checkout.' },
  ] },
  { group: 'Returns', items: [
    { q: 'What is your return policy?', a: '30 days from receipt on stock pieces, in original condition with the placket monogram intact. Made-to-Order pieces are final sale (with the alteration window above). Final pieces are sold as-is.' },
    { q: 'How do I start a return?', a: 'Write to atelier@ssm.example or open the order in your account. We will send a return label and a small leather pouch to send the piece back in.' },
    { q: 'How long do refunds take?', a: 'Refunds process within 3 working days of receipt at the Brooklyn studio.' },
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
    { q: 'Are SSM pieces sustainable?', a: 'We do not use the word lightly. Vegetable tanning is slower and lower-impact than chrome; our pieces are repaired for life rather than replaced; everything ships by sea except urgent commissions. The full picture is on Sustainability.' },
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
  { name: 'The Brooklyn Atelier', city: 'Brooklyn, NY', addr: '143 Greenpoint Avenue, NY 11222', hours: 'Tue–Sat · 11–6 · By appointment', phone: '+1 (212) 555 0143', primary: true },
  { name: 'Hôtel Particulier (showroom)', city: 'Paris', addr: '14 rue du Pré-aux-Clercs, 75007', hours: 'By appointment only', phone: '+33 1 45 44 91 92' },
  { name: 'Yamato Atelier (trunk show)', city: 'Tokyo', addr: 'Aoyama 5-chome · twice yearly', hours: 'Spring · Autumn', phone: '—' },
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
  home:       { title: 'SSM — Leather Atelier · Hand-cut in Brooklyn since MMXIV', desc: 'Vegetable-tanned, hand-stitched, hand-numbered. Made by a single craftsperson in our Brooklyn workshop. Lifetime repair on every piece.' },
  shop:       { title: 'The Collection · SSM Atelier', desc: 'Twelve hand-numbered silhouettes for women and men. Vegetable-tanned hides, single-maker construction.' },
  shopWomen:  { title: 'For her — Leather jackets, vests, trousers · SSM', desc: 'Cut to a woman\'s frame, not a smaller man\'s. Hand-numbered jackets, vests and leather trousers.' },
  shopMen:    { title: 'For him — Leather jackets, vests, trousers · SSM', desc: 'Built for shoulder, not for show. Hand-stitched cafe racers, double riders, long coats and more.' },
  pdp:        { title: '%name% — %cat%, %gender% · SSM Atelier' },
  mto:        { title: 'Made to Order · SSM Atelier', desc: 'Choose the silhouette, leather, hardware, lining, monogram. One craftsperson. Six to ten weeks. One of one.' },
  lookbook:   { title: 'Lookbook · SSM Atelier', desc: 'Hourwitch — the winter MMXXVI film. Six pieces, photographed at dusk on the old coast road.' },
  journal:    { title: 'Sleeve Notes · The SSM Journal', desc: 'On the hide, the maker, the wardrobe. Long-form notes from the Brooklyn workshop.' },
  about:      { title: 'Heritage · SSM, A small house, built slowly', desc: 'Founded 2014 in a 600-square-foot Brooklyn workshop. Eleven craftspeople. One Tuscan tannery.' },
  care:       { title: 'Leather Care Guide · SSM', desc: 'How to clean, condition, store and live with your SSM piece. Five steps, written by the people who made it.' },
  repairs:    { title: 'Repairs & Restoration · SSM', desc: 'Lifetime repair on every piece. Bring it back at fifty; we will know how it was made.' },
  concierge:  { title: 'Concierge & Bespoke · SSM', desc: 'Ground-up commissions, in-person fittings and private appointments at the Brooklyn studio.' },
  sustain:    { title: 'Sustainability · SSM', desc: 'Vegetable-tanned, single-tannery, repaired for life. The honest version.' },
  stockists:  { title: 'Find SSM · Stockists & Studio', desc: 'The Brooklyn studio, the Paris showroom, the Tokyo trunk shows.' },
  press:      { title: 'Press · SSM Atelier', desc: 'A small archive of mentions and a single email for press enquiries.' },
  giftcard:   { title: 'Gift Cards · SSM Atelier', desc: 'A piece, but unchosen. Denominations from $250 to $5,000, with a handwritten note.' },
  faq:        { title: 'Frequently Asked · SSM', desc: 'Sizing, leather, made-to-order, shipping, returns, repairs.' },
  size:       { title: 'Size Guide · SSM', desc: 'Numerical tables and how to measure for jackets, vests, and leather trousers.' },
  ship:       { title: 'Shipping & Returns · SSM', desc: 'Complimentary express worldwide. 30-day returns on stock pieces.' },
  contact:    { title: 'Contact · SSM Atelier', desc: 'Atelier, Concierge, Press — three pathways, each goes to a real human.' },
  account:    { title: 'Your Atelier · SSM', desc: 'Orders, commissions, fit profile, atelier notes.' },
  cart:       { title: 'Your Bag · SSM' },
  checkout:   { title: 'Checkout · SSM' },
  notfound:   { title: 'This piece is no longer in the atelier · SSM', desc: '' },
};

Object.assign(window, {
  SSM_PRODUCTS, SSM_LEATHERS, SSM_HARDWARE, SSM_LININGS, SSM_NAV,
  SSM_IMAGES, SSM_ASSETS, SSM_JOURNAL, SSM_FAQ, SSM_CARE,
  SSM_STOCKISTS, SSM_PRESS, SSM_SEO,
});
