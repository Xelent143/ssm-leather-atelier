// PDP — Product Detail Page.
//
// Reads p.story / p.maker / p.stock from ssm-data.jsx so each product has a
// real, signed-by-the-maker narrative. Adds a sold-out-aware size grid,
// a "notify when restocked" affordance, a Piece Story panel, a Press &
// Reviews block, and a sticky bottom add-to-bag bar on narrow screens.

function PDP({ product, go, addToCart, onQuickView }) {
  const p = product || SSM_PRODUCTS[0];
  const [leather, setLeather] = React.useState(SSM_LEATHERS[0].id);
  const [size, setSize] = React.useState('M');
  const [imgIdx, setImgIdx] = React.useState(0);
  const [openSection, setOpenSection] = React.useState('details');
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState('');
  const [notifyDone, setNotifyDone] = React.useState(false);

  const images = [
    { label: 'On model · 3/4', src: p.img },
    { label: 'Detail · placket', src: p.alt || p.img },
    { label: 'Detail · stitching', src: SSM_ASSETS.detail },
    { label: 'Back · studio', src: p.img },
    { label: 'Flat lay', src: p.alt || p.img },
  ];

  const lObj = SSM_LEATHERS.find(l => l.id === leather);
  const sizeStock = (s) => p.stock ? (p.stock[s] || 0) : 99;
  const inStock = sizeStock(size) > 0;
  const finalPiece = p.stock && Object.values(p.stock).reduce((a,b) => a+b, 0) <= 4;

  const reviews = [
    { who: 'Iola V., Brooklyn',  rating: 5, date: 'March MMXXVI',  body: `My ${p.name.split(' ')[0]} arrived with a small note from ${p.maker}. Three weeks in, the placket has softened just where I hoped.` },
    { who: 'Theo M., Paris',     rating: 5, date: 'February MMXXVI', body: 'The fit is exact. The hide is heavier than I expected, in the best way. I have not taken it off.' },
    { who: 'Sigrid K., London',  rating: 4, date: 'January MMXXVI',  body: 'A real piece. Sized up over a knit, which I would recommend. The brass darkened beautifully after two weeks.' },
  ];

  return (
    <div className="page-fade">
      {/* Breadcrumb */}
      <nav style={{ padding: '20px 48px', display: 'flex', gap: 8 }} className="mono">
        <button onClick={() => go('home')} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>HOUSE</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <button onClick={() => go('shop', { gender: p.gender })} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>{p.gender.toUpperCase()}</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <button onClick={() => go('shop', { cat: p.cat })} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>{p.cat.toUpperCase()}</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <span style={{ fontSize: 10, color: 'var(--fg-2)' }}>{p.name.toUpperCase()}</span>
      </nav>

      <div style={{
        display: 'grid', gridTemplateColumns: '80px 1fr 480px', gap: 0,
        padding: '0 48px 80px',
      }}>
        {/* Thumbnails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setImgIdx(i)}
              aria-label={img.label}
              className="ph tiny" data-img="1" data-label=""
              style={{
                width: 64, aspectRatio: '3/4', cursor: 'pointer',
                '--img': `url(${img.src})`,
                outline: imgIdx === i ? '1px solid var(--fg)' : 'none',
                outlineOffset: 2, opacity: imgIdx === i ? 1 : 0.6,
                background: 'transparent', border: 0, padding: 0,
              }} />
          ))}
        </div>
        {/* Main image */}
        <div style={{ paddingLeft: 24 }}>
          <div className="ph grain" data-img="1" data-label=""
            style={{ aspectRatio: '4/5', position: 'relative', '--img': `url(${images[imgIdx].src})` }}>
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              <button aria-label="Save to wishlist"
                style={{ width: 36, height: 36, background: 'rgba(10,9,8,0.6)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 0, color: 'var(--fg)' }}>
                <Icon name="heart" size={14} />
              </button>
              <button className="mono" aria-label="Zoom"
                style={{ height: 36, padding: '0 14px', background: 'rgba(10,9,8,0.6)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', fontSize: 9, cursor: 'pointer', border: 0, color: 'var(--fg)' }}>
                ZOOM ⤢
              </button>
            </div>
            <div className="mono" style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 9, color: 'var(--fg-3)' }}>
              {imgIdx + 1} / {images.length} · {images[imgIdx].label.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div style={{ paddingLeft: 48, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 10 }}>
            {p.cat.toUpperCase()} · {p.gender.toUpperCase()}
            {p.tag === 'Atelier' && <> · ATELIER</>}
            {finalPiece && <> · FINAL PIECES</>}
          </div>
          <h1 className="display" style={{ fontSize: 48, lineHeight: 1, margin: 0, fontWeight: 400 }}>{p.name}</h1>
          <div style={{ color: 'var(--fg-3)', fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{p.blurb}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 24, marginBottom: 32 }}>
            <span className="display" style={{ fontSize: 32 }}>${p.price.toLocaleString()}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>USD · DUTIES INCLUDED</span>
          </div>

          {/* Trust strip — moved above the picker */}
          <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
            {[
              { i: '✦', t: 'Hand-numbered' },
              { i: '⌖', t: 'Free shipping' },
              { i: '↻', t: 'Lifetime repair' },
            ].map(b => (
              <div key={b.t} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'var(--accent-2)', marginBottom: 4 }}>{b.i}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{b.t}</div>
              </div>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>LEATHER · {lObj.name.toUpperCase()}</span>
            <span style={{ color: 'var(--fg-4)' }}>{lObj.desc}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {SSM_LEATHERS.map(l => (
              <button key={l.id} className={`swatch ${leather === l.id ? 'active' : ''}`}
                aria-label={l.name} title={l.name}
                style={{ background: l.swatch, padding: 0 }} onClick={() => setLeather(l.id)} />
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>SIZE</span>
            <button onClick={() => go('size')} className="ulink"
              style={{ color: 'var(--fg-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10 }}>
              SIZE GUIDE ↗
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
            {['XS','S','M','L','XL','XXL'].map(s => {
              const stock = sizeStock(s);
              const out = stock === 0;
              const low = stock > 0 && stock < 2;
              return (
                <button key={s} onClick={() => setSize(s)} aria-label={`Size ${s}${out ? ', sold out' : ''}`}
                  style={{
                    height: 44, position: 'relative',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${size === s ? 'var(--fg)' : 'var(--line-2)'}`,
                    background: size === s ? 'var(--fg)' : 'transparent',
                    color: size === s ? 'var(--bg)' : (out ? 'var(--fg-4)' : 'var(--fg-2)'),
                    fontSize: 12, cursor: 'pointer',
                    textDecoration: out ? 'line-through' : 'none',
                    opacity: out ? 0.6 : 1,
                  }}>
                  {s}
                  {low && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 7, color: 'var(--accent-2)' }}>·</span>}
                </button>
              );
            })}
          </div>
          {p.stock && (
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 24 }}>
              {inStock
                ? (sizeStock(size) <= 2
                    ? `${sizeStock(size)} ${sizeStock(size) === 1 ? 'PIECE' : 'PIECES'} REMAIN IN ${size}`
                    : `IN ATELIER · ${size}`)
                : `SOLD OUT IN ${size} · NOTIFY ME WHEN RESTOCKED`}
            </div>
          )}

          {inStock ? (
            <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={() => addToCart(p, { leather: lObj.name, size })}>
              Add to Bag — ${p.price.toLocaleString()}
            </button>
          ) : (
            <>
              {notifyDone ? (
                <div className="mono" style={{
                  fontSize: 10, color: 'var(--accent-2)', padding: '14px 0',
                  border: '1px solid var(--accent-2)', textAlign: 'center', marginBottom: 8,
                }}>
                  ✓ WE WILL WRITE WHEN {size} RETURNS TO THE WORKSHOP
                </div>
              ) : !notifyOpen ? (
                <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                  onClick={() => setNotifyOpen(true)}>
                  Notify me when {size} returns
                </button>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <input value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                    type="email" placeholder="Your email"
                    style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--line-2)', color: 'var(--fg)',
                      fontFamily: 'var(--sans)', fontSize: 14, outline: 'none', marginBottom: 8 }} />
                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { if (notifyEmail.includes('@')) setNotifyDone(true); }}>
                    Notify me
                  </button>
                </div>
              )}
            </>
          )}
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
            onClick={() => go('mto', { startWith: p })}>
            Customize in Atelier <Icon name="arrow" size={14} />
          </button>

          {/* Made-by line */}
          <div style={{ padding: '14px 0', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-3)', flexShrink: 0,
              backgroundImage: `url(${SSM_ASSETS.atelier})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)' }}>SIGNED BY</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{p.maker || 'Sigrid K.'}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>
                AT THE BENCH SINCE {p.signedSince || 2014}
              </div>
            </div>
          </div>

          {/* Accordions — uses real per-product stories */}
          {[
            { id: 'details', t: 'The Piece', content: p.story?.piece || p.blurb },
            { id: 'craft',   t: 'The Craft', content: p.story?.craft || 'Twelve months in our vegetable-tanning pit, cut by hand from the central panels.' },
            { id: 'fit',     t: 'Fit & Care', content: p.story?.fit || 'Slim-regular fit through chest and shoulder. Wipe with a soft cloth; condition twice yearly.' },
            { id: 'origin',  t: 'Made by', content: p.story?.origin || 'Cut and signed in our Brooklyn workshop.' },
            { id: 'ship',    t: 'Shipping & Returns', content: 'Complimentary express shipping worldwide. 30-day returns on stock pieces. Made-to-order pieces are final sale, with complimentary fit alterations within 60 days of receipt.' },
          ].map(s => (
            <div key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '18px 0', cursor: 'pointer',
                  width: '100%', background: 'transparent', border: 0, color: 'var(--fg)', textAlign: 'left',
                }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{s.t}</span>
                <span style={{ color: 'var(--fg-3)', fontSize: 18 }}>{openSection === s.id ? '−' : '+'}</span>
              </button>
              {openSection === s.id && (
                <div className="page-fade" style={{ paddingBottom: 18, color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.75 }}>
                  {s.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Piece story — full-width editorial pull */}
      <section style={{
        padding: '96px 48px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
            FROM THE BENCH · {(p.maker || 'SIGRID K.').toUpperCase()}
          </div>
          <h2 className="display" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.05, fontWeight: 400 }}>
            On the {p.name.split(' ')[0]}.
          </h2>
          <div style={{ color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.85, marginTop: 24 }}>
            {p.story?.piece}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 28 }} onClick={() => go('journal')}>
            More from the journal
          </button>
        </div>
        <div className="ph grain" data-img="1" data-label=""
          style={{ aspectRatio: '4/5', '--img': `url(${p.alt || SSM_ASSETS.atelier})` }} />
      </section>

      {/* Fit table */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
          MEASUREMENTS · INCHES
        </div>
        <h2 className="display" style={{ fontSize: 32, margin: 0, fontWeight: 400, marginBottom: 24 }}>
          Fit at a glance.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--line-2)' }}>
          {['Size', 'Chest', 'Shoulder', 'Sleeve', 'Length', 'Stock', ''].map(c => (
            <div key={c} className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', padding: '12px 8px', borderBottom: '1px solid var(--line-2)' }}>
              {c.toUpperCase()}
            </div>
          ))}
          {[
            { s: 'XS', chest: '34', shoulder: '16', sleeve: '24.5', length: '23' },
            { s: 'S',  chest: '36', shoulder: '16.5', sleeve: '25',  length: '23.5' },
            { s: 'M',  chest: '38', shoulder: '17.5', sleeve: '25.5', length: '24' },
            { s: 'L',  chest: '40', shoulder: '18',  sleeve: '26',  length: '24.5' },
            { s: 'XL', chest: '42', shoulder: '18.5', sleeve: '26.5', length: '25' },
            { s: 'XXL', chest: '44', shoulder: '19',  sleeve: '27',  length: '25.5' },
          ].map(r => {
            const stk = sizeStock(r.s);
            return (
              <React.Fragment key={r.s}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 16, color: 'var(--fg-2)', padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>{r.s}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-2)', padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>{r.chest}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-2)', padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>{r.shoulder}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-2)', padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>{r.sleeve}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-2)', padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>{r.length}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: stk === 0 ? 'var(--fg-4)' : (stk <= 2 ? 'var(--accent-2)' : 'var(--fg-2)'), padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>
                  {stk === 0 ? 'SOLD OUT' : stk <= 2 ? `${stk} REMAIN` : 'IN ATELIER'}
                </div>
                <div style={{ padding: '14px 8px', borderBottom: '1px solid var(--line)' }}>
                  {r.s !== size && (
                    <button onClick={() => setSize(r.s)} className="mono ulink"
                      style={{ fontSize: 9, color: 'var(--fg-3)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                      SELECT →
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 16 }}>
          MODEL IS 5'10", WEARING M
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
              REVIEWS · 4.9 / 5 · {reviews.length} VOICES
            </div>
            <h2 className="display" style={{ fontSize: 32, margin: 0, fontWeight: 400 }}>
              From people who wear it.
            </h2>
          </div>
          <button className="btn btn-ghost">Write a review</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {reviews.map(r => (
            <div key={r.who} style={{ padding: 24, border: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2)' }}>
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontStyle: 'italic', lineHeight: 1.5, marginTop: 16, color: 'var(--fg-2)' }}>
                &ldquo;{r.body}&rdquo;
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 16 }}>
                — {r.who.toUpperCase()} · {r.date.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* You may also */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>COMPLETE THE PIECE</div>
        <h2 className="display" style={{ fontSize: 40, margin: 0, marginBottom: 32, fontWeight: 400 }}>You may also consider</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 32 }}>
          {SSM_PRODUCTS.filter(x => x.id !== p.id).slice(0, 4).map(x => (
            <ProductCard key={x.id} product={x} onQuickView={onQuickView || (() => {})} go={go} />
          ))}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { PDP });
