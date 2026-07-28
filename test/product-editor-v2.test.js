const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductEditorV2Store } = require('../product-editor-v2-store');
const {
  createProductEditorV2Service,
  normalizedOptions,
  optionCombinations,
  safeHtml,
} = require('../product-editor-v2-service');
const { createProductPlmStore } = require('../product-plm-store');
const { createProductGovernanceService } = require('../product-governance-service');
const { createWebsiteWriteAdapter } = require('../website-write-adapter');

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-editor-v2-'));
  const users = {
    owner: { id: crypto.randomUUID(), accountType: 'owner', status: 'active' },
    editor: { id: crypto.randomUUID(), accountType: 'listing_editor', status: 'active' },
  };
  const ownerSession = { actorType: 'named_user', userId: users.owner.id };
  const editorSession = { actorType: 'named_user', userId: users.editor.id };
  const identities = new Map();
  let identityRevision = 0;
  const productIdentityService = {
    view: (productUuid) => ({ storeRevision: identityRevision, identity: identities.get(productUuid) || null }),
    generate: async (session, input) => {
      if (session.userId !== users.owner.id) throw Object.assign(new Error('Owner required'), { code: 'OWNER_REQUIRED' });
      const record = {
        id: crypto.randomUUID(), productUuid: input.productUuid,
        productSku: 'MG-VST-0001', internalProductCode: 'P-2026-000001',
        factoryCode: 'F-2026-000001', state: 'preview',
        variantSkus: input.variants.map((attributes) => ({
          id: crypto.randomUUID(), attributes,
          signature: `${attributes.size}-${attributes.color}`,
          sku: `MG-VST-0001-${attributes.size}-${String(attributes.color).toUpperCase().replaceAll(' ', '')}`,
        })),
      };
      identities.set(input.productUuid, record);
      identityRevision += 1;
      return { storeRevision: identityRevision, identity: record };
    },
  };
  const plmStore = createProductPlmStore({ dataDir });
  let website = { settings: { currency: 'USD' }, products: [] };
  const websiteAdapter = createWebsiteWriteAdapter({
    readStore: () => structuredClone(website),
    readWebsiteCatalog: () => structuredClone(website),
    writeStore: (next) => { website = structuredClone(next); },
  });
  const store = createProductEditorV2Store({ dataDir });
  const service = createProductEditorV2Service({
    store,
    identity: { findById: (id) => Object.values(users).find((user) => user.id === id) },
    productIdentityService,
    productPlmStore: plmStore,
    websiteAdapter,
    operationalLaunchService: { announce() {} },
  });
  const product = (overrides = {}) => ({
    title: 'Men’s Brown Leather Western Vest',
    descriptionHtml: '<p>Brown leather western vest.</p>',
    sections: {
      shortDescription: 'Brown leather western vest.',
      fullDescription: 'Brown leather western vest for everyday wear.',
      features: ['Button-front closure'],
    },
    organization: {
      brand: 'MOTOGRIP GEAR', vendor: 'MOTOGRIP GEAR', productType: 'Western Vest',
      category: 'Vests', gender: 'Men', collections: ['Western'], tags: ['brown leather vest'],
      themeTemplate: 'default', status: 'draft',
    },
    pricing: { price: 199, compareAtPrice: 249, cost: 80, taxable: true },
    inventory: { trackInventory: true, continueSellingWhenOutOfStock: false },
    shipping: { physicalProduct: true, weight: 3, weightUnit: 'lb', countryOfOrigin: 'PK' },
    metafields: { leatherType: 'Cowhide', closure: 'Buttons' },
    seo: {
      title: 'Men’s Brown Leather Western Vest | MOTOGRIP GEAR',
      metaDescription: 'A premium brown leather western vest with practical details and a fit designed for everyday layering.',
      handle: 'mens-brown-leather-western-vest',
    },
    options: [
      { name: 'Size', values: ['S', 'M', 'L', 'XL', '2XL'] },
      { name: 'Color', values: ['Brown', 'Dark Brown'] },
    ],
    variants: [],
    ...overrides,
  });
  return {
    dataDir, editorSession, identities, ownerSession, plmStore, product,
    service, store, users, website: () => website,
  };
}

test('variant option builder produces ten unique combinations', () => {
  const options = normalizedOptions([
    { name: 'Size', values: ['S', 'M', 'L', 'XL', '2XL'] },
    { name: 'Color', values: ['Brown', 'Dark Brown'] },
  ]);
  const values = optionCombinations(options);
  assert.equal(values.length, 10);
  assert.equal(new Set(values.map((item) => `${item.size}:${item.color}`)).size, 10);
});

test('duplicate option names and duplicate values are handled safely', () => {
  assert.throws(() => normalizedOptions([
    { name: 'Size', values: ['S'] }, { name: 'size', values: ['M'] },
  ]), (error) => error.code === 'VALIDATION');
  assert.deepEqual(normalizedOptions([{ name: 'Color', values: ['Brown', 'Brown'] }])[0].values, ['Brown']);
});

test('rich HTML removes executable content and inline event handlers', () => {
  const value = safeHtml('<p onclick="steal()">Safe</p><script>alert(1)</script><a href="javascript:x()">x</a>');
  assert.equal(value.includes('script'), false);
  assert.equal(value.includes('onclick'), false);
  assert.equal(value.includes('javascript:'), false);
});

test('media path backfill is safe, audited and idempotent', async (t) => {
  const current = fixture();
  t.after(() => fs.rmSync(current.dataDir, { recursive: true, force: true }));
  await current.store.mutate((state) => {
    state.products.push({
      id: crypto.randomUUID(),
      productUuid: crypto.randomUUID(),
      title: 'Imported media fixture',
      media: [{
        id: crypto.randomUUID(),
        path: 'assets/generated/dean front.png',
        featured: true,
        order: 0,
      }],
    });
    return { store: state, value: null };
  });
  const first = await current.service.backfillMediaPaths();
  const afterFirst = current.store.read();
  assert.equal(first.changed, 1);
  assert.equal(afterFirst.products[0].media[0].path, '/assets/generated/dean%20front.png');
  assert.equal(afterFirst.auditEvents.at(-1).action, 'product_media_path_normalized');
  const revision = afterFirst.storeRevision;
  const second = await current.service.backfillMediaPaths();
  assert.equal(second.changed, 0);
  assert.equal(current.store.read().storeRevision, revision);
});

test('Listing Editor creates, edits and submits a complete draft', async () => {
  const current = fixture();
  let result = await current.service.create(current.editorSession, current.product());
  assert.equal(result.product.variants.length, 10);
  assert.equal(result.product.workflowState, 'draft');
  const draftId = result.product.id;
  result = await current.service.save(current.editorSession, {
    ...current.product({ title: 'Men’s Western Vest – Revised' }),
    productId: draftId,
    expectedRevision: result.storeRevision,
  });
  assert.equal(result.product.title, 'Men’s Western Vest – Revised');
  result = await current.service.submit(current.editorSession, {
    productId: draftId, expectedRevision: result.storeRevision,
  });
  assert.equal(result.product.workflowState, 'submitted');
  assert.equal(result.product.ownerReviewStatus, 'pending');
});

test('stale saves return a 409-compatible revision conflict', async () => {
  const current = fixture();
  const created = await current.service.create(current.editorSession, current.product());
  await current.service.save(current.editorSession, {
    ...current.product({ title: 'Current edit' }), productId: created.product.id,
    expectedRevision: created.storeRevision,
  });
  await assert.rejects(() => current.service.save(current.editorSession, {
    ...current.product({ title: 'Stale edit' }), productId: created.product.id,
    expectedRevision: created.storeRevision,
  }), (error) => error.code === 'REVISION_CONFLICT');
});

test('secure multi-image upload validates content, order, featured media and persistence', async () => {
  const current = fixture();
  let result = await current.service.create(current.editorSession, current.product());
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  result = await current.service.uploadMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: '../../front.png', mimeType: 'image/png', dataBase64: png.toString('base64'),
    altText: 'Brown vest front', role: 'Front',
  });
  result = await current.service.uploadMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: 'back.png', mimeType: 'image/png', dataBase64: png.toString('base64'),
    altText: 'Brown vest back', role: 'Back',
  });
  assert.equal(result.product.media.length, 2);
  assert.equal(result.product.media[0].featured, true);
  assert.equal(result.product.media[0].originalName.includes('..'), false);
  const reordered = [result.product.media[1], result.product.media[0]].map((item, index) => ({
    ...item, featured: index === 0,
  }));
  result = await current.service.updateMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision, media: reordered,
  });
  assert.equal(result.product.media[0].altText, 'Brown vest back');
  assert.equal(result.product.media[0].featured, true);
  assert.equal(createProductEditorV2Store({ dataDir: current.dataDir }).read().products[0].media.length, 2);
  await assert.rejects(() => current.service.uploadMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: 'fake.jpg', mimeType: 'image/jpeg', dataBase64: png.toString('base64'),
  }), (error) => error.code === 'VALIDATION');
});

test('Quick Listing Mode requires only name, category, positive price, primary image and usable status', async () => {
  const current = fixture();
  let result = await current.service.create(current.ownerSession, current.product({
    title: 'Men’s Black Leather Cafe Racer Jacket',
    descriptionHtml: '',
    websiteContent: {
      description: [], features: [], specifications: [], perfectFor: '', whyYouWillLoveIt: '',
    },
    sections: {},
    organization: {
      brand: 'MOTOGRIP GEAR', vendor: 'MOTOGRIP GEAR', productType: 'Leather Jacket',
      category: 'Cafe Racer Jackets', gender: 'Unisex', collections: [], tags: [],
      themeTemplate: 'default', status: 'draft',
    },
    pricing: { price: 229, compareAtPrice: null, cost: null, taxable: true },
    inventory: { trackInventory: false, continueSellingWhenOutOfStock: false },
    seo: { title: '', metaDescription: '', handle: '' },
    options: [],
    variants: [],
  }));
  assert.deepEqual(current.service.criticalFields(result.product), ['primary image']);
  result = await current.service.uploadMedia(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: 'cafe-racer-front.png', mimeType: 'image/png',
    dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString('base64'),
    altText: 'Black leather cafe racer jacket front', role: 'Front',
  });
  assert.deepEqual(current.service.criticalFields(result.product), []);
  assert.equal(result.product.seo.handle, 'men-s-black-leather-cafe-racer-jacket');
  const beforeRevision = current.store.read().storeRevision;
  const preview = current.service.preview(current.ownerSession, result.product.id);
  assert.equal(preview.previewOnly, true);
  assert.deepEqual(preview.missingQuickListingFields, []);
  assert.equal(preview.product.price, 229);
  assert.equal(preview.product.variants[0].price, 229);
  assert.equal(preview.product.trackInventory, false);
  assert.deepEqual(Object.keys(preview.product.websiteContent), [
    'description', 'features', 'specifications', 'perfectFor', 'whyYouWillLoveIt',
  ]);
  assert.equal(current.store.read().storeRevision, beforeRevision);
});

test('Media Library safely attaches an existing asset by reference without duplicating files', async () => {
  const current = fixture();
  let source = await current.service.create(current.editorSession, current.product());
  source = await current.service.uploadMedia(current.editorSession, {
    productId: source.product.id, expectedRevision: source.storeRevision,
    fileName: 'shared.png', mimeType: 'image/png',
    dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString('base64'),
    altText: 'Reusable studio image', role: 'Lifestyle',
  });
  const target = await current.service.create(current.editorSession, current.product({
    title: 'Second Product',
    seo: { title: 'Second Product', metaDescription: 'Second product.', handle: 'second-product' },
  }));
  const attached = await current.service.attachMedia(current.editorSession, {
    productId: target.product.id,
    sourceMediaId: source.product.media[0].id,
    expectedRevision: target.storeRevision,
  });
  assert.equal(attached.product.media.length, 1);
  assert.equal(attached.product.media[0].path, source.product.media[0].path);
  assert.notEqual(attached.product.media[0].id, source.product.media[0].id);
});

test('Listing Editor cannot approve or publish while Owner approval creates PLM foundation and SKU identities', async () => {
  const current = fixture();
  let result = await current.service.create(current.editorSession, current.product());
  result = await current.service.submit(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
  });
  await assert.rejects(() => current.service.approve(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
  }), (error) => error.code === 'FORBIDDEN');
  result = await current.service.approve(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
  });
  assert.equal(result.product.workflowState, 'approved');
  assert.equal(result.product.identity.productSku, 'MG-VST-0001');
  assert.equal(result.product.variants.length, 10);
  assert.equal(result.product.variants.every((item) => item.sku.startsWith('MG-VST-0001-')), true);
  assert.equal(current.plmStore.read().productIdentities.some((item) => item.id === result.product.productUuid), true);
  await assert.rejects(() => current.service.publish(current.editorSession, {
    productId: result.product.id,
  }), (error) => error.code === 'FORBIDDEN');
});

test('publishing requires locked identity, trusted release, Knowledge Lock and critical fields', async () => {
  const current = fixture();
  let result = await current.service.create(current.editorSession, current.product());
  result = await current.service.uploadMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: 'front.png', mimeType: 'image/png',
    dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString('base64'),
    altText: 'Brown vest front', role: 'Front',
  });
  result = await current.service.submit(current.editorSession, { productId: result.product.id, expectedRevision: result.storeRevision });
  result = await current.service.approve(current.ownerSession, { productId: result.product.id, expectedRevision: result.storeRevision });
  await assert.rejects(() => current.service.publish(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision, idempotencyKey: crypto.randomUUID(),
  }), (error) => error.code === 'IDENTITY_NOT_LOCKED');
  current.identities.get(result.product.productUuid).state = 'locked';
  await assert.rejects(() => current.service.publish(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision, idempotencyKey: crypto.randomUUID(),
  }), (error) => error.code === 'UNTRUSTED_RELEASE');
});

test('existing website products import once with URLs, stock and SKU-compatible identity intact', async () => {
  const current = fixture();
  const adapter = createWebsiteWriteAdapter({
    readStore: () => ({
      products: [{
        id: 'dean', slug: 'dean-brown-leather-biker-jacket',
        title: 'Dean Brown Leather Biker Jacket', description: 'Original description',
        price: 299, status: 'active', brand: 'MOTOGRIP GEAR', productType: 'Motorcycle Jacket',
        category: 'Jackets', sku: 'MG-MJ01', stock: { S: 100, M: 100 },
        image: '/assets/dean.jpg',
      }],
    }),
    readWebsiteCatalog: () => ({
      products: [{
        id: 'dean', slug: 'dean-brown-leather-biker-jacket',
        title: 'Dean Brown Leather Biker Jacket', description: 'Original description',
        price: 299, status: 'active', brand: 'MOTOGRIP GEAR', productType: 'Motorcycle Jacket',
        category: 'Jackets', sku: 'MG-MJ01', stock: { S: 100, M: 100 },
        image: '/assets/dean.jpg',
      }],
    }),
    writeStore() {},
  });
  const service = createProductEditorV2Service({
    store: current.store,
    identity: { findById: (id) => Object.values(current.users).find((user) => user.id === id) },
    productIdentityService: { view: () => ({ identity: null }) },
    productPlmStore: current.plmStore, websiteAdapter: adapter,
    operationalLaunchService: { announce() {} },
  });
  let result = await service.importWebsite(current.editorSession, { websiteProductId: 'dean' });
  const firstId = result.product.id;
  result = await service.importWebsite(current.editorSession, { websiteProductId: 'dean' });
  assert.equal(result.product.id, firstId);
  assert.equal(result.products.length, 1);
  assert.equal(result.product.seo.handle, 'dean-brown-leather-biker-jacket');
  assert.equal(result.product.variants.length, 2);
  assert.equal(result.product.identity.productSku, 'MG-MJ01');
  assert.equal(result.product.identity.state, 'imported');
  await current.store.mutate((state) => {
    state.products[0].identity = null;
    return { store: state };
  });
  result = await service.importWebsite(current.editorSession, { websiteProductId: 'dean' });
  assert.equal(result.product.identity.productSku, 'MG-MJ01');
  assert.equal(result.auditEvents[0].action, 'website_identity_projected');
});

test('Owner publishes one governed website product idempotently with variants, media, SEO and inventory', async () => {
  const current = fixture();
  let result = await current.service.create(current.editorSession, current.product());
  result = await current.service.uploadMedia(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
    fileName: 'front.png', mimeType: 'image/png',
    dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString('base64'),
    altText: 'Men’s Brown Leather Western Vest front', role: 'Front',
  });
  const variants = result.product.variants.map((variant, index) => ({
    ...variant, quantity: index + 1,
  }));
  result = await current.service.save(current.editorSession, {
    ...current.product({ variants }), productId: result.product.id,
    expectedRevision: result.storeRevision,
  });
  result = await current.service.submit(current.editorSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
  });
  result = await current.service.approve(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision,
  });
  current.identities.get(result.product.productUuid).state = 'locked';
  const governance = createProductGovernanceService({
    store: current.plmStore,
    identity: { findById: (id) => Object.values(current.users).find((user) => user.id === id) },
  });
  let governed = await governance.createVersion(current.ownerSession, {
    productUuid: result.product.productUuid,
    expectedRevision: current.plmStore.read().storeRevision,
  });
  governed = await governance.requestApproval(current.ownerSession, {
    productUuid: result.product.productUuid,
    productVersionId: governed.version.id,
    expectedRevision: governed.storeRevision,
  });
  const approvalRequestId = governed.request.id;
  governed = await governance.approve(current.ownerSession, {
    productUuid: result.product.productUuid,
    approvalRequestId,
    expectedRevision: governed.storeRevision,
  });
  governed = await governance.createRelease(current.ownerSession, {
    productUuid: result.product.productUuid,
    approvalRequestId,
    expectedRevision: governed.storeRevision,
  });
  await governance.createKnowledgeLock(current.ownerSession, {
    productUuid: result.product.productUuid,
    releaseId: governed.release.id,
    expectedRevision: governed.storeRevision,
  });
  const key = crypto.randomUUID();
  result = await current.service.publish(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision, idempotencyKey: key,
  });
  assert.equal(result.product.workflowState, 'live');
  assert.equal(current.website().products.length, 1);
  assert.equal(current.website().products[0].variants.length, 10);
  assert.equal(current.website().products[0].inventory, 55);
  assert.equal(current.website().products[0].sku, 'MG-VST-0001');
  assert.equal(current.website().products[0].factualProjection, true);
  assert.equal(current.website().products[0].shortDescription.length > 0, true);
  assert.equal(current.website().products[0].features.length > 0, true);
  assert.equal(current.website().products[0].metafields.leatherType, 'Cowhide');
  assert.equal(current.website().products[0].primaryImage.includes('/product-editor-media/'), true);
  const repeated = await current.service.publish(current.ownerSession, {
    productId: result.product.id, expectedRevision: result.storeRevision, idempotencyKey: key,
  });
  assert.equal(repeated.products.length, 1);
  assert.equal(current.website().products.length, 1);
});

test('Product Editor v2 UI exposes required business controls and legacy compatibility notice', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  const admin = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'admin.css'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const storefront = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const marker of [
    'Rich description', 'Drop product images here', 'Generate combinations', 'Variant SKU',
    'Product metafields', 'Search engine listing', 'Submit for Review', 'Approve & Publish',
    'Create New Revision', 'Trusted Product Release', 'Valid Knowledge Lock',
    'Apply status', 'sourceMediaId', 'data-v="imageId"',
  ]) assert.equal(ui.includes(marker), true, marker);
  assert.equal(admin.includes('Legacy Product Manager'), true);
  assert.equal(admin.includes('This legacy editor is retained for compatibility.'), true);
  assert.equal(admin.includes('id="open-product-editor">Add Product'), true);
  assert.equal(css.includes('@media(max-width:720px)'), true);
  assert.equal(css.includes('.pe-table-scroll{overflow:auto;max-width:100%'), true);
  assert.equal(server.includes('variants: product.variants || []'), true);
  assert.equal(server.includes('factualProjection: product.factualProjection === true'), true);
  assert.equal(storefront.includes('function FactualPDP'), true);
  assert.equal(storefront.includes('p.factualProjection'), true);
  assert.equal(storefront.includes('selectedVariant?.sku'), true);
  assert.equal(storefront.includes('selectedCompareAt > selectedPrice'), true);
  assert.equal(storefront.includes('Array.isArray(p.reviews) && p.reviews.length > 0'), true);
});

test('factual PDP does not use generic leather, review, fit, or merchandising fallbacks', () => {
  const storefront = fs.readFileSync(path.join(__dirname, '..', 'ssm-pdp.jsx'), 'utf8');
  const start = storefront.indexOf('function FactualPDP');
  const end = storefront.indexOf('function PDP(', start);
  const factual = storefront.slice(start, end);
  for (const forbidden of [
    'SSM_LEATHERS',
    'Hand-numbered',
    'Lifetime repair',
    '4.9 / 5',
    'Sigrid K.',
    'Twelve months in our vegetable-tanning pit',
    'Glass-finish full-grain calfskin',
  ]) assert.equal(factual.includes(forbidden), false, forbidden);
  for (const required of [
    'p.options',
    'sellableVariants',
    'optionAvailable',
    'selectedVariant?.imageId',
    'selectedVariant?.price',
    'p.metafields',
    'p.sections?.description',
    'publishedSpecifications',
  ]) assert.equal(factual.includes(required), true, required);
  assert.equal(factual.includes('p.sections?.faq'), false, 'permanent five-section contract');
});

test('published Product Editor schema uses factual variants and omits unsupported review fallbacks', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'ssm-app.jsx'), 'utf8');
  assert.equal(server.includes('const sellableVariants = (Array.isArray(product.variants)'), true);
  assert.equal(server.includes('hasVariant: sellableVariants.map'), true);
  assert.equal(server.includes('product.factualProjection ? factualProperties'), true);
  assert.equal(server.includes('product.factualProjection ? undefined : product.color'), true);
  assert.equal(server.includes('productImageUrl(req, product.primaryImage || product.image)'), true);
  assert.equal(server.includes('productNode.aggregateRating'), true);
  assert.equal(server.includes('Number(product.ratingValue || 0) > 0'), true);
  assert.equal(app.includes('p.metaDescription || p.blurb'), true);
  assert.equal(app.includes('SSM_PRODUCT_OVERRIDE.product?.publicDescription'), true);
});
