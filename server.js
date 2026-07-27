const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalMediaUrl } = require('./media-url');
const { createAdminSecurity, parseCookies, safeEqual } = require('./admin-security');
const { createAdminIdentity } = require('./admin-identity');
const { createAdminStagingBootstrap } = require('./admin-staging-bootstrap');
const { createAdminOwnerRecovery, OWNER_EMAIL } = require('./admin-owner-recovery');
const { createProductPlmAudit } = require('./product-plm-audit');
const { createProductPlmService } = require('./product-plm-service');
const { createProductPlmStore } = require('./product-plm-store');
const { createProductMvpReadModel } = require('./product-mvp-read-model');
const { createProductGovernanceService } = require('./product-governance-service');
const { createProductIdentityStore } = require('./product-identity-store');
const { createProductIdentityService } = require('./product-identity-service');
const { createListingStudioStore } = require('./listing-studio-store');
const { createListingStudioService } = require('./listing-studio-service');
const { createCatalogSyncStore } = require('./catalog-sync-store');
const { createCatalogSyncService } = require('./catalog-sync-service');
const { createCatalogLinkStore } = require('./catalog-link-store');
const { createCatalogLinkService } = require('./catalog-link-service');
const { createOperationalLaunchStore } = require('./operational-launch-store');
const { createOperationalLaunchService } = require('./operational-launch-service');
const { createWebsiteWriteAdapter } = require('./website-write-adapter');
const { createProductEditorV2Store } = require('./product-editor-v2-store');
const { createProductEditorV2Service } = require('./product-editor-v2-service');
const { createProductManagementGridService } = require('./product-management-grid-service');
const { createCategoryTaxonomyStore } = require('./category-taxonomy-store');
const { createCategoryTaxonomyService } = require('./category-taxonomy-service');
const { createTeamPermissionsService } = require('./team-permissions-service');
const { createAiProductCopilotStore } = require('./ai-product-copilot-store');
const { createAiProductCopilotService } = require('./ai-product-copilot-service');
const { createOpenAiVisionProvider } = require('./ai-product-copilot-provider');
const { createAiMediaStudioStore } = require('./ai-media-studio-store');
const { createAiMediaStudioService } = require('./ai-media-studio-service');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
const assetCdnBase = (process.env.ASSET_CDN_BASE || '').replace(/\/+$/, '');
const dataDir = process.env.ADMIN_DATA_DIR || path.join(root, 'data');
const storePath = path.join(dataDir, 'admin-store.json');
const merchantStorePath = path.join(root, 'merchant-catalog.json');
const adminIdentity = createAdminIdentity({ dataDir });
const teamPermissionsService = createTeamPermissionsService({ dataDir, identity: adminIdentity });
const adminSecurity = createAdminSecurity({
  dataDir,
  validateSession: (session) => {
    if (!adminIdentity.sessionIsValid(session)) return false;
    if (session.actorType !== 'named_user') return true;
    const user = adminIdentity.findById(session.userId);
    return teamPermissionsService.loginDecision(user, {}, 0).allowed;
  },
});
const adminStagingBootstrap = createAdminStagingBootstrap({
  dataDir,
  identity: adminIdentity,
  audit: (event) => adminSecurity.audit({ headers: {}, socket: {} }, {
    ...event,
    actorId: 'system:staging-owner-recovery',
  }),
});
const adminOwnerRecovery = createAdminOwnerRecovery({ identity: adminIdentity });
const productPlmStore = createProductPlmStore({ dataDir });
const productPlmAudit = createProductPlmAudit({ dataDir });
const productPlmService = createProductPlmService({
  store: productPlmStore,
  audit: productPlmAudit,
});
const productMvpReadModel = createProductMvpReadModel({
  plmStore: productPlmStore,
  readLegacyStore: readStore,
});
const productGovernanceService = createProductGovernanceService({
  store: productPlmStore,
  identity: adminIdentity,
});
const productIdentityStore = createProductIdentityStore({ dataDir });
const productIdentityService = createProductIdentityService({
  store: productIdentityStore,
  identity: adminIdentity,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const listingStudioStore = createListingStudioStore({ dataDir });
const listingStudioService = createListingStudioService({
  plmStore: productPlmStore,
  listingStore: listingStudioStore,
  identity: adminIdentity,
  productIdentityService,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const catalogSyncStore = createCatalogSyncStore({ dataDir });
const catalogSyncService = createCatalogSyncService({
  store: catalogSyncStore,
  readWebsiteCatalog: readPublicStore,
  readPlmStore: () => productPlmStore.read(),
});
const catalogLinkStore = createCatalogLinkStore({ dataDir });
const catalogLinkService = createCatalogLinkService({
  store: catalogLinkStore,
  catalogService: catalogSyncService,
  readPlmStore: () => productPlmStore.read(),
  authorizeOwner: (session) => Boolean(namedOwnerForSession(session)),
});
const operationalLaunchStore = createOperationalLaunchStore({ dataDir });
const websiteWriteAdapter = createWebsiteWriteAdapter({
  readStore,
  readWebsiteCatalog: readPublicStore,
  writeStore,
  onMutation: async () => {
    catalogLinkService.sync();
  },
});
const operationalLaunchService = createOperationalLaunchService({
  store: operationalLaunchStore,
  identity: adminIdentity,
  listingStore: listingStudioStore,
  listingService: listingStudioService,
  productIdentityService,
  catalogService: catalogSyncService,
  catalogLinkService,
  websiteAdapter: websiteWriteAdapter,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const productEditorV2Store = createProductEditorV2Store({ dataDir });
const productEditorV2Service = createProductEditorV2Service({
  store: productEditorV2Store,
  identity: adminIdentity,
  productIdentityService,
  productPlmStore,
  websiteAdapter: websiteWriteAdapter,
  operationalLaunchService,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const aiProductCopilotStore = createAiProductCopilotStore({ dataDir });
const aiProductCopilotProvider = createOpenAiVisionProvider();
const aiProductCopilotService = createAiProductCopilotService({
  store: aiProductCopilotStore,
  identity: adminIdentity,
  productStore: productEditorV2Store,
  plmStore: productPlmStore,
  provider: aiProductCopilotProvider,
  dataDir,
  rootDir: root,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const aiMediaStudioStore = createAiMediaStudioStore({ dataDir });
const aiMediaStudioService = createAiMediaStudioService({
  store: aiMediaStudioStore,
  identity: adminIdentity,
  productStore: productEditorV2Store,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const productManagementGridService = createProductManagementGridService({
  store: productEditorV2Store,
  identity: adminIdentity,
  editorService: productEditorV2Service,
  listingStore: listingStudioStore,
  readWebsiteCatalog: readPublicStore,
  websiteAdapter: websiteWriteAdapter,
  announce: operationalLaunchService.announce,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const categoryTaxonomyStore = createCategoryTaxonomyStore({ dataDir });
const categoryTaxonomyService = createCategoryTaxonomyService({
  store: categoryTaxonomyStore,
  identity: adminIdentity,
  readWebsiteCatalog: readPublicStore,
  readEditorProducts: () => productEditorV2Store.read(),
  announce: operationalLaunchService.announce,
  authorizeUser: (user, module, action) => teamPermissionsService.hasUserPermission(user, module, action),
});
const returnRequestAttempts = new Map();

function productEditorWorkspace(session, productId = null) {
  const workspace = productEditorV2Service.workspace(session, productId);
  try {
    const taxonomyWorkspace = categoryTaxonomyService.workspace(session);
    workspace.taxonomy = taxonomyWorkspace.categories
      .filter((category) => category.workflowState === 'live' && category.status === 'active')
      .map(({ id, name, hierarchyPath, slug }) => ({ id, name, hierarchyPath, slug }));
    const product = workspace.product;
    const identityIds = new Set([
      product?.websiteProductId,
      product?.productUuid,
      product?.id,
    ].filter(Boolean).map(String));
    workspace.assignedTaxonomy = taxonomyWorkspace.categories
      .filter((category) => category.products?.some((item) =>
        [item.id, item.websiteProductId, item.productUuid, item.editorProductId]
          .filter(Boolean).map(String).some((id) => identityIds.has(id))))
      .map(({ id, name, hierarchyPath, slug }) => ({ id, name, hierarchyPath, slug }));
  } catch { workspace.taxonomy = []; }
  if (workspace.product) {
    try { workspace.aiMediaStudio = aiMediaStudioService.workspace(session, workspace.product.id); }
    catch (error) {
      if (error.code !== 'FORBIDDEN') throw error;
      workspace.aiMediaStudio = null;
    }
    try { workspace.aiCopilot = aiProductCopilotService.workspace(session, workspace.product.id); }
    catch (error) {
      if (error.code !== 'FORBIDDEN') throw error;
      workspace.aiCopilot = null;
    }
  }
  return workspace;
}
function productGridWorkspace(session) {
  const grid = productManagementGridService.grid(session);
  try {
    const taxonomyWorkspace = categoryTaxonomyService.workspace(session);
    const taxonomy = taxonomyWorkspace.categories;
    grid.taxonomy = taxonomy.map(({ id, name, hierarchyPath }) => ({ id, name, hierarchyPath }));
    grid.products = grid.products.map((product) => {
      const identityIds = new Set([
        product.websiteProductId, product.productUuid, product.editorProductId, product.id,
      ].filter(Boolean).map(String));
      const assigned = taxonomy.filter((item) => item.products?.some((candidate) =>
        [candidate.id, candidate.websiteProductId, candidate.productUuid, candidate.editorProductId]
          .filter(Boolean).map(String).some((id) => identityIds.has(id))));
      const category = assigned[0] || taxonomy.find((item) =>
        item.name.toLowerCase() === String(product.category || '').toLowerCase());
      const projection = taxonomyWorkspace.products.find((candidate) =>
        [candidate.id, candidate.websiteProductId, candidate.productUuid, candidate.editorProductId]
          .filter(Boolean).map(String).some((id) => identityIds.has(id)));
      return {
        ...product,
        categoryProductId: projection?.id || null,
        categoryId: category?.id || null,
        categoryPath: category?.hierarchyPath || product.category,
        categoryIds: assigned.map((item) => item.id),
        categoryPaths: assigned.map((item) => item.hierarchyPath),
      };
    });
  } catch { grid.taxonomy = []; }
  return grid;
}
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const paypalApiBase = (process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com').replace(/\/+$/, '');

function indexingDisabled() {
  return String(process.env.DISABLE_INDEXING || '').toLowerCase() === 'true';
}

const publicRoutes = {
  '/': { view: 'home', title: 'MOTOGRIP GEAR — Premium Motorcycle Leather Gear', desc: 'Premium motorcycle leather jackets, vests, trousers, and made-to-measure gear built for fit, movement, and lasting road use.' },
  '/shop': { view: 'shop', title: 'Shop Motorcycle Leather Gear | MOTOGRIP GEAR', desc: 'Shop premium leather jackets, motorcycle vests, trousers, coats, and made-to-measure gear from MOTOGRIP GEAR.' },
  '/women': { view: 'shop', params: { gender: 'Women' }, title: "Women's Motorcycle Leather Gear | MOTOGRIP GEAR", desc: "Shop women's leather motorcycle jackets, vests, and trousers designed for movement, structure, and precise fit." },
  '/men': { view: 'shop', params: { gender: 'Men' }, title: "Men's Motorcycle Leather Gear | MOTOGRIP GEAR", desc: "Shop men's leather motorcycle jackets, cafe racers, vests, coats, and trousers built for fit, reach, and road use." },
  '/jackets': { view: 'shop', params: { cat: 'Jackets' }, title: 'Leather Motorcycle Jackets | MOTOGRIP GEAR', desc: 'Explore premium leather motorcycle jackets, cafe racers, bombers, and biker silhouettes with standard and made-to-measure sizing.' },
  '/vests': { view: 'shop', params: { cat: 'Vests' }, title: 'Leather Motorcycle Vests | MOTOGRIP GEAR', desc: 'Explore premium leather motorcycle vests and biker waistcoats with functional pockets, durable hardware, and custom sizing.' },
  '/pants': { view: 'shop', params: { cat: 'Pants' }, title: 'Leather Motorcycle Trousers | MOTOGRIP GEAR', desc: 'Shop leather motorcycle trousers and riding pants designed for durable wear, mobility, and measured fit.' },
  '/made-to-measure': { view: 'mto', title: 'Made-to-Measure Leather Gear | MOTOGRIP GEAR', desc: 'Create made-to-measure leather jackets, vests, and trousers with guided measurements, material choices, and custom details.' },
  '/lookbook': { view: 'lookbook', title: 'Leather Gear Lookbook | MOTOGRIP GEAR', desc: 'Explore MOTOGRIP GEAR leather jackets, vests, and riding silhouettes in premium editorial and road-inspired settings.' },
  '/blog': { view: 'journal', title: 'Leather & Motorcycle Gear Guides | MOTOGRIP GEAR', desc: 'Read original fit, leather care, craftsmanship, product-testing, and motorcycle gear guides from MOTOGRIP GEAR.' },
  '/blog/how-to-buy-your-first-leather-jacket': {
    view: 'article',
    params: { articleId: 'how-to-buy-your-first-leather-jacket' },
    title: 'How to Buy Your First Leather Jacket | MOTOGRIP GEAR',
    desc: 'Learn how to choose leather type, fit, lining, hardware and construction before buying your first leather jacket with this practical MOTOGRIP GEAR guide.',
    image: '/assets/generated/blog/first-leather-jacket-hero.jpg',
    article: {
      headline: 'How to Buy Your First Leather Jacket',
      datePublished: '2026-07-25',
      dateModified: '2026-07-25',
      author: 'MOTOGRIP GEAR Editorial',
    },
  },
  '/blog/denim-motorcycle-vests-hot-humid-weather': {
    view: 'article',
    params: { articleId: 'denim-motorcycle-vests-hot-humid-weather' },
    title: 'Denim Motorcycle Vests in Hot, Humid Weather | MOTOGRIP GEAR',
    desc: 'Learn how denim weight, lining, fit and base layers affect motorcycle-vest comfort in hot, humid weather—and where a vest does not replace protective riding gear.',
    image: '/assets/generated/blog/denim-vest-hot-weather-hero.jpg',
    article: {
      headline: 'Do Denim Motorcycle Vests Work in Hot, Humid Weather?',
      datePublished: '2026-07-25',
      dateModified: '2026-07-25',
      author: 'MOTOGRIP GEAR Editorial',
    },
  },
  '/blog/how-to-clean-denim-motorcycle-vest': {
    view: 'article',
    params: { articleId: 'how-to-clean-denim-motorcycle-vest' },
    title: 'How to Clean a Denim Motorcycle Vest Safely | MOTOGRIP GEAR',
    desc: 'Clean a denim motorcycle vest without damaging its colour, patches, hardware or shape. Compare spot cleaning, hand washing, machine washing and safe drying.',
    image: '/assets/generated/blog/denim-vest-care-hero.jpg',
    article: {
      headline: 'How Should You Clean and Care for a Denim Motorcycle Vest?',
      datePublished: '2026-07-25',
      dateModified: '2026-07-25',
      author: 'MOTOGRIP GEAR Editorial',
    },
  },
  '/brand': { view: 'about', title: 'About MOTOGRIP GEAR | Motorcycle Leather Craftsmanship', desc: 'Discover MOTOGRIP GEAR, a premium leather brand focused on authentic craftsmanship, functional design, precise fit, and lasting value.' },
  '/leather-care': { view: 'care', title: 'Leather Care Guide | MOTOGRIP GEAR', desc: 'Learn how to clean, condition, store, and protect motorcycle leather jackets, vests, and trousers.' },
  '/repairs': { view: 'repairs', title: 'Leather Repairs & Restoration | MOTOGRIP GEAR', desc: 'Review MOTOGRIP GEAR repair, restoration, replaceable hardware, and long-term leather care guidance.' },
  '/custom-consultation': { view: 'consult', title: 'Custom Leather Consultation | MOTOGRIP GEAR', desc: 'Start a custom leather jacket, vest, or trouser consultation with MOTOGRIP GEAR fit and design guidance.' },
  '/sustainability': { view: 'sustain', title: 'Durability & Sustainability | MOTOGRIP GEAR', desc: 'Learn how durable materials, repairable construction, and measured fit help MOTOGRIP gear stay in use longer.' },
  '/stockists': { view: 'stockists', title: 'MOTOGRIP GEAR Stockists & Fitting Locations', desc: 'Find MOTOGRIP GEAR fitting locations, showroom appointments, stockists, and upcoming trunk shows.' },
  '/press': { view: 'press', title: 'Press & Brand Resources | MOTOGRIP GEAR', desc: 'Access MOTOGRIP GEAR brand notes, product information, imagery guidance, and press contact details.' },
  '/gift-cards': { view: 'giftcard', title: 'MOTOGRIP GEAR Gift Cards', desc: 'Give premium motorcycle leather gear while letting the recipient choose the style, fit, and details.' },
  '/faq': { view: 'faq', title: 'Frequently Asked Questions | MOTOGRIP GEAR', desc: 'Answers about MOTOGRIP sizing, leather, custom orders, production, shipping, returns, repairs, and product care.' },
  '/size-guide': { view: 'size', title: 'Leather Jacket, Vest & Trouser Size Guide | MOTOGRIP GEAR', desc: 'Use MOTOGRIP GEAR size charts and measurement guidance for men’s and women’s leather jackets, vests, trousers, and chaps.' },
  '/shipping-information': { view: 'ship', title: 'Worldwide Delivery Policy | MOTOGRIP GEAR', desc: 'Read MOTOGRIP GEAR worldwide shipping terms, dispatch estimates, express courier service, customs-duty coverage, parcel claims, and delivery requirements.' },
  '/returns-refunds': { view: 'returns', title: 'Returns & Refunds Policy | MOTOGRIP GEAR', desc: 'Review MOTOGRIP GEAR return eligibility, instructions, exclusions, exchanges, and refund processing information.' },
  '/privacy': { view: 'privacy', title: 'Privacy Policy | MOTOGRIP GEAR', desc: 'Learn how MOTOGRIP GEAR collects, uses, shares, and protects personal information.' },
  '/terms': { view: 'terms', title: 'Terms of Service | MOTOGRIP GEAR', desc: 'Read the terms governing use of the MOTOGRIP GEAR website, products, orders, and services.' },
  '/contact': { view: 'contact', title: 'Contact MOTOGRIP GEAR', desc: 'Contact MOTOGRIP GEAR for sizing, custom orders, product support, wholesale enquiries, press, and service.' },
  '/account': { view: 'account', noindex: true, title: 'Your Account | MOTOGRIP GEAR', desc: 'Access your MOTOGRIP GEAR account and order information.' },
  '/checkout': { view: 'checkout', noindex: true, title: 'Checkout | MOTOGRIP GEAR', desc: 'Complete your MOTOGRIP GEAR order securely.' },
  '/file-a-return': { view: 'file-return', noindex: true, title: 'File a Return | MOTOGRIP GEAR', desc: 'Submit a return, exchange, store-credit, or fit-alteration request.' },
  '/track-order': { view: 'track', noindex: true, title: 'Track Your Order | MOTOGRIP GEAR', desc: 'Check the current fulfillment and delivery status of your MOTOGRIP GEAR order.' },
};

const indexablePublicPaths = Object.entries(publicRoutes).filter(([, route]) => !route.noindex).map(([routePath]) => routePath);

const stripeShippingCountries = [
  'US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE',
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'PL', 'CZ', 'GR', 'RO', 'HU',
  'AE', 'SA', 'QA', 'BH', 'KW', 'OM', 'PK', 'IN', 'JP', 'KR', 'SG', 'MY',
  'TH', 'ID', 'PH', 'HK', 'TW', 'ZA', 'MX', 'BR', 'AR', 'CL',
];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function defaultStore() {
  return {
    settings: {
      storeName: 'MOTOGRIP GEAR',
      currency: 'USD',
      madeToMeasureSurcharge: 50,
      madeToMeasureLeadTime: '2-3 weeks',
      supportEmail: 'support@motogripgear.com',
      brandVoice: 'Direct, road-tested, fit-aware, and precise.',
      imageryPrompt: 'Premium light-theme studio product photography for MOTOGRIP GEAR: warm ivory backdrop, road-ready leather jackets, crisp grain detail, natural daylight, soft shadow, editorial ecommerce crop, no dark background.',
    },
    products: [],
    orders: [],
    returnRequests: [],
    activity: [
      {
        id: 'act-1',
        at: new Date().toISOString(),
        type: 'system',
        message: 'Admin backend initialized',
      },
    ],
  };
}

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(storePath)) writeStore(defaultStore());
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function readPublicStore() {
  const runtimeStore = readStore();
  let seedStore = { settings: {}, products: [] };
  try {
    seedStore = JSON.parse(fs.readFileSync(merchantStorePath, 'utf8'));
  } catch {
    // The runtime admin store remains usable if the repository seed is absent.
  }

  const productsBySlug = new Map();
  for (const product of seedStore.products || []) productsBySlug.set(product.slug, product);
  for (const product of runtimeStore.products || []) productsBySlug.set(product.slug, product);

  return {
    ...seedStore,
    ...runtimeStore,
    settings: { ...(seedStore.settings || {}), ...(runtimeStore.settings || {}) },
    products: [...productsBySlug.values()],
  };
}

function readMerchantCatalog() {
  try {
    return JSON.parse(fs.readFileSync(merchantStorePath, 'utf8'));
  } catch {
    const unavailable = new Error('Merchant catalog source is unavailable.');
    unavailable.code = 'PLM_SOURCE_UNAVAILABLE';
    throw unavailable;
  }
}

function writeStore(store) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const next = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  const tmp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, storePath);
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8', headers = {}) {
  const responseHeaders = {
    'Content-Type': contentType,
    'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
    ...headers,
  };
  if (indexingDisabled()) responseHeaders['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
  res.writeHead(status, responseHeaders);
  res.end(body);
}

function serveCategoryPage(req, res, handle) {
  const category = categoryTaxonomyService.publicCategory(handle);
  if (!category) {
    send(res, 404, '<!doctype html><html><head><meta name="robots" content="noindex"><title>Category not found</title></head><body><main><h1>Category not found</h1><a href="/shop">Shop MOTOGRIP GEAR</a></main></body></html>', 'text/html; charset=utf-8');
    return;
  }
  const canonical = absoluteUrl(req, `/collections/${category.slug}`);
  const publicAsset = (value) => !value || value.startsWith('/') || /^https?:\/\//i.test(value) ? value : `/${value}`;
  const products = category.products.map((product) => `<article class="product"><a href="/products/${escapeHtml(product.handle)}">${product.image ? `<img src="${escapeHtml(publicAsset(product.image))}" alt="${escapeHtml(product.title)}">` : ''}<h2>${escapeHtml(product.title)}</h2><p>${escapeHtml(product.sku || '')}</p></a></article>`).join('');
  const children = category.children.length ? `<nav class="children" aria-label="Subcategories">${category.children.map((child) => `<a href="/collections/${escapeHtml(child.slug)}">${escapeHtml(child.name)}</a>`).join('')}</nav>` : '';
  const image = publicAsset(category.bannerImage || category.featuredImage);
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: category.name, description: category.description || undefined, url: canonical });
  send(res, 200, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(category.seoTitle || category.name)}</title>${category.metaDescription ? `<meta name="description" content="${escapeHtml(category.metaDescription)}">` : ''}<link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${schema.replace(/</g, '\\u003c')}</script><style>body{margin:0;font:16px/1.5 Inter,Arial;color:#191512;background:#f7f5f1}main{max-width:1280px;margin:auto;padding:48px 24px}header{text-align:center;margin-bottom:32px}header img{width:100%;max-height:420px;object-fit:cover;border-radius:18px}.children{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:24px}.children a,.product a{color:inherit;text-decoration:none}.children a{padding:10px 16px;border:1px solid #cfc8bf;border-radius:999px;background:#fff}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}.product{background:#fff;padding:14px;border-radius:16px}.product img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:10px}.product h2{font-size:17px}</style></head><body><main><header>${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}<p>${escapeHtml(category.hierarchyPath)}</p><h1>${escapeHtml(category.name)}</h1>${category.description ? `<p>${escapeHtml(category.description)}</p>` : ''}</header>${children}<section class="grid">${products}</section></main></body></html>`, 'text/html; charset=utf-8');
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), 'application/json; charset=utf-8', {
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function redirect(res, location) {
  res.writeHead(303, {
    Location: location,
    'Cache-Control': 'no-store',
  });
  res.end();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function ownerRecoveryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Owner password setup | MOTOGRIP OS</title>
  <style>
    :root{color-scheme:dark;--bg:#0d0d0d;--card:#171717;--line:#333;--text:#f8f5ef;--muted:#b8b1a6;--gold:#d3a75a;--danger:#f2a6a6;--ok:#9bd6ae}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top,#292016 0,#0d0d0d 48%);font:16px/1.5 system-ui,sans-serif;color:var(--text);padding:24px}
    main{width:min(100%,520px);background:var(--card);border:1px solid var(--line);border-radius:18px;padding:32px;box-shadow:0 24px 70px #0009}
    h1{margin:4px 0 10px;font-size:28px}.eyebrow{color:var(--gold);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
    p{color:var(--muted)}label{display:block;margin:18px 0 7px;font-weight:700}input{width:100%;border:1px solid #484848;border-radius:10px;background:#0f0f0f;color:var(--text);padding:13px 14px;font:inherit}
    input:focus,button:focus-visible{outline:3px solid #d3a75a66;outline-offset:2px;border-color:var(--gold)}input[readonly]{color:#d8d2c9;background:#202020}
    .password-row{display:grid;grid-template-columns:1fr auto;gap:8px}.toggle{border:1px solid #484848;background:#262626;color:var(--text);border-radius:10px;padding:0 14px;cursor:pointer}
    .policy{font-size:13px}.message{min-height:24px;margin:16px 0 0;font-weight:700}.message.error{color:var(--danger)}.message.ok{color:var(--ok)}
    .submit{width:100%;margin-top:18px;border:0;border-radius:10px;background:var(--gold);color:#17120a;padding:14px;font:inherit;font-weight:900;cursor:pointer}.submit:disabled{opacity:.55;cursor:wait}
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Staging only · single use</div>
    <h1>Set Owner password</h1>
    <p>This protected page changes only the existing Named Owner password. It expires after one successful use.</p>
    <form id="recovery-form" novalidate>
      <label for="email">Owner email</label>
      <input id="email" type="email" value="${escapeHtml(OWNER_EMAIL)}" readonly autocomplete="username">
      <label for="recovery-code">Recovery code</label>
      <div class="password-row"><input id="recovery-code" type="password" required autocomplete="one-time-code"><button class="toggle" type="button" data-toggle="recovery-code">Show</button></div>
      <label for="new-password">New password</label>
      <div class="password-row"><input id="new-password" type="password" required minlength="15" maxlength="128" autocomplete="new-password"><button class="toggle" type="button" data-toggle="new-password">Show</button></div>
      <label for="confirm-password">Confirm new password</label>
      <div class="password-row"><input id="confirm-password" type="password" required minlength="15" maxlength="128" autocomplete="new-password"><button class="toggle" type="button" data-toggle="confirm-password">Show</button></div>
      <p class="policy">Use a unique passphrase of 15–128 characters that is not based on your email, name, or MOTOGRIP. Your password is used exactly as entered; spaces are not added, removed, or trimmed.</p>
      <div id="message" class="message" role="alert" aria-live="polite"></div>
      <button id="submit" class="submit" type="submit">Set password</button>
    </form>
  </main>
  <script>
    document.querySelectorAll('[data-toggle]').forEach(function(button) {
      button.addEventListener('click', function() {
        var input = document.getElementById(button.getAttribute('data-toggle'));
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? 'Show' : 'Hide';
      });
    });
    document.getElementById('recovery-form').addEventListener('submit', async function(event) {
      event.preventDefault();
      var message = document.getElementById('message');
      var submit = document.getElementById('submit');
      var password = document.getElementById('new-password').value;
      var confirmation = document.getElementById('confirm-password').value;
      message.className = 'message error';
      if (password !== confirmation) { message.textContent = 'New password confirmation does not match.'; return; }
      if (Array.from(password).length < 15 || Array.from(password).length > 128) { message.textContent = 'Choose a unique passphrase between 15 and 128 characters.'; return; }
      submit.disabled = true; message.textContent = '';
      try {
        var response = await fetch('/api/admin/owner-recovery', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            recoveryCode: document.getElementById('recovery-code').value,
            newPassword: password,
            confirmNewPassword: confirmation
          })
        });
        var result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Owner password setup could not be completed.');
        message.className = 'message ok';
        message.textContent = 'Password set successfully. Redirecting to sign in…';
        window.location.replace(result.redirect || '/admin?password-set=success');
      } catch (error) {
        message.textContent = error.message;
        submit.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

function absoluteUrl(req, urlPath = '/') {
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const hostName = publicBaseUrl || `${proto}://${req.headers.host || `localhost:${port}`}`;
  return `${hostName}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
}

function productPath(product) {
  return `/products/${product.slug}`;
}

function productImageUrl(req, imagePath) {
  const cleanPath = canonicalMediaUrl(imagePath, { fallback: '/assets/motogrip-logo-transparent.png' });
  if (/^https:\/\//i.test(cleanPath)) return cleanPath;
  if (assetCdnBase && cleanPath.startsWith('/assets/generated/')) return `${assetCdnBase}${cleanPath}`;
  return absoluteUrl(req, cleanPath);
}

function readBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function stripeRequest(method, requestPath, form) {
  return new Promise((resolve, reject) => {
    const body = form ? form.toString() : '';
    const request = https.request({
      hostname: 'api.stripe.com',
      path: requestPath,
      method,
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        ...(body ? {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        } : {}),
      },
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let payload;
        try {
          payload = JSON.parse(responseBody);
        } catch {
          reject(new Error('Stripe returned an invalid response'));
          return;
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(payload);
          return;
        }

        const error = new Error(payload.error?.message || 'Stripe request failed');
        error.statusCode = response.statusCode;
        reject(error);
      });
    });

    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

function paypalRequest(method, requestPath, { accessToken = '', body = null, basicAuth = '' } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, paypalApiBase);
    const requestBody = body == null
      ? ''
      : (typeof body === 'string' ? body : JSON.stringify(body));
    const request = https.request({
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(basicAuth ? { Authorization: `Basic ${basicAuth}` } : {}),
        ...(requestBody ? {
          'Content-Type': typeof body === 'string'
            ? 'application/x-www-form-urlencoded'
            : 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        } : {}),
      },
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let payload = {};
        try {
          payload = responseBody ? JSON.parse(responseBody) : {};
        } catch {
          reject(new Error('PayPal returned an invalid response'));
          return;
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(payload);
          return;
        }

        const detail = payload.details?.[0]?.description || payload.message || 'PayPal request failed';
        const error = new Error(detail);
        error.statusCode = response.statusCode;
        reject(error);
      });
    });

    request.on('error', reject);
    if (requestBody) request.write(requestBody);
    request.end();
  });
}

async function getPayPalAccessToken() {
  const credentials = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
  const result = await paypalRequest('POST', '/v1/oauth2/token', {
    basicAuth: credentials,
    body: 'grant_type=client_credentials',
  });
  if (!result.access_token) throw new Error('PayPal did not return an access token');
  return result.access_token;
}

function checkoutLineItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
    throw new Error('Your bag must contain between 1 and 20 products.');
  }

  const store = readPublicStore();
  return rawItems.map((rawItem) => {
    const rawId = String(rawItem.baseId || rawItem.id || '');
    const baseId = rawId.replace(/-\d+$/, '');
    const product = store.products.find((candidate) => candidate.id === baseId || candidate.slug === baseId);
    if (!product || ['archived', 'hidden', 'draft'].includes(product.status)) {
      throw new Error('A product in your bag is no longer available.');
    }

    const quantity = Number(rawItem.qty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error('Product quantities must be between 1 and 10.');
    }

    const fitMode = rawItem.fitMode === 'made-to-measure' ? 'made-to-measure' : 'standard';
    if (fitMode === 'made-to-measure' && !product.madeToMeasureEnabled) {
      throw new Error(`${product.title} is not available made to measure.`);
    }

    const selectedSize = String(rawItem.size || '').trim().slice(0, 40);
    const selectedLeather = String(rawItem.leather || '').trim().slice(0, 80);
    const colorOptions = Array.isArray(product.availableColors) ? product.availableColors : [];
    const requestedColor = String(rawItem.productColor || product.color || '').trim().slice(0, 40);
    const selectedColor = colorOptions.length
      ? colorOptions.find((color) => color.toLowerCase() === requestedColor.toLowerCase()) || ''
      : requestedColor;
    if (colorOptions.length && !selectedColor) {
      throw new Error(`Select an available color for ${product.title}.`);
    }
    const isIntrecciatoJacket = product.id === 'p14' || product.slug === 'intrecciato-genuine-cowhide-lambskin-leather-jacket-brown';
    const collarOptions = Array.isArray(product.collarColors)
      ? product.collarColors
      : (isIntrecciatoJacket ? ['Black', 'Brown', 'Red', 'Pink', 'Blue'] : []);
    const requestedCollar = String(rawItem.collarColor || product.defaultCollarColor || (isIntrecciatoJacket ? 'Brown' : '')).trim().slice(0, 40);
    const selectedCollar = collarOptions.find((color) => color.toLowerCase() === requestedCollar.toLowerCase()) || '';
    if (collarOptions.length && !selectedCollar) {
      throw new Error(`Select an available collar color for ${product.title}.`);
    }
    const stockForSize = Number(product.stock?.[selectedSize]);
    if (fitMode === 'standard' && Number.isFinite(stockForSize) && quantity > stockForSize) {
      throw new Error(`Only ${stockForSize} of ${product.title} in size ${selectedSize} is available.`);
    }

    const basePrice = Number(product.price);
    const surcharge = fitMode === 'made-to-measure'
      ? Number(product.madeToMeasureSurcharge ?? store.settings.madeToMeasureSurcharge ?? 0)
      : 0;
    if (!Number.isFinite(basePrice) || basePrice < 0 || !Number.isFinite(surcharge) || surcharge < 0) {
      throw new Error('A product in your bag has an invalid price.');
    }

    const details = [
      selectedSize ? `Size: ${selectedSize}` : '',
      selectedLeather ? `Leather: ${selectedLeather}` : '',
      selectedColor ? `Color: ${selectedColor}` : '',
      selectedCollar ? `Collar: ${selectedCollar}` : '',
      `Fit: ${fitMode === 'made-to-measure' ? 'Made to measure' : 'Standard'}`,
    ].filter(Boolean).join(' · ');

    return {
      quantity,
      name: String(product.title || product.name || 'MOTOGRIP GEAR product').slice(0, 120),
      description: details.slice(0, 200),
      unitAmount: Math.round((basePrice + surcharge) * 100),
    };
  });
}

async function createStripeCheckout(req, rawItems) {
  let items;
  try {
    items = checkoutLineItems(rawItems);
  } catch (error) {
    error.checkoutValidation = true;
    throw error;
  }
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', absoluteUrl(req, '/?payment=success&session_id={CHECKOUT_SESSION_ID}#/checkout'));
  form.set('cancel_url', absoluteUrl(req, '/?payment=cancelled#/checkout'));
  form.set('customer_creation', 'always');
  form.set('billing_address_collection', 'required');
  form.set('phone_number_collection[enabled]', 'true');
  form.set('allow_promotion_codes', 'true');
  form.set('submit_type', 'pay');

  stripeShippingCountries.forEach((country, index) => {
    form.set(`shipping_address_collection[allowed_countries][${index}]`, country);
  });

  items.forEach((item, index) => {
    form.set(`line_items[${index}][price_data][currency]`, 'usd');
    form.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    form.set(`line_items[${index}][price_data][product_data][description]`, item.description);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
  });

  return stripeRequest('POST', '/v1/checkout/sessions', form);
}

function paypalMoney(cents) {
  return (cents / 100).toFixed(2);
}

async function createPayPalOrder(req, rawItems) {
  let items;
  try {
    items = checkoutLineItems(rawItems);
  } catch (error) {
    error.checkoutValidation = true;
    throw error;
  }

  const totalCents = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const accessToken = await getPayPalAccessToken();
  const order = await paypalRequest('POST', '/v2/checkout/orders', {
    accessToken,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: crypto.randomUUID(),
        description: 'MOTOGRIP GEAR order',
        items: items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: String(item.quantity),
          category: 'PHYSICAL_GOODS',
          unit_amount: {
            currency_code: 'USD',
            value: paypalMoney(item.unitAmount),
          },
        })),
        amount: {
          currency_code: 'USD',
          value: paypalMoney(totalCents),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: paypalMoney(totalCents),
            },
          },
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'MOTOGRIP GEAR',
            landing_page: 'LOGIN',
            shipping_preference: 'GET_FROM_FILE',
            user_action: 'PAY_NOW',
            return_url: absoluteUrl(req, '/api/paypal/capture'),
            cancel_url: absoluteUrl(req, '/?payment=cancelled#/checkout'),
          },
        },
      },
    },
  });

  const approvalUrl = order.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve')?.href;
  if (!order.id || !approvalUrl) throw new Error('PayPal did not return an approval URL');
  return { id: order.id, url: approvalUrl };
}

async function capturePayPalOrder(orderId) {
  if (!/^[A-Z0-9-]{8,40}$/i.test(orderId)) throw new Error('Invalid PayPal order ID');
  const accessToken = await getPayPalAccessToken();
  return paypalRequest('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    accessToken,
    body: {},
  });
}

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requested = cleanPath ? path.join(root, cleanPath) : path.join(root, 'index.html');
  const normalized = path.normalize(requested);
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

function publicCatalog(store) {
  return {
    settings: store.settings,
    products: store.products.filter((product) => !['archived', 'hidden', 'draft'].includes(product.status)),
  };
}

function productMeta(product, store, req) {
  const currency = store.settings.currency || 'USD';
  const title = product.seoTitle || `${product.title} | ${product.category}, ${product.gender} | MOTOGRIP GEAR`;
  const desc = (product.seoDescription || product.schemaDescription || product.description || `${product.title} from MOTOGRIP GEAR.`).slice(0, 158);
  const canonical = product.canonicalUrl || absoluteUrl(req, productPath(product));
  const image = productImageUrl(req, product.primaryImage || product.image);
  const images = [image, ...(Array.isArray(product.galleryImages) ? product.galleryImages.map((src) => productImageUrl(req, src)) : [])];
  const sellableVariants = (Array.isArray(product.variants) ? product.variants : [])
    .filter((variant) => variant.status !== 'disabled' && variant.availableForSale !== false);
  const availability = (sellableVariants.length
    ? sellableVariants.some((variant) => Number(variant.quantity || 0) > 0)
    : Number(product.inventory || 0) > 0)
    ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const metafields = product.metafields && typeof product.metafields === 'object' ? product.metafields : {};
  const factualValue = (value) => value !== undefined && value !== null && value !== '' &&
    String(value).toLowerCase() !== 'not applicable';
  const propertyLabels = {
    outerMaterial: 'Outer material',
    leatherType: 'Leather type',
    leatherThickness: 'Leather thickness',
    liningMaterial: 'Lining',
    closure: 'Closure',
    hardware: 'Hardware',
    pocketCount: 'Pocket count',
    concealedCarryPockets: 'Concealed-carry pockets',
    armorCompatibility: 'Armor compatibility',
    collar: 'Collar',
    sleeveType: 'Sleeve type',
    fit: 'Fit',
    careInstructions: 'Care instructions',
    customSizingAvailable: 'Custom sizing',
    personalizationAvailable: 'Personalization',
    manufacturer: 'Manufacturer',
    countryOfManufacture: 'Country of manufacture',
  };
  const factualProperties = Object.entries(propertyLabels)
    .filter(([key]) => factualValue(metafields[key]))
    .map(([key, name]) => ({
      '@type': 'PropertyValue',
      name,
      value: typeof metafields[key] === 'boolean' ? (metafields[key] ? 'Yes' : 'No') : String(metafields[key]),
    }));
  const productNode = {
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: product.title,
    image: [...new Set(images)],
    description: product.schemaDescription || product.description,
    disambiguatingDescription: product.geoDescription || undefined,
    sku: product.sku || product.id,
    mpn: product.mpn || product.sku || product.id,
    gtin: product.gtin || undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand || store.settings.storeName || 'MOTOGRIP GEAR',
    },
    category: product.productType || product.category,
    material: (factualValue(metafields.outerMaterial) ? metafields.outerMaterial :
      factualValue(metafields.leatherType) ? metafields.leatherType :
      product.factualProjection ? undefined : product.material || product.leatherType || undefined),
    color: product.factualProjection ? undefined : product.color || undefined,
    size: product.factualProjection ? undefined : product.size || undefined,
    audience: product.gender ? { '@type': 'PeopleAudience', suggestedGender: product.gender } : undefined,
    additionalProperty: product.factualProjection ? factualProperties : [
      ['Made to measure', product.madeToMeasureEnabled ? `Available +${currency} ${product.madeToMeasureSurcharge}` : 'Not available'],
      ['Leather type', product.leatherType],
      ['Hardware', product.hardware],
      ['Lining', product.lining],
      ['Riding use', product.ridingUseCase],
      ['Care', product.careInstructions],
    ].filter(([, value]) => value !== undefined && value !== '').map(([name, value]) => ({ '@type': 'PropertyValue', name, value: String(value) })),
    hasVariant: sellableVariants.map((variant) => ({
      '@type': 'Product',
      sku: variant.sku || undefined,
      name: [product.title, ...Object.values(variant.attributes || {})].filter(Boolean).join(' - '),
      additionalProperty: Object.entries(variant.attributes || {}).map(([name, value]) => ({
        '@type': 'PropertyValue',
        name,
        value: String(value),
      })),
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: currency,
        price: Number(variant.price ?? product.price ?? 0).toFixed(2),
        availability: Number(variant.quantity || 0) > 0
          ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: `https://schema.org/${product.condition || 'NewCondition'}`,
      },
    })),
    offers: {
      '@type': 'Offer',
      '@id': `${canonical}#offer`,
      url: canonical,
      priceCurrency: currency,
      price: Number(product.price || 0).toFixed(2),
      priceValidUntil: product.priceValidUntil || undefined,
      availability,
      itemCondition: `https://schema.org/${product.condition || 'NewCondition'}`,
      seller: {
        '@type': 'Organization',
        name: store.settings.storeName || 'MOTOGRIP GEAR',
      },
      shippingDetails: product.shippingPolicy ? {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 5,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      } : undefined,
      hasMerchantReturnPolicy: product.returnPolicy ? {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnShippingFees',
      } : undefined,
    },
  };
  if (Number(product.ratingValue || 0) > 0 && Number(product.reviewCount || 0) > 0) {
    productNode.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.ratingValue),
      reviewCount: Number(product.reviewCount),
    };
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      productNode,
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(req, '/') },
          { '@type': 'ListItem', position: 2, name: product.category || 'Shop', item: absoluteUrl(req, '/shop') },
          { '@type': 'ListItem', position: 3, name: product.title, item: canonical },
        ],
      },
    ],
  };
  return { title, desc, canonical, image, jsonLd };
}

function injectProductHead(html, product, store, req) {
  const meta = productMeta(product, store, req);
  const extraHead = `
<meta property="product:price:amount" content="${escapeHtml(product.price)}" />
<meta property="product:price:currency" content="${escapeHtml(store.settings.currency || 'USD')}" />
<script type="application/ld+json">${escapeScriptJson(meta.jsonLd)}</script>
<script>window.__SSM_INITIAL_ROUTE__ = ${escapeScriptJson({ view: 'pdp', productSlug: product.slug })};
window.__SSM_PRODUCT_OVERRIDE__ = ${escapeScriptJson({
    slug: product.slug,
    title: product.title,
    description: product.description,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.title,
      blurb: product.shortDescription || product.description,
      publicDescription: product.descriptionHtml || product.description,
      cat: product.category || product.productType || 'Products',
      gender: product.gender || 'Unisex',
      price: Number(product.price || 0),
      compareAtPrice: product.compareAtPrice,
      brand: product.brand,
      vendor: product.maker || product.brand,
      productType: product.productType,
      category: product.category,
      seoTitle: product.seoTitle,
      metaDescription: product.seoDescription,
      img: productImageUrl(req, product.primaryImage || product.image),
      alt: productImageUrl(req, product.galleryImages?.[0] || product.primaryImage || product.image),
      images: [product.primaryImage || product.image, ...(product.galleryImages || [])]
        .filter(Boolean).map((imagePath) => productImageUrl(req, imagePath)),
      stock: product.stock || {},
      options: product.options || [],
      variants: product.variants || [],
      availableColors: product.availableColors || [],
      imageMetadata: (product.imageMetadata || []).map((item) => ({
        ...item,
        path: item.path ? productImageUrl(req, item.path) : item.path,
      })),
      maker: product.maker || product.brand || '',
      tag: product.tag || '',
      madeToMeasureSurcharge: product.madeToMeasureSurcharge,
      metafields: product.metafields || {},
      shipping: product.shipping || {},
      shippingWeight: product.shippingWeight || '',
      sku: product.sku || '',
      internalProductCode: product.internalProductCode || '',
      factoryCode: product.factoryCode || '',
      sections: {
        description: product.websiteContent?.description ||
          (product.description ? [product.description] : []),
        features: product.websiteContent?.features || product.features || [],
        specifications: product.websiteContent?.specifications || product.specifications || [],
        perfectFor: product.websiteContent?.perfectFor || product.perfectFor || '',
        whyYouWillLoveIt: product.websiteContent?.whyYouWillLoveIt || product.whyYouWillLoveIt || '',
      },
      tags: product.tags || [],
      factualProjection: product.factualProjection === true,
      reviews: Array.isArray(product.reviews) ? product.reviews : [],
    },
  })};</script>`;
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`)
    .replace(/<meta property="og:type" content=".*?" \/>/s, '<meta property="og:type" content="product" />')
    .replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeHtml(meta.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${escapeHtml(meta.image)}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/s, `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`)
    .replace('</head>', `${extraHead}\n</head>`);
}

function injectRouteHead(html, route, req) {
  const canonical = absoluteUrl(req, new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname.replace(/\/$/, '') || '/');
  const robots = route.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  const initialRoute = { view: route.view, ...(route.params ? { params: route.params } : {}) };
  const image = route.image ? absoluteUrl(req, route.image) : '';
  const articleJsonLd = route.article ? `
<script type="application/ld+json">${escapeScriptJson({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: route.article.headline,
    description: route.desc,
    image: [image],
    datePublished: route.article.datePublished,
    dateModified: route.article.dateModified,
    author: { '@type': 'Organization', name: route.article.author, url: absoluteUrl(req, '/') },
    publisher: {
      '@type': 'Organization',
      name: 'MOTOGRIP GEAR',
      logo: { '@type': 'ImageObject', url: absoluteUrl(req, '/assets/motogrip-logo-transparent-v2.png') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  })}</script>` : '';
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeHtml(route.desc)}" />`)
    .replace(/<meta name="robots" content=".*?" \/>/s, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeHtml(route.desc)}" />`)
    .replace(/<meta property="og:type" content=".*?" \/>/s, `<meta property="og:type" content="${route.article ? 'article' : 'website'}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/s, image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '$&')
    .replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${escapeHtml(route.desc)}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/s, image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : '$&')
    .replace('</head>', `${articleJsonLd}\n<script>window.__SSM_INITIAL_ROUTE__ = ${escapeScriptJson(initialRoute)};</script>\n</head>`);
}

function servePublicRoute(req, res, route) {
  fs.readFile(path.join(root, 'index.html'), 'utf8', (readErr, html) => {
    if (readErr) {
      send(res, 500, 'Site unavailable');
      return;
    }
    send(res, 200, injectRouteHead(html, route, req), 'text/html; charset=utf-8', {
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': route.noindex ? 'noindex, follow' : 'index, follow',
    });
  });
}

function serveProductPage(req, res, slug) {
  const store = readPublicStore();
  const product = store.products.find((item) => item.slug === slug &&
    !['archived', 'hidden', 'draft'].includes(item.status));
  if (!product) {
    send(res, 404, 'Product not found');
    return;
  }
  fs.readFile(path.join(root, 'index.html'), 'utf8', (readErr, html) => {
    if (readErr) {
      send(res, 404, 'Not found');
      return;
    }
    const body = injectProductHead(html, product, store, req);
    send(res, 200, body, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
  });
}

function serveSitemap(req, res) {
  const store = readPublicStore();
  const urls = [
    ...indexablePublicPaths,
    ...store.products.filter((product) =>
      !['archived', 'hidden', 'draft'].includes(product.status)).map(productPath),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((urlPath) => `  <url><loc>${escapeHtml(absoluteUrl(req, urlPath))}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`;
  send(res, 200, xml, 'application/xml; charset=utf-8', { 'Cache-Control': 'public, max-age=3600' });
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function merchantGender(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'men' || normalized === 'male') return 'male';
  if (normalized === 'women' || normalized === 'female') return 'female';
  return 'unisex';
}

function merchantCondition(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('used')) return 'used';
  if (normalized.includes('refurbished')) return 'refurbished';
  return 'new';
}

function merchantDescription(product) {
  const base = String(
    product.schemaDescription
      || product.description
      || `${product.title} by MOTOGRIP GEAR.`,
  ).trim();
  const color = String(product.color || '').trim();
  const material = String(product.material || product.leatherType || '').trim();
  const details = [
    color ? `Color: ${color}.` : '',
    material ? `Material: ${material}.` : '',
  ].filter(Boolean);
  return [base, ...details].join(' ').trim();
}

function escapeCsv(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function serveMetaCatalogFeed(req, res) {
  const store = readPublicStore();
  const currency = store.settings.currency || 'USD';
  const columns = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'product_type',
    'google_product_category',
    'gender',
    'age_group',
    'color',
    'material',
  ];

  const rows = store.products
    .filter((product) => product.status === 'active')
    .filter((product) => !product.merchantReadiness ||
      product.merchantReadiness.status === 'Google Merchant Ready')
    .map((product) => {
      const sku = product.sku || product.id;
      const link = product.canonicalUrl || absoluteUrl(req, productPath(product));
      const image = productImageUrl(req, product.primaryImage || product.image);
      const description = merchantDescription(product);
      const inventory = Object.keys(product.stock || {}).length
        ? Object.values(product.stock).reduce((total, quantity) => total + Number(quantity || 0), 0)
        : Number(product.inventory || 0);

      const item = {
        id: sku,
        title: product.title,
        description,
        availability: inventory > 0 ? 'in stock' : 'out of stock',
        condition: merchantCondition(product.condition),
        price: `${Number(product.price || 0).toFixed(2)} ${currency}`,
        link,
        image_link: image,
        brand: product.brand || store.settings.storeName || 'MOTOGRIP GEAR',
        product_type: product.productType || product.category,
        google_product_category: product.googleProductCategory,
        gender: merchantGender(product.gender),
        age_group: String(product.ageGroup || 'adult').toLowerCase(),
        color: product.color,
        material: product.material || product.leatherType,
      };

      return columns.map((column) => escapeCsv(item[column])).join(',');
    });

  const feed = `${columns.join(',')}\n${rows.join('\n')}\n`;
  send(res, 200, feed, 'text/csv; charset=utf-8', {
    'Cache-Control': 'no-cache, max-age=0',
    'Content-Disposition': 'inline; filename="motogrip-meta-catalog.csv"',
  });
}

function serveMerchantFeed(req, res) {
  const store = readPublicStore();
  const currency = store.settings.currency || 'USD';
  const items = [];

  store.products
    .filter((product) => product.status === 'active')
    .filter((product) => !product.merchantReadiness ||
      product.merchantReadiness.status === 'Google Merchant Ready')
    .forEach((product) => {
      const variants = Object.keys(product.stock || {}).length
        ? Object.entries(product.stock)
        : [[product.size || 'One Size', Number(product.inventory || 0)]];
      const sku = product.sku || product.id;
      const groupId = product.itemGroupId || product.slug || product.id;
      const link = product.canonicalUrl || absoluteUrl(req, productPath(product));
      const image = productImageUrl(req, product.primaryImage || product.image);
      const description = merchantDescription(product);

      variants.forEach(([size, quantity]) => {
        const variantId = `${sku}-${String(size).replace(/[^a-z0-9]+/gi, '-')}`;
        const fields = [
          ['id', variantId],
          ['title', `${product.title} - Size ${size}`],
          ['description', description],
          ['link', link],
          ['image_link', image],
          ['availability', Number(quantity) > 0 ? 'in_stock' : 'out_of_stock'],
          ['price', `${Number(product.price || 0).toFixed(2)} ${currency}`],
          ['condition', merchantCondition(product.condition)],
          ['brand', product.brand || store.settings.storeName || 'MOTOGRIP GEAR'],
          ['mpn', product.merchantAttributes?.mpn || product.mpn],
          ['gtin', product.merchantAttributes?.gtin || product.gtin],
          ['identifier_exists', product.merchantAttributes?.identifier_exists ??
            Boolean(product.mpn || product.gtin)],
          ['google_product_category', product.merchantAttributes?.google_product_category ||
            product.googleProductCategory],
          ['product_type', product.productType || product.category],
          ['age_group', product.merchantAttributes?.age_group || String(product.ageGroup || '').toLowerCase()],
          ['gender', product.merchantAttributes?.gender || merchantGender(product.gender)],
          ['size', size],
          ['size_system', product.merchantAttributes?.size_system || product.sizeSystem],
          ['size_type', product.merchantAttributes?.size_type || product.sizeType],
          ['item_group_id', groupId],
          ['color', product.merchantAttributes?.color || product.color],
          ['material', product.merchantAttributes?.material || product.material || product.leatherType],
          ['shipping_weight', product.shippingWeight],
          ['custom_label_0', product.category],
          ['custom_label_1', product.madeToMeasureEnabled ? 'Made to measure available' : 'Standard sizing'],
        ].filter(([, value]) => value !== undefined && value !== '');

        items.push(`    <item>\n${fields.map(([name, value]) => `      <g:${name}>${escapeXml(value)}</g:${name}>`).join('\n')}\n    </item>`);
      });
    });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(store.settings.storeName || 'MOTOGRIP GEAR')} Product Feed</title>
    <link>${escapeXml(absoluteUrl(req, '/'))}</link>
    <description>Current products and size variants for Google Merchant Center.</description>
${items.join('\n')}
  </channel>
</rss>
`;
  send(res, 200, feed, 'application/xml; charset=utf-8', { 'Cache-Control': 'no-cache, max-age=0' });
}

function normalizeStore(input) {
  const current = readStore();
  const products = Array.isArray(input.products) ? input.products : current.products;
  const orders = Array.isArray(input.orders) ? input.orders : current.orders;
  const returnRequests = Array.isArray(input.returnRequests) ? input.returnRequests : (current.returnRequests || []);
  const activity = Array.isArray(input.activity) ? input.activity : current.activity;
  return {
    settings: { ...current.settings, ...(input.settings || {}) },
    products: products.map((product) => ({
      id: String(product.id || crypto.randomUUID()),
      slug: String(product.slug || product.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: String(product.title || 'Untitled product'),
      category: String(product.category || 'Jackets'),
      gender: String(product.gender || 'Unisex'),
      price: Number(product.price || 0),
      compareAtPrice: product.compareAtPrice === null || product.compareAtPrice === '' ? null : Number(product.compareAtPrice || 0),
      status: ['active', 'draft', 'hidden', 'archived'].includes(product.status) ? product.status : 'draft',
      inventory: Number(product.inventory || 0),
      madeToMeasureEnabled: Boolean(product.madeToMeasureEnabled),
      madeToMeasureSurcharge: Number(product.madeToMeasureSurcharge || 0),
      tag: String(product.tag || ''),
      description: String(product.description || ''),
      image: String(product.image || ''),
      maker: String(product.maker || ''),
      stock: product.stock && typeof product.stock === 'object' ? product.stock : {},
      seoTitle: String(product.seoTitle || ''),
      seoDescription: String(product.seoDescription || ''),
      geoTitle: String(product.geoTitle || ''),
      geoDescription: String(product.geoDescription || ''),
      canonicalUrl: String(product.canonicalUrl || ''),
      schemaDescription: String(product.schemaDescription || product.description || ''),
      brand: String(product.brand || 'MOTOGRIP GEAR'),
      sku: String(product.sku || product.id || ''),
      mpn: String(product.mpn || ''),
      gtin: String(product.gtin || ''),
      googleProductCategory: String(product.googleProductCategory || ''),
      productType: String(product.productType || product.category || ''),
      condition: String(product.condition || 'NewCondition'),
      availability: String(product.availability || (Number(product.inventory || 0) > 0 ? 'InStock' : 'OutOfStock')),
      priceValidUntil: String(product.priceValidUntil || ''),
      primaryImage: String(product.primaryImage || product.image || ''),
      galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages.map(String) : [],
      imageAltText: String(product.imageAltText || product.title || ''),
      material: String(product.material || ''),
      color: String(product.color || ''),
      availableColors: Array.isArray(product.availableColors) ? product.availableColors.map(String) : [],
      sizeSystem: String(product.sizeSystem || 'US'),
      sizeType: String(product.sizeType || 'Regular'),
      ageGroup: String(product.ageGroup || 'Adult'),
      itemGroupId: String(product.itemGroupId || product.slug || product.id || ''),
      variantOptions: Array.isArray(product.variantOptions) ? product.variantOptions.map(String) : [],
      shippingWeight: String(product.shippingWeight || ''),
      descriptionHtml: String(product.descriptionHtml || ''),
      collections: Array.isArray(product.collections) ? product.collections.map(String) : [],
      options: Array.isArray(product.options) ? product.options : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      costPerItem: product.costPerItem === null || product.costPerItem === '' ? null : Number(product.costPerItem || 0),
      taxable: product.taxable !== false,
      internalProductCode: String(product.internalProductCode || ''),
      factoryCode: String(product.factoryCode || ''),
      shipping: product.shipping && typeof product.shipping === 'object' ? product.shipping : {},
      metafields: product.metafields && typeof product.metafields === 'object' ? product.metafields : {},
      imageMetadata: Array.isArray(product.imageMetadata) ? product.imageMetadata : [],
      shortDescription: String(product.shortDescription || ''),
      features: Array.isArray(product.features) ? product.features : (product.features || ''),
      specifications: Array.isArray(product.specifications) ? product.specifications : (product.specifications || ''),
      perfectFor: String(product.perfectFor || ''),
      whyYouWillLoveIt: String(product.whyYouWillLoveIt || ''),
      faq: Array.isArray(product.faq) ? product.faq : (product.faq || ''),
      buyingGuide: String(product.buyingGuide || ''),
      tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
      factualProjection: product.factualProjection === true,
      shippingPolicy: String(product.shippingPolicy || (product.factualProjection ? '' : 'Complimentary express shipping on stock pieces')),
      returnPolicy: String(product.returnPolicy || (product.factualProjection ? '' : '30-day returns on stock pieces; made-to-measure pieces are final sale with alteration support')),
      ratingValue: Number(product.ratingValue || 0),
      reviewCount: Number(product.reviewCount || 0),
      careInstructions: String(product.careInstructions || ''),
      fitNotes: String(product.fitNotes || ''),
      leatherType: String(product.leatherType || ''),
      leatherOrigin: String(product.leatherOrigin || ''),
      leatherThickness: String(product.leatherThickness || ''),
      lining: String(product.lining || ''),
      hardware: String(product.hardware || ''),
      closureType: String(product.closureType || ''),
      armorCompatibility: String(product.armorCompatibility || ''),
      weatherResistance: String(product.weatherResistance || ''),
      ridingUseCase: String(product.ridingUseCase || ''),
      season: String(product.season || ''),
      craftMethod: String(product.craftMethod || ''),
      warranty: String(product.warranty || ''),
    })),
    orders: orders.map((order) => ({
      ...order,
      id: String(order.id || crypto.randomUUID()),
      status: String(order.status || 'open'),
      total: Number(order.total || 0),
    })),
    returnRequests: returnRequests.map((request) => ({
      ...request,
      id: String(request.id || `RET-${Date.now()}`),
      status: String(request.status || 'new'),
    })),
    activity,
  };
}

function namedOwnerForSession(session) {
  if (!session || session.actorType !== 'named_user' || !session.userId) return null;
  const user = adminIdentity.findById(session.userId);
  return user && user.accountType === 'owner' && user.status === 'active' ? user : null;
}

function namedUserForSession(session) {
  if (!session || session.actorType !== 'named_user' || !session.userId) return null;
  const user = adminIdentity.findById(session.userId);
  return user && user.status === 'active' ? user : null;
}

function hasPermission(session, module, action) {
  const user = namedUserForSession(session);
  return Boolean(user && teamPermissionsService.hasUserPermission(user, module, action));
}

function safePlmError(error) {
  const statuses = {
    PLM_VALIDATION: 400,
    PLM_MERCHANT_CONFIRMATION_REQUIRED: 400,
    PLM_REVISION_CONFLICT: 409,
    PLM_MIGRATION_UNAVAILABLE: 409,
    PLM_MIGRATION_CONFLICT: 409,
    PLM_SOURCE_CHANGED: 409,
    PLM_SOURCE_UNAVAILABLE: 503,
    PLM_MAPPING_CONFLICT: 409,
    PLM_STORE_UNAVAILABLE: 503,
    OWNER_REQUIRED: 403,
    NOT_FOUND: 404,
    VALIDATION: 400,
    CONFLICT: 409,
    UNTRUSTED_RELEASE: 409,
    REVISION_CONFLICT: 409,
    LISTING_STORE_UNAVAILABLE: 503,
    IDENTITY_STORE_UNAVAILABLE: 503,
    IDENTITY_LOCKED: 409,
    INVALID_STATE: 409,
    DUPLICATE_IDENTITY: 409,
    CATALOG_LINK_STORE_UNAVAILABLE: 503,
    OPERATIONAL_STORE_UNAVAILABLE: 503,
    PERMISSION_STORE_UNAVAILABLE: 503,
    FORBIDDEN: 403,
    WORKFLOW_CONFLICT: 409,
    APPROVAL_REQUIRED: 409,
    IDENTITY_NOT_LOCKED: 409,
    CATALOG_LINK_REQUIRED: 409,
    MISSING_CRITICAL: 409,
    DUPLICATE_PRODUCT: 409,
    SYNC_FAILED: 503,
    IDENTITY_CONFLICT: 409,
    PASSWORD_POLICY: 400,
    PRODUCT_EDITOR_STORE_UNAVAILABLE: 503,
    IMMUTABLE_RECORD: 409,
    CURRENT_PASSWORD_INVALID: 400,
    CATEGORY_STORE_UNAVAILABLE: 503,
    DUPLICATE_SLUG: 409,
    DUPLICATE_CATEGORY: 409,
    CIRCULAR_HIERARCHY: 409,
    MISSING_PARENT: 409,
    MAX_DEPTH: 409,
    DELETE_BLOCKED: 409,
    CONFIRMATION_REQUIRED: 400,
    AI_STORE_UNAVAILABLE: 503,
    AI_PROVIDER_NOT_CONFIGURED: 503,
    AI_PROVIDER_FAILED: 503,
    AI_PROVIDER_INVALID_RESPONSE: 502,
    AI_PROVIDER_RATE_LIMIT: 429,
    AI_PROVIDER_TIMEOUT: 504,
    AI_SCHEMA_INVALID: 502,
    AI_IMAGES_REQUIRED: 400,
    AI_IMAGE_UNAVAILABLE: 400,
    AI_IMAGE_TOO_LARGE: 400,
    AI_DAILY_LIMIT: 429,
    AI_MEDIA_STORE_UNAVAILABLE: 503,
    AI_MEDIA_PLAN_REQUIRED: 400,
  };
  return {
    status: statuses[error.code] || 500,
    message: statuses[error.code] ? error.message : 'Product PLM operation could not be completed.',
  };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/catalog' && req.method === 'GET') {
    sendJson(res, 200, publicCatalog(readPublicStore()));
    return true;
  }
  if (pathname === '/api/categories' && req.method === 'GET') {
    try {
      const workspace = categoryTaxonomyService.workspace({ actorType: 'legacy_owner' });
      sendJson(res, 200, { categories: workspace.categories.filter((item) => !item.parentId && item.workflowState === 'live' && item.status === 'active' && item.websiteVisibility).map(({ id, name, slug, sortOrder, childCount }) => ({ id, name, slug, sortOrder, childCount })).sort((a,b)=>a.sortOrder-b.sortOrder) });
    } catch { sendJson(res, 200, { categories: [] }); }
    return true;
  }

  if (pathname === '/api/stripe/checkout' && req.method === 'POST') {
    if (!stripeSecretKey) {
      sendJson(res, 503, { error: 'Secure checkout is being configured. Please try again shortly.' });
      return true;
    }

    try {
      const body = await readBody(req);
      const session = await createStripeCheckout(req, body.items);
      if (!session.url) throw new Error('Stripe did not return a checkout URL');
      sendJson(res, 200, { url: session.url });
    } catch (error) {
      const clientError = error.checkoutValidation ? error.message : '';
      console.error('Stripe checkout error:', error.message);
      sendJson(res, clientError ? 400 : 502, {
        error: clientError || 'Secure checkout is temporarily unavailable. Please try again.',
      });
    }
    return true;
  }

  if (pathname === '/api/paypal/checkout' && req.method === 'POST') {
    if (!paypalClientId || !paypalClientSecret) {
      sendJson(res, 503, { error: 'PayPal checkout is being configured. Please try again shortly.' });
      return true;
    }

    try {
      const body = await readBody(req);
      const order = await createPayPalOrder(req, body.items);
      sendJson(res, 200, { url: order.url });
    } catch (error) {
      const clientError = error.checkoutValidation ? error.message : '';
      console.error('PayPal checkout error:', error.message);
      sendJson(res, clientError ? 400 : 502, {
        error: clientError || 'PayPal checkout is temporarily unavailable. Please try again.',
      });
    }
    return true;
  }

  if (pathname === '/api/paypal/capture' && req.method === 'GET') {
    const orderId = new URL(req.url, 'http://localhost').searchParams.get('token') || '';
    try {
      const capture = await capturePayPalOrder(orderId);
      if (capture.status !== 'COMPLETED') throw new Error('PayPal payment was not completed');
      redirect(res, absoluteUrl(req, `/?payment=success&provider=paypal&order_id=${encodeURIComponent(orderId)}#/checkout`));
    } catch (error) {
      console.error('PayPal capture error:', error.message);
      redirect(res, absoluteUrl(req, '/?payment=error&provider=paypal#/checkout'));
    }
    return true;
  }

  if (pathname === '/api/orders/track' && req.method === 'POST') {
    const body = await readBody(req);
    const orderNumber = String(body.orderNumber || '').trim().toLowerCase();
    const email = String(body.email || '').trim().toLowerCase();

    if (!orderNumber || !email) {
      sendJson(res, 400, { error: 'Enter both your order number and checkout email.' });
      return true;
    }

    const order = (readStore().orders || []).find((item) =>
      String(item.id || '').trim().toLowerCase() === orderNumber &&
      String(item.email || '').trim().toLowerCase() === email
    );

    if (!order) {
      sendJson(res, 404, { error: 'We could not find an order matching those details.' });
      return true;
    }

    sendJson(res, 200, {
      order: {
        id: order.id,
        date: order.date || '',
        status: order.status || 'open',
        fulfillment: order.fulfillment || 'unfulfilled',
        items: Number(order.items || 0),
        fit: order.fit || '',
        carrier: order.carrier || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: /^https?:\/\//i.test(String(order.trackingUrl || '')) ? order.trackingUrl : '',
        estimatedDelivery: order.estimatedDelivery || '',
      },
    });
    return true;
  }

  if (pathname === '/api/returns' && req.method === 'POST') {
    const forwardedIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const clientIp = forwardedIp || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recentAttempts = (returnRequestAttempts.get(clientIp) || []).filter((time) => now - time < 60 * 60 * 1000);
    if (recentAttempts.length >= 5) {
      sendJson(res, 429, { error: 'Too many return requests. Please try again later or email info@motogripgear.com.' });
      return true;
    }

    const body = await readBody(req);
    if (String(body.website || '').trim()) {
      sendJson(res, 200, { ok: true, requestId: 'RECEIVED' });
      return true;
    }

    const clean = (value, max = 500) => String(value || '').trim().slice(0, max);
    const request = {
      orderNumber: clean(body.orderNumber, 80).toUpperCase(),
      email: clean(body.email, 160).toLowerCase(),
      name: clean(body.name, 120),
      item: clean(body.item, 180),
      requestType: clean(body.requestType, 80),
      reason: clean(body.reason, 120),
      details: clean(body.details, 2000),
      acceptedPolicy: body.acceptedPolicy === true,
    };
    const allowedTypes = ['Refund', 'Exchange', 'Store credit', 'Fit alteration'];

    if (!request.orderNumber || !request.name || !request.email || !/^\S+@\S+\.\S+$/.test(request.email)) {
      sendJson(res, 400, { error: 'Enter your name, order number, and a valid checkout email.' });
      return true;
    }
    if (!allowedTypes.includes(request.requestType) || !request.reason || request.details.length < 10) {
      sendJson(res, 400, { error: 'Select a request type and reason, then add a short description.' });
      return true;
    }
    if (!request.acceptedPolicy) {
      sendJson(res, 400, { error: 'Please confirm that you have reviewed the Returns & Refunds policy.' });
      return true;
    }

    const store = readStore();
    const requestId = `RET-${now.toString(36).toUpperCase()}`;
    store.returnRequests = [
      {
        id: requestId,
        ...request,
        status: 'new',
        submittedAt: new Date(now).toISOString(),
      },
      ...(store.returnRequests || []),
    ].slice(0, 500);
    store.activity = [
      {
        id: `act-${now}`,
        at: new Date(now).toISOString(),
        type: 'return',
        message: `Return request ${requestId} received for ${request.orderNumber}`,
      },
      ...(store.activity || []),
    ].slice(0, 50);
    writeStore(store);
    returnRequestAttempts.set(clientIp, [...recentAttempts, now]);
    sendJson(res, 201, { ok: true, requestId });
    return true;
  }

  if (pathname === '/api/custom-consultations' && req.method === 'POST') {
    const body = await readBody(req);
    const clean = (value, max = 500) => String(value || '').trim().slice(0, max);
    const request = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      productType: clean(body.productType, 80),
      silhouette: clean(body.silhouette, 80),
      material: clean(body.material, 80),
      fit: clean(body.fit, 80),
      details: clean(body.details, 3000),
      name: clean(body.name, 160),
      email: clean(body.email, 254).toLowerCase(),
      phone: clean(body.phone, 80),
      contactPreference: ['email', 'phone', 'either'].includes(body.contactPreference) ? body.contactPreference : 'email',
    };
    if (!request.productType || !request.silhouette || !request.material || !request.fit || !request.name || !/^\S+@\S+\.\S+$/.test(request.email)) {
      sendJson(res, 400, { error: 'Please complete the required consultation details.' });
      return true;
    }
    const store = readStore();
    store.customConsultations = [request, ...(store.customConsultations || [])].slice(0, 250);
    store.activity = [{ id: `act-${Date.now()}`, at: request.createdAt, type: 'consultation', message: `Custom consultation received from ${request.name}` }, ...(store.activity || []).slice(0, 24)];
    writeStore(store);
    sendJson(res, 201, { ok: true, id: request.id });
    return true;
  }

  if (pathname === '/api/admin/bootstrap/status' && req.method === 'GET') {
    const session = adminSecurity.getSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }
    sendJson(res, 200, {
      available: session.actorType === 'legacy_owner' && adminIdentity.bootstrapAvailable(),
      ownerExists: Boolean(adminIdentity.owner()),
    });
    return true;
  }

  if (pathname === '/api/admin/owner-recovery' && req.method === 'POST') {
    if (!adminIdentity.allowAction(req, 'owner_browser_recovery', 5, 15 * 60 * 1000)) {
      sendJson(res, 429, { error: 'Owner password setup could not be completed.' });
      return true;
    }
    if (!adminSecurity.validOrigin(req)) {
      adminSecurity.audit(req, {
        action: 'owner_browser_recovery',
        result: 'rejected_origin',
        actorId: 'staging:owner-recovery',
      });
      sendJson(res, 403, { error: 'Owner password setup could not be completed.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const user = await adminOwnerRecovery.complete(body);
      adminSecurity.revokeUserSessions(user.id);
      adminSecurity.audit(req, {
        action: 'owner_browser_recovery_completed',
        result: 'success',
        actorId: 'staging:owner-recovery',
        entityType: 'admin_user',
      });
      adminSecurity.securityEvent(req, {
        severity: 'high',
        action: 'owner_browser_recovery_completed',
        result: 'success',
        actorId: 'staging:owner-recovery',
        entityType: 'admin_user',
      });
      sendJson(res, 200, {
        ok: true,
        redirect: '/admin?password-set=success',
      }, {
        'Clear-Site-Data': '"cache", "cookies", "storage"',
      });
    } catch (error) {
      const policyError = error.code === 'PASSWORD_POLICY';
      adminSecurity.audit(req, {
        action: 'owner_browser_recovery',
        result: 'failed',
        actorId: 'staging:owner-recovery',
      });
      sendJson(res,
        error.code === 'OWNER_RECOVERY_UNAVAILABLE' ? 410 : 403,
        { error: policyError ? error.message : 'Owner password setup could not be completed.' });
    }
    return true;
  }

  if (pathname === '/api/admin/bootstrap/owner' && req.method === 'POST') {
    const session = adminSecurity.getSession(req);
    if (!session || session.actorType !== 'legacy_owner') {
      sendJson(res, 403, { error: 'Owner bootstrap is unavailable.' });
      return true;
    }
    if (!adminSecurity.validOrigin(req) || !adminSecurity.validCsrf(req, session)) {
      adminSecurity.audit(req, { action: 'owner_bootstrap', result: 'csrf_rejected', session });
      sendJson(res, 403, { error: 'Request could not be verified.' });
      return true;
    }
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      sendJson(res, 403, { error: 'Sign in again before creating the named Owner account.' });
      return true;
    }
    adminSecurity.audit(req, { action: 'owner_bootstrap_started', result: 'started', session });
    try {
      const body = await readBody(req);
      const user = await adminIdentity.bootstrapOwner(body);
      adminSecurity.audit(req, {
        action: 'owner_bootstrap_succeeded',
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: user.id,
      });
      adminSecurity.securityEvent(req, {
        severity: 'high',
        action: 'owner_bootstrap_succeeded',
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: user.id,
      });
      sendJson(res, 201, { ok: true, user });
    } catch (error) {
      const duplicate = error.code === 'BOOTSTRAP_CONFLICT';
      adminSecurity.audit(req, {
        action: duplicate ? 'duplicate_owner_bootstrap_blocked' : 'owner_bootstrap_failed',
        result: 'failed',
        session,
      });
      if (duplicate) {
        adminSecurity.securityEvent(req, {
          severity: 'high',
          action: 'duplicate_owner_bootstrap_blocked',
          result: 'blocked',
          session,
        });
      }
      const status = duplicate ? 409 : 400;
      const safeError = ['PASSWORD_POLICY', 'VALIDATION'].includes(error.code)
        ? error.message
        : 'Owner bootstrap could not be completed.';
      sendJson(res, status, { error: safeError });
    }
    return true;
  }

  if (pathname === '/api/admin/auth/named-login' && req.method === 'POST') {
    if (!adminSecurity.validOrigin(req)) {
      adminSecurity.audit(req, { action: 'named_login', result: 'rejected_origin' });
      sendJson(res, 403, { error: 'Unable to sign in. Check your credentials or try again later.' });
      return true;
    }
    const body = await readBody(req);
    const result = await adminIdentity.authenticate(body.email, body.password, req);
    if (!result.ok) {
      if (result.reason === 'status' && result.user) {
        adminSecurity.revokeUserSessions(result.user.id);
        adminSecurity.securityEvent(req, {
          severity: 'high',
          action: 'named_login_status_denied',
          result: 'blocked',
          actorId: `user:${result.user.id}`,
          entityType: 'admin_user',
          entityId: result.user.id,
        });
      }
      adminSecurity.audit(req, {
        action: result.reason === 'rate_limit' ? 'named_login_rate_limited' : 'named_login_failed',
        result: 'failed',
        actorId: result.user ? `user:${result.user.id}` : 'anonymous',
      });
      sendJson(res, result.reason === 'rate_limit' ? 429 : 401, {
        error: 'Unable to sign in. Check your credentials or try again later.',
      });
      return true;
    }
    const activeSessions = adminIdentity.countActiveSessions(result.user.id, adminSecurity.readState());
    const access = teamPermissionsService.loginDecision(result.user, req, activeSessions);
    if (!access.allowed) {
      adminSecurity.audit(req, {
        action: 'named_login_access_restricted',
        result: 'failed',
        actorId: `user:${result.user.id}`,
      });
      sendJson(res, 401, {
        error: 'Unable to sign in. Check your credentials or try again later.',
      });
      return true;
    }
    const previousToken = parseCookies(req).mg_admin;
    const session = adminSecurity.createSession(req, previousToken, {
      actorType: 'named_user',
      userId: result.user.id,
      sessionRevocationVersion: result.user.sessionRevocationVersion,
      authMethod: 'email_password',
    });
    adminSecurity.audit(req, {
      action: 'named_login_succeeded',
      result: 'success',
      session,
      entityType: 'admin_user',
      entityId: result.user.id,
    });
    adminSecurity.audit(req, {
      action: 'session_created',
      result: 'success',
      session,
      entityType: 'admin_session',
      entityId: session.id,
    });
    sendJson(res, 200, { ok: true, csrfToken: session.csrfToken }, {
      'Set-Cookie': adminSecurity.cookie(session, adminSecurity.isSecureRequest(req)),
    });
    return true;
  }

  if (pathname === '/api/admin/auth/password/forgot' && req.method === 'POST') {
    if (!adminIdentity.allowAction(req, 'password_forgot', 5, 15 * 60 * 1000)) {
      sendJson(res, 200, { ok: true, message: 'If the account is eligible, password-reset instructions will be sent.' });
      return true;
    }
    if (!adminSecurity.validOrigin(req)) {
      sendJson(res, 200, { ok: true, message: 'If the account is eligible, password-reset instructions will be sent.' });
      return true;
    }
    const body = await readBody(req);
    const requested = await adminIdentity.requestPasswordReset(body.email);
    adminSecurity.audit(req, {
      action: 'password_reset_requested',
      result: 'accepted',
      actorId: requested ? `user:${requested.record.userId}` : 'anonymous',
      entityType: requested ? 'admin_user' : null,
      entityId: requested?.record.userId || null,
    });
    sendJson(res, 200, { ok: true, message: 'If the account is eligible, password-reset instructions will be sent.' });
    return true;
  }

  if (pathname === '/api/admin/auth/password/reset' && req.method === 'POST') {
    if (!adminIdentity.allowAction(req, 'password_reset', 10, 15 * 60 * 1000)) {
      sendJson(res, 429, { error: 'Password reset could not be completed.' });
      return true;
    }
    if (!adminSecurity.validOrigin(req)) {
      sendJson(res, 400, { error: 'Password reset could not be completed.' });
      return true;
    }
    const body = await readBody(req);
    const result = await adminIdentity.resetPassword(body.token, body.password);
    if (!result.ok) {
      adminSecurity.audit(req, { action: 'password_reset_failed', result: 'failed', actorId: 'anonymous' });
      adminSecurity.securityEvent(req, {
        severity: 'medium',
        action: 'password_reset_failed',
        result: 'failed',
        actorId: 'anonymous',
      });
      sendJson(res, 400, {
        error: result.reason === 'password_policy' ? result.error : 'Password reset could not be completed.',
      });
      return true;
    }
    adminSecurity.revokeUserSessions(result.user.id);
    adminSecurity.audit(req, {
      action: 'password_reset_completed',
      result: 'success',
      actorId: `user:${result.user.id}`,
      entityType: 'admin_user',
      entityId: result.user.id,
    });
    adminSecurity.securityEvent(req, {
      severity: 'high',
      action: 'password_reset_completed',
      result: 'success',
      actorId: `user:${result.user.id}`,
      entityType: 'admin_user',
      entityId: result.user.id,
    });
    sendJson(res, 200, { ok: true });
    return true;
  }

  if ((pathname === '/api/admin/session' || pathname === '/api/admin/auth/session') && req.method === 'GET') {
    const session = adminSecurity.getSession(req);
    sendJson(res, 200, {
      authenticated: Boolean(session),
      configured: Boolean(process.env.ADMIN_PASSWORD),
      csrfToken: session?.csrfToken || null,
      actorType: session?.actorType || null,
    });
    return true;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    if (!process.env.ADMIN_PASSWORD) {
      sendJson(res, 503, { error: 'Admin access is not configured. Contact the site administrator.' });
      return true;
    }
    if (!adminSecurity.validOrigin(req)) {
      adminSecurity.audit(req, { action: 'login', result: 'rejected_origin' });
      sendJson(res, 403, { error: 'Unable to sign in. Please try again later.' });
      return true;
    }
    const loginStatus = adminSecurity.loginStatus(req);
    if (!loginStatus.allowed) {
      adminSecurity.audit(req, { action: loginStatus.reason === 'lockout' ? 'lockout' : 'login', result: 'blocked' });
      sendJson(res, 429, { error: 'Unable to sign in. Please try again later.' });
      return true;
    }
    adminSecurity.recordLoginAttempt(req);
    const body = await readBody(req);
    if (!safeEqual(body.password, process.env.ADMIN_PASSWORD)) {
      const locked = adminSecurity.recordFailedLogin();
      adminSecurity.audit(req, { action: locked ? 'lockout' : 'login', result: 'failed' });
      sendJson(res, 401, { error: 'Unable to sign in. Check your credentials and try again.' });
      return true;
    }
    adminSecurity.recordSuccessfulLogin();
    const previousToken = parseCookies(req).mg_admin;
    const session = adminSecurity.createSession(req, previousToken, {
      actorType: 'legacy_owner',
      authMethod: 'legacy_password',
    });
    adminSecurity.audit(req, { action: 'login', result: 'success', session });
    adminSecurity.audit(req, {
      action: 'session_created',
      result: 'success',
      session,
      entityType: 'admin_session',
      entityId: session.id,
    });
    if (adminIdentity.owner()) {
      adminSecurity.securityEvent(req, {
        severity: 'high',
        action: 'legacy_login_after_named_owner',
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: adminIdentity.owner().id,
      });
    }
    sendJson(res, 200, { ok: true, csrfToken: session.csrfToken }, {
      'Set-Cookie': adminSecurity.cookie(session, adminSecurity.isSecureRequest(req)),
    });
    return true;
  }

  if ((pathname === '/api/admin/logout' || pathname === '/api/admin/auth/logout') && req.method === 'POST') {
    const session = adminSecurity.getSession(req);
    if (session && (!adminSecurity.validOrigin(req) || !adminSecurity.validCsrf(req, session))) {
      sendJson(res, 403, { error: 'Request could not be verified.' });
      return true;
    }
    const token = parseCookies(req).mg_admin;
    adminSecurity.revokeSession(token);
    adminSecurity.audit(req, { action: 'logout', result: 'success', session });
    if (session) {
      adminSecurity.audit(req, {
        action: 'session_revoked',
        result: 'success',
        session,
        entityType: 'admin_session',
        entityId: session.id,
      });
    }
    sendJson(res, 200, { ok: true }, {
      'Set-Cookie': adminSecurity.clearCookie(adminSecurity.isSecureRequest(req)),
    });
    return true;
  }

  if (!pathname.startsWith('/api/admin/')) return false;
  const session = adminSecurity.getSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Authentication required' });
    return true;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (!adminSecurity.validOrigin(req) || !adminSecurity.validCsrf(req, session))) {
    adminSecurity.audit(req, { action: 'admin_mutation', result: 'csrf_rejected', session });
    sendJson(res, 403, { error: 'Request could not be verified.' });
    return true;
  }

  if (pathname === '/api/admin/plm/status' && req.method === 'GET') {
    try {
      sendJson(res, 200, productPlmService.status());
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/mvp/dashboard' && req.method === 'GET') {
    try {
      sendJson(res, 200, productMvpReadModel.dashboard());
    } catch {
      sendJson(res, 503, { error: 'Product workspace is temporarily unavailable.' });
    }
    return true;
  }

  if (pathname === '/api/admin/activity-stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 5000\n\n');
    operationalLaunchService.subscribe(res);
    return true;
  }

  if (pathname === '/api/admin/mvp/products' && req.method === 'GET') {
    try {
      sendJson(res, 200, { products: productMvpReadModel.products() });
    } catch {
      sendJson(res, 503, { error: 'Product workspace is temporarily unavailable.' });
    }
    return true;
  }

  if (pathname === '/api/admin/product-grid' && req.method === 'GET') {
    try {
      sendJson(res, 200, productGridWorkspace(session));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/categories' && req.method === 'GET') {
    try {
      if (!categoryTaxonomyStore.read().categories.length) await categoryTaxonomyService.sync(session, true);
      sendJson(res, 200, categoryTaxonomyService.workspace(session));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/categories/sync' && req.method === 'POST') {
    try { sendJson(res, 200, await categoryTaxonomyService.sync(session)); }
    catch (error) { const safe = safePlmError(error); sendJson(res, safe.status, { error: safe.message }); }
    return true;
  }
  if (pathname === '/api/admin/categories' && req.method === 'POST') {
    try { sendJson(res, 201, await categoryTaxonomyService.create(session, await readBody(req))); }
    catch (error) { const safe = safePlmError(error); sendJson(res, safe.status, { error: safe.message }); }
    return true;
  }
  if (pathname === '/api/admin/categories/bulk' && req.method === 'POST') {
    try { sendJson(res, 200, await categoryTaxonomyService.bulk(session, await readBody(req))); }
    catch (error) { const safe = safePlmError(error); sendJson(res, safe.status, { error: safe.message }); }
    return true;
  }
  if (pathname === '/api/admin/categories/rules/preview' && req.method === 'POST') {
    try { sendJson(res, 200, categoryTaxonomyService.previewRules(session, await readBody(req))); }
    catch (error) { const safe = safePlmError(error); sendJson(res, safe.status, { error: safe.message }); }
    return true;
  }
  const categoryApiMatch = pathname.match(/^\/api\/admin\/categories\/([0-9a-f-]+)(?:\/(assignments|workflow|activity|media))?$/i);
  if (categoryApiMatch) {
    try {
      const [, categoryId, subroute] = categoryApiMatch;
      if (!subroute && req.method === 'PUT') sendJson(res, 200, await categoryTaxonomyService.update(session, categoryId, await readBody(req)));
      else if (subroute === 'assignments' && req.method === 'POST') sendJson(res, 200, await categoryTaxonomyService.assign(session, categoryId, await readBody(req)));
      else if (subroute === 'media' && req.method === 'POST') sendJson(res, 201, await categoryTaxonomyService.uploadMedia(session, categoryId, await readBody(req, 8 * 1024 * 1024)));
      else if (subroute === 'workflow' && req.method === 'POST') {
        const body = await readBody(req); sendJson(res, 200, await categoryTaxonomyService.workflow(session, categoryId, body.action, body));
      } else if (subroute === 'activity' && req.method === 'GET') sendJson(res, 200, categoryTaxonomyService.activity(session, categoryId));
      else sendJson(res, 405, { error: 'Method not allowed' });
    } catch (error) { const safe = safePlmError(error); sendJson(res, safe.status, { error: safe.message }); }
    return true;
  }

  if (pathname === '/api/admin/product-grid/actions' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      sendJson(res, 200, await productManagementGridService.mutate(session, body));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/product-grid/duplicate' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      sendJson(res, 201, await productManagementGridService.duplicate(session, body));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const productGridHistoryMatch = pathname.match(/^\/api\/admin\/product-grid\/products\/([0-9a-f-]+)\/history$/i);
  if (productGridHistoryMatch && req.method === 'GET') {
    try {
      sendJson(res, 200, productManagementGridService.history(session, productGridHistoryMatch[1]));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/product-editor-v2' && req.method === 'GET') {
    try {
      sendJson(res, 200, productEditorWorkspace(session));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/product-editor-v2/products' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      sendJson(res, 201, await productEditorV2Service.create(session, body));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/product-editor-v2/import' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      sendJson(res, 201, await productEditorV2Service.importWebsite(session, body));
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const copilotMatch = pathname.match(
    /^\/api\/admin\/ai-product-copilot\/products\/([0-9a-f-]+)(?:\/(analyze|review|cancel))?$/i,
  );
  if (copilotMatch) {
    try {
      const productId = copilotMatch[1];
      const operation = copilotMatch[2] || null;
      if (req.method === 'GET' && !operation) {
        sendJson(res, 200, aiProductCopilotService.workspace(session, productId));
      } else if (req.method === 'POST' && operation) {
        const body = await readBody(req);
        const actions = {
          analyze: () => aiProductCopilotService.analyze(session, { ...body, productId }),
          review: () => aiProductCopilotService.recordReview(session, { ...body, productId }),
          cancel: () => aiProductCopilotService.cancel(session, { ...body, productId }),
        };
        sendJson(res, operation === 'analyze' ? 201 : 200, await actions[operation]());
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const mediaStudioMatch = pathname.match(
    /^\/api\/admin\/ai-media-studio\/products\/([0-9a-f-]+)(?:\/(analyze))?$/i,
  );
  if (mediaStudioMatch) {
    try {
      const productId = mediaStudioMatch[1];
      const operation = mediaStudioMatch[2] || null;
      if (req.method === 'GET' && !operation) {
        sendJson(res, 200, aiMediaStudioService.workspace(session, productId));
      } else if (req.method === 'PUT' && !operation) {
        sendJson(res, 200, await aiMediaStudioService.save(session, {
          ...(await readBody(req)), productId,
        }));
      } else if (req.method === 'POST' && operation === 'analyze') {
        sendJson(res, 200, await aiMediaStudioService.analyze(session, {
          ...(await readBody(req)), productId,
        }));
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const editorProductMatch = pathname.match(
    /^\/api\/admin\/product-editor-v2\/products\/([0-9a-f-]+)(?:\/(media|media-library|submit|approve|request-changes|publish|revise))?(?:\/([0-9a-f-]+))?$/i,
  );
  if (editorProductMatch) {
    try {
      const productId = editorProductMatch[1];
      const operation = editorProductMatch[2] || null;
      const mediaId = editorProductMatch[3] || null;
      if (req.method === 'GET' && !operation) {
        sendJson(res, 200, productEditorWorkspace(session, productId));
      } else if (req.method === 'PUT' && !operation) {
        const body = await readBody(req);
        sendJson(res, 200, await productEditorV2Service.save(session, { ...body, productId }));
      } else if (operation === 'media' && req.method === 'POST' && !mediaId) {
        const body = await readBody(req, 8 * 1024 * 1024);
        sendJson(res, 201, await productEditorV2Service.uploadMedia(session, { ...body, productId }));
      } else if (operation === 'media' && req.method === 'PUT' && !mediaId) {
        const body = await readBody(req);
        sendJson(res, 200, await productEditorV2Service.updateMedia(session, { ...body, productId }));
      } else if (operation === 'media' && req.method === 'DELETE' && mediaId) {
        const body = await readBody(req);
        sendJson(res, 200, await productEditorV2Service.removeMedia(session, { ...body, productId, mediaId }));
      } else if (operation === 'media-library' && req.method === 'POST') {
        const body = await readBody(req);
        sendJson(res, 201, await productEditorV2Service.attachMedia(session, { ...body, productId }));
      } else if (req.method === 'POST' && operation) {
        const body = await readBody(req);
        const actions = {
          submit: () => productEditorV2Service.submit(session, { ...body, productId }),
          approve: () => productEditorV2Service.approve(session, { ...body, productId }),
          'request-changes': () => productEditorV2Service.requestChanges(session, { ...body, productId }),
          publish: () => productEditorV2Service.publish(session, { ...body, productId }),
          revise: () => productEditorV2Service.revise(session, { ...body, productId }),
        };
        if (!actions[operation]) {
          sendJson(res, 405, { error: 'Method not allowed.' });
        } else {
          sendJson(res, 201, await actions[operation]());
        }
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/profile' && req.method === 'GET') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    sendJson(res, 200, {
      user: adminIdentity.publicUser(owner),
      sessions: adminSecurity.activeUserSessions(owner.id, session.token),
      passwordAuthority: adminStagingBootstrap.status(),
    });
    return true;
  }

  if (pathname === '/api/admin/profile/password' && req.method === 'POST') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      if (String(body.newPassword || '') !== String(body.confirmNewPassword || '')) {
        throw Object.assign(new Error('New password confirmation does not match.'), {
          code: 'PASSWORD_POLICY',
        });
      }
      const user = await adminIdentity.changeOwnPassword(
        owner.id,
        body.currentPassword,
        body.newPassword,
      );
      const preserved = adminSecurity.preserveCurrentUserSession(
        owner.id,
        session.token,
        user.sessionRevocationVersion,
      );
      if (!preserved) {
        throw Object.assign(new Error('Current session could not be preserved.'), {
          code: 'CONFLICT',
        });
      }
      adminSecurity.audit(req, {
        action: 'owner_password_changed',
        result: 'success',
        session: preserved,
        entityType: 'admin_user',
        entityId: owner.id,
      });
      adminSecurity.securityEvent(req, {
        severity: 'high',
        action: 'owner_password_changed',
        result: 'success',
        actorId: `user:${owner.id}`,
        entityType: 'admin_user',
        entityId: owner.id,
      });
      sendJson(res, 200, {
        ok: true,
        passwordChangedAt: user.passwordChangedAt,
        revokedSessions: preserved.revokedSessions,
      });
    } catch (error) {
      const safe = safePlmError(error);
      adminSecurity.audit(req, {
        action: 'owner_password_change_failed',
        result: 'failed',
        session,
        entityType: 'admin_user',
        entityId: owner.id,
      });
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/profile/sessions/logout-others' && req.method === 'POST') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    const revokedSessions = adminSecurity.revokeOtherUserSessions(owner.id, session.token);
    adminSecurity.audit(req, {
      action: 'owner_other_sessions_revoked',
      result: 'success',
      session,
      entityType: 'admin_user',
      entityId: owner.id,
    });
    sendJson(res, 200, { ok: true, revokedSessions });
    return true;
  }

  if (pathname === '/api/admin/team/users' && req.method === 'GET') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    sendJson(res, 200, teamPermissionsService.workspace(owner, adminSecurity));
    return true;
  }

  if (pathname === '/api/admin/team/users' && req.method === 'POST') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const user = await adminIdentity.createManagedUser(body, `user:${session.userId}`);
      teamPermissionsService.save(owner, user.id, {
        roleId: body.roleId || 'listing_editor',
        expectedRevision: teamPermissionsService.read().revision,
      });
      adminSecurity.audit(req, {
        action: 'listing_editor_created',
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: user.id,
      });
      operationalLaunchService.announce({ type: 'permissions.updated', userId: user.id });
      sendJson(res, 201, {
        user,
        workspace: teamPermissionsService.workspace(owner, adminSecurity),
      });
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const permissionUserMatch = pathname.match(
    /^\/api\/admin\/team\/users\/([0-9a-f-]+)\/(permissions|clone-permissions)$/i,
  );
  if (permissionUserMatch && req.method === 'POST') {
    const owner = namedOwnerForSession(session);
    if (!owner) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const userId = permissionUserMatch[1];
      const operation = permissionUserMatch[2];
      const result = operation === 'permissions'
        ? teamPermissionsService.save(owner, userId, body)
        : teamPermissionsService.clone(owner, body.sourceUserId, userId, body.expectedRevision);
      adminSecurity.audit(req, {
        action: operation === 'permissions' ? 'team_permissions_changed' : 'team_permissions_cloned',
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: userId,
      });
      operationalLaunchService.announce({ type: 'permissions.updated', userId });
      sendJson(res, 200, result);
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const managedUserMatch = pathname.match(
    /^\/api\/admin\/team\/users\/([0-9a-f-]+)\/(status|reset-password|revoke-sessions)$/i,
  );
  if (managedUserMatch && req.method === 'POST') {
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const userId = managedUserMatch[1];
      const operation = managedUserMatch[2];
      let result;
      if (operation === 'status') {
        result = adminIdentity.updateManagedUserStatus(userId, body.active ? 'active' : 'disabled');
        if (!result) {
          throw Object.assign(new Error('Listing Editor was not found.'), { code: 'VALIDATION' });
        }
        adminSecurity.revokeUserSessions(userId);
        teamPermissionsService.record(namedOwnerForSession(session), userId, body.active ? 'account_activated' : 'account_deactivated');
      } else if (operation === 'reset-password') {
        result = await adminIdentity.resetManagedUserPassword(userId, body.password);
        adminSecurity.revokeUserSessions(userId);
        teamPermissionsService.record(namedOwnerForSession(session), userId, 'password_reset');
      } else {
        result = { revokedSessions: adminSecurity.revokeUserSessions(userId) };
        teamPermissionsService.record(namedOwnerForSession(session), userId, 'sessions_revoked');
      }
      adminSecurity.audit(req, {
        action: `listing_editor_${operation.replace('-', '_')}`,
        result: 'success',
        session,
        entityType: 'admin_user',
        entityId: userId,
      });
      sendJson(res, 200, { result });
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const operationalMatch = pathname.match(
    /^\/api\/admin\/mvp\/products\/([0-9a-f-]+)\/operational(?:\/(revise|start|submit|request-changes|approve|publish))?$/i,
  );
  if (operationalMatch) {
    try {
      const productUuid = operationalMatch[1];
      const operation = operationalMatch[2] || null;
      if (req.method === 'GET' && !operation) {
        sendJson(res, 200, operationalLaunchService.workflow(session, productUuid));
      } else if (req.method === 'POST' && operation) {
        const body = await readBody(req);
        const input = { ...body, productUuid };
        const actions = {
          revise: () => operationalLaunchService.revise(session, input),
          start: () => operationalLaunchService.start(session, input),
          submit: () => operationalLaunchService.submit(session, input),
          'request-changes': () => operationalLaunchService.requestChanges(session, input),
          approve: () => operationalLaunchService.approve(session, input),
          publish: () => operationalLaunchService.publish(session, input),
        };
        sendJson(res, 201, await actions[operation]());
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, {
        error: safe.message,
        currentRevision: error.currentRevision,
      });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog' && req.method === 'GET') {
    try {
      sendJson(res, 200, catalogLinkService.catalog());
    } catch {
      sendJson(res, 503, { error: 'Catalog import is temporarily unavailable.' });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog/sync' && req.method === 'POST') {
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const result = catalogLinkService.sync();
      adminSecurity.audit(req, {
        action: 'catalog_read_only_sync',
        result: 'success',
        session,
        entityType: 'catalog',
        entityId: result.sourceRevision,
      });
      sendJson(res, 200, result);
    } catch {
      adminSecurity.audit(req, {
        action: 'catalog_read_only_sync',
        result: 'failure',
        session,
        entityType: 'catalog',
      });
      sendJson(res, 503, { error: 'Catalog import is temporarily unavailable.' });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog/product-dna' && req.method === 'GET') {
    try {
      const requestUrl = new URL(req.url || pathname, `http://${req.headers.host || 'localhost'}`);
      sendJson(res, 200, {
        products: catalogLinkService.productDnaRecords(requestUrl.searchParams.get('q') || ''),
      });
    } catch {
      sendJson(res, 503, { error: 'Product DNA search is temporarily unavailable.' });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog/audit' && req.method === 'GET') {
    try {
      const requestUrl = new URL(req.url || pathname, `http://${req.headers.host || 'localhost'}`);
      sendJson(res, 200, {
        events: catalogLinkService.auditHistory(requestUrl.searchParams.get('catalogProductId') || ''),
      });
    } catch {
      sendJson(res, 503, { error: 'Catalog audit history is temporarily unavailable.' });
    }
    return true;
  }

  const catalogProductMatch = pathname.match(
    /^\/api\/admin\/catalog\/products\/([0-9a-f-]+)(?:\/(link|unlink|ignore|reject-suggestion))?$/i,
  );
  if (catalogProductMatch) {
    const catalogProductId = catalogProductMatch[1];
    const operation = catalogProductMatch[2] || null;
    if (!operation && req.method === 'GET') {
      const product = catalogLinkService.findCatalogProduct(catalogProductId);
      if (!product) sendJson(res, 404, { error: 'Catalog product was not found.' });
      else sendJson(res, 200, {
        product,
        linkStoreRevision: catalogLinkStore.read().storeRevision,
        auditEvents: catalogLinkService.auditHistory(catalogProductId),
      });
      return true;
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' });
      return true;
    }
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const input = { ...body, catalogProductId };
      const operations = {
        link: () => catalogLinkService.link(session, input),
        unlink: () => catalogLinkService.unlink(session, input),
        ignore: () => catalogLinkService.ignore(session, input),
        'reject-suggestion': () => catalogLinkService.rejectSuggestion(session, input),
      };
      if (!operations[operation]) {
        sendJson(res, 404, { error: 'Catalog review action was not found.' });
        return true;
      }
      const result = operations[operation]();
      adminSecurity.audit(req, {
        action: `catalog_product_${operation.replace('-', '_')}`,
        result: 'success',
        session,
        entityType: 'catalog_product',
        entityId: catalogProductId,
      });
      sendJson(res, 200, result);
    } catch (error) {
      const safe = safePlmError(error);
      adminSecurity.audit(req, {
        action: `catalog_product_${String(operation || 'review').replace('-', '_')}`,
        result: 'failure',
        session,
        entityType: 'catalog_product',
        entityId: catalogProductId,
      });
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const mvpProductMatch = pathname.match(/^\/api\/admin\/mvp\/products\/([^/]+)$/);
  if (mvpProductMatch && req.method === 'GET') {
    try {
      const product = productMvpReadModel.product(decodeURIComponent(mvpProductMatch[1]));
      if (!product) sendJson(res, 404, { error: 'Product was not found.' });
      else sendJson(res, 200, product);
    } catch {
      sendJson(res, 503, { error: 'Product workspace is temporarily unavailable.' });
    }
    return true;
  }

  const governanceMatch = pathname.match(
    /^\/api\/admin\/mvp\/products\/([^/]+)\/governance(?:\/(version|approval-request|approve|release|knowledge-lock))?$/,
  );
  if (governanceMatch) {
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const recordKey = decodeURIComponent(governanceMatch[1]);
      let currentProduct = productMvpReadModel.product(recordKey);
      if (!currentProduct) {
        sendJson(res, 404, { error: 'Product was not found.' });
        return true;
      }
      if (req.method === 'GET' && !governanceMatch[2]) {
        if (!currentProduct.productUuid) {
          sendJson(res, 200, {
            storeRevision: productPlmStore.read().storeRevision,
            requiresIdentity: true,
          });
        } else {
          sendJson(res, 200, productGovernanceService.status(currentProduct.productUuid));
        }
        return true;
      }
      if (req.method !== 'POST' || !governanceMatch[2]) {
        sendJson(res, 405, { error: 'Method not allowed.' });
        return true;
      }
      const body = await readBody(req);
      if (!currentProduct.productUuid && governanceMatch[2] === 'version') {
        const sources = {
          adminProducts: readStore().products || [],
          merchantProducts: readMerchantCatalog().products || [],
        };
        const preview = await productPlmService.createPreview(
          req,
          session,
          sources,
          productPlmStore.read().storeRevision,
        );
        await productPlmService.applyMigration(req, session, {
          previewId: preview.preview.id,
          expectedRevision: preview.storeRevision,
          merchantOnlyLegacyIds: [],
          confirmMerchantOnly: false,
        }, sources);
        currentProduct = productMvpReadModel.products().find((item) =>
          item.legacyId === currentProduct.legacyId);
      }
      const productUuid = currentProduct.productUuid;
      if (!productUuid) throw Object.assign(new Error('Product identity is required.'), {
        code: 'VALIDATION',
      });
      const operation = governanceMatch[2];
      const operations = {
        version: () => productGovernanceService.createVersion(session, {
          productUuid,
          expectedRevision: productPlmStore.read().storeRevision,
        }),
        'approval-request': () => productGovernanceService.requestApproval(session, {
          productUuid,
          productVersionId: body.productVersionId,
          expectedRevision: body.expectedRevision,
        }),
        approve: () => productGovernanceService.approve(session, {
          productUuid,
          approvalRequestId: body.approvalRequestId,
          expectedRevision: body.expectedRevision,
        }),
        release: () => productGovernanceService.createRelease(session, {
          productUuid,
          approvalRequestId: body.approvalRequestId,
          expectedRevision: body.expectedRevision,
        }),
        'knowledge-lock': () => productGovernanceService.createKnowledgeLock(session, {
          productUuid,
          releaseId: body.releaseId,
          expectedRevision: body.expectedRevision,
        }),
      };
      const result = await operations[operation]();
      sendJson(res, 201, { ...result, product: productMvpReadModel.product(productUuid) });
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const productIdentityMatch = pathname.match(
    /^\/api\/admin\/mvp\/products\/([0-9a-f-]+)\/identity(?:\/(generate|override|approve|lock|unlock))?$/i,
  );
  if (productIdentityMatch) {
    try {
      const productUuid = productIdentityMatch[1];
      const operation = productIdentityMatch[2] || null;
      if (req.method === 'GET' && !operation) {
        sendJson(res, 200, productIdentityService.view(productUuid));
      } else if (req.method === 'POST' && operation) {
        const body = await readBody(req);
        const product = productMvpReadModel.product(productUuid);
        if (!product) throw Object.assign(new Error('Product was not found.'), { code: 'VALIDATION' });
        const catalogProduct = operation === 'generate'
          ? catalogLinkService.catalog().products.find((item) =>
            item.productUuid === productUuid && item.linkStatus === 'Linked')
          : null;
        const input = {
          ...body,
          productUuid,
          brand: product.brand,
          productType: product.productType,
          title: product.title,
          existingSku: operation === 'generate' ? product.sku : undefined,
          catalogProductId: catalogProduct?.catalogProductId || null,
          variants: operation === 'generate'
            ? (catalogProduct?.variants || []).map((variant) => ({
              size: variant.option === 'Size' ? variant.value : '',
            }))
            : undefined,
        };
        const operations = {
          generate: () => productIdentityService.generate(session, input),
          override: () => productIdentityService.overrideSku(session, input),
          approve: () => productIdentityService.approve(session, input),
          lock: () => productIdentityService.lock(session, input),
          unlock: () => productIdentityService.unlock(session, input),
        };
        sendJson(res, 201, await operations[operation]());
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const listingMatch = pathname.match(
    /^\/api\/admin\/mvp\/products\/([0-9a-f-]+)\/listing-studio(?:\/(generate|input|edit|restore|approve|export))?$/i,
  );
  if (listingMatch) {
    try {
      const productUuid = listingMatch[1];
      const operation = listingMatch[2] || null;
      if (req.method === 'POST' && operation) {
        const body = await readBody(req);
        const linkedCatalog = operation === 'export' && !body.catalogId
          ? catalogLinkService.catalog().products.find((item) =>
            item.productUuid === productUuid && item.linkStatus === 'Linked')
          : null;
        const input = {
          ...body,
          productUuid,
          catalogId: body.catalogId || linkedCatalog?.catalogProductId || '',
        };
        const operations = {
          generate: () => listingStudioService.generate(session, input),
          input: () => listingStudioService.saveInput(session, input),
          edit: () => listingStudioService.saveEdit(session, input),
          restore: () => listingStudioService.restore(session, input),
          approve: () => listingStudioService.approve(session, input),
          export: () => listingStudioService.exportPackage(session, input),
        };
        const result = await operations[operation]();
        if (['generate', 'edit', 'restore'].includes(operation)) {
          operationalLaunchService.announce({ type: 'draft.updated', productUuid });
        }
        sendJson(res, operation === 'export' ? 200 : 201, result);
      } else if (req.method === 'GET') {
        sendJson(res, 200, listingStudioService.workspace(session, productUuid));
      } else {
        sendJson(res, 405, { error: 'Method not allowed.' });
      }
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  const productDnaMatch = pathname.match(/^\/api\/admin\/plm\/products\/([0-9a-f-]+)\/dna$/i);
  if (productDnaMatch && req.method === 'GET') {
    try {
      const dna = productPlmService.productDna(productDnaMatch[1]);
      if (!dna) sendJson(res, 404, { error: 'Product DNA was not found.' });
      else sendJson(res, 200, dna);
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/plm/migrations/preview' && req.method === 'POST') {
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const merchantCatalog = readMerchantCatalog();
      const result = await productPlmService.createPreview(req, session, {
        adminProducts: readStore().products || [],
        merchantProducts: merchantCatalog.products || [],
      }, body.expectedRevision);
      sendJson(res, 201, result);
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/plm/migrations/apply' && req.method === 'POST') {
    if (!namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    try {
      const body = await readBody(req);
      const merchantCatalog = readMerchantCatalog();
      const result = await productPlmService.applyMigration(req, session, body, {
        adminProducts: readStore().products || [],
        merchantProducts: merchantCatalog.products || [],
      });
      sendJson(res, 200, result);
    } catch (error) {
      const safe = safePlmError(error);
      sendJson(res, safe.status, { error: safe.message });
    }
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'GET') {
    sendJson(res, 200, readStore());
    return true;
  }

  if (pathname === '/api/admin/me' && req.method === 'GET') {
    const namedUser = session.actorType === 'named_user' ? adminIdentity.findById(session.userId) : null;
    const owner = adminIdentity.owner();
    sendJson(res, 200, {
      actorType: session.actorType,
      user: adminIdentity.publicUser(namedUser),
      access: namedUser ? teamPermissionsService.userAccess(namedUser) : null,
      owner: adminIdentity.publicUser(owner),
      activeSessionCount: namedUser
        ? adminIdentity.countActiveSessions(namedUser.id, adminSecurity.readState())
        : null,
      bootstrapAvailable: session.actorType === 'legacy_owner' && !owner,
      legacyCompatibilityEnabled: Boolean(process.env.ADMIN_PASSWORD),
      legacyCompatibilityWarning: owner && process.env.ADMIN_PASSWORD
        ? 'Legacy compatibility login is still enabled and must be removed only after later security phases and explicit Owner approval.'
        : null,
    });
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'PUT') {
    if (session.actorType === 'named_user' && !namedOwnerForSession(session)) {
      sendJson(res, 403, { error: 'Named Owner access is required.' });
      return true;
    }
    const body = await readBody(req);
    const next = normalizeStore(body);
    next.activity = [
      {
        id: `act-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'admin',
        message: 'Store data saved from admin panel',
      },
      ...next.activity.slice(0, 24),
    ];
    writeStore(next);
    try {
      catalogLinkService.sync();
      operationalLaunchService.announce({ type: 'website.published', productUuid: null });
    } catch {
      // The saved store remains authoritative; Catalog exposes its own safe sync error.
    }
    adminSecurity.audit(req, {
      action: 'store_update',
      result: 'success',
      session,
      entityType: 'admin_store',
      entityId: 'primary',
    });
    sendJson(res, 200, readStore());
    return true;
  }

  sendJson(res, 404, { error: 'API route not found' });
  return true;
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      send(res, 404, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | MOTOGRIP GEAR</title></head><body><main><h1>Page not found</h1><p>The requested page does not exist.</p><a href="/">Return to MOTOGRIP GEAR</a></main></body></html>', 'text/html; charset=utf-8', { 'X-Robots-Tag': 'noindex' });
      return;
    }
    const finalPath = filePath;
    fs.readFile(finalPath, (readErr, data) => {
      if (readErr) {
        send(res, 404, 'Not found');
        return;
      }
      const ext = path.extname(finalPath).toLowerCase();
      const relativePath = path.relative(root, finalPath);
      const isAdminAsset = relativePath === 'admin.js' || relativePath === 'admin.css';
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' || isAdminAsset ? 'no-cache' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      if (req.method === 'HEAD') res.end();
      else res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (indexingDisabled()) res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const requestPath = decodeURIComponent(url.pathname);

    if (requestPath === '/admin/owner-recovery') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, 'Method not allowed');
        return;
      }
      const recovery = adminOwnerRecovery.status();
      if (!recovery.enabled || !recovery.ownerMatches) {
        send(res, 410, 'Owner password setup is unavailable.');
        return;
      }
      send(res, 200, req.method === 'HEAD' ? '' : ownerRecoveryPage(), 'text/html; charset=utf-8', {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      });
      return;
    }

    if (requestPath === '/admin/system/bootstrap-status') {
      if (req.method !== 'GET') {
        send(res, 405, 'Method not allowed');
        return;
      }
      const session = adminSecurity.getSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Authentication required' });
        return;
      }
      if (!namedOwnerForSession(session)) {
        sendJson(res, 403, { error: 'Named Owner access required' });
        return;
      }
      sendJson(res, 200, adminStagingBootstrap.status());
      return;
    }

    if (requestPath.startsWith('/api/')) {
      const handled = await handleApi(req, res, requestPath);
      if (handled) return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method not allowed');
      return;
    }

    if (assetCdnBase && requestPath.startsWith('/assets/generated/')) {
      res.writeHead(302, {
        Location: `${assetCdnBase}${requestPath}`,
        'Cache-Control': 'public, max-age=300',
      });
      res.end();
      return;
    }

    if (requestPath === '/sitemap.xml') {
      serveSitemap(req, res);
      return;
    }

    if (requestPath === '/sitemap_index.xml' || requestPath === '/product-sitemap1.xml') {
      res.writeHead(301, { Location: '/sitemap.xml', 'Cache-Control': 'public, max-age=86400' });
      res.end();
      return;
    }

    if (requestPath === '/google-merchant-feed.xml') {
      serveMerchantFeed(req, res);
      return;
    }

    if (requestPath === '/meta-catalog-feed.csv') {
      serveMetaCatalogFeed(req, res);
      return;
    }

    if (requestPath === '/robots.txt') {
      const robots = indexingDisabled()
        ? 'User-agent: *\nDisallow: /\n'
        : `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(req, '/sitemap.xml')}\n`;
      send(res, 200, robots, 'text/plain; charset=utf-8');
      return;
    }

    if (requestPath === '/admin' || requestPath.startsWith('/admin/')) {
      const hasExtension = Boolean(path.extname(requestPath));
      const assetPath = hasExtension ? requestPath.replace(/^\/admin/, '/admin') : '/admin.html';
      const adminFile = path.join(root, assetPath.replace(/^\/+/, ''));
      serveFile(req, res, adminFile);
      return;
    }

    const productMatch = requestPath.match(/^\/products\/([a-z0-9-]+)\/?$/);
    if (productMatch) {
      serveProductPage(req, res, productMatch[1]);
      return;
    }

    const categoryMatch = requestPath.match(/^\/collections\/([a-z0-9-]+)\/?$/);
    if (categoryMatch) {
      serveCategoryPage(req, res, categoryMatch[1]);
      return;
    }

    const editorMediaMatch = requestPath.match(/^\/product-editor-media\/([0-9a-f-]+)\/([0-9a-f-]+\.(?:jpg|png|webp))$/i);
    if (editorMediaMatch) {
      const mediaPath = path.join(productEditorV2Store.paths.mediaDir, editorMediaMatch[1], editorMediaMatch[2]);
      serveFile(req, res, mediaPath);
      return;
    }

    const categoryMediaMatch = requestPath.match(/^\/category-media\/([0-9a-f-]+)\/([0-9a-f-]+\.(?:jpg|png|webp))$/i);
    if (categoryMediaMatch) {
      serveFile(req, res, path.join(categoryTaxonomyStore.paths.mediaDir, categoryMediaMatch[1], categoryMediaMatch[2]));
      return;
    }

    const normalizedRoutePath = requestPath !== '/' ? requestPath.replace(/\/$/, '') : '/';
    if (publicRoutes[normalizedRoutePath]) {
      if (requestPath !== normalizedRoutePath && requestPath !== '/') {
        res.writeHead(301, { Location: normalizedRoutePath, 'Cache-Control': 'public, max-age=86400' });
        res.end();
        return;
      }
      servePublicRoute(req, res, publicRoutes[normalizedRoutePath]);
      return;
    }

    const filePath = resolvePath(req.url || '/');
    if (!filePath) {
      send(res, 403, 'Forbidden');
      return;
    }

    serveFile(req, res, filePath);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || 'Server error' });
  }
});

ensureStore();

if (require.main === module) {
  adminStagingBootstrap.ensure()
    .then(() => productEditorV2Service.backfillMediaPaths())
    .then(() => {
      server.listen(port, host, () => {
        console.log(`MOTOGRIP GEAR site listening on http://${host}:${port}`);
      });
    })
    .catch(() => {
      console.error('Admin startup configuration failed');
      process.exitCode = 1;
    });
}

module.exports = {
  server,
  adminIdentity,
  adminOwnerRecovery,
  adminStagingBootstrap,
  adminSecurity,
  teamPermissionsService,
  catalogSyncService,
  catalogSyncStore,
  catalogLinkService,
  catalogLinkStore,
  productPlmStore,
  productPlmService,
  productMvpReadModel,
  operationalLaunchService,
  operationalLaunchStore,
  websiteWriteAdapter,
  productEditorV2Store,
  productEditorV2Service,
  productManagementGridService,
  categoryTaxonomyStore,
  categoryTaxonomyService,
  aiProductCopilotStore,
  aiProductCopilotService,
  productMeta,
  injectProductHead,
  injectRouteHead,
  publicRoutes,
  indexablePublicPaths,
  readPublicStore,
};
