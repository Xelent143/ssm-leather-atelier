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
        <div key={p.n}>
          <div className="display" style={{
            fontSize: 64, color: 'var(--accent-2)', lineHeight: 1, marginBottom: 16,
          }}>{p.n}</div>
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
        eyebrow="VI · JOURNAL"
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
          II · ARCHIVE · MMXXVI
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
        body="Subscribe to atelier dispatches — we send a short note when a journal entry, a lookbook chapter or a small batch of pieces leaves the workshop. No discounts, no surveys, no other people's products."
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
        eyebrow="VII · CARE"
        title="A small ritual,"
        italic="repeated slowly."
        dek="Five steps, written by the people who cut the leather. Read once; refer back twice a year."
        image={SSM_IMAGES.care}
        height={540}
      />

      <section style={{ padding: '0 48px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {SSM_CARE.map((s, i) => (
            <div key={s.n} style={{
              padding: '40px 48px',
              borderTop: i < 2 ? 'none' : '1px solid var(--line)',
              borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
              borderBottom: '1px solid var(--line)',
            }}>
              <div className="display" style={{
                fontSize: 56, color: 'var(--accent-2)', lineHeight: 1, marginBottom: 12,
              }}>{s.n}</div>
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
        eyebrow="VIII · REPAIRS & RESTORATION"
        title="Bring it back"
        italic="at fifty."
        dek="Every piece carries a lifetime repair promise. Stitching, hardware, lining, edge burnishing, conditioning — for as long as the workshop stands."
        image={SSM_IMAGES.repairs}
      />

      <PrincipleTriad items={[
        { n: 'I', t: 'Post', c: 'Write to repairs@ssm.example with photos. We respond within two working days with a return label and a short questionnaire.' },
        { n: 'II', t: 'Assess', c: 'Your piece is examined by the maker who signed it, where possible. We send a quote and a timeline. Most work is included; some is not. We are honest about both.' },
        { n: 'III', t: 'Return', c: 'Approximately six weeks from receipt. We ship it back signed-for, conditioned, with a small handwritten note from the bench.' },
      ]} />

      <section style={{ padding: '0 48px 96px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 24 }}>
          IV · WHAT IS COVERED
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
        eyebrow="IX · CONCIERGE & BESPOKE"
        title="A piece"
        italic="from a single conversation."
        dek="Bespoke is the ground-up commission — your silhouette, your hide, your hardware, fit in person at the Brooklyn studio. Beyond Made-to-Order. Reserved for the houses we already know."
        image={SSM_IMAGES.concierge}
      />

      <section style={{ padding: '0 48px 96px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            II · WHAT IS BESPOKE
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
            III · HOW IT WORKS
          </div>
          {[
            { n: '01', t: 'Initial conversation', c: 'A 45-minute call or studio visit. We discuss your wardrobe, the piece you have in mind, and whether bespoke is the right answer.' },
            { n: '02', t: 'First fitting', c: 'In Brooklyn or by appointment in Paris. Measurements, hide selection, sketches.' },
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
          IV · ELIGIBILITY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { t: 'Existing client', c: 'You already own one or more SSM pieces.' },
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
        eyebrow="X · SUSTAINABILITY"
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
          IV · BY THE NUMBERS · MMXXV
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
          V · WHERE WE ARE STILL WORKING
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
        eyebrow="XI · STOCKISTS & STUDIO"
        title="Three doors"
        italic="and a calendar."
        dek="The Brooklyn studio is the home of the workshop. Paris is by appointment. Tokyo we visit twice a year."
      />

      <section style={{ padding: '0 48px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {SSM_STOCKISTS.map((s, i) => (
            <div key={s.name} style={{
              padding: 40,
              borderRight: i < SSM_STOCKISTS.length - 1 ? '1px solid var(--line)' : 'none',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
              background: s.primary ? 'var(--bg-2)' : 'transparent',
            }}>
              {s.primary && (
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 12 }}>
                  THE WORKSHOP
                </div>
              )}
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 6 }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 20 }}>
                {s.city.toUpperCase()}
              </div>
              <div style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.7 }}>{s.addr}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 16 }}>
                {s.hours.toUpperCase()}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                {s.phone}
              </div>
              {s.primary && (
                <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => go('contact')}>
                  Book an appointment
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <CTAStrip
        title="Visiting Brooklyn?"
        body="Write ahead. The workshop is small; we open the door for one client at a time and we want yours to be unhurried."
        primary="Request a studio visit"
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
        eyebrow="XII · PRESS"
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
          press@ssm.example
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
        eyebrow="XIII · GIFT CARDS"
        title="A piece,"
        italic="but unchosen."
        dek="A small leather card, hand-numbered, with a handwritten note on the back. Sent in a linen envelope by post or, if you cannot wait, by email."
      />

      <section style={{ padding: '0 48px 96px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            II · DENOMINATION
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
            III · MESSAGE
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
            IV · PREVIEW
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
                ATELIER · GIFT
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 36, color: '#e8d9b8', letterSpacing: '0.32em' }}>SSM</div>
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
        eyebrow="XIV · FREQUENTLY ASKED"
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
        body="Write to us. The atelier inbox is read by a real person; we generally reply within a working day."
        primary="Write to the atelier"
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
        eyebrow="XV · SIZE GUIDE"
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
        primary="Write to the atelier"
        ghost="Begin a Made-to-Order"
        onPrimary={() => go('contact')}
        onGhost={() => go('mto')}
      />
    </div>
  );
}

// ── Shipping & Returns ──────────────────────────────────────────────────────

function ShippingReturns({ go }) {
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="XVI · SHIPPING & RETURNS"
        title="Complimentary,"
        italic="signed for."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: '1px solid var(--line)' }}>
          {[
            { region: 'United States',     time: '2–3 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'European Union',    time: '3–5 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'United Kingdom',    time: '3–5 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'Switzerland · Norway', time: '3–5 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'Canada',            time: '4–6 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'Japan · Australia', time: '5–7 working days', cost: 'Complimentary', notes: 'Duties included' },
            { region: 'Rest of world',     time: '5–10 working days', cost: 'Complimentary', notes: 'Duties at checkout' },
            { region: 'White Glove · NYC + LDN', time: 'By appointment', cost: '+ $40', notes: 'Hand-delivered, fitting included' },
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
        </div>

        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 64 }}>
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
              Open the order in your account or write to atelier@ssm.example. We send a return label and a small leather pouch in the post. Refunds process within three working days of the piece arriving back at the workshop.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Contact ─────────────────────────────────────────────────────────────────

function Contact({ go }) {
  const [pathway, setPathway] = React.useState('atelier');
  return (
    <div className="page-fade">
      <PageHero
        eyebrow="XVII · CONTACT"
        title="Three pathways,"
        italic="each goes to a real human."
      />

      <section style={{ padding: '0 48px 96px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 48 }}>
          {[
            { id: 'atelier',   t: 'Atelier',   e: 'atelier@ssm.example',   c: 'General enquiries, sizing, returns, repairs. Replies within one working day.' },
            { id: 'concierge', t: 'Concierge', e: 'concierge@ssm.example', c: 'Bespoke commissions, in-person fittings, private appointments. Replies within two working days.' },
            { id: 'press',     t: 'Press',     e: 'press@ssm.example',     c: 'Press kit, lookbook PDFs, founders\' bios. Replies within two working days.' },
          ].map(p => (
            <div key={p.id} onClick={() => setPathway(p.id)}
              style={{
                padding: 32, cursor: 'pointer',
                border: `1px solid ${pathway === p.id ? 'var(--accent-2)' : 'var(--line)'}`,
                background: pathway === p.id ? 'var(--bg-2)' : 'transparent',
                marginRight: -1, marginBottom: -1,
              }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
                {p.id === 'atelier' ? 'I' : p.id === 'concierge' ? 'II' : 'III'}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>{p.t}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 12 }}>{p.e}</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7 }}>{p.c}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
              IV · A SHORT NOTE
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
              V · BY HAND, BY FOOT
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 24, lineHeight: 1.3, marginBottom: 16 }}>
              The Brooklyn Atelier
            </div>
            <div style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.8 }}>
              143 Greenpoint Avenue<br/>Brooklyn, NY 11222<br/>United States
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 20, lineHeight: 1.8 }}>
              TUE–SAT · 11–6<br/>BY APPOINTMENT<br/>+1 (212) 555 0143
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => go('stockists')}>
              Other locations
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
          ✦ &nbsp; XVIII · 404 &nbsp; ✦
        </div>
        <h1 className="display" style={{
          fontSize: 'clamp(48px, 7vw, 104px)', margin: 0, lineHeight: 0.95, fontWeight: 400,
        }}>
          This piece is no longer<br/><em style={{ color: 'var(--accent-2)' }}>in the atelier.</em>
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
        eyebrow="XIX · SEARCH"
        title={q ? <>Results for</> : <>Search the</>}
        italic={q ? `"${query}".` : 'atelier.'}
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
  Contact, NotFound, SearchResults,
  PageHero, PrincipleTriad, EditorialQuote, CTAStrip,
});
