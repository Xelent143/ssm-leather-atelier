const { canonicalMediaUrl } = require('./media-url');

function text(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function list(value) {
  return [...new Set((Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => text(item, 100)).filter(Boolean))];
}

function identityKeys(product) {
  return [
    product.websiteProductId && `website:${product.websiteProductId}`,
    product.productUuid && `uuid:${product.productUuid}`,
    product.catalogId && `catalog:${product.catalogId}`,
    product.editorProductId && `editor:${product.editorProductId}`,
    product.sku && `sku:${String(product.sku).toLowerCase()}`,
    product.handle && `handle:${String(product.handle).toLowerCase()}`,
  ].filter(Boolean);
}

function websiteRow(product) {
  const variants = Array.isArray(product.variants)
    ? product.variants
    : Object.entries(product.stock || {}).map(([size, quantity]) => ({
      attributes: { size }, quantity, price: product.price, sku: '',
    }));
  return {
    id: String(product.id),
    websiteProductId: String(product.id),
    productUuid: product.productUuid || null,
    catalogId: product.catalogId || null,
    editorProductId: null,
    sourceIdentity: 'website',
    title: text(product.title, 300),
    sku: text(product.sku, 120),
    image: canonicalMediaUrl(product.primaryImage || product.image),
    status: text(product.status || 'active', 30).toLowerCase(),
    websiteStatus: text(product.status || 'active', 30).toLowerCase(),
    inventory: variants.length
      ? variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.quantity || 0)), 0)
      : Math.max(0, Number(product.inventory || 0)),
    productType: text(product.productType, 120),
    brand: text(product.brand || product.maker, 160),
    tags: list(product.tags || product.tag),
    category: text(product.category, 120),
    collections: list(product.collections),
    handle: text(product.slug, 160),
    syncState: 'Website Source',
    variants,
    archived: product.status === 'archived',
  };
}

function editorRow(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const featured = product.media?.find((item) => item.featured) || product.media?.[0];
  const status = product.managementState === 'hidden'
    ? 'hidden'
    : product.managementState === 'archived'
      ? 'archived'
      : text(product.organization?.status || 'draft', 30).toLowerCase();
  return {
    id: String(product.websiteProductId || product.productUuid || product.id),
    websiteProductId: product.websiteProductId ? String(product.websiteProductId) : null,
    productUuid: product.productUuid || null,
    catalogId: product.catalogId || null,
    editorProductId: String(product.id),
    sourceIdentity: 'product_editor_v2',
    title: text(product.title, 300),
    sku: text(product.identity?.productSku, 120),
    image: canonicalMediaUrl(featured?.path),
    status,
    websiteStatus: product.websiteSyncStatus === 'synced'
      ? status
      : product.websiteProductId ? 'pending_sync' : 'not_published',
    inventory: variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.quantity || 0)), 0),
    productType: text(product.organization?.productType, 120),
    brand: text(product.organization?.brand, 160),
    tags: list(product.organization?.tags),
    category: text(product.organization?.category, 120),
    collections: list(product.organization?.collections),
    handle: text(product.seo?.handle || product.sourceHandle, 160),
    syncState: product.websiteSyncStatus || 'not_published',
    variants,
    archived: status === 'archived',
  };
}

function createUnifiedProductProjection(options = {}) {
  const readWebsiteCatalog = options.readWebsiteCatalog || (() => ({ products: [] }));
  const readEditorProducts = options.readEditorProducts || (() => ({ products: [] }));

  function products({ includeArchived = false } = {}) {
    const rows = [];
    const keyIndex = new Map();

    function merge(row) {
      const keys = identityKeys(row);
      const indexes = [...new Set(keys.map((key) => keyIndex.get(key)).filter(Number.isInteger))];
      if (indexes.length > 1) {
        const [target, ...duplicates] = indexes;
        for (const duplicate of duplicates.sort((a, b) => b - a)) {
          rows[target] = { ...rows[duplicate], ...rows[target] };
          rows.splice(duplicate, 1);
        }
      }
      const index = indexes[0];
      if (Number.isInteger(index)) rows[index] = { ...rows[index], ...row };
      else rows.push(row);
      keyIndex.clear();
      rows.forEach((item, rowIndex) => identityKeys(item).forEach((key) => keyIndex.set(key, rowIndex)));
    }

    for (const product of readWebsiteCatalog().products || []) merge(websiteRow(product));
    for (const product of readEditorProducts().products || []) merge(editorRow(product));
    return rows.filter((row) => includeArchived || !row.archived);
  }

  return { products };
}

module.exports = {
  createUnifiedProductProjection,
  editorRow,
  identityKeys,
  websiteRow,
};
