const crypto = require('crypto');
const { validateProductComponents } = require('./product-plm-components');
const { validateMarketplaceIdentities } = require('./product-plm-marketplace-identities');
const { validateProductOptions } = require('./product-plm-options');
const { validateProductRelationships } = require('./product-plm-relationships');
const { validateSellableItems } = require('./product-plm-sellables');
const { validateEvidenceRegistry } = require('./product-plm-evidence');
const { validateProductHistory } = require('./product-plm-history');
const { validateProductVersions } = require('./product-plm-versions');
const { validateApprovalPolicies } = require('./product-plm-approval-policies');
const { validateApprovalRegistry } = require('./product-plm-approvals');

const PRODUCT_PLM_SCHEMA_VERSION = 6;
const PRODUCT_PLM_COLLECTIONS = Object.freeze([
  'brands',
  'legalEntities',
  'productIdentities',
  'productFamilies',
  'productStyles',
  'productComponents',
  'productRelationships',
  'optionDefinitions',
  'optionValues',
  'styleOptionAssignments',
  'sellableItems',
  'marketplaceIdentities',
  'productVersions',
  'evidenceRecords',
  'evidenceLinks',
  'productHistoryEvents',
  'approvalPolicies',
  'approvalRequests',
  'approvalDecisions',
  'legacyMappings',
  'migrationPreviews',
  'migrationBatches',
]);
const PRODUCT_TYPES = Object.freeze([
  'motorcycle_jacket',
  'motorcycle_vest',
  'leather_vest',
  'western_vest',
  'waistcoat',
  'bomber_jacket',
  'varsity_jacket',
  'trucker_jacket',
  'cafe_racer_jacket',
  'chaps',
  'leather_pants',
  'leather_shorts',
  'leather_coat',
  'leather_bag',
  'tool_bag',
  'saddle_bag',
  'gloves',
  'accessories',
]);
const PRODUCT_BRAIN_REFERENCE_TYPES = Object.freeze([
  'aiAnalysis',
  'leatherExpertNotes',
  'manufacturingNotes',
  'photographyNotes',
  'seoNotes',
  'marketplaceNotes',
  'qcHistory',
  'customerIssueHistory',
  'marketingAssets',
  'videoAssets',
  'promptLibrary',
  'brandKnowledge',
]);

const DATA_CLASSIFICATIONS = Object.freeze([
  'public',
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
  'personal_data',
  'authentication_secret',
  'regulated_evidence',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function cleanText(value, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

function contentHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function emptyProductBrainReferences() {
  return Object.fromEntries(PRODUCT_BRAIN_REFERENCE_TYPES.map((type) => [type, []]));
}

function normalizeLegacyProduct(sourceSystem, product) {
  const legacyId = cleanText(product?.id, 160);
  if (!legacyId) throw new Error('Legacy product ID is required.');
  return {
    sourceSystem,
    sourceEntityType: 'product',
    legacyId,
    legacySlug: cleanText(product.slug, 240),
    legacySku: cleanText(product.sku, 160),
    legacyMpn: cleanText(product.mpn, 160),
    legacyItemGroupId: cleanText(product.itemGroupId, 240),
    title: cleanText(product.title || 'Untitled product', 300),
    brandName: cleanText(product.brand || 'MOTOGRIP GEAR', 160),
    legacyVariantOptions: Array.isArray(product.variantOptions)
      ? [...new Set(product.variantOptions.map((value) => cleanText(value, 100)).filter(Boolean))]
      : [],
    legacyStockKeys: product.stock && typeof product.stock === 'object' && !Array.isArray(product.stock)
      ? Object.keys(product.stock).map((value) => cleanText(value, 100)).filter(Boolean)
      : [],
  };
}

function legacySourceKey(record) {
  return `${record.sourceSystem}:${record.sourceEntityType}:${record.legacyId}`;
}

function upgradeStore(store) {
  if (!store || typeof store !== 'object') throw new Error('Product PLM store is invalid.');
  if (store.schemaVersion === PRODUCT_PLM_SCHEMA_VERSION) return store;
  if (![1, 2, 3, 4, 5].includes(store.schemaVersion)) throw new Error('Product PLM schema version is unsupported.');
  const upgraded = { ...store };
  if (store.schemaVersion === 1) {
    upgraded.productFamilies = [];
    upgraded.productStyles = [];
  }
  if (store.schemaVersion < 3) {
    upgraded.productComponents = [];
    upgraded.productRelationships = [];
  }
  if (store.schemaVersion < 4) {
    upgraded.optionDefinitions = [];
    upgraded.optionValues = [];
    upgraded.styleOptionAssignments = [];
    upgraded.sellableItems = [];
    upgraded.marketplaceIdentities = [];
  }
  if (store.schemaVersion < 5) {
    upgraded.productVersions = [];
    upgraded.evidenceRecords = [];
    upgraded.evidenceLinks = [];
    upgraded.productHistoryEvents = [];
  }
  upgraded.approvalPolicies = [];
  upgraded.approvalRequests = [];
  upgraded.approvalDecisions = [];
  upgraded.schemaVersion = PRODUCT_PLM_SCHEMA_VERSION;
  return upgraded;
}

function validateStore(store) {
  if (!store || typeof store !== 'object') throw new Error('Product PLM store is invalid.');
  if (store.schemaVersion !== PRODUCT_PLM_SCHEMA_VERSION) throw new Error('Product PLM schema version is unsupported.');
  if (!Number.isInteger(store.storeRevision) || store.storeRevision < 0) throw new Error('Product PLM store revision is invalid.');
  for (const key of PRODUCT_PLM_COLLECTIONS) {
    if (!Array.isArray(store[key])) throw new Error(`Product PLM ${key} collection is invalid.`);
  }
  const ids = new Set();
  for (const collection of PRODUCT_PLM_COLLECTIONS) {
    for (const entity of store[collection]) {
      if (!isUuid(entity.id)) throw new Error(`Product PLM ${collection} contains an invalid UUID.`);
      if (ids.has(entity.id)) throw new Error('Product PLM contains a duplicate entity UUID.');
      ids.add(entity.id);
    }
  }
  const sourceKeys = new Set();
  for (const mapping of store.legacyMappings) {
    const key = legacySourceKey(mapping);
    if (sourceKeys.has(key)) throw new Error('Product PLM contains a duplicate legacy mapping.');
    sourceKeys.add(key);
    if (!isUuid(mapping.productUuid)) throw new Error('Product PLM legacy mapping target is invalid.');
  }
  const brandIds = new Set(store.brands.map((item) => item.id));
  const legalEntityIds = new Set(store.legalEntities.map((item) => item.id));
  const productUuids = new Set(store.productIdentities.map((item) => item.id));
  const familyIds = new Set(store.productFamilies.map((item) => item.id));
  const familyKeys = new Set();
  for (const family of store.productFamilies) {
    if (!brandIds.has(family.brandId) || !legalEntityIds.has(family.legalEntityId)) {
      throw new Error('Product PLM family ownership reference is invalid.');
    }
    if (family.parentFamilyId && (!familyIds.has(family.parentFamilyId) || family.parentFamilyId === family.id)) {
      throw new Error('Product PLM family parent reference is invalid.');
    }
    if (family.parentFamilyId) {
      const parent = store.productFamilies.find((item) => item.id === family.parentFamilyId);
      if (parent.brandId !== family.brandId || parent.legalEntityId !== family.legalEntityId) {
        throw new Error('Product PLM family parent ownership is inconsistent.');
      }
    }
    const key = `${family.brandId}:${cleanText(family.code, 100).toUpperCase()}`;
    if (!family.code || familyKeys.has(key)) throw new Error('Product PLM family code is invalid or duplicated.');
    familyKeys.add(key);
  }
  for (const family of store.productFamilies) {
    const visited = new Set([family.id]);
    let parentId = family.parentFamilyId;
    while (parentId) {
      if (visited.has(parentId)) throw new Error('Product PLM family hierarchy contains a cycle.');
      visited.add(parentId);
      parentId = store.productFamilies.find((item) => item.id === parentId)?.parentFamilyId || null;
    }
  }
  const styleProducts = new Set();
  const styleCodes = new Set();
  for (const style of store.productStyles) {
    if (!productUuids.has(style.productUuid) || !familyIds.has(style.familyId) ||
        !brandIds.has(style.brandId) || !legalEntityIds.has(style.legalEntityId)) {
      throw new Error('Product PLM style reference is invalid.');
    }
    const identity = store.productIdentities.find((item) => item.id === style.productUuid);
    const family = store.productFamilies.find((item) => item.id === style.familyId);
    if (identity.brandId !== style.brandId || identity.legalEntityId !== style.legalEntityId ||
        family.brandId !== style.brandId || family.legalEntityId !== style.legalEntityId) {
      throw new Error('Product PLM style ownership is inconsistent.');
    }
    if (styleProducts.has(style.productUuid)) throw new Error('Product PLM Product UUID has more than one style.');
    styleProducts.add(style.productUuid);
    const styleCode = cleanText(style.styleCode, 100).toUpperCase();
    if (!styleCode || styleCodes.has(styleCode)) throw new Error('Product PLM style code is invalid or duplicated.');
    if (!PRODUCT_TYPES.includes(style.productType)) {
      throw new Error('Product PLM style product type is invalid.');
    }
    styleCodes.add(styleCode);
  }
  validateProductComponents(store);
  validateProductRelationships(store);
  validateProductOptions(store);
  validateSellableItems(store);
  validateMarketplaceIdentities(store);
  validateEvidenceRegistry(store);
  validateProductVersions(store);
  validateApprovalPolicies(store);
  validateApprovalRegistry(store);
  validateProductHistory(store);
  return store;
}

module.exports = {
  DATA_CLASSIFICATIONS,
  PRODUCT_BRAIN_REFERENCE_TYPES,
  PRODUCT_PLM_COLLECTIONS,
  PRODUCT_PLM_SCHEMA_VERSION,
  PRODUCT_TYPES,
  canonicalize,
  cleanText,
  contentHash,
  emptyProductBrainReferences,
  isUuid,
  legacySourceKey,
  normalizeLegacyProduct,
  upgradeStore,
  validateStore,
};
