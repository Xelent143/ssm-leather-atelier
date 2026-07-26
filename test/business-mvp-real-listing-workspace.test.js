const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  buildContent,
  createListingStudioService,
  missingInformation,
} = require('../listing-studio-service');
const { createListingStudioStore } = require('../listing-studio-store');
const { createProductGovernanceService } = require('../product-governance-service');
const { createProductPlmService } = require('../product-plm-service');
const { createProductPlmStore } = require('../product-plm-store');

const completeInput = {
  productTitle: 'Dean Brown Leather Biker Jacket',
  productType: 'Motorcycle Jacket',
  brand: 'MOTOGRIP GEAR',
  sku: 'MG-MJ01',
  leatherType: 'Cowhide leather',
  leatherColor: 'Brown',
  gender: 'Men',
  style: 'Biker',
  fit: 'Regular',
  condition: 'New',
  outerMaterial: 'Cowhide leather',
  liningMaterial: 'Polyester',
  closure: 'Front zip',
  hardware: 'Metal hardware',
  pocketCount: 4,
  insidePockets: 2,
  concealedCarryPockets: '',
  stitching: 'Reinforced stitching',
  collar: 'Snap-tab collar',
  sleeves: 'Long sleeves',
  adjustments: 'Waist adjusters',
  armorCompatibility: '',
  price: 299,
  availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  customSizingAvailable: true,
  quantity: 900,
  processingTime: '3–5 business days',
  shippingTime: 'Confirm at checkout',
  returns: '30-day returns on eligible stock items',
  personalization: '',
  targetMarket: 'motorcycle and leather-style customers',
  sizeRange: 'XS–5XL',
  productLength: '',
  chestWaistMeasurements: 'Use the MOTOGRIP size guide',
  customMeasurementInstructions: 'Contact MOTOGRIP GEAR with body measurements.',
  imageReferenceIds: [crypto.randomUUID()],
  evidenceReferenceIds: [crypto.randomUUID()],
};

function fixture(accountType = 'owner') {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-real-listing-'));
  const user = { id: crypto.randomUUID(), accountType, status: 'active' };
  const session = { id: crypto.randomUUID(), actorType: 'named_user', userId: user.id };
  const identity = { findById: (id) => id === user.id ? user : null };
  const plmStore = createProductPlmStore({ dataDir });
  const plmService = createProductPlmService({ store: plmStore, audit: { append() {} } });
  const governance = createProductGovernanceService({ store: plmStore, identity });
  const listingStore = createListingStudioStore({ dataDir });
  const listing = createListingStudioService({ plmStore, listingStore, identity });
  return { dataDir, governance, identity, listing, listingStore, plmService, plmStore, session, user };
}

async function trustedProduct(current) {
  const sources = {
    adminProducts: [{
      id: 'dean', title: 'Dean Brown Leather Biker Jacket', brand: 'MOTOGRIP GEAR',
      category: 'Jackets', productType: 'motorcycle_jacket', sku: 'MG-MJ01',
    }],
    merchantProducts: [],
  };
  const preview = await current.plmService.createPreview({}, current.session, sources, 0);
  await current.plmService.applyMigration({}, current.session, {
    previewId: preview.preview.id,
    expectedRevision: preview.storeRevision,
    merchantOnlyLegacyIds: [],
    confirmMerchantOnly: false,
  }, sources);
  const productUuid = current.plmStore.read().productIdentities[0].id;
  const version = await current.governance.createVersion(current.session, {
    productUuid, expectedRevision: current.plmStore.read().storeRevision,
  });
  const request = await current.governance.requestApproval(current.session, {
    productUuid, productVersionId: version.version.id, expectedRevision: version.storeRevision,
  });
  const decision = await current.governance.approve(current.session, {
    productUuid, approvalRequestId: request.request.id, expectedRevision: request.storeRevision,
  });
  const release = await current.governance.createRelease(current.session, {
    productUuid, approvalRequestId: request.request.id, expectedRevision: decision.storeRevision,
  });
  await current.governance.createKnowledgeLock(current.session, {
    productUuid, releaseId: release.release.id, expectedRevision: release.storeRevision,
  });
  return productUuid;
}

test('real product generator creates compliant marketplace packages without unsupported facts', () => {
  const content = buildContent(completeInput);
  assert.ok(content.shopify.fullDescription.includes('Cowhide leather'));
  assert.ok(content.ebay.title.length <= 80);
  assert.ok(content.etsy.title.length >= 100 && content.etsy.title.length <= 140);
  assert.equal(content.etsy.tags.length, 13);
  assert.ok(content.seo.title.length <= 60);
  assert.doesNotMatch(JSON.stringify(content), /guaranteed protection|100% waterproof|ce certified/i);
});

test('critical information blocks export until a versioned input draft is complete', async () => {
  const current = fixture();
  const productUuid = await trustedProduct(current);
  const first = await current.listing.generate(current.session, { productUuid, expectedRevision: 0 });
  await assert.rejects(
    Promise.resolve().then(() => current.listing.exportPackage(current.session, {
      productUuid, draftId: first.draft.id,
    })),
    /critical product information/,
  );
  const saved = await current.listing.saveInput(current.session, {
    productUuid,
    values: completeInput,
    notApplicable: {
      concealedCarryPockets: true,
      armorCompatibility: true,
      personalization: true,
      productLength: true,
    },
    ownerNote: 'Facts verified for staging acceptance.',
    expectedRevision: first.storeRevision,
  });
  const second = await current.listing.generate(current.session, {
    productUuid, expectedRevision: saved.storeRevision,
  });
  const exported = current.listing.exportPackage(current.session, {
    productUuid, draftId: second.draft.id, catalogId: crypto.randomUUID(),
  });
  assert.equal(exported.draftVersion, 2);
  assert.equal(exported.marketplaceContent.etsy.tags.length, 13);
  assert.equal(current.listingStore.read().inputDrafts.length, 1);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('edits and restores append versions and Listing Editor cannot export', async () => {
  const current = fixture();
  const productUuid = await trustedProduct(current);
  const saved = await current.listing.saveInput(current.session, {
    productUuid, values: completeInput, expectedRevision: 0,
  });
  const first = await current.listing.generate(current.session, {
    productUuid, expectedRevision: saved.storeRevision,
  });
  const editedContent = structuredClone(first.draft.content);
  editedContent.shopify.manualText = 'Owner-reviewed Shopify package';
  const edited = await current.listing.saveEdit(current.session, {
    productUuid, draftId: first.draft.id, content: editedContent,
    expectedRevision: first.storeRevision,
  });
  const restored = await current.listing.restore(current.session, {
    productUuid, draftId: first.draft.id, expectedRevision: edited.storeRevision,
  });
  const approved = await current.listing.approve(current.session, {
    productUuid, draftId: restored.draft.id, expectedRevision: restored.storeRevision,
  });
  assert.equal(edited.draft.draftVersion, 2);
  assert.equal(restored.draft.draftVersion, 3);
  assert.equal(restored.draft.sourceDraftId, first.draft.id);
  assert.equal(approved.draft.draftVersion, 4);
  assert.equal(approved.draft.approvalState, 'owner_approved');

  current.user.accountType = 'listing_editor';
  assert.equal(current.listing.workspace(current.session, productUuid).permissions.canExport, false);
  assert.throws(() => current.listing.exportPackage(current.session, {
    productUuid, draftId: restored.draft.id,
  }), /Authorized Listing Studio access/);
  await assert.rejects(
    current.listing.approve(current.session, {
      productUuid, draftId: restored.draft.id, expectedRevision: approved.storeRevision,
    }),
    /Authorized Listing Studio access/,
  );
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('missing information groups critical, recommended, optional and honors not-applicable', () => {
  const missing = missingInformation({ productTitle: 'Dean' }, { personalization: true });
  assert.equal(missing.find((item) => item.field === 'productTitle').missing, false);
  assert.equal(missing.find((item) => item.field === 'sku').severity, 'critical');
  assert.equal(missing.find((item) => item.field === 'fit').severity, 'recommended');
  assert.equal(missing.find((item) => item.field === 'personalization').notApplicable, true);
});
