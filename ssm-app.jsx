// Root app — routing + state + tweaks panel + page-level SEO.
//
// Routing is React state (`view` + `params`) — kept this way so the prototype
// continues to work without a build step. The exported `go(view, params)`
// scrolls to top, syncs the URL hash so a refresh keeps you on the page, and
// updates document.title from SSM_SEO. All inner pages are wired here.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "light",
  "hero": "fullbleed",
  "displayFont": "serif",
  "showAtelier": true,
  "showLookbook": true,
  "showPress": true,
  "accentBoost": false
}/*EDITMODE-END*/;

// SSM_SEO comes from ssm-data.jsx
const SSM_INITIAL_ROUTE = window.__SSM_INITIAL_ROUTE__ || null;
const SSM_PRODUCT_OVERRIDE = window.__SSM_PRODUCT_OVERRIDE__ || null;
const productFromSlug = (slug) => {
  const product = SSM_PRODUCTS.find(p => p.slug === slug) || null;
  if (SSM_PRODUCT_OVERRIDE?.slug !== slug) return product;
  if (!product) return SSM_PRODUCT_OVERRIDE.product || null;
  return {
    ...product,
    ...(SSM_PRODUCT_OVERRIDE.product || {}),
    name: SSM_PRODUCT_OVERRIDE.title || product.name,
    publicDescription: SSM_PRODUCT_OVERRIDE.product?.publicDescription ||
      SSM_PRODUCT_OVERRIDE.description || product.publicDescription || '',
  };
};
const articleFromParams = (params = {}) => params.article
  || SSM_JOURNAL.find(article => article.id === params.articleId)
  || null;
const pathProductSlug = () => {
  const match = window.location.pathname.match(/^\/products\/([a-z0-9-]+)\/?$/);
  return match ? match[1] : null;
};
const SSM_VIEW_PATHS = {
  home: '/', shop: '/shop', mto: '/made-to-measure', lookbook: '/lookbook', about: '/brand',
  account: '/account', checkout: '/checkout', journal: '/blog', care: '/leather-care', repairs: '/repairs',
  concierge: '/custom-consultation', consult: '/custom-consultation', sustain: '/sustainability', stockists: '/stockists', press: '/press',
  giftcard: '/gift-cards', faq: '/faq', size: '/size-guide', ship: '/shipping-information',
  returns: '/returns-refunds', 'file-return': '/file-a-return', track: '/track-order', privacy: '/privacy',
  terms: '/terms', contact: '/contact',
};
const cleanPathForView = (view, params = {}) => {
  if (view === 'pdp' && params?.product?.slug) return `/products/${params.product.slug}`;
  if (view === 'article') {
    const article = articleFromParams(params);
    if (article?.id) return `/blog/${article.id}`;
  }
  if (view === 'shop' && params?.gender === 'Women') return '/women';
  if (view === 'shop' && params?.gender === 'Men') return '/men';
  if (view === 'shop' && params?.cat === 'Jackets') return '/jackets';
  if (view === 'shop' && params?.cat === 'Vests') return '/vests';
  if (view === 'shop' && params?.cat === 'Pants') return '/pants';
  return SSM_VIEW_PATHS[view] || '/';
};

function applySEO(view, params) {
  const seo = (view === 'shop' && params?.gender === 'Women') ? SSM_SEO.shopWomen
    : (view === 'shop' && params?.gender === 'Men') ? SSM_SEO.shopMen
    : SSM_SEO[view] || SSM_SEO.home;
  let title = seo?.title || 'MOTOGRIP GEAR — Road-Cut Leather Jackets & Moto Gear';
  let desc  = seo?.desc  || '';
  if (view === 'pdp') {
    const p = params?.product || SSM_PRODUCTS[0];
    if (p.factualProjection) {
      title = p.seoTitle || `${p.name} | MOTOGRIP GEAR`;
      desc = (p.metaDescription || p.blurb || '').slice(0, 320);
    } else {
      title = SSM_SEO.pdp.title
        .replace('%name%', p.name)
        .replace('%cat%', p.cat)
        .replace('%gender%', p.gender);
      desc = (p.story?.piece || p.blurb || '').slice(0, 158);
    }
  }
  if (view === 'article') {
    const article = articleFromParams(params);
    if (article) {
      title = article.seoTitle || `${article.title} | MOTOGRIP GEAR`;
      desc = article.metaDescription || article.dek || '';
    }
  }
  document.title = title;
  let m = document.querySelector('meta[name="description"]');
  if (!m) {
    m = document.createElement('meta'); m.setAttribute('name', 'description');
    document.head.appendChild(m);
  }
  m.setAttribute('content', desc || 'Premium motorcycle leather jackets, vests, and trousers with made-to-measure fit options.');
  const canonicalUrl = `${window.location.origin}${cleanPathForView(view, params)}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', canonicalUrl);
}

function metaCheckoutFromUrl() {
  const query = new URLSearchParams(window.location.search);
  const rawProducts = query.get('products');
  if (!rawProducts) return { requested: false, items: [], coupon: '' };

  const items = rawProducts.split(',').slice(0, 20).flatMap((entry, index) => {
    const separator = entry.lastIndexOf(':');
    if (separator < 1) return [];

    const variantId = entry.slice(0, separator).trim().toUpperCase();
    const quantity = Math.min(10, Math.max(1, Number.parseInt(entry.slice(separator + 1), 10) || 1));
    const match = SSM_PRODUCTS.find((product) => {
      const sku = `MG-${String(product.id || '').toUpperCase()}`;
      const sizes = product.sizes || Object.keys(product.stock || {});
      return sizes.some((size) => `${sku}-${String(size).toUpperCase()}` === variantId);
    });
    if (!match) return [];

    const sku = `MG-${String(match.id).toUpperCase()}`;
    const sizes = match.sizes || Object.keys(match.stock || {});
    const size = sizes.find((candidate) => `${sku}-${String(candidate).toUpperCase()}` === variantId);
    if (!size) return [];

    const selectedColor = (match.colors || []).find((color) => color.id === match.defaultColor);
    const selectedCollar = (match.collarColors || []).find((color) => color.id === match.defaultCollarColor);
    return [{
      baseId: match.id,
      id: `${match.id}-meta-${index}`,
      name: match.name,
      price: match.price,
      basePrice: match.price,
      surcharge: 0,
      qty: quantity,
      img: match.img,
      leather: match.material || 'Genuine leather',
      size,
      productColor: selectedColor?.name || null,
      collarColor: selectedCollar?.name || null,
      fitMode: 'standard',
      fitLabel: null,
      measurements: null,
    }];
  });

  return { requested: true, items, coupon: (query.get('coupon') || '').trim().slice(0, 80) };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState(() => {
    const initialSlug = SSM_INITIAL_ROUTE?.productSlug || pathProductSlug();
    if (initialSlug && productFromSlug(initialSlug)) return 'pdp';
    if (SSM_INITIAL_ROUTE?.view) return SSM_INITIAL_ROUTE.view;
    // Resume from hash on refresh.
    const h = (window.location.hash || '').replace(/^#\/?/, '').split('/')[0];
    return h && ['home','shop','pdp','mto','lookbook','about','account','checkout',
      'journal','article','care','repairs','concierge','sustain','stockists',
      'press','giftcard','faq','size','ship','returns','file-return','track','privacy','terms','consult','contact','search','notfound'
    ].includes(h) ? h : 'home';
  });
  const [params, setParams] = React.useState(() => {
    const initialSlug = SSM_INITIAL_ROUTE?.productSlug || pathProductSlug();
    const product = initialSlug ? productFromSlug(initialSlug) : null;
    return product ? { product } : (SSM_INITIAL_ROUTE?.params || {});
  });
  const [cart, setCart] = React.useState(() => {
    const metaCheckout = metaCheckoutFromUrl();
    if (metaCheckout.requested) return metaCheckout.items;
    try {
      const raw = window.localStorage && localStorage.getItem('ssm:cart');
      if (raw) {
        const saved = JSON.parse(raw);
        const activeIds = new Set(SSM_PRODUCTS.map((product) => product.id));
        return Array.isArray(saved) ? saved.filter((item) => activeIds.has(item.id)) : [];
      }
    } catch (_) {}
    return [];
  });
  const [cartOpen, setCartOpen] = React.useState(false);
  const [quickView, setQuickView] = React.useState(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Persist cart
  React.useEffect(() => {
    try { window.localStorage && localStorage.setItem('ssm:cart', JSON.stringify(cart)); } catch (_) {}
  }, [cart]);

  // SEO sync
  React.useEffect(() => { applySEO(view, params); }, [view, params]);

  // URL sync uses one clean, crawlable path for every public page.
  React.useEffect(() => {
    const path = cleanPathForView(view, params);
    if (window.location.pathname !== path || window.location.hash) window.history.replaceState(null, '', path);
  }, [view, params]);

  const go = (v, p = {}) => {
    setView(v);
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Cart merging — same product + size + leather + fit selection increments qty.
  const addToCart = (product, opts) => {
    setCart(prev => {
      const measurementSig = (m) => m ? Object.entries(m).map(([k, v]) => `${k}:${v || ''}`).join('|') : '';
      const sig = (it) => `${it.baseId || it.id.split('-')[0]}|${it.size}|${it.leather}|${it.fitMode || 'standard'}|${measurementSig(it.measurements)}`;
      const incoming = {
        baseId: product.id,
        id: product.id + '-' + Date.now(),
        name: product.name,
        price: opts.price ?? (product.price + (opts.surcharge || 0)),
        basePrice: product.price,
        surcharge: opts.surcharge || 0,
        qty: 1,
        img: product.img,
        leather: opts.leather, size: opts.size,
        fitMode: opts.fitMode || 'standard',
        fitLabel: opts.fitLabel || null,
        measurements: opts.measurements || null,
      };
      const idx = prev.findIndex(it => sig(it) === sig(incoming));
      if (idx > -1) {
        return prev.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...prev, incoming];
    });
    setCartOpen(true);
  };

  // Search submit
  const submitSearch = (q) => {
    setSearchQuery(q);
    setSearchOpen(false);
    go('search', {});
  };

  const themeClass =
    (t.palette === 'dark' ? 'theme-dark ' : t.palette === 'heritage' ? 'theme-heritage ' : 'theme-light ') +
    'font-' + t.displayFont;

  return (
    <div className={themeClass} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Header go={go} view={view}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        cartCount={cart.reduce((n, it) => n + it.qty, 0)} />

      {view === 'home' && <Home go={go} onQuickView={setQuickView} heroVariant={t.hero} />}
      {view === 'shop' && <Shop go={go} onQuickView={setQuickView} initialGender={params.gender} initialCat={params.cat} />}
      {view === 'pdp' && <PDP product={params.product} go={go} addToCart={addToCart} onQuickView={setQuickView} />}
      {view === 'mto' && <MTO go={go} startWith={params.startWith} addToCart={addToCart} />}
      {view === 'lookbook' && <Lookbook go={go} />}
      {view === 'about' && <About go={go} />}
      {view === 'account' && <Account go={go} />}
      {view === 'checkout' && <Checkout go={go} items={cart} setItems={setCart} />}
      {view === 'journal' && <Journal go={go} />}
      {view === 'article' && <JournalArticle go={go} article={articleFromParams(params)} />}
      {view === 'care' && <Care go={go} />}
      {view === 'repairs' && <Repairs go={go} />}
      {view === 'concierge' && <Concierge go={go} />}
      {view === 'sustain' && <Sustainability go={go} />}
      {view === 'stockists' && <Stockists go={go} />}
      {view === 'press' && <Press go={go} />}
      {view === 'giftcard' && <GiftCards go={go} />}
      {view === 'faq' && <FAQ go={go} />}
      {view === 'size' && <SizeGuide go={go} />}
      {view === 'ship' && <ShippingReturns go={go} mode="shipping" />}
      {view === 'returns' && <ShippingReturns go={go} mode="returns" />}
      {view === 'file-return' && <FileReturn go={go} />}
      {view === 'track' && <TrackOrder go={go} />}
      {view === 'privacy' && <LegalPage kind="privacy" go={go} />}
      {view === 'terms' && <LegalPage kind="terms" go={go} />}
      {view === 'contact' && <Contact go={go} />}
      {view === 'search' && <SearchResults go={go} query={searchQuery} onQuickView={setQuickView} />}
      {view === 'notfound' && <NotFound go={go} />}

      <Footer go={go} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)}
        items={cart} setItems={setCart} go={go} />
      <QuickView product={quickView} onClose={() => setQuickView(null)} addToCart={addToCart} go={go} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSubmit={submitSearch} />

      <TweaksPanel title="MOTOGRIP · Tweaks">
        <TweakSection label="Palette" />
        <TweakRadio label="Theme" value={t.palette}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'heritage', label: 'Heritage' },
          ]}
          onChange={v => setTweak('palette', v)} />

        <TweakSection label="Hero Layout" />
        <TweakRadio label="Variant" value={t.hero}
          options={[
            { value: 'fullbleed', label: 'Bleed' },
            { value: 'editorial-split', label: 'Split' },
            { value: 'centered-type', label: 'Type' },
          ]}
          onChange={v => setTweak('hero', v)} />

        <TweakSection label="Typography" />
        <TweakRadio label="Display" value={t.displayFont}
          options={[
            { value: 'serif', label: 'Serif' },
            { value: 'sans', label: 'Sans' },
            { value: 'mono', label: 'Mono' },
          ]}
          onChange={v => setTweak('displayFont', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
