const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductEditorV2Store } = require('../product-editor-v2-store');
const { createProductManagementGridService } = require('../product-management-grid-service');

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-product-grid-'));
  const store = createProductEditorV2Store({ dataDir, now: () => Date.parse('2026-07-27T12:00:00Z') });
  const users = {
    owner: { id: 'owner', status: 'active', accountType: 'owner' },
    editor: { id: 'editor', status: 'active', accountType: 'listing_editor' },
  };
  const events = [];
  const service = createProductManagementGridService({
    store,
    identity: { findById: (id) => users[id] || null },
    editorService: {
      async importWebsite(_session, input) {
        await store.mutate((state) => {
          state.products.push(product({
            id: `imported-${input.websiteProductId}`,
            websiteProductId: input.websiteProductId,
            title: 'Imported Dean',
            identity: { productSku: 'MG-MJ01', state: 'imported', variantSkus: [] },
          }));
          return { store: state };
        });
        return { product: store.read().products.at(-1) };
      },
    },
    readWebsiteCatalog: () => ({
      products: [
        { id: 'dean', slug: 'dean-brown-leather-biker-jacket', title: 'Dean Brown Leather Biker Jacket',
          sku: 'MG-MJ01', status: 'active', inventory: 9, price: 299, brand: 'MOTOGRIP GEAR',
          category: 'Jackets', productType: 'Motorcycle Jacket', image: 'assets/dean.jpg', stock: { M: 9 } },
      ],
    }),
    announce: (event) => events.push(event),
  });
  return {
    dataDir, store, service, events,
    owner: { actorType: 'named_user', userId: 'owner' },
    editor: { actorType: 'named_user', userId: 'editor' },
  };
}

function product(overrides = {}) {
  return {
    id: 'editor-one',
    productUuid: '4ffcab77-394f-470e-819d-3611480e91a2',
    websiteProductId: 'western',
    sourceHandle: 'mens-brown-leather-western-vest',
    revision: 3,
    workflowState: 'live',
    ownerReviewStatus: 'approved',
    websiteSyncStatus: 'synced',
    managementState: 'active',
    title: 'Men’s Brown Leather Western Vest',
    organization: {
      brand: 'MOTOGRIP GEAR', category: 'Vests', productType: 'Western Vest',
      collections: ['Western'], tags: ['Brown'], status: 'active',
    },
    pricing: { price: 199, compareAtPrice: 239, cost: 80, taxable: true },
    inventory: { trackInventory: true, continueSellingWhenOutOfStock: false },
    shipping: { physicalProduct: true, weight: 3, weightUnit: 'lb', processingTime: '2 days' },
    seo: { title: 'Western Vest', metaDescription: 'Factual vest.', handle: 'mens-brown-leather-western-vest' },
    options: [{ id: 'size', name: 'Size', values: ['S', 'M'] }],
    variants: [
      { id: 'v1', attributes: { size: 'S' }, sku: 'MG-VST-0001-S', price: 199, quantity: 3, status: 'active', availableForSale: true },
      { id: 'v2', attributes: { size: 'M' }, sku: 'MG-VST-0001-M', price: 199, quantity: 4, status: 'active', availableForSale: true },
    ],
    media: [{ id: 'media', path: '/admin/media/product/front.jpg', featured: true, order: 0 }],
    identity: { productSku: 'MG-VST-0001', state: 'locked', variantSkus: [] },
    metafields: {},
    sections: {},
    createdAt: '2026-07-26T10:00:00Z',
    createdBy: 'user:owner',
    updatedAt: '2026-07-27T10:00:00Z',
    updatedBy: 'user:owner',
    ...overrides,
  };
}

async function seed(current) {
  await current.store.mutate((state) => {
    state.products.push(product());
    return { store: state };
  });
}

test('grid merges Product Editor and website records without duplicates and exposes dashboard counts', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await seed(current);
  const grid = current.service.grid(current.owner);
  assert.equal(grid.products.length, 2);
  assert.equal(grid.products.filter((item) => item.websiteProductId === 'western').length, 1);
  assert.equal(grid.counts.total, 2);
  assert.equal(grid.counts.live, 2);
  assert.equal(grid.products.find((item) => item.editorProductId === 'editor-one').inventory, 7);
  assert.equal(grid.permissions.delete, true);
  assert.equal(current.service.grid(current.editor).permissions.delete, false);
});

test('bulk edit changes approved fields atomically while Product Identity remains locked', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await seed(current);
  const before = current.service.grid(current.editor);
  const after = await current.service.mutate(current.editor, {
    action: 'bulk_edit',
    productIds: ['editor-one'],
    expectedRevision: before.storeRevision,
    values: { price: 219, variantInventory: 8, tags: ['Premium', 'Western'], processingTime: '3 days' },
  });
  const row = after.products.find((item) => item.editorProductId === 'editor-one');
  assert.equal(row.price, 219);
  assert.equal(row.inventory, 16);
  const stored = current.store.read().products[0];
  assert.equal(stored.pricing.price, 219);
  assert.deepEqual(stored.organization.tags, ['Premium', 'Western']);
  assert.equal(stored.identity.productSku, 'MG-VST-0001');
  assert.equal(current.events.at(-1).type, 'product.grid.updated');
  await assert.rejects(() => current.service.mutate(current.editor, {
    action: 'bulk_edit', productIds: ['editor-one'], values: { identity: { productSku: 'BAD' } },
  }), /Unsupported bulk field|Locked Product Identity/);
});

test('archive, hide, restore and owner-only soft delete preserve audit history', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await seed(current);
  let grid = await current.service.mutate(current.editor, { action: 'archive', productIds: ['editor-one'] });
  assert.equal(grid.products[0].status, 'Archived');
  grid = await current.service.mutate(current.editor, { action: 'restore', productIds: ['editor-one'] });
  assert.equal(grid.products[0].status, 'Live');
  grid = await current.service.mutate(current.editor, { action: 'hide', productIds: ['editor-one'] });
  assert.equal(grid.products[0].status, 'Hidden');
  await assert.rejects(() => current.service.mutate(current.editor, { action: 'delete', productIds: ['editor-one'] }), /Owner/);
  grid = await current.service.mutate(current.owner, { action: 'delete', productIds: ['editor-one'] });
  assert.equal(grid.products.some((item) => item.editorProductId === 'editor-one'), false);
  assert.equal(current.store.read().products[0].managementState, 'deleted');
  assert.equal(current.store.read().auditEvents.length, 4);
});

test('duplicate creates a clean draft identity without duplicating SKU or website identity', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await seed(current);
  const result = await current.service.duplicate(current.editor, {
    productId: 'editor-one',
    expectedRevision: current.store.read().storeRevision,
  });
  const copy = current.store.read().products.find((item) => item.id === result.duplicatedProductId);
  assert.equal(copy.workflowState, 'draft');
  assert.equal(copy.websiteProductId, null);
  assert.equal(copy.identity, null);
  assert.equal(copy.variants.every((variant) => variant.sku === ''), true);
  assert.notEqual(copy.productUuid, current.store.read().products[0].productUuid);
});

test('legacy rows import once before mutation and retain existing website SKU', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  const result = await current.service.mutate(current.owner, {
    action: 'hide',
    productIds: ['website:dean'],
    expectedRevision: 0,
  });
  assert.equal(current.store.read().products.length, 1);
  assert.equal(current.store.read().products[0].identity.productSku, 'MG-MJ01');
  assert.equal(result.products[0].status, 'Hidden');
});

test('hide and restore synchronize the existing website identity and revision before grid projection', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await seed(current);
  const calls = [];
  current.service = createProductManagementGridService({
    store: current.store,
    identity: { findById: (id) => ({
      owner: { id: 'owner', status: 'active', accountType: 'owner' },
      editor: { id: 'editor', status: 'active', accountType: 'listing_editor' },
    }[id] || null) },
    editorService: {},
    readWebsiteCatalog: () => ({ products: [] }),
    websiteAdapter: {
      async setStatuses(inputs) {
        calls.push(inputs);
        return inputs.map((input, index) => ({
          product: { id: input.websiteProductId, status: input.status },
          newRevision: `website-revision-${calls.length}-${index}`,
        }));
      },
    },
  });
  let grid = await current.service.mutate(current.editor, {
    action: 'hide', productIds: ['editor-one'], expectedRevision: current.store.read().storeRevision,
  });
  assert.equal(calls[0][0].status, 'hide'.replace('hide', 'hidden'));
  assert.equal(grid.products[0].status, 'Hidden');
  assert.equal(grid.products[0].syncStatus, 'Synced');
  assert.equal(current.store.read().products[0].organization.status, 'hidden');
  grid = await current.service.mutate(current.editor, {
    action: 'restore', productIds: ['editor-one'], expectedRevision: current.store.read().storeRevision,
  });
  assert.equal(calls[1][0].status, 'active');
  assert.equal(grid.products[0].status, 'Live');
  assert.equal(current.store.read().products[0].websiteProductId, 'western');
});

test('Product Grid UI includes professional controls, responsive drawer, and protected actions', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'admin.css'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  for (const expected of [
    'Select all ${products.length} filtered', 'Bulk inventory', 'Bulk price', 'Quick preview',
    'Variant price', 'Missing images', 'Rows <select', 'Create new revision', 'View history',
    'Locked by Product Identity Engine', 'product.grid.updated',
  ]) assert.equal(ui.includes(expected), true, expected);
  assert.equal(css.includes('.pg-table'), true);
  assert.equal(css.includes('@media(max-width:640px)'), true);
  assert.equal(server.includes("'/api/admin/product-grid'"), true);
  assert.equal(server.includes("'/api/admin/product-grid/actions'"), true);
});
