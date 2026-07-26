const crypto = require('crypto');
const {
  cleanText,
  contentHash,
  legacySourceKey,
  normalizeLegacyProduct,
} = require('./product-plm-schema');
const { hierarchyProposal } = require('./product-plm-hierarchy');
const { canonicalSku, validateSku } = require('./product-plm-sellables');

function commerceProposal(record) {
  return {
    baselineSku: record.legacySku || null,
    baselineSkuValid: !record.legacySku || validateSku(record.legacySku),
    detectedOptionNames: [...(record.legacyVariantOptions || [])],
    detectedStockKeys: [...(record.legacyStockKeys || [])],
    createBaselineSellable: Boolean(record.legacySku),
    createVariants: false,
    createMarketplaceIdentities: false,
    requiresReview: true,
  };
}

function matchKeys(record) {
  return [
    record.legacySku ? `sku:${record.legacySku.toLowerCase()}` : '',
    record.legacyMpn ? `mpn:${record.legacyMpn.toLowerCase()}` : '',
    record.legacySlug ? `slug:${record.legacySlug.toLowerCase()}` : '',
  ].filter(Boolean);
}

function sourceSnapshot(adminProducts, merchantProducts) {
  const admin = (adminProducts || []).map((product) => normalizeLegacyProduct('admin-store', product));
  const merchant = (merchantProducts || []).map((product) => normalizeLegacyProduct('merchant-catalog', product));
  return {
    admin: admin.map((record) => ({ ...record, sourceHash: contentHash(record) })),
    merchant: merchant.map((record) => ({ ...record, sourceHash: contentHash(record) })),
  };
}

function buildMigrationPreview(adminProducts, merchantProducts, options = {}) {
  const snapshot = sourceSnapshot(adminProducts, merchantProducts);
  const merchantByMatch = new Map();
  for (const record of snapshot.merchant) {
    for (const key of matchKeys(record)) {
      const matches = merchantByMatch.get(key) || [];
      matches.push(record);
      merchantByMatch.set(key, matches);
    }
  }

  const matchedMerchantKeys = new Set();
  const candidates = [];
  const conflicts = [];

  for (const adminRecord of snapshot.admin) {
    const matches = [...new Map(
      matchKeys(adminRecord)
        .flatMap((key) => merchantByMatch.get(key) || [])
        .map((record) => [legacySourceKey(record), record]),
    ).values()];
    if (matches.length > 1) {
      conflicts.push({
        type: 'ambiguous_match',
        adminLegacyId: adminRecord.legacyId,
        merchantLegacyIds: matches.map((record) => record.legacyId),
      });
      continue;
    }
    const merchantRecord = matches[0] || null;
    if (merchantRecord) matchedMerchantKeys.add(legacySourceKey(merchantRecord));
    candidates.push({
      candidateId: crypto.randomUUID(),
      disposition: 'admin_product',
      importByDefault: true,
      title: adminRecord.title,
      primarySource: adminRecord,
      linkedSources: merchantRecord ? [merchantRecord] : [],
      hierarchyProposal: hierarchyProposal(adminRecord),
      commerceProposal: commerceProposal(adminRecord),
    });
  }

  for (const merchantRecord of snapshot.merchant) {
    if (matchedMerchantKeys.has(legacySourceKey(merchantRecord))) continue;
    candidates.push({
      candidateId: crypto.randomUUID(),
      disposition: 'merchant_only',
      importByDefault: false,
      title: merchantRecord.title,
      primarySource: merchantRecord,
      linkedSources: [],
      hierarchyProposal: hierarchyProposal(merchantRecord),
      commerceProposal: commerceProposal(merchantRecord),
    });
  }

  const defaultSkuCandidates = candidates.filter((candidate) =>
    candidate.importByDefault && candidate.commerceProposal.baselineSku);
  const skuOwners = new Map();
  for (const candidate of defaultSkuCandidates) {
    const sku = candidate.commerceProposal.baselineSku;
    if (!candidate.commerceProposal.baselineSkuValid) {
      conflicts.push({
        type: 'invalid_sku',
        legacyId: candidate.primarySource.legacyId,
      });
      continue;
    }
    const key = canonicalSku(sku);
    const owners = skuOwners.get(key) || [];
    owners.push(candidate.primarySource.legacyId);
    skuOwners.set(key, owners);
  }
  for (const [skuKey, legacyIds] of skuOwners.entries()) {
    if (legacyIds.length > 1) conflicts.push({ type: 'duplicate_sku', skuKey, legacyIds });
  }

  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    status: conflicts.length ? 'conflicts' : 'ready',
    sourceSnapshotHash: contentHash(snapshot),
    adminProductCount: snapshot.admin.length,
    merchantProductCount: snapshot.merchant.length,
    candidates,
    conflicts,
    createdAt: new Date(options.now ? options.now() : Date.now()).toISOString(),
    createdBy: cleanText(options.actorId || 'system', 180),
  };
}

module.exports = { buildMigrationPreview, commerceProposal, matchKeys, sourceSnapshot };
