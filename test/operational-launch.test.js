const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createAdminIdentity } = require('../admin-identity');
const { createOperationalLaunchStore } = require('../operational-launch-store');
const { createOperationalLaunchService } = require('../operational-launch-service');
const { createWebsiteWriteAdapter } = require('../website-write-adapter');

test('Named Owner securely creates and controls a real Listing Editor', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-editor-'));
  const identity = createAdminIdentity({ dataDir });
  await identity.bootstrapOwner({
    displayName: 'Owner',
    email: 'owner@example.com',
    password: 'Quartz saddle horizon 2026!',
  });
  const editor = await identity.createManagedUser({
    displayName: 'Listing VA',
    email: 'va@example.com',
    password: 'A temporary VA passphrase 2026!',
  }, `user:${identity.owner().id}`);
  assert.equal(editor.accountType, 'listing_editor');
  assert.equal(editor.status, 'active');
  assert.equal(identity.readStore().users.length, 2);
  assert.equal(JSON.stringify(identity.readStore()).includes('A temporary VA passphrase'), false);
  const login = await identity.authenticate('va@example.com', 'A temporary VA passphrase 2026!', {
    headers: {}, socket: { remoteAddress: '127.0.0.1' },
  });
  assert.equal(login.ok, true);
  identity.updateManagedUserStatus(editor.id, 'disabled');
  assert.equal(identity.findById(editor.id).status, 'disabled');
  assert.equal(identity.updateManagedUserStatus(identity.owner().id, 'disabled'), null);
  assert.equal(identity.owner().status, 'active');
});

function operationalFixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-operational-'));
  const productUuid = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const catalogId = crypto.randomUUID();
  const users = {
    owner: { id: crypto.randomUUID(), accountType: 'owner', status: 'active' },
    editor: { id: crypto.randomUUID(), accountType: 'listing_editor', status: 'active' },
  };
  const ownerSession = { actorType: 'named_user', userId: users.owner.id };
  const editorSession = { actorType: 'named_user', userId: users.editor.id };
  let websiteStore = {
    products: [{
      id: 'dean', slug: 'dean-brown-leather-biker-jacket',
      title: 'Dean Brown Leather Biker Jacket', price: 299,
    }],
  };
  const adapter = createWebsiteWriteAdapter({
    readStore: () => structuredClone(websiteStore),
    readWebsiteCatalog: () => structuredClone(websiteStore),
    writeStore: (value) => { websiteStore = structuredClone(value); },
  });
  const catalogProduct = {
    catalogProductId: catalogId,
    productUuid,
    linkStatus: 'Linked',
    productUrl: '/products/dean-brown-leather-biker-jacket',
    source: { sourceId: 'dean' },
    variants: [{ value: 'M', quantity: 10 }, { value: 'L', quantity: 12 }],
    productStatus: 'active',
  };
  const listingDraft = {
    id: draftId,
    productUuid,
    warnings: [],
    content: {
      shopify: {
        title: 'Dean Brown Leather Biker Jacket',
        shortDescription: 'Factual short description.',
        fullDescription: 'Factual full description.',
        features: ['Cowhide leather'],
        specifications: [['Material', 'Cowhide leather']],
        perfectFor: 'Motorcycle style customers.',
        whyYouWillLoveIt: 'Factual construction.',
        faq: [],
        buyingGuide: 'Check sizing.',
        seoTitle: 'Dean Brown Leather Biker Jacket',
        metaDescription: 'Factual product information.',
        tags: ['brown leather jacket'],
        urlHandle: 'dean-brown-leather-biker-jacket',
      },
    },
  };
  const listingWorkspace = {
    inputDraft: {
      values: {
        brand: 'MOTOGRIP GEAR',
        productType: 'Motorcycle Jacket',
        price: 299,
      },
    },
  };
  const listingDrafts = [listingDraft];
  const store = createOperationalLaunchStore({ dataDir });
  const service = createOperationalLaunchService({
    store,
    identity: { findById: (id) => Object.values(users).find((user) => user.id === id) },
    listingStore: { read: () => ({ drafts: listingDrafts }) },
    listingService: { workspace: () => listingWorkspace },
    productIdentityService: { view: () => ({ identity: { state: 'locked' } }) },
    catalogLinkService: { catalog: () => ({ products: [catalogProduct] }) },
    websiteAdapter: adapter,
  });
  return {
    adapter, catalogId, draftId, editorSession, ownerSession, productUuid,
    service, store, website: () => websiteStore,
    addDraft: (overrides = {}) => {
      const draft = {
        ...structuredClone(listingDraft),
        ...overrides,
        id: overrides.id || crypto.randomUUID(),
        content: overrides.content || structuredClone(listingDraft.content),
      };
      listingDrafts.push(draft);
      return draft;
    },
  };
}

test('website workflow requires Editor submission and Owner approval', async () => {
  const current = operationalFixture();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: current.draftId,
    expectedRevision: 0,
  });
  assert.equal(result.workflow.status, 'Submitted for Review');
  await assert.rejects(() => current.service.publish(current.editorSession, {
    productUuid: current.productUuid,
  }), (error) => error.code === 'FORBIDDEN');
  result = await current.service.requestChanges(current.ownerSession, {
    productUuid: current.productUuid,
    note: 'Clarify factual material details.',
    expectedRevision: result.storeRevision,
  });
  assert.equal(result.workflow.status, 'Changes Requested');
  result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  assert.equal(result.workflow.status, 'Approved');
});

test('publishing is revision checked, idempotent and updates the website atomically', async () => {
  const current = operationalFixture();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: current.draftId,
    expectedRevision: 0,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  const idempotencyKey = crypto.randomUUID();
  result = await current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: result.websiteRevision,
    idempotencyKey,
  });
  assert.equal(result.workflow.status, 'Live');
  assert.equal(current.website().products.length, 1);
  assert.equal(current.website().products[0].inventory, 22);
  assert.equal(current.store.read().publications.length, 1);
  assert.equal(current.store.read().auditEvents.at(-1).action, 'website_publish');
  assert.equal(JSON.stringify(current.store.read()).match(/password|cookie|csrf|token/gi), null);
  const repeated = await current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: result.websiteRevision,
    idempotencyKey,
  });
  assert.equal(repeated.publicationHistory.length, 1);
});

test('a Live product can enter a new governed revision and republish without duplicates', async () => {
  const current = operationalFixture();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: current.draftId,
    expectedRevision: 0,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  result = await current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: result.websiteRevision,
    idempotencyKey: crypto.randomUUID(),
  });
  const revised = current.addDraft({
    content: {
      shopify: {
        title: 'Dean Brown Leather Biker Jacket Revised',
        shortDescription: 'Revised factual short description.',
        fullDescription: 'Revised factual website description.',
        features: ['Cowhide leather'],
        specifications: [['Material', 'Cowhide leather']],
        perfectFor: 'Motorcycle style customers.',
        whyYouWillLoveIt: 'Factual construction.',
        faq: [],
        buyingGuide: 'Check sizing.',
        seoTitle: 'Dean Brown Leather Biker Jacket Revised',
        metaDescription: 'Revised factual product information.',
        tags: ['brown leather jacket'],
        urlHandle: 'dean-brown-leather-biker-jacket',
      },
    },
  });
  result = await current.service.revise(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: revised.id,
    expectedRevision: result.storeRevision,
  });
  assert.equal(result.workflow.status, 'Draft');
  result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    draftId: revised.id,
    expectedRevision: result.storeRevision,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: revised.id,
    expectedRevision: result.storeRevision,
  });
  result = await current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: revised.id,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: result.websiteRevision,
    idempotencyKey: crypto.randomUUID(),
  });
  assert.equal(result.workflow.status, 'Live');
  assert.equal(current.website().products.length, 1);
  assert.equal(current.website().products[0].title, 'Dean Brown Leather Biker Jacket Revised');
  assert.equal(current.website().products[0].description, 'Revised factual website description.');
  assert.equal(current.store.read().publications.length, 2);
});

test('a newer generated draft can replace the active Draft revision before submission', async () => {
  const current = operationalFixture();
  const firstRevision = current.addDraft();
  const secondRevision = current.addDraft();
  let result = await current.service.start(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: firstRevision.id,
    expectedRevision: 0,
  });
  result = await current.service.revise(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: secondRevision.id,
    expectedRevision: result.storeRevision,
  });
  assert.equal(result.workflow.status, 'Draft');
  assert.equal(result.workflow.draftId, secondRevision.id);
});

test('Owner review rejects a stale draft after a newer draft is submitted', async () => {
  const current = operationalFixture();
  const newer = current.addDraft();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: newer.id,
    expectedRevision: 0,
  });
  await assert.rejects(() => current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  }), (error) => error.code === 'REVISION_CONFLICT');
  assert.equal(current.service.workflow(current.ownerSession, current.productUuid).workflow.status, 'Submitted for Review');
});

test('stale website revision is rejected without overwriting current content', async () => {
  const current = operationalFixture();
  await assert.rejects(() => current.adapter.publish({
    websiteProductId: 'dean',
    currentHandle: 'dean-brown-leather-biker-jacket',
    expectedWebsiteRevision: 'stale',
    fields: { title: 'Unsafe overwrite', slug: 'dean', price: 1 },
  }), (error) => error.code === 'REVISION_CONFLICT');
  assert.equal(current.website().products[0].title, 'Dean Brown Leather Biker Jacket');
});

test('Codex service boundary is internal, approval-bound and records actor type safely', async () => {
  const current = operationalFixture();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: current.draftId,
    expectedRevision: 0,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  const request = {
    actorType: 'codex',
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: result.websiteRevision,
    idempotencyKey: crypto.randomUUID(),
  };
  await assert.rejects(
    () => current.service.publish(current.ownerSession, request),
    (error) => error.code === 'FORBIDDEN',
  );
  result = await current.service.publish(current.ownerSession, request, {
    codexAuthorized: true,
  });
  assert.equal(result.workflow.status, 'Live');
  const audit = current.store.read().auditEvents.at(-1);
  assert.equal(audit.actorType, 'codex');
  assert.equal(audit.actorId, 'codex');
  assert.equal(JSON.stringify(audit).match(/password|cookie|csrf|authorization/gi), null);
});

test('failed website sync rolls back, records Failed, and can be retried safely', async () => {
  const current = operationalFixture();
  let result = await current.service.submit(current.editorSession, {
    productUuid: current.productUuid,
    catalogId: current.catalogId,
    draftId: current.draftId,
    expectedRevision: 0,
  });
  result = await current.service.approve(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedRevision: result.storeRevision,
  });
  const firstRevision = result.websiteRevision;
  const failingAdapter = createWebsiteWriteAdapter({
    readStore: () => structuredClone(current.website()),
    readWebsiteCatalog: () => structuredClone(current.website()),
    writeStore: (value) => {
      const target = current.website();
      target.products = structuredClone(value.products);
    },
    onMutation: async () => { throw new Error('projection unavailable'); },
  });
  const originalPublish = current.adapter.publish;
  current.adapter.publish = failingAdapter.publish;
  await assert.rejects(() => current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: firstRevision,
    idempotencyKey: crypto.randomUUID(),
  }), (error) => error.code === 'SYNC_FAILED');
  result = current.service.workflow(current.ownerSession, current.productUuid);
  assert.equal(result.workflow.status, 'Failed');
  assert.equal(result.workflow.publishRetryEligible, true);
  assert.equal(current.website().products[0].title, 'Dean Brown Leather Biker Jacket');
  current.adapter.publish = originalPublish;
  result = await current.service.publish(current.ownerSession, {
    productUuid: current.productUuid,
    draftId: current.draftId,
    expectedOperationalRevision: result.storeRevision,
    expectedWebsiteRevision: firstRevision,
    idempotencyKey: crypto.randomUUID(),
  });
  assert.equal(result.workflow.status, 'Live');
  assert.equal(result.publicationHistory.length, 1);
});

test('Listing Studio exposes repeat revisions and safe newer-draft controls', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
  assert.match(source, /Create New Revision/);
  assert.match(source, /A newer draft is available\./);
  assert.match(source, /Open Latest Draft/);
  assert.match(source, /Continue Current Draft/);
  assert.match(source, /draft\.updated/);
  assert.match(source, /operational\/revise/);
});
