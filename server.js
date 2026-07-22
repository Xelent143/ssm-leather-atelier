const http = require('http');
const https = require('https');
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
const merchantStorePath = path.join(root, 'merchant-catalog.json');
const sessions = new Map();
const returnRequestAttempts = new Map();
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const paypalApiBase = (process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com').replace(/\/+$/, '');

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
  '/shipping-information': { view: 'ship', title: 'Worldwide Shipping Information | MOTOGRIP GEAR', desc: 'Review MOTOGRIP GEAR delivery regions, estimated transit, tracking, costs, duties, and worldwide shipping information.' },
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
  if (!imagePath) return absoluteUrl(req, '/assets/motogrip-logo-transparent.png');
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
    if (!product || product.status === 'archived') throw new Error('A product in your bag is no longer available.');

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
        returnFees: 'https://schema.org/FreeReturn',
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
<script>window.__SSM_INITIAL_ROUTE__ = ${escapeScriptJson({ view: 'pdp', productSlug: product.slug })};</script>`;
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
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeHtml(route.desc)}" />`)
    .replace(/<meta name="robots" content=".*?" \/>/s, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeHtml(route.desc)}" />`)
    .replace('</head>', `<script>window.__SSM_INITIAL_ROUTE__ = ${escapeScriptJson(initialRoute)};</script>\n</head>`);
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
  const store = readPublicStore();
  const urls = [
    ...indexablePublicPaths,
    ...store.products.filter((product) => product.status !== 'archived').map(productPath),
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

function serveMerchantFeed(req, res) {
  const store = readPublicStore();
  const currency = store.settings.currency || 'USD';
  const items = [];

  store.products
    .filter((product) => product.status === 'active')
    .forEach((product) => {
      const variants = Object.keys(product.stock || {}).length
        ? Object.entries(product.stock)
        : [[product.size || 'One Size', Number(product.inventory || 0)]];
      const sku = product.sku || product.id;
      const groupId = product.itemGroupId || product.slug || product.id;
      const link = product.canonicalUrl || absoluteUrl(req, productPath(product));
      const image = productImageUrl(req, product.primaryImage || product.image);
      const description = product.schemaDescription || product.description || `${product.title} by MOTOGRIP GEAR.`;

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
          ['mpn', product.mpn || sku],
          ['identifier_exists', 'true'],
          ['google_product_category', product.googleProductCategory],
          ['product_type', product.productType || product.category],
          ['age_group', String(product.ageGroup || 'adult').toLowerCase()],
          ['gender', merchantGender(product.gender)],
          ['size', size],
          ['size_system', String(product.sizeSystem || 'US').toUpperCase()],
          ['size_type', String(product.sizeType || 'regular').toLowerCase()],
          ['item_group_id', groupId],
          ['color', product.color],
          ['material', product.material || product.leatherType],
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
    returnRequests: returnRequests.map((request) => ({
      ...request,
      id: String(request.id || `RET-${Date.now()}`),
      status: String(request.status || 'new'),
    })),
    activity,
  };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/catalog' && req.method === 'GET') {
    sendJson(res, 200, publicCatalog(readPublicStore()));
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

    if (requestPath === '/sitemap_index.xml' || requestPath === '/product-sitemap1.xml') {
      res.writeHead(301, { Location: '/sitemap.xml', 'Cache-Control': 'public, max-age=86400' });
      res.end();
      return;
    }

    if (requestPath === '/google-merchant-feed.xml') {
      serveMerchantFeed(req, res);
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
  server.listen(port, host, () => {
    console.log(`MOTOGRIP GEAR site listening on http://${host}:${port}`);
  });
}

module.exports = {
  server,
  productMeta,
  injectProductHead,
  injectRouteHead,
  publicRoutes,
  indexablePublicPaths,
  readPublicStore,
};
