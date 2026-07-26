const crypto = require('crypto');
const { resolveApprovedRelease } = require('./product-plm-release-resolver');
const { hashValue } = require('./product-plm-versions');

const INPUT_FIELDS = Object.freeze([
  'productTitle', 'productType', 'brand', 'sku', 'leatherType', 'leatherColor',
  'gender', 'style', 'fit', 'condition', 'outerMaterial', 'liningMaterial',
  'closure', 'hardware', 'pocketCount', 'insidePockets', 'concealedCarryPockets',
  'stitching', 'collar', 'sleeves', 'adjustments', 'armorCompatibility', 'price',
  'availableSizes', 'customSizingAvailable', 'quantity', 'processingTime',
  'shippingTime', 'returns', 'personalization', 'targetMarket', 'sizeRange',
  'productLength', 'chestWaistMeasurements', 'customMeasurementInstructions',
  'imageReferenceIds', 'evidenceReferenceIds',
]);
const ARRAY_FIELDS = new Set(['availableSizes', 'imageReferenceIds', 'evidenceReferenceIds']);
const BOOLEAN_FIELDS = new Set(['customSizingAvailable']);
const NUMBER_FIELDS = new Set(['price', 'quantity', 'pocketCount', 'insidePockets']);
const CRITICAL_FIELDS = Object.freeze([
  'productTitle', 'productType', 'brand', 'sku', 'outerMaterial', 'leatherColor',
  'price', 'availableSizes', 'processingTime', 'shippingTime', 'returns',
]);
const RECOMMENDED_FIELDS = Object.freeze([
  'fit', 'liningMaterial', 'closure', 'hardware', 'pocketCount', 'targetMarket',
  'sizeRange', 'chestWaistMeasurements', 'imageReferenceIds', 'evidenceReferenceIds',
]);
const OPTIONAL_FIELDS = Object.freeze(INPUT_FIELDS.filter((field) =>
  !CRITICAL_FIELDS.includes(field) && !RECOMMENDED_FIELDS.includes(field)));

function titleCase(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanText(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanInput(raw = {}) {
  const values = {};
  for (const field of INPUT_FIELDS) {
    if (!(field in raw)) continue;
    if (ARRAY_FIELDS.has(field)) {
      values[field] = [...new Set((Array.isArray(raw[field]) ? raw[field] :
        String(raw[field] || '').split(',')).map((item) => cleanText(item, 240)).filter(Boolean))].slice(0, 100);
    } else if (BOOLEAN_FIELDS.has(field)) {
      values[field] = Boolean(raw[field]);
    } else if (NUMBER_FIELDS.has(field)) {
      const number = Number(raw[field]);
      values[field] = Number.isFinite(number) && number >= 0 ? number : null;
    } else {
      values[field] = cleanText(raw[field]);
    }
  }
  return values;
}

function isMissing(value) {
  return value === '' || value === null || value === undefined ||
    (Array.isArray(value) && value.length === 0);
}

function missingInformation(input, notApplicable = {}) {
  const legacyCodes = {
    imageReferenceIds: 'missing_images',
    evidenceReferenceIds: 'missing_evidence',
    chestWaistMeasurements: 'missing_measurements',
    outerMaterial: 'missing_leather_specifications',
  };
  const group = (fields, severity) => fields.map((field) => ({
    field,
    code: legacyCodes[field] ||
      `missing_${field.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}`,
    label: titleCase(field.replace(/([a-z])([A-Z])/g, '$1 $2')),
    severity,
    missing: !notApplicable[field] && isMissing(input[field]),
    notApplicable: Boolean(notApplicable[field]),
  }));
  return [
    ...group(CRITICAL_FIELDS, 'critical'),
    ...group(RECOMMENDED_FIELDS, 'recommended'),
    ...group(OPTIONAL_FIELDS, 'optional'),
  ];
}

function baseInput(version) {
  const snapshot = version.snapshot;
  const identity = snapshot.productIdentity || {};
  const refs = identity.extensionReferences || {};
  const style = snapshot.productStyle || {};
  return cleanInput({
    productTitle: identity.displayName,
    productType: titleCase(style.productType),
    brand: snapshot.brand?.name,
    sku: snapshot.sellableItems?.[0]?.sku || '',
    style: style.name || style.styleCode,
    condition: 'New',
    outerMaterial: refs.leatherMaterials?.[0] || '',
    availableSizes: snapshot.sellableItems?.flatMap((item) =>
      item.optionValueIds || []) || [],
    imageReferenceIds: identity.originalMediaReferences || [],
    evidenceReferenceIds: [],
  });
}

function currentInput(store, productUuid, version) {
  const saved = store.inputDrafts.filter((item) => item.productUuid === productUuid).at(-1);
  return saved || {
    id: null,
    inputVersion: 0,
    values: baseInput(version),
    notApplicable: {},
    ownerNote: '',
    createdAt: null,
    createdBy: null,
  };
}

function sentenceList(values) {
  return values.filter(Boolean).join(', ');
}

function buildContent(input) {
  const title = input.productTitle;
  const brand = input.brand;
  const type = input.productType;
  const facts = [
    input.outerMaterial && `${input.outerMaterial} outer`,
    input.leatherColor && `${input.leatherColor} color`,
    input.fit && `${input.fit} fit`,
    input.closure && `${input.closure} closure`,
    input.liningMaterial && `${input.liningMaterial} lining`,
  ].filter(Boolean);
  const features = [
    ...facts,
    input.hardware && `Hardware: ${input.hardware}`,
    input.pocketCount !== null && input.pocketCount !== undefined && `Exterior pockets: ${input.pocketCount}`,
    input.insidePockets !== null && input.insidePockets !== undefined && `Inside pockets: ${input.insidePockets}`,
    input.armorCompatibility && `Armor compatibility: ${input.armorCompatibility}`,
    input.customSizingAvailable && 'Custom sizing available',
    input.personalization && `Personalization: ${input.personalization}`,
  ].filter(Boolean);
  const specifications = [
    ['Brand', brand], ['Product type', type], ['SKU', input.sku],
    ['Color', input.leatherColor], ['Material', input.outerMaterial],
    ['Lining', input.liningMaterial], ['Fit', input.fit],
    ['Available sizes', sentenceList(input.availableSizes || [])],
    ['Processing time', input.processingTime], ['Shipping time', input.shippingTime],
    ['Returns', input.returns],
  ].filter(([, value]) => !isMissing(value));
  const shortDescription = `${title} is a ${type.toLowerCase()} by ${brand}${facts.length ? ` featuring ${sentenceList(facts)}` : ''}.`;
  const fullDescription = [
    shortDescription,
    features.length ? `Features\n${features.map((item) => `• ${item}`).join('\n')}` : '',
    specifications.length ? `Specifications\n${specifications.map(([key, value]) => `• ${key}: ${value}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
  const perfectFor = input.targetMarket
    ? `Designed for ${input.targetMarket}.`
    : `A practical choice for customers looking for a premium ${type.toLowerCase()}.`;
  const why = facts.length
    ? `You’ll love the considered combination of ${sentenceList(facts)}.`
    : `You’ll love its clear MOTOGRIP identity and versatile ${type.toLowerCase()} design.`;
  const faq = [
    { question: `What sizes are available for ${title}?`, answer: input.availableSizes.length ? `Available sizes: ${sentenceList(input.availableSizes)}.` : 'Confirm current size availability before ordering.' },
    { question: `What is ${title} made from?`, answer: input.outerMaterial ? `The approved listing input specifies ${input.outerMaterial}${input.liningMaterial ? ` with ${input.liningMaterial} lining` : ''}.` : 'Material details must be confirmed before export.' },
    { question: 'Is custom sizing available?', answer: input.customSizingAvailable ? `Yes. ${input.customMeasurementInstructions || 'Contact MOTOGRIP GEAR with your measurements.'}` : 'Custom sizing is not listed as available for this product.' },
  ];
  const tokens = `${brand} ${type} ${input.leatherColor} ${input.gender} ${input.style}`.toLowerCase()
    .split(/\s+/).map((item) => item.replace(/[^a-z0-9'-]/g, '')).filter(Boolean);
  const keywords = [...new Set([...tokens, 'leather gear'])];
  const etsyTags = [...new Set([
    `${input.leatherColor} leather`, type.toLowerCase(), `${input.gender || 'unisex'} leather`,
    'motogrip gear', 'leather apparel', input.style?.toLowerCase(), input.fit?.toLowerCase(),
    'motorcycle style', 'premium leather', 'gift for riders', 'biker fashion',
    'custom sizing', 'handcrafted style', 'leather outerwear', 'riding apparel',
  ].filter(Boolean).map((tag) => tag.slice(0, 20)))].slice(0, 13);
  while (etsyTags.length < 13) etsyTags.push(`leather style ${etsyTags.length + 1}`.slice(0, 20));
  const etsyTitleBase = `${title} | ${input.leatherColor} ${type} | ${brand} | ${input.gender || 'Unisex'} Leather Outerwear`;
  const etsyTitle = etsyTitleBase.length < 100
    ? `${etsyTitleBase} | Premium Motorcycle Style`.slice(0, 140)
    : etsyTitleBase.slice(0, 140);
  return {
    shopify: {
      title,
      description: fullDescription,
      seoTitle: `${title} | ${brand}`.slice(0, 60),
      metaDescription: `${shortDescription} Explore sizes, features and fit from ${brand}.`.slice(0, 160),
      shortDescription,
      fullDescription,
      features,
      specifications,
      perfectFor,
      whyYouWillLoveIt: why,
      faq,
      buyingGuide: `Choosing ${title}\n\nReview the available sizes, ${input.fit ? `${input.fit} fit, ` : ''}materials, processing time and return terms before ordering.`,
      urlHandle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tags: keywords.slice(0, 20),
    },
    ebay: {
      title: `${brand} ${input.leatherColor} ${type} ${input.gender || ''} ${input.sku}`.replace(/\s+/g, ' ').trim().slice(0, 80),
      description: fullDescription,
      shortDescription,
      fullDescription,
      features,
      specifications,
      itemSpecifics: specifications,
      bulletPoints: features,
      searchKeywords: keywords,
    },
    etsy: {
      title: etsyTitle,
      description: fullDescription,
      shortDescription,
      fullDescription,
      features,
      specifications,
      perfectFor,
      whyYouWillLoveIt: why,
      personalizationInstructions: input.personalization || 'Personalization is not currently specified for this product.',
      tags: etsyTags,
      commaSeparatedTags: etsyTags.join(', '),
    },
    seo: {
      title: `${title} | ${brand}`.slice(0, 60),
      metaDescription: `${shortDescription} Shop ${brand} with clear sizing and product details.`.slice(0, 160),
      keywords,
      tags: keywords.slice(0, 13),
    },
    faq,
    buyingGuide: `How to choose ${title}\n\n${shortDescription}\n\nCheck ${sentenceList([
      input.fit && 'fit', input.sizeRange && 'size range', input.outerMaterial && 'material',
      input.processingTime && 'processing time', input.returns && 'return terms',
    ]) || 'the confirmed product details'} before ordering. Never rely on unverified product claims.`,
  };
}

function flattenText(content) {
  return JSON.stringify(content).toLowerCase();
}

function quality(content, missing) {
  const issues = [];
  const critical = missing.filter((item) => item.severity === 'critical' && item.missing);
  if (critical.length) issues.push({ code: 'missing_critical', severity: 'error', message: `${critical.length} critical field(s) block export.`, fix: 'Complete the critical fields or mark genuinely inapplicable fields.' });
  const titleChecks = [
    ['shopify', content.shopify.title.length, 255],
    ['ebay', content.ebay.title.length, 80],
    ['etsy', content.etsy.title.length, 140],
  ];
  for (const [channel, length, max] of titleChecks) {
    if (length > max || (channel === 'etsy' && length < 100)) issues.push({
      code: `${channel}_title_length`, severity: 'warning',
      message: `${titleCase(channel)} title length is ${length}.`, fix: channel === 'etsy' ? 'Keep the Etsy title between 100 and 140 characters.' : `Keep the title within ${max} characters.`,
    });
  }
  if (content.seo.metaDescription.length < 120 || content.seo.metaDescription.length > 160) issues.push({
    code: 'meta_length', severity: 'warning', message: `Meta description length is ${content.seo.metaDescription.length}.`, fix: 'Aim for 120–160 characters.',
  });
  if (content.etsy.tags.length !== 13) issues.push({ code: 'etsy_tags', severity: 'error', message: 'Etsy requires exactly 13 tags in this workspace.', fix: 'Add or remove tags until exactly 13 remain.' });
  const text = flattenText(content);
  const unsupported = ['guaranteed protection', '100% waterproof', 'ce certified'].filter((claim) => text.includes(claim));
  if (unsupported.length) issues.push({ code: 'unsupported_claim', severity: 'error', message: 'Potential unsupported claim detected.', fix: 'Remove the claim or attach approved evidence.' });
  const warningPenalty = missing.filter((item) => item.missing).length * 2;
  const errorPenalty = issues.filter((item) => item.severity === 'error').length * 12;
  const warningIssuePenalty = issues.filter((item) => item.severity === 'warning').length * 5;
  const score = Math.max(0, 96 - warningPenalty - errorPenalty - warningIssuePenalty);
  return {
    seoScore: score,
    geoReadiness: Math.max(0, score - (content.faq.length ? 0 : 15)),
    aeoReadiness: Math.max(0, score - (content.faq.length >= 3 ? 0 : 10)),
    marketplaceCompleteness: Math.max(0, score - critical.length * 5),
    issues,
  };
}

function validateEditedContent(content) {
  const channels = ['shopify', 'ebay', 'etsy', 'seo', 'faq', 'buyingGuide'];
  if (!content || typeof content !== 'object' ||
      Object.keys(content).some((key) => !channels.includes(key)) ||
      channels.some((key) => !(key in content))) {
    throw Object.assign(new Error('Listing content structure is invalid.'), { code: 'VALIDATION' });
  }
  const serialized = JSON.stringify(content);
  if (serialized.length > 200000 ||
      /"(?:password|secret|token|cookie|credential|authorization)"\s*:/i.test(serialized)) {
    throw Object.assign(new Error('Listing content contains unsupported data.'), { code: 'VALIDATION' });
  }
  return structuredClone(content);
}

function createListingStudioService(options = {}) {
  const { plmStore, listingStore, identity, productIdentityService } = options;
  const now = options.now || (() => Date.now());

  function actor(session, permissions = ['owner', 'listing_editor']) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!user || user.status !== 'active' || !permissions.includes(user.accountType)) {
      const error = new Error('Authorized Listing Studio access is required.');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }
    return user;
  }

  function trusted(productUuid) {
    const plm = plmStore.read();
    const resolved = resolveApprovedRelease(plm, {
      productUuid, channel: 'ai_generation', purpose: 'product_listing',
    });
    if (!resolved.trusted) {
      const error = new Error('A trusted active Product Release and valid Knowledge Lock are required.');
      error.code = 'UNTRUSTED_RELEASE';
      throw error;
    }
    const version = plm.productVersions.find((item) => item.id === resolved.release.productVersionId);
    return { resolved, version };
  }

  function managedIdentity(productUuid) {
    return productIdentityService?.view(productUuid).identity || null;
  }

  function applyManagedIdentity(productUuid, values) {
    const managed = managedIdentity(productUuid);
    return managed ? { ...values, sku: managed.productSku } : values;
  }

  function workspace(session, productUuid) {
    actor(session);
    const { version } = trusted(productUuid);
    const store = listingStore.read();
    const inputDraft = currentInput(store, productUuid, version);
    inputDraft.values = applyManagedIdentity(productUuid, inputDraft.values);
    return {
      storeRevision: store.storeRevision,
      inputDraft,
      productIdentity: managedIdentity(productUuid),
      missingInformation: missingInformation(inputDraft.values, inputDraft.notApplicable),
      drafts: store.drafts.filter((item) => item.productUuid === productUuid),
      permissions: {
        canEdit: true,
        canGenerate: true,
        canApprove: actor(session).accountType === 'owner',
        canExport: actor(session).accountType === 'owner',
      },
    };
  }

  async function saveInput(session, input) {
    const user = actor(session);
    const { version } = trusted(input.productUuid);
    const editableValues = { ...(input.values || {}) };
    delete editableValues.sku;
    const result = await listingStore.mutate((store) => {
      const prior = currentInput(store, input.productUuid, version);
      const record = {
        id: crypto.randomUUID(),
        productUuid: input.productUuid,
        inputVersion: prior.inputVersion + 1,
        values: applyManagedIdentity(
          input.productUuid,
          { ...prior.values, ...cleanInput(editableValues) },
        ),
        notApplicable: Object.fromEntries(Object.entries(input.notApplicable || {})
          .filter(([field, value]) => INPUT_FIELDS.includes(field) && value === true)),
        ownerNote: cleanText(input.ownerNote, 1000),
        createdAt: new Date(now()).toISOString(),
        createdBy: `user:${user.id}`,
      };
      record.contentHash = hashValue({ ...record, contentHash: null });
      store.inputDrafts.push(record);
      return { store, value: record };
    }, input.expectedRevision);
    return workspace(session, input.productUuid);
  }

  async function appendDraft(
    session,
    input,
    mode,
    contentOverride = null,
    sourceDraftId = null,
    approvalState = 'unreviewed',
  ) {
    const user = actor(session);
    const { resolved, version } = trusted(input.productUuid);
    const result = await listingStore.mutate((store) => {
      const inputDraft = currentInput(store, input.productUuid, version);
      inputDraft.values = applyManagedIdentity(input.productUuid, inputDraft.values);
      const missing = missingInformation(inputDraft.values, inputDraft.notApplicable);
      const content = contentOverride || buildContent(inputDraft.values);
      const prior = store.drafts.filter((item) => item.productUuid === input.productUuid);
      const draft = {
        id: crypto.randomUUID(),
        schemaVersion: 2,
        productUuid: input.productUuid,
        productVersionId: version.id,
        productVersionHash: version.contentHash,
        productReleaseId: resolved.release.id,
        releaseManifestHash: resolved.release.releaseManifestHash,
        knowledgeLockId: resolved.lock.id,
        knowledgeLockHash: resolved.lock.knowledgeLockHash,
        listingInputDraftId: inputDraft.id,
        listingInputVersion: inputDraft.inputVersion,
        draftVersion: prior.length + 1,
        state: 'draft',
        approvalState,
        generationMode: mode,
        sourceDraftId,
        warnings: missing,
        quality: quality(content, missing),
        content,
        contentHash: null,
        createdAt: new Date(now()).toISOString(),
        createdBy: `user:${user.id}`,
        editedBy: mode === 'human_edit' ? `user:${user.id}` : null,
        generatedBy: mode === 'deterministic_rules' ? 'rules:v2' : null,
      };
      draft.contentHash = hashValue({ ...draft, contentHash: null });
      store.drafts.push(draft);
      return { store, value: draft };
    }, input.expectedRevision);
    return { ...workspace(session, input.productUuid), draft: result.value };
  }

  async function generate(session, input) {
    return appendDraft(session, input, 'deterministic_rules');
  }

  async function saveEdit(session, input) {
    actor(session);
    const store = listingStore.read();
    const source = store.drafts.find((item) =>
      item.id === input.draftId && item.productUuid === input.productUuid);
    if (!source) throw Object.assign(new Error('Listing draft was not found.'), { code: 'VALIDATION' });
    return appendDraft(session, input, 'human_edit', validateEditedContent(input.content), source.id);
  }

  async function restore(session, input) {
    const store = listingStore.read();
    const source = store.drafts.find((item) =>
      item.id === input.draftId && item.productUuid === input.productUuid);
    if (!source) throw Object.assign(new Error('Listing draft was not found.'), { code: 'VALIDATION' });
    return appendDraft(session, input, 'restored_version', structuredClone(source.content), source.id);
  }

  async function approve(session, input) {
    actor(session, ['owner']);
    const store = listingStore.read();
    const source = store.drafts.find((item) =>
      item.id === input.draftId && item.productUuid === input.productUuid);
    if (!source) throw Object.assign(new Error('Listing draft was not found.'), { code: 'VALIDATION' });
    return appendDraft(
      session,
      input,
      'owner_approval',
      structuredClone(source.content),
      source.id,
      'owner_approved',
    );
  }

  function exportPackage(session, input) {
    const user = actor(session, ['owner']);
    const { resolved } = trusted(input.productUuid);
    const store = listingStore.read();
    const draft = store.drafts.find((item) =>
      item.id === input.draftId && item.productUuid === input.productUuid);
    if (!draft) throw Object.assign(new Error('Listing draft was not found.'), { code: 'VALIDATION' });
    const blockers = draft.warnings.filter((item) => item.severity === 'critical' && item.missing);
    if (blockers.length) {
      const error = new Error('Complete all critical product information before export.');
      error.code = 'VALIDATION';
      throw error;
    }
    const managed = managedIdentity(input.productUuid);
    return {
      productIdentity: {
        productUuid: input.productUuid,
        catalogId: cleanText(input.catalogId, 120) || null,
        productSku: managed?.productSku || draft.content?.ebay?.itemSpecifics
          ?.find(([key]) => key === 'SKU')?.[1] || null,
        internalProductCode: managed?.internalProductCode || null,
        factoryCode: managed?.factoryCode || null,
        variantSkus: managed?.variantSkus || [],
        barcodeId: managed?.barcodeId || null,
        qrId: managed?.qrId || null,
      },
      releaseId: resolved.release.id,
      knowledgeLockId: resolved.lock.id,
      draftVersion: draft.draftVersion,
      marketplaceContent: draft.content,
      generationTimestamp: draft.createdAt,
      approvalStatus: draft.approvalState,
      exportedAt: new Date(now()).toISOString(),
      exportedBy: `user:${user.id}`,
    };
  }

  return { approve, exportPackage, generate, restore, saveEdit, saveInput, workspace };
}

module.exports = {
  CRITICAL_FIELDS,
  INPUT_FIELDS,
  buildContent,
  createListingStudioService,
  missingInformation,
  quality,
};
