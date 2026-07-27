const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const editor = fs.readFileSync(path.join(root, 'product-editor-v2-ui.js'), 'utf8');
const taxonomy = fs.readFileSync(path.join(root, 'category-taxonomy-service.js'), 'utf8');

test('Commerce navigation separates Product Management, Add Product, Catalog Review and Legacy Product Manager', () => {
  assert.match(admin, /'Product Management', '\/admin\/products'/);
  assert.match(admin, /'Add Product', '\/admin\/product-editor\/new'/);
  assert.match(admin, /'Catalog Review', '\/admin\/catalog\/review'/);
  assert.match(admin, /'Legacy Product Manager', '\/admin\/products\/current'/);
});

test('Product Management exposes row selection, actions and the visible bulk toolbar', () => {
  for (const marker of [
    'product-grid-select-page', 'data-grid-select=', 'Create new revision',
    'data-grid-action="duplicate"', 'data-grid-action="archive"',
    'data-grid-action="hide"', 'data-grid-action="restore"',
    'View activity', 'View history', 'Bulk inventory', 'Bulk price',
    'Bulk tags', 'Bulk collections',
  ]) assert.match(admin, new RegExp(marker));
});

test('Category Management exposes hierarchy controls, reconciliation and role-aware actions', () => {
  for (const marker of [
    'taxonomy-reconciliation', 'data-category-select=', 'Add subcategory',
    '>Move<', '>Reorder<', '>View products<', '>Activity<',
    '>Sync history<', '>Safe delete<', 'Move to parent',
  ]) assert.match(admin, new RegExp(marker));
  for (const field of [
    'sourceCount', 'importedCount', 'deduplicatedCount', 'rootCount',
    'childCount', 'needsReviewCount', 'failedCount', 'assignmentCount',
    'importedNames',
  ]) assert.match(taxonomy, new RegExp(field));
});

test('Product Editor uses searchable synchronized taxonomy rather than placeholders', () => {
  assert.match(editor, /list="pe-taxonomy-options"/);
  assert.match(editor, /placeholder="Select synced category"/);
  assert.match(editor, /item\.hierarchyPath/);
  assert.match(editor, /Category Manager assignments/);
});

test('permission SSE refreshes permission-sensitive product and category workspaces', () => {
  assert.match(admin, /message\.type === 'permissions\.updated'/);
  assert.match(admin, /await refreshProductGrid\(\)/);
  assert.match(admin, /state\.taxonomy = await api\('\/api\/admin\/categories'\)/);
});
