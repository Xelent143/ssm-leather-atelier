const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductPlmAudit } = require('../product-plm-audit');
const { buildMigrationPreview } = require('../product-plm-migration');
const {
  PRODUCT_BRAIN_REFERENCE_TYPES,
  isUuid,
} = require('../product-plm-schema');
const { createProductPlmService } = require('../product-plm-service');
const { createProductPlmStore } = require('../product-plm-store');

function fixtureProducts() {
  const admin = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'admin-store.json'), 'utf8')).products;
  const merchant = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'merchant-catalog.json'), 'utf8')).products;
  return { admin, merchant };
}

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-'));
  let clock = Date.parse('2026-07-26T00:00:00.000Z');
  const now = () => clock++;
  const store = createProductPlmStore({ dataDir, now });
  const audit = createProductPlmAudit({ dataDir, now });
  const service = createProductPlmService({ store, audit, now });
  const req = {
    headers: { 'x-forwarded-for': '203.0.113.45' },
    socket: {},
  };
  const session = {
    id: 'session-test',
    actorType: 'named_user',
    userId: 'owner-test',
  };
  return { audit, dataDir, now, req, service, session, store };
}

test('empty PLM store is versioned without writing until the first mutation', () => {
  const fixture = createFixture();
  const current = fixture.store.read();
  assert.equal(current.schemaVersion, 4);
  assert.equal(current.storeRevision, 0);
  assert.deepEqual(current.productIdentities, []);
  assert.deepEqual(current.productFamilies, []);
  assert.deepEqual(current.productStyles, []);
  assert.deepEqual(current.optionDefinitions, []);
  assert.deepEqual(current.sellableItems, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('PLM store uses revisions and rejects stale or corrupt state', async () => {
  const fixture = createFixture();
  const first = await fixture.store.mutate((draft) => {
    draft.brands.push({
      id: crypto.randomUUID(),
      schemaVersion: 1,
      name: 'Test',
      code: 'TEST',
      status: 'active',
      defaultLegalEntityId: null,
      dataClassification: 'internal',
      createdAt: new Date().toISOString(),
      createdBy: 'test',
      updatedAt: new Date().toISOString(),
      updatedBy: 'test',
    });
    return { store: draft, value: true };
  }, 0);
  assert.equal(first.store.storeRevision, 1);
  await assert.rejects(
    fixture.store.mutate((draft) => ({ store: draft, value: null }), 0),
    (error) => error.code === 'PLM_REVISION_CONFLICT',
  );
  fs.writeFileSync(fixture.store.paths.storePath, '{broken');
  assert.throws(() => fixture.store.read(), (error) => error.code === 'PLM_STORE_UNAVAILABLE');
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('migration preview separates current admin products from merchant-only products', () => {
  const { admin, merchant } = fixtureProducts();
  const preview = buildMigrationPreview(admin, merchant);
  assert.equal(preview.adminProductCount, 6);
  assert.equal(preview.merchantProductCount, 14);
  assert.equal(preview.candidates.filter((item) => item.disposition === 'admin_product').length, 6);
  assert.equal(preview.candidates.filter((item) => item.disposition === 'merchant_only').length, 8);
  assert.equal(preview.candidates.filter((item) => item.importByDefault).length, 6);
  assert.equal(preview.conflicts.length, 0);
});

test('default migration imports admin products and only links overlapping merchant records', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  const created = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  const applied = await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: created.preview.id,
      expectedRevision: created.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    },
    { adminProducts: admin, merchantProducts: merchant },
  );
  const current = fixture.store.read();
  assert.equal(applied.batch.importedProductUuids.length, 6);
  assert.equal(current.productIdentities.length, 6);
  assert.equal(current.legacyMappings.filter((item) => item.sourceSystem === 'admin-store').length, 6);
  assert.equal(current.legacyMappings.filter((item) => item.sourceSystem === 'merchant-catalog').length, 6);
  assert.equal(current.brands[0].name, 'MOTOGRIP GEAR');
  assert.equal(current.legalEntities[0].legalName, 'MOTOGRIP GEAR LLC');
  assert.equal(current.brands.length, 6);
  assert.equal(current.productFamilies.length, 4);
  assert.equal(current.productStyles.length, 6);
  assert.equal(current.sellableItems.length, 6);
  assert.ok(current.sellableItems.every((item) =>
    item.sellableType === 'base_sellable' &&
    item.optionSelections.length === 0 &&
    item.variantSignature === null));
  assert.equal(current.optionDefinitions.length, 0);
  assert.equal(current.marketplaceIdentities.length, 0);
  assert.ok(current.productStyles.every((style) =>
    current.productIdentities.some((identity) =>
      identity.id === style.productUuid &&
      identity.brandId === style.brandId &&
      identity.legalEntityId === style.legalEntityId)));
  assert.ok(current.productIdentities.every((identity) => isUuid(identity.id)));
  assert.ok(current.productIdentities.every((identity) =>
    PRODUCT_BRAIN_REFERENCE_TYPES.every((key) =>
      Array.isArray(identity.productBrainReferences[key]) && identity.productBrainReferences[key].length === 0)));
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('merchant-only products require explicit confirmation and selection', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  const created = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  const merchantOnly = created.preview.candidates.find((item) => item.disposition === 'merchant_only');
  await assert.rejects(
    fixture.service.applyMigration(
      fixture.req,
      fixture.session,
      {
        previewId: created.preview.id,
        expectedRevision: created.storeRevision,
        merchantOnlyLegacyIds: [merchantOnly.primarySource.legacyId],
        confirmMerchantOnly: false,
      },
      { adminProducts: admin, merchantProducts: merchant },
    ),
    (error) => error.code === 'PLM_MERCHANT_CONFIRMATION_REQUIRED',
  );
  const applied = await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: created.preview.id,
      expectedRevision: created.storeRevision,
      merchantOnlyLegacyIds: [merchantOnly.primarySource.legacyId],
      confirmMerchantOnly: true,
    },
    { adminProducts: admin, merchantProducts: merchant },
  );
  assert.equal(applied.batch.importedProductUuids.length, 7);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('migration apply detects source changes after preview', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  const created = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  const changedAdmin = admin.map((product, index) => index === 0 ? { ...product, sku: `${product.sku}-changed` } : product);
  await assert.rejects(
    fixture.service.applyMigration(
      fixture.req,
      fixture.session,
      {
        previewId: created.preview.id,
        expectedRevision: created.storeRevision,
        merchantOnlyLegacyIds: [],
        confirmMerchantOnly: false,
      },
      { adminProducts: changedAdmin, merchantProducts: merchant },
    ),
    (error) => error.code === 'PLM_SOURCE_CHANGED',
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('legacy mappings keep Product UUIDs stable across later previews and source edits', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  const firstPreview = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: firstPreview.preview.id,
      expectedRevision: firstPreview.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    },
    { adminProducts: admin, merchantProducts: merchant },
  );
  const firstMappings = new Map(
    fixture.store.read().legacyMappings
      .filter((mapping) => mapping.sourceSystem === 'admin-store')
      .map((mapping) => [mapping.legacyId, mapping.productUuid]),
  );
  const editedAdmin = admin.map((product, index) =>
    index === 0 ? { ...product, slug: `${product.slug}-edited`, title: `${product.title} Edited` } : product);
  const revision = fixture.store.read().storeRevision;
  const secondPreview = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: editedAdmin, merchantProducts: merchant },
    revision,
  );
  await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: secondPreview.preview.id,
      expectedRevision: secondPreview.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    },
    { adminProducts: editedAdmin, merchantProducts: merchant },
  );
  const current = fixture.store.read();
  assert.equal(current.productIdentities.length, 6);
  for (const mapping of current.legacyMappings.filter((item) => item.sourceSystem === 'admin-store')) {
    assert.equal(mapping.productUuid, firstMappings.get(mapping.legacyId));
  }
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('Product DNA is read-only and reserves all approved Product Brain references', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  const created = await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  const applied = await fixture.service.applyMigration(
    fixture.req,
    fixture.session,
    {
      previewId: created.preview.id,
      expectedRevision: created.storeRevision,
      merchantOnlyLegacyIds: [],
      confirmMerchantOnly: false,
    },
    { adminProducts: admin, merchantProducts: merchant },
  );
  const dna = fixture.service.productDna(applied.batch.importedProductUuids[0]);
  assert.equal(dna.productUuid, applied.batch.importedProductUuids[0]);
  assert.equal(dna.familyId, null);
  assert.equal(dna.styleId, null);
  assert.deepEqual(Object.keys(dna.productBrainReferences), [...PRODUCT_BRAIN_REFERENCE_TYPES]);
  assert.ok(Object.values(dna.productBrainReferences).every((references) => references.length === 0));
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('PLM audit contains identifiers and hashes without product payloads or secrets', async () => {
  const fixture = createFixture();
  const { admin, merchant } = fixtureProducts();
  await fixture.service.createPreview(
    fixture.req,
    fixture.session,
    { adminProducts: admin, merchantProducts: merchant },
    0,
  );
  const audit = fs.readFileSync(fixture.audit.paths.auditPath, 'utf8');
  assert.match(audit, /"action":"migration_preview_created"/);
  assert.match(audit, /"ip":"203\.0\.113\.0\/24"/);
  assert.doesNotMatch(audit, /Black & White Hooded|ADMIN_PASSWORD|csrf|cookie/i);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});
