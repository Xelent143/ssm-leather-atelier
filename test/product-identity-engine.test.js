const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createProductIdentityStore } = require('../product-identity-store');
const {
  createProductIdentityService,
  productTypeCode,
  variantParts,
} = require('../product-identity-service');

function harness(options = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-identity-'));
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    accountType: 'owner',
    status: 'active',
  };
  const store = createProductIdentityStore({
    dataDir,
    now: () => Date.parse('2026-07-26T10:00:00.000Z'),
  });
  const service = createProductIdentityService({
    store,
    now: () => Date.parse('2026-07-26T10:00:00.000Z'),
    year: () => 2026,
    identity: { findById: (id) => id === user.id ? user : null },
    ...options,
  });
  const session = { actorType: 'named_user', userId: user.id };
  return { dataDir, service, session, store, user };
}

test('infers MOTOGRIP product types and only sellable variant attributes', () => {
  assert.equal(productTypeCode('Motorcycle Jacket'), 'JKT');
  assert.equal(productTypeCode('Western Vest'), 'VST');
  assert.equal(productTypeCode('unknown'), 'OTH');
  assert.deepEqual(variantParts({
    size: 'M',
    color: 'Brown',
    personalization: 'Name',
    customerNote: 'ignore',
  }), ['M', 'BRN']);
});

test('allocates unique restart-safe product, internal, factory and variant identities', async () => {
  const { dataDir, service, session } = harness();
  const firstUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const secondUuid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const [first, second] = await Promise.all([
    service.generate(session, {
      productUuid: firstUuid,
      brand: 'MOTOGRIP GEAR',
      productType: 'Leather Vest',
      variants: [{ size: 'M', color: 'Brown' }, { size: 'L', color: 'Brown' }],
    }),
    service.generate(session, {
      productUuid: secondUuid,
      brand: 'MOTOGRIP GEAR',
      productType: 'Leather Vest',
    }),
  ]);
  assert.equal(first.identity.productSku, 'MG-VST-0001');
  assert.equal(first.identity.internalProductCode, 'P-2026-000001');
  assert.equal(first.identity.factoryCode, 'F-2026-000001');
  assert.deepEqual(first.identity.variantSkus.map((item) => item.sku), [
    'MG-VST-0001-M-BRN',
    'MG-VST-0001-L-BRN',
  ]);
  assert.equal(second.identity.productSku, 'MG-VST-0002');

  const restarted = createProductIdentityService({
    store: createProductIdentityStore({ dataDir }),
    identity: { findById: () => ({ id: session.userId, accountType: 'owner', status: 'active' }) },
    year: () => 2026,
  });
  const third = await restarted.generate(session, {
    productUuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    brand: 'MOTOGRIP GEAR',
    productType: 'Leather Vest',
  });
  assert.equal(third.identity.productSku, 'MG-VST-0003');
});

test('preserves Dean existing SKU and creates MOTOGRIP OS identities', async () => {
  const { service, session } = harness();
  const result = await service.generate(session, {
    productUuid: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    title: 'Dean Brown Leather Biker Jacket',
    brand: 'MOTOGRIP GEAR',
    productType: 'Motorcycle Jacket',
    existingSku: 'MG-MJ01',
  });
  assert.equal(result.identity.productSku, 'MG-MJ01');
  assert.equal(result.identity.existingSkuPreserved, true);
  assert.match(result.identity.internalProductCode, /^P-2026-/);
  assert.match(result.identity.factoryCode, /^F-2026-/);
});

test('Owner can override before approval, approve, lock and audited unlock', async () => {
  const { service, session } = harness();
  const productUuid = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  let view = await service.generate(session, {
    productUuid,
    brand: 'BLACKTOP GEAR',
    productType: 'Leather Vest',
  });
  view = await service.overrideSku(session, {
    productUuid,
    productSku: 'BTG-VST-0100',
    reason: 'Approved legacy range alignment',
    expectedRevision: view.storeRevision,
  });
  view = await service.approve(session, {
    productUuid,
    expectedRevision: view.storeRevision,
  });
  view = await service.lock(session, {
    productUuid,
    expectedRevision: view.storeRevision,
  });
  await assert.rejects(() => service.overrideSku(session, {
    productUuid,
    productSku: 'BTG-VST-0101',
    expectedRevision: view.storeRevision,
  }), (error) => error.code === 'IDENTITY_LOCKED');
  view = await service.unlock(session, {
    productUuid,
    reason: 'Owner correction',
    expectedRevision: view.storeRevision,
  });
  assert.equal(view.identity.state, 'approved');
  assert.deepEqual(view.auditEvents.map((event) => event.action), [
    'product_identity_generated',
    'product_sku_overridden',
    'product_identity_approved',
    'product_identity_locked',
    'product_identity_unlocked',
  ]);
  assert.equal(view.auditEvents[1].previousSku, 'BTG-VST-0001');
  assert.equal(view.auditEvents[1].newSku, 'BTG-VST-0100');
  assert.equal(view.auditEvents[1].override, true);
  assert.equal(view.auditEvents[1].reasonProvided, true);
  assert.equal('reason' in view.auditEvents[1], false);
});

test('duplicate override and non-owner mutation are rejected', async () => {
  const { service, session, user } = harness();
  const first = await service.generate(session, {
    productUuid: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    brand: 'MOTOGRIP GEAR',
    productType: 'Bag',
  });
  const second = await service.generate(session, {
    productUuid: '12121212-1212-4212-8212-121212121212',
    brand: 'MOTOGRIP GEAR',
    productType: 'Bag',
  });
  await assert.rejects(() => service.overrideSku(session, {
    productUuid: second.identity.productUuid,
    productSku: first.identity.productSku,
    expectedRevision: second.storeRevision,
  }), (error) => error.code === 'DUPLICATE_IDENTITY');
  await assert.rejects(() => service.generate({
    actorType: 'named_user',
    userId: '22222222-2222-4222-8222-222222222222',
  }, {
    productUuid: cryptoUuid(),
    brand: 'MOTOGRIP GEAR',
    productType: 'Bag',
  }), (error) => error.code === 'OWNER_REQUIRED');
  assert.equal(user.status, 'active');
});

function cryptoUuid() {
  return '34343434-3434-4434-8434-343434343434';
}
