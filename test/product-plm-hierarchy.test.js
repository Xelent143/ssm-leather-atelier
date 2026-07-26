const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductPlmAudit } = require('../product-plm-audit');
const {
  INITIAL_BRANDS,
  PRODUCT_TYPES,
  inferProductType,
} = require('../product-plm-hierarchy');
const { buildMigrationPreview } = require('../product-plm-migration');
const {
  PRODUCT_PLM_SCHEMA_VERSION,
  upgradeStore,
  validateStore,
} = require('../product-plm-schema');
const { createProductPlmService } = require('../product-plm-service');
const { createProductPlmStore } = require('../product-plm-store');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-hierarchy-'));
  let clock = Date.parse('2026-07-26T00:00:00.000Z');
  const now = () => clock++;
  const store = createProductPlmStore({ dataDir, now });
  const audit = createProductPlmAudit({ dataDir, now });
  const service = createProductPlmService({ store, audit, now });
  return {
    audit,
    dataDir,
    now,
    service,
    store,
    req: { headers: { 'x-forwarded-for': '203.0.113.45' }, socket: {} },
    session: { id: 'session-test', actorType: 'named_user', userId: 'owner-test' },
  };
}

function legacyStore() {
  return {
    schemaVersion: 1,
    storeRevision: 0,
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
    brands: [],
    legalEntities: [],
    productIdentities: [],
    legacyMappings: [],
    migrationPreviews: [],
    migrationBatches: [],
  };
}

test('schema v1 is upgraded in memory without changing its legacy collections', () => {
  const original = legacyStore();
  const upgraded = upgradeStore(original);
  assert.equal(original.schemaVersion, 1);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.deepEqual(upgraded.productFamilies, []);
  assert.deepEqual(upgraded.productStyles, []);
  assert.deepEqual(upgraded.productIdentities, original.productIdentities);
  assert.doesNotThrow(() => validateStore(upgraded));
});

test('first mutation of an on-disk v1 store preserves a restricted rollback backup', async () => {
  const fixture = createFixture();
  fs.writeFileSync(fixture.store.paths.storePath, `${JSON.stringify(legacyStore(), null, 2)}\n`, { mode: 0o600 });
  await fixture.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fixture.store.read().schemaVersion, 2);
  assert.equal(fs.existsSync(fixture.store.paths.v1BackupPath), true);
  assert.equal(JSON.parse(fs.readFileSync(fixture.store.paths.v1BackupPath)).schemaVersion, 1);
  assert.equal(fs.statSync(fixture.store.paths.v1BackupPath).mode & 0o777, 0o600);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('initial brand registry contains the six approved distinct brands', () => {
  assert.deepEqual(INITIAL_BRANDS.map((brand) => brand.name), [
    'MOTOGRIP GEAR',
    'BLACKTOP GEAR',
    'Vintage Leather Goods',
    'BRANDS JACKET HUB',
    'The Western Hides',
    'Custom Jacket Co',
  ]);
  assert.equal(new Set(INITIAL_BRANDS.map((brand) => brand.id)).size, 6);
  assert.equal(new Set(INITIAL_BRANDS.map((brand) => brand.code)).size, 6);
});

test('approved MOTOGRIP product types are controlled and inference is deterministic', () => {
  assert.equal(PRODUCT_TYPES.length, 18);
  const examples = [
    ['Motorcycle Jacket', 'motorcycle_jacket'],
    ['Motorcycle Vest', 'motorcycle_vest'],
    ['Leather Vest', 'leather_vest'],
    ['Western Vest', 'western_vest'],
    ['Waistcoat', 'waistcoat'],
    ['Bomber Jacket', 'bomber_jacket'],
    ['Varsity Jacket', 'varsity_jacket'],
    ['Trucker Jacket', 'trucker_jacket'],
    ['Cafe Racer Jacket', 'cafe_racer_jacket'],
    ['Chaps', 'chaps'],
    ['Leather Pants', 'leather_pants'],
    ['Leather Shorts', 'leather_shorts'],
    ['Leather Coat', 'leather_coat'],
    ['Leather Bag', 'leather_bag'],
    ['Tool Bag', 'tool_bag'],
    ['Saddle Bag', 'saddle_bag'],
    ['Gloves', 'gloves'],
  ];
  for (const [title, expected] of examples) {
    assert.equal(inferProductType({ title }), expected);
  }
  assert.equal(inferProductType({ title: 'Leather Care Kit', category: 'Accessories' }), 'accessories');
});

test('migration preview includes review-required family and style proposals without variants', () => {
  const preview = buildMigrationPreview([{
    id: 'legacy-1',
    title: 'Black Leather Motorcycle Vest',
    brand: 'BLACKTOP GEAR',
    category: 'Vests',
    productType: 'Motorcycle leather gear > Vests',
    sku: 'BT-001',
    stock: { S: 2, M: 3 },
    variantOptions: ['Size', 'Color'],
  }], []);
  const candidate = preview.candidates[0];
  assert.deepEqual(candidate.hierarchyProposal, {
    brandCode: 'BLACKTOP_GEAR',
    brandName: 'BLACKTOP GEAR',
    brandRecognized: true,
    productType: 'motorcycle_vest',
    familyCode: 'MOTORCYCLE_VEST',
    familyName: 'Motorcycle Vests',
    styleName: 'Black Leather Motorcycle Vest',
    confidence: 'suggested',
    requiresReview: true,
  });
  assert.equal('variants' in candidate.hierarchyProposal, false);
  assert.equal('options' in candidate.hierarchyProposal, false);
  assert.equal('sellableItems' in candidate.hierarchyProposal, false);
});

test('migration preview flags unknown brands and apply refuses silent reassignment', async () => {
  const fixture = createFixture();
  const adminProducts = [{
    id: 'unknown-brand-product',
    title: 'Unknown Brand Leather Vest',
    brand: 'Unapproved Brand',
    category: 'Vests',
    sku: 'UNKNOWN-1',
  }];
  const preview = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts, merchantProducts: [] },
    0,
  );
  assert.equal(preview.preview.candidates[0].hierarchyProposal.brandRecognized, false);
  assert.equal(preview.preview.candidates[0].hierarchyProposal.brandCode, null);
  await assert.rejects(
    fixture.service.applyMigration(
      fixture.req,
      fixture.session,
      {
        previewId: preview.preview.id,
        expectedRevision: preview.storeRevision,
        merchantOnlyLegacyIds: [],
        confirmMerchantOnly: false,
      },
      { adminProducts, merchantProducts: [] },
    ),
    (error) => error.code === 'PLM_VALIDATION',
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('approved migration creates one durable style per Product UUID with correct ownership', async () => {
  const fixture = createFixture();
  const adminProducts = INITIAL_BRANDS.map((brand, index) => ({
    id: `legacy-${index + 1}`,
    title: `${brand.name} Motorcycle Jacket`,
    brand: brand.name,
    category: 'Jackets',
    productType: 'Motorcycle leather gear > Jackets',
    sku: `STYLE-SOURCE-${index + 1}`,
  }));
  const preview = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts, merchantProducts: [] },
    0,
  );
  await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: preview.preview.id,
      expectedRevision: preview.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    },
    { adminProducts, merchantProducts: [] },
  );
  const current = fixture.store.read();
  assert.equal(current.brands.length, 6);
  assert.equal(current.productIdentities.length, 6);
  assert.equal(current.productStyles.length, 6);
  assert.equal(current.productFamilies.length, 6);
  for (const style of current.productStyles) {
    const identity = current.productIdentities.find((item) => item.id === style.productUuid);
    assert.ok(identity);
    assert.equal(style.brandId, identity.brandId);
    assert.equal(style.legalEntityId, identity.legalEntityId);
  }
  assert.equal(new Set(current.productStyles.map((style) => style.productUuid)).size, 6);
  assert.equal('sellableItems' in current, false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('family and style validation rejects duplicate styles and family cycles', () => {
  const legalEntityId = crypto.randomUUID();
  const brandId = crypto.randomUUID();
  const productUuid = crypto.randomUUID();
  const familyOneId = crypto.randomUUID();
  const familyTwoId = crypto.randomUUID();
  const base = {
    ...legacyStore(),
    schemaVersion: 2,
    brands: [{
      id: brandId,
      name: 'Test',
      code: 'TEST',
      defaultLegalEntityId: legalEntityId,
    }],
    legalEntities: [{ id: legalEntityId }],
    productIdentities: [{ id: productUuid, brandId, legalEntityId }],
    productFamilies: [
      { id: familyOneId, code: 'ONE', brandId, legalEntityId, parentFamilyId: familyTwoId },
      { id: familyTwoId, code: 'TWO', brandId, legalEntityId, parentFamilyId: familyOneId },
    ],
    productStyles: [],
  };
  assert.throws(() => validateStore(base), /cycle/);
  base.productFamilies[0].parentFamilyId = null;
  base.productFamilies[1].parentFamilyId = null;
  base.productStyles = [
    {
      id: crypto.randomUUID(),
      productUuid,
      familyId: familyOneId,
      brandId,
      legalEntityId,
      styleCode: 'STYLE-ONE',
      productType: 'motorcycle_jacket',
    },
    {
      id: crypto.randomUUID(),
      productUuid,
      familyId: familyTwoId,
      brandId,
      legalEntityId,
      styleCode: 'STYLE-TWO',
      productType: 'motorcycle_jacket',
    },
  ];
  assert.throws(() => validateStore(base), /more than one style/);
});
