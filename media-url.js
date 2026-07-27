(function mediaUrlModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MotogripMediaUrl = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMediaUrlApi() {
  const FALLBACK = '/assets/generated/leather-detail.png';
  const PUBLIC_PREFIXES = Object.freeze(['/assets/', '/uploads/', '/product-editor-media/', '/category-media/']);

  function decodedSegment(segment) {
    let value = segment;
    for (let pass = 0; pass < 2; pass += 1) {
      try {
        const decoded = decodeURIComponent(value);
        if (decoded === value) break;
        value = decoded;
      } catch { break; }
    }
    return value;
  }

  function encodePath(pathname) {
    return pathname.split('/').map((segment) => segment ? encodeURIComponent(decodedSegment(segment)) : '').join('/');
  }

  function canonicalMediaUrl(value, options = {}) {
    const fallback = options.fallback === null ? '' : String(options.fallback || FALLBACK);
    const source = String(value || '').trim().replaceAll('\\', '/');
    if (!source || /^(?:file|data|javascript):/i.test(source)) return fallback;
    if (/^https:\/\//i.test(source)) {
      try { return new URL(source).href; } catch { return fallback; }
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(source) || source.startsWith('//')) return fallback;
    const withoutQuery = source.split(/[?#]/, 1)[0].replace(/^\/+/, '');
    const segments = withoutQuery.split('/').filter(Boolean);
    if (!segments.length || segments.some((segment) => {
      const decoded = decodedSegment(segment);
      return decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\');
    })) return fallback;
    const pathname = `/${segments.join('/')}`;
    if (!PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return fallback;
    return encodePath(pathname);
  }

  return { FALLBACK, PUBLIC_PREFIXES, canonicalMediaUrl };
}));
