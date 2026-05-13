// MTO Configurator — step-by-step

function MTO({ go, startWith, addToCart }) {
  const [step, setStep] = React.useState(0);
  const [config, setConfig] = React.useState({
    silhouette: 'voltaire',
    leather: SSM_LEATHERS[0].id,
    hardware: SSM_HARDWARE[0].id,
    lining: SSM_LININGS[0].id,
    initials: '',
    size: 'M',
  });

  const update = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const silhouettes = [
    { id: 'voltaire', name: 'The Voltaire', sub: 'Asymmetric biker', price: 1280, img: SSM_PRODUCTS[0].img },
    { id: 'hadley', name: 'The Hadley', sub: 'Café racer', price: 1180, img: SSM_PRODUCTS[1].img },
    { id: 'ridgemont', name: 'The Ridgemont', sub: 'Double rider', price: 1450, img: SSM_PRODUCTS[4].img },
    { id: 'idris', name: 'The Idris', sub: 'Long coat', price: 1490, img: SSM_PRODUCTS[8].img },
  ];

  const steps = [
    { id: 'silhouette', label: 'Silhouette' },
    { id: 'leather', label: 'Leather' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'lining', label: 'Lining' },
    { id: 'monogram', label: 'Monogram' },
    { id: 'review', label: 'Review' },
  ];

  const selSilhouette = silhouettes.find(s => s.id === config.silhouette);
  const selLeather = SSM_LEATHERS.find(l => l.id === config.leather);
  const selHardware = SSM_HARDWARE.find(h => h.id === config.hardware);
  const selLining = SSM_LININGS.find(l => l.id === config.lining);

  const totalPrice = selSilhouette.price + 280 + (config.initials ? 60 : 0);

  return (
    <div className="page-fade">
      <div style={{ padding: '40px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>FIT LAB · MADE TO MEASURE</div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 6vw, 88px)', margin: 0, lineHeight: 0.95, fontWeight: 400 }}>
            Begin a commission.
          </h1>
        </div>
        <div style={{ color: 'var(--fg-3)', fontSize: 13, maxWidth: 360, paddingBottom: 8 }}>
          Six steps. One craftsperson. Six to ten weeks from final approval to delivery.
        </div>
      </div>

      {/* Stepper */}
      <div style={{ padding: '32px 48px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', display: 'flex', gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s.id} onClick={() => setStep(i)}
            style={{ flex: 1, cursor: 'pointer', position: 'relative', paddingRight: 16 }}>
            <div style={{
              height: 1, background: i <= step ? 'var(--accent-2)' : 'var(--line)',
              marginBottom: 12, transition: 'background 0.4s',
            }} />
            <div className="mono" style={{ fontSize: 9, color: i <= step ? 'var(--accent-2)' : 'var(--fg-4)', marginBottom: 4 }}>
              0{i + 1}
            </div>
            <div style={{ color: i === step ? 'var(--fg)' : 'var(--fg-3)', fontFamily: 'var(--display)', fontSize: 18 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', minHeight: 600 }}>
        {/* Left: configurator */}
        <div style={{ padding: '64px 48px', borderRight: '1px solid var(--line)' }}>
          {step === 0 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 01 · CHOOSE A SILHOUETTE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {silhouettes.map(s => (
                  <div key={s.id} onClick={() => update('silhouette', s.id)}
                    style={{
                      cursor: 'pointer', padding: 4,
                      border: `1px solid ${config.silhouette === s.id ? 'var(--accent-2)' : 'var(--line)'}`,
                      transition: 'border 0.2s',
                    }}>
                    <div className="ph" data-img="1" data-label=""
                      style={{ aspectRatio: '4/5', '--img': `url(${s.img})` }} />
                    <div style={{ padding: '14px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{s.name}</div>
                        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{s.sub.toUpperCase()}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>from ${s.price.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 02 · CHOOSE THE LEATHER</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {SSM_LEATHERS.map(l => (
                  <div key={l.id} onClick={() => update('leather', l.id)}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${config.leather === l.id ? 'var(--accent-2)' : 'var(--line)'}`,
                      padding: 16, transition: 'all 0.2s',
                    }}>
                    <div style={{
                      aspectRatio: '4/3', background: l.swatch, marginBottom: 14,
                      backgroundImage: `${l.swatch.includes('#0a') ? 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent)' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.15))'}`,
                    }} />
                    <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{l.name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{l.desc.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 03 · HARDWARE FINISH</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {SSM_HARDWARE.map(h => (
                  <div key={h.id} onClick={() => update('hardware', h.id)}
                    style={{
                      cursor: 'pointer', padding: 24,
                      border: `1px solid ${config.hardware === h.id ? 'var(--accent-2)' : 'var(--line)'}`,
                      display: 'flex', alignItems: 'center', gap: 24,
                    }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: h.css, flexShrink: 0,
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.4)' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 22 }}>{h.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>YKK EXCELLA · BUTTONS · BUCKLES</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 04 · LINING</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {SSM_LININGS.map(l => (
                  <div key={l.id} onClick={() => update('lining', l.id)}
                    style={{
                      cursor: 'pointer', padding: 4,
                      border: `1px solid ${config.lining === l.id ? 'var(--accent-2)' : 'var(--line)'}`,
                    }}>
                    <div style={{
                      aspectRatio: '5/3',
                      background: l.pattern,
                      boxShadow: 'inset 0 0 32px rgba(0,0,0,0.12)',
                    }} />
                    <div style={{ padding: '14px 12px' }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{l.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 4 }}>{l.desc.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 05 · MONOGRAM (OPTIONAL)</div>
              <div style={{ maxWidth: 480 }}>
                <div style={{ color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  Up to four characters, hand-debossed inside the placket. Add $60.
                </div>
                <input type="text" value={config.initials} maxLength={4}
                  onChange={e => update('initials', e.target.value.toUpperCase())}
                  placeholder="—"
                  style={{
                    width: '100%', padding: '24px 0', background: 'transparent',
                    border: 'none', borderBottom: '1px solid var(--line-2)',
                    fontFamily: 'var(--display)', fontSize: 56, color: 'var(--fg)',
                    textAlign: 'center', letterSpacing: '0.4em', outline: 'none',
                  }} />
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 12, textAlign: 'center' }}>
                  4 CHARACTERS · DEBOSSED IN COGNAC
                </div>
              </div>
              <div style={{ marginTop: 48 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 16 }}>SIZE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, maxWidth: 480 }}>
                  {['XS','S','M','L','XL','XXL'].map(s => (
                    <span key={s} onClick={() => update('size', s)} style={{
                      height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${config.size === s ? 'var(--fg)' : 'var(--line-2)'}`,
                      background: config.size === s ? 'var(--fg)' : 'transparent',
                      color: config.size === s ? 'var(--bg)' : 'var(--fg-2)',
                      fontSize: 13, cursor: 'pointer',
                    }}>{s}</span>
                  ))}
                </div>
                <div className="mono ulink" style={{ fontSize: 10, color: 'var(--accent-2)', marginTop: 12, display: 'inline-block' }}>
                  REQUEST IN-PERSON FITTING ↗
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-fade">
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 24 }}>STEP 06 · YOUR COMMISSION</div>
              <div style={{ background: 'var(--bg-2)', padding: 32, border: '1px solid var(--line)' }}>
                {[
                  ['Silhouette', selSilhouette.name],
                  ['Leather', selLeather.name],
                  ['Hardware', selHardware.name],
                  ['Lining', selLining.name],
                  ['Monogram', config.initials || '—'],
                  ['Size', config.size],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{k.toUpperCase()}</span>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.7 }}>
                Submission begins your commission. We will write within 48 hours to confirm details, schedule a fitting (in person or virtual), and assign your craftsperson.
              </div>
            </div>
          )}

          {/* Step nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <button className="btn btn-ghost" onClick={() => setStep(Math.max(0, step - 1))}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              ← Back
            </button>
            {step < steps.length - 1 ? (
              <button className="btn" onClick={() => setStep(step + 1)}>
                Continue · {steps[step + 1].label} <Icon name="arrow" size={14} />
              </button>
            ) : (
              <button className="btn" onClick={() => {
                addToCart({ ...selSilhouette, name: selSilhouette.name + ' (MTO)', price: totalPrice, blurb: 'Made to order commission', img: selSilhouette.img },
                  { leather: selLeather.name, size: config.size });
                go('home');
              }}>
                Submit Commission · ${totalPrice.toLocaleString()}
              </button>
            )}
          </div>
        </div>

        {/* Right: live summary */}
        <aside style={{ padding: 48, position: 'sticky', top: 80, alignSelf: 'flex-start', height: 'fit-content' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>YOUR COMMISSION</div>
          <div className="ph grain" data-img="1" data-label=""
            style={{ aspectRatio: '4/5', marginBottom: 24, '--img': `url(${selSilhouette.img})` }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>BASE</span>
            <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>${selSilhouette.price.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>BESPOKE FEE</span>
            <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>$280</span>
          </div>
          {config.initials && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>MONOGRAM</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>$60</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 12px' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>TOTAL</span>
            <span style={{ fontFamily: 'var(--display)', fontSize: 28 }}>${totalPrice.toLocaleString()}</span>
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', textAlign: 'right' }}>50% AT SUBMISSION · 50% AT DELIVERY</div>

          <div style={{ marginTop: 32, padding: 20, background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--accent-2)', marginBottom: 6 }}>EST. DELIVERY</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22 }}>August 2026</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 6 }}>Shipped from the MOTOGRIP Fit Garage, signed for at receipt.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { MTO });
