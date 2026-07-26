const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createCatalogLinkService, titleSimilarity } = require('../catalog-link-service');
const { createCatalogLinkStore } = require('../catalog-link-store');
const { createCatalogSyncService } = require('../catalog-sync-service');
const { createCatalogSyncStore } = require('../catalog-sync-store');

function fixture(options = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-catalog-link-'));
  const deanUuid = crypto.randomUUID();
  const secondUuid = crypto.randomUUID();
  const deanStyleId = crypto.randomUUID();
  const secondStyleId = crypto.randomUUID();
  const source = {
    products: [
      {
        id: 'website-dean',
        slug: 'dean-brown-leather-biker-jacket',
        title: options.title || 'Dean Brown Leather Biker Jacket',
        sku: options.sku === undefined ? 'MG-MJ01' : options.sku,
        brand: 'MOTOGRIP GEAR',
        productType: 'Motorcycle Jacket',
        price: 299,
        inventory: 9,
        stock: { S: 4, M: 5 },
        status: 'active',
      },
      {
        id: 'website-other',
        slug: 'other-jacket',
        title: 'Other Leather Jacket',
        sku: 'MG-OTHER',
        inventory: 1,
        stock: { L: 1 },
      },
    ],
  };
  const plm = {
    brands: [{ id: crypto.randomUUID(), name: 'MOTOGRIP GEAR' }],
    productFamilies: [],
    productIdentities: [
      {
        id: deanUuid,
        displayName: 'Dean Brown Leather Biker Jacket',
      },
      {
        id: secondUuid,
        displayName: 'Other Leather Jacket',
      },
    ],
    productStyles: [
      {
        id: deanStyleId,
        productUuid: deanUuid,
        styleCode: 'STYLE-DEAN',
        productType: 'motorcycle_jacket',
      },
      {
        id: secondStyleId,
        productUuid: secondUuid,
        styleCode: 'STYLE-OTHER',
        productType: 'motorcycle_jacket',
      },
    ],
    sellableItems: [
      { id: crypto.randomUUID(), styleId: deanStyleId, sku: options.plmSku || 'MG-MJ01' },
      { id: crypto.randomUUID(), styleId: secondStyleId, sku: 'MG-OTHER' },
    ],
    legacyMappings: options.legacyMapping ? [{
      productUuid: deanUuid,
      sourceEntityType: 'product',
      sourceSystem: 'admin-store',
      legacyId: 'website-dean',
      legacySku: 'MG-MJ01',
    }] : [],
    marketplaceIdentities: [],
  };
  const syncStore = createCatalogSyncStore({ dataDir });
  const catalogService = createCatalogSyncService({
    store: syncStore,
    readWebsiteCatalog: () => source,
    readPlmStore: () => plm,
    now: () => '2026-07-26T12:00:00.000Z',
  });
  const linkStore = createCatalogLinkStore({ dataDir });
  const service = createCatalogLinkService({
    store: linkStore,
    catalogService,
    readPlmStore: () => plm,
    now: () => '2026-07-26T12:30:00.000Z',
  });
  return {
    dataDir,
    deanUuid,
    secondUuid,
    source,
    plm,
    linkStore,
    service,
    session: { actorType: 'named_user', userId: crypto.randomUUID() },
    cleanup() {
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

test('exact SKU suggestion requires Owner confirmation and creates a durable one-to-one link', () => {
  const current = fixture();
  const catalog = current.service.catalog();
  const dean = catalog.products.find((product) => product.sku === 'MG-MJ01');
  assert.equal(dean.linkStatus, 'Needs Review');
  assert.equal(dean.suggestedProductDnaMatch.method, 'exact_sku');
  assert.equal(dean.suggestedProductDnaMatch.productUuid, current.deanUuid);
  assert.equal(dean.suggestedProductDnaMatch.requiresOwnerConfirmation, true);
  assert.throws(() => current.service.link(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    matchMethod: 'exact_sku',
    expectedRevision: 0,
  }), /confirmation is required/);

  const linked = current.service.link(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    matchMethod: 'exact_sku',
    ownerConfirmed: true,
    expectedRevision: 0,
  });
  assert.equal(linked.product.linkStatus, 'Linked');
  assert.equal(linked.product.productUuid, current.deanUuid);
  assert.equal(linked.product.title, dean.title);
  assert.equal(linked.product.totalInventory, dean.totalInventory);
  assert.equal(current.service.auditHistory(dean.catalogProductId)[0].action, 'catalog_product_dna_linked');

  const reopenedStore = createCatalogLinkStore({ dataDir: current.dataDir });
  assert.equal(reopenedStore.read().links[0].productUuid, current.deanUuid);
  assert.equal(fs.statSync(reopenedStore.path).mode & 0o777, 0o600);
  current.cleanup();
});

test('matching priority covers legacy ID, case-insensitive SKU, and title-only suggestions', () => {
  const legacy = fixture({ legacyMapping: true, plmSku: 'different' });
  const legacyDean = legacy.service.catalog().products.find((product) => product.source.sourceId === 'website-dean');
  assert.equal(legacyDean.suggestedProductDnaMatch.method, 'legacy_identifier');
  assert.equal(legacyDean.suggestedProductDnaMatch.confidence, 100);
  legacy.cleanup();

  const insensitive = fixture({ sku: 'mg-mj01', plmSku: 'MG-MJ01' });
  const insensitiveDean = insensitive.service.catalog().products.find((product) => product.source.sourceId === 'website-dean');
  assert.equal(insensitiveDean.suggestedProductDnaMatch.method, 'case_insensitive_sku');
  insensitive.cleanup();

  const titleOnly = fixture({ sku: 'MG-NO-MATCH', plmSku: 'MG-DIFFERENT' });
  const titleDean = titleOnly.service.catalog().products.find((product) => product.source.sourceId === 'website-dean');
  assert.equal(titleDean.suggestedProductDnaMatch.method, 'normalized_title');
  assert.equal(titleDean.linkStatus, 'Needs Review');
  assert.ok(titleSimilarity(titleDean.title, 'Dean Brown Leather Biker Jacket') >= 0.72);
  titleOnly.cleanup();
});

test('wrong suggestions can be rejected; conflicting links are blocked; unlink and ignore are audited', () => {
  const current = fixture();
  const catalog = current.service.catalog();
  const dean = catalog.products.find((product) => product.sku === 'MG-MJ01');
  const other = catalog.products.find((product) => product.sku === 'MG-OTHER');
  const rejected = current.service.rejectSuggestion(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    expectedRevision: 0,
  });
  assert.equal(rejected.product.suggestions.length, 0);

  current.service.link(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    matchMethod: 'manual',
    ownerConfirmed: true,
    expectedRevision: 1,
  });
  assert.throws(() => current.service.link(current.session, {
    catalogProductId: other.catalogProductId,
    productUuid: current.deanUuid,
    matchMethod: 'manual',
    ownerConfirmed: true,
    expectedRevision: 2,
  }), /already linked/);

  current.service.unlink(current.session, {
    catalogProductId: dean.catalogProductId,
    expectedRevision: 2,
  });
  const ignored = current.service.ignore(current.session, {
    catalogProductId: dean.catalogProductId,
    expectedRevision: 3,
    reason: 'Staging test product',
  });
  assert.equal(ignored.product.linkStatus, 'Ignored');
  const events = current.service.auditHistory(dean.catalogProductId);
  assert.deepEqual(events.slice(0, 4).map((event) => event.action), [
    'catalog_product_ignored',
    'catalog_product_dna_unlinked',
    'catalog_product_dna_linked',
    'catalog_product_dna_suggestion_rejected',
  ]);
  current.cleanup();
});

test('repeated sync preserves link identities and website source data', () => {
  const current = fixture();
  const sourceBefore = JSON.stringify(current.source);
  const dean = current.service.catalog().products.find((product) => product.sku === 'MG-MJ01');
  current.service.link(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    matchMethod: 'exact_sku',
    ownerConfirmed: true,
    expectedRevision: 0,
  });
  const afterSync = current.service.sync();
  const linkedDean = afterSync.products.find((product) => product.sku === 'MG-MJ01');
  assert.equal(linkedDean.catalogProductId, dean.catalogProductId);
  assert.equal(linkedDean.productUuid, current.deanUuid);
  assert.equal(linkedDean.linkStatus, 'Linked');
  assert.equal(new Set(afterSync.products.map((product) => product.catalogProductId)).size, 2);
  assert.equal(JSON.stringify(current.source), sourceBefore);
  current.cleanup();
});

test('Owner-only mutations and revision protection reject unsafe actions', () => {
  const current = fixture();
  const dean = current.service.catalog().products.find((product) => product.sku === 'MG-MJ01');
  assert.throws(() => current.service.link({ actorType: 'legacy' }, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    ownerConfirmed: true,
    expectedRevision: 0,
  }), /Named Owner/);
  assert.throws(() => current.service.link(current.session, {
    catalogProductId: dean.catalogProductId,
    productUuid: current.deanUuid,
    ownerConfirmed: true,
    expectedRevision: 99,
  }), /changed while this review was open/);
  current.cleanup();
});

test('Catalog Review UI exposes linking workflow without website write or publish actions', () => {
  const admin = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(admin, /Catalog Review/);
  assert.match(admin, /Suggested Product DNA/);
  assert.match(admin, /Confirm link/);
  assert.match(admin, /Mark as Ignored/);
  assert.match(admin, /Listing Studio remains governed/);
  assert.match(server, /catalogLinkService\.link/);
  assert.match(server, /Named Owner access is required/);
  assert.doesNotMatch(server, /catalog\/products\/.*publish/);
  assert.doesNotMatch(server, /catalog\/products\/.*website.*PUT/i);
});
