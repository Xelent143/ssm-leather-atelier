const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createListingStudioService } = require('../listing-studio-service');
const { createListingStudioStore } = require('../listing-studio-store');
const { createProductGovernanceService } = require('../product-governance-service');
const { createProductPlmService } = require('../product-plm-service');
const { createProductPlmStore } = require('../product-plm-store');
const { resolveApprovedRelease } = require('../product-plm-release-resolver');

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-business-mvp-'));
  const user = {
    id: crypto.randomUUID(),
    accountType: 'owner',
    status: 'active',
  };
  const session = {
    id: crypto.randomUUID(),
    actorType: 'named_user',
    userId: user.id,
  };
  const identity = { findById: (id) => id === user.id ? user : null };
  const plmStore = createProductPlmStore({ dataDir });
  const plmService = createProductPlmService({
    store: plmStore,
    audit: { append() {} },
  });
  const governance = createProductGovernanceService({
    store: plmStore,
    identity,
  });
  const listingStore = createListingStudioStore({ dataDir });
  const listing = createListingStudioService({
    plmStore,
    listingStore,
    identity,
  });
  return { dataDir, governance, listing, listingStore, plmService, plmStore, session };
}

async function migrateOne(current) {
  const sources = {
    adminProducts: [{
      id: 'legacy-1',
      title: 'MOTOGRIP Roadmaster Leather Jacket',
      brand: 'MOTOGRIP GEAR',
      category: 'Jackets',
      productType: 'motorcycle_jacket',
      sku: 'MG-ROADMASTER',
      primaryImage: '/assets/products/roadmaster.jpg',
    }],
    merchantProducts: [],
  };
  const preview = await current.plmService.createPreview(
    {},
    current.session,
    sources,
    0,
  );
  await current.plmService.applyMigration({}, current.session, {
    previewId: preview.preview.id,
    expectedRevision: preview.storeRevision,
    merchantOnlyLegacyIds: [],
    confirmMerchantOnly: false,
  }, sources);
  return current.plmStore.read().productIdentities[0].id;
}

test('Owner completes immutable governance and creates trusted listing drafts', async () => {
  const current = fixture();
  const productUuid = await migrateOne(current);
  let revision = current.plmStore.read().storeRevision;
  const version = await current.governance.createVersion(current.session, {
    productUuid, expectedRevision: revision,
  });
  const request = await current.governance.requestApproval(current.session, {
    productUuid,
    productVersionId: version.version.id,
    expectedRevision: version.storeRevision,
  });
  const decision = await current.governance.approve(current.session, {
    productUuid,
    approvalRequestId: request.request.id,
    expectedRevision: request.storeRevision,
  });
  assert.equal(decision.decision.decisionCode, 'approved');
  const release = await current.governance.createRelease(current.session, {
    productUuid,
    approvalRequestId: request.request.id,
    expectedRevision: decision.storeRevision,
  });
  const locked = await current.governance.createKnowledgeLock(current.session, {
    productUuid,
    releaseId: release.release.id,
    expectedRevision: release.storeRevision,
  });
  assert.match(locked.knowledgeLock.knowledgeLockHash, /^[a-f0-9]{64}$/);
  assert.equal(resolveApprovedRelease(current.plmStore.read(), {
    productUuid,
    channel: 'ai_generation',
    purpose: 'product_listing',
  }).trusted, true);

  const first = await current.listing.generate(current.session, {
    productUuid,
    expectedRevision: 0,
  });
  const second = await current.listing.generate(current.session, {
    productUuid,
    expectedRevision: first.storeRevision,
  });
  assert.equal(first.draft.draftVersion, 1);
  assert.equal(second.draft.draftVersion, 2);
  assert.equal(second.drafts.length, 2);
  assert.equal(second.drafts[0].contentHash, first.draft.contentHash);
  assert.equal(first.draft.warnings.find((item) => item.code === 'missing_evidence').missing, true);
  assert.ok(first.draft.content.shopify.title);
  assert.ok(first.draft.content.ebay.title);
  assert.ok(first.draft.content.etsy.title);
  assert.ok(first.draft.content.seo.metaDescription);
  assert.ok(first.draft.content.faq.length);
  assert.ok(first.draft.content.buyingGuide);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('Listing generation rejects products without a trusted release', async () => {
  const current = fixture();
  const productUuid = await migrateOne(current);
  await assert.rejects(
    current.listing.generate(current.session, { productUuid, expectedRevision: 0 }),
    /trusted active Product Release/,
  );
  assert.equal(current.listingStore.read().drafts.length, 0);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('governance and listing mutations reject legacy or inactive actors', async () => {
  const current = fixture();
  const productUuid = await migrateOne(current);
  await assert.rejects(
    current.governance.createVersion(
      { ...current.session, actorType: 'legacy_owner' },
      { productUuid, expectedRevision: current.plmStore.read().storeRevision },
    ),
    /Named Owner/,
  );
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});
