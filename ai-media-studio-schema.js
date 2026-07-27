const IMAGE_SOURCE_MODES = Object.freeze([
  'uploaded_only',
  'hybrid',
  'ai_generated',
]);

const REFERENCE_IMAGE_ROLES = Object.freeze([
  'Front',
  'Back',
  'Left',
  'Right',
  'Interior',
  'Detail',
  'Hardware',
  'Logo',
  'Size Chart',
  'Lifestyle',
  'Unknown',
]);

const ASSET_TYPES = Object.freeze([
  'White Background',
  'Ghost Mannequin',
  'Lifestyle',
  'Front',
  'Back',
  'Left',
  'Right',
  'Detail',
  'Hardware',
  'Infographic',
  'Video Prompt',
  'Social Banner',
]);

const DESIGN_LOCKS = Object.freeze([
  'Stitching',
  'Panels',
  'Zippers',
  'Pockets',
  'Hardware',
  'Logo',
  'Leather Texture',
  'Shape',
  'Color',
]);

const PLAN_STATES = Object.freeze([
  'draft',
  'ready',
  'analyzed',
  'needs_review',
]);

function cleanText(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').slice(0, max);
}

function uniqueAllowed(values, allowed) {
  const allowedSet = new Set(allowed);
  return [...new Set(Array.isArray(values) ? values.filter((value) => allowedSet.has(value)) : [])];
}

function validatePlanInput(input = {}, validMediaIds = []) {
  const mode = IMAGE_SOURCE_MODES.includes(input.mode) ? input.mode : 'uploaded_only';
  const mediaIds = [...new Set(Array.isArray(input.referenceMediaIds)
    ? input.referenceMediaIds.map(String).filter((id) => validMediaIds.includes(id))
    : [])];
  const roleAssignments = {};
  for (const [mediaId, role] of Object.entries(input.roleAssignments || {})) {
    if (mediaIds.includes(mediaId) && REFERENCE_IMAGE_ROLES.includes(role)) roleAssignments[mediaId] = role;
  }
  return {
    mode,
    referenceMediaIds: mediaIds,
    roleAssignments,
    selectedAssets: uniqueAllowed(input.selectedAssets, ASSET_TYPES),
    designLocks: uniqueAllowed(input.designLocks, DESIGN_LOCKS),
    instructions: cleanText(input.instructions),
  };
}

module.exports = {
  ASSET_TYPES,
  DESIGN_LOCKS,
  IMAGE_SOURCE_MODES,
  PLAN_STATES,
  REFERENCE_IMAGE_ROLES,
  validatePlanInput,
};
