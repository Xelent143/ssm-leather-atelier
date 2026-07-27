const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createAiProductCopilotStore } = require('../ai-product-copilot-store');
const {
  createAiProductCopilotService, createDeterministicCopilotProvider,
} = require('../ai-product-copilot-service');
const { validateResponse } = require('../ai-product-copilot-schema');
const { createOpenAiVisionProvider } = require('../ai-product-copilot-provider');

function fixture(images) {
  const evidence = [{ imageId: images[0].id, imageRole: images[0].role }];
  const tags = ['brown vest', 'leather vest', 'mens vest', 'biker vest', 'western vest',
    'motorcycle vest', 'brown leather', 'rider vest', 'premium vest', 'leather apparel',
    'mens leather', 'vest for men', 'motogrip gear'];
  return {
    visualAnalysis: [
      { field: 'productType', value: 'Leather Vest', confidence: 'high', status: 'confirmed', evidence },
      { field: 'color', value: 'Brown', confidence: 'high', status: 'confirmed', evidence },
    ],
    productFacts: [
      { field: 'productType', value: 'Leather Vest', confidence: 'high', status: 'confirmed', evidence },
      { field: 'leatherType', value: 'Possible cowhide', confidence: 'low', status: 'needs_confirmation', evidence },
    ],
    audienceClassification: {
      gender: { field: 'gender', value: 'male', confidence: 'high', status: 'confirmed', evidence },
      ageGroup: { field: 'ageGroup', value: 'adult', confidence: 'high', status: 'confirmed', evidence },
    },
    merchantAttributes: [
      { field: 'color', value: 'Brown', confidence: 'high', status: 'confirmed', evidence },
      { field: 'material', value: '', confidence: 'low', status: 'needs_confirmation', evidence: [] },
      { field: 'condition', value: 'new', confidence: 'medium', status: 'suggested', evidence: [] },
      { field: 'size_system', value: 'US', confidence: 'medium', status: 'suggested', evidence: [] },
      { field: 'size_type', value: 'regular', confidence: 'medium', status: 'suggested', evidence: [] },
      { field: 'google_product_category', value: 'Apparel & Accessories > Clothing > Vests', confidence: 'medium', status: 'suggested', evidence: [] },
      { field: 'identifier_exists', value: 'false', confidence: 'low', status: 'needs_confirmation', evidence: [] },
    ],
    suggestedTitle: 'Men’s Brown Leather Vest',
    missingInformation: [
      { field: 'leatherType', question: 'What leather type is used?', options: ['Cowhide', 'Buffalo', 'Unknown'], critical: true },
    ],
    categorySuggestions: ['Leather Vests'],
    websiteContent: {
      description: ['A premium brown leather vest described only from confirmed visible details.'],
      features: ['Brown finish', 'Sleeveless vest construction'],
      specifications: [{ label: 'Color', value: 'Brown' }, { label: 'Gender', value: 'Men' }, { label: 'Age group', value: 'Adult' }],
      perfectFor: 'Riders seeking a versatile leather layering piece.',
      whyYouWillLoveIt: 'A clean design that keeps the visible product details central.',
    },
    seo: {
      title: 'Men’s Brown Leather Vest | MOTOGRIP GEAR',
      metaDescription: 'Explore a premium men’s brown leather vest with a clean rider-inspired silhouette. Confirm material and sizing details before ordering.',
      handle: 'mens-brown-leather-vest',
      primaryKeyword: 'mens brown leather vest',
      secondaryKeywords: ['brown biker vest', 'leather riding vest'],
      searchIntentKeywords: ['buy mens brown leather vest'],
      altTextSuggestions: ['Front view of men’s brown leather vest'],
    },
    aeo: [{ question: 'Who is this vest for?', answer: 'It is presented for men seeking a leather layering vest.' }],
    geo: [{ question: 'What makes this vest distinct?', answer: 'Its visible brown finish and clean vest silhouette.' }],
    ebayDraft: { title: 'Mens Brown Leather Biker Vest Premium Rider Style MOTOGRIP', description: 'Factual brown leather vest draft. Confirm material and sizing.' },
    etsyDraft: {
      title: 'Mens Brown Leather Vest, Premium Biker and Western Inspired Rider Layer, Handcrafted Style Gift for Him',
      description: 'A factual product draft based on supplied images. Confirm leather type and measurements.',
      tags,
    },
    imageCoverage: [
      { role: 'Front', available: true, recommendation: 'Front image supplied.' },
      { role: 'Back', available: false, recommendation: 'Upload a back image.' },
      { role: 'Interior', available: false, recommendation: 'Upload an interior image.' },
    ],
    risks: ['Leather type requires Owner confirmation.'],
    unsupportedClaims: [],
  };
}

function harness({ allowed = true, trustedType = 'Western Vest', owner = true } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-ai-copilot-'));
  const store = createAiProductCopilotStore({ dataDir });
  const product = {
    id: '11111111-1111-4111-8111-111111111111',
    productUuid: '22222222-2222-4222-8222-222222222222',
    title: '', organization: {
      brand: 'MOTOGRIP GEAR', productType: trustedType, category: '', gender: 'Men', tags: [],
      ageGroup: 'adult',
    },
    metafields: {}, revision: 1,
    media: [
      { id: '33333333-3333-4333-8333-333333333333', path: 'https://example.com/front.jpg', role: 'Front', title: 'Front' },
      { id: '44444444-4444-4444-8444-444444444444', path: 'https://example.com/back.jpg', role: 'Back', title: 'Back' },
    ],
  };
  const user = { id: owner ? 'owner-1' : 'editor-1', status: 'active', accountType: owner ? 'owner' : 'user' };
  const identity = { findById: (id) => id === user.id ? user : null };
  const productStore = { read: () => ({ products: [structuredClone(product)] }) };
  const plmStore = { read: () => ({ productIdentities: [{ id: product.productUuid }] }) };
  const provider = createDeterministicCopilotProvider((input) => fixture(input.images));
  const service = createAiProductCopilotService({
    store, identity, productStore, plmStore, provider, dataDir, rootDir: process.cwd(),
    authorizeUser: () => allowed,
  });
  return { dataDir, product, service, store, session: { actorType: 'named_user', userId: user.id } };
}

test('schema accepts factual evidence and exactly 13 Etsy tags', () => {
  const images = [{ id: 'image-1', role: 'Front' }];
  const result = validateResponse(fixture(images), images);
  assert.equal(result.etsyDraft.tags.length, 13);
  assert.equal(result.productFacts[1].status, 'needs_confirmation');
  assert.deepEqual(Object.keys(result.websiteContent), [
    'description', 'features', 'specifications', 'perfectFor', 'whyYouWillLoveIt',
  ]);
});

test('schema rejects malformed output and unknown evidence', () => {
  const output = fixture([{ id: 'image-1', role: 'Front' }]);
  output.productFacts[0].evidence[0].imageId = 'unknown';
  assert.throws(() => validateResponse(output, [{ id: 'image-1', role: 'Front' }]), /unknown image/);
});

test('analysis is append-only, versioned, evidence-linked, and does not mutate product', async () => {
  const { service, store, session, product } = harness();
  const before = structuredClone(product);
  const first = await service.analyze(session, {
    productId: product.id, instruction: 'Keep this factual.', knownFacts: {},
  });
  assert.equal(first.analysis.version, 1);
  assert.equal(first.analysis.status, 'needs_confirmation');
  assert.equal(first.analysis.result.visualAnalysis[0].evidence[0].imageId, product.media[0].id);
  assert.deepEqual(product, before);
  const second = await service.analyze(session, {
    productId: product.id, expectedRevision: first.workspace.storeRevision,
    instruction: 'Reanalyze without inventing facts.',
  });
  assert.equal(second.analysis.version, 2);
  assert.equal(store.read().analyses.length, 2);
  assert.equal(store.read().auditEvents.length, 2);
});

test('trusted product facts win and conflicts are visible', async () => {
  const { service, session, product } = harness({ trustedType: 'Western Vest' });
  const result = await service.analyze(session, { productId: product.id });
  const productType = result.analysis.result.productFacts.find((fact) => fact.field === 'productType');
  assert.equal(productType.value, 'Western Vest');
  assert.equal(productType.status, 'needs_confirmation');
  assert.equal(result.analysis.trustedConflicts[0].resolution, 'trusted_data_wins');
});

test('trusted audience classification wins and ambiguous classification blocks Merchant readiness', async () => {
  const { service, session, product } = harness();
  const result = await service.analyze(session, {
    productId: product.id,
    knownFacts: { gender: 'Men', ageGroup: 'adult' },
  });
  assert.equal(result.analysis.result.audienceClassification.gender.value, 'male');
  assert.equal(result.analysis.result.audienceClassification.ageGroup.value, 'adult');

  const ambiguous = fixture(product.media);
  ambiguous.audienceClassification.gender = {
    field: 'gender', value: 'unisex', confidence: 'low',
    status: 'suggested', evidence: [ambiguous.visualAnalysis[0].evidence[0]],
  };
  ambiguous.audienceClassification.ageGroup = {
    field: 'ageGroup', value: '', confidence: 'low', status: 'needs_confirmation', evidence: [],
  };
  const validated = validateResponse(ambiguous, product.media);
  assert.equal(validated.audienceClassification.gender.status, 'suggested');
  assert.equal(validated.audienceClassification.ageGroup.status, 'needs_confirmation');
});

test('review records accepted fields without overwriting previous analysis', async () => {
  const { service, store, session, product } = harness();
  const first = await service.analyze(session, { productId: product.id });
  const reviewed = await service.recordReview(session, {
    analysisId: first.analysis.id, expectedRevision: first.workspace.storeRevision,
    acceptedFields: ['title', 'seo.title'], rejectedFields: ['seo.handle'], draftRevision: 4,
  });
  assert.deepEqual(reviewed.analysis.acceptedFields, ['title', 'seo.title']);
  assert.equal(reviewed.analysis.finalAppliedDraftVersion, 4);
  assert.equal(store.read().analyses[0].acceptedFields.length, 0);
});

test('configured provider status and missing credential behavior are safe', async () => {
  const provider = createOpenAiVisionProvider({ apiKey: '' });
  assert.equal(provider.configured, false);
  await assert.rejects(() => provider.analyze({ images: [], context: {} }), /not configured/);
});

test('non-owner authorization is enforced server-side', () => {
  const { service, session, product } = harness({ allowed: false, owner: false });
  assert.throws(() => service.workspace(session, product.id), /permission/);
});

test('Product Editor exposes manual and AI modes without automatic application', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  assert.match(source, /Manual Entry/);
  assert.match(source, /Analyze with AI/);
  assert.match(source, /Apply Selected Suggestions/);
  assert.match(source, /Nothing is applied or published without your action/);
  assert.match(source, /Google Merchant/);
  assert.match(source, /Permanent website content contract/);
});
