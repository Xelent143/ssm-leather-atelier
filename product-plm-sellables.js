const crypto = require('crypto');
const { validateIntelligenceReferences } = require('./product-plm-intelligence-references');

const SELLABLE_TYPES = Object.freeze([
  'base_sellable',
  'standard_variant',
  'made_to_order_base',
  'made_to_measure_base',
  'personalized_base',
  'replacement_part',
  'wholesale_pack',
  'private_label_variant',
]);
const FULFILLMENT_MODES = Object.freeze([
  'stock',
  'made_to_order',
  'made_to_measure',
  'custom',
  'personalized',
  'private_label',
]);
const SELLABLE_KEYS = new Set([
  'id', 'schemaVersion', 'styleId', 'sku', 'skuKey', 'name', 'sellableType',
  'fulfillmentMode', 'status', 'isBaseItem', 'optionSelections', 'variantSignature',
  'variantSignatureVersion', 'configurationPolicyReferenceId', 'legacySourceKeys',
  'intelligenceReferences', 'dataClassification', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]);
const SELECTION_KEYS = new Set(['optionDefinitionId', 'optionValueId']);
const SELLABLE_CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'commercially_sensitive']);
const VARIANT_SELLABLE_TYPES = new Set(['standard_variant', 'private_label_variant']);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function canonicalSku(value) {
  return String(value || '').trim().normalize('NFKC').toUpperCase();
}

function validateSku(value) {
  const sku = String(value || '').trim();
  return sku.length <= 64 && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(sku);
}

function computeVariantSignature(styleId, selections, version = 1) {
  const canonicalSelections = [...selections]
    .map((selection) => [selection.optionDefinitionId, selection.optionValueId])
    .sort(([definitionA], [definitionB]) => definitionA.localeCompare(definitionB));
  return crypto.createHash('sha256').update(JSON.stringify({
    version,
    styleId,
    selections: canonicalSelections,
  })).digest('hex');
}

function validateSellableItems(store) {
  const styles = new Map(store.productStyles.map((style) => [style.id, style]));
  const definitions = new Map(store.optionDefinitions.map((definition) => [definition.id, definition]));
  const values = new Map(store.optionValues.map((value) => [value.id, value]));
  const assignmentsByStyle = new Map();
  for (const assignment of store.styleOptionAssignments) {
    if (assignment.status === 'archived') continue;
    const assignments = assignmentsByStyle.get(assignment.styleId) || [];
    assignments.push(assignment);
    assignmentsByStyle.set(assignment.styleId, assignments);
  }
  const skuKeys = new Set();
  const signatures = new Set();
  const baseItems = new Set();
  for (const sellable of store.sellableItems) {
    if (!sellable || typeof sellable !== 'object' || Array.isArray(sellable) ||
        Object.keys(sellable).some((key) => !SELLABLE_KEYS.has(key))) {
      throw new Error('Product PLM Sellable Item contains unsupported data.');
    }
    if (!styles.has(sellable.styleId) || !SELLABLE_TYPES.includes(sellable.sellableType) ||
        !FULFILLMENT_MODES.includes(sellable.fulfillmentMode) ||
        !['draft', 'active', 'retired', 'archived'].includes(sellable.status) ||
        typeof sellable.isBaseItem !== 'boolean' ||
        !SELLABLE_CLASSIFICATIONS.has(sellable.dataClassification)) {
      throw new Error('Product PLM Sellable Item identity or status is invalid.');
    }
    if (!validateSku(sellable.sku) || sellable.skuKey !== canonicalSku(sellable.sku)) {
      throw new Error('Product PLM Sellable Item SKU is invalid.');
    }
    if (skuKeys.has(sellable.skuKey)) throw new Error('Product PLM Sellable Item SKU is duplicated.');
    skuKeys.add(sellable.skuKey);
    if (!String(sellable.name || '').trim() || String(sellable.name).length > 240 ||
        !Array.isArray(sellable.legacySourceKeys) || sellable.legacySourceKeys.length > 25 ||
        sellable.legacySourceKeys.some((key) => typeof key !== 'string' || key.length > 360) ||
        new Set(sellable.legacySourceKeys).size !== sellable.legacySourceKeys.length ||
        (sellable.configurationPolicyReferenceId !== null &&
         !isUuid(sellable.configurationPolicyReferenceId))) {
      throw new Error('Product PLM Sellable Item metadata is invalid.');
    }
    if (sellable.isBaseItem) {
      if (baseItems.has(sellable.styleId)) throw new Error('Product PLM Style has more than one base Sellable Item.');
      baseItems.add(sellable.styleId);
    }
    if (!Array.isArray(sellable.optionSelections) || sellable.optionSelections.length > 8) {
      throw new Error('Product PLM Sellable Item selections are invalid.');
    }
    const definitionIds = new Set();
    for (const selection of sellable.optionSelections) {
      if (!selection || typeof selection !== 'object' || Array.isArray(selection) ||
          Object.keys(selection).some((key) => !SELECTION_KEYS.has(key)) ||
          definitionIds.has(selection.optionDefinitionId)) {
        throw new Error('Product PLM Sellable Item selection is invalid or duplicated.');
      }
      definitionIds.add(selection.optionDefinitionId);
      const definition = definitions.get(selection.optionDefinitionId);
      const value = values.get(selection.optionValueId);
      const assignment = (assignmentsByStyle.get(sellable.styleId) || [])
        .find((item) => item.optionDefinitionId === selection.optionDefinitionId);
      if (!definition || !value || !assignment || definition.usage !== 'variant_axis' ||
          value.optionDefinitionId !== definition.id ||
          !assignment.allowedValueIds.includes(value.id)) {
        throw new Error('Product PLM Sellable Item selection reference is invalid.');
      }
    }

    if (VARIANT_SELLABLE_TYPES.has(sellable.sellableType)) {
      const requiredAxes = (assignmentsByStyle.get(sellable.styleId) || [])
        .filter((assignment) => assignment.usage === 'variant_axis' && assignment.required)
        .map((assignment) => assignment.optionDefinitionId);
      if (requiredAxes.some((definitionId) => !definitionIds.has(definitionId))) {
        throw new Error('Product PLM Sellable Item is missing a required variant axis.');
      }
      if (sellable.variantSignatureVersion !== 1 ||
          sellable.variantSignature !== computeVariantSignature(sellable.styleId, sellable.optionSelections, 1)) {
        throw new Error('Product PLM Sellable Item variant signature is invalid.');
      }
      const signatureKey = `${sellable.styleId}:${sellable.variantSignature}`;
      if (signatures.has(signatureKey)) throw new Error('Product PLM Sellable Item variant signature is duplicated.');
      signatures.add(signatureKey);
    } else if (sellable.optionSelections.length || sellable.variantSignature !== null ||
               sellable.variantSignatureVersion !== null) {
      throw new Error('Product PLM non-variant Sellable Item cannot contain variant selections.');
    }
    validateIntelligenceReferences(sellable.intelligenceReferences, 'Product PLM Sellable Item');
  }
}

function baselineSellableFromMigration(style, candidate, timestamp, actorId) {
  const sku = String(candidate.commerceProposal?.baselineSku || '').trim();
  if (!sku) return null;
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    styleId: style.id,
    sku,
    skuKey: canonicalSku(sku),
    name: candidate.title,
    sellableType: 'base_sellable',
    fulfillmentMode: 'stock',
    status: 'active',
    isBaseItem: true,
    optionSelections: [],
    variantSignature: null,
    variantSignatureVersion: null,
    configurationPolicyReferenceId: null,
    legacySourceKeys: [candidate.primarySource, ...candidate.linkedSources]
      .map((source) => `${source.sourceSystem}:${source.sourceEntityType}:${source.legacyId}`),
    intelligenceReferences: [],
    dataClassification: 'internal',
    createdAt: timestamp,
    createdBy: actorId,
    updatedAt: timestamp,
    updatedBy: actorId,
  };
}

module.exports = {
  FULFILLMENT_MODES,
  SELLABLE_TYPES,
  baselineSellableFromMigration,
  canonicalSku,
  computeVariantSignature,
  validateSellableItems,
  validateSku,
};
