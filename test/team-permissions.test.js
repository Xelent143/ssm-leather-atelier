const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  createTeamPermissionsService,
  PRESET_PERMISSIONS,
} = require('../team-permissions-service');

function fixture(clock = Date.UTC(2026, 6, 28, 7)) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-permissions-'));
  const owner = { id: '10000000-0000-4000-8000-000000000001', displayName: 'Owner', email: 'owner@example.test', accountType: 'owner', status: 'active' };
  const assistant = { id: '20000000-0000-4000-8000-000000000002', displayName: 'Ali', email: 'ali@example.test', accountType: 'listing_editor', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' };
  const publisher = { id: '30000000-0000-4000-8000-000000000003', displayName: 'Ahmed', email: 'ahmed@example.test', accountType: 'listing_editor', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' };
  const users = [owner, assistant, publisher];
  const identity = {
    findById: (id) => users.find((user) => user.id === id) || null,
    managedUsers: () => users.filter((user) => user.accountType !== 'owner'),
  };
  const service = createTeamPermissionsService({ dataDir, identity, now: () => clock });
  return { dataDir, owner, assistant, publisher, service };
}

test('role presets cover requested operational roles and protected Owner boundaries', () => {
  const full = PRESET_PERMISSIONS.full_operational_access;
  for (const permission of [
    'products:create', 'products:edit', 'categories:edit', 'inventory:edit',
    'pricing:edit', 'media:create', 'publishing:approve', 'publishing:publish',
    'publishing:export', 'sync:edit',
  ]) assert.equal(full[permission], true, permission);
  for (const permission of [
    'settings:configure', 'team:configure', 'productDna:edit',
    'productIdentity:delete', 'products:delete', 'categories:delete',
  ]) assert.notEqual(full[permission], true, permission);
  assert.equal(PRESET_PERMISSIONS.listing_assistant['publishing:publish'], undefined);
  assert.equal(PRESET_PERMISSIONS.publishing_manager['publishing:publish'], true);
});

test('existing Listing Editor receives backward-compatible permissions without migration', () => {
  const { assistant, service } = fixture();
  const assignment = service.assignmentFor(assistant);
  assert.equal(assignment.roleId, 'listing_editor');
  assert.equal(assignment.source, 'backward_compatible_default');
  assert.equal(service.hasUserPermission(assistant, 'products', 'edit'), true);
  assert.equal(service.hasUserPermission(assistant, 'publishing', 'publish'), false);
  assert.equal(fs.existsSync(service.paths.storePath), false);
});

test('Owner can assign, persist, and clone permissions with revision protection', () => {
  const { owner, assistant, publisher, service } = fixture();
  let workspace = service.save(owner, assistant.id, {
    roleId: 'publishing_manager',
    expectedRevision: 0,
  });
  assert.equal(service.hasUserPermission(assistant, 'publishing', 'publish'), true);
  assert.equal(fs.statSync(service.paths.storePath).mode & 0o777, 0o600);
  workspace = service.clone(owner, assistant.id, publisher.id, workspace.revision);
  assert.equal(service.hasUserPermission(publisher, 'publishing', 'publish'), true);
  assert.equal(workspace.auditEvents.length, 2);
  assert.throws(() => service.save(owner, publisher.id, {
    roleId: 'listing_assistant',
    expectedRevision: 0,
  }), (error) => error.code === 'REVISION_CONFLICT');
});

test('Custom roles reject unsupported and Owner-protected permissions', () => {
  const { owner, assistant, service } = fixture();
  service.save(owner, assistant.id, {
    roleId: 'custom',
    permissions: {
      'products:view': true,
      'publishing:publish': true,
      'team:configure': true,
      'payments:configure': true,
    },
    expectedRevision: 0,
  });
  assert.equal(service.hasUserPermission(assistant, 'products', 'view'), true);
  assert.equal(service.hasUserPermission(assistant, 'publishing', 'publish'), true);
  assert.equal(service.hasUserPermission(assistant, 'team', 'configure'), false);
  assert.equal(service.hasUserPermission(assistant, 'payments', 'configure'), false);
});

test('temporary access expires and disables permissions and login', () => {
  const { owner, assistant, service } = fixture();
  service.save(owner, assistant.id, {
    roleId: 'full_operational_access',
    expiresAt: '2026-07-28T06:59:59.000Z',
    expectedRevision: 0,
  });
  assert.equal(service.hasUserPermission(assistant, 'products', 'view'), false);
  assert.deepEqual(service.loginDecision(assistant), { allowed: false, reason: 'expired' });
});

test('login restrictions enforce IP, country, 2FA and device limits independently', () => {
  const { owner, assistant, service } = fixture();
  service.save(owner, assistant.id, {
    roleId: 'listing_editor',
    restrictions: {
      canLogin: true,
      allowedIps: ['203.0.113.5'],
      allowedCountries: ['PK'],
      require2fa: true,
      unlimitedDevices: false,
      maxDevices: 1,
    },
    expectedRevision: 0,
  });
  assert.equal(service.loginDecision(assistant, { headers: { 'x-forwarded-for': '198.51.100.1', 'x-country': 'PK' } }).reason, 'ip');
  assert.equal(service.loginDecision(assistant, { headers: { 'x-forwarded-for': '203.0.113.5', 'x-country': 'US' } }).reason, 'country');
  assert.equal(service.loginDecision(assistant, { headers: { 'x-forwarded-for': '203.0.113.5', 'x-country': 'PK' } }).reason, '2fa');
  assistant.mfaStatus = 'enabled';
  assert.equal(service.loginDecision(assistant, { headers: { 'x-forwarded-for': '203.0.113.5', 'x-country': 'PK' } }, 1).reason, 'devices');
});

test('Named Owner permissions cannot be edited or cloned', () => {
  const { owner, assistant, service } = fixture();
  assert.throws(() => service.save(owner, owner.id, {
    roleId: 'custom', expectedRevision: 0,
  }), (error) => error.code === 'FORBIDDEN');
  assert.throws(() => service.clone(owner, assistant.id, owner.id, 0), (error) => error.code === 'VALIDATION');
});

test('permission audit contains safe metadata and no submitted secret fields', () => {
  const { owner, assistant, service } = fixture();
  service.save(owner, assistant.id, {
    roleId: 'listing_assistant',
    permissions: { 'products:view': true },
    password: 'must-never-appear',
    expectedRevision: 0,
  });
  const serialized = JSON.stringify(service.read().auditEvents);
  assert.equal(serialized.includes('must-never-appear'), false);
  assert.equal(service.read().auditEvents[0].actorId, owner.id);
});
