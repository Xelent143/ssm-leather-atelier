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
const productFromSlug = (slug) => SSM_PRODUCTS.find(p => p.slug === slug) || null;
const pathProductSlug = () => {
  const match = window.location.pathname.match(/^\/products\/([a-z0-9-]+)\/?$/);
  return match ? match[1] : null;
};

function applySEO(view, params) {
  const seo = (view === 'shop' && params?.gender === 'Women') ? SSM_SEO.shopWomen
    : (view === 'shop' && params?.gender === 'Men') ? SSM_SEO.shopMen
    : SSM_SEO[view] || SSM_SEO.home;
  let title = seo?.title || 'MOTOGRIP GEAR — Road-Cut Leather Jackets & Moto Gear';
  let desc  = seo?.desc  || '';
  if (view === 'pdp') {
    const p = params?.product || SSM_PRODUCTS[0];
    title = SSM_SEO.pdp.title
      .replace('%name%', p.name)
      .replace('%cat%', p.cat)
      .replace('%gender%', p.gender);
    desc = (p.story?.piece || p.blurb || '').slice(0, 158);
  }
  if (view === 'article' && params?.article) {
    title = `${params.article.title} · MOTOGRIP Road Notes`;
    desc = params.article.dek || '';
  }
  document.title = title;
  let m = document.querySelector('meta[name="description"]');
  if (!m) {
    m = document.createElement('meta'); m.setAttribute('name', 'description');
    document.head.appendChild(m);
  }
  m.setAttribute('content', desc || 'Premium motorcycle leather jackets, vests, and trousers with made-to-measure fit options.');
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState(() => {
    const initialSlug = SSM_INITIAL_ROUTE?.productSlug || pathProductSlug();
    if (initialSlug && productFromSlug(initialSlug)) return 'pdp';
    // Resume from hash on refresh.
    const h = (window.location.hash || '').replace(/^#\/?/, '').split('/')[0];
    return h && ['home','shop','pdp','mto','lookbook','about','account','checkout',
      'journal','article','care','repairs','concierge','sustain','stockists',
      'press','giftcard','faq','size','ship','contact','search','notfound'
    ].includes(h) ? h : 'home';
  });
  const [params, setParams] = React.useState(() => {
    const initialSlug = SSM_INITIAL_ROUTE?.productSlug || pathProductSlug();
    const product = initialSlug ? productFromSlug(initialSlug) : null;
    return product ? { product } : {};
  });
  const [cart, setCart] = React.useState(() => {
    try {
      const raw = window.localStorage && localStorage.getItem('ssm:cart');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [
      { id: 'p2', name: 'Hadley Café Racer', price: 1180, qty: 1, leather: 'Tobacco', size: 'M', img: SSM_PRODUCTS[1].img },
    ];
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

  // URL sync (product pages use crawlable paths; legacy pages keep hash routes)
  React.useEffect(() => {
    if (view === 'pdp' && params?.product?.slug) {
      const path = `/products/${params.product.slug}`;
      if (window.location.pathname !== path) window.history.replaceState(null, '', path);
      return;
    }
    const h = '#/' + view;
    if (window.location.hash !== h) window.history.replaceState(null, '', h);
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
      {view === 'article' && <JournalArticle go={go} article={params.article} />}
      {view === 'care' && <Care go={go} />}
      {view === 'repairs' && <Repairs go={go} />}
      {view === 'concierge' && <Concierge go={go} />}
      {view === 'sustain' && <Sustainability go={go} />}
      {view === 'stockists' && <Stockists go={go} />}
      {view === 'press' && <Press go={go} />}
      {view === 'giftcard' && <GiftCards go={go} />}
      {view === 'faq' && <FAQ go={go} />}
      {view === 'size' && <SizeGuide go={go} />}
      {view === 'ship' && <ShippingReturns go={go} />}
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
