const { validateIntelligenceReferences } = require('./product-plm-intelligence-references');

const PRODUCT_RELATIONSHIP_TYPES = Object.freeze({
  related_to: Object.freeze({
    sourceTypes: ['product_style', 'product_component'],
    targetTypes: ['product_style', 'product_component'],
    sameEntityType: true,
    symmetric: true,
    acyclic: false,
    reserved: false,
  }),
  compatible_with: Object.freeze({
    sourceTypes: ['product_style', 'product_component'],
    targetTypes: ['product_style', 'product_component'],
    sameEntityType: true,
    symmetric: true,
    acyclic: false,
    reserved: false,
  }),
  derived_from: Object.freeze({
    sourceTypes: ['product_style', 'product_component'],
    targetTypes: ['product_style', 'product_component'],
    sameEntityType: true,
    symmetric: false,
    acyclic: true,
    reserved: false,
  }),
  replaces: Object.freeze({
    sourceTypes: ['product_style', 'product_component'],
    targetTypes: ['product_style', 'product_component'],
    sameEntityType: true,
    symmetric: false,
    acyclic: true,
    reserved: false,
  }),
  accessory_for: Object.freeze({
    sourceTypes: ['product_style'],
    targetTypes: ['product_style'],
    sameEntityType: true,
    symmetric: false,
    acyclic: false,
    reserved: false,
  }),
  component_alternative_to: Object.freeze({
    sourceTypes: ['product_component'],
    targetTypes: ['product_component'],
    sameEntityType: true,
    symmetric: true,
    acyclic: false,
    reserved: false,
  }),
  private_label_derived_from: Object.freeze({
    sourceTypes: ['product_style'],
    targetTypes: ['product_style'],
    sameEntityType: true,
    symmetric: false,
    acyclic: true,
    reserved: false,
  }),
  contains_sellable: Object.freeze({
    sourceTypes: ['sellable_item'],
    targetTypes: ['sellable_item'],
    sameEntityType: true,
    symmetric: false,
    acyclic: true,
    reserved: true,
  }),
  set_contains: Object.freeze({
    sourceTypes: ['sellable_item'],
    targetTypes: ['sellable_item'],
    sameEntityType: true,
    symmetric: false,
    acyclic: true,
    reserved: true,
  }),
});

const RELATIONSHIP_CLASSIFICATIONS = new Set([
  'internal',
  'confidential',
  'factory_confidential',
  'commercially_sensitive',
]);
const RELATIONSHIP_KEYS = new Set([
  'id',
  'schemaVersion',
  'relationshipType',
  'sourceEntityType',
  'sourceEntityId',
  'targetEntityType',
  'targetEntityId',
  'sequence',
  'status',
  'effectiveFrom',
  'effectiveTo',
  'metadata',
  'intelligenceReferences',
  'dataClassification',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]);

function entityIndex(store) {
  const result = new Map();
  for (const style of store.productStyles) {
    result.set(`product_style:${style.id}`, {
      id: style.id,
      entityType: 'product_style',
      brandId: style.brandId,
      legalEntityId: style.legalEntityId,
    });
  }
  const styles = new Map(store.productStyles.map((style) => [style.id, style]));
  for (const component of store.productComponents) {
    const style = styles.get(component.styleId);
    result.set(`product_component:${component.id}`, {
      id: component.id,
      entityType: 'product_component',
      brandId: style?.brandId,
      legalEntityId: style?.legalEntityId,
    });
  }
  return result;
}

function endpointKey(entityType, entityId) {
  return `${entityType}:${entityId}`;
}

function validateRelationshipGraph(relationships, relationshipType) {
  const edges = relationships.filter((relationship) =>
    relationship.status !== 'archived' && relationship.relationshipType === relationshipType);
  const adjacency = new Map();
  for (const edge of edges) {
    const source = endpointKey(edge.sourceEntityType, edge.sourceEntityId);
    const target = endpointKey(edge.targetEntityType, edge.targetEntityId);
    const targets = adjacency.get(source) || [];
    targets.push(target);
    adjacency.set(source, targets);
  }
  const state = new Map();
  function visit(node) {
    if (state.get(node) === 'visiting') throw new Error(`Product PLM ${relationshipType} relationship contains a cycle.`);
    if (state.get(node) === 'visited') return;
    state.set(node, 'visiting');
    for (const target of adjacency.get(node) || []) visit(target);
    state.set(node, 'visited');
  }
  for (const node of adjacency.keys()) visit(node);
}

function validateProductRelationships(store) {
  const entities = entityIndex(store);
  const unique = new Set();
  for (const relationship of store.productRelationships) {
    if (!relationship || typeof relationship !== 'object' || Array.isArray(relationship) ||
        Object.keys(relationship).some((key) => !RELATIONSHIP_KEYS.has(key))) {
      throw new Error('Product PLM relationship contains unsupported data.');
    }
    const definition = PRODUCT_RELATIONSHIP_TYPES[relationship.relationshipType];
    if (!definition || definition.reserved) {
      throw new Error('Product PLM relationship type is unavailable or reserved.');
    }
    if (!definition.sourceTypes.includes(relationship.sourceEntityType) ||
        !definition.targetTypes.includes(relationship.targetEntityType) ||
        (definition.sameEntityType && relationship.sourceEntityType !== relationship.targetEntityType)) {
      throw new Error('Product PLM relationship endpoint types are invalid.');
    }
    const sourceKey = endpointKey(relationship.sourceEntityType, relationship.sourceEntityId);
    const targetKey = endpointKey(relationship.targetEntityType, relationship.targetEntityId);
    const source = entities.get(sourceKey);
    const target = entities.get(targetKey);
    if (!source || !target || sourceKey === targetKey) {
      throw new Error('Product PLM relationship endpoint is invalid.');
    }
    if (source.brandId !== target.brandId || source.legalEntityId !== target.legalEntityId) {
      throw new Error('Product PLM cross-owner relationship requires a future approval workflow.');
    }
    if (definition.symmetric && sourceKey.localeCompare(targetKey) >= 0) {
      throw new Error('Product PLM symmetric relationship endpoints are not canonical.');
    }
    if (!['draft', 'active', 'retired', 'archived'].includes(relationship.status)) {
      throw new Error('Product PLM relationship status is invalid.');
    }
    if (!Number.isInteger(relationship.sequence) || relationship.sequence < 0) {
      throw new Error('Product PLM relationship sequence is invalid.');
    }
    const effectiveFrom = relationship.effectiveFrom ? Date.parse(relationship.effectiveFrom) : null;
    const effectiveTo = relationship.effectiveTo ? Date.parse(relationship.effectiveTo) : null;
    if ((relationship.effectiveFrom && !Number.isFinite(effectiveFrom)) ||
        (relationship.effectiveTo && !Number.isFinite(effectiveTo)) ||
        (effectiveFrom !== null && effectiveTo !== null && effectiveFrom > effectiveTo)) {
      throw new Error('Product PLM relationship effective period is invalid.');
    }
    if (!RELATIONSHIP_CLASSIFICATIONS.has(relationship.dataClassification) ||
        (relationship.relationshipType === 'private_label_derived_from' &&
         relationship.dataClassification !== 'confidential')) {
      throw new Error('Product PLM relationship classification is invalid.');
    }
    if (!relationship.metadata || typeof relationship.metadata !== 'object' ||
        Array.isArray(relationship.metadata) || Object.keys(relationship.metadata).length) {
      throw new Error('Product PLM relationship metadata is reserved for future typed use.');
    }
    validateIntelligenceReferences(relationship.intelligenceReferences, 'Product PLM relationship');
    const uniqueKey = `${relationship.relationshipType}:${sourceKey}:${targetKey}`;
    if (unique.has(uniqueKey)) throw new Error('Product PLM relationship is duplicated.');
    unique.add(uniqueKey);
  }
  for (const [type, definition] of Object.entries(PRODUCT_RELATIONSHIP_TYPES)) {
    if (definition.acyclic && !definition.reserved) validateRelationshipGraph(store.productRelationships, type);
  }
  return store.productRelationships;
}

module.exports = {
  PRODUCT_RELATIONSHIP_TYPES,
  validateProductRelationships,
};
