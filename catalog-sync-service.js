const crypto = require('crypto');

const SYNC_STATUSES = Object.freeze([
  'Synced',
  'Needs Review',
  'Missing SKU',
  'Inventory Mismatch',
  'Import Error',
]);

function clean(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function nonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function canonicalPath(product) {
  const slug = clean(product?.slug).toLowerCase();
  return slug ? `/products/${encodeURIComponent(slug)}` : null;
}

function imagePath(product) {
  const value = clean(product?.primaryImage || product?.image, 'assets/generated/leather-detail.png');
  return value.startsWith('/') ? value : `/${value}`;
}

function catalogUuid(seed) {
  const hash = crypto.createHash('sha256').update(`motogrip-catalog:${seed}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function variantProjection(product) {
  const stock = product?.stock && typeof product.stock === 'object' && !Array.isArray(product.stock)
    ? product.stock
    : {};
  return Object.entries(stock).map(([size, quantity]) => ({
    option: 'Size',
    value: clean(size, 'Unspecified'),
    quantity: nonNegativeInteger(quantity),
  }));
}

function identityCandidates(plm, product) {
  const sourceId = clean(product?.id);
  const sku = clean(product?.sku).toLowerCase();
  const mappings = (plm?.legacyMappings || []).filter((mapping) =>
    mapping.sourceEntityType === 'product' && clean(mapping.legacyId) === sourceId);
  const mappedIds = new Set(mappings.map((mapping) => mapping.productUuid));
  if (mappedIds.size) return [...mappedIds];
  if (!sku) return [];
  const styleIds = new Set((plm?.sellableItems || [])
    .filter((item) => clean(item.sku).toLowerCase() === sku)
    .map((item) => item.styleId));
  return [...new Set((plm?.productStyles || [])
    .filter((style) => styleIds.has(style.id))
    .map((style) => style.productUuid)
    .filter(Boolean))];
}

function projectProduct(product, plm, syncedAt) {
  const sourceId = clean(product?.id);
  const sku = clean(product?.sku);
  const url = canonicalPath(product);
  if (!sourceId && !sku && !url) throw new Error('Website product has no stable identifier.');
  const variants = variantProjection(product);
  const totalInventory = nonNegativeInteger(product?.inventory);
  const variantInventory = variants.reduce((sum, variant) => sum + variant.quantity, 0);
  const matches = identityCandidates(plm, product);
  let syncStatus = 'Synced';
  let reviewReason = null;
  if (!sku) {
    syncStatus = 'Missing SKU';
    reviewReason = 'A product SKU is required before identity matching can be confirmed.';
  } else if (variants.length && variantInventory !== totalInventory) {
    syncStatus = 'Inventory Mismatch';
    reviewReason = 'Website inventory does not equal the sum of variant quantities.';
  } else if (matches.length !== 1) {
    syncStatus = 'Needs Review';
    reviewReason = matches.length > 1
      ? 'Multiple Product DNA identities match this website product.'
      : 'No Product DNA identity is linked to this website product.';
  }
  const stableSeed = sourceId || sku.toLowerCase() || url;
  const lastUpdated = clean(product?.updatedAt || product?.lastUpdated || syncedAt);
  return {
    catalogProductId: catalogUuid(stableSeed),
    source: {
      system: 'motogrip_website',
      sourceId: sourceId || null,
      sourceSku: sku || null,
      sourceUrl: url,
    },
    productUuid: matches.length === 1 ? matches[0] : null,
    image: imagePath(product),
    title: clean(product?.title, 'Untitled product'),
    productUrl: url,
    sku: sku || null,
    brand: clean(product?.brand, 'MOTOGRIP GEAR'),
    productType: clean(product?.productType || product?.category, 'Unclassified'),
    price: Number(product?.price || 0),
    currency: 'USD',
    variants,
    availableSizes: variants.filter((variant) => variant.quantity > 0).map((variant) => variant.value),
    variantCount: variants.length,
    totalInventory,
    productStatus: clean(product?.status, 'unknown'),
    lastUpdated,
    syncStatus,
    reviewReason,
    importedAt: syncedAt,
  };
}

function deduplicate(products) {
  const seenUrls = new Set();
  const seenSkus = new Set();
  return products.filter((product) => {
    const url = canonicalPath(product);
    const sku = clean(product?.sku).toLowerCase();
    if (url && seenUrls.has(url)) return false;
    if (sku && seenSkus.has(sku)) return false;
    if (url) seenUrls.add(url);
    if (sku) seenSkus.add(sku);
    return true;
  });
}

function summarize(store) {
  const products = store.products || [];
  return {
    schemaVersion: store.schemaVersion,
    storeRevision: store.storeRevision,
    lastSyncAt: store.lastSyncAt,
    sourceRevision: store.sourceRevision,
    productCount: products.length,
    variantCount: products.reduce((sum, product) => sum + product.variantCount, 0),
    totalInventory: products.reduce((sum, product) => sum + product.totalInventory, 0),
    needsReviewCount: products.filter((product) => product.syncStatus !== 'Synced').length,
    statusCounts: Object.fromEntries(SYNC_STATUSES.map((status) => [
      status,
      products.filter((product) => product.syncStatus === status).length,
    ])),
    products,
  };
}

function createCatalogSyncService(options = {}) {
  const store = options.store;
  const readWebsiteCatalog = options.readWebsiteCatalog;
  const readPlmStore = options.readPlmStore;
  const now = options.now || (() => new Date().toISOString());
  if (!store || !readWebsiteCatalog || !readPlmStore) {
    throw new Error('Catalog sync dependencies are required.');
  }

  function sync() {
    const current = store.read();
    const syncedAt = now();
    const website = readWebsiteCatalog();
    const sourceProducts = deduplicate(Array.isArray(website?.products) ? website.products : []);
    const plm = readPlmStore();
    const products = sourceProducts.map((product) => {
      try {
        return projectProduct(product, plm, syncedAt);
      } catch (error) {
        const sourceId = clean(product?.id || product?.sku || product?.slug, 'unknown');
        return {
          catalogProductId: catalogUuid(sourceId),
          source: { system: 'motogrip_website', sourceId, sourceSku: null, sourceUrl: null },
          productUuid: null,
          image: 'assets/generated/leather-detail.png',
          title: clean(product?.title, 'Import error'),
          productUrl: null,
          sku: clean(product?.sku) || null,
          brand: clean(product?.brand, 'MOTOGRIP GEAR'),
          productType: clean(product?.productType || product?.category, 'Unclassified'),
          price: Number(product?.price || 0),
          currency: 'USD',
          variants: [],
          availableSizes: [],
          variantCount: 0,
          totalInventory: nonNegativeInteger(product?.inventory),
          productStatus: clean(product?.status, 'unknown'),
          lastUpdated: syncedAt,
          syncStatus: 'Import Error',
          reviewReason: 'The website record could not be safely projected.',
          importedAt: syncedAt,
        };
      }
    });
    const sourceRevision = crypto.createHash('sha256')
      .update(JSON.stringify(sourceProducts))
      .digest('hex');
    return summarize(store.write({
      ...current,
      lastSyncAt: syncedAt,
      sourceRevision,
      products,
    }, current.storeRevision));
  }

  function catalog() {
    const current = store.read();
    return current.lastSyncAt ? summarize(current) : sync();
  }

  return {
    catalog,
    sync,
  };
}

module.exports = {
  CATALOG_SYNC_STATUSES: SYNC_STATUSES,
  catalogUuid,
  createCatalogSyncService,
  projectCatalogProduct: projectProduct,
};
