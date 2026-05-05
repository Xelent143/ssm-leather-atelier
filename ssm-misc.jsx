// Lookbook, About, Account, Checkout

function Lookbook({ go }) {
  return (
    <div className="page-fade">
      <section style={{ padding: '64px 48px 48px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>WINTER MMXXVI · CHAPTER ONE</div>
        <h1 className="display" style={{ fontSize: 'clamp(56px, 9vw, 144px)', margin: 0, lineHeight: 0.92, fontWeight: 400 }}>
          <em>Hourwitch.</em>
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'flex-end' }}>
          <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, maxWidth: 540 }}>
            Photographed at dusk on the old coast road. Six pieces from the winter collection, worn by Iola Vance and Theo Marston. Direction by Aram Beneš.
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>16 FRAMES · 4:32 FILM</div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, padding: '0 48px' }}>
        <div className="ph grain" data-img="1" data-label=""
          style={{ gridColumn: 'span 12', aspectRatio: '21/9', '--img': `url(${SSM_IMAGES.lookOpen})` }} />
        <div className="ph grain" data-img="1" data-label=""
          style={{ gridColumn: 'span 5', aspectRatio: '4/5', '--img': `url(${SSM_IMAGES.lookA})` }} />
        <div className="ph grain" data-img="1" data-label=""
          style={{ gridColumn: 'span 7', aspectRatio: '7/5', '--img': `url(${SSM_IMAGES.lookB})` }} />
        <div className="ph" data-img="1" data-label=""
          style={{ gridColumn: 'span 4', aspectRatio: '1/1', '--img': `url(${SSM_IMAGES.lookC})` }} />
        <div className="ph" data-img="1" data-label=""
          style={{ gridColumn: 'span 4', aspectRatio: '1/1', '--img': `url(${SSM_IMAGES.lookD})` }} />
        <div className="ph" data-img="1" data-label=""
          style={{ gridColumn: 'span 4', aspectRatio: '1/1', '--img': `url(${SSM_IMAGES.lookE})` }} />
        <div className="ph grain" data-img="1" data-label=""
          style={{ gridColumn: 'span 12', aspectRatio: '21/9', '--img': `url(${SSM_IMAGES.lookF})` }} />
      </div>

      <section style={{ padding: '80px 48px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <div className="display" style={{ fontSize: 32, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--fg-2)' }}>
          &ldquo;The leather is the witness. It remembers the wind, the wear, the weather. We try only to begin its story well.&rdquo;
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 24 }}>— THE FOUNDER, FROM THE SLEEVE NOTES</div>
      </section>

      <div style={{ padding: '0 48px 80px', textAlign: 'center' }}>
        <button className="btn" onClick={() => go('shop')}>Shop the Lookbook</button>
      </div>
    </div>
  );
}

function About({ go }) {
  return (
    <div className="page-fade">
      <section style={{ padding: '80px 48px 64px', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>HERITAGE · EST. MMXIV</div>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 104px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>
          A small house,<br/>built slowly.
        </h1>
        <div style={{ color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.8, marginTop: 32 }}>
          SSM was founded in a 600-square-foot Brooklyn workshop by three friends who believed leather was being made too quickly. Twelve years on, we are eleven craftspeople, two pattern-cutters, and a single tannery in Tuscany that has stayed with us since the beginning.
        </div>
      </section>

        <div className="ph grain" data-img="1" data-label=""
          style={{ height: 540, margin: '0 48px', '--img': `url(${SSM_IMAGES.workshop})` }} />

      <section style={{ padding: '96px 48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64, maxWidth: 1200, margin: '0 auto' }}>
        {[
          { n: 'I', t: 'Patience', c: 'Twelve months in the tanning pit. Two weeks per garment. Nothing is hurried; nothing is hidden.' },
          { n: 'II', t: 'Single-maker', c: 'One craftsperson sees a piece from cut to finish. They sign the inside placket. You write to them by name.' },
          { n: 'III', t: 'Forever', c: 'Every piece carries a lifetime repair promise. Bring it back at fifty; we will know how it was made.' },
        ].map(p => (
          <div key={p.n}>
            <div className="display" style={{ fontSize: 64, color: 'var(--accent-2)', lineHeight: 1, marginBottom: 16 }}>{p.n}</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>{p.t}</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7 }}>{p.c}</div>
          </div>
        ))}
      </section>

      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12, textAlign: 'center' }}>THE WORKSHOP</div>
        <h2 className="display" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', margin: '0 0 48px', textAlign: 'center', fontWeight: 400 }}>
          Eleven hands, named.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {['Iola V.', 'Theo M.', 'Aram B.', 'Sigrid K.', 'Marlowe P.', 'Caspian R.', 'Helena A.', 'Bayard T.'].map((n, i) => (
            <div key={n}>
              <div className="ph" data-img="1" data-label=""
                style={{ aspectRatio: '4/5', '--img': `url(${[SSM_ASSETS.atelier, SSM_ASSETS.detail, SSM_ASSETS.biker, SSM_ASSETS.cafe, SSM_ASSETS.vest, SSM_ASSETS.trouser, SSM_ASSETS.coat, SSM_ASSETS.lookbook][i]})` }} />
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, marginTop: 12 }}>{n}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>
                {['CUTTER', 'STITCHER', 'PATTERN', 'FINISHER'][i % 4]} · {2014 + i}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '96px 48px', textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 1.4, fontStyle: 'italic', maxWidth: 760, margin: '0 auto' }}>
          &ldquo;We do not make leather goods. We begin friendships with hides.&rdquo;
        </div>
        <button className="btn" style={{ marginTop: 40 }} onClick={() => go('mto')}>Begin a Commission</button>
      </section>
    </div>
  );
}

function Account({ go }) {
  const [tab, setTab] = React.useState('orders');
  const orders = [
    { n: 'SSM-2026-0418', d: 'Apr 12, 2026', s: 'In transit', items: 'Voltaire Biker · Obsidian Noir · M', total: 1280, status: 'transit' },
    { n: 'SSM-2026-0312', d: 'Mar 04, 2026', s: 'Delivered', items: 'Bishop Field Pant · Tobacco · 32', total: 880, status: 'delivered' },
    { n: 'SSM-MTO-0089',  d: 'Feb 18, 2026', s: 'In atelier · Wk 4 of 8', items: 'Ridgemont Double Rider (MTO) · Cognac · L', total: 1790, status: 'atelier' },
  ];
  return (
    <div className="page-fade">
      <section style={{ padding: '64px 48px 32px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>YOUR ATELIER</div>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: 0, lineHeight: 1, fontWeight: 400 }}>
          Welcome back, Iola.
        </h1>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, padding: '0 48px 80px' }}>
        <aside style={{ borderRight: '1px solid var(--line)', paddingRight: 32 }}>
          {[
            { id: 'orders', t: 'Orders' },
            { id: 'mto', t: 'Commissions' },
            { id: 'wishlist', t: 'Wishlist' },
            { id: 'fit', t: 'Fit Profile' },
            { id: 'addr', t: 'Addresses' },
            { id: 'sub', t: 'Atelier Notes' },
          ].map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '14px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer',
                color: tab === t.id ? 'var(--fg)' : 'var(--fg-3)',
                fontFamily: 'var(--display)', fontSize: 18,
                position: 'relative',
              }}>
              {t.t}
              {tab === t.id && <span style={{ position: 'absolute', right: 0, color: 'var(--accent-2)' }}>→</span>}
            </div>
          ))}
          <div className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 32, padding: '8px 0' }}>SIGN OUT</div>
        </aside>

        <div style={{ padding: '0 0 0 48px' }}>
          {tab === 'orders' && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>3 ORDERS · 1 IN ATELIER</div>
              {orders.map(o => (
                <div key={o.n} style={{ padding: '24px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'center' }}>
                  <div className="ph tiny" data-img="1" data-label=""
                    style={{ aspectRatio: '3/4', '--img': `url(${[SSM_PRODUCTS[0].img, SSM_PRODUCTS[7].img, SSM_PRODUCTS[4].img][orders.indexOf(o)]})` }} />
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 6 }}>{o.n} · {o.d.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 4 }}>{o.items}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px',
                      background: o.status === 'atelier' ? 'rgba(176,138,76,0.12)' : (o.status === 'transit' ? 'rgba(139,58,46,0.18)' : 'transparent'),
                      border: o.status === 'delivered' ? '1px solid var(--line)' : 'none' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%',
                        background: o.status === 'atelier' ? 'var(--accent-2)' : (o.status === 'transit' ? 'var(--accent)' : 'var(--fg-4)') }} />
                      <span className="mono" style={{ fontSize: 9, color: 'var(--fg-2)' }}>{o.s.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22 }}>${o.total.toLocaleString()}</div>
                    <span className="mono ulink" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 8, display: 'inline-block' }}>VIEW DETAILS →</span>
                  </div>
                </div>
              ))}

              {/* MTO progress */}
              <div style={{ marginTop: 48, padding: 32, background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>YOUR COMMISSION · SSM-MTO-0089</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 24 }}>The Ridgemont, with Sigrid K.</div>
                <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
                  {['Cut', 'Stitch', 'Finish', 'QC', 'Ship'].map((s, i) => (
                    <div key={s} style={{ flex: 1 }}>
                      <div style={{ height: 2, background: i <= 1 ? 'var(--accent-2)' : 'var(--line-2)', marginBottom: 10 }} />
                      <div className="mono" style={{ fontSize: 9, color: i <= 1 ? 'var(--accent-2)' : 'var(--fg-4)' }}>0{i+1} · {s.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7 }}>
                  Sigrid finished cutting the central panels last week. Stitching begins Monday. Estimated ship: Jun 14.
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }}>Write to Sigrid</button>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }}>View Commission</button>
                </div>
              </div>
            </div>
          )}

          {tab !== 'orders' && (
            <div className="step-fade" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>Coming together.</div>
              <div className="mono" style={{ fontSize: 10 }}>THIS SECTION IS UNDER STITCH</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Checkout({ go, items, setItems }) {
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const ship = 0;
  const tax = Math.round(subtotal * 0.0875);
  const total = subtotal + ship + tax;
  const cs = ['Contact', 'Delivery', 'Payment'];

  if (done) {
    return (
      <div className="page-fade" style={{ padding: '120px 48px', textAlign: 'center', minHeight: '70vh' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--accent-2)', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={28} />
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>CONFIRMED · SSM-2026-0921</div>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 6vw, 88px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>
          Thank you, Iola.
        </h1>
        <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, marginTop: 24, maxWidth: 520, margin: '24px auto 0' }}>
          Your pieces leave the atelier in 2–3 working days. We'll write when they ship, and again when they arrive.
        </div>
        <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={() => { setItems([]); go('account'); }}>Track Order</button>
          <button className="btn btn-ghost" onClick={() => { setItems([]); go('home'); }}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ padding: '48px 64px', borderRight: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>CHECKOUT · STEP 0{step + 1} OF 3</div>
        <h1 className="display" style={{ fontSize: 48, margin: '0 0 32px', fontWeight: 400 }}>{cs[step]}</h1>

        <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
          {cs.map((c, i) => (
            <div key={c} style={{ flex: 1 }}>
              <div style={{ height: 1, background: i <= step ? 'var(--accent-2)' : 'var(--line)', marginBottom: 8 }} />
              <div className="mono" style={{ fontSize: 9, color: i <= step ? 'var(--accent-2)' : 'var(--fg-4)' }}>0{i+1} · {c.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="step-fade">
            <Field label="Email" placeholder="iola@example.com" />
            <Field label="Phone (for delivery)" placeholder="+1 (212) 555 0143" />
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, color: 'var(--fg-3)', fontSize: 12 }}>
              <span style={{ width: 14, height: 14, border: '1px solid var(--accent-2)', background: 'var(--accent-2)' }} />
              Send me atelier dispatches (optional)
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="step-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="First name" placeholder="Iola" />
              <Field label="Last name" placeholder="Vance" />
            </div>
            <Field label="Address" placeholder="143 Greenpoint Ave" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <Field label="City" placeholder="Brooklyn" />
              <Field label="State" placeholder="NY" />
              <Field label="ZIP" placeholder="11222" />
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 12 }}>DELIVERY METHOD</div>
              {[
                { t: 'Atelier Express', d: '2-3 days · Signed for', p: 'Complimentary' },
                { t: 'White Glove', d: '5-7 days · By appointment', p: '+ $40' },
              ].map((m, i) => (
                <label key={m.t} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, border: i === 0 ? '1px solid var(--accent-2)' : '1px solid var(--line)', marginBottom: 8, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{m.t}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{m.d.toUpperCase()}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{m.p}</div>
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="step-fade">
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {['Card', 'Apple Pay', 'Klarna'].map((m, i) => (
                <span key={m} className="mono" style={{ padding: '12px 18px', fontSize: 10,
                  border: i === 0 ? '1px solid var(--fg)' : '1px solid var(--line-2)',
                  background: i === 0 ? 'var(--fg)' : 'transparent',
                  color: i === 0 ? 'var(--bg)' : 'var(--fg-2)', cursor: 'pointer' }}>{m.toUpperCase()}</span>
              ))}
            </div>
            <Field label="Card number" placeholder="•••• •••• •••• 4242" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Expiry" placeholder="08 / 28" />
              <Field label="CVV" placeholder="•••" />
              <Field label="ZIP" placeholder="11222" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
          <button className="btn btn-ghost" onClick={() => step === 0 ? go('home') : setStep(step - 1)}>← {step === 0 ? 'Continue Shopping' : 'Back'}</button>
          <button className="btn" onClick={() => step < 2 ? setStep(step + 1) : setDone(true)}>
            {step < 2 ? `Continue · ${cs[step + 1]}` : `Place Order · $${total.toLocaleString()}`} <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      <aside style={{ padding: 48, background: 'var(--bg-2)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 20 }}>YOUR BAG · {items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</div>
        {items.length === 0 ? (
          <div style={{ color: 'var(--fg-3)', fontSize: 14 }}>Your bag is empty.</div>
        ) : items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="ph tiny" data-img={it.img ? "1" : null} data-label={it.name.split(' ')[0].toUpperCase()}
              style={{ width: 64, height: 80, flexShrink: 0, '--img': it.img ? `url(${it.img})` : null }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{it.name}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{it.leather} · {it.size} · QTY {it.qty}</div>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>${(it.price * it.qty).toLocaleString()}</div>
          </div>
        ))}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line-2)' }}>
          {[['Subtotal', subtotal], ['Shipping', ship === 0 ? 'Complimentary' : '$' + ship], ['Tax', '$' + tax]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{k.toUpperCase()}</span>
              <span style={{ fontSize: 13 }}>{typeof v === 'number' ? '$' + v.toLocaleString() : v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 0', borderTop: '1px solid var(--line-2)', marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 11 }}>TOTAL</span>
            <span className="display" style={{ fontSize: 28 }}>${total.toLocaleString()}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>{label.toUpperCase()}</div>
      <input type="text" placeholder={placeholder}
        style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
          borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
          fontSize: 14, outline: 'none' }} />
    </div>
  );
}

Object.assign(window, { Lookbook, About, Account, Checkout });
