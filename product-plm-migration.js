const crypto = require('crypto');
const {
  cleanText,
  contentHash,
  legacySourceKey,
  normalizeLegacyProduct,
} = require('./product-plm-schema');

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
    });
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

module.exports = { buildMigrationPreview, matchKeys, sourceSnapshot };
