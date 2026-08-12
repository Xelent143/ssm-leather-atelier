const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const {
  orderDraftFromItems,
  verifyStripeWebhookSignature,
} = require('../server');

test('order drafts preserve validated product selections and totals', () => {
  const draft = orderDraftFromItems([{
    baseId: 'p1', slug: 'black-jacket', sku: 'MG-P1', name: 'Black Leather Jacket',
    description: 'Size: M · Fit: Standard', quantity: 2, unitAmount: 22000,
    size: 'M', inseam: '', leather: 'Lambskin', color: 'Black', collarColor: '', fitMode: 'standard',
  }], 'stripe', 'cs_test_order');

  assert.match(draft.id, /^MG-[A-Z0-9-]+$/);
  assert.equal(draft.provider, 'stripe');
  assert.equal(draft.providerOrderId, 'cs_test_order');
  assert.equal(draft.status, 'pending');
  assert.equal(draft.paymentStatus, 'pending');
  assert.equal(draft.items, 2);
  assert.equal(draft.total, 440);
  assert.equal(draft.lines[0].size, 'M');
  assert.equal(draft.lines[0].color, 'Black');
});

test('Stripe webhook signatures accept the signed payload and reject tampering', () => {
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
  const secret = 'whsec_test_secret';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const header = `t=${timestamp},v1=${signature}`;

  assert.equal(verifyStripeWebhookSignature(Buffer.from(payload), header, secret), true);
  assert.equal(verifyStripeWebhookSignature(Buffer.from(`${payload} `), header, secret), false);
});

test('checkout and admin UI expose the real order flow', () => {
  const storefront = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  assert.match(storefront, /\/api\/\$\{paymentProvider\}\/checkout/);
  assert.match(storefront, /\/api\/stripe\/confirm/);
  assert.match(admin, /Payment/);
  assert.match(admin, /order\.paymentStatus/);
});
