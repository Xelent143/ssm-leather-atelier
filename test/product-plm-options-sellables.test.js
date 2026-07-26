const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  INTELLIGENCE_REFERENCE_TYPES,
} = require('../product-plm-intelligence-references');
const { MARKETPLACES } = require('../product-plm-marketplace-identities');
const { buildMigrationPreview } = require('../product-plm-migration');
const {
  PRODUCT_PLM_SCHEMA_VERSION,
  upgradeStore,
} = require('../product-plm-schema');
const {
  canonicalSku,
  computeVariantSignature,
} = require('../product-plm-sellables');
const { createProductPlmStore } = require('../product-plm-store');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-sellables-'));
  let clock = Date.parse('2026-07-26T00:00:00.000Z');
  const store = createProductPlmStore({ dataDir, now: () => clock++ });
  return { dataDir, store };
}

function entityMeta() {
  return {
    schemaVersion: 1,
    createdAt: '2026-07-26T00:00:00.000Z',
    createdBy: 'user:owner',
    updatedAt: '2026-07-26T00:00:00.000Z',
    updatedBy: 'user:owner',
  };
}

function addFoundation(draft) {
  const brandId = crypto.randomUUID();
  const legalEntityId = crypto.randomUUID();
  const productUuid = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const styleId = crypto.randomUUID();
  draft.brands.push({
    id: brandId,
    name: 'MOTOGRIP GEAR',
    code: 'MOTOGRIP_GEAR',
    defaultLegalEntityId: legalEntityId,
  });
  draft.legalEntities.push({ id: legalEntityId });
  draft.productIdentities.push({ id: productUuid, brandId, legalEntityId });
  draft.productFamilies.push({
    id: familyId,
    code: 'MOTORCYCLE_JACKET',
    brandId,
    legalEntityId,
    parentFamilyId: null,
  });
  draft.productStyles.push({
    id: styleId,
    productUuid,
    familyId,
    brandId,
    legalEntityId,
    styleCode: 'STYLE-OPTIONS',
    productType: 'motorcycle_jacket',
  });
  return { brandId, familyId, legalEntityId, productUuid, styleId };
}

function optionDefinition(fields = {}) {
  return {
    id: fields.id || crypto.randomUUID(),
    ...entityMeta(),
    code: fields.code || 'SIZE',
    name: fields.name || 'Size',
    description: '',
    scopeType: fields.scopeType || 'system',
    scopeId: fields.scopeId ?? null,
    dataType: fields.dataType || 'enum',
    usage: fields.usage || 'variant_axis',
    selectionMode: fields.selectionMode || 'single',
    status: 'active',
    sequence: 0,
    intelligenceReferences: fields.intelligenceReferences || [],
    dataClassification: 'internal',
  };
}

function optionValue(definitionId, fields = {}) {
  return {
    id: fields.id || crypto.randomUUID(),
    ...entityMeta(),
    optionDefinitionId: definitionId,
    code: fields.code || 'M',
    label: fields.label || 'Medium',
    description: '',
    aliases: fields.aliases || [],
    sequence: fields.sequence || 0,
    status: 'active',
    taxonomyReferenceId: null,
    materialReferenceId: null,
    intelligenceReferences: fields.intelligenceReferences || [],
    dataClassification: 'internal',
  };
}

function assignment(styleId, definition, values, fields = {}) {
  return {
    id: crypto.randomUUID(),
    ...entityMeta(),
    styleId,
    optionDefinitionId: definition.id,
    usage: definition.usage,
    required: fields.required ?? true,
    allowedValueIds: values.map((value) => value.id),
    defaultValueId: fields.defaultValueId ?? null,
    sequence: fields.sequence || 0,
    status: 'active',
    intelligenceReferences: [],
    dataClassification: 'internal',
  };
}

function sellable(styleId, fields = {}) {
  const selections = fields.optionSelections || [];
  const isVariant = ['standard_variant', 'private_label_variant'].includes(fields.sellableType);
  return {
    id: fields.id || crypto.randomUUID(),
    ...entityMeta(),
    styleId,
    sku: fields.sku || 'MG-STYLE-001',
    skuKey: canonicalSku(fields.sku || 'MG-STYLE-001'),
    name: fields.name || 'MOTOGRIP Jacket',
    sellableType: fields.sellableType || 'base_sellable',
    fulfillmentMode: fields.fulfillmentMode || 'stock',
    status: fields.status || 'active',
    isBaseItem: fields.isBaseItem ?? !isVariant,
    optionSelections: selections,
    variantSignature: isVariant ? computeVariantSignature(styleId, selections) : null,
    variantSignatureVersion: isVariant ? 1 : null,
    configurationPolicyReferenceId: null,
    legacySourceKeys: fields.legacySourceKeys || [],
    intelligenceReferences: fields.intelligenceReferences || [],
    dataClassification: fields.dataClassification || 'internal',
  };
}

function intelligenceReference(domain, referenceType) {
  return {
    domain,
    namespace: 'motogrip-intelligence',
    referenceType,
    referenceId: crypto.randomUUID(),
    schemaVersion: 1,
    status: 'reserved',
    dataClassification: 'internal',
  };
}

test('schema v3 upgrades in memory without changing approved hierarchy records', () => {
  const fixture = createFixture();
  const v3 = fixture.store.emptyStore();
  v3.schemaVersion = 3;
  delete v3.optionDefinitions;
  delete v3.optionValues;
  delete v3.styleOptionAssignments;
  delete v3.sellableItems;
  delete v3.marketplaceIdentities;
  addFoundation(v3);
  const upgraded = upgradeStore(v3);
  assert.equal(v3.schemaVersion, 3);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.equal(upgraded.productStyles.length, 1);
  assert.deepEqual(upgraded.optionDefinitions, []);
  assert.deepEqual(upgraded.sellableItems, []);
  assert.deepEqual(upgraded.marketplaceIdentities, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('first schema v4 mutation preserves a restricted v3 rollback backup', async () => {
  const fixture = createFixture();
  const v3 = fixture.store.emptyStore();
  v3.schemaVersion = 3;
  delete v3.optionDefinitions;
  delete v3.optionValues;
  delete v3.styleOptionAssignments;
  delete v3.sellableItems;
  delete v3.marketplaceIdentities;
  fs.writeFileSync(fixture.store.paths.storePath, `${JSON.stringify(v3, null, 2)}\n`, { mode: 0o600 });
  await fixture.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fixture.store.read().schemaVersion, 4);
  assert.equal(fs.existsSync(fixture.store.paths.v3BackupPath), true);
  assert.equal(JSON.parse(fs.readFileSync(fixture.store.paths.v3BackupPath)).schemaVersion, 3);
  assert.equal(fs.statSync(fixture.store.paths.v3BackupPath).mode & 0o777, 0o600);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('controlled options and a complete standard variant validate together', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const size = optionDefinition();
    const medium = optionValue(size.id);
    draft.optionDefinitions.push(size);
    draft.optionValues.push(medium);
    draft.styleOptionAssignments.push(assignment(foundation.styleId, size, [medium]));
    const selection = [{ optionDefinitionId: size.id, optionValueId: medium.id }];
    draft.sellableItems.push(sellable(foundation.styleId, {
      sku: 'MG-STYLE-001-M',
      sellableType: 'standard_variant',
      isBaseItem: false,
      optionSelections: selection,
    }));
    return { store: draft, value: null };
  }, 0);
  assert.equal(result.store.optionDefinitions.length, 1);
  assert.equal(result.store.optionValues.length, 1);
  assert.equal(result.store.styleOptionAssignments.length, 1);
  assert.equal(result.store.sellableItems.length, 1);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('variant signatures use immutable IDs and ignore labels and display ordering', () => {
  const styleId = crypto.randomUUID();
  const definitionOne = crypto.randomUUID();
  const definitionTwo = crypto.randomUUID();
  const valueOne = crypto.randomUUID();
  const valueTwo = crypto.randomUUID();
  const first = computeVariantSignature(styleId, [
    { optionDefinitionId: definitionOne, optionValueId: valueOne, label: 'Medium' },
    { optionDefinitionId: definitionTwo, optionValueId: valueTwo, label: 'Black' },
  ]);
  const reordered = computeVariantSignature(styleId, [
    { optionDefinitionId: definitionTwo, optionValueId: valueTwo, label: 'Noir' },
    { optionDefinitionId: definitionOne, optionValueId: valueOne, label: 'M' },
  ]);
  assert.equal(first, reordered);
});

test('Sellable Items enforce global case-insensitive SKU uniqueness', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      draft.sellableItems.push(
        sellable(foundation.styleId, { sku: 'MG-UNIQUE-1' }),
        sellable(foundation.styleId, {
          sku: 'mg-unique-1',
          id: crypto.randomUUID(),
          isBaseItem: false,
        }),
      );
      return { store: draft, value: null };
    }, 0),
    /SKU is duplicated/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('standard variants require assigned values and required axes', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const size = optionDefinition();
      const medium = optionValue(size.id);
      draft.optionDefinitions.push(size);
      draft.optionValues.push(medium);
      draft.styleOptionAssignments.push(assignment(foundation.styleId, size, [medium]));
      draft.sellableItems.push(sellable(foundation.styleId, {
        sku: 'MG-MISSING-SIZE',
        sellableType: 'standard_variant',
        isBaseItem: false,
        optionSelections: [],
      }));
      return { store: draft, value: null };
    }, 0),
    /missing a required variant axis/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('configuration capabilities cannot enter Phase 3B.2C variant signatures', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const personalization = optionDefinition({
        code: 'PERSONALIZATION',
        name: 'Personalization',
        usage: 'configuration_capability',
      });
      const enabled = optionValue(personalization.id, { code: 'YES', label: 'Yes' });
      draft.optionDefinitions.push(personalization);
      draft.optionValues.push(enabled);
      draft.styleOptionAssignments.push(assignment(foundation.styleId, personalization, [enabled]));
      const selections = [{ optionDefinitionId: personalization.id, optionValueId: enabled.id }];
      draft.sellableItems.push(sellable(foundation.styleId, {
        sku: 'MG-CONFIGURED',
        sellableType: 'standard_variant',
        isBaseItem: false,
        optionSelections: selections,
      }));
      return { store: draft, value: null };
    }, 0),
    /selection reference is invalid/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('marketplace identity maps an internal subject without credentials or publishing data', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const item = sellable(foundation.styleId);
    draft.sellableItems.push(item);
    draft.marketplaceIdentities.push({
      id: crypto.randomUUID(),
      ...entityMeta(),
      subjectType: 'sellable_item',
      subjectId: item.id,
      marketplace: 'google_merchant',
      accountReferenceId: crypto.randomUUID(),
      externalEntityType: 'variant',
      externalId: 'MG-STYLE-001',
      externalParentId: null,
      externalItemGroupId: 'MG-STYLE',
      identityRole: 'variant_listing',
      isPrimary: true,
      status: 'unverified',
      lastVerifiedAt: null,
      intelligenceReferences: [
        intelligenceReference('marketplace_identity_intelligence', 'marketplace_health'),
      ],
      dataClassification: 'commercially_sensitive',
    });
    return { store: draft, value: null };
  }, 0);
  assert.equal(result.store.marketplaceIdentities.length, 1);
  assert.equal(result.store.marketplaceIdentities[0].status, 'unverified');
  assert.equal('credentials' in result.store.marketplaceIdentities[0], false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('marketplace identity rejects credential and URL payload fields', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const item = sellable(foundation.styleId);
      draft.sellableItems.push(item);
      draft.marketplaceIdentities.push({
        id: crypto.randomUUID(),
        ...entityMeta(),
        subjectType: 'sellable_item',
        subjectId: item.id,
        marketplace: 'ebay',
        accountReferenceId: crypto.randomUUID(),
        externalEntityType: 'listing',
        externalId: 'https://example.com/listing/123',
        externalParentId: null,
        externalItemGroupId: null,
        identityRole: 'variant_listing',
        isPrimary: true,
        status: 'unverified',
        lastVerifiedAt: null,
        intelligenceReferences: [],
        dataClassification: 'commercially_sensitive',
        accessToken: 'not-allowed',
      });
      return { store: draft, value: null };
    }, 0),
    /unsupported data/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('all approved marketplaces and Phase 3B.2C Intelligence reference domains are reserved', () => {
  assert.deepEqual(MARKETPLACES, [
    'shopify',
    'ebay',
    'etsy',
    'amazon',
    'google_merchant',
    'facebook_shop',
    'instagram_shop',
    'tiktok_shop',
    'pinterest',
  ]);
  const domains = [
    'marketplace_intelligence',
    'listing_intelligence',
    'performance_intelligence',
    'search_intent_intelligence',
    'search_behavior',
    'keyword_intelligence',
    'content_intelligence',
    'opportunity_intelligence',
    'ai_recommendation',
    'marketplace_identity_intelligence',
    'global_commerce_calendar',
    'search_platforms',
  ];
  assert.ok(domains.every((domain) => INTELLIGENCE_REFERENCE_TYPES[domain]?.length));
  assert.ok(INTELLIGENCE_REFERENCE_TYPES.search_platforms.includes('google_shopping'));
  assert.ok(INTELLIGENCE_REFERENCE_TYPES.search_platforms.includes('perplexity'));
  assert.ok(INTELLIGENCE_REFERENCE_TYPES.global_commerce_calendar.includes('seasonal_event'));
});

test('migration preview reports malformed and duplicate legacy SKUs before apply', () => {
  const invalid = buildMigrationPreview([{
    id: 'invalid',
    title: 'Invalid SKU Product',
    brand: 'MOTOGRIP GEAR',
    sku: 'SKU WITH SPACES',
  }], []);
  assert.equal(invalid.status, 'conflicts');
  assert.equal(invalid.conflicts[0].type, 'invalid_sku');

  const duplicate = buildMigrationPreview([
    { id: 'one', title: 'One', brand: 'MOTOGRIP GEAR', sku: 'MG-DUPLICATE' },
    { id: 'two', title: 'Two', brand: 'MOTOGRIP GEAR', sku: 'mg-duplicate' },
  ], []);
  assert.equal(duplicate.status, 'conflicts');
  assert.equal(duplicate.conflicts[0].type, 'duplicate_sku');
});
