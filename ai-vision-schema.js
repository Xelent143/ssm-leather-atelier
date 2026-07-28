const VISION_SCHEMA_VERSION = 1;
const IMAGE_ROLES = Object.freeze([
  'Front', 'Back', 'Left Side', 'Right Side', 'Interior', 'Lining', 'Detail',
  'Hardware', 'Logo', 'Closure', 'Pocket', 'Collar', 'Sleeve', 'Size Chart',
  'Lifestyle', 'Unknown',
]);
const ANALYSIS_STATUSES = Object.freeze([
  'draft', 'ready', 'analyzing', 'completed', 'needs_review', 'conflicted',
  'approved', 'partially_applied', 'applied', 'failed', 'cancelled', 'superseded',
]);
const FACT_STATUSES = Object.freeze([
  'detected', 'inferred', 'confirmed', 'corrected', 'rejected', 'unknown', 'conflicted',
]);
const QUALITY_STATUSES = Object.freeze(['Good', 'Acceptable', 'Needs Improvement', 'Unusable', 'Unknown']);

function confidence(score) {
  const value = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Math.round(Number(score)))) : 0;
  return {
    score: value,
    label: value >= 80 ? 'High' : value >= 50 ? 'Medium' : value > 0 ? 'Low' : 'Unknown',
  };
}

function cleanText(value, max = 2000) {
  return typeof value === 'string' ? value.replace(/\u0000/g, '').slice(0, max) : '';
}

function validateDraftInput(input = {}, validMediaIds = []) {
  const valid = new Set(validMediaIds);
  const selectedMediaIds = [...new Set(Array.isArray(input.selectedMediaIds)
    ? input.selectedMediaIds.map(String).filter((id) => valid.has(id)) : [])];
  const imageRoles = {};
  for (const id of selectedMediaIds) {
    const role = input.imageRoles?.[id];
    imageRoles[id] = IMAGE_ROLES.includes(role) ? role : 'Unknown';
  }
  return {
    providerId: ['metadata_only', 'openai_vision', 'fake_test_provider'].includes(input.providerId)
      ? input.providerId : 'metadata_only',
    selectedMediaIds,
    imageRoles,
    excludedMediaIds: [...new Set(Array.isArray(input.excludedMediaIds)
      ? input.excludedMediaIds.map(String).filter((id) => valid.has(id)) : [])],
    note: cleanText(input.note),
  };
}

module.exports = {
  ANALYSIS_STATUSES,
  FACT_STATUSES,
  IMAGE_ROLES,
  QUALITY_STATUSES,
  VISION_SCHEMA_VERSION,
  cleanText,
  confidence,
  validateDraftInput,
};
