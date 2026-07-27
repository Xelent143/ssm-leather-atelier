const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MODULES = [
  'dashboard', 'products', 'categories', 'inventory', 'pricing', 'media',
  'website', 'publishing', 'seo', 'ai', 'productDna', 'productIdentity',
  'orders', 'customers', 'reports', 'settings', 'team', 'sync',
];
const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'bulkEdit', 'configure'];
const ROLE_IDS = [
  'listing_assistant', 'listing_editor', 'product_manager', 'inventory_manager',
  'category_manager', 'publishing_manager', 'media_manager', 'operations_manager',
  'full_operational_access', 'custom',
];
const ROLE_NAMES = {
  listing_assistant: 'Listing Assistant',
  listing_editor: 'Listing Editor',
  product_manager: 'Product Manager',
  inventory_manager: 'Inventory Manager',
  category_manager: 'Category Manager',
  publishing_manager: 'Publishing Manager',
  media_manager: 'Media Manager',
  operations_manager: 'Operations Manager',
  full_operational_access: 'Full Operational Access',
  custom: 'Custom Role',
};
const PROTECTED_NON_OWNER = new Set([
  ...ACTIONS.map((action) => `settings:${action}`),
  ...ACTIONS.map((action) => `team:${action}`),
  'products:delete', 'categories:delete',
  'productDna:create', 'productDna:edit', 'productDna:delete', 'productDna:configure',
  'productIdentity:delete', 'productIdentity:publish', 'productIdentity:configure',
]);

function permissionSet(entries = []) {
  return Object.fromEntries(entries.map((entry) => [entry, true]));
}

const PRESET_PERMISSIONS = {
  listing_assistant: permissionSet([
    'dashboard:view', 'products:view', 'products:create', 'products:edit',
    'media:view', 'media:create', 'media:edit', 'seo:view', 'seo:edit',
    'ai:view', 'ai:create', 'ai:edit', 'publishing:view', 'sync:view',
  ]),
  listing_editor: permissionSet([
    'dashboard:view', 'products:view', 'products:create', 'products:edit',
    'products:bulkEdit', 'categories:view', 'inventory:view', 'inventory:edit',
    'pricing:view', 'pricing:edit', 'media:view', 'media:create', 'media:edit',
    'website:view', 'seo:view', 'seo:edit', 'ai:view', 'ai:create', 'ai:edit',
    'publishing:view', 'sync:view', 'productDna:view', 'productIdentity:view',
  ]),
  product_manager: permissionSet([
    'dashboard:view', 'products:view', 'products:create', 'products:edit',
    'products:bulkEdit', 'categories:view', 'categories:edit',
    'inventory:view', 'inventory:edit', 'pricing:view', 'pricing:edit',
    'media:view', 'media:create', 'media:edit', 'website:view', 'seo:view',
    'seo:edit', 'publishing:view', 'sync:view', 'productDna:view',
    'productIdentity:view', 'reports:view',
  ]),
  inventory_manager: permissionSet([
    'dashboard:view', 'products:view', 'inventory:view', 'inventory:edit',
    'inventory:bulkEdit', 'inventory:export', 'pricing:view', 'sync:view',
    'reports:view',
  ]),
  category_manager: permissionSet([
    'dashboard:view', 'products:view', 'categories:view', 'categories:create',
    'categories:edit', 'categories:bulkEdit', 'media:view', 'media:create',
    'seo:view', 'seo:edit', 'website:view', 'publishing:view', 'sync:view',
  ]),
  publishing_manager: permissionSet([
    'dashboard:view', 'products:view', 'products:edit', 'categories:view',
    'inventory:view', 'pricing:view', 'media:view', 'website:view',
    'website:edit', 'publishing:view', 'publishing:approve',
    'publishing:publish', 'publishing:export', 'seo:view', 'seo:edit',
    'ai:view', 'sync:view', 'sync:edit',
  ]),
  media_manager: permissionSet([
    'dashboard:view', 'products:view', 'media:view', 'media:create',
    'media:edit', 'media:delete', 'media:bulkEdit', 'media:export',
  ]),
  operations_manager: permissionSet([
    'dashboard:view', 'products:view', 'products:create', 'products:edit',
    'products:bulkEdit', 'categories:view', 'categories:create',
    'categories:edit', 'inventory:view', 'inventory:edit', 'inventory:bulkEdit',
    'pricing:view', 'pricing:edit', 'media:view', 'media:create', 'media:edit',
    'website:view', 'publishing:view', 'publishing:approve', 'seo:view',
    'seo:edit', 'ai:view', 'ai:create', 'ai:edit', 'orders:view',
    'customers:view', 'reports:view', 'sync:view', 'sync:edit',
    'productDna:view', 'productIdentity:view',
  ]),
  full_operational_access: permissionSet([
    ...MODULES.flatMap((module) => ACTIONS.map((action) => `${module}:${action}`)),
  ].filter((entry) => !PROTECTED_NON_OWNER.has(entry))),
  custom: {},
};

function defaultRestrictions() {
  return {
    canLogin: true,
    officeHoursOnly: false,
    officeHours: { timezone: 'Asia/Karachi', start: '09:00', end: '18:00', weekdays: [1, 2, 3, 4, 5, 6] },
    allowedIps: [],
    allowedCountries: [],
    require2fa: false,
    unlimitedDevices: true,
    maxDevices: null,
  };
}

function atomicWrite(filePath, value) {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

function createTeamPermissionsService(options = {}) {
  const dataDir = options.dataDir;
  const identity = options.identity;
  const now = options.now || (() => Date.now());
  const storePath = path.join(dataDir, 'team-permissions.json');

  function emptyStore() {
    return { version: 1, revision: 0, assignments: [], auditEvents: [], updatedAt: new Date(now()).toISOString() };
  }

  function read() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      return {
        ...emptyStore(), ...parsed,
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
        auditEvents: Array.isArray(parsed.auditEvents) ? parsed.auditEvents : [],
      };
    } catch (error) {
      if (error.code === 'ENOENT') return emptyStore();
      throw Object.assign(new Error('Team permission store is unavailable.'), { code: 'PERMISSION_STORE_UNAVAILABLE' });
    }
  }

  function write(store) {
    store.revision = Number(store.revision || 0) + 1;
    store.updatedAt = new Date(now()).toISOString();
    atomicWrite(storePath, store);
  }

  function fallbackAssignment(user) {
    return {
      id: `legacy:${user.id}`,
      userId: user.id,
      roleId: 'listing_editor',
      roleName: ROLE_NAMES.listing_editor,
      permissions: { ...PRESET_PERMISSIONS.listing_editor },
      restrictions: defaultRestrictions(),
      expiresAt: null,
      createdBy: user.createdBy || 'legacy_owner',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastPermissionChangeAt: null,
      source: 'backward_compatible_default',
    };
  }

  function assignmentFor(user) {
    if (!user) return null;
    if (user.accountType === 'owner') {
      return {
        id: 'protected-owner', userId: user.id, roleId: 'named_owner',
        roleName: 'Named Owner', permissions: { '*:*': true },
        restrictions: defaultRestrictions(), expiresAt: null, source: 'protected_owner',
      };
    }
    return read().assignments.find((item) => item.userId === user.id) || fallbackAssignment(user);
  }

  function effectivePermissions(assignment) {
    if (!assignment) return {};
    if (assignment.roleId === 'custom') return { ...(assignment.permissions || {}) };
    return { ...(PRESET_PERMISSIONS[assignment.roleId] || {}), ...(assignment.permissions || {}) };
  }

  function hasUserPermission(user, module, action) {
    if (!user || user.status !== 'active') return false;
    if (user.accountType === 'owner') return true;
    const assignment = assignmentFor(user);
    if (!assignment || (assignment.expiresAt && Date.parse(assignment.expiresAt) <= now())) return false;
    if (PROTECTED_NON_OWNER.has(`${module}:${action}`)) return false;
    return effectivePermissions(assignment)[`${module}:${action}`] === true;
  }

  function loginDecision(user, req = {}, activeSessions = 0) {
    if (!user || user.status !== 'active') return { allowed: false, reason: 'status' };
    if (user.accountType === 'owner') return { allowed: true };
    const assignment = assignmentFor(user);
    const restrictions = { ...defaultRestrictions(), ...(assignment.restrictions || {}) };
    if (assignment.expiresAt && Date.parse(assignment.expiresAt) <= now()) return { allowed: false, reason: 'expired' };
    if (!restrictions.canLogin) return { allowed: false, reason: 'login_disabled' };
    const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    if (restrictions.allowedIps.length && !restrictions.allowedIps.includes(ip)) return { allowed: false, reason: 'ip' };
    const country = String(req.headers?.['x-country'] || req.headers?.['cf-ipcountry'] || '').toUpperCase();
    if (restrictions.allowedCountries.length && !restrictions.allowedCountries.includes(country)) return { allowed: false, reason: 'country' };
    if (restrictions.require2fa && user.mfaStatus !== 'enabled') return { allowed: false, reason: '2fa' };
    if (!restrictions.unlimitedDevices && Number(restrictions.maxDevices || 1) <= activeSessions) return { allowed: false, reason: 'devices' };
    if (restrictions.officeHoursOnly) {
      const local = new Date(now()).toLocaleString('en-US', { timeZone: restrictions.officeHours.timezone, hour12: false });
      const date = new Date(local);
      const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      if (!restrictions.officeHours.weekdays.includes(date.getDay()) ||
          hhmm < restrictions.officeHours.start || hhmm > restrictions.officeHours.end) {
        return { allowed: false, reason: 'office_hours' };
      }
    }
    return { allowed: true };
  }

  function validatePermissions(value) {
    const cleaned = {};
    for (const [key, enabled] of Object.entries(value || {})) {
      const [module, action] = key.split(':');
      if (!MODULES.includes(module) || !ACTIONS.includes(action)) continue;
      if (!PROTECTED_NON_OWNER.has(key)) cleaned[key] = enabled === true;
    }
    return cleaned;
  }

  function audit(store, actor, userId, action, changes = {}) {
    store.auditEvents.push({
      id: crypto.randomUUID(), actorId: actor.id, actorRole: actor.accountType,
      targetUserId: userId, action,
      addedPermissions: changes.addedPermissions || [],
      removedPermissions: changes.removedPermissions || [],
      previousRole: changes.previousRole || null,
      newRole: changes.newRole || null,
      timestamp: new Date(now()).toISOString(),
      result: 'success',
    });
    store.auditEvents = store.auditEvents.slice(-5000);
  }

  function save(actor, userId, input = {}) {
    if (!actor || actor.accountType !== 'owner') throw Object.assign(new Error('Named Owner access is required.'), { code: 'FORBIDDEN' });
    const user = identity.findById(userId);
    if (!user || user.accountType === 'owner') throw Object.assign(new Error('Protected Owner permissions cannot be changed.'), { code: 'FORBIDDEN' });
    if (!ROLE_IDS.includes(input.roleId)) throw Object.assign(new Error('Select a valid role preset.'), { code: 'VALIDATION' });
    const store = read();
    if (input.expectedRevision != null && Number(input.expectedRevision) !== Number(store.revision)) {
      throw Object.assign(new Error('Permissions changed in another session. Reload and try again.'), { code: 'REVISION_CONFLICT' });
    }
    const prior = store.assignments.find((item) => item.userId === userId) || fallbackAssignment(user);
    const permissions = input.roleId === 'custom'
      ? validatePermissions(input.permissions)
      : validatePermissions(input.permissionOverrides || {});
    const restrictions = {
      ...defaultRestrictions(), ...(input.restrictions || {}),
      allowedIps: [...new Set((input.restrictions?.allowedIps || []).map(String).filter(Boolean))].slice(0, 50),
      allowedCountries: [...new Set((input.restrictions?.allowedCountries || []).map((v) => String(v).toUpperCase()).filter(Boolean))].slice(0, 50),
    };
    const timestamp = new Date(now()).toISOString();
    const next = {
      id: prior.id.startsWith('legacy:') ? crypto.randomUUID() : prior.id,
      userId, roleId: input.roleId, roleName: ROLE_NAMES[input.roleId],
      permissions, restrictions,
      expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      createdBy: prior.createdBy || actor.id, createdAt: prior.createdAt || timestamp,
      updatedAt: timestamp, lastPermissionChangeAt: timestamp, source: 'owner_managed',
    };
    const before = effectivePermissions(prior);
    const after = effectivePermissions(next);
    const addedPermissions = Object.keys(after).filter((key) => after[key] && !before[key]);
    const removedPermissions = Object.keys(before).filter((key) => before[key] && !after[key]);
    store.assignments = store.assignments.filter((item) => item.userId !== userId);
    store.assignments.push(next);
    audit(store, actor, userId, prior.roleId === next.roleId ? 'permissions_changed' : 'role_changed', {
      addedPermissions, removedPermissions, previousRole: prior.roleId, newRole: next.roleId,
    });
    write(store);
    return workspace(actor);
  }

  function clone(actor, sourceUserId, targetUserId, expectedRevision) {
    const source = identity.findById(sourceUserId);
    const target = identity.findById(targetUserId);
    if (!source || !target || source.accountType === 'owner' || target.accountType === 'owner') {
      throw Object.assign(new Error('Select two eligible team members.'), { code: 'VALIDATION' });
    }
    const sourceAssignment = assignmentFor(source);
    return save(actor, targetUserId, {
      roleId: sourceAssignment.roleId,
      permissions: effectivePermissions(sourceAssignment),
      permissionOverrides: sourceAssignment.permissions,
      restrictions: sourceAssignment.restrictions,
      expiresAt: sourceAssignment.expiresAt,
      expectedRevision,
    });
  }

  function record(actor, userId, action) {
    if (!actor || actor.accountType !== 'owner') {
      throw Object.assign(new Error('Named Owner access is required.'), { code: 'FORBIDDEN' });
    }
    const store = read();
    audit(store, actor, userId, action);
    write(store);
  }

  function workspace(actor, security = null) {
    if (!actor || actor.accountType !== 'owner') throw Object.assign(new Error('Named Owner access is required.'), { code: 'FORBIDDEN' });
    const store = read();
    const users = identity.managedUsers().map((user) => {
      const assignment = assignmentFor(user);
      const permissions = effectivePermissions(assignment);
      return {
        ...user, assignment: { ...assignment, permissions },
        activeSessionCount: security ? security.activeUserSessions(user.id).length : 0,
        permissionSummary: Object.values(permissions).filter(Boolean).length,
        accessExpired: Boolean(assignment.expiresAt && Date.parse(assignment.expiresAt) <= now()),
      };
    });
    return {
      revision: store.revision, modules: MODULES, actions: ACTIONS,
      roles: ROLE_IDS.map((id) => ({ id, name: ROLE_NAMES[id], permissions: { ...PRESET_PERMISSIONS[id] } })),
      protectedPermissions: [...PROTECTED_NON_OWNER], users,
      auditEvents: store.auditEvents.slice(-250).reverse(),
    };
  }

  function userAccess(user) {
    const assignment = assignmentFor(user);
    return {
      roleId: assignment?.roleId || null,
      roleName: assignment?.roleName || null,
      permissions: effectivePermissions(assignment),
      expiresAt: assignment?.expiresAt || null,
      expired: Boolean(assignment?.expiresAt && Date.parse(assignment.expiresAt) <= now()),
      restrictions: assignment?.restrictions || defaultRestrictions(),
    };
  }

  return {
    assignmentFor, clone, hasUserPermission, loginDecision, read, record, save,
    userAccess, workspace,
    constants: { MODULES, ACTIONS, ROLE_IDS, ROLE_NAMES, PRESET_PERMISSIONS, PROTECTED_NON_OWNER },
    paths: { storePath },
  };
}

module.exports = {
  ACTIONS, MODULES, PRESET_PERMISSIONS, PROTECTED_NON_OWNER, ROLE_IDS, ROLE_NAMES,
  createTeamPermissionsService,
};
