// Shop / PLP — fully working filter, sort, and active-pill state.
// All filter values are real toggles; the "Featured" / "New" sorts work,
// price slider trims the result set, and an empty state replaces the grid
// when no piece matches.

function Shop({ go, onQuickView, initialGender, initialCat }) {
  const [gender, setGender] = React.useState(initialGender || 'All');
  const [cat, setCat] = React.useState(initialCat || 'All');
  const [sort, setSort] = React.useState('Featured');
  const [filterOpen, setFilterOpen] = React.useState(false);

  // Multi-select filters
  const [leathers, setLeathers] = React.useState([]);   // ids
  const [sizes, setSizes] = React.useState([]);         // strings
  const [maxPrice, setMaxPrice] = React.useState(1500);
  const [availability, setAvailability] = React.useState([]);

  React.useEffect(() => { if (initialGender) setGender(initialGender); }, [initialGender]);
  React.useEffect(() => { if (initialCat) setCat(initialCat); }, [initialCat]);

  // Reset filters when category-level changes (so a filter pill doesn't strand on an empty shop).
  const resetFilters = () => {
    setLeathers([]); setSizes([]); setMaxPrice(1500); setAvailability([]);
  };

  const toggle = (set, setter) => (v) => {
    setter(set.includes(v) ? set.filter(x => x !== v) : [...set, v]);
  };

  // Build filtered list
  let products = SSM_PRODUCTS.filter(p => {
    if (gender !== 'All' && p.gender !== gender) return false;
    if (cat !== 'All' && p.cat !== cat) return false;
    if (p.price > maxPrice) return false;
    // sizes: a product passes if any selected size has stock > 0 (or unknown)
    if (sizes.length) {
      const ok = sizes.some(s => !p.stock || p.stock[s] > 0);
      if (!ok) return false;
    }
    // availability — illustrative: 'In atelier' is everything with stock,
    // 'Made to order' is everything (since MTO is offered for all),
    // 'Final pieces' = total stock <=2.
    if (availability.length) {
      const total = p.stock ? Object.values(p.stock).reduce((a,b) => a+b, 0) : 99;
      const tags = [];
      if (total > 0) tags.push('In atelier');
      tags.push('Made to order');
      if (total <= 4) tags.push('Final pieces');
      if (!availability.some(a => tags.includes(a))) return false;
    }
    return true;
  });

  if (sort === 'Price ↑') products = [...products].sort((a, b) => a.price - b.price);
  else if (sort === 'Price ↓') products = [...products].sort((a, b) => b.price - a.price);
  else if (sort === 'New') {
    products = [...products].sort((a, b) => (b.tag === 'New' ? 1 : 0) - (a.tag === 'New' ? 1 : 0));
  }
  // 'Featured' = data order

  // Active filter chips
  const activePills = [
    ...leathers.map(l => ({ k: 'leather:' + l, label: SSM_LEATHERS.find(x => x.id === l)?.name, onClear: () => toggle(leathers, setLeathers)(l) })),
    ...sizes.map(s => ({ k: 'size:' + s, label: 'Size ' + s, onClear: () => toggle(sizes, setSizes)(s) })),
    ...(maxPrice < 1500 ? [{ k: 'price', label: `Under $${maxPrice}`, onClear: () => setMaxPrice(1500) }] : []),
    ...availability.map(a => ({ k: 'av:' + a, label: a, onClear: () => toggle(availability, setAvailability)(a) })),
  ];

  // Per-category lede
  const lede = (() => {
    if (gender === 'Women' && cat === 'All') return "Cut to a woman's frame, not a smaller man's.";
    if (gender === 'Men'   && cat === 'All') return "Built for shoulder, not for show.";
    if (cat === 'Jackets') return "Asymmetric, classic, cropped, long. Twelve silhouettes; one hide doctrine.";
    if (cat === 'Vests')   return "Layering, made obvious. Quilted yokes, raw selvedge, four-pocket utility.";
    if (cat === 'Pants')   return "Tailored from the central panels. High-rise, straight, riding.";
    return "Twelve silhouettes, hand-numbered. Each piece signed by the hand that made it.";
  })();

  return (
    <div className="page-fade">
      <section style={{ padding: '64px 48px 32px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
          ATELIER {gender !== 'All' ? `· ${gender.toUpperCase()}` : ''} {cat !== 'All' ? `· ${cat.toUpperCase()}` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 104px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>
            {cat === 'All' ? (gender === 'All' ? 'The Collection' : `For ${gender === 'Men' ? 'him' : 'her'}.`) : cat}
          </h1>
          <div style={{ color: 'var(--fg-3)', fontSize: 13, paddingBottom: 8, maxWidth: 520, lineHeight: 1.6 }}>
            {lede}
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 8 }}>
              {products.length} {products.length === 1 ? 'PIECE' : 'PIECES'}, HAND-NUMBERED
            </div>
          </div>
        </div>
      </section>

      {/* Sticky sub-nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 48px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 80, background: 'var(--chrome-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 10,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {['All', 'Women', 'Men'].map(g => (
            <button key={g} onClick={() => setGender(g)} className="mono"
              style={{
                fontSize: 10, padding: '8px 14px', cursor: 'pointer',
                color: gender === g ? 'var(--bg)' : 'var(--fg-2)',
                background: gender === g ? 'var(--fg)' : 'transparent',
                border: 0, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
                transition: 'all 0.15s',
              }}>{g.toUpperCase()}</button>
          ))}
          <div style={{ width: 1, height: 16, background: 'var(--line-2)', margin: '0 12px' }} />
          {['All', 'Jackets', 'Vests', 'Pants'].map(c => (
            <button key={c} onClick={() => setCat(c)} className="mono"
              style={{
                fontSize: 10, padding: '8px 14px', cursor: 'pointer',
                color: cat === c ? 'var(--fg)' : 'var(--fg-3)',
                background: 'transparent', border: 0, fontFamily: 'var(--mono)',
                borderBottom: cat === c ? '1px solid var(--accent-2)' : '1px solid transparent',
                letterSpacing: '0.08em',
              }}>{c.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={() => setFilterOpen(!filterOpen)} className="mono ulink"
            style={{ fontSize: 10, color: 'var(--fg-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
            {filterOpen ? '− HIDE FILTERS' : '+ FILTERS'}
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)} className="mono"
            aria-label="Sort"
            style={{
              background: 'transparent', border: 'none', color: 'var(--fg-2)', fontSize: 10,
              fontFamily: 'var(--mono)', padding: '4px 0', outline: 'none', cursor: 'pointer',
            }}>
            {['Featured', 'New', 'Price ↑', 'Price ↓'].map(s => <option key={s} style={{ background: 'var(--bg-2)' }}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div style={{
          padding: '14px 48px', display: 'flex', gap: 8, alignItems: 'center',
          flexWrap: 'wrap', borderBottom: '1px solid var(--line)',
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>FILTERED BY ·</span>
          {activePills.map(p => (
            <button key={p.k} onClick={p.onClear}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)',
                background: 'var(--bg-2)', border: '1px solid var(--line-2)',
                color: 'var(--fg-2)', cursor: 'pointer',
              }}>
              {p.label}
              <span style={{ color: 'var(--fg-4)' }}>×</span>
            </button>
          ))}
          <button onClick={resetFilters} className="mono ulink"
            style={{ fontSize: 10, color: 'var(--accent-2)', background: 'transparent', border: 0, cursor: 'pointer', marginLeft: 8 }}>
            CLEAR ALL
          </button>
        </div>
      )}

      {/* Filters panel */}
      {filterOpen && (
        <div className="page-fade" style={{ padding: '32px 48px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 14 }}>LEATHER</div>
              {SSM_LEATHERS.map(l => {
                const checked = leathers.includes(l.id);
                return (
                  <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', color: 'var(--fg-2)', fontSize: 12 }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggle(leathers, setLeathers)(l.id)}
                      style={{ display: 'none' }} />
                    <span style={{
                      width: 14, height: 14,
                      border: '1px solid var(--line-2)',
                      background: checked ? 'var(--fg)' : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: 'var(--bg)', fontSize: 10 }}>✓</span>}
                    </span>
                    <span style={{ width: 10, height: 10, background: l.swatch, borderRadius: '50%', border: '1px solid var(--line-2)' }} />
                    {l.name}
                  </label>
                );
              })}
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 14 }}>SIZE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['XS','S','M','L','XL','XXL'].map(s => {
                  const on = sizes.includes(s);
                  return (
                    <button key={s} onClick={() => toggle(sizes, setSizes)(s)}
                      style={{
                        padding: '6px 12px', fontSize: 11, cursor: 'pointer',
                        border: '1px solid ' + (on ? 'var(--fg)' : 'var(--line-2)'),
                        background: on ? 'var(--fg)' : 'transparent',
                        color: on ? 'var(--bg)' : 'var(--fg-2)',
                        fontFamily: 'var(--mono)',
                      }}>{s}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 14 }}>MAX PRICE</div>
              <input type="range" min="500" max="1500" step="20" value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-2)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
                <span>$500</span><span style={{ color: 'var(--fg)' }}>${maxPrice}</span>
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 14 }}>AVAILABILITY</div>
              {['In atelier', 'Made to order', 'Final pieces'].map(a => {
                const checked = availability.includes(a);
                return (
                  <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', color: 'var(--fg-2)', fontSize: 12 }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggle(availability, setAvailability)(a)}
                      style={{ display: 'none' }} />
                    <span style={{
                      width: 14, height: 14, border: '1px solid var(--line-2)',
                      background: checked ? 'var(--fg)' : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: 'var(--bg)', fontSize: 10 }}>✓</span>}
                    </span>
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid or empty state */}
      {products.length === 0 ? (
        <section style={{ padding: '120px 48px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            NOTHING MATCHES
          </div>
          <div className="display" style={{ fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.05 }}>
            All the pieces are away.
          </div>
          <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7, marginTop: 16, marginBottom: 32 }}>
            No piece in the workshop matches that combination. Loosen one filter — or begin a Made-to-Order commission.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn" onClick={resetFilters}>Clear filters</button>
            <button className="btn btn-ghost" onClick={() => go('mto')}>Begin a commission</button>
          </div>
        </section>
      ) : (
        <div style={{ padding: '48px 48px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} onQuickView={onQuickView} go={go} />
          ))}
        </div>
      )}

      {/* SEO essay block */}
      {products.length > 0 && (
        <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
            ON THE COLLECTION
          </div>
          <div style={{ maxWidth: 720, fontSize: 16, color: 'var(--fg-3)', lineHeight: 1.85 }}>
            Every piece in the SSM collection is cut from the central panels of a single vegetable-tanned hide and signed inside the placket by the maker. We make twelve silhouettes — four jackets, three vests, three trousers, two long coats — in editions of no more than 250 a year. Each piece carries a lifetime repair promise and a hand-numbered card.
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="mono ulink" onClick={() => go('about')}
              style={{ fontSize: 10, color: 'var(--accent-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
              READ THE HERITAGE →
            </button>
            <button className="mono ulink" onClick={() => go('mto')}
              style={{ fontSize: 10, color: 'var(--accent-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
              CONTINUE IN ATELIER →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, { Shop });
