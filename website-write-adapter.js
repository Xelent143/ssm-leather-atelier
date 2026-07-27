const crypto = require('crypto');

const PUBLISHABLE_FIELDS = new Set([
  'title', 'shortDescription', 'description', 'features', 'specifications',
  'perfectFor', 'whyYouWillLoveIt', 'faq', 'buyingGuide', 'seoTitle',
  'metaDescription', 'tags', 'brand', 'productType', 'slug', 'price',
  'compareAtPrice', 'status', 'stock', 'inventory', 'imageMetadata',
  'descriptionHtml', 'maker', 'category', 'gender', 'collections', 'costPerItem',
  'taxable', 'image', 'primaryImage', 'galleryImages', 'options', 'variants',
  'variantOptions', 'availableColors', 'sku', 'internalProductCode', 'factoryCode',
  'shipping', 'shippingWeight', 'metafields', 'factualProjection',
]);

function cleanSlug(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
}

function websiteRevision(product) {
  const stable = product && typeof product === 'object'
    ? { ...product, websiteRevision: null }
    : product || {};
  return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

function revisionMatches(expected, product) {
  if (!expected) return true;
  const legacy = crypto.createHash('sha256').update(JSON.stringify(product || {})).digest('hex');
  return expected === websiteRevision(product) ||
    expected === product?.websiteRevision ||
    expected === legacy;
}

function createWebsiteWriteAdapter(options = {}) {
  const readStore = options.readStore;
  const readWebsiteCatalog = options.readWebsiteCatalog || readStore;
  const writeStore = options.writeStore;
  const onMutation = options.onMutation || (() => {});

  async function publish(input) {
    const store = readStore();
    const products = Array.isArray(store.products) ? store.products : [];
    const websiteProducts = Array.isArray(readWebsiteCatalog().products)
      ? readWebsiteCatalog().products
      : [];
    const source = websiteProducts.find((product) =>
      String(product.id) === String(input.websiteProductId) ||
      String(product.slug) === String(input.currentHandle));
    const index = products.findIndex((product) =>
      String(product.id) === String(input.websiteProductId) ||
      String(product.slug) === String(input.currentHandle));
    const current = index >= 0 ? products[index] : source || null;
    const currentRevision = websiteRevision(current);
    if (!revisionMatches(input.expectedWebsiteRevision, current)) {
      throw Object.assign(new Error('Website product changed after this draft was opened.'), {
        code: 'REVISION_CONFLICT',
        currentRevision,
      });
    }
    const fields = Object.fromEntries(Object.entries(input.fields || {})
      .filter(([key]) => PUBLISHABLE_FIELDS.has(key)));
    const slug = cleanSlug(fields.slug || current?.slug || input.currentHandle);
    if (!slug || !fields.title || !Number.isFinite(Number(fields.price))) {
      throw Object.assign(new Error('Website title, handle and price are required.'), {
        code: 'VALIDATION',
      });
    }
    const duplicate = websiteProducts.find((product) =>
      String(product.id) !== String(current?.id) && String(product.slug) === slug);
    if (duplicate) {
      throw Object.assign(new Error('Website handle already belongs to another product.'), {
        code: 'DUPLICATE_PRODUCT',
      });
    }
    const nextProduct = {
      ...(current || {}),
      ...fields,
      id: current?.id || String(input.websiteProductId || crypto.randomUUID()),
      slug,
      updatedAt: new Date().toISOString(),
      websiteRevision: null,
    };
    nextProduct.websiteRevision = websiteRevision({ ...nextProduct, websiteRevision: null });
    const nextProducts = [...products];
    if (index >= 0) nextProducts[index] = nextProduct;
    else nextProducts.push(nextProduct);
    writeStore({ ...store, products: nextProducts });
    try {
      await onMutation({
        action: index >= 0 ? 'website_product_updated' : 'website_product_created',
        product: nextProduct,
        previousRevision: currentRevision,
        newRevision: nextProduct.websiteRevision,
      });
    } catch {
      writeStore(store);
      throw Object.assign(new Error('Website synchronization failed; no product change was kept.'), {
        code: 'SYNC_FAILED',
      });
    }
    return {
      product: structuredClone(nextProduct),
      previousRevision: currentRevision,
      newRevision: nextProduct.websiteRevision,
      created: index < 0,
    };
  }

  async function setStatuses(inputs = []) {
    const allowed = new Set(['active', 'hidden', 'archived']);
    const store = readStore();
    const products = Array.isArray(store.products) ? store.products : [];
    const websiteProducts = Array.isArray(readWebsiteCatalog().products)
      ? readWebsiteCatalog().products
      : [];
    const changes = [];
    const nextProducts = [...products];
    for (const input of inputs) {
      if (!allowed.has(input.status)) {
        throw Object.assign(new Error('Unsupported website product status.'), { code: 'VALIDATION' });
      }
      const source = websiteProducts.find((product) =>
        String(product.id) === String(input.websiteProductId) ||
        String(product.slug) === String(input.currentHandle));
      const index = nextProducts.findIndex((product) =>
        String(product.id) === String(input.websiteProductId) ||
        String(product.slug) === String(input.currentHandle));
      const current = index >= 0 ? nextProducts[index] : source || null;
      if (!current) {
        throw Object.assign(new Error('Published website product was not found.'), { code: 'NOT_FOUND' });
      }
      const currentRevision = websiteRevision(current);
      if (!revisionMatches(input.expectedWebsiteRevision, current)) {
        throw Object.assign(new Error('Website product changed after this grid was loaded.'), {
          code: 'REVISION_CONFLICT',
          currentRevision,
        });
      }
      const nextProduct = {
        ...current,
        status: input.status,
        updatedAt: new Date().toISOString(),
        websiteRevision: null,
      };
      nextProduct.websiteRevision = websiteRevision({ ...nextProduct, websiteRevision: null });
      if (index >= 0) nextProducts[index] = nextProduct;
      else nextProducts.push(nextProduct);
      changes.push({
        product: nextProduct,
        previousRevision: currentRevision,
        newRevision: nextProduct.websiteRevision,
      });
    }
    writeStore({ ...store, products: nextProducts });
    try {
      for (const change of changes) {
        await onMutation({
          action: 'website_product_status_updated',
          product: change.product,
          previousRevision: change.previousRevision,
          newRevision: change.newRevision,
        });
      }
    } catch {
      writeStore(store);
      throw Object.assign(new Error('Website synchronization failed; no product status change was kept.'), {
        code: 'SYNC_FAILED',
      });
    }
    return changes;
  }

  function inspect(websiteProductId, handle) {
    const product = (readWebsiteCatalog().products || []).find((item) =>
      String(item.id) === String(websiteProductId) || String(item.slug) === String(handle));
    return { product: product || null, revision: websiteRevision(product || null) };
  }

  return { inspect, publish, setStatuses, revision: websiteRevision };
}

module.exports = { PUBLISHABLE_FIELDS, createWebsiteWriteAdapter, revisionMatches, websiteRevision };
