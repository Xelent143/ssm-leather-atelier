const crypto = require('crypto');
const { resolveApprovedRelease } = require('./product-plm-release-resolver');
const { hashValue } = require('./product-plm-versions');

function titleCase(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildWarnings(snapshot, evidenceReferenceIds = []) {
  const identity = snapshot.productIdentity;
  const refs = identity.extensionReferences || {};
  return [
    ['missing_measurements', 'Missing measurements', !refs.measurements?.length],
    ['missing_images', 'Missing images', !identity.originalMediaReferences?.length],
    ['missing_leather_specifications', 'Missing leather specifications', !refs.leatherMaterials?.length],
    ['missing_evidence', 'Missing evidence', evidenceReferenceIds.length === 0],
  ].map(([code, label, missing]) => ({ code, label, missing }));
}

function generateContent(version, release) {
  const snapshot = version.snapshot;
  const identity = snapshot.productIdentity;
  const brand = snapshot.brand.name;
  const productType = titleCase(snapshot.productStyle.productType);
  const title = identity.displayName || `${brand} ${productType}`;
  const factual = `${title} by ${brand}. A ${productType.toLowerCase()} from an approved product release.`;
  const bullets = [
    `Product type: ${productType}`,
    `Brand: ${brand}`,
    `Release: ${release.releaseNumber}`,
    'Confirm size, leather, fit, and care details before publishing.',
  ];
  const keywords = [...new Set([
    ...title.toLowerCase().split(/\s+/).map((item) =>
      item.replace(/[^a-z0-9'-]/g, '')).filter(Boolean),
    productType.toLowerCase(),
    brand.toLowerCase(),
    'leather gear',
  ])];
  return {
    shopify: { title, description: `${factual}\n\n${bullets.map((item) => `• ${item}`).join('\n')}` },
    ebay: { title: title.slice(0, 80), description: `${factual}\n\n${bullets.join('\n')}` },
    etsy: { title: title.slice(0, 140), description: `${factual}\n\n${bullets.join('\n')}` },
    seo: {
      title: `${title} | ${brand}`.slice(0, 60),
      metaDescription: `${factual} Review approved product details, available options and fit information.`.slice(0, 160),
      keywords,
      tags: keywords.slice(0, 13),
    },
    faq: [
      {
        question: `What type of product is ${title}?`,
        answer: `${title} is classified in the approved release as a ${productType.toLowerCase()}.`,
      },
      {
        question: 'Which product details should I confirm before ordering?',
        answer: 'Confirm the published size, fit, leather, color, and care information before ordering.',
      },
    ],
    buyingGuide: `How to evaluate ${title}\n\nReview fit, measurements, leather specification, construction details, and intended use. Only publish claims supported by the approved product release and evidence.`,
  };
}

function quality(content, warnings) {
  const penalty = warnings.filter((item) => item.missing).length * 8;
  return {
    seoScore: Math.max(0, 92 - penalty),
    geoReadiness: Math.max(0, 88 - penalty),
    aeoReadiness: Math.max(0, (content.faq.length ? 90 : 60) - penalty),
    marketplaceCompleteness: Math.max(0, 94 - penalty),
  };
}

function createListingStudioService(options = {}) {
  const plmStore = options.plmStore;
  const listingStore = options.listingStore;
  const identity = options.identity;
  const now = options.now || (() => Date.now());
  function requireOwner(session) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.accountType !== 'owner' || user.status !== 'active') {
      const error = new Error('Named Owner access is required.');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }
    return user;
  }
  function workspace(productUuid) {
    const listing = listingStore.read();
    return {
      storeRevision: listing.storeRevision,
      drafts: listing.drafts.filter((item) => item.productUuid === productUuid),
    };
  }
  async function generate(session, input) {
    const user = requireOwner(session);
    const plm = plmStore.read();
    const resolved = resolveApprovedRelease(plm, {
      productUuid: input.productUuid,
      channel: 'ai_generation',
      purpose: 'product_listing',
    });
    if (!resolved.trusted) {
      const error = new Error('A trusted active Product Release and valid Knowledge Lock are required.');
      error.code = 'UNTRUSTED_RELEASE';
      throw error;
    }
    const release = resolved.release;
    const version = plm.productVersions.find((item) => item.id === release.productVersionId);
    const warnings = buildWarnings(version.snapshot, release.evidenceReferenceIds);
    const content = generateContent(version, release);
    const result = await listingStore.mutate((draftStore) => {
      const prior = draftStore.drafts.filter((item) => item.productUuid === input.productUuid);
      const draft = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        productUuid: input.productUuid,
        productVersionId: version.id,
        productVersionHash: version.contentHash,
        productReleaseId: release.id,
        releaseManifestHash: release.releaseManifestHash,
        knowledgeLockId: resolved.lock.id,
        knowledgeLockHash: resolved.lock.knowledgeLockHash,
        draftVersion: prior.length + 1,
        state: 'draft',
        generationMode: 'deterministic_rules',
        warnings,
        quality: quality(content, warnings),
        content,
        contentHash: null,
        createdAt: new Date(now()).toISOString(),
        createdBy: `user:${user.id}`,
      };
      draft.contentHash = hashValue({ ...draft, contentHash: null });
      draftStore.drafts.push(draft);
      return { store: draftStore, value: draft };
    }, input.expectedRevision);
    return {
      draft: result.value,
      drafts: result.store.drafts.filter((item) => item.productUuid === input.productUuid),
      storeRevision: result.store.storeRevision,
    };
  }
  return { generate, workspace };
}

module.exports = { buildWarnings, createListingStudioService, generateContent, quality };
