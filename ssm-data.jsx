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
    heroAlt: 'Man wearing a fitted espresso leather cafe racer jacket in a warm MOTOGRIP GEAR studio',
    cardImage: '/assets/generated/blog/first-leather-jacket-card.jpg',
    cardImageAlt: 'First leather jacket editorial cover featuring a man in an espresso cafe racer jacket',
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
    cardImage: '/assets/generated/blog/denim-vest-hot-weather-card.jpg',
    cardImageAlt: 'Denim vest in hot weather editorial cover featuring a man in a closed dark-indigo vest',
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
    cardImage: '/assets/generated/blog/denim-vest-care-card.jpg',
    cardImageAlt: 'Clean a denim motorcycle vest editorial cover featuring a man holding a garment brush',
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
  {
    id: 'biker-vest-vs-motorcycle-vest',
    cat: 'Vest Guide',
    title: 'Biker vest or motorcycle vest: which one fits your ride?',
    seoTitle: 'Biker Vest vs Motorcycle Vest: Key Differences | MOTOGRIP GEAR',
    metaDescription: 'Compare biker vests and motorcycle vests by purpose, fit, closures, storage, materials and protection limits before choosing the right riding layer.',
    dek: 'A practical field guide to culture-led biker silhouettes, function-led motorcycle vests and the hybrid designs that combine both.',
    duration: '11 min',
    date: 'August 4, 2026',
    isoDate: '2026-08-04',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/biker-vs-motorcycle-vest-hero.jpg',
    heroAlt: 'Two men wearing distinct black leather biker and motorcycle utility vests in the MOTOGRIP GEAR studio',
    cardImage: '/assets/generated/blog/biker-vs-motorcycle-vest-card.jpg',
    cardImageAlt: 'Biker vest versus motorcycle vest editorial cover with two men wearing closed black leather vests',
    quickAnswer: 'The terms overlap, so the product name is only a starting point. A biker vest often prioritizes a clean traditional silhouette, identity and space for personalization; a function-led motorcycle vest usually adds secure closures, organized storage, reinforced panels and a riding-position fit. Many modern vests are hybrids. Judge the actual construction and intended use, and remember that a sleeveless vest does not provide arm coverage or automatically qualify as protective equipment.',
    body: [
      '“Biker vest” and “motorcycle vest” are often used as if they describe two fixed categories. In practice, brands, riders and regions use the words differently. One label may describe heritage and community, while the other suggests road-focused function—but neither name guarantees a particular material, feature set or level of protection.',
      'A better buying method is to start with the job you need the vest to do. This guide separates style, construction, fit and use so you can compare real garments rather than relying on a product title.'
    ],
    sections: [
      {
        title: '1. Start with the job, not the label',
        paragraphs: [
          'Write down where and how you expect to wear the vest. A social or casual layer has different priorities from a piece used for regular highway miles, commuting or carrying daily essentials. Climate, riding posture, planned layers and personalization all affect the right choice.',
          'Then inspect the specifications and photographs. Look for closure type, pocket security, panel layout, lining, adjustment points and the manufacturer’s intended-use statement. These details tell you more than the words biker or motorcycle.'
        ],
        bullets: [
          'For heritage style: prioritize silhouette, clean panels and comfortable everyday layering.',
          'For road utility: prioritize secure closures, stable pockets and freedom of movement in riding posture.',
          'For personalization: confirm usable panel space and how added stitching may affect linings or pockets.',
          'For protection: look for explicit, verifiable product claims rather than assuming leather or a motorcycle label is enough.'
        ]
      },
      {
        title: '2. What usually defines a biker vest',
        paragraphs: [
          'A traditional biker vest often communicates heritage through a simple waistcoat or club-style shape. Common cues include a V-neck or low collar, snap front, minimal exterior storage and broad uninterrupted panels. The visual focus is clean and familiar rather than technical.',
          'That simplicity can make the garment easy to layer and personalize, but it does not mean every biker vest is built the same way. Leather weight, lining, seam strength and hardware quality still vary widely, so inspect the individual piece.'
        ]
      },
      {
        title: '3. What usually defines a motorcycle utility vest',
        paragraphs: [
          'A function-led motorcycle vest typically puts greater emphasis on control and organization while moving. A full zipper or covered main closure, zippered pockets, reinforced shoulder areas, internal storage and a higher collar are common—but not universal—features.',
          'The word motorcycle should not be treated as a certification. If abrasion resistance, impact protection or another safety performance matters, verify the exact standard, test claim and protector compatibility stated by the manufacturer.'
        ]
      },
      {
        title: '4. Compare the construction side by side',
        paragraphs: [
          'The difference becomes clearer when two exterior designs are viewed side by side. A heritage-led vest may use fewer components and leave cleaner front and back panels. A utility design may divide the shell into reinforced sections and add secure exterior storage.',
          'Neither approach is automatically better. Fewer seams can create a cleaner canvas; additional panels can add shape and feature support. Quality depends on how accurately the exterior panels meet, how visible stress points are reinforced and whether the hardware operates smoothly.'
        ],
        image: '/assets/generated/blog/biker-vs-motorcycle-vest-construction.jpg',
        imageAlt: 'Closed traditional snap-front leather biker vest and closed zip-front motorcycle utility vest arranged side by side',
        imageCaption: 'Read the exterior, not just the name: closures, panel layout, pockets and reinforcement reveal each vest’s priorities.',
        imageRatio: '4 / 3'
      },
      {
        title: '5. Fit must work in the riding position',
        paragraphs: [
          'Try the vest over the base layer or jacket you actually plan to wear. In a seated riding posture, the neck should not push upward, the armholes should not bite, and the hem should not bunch heavily at the waist. You should be able to reach forward without the back pulling tight.',
          'A close fit reduces flapping, but tight is not the same as secure. Leave enough room for breathing and shoulder movement. If the vest will alternate between a T-shirt and a jacket, side adjustments or a carefully chosen size can make it more versatile.'
        ]
      },
      {
        title: '6. Storage and closures change the experience',
        paragraphs: [
          'Open pockets are convenient off the bike but can lose contents when exposed to wind and movement. For anything important, choose a pocket with a dependable zipper, snap or internal placement. Check whether a loaded pocket presses against your body or interferes with the tank, seat or jacket beneath it.',
          'Operate every closure while wearing gloves if that reflects your use. Hardware should move cleanly without forcing the leather. Decorative buckles can contribute style, but the primary closure still needs to remain stable and practical.'
        ]
      },
      {
        title: '7. Choose materials for climate and maintenance',
        paragraphs: [
          'Leather brings structure, wind resistance and a surface that develops character, but hide type, thickness, finish and lining strongly influence comfort. A heavy lined vest may suit cool conditions while becoming tiring in heat. Textile or denim options can feel lighter, although their performance also depends on weight, weave and construction.',
          'Read the care label before buying. Consider how the shell reacts to rain, how the lining manages perspiration and whether trims require specialist cleaning. A vest that suits your maintenance routine is more likely to stay in regular use.'
        ]
      },
      {
        title: '8. Plan personalization before the first stitch',
        paragraphs: [
          'If you intend to add approved patches or embroidery, map the location before work begins. Interior pockets, linings, seams and reinforcement layers may sit behind the visible panel. Stitching through them without planning can reduce pocket function or create uncomfortable edges.',
          'Use a professional familiar with leather and confirm that every emblem or design is yours to use. Where club or association rules apply, follow their permission and placement requirements rather than treating another group’s identity as decoration.'
        ]
      },
      {
        title: '9. Understand the protection boundary',
        paragraphs: [
          'A sleeveless vest leaves the arms and much of the shoulder area without garment coverage. Leather alone does not establish certified abrasion or impact performance, and ordinary fashion padding is not the same as tested armour. A vest should not be presented as a substitute for the protective equipment appropriate to your ride.',
          'For safety-critical use, check the manufacturer’s declared purpose, compatible protectors and applicable certification information. Combine the vest with suitable jacket, gloves, trousers, footwear and helmet according to your conditions and local requirements.'
        ]
      },
      {
        title: '10. A hybrid is often the most useful answer',
        paragraphs: [
          'Many current designs combine a recognizable biker silhouette with secure motorcycle-friendly storage, durable hardware and a riding-aware cut. That overlap is useful: you do not need to choose culture or function when the garment handles both honestly.',
          'The best vest is the one whose real construction matches your use, fits correctly over your intended layers and makes no unsupported performance promises. Compare those facts first; choose the visual language second.'
        ]
      }
    ],
    checklistEyebrow: 'VEST BUYING CHECKLIST',
    checklistTitle: 'Choose from the construction outward.',
    checklist: [
      'The vest’s intended use matches how and where I will wear it.',
      'The closure remains stable and easy to operate.',
      'Important pockets close securely and stay comfortable when loaded.',
      'The armholes, neck and hem work in a seated riding position.',
      'There is room for my planned base layer or jacket.',
      'The material, lining and care requirements suit my climate and routine.',
      'Any protection claim is explicit and verifiable—not inferred from the product name.',
      'Personalization will not damage pockets, lining or protected identities.'
    ],
    faqEyebrow: 'BIKER & MOTORCYCLE VEST FAQ',
    faq: [
      {
        q: 'Are biker vests and motorcycle vests the same thing?',
        a: 'The terms overlap and are not governed by one universal definition. Compare the actual closure, pockets, fit, materials, panel layout and intended-use statement.'
      },
      {
        q: 'Can I wear a biker vest for motorcycle riding?',
        a: 'You can wear one as a layer if it fits your use and local requirements, but its name does not make it protective equipment. Consider secure storage, movement, flapping and the protective gear worn with it.'
      },
      {
        q: 'Should a leather motorcycle vest fit tightly?',
        a: 'It should feel stable without restricting breathing, shoulder movement or forward reach. Test it in a riding posture over the layers you plan to use.'
      },
      {
        q: 'Is a zipper better than snaps?',
        a: 'A zipper generally provides continuous closure, while snaps offer traditional styling and quick ventilation. Quality, placement and intended use matter more than declaring one universally better.'
      },
      {
        q: 'Does a leather vest provide motorcycle protection?',
        a: 'Not automatically. A sleeveless vest leaves the arms exposed, and leather alone does not prove certified abrasion or impact performance. Verify the exact manufacturer claims and use appropriate protective equipment.'
      }
    ],
    pull: 'Choose the vest by what it does on your body and on your ride—not by the label printed above it.',
    nextTitle: 'Find the vest that matches your miles.',
    nextBody: 'Explore MOTOGRIP GEAR leather motorcycle vests or start a custom consultation for fit, storage and material guidance.',
    nextPrimary: 'Shop vests',
    nextPrimaryCat: 'Vests',
  },
  {
    id: 'how-to-sew-patches-on-leather-motorcycle-jacket',
    cat: 'Workshop Guide',
    title: 'How should patches be sewn onto a leather motorcycle jacket?',
    seoTitle: 'How to Sew Patches on a Leather Motorcycle Jacket | MOTOGRIP GEAR',
    metaDescription: 'Learn how to plan patch placement and sew a patch onto a leather motorcycle jacket without damaging pockets, lining, seams or the leather finish.',
    dek: 'A careful workshop method for clean placement, controlled stitching and a professional exterior finish.',
    duration: '12 min',
    date: 'August 4, 2026',
    isoDate: '2026-08-04',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/patch-sewing-leather-jacket-hero.jpg',
    heroAlt: 'Leather craftsperson hand sewing a plain geometric patch onto the exterior back panel of a black leather motorcycle jacket',
    cardImage: '/assets/generated/blog/patch-sewing-leather-jacket-card.jpg',
    cardImageAlt: 'Sew patches on leather editorial cover in the MOTOGRIP GEAR workshop style',
    quickAnswer: 'Plan the placement with the jacket worn, inspect what sits behind the panel, and use a leather needle with strong polyester or bonded nylon thread. Stitch inside the patch border with even spacing and avoid armour pockets, functional pockets, major seams and hidden reinforcement. Hand sewing offers control; a walking-foot or compound-feed machine is better left to an experienced leather professional. Never assume glue alone will hold safely or that every emblem is yours to use.',
    body: [
      'A patch can personalize a leather motorcycle jacket, but every needle hole is permanent. Clean work begins before the first stitch: confirm the design is yours to use, choose a location that works on the body, and understand every layer behind the visible leather.',
      'This guide focuses on exterior patch installation. If the jacket contains armour, complex pockets, bonded membranes or a fixed lining that blocks access, professional leather alteration is the lower-risk route.'
    ],
    sections: [
      {
        title: '1. Confirm permission and purpose',
        paragraphs: [
          'Use only artwork, names and symbols you own or have permission to display. Club, association and service insignia may have membership and placement rules; they should never be treated as generic decoration.',
          'Decide whether the patch is decorative, reflective or intended to identify an authorized group. That purpose affects location, visibility and whether a professional should complete the work.'
        ]
      },
      {
        title: '2. Test the placement while wearing the jacket',
        paragraphs: [
          'Put the jacket on over the layer you normally wear and have someone hold the patch in position. Check it while standing and in a riding posture. A patch that looks centered on a flat table may shift visually when the shoulders curve forward.',
          'Mark a few reference points with removable leather-safe tape or tailor chalk. Test any product on a hidden area first, and never use pins because they create unwanted holes.'
        ],
        bullets: [
          'Keep the patch clear of zippers, vents, pocket openings and adjustment hardware.',
          'Leave enough space from major seams for the presser foot or hand needle to move cleanly.',
          'Confirm the design remains level when the jacket is worn.',
          'Check that the patch will not fold sharply at the shoulder, elbow or waist.'
        ]
      },
      {
        title: '3. Inspect every layer behind the leather',
        paragraphs: [
          'Before stitching, feel and inspect the reverse side of the chosen panel. Hidden pockets, armour sleeves, wiring channels, insulation and reinforcement can sit behind an apparently clear exterior area. Sewing through them can close a pocket, restrict protector access or create an uncomfortable ridge.',
          'Do not cut or open a fixed lining unless you understand how it will be restored. A leather specialist can access and reseal a complex panel more cleanly.'
        ]
      },
      {
        title: '4. Choose tools that make controlled holes',
        paragraphs: [
          'For hand work, use a sharp leather needle sized to the patch and shell, plus strong polyester or bonded nylon thread. A thimble or stitching palm helps control pressure. For machine work, a leather needle and walking-foot or compound-feed machine reduce layer shift.',
          'Test the complete needle-and-thread combination on comparable scrap leather. The needle should pass cleanly without tearing the patch border, while the thread should sit flat rather than cutting into the leather.'
        ]
      },
      {
        title: '5. Secure temporarily, then stitch the border',
        paragraphs: [
          'Use a small amount of removable leather-safe placement tape to prevent movement. Avoid general-purpose glue: it can stain the finish, harden the panel and make later repair difficult. Adhesive is a positioning aid, not the structural attachment.',
          'Begin at a low-visibility point and stitch just inside the patch border. Keep spacing and tension even. Pulling too tightly can pucker the jacket; loose loops can catch during wear. Pause often to confirm that no pocket or lining has been trapped.'
        ]
      },
      {
        title: '6. Finish without weakening the panel',
        paragraphs: [
          'Lock the thread securely on the protected side of the work without building a bulky knot against the body. Trim cleanly and inspect the complete border for skipped areas, distorted corners or loose loops.',
          'Avoid adding a second line of random corrective holes. If the alignment is wrong, stop and seek professional help; repeated perforation can create a tear line in the leather.'
        ]
      },
      {
        title: '7. Care for the patched jacket',
        paragraphs: [
          'Follow the jacket and patch care labels together. Do not machine wash a leather jacket. Brush dust from the patch, wipe the surrounding leather carefully and keep conditioner off textile embroidery unless its maker permits it.',
          'Inspect the border periodically, especially after wet weather or heavy use. Repair a loose section early before the thread pulls through additional holes.'
        ]
      }
    ],
    checklistEyebrow: 'PATCH WORK CHECKLIST',
    checklistTitle: 'Measure twice. Make permanent holes once.',
    checklist: [
      'I own or have permission to use the patch design.',
      'Placement has been checked while the jacket is worn and in riding posture.',
      'No pocket, armour sleeve, vent, major seam or hidden component sits behind the patch.',
      'Leather-safe temporary tape, not pins or permanent glue, holds the placement.',
      'The needle and thread combination has been tested on comparable scrap.',
      'Stitch length and tension remain even around the complete border.',
      'The finished patch does not restrict movement or access to jacket features.'
    ],
    faqEyebrow: 'LEATHER PATCH FAQ',
    faq: [
      {
        q: 'Can I use fabric glue instead of sewing?',
        a: 'Glue alone is not a dependable long-term attachment for a flexing leather jacket and may stain or harden the finish. Leather-safe temporary tape can assist placement before stitching.'
      },
      {
        q: 'Can a domestic sewing machine sew a leather jacket patch?',
        a: 'Some machines cannot feed or penetrate the combined layers consistently. A walking-foot or compound-feed leather machine is more suitable; if you are unsure, use an experienced leather professional.'
      },
      {
        q: 'Should the lining be removed first?',
        a: 'Only when necessary and by someone able to restore it correctly. Never stitch blindly through a lining because pockets, armour sleeves or other components may be trapped.'
      },
      {
        q: 'Where should a large back patch sit?',
        a: 'There is no universal position. Center it while the jacket is worn, keep it clear of functional seams and vents, and follow any authorized organization placement rules.'
      },
      {
        q: 'Will patch stitching make the jacket waterproof?',
        a: 'No. Needle holes can create water-entry points, and an ordinary leather jacket should not be described as waterproof unless the manufacturer explicitly supports that claim.'
      }
    ],
    pull: 'The professional result comes from placement and restraint—not from making more holes.',
    nextTitle: 'Need clean leather personalization?',
    nextBody: 'Ask MOTOGRIP GEAR about custom consultation, suitable panel placement and professional leather alteration options.',
    nextPrimary: 'Custom consultation',
    nextPrimaryCat: 'Custom / Concierge',
  },
  {
    id: 'how-to-clean-suede-leather-jacket',
    cat: 'Leather Care',
    title: 'How should a suede leather jacket be cleaned safely?',
    seoTitle: 'How to Clean a Suede Leather Jacket Safely | MOTOGRIP GEAR',
    metaDescription: 'Learn a low-risk method for brushing, spot cleaning, drying and restoring the nap of a suede leather jacket without soaking or flattening it.',
    dek: 'A material-first care guide for removing surface dust and small marks while protecting suede colour, texture and shape.',
    duration: '10 min',
    date: 'August 4, 2026',
    isoDate: '2026-08-04',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/clean-suede-leather-jacket-hero.jpg',
    heroAlt: 'Leather care specialist gently brushing the exterior of a tobacco-brown suede motorcycle jacket',
    cardImage: '/assets/generated/blog/clean-suede-leather-jacket-card.jpg',
    cardImageAlt: 'Clean suede safely editorial cover with a brown suede jacket and suede brush',
    quickAnswer: 'Read the care label first, let dry dirt dry completely, then lift surface dust with a clean suede brush using light strokes in one direction. Treat a small mark with a suede eraser only after testing a hidden area. Blot fresh moisture—never rub or soak—and air dry naturally away from heat and direct sun. Oil, dye transfer, widespread staining, vintage suede and uncertain finishes should go to a professional suede cleaner.',
    body: [
      'Suede is leather with a raised fibrous surface. That soft nap gives it depth and character, but it also reacts visibly to pressure, moisture, oils and aggressive cleaners. A method that works on smooth leather can permanently darken or flatten suede.',
      'The safest approach is progressive: identify the material, start dry, work locally and stop before a small mark becomes a large colour change.'
    ],
    sections: [
      {
        title: '1. Confirm that the jacket is suede',
        paragraphs: [
          'Check the care label and product information. Suede, nubuck, split leather and synthetic microsuede can look similar but require different products. If the finish is unknown, do not experiment on a visible panel.',
          'Inspect trims as well. Smooth leather, textile ribs, embroidery, adhesives and coated hardware may limit which cleaner can be used on the complete jacket.'
        ]
      },
      {
        title: '2. Prepare the jacket while it is dry',
        paragraphs: [
          'Empty every pocket, close the main zipper and support the jacket on a broad hanger or clean flat surface. Allow mud or damp soil to dry naturally before brushing; rubbing wet soil drives it deeper into the nap.',
          'Use a dedicated clean suede brush. Brush lightly in one direction to remove loose dust, then vary the direction gently only where the nap needs lifting. Heavy pressure can polish the surface and create a darker patch.'
        ]
      },
      {
        title: '3. Treat small dry marks carefully',
        paragraphs: [
          'Test a suede eraser on a hidden area and compare it after the nap is brushed back. If colour remains stable, use short controlled movements on the mark rather than scrubbing a wide circle.',
          'Remove eraser residue with the suede brush. Stop if the surface becomes smooth, pale or visibly abraded. Deep pigment transfer and old set stains need specialist assessment.'
        ]
      },
      {
        title: '4. Respond to water without soaking',
        paragraphs: [
          'For fresh moisture, blot with a clean white absorbent cloth. Do not rub and do not use a hair dryer, radiator or direct sun. Shape the jacket and let it dry slowly at room temperature with airflow.',
          'When completely dry, brush the affected area gently to lift the nap. A hard water ring, colour migration or widespread wetting is a reason to use a professional cleaner rather than adding more liquid.'
        ]
      },
      {
        title: '5. Keep oils and household cleaners away',
        paragraphs: [
          'Do not apply smooth-leather conditioner, cooking starch, dish soap, alcohol, general stain remover or an unverified home mixture. These can darken suede, leave residue or disturb the dye and finish.',
          'Oil and grease stains are especially difficult because they travel through the fibre structure. Blot any excess without spreading it and consult a suede specialist promptly.'
        ]
      },
      {
        title: '6. Protect and store after cleaning',
        paragraphs: [
          'Once the jacket is clean and fully dry, a suede protector may be used only if the care label permits it. Test first, apply in a ventilated area according to the product instructions and never promise complete waterproofing.',
          'Store the jacket on a broad hanger in a cool, dry, ventilated place. Use a breathable garment cover rather than plastic, leave space around the nap and brush lightly before long-term storage.'
        ]
      }
    ],
    checklistEyebrow: 'SUEDE CARE CHECKLIST',
    checklistTitle: 'Start dry and stay gentle.',
    checklist: [
      'The label confirms the material and permits the planned method.',
      'The jacket and soil are completely dry before brushing.',
      'Every brush, eraser and cloth is clean and dedicated to suede care.',
      'Products are tested on a hidden area and allowed to dry before evaluation.',
      'Moisture is blotted, never rubbed, heated or soaked.',
      'Oil, widespread stains and uncertain finishes are referred to a professional.',
      'The jacket dries naturally and is stored in a breathable cover.'
    ],
    faqEyebrow: 'SUEDE JACKET CARE FAQ',
    faq: [
      {
        q: 'Can a suede jacket be washed in a washing machine?',
        a: 'No unless the manufacturer explicitly says otherwise. Immersion and machine action can distort the leather, change colour, flatten the nap and damage structure or trims.'
      },
      {
        q: 'Can I use water to clean suede?',
        a: 'Use as little moisture as possible and follow the care label. Fresh moisture should be blotted; widespread wet cleaning is better handled by a professional suede cleaner.'
      },
      {
        q: 'How do I restore flattened suede?',
        a: 'When the jacket is fully dry, lift the nap with light strokes from a clean suede brush. Stop if the surface appears abraded or colour changes.'
      },
      {
        q: 'Can I use ordinary leather conditioner on suede?',
        a: 'No. Products formulated for smooth leather can darken and flatten suede. Use only products specifically approved for the exact material and care label.'
      },
      {
        q: 'When should I use a professional cleaner?',
        a: 'Choose professional suede care for oil, ink, dye transfer, mould, widespread water marks, vintage garments, mixed materials or any finish you cannot identify confidently.'
      }
    ],
    pull: 'With suede, the least aggressive successful method is usually the best one.',
    nextTitle: 'Keep the nap rich and the colour balanced.',
    nextBody: 'Explore MOTOGRIP GEAR leather care guidance or ask our team about material-specific maintenance before treatment.',
    nextPrimary: 'Leather care',
    nextPrimaryCat: 'Leather Care',
  },
  {
    id: 'how-to-clean-mold-off-leather-jacket',
    cat: 'Leather Care',
    title: 'How should mold be removed from a leather jacket safely?',
    seoTitle: 'How to Remove Mold from a Leather Jacket Safely | MOTOGRIP GEAR',
    metaDescription: 'Learn how to isolate, clean, dry and store a mold-affected leather jacket while reducing health risks and avoiding damage to the leather finish.',
    dek: 'A safety-first guide to handling light surface mold, protecting the leather finish and knowing when professional treatment is the responsible choice.',
    duration: '11 min',
    date: 'August 4, 2026',
    isoDate: '2026-08-04',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/clean-mold-leather-jacket-hero.jpg',
    heroAlt: 'Leather care technician wearing gloves and a mask gently cleaning light surface mold from the exterior of a black leather jacket',
    cardImage: '/assets/generated/blog/clean-mold-leather-jacket-card.jpg',
    cardImageAlt: 'Remove mold from leather editorial cover showing safe exterior leather jacket cleaning',
    quickAnswer: 'Move the jacket away from other garments and work outside or in a well-ventilated area. Wear gloves and a well-fitting mask, then inspect the care label and test any approved cleaner on a hidden spot. For a small patch of surface growth, lift loose residue outdoors with a clean disposable cloth, apply only a leather-safe method permitted by the manufacturer, and let the jacket dry completely away from heat and direct sun. Widespread, recurring or deep growth—and any jacket with an unknown, suede or delicate finish—belongs with a professional leather cleaner.',
    body: [
      'Mold is not only a cosmetic stain. Disturbing it can release particles into the air, and moisture that remains inside seams or padding can allow it to return. The first priority is personal safety and stopping cross-contamination; preserving the finish comes second.',
      'This guide is for a small, recent patch on identifiable smooth leather. It is not a promise that every affected garment can be restored at home. People with asthma, mold allergies, weakened immunity or other respiratory concerns should not handle the jacket themselves.'
    ],
    sections: [
      {
        title: '1. Isolate the jacket before cleaning',
        paragraphs: [
          'Keep the jacket away from wardrobes, upholstery and clean garments. Carry it carefully in a washable container or disposable bag, but do not leave damp leather sealed in plastic for storage.',
          'Choose an outdoor or well-ventilated work area. Wear disposable gloves and a well-fitting protective mask. Never shake, beat or aggressively brush a mold-affected jacket indoors.'
        ]
      },
      {
        title: '2. Decide whether home care is appropriate',
        paragraphs: [
          'Check the care label and identify the material. Suede, nubuck, unfinished leather, vintage garments, pale dyes, mixed materials and jackets with insulated or removable armour systems need specialist judgment.',
          'Stop and contact a professional leather cleaner if growth covers more than a small area, has entered seams or lining, smells strongly after airing, returns after cleaning, or followed flooding or long-term damp storage.'
        ]
      },
      {
        title: '3. Remove loose surface residue with restraint',
        paragraphs: [
          'With the jacket supported on a clean surface, use a disposable white cloth to lift loose residue from the exterior. Work from the edge toward the centre so the affected area does not spread. Place used cloths directly into a waste bag.',
          'Do not use a household vacuum unless it is specifically designed and maintained for hazardous fine particles. Ordinary vacuum exhaust can redistribute contamination.'
        ]
      },
      {
        title: '4. Use only a leather-safe, tested method',
        paragraphs: [
          'Follow the jacket manufacturer or leather-care professional before choosing a product. Test the planned method on a hidden area, let it dry fully, and compare colour, sheen and feel before treating a visible panel.',
          'Do not mix cleaning chemicals. Avoid bleach, undiluted alcohol, household disinfectant, fragranced wipes and improvised acidic mixtures; they can strip dye, dry the hide, weaken finishes or create unsafe fumes. Never soak the jacket.'
        ]
      },
      {
        title: '5. Dry the jacket completely and naturally',
        paragraphs: [
          'Blot remaining moisture and support the jacket on a broad hanger in a ventilated room. Keep it away from radiators, hair dryers, tumble dryers and direct sunlight. Heat can shrink, harden or distort leather before hidden moisture has escaped.',
          'Allow extra time for cuffs, collars, pocket bags and layered seams. Do not return the jacket to a wardrobe until it is fully dry and free from musty odour.'
        ]
      },
      {
        title: '6. Restore the finish only after inspection',
        paragraphs: [
          'Once the leather is clean and completely dry, assess whether it feels unusually stiff or looks uneven. Use conditioner only when the care label permits it, and test a small hidden area first. Conditioner does not kill mold or replace cleaning.',
          'If staining, odour or surface growth remains, stop repeated home treatment. Multiple wet-cleaning attempts can do more damage than a timely professional assessment.'
        ]
      },
      {
        title: '7. Correct the storage conditions that caused it',
        paragraphs: [
          'Clean and dry the storage area before the jacket returns. Improve airflow, address leaks or condensation, and monitor humidity. Do not press leather against an exterior wall or trap it inside non-breathable plastic.',
          'Store the jacket on a broad hanger with space around it and use a breathable garment cover. Inspect it periodically during humid seasons so a small problem is found early.'
        ]
      }
    ],
    checklistEyebrow: 'MOLD RESPONSE CHECKLIST',
    checklistTitle: 'Protect yourself, then protect the leather.',
    checklist: [
      'The jacket is isolated from clean garments and living areas.',
      'Work happens outdoors or with strong ventilation, gloves and a protective mask.',
      'The material and care label are confirmed before treatment.',
      'Only a small surface area is treated at home; widespread growth goes to a professional.',
      'No chemicals are mixed and no bleach, heat or soaking is used.',
      'The jacket is fully air-dried before conditioning or storage.',
      'The original moisture source and storage humidity are corrected.'
    ],
    faqEyebrow: 'LEATHER MOLD CARE FAQ',
    faq: [
      {
        q: 'Can I brush mold off a leather jacket indoors?',
        a: 'No. Disturbing growth can release particles into the room and onto other belongings. Work outdoors or in a properly ventilated area while wearing suitable protection.'
      },
      {
        q: 'Can bleach be used on leather mold?',
        a: 'Bleach can damage dye, finish and fibre structure and should not be used unless the manufacturer explicitly specifies a compatible process. Never mix it with another cleaner.'
      },
      {
        q: 'Will leather conditioner remove mold?',
        a: 'No. Conditioner may restore feel after appropriate cleaning and complete drying, but it is not a mold treatment and can trap contamination if used too early.'
      },
      {
        q: 'Why did mold return after cleaning?',
        a: 'Hidden moisture, growth inside seams or lining, and humid storage can cause recurrence. Isolate the garment again, correct the environment and seek professional leather cleaning.'
      },
      {
        q: 'When should the jacket be professionally cleaned?',
        a: 'Use a specialist for widespread or recurring growth, strong odour, suede or nubuck, vintage leather, delicate dyes, uncertain finishes, flood exposure, or when health risks make home handling unsuitable.'
      }
    ],
    pull: 'A clean-looking surface is not enough—the jacket and its storage environment must both be completely dry.',
    nextTitle: 'Prevent the next moisture problem.',
    nextBody: 'Explore MOTOGRIP GEAR leather-care guidance for ventilation, drying, conditioning and long-term storage.',
    nextPrimary: 'Leather care',
    nextPrimaryCat: 'Leather Care',
  },
  {
    id: 'what-is-a-motorcycle-jacket',
    cat: 'Rider Education',
    title: 'What makes a motorcycle jacket different from a fashion jacket?',
    seoTitle: 'What Is a Motorcycle Jacket? Features, Fit and Protection | MOTOGRIP GEAR',
    metaDescription: 'Understand motorcycle jacket materials, fit, closures, reinforcement, armour compatibility and protection limits before choosing riding gear.',
    dek: 'A clear guide to the road-focused construction details that separate purpose-built riding gear from a leather jacket designed mainly for fashion.',
    duration: '9 min',
    date: 'August 4, 2026',
    isoDate: '2026-08-04',
    byline: 'MOTOGRIP GEAR Editorial',
    hero: '/assets/generated/blog/what-is-motorcycle-jacket-hero.jpg',
    heroAlt: 'Motorcyclist standing safely beside a parked motorcycle wearing a fitted black leather motorcycle jacket',
    cardImage: '/assets/generated/blog/what-is-motorcycle-jacket-card.jpg',
    cardImageAlt: 'What makes a motorcycle jacket editorial cover with a rider in black leather beside a classic motorcycle',
    quickAnswer: 'A motorcycle jacket is designed around riding posture and road use. Compared with a fashion jacket, it may use more abrasion-resistant materials, secure closures, reinforced impact zones, sleeves shaped for reach, waist and cuff adjustment, reflective or ventilation details, and pockets for compatible protectors. Those features vary by product: leather alone does not prove that a jacket is protective, and only documented testing, certification and supplied armour can support a specific safety claim.',
    body: [
      'Motorcycle jackets share a familiar silhouette with ordinary leather jackets, but their purpose changes the pattern, materials and hardware. A good riding jacket should remain secure and comfortable while the rider reaches the controls, turns the head and moves through changing weather.',
      'The category also contains very different levels of equipment. Some pieces are road-focused lifestyle jackets; others are certified protective garments. Buyers should judge the product specification—not the appearance or the word “biker”—before relying on it for protection.'
    ],
    sections: [
      {
        title: '1. Riding posture shapes the pattern',
        paragraphs: [
          'A riding jacket is evaluated with the arms forward, not only while standing. Extra reach through the shoulder, pre-curved or articulated sleeves and a back length that remains covered on the motorcycle can improve comfort and reduce pulling at the cuffs.',
          'The collar should turn comfortably with the rider’s head, and the front should not bunch excessively against the fuel tank. Different motorcycles create different postures, so a relaxed cruiser fit may not suit a committed sport position.'
        ]
      },
      {
        title: '2. Materials must match the intended use',
        paragraphs: [
          'Leather can offer durability and abrasion performance, but hide species, thickness, tanning, panel quality and seam construction all matter. Textile motorcycle jackets may use engineered fabrics, membranes and mesh panels to balance abrasion, weather and airflow.',
          'A soft fashion leather jacket can look authentic without being built for a slide. Ask for the exact material specification and any applicable test or certification information rather than assuming all leather performs alike.'
        ]
      },
      {
        title: '3. Closures should stay secure on the road',
        paragraphs: [
          'Main zippers, cuff closures and waist adjustment should be robust, easy to operate and positioned so they do not create pressure points. Covered zipper garages and locking pulls can improve comfort and stability, depending on the design.',
          'Pockets should close securely. An open fashion pocket can lose a phone or key quickly, while an overloaded chest pocket may become uncomfortable in riding position.'
        ]
      },
      {
        title: '4. Reinforcement and seams are structural details',
        paragraphs: [
          'Shoulders, elbows and other likely contact zones may use additional material, fewer decorative seams or stronger seam construction. A thick panel is only as dependable as the thread and seam holding it together.',
          'Inspect stitching for consistency and confirm whether decorative quilting is functional reinforcement or visual styling. Product descriptions should distinguish the two.'
        ]
      },
      {
        title: '5. Armour compatibility is not the same as armour supplied',
        paragraphs: [
          'Some jackets include tested shoulder and elbow protectors; others provide pockets only, and some have neither. Check the exact protectors supplied, their position, the standard claimed by the manufacturer and whether a back protector is included or optional.',
          'Protector pockets must hold armour over the intended body area in riding posture. A loose jacket can allow protection to move, while an undersized jacket can make movement and breathing difficult.'
        ]
      },
      {
        title: '6. Ventilation and weather control affect real-world use',
        paragraphs: [
          'Perforated panels, vents and breathable linings can improve hot-weather comfort. Storm flaps, compatible membranes and adjustable openings can reduce wind and rain entry, but “water-resistant” and “waterproof” are not interchangeable claims.',
          'Choose for the climate and trip length you actually ride. A single heavy leather jacket may not be the best answer for every season or region.'
        ]
      },
      {
        title: '7. Verify protection claims before buying',
        paragraphs: [
          'Look for a clear product specification covering garment certification, protectors, materials, fit and care. In markets that regulate motorcycle protective clothing, confirm the current label and documentation required for the exact product—not merely the brand or model family.',
          'No jacket prevents every injury. Protective clothing is one part of a complete system that includes a certified helmet, gloves, trousers, boots, training, visibility and responsible riding.'
        ]
      }
    ],
    checklistEyebrow: 'MOTORCYCLE JACKET CHECKLIST',
    checklistTitle: 'Choose the specification, not just the silhouette.',
    checklist: [
      'The jacket is comfortable with arms reaching the controls.',
      'Material and seam specifications match the intended riding use.',
      'Main, cuff and pocket closures remain secure.',
      'Any protectors supplied are identified and positioned correctly.',
      'The product clearly distinguishes armour-ready pockets from included armour.',
      'Ventilation and weather features suit the rider’s climate.',
      'Any certification or protective claim is documented for the exact model.'
    ],
    faqEyebrow: 'MOTORCYCLE JACKET FAQ',
    faq: [
      {
        q: 'Is every leather jacket a motorcycle jacket?',
        a: 'No. Many leather jackets are designed primarily for fashion and may not have riding posture, secure closures, reinforcement, protector pockets or documented protective testing.'
      },
      {
        q: 'Does a motorcycle jacket need armour?',
        a: 'Requirements vary by product and market, but included, correctly positioned protectors can add impact protection. Check what is supplied and which standards the exact protectors meet.'
      },
      {
        q: 'Should a motorcycle jacket fit tightly?',
        a: 'It should be secure enough to keep features in position without restricting breathing, reach or control movement. Test the fit in riding posture and allow only the layers you will actually wear.'
      },
      {
        q: 'Is leather always safer than textile?',
        a: 'No simple material rule decides safety. Construction, tested performance, coverage, fit and condition matter. Compare the documented specification of the complete garment.'
      },
      {
        q: 'Can one motorcycle jacket work all year?',
        a: 'Sometimes, with suitable vents and removable layers, but extreme heat, cold or rain often needs more specialized equipment. Choose around the conditions you ride most.'
      }
    ],
    pull: 'A motorcycle jacket earns the name through road-focused construction and documented performance—not through styling alone.',
    nextTitle: 'Choose for your ride, climate and fit.',
    nextBody: 'Compare MOTOGRIP GEAR road-cut silhouettes and review each product specification before choosing your riding layer.',
    nextPrimary: 'Shop motorcycle jackets',
    nextPrimaryCat: 'Jackets',
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
    { q: 'What warranty do you offer?', a: 'Each product includes a one-year workmanship warranty. Eligibility is confirmed after reviewing the order and issue.' },
    { q: 'Can you repair an item outside warranty?', a: 'Yes, suitable repair and restoration requests can be assessed. Scope, price, shipping responsibility, and timing are confirmed before work begins.' },
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

const SSM_PRESS = [];

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
