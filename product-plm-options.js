const { validateIntelligenceReferences } = require('./product-plm-intelligence-references');

const OPTION_DATA_TYPES = Object.freeze(['enum', 'boolean', 'text', 'reference']);
const OPTION_USAGES = Object.freeze(['variant_axis', 'descriptive', 'configuration_capability']);
const OPTION_SELECTION_MODES = Object.freeze(['single', 'multiple']);
const OPTION_STATUSES = Object.freeze(['draft', 'active', 'retired', 'archived']);
const OPTION_CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'commercially_sensitive']);

const DEFINITION_KEYS = new Set([
  'id', 'schemaVersion', 'code', 'name', 'description', 'scopeType', 'scopeId',
  'dataType', 'usage', 'selectionMode', 'status', 'sequence', 'intelligenceReferences',
  'dataClassification', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]);
const VALUE_KEYS = new Set([
  'id', 'schemaVersion', 'optionDefinitionId', 'code', 'label', 'description', 'aliases',
  'sequence', 'status', 'taxonomyReferenceId', 'materialReferenceId',
  'intelligenceReferences', 'dataClassification', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]);
const ASSIGNMENT_KEYS = new Set([
  'id', 'schemaVersion', 'styleId', 'optionDefinitionId', 'usage', 'required',
  'allowedValueIds', 'defaultValueId', 'sequence', 'status', 'intelligenceReferences',
  'dataClassification', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function normalizedCode(value) {
  return String(value || '').trim().normalize('NFKC').toUpperCase();
}

function rejectsUnknownKeys(entity, allowed, label) {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity) ||
      Object.keys(entity).some((key) => !allowed.has(key))) {
    throw new Error(`${label} contains unsupported data.`);
  }
}

function validateOptionDefinitions(store) {
  const brandIds = new Set(store.brands.map((brand) => brand.id));
  const scopedCodes = new Set();
  for (const definition of store.optionDefinitions) {
    rejectsUnknownKeys(definition, DEFINITION_KEYS, 'Product PLM option definition');
    const code = normalizedCode(definition.code);
    if (!code || code.length > 100 || !String(definition.name || '').trim() ||
        String(definition.name).length > 160 || String(definition.description || '').length > 500) {
      throw new Error('Product PLM option definition identity is invalid.');
    }
    if (!['system', 'brand'].includes(definition.scopeType) ||
        (definition.scopeType === 'system' && definition.scopeId !== null) ||
        (definition.scopeType === 'brand' && !brandIds.has(definition.scopeId))) {
      throw new Error('Product PLM option definition scope is invalid.');
    }
    if (!OPTION_DATA_TYPES.includes(definition.dataType) ||
        !OPTION_USAGES.includes(definition.usage) ||
        !OPTION_SELECTION_MODES.includes(definition.selectionMode) ||
        !OPTION_STATUSES.includes(definition.status)) {
      throw new Error('Product PLM option definition behavior is invalid.');
    }
    if (definition.usage === 'variant_axis' &&
        (definition.dataType !== 'enum' || definition.selectionMode !== 'single')) {
      throw new Error('Product PLM variant axis must be a single enum.');
    }
    if (!Number.isInteger(definition.sequence) || definition.sequence < 0 ||
        !OPTION_CLASSIFICATIONS.has(definition.dataClassification)) {
      throw new Error('Product PLM option definition metadata is invalid.');
    }
    const scopeKey = `${definition.scopeType}:${definition.scopeId || 'system'}:${code}`;
    if (scopedCodes.has(scopeKey)) throw new Error('Product PLM option definition code is duplicated.');
    scopedCodes.add(scopeKey);
    validateIntelligenceReferences(definition.intelligenceReferences, 'Product PLM option definition');
  }
}

function validateOptionValues(store) {
  const definitions = new Map(store.optionDefinitions.map((definition) => [definition.id, definition]));
  const valueCodes = new Set();
  for (const value of store.optionValues) {
    rejectsUnknownKeys(value, VALUE_KEYS, 'Product PLM option value');
    if (!definitions.has(value.optionDefinitionId)) {
      throw new Error('Product PLM option value definition reference is invalid.');
    }
    const code = normalizedCode(value.code);
    if (!code || code.length > 100 || !String(value.label || '').trim() ||
        String(value.label).length > 160 || String(value.description || '').length > 500) {
      throw new Error('Product PLM option value identity is invalid.');
    }
    if (definitions.get(value.optionDefinitionId).dataType === 'text') {
      throw new Error('Product PLM text option cannot contain predefined values.');
    }
    if (!Array.isArray(value.aliases) || value.aliases.length > 30 ||
        value.aliases.some((alias) => typeof alias !== 'string' || !alias.trim() || alias.length > 100)) {
      throw new Error('Product PLM option value aliases are invalid.');
    }
    const normalizedAliases = value.aliases.map(normalizedCode);
    if (new Set(normalizedAliases).size !== normalizedAliases.length) {
      throw new Error('Product PLM option value aliases are duplicated.');
    }
    if (!Number.isInteger(value.sequence) || value.sequence < 0 ||
        !OPTION_STATUSES.includes(value.status) || !OPTION_CLASSIFICATIONS.has(value.dataClassification) ||
        (value.taxonomyReferenceId !== null && !isUuid(value.taxonomyReferenceId)) ||
        (value.materialReferenceId !== null && !isUuid(value.materialReferenceId))) {
      throw new Error('Product PLM option value metadata is invalid.');
    }
    const valueKey = `${value.optionDefinitionId}:${code}`;
    if (valueCodes.has(valueKey)) throw new Error('Product PLM option value code is duplicated.');
    valueCodes.add(valueKey);
    validateIntelligenceReferences(value.intelligenceReferences, 'Product PLM option value');
  }
}

function validateStyleOptionAssignments(store) {
  const styles = new Map(store.productStyles.map((style) => [style.id, style]));
  const definitions = new Map(store.optionDefinitions.map((definition) => [definition.id, definition]));
  const values = new Map(store.optionValues.map((value) => [value.id, value]));
  const assignmentKeys = new Set();
  const variantAxisCount = new Map();
  for (const assignment of store.styleOptionAssignments) {
    rejectsUnknownKeys(assignment, ASSIGNMENT_KEYS, 'Product PLM style option assignment');
    const style = styles.get(assignment.styleId);
    const definition = definitions.get(assignment.optionDefinitionId);
    if (!style || !definition || definition.status === 'archived' ||
        (definition.scopeType === 'brand' && definition.scopeId !== style.brandId)) {
      throw new Error('Product PLM style option assignment ownership is invalid.');
    }
    if (assignment.usage !== definition.usage || typeof assignment.required !== 'boolean' ||
        !Number.isInteger(assignment.sequence) || assignment.sequence < 0 ||
        !OPTION_STATUSES.includes(assignment.status) ||
        !OPTION_CLASSIFICATIONS.has(assignment.dataClassification)) {
      throw new Error('Product PLM style option assignment metadata is invalid.');
    }
    if (!Array.isArray(assignment.allowedValueIds) || assignment.allowedValueIds.length > 250 ||
        new Set(assignment.allowedValueIds).size !== assignment.allowedValueIds.length) {
      throw new Error('Product PLM style option allowed values are invalid.');
    }
    for (const valueId of assignment.allowedValueIds) {
      const value = values.get(valueId);
      if (!value || value.optionDefinitionId !== definition.id || value.status === 'archived') {
        throw new Error('Product PLM style option allowed value reference is invalid.');
      }
    }
    if (assignment.defaultValueId !== null && !assignment.allowedValueIds.includes(assignment.defaultValueId)) {
      throw new Error('Product PLM style option default value is invalid.');
    }
    if (assignment.required && assignment.usage === 'variant_axis' && !assignment.allowedValueIds.length) {
      throw new Error('Product PLM required variant axis needs allowed values.');
    }
    const key = `${assignment.styleId}:${assignment.optionDefinitionId}`;
    if (assignmentKeys.has(key)) throw new Error('Product PLM style option assignment is duplicated.');
    assignmentKeys.add(key);
    if (assignment.usage === 'variant_axis' && assignment.status !== 'archived') {
      const count = (variantAxisCount.get(assignment.styleId) || 0) + 1;
      if (count > 8) throw new Error('Product PLM Style has too many variant axes.');
      variantAxisCount.set(assignment.styleId, count);
    }
    validateIntelligenceReferences(assignment.intelligenceReferences, 'Product PLM style option assignment');
  }
}

function validateProductOptions(store) {
  validateOptionDefinitions(store);
  validateOptionValues(store);
  validateStyleOptionAssignments(store);
}

module.exports = {
  OPTION_DATA_TYPES,
  OPTION_SELECTION_MODES,
  OPTION_STATUSES,
  OPTION_USAGES,
  normalizedCode,
  validateProductOptions,
};
