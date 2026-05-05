// Homepage — supports 3 hero variants via tweak

function Hero({ variant }) {
  if (variant === 'editorial-split') return <HeroSplit />;
  if (variant === 'centered-type')   return <HeroCentered />;
  return <HeroFullbleed />;
}

function HeroFullbleed() {
  return (
    <section style={{ position: 'relative', height: 'calc(100vh - 80px)', minHeight: 680, marginTop: -80, paddingTop: 80 }}>
      <div className="ph grain" data-img="1" data-label="HERO"
        style={{ position: 'absolute', inset: 0, top: 80, '--img': `url(${SSM_IMAGES.heroFullbleed})` }} />
      <div style={{
        position: 'absolute', inset: 0, top: 80,
        background: 'var(--hero-scrim)',
      }} />
      <div style={{
        position: 'absolute', left: 48, bottom: 64, right: 48,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div style={{ maxWidth: 640 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2)', marginBottom: 24, letterSpacing: '0.3em' }}>
            ATELIER · COLLECTION X
          </div>
          <h1 className="display" style={{
            fontSize: 'clamp(56px, 8vw, 124px)', lineHeight: 0.96, margin: 0, fontWeight: 400,
          }}>
            Built for the<br/>
            <em style={{ fontFamily: 'var(--display)', fontStyle: 'italic', color: 'var(--accent-2)' }}>quiet rebellion</em>
          </h1>
          <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, maxWidth: 480, marginTop: 28 }}>
            Vegetable-tanned hides. Hand-cut, hand-stitched, hand-numbered. The new winter collection is now in the atelier.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, paddingBottom: 6 }}>
          <button className="btn">Discover the Collection</button>
          <button className="btn btn-ghost">Watch the Film</button>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 48, top: 120, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.4em' }}>
          N° 047 / 250 · MMXXVI
        </div>
      </div>
    </section>
  );
}

function HeroSplit() {
  return (
    <section style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      height: 'calc(100vh - 80px)', minHeight: 680, marginTop: -80, paddingTop: 80,
    }}>
      <div style={{
        padding: '0 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2)', marginBottom: 32 }}>WINTER · MMXXVI</div>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 6vw, 88px)', lineHeight: 1, margin: 0, fontWeight: 400 }}>
          Hides that<br/>remember.
        </h1>
        <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, marginTop: 32, maxWidth: 440 }}>
          Twelve months in the tanning pit. Two weeks under the cutter's knife. A lifetime on your shoulders. Each piece signed by the hand that made it.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          <button className="btn">Shop the Edit</button>
          <button className="btn btn-ghost">The Atelier</button>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 64, display: 'flex', gap: 32 }}>
          {[
            { n: '01', t: 'Single-maker' },
            { n: '02', t: 'Vegetable-tanned' },
            { n: '03', t: 'Lifetime repair' },
          ].map(s => (
            <div key={s.n}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ph grain" data-img="1" data-label="HERO"
        style={{ '--img': `url(${SSM_IMAGES.heroSplit})` }} />
    </section>
  );
}

function HeroCentered() {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - 80px)', minHeight: 680, padding: '0 48px',
      textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div className="ph grain" data-img="1" data-label=""
        style={{ position: 'absolute', inset: 0, '--img': `url(${SSM_IMAGES.heroCentered})`, opacity: 0.35 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'var(--hero-center-scrim)' }} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 36, letterSpacing: '0.4em' }}>
        ✦ &nbsp; ATELIER · MMXXVI &nbsp; ✦
      </div>
      <h1 className="display" style={{
        fontSize: 'clamp(64px, 11vw, 180px)', lineHeight: 0.92, margin: 0, fontWeight: 400, letterSpacing: '-0.02em',
      }}>
        Every stitch,<br/>
        <em style={{ color: 'var(--accent-2)' }}>a small vow.</em>
      </h1>
      <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, marginTop: 32 }}>
        Vegetable-tanned leather. Cut by hand, finished by feel. Made to remain.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
        <button className="btn">Discover the Collection</button>
        <button className="btn btn-ghost">Made to Order →</button>
      </div>
      </div>
      <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 16, zIndex: 2 }}>
        <div style={{ width: 1, height: 32, background: 'var(--line-2)' }} />
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', letterSpacing: '0.3em' }}>SCROLL</div>
      </div>
    </section>
  );
}

function ProductCard({ product, onQuickView, go }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => go('pdp', { product })}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
        <div className="ph card-img" data-img="1" data-label={product.name}
          style={{ position: 'absolute', inset: 0, '--img': `url(${product.img})` }} />
        {product.tag && (
          <div className="mono" style={{
            position: 'absolute', top: 16, left: 16,
            fontSize: 9, color: product.tag === 'Atelier' ? 'var(--accent-2)' : 'var(--fg)',
            background: product.tag === 'Atelier' ? 'transparent' : 'rgba(10,9,8,0.5)',
            border: product.tag === 'Atelier' ? '1px solid var(--accent-2)' : 'none',
            padding: '5px 9px', letterSpacing: '0.18em',
          }}>{product.tag}</div>
        )}
        <div className="quickview" style={{
          position: 'absolute', bottom: 16, left: 16, right: 16,
        }}>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', fontSize: 10, padding: '12px' }}
            onClick={(e) => { e.stopPropagation(); onQuickView(product); }}>
            Quick View
          </button>
        </div>
      </div>
      <div style={{ padding: '16px 2px 8px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 19, lineHeight: 1.2 }}>{product.name}</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{product.blurb}</div>
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 19, whiteSpace: 'nowrap' }}>${product.price.toLocaleString()}</div>
      </div>
    </div>
  );
}

function CategoryStrip({ go }) {
  const cats = [
    { name: 'Jackets', label: 'OUTERWEAR · 24 PIECES', filter: 'Jackets', img: SSM_IMAGES.catJackets },
    { name: 'Vests', label: 'LAYERING · 12 PIECES', filter: 'Vests', img: SSM_IMAGES.catVests },
    { name: 'Trousers', label: 'TAILORING · 16 PIECES', filter: 'Pants', img: SSM_IMAGES.catPants },
    { name: 'Atelier', label: 'MADE TO ORDER · BESPOKE', filter: null, view: 'mto', img: SSM_IMAGES.catAtelier },
  ];
  return (
    <section style={{ padding: '120px 48px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>I · CATEGORIES</div>
          <h2 className="display" style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>
            Four houses, one hide.
          </h2>
        </div>
        <span className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-2)' }}>VIEW ALL →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cats.map((c, i) => (
          <div key={c.name} className="card" style={{ cursor: 'pointer', position: 'relative' }}
            onClick={() => c.view ? go(c.view) : go('shop', { cat: c.filter })}>
            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
              <div className="ph card-img" data-img="1" data-label={c.name}
                style={{ position: 'absolute', inset: 0, '--img': `url(${c.img})` }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'var(--media-caption-scrim)',
              }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 8 }}>0{i+1}</div>
                <div className="display" style={{ fontSize: 36, lineHeight: 0.95, fontWeight: 400, color: 'var(--media-caption-fg)' }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--media-caption-muted)', marginTop: 8 }}>{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedRow({ products, onQuickView, go }) {
  return (
    <section style={{ padding: '80px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>II · NEW ARRIVALS</div>
          <h2 className="display" style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>
            Just off the bench.
          </h2>
        </div>
        <span className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-2)' }} onClick={() => go('shop')}>VIEW ALL →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
        {products.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} onQuickView={onQuickView} go={go} />
        ))}
      </div>
    </section>
  );
}

function AtelierFeature({ go }) {
  return (
    <section style={{ padding: '120px 48px', background: 'var(--bg-2)', margin: '40px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>III · MADE TO ORDER</div>
          <h2 className="display" style={{ fontSize: 'clamp(40px, 5.5vw, 80px)', margin: 0, lineHeight: 0.98, fontWeight: 400, marginBottom: 24 }}>
            Cut to the<br/>contour of you.
          </h2>
          <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
            Choose the hide, the lining, the hardware, the silhouette. A single craftsperson is assigned to your piece, and you correspond with them throughout. Six to ten weeks. One of one.
          </div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
            {[
              { n: '6–10', t: 'WEEKS' },
              { n: '40+', t: 'CUSTOMIZATIONS' },
              { n: '1 of 1', t: 'EVERY PIECE' },
            ].map(s => (
              <div key={s.t}>
                <div className="display" style={{ fontSize: 32, color: 'var(--accent-2)' }}>{s.n}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 2 }}>{s.t}</div>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => go('mto')}>Begin a Commission <Icon name="arrow" size={14} /></button>
        </div>
        <div className="ph grain" data-img="1" data-label=""
          style={{ aspectRatio: '4/5', '--img': `url(${SSM_IMAGES.atelier})` }} />
      </div>
    </section>
  );
}

function EditorialBlock({ go }) {
  return (
    <section style={{ padding: '80px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>IV · LOOKBOOK</div>
          <h2 className="display" style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>
            <em>Hourwitch</em> — the winter film.
          </h2>
        </div>
        <span className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-2)' }} onClick={() => go('lookbook')}>VIEW STORY →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
        <div className="ph grain" data-img="1" data-label=""
          style={{ aspectRatio: '16/9', '--img': `url(${SSM_IMAGES.edWide})` }} />
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
          <div className="ph" data-img="1" data-label="" style={{ '--img': `url(${SSM_IMAGES.edDetail1})` }} />
          <div className="ph" data-img="1" data-label="" style={{ '--img': `url(${SSM_IMAGES.edDetail2})` }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
        <div className="ph" data-img="1" data-label="" style={{ aspectRatio: '3/4', '--img': `url(${SSM_IMAGES.edPortrait})` }} />
        <div className="ph grain" data-img="1" data-label="" style={{ aspectRatio: '8/3', '--img': `url(${SSM_IMAGES.edInterior})` }} />
      </div>
    </section>
  );
}

function TestimonialBlock() {
  const reviews = [
    { q: 'The Voltaire arrived. I have not taken it off in three weeks.', a: 'Vogue Paris · Editor at Large' },
    { q: 'A house that understands restraint is the truest form of luxury.', a: 'Mr Porter · Journal' },
    { q: 'You can feel the patience in the leather.', a: 'The Gentleman\'s Journal' },
  ];
  return (
    <section style={{ padding: '120px 48px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 48, textAlign: 'center' }}>V · IN THE PRESS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64 }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 26, lineHeight: 1.4, fontStyle: 'italic', marginBottom: 24, color: 'var(--fg)' }}>
              &ldquo;{r.q}&rdquo;
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>— {r.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Home({ go, onQuickView, heroVariant }) {
  return (
    <div className="page-fade">
      <Hero variant={heroVariant} />
      <Marquee items={['HAND-CUT IN BROOKLYN', 'COMPLIMENTARY GLOBAL SHIPPING', 'LIFETIME REPAIR PROMISE', 'EVERY PIECE NUMBERED', 'VEGETABLE-TANNED HIDES', 'ATELIER MMXXVI']} />
      <CategoryStrip go={go} />
      <FeaturedRow products={SSM_PRODUCTS} onQuickView={onQuickView} go={go} />
      <AtelierFeature go={go} />
      <EditorialBlock go={go} />
      <TestimonialBlock />
    </div>
  );
}

Object.assign(window, { Home, ProductCard });
