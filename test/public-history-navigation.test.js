const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const publicAppCopies = ['ssm-app.jsx', 'index.html'];

for (const relativePath of publicAppCopies) {
  test(`${relativePath} preserves public navigation history`, () => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');

    assert.match(source, /const SSM_HISTORY_MARKER = 'motogrip-spa-route';/);
    assert.match(source, /window\.history\.pushState\(nextState, '', path\);/);
    assert.match(source, /window\.addEventListener\('popstate', onPopState\);/);
    assert.match(source, /window\.removeEventListener\('popstate', onPopState\);/);
    assert.doesNotMatch(source, /window\.history\.replaceState\(null, '', path\);/);

    const goStart = source.indexOf('const go = (v, p = {}) => {');
    const pushIndex = source.indexOf("window.history.pushState(nextState, '', path);", goStart);
    const setViewIndex = source.indexOf('setView(v);', goStart);
    assert.ok(goStart >= 0 && pushIndex > goStart && setViewIndex > pushIndex,
      'go() must create the browser-history entry before updating the React view');
  });
}
