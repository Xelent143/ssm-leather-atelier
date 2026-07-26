const { validateIntelligenceReferences } = require('./product-plm-intelligence-references');

const PRODUCT_COMPONENT_TYPES = Object.freeze([
  'body',
  'panel',
  'front_panel',
  'back_panel',
  'sleeve',
  'collar',
  'lapel',
  'hood',
  'lining',
  'pocket',
  'closure',
  'zipper',
  'snap',
  'buckle',
  'hardware',
  'cuff',
  'waistband',
  'belt',
  'armor_location',
  'patch_location',
  'ventilation',
  'strap',
  'handle',
  'gusset',
  'reinforcement',
  'replacement_part',
  'other',
]);

const COMPONENT_OVERRIDE_FIELDS = new Set([
  'name',
  'description',
  'componentType',
  'componentRole',
  'sequence',
  'isOptional',
  'isReplaceable',
  'isSellableSeparately',
  'extensionReferences',
  'dataClassification',
]);

const COMPONENT_CLASSIFICATIONS = new Set([
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
]);
const COMPONENT_KEYS = new Set([
  'id',
  'schemaVersion',
  'styleId',
  'parentComponentId',
  'componentCode',
  'name',
  'description',
  'componentType',
  'componentRole',
  'sequence',
  'isOptional',
  'isReplaceable',
  'isSellableSeparately',
  'status',
  'inheritance',
  'extensionReferences',
  'intelligenceReferences',
  'dataClassification',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]);
const INHERITANCE_KEYS = new Set([
  'mode',
  'sourceComponentId',
  'sourceStyleId',
  'copiedAt',
  'copiedBy',
  'sourceHash',
  'overriddenFields',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function normalizedCode(value) {
  return String(value || '').trim().normalize('NFKC').toUpperCase();
}

function validateReferenceExtensions(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} extension references are invalid.`);
  }
  const allowed = new Set(['materialReferences', 'patternReferences', 'bomReferences']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error(`${label} extension references contain unsupported data.`);
  }
  for (const key of allowed) {
    if (!Array.isArray(value[key]) || value[key].length > 50 ||
        value[key].some((reference) => !isUuid(reference))) {
      throw new Error(`${label} ${key} are invalid.`);
    }
  }
}

function validateInheritance(component, componentById, styleById) {
  const inheritance = component.inheritance;
  if (!inheritance || typeof inheritance !== 'object' || Array.isArray(inheritance)) {
    throw new Error('Product PLM component inheritance is invalid.');
  }
  if (Object.keys(inheritance).some((key) => !INHERITANCE_KEYS.has(key))) {
    throw new Error('Product PLM component inheritance contains unsupported data.');
  }
  if (!['original', 'copied_snapshot'].includes(inheritance.mode)) {
    throw new Error('Product PLM component inheritance mode is invalid.');
  }
  if (!Array.isArray(inheritance.overriddenFields) ||
      inheritance.overriddenFields.some((field) => !COMPONENT_OVERRIDE_FIELDS.has(field)) ||
      new Set(inheritance.overriddenFields).size !== inheritance.overriddenFields.length) {
    throw new Error('Product PLM component inheritance overrides are invalid.');
  }
  if (inheritance.mode === 'original') {
    if (inheritance.sourceComponentId !== null || inheritance.sourceStyleId !== null ||
        inheritance.copiedAt !== null || inheritance.copiedBy !== null || inheritance.sourceHash !== null ||
        inheritance.overriddenFields.length) {
      throw new Error('Original Product PLM component cannot contain inheritance provenance.');
    }
    return;
  }
  const source = componentById.get(inheritance.sourceComponentId);
  if (!source || source.id === component.id || source.styleId !== inheritance.sourceStyleId) {
    throw new Error('Product PLM component inheritance source is invalid.');
  }
  const sourceStyle = styleById.get(source.styleId);
  const targetStyle = styleById.get(component.styleId);
  if (sourceStyle.brandId !== targetStyle.brandId || sourceStyle.legalEntityId !== targetStyle.legalEntityId) {
    throw new Error('Product PLM cross-owner component inheritance requires a future approval workflow.');
  }
  if (!inheritance.copiedAt || !inheritance.copiedBy ||
      !/^[0-9a-f]{64}$/i.test(String(inheritance.sourceHash || ''))) {
    throw new Error('Product PLM component inheritance provenance is incomplete.');
  }
  let cursor = source;
  while (cursor?.parentComponentId) {
    if (cursor.parentComponentId === component.id) {
      throw new Error('Product PLM component cannot inherit from its descendant.');
    }
    cursor = componentById.get(cursor.parentComponentId);
  }
}

function validateProductComponents(store) {
  const styleById = new Map(store.productStyles.map((style) => [style.id, style]));
  const styleIds = new Set(styleById.keys());
  const componentById = new Map(store.productComponents.map((component) => [component.id, component]));
  const codes = new Set();
  for (const component of store.productComponents) {
    if (!component || typeof component !== 'object' || Array.isArray(component) ||
        Object.keys(component).some((key) => !COMPONENT_KEYS.has(key))) {
      throw new Error('Product PLM component contains unsupported data.');
    }
    if (!styleIds.has(component.styleId)) throw new Error('Product PLM component Style reference is invalid.');
    if (component.parentComponentId) {
      const parent = componentById.get(component.parentComponentId);
      if (!parent || parent.id === component.id || parent.styleId !== component.styleId) {
        throw new Error('Product PLM component parent reference is invalid.');
      }
    }
    const code = normalizedCode(component.componentCode);
    const codeKey = `${component.styleId}:${code}`;
    if (!code || code.length > 100 || codes.has(codeKey)) {
      throw new Error('Product PLM component code is invalid or duplicated.');
    }
    codes.add(codeKey);
    if (!String(component.name || '').trim() || String(component.name).length > 240) {
      throw new Error('Product PLM component name is invalid.');
    }
    if (String(component.description || '').length > 1000 ||
        !/^[a-z][a-z0-9_]{0,79}$/i.test(String(component.componentRole || ''))) {
      throw new Error('Product PLM component description or role is invalid.');
    }
    if (!PRODUCT_COMPONENT_TYPES.includes(component.componentType)) {
      throw new Error('Product PLM component type is invalid.');
    }
    if (!['draft', 'active', 'retired', 'archived'].includes(component.status)) {
      throw new Error('Product PLM component status is invalid.');
    }
    if (!COMPONENT_CLASSIFICATIONS.has(component.dataClassification)) {
      throw new Error('Product PLM component classification is invalid.');
    }
    if (![component.isOptional, component.isReplaceable, component.isSellableSeparately]
      .every((value) => typeof value === 'boolean')) {
      throw new Error('Product PLM component capability flags are invalid.');
    }
    if (!Number.isInteger(component.sequence) || component.sequence < 0) {
      throw new Error('Product PLM component sequence is invalid.');
    }
    validateReferenceExtensions(component.extensionReferences, 'Product PLM component');
    validateIntelligenceReferences(component.intelligenceReferences, 'Product PLM component');
  }

  for (const component of store.productComponents) {
    let cursor = component;
    const visited = new Set([component.id]);
    let depth = 0;
    while (cursor.parentComponentId) {
      if (visited.has(cursor.parentComponentId)) {
        throw new Error('Product PLM component hierarchy contains a cycle.');
      }
      visited.add(cursor.parentComponentId);
      cursor = componentById.get(cursor.parentComponentId);
      depth += 1;
      if (depth > 8) throw new Error('Product PLM component hierarchy exceeds the maximum depth.');
    }
    if (component.status === 'archived' && store.productComponents.some((child) =>
      child.parentComponentId === component.id && child.status === 'active')) {
      throw new Error('Product PLM component with active children cannot be archived.');
    }
    validateInheritance(component, componentById, styleById);
  }
  return store.productComponents;
}

module.exports = {
  COMPONENT_OVERRIDE_FIELDS,
  PRODUCT_COMPONENT_TYPES,
  validateProductComponents,
};
