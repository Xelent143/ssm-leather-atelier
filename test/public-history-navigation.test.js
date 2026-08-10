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
    const setRouteIndex = source.indexOf('setRoute({ view: v, params: p });', goStart);
    const viewUpdateIndex = [setViewIndex, setRouteIndex].filter((index) => index > pushIndex).sort((a, b) => a - b)[0];
    assert.ok(goStart >= 0 && pushIndex > goStart && viewUpdateIndex > pushIndex,
      'go() must create the browser-history entry before updating the React view');
  });
}

for (const relativePath of ['ssm-home.jsx', 'index.html']) {
  test(`${relativePath} preserves native new-tab behavior on product cards`, () => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');

    assert.match(source, /<a href=\{`\/products\/\$\{product\.slug\}`\} className="card" style=\{\{ cursor: 'pointer', display: 'block' \}\}>/);
    assert.match(source, /e\.preventDefault\(\); e\.stopPropagation\(\); onQuickView\(product\);/);
  });
}
