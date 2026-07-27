const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalMediaUrl, FALLBACK } = require('../media-url');

test('canonical media URLs are rooted, encoded once and slash-normalized', () => {
  assert.equal(canonicalMediaUrl('assets/generated/dean front.png'), '/assets/generated/dean%20front.png');
  assert.equal(canonicalMediaUrl('/assets/generated/dean%20front.png'), '/assets/generated/dean%20front.png');
  assert.equal(canonicalMediaUrl('/assets//generated///dean.png'), '/assets/generated/dean.png');
  assert.equal(canonicalMediaUrl('assets/generated/dean%2520front.png'), '/assets/generated/dean%20front.png');
});

test('canonical media URLs preserve approved runtime and HTTPS sources', () => {
  assert.equal(
    canonicalMediaUrl('/product-editor-media/123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001.webp'),
    '/product-editor-media/123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001.webp',
  );
  assert.equal(canonicalMediaUrl('https://images.example.com/dean%20front.jpg'), 'https://images.example.com/dean%20front.jpg');
});

test('canonical media URLs reject traversal, local files and unsafe protocols', () => {
  for (const value of [
    '../data/secret.json',
    '/assets/%2e%2e/secret.json',
    '/assets/%252e%252e/secret.json',
    'file:///app/data/product-editor-v2.json',
    '/app/data/product-editor-media/image.png',
    'javascript:alert(1)',
    'data:image/svg+xml,<svg></svg>',
    'http://images.example.com/dean.jpg',
    '//images.example.com/dean.jpg',
  ]) assert.equal(canonicalMediaUrl(value), FALLBACK);
});

test('admin and Product Editor load the shared resolver before rendering media', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'product-editor-v2-ui.js'), 'utf8');
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.ok(html.indexOf('/media-url.js') < html.indexOf('/product-editor-v2-ui.js'));
  assert.match(editor, /MotogripMediaUrl\.canonicalMediaUrl/);
  assert.match(server, /canonicalMediaUrl\(imagePath/);
  assert.doesNotMatch(editor, /<img src="\\?\$\{esc\(item\.path\)\}/);
});
