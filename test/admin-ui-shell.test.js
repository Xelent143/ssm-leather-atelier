const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const adminJs = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, '..', 'admin.css'), 'utf8');

test('admin shell includes the complete grouped navigation architecture', () => {
  for (const group of ['Workspace', 'Commerce', 'Growth', 'AI Studio', 'Operations', 'Insights', 'Configuration']) {
    assert.match(adminJs, new RegExp(`\\['${group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
  for (const route of ['/admin/products', '/admin/ai-product-studio', '/admin/factory', '/admin/system-settings']) {
    assert.match(adminJs, new RegExp(route.replaceAll('/', '\\/')));
  }
});

test('existing product manager remains available behind its own route', () => {
  assert.match(adminJs, /function renderCurrentProductManager\(\)/);
  assert.match(adminJs, /\/admin\/products\/current/);
  assert.match(adminJs, /Open Current Product Manager/);
  assert.match(adminJs, /id="new-product"/);
});

test('unfinished shell actions are visibly disabled and status-labelled', () => {
  assert.match(adminJs, /Coming Soon/);
  assert.match(adminJs, /status-badge/);
  assert.match(adminJs, /type="button" disabled/);
  assert.doesNotMatch(adminJs, /fetch\(['"]\/api\/admin\/(marketing|social|factory|production|ai)/);
});

test('admin authentication, CSRF request header, and logout remain wired', () => {
  assert.match(adminJs, /X-CSRF-Token/);
  assert.match(adminJs, /\/api\/admin\/auth\/named-login/);
  assert.match(adminJs, /\/api\/admin\/session/);
  assert.match(adminJs, /\/api\/admin\/logout/);
  assert.match(adminJs, /credentials: 'same-origin'/);
});

test('responsive and accessibility foundations are present', () => {
  assert.match(adminCss, /:focus-visible/);
  assert.match(adminCss, /\.sr-only/);
  assert.match(adminCss, /@media \(max-width: 960px\)/);
  assert.match(adminCss, /@media \(max-width: 680px\)/);
  assert.match(adminJs, /aria-current="page"/);
  assert.match(adminJs, /aria-label="Primary navigation"/);
});
