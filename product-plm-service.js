const crypto = require('crypto');
const {
  contentHash,
  emptyProductBrainReferences,
  isUuid,
  legacySourceKey,
} = require('./product-plm-schema');
const { buildMigrationPreview, sourceSnapshot } = require('./product-plm-migration');
const {
  INITIAL_BRANDS,
  brandDefinitionForName,
  createStyle,
  findOrCreateFamily,
  seedInitialBrands,
} = require('./product-plm-hierarchy');

const DEFAULT_BRAND_NAME = 'MOTOGRIP GEAR';
const DEFAULT_LEGAL_ENTITY_NAME = 'MOTOGRIP GEAR LLC';

function createProductPlmService(options = {}) {
  const store = options.store;
  const audit = options.audit;
  const now = options.now || (() => Date.now());

  function actorContext(session) {
    return {
      actorType: session?.actorType || 'system',
      actorId: session?.userId ? `user:${session.userId}` : (session?.actorType || 'system'),
      sessionId: session?.id || null,
    };
  }

  function status() {
    const current = store.read();
    return {
      schemaVersion: current.schemaVersion,
      storeRevision: current.storeRevision,
      brandCount: current.brands.length,
      legalEntityCount: current.legalEntities.length,
      productIdentityCount: current.productIdentities.length,
      productFamilyCount: current.productFamilies.length,
      productStyleCount: current.productStyles.length,
      legacyMappingCount: current.legacyMappings.length,
      migrationPreviewCount: current.migrationPreviews.length,
      migrationBatchCount: current.migrationBatches.length,
      phase: '3B.2A',
    };
  }

  async function createPreview(req, session, sources, expectedRevision) {
    const actor = actorContext(session);
    const preview = buildMigrationPreview(sources.adminProducts, sources.merchantProducts, {
      actorId: actor.actorId,
      now,
    });
    const result = await store.mutate((draft) => {
      draft.migrationPreviews = [preview, ...draft.migrationPreviews].slice(0, 25);
      return { store: draft, value: preview };
    }, expectedRevision);
    audit.append(req, {
      ...actor,
      action: 'migration_preview_created',
      result: preview.conflicts.length ? 'conflicts' : 'success',
      entityType: 'migration_preview',
      entityId: preview.id,
      newHash: preview.sourceSnapshotHash,
      changedFields: ['migrationPreviews'],
    });
    return { preview, storeRevision: result.store.storeRevision };
  }

  function findOrCreateLegalEntity(draft, timestamp, actorId) {
    let legalEntity = draft.legalEntities.find((item) => item.legalName === DEFAULT_LEGAL_ENTITY_NAME);
    if (!legalEntity) {
      legalEntity = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        legalName: DEFAULT_LEGAL_ENTITY_NAME,
        tradingName: DEFAULT_BRAND_NAME,
        entityType: 'limited_liability_company',
        countryCode: 'US',
        registrationReference: null,
        status: 'active',
        dataClassification: 'confidential',
        createdAt: timestamp,
        createdBy: actorId,
        updatedAt: timestamp,
        updatedBy: actorId,
      };
      draft.legalEntities.push(legalEntity);
    }
    return legalEntity;
  }

  function sourceMediaReferences(source) {
    const paths = [source.image, source.primaryImage, ...(Array.isArray(source.galleryImages) ? source.galleryImages : [])]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    return [...new Set(paths)].map((path, index) => ({
      sourceSystem: source.sourceSystem,
      reference: path,
      role: index === 0 ? 'primary' : 'gallery',
    }));
  }

  async function applyMigration(req, session, input, sources) {
    const actor = actorContext(session);
    const expectedRevision = Number(input.expectedRevision);
    if (!isUuid(input.previewId)) {
      const error = new Error('A valid migration preview is required.');
      error.code = 'PLM_VALIDATION';
      throw error;
    }
    const merchantOnlyLegacyIds = Array.isArray(input.merchantOnlyLegacyIds)
      ? [...new Set(input.merchantOnlyLegacyIds.map(String))]
      : [];
    if (merchantOnlyLegacyIds.length && input.confirmMerchantOnly !== true) {
      const error = new Error('Merchant-only products require explicit confirmation.');
      error.code = 'PLM_MERCHANT_CONFIRMATION_REQUIRED';
      throw error;
    }

    const result = await store.mutate((draft) => {
      const preview = draft.migrationPreviews.find((item) => item.id === input.previewId);
      if (!preview || preview.status === 'applied') {
        const error = new Error('Migration preview is unavailable or already applied.');
        error.code = 'PLM_MIGRATION_UNAVAILABLE';
        throw error;
      }
      if (preview.conflicts.length) {
        const error = new Error('Resolve migration conflicts before applying.');
        error.code = 'PLM_MIGRATION_CONFLICT';
        throw error;
      }
      const currentSnapshotHash = contentHash(sourceSnapshot(sources.adminProducts, sources.merchantProducts));
      if (currentSnapshotHash !== preview.sourceSnapshotHash) {
        const error = new Error('Migration sources changed after preview. Create a new preview.');
        error.code = 'PLM_SOURCE_CHANGED';
        throw error;
      }

      const merchantOnlySet = new Set(merchantOnlyLegacyIds);
      const selected = preview.candidates.filter((candidate) =>
        candidate.importByDefault ||
        (candidate.disposition === 'merchant_only' && merchantOnlySet.has(candidate.primarySource.legacyId)));
      const allowedMerchantIds = new Set(
        preview.candidates.filter((candidate) => candidate.disposition === 'merchant_only')
          .map((candidate) => candidate.primarySource.legacyId),
      );
      if (merchantOnlyLegacyIds.some((legacyId) => !allowedMerchantIds.has(legacyId))) {
        const error = new Error('Merchant-only selection is not part of this preview.');
        error.code = 'PLM_VALIDATION';
        throw error;
      }

      const timestamp = new Date(now()).toISOString();
      const legalEntity = findOrCreateLegalEntity(draft, timestamp, actor.actorId);
      seedInitialBrands(draft.brands, timestamp, actor.actorId, legalEntity.id);
      const batchId = crypto.randomUUID();
      const importedProductUuids = [];

      for (const candidate of selected) {
        const brandDefinition = brandDefinitionForName(candidate.hierarchyProposal?.brandName);
        if (!brandDefinition || !candidate.hierarchyProposal?.brandRecognized) {
          const error = new Error('Migration brand requires an approved brand mapping.');
          error.code = 'PLM_VALIDATION';
          throw error;
        }
        const brand = draft.brands.find((item) => item.code === brandDefinition.code);
        if (!brand) {
          const error = new Error('Migration brand is unavailable.');
          error.code = 'PLM_VALIDATION';
          throw error;
        }
        const allSources = [candidate.primarySource, ...candidate.linkedSources];
        const existingMappings = allSources
          .map((source) => draft.legacyMappings.find((mapping) => legacySourceKey(mapping) === legacySourceKey(source)))
          .filter(Boolean);
        const existingTargets = [...new Set(existingMappings.map((mapping) => mapping.productUuid))];
        if (existingTargets.length > 1) {
          const error = new Error('Legacy mappings resolve to conflicting Product UUIDs.');
          error.code = 'PLM_MAPPING_CONFLICT';
          throw error;
        }
        const productUuid = existingTargets[0] || crypto.randomUUID();
        let identity = draft.productIdentities.find((item) => item.id === productUuid);
        if (!identity) {
          const sourceProduct = (candidate.primarySource.sourceSystem === 'admin-store'
            ? sources.adminProducts
            : sources.merchantProducts).find((product) => String(product.id) === candidate.primarySource.legacyId) || {};
          identity = {
            id: productUuid,
            schemaVersion: 1,
            brandId: brand.id,
            legalEntityId: legalEntity.id,
            displayName: candidate.title,
            identityStatus: 'active',
            dataClassification: 'internal',
            originalMediaReferences: sourceMediaReferences({
              ...sourceProduct,
              sourceSystem: candidate.primarySource.sourceSystem,
            }),
            extensionReferences: {
              leatherMaterials: [],
              patterns: [],
              boms: [],
              marketplaceExternalIds: [],
            },
            productBrainReferences: emptyProductBrainReferences(),
            createdAt: timestamp,
            createdBy: actor.actorId,
            updatedAt: timestamp,
            updatedBy: actor.actorId,
          };
          draft.productIdentities.push(identity);
        }
        importedProductUuids.push(productUuid);
        const family = findOrCreateFamily(
          draft,
          candidate.hierarchyProposal,
          brand,
          legalEntity,
          timestamp,
          actor.actorId,
        );
        createStyle(draft, identity, family, candidate.hierarchyProposal, timestamp, actor.actorId);

        for (const source of allSources) {
          const key = legacySourceKey(source);
          const existingMapping = draft.legacyMappings.find((mapping) => legacySourceKey(mapping) === key);
          if (existingMapping) {
            existingMapping.legacySlug = source.legacySlug;
            existingMapping.legacySku = source.legacySku;
            existingMapping.legacyMpn = source.legacyMpn;
            existingMapping.legacyItemGroupId = source.legacyItemGroupId;
            existingMapping.title = source.title;
            existingMapping.brandName = source.brandName;
            existingMapping.sourceHash = source.sourceHash;
            existingMapping.lastVerifiedAt = timestamp;
            continue;
          }
          draft.legacyMappings.push({
            id: crypto.randomUUID(),
            schemaVersion: 1,
            ...source,
            productUuid,
            sourceHash: source.sourceHash,
            migrationBatchId: batchId,
            mappingStatus: 'active',
            createdAt: timestamp,
            createdBy: actor.actorId,
            lastVerifiedAt: timestamp,
          });
        }
      }

      preview.status = 'applied';
      preview.appliedAt = timestamp;
      preview.appliedBy = actor.actorId;
      const batch = {
        id: batchId,
        schemaVersion: 1,
        previewId: preview.id,
        status: 'applied',
        sourceSnapshotHash: preview.sourceSnapshotHash,
        importedProductUuids: [...new Set(importedProductUuids)],
        merchantOnlyLegacyIds,
        appliedAt: timestamp,
        appliedBy: actor.actorId,
      };
      draft.migrationBatches.push(batch);
      return { store: draft, value: batch };
    }, expectedRevision);

    audit.append(req, {
      ...actor,
      action: 'migration_applied',
      result: 'success',
      entityType: 'migration_batch',
      entityId: result.value.id,
      migrationBatchId: result.value.id,
      changedFields: [
        'brands',
        'legalEntities',
        'productIdentities',
        'productFamilies',
        'productStyles',
        'legacyMappings',
        'migrationBatches',
      ],
      newHash: result.value.sourceSnapshotHash,
    });
    return { batch: result.value, storeRevision: result.store.storeRevision };
  }

  function productDna(productUuid) {
    if (!isUuid(productUuid)) {
      const error = new Error('A valid Product UUID is required.');
      error.code = 'PLM_VALIDATION';
      throw error;
    }
    const current = store.read();
    const identity = current.productIdentities.find((item) => item.id === productUuid);
    if (!identity) return null;
    return {
      productUuid: identity.id,
      brandId: identity.brandId,
      legalEntityId: identity.legalEntityId,
      familyId: null,
      styleId: null,
      sellableItemIds: [],
      versionIds: [],
      approvedReleaseIds: [],
      originalMediaReferences: identity.originalMediaReferences,
      leatherMaterialReferences: identity.extensionReferences.leatherMaterials,
      patternReferences: identity.extensionReferences.patterns,
      bomReferences: identity.extensionReferences.boms,
      marketplaceExternalIds: identity.extensionReferences.marketplaceExternalIds,
      productBrainReferences: identity.productBrainReferences,
      legacyMappings: current.legacyMappings.filter((mapping) => mapping.productUuid === productUuid),
      approvalRequestIds: [],
      auditEntityReference: { entityType: 'product_identity', entityId: productUuid },
      completeness: {
        identity: true,
        brand: Boolean(current.brands.find((item) => item.id === identity.brandId)),
        legalEntity: Boolean(current.legalEntities.find((item) => item.id === identity.legalEntityId)),
        productHierarchy: false,
        versioning: false,
        releases: false,
      },
      unresolvedReferences: ['productFamily', 'productStyle', 'sellableItems', 'productVersions', 'approvedReleases'],
    };
  }

  return {
    applyMigration,
    createPreview,
    productDna,
    status,
  };
}

module.exports = {
  DEFAULT_BRAND_NAME,
  DEFAULT_LEGAL_ENTITY_NAME,
  INITIAL_BRANDS,
  createProductPlmService,
};
