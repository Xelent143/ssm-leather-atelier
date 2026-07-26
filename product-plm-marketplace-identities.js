const { validateIntelligenceReferences } = require('./product-plm-intelligence-references');

const MARKETPLACES = Object.freeze([
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
const IDENTITY_KEYS = new Set([
  'id', 'schemaVersion', 'subjectType', 'subjectId', 'marketplace', 'accountReferenceId',
  'externalEntityType', 'externalId', 'externalParentId', 'externalItemGroupId',
  'identityRole', 'isPrimary', 'status', 'lastVerifiedAt', 'intelligenceReferences',
  'dataClassification', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function validExternalId(value, required = false) {
  if (value === null && !required) return true;
  const text = String(value || '');
  return text.length > 0 && text.length <= 240 && !/[\u0000-\u001f\u007f]/.test(text) &&
    !/^https?:\/\//i.test(text);
}

function validateMarketplaceIdentities(store) {
  const styleIds = new Set(store.productStyles.map((style) => style.id));
  const sellableIds = new Set(store.sellableItems.map((sellable) => sellable.id));
  const externalKeys = new Set();
  const primaryKeys = new Set();
  for (const identity of store.marketplaceIdentities) {
    if (!identity || typeof identity !== 'object' || Array.isArray(identity) ||
        Object.keys(identity).some((key) => !IDENTITY_KEYS.has(key))) {
      throw new Error('Product PLM marketplace identity contains unsupported data.');
    }
    const subjectExists = identity.subjectType === 'product_style'
      ? styleIds.has(identity.subjectId)
      : identity.subjectType === 'sellable_item' && sellableIds.has(identity.subjectId);
    if (!subjectExists || !MARKETPLACES.includes(identity.marketplace) ||
        !isUuid(identity.accountReferenceId) ||
        !['product', 'variant', 'listing', 'item_group', 'sku'].includes(identity.externalEntityType) ||
        !['parent_listing', 'variant_listing', 'product_group', 'external_sku'].includes(identity.identityRole) ||
        !['unverified', 'verified', 'retired', 'archived'].includes(identity.status) ||
        typeof identity.isPrimary !== 'boolean') {
      throw new Error('Product PLM marketplace identity mapping is invalid.');
    }
    if (!validExternalId(identity.externalId, true) ||
        !validExternalId(identity.externalParentId) ||
        !validExternalId(identity.externalItemGroupId)) {
      throw new Error('Product PLM marketplace external identity is invalid.');
    }
    const verifiedTimestamp = identity.lastVerifiedAt === null ? null : Date.parse(identity.lastVerifiedAt);
    if ((identity.lastVerifiedAt !== null && !Number.isFinite(verifiedTimestamp)) ||
        (identity.status === 'unverified' && identity.lastVerifiedAt !== null) ||
        (identity.status === 'verified' && identity.lastVerifiedAt === null)) {
      throw new Error('Product PLM marketplace verification metadata is invalid.');
    }
    if (!['internal', 'confidential', 'commercially_sensitive'].includes(identity.dataClassification)) {
      throw new Error('Product PLM marketplace identity classification is invalid.');
    }
    const externalKey = [
      identity.marketplace,
      identity.accountReferenceId,
      identity.externalEntityType,
      identity.externalId,
    ].join(':');
    if (externalKeys.has(externalKey)) throw new Error('Product PLM marketplace external identity is duplicated.');
    externalKeys.add(externalKey);
    if (identity.isPrimary) {
      const primaryKey = [
        identity.subjectType,
        identity.subjectId,
        identity.marketplace,
        identity.accountReferenceId,
        identity.identityRole,
      ].join(':');
      if (primaryKeys.has(primaryKey)) throw new Error('Product PLM marketplace primary identity is duplicated.');
      primaryKeys.add(primaryKey);
    }
    validateIntelligenceReferences(identity.intelligenceReferences, 'Product PLM marketplace identity');
  }
}

module.exports = {
  MARKETPLACES,
  validateMarketplaceIdentities,
};
