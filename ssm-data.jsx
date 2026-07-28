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
    id: 'p17', slug: 'heritage-crazy-horse-leather-laptop-backpack',
    name: 'Heritage Crazy Horse Leather Laptop Backpack', cat: 'Bags', gender: 'Unisex',
    price: 250, hue: 28, tag: 'New',
    blurb: 'Crazy Horse cowhide · Black or Brown · 15.6-inch laptop compartment',
    img: A('bags/heritage-crazy-horse-backpack/02-lifestyle-front.jpg'),
    alt: A('bags/heritage-crazy-horse-backpack/01-front.jpg'),
    images: [
      A('bags/heritage-crazy-horse-backpack/01-front.jpg'),
      A('bags/heritage-crazy-horse-backpack/02-lifestyle-front.jpg'),
      A('bags/heritage-crazy-horse-backpack/03-side.jpg'),
      A('bags/heritage-crazy-horse-backpack/04-three-quarter.jpg'),
      A('bags/heritage-crazy-horse-backpack/05-back.jpg'),
      A('bags/heritage-crazy-horse-backpack/06-profile.jpg'),
      A('bags/heritage-crazy-horse-backpack/07-main-compartment.jpg'),
      A('bags/heritage-crazy-horse-backpack/08-open-construction.jpg'),
      A('bags/heritage-crazy-horse-backpack/09-leather-detail.jpg'),
      A('bags/heritage-crazy-horse-backpack/10-buckle-detail.jpg'),
      A('bags/heritage-crazy-horse-backpack/11-feature-infographic.jpg'),
      A('bags/heritage-crazy-horse-backpack/12-material-infographic.jpg'),
      A('bags/heritage-crazy-horse-backpack/13-dimensions.jpg'),
    ],
    material: 'Crazy Horse cowhide leather',
    materialLocked: true,
    colors: [
      {
        id: 'black',
        name: 'Black',
        color: '#171717',
        image: A('bags/heritage-crazy-horse-backpack/14-black-leather-swatch.png'),
      },
      {
        id: 'distressed-brown',
        name: 'Brown',
        color: '#754526',
        image: A('bags/heritage-crazy-horse-backpack/09-leather-detail.jpg'),
      },
    ],
    defaultColor: 'distressed-brown',
    maker: 'MOTOGRIP Workshop', signedSince: 2026,
    stock: { 'One Size': 100 },
    options: [
      { name: 'Size', values: ['One Size'] },
      { name: 'Color', values: ['Black', 'Brown'] },
    ],
    variants: [
      {
        id: 'p17-one-size',
        sku: 'MG-P17-OS',
        attributes: { size: 'One Size' },
        quantity: 100,
        price: 250,
        status: 'active',
        availableForSale: true,
      },
    ],
    publicDescription: 'A structured Crazy Horse cowhide leather backpack available in black or distressed brown, with organized storage, padded carrying support and antiqued brass-tone hardware. Its 37 × 28 × 16 cm profile includes a compartment sized for laptops up to 15.6 inches.',
    sections: {
      features: [
        'Crazy Horse cowhide leather with a naturally varied distressed finish',
        'Padded compartment sized for laptops up to 15.6 inches',
        'Dual-buckle front flap with a large front utility pocket',
        'Two buckle-fastened side pockets and a rear zipper pocket',
        'Adjustable padded shoulder straps and a top carry handle',
        'Antiqued brass-tone buckles and zipper hardware',
      ],
      specifications: [
        ['Material', 'Crazy Horse cowhide leather'],
        ['Color', 'Black or distressed brown'],
        ['Dimensions', '37 cm high × 28 cm wide × 16 cm deep'],
        ['Laptop compatibility', 'Up to 15.6 inches'],
        ['Carry system', 'Adjustable padded shoulder straps and top handle'],
        ['Availability', '100 pieces total, shared across both color selections'],
      ],
      perfectFor: 'Daily commuting, work, study and organized travel.',
      whyYouWillLoveIt: 'A practical multi-pocket layout meets the character of distressed Crazy Horse cowhide in a balanced everyday backpack.',
    },
    metafields: {
      outerMaterial: 'Crazy Horse cowhide leather',
      leatherType: 'Crazy Horse cowhide',
      closure: 'Zipped main compartment with dual-buckle front flap',
      pocketCount: 4,
      fit: 'One size',
      careInstructions: 'Wipe gently with a dry soft cloth. Store away from direct heat, prolonged sunlight and excess moisture.',
      customSizingAvailable: false,
      personalizationAvailable: false,
    },
    factualProjection: true,
    reviews: [],
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
    heroAlt: 'Man wearing a fitted espresso leather cafe racer jacket in a warm MOTOGRIP GEAR studio',
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
  {
    id: 'denim-motorcycle-vests-hot-humid-weather',
    cat: 'Hot-Weather Gear',
    title: 'Do denim motorcycle vests work in hot, humid weather?',
    seoTitle: 'Denim Motorcycle Vests in Hot, Humid Weather | MOTOGRIP GEAR',
    metaDescription: 'Learn how denim weight, lining, fit and base layers affect motorcycle-vest comfort in hot, humid weather—and where a vest does not replace protective riding gear.',
    dek: 'A practical look at denim weight, airflow, lining and fit when summer heat and humidity make every layer matter.',
    duration: '10 min',
    date: 'July 25, 2026',
    isoDate: '2026-07-25',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/denim-vest-hot-weather-hero.jpg',
    heroAlt: 'Man wearing a dark indigo denim motorcycle vest in a warm sunlit MOTOGRIP GEAR studio',
    quickAnswer: 'A well-fitted denim motorcycle vest can be a comfortable utility layer in hot, humid weather when it uses a manageable fabric weight, breathable lining and an open arm design. It is still an extra layer, however, and it does not provide the arm coverage or verified protection of purpose-built riding equipment.',
    body: [
      'Hot weather changes the way every garment feels. High temperature increases the heat your body must release, while humidity slows the evaporation of perspiration. A vest removes sleeves and can feel less restrictive than a jacket, but the comfort result still depends on the denim, lining, pattern and clothes worn underneath.',
      'The useful question is not simply whether denim is “cool.” It is whether a particular vest manages weight, airflow, moisture and movement well enough for your climate and intended use. This guide explains what to inspect before buying and how to wear a denim vest more comfortably in summer.'
    ],
    sections: [
      {
        title: '1. Heat and humidity create two different problems',
        paragraphs: [
          'Heat raises the demand for airflow and reduces tolerance for heavy layers. Humidity adds a second challenge: moisture evaporates more slowly, so a garment can feel damp even when air is moving. A vest helps by leaving the arms open and reducing material compared with a full jacket, but the torso is still covered by denim, seams, pockets and possibly a lining.',
          'Expect comfort to change throughout the day. A vest that feels easy during a moving morning ride may feel warmer when traffic stops or the afternoon humidity rises. Evaluate it for the slowest, hottest part of your routine—not only for the moment when the road is open.'
        ]
      },
      {
        title: '2. Denim weight matters more than the word “denim”',
        paragraphs: [
          'Denim is available in many weights and constructions. Heavier fabric can feel more substantial and hold a structured club-style shape, but it also stores more heat and takes longer to dry. A lighter denim generally feels easier in summer, although durability, drape and pocket support may differ.',
          'Product pages should state the fabric composition and, ideally, its weight. Stretch content can improve movement, but it does not automatically make a vest cooler. A dense weave, thick coating or multiple fused layers can reduce the airy feeling buyers expect from a sleeveless garment.'
        ],
        bullets: [
          'Lighter denim: usually easier to wear in heat and faster to dry.',
          'Midweight denim: a balance of structure, durability and summer comfort.',
          'Heavy denim: strong visual structure, but more heat retention and drying time.',
          'Coated or waxed finishes: useful for a specific appearance or weather resistance, but often less breathable.'
        ]
      },
      {
        title: '3. Check the lining before judging airflow',
        paragraphs: [
          'The inside of the vest sits closest to the body, so lining choice can change the experience as much as the shell. A breathable mesh lining creates separation between the denim and base layer and can help moisture move away from the skin. A dense polyester lining may feel smooth, but it can also feel warmer when ventilation is limited.',
          'Look through the armholes and inside photographs. The lining should be securely attached without excessive loose fabric. Interior pockets add utility but also add layers; large pocket bags, concealed panels and padding can create warmer zones across the chest and back.'
        ],
        image: '/assets/generated/blog/denim-vest-breathable-construction.jpg',
        imageAlt: 'Dark indigo denim motorcycle vest opened to show breathable mesh lining, reinforced seams and metal snaps',
        imageCaption: 'Shell weight, lining and pocket construction work together. A sleeveless cut alone does not guarantee a cool vest.'
      },
      {
        title: '4. Fit controls how air moves around the torso',
        paragraphs: [
          'A summer vest should not hang so loosely that it flaps or fills with air at speed, but an excessively tight chest can press damp fabric against the body and restrict movement. The shoulder should sit cleanly, the armholes should not bite, and the front should close without strain over the base layer you plan to wear.',
          'Test the riding position when possible. Reach forward as if holding the bars and check whether the vest rises toward the neck, pulls sharply across the back or bunches at the waist. A shorter ride-oriented length can reduce bunching when seated, while a clean armhole shape helps the shoulders move without rubbing.'
        ]
      },
      {
        title: '5. Use the base layer as part of the ventilation system',
        paragraphs: [
          'A lightweight, moisture-managing T-shirt or long-sleeve base layer can be more comfortable than thick cotton in high humidity. The goal is to move perspiration away from the skin and reduce friction around the armholes and collar. Choose a smooth fabric that does not bunch under the vest.',
          'Colour also affects comfort in direct sun. Dark indigo and black absorb more solar heat than pale colours, although shade, airflow and fabric thickness can matter more in real use. If you prefer a dark vest, use a light base layer, take regular shade breaks and avoid storing the garment in a hot enclosed compartment before wearing it.'
        ]
      },
      {
        title: '6. Pockets add utility—and localized warmth',
        paragraphs: [
          'One reason riders choose vests is storage. Chest pockets, hand pockets and interior compartments keep essentials accessible, but each pocket adds fabric. Carry only what you need in extreme heat; a phone, wallet, tools and battery pack grouped together can create noticeable weight and a warm spot.',
          'Secure closures remain important. Snaps and zippers should be easy to operate without forcing the fabric, and pocket placement should not interfere with the seated position. Distribute heavier items instead of loading one side.'
        ]
      },
      {
        title: '7. A denim vest is not automatically protective riding gear',
        paragraphs: [
          'A vest leaves the arms exposed and ordinary denim is not a substitute for purpose-built abrasion-resistant motorcycle equipment. Styling terms such as “biker” or “motorcycle” do not prove protective performance. If protection is the priority, verify the garment’s intended use, materials, armour compatibility and any relevant certification stated by the manufacturer.',
          'For road use, build the outfit as a system. A denim vest can sit over appropriate protective gear when the fit allows, or serve as a utility and identity layer off the bike. Do not let the comfort of fewer layers create a false sense of coverage.'
        ]
      },
      {
        title: '8. Dry it completely after a humid day',
        paragraphs: [
          'After wear, empty the pockets and hang the vest in moving air away from direct heat. Do not leave damp denim folded in a bag, pannier or wardrobe; trapped moisture encourages odour and can stress dyes, metal hardware and lining materials.',
          'Follow the care label before washing. Spot clean small marks when appropriate, close hardware to reduce abrasion, and avoid aggressive heat drying that can shrink denim or distort the lining. Dark indigo may transfer colour when new, particularly when damp, so keep it away from light upholstery and garments until you understand how the dye behaves.'
        ]
      },
      {
        title: '9. Know when another layer is the better choice',
        paragraphs: [
          'A denim vest makes sense when you want torso storage, a club-style silhouette or an additional identity layer with open arms. In very high heat, a lighter technical vest may manage moisture better. For protective riding, a ventilated motorcycle jacket or shirt designed and certified for that purpose may be the more responsible option.',
          'Choose according to the full job: climate, speed, traffic, ride length, protection needs and what you carry. Summer comfort is not one fabric claim; it is the result of the complete garment and how you use it.'
        ]
      }
    ],
    checklist: [
      'Fabric composition and denim weight are clearly stated.',
      'The lining is breathable and shown in product photographs.',
      'Armholes and shoulders allow movement without rubbing.',
      'The closed vest is secure without compressing the chest.',
      'Pocket layers and carried items do not overload one area.',
      'The base layer manages moisture and does not bunch.',
      'Protective limitations are understood before motorcycle use.'
    ],
    faq: [
      {
        q: 'Is a denim vest cooler than a leather vest?',
        a: 'It can be, especially when the denim is lighter and the lining is breathable, but construction matters. Heavy denim with dense pocket layers may feel warmer than a light leather or technical vest.'
      },
      {
        q: 'Should a summer motorcycle vest fit loose?',
        a: 'It should allow comfortable breathing and reach without excessive flapping. Use the brand’s measurements and test the intended base layer rather than buying significantly oversized for airflow.'
      },
      {
        q: 'What should I wear under a denim vest in humidity?',
        a: 'Choose a lightweight, smooth, moisture-managing base layer. Avoid bulky seams and thick fabrics that hold perspiration against the body.'
      },
      {
        q: 'Can I wash a denim motorcycle vest in a machine?',
        a: 'Follow the care label because linings, coatings, leather trims and hardware can change the correct method. When machine washing is allowed, close the hardware, use a gentle cycle and avoid high heat.'
      },
      {
        q: 'Does dark denim get hotter in the sun?',
        a: 'Dark colours generally absorb more solar heat. Shade, airflow, fabric weight and ride conditions also affect comfort, so colour should be considered with the rest of the garment.'
      },
      {
        q: 'Is a denim motorcycle vest protective?',
        a: 'Not automatically. A vest leaves the arms exposed, and ordinary denim does not establish abrasion or impact protection. Verify the manufacturer’s intended-use and certification claims for protective equipment.'
      }
    ],
    pull: 'In summer, comfort comes from the whole system: fabric weight, lining, fit, base layer and honest expectations.',
  },
  {
    id: 'how-to-clean-denim-motorcycle-vest',
    cat: 'Denim Care',
    title: 'How should you clean and care for a denim motorcycle vest?',
    seoTitle: 'How to Clean a Denim Motorcycle Vest Safely | MOTOGRIP GEAR',
    metaDescription: 'Clean a denim motorcycle vest without damaging its colour, patches, hardware or shape. Compare spot cleaning, hand washing, machine washing and safe drying.',
    dek: 'A care-label-first method for removing road dust, sweat and stains while protecting indigo colour, patches, hardware and fit.',
    duration: '12 min',
    date: 'July 25, 2026',
    isoDate: '2026-07-25',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/denim-vest-care-hero.jpg',
    heroAlt: 'Man in a dark-indigo denim motorcycle vest holding a natural-bristle garment brush in the MOTOGRIP GEAR studio',
    quickAnswer: 'Start with the garment care label. Empty the vest, remove detachable items and armour, repair loose patch stitching, then use the least aggressive method that will do the job. Spot clean small marks; hand wash delicate or heavily patched vests; use a cold gentle machine cycle only when the label permits it. Reshape and air dry away from direct heat.',
    body: [
      'A denim vest collects dust, perspiration, road film and occasional oil or insect marks, but a full wash is not always the best first response. Water, agitation and heat can affect dark dye, patch adhesives, decorative stitching, linings and the shape of a structured vest.',
      'The safest routine begins with the actual garment—not a universal internet rule. Read the sewn-in care label, identify every material and attachment, and choose the mildest cleaning process that suits the soil. This guide gives you a practical decision path while keeping the manufacturer’s instructions in charge.'
    ],
    sections: [
      {
        title: '1. Read the label and inspect the whole vest',
        paragraphs: [
          'Check the fibre content, wash symbols and any instructions for coatings, leather trim, protective reinforcements or removable armour. A cotton denim shell may be washable while its lining, patch adhesive or trim is not. When the label says professional clean only, follow it.',
          'Look for loose seams, lifting patch edges, weak snap settings and damaged zipper tape. Cleaning can turn a small defect into a larger one, so repair it first. If the vest includes impact protectors, remove them unless its instructions explicitly say otherwise.'
        ],
        bullets: [
          'Empty every exterior and interior pocket.',
          'Remove pins, clips, detachable badges and armour.',
          'Photograph patch placement before removing anything.',
          'Test dark denim for colour transfer with a damp white cloth on a hidden area.',
          'Keep leather-trimmed, waxed or coated vests out of a standard wash unless the label permits it.'
        ]
      },
      {
        title: '2. Decide whether it needs a full wash',
        paragraphs: [
          'Brush away dry dust and grit before adding moisture. A soft garment brush or clean microfiber cloth often removes the surface layer that makes a vest look tired. Let dried mud harden, then brush it off gently rather than grinding wet soil deeper into the weave.',
          'Use spot cleaning for one or two marks, odour in a limited area or light collar soil. Move to hand or machine washing only when perspiration, widespread dirt or embedded grime affects the whole garment. Less frequent washing usually preserves dark colour and structure better.'
        ]
      },
      {
        title: '3. Prepare patches, hardware and dye',
        paragraphs: [
          'Sewn patches generally tolerate careful washing better than heat-bonded patches, but loose threads must be secured first. Adhesive patches, printed transfers, embroidery and reflective details can react differently to soaking, detergent and heat. When in doubt, hand clean around them or consult a cleaner experienced with decorated garments.',
          'Fasten zippers and snaps to reduce snagging, then turn the vest inside out if the care label allows. Wash dark indigo alone or with similar colours because new denim can release dye. Never combine it with pale garments or towels until you know the colour is stable.'
        ],
        image: '/assets/generated/blog/denim-vest-care-preparation.jpg',
        imageAlt: 'Dark-indigo denim motorcycle vest arranged with a soft brush, cloth, mild detergent, basin and broad wooden hanger',
        imageCaption: 'Preparation protects the details: empty the pockets, remove detachable pieces, secure loose stitching and choose mild tools.'
      },
      {
        title: '4. Machine wash only when the care label allows it',
        paragraphs: [
          'Place the prepared vest in the machine by itself or with similar dark denim. Use cold water, a gentle cycle and a small amount of mild detergent. Avoid bleach and aggressive stain products; skip fabric softener unless the manufacturer specifically allows it. Softener can leave residue and may affect technical finishes.',
          'Do not overload the drum. The vest needs room to move without being crushed against heavy items. At the end of the cycle, remove it promptly, check that patches and closures remain secure, and smooth the panels before drying.'
        ],
        bullets: [
          'Cold water helps limit shrinkage and dye loss.',
          'A gentle cycle reduces stress on seams, patches and hardware.',
          'A mesh laundry bag can reduce snagging if the vest fits without being tightly folded.',
          'Never machine wash armour, electronics or detachable accessories with the vest.'
        ]
      },
      {
        title: '5. Hand wash when you need more control',
        paragraphs: [
          'Fill a clean basin with cold water and dissolve a small amount of mild detergent before adding the vest. Submerge it only if the label permits soaking. Press the water through the fabric gently and give extra attention to the collar and underarm areas without scrubbing patches or printed graphics.',
          'Drain the basin and rinse with fresh cold water until no detergent remains. Support the garment when lifting it because saturated denim is heavy. Press out water between clean towels; do not twist or wring the vest, which can distort panels and stress the lining.'
        ]
      },
      {
        title: '6. Treat common stains without spreading them',
        paragraphs: [
          'Blot fresh marks rather than rubbing them outward. For ordinary food or road soil, test a diluted mild-detergent solution on a hidden area, work from the edge toward the centre and rinse the treated area lightly. For greasy marks, absorb excess oil first and follow the care-label guidance for a denim-safe pre-treatment.',
          'Fuel, solvent, paint, mould or an unknown chemical needs extra caution. Move the garment to a ventilated area away from flames and heat, avoid mixing cleaners, and do not place a vest with a persistent fuel or solvent odour in a washer or dryer. Ask a qualified textile cleaner or local safety authority for the appropriate treatment.'
        ]
      },
      {
        title: '7. Air dry, reshape and protect the colour',
        paragraphs: [
          'High heat can shrink denim, distort linings and weaken adhesive details. Unless the care label gives another instruction, reshape the damp vest and air dry it in shade with good circulation. Use a broad hanger strong enough for the wet weight, or lay the vest flat on a clean drying rack.',
          'Keep it away from radiators, hair dryers and intense direct sun. Confirm that the pocket bags, seams and lining are completely dry before storage. A vest that feels dry outside can still hold moisture in layered areas.'
        ]
      },
      {
        title: '8. Build a simple post-ride care routine',
        paragraphs: [
          'After a humid or dusty ride, empty the pockets, brush off loose debris and hang the vest where air can circulate. Wipe dry metal hardware after rain and operate zippers gently rather than forcing them. Inspect the armholes, shoulder seams and patch stitching regularly.',
          'Store clean, fully dry denim on a broad hanger or folded without sharp creases in a cool, dry place. Use a breathable garment cover for long storage and avoid sealed plastic. These small habits reduce the need for aggressive cleaning later.'
        ]
      }
    ],
    checklistEyebrow: 'CARE CHECKLIST',
    checklistTitle: 'Before your vest goes near water.',
    checklist: [
      'The sewn-in care label has been read.',
      'Pockets are empty and detachable items are removed.',
      'Loose patch stitching and damaged closures are repaired.',
      'The cleaning method suits every material and trim.',
      'Cold water and a mild detergent are ready if washing is allowed.',
      'A shaded, ventilated drying area is prepared.',
      'Fuel, solvent, mould or unknown stains are referred to a professional when needed.'
    ],
    faqEyebrow: 'DENIM VEST CARE FAQ',
    faq: [
      {
        q: 'Can every denim motorcycle vest go in a washing machine?',
        a: 'No. The label and complete construction decide. Leather trim, coatings, armour, adhesives, embroidery and special linings can require a different method.'
      },
      {
        q: 'How often should I wash a denim vest?',
        a: 'Wash when odour or widespread soil requires it rather than on a fixed schedule. Brushing, airing and spot cleaning between washes can preserve colour and shape.'
      },
      {
        q: 'Can I put a denim vest in a dryer?',
        a: 'Only if the care label permits it. Air drying in shade is the lower-risk choice for shrinkage, colour, patches and structured panels.'
      },
      {
        q: 'How do I stop dark denim from fading?',
        a: 'Wash less often, turn it inside out when permitted, use cold water and mild detergent, and dry away from direct sun. Some colour evolution is normal for indigo denim.'
      },
      {
        q: 'What if my vest has leather trim or armour?',
        a: 'Remove armour when designed to be removable and follow its separate care instructions. A vest with leather trim may need spot cleaning or professional care rather than full immersion.'
      }
    ],
    pull: 'The safest clean is the least aggressive method that removes the soil without ignoring the label.',
    nextTitle: 'Keep your vest ready for the next mile.',
    nextBody: 'Explore MOTOGRIP GEAR motorcycle vests or ask our team about material, fit and care before ordering.',
    nextPrimary: 'Shop vests',
    nextPrimaryCat: 'Vests',
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
