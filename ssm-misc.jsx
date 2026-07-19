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
          <div key={p.t}>
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

function Checkout({ go, items }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const paymentStatus = new URLSearchParams(window.location.search).get('payment');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const beginSecureCheckout = async () => {
    if (!items.length || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            baseId: item.baseId,
            qty: item.qty,
            size: item.size,
            leather: item.leather,
            fitMode: item.fitMode,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Secure checkout is unavailable.');
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError.message || 'Secure checkout is unavailable. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page-fade stripe-checkout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 480px)', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ padding: 'clamp(32px, 5vw, 64px)', borderRight: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>SECURE CHECKOUT · POWERED BY STRIPE</div>
        <h1 className="display" style={{ fontSize: 'clamp(42px, 6vw, 72px)', margin: '0 0 24px', fontWeight: 400 }}>Complete your order securely.</h1>
        <p style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.75, maxWidth: 620, margin: '0 0 32px' }}>
          You will continue to Stripe to enter your contact, delivery, and payment details. MOTOGRIP GEAR never receives or stores your full card number.
        </p>

        {paymentStatus === 'success' && (
          <div style={{ border: '1px solid var(--accent-2)', padding: 18, marginBottom: 24, color: 'var(--fg-2)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 6 }}>PAYMENT RETURNED FROM STRIPE</div>
            Your order confirmation and receipt will be sent to the email address used at checkout.
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div style={{ border: '1px solid var(--line-2)', padding: 18, marginBottom: 24, color: 'var(--fg-3)' }}>
            Checkout was cancelled. Your bag is unchanged and you can continue whenever you are ready.
          </div>
        )}
        {error && (
          <div role="alert" style={{ border: '1px solid #b44', padding: 14, marginBottom: 20, color: '#b44', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12, maxWidth: 620, marginBottom: 32 }}>
          {[
            ['Payment security', 'Card details are entered and processed on Stripe.'],
            ['Delivery details', 'Stripe securely collects your billing, phone, and shipping address.'],
            ['International orders', 'Complimentary shipping is shown at checkout; destination duties may still apply.'],
          ].map(([title, detail]) => (
            <div key={title} style={{ display: 'flex', gap: 14, padding: 16, border: '1px solid var(--line)' }}>
              <Icon name="check" size={16} />
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{title}</div>
                <div style={{ color: 'var(--fg-3)', fontSize: 12, lineHeight: 1.6, marginTop: 3 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => go('shop')}>← Continue shopping</button>
          <button className="btn" disabled={!items.length || loading} onClick={beginSecureCheckout} style={{ opacity: !items.length || loading ? 0.55 : 1 }}>
            {loading ? 'Opening Stripe…' : `Continue to secure payment · $${subtotal.toLocaleString()}`} <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      <aside style={{ padding: 'clamp(28px, 4vw, 48px)', background: 'var(--bg-2)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 20 }}>YOUR BAG · {items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</div>
        {items.length === 0 ? (
          <div style={{ color: 'var(--fg-3)', fontSize: 14 }}>Your bag is empty.</div>
        ) : items.map((item, index) => (
          <div key={item.id || index} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="ph tiny" data-img={item.img ? "1" : null} data-label={item.name.split(' ')[0].toUpperCase()}
              style={{ width: 64, height: 80, flexShrink: 0, '--img': item.img ? `url(${item.img})` : null }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{item.name}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{item.leather} · {item.size} · QTY {item.qty}</div>
              {item.fitMode === 'made-to-measure' && <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginTop: 4 }}>MADE TO MEASURE</div>}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>${(item.price * item.qty).toLocaleString()}</div>
          </div>
        ))}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line-2)' }}>
          {[
            ['Subtotal', `$${subtotal.toLocaleString()}`],
            ['Shipping', 'Complimentary'],
            ['Duties & taxes', 'Destination rules apply'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '6px 0' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{label.toUpperCase()}</span>
              <span style={{ fontSize: 13, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 0', borderTop: '1px solid var(--line-2)', marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 11 }}>DUE AT STRIPE</span>
            <span className="display" style={{ fontSize: 28 }}>${subtotal.toLocaleString()}</span>
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
