const STUDIO_PERMISSIONS = Object.freeze([
  'create_studio_project',
  'approve_generation_plan',
  'approve_artifact',
  'revoke_artifact',
  'view_confidential_artifact',
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function authorizeStudioPermission(session, user, permission) {
  const allowed = STUDIO_PERMISSIONS.includes(permission) &&
    session?.actorType === 'named_user' &&
    isUuid(session.userId) &&
    user?.id === session.userId &&
    user?.accountType === 'owner' &&
    user?.status === 'active';
  return {
    allowed,
    actorId: allowed ? user.id : null,
    actorType: allowed ? 'named_user' : null,
    actorRole: allowed ? 'owner' : null,
    permission: STUDIO_PERMISSIONS.includes(permission) ? permission : null,
  };
}

module.exports = {
  STUDIO_PERMISSIONS,
  authorizeStudioPermission,
};
