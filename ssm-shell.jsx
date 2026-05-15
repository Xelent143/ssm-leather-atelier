// Header, Footer, Cart Drawer, QuickView, Search Overlay — chrome shared
// across all pages. Adds a working search overlay, a mobile hamburger menu,
// a footer with real link wiring, and a small "Estimated delivery" note in
// the bag drawer.

function MotoGripLogo({ compact = false }) {
  const logoHeight = compact ? 34 : 52;
  return (
    <img
      src="/assets/motogrip-logo-site.png"
      alt="MOTOGRIP GEAR"
      style={{
        display: 'block',
        height: logoHeight,
        width: 'auto',
        maxWidth: compact ? 154 : 250,
        objectFit: 'contain',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function Header({ go, view, onCartClick, onSearchClick, cartCount }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  React.useEffect(() => { setMobileOpen(false); }, [view]);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'var(--chrome-bg)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'auto 1fr auto' : '1fr auto 1fr',
        alignItems: 'center',
        padding: isMobile ? '14px 20px' : '18px 48px',
        gap: isMobile ? 16 : 32,
      }}>
        {/* LEFT: nav (desktop) or hamburger (mobile) */}
        {isMobile ? (
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--fg)', cursor: 'pointer' }}>
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 1h22M0 7h22M0 13h22"/>
            </svg>
          </button>
        ) : (
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {SSM_NAV.map(n => (
              <button key={n.label} onClick={() => go(n.view, n.filter ? { gender: n.filter } : null)}
                className="ulink"
                style={{
                  fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--fg-2)', fontWeight: 500,
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                }}>{n.label}</button>
            ))}
          </nav>
        )}

        {/* CENTER: logo */}
        <button onClick={() => go('home')} aria-label="MOTOGRIP GEAR Home"
          style={{ cursor: 'pointer', textAlign: 'center', background: 'transparent', border: 0, padding: 0, color: 'var(--fg)' }}>
          <MotoGripLogo compact={isMobile} />
        </button>

        {/* RIGHT: actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: isMobile ? 14 : 22, alignItems: 'center' }}>
          <button onClick={onSearchClick} aria-label="Search"
            style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--fg-2)', cursor: 'pointer', display: 'inline-flex' }}>
            <Icon name="search" />
          </button>
          {!isMobile && (
            <button onClick={() => go('account')} className="ulink mono"
              style={{ fontSize: 10, color: 'var(--fg-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
              Account
            </button>
          )}
          <button onClick={onCartClick} className="ulink mono"
            style={{ fontSize: 10, color: 'var(--fg-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
            aria-label={`Bag, ${cartCount} items`}>
            Bag · {cartCount}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="page-fade" style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'var(--bg)', padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <MotoGripLogo compact />
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
              style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--fg)', cursor: 'pointer' }}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {SSM_NAV.map(n => (
              <button key={n.label} onClick={() => go(n.view, n.filter ? { gender: n.filter } : null)}
                style={{
                  textAlign: 'left', padding: '20px 0', borderBottom: '1px solid var(--line)',
                  fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400,
                  color: 'var(--fg)', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line)', cursor: 'pointer',
                }}>{n.label}</button>
            ))}
            <button onClick={() => go('account')} style={{
              textAlign: 'left', padding: '20px 0', borderBottom: '1px solid var(--line)',
              fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400,
              color: 'var(--fg)', background: 'transparent', cursor: 'pointer',
            }}>Account</button>
          </nav>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { l: 'Care', v: 'care' },
              { l: 'Repairs', v: 'repairs' },
              { l: 'Concierge', v: 'concierge' },
              { l: 'FAQ', v: 'faq' },
              { l: 'Contact', v: 'contact' },
            ].map(it => (
              <button key={it.v} onClick={() => go(it.v)} className="mono"
                style={{ textAlign: 'left', fontSize: 11, color: 'var(--fg-3)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                {it.l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function Icon({ name, size = 16 }) {
  const icons = {
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
    arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
    close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 6l12 12M18 6l-12 12"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 5v14M5 12h14"/></svg>,
    minus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 12h14"/></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.5 1 4 2 .5-1 2-2 4-2 3.5 0 5 4 3.5 7-2.5 4.5-9 9-9 9z"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12l5 5L20 7"/></svg>,
  };
  return <span style={{ display: 'inline-flex', width: size, height: size, color: 'currentColor', cursor: 'inherit' }}>{icons[name]}</span>;
}

function CartDrawer({ open, onClose, items, setItems, go }) {
  const [promo, setPromo] = React.useState('');
  if (!open) return null;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const updateQty = (idx, delta) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };
  const remove = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // est. delivery — 2 working days from now, ish
  const eta = new Date();
  eta.setDate(eta.getDate() + 4);
  const etaStr = eta.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div className="drawer-overlay" onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div className="drawer" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(460px, 100vw)',
        background: 'var(--bg-2)', borderLeft: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>Your Bag · {items.length}</div>
          <button onClick={onClose} aria-label="Close bag"
            style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--fg)', cursor: 'pointer' }}><Icon name="close" /></button>
        </div>

        {items.length > 0 && (
          <div className="mono" style={{
            fontSize: 9, color: 'var(--accent-2)', padding: '12px 32px',
            borderBottom: '1px solid var(--line)', background: 'rgba(176,138,76,0.04)',
            letterSpacing: '0.18em',
          }}>
            ESTIMATED DELIVERY · {etaStr.toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 32px' }}>
          {items.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>The bag is empty.</div>
              <div className="mono" style={{ fontSize: 10, marginBottom: 24 }}>BEGIN WITH A PIECE</div>
              <button className="btn" onClick={() => { onClose(); go('shop'); }}>Browse Gear</button>
            </div>
          ) : items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="ph" data-img={item.img ? "1" : null} data-label={item.name.toUpperCase()}
                style={{ width: 100, height: 130, flexShrink: 0, '--img': item.img ? `url(${item.img})` : null }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{item.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>
                  {item.leather} · SIZE {item.size}
                </div>
                {item.fitLabel && (
                  <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginTop: 5 }}>
                    {item.fitLabel.toUpperCase()}{item.surcharge ? ` · +$${item.surcharge}` : ''}
                  </div>
                )}
                {item.measurements && Object.values(item.measurements).some(Boolean) && (
                  <div className="mono" style={{ fontSize: 8, color: 'var(--fg-4)', marginTop: 5, lineHeight: 1.6 }}>
                    {Object.entries(item.measurements)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${v}`)
                      .join(' · ')}
                  </div>
                )}
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--line)', padding: '6px 10px' }}>
                    <button onClick={() => updateQty(idx, -1)} aria-label="Decrease"
                      style={{ display: 'inline-flex', background: 'transparent', border: 0, padding: 0, color: 'var(--fg)', cursor: 'pointer' }}>
                      <Icon name="minus" size={12} />
                    </button>
                    <span style={{ fontSize: 11, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(idx, 1)} aria-label="Increase"
                      style={{ display: 'inline-flex', background: 'transparent', border: 0, padding: 0, color: 'var(--fg)', cursor: 'pointer' }}>
                      <Icon name="plus" size={12} />
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>${(item.price * item.qty).toLocaleString()}</div>
                </div>
                <button onClick={() => remove(idx)} className="mono ulink"
                  style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 8, alignSelf: 'flex-start',
                    background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--line)', background: 'var(--bg-3)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={promo} onChange={e => setPromo(e.target.value)}
                placeholder="Fit note (optional)"
                style={{ flex: 1, background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', padding: '8px 0',
                  color: 'var(--fg)', fontFamily: 'var(--mono)', fontSize: 11, outline: 'none' }} />
              <button className="mono ulink"
                style={{ fontSize: 10, color: 'var(--fg-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                Apply →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 22 }}>${subtotal.toLocaleString()}</span>
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 16 }}>
              Complimentary shipping · Duties calculated at checkout
            </div>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onClose(); go('checkout'); }}>
              Proceed to Checkout <Icon name="arrow" size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickView({ product, onClose, addToCart, go }) {
  const [leather, setLeather] = React.useState(SSM_LEATHERS[0].id);
  const [size, setSize] = React.useState('M');
  if (!product) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div className="drawer-overlay" onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      <div className="page-fade" style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 880, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        overflow: 'auto',
      }}>
        <div className="ph grain" data-img="1" data-label=""
          style={{ minHeight: 540, '--img': `url(${product.img})` }} />
        <div style={{ padding: 36, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <button onClick={onClose} aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 0, padding: 4, color: 'var(--fg)', cursor: 'pointer' }}>
            <Icon name="close" />
          </button>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 8 }}>{product.cat.toUpperCase()} · {product.gender.toUpperCase()}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.1, marginBottom: 8 }}>{product.name}</div>
          <div style={{ color: 'var(--fg-3)', fontSize: 13, marginBottom: 20 }}>{product.blurb}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26, marginBottom: 28 }}>${product.price.toLocaleString()}</div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 10 }}>Leather · {SSM_LEATHERS.find(l => l.id === leather)?.name}</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {SSM_LEATHERS.map(l => (
              <button key={l.id} className={`swatch ${leather === l.id ? 'active' : ''}`}
                aria-label={l.name} title={l.name}
                style={{ background: l.swatch, padding: 0 }} onClick={() => setLeather(l.id)} />
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 10 }}>Size</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {['XS','S','M','L','XL'].map(s => (
              <button key={s} onClick={() => setSize(s)} aria-label={`Size ${s}`}
                style={{
                  width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${size === s ? 'var(--fg)' : 'var(--line-2)'}`,
                  background: size === s ? 'var(--fg)' : 'transparent',
                  color: size === s ? 'var(--bg)' : 'var(--fg-2)',
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}>{s}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { addToCart(product, { leather: SSM_LEATHERS.find(l=>l.id===leather).name, size }); onClose(); }}>
              Add to Bag
            </button>
            <button className="btn btn-ghost" onClick={() => { onClose(); go && go('pdp', { product }); }}>Full Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose, onSubmit }) {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ('');
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e?.preventDefault?.();
    if (q.trim()) onSubmit(q.trim());
  };

  const suggestions = ['Biker jacket', 'Cafe racer', 'Made to measure', 'Trousers', 'Road armor'];

  return (
    <div className="page-fade" style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'var(--chrome-bg)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 32px' }}>
        <button onClick={onClose} aria-label="Close search"
          style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--fg)', cursor: 'pointer' }}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24, letterSpacing: '0.4em' }}>
          MOTOGRIP GEAR · SEARCH
        </div>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 720 }}>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="A name, a hide, a piece"
            style={{
              width: '100%', padding: '20px 0', background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--line-2)', color: 'var(--fg)',
              fontFamily: 'var(--display)', fontSize: 'clamp(28px, 4vw, 48px)',
              textAlign: 'center', outline: 'none',
            }} />
        </form>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => { setQ(s); onSubmit(s); }} className="mono"
              style={{
                fontSize: 10, padding: '10px 16px', background: 'transparent',
                border: '1px solid var(--line-2)', color: 'var(--fg-2)',
                cursor: 'pointer', letterSpacing: '0.18em',
              }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer({ go }) {
  const cols = [
    { h: 'Fit Lab', items: [
      { l: 'Made to Measure', go: () => go('mto') },
      { l: 'Custom / Concierge', go: () => go('concierge') },
      { l: 'Leather Care', go: () => go('care') },
      { l: 'Repairs & Restoration', go: () => go('repairs') },
    ] },
    { h: 'Shop', items: [
      { l: 'Women', go: () => go('shop', { gender: 'Women' }) },
      { l: 'Men', go: () => go('shop', { gender: 'Men' }) },
      { l: 'Jackets', go: () => go('shop', { cat: 'Jackets' }) },
      { l: 'Vests', go: () => go('shop', { cat: 'Vests' }) },
      { l: 'Pants', go: () => go('shop', { cat: 'Pants' }) },
      { l: 'Gift Cards', go: () => go('giftcard') },
    ] },
    { h: 'Brand', items: [
      { l: 'Heritage', go: () => go('about') },
      { l: 'Workshop', go: () => go('about') },
      { l: 'Lookbook', go: () => go('lookbook') },
      { l: 'Journal', go: () => go('journal') },
      { l: 'Press', go: () => go('press') },
      { l: 'Sustainability', go: () => go('sustain') },
    ] },
    { h: 'Service', items: [
      { l: 'Concierge', go: () => go('concierge') },
      { l: 'Shipping & Returns', go: () => go('ship') },
      { l: 'Size Guide', go: () => go('size') },
      { l: 'Stockists', go: () => go('stockists') },
      { l: 'FAQ', go: () => go('faq') },
      { l: 'Contact', go: () => go('contact') },
    ] },
  ];

  return (
    <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '64px 48px 32px', marginTop: 80 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48, marginBottom: 56,
      }}>
        <div>
          <div style={{ marginBottom: 16 }}><MotoGripLogo /></div>
          <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7, maxWidth: 320, marginBottom: 24 }}>
            Road-cut leather gear with measured fit, reinforced hardware, and made-to-measure options for riders who notice the details.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" placeholder="Email for road notes"
              aria-label="Email for road notes"
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-2)',
                padding: '10px 0', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }} />
            <button className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
              Subscribe →
            </button>
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 12, lineHeight: 1.7, maxWidth: 320 }}>
            NEW DROPS · FIT NOTES · PRODUCT TESTS · UNSUBSCRIBE ANY TIME
          </div>
        </div>
        {cols.map(col => (
          <div key={col.h}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 16 }}>{col.h}</div>
            {col.items.map(i => (
              <button key={i.l} onClick={i.go} className="ulink"
                style={{
                  display: 'block', textAlign: 'left',
                  fontSize: 12, color: 'var(--fg-2)', padding: '6px 0',
                  background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
                }}>{i.l}</button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 16 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>© MOTOGRIP GEAR · ROAD ARMOR · ALL RIGHTS RESERVED</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={() => go('faq')} className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-4)', background: 'transparent', border: 0, cursor: 'pointer' }}>PRIVACY</button>
          <button onClick={() => go('faq')} className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-4)', background: 'transparent', border: 0, cursor: 'pointer' }}>TERMS</button>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>EN / USD ▾</span>
        </div>
      </div>
    </footer>
  );
}

function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '18px 0', background: 'var(--bg)' }}>
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <span key={i} className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 80 }}>
            {t} <span style={{ color: 'var(--accent-2)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Header, Footer, CartDrawer, QuickView, SearchOverlay, Marquee, Icon, MotoGripLogo });
