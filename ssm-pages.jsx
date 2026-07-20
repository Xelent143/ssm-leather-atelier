// Inner pages — Journal, JournalArticle, Care, Repairs, Concierge,
// Sustainability, Stockists, Press, GiftCards, FAQ, SizeGuide,
// ShippingReturns, Contact, NotFound, SearchResults.
//
// Every page follows the house rhythm:
//   eyebrow (Roman numeral · category)
//   display heading (italicized clause)
//   editorial media (single bleed OR 12-col mosaic)
//   body
//   proof (quote OR press strip OR maker)
//   CTA
// All copy comes from ssm-data.jsx — never inline new copy here.

// ── Shared building blocks ──────────────────────────────────────────────────

function PageHero({ eyebrow, title, italic, dek, meta, image, height = 540 }) {
  return (
    <section style={{ padding: '64px 48px 48px' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
        {eyebrow}
      </div>
      <h1 className="display" style={{
        fontSize: 'clamp(48px, 8vw, 124px)', margin: 0, lineHeight: 0.94, fontWeight: 400,
      }}>
        {title}{italic && <> <em style={{ color: 'var(--accent-2)' }}>{italic}</em></>}
      </h1>
      {(dek || meta) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 32, alignItems: 'flex-end', gap: 32, flexWrap: 'wrap',
        }}>
          {dek && (
            <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, maxWidth: 540 }}>
              {dek}
            </div>
          )}
          {meta && <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{meta}</div>}
        </div>
      )}
      {image && (
        <div className="ph grain" data-img="1" data-label=""
          style={{ height, marginTop: 48, '--img': `url(${image})` }} />
      )}
    </section>
  );
}

function PrincipleTriad({ items }) {
  return (
    <section style={{
      padding: '96px 48px',
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64,
      maxWidth: 1240, margin: '0 auto',
    }}>
      {items.map(p => (
        <div key={p.t}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>{p.t}</div>
          <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7 }}>{p.c}</div>
        </div>
      ))}
    </section>
  );
}

function EditorialQuote({ quote, attribution }) {
  return (
    <section style={{ padding: '96px 48px', textAlign: 'center' }}>
      <div className="display" style={{
        fontSize: 36, lineHeight: 1.4, fontStyle: 'italic',
        maxWidth: 760, margin: '0 auto', color: 'var(--fg-2)',
      }}>
        &ldquo;{quote}&rdquo;
      </div>
      {attribution && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 24 }}>
          — {attribution.toUpperCase()}
        </div>
      )}
    </section>
  );
}

function CTAStrip({ title, body, primary, ghost, onPrimary, onGhost }) {
  return (
    <section style={{
      padding: '96px 48px', borderTop: '1px solid var(--line)',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
    }}>
      <div>
        <h2 className="display" style={{
          fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.05, fontWeight: 400,
        }}>{title}</h2>
      </div>
      <div>
        <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
          {body}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {primary && <button className="btn" onClick={onPrimary}>{primary}</button>}
          {ghost && <button className="btn btn-ghost" onClick={onGhost}>{ghost}</button>}
        </div>
      </div>
    </section>
  );
}

// ── Journal grid ────────────────────────────────────────────────────────────

function Journal({ go }) {
  const [feature, ...rest] = SSM_JOURNAL;
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="JOURNAL"
        title="Sleeve"
        italic="Notes."
        dek="Long-form notes on the hide, the maker, and the wardrobe — written from the bench."
        meta={`${SSM_JOURNAL.length} entries · MMXXVI`}
      />

      {/* Featured entry */}
      <section style={{ padding: '0 48px 80px' }}>
        <div onClick={() => go('article', { article: feature })}
          style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, cursor: 'pointer' }}>
          <div className="ph grain card-img" data-img="1" data-label=""
            style={{ aspectRatio: '4/3', '--img': `url(${feature.hero})` }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
              {feature.cat.toUpperCase()} · {feature.duration.toUpperCase()}
            </div>
            <h2 className="display" style={{
              fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.05, fontWeight: 400,
            }}>{feature.title}</h2>
            <div style={{ color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              {feature.dek}
            </div>
            <div className="mono ulink" style={{ fontSize: 10, color: 'var(--fg-2)', marginTop: 28 }}>
              READ THE ESSAY →
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '0 48px 80px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          ARCHIVE · MMXXVI
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {rest.map(j => (
            <div key={j.id} onClick={() => go('article', { article: j })} style={{ cursor: 'pointer' }} className="card">
              <div className="ph grain card-img" data-img="1" data-label=""
                style={{ aspectRatio: '3/4', '--img': `url(${j.hero})` }} />
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginTop: 16 }}>
                {j.cat.toUpperCase()} · {j.duration.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 24, lineHeight: 1.15, marginTop: 8 }}>
                {j.title}
              </div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                {j.dek}
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 14 }}>
                {j.byline.toUpperCase()} · {j.date.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTAStrip
        title="The first viewing of every chapter."
        body="Subscribe to road notes - we send a short note when a journal entry, lookbook chapter, or small batch of gear leaves the fit room. No discounts, no surveys, no other people's products."
        primary="Subscribe"
        ghost="Continue to the shop"
        onPrimary={() => {}}
        onGhost={() => go('shop')}
      />
    </div>
  );
}

// ── Single journal article ──────────────────────────────────────────────────

function JournalArticle({ article, go }) {
  const a = article || SSM_JOURNAL[0];
  return (
    <div className="page-fade">
      <section style={{ padding: '64px 48px 0', maxWidth: 920, margin: '0 auto' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 16, display: 'flex', gap: 8 }}>
          <span onClick={() => go('home')} className="ulink" style={{ cursor: 'pointer' }}>HOUSE</span>
          <span>/</span>
          <span onClick={() => go('journal')} className="ulink" style={{ cursor: 'pointer' }}>JOURNAL</span>
          <span>/</span>
          <span style={{ color: 'var(--fg-3)' }}>{a.cat.toUpperCase()}</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
          {a.cat.toUpperCase()} · {a.duration.toUpperCase()} · {a.date.toUpperCase()}
        </div>
        <h1 className="display" style={{
          fontSize: 'clamp(40px, 6vw, 88px)', margin: 0, lineHeight: 1, fontWeight: 400,
        }}>{a.title}</h1>
        <div style={{ color: 'var(--fg-3)', fontSize: 17, lineHeight: 1.7, marginTop: 24, fontStyle: 'italic' }}>
          {a.dek}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 24 }}>
          BY {a.byline.toUpperCase()}
        </div>
      </section>

      <div className="ph grain" data-img="1" data-label=""
        style={{ height: 540, margin: '48px 48px', '--img': `url(${a.hero})` }} />

      <article style={{ padding: '0 48px 64px', maxWidth: 760, margin: '0 auto' }}>
        {a.body.map((p, i) => (
          <p key={i} style={{
            fontFamily: i === 0 ? 'var(--display)' : 'var(--sans)',
            fontSize: i === 0 ? 22 : 16,
            lineHeight: i === 0 ? 1.5 : 1.85,
            color: i === 0 ? 'var(--fg-2)' : 'var(--fg-3)',
            margin: '0 0 24px',
          }}>{p}</p>
        ))}
        {a.pull && (
          <div style={{
            margin: '48px 0', padding: '32px 0',
            borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          }}>
            <div className="display" style={{
              fontSize: 32, lineHeight: 1.3, fontStyle: 'italic', color: 'var(--fg)',
            }}>&ldquo;{a.pull}&rdquo;</div>
          </div>
        )}
      </article>

      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
          CONTINUE READING
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {SSM_JOURNAL.filter(j => j.id !== a.id).slice(0, 3).map(j => (
            <div key={j.id} onClick={() => go('article', { article: j })} style={{ cursor: 'pointer' }} className="card">
              <div className="ph card-img" data-img="1" data-label=""
                style={{ aspectRatio: '4/5', '--img': `url(${j.hero})` }} />
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginTop: 14 }}>
                {j.cat.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginTop: 6, lineHeight: 1.2 }}>
                {j.title}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Care guide ──────────────────────────────────────────────────────────────

function Care({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="CARE"
        title="A small ritual,"
        italic="repeated slowly."
        dek="Five steps, written by the people who cut the leather. Read once; refer back twice a year."
        image={SSM_IMAGES.care}
        height={540}
      />

      <section style={{ padding: '0 48px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {SSM_CARE.map((s, i) => (
            <div key={s.t} style={{
              padding: '40px 48px',
              borderTop: i < 2 ? 'none' : '1px solid var(--line)',
              borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
              borderBottom: '1px solid var(--line)',
            }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 10 }}>
                {s.t}
              </div>
              <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.75, maxWidth: 460 }}>
                {s.c}
              </div>
            </div>
          ))}
          {/* Sixth tile — the kit */}
          <div style={{ padding: '40px 48px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
              THE AFTERCARE KIT
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 10 }}>
              Cloth, oil, brush, beeswax.
            </div>
            <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>
              Everything we recommend, packaged in a small canvas roll. $120, free with any jacket purchase over $1,200.
            </div>
            <button className="btn btn-ghost">Add the kit</button>
          </div>
        </div>
      </section>

      <EditorialQuote
        quote="Leather does not need to be loved. It needs to be left alone, and then visited twice a year."
        attribution="Sigrid K. · Cutter"
      />

      <CTAStrip
        title="A piece beyond repair?"
        body="Almost nothing is. Send it to the workshop and we will assess. Restoration takes about six weeks."
        primary="Begin a restoration"
        ghost="Read about repairs"
        onPrimary={() => go('repairs')}
        onGhost={() => go('repairs')}
      />
    </div>
  );
}

// ── Repairs ─────────────────────────────────────────────────────────────────

function Repairs({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="REPAIRS & RESTORATION"
        title="Bring it back"
        italic="at fifty."
        dek="Every piece carries a lifetime repair promise. Stitching, hardware, lining, edge burnishing, conditioning — for as long as the workshop stands."
        image={SSM_IMAGES.repairs}
      />

      <PrincipleTriad items={[
        { n: 'I', t: 'Post', c: 'Use the Contact page with photos. We respond with the next steps after reviewing the repair request.' },
        { n: 'II', t: 'Assess', c: 'Your piece is examined by the maker who signed it, where possible. We send a quote and a timeline. Most work is included; some is not. We are honest about both.' },
        { n: 'III', t: 'Return', c: 'Approximately six weeks from receipt. We ship it back signed-for, conditioned, with a small handwritten note from the bench.' },
      ]} />

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          WHAT IS COVERED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 16 }}>
              Included for life
            </div>
            {[
              'Restitching of any seam', 'Hardware replacement (zips, snaps, D-rings)',
              'Lining repair or full replacement', 'Edge burnishing & conditioning',
              'Patch repair on burns or tears under 2cm', 'Annual check-up at the studio',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--accent-2)' }}>✦</span>
                <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>{t}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 16 }}>
              Quoted on assessment
            </div>
            {[
              'Hide replacement (full panel)', 'Resizing more than one size',
              'Restoration after long-term storage damage', 'Bespoke alterations beyond original spec',
              'Damage from chemical exposure or animal',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--fg-4)' }}>○</span>
                <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{t}</span>
              </div>
            ))}
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 24, lineHeight: 1.7 }}>
              QUOTED WORK STARTS AT $80 · MEDIAN INVOICE FOR THE LAST YEAR · $185
            </div>
          </div>
        </div>
      </section>

      <CTAStrip
        title="Begin a repair"
        body="Send a few photos and a short note. We'll write back with a label and a timeline. Most pieces leave the workshop within six weeks of receipt."
        primary="Write to the workshop"
        ghost="Care guide"
        onPrimary={() => go('contact')}
        onGhost={() => go('care')}
      />
    </div>
  );
}

// ── Concierge / Bespoke ─────────────────────────────────────────────────────

function Concierge({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="CONCIERGE & BESPOKE"
        title="A piece"
        italic="from a single conversation."
        dek="Custom is the ground-up commission: your silhouette, your hide, your hardware, fit in person at the MOTOGRIP Fit Garage. Beyond standard made-to-measure. Reserved for the builds we can execute properly."
        image={SSM_IMAGES.concierge}
      />

      <section style={{ padding: '0 48px 96px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            WHAT IS BESPOKE
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 16, lineHeight: 1.15 }}>
            Pattern-cut to your measurements. Designed in conversation. One of one.
          </div>
          <div style={{ color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.8 }}>
            Bespoke begins where Made-to-Order ends. Where MTO chooses among the silhouettes we already cut, bespoke begins with a sketch — yours, ours, drawn together at the studio. Three fittings minimum. Twelve to twenty weeks from first sketch to final delivery.
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            HOW IT WORKS
          </div>
          {[
            { n: '01', t: 'Initial conversation', c: 'A 45-minute call or studio visit. We discuss your wardrobe, the piece you have in mind, and whether bespoke is the right answer.' },
            { n: '02', t: 'Fit consultation', c: 'Measurements, hide selection, and design details are reviewed remotely or by confirmed appointment.' },
            { n: '03', t: 'Toile', c: 'A muslin or scrap-leather mock-up. We review the line and make adjustments.' },
            { n: '04', t: 'Final fitting', c: 'The finished piece, in your hands, with the maker who built it.' },
          ].map(s => (
            <div key={s.n} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)' }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginTop: 6 }}>{s.t}</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{s.c}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
          ELIGIBILITY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { t: 'Existing client', c: 'You already own one or more MOTOGRIP pieces.' },
            { t: 'Or referred', c: 'A current client has written to us on your behalf.' },
            { t: 'Commission begins at $5,000', c: 'Including all fittings, the hide, and the maker\'s time. A 30% deposit secures the calendar slot.' },
          ].map(p => (
            <div key={p.t} style={{ padding: 24, border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 8 }}>{p.t}</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7 }}>{p.c}</div>
            </div>
          ))}
        </div>
      </section>

      <CTAStrip
        title="Schedule a conversation."
        body="A 45-minute call with the founder. We discuss the piece in mind, the timeline, and whether bespoke is the right answer for you. Confidential, unhurried."
        primary="Request an appointment"
        ghost="Begin a Made-to-Order instead"
        onPrimary={() => go('contact')}
        onGhost={() => go('mto')}
      />
    </div>
  );
}

// ── Sustainability ──────────────────────────────────────────────────────────

function Sustainability({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="SUSTAINABILITY"
        title="The honest"
        italic="version."
        dek="We do not use the word lightly. Below is what we do, what we do not do, and where we are still working."
        image={SSM_IMAGES.sustain}
      />

      <PrincipleTriad items={[
        { n: 'I', t: 'Vegetable, not chrome', c: 'All hides are oak- and chestnut-bark tanned in pits, ten to fourteen months. No chromium salts; no heavy-metal effluent. Slower; lower-impact; every year on record.' },
        { n: 'II', t: 'A by-product, not a cause', c: 'Every hide we cut is a by-product of the Italian beef and lamb trade. We do not commission hides; we do not raise animals. We cut what would otherwise be discarded.' },
        { n: 'III', t: 'Repaired for life', c: 'A jacket repaired is a jacket not replaced. Ours come back at year five and at year twenty-five. Lifetime repair is built into the price, not added to it.' },
      ]} />

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          BY THE NUMBERS · MMXXV
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {[
            { n: '618', t: 'PIECES SHIPPED' },
            { n: '94%', t: 'BY SEA, NOT AIR' },
            { n: '127', t: 'PIECES REPAIRED' },
            { n: '0', t: 'PIECES DISCARDED' },
          ].map(s => (
            <div key={s.t} style={{ padding: 32, border: '1px solid var(--line)' }}>
              <div className="display" style={{ fontSize: 56, color: 'var(--accent-2)', lineHeight: 1 }}>
                {s.n}
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 12 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          WHERE WE ARE STILL WORKING
        </div>
        <div style={{ maxWidth: 760, color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.85 }}>
          <p>We are not carbon neutral. We do not buy offsets we cannot verify. We use leather, which is an animal product. We ship by sea where we can — but a Made-to-Order commission with a six-week timeline often flies, and we are honest about that.</p>
          <p>What we are working on, in MMXXVI: a take-back programme for end-of-life pieces (we will refurbish or repurpose, never landfill); replacing the last of our plastic mailers with paper; putting solar on the roof of the workshop.</p>
          <p>If you have read this far, you have probably noticed that we have not used the word "eco." We do not think we have earned it. We are trying.</p>
        </div>
      </section>

      <EditorialQuote
        quote="The most sustainable jacket is the one that gets repaired in 2074."
        attribution="The Founder · Sleeve Notes"
      />
    </div>
  );
}

// ── Stockists ───────────────────────────────────────────────────────────────

function Stockists({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="COMPANY LOCATIONS"
        title="Two companies,"
        italic="one global standard."
        dek="MOTOGRIP GEAR serves customers through our United States and United Kingdom companies. Contact our team before visiting any business location."
      />

      <section style={{ padding: '0 48px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
          {SSM_STOCKISTS.map((s, i) => (
            <div key={s.name} style={{
              padding: 40,
              borderRight: i < SSM_STOCKISTS.length - 1 ? '1px solid var(--line)' : 'none',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
              background: s.primary ? 'var(--bg-2)' : 'transparent',
            }}>
              {s.primary && (
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 12 }}>
                  UNITED STATES COMPANY
                </div>
              )}
              {!s.primary && (
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 12 }}>
                  UNITED KINGDOM COMPANY
                </div>
              )}
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 6 }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 20 }}>
                {s.city.toUpperCase()}
              </div>
              <div style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.7 }}>{s.addr}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                CONTACT · {s.phone}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                WHATSAPP · {s.whatsapp}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                {s.email}
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => go('contact')}>
                Contact our team
              </button>
            </div>
          ))}
        </div>
      </section>

      <CTAStrip
        title="Need local company details?"
        body="Contact our team before visiting. We will direct your enquiry to the appropriate United States or United Kingdom company."
        primary="Contact MOTOGRIP"
        ghost="Continue browsing"
        onPrimary={() => go('contact')}
        onGhost={() => go('shop')}
      />
    </div>
  );
}

// ── Press ───────────────────────────────────────────────────────────────────

function Press({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="PRESS"
        title="A small"
        italic="archive."
        dek="A few of the kindest things written about the workshop, and a single email for press enquiries."
      />

      <section style={{ padding: '0 48px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
          {SSM_PRESS.map((p, i) => (
            <div key={p.o} style={{
              padding: 40,
              borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
              borderBottom: '1px solid var(--line)',
              borderTop: i < 2 ? '1px solid var(--line)' : 'none',
            }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
                {p.o.toUpperCase()} · {p.date.toUpperCase()}
              </div>
              <div className="display" style={{ fontSize: 24, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--fg)', marginBottom: 16 }}>
                &ldquo;{p.q}&rdquo;
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>
                — {p.who.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 48px 96px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
          PRESS ENQUIRIES
        </div>
        <div className="display" style={{ fontSize: 32, lineHeight: 1.3 }}>
          MOTOGRIPGEAR.COM / CONTACT
        </div>
        <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>
          Press kit (logos, lookbook PDFs, founders' bios) available on request. We generally respond within two working days.
        </div>
        <button className="btn" style={{ marginTop: 24 }} onClick={() => go('contact')}>
          Request the press kit
        </button>
      </section>
    </div>
  );
}

// ── Gift Cards ──────────────────────────────────────────────────────────────

function GiftCards({ go }) {
  const [amount, setAmount] = React.useState(500);
  const [recipient, setRecipient] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [note, setNote] = React.useState('');
  const denominations = [250, 500, 1000, 2500, 5000];

  return (
    <div className="page-fade">
      <PageHero
        eyebrow="GIFT CARDS"
        title="A piece,"
        italic="but unchosen."
        dek="A small leather card, hand-numbered, with a handwritten note on the back. Sent in a linen envelope by post or, if you cannot wait, by email."
      />

      <section style={{ padding: '0 48px 96px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            DENOMINATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 32 }}>
            {denominations.map(d => (
              <span key={d} onClick={() => setAmount(d)} style={{
                padding: '18px 8px', textAlign: 'center', cursor: 'pointer',
                border: amount === d ? '1px solid var(--fg)' : '1px solid var(--line-2)',
                background: amount === d ? 'var(--fg)' : 'transparent',
                color: amount === d ? 'var(--bg)' : 'var(--fg-2)',
                fontFamily: 'var(--display)', fontSize: 18,
              }}>${d.toLocaleString()}</span>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            MESSAGE
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>RECIPIENT</div>
            <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Their full name"
              style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>FROM</div>
            <input value={from} onChange={e => setFrom(e.target.value)} placeholder="Your name"
              style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>NOTE</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={240}
              placeholder="A short note. Hand-copied onto the card by Marlowe."
              rows={3}
              style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                fontSize: 14, outline: 'none', resize: 'vertical' }} />
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4, textAlign: 'right' }}>
              {note.length} / 240
            </div>
          </div>

          <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            Add to bag — ${amount.toLocaleString()}
          </button>
        </div>

        {/* Live preview */}
        <aside>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            PREVIEW
          </div>
          <div style={{
            aspectRatio: '7/4',
            background: 'linear-gradient(135deg, #2a201a 0%, #1a120e 100%)',
            border: '1px solid var(--accent-2)',
            padding: 40, position: 'relative', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}>
            <div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', letterSpacing: '0.4em', marginBottom: 12 }}>
                MOTOGRIP · GIFT
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: '#e8d9b8', letterSpacing: '0.18em', fontWeight: 700 }}>MOTOGRIP</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9, color: 'rgba(232,217,184,0.5)' }}>
                N° {Math.floor(Math.random() * 999) + 100} / MMXXVI
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#e8d9b8', marginTop: 4 }}>
                ${amount.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24, padding: 24, background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 8 }}>
              FOR {recipient.toUpperCase() || '—'}
            </div>
            <div style={{
              fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 18,
              lineHeight: 1.5, color: 'var(--fg-2)', minHeight: 64,
            }}>
              {note || <span style={{ color: 'var(--fg-4)' }}>Your note will appear here, in this hand.</span>}
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 12 }}>
              FROM {from.toUpperCase() || '—'}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

function FAQ({ go }) {
  const [openId, setOpenId] = React.useState(null);
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="FREQUENTLY ASKED"
        title="The short"
        italic="answers."
        dek="The longer ones are in the journal, in the care guide, or in your inbox if you write."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 920, margin: '0 auto' }}>
        {SSM_FAQ.map(group => (
          <div key={group.group} style={{ marginBottom: 48 }}>
            <div className="mono" style={{
              fontSize: 10, color: 'var(--accent-2)', letterSpacing: '0.18em',
              marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line-2)',
            }}>{group.group.toUpperCase()}</div>
            {group.items.map(it => {
              const id = group.group + ':' + it.q;
              const isOpen = openId === id;
              return (
                <div key={id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <button onClick={() => setOpenId(isOpen ? null : id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', padding: '20px 0', cursor: 'pointer',
                      background: 'transparent', border: 'none', color: 'var(--fg)', textAlign: 'left',
                    }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{it.q}</span>
                    <span style={{ color: 'var(--fg-3)', fontSize: 18, marginLeft: 16 }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="page-fade" style={{
                      paddingBottom: 24, color: 'var(--fg-3)', fontSize: 15, lineHeight: 1.75, maxWidth: 760,
                    }}>{it.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <CTAStrip
        title="Did not find your answer?"
        body="Write to us. The MOTOGRIP fit inbox is read by a real person; we generally reply within a working day."
        primary="Write to the fit room"
        ghost="Browse the journal"
        onPrimary={() => go('contact')}
        onGhost={() => go('journal')}
      />
    </div>
  );
}

// ── Size Guide ──────────────────────────────────────────────────────────────

function SizeGuide({ go }) {
  const jacketSizes = [
    { s: 'XS', chest: '34', shoulder: '16', sleeve: '24.5', length: '23' },
    { s: 'S',  chest: '36', shoulder: '16.5', sleeve: '25', length: '23.5' },
    { s: 'M',  chest: '38', shoulder: '17.5', sleeve: '25.5', length: '24' },
    { s: 'L',  chest: '40', shoulder: '18', sleeve: '26', length: '24.5' },
    { s: 'XL', chest: '42', shoulder: '18.5', sleeve: '26.5', length: '25' },
    { s: 'XXL', chest: '44', shoulder: '19', sleeve: '27', length: '25.5' },
  ];
  const pantSizes = [
    { s: 'XS', waist: '26', hip: '34', inseam: '32', rise: '10' },
    { s: 'S',  waist: '28', hip: '36', inseam: '32', rise: '10' },
    { s: 'M',  waist: '30', hip: '38', inseam: '32', rise: '10.5' },
    { s: 'L',  waist: '32', hip: '40', inseam: '32', rise: '10.5' },
    { s: 'XL', waist: '34', hip: '42', inseam: '32', rise: '11' },
    { s: 'XXL', waist: '36', hip: '44', inseam: '32', rise: '11' },
  ];

  const Table = ({ title, cols, rows }) => (
    <div style={{ marginBottom: 48 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, borderTop: '1px solid var(--line-2)' }}>
        {cols.map(c => (
          <div key={c} className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>
            {c.toUpperCase()}
          </div>
        ))}
        {rows.map(r => Object.values(r).map((v, i) => (
          <div key={r.s + i} style={{
            fontFamily: i === 0 ? 'var(--display)' : 'var(--mono)',
            fontSize: i === 0 ? 18 : 12, color: 'var(--fg-2)',
            padding: '14px 0', borderBottom: '1px solid var(--line)',
          }}>{v}</div>
        )))}
      </div>
    </div>
  );

  return (
    <div className="page-fade">
      <PageHero
        eyebrow="SIZE GUIDE"
        title="The numbers,"
        italic="and how to find them."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 1080, margin: '0 auto' }}>
        <Table title="Jackets · inches" cols={['Size', 'Chest', 'Shoulder', 'Sleeve', 'Length']} rows={jacketSizes} />
        <Table title="Trousers · inches" cols={['Size', 'Waist', 'Hip', 'Inseam', 'Rise']} rows={pantSizes} />

        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
              HOW TO MEASURE
            </div>
            {[
              ['Chest', 'Around the fullest part of the chest, under the arms, with the tape level.'],
              ['Shoulder', 'From one shoulder seam to the other, across the back.'],
              ['Sleeve', 'From the shoulder seam to the wrist, with the arm slightly bent.'],
              ['Length', 'From the base of the back collar to the desired hem.'],
              ['Waist', 'At your natural waist, where you would normally wear trousers.'],
              ['Inseam', 'From the crotch to the bottom of the hem on the inside leg.'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{k}</div>
                <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
              CONVERSION
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid var(--line-2)' }}>
              {['Size', 'US', 'UK', 'EU', 'JP'].map(c => (
                <div key={c} className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>{c.toUpperCase()}</div>
              ))}
              {[
                ['XS', '0/2',  '4/6',   '32/34', '5/7'],
                ['S',  '4',    '8',     '36',    '9'],
                ['M',  '6/8',  '10/12', '38/40', '11/13'],
                ['L',  '10',   '14',    '42',    '15'],
                ['XL', '12',   '16',    '44',    '17'],
                ['XXL','14',   '18',    '46',    '19'],
              ].map(row => row.map((v, i) => (
                <div key={row[0] + i} style={{
                  fontFamily: i === 0 ? 'var(--display)' : 'var(--mono)',
                  fontSize: i === 0 ? 18 : 12, color: 'var(--fg-2)',
                  padding: '14px 0', borderBottom: '1px solid var(--line)',
                }}>{v}</div>
              )))}
            </div>
          </div>
        </div>
      </section>

      <CTAStrip
        title="Still unsure?"
        body="Send us your three closest measurements (chest, shoulder, sleeve) and a recent photo of a jacket that fits well. We will reply with a recommendation."
        primary="Write to the fit room"
        ghost="Begin a Made-to-Order"
        onPrimary={() => go('contact')}
        onGhost={() => go('mto')}
      />
    </div>
  );
}

// ── Shipping & Returns ──────────────────────────────────────────────────────

function ShippingReturns({ go, mode = 'shipping' }) {
  const isReturns = mode === 'returns';
  return (
    <div className="page-fade">
      <PageHero
        eyebrow={isReturns ? 'RETURNS & REFUNDS' : 'SHIPPING INFORMATION'}
        title={isReturns ? 'Returns,' : 'Worldwide,'}
        italic={isReturns ? 'handled with care.' : 'shipping available.'}
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 1080, margin: '0 auto' }}>
        {!isReturns && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: '1px solid var(--line)' }}>
          {[
            { region: 'United States',     time: 'At checkout', cost: 'At checkout', notes: 'Tracked delivery' },
            { region: 'European Union',    time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
            { region: 'United Kingdom',    time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
            { region: 'Switzerland · Norway', time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
            { region: 'Canada',            time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
            { region: 'Japan · Australia', time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
            { region: 'Rest of world',     time: 'At checkout', cost: 'At checkout', notes: 'Duties may apply' },
          ].map((r, i) => (
            <div key={r.region} style={{
              padding: '20px 24px', borderBottom: '1px solid var(--line)',
              borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 16, alignItems: 'baseline',
            }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{r.region}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.time}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2)' }}>{r.cost}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{r.notes}</div>
            </div>
          ))}
        </div>}

        {isReturns && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 64 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>RETURNS</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>30 days, on stock pieces.</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.8 }}>
              From the day your piece is signed for, you have thirty days to return it. The piece must be in original condition, with the placket monogram intact. Made-to-Order pieces are final sale, with complimentary fit alterations within 60 days of receipt. Final pieces are sold as-is.
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>HOW</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>One label, one note.</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.8 }}>
              Open the order in your account or use the Contact page. We send return instructions after reviewing the request. Approved refunds are processed after the piece arrives and passes inspection.
            </div>
          </div>
        </div>}
      </section>
    </div>
  );
}

// ── Track order ─────────────────────────────────────────────────────────────

function TrackOrder({ go }) {
  const [orderNumber, setOrderNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [order, setOrder] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [openFaqs, setOpenFaqs] = React.useState([0, 1, 2, 3]);

  const trackingFaqs = [
    {
      q: 'How can I track my order?',
      a: 'Enter your order number and checkout email above. Once your order is dispatched, the latest carrier and tracking details will appear here when they are available.',
    },
    {
      q: 'My order is delayed. What should I do?',
      a: 'Check the carrier tracking first. If there has been no movement for five business days, contact info@motogripgear.com with your order number and we will investigate.',
    },
    {
      q: 'How long will my made-to-measure order take?',
      a: 'Our current production estimate is 2–3 weeks after measurements and design details are approved. Complex custom work may require additional time, which we confirm before production.',
    },
    {
      q: 'How long does shipping take?',
      a: 'Delivery time depends on the destination and courier service. We provide the latest estimate when your order is ready to dispatch; customs processing may add time to international deliveries.',
    },
  ];

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check this order right now.');
      setOrder(data.order);
    } catch (requestError) {
      setError(requestError.message || 'Unable to check this order right now.');
    } finally {
      setLoading(false);
    }
  };

  const label = (value) => String(value || 'Pending').replaceAll('_', ' ').toUpperCase();
  const toggleFaq = (index) => setOpenFaqs((current) =>
    current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
  );

  return (
    <div className="page-fade">
      <PageHero
        eyebrow="ORDER SUPPORT"
        title="Track"
        italic="your order."
        dek="Enter your order number and the email address used at checkout. We will show the latest fulfillment and delivery information available."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 900, margin: '0 auto' }}>
        <form onSubmit={submit} style={{ borderTop: '1px solid var(--line)', paddingTop: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <label>
              <span className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--fg-4)', marginBottom: 8 }}>ORDER NUMBER</span>
              <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="MG-1001" autoComplete="off" autoCapitalize="characters" required
                style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                  fontSize: 15, outline: 'none' }} />
            </label>
            <label>
              <span className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--fg-4)', marginBottom: 8 }}>CHECKOUT EMAIL</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com" autoComplete="email" required
                style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                  fontSize: 15, outline: 'none' }} />
            </label>
          </div>

          <button className="btn" type="submit" disabled={loading}
            style={{ marginTop: 32, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Checking…' : 'Track Order'}
          </button>
        </form>

        <div aria-live="polite">
          {error && (
            <div style={{ marginTop: 32, padding: 24, border: '1px solid var(--accent-2)', background: 'var(--bg-2)' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 8 }}>ORDER NOT FOUND</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7 }}>{error}</div>
              <button className="btn btn-ghost" type="button" style={{ marginTop: 18 }} onClick={() => go('contact')}>Contact Support</button>
            </div>
          )}

          {order && (
            <div className="step-fade" style={{ marginTop: 48, padding: 32, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 10 }}>ORDER · {order.id}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 34, marginBottom: 28 }}>{label(order.fulfillment)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>ORDER DATE</div>
                  <div style={{ color: 'var(--fg-2)' }}>{order.date || 'Available soon'}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>STATUS</div>
                  <div style={{ color: 'var(--fg-2)' }}>{label(order.status)}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>FIT</div>
                  <div style={{ color: 'var(--fg-2)' }}>{order.fit || 'Standard order'}</div>
                </div>
              </div>
              {(order.carrier || order.trackingNumber || order.estimatedDelivery) && (
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)', color: 'var(--fg-3)', lineHeight: 1.8 }}>
                  {order.carrier && <div>Carrier: {order.carrier}</div>}
                  {order.trackingNumber && <div>Tracking number: {order.trackingNumber}</div>}
                  {order.estimatedDelivery && <div>Estimated delivery: {order.estimatedDelivery}</div>}
                  {order.trackingUrl && <a className="mono ulink" href={order.trackingUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 12, color: 'var(--accent-2)', fontSize: 10 }}>OPEN CARRIER TRACKING →</a>}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 80 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>ORDER HELP</div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, margin: '0 0 32px' }}>
            Tracking, <em style={{ color: 'var(--accent-2)' }}>answered.</em>
          </h2>

          <div style={{ borderTop: '1px solid var(--line-2)' }}>
            {trackingFaqs.map((faq, index) => {
              const isOpen = openFaqs.includes(index);
              return (
                <div key={faq.q} style={{ borderBottom: '1px solid var(--line-2)' }}>
                  <button type="button" onClick={() => toggleFaq(index)} aria-expanded={isOpen}
                    style={{ width: '100%', padding: '24px 0', border: 0, background: 'transparent', color: 'var(--fg)',
                      display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 24 }}>{faq.q}</span>
                    <span className="mono" aria-hidden="true" style={{ color: 'var(--accent-2)', fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="step-fade" style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.8, maxWidth: 760, padding: '0 48px 24px 0' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Legal pages ─────────────────────────────────────────────────────────────

function LegalPage({ kind, go }) {
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? [
    {
      t: 'Who we are',
      p: [
        'This Privacy Policy explains how MOTOGRIP GEAR (“we”, “us”, or “our”) handles personal information when you visit motogripgear.com, buy from us, request custom work, contact us, or otherwise use our services.',
      ],
    },
    {
      t: 'Information we collect',
      p: ['Depending on how you use our services, we may collect the following information:'],
      b: [
        'Identity and contact details, including your name, email address, telephone number, billing address, shipping address, and WhatsApp details when you choose to provide them.',
        'Order and transaction details, including products, size, leather, custom options, delivery information, payment confirmation, returns, refunds, and support history.',
        'Fit and customization details, including body measurements, fit preferences, initials, design notes, and photographs you voluntarily provide for made-to-measure or repair services.',
        'Account, enquiry, review, subscription, and communication details that you submit to us.',
        'Technical and usage information, such as IP address, browser and device information, requested pages, server logs, and cart information stored in your browser.',
      ],
    },
    {
      t: 'How we collect information',
      p: [
        'We collect information directly from you, automatically when you use the website, and from service providers involved in payments, fraud prevention, hosting, fulfilment, delivery, and customer support.',
        'If you choose Stripe or PayPal, the payment provider collects payment credentials under its own privacy notice. We receive transaction status and limited order information needed to confirm and support the purchase; MOTOGRIP GEAR does not receive or store your complete card number.',
      ],
    },
    {
      t: 'How and why we use information',
      p: ['We use personal information to:'],
      b: [
        'Provide products and services, process orders, arrange delivery, support returns, and manage made-to-measure or custom work.',
        'Authenticate order-tracking requests and respond to enquiries.',
        'Maintain inventory, accounts, customer records, and service quality.',
        'Detect fraud, secure the website, enforce our terms, and protect customers and our business.',
        'Send marketing communications where you have requested them or where otherwise permitted by law; you may unsubscribe at any time.',
        'Meet legal, tax, accounting, customs, regulatory, and dispute-resolution obligations.',
      ],
      n: 'Our legal reasons may include performing a contract with you, complying with law, pursuing legitimate business interests, and consent where required.',
    },
    {
      t: 'Cookies and local storage',
      p: [
        'The website uses browser storage and similar essential technologies to remember your shopping bag and support core site functions. Our hosting and content-delivery providers may also process basic technical logs needed to serve and protect the website.',
        'You can clear or block browser storage through your browser settings, but parts of the website may then stop working correctly. If we introduce non-essential analytics or advertising cookies, we will provide any notice or consent controls required by applicable law.',
      ],
    },
    {
      t: 'When we share information',
      p: ['We may share relevant information with:'],
      b: [
        'Payment processors such as Stripe and PayPal.',
        'Couriers, fulfilment partners, customs agents, and delivery providers.',
        'Website hosting, infrastructure, security, communications, and customer-service providers.',
        'Professional advisers, insurers, auditors, and authorities where reasonably necessary or legally required.',
        'A buyer, investor, or successor in connection with a genuine business reorganisation or transaction, subject to appropriate protections.',
      ],
      n: 'We do not currently sell personal information for money. Service providers may use information only for their own disclosed purposes and the services they provide.',
    },
    {
      t: 'International transfers',
      p: [
        'MOTOGRIP GEAR serves customers internationally. Information may be processed in the United States, United Kingdom, Pakistan, and other locations where our personnel or service providers operate. Where applicable law requires safeguards for an international transfer, we use an available lawful mechanism and appropriate contractual or organisational protections.',
      ],
    },
    {
      t: 'Retention and security',
      p: [
        'We retain information only as long as reasonably necessary for the purposes described here, including fulfilment, fit support, warranties, tax and accounting requirements, fraud prevention, legal claims, and customer-requested services. Retention periods vary by record type and jurisdiction.',
        'We use reasonable technical and organisational safeguards. No online service or transmission method is completely secure, so please do not send payment credentials or unnecessary sensitive information through ordinary email or contact forms.',
      ],
    },
    {
      t: 'Your privacy rights',
      p: [
        'Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or obtain a copy of personal information, and to withdraw consent. You may also have the right to appeal a decision or complain to your local privacy or data-protection authority.',
        'To make a request, email info@motogripgear.com. We may need to verify your identity and may retain information where required or permitted by law. We will not discriminate against you for exercising an applicable privacy right.',
      ],
    },
    {
      t: 'Children',
      p: ['Our services are not directed to children under 16, and we do not knowingly collect their personal information. A parent or guardian may contact us to request review or deletion of information submitted by a child.'],
    },
    {
      t: 'Changes to this policy',
      p: ['We may update this policy when our services, practices, or legal obligations change. The revised version will be posted here with an updated effective date.'],
    },
  ] : [
    {
      t: 'Acceptance and scope',
      p: [
        'These Terms of Service govern your access to motogripgear.com and your use of products and services offered by MOTOGRIP GEAR (“we”, “us”, or “our”). By using the website or placing an order, you agree to these Terms and the policies referenced on the website.',
        'Nothing in these Terms removes mandatory consumer rights that apply where you live.',
      ],
    },
    {
      t: 'Eligibility and account information',
      p: [
        'You must be legally capable of entering a contract in your jurisdiction. You agree to provide accurate, current information and to keep account or order-access details secure. You are responsible for activity performed using credentials under your control, except where law provides otherwise.',
      ],
    },
    {
      t: 'Products and natural materials',
      p: [
        'We aim to describe and photograph products accurately. Screens, lighting, leather grain, hide markings, patina, and handmade production can cause reasonable variations in colour, texture, and appearance. These natural variations are part of genuine leather and are not automatically defects.',
        'We may change, correct, suspend, or discontinue products, specifications, images, availability, and website content. Material errors will be handled fairly and in accordance with applicable law.',
      ],
    },
    {
      t: 'Prices, taxes, and payment',
      p: [
        'Prices are shown in the currency displayed on the website and may change before an order is accepted. Applicable shipping charges, taxes, duties, or fees will be disclosed where available or may be charged by authorities or carriers at destination.',
        'Payments are processed by third-party providers such as Stripe and PayPal. Their terms and privacy notices also apply to the payment service you select. You represent that you are authorised to use the chosen payment method.',
      ],
    },
    {
      t: 'Orders and acceptance',
      p: [
        'Submitting checkout is an offer to buy. An automated acknowledgement or payment authorisation does not necessarily mean we have accepted the order. Acceptance occurs when we confirm the order or begin fulfilment, subject to applicable law.',
        'We may refuse or cancel an order for legitimate reasons including unavailability, obvious pricing or description errors, suspected fraud, payment failure, export restrictions, or an inability to deliver. If we cancel after receiving cleared payment, we will provide the appropriate refund.',
      ],
    },
    {
      t: 'Made-to-measure and custom orders',
      p: [
        'You are responsible for providing accurate measurements, preferences, and approvals. We may contact you to clarify information before cutting or production. Estimates begin after required measurements and design details are approved and may change for complex work or customer-requested revisions.',
        'Because personalised and made-to-measure pieces are produced to your specifications, cancellation and return rights may be limited where permitted by law. Our Returns & Refunds page explains the applicable policy, including available fit-alteration support.',
      ],
    },
    {
      t: 'Shipping, customs, and delivery',
      p: [
        'Delivery estimates are not guarantees unless we expressly agree otherwise. Delays may occur because of production, carriers, customs, weather, strikes, address issues, or events outside reasonable control. You are responsible for providing a complete deliverable address and cooperating with reasonable delivery or customs requests.',
        'International customers may be responsible for import duties, taxes, brokerage, or customs charges unless checkout or written confirmation expressly states otherwise. Risk and title pass as required by the law applicable to the transaction.',
      ],
    },
    {
      t: 'Returns, refunds, and alterations',
      p: [
        'Returns, refunds, exchanges, and alterations are governed by our Returns & Refunds page and any mandatory rights applicable to you. Returned items must meet the stated eligibility and condition requirements. Approved refunds are issued to the original payment method where reasonably possible.',
      ],
    },
    {
      t: 'Product use and safety',
      p: [
        'Unless a product description expressly states a tested protective certification, our leather apparel is not represented as certified impact-protective motorcycle equipment. Customers are responsible for selecting suitable protective equipment, sizing, care, and use for their activities. Follow all care instructions and inspect products before use.',
      ],
    },
    {
      t: 'Intellectual property',
      p: [
        'The MOTOGRIP name, logos, product designs, photography, text, graphics, website layout, and other content are owned by or licensed to us and protected by applicable intellectual-property laws. You may use the website for personal, non-commercial shopping purposes only. No content may be copied, republished, sold, scraped, or exploited without permission or another lawful basis.',
      ],
    },
    {
      t: 'Acceptable use',
      p: ['You must not misuse the website, interfere with its security or operation, introduce malicious code, scrape or harvest information without permission, impersonate another person, submit unlawful or infringing material, commit fraud, or use the service in violation of applicable law.'],
    },
    {
      t: 'Third-party services and links',
      p: ['The website may link to or rely on independent services, including payment processors and carriers. Their services are governed by their own terms. We are not responsible for third-party content or conduct, except to the extent responsibility cannot lawfully be excluded.'],
    },
    {
      t: 'Service availability and liability',
      p: [
        'We work to keep the website accurate, secure, and available, but do not promise uninterrupted or error-free access. To the fullest extent permitted by law, implied warranties are excluded and liability for indirect or consequential loss is limited.',
        'Nothing in these Terms excludes or limits liability where doing so would be unlawful, including liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence where applicable, or mandatory consumer protections. Where liability may lawfully be limited, our aggregate liability relating to an order will not exceed the amount paid for that order.',
      ],
    },
    {
      t: 'Events outside our control',
      p: ['We are not responsible for delay or failure caused by events beyond reasonable control. We will take reasonable steps to reduce disruption and communicate material effects on accepted orders.'],
    },
    {
      t: 'Governing law and disputes',
      p: [
        'These Terms are governed by the law applicable to the MOTOGRIP entity handling the transaction, subject to mandatory consumer protections and jurisdiction rules where you live. Please contact us first so we can try to resolve any concern promptly. Nothing here prevents you from using a court, regulator, or dispute process available under applicable law.',
      ],
    },
    {
      t: 'Changes and severability',
      p: ['We may update these Terms by posting a revised version with a new effective date. Changes apply prospectively unless law requires otherwise. If any provision is held unenforceable, the remaining provisions continue to the extent permitted by law.'],
    },
  ];

  return (
    <div className="page-fade">
      <PageHero
        eyebrow="LEGAL · MOTOGRIP GEAR"
        title={isPrivacy ? 'Privacy' : 'Terms of'}
        italic={isPrivacy ? 'policy.' : 'service.'}
        dek={isPrivacy
          ? 'How we collect, use, share, and protect personal information across our international store and services.'
          : 'The conditions that govern use of our website, products, orders, and made-to-measure services.'}
        meta="EFFECTIVE · 20 JULY 2026"
      />

      <section className="legal-page-section" style={{ padding: '0 48px 96px', maxWidth: 980, margin: '0 auto' }}>
        {sections.map((section, index) => (
          <article className="legal-row" key={section.t} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 32, padding: '36px 0', borderTop: '1px solid var(--line)' }}>
            <div className="mono" style={{ color: 'var(--accent-2)', fontSize: 10 }}>{String(index + 1).padStart(2, '0')}</div>
            <div>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 30, margin: '0 0 14px' }}>{section.t}</h2>
              {section.p.map((paragraph) => (
                <p key={paragraph} style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.85, margin: '0 0 12px' }}>{paragraph}</p>
              ))}
              {section.b && (
                <ul style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.8, margin: '12px 0', paddingLeft: 20 }}>
                  {section.b.map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}
                </ul>
              )}
              {section.n && <p style={{ color: 'var(--fg-2)', fontSize: 13, lineHeight: 1.8, margin: '14px 0 0' }}>{section.n}</p>}
            </div>
          </article>
        ))}

        <article className="legal-row" style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 32, padding: '36px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="mono" style={{ color: 'var(--accent-2)', fontSize: 10 }}>{String(sections.length + 1).padStart(2, '0')}</div>
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 30, margin: '0 0 18px' }}>Contact MOTOGRIP GEAR</h2>
            <div className="legal-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--fg-2)' }}>MOTOGRIP GEAR LLC</strong><br/>
                1172 N Main St, Waterbury, CT 06704, United States<br/>
                +1 860 397 3707<br/>
                WhatsApp: +1 860 397 3707
              </div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--fg-2)' }}>MOTOGRIP LIMITED</strong><br/>
                Unit 16, Lonsdale Works, Bradford BD3 9TF, United Kingdom<br/>
                +44 7309 114348<br/>
                WhatsApp: +44 7309 114348
              </div>
            </div>
            <div className="mono" style={{ color: 'var(--accent-2)', fontSize: 10, marginTop: 24 }}>INFO@MOTOGRIPGEAR.COM</div>
          </div>
        </article>

        <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => go(isPrivacy ? 'terms' : 'privacy')}>
            {isPrivacy ? 'Read Terms of Service' : 'Read Privacy Policy'}
          </button>
          <button className="btn btn-ghost" onClick={() => go('contact')}>Contact Us</button>
        </div>
      </section>
    </div>
  );
}

// ── Contact ─────────────────────────────────────────────────────────────────

function Contact({ go }) {
  const [pathway, setPathway] = React.useState('fit');
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="CONTACT"
        title="Three pathways,"
        italic="each goes to a real human."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 48 }}>
          {[
            { id: 'fit',       t: 'Fit Room',  e: 'Use the contact form below', c: 'General enquiries, sizing, returns, and repairs.' },
            { id: 'custom',    t: 'Custom',    e: 'Use the contact form below', c: 'Made-to-measure orders, custom work, and appointments.' },
            { id: 'press',     t: 'Press',     e: 'Use the contact form below', c: 'Press kit, imagery, brand notes, and product details.' },
          ].map(p => (
            <div key={p.id} onClick={() => setPathway(p.id)}
              style={{
                padding: 32, cursor: 'pointer',
                border: `1px solid ${pathway === p.id ? 'var(--accent-2)' : 'var(--line)'}`,
                background: pathway === p.id ? 'var(--bg-2)' : 'transparent',
                marginRight: -1, marginBottom: -1,
              }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>{p.t}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 12 }}>{p.e}</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7 }}>{p.c}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
              A SHORT NOTE
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>NAME</div>
              <input placeholder="Your name"
                style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                  fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>EMAIL</div>
              <input type="email" placeholder="you@somewhere.com"
                style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                  fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 6 }}>MESSAGE</div>
              <textarea rows={5} placeholder="A short note. We will reply, in this hand."
                style={{ width: '100%', padding: '12px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)',
                  fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>
            <button className="btn">Send</button>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
              COMPANY DETAILS
            </div>
            {SSM_STOCKISTS.map((s, i) => (
              <div key={s.name} style={{ padding: '0 0 24px', marginBottom: 24, borderBottom: i < SSM_STOCKISTS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 24, lineHeight: 1.3, marginBottom: 12 }}>
                  {s.name}
                </div>
                <div style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.8 }}>
                  {s.addr}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 14, lineHeight: 1.8 }}>
                  CONTACT · {s.phone}<br/>
                  WHATSAPP · {s.whatsapp}<br/>
                  {s.email}
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => go('stockists')}>
              View company locations
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── 404 ─────────────────────────────────────────────────────────────────────

function NotFound({ go }) {
  return (
    <div className="page-fade" style={{ minHeight: '60vh' }}>
      <section style={{ padding: '120px 48px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16, letterSpacing: '0.4em' }}>
          ✦ &nbsp; 404 &nbsp; ✦
        </div>
        <h1 className="display" style={{
          fontSize: 'clamp(48px, 7vw, 104px)', margin: 0, lineHeight: 0.95, fontWeight: 400,
        }}>
          This gear is no longer<br/><em style={{ color: 'var(--accent-2)' }}>available.</em>
        </h1>
        <div style={{ color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.7, marginTop: 32 }}>
          The page you were looking for has either been retired, repaired, or never existed. The collection is just through there.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40 }}>
          <button className="btn" onClick={() => go('shop')}>Browse the collection</button>
          <button className="btn btn-ghost" onClick={() => go('home')}>Back to the house</button>
        </div>
      </section>

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          STILL HERE · A FEW PIECES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {SSM_PRODUCTS.slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} onQuickView={() => {}} go={go} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Search results ─────────────────────────────────────────────────────────

function SearchResults({ go, query, onQuickView }) {
  const q = (query || '').toLowerCase().trim();
  const products = q
    ? SSM_PRODUCTS.filter(p =>
        (p.name + ' ' + p.cat + ' ' + p.gender + ' ' + p.blurb).toLowerCase().includes(q))
    : [];
  const journal = q
    ? SSM_JOURNAL.filter(j =>
        (j.title + ' ' + j.cat + ' ' + j.dek).toLowerCase().includes(q))
    : [];

  return (
    <div className="page-fade">
      <PageHero
        eyebrow="SEARCH"
        title={q ? <>Results for</> : <>Search the</>}
        italic={q ? `"${query}".` : 'gear.'}
        meta={q ? `${products.length} pieces · ${journal.length} essays` : ''}
      />

      {!q && (
        <section style={{ padding: '0 48px 96px', textAlign: 'center', color: 'var(--fg-3)' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22 }}>
            Use the search bar in the header.
          </div>
        </section>
      )}

      {q && products.length === 0 && journal.length === 0 && (
        <section style={{ padding: '0 48px 96px', textAlign: 'center', color: 'var(--fg-3)' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>
            Nothing matches that exact word.
          </div>
          <div className="mono" style={{ fontSize: 10 }}>TRY 'JACKETS', 'COGNAC', 'VOLTAIRE', OR 'TANNING'</div>
          <button className="btn" style={{ marginTop: 24 }} onClick={() => go('shop')}>Browse the collection</button>
        </section>
      )}

      {products.length > 0 && (
        <section style={{ padding: '0 48px 64px' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
            PIECES · {products.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {products.map(p => <ProductCard key={p.id} product={p} onQuickView={onQuickView} go={go} />)}
          </div>
        </section>
      )}

      {journal.length > 0 && (
        <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
            ESSAYS · {journal.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {journal.map(j => (
              <div key={j.id} onClick={() => go('article', { article: j })} style={{ cursor: 'pointer' }} className="card">
                <div className="ph card-img" data-img="1" data-label=""
                  style={{ aspectRatio: '4/5', '--img': `url(${j.hero})` }} />
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginTop: 12 }}>
                  {j.cat.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginTop: 6 }}>{j.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, {
  Journal, JournalArticle, Care, Repairs, Concierge, Sustainability,
  Stockists, Press, GiftCards, FAQ, SizeGuide, ShippingReturns,
  TrackOrder, LegalPage, Contact, NotFound, SearchResults,
  PageHero, PrincipleTriad, EditorialQuote, CTAStrip,
});
