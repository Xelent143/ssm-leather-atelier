const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
const assetCdnBase = (process.env.ASSET_CDN_BASE || '').replace(/\/+$/, '');
const adminPassword = process.env.ADMIN_PASSWORD || 'motogrip-admin';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const dataDir = path.join(root, 'data');
const storePath = path.join(dataDir, 'admin-store.json');
const sessions = new Map();
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');

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
      madeToMeasureLeadTime: '21-28 business days',
      supportEmail: 'support@motogripgear.com',
      brandVoice: 'Direct, road-tested, fit-aware, and precise.',
      imageryPrompt: 'Premium light-theme studio product photography for MOTOGRIP GEAR: warm ivory backdrop, road-ready leather jackets, crisp grain detail, natural daylight, soft shadow, editorial ecommerce crop, no dark background.',
    },
    products: [],
    orders: [],
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

function writeStore(store) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const next = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  const tmp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  fs.renameSync(tmp, storePath);
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), 'application/json; charset=utf-8', {
    'Cache-Control': 'no-store',
    ...headers,
  });
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
  if (!imagePath) return absoluteUrl(req, '/assets/motogrip-logo.svg');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  if (assetCdnBase && cleanPath.startsWith('/assets/generated/')) return `${assetCdnBase}${cleanPath}`;
  return absoluteUrl(req, cleanPath);
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((item) => {
    const [key, ...value] = item.trim().split('=');
    return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
  }));
}

function getSession(req) {
  const token = parseCookies(req).mg_admin;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function setSession(res) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + sessionTtlMs });
  return `mg_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
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
    products: store.products.filter((product) => product.status !== 'archived'),
  };
}

function productMeta(product, store, req) {
  const currency = store.settings.currency || 'USD';
  const title = product.seoTitle || `${product.title} | ${product.category}, ${product.gender} | MOTOGRIP GEAR`;
  const desc = (product.seoDescription || product.schemaDescription || product.description || `${product.title} from MOTOGRIP GEAR.`).slice(0, 158);
  const canonical = product.canonicalUrl || absoluteUrl(req, productPath(product));
  const image = productImageUrl(req, product.primaryImage || product.image);
  const images = [image, ...(Array.isArray(product.galleryImages) ? product.galleryImages.map((src) => productImageUrl(req, src)) : [])];
  const availability = Number(product.inventory || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [...new Set(images)],
    description: product.schemaDescription || product.description,
    sku: product.sku || product.id,
    mpn: product.mpn || product.sku || product.id,
    gtin: product.gtin || undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand || store.settings.storeName || 'MOTOGRIP GEAR',
    },
    category: product.productType || product.category,
    material: product.material || product.leatherType || undefined,
    color: product.color || undefined,
    size: product.size || undefined,
    audience: product.gender ? { '@type': 'PeopleAudience', suggestedGender: product.gender } : undefined,
    additionalProperty: [
      ['Made to measure', product.madeToMeasureEnabled ? `Available +${currency} ${product.madeToMeasureSurcharge}` : 'Not available'],
      ['Leather type', product.leatherType],
      ['Hardware', product.hardware],
      ['Lining', product.lining],
      ['Riding use', product.ridingUseCase],
      ['Care', product.careInstructions],
    ].filter(([, value]) => value !== undefined && value !== '').map(([name, value]) => ({ '@type': 'PropertyValue', name, value: String(value) })),
    offers: {
      '@type': 'Offer',
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
        shippingLabel: product.shippingPolicy,
      } : undefined,
      hasMerchantReturnPolicy: product.returnPolicy ? {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnFees: 'https://schema.org/FreeReturn',
      } : undefined,
    },
  };
  if (Number(product.ratingValue || 0) > 0 && Number(product.reviewCount || 0) > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.ratingValue),
      reviewCount: Number(product.reviewCount),
    };
  }
  return { title, desc, canonical, image, jsonLd };
}

function injectProductHead(html, product, store, req) {
  const meta = productMeta(product, store, req);
  const extraHead = `
<link rel="canonical" href="${escapeHtml(meta.canonical)}" />
<meta property="og:url" content="${escapeHtml(meta.canonical)}" />
<meta property="product:price:amount" content="${escapeHtml(product.price)}" />
<meta property="product:price:currency" content="${escapeHtml(store.settings.currency || 'USD')}" />
<script type="application/ld+json">${escapeScriptJson(meta.jsonLd)}</script>
<script>window.__SSM_INITIAL_ROUTE__ = ${escapeScriptJson({ view: 'pdp', productSlug: product.slug })};</script>`;
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<meta property="og:type" content=".*?" \/>/s, '<meta property="og:type" content="product" />')
    .replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeHtml(meta.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${escapeHtml(meta.image)}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${escapeHtml(meta.desc)}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/s, `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`)
    .replace('</head>', `${extraHead}\n</head>`);
}

function serveProductPage(req, res, slug) {
  const store = readStore();
  const product = store.products.find((item) => item.slug === slug && item.status !== 'archived');
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
  const store = readStore();
  const urls = [
    '/',
    '/#/shop',
    '/#/mto',
    '/#/size',
    '/#/ship',
    ...store.products.filter((product) => product.status !== 'archived').map(productPath),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((urlPath) => `  <url><loc>${escapeHtml(absoluteUrl(req, urlPath))}</loc></url>`).join('\n')}
</urlset>
`;
  send(res, 200, xml, 'application/xml; charset=utf-8', { 'Cache-Control': 'public, max-age=3600' });
}

function normalizeStore(input) {
  const current = readStore();
  const products = Array.isArray(input.products) ? input.products : current.products;
  const orders = Array.isArray(input.orders) ? input.orders : current.orders;
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
      status: ['active', 'draft', 'archived'].includes(product.status) ? product.status : 'draft',
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
      sizeSystem: String(product.sizeSystem || 'US'),
      sizeType: String(product.sizeType || 'Regular'),
      ageGroup: String(product.ageGroup || 'Adult'),
      itemGroupId: String(product.itemGroupId || product.slug || product.id || ''),
      variantOptions: Array.isArray(product.variantOptions) ? product.variantOptions.map(String) : [],
      shippingWeight: String(product.shippingWeight || ''),
      shippingPolicy: String(product.shippingPolicy || 'Complimentary express shipping on stock pieces'),
      returnPolicy: String(product.returnPolicy || '30-day returns on stock pieces; made-to-measure pieces are final sale with alteration support'),
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
    activity,
  };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/catalog' && req.method === 'GET') {
    sendJson(res, 200, publicCatalog(readStore()));
    return true;
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    sendJson(res, 200, {
      authenticated: Boolean(getSession(req)),
      defaultPasswordInUse: !process.env.ADMIN_PASSWORD,
    });
    return true;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.password !== adminPassword) {
      sendJson(res, 401, { error: 'Invalid password' });
      return true;
    }
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': setSession(res) });
    return true;
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const token = parseCookies(req).mg_admin;
    if (token) sessions.delete(token);
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'mg_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    return true;
  }

  if (!pathname.startsWith('/api/admin/')) return false;
  if (!getSession(req)) {
    sendJson(res, 401, { error: 'Authentication required' });
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'GET') {
    sendJson(res, 200, readStore());
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'PUT') {
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
    sendJson(res, 200, readStore());
    return true;
  }

  sendJson(res, 404, { error: 'API route not found' });
  return true;
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (statErr, stat) => {
    const finalPath = !statErr && stat.isFile() ? filePath : path.join(root, 'index.html');
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
      });
      if (req.method === 'HEAD') res.end();
      else res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const requestPath = decodeURIComponent(url.pathname);

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

    if (requestPath === '/robots.txt') {
      send(res, 200, `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(req, '/sitemap.xml')}\n`, 'text/plain; charset=utf-8');
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

server.listen(port, host, () => {
  console.log(`MOTOGRIP GEAR site listening on http://${host}:${port}`);
});
