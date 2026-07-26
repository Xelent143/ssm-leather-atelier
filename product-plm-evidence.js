const { hashValue } = require('./product-plm-versions');

const EVIDENCE_TYPES = Object.freeze([
  'product_photograph',
  'measurement_chart',
  'leather_specification',
  'material_specification',
  'pattern_reference',
  'bom_reference',
  'factory_sample_record',
  'qc_report',
  'safety_test_report',
  'care_instructions',
  'packaging_evidence',
  'trademark_evidence',
  'marketplace_policy_evidence',
  'customer_explanation',
  'factory_explanation',
  'seo_explanation',
  'faq',
  'buying_guide',
  'image_example',
  'video_example',
  'stitching_sop',
  'leather_cutting_pattern',
  'hardware_specification',
  'thread_specification',
  'packaging_sop',
  'qc_checklist',
]);
const EVIDENCE_KEYS = new Set([
  'id', 'schemaVersion', 'evidenceType', 'title', 'description', 'sourceType',
  'sourceReference', 'artifactReferenceId', 'artifactContentHash', 'recordHash',
  'mimeType', 'issuedAt', 'expiresAt', 'status', 'supersedesEvidenceId',
  'aiProvenance', 'dataClassification', 'createdAt', 'createdBy',
]);
const LINK_KEYS = new Set([
  'id', 'schemaVersion', 'evidenceId', 'subjectType', 'subjectId', 'fieldPath',
  'claimCode', 'relationship', 'requiredForRelease', 'linkHash',
  'dataClassification', 'createdAt', 'createdBy',
]);
const AI_PROVENANCE_KEYS = new Set([
  'aiSessionReferenceId', 'promptTemplateReferenceId', 'aiEngineVersionReferenceId',
  'humanApprovalReferenceId',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isHash(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ''));
}

function evidenceHashInput(record) {
  const { recordHash, ...input } = record;
  return input;
}

function computeEvidenceRecordHash(record) {
  return hashValue(evidenceHashInput(record));
}

function linkHashInput(link) {
  const { linkHash, ...input } = link;
  return input;
}

function computeEvidenceLinkHash(link) {
  return hashValue(linkHashInput(link));
}

function validateAiProvenance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !AI_PROVENANCE_KEYS.has(key)) ||
      Object.values(value).some((reference) => reference !== null && !isUuid(reference))) {
    throw new Error('Product PLM evidence AI provenance references are invalid.');
  }
}

function subjectIds(store) {
  return {
    product_identity: new Set(store.productIdentities.map((item) => item.id)),
    product_version: new Set(store.productVersions.map((item) => item.id)),
    product_style: new Set(store.productStyles.map((item) => item.id)),
    product_component: new Set(store.productComponents.map((item) => item.id)),
    sellable_item: new Set(store.sellableItems.map((item) => item.id)),
  };
}

function validateEvidenceRegistry(store) {
  const evidenceById = new Map(store.evidenceRecords.map((record) => [record.id, record]));
  for (const record of store.evidenceRecords) {
    if (!record || typeof record !== 'object' || Array.isArray(record) ||
        Object.keys(record).some((key) => !EVIDENCE_KEYS.has(key))) {
      throw new Error('Product PLM evidence record contains unsupported data.');
    }
    if (!EVIDENCE_TYPES.includes(record.evidenceType) ||
        !String(record.title || '').trim() || String(record.title).length > 240 ||
        String(record.description || '').length > 1000 ||
        !/^[a-z][a-z0-9_]{0,79}$/i.test(String(record.sourceType || '')) ||
        !String(record.sourceReference || '').trim() || String(record.sourceReference).length > 240 ||
        !isUuid(record.artifactReferenceId) || !isHash(record.artifactContentHash) ||
        !['active', 'superseding', 'expired_at_registration'].includes(record.status) ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive', 'regulated_evidence']
          .includes(record.dataClassification)) {
      throw new Error('Product PLM evidence record metadata is invalid.');
    }
    if (record.supersedesEvidenceId !== null) {
      const prior = evidenceById.get(record.supersedesEvidenceId);
      if (!prior || prior.id === record.id || prior.evidenceType !== record.evidenceType) {
        throw new Error('Product PLM superseded evidence reference is invalid.');
      }
    }
    if (!Number.isFinite(Date.parse(record.issuedAt)) ||
        (record.expiresAt !== null && (!Number.isFinite(Date.parse(record.expiresAt)) ||
         Date.parse(record.expiresAt) < Date.parse(record.issuedAt)))) {
      throw new Error('Product PLM evidence validity period is invalid.');
    }
    if (!/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(String(record.mimeType || ''))) {
      throw new Error('Product PLM evidence MIME type is invalid.');
    }
    validateAiProvenance(record.aiProvenance);
    if (record.recordHash !== computeEvidenceRecordHash(record)) {
      throw new Error('Product PLM evidence record hash is invalid.');
    }
  }
  for (const record of store.evidenceRecords) {
    const visited = new Set([record.id]);
    let cursor = record;
    while (cursor.supersedesEvidenceId) {
      if (visited.has(cursor.supersedesEvidenceId)) {
        throw new Error('Product PLM evidence supersession contains a cycle.');
      }
      visited.add(cursor.supersedesEvidenceId);
      cursor = evidenceById.get(cursor.supersedesEvidenceId);
    }
  }

  const subjects = subjectIds(store);
  const linkKeys = new Set();
  for (const link of store.evidenceLinks) {
    if (!link || typeof link !== 'object' || Array.isArray(link) ||
        Object.keys(link).some((key) => !LINK_KEYS.has(key))) {
      throw new Error('Product PLM evidence link contains unsupported data.');
    }
    if (!evidenceById.has(link.evidenceId) || !subjects[link.subjectType]?.has(link.subjectId) ||
        !/^[a-zA-Z0-9_.\[\]-]{1,240}$/.test(String(link.fieldPath || '')) ||
        !/^[A-Z0-9][A-Z0-9_-]{0,99}$/.test(String(link.claimCode || '')) ||
        !['supports', 'contradicts', 'supersedes', 'contextualizes'].includes(link.relationship) ||
        typeof link.requiredForRelease !== 'boolean' ||
        !['internal', 'confidential', 'factory_confidential', 'commercially_sensitive', 'regulated_evidence']
          .includes(link.dataClassification)) {
      throw new Error('Product PLM evidence link metadata is invalid.');
    }
    const uniqueKey = `${link.evidenceId}:${link.subjectType}:${link.subjectId}:${link.fieldPath}:${link.relationship}`;
    if (linkKeys.has(uniqueKey)) throw new Error('Product PLM evidence link is duplicated.');
    linkKeys.add(uniqueKey);
    if (link.linkHash !== computeEvidenceLinkHash(link)) {
      throw new Error('Product PLM evidence link hash is invalid.');
    }
  }
}

module.exports = {
  EVIDENCE_TYPES,
  computeEvidenceLinkHash,
  computeEvidenceRecordHash,
  validateEvidenceRegistry,
};
