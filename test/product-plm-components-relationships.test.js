const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductPlmStore } = require('../product-plm-store');
const {
  INTELLIGENCE_REFERENCE_TYPES,
} = require('../product-plm-intelligence-references');
const {
  PRODUCT_PLM_SCHEMA_VERSION,
  upgradeStore,
} = require('../product-plm-schema');

function createFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-plm-components-'));
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
  const familyId = crypto.randomUUID();
  const productUuidOne = crypto.randomUUID();
  const productUuidTwo = crypto.randomUUID();
  const styleOneId = crypto.randomUUID();
  const styleTwoId = crypto.randomUUID();
  draft.brands.push({
    id: brandId,
    name: 'MOTOGRIP GEAR',
    code: 'MOTOGRIP_GEAR',
    defaultLegalEntityId: legalEntityId,
  });
  draft.legalEntities.push({ id: legalEntityId });
  draft.productIdentities.push(
    { id: productUuidOne, brandId, legalEntityId },
    { id: productUuidTwo, brandId, legalEntityId },
  );
  draft.productFamilies.push({
    id: familyId,
    code: 'MOTORCYCLE_JACKET',
    brandId,
    legalEntityId,
    parentFamilyId: null,
  });
  draft.productStyles.push(
    {
      id: styleOneId,
      productUuid: productUuidOne,
      familyId,
      brandId,
      legalEntityId,
      styleCode: 'STYLE-ONE',
      productType: 'motorcycle_jacket',
    },
    {
      id: styleTwoId,
      productUuid: productUuidTwo,
      familyId,
      brandId,
      legalEntityId,
      styleCode: 'STYLE-TWO',
      productType: 'motorcycle_jacket',
    },
  );
  return { brandId, familyId, legalEntityId, styleOneId, styleTwoId };
}

function component(fields = {}) {
  return {
    id: crypto.randomUUID(),
    ...entityMeta(),
    styleId: fields.styleId,
    parentComponentId: fields.parentComponentId || null,
    componentCode: fields.componentCode || `COMP-${crypto.randomUUID().slice(0, 8)}`,
    name: fields.name || 'Jacket component',
    description: '',
    componentType: fields.componentType || 'panel',
    componentRole: 'structural',
    sequence: fields.sequence || 0,
    isOptional: false,
    isReplaceable: false,
    isSellableSeparately: false,
    status: 'active',
    inheritance: fields.inheritance || {
      mode: 'original',
      sourceComponentId: null,
      sourceStyleId: null,
      copiedAt: null,
      copiedBy: null,
      sourceHash: null,
      overriddenFields: [],
    },
    extensionReferences: {
      materialReferences: [],
      patternReferences: [],
      bomReferences: [],
    },
    intelligenceReferences: fields.intelligenceReferences || [],
    dataClassification: 'factory_confidential',
  };
}

function relationship(fields) {
  return {
    id: crypto.randomUUID(),
    ...entityMeta(),
    relationshipType: fields.relationshipType,
    sourceEntityType: fields.sourceEntityType,
    sourceEntityId: fields.sourceEntityId,
    targetEntityType: fields.targetEntityType,
    targetEntityId: fields.targetEntityId,
    sequence: 0,
    status: 'active',
    effectiveFrom: null,
    effectiveTo: null,
    metadata: {},
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

test('schema v2 upgrades in memory and preserves the complete 3B.2A foundation', () => {
  const fixture = createFixture();
  const v2 = fixture.store.emptyStore();
  v2.schemaVersion = 2;
  delete v2.productComponents;
  delete v2.productRelationships;
  addFoundation(v2);
  const upgraded = upgradeStore(v2);
  assert.equal(v2.schemaVersion, 2);
  assert.equal(upgraded.schemaVersion, PRODUCT_PLM_SCHEMA_VERSION);
  assert.equal(upgraded.productStyles.length, 2);
  assert.deepEqual(upgraded.productComponents, []);
  assert.deepEqual(upgraded.productRelationships, []);
  assert.equal(fs.existsSync(fixture.store.paths.storePath), false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('first schema v3 mutation preserves a restricted v2 rollback backup', async () => {
  const fixture = createFixture();
  const v2 = fixture.store.emptyStore();
  v2.schemaVersion = 2;
  delete v2.productComponents;
  delete v2.productRelationships;
  fs.writeFileSync(fixture.store.paths.storePath, `${JSON.stringify(v2, null, 2)}\n`, { mode: 0o600 });
  await fixture.store.mutate((draft) => ({ store: draft, value: true }), 0);
  assert.equal(fixture.store.read().schemaVersion, 5);
  assert.equal(fs.existsSync(fixture.store.paths.v2BackupPath), true);
  assert.equal(JSON.parse(fs.readFileSync(fixture.store.paths.v2BackupPath)).schemaVersion, 2);
  assert.equal(fs.statSync(fixture.store.paths.v2BackupPath).mode & 0o777, 0o600);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('component hierarchy accepts bounded nesting and reserved intelligence references', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const root = component({
      styleId: foundation.styleOneId,
      componentCode: 'BODY',
      componentType: 'body',
      intelligenceReferences: [
        intelligenceReference('global_commerce_calendar', 'riding_season'),
        intelligenceReference('search_intent_engine', 'commercial_intent'),
        intelligenceReference('opportunity_engine', 'competitor_gap'),
      ],
    });
    const child = component({
      styleId: foundation.styleOneId,
      parentComponentId: root.id,
      componentCode: 'FRONT-PANEL',
      componentType: 'front_panel',
    });
    draft.productComponents.push(root, child);
    return { store: draft, value: { root, child } };
  }, 0);
  assert.equal(result.store.productComponents.length, 2);
  assert.equal(result.store.productComponents[0].intelligenceReferences.length, 3);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('every Phase 3B.2B Intelligence Domain retains reserved reference types', () => {
  const requiredDomains = [
    'competitor_intelligence',
    'search_intelligence',
    'geo_intelligence',
    'aeo_intelligence',
    'seo_intelligence',
    'customer_questions',
    'review_intelligence',
    'market_trends',
    'blog_intelligence',
    'knowledge_graph',
    'ai_recommendation_engine',
    'global_commerce_calendar',
    'search_intent_engine',
    'opportunity_engine',
  ];
  assert.ok(requiredDomains.every((domain) => INTELLIGENCE_REFERENCE_TYPES[domain]?.length));
  assert.ok(Object.values(INTELLIGENCE_REFERENCE_TYPES).every((types) => types.length > 0));
});

test('intelligence references reject raw payloads and unsupported scoring data', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const reference = intelligenceReference('opportunity_engine', 'demand_score');
      reference.score = 92;
      draft.productComponents.push(component({
        styleId: foundation.styleOneId,
        intelligenceReferences: [reference],
      }));
      return { store: draft, value: null };
    }, 0),
    /unsupported data/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('components and relationships reject unknown top-level payload fields', async () => {
  const componentFixture = createFixture();
  await assert.rejects(
    componentFixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const invalid = component({ styleId: foundation.styleOneId });
      invalid.generatedRecommendation = 'Publish immediately';
      draft.productComponents.push(invalid);
      return { store: draft, value: null };
    }, 0),
    /unsupported data/,
  );
  const relationshipFixture = createFixture();
  await assert.rejects(
    relationshipFixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const invalid = relationship({
        relationshipType: 'replaces',
        sourceEntityType: 'product_style',
        sourceEntityId: foundation.styleOneId,
        targetEntityType: 'product_style',
        targetEntityId: foundation.styleTwoId,
      });
      invalid.aiScore = 0.98;
      draft.productRelationships.push(invalid);
      return { store: draft, value: null };
    }, 0),
    /unsupported data/,
  );
  fs.rmSync(componentFixture.dataDir, { recursive: true, force: true });
  fs.rmSync(relationshipFixture.dataDir, { recursive: true, force: true });
});

test('component hierarchy rejects cycles and cross-Style parents', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const first = component({ styleId: foundation.styleOneId, componentCode: 'ONE' });
      const second = component({
        styleId: foundation.styleOneId,
        componentCode: 'TWO',
        parentComponentId: first.id,
      });
      first.parentComponentId = second.id;
      draft.productComponents.push(first, second);
      return { store: draft, value: null };
    }, 0),
    /cycle/,
  );
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      const first = component({ styleId: foundation.styleOneId, componentCode: 'ONE' });
      const second = component({
        styleId: foundation.styleTwoId,
        componentCode: 'TWO',
        parentComponentId: first.id,
      });
      draft.productComponents.push(first, second);
      return { store: draft, value: null };
    }, 0),
    /parent reference/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('component snapshot inheritance records provenance without live inheritance', async () => {
  const fixture = createFixture();
  const result = await fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const source = component({ styleId: foundation.styleOneId, componentCode: 'SOURCE' });
    const copied = component({
      styleId: foundation.styleTwoId,
      componentCode: 'COPIED',
      inheritance: {
        mode: 'copied_snapshot',
        sourceComponentId: source.id,
        sourceStyleId: foundation.styleOneId,
        copiedAt: '2026-07-26T00:00:00.000Z',
        copiedBy: 'user:owner',
        sourceHash: 'a'.repeat(64),
        overriddenFields: ['name'],
      },
    });
    draft.productComponents.push(source, copied);
    return { store: draft, value: copied.id };
  }, 0);
  const copied = result.store.productComponents.find((item) => item.id === result.value);
  assert.equal(copied.inheritance.mode, 'copied_snapshot');
  assert.equal(copied.inheritance.sourceHash, 'a'.repeat(64));
  assert.equal('liveSync' in copied.inheritance, false);
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});

test('typed relationships enforce canonical symmetry and directed cycle safety', async () => {
  const fixture = createFixture();
  const created = await fixture.store.mutate((draft) => {
    const foundation = addFoundation(draft);
    const endpoints = [foundation.styleOneId, foundation.styleTwoId].sort();
    draft.productRelationships.push(relationship({
      relationshipType: 'related_to',
      sourceEntityType: 'product_style',
      sourceEntityId: endpoints[0],
      targetEntityType: 'product_style',
      targetEntityId: endpoints[1],
      intelligenceReferences: [intelligenceReference('knowledge_graph', 'knowledge_node')],
    }));
    return { store: draft, value: foundation };
  }, 0);
  assert.equal(created.store.productRelationships.length, 1);

  const cycleFixture = createFixture();
  await assert.rejects(
    cycleFixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      draft.productRelationships.push(
        relationship({
          relationshipType: 'replaces',
          sourceEntityType: 'product_style',
          sourceEntityId: foundation.styleOneId,
          targetEntityType: 'product_style',
          targetEntityId: foundation.styleTwoId,
        }),
        relationship({
          relationshipType: 'replaces',
          sourceEntityType: 'product_style',
          sourceEntityId: foundation.styleTwoId,
          targetEntityType: 'product_style',
          targetEntityId: foundation.styleOneId,
        }),
      );
      return { store: draft, value: null };
    }, 0),
    /cycle/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
  fs.rmSync(cycleFixture.dataDir, { recursive: true, force: true });
});

test('bundle relationship types remain reserved until Sellable Items exist', async () => {
  const fixture = createFixture();
  await assert.rejects(
    fixture.store.mutate((draft) => {
      const foundation = addFoundation(draft);
      draft.productRelationships.push(relationship({
        relationshipType: 'contains_sellable',
        sourceEntityType: 'product_style',
        sourceEntityId: foundation.styleOneId,
        targetEntityType: 'product_style',
        targetEntityId: foundation.styleTwoId,
      }));
      return { store: draft, value: null };
    }, 0),
    /reserved/,
  );
  fs.rmSync(fixture.dataDir, { recursive: true, force: true });
});
