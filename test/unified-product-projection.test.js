const assert = require('node:assert/strict');
const test = require('node:test');
const { createUnifiedProductProjection } = require('../unified-product-projection');

test('unified projection includes website, editor-only, duplicated, hidden and published products without title matching', () => {
  const projection = createUnifiedProductProjection({
    readWebsiteCatalog: () => ({ products: [
      { id: 'web-1', slug: 'dean', title: 'Dean', sku: 'MG-MJ01', status: 'active', inventory: 4 },
      { id: 'web-2', slug: 'same-title-a', title: 'Same title', sku: 'MG-A', status: 'active' },
      { id: 'web-3', slug: 'same-title-b', title: 'Same title', sku: 'MG-B', status: 'active' },
    ] }),
    readEditorProducts: () => ({ products: [
      {
        id: 'editor-dean', productUuid: 'uuid-dean', websiteProductId: 'web-1',
        title: 'Dean edited', identity: { productSku: 'MG-MJ01' },
        organization: { status: 'active', tags: [], collections: [] },
        seo: { handle: 'dean' }, variants: [], media: [], websiteSyncStatus: 'synced',
      },
      {
        id: 'editor-draft', productUuid: 'uuid-draft', websiteProductId: null,
        title: 'New grid draft', identity: null,
        organization: { status: 'draft', tags: [], collections: [] },
        seo: { handle: 'new-grid-draft' }, variants: [], media: [],
      },
      {
        id: 'editor-copy', productUuid: 'uuid-copy', websiteProductId: null,
        title: 'Dean edited — Copy', identity: null, managementState: 'hidden',
        organization: { status: 'hidden', tags: [], collections: [] },
        seo: { handle: 'dean-copy' }, variants: [], media: [],
      },
    ] }),
  });
  const products = projection.products();
  assert.equal(products.length, 5);
  assert.equal(products.filter((item) => item.websiteProductId === 'web-1').length, 1);
  assert.equal(products.find((item) => item.productUuid === 'uuid-draft').id, 'uuid-draft');
  assert.equal(products.find((item) => item.productUuid === 'uuid-copy').status, 'hidden');
  assert.equal(products.filter((item) => item.title === 'Same title').length, 2);
});

test('archived products are opt-in while stable identity priority is preserved', () => {
  const projection = createUnifiedProductProjection({
    readWebsiteCatalog: () => ({ products: [
      { id: 'archived', slug: 'archived', title: 'Archived', sku: 'MG-OLD', status: 'archived' },
    ] }),
    readEditorProducts: () => ({ products: [] }),
  });
  assert.equal(projection.products().length, 0);
  assert.equal(projection.products({ includeArchived: true })[0].id, 'archived');
});
