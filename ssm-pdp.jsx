// PDP — Product Detail Page.
//
// Reads p.story / p.maker / p.stock from ssm-data.jsx so each product has a
// real, signed-by-the-maker narrative. Adds a sold-out-aware size grid,
// a "notify when restocked" affordance, a Piece Story panel, a Press &
// Reviews block, and a sticky bottom add-to-bag bar on narrow screens.

function selectEditorialCloseUp(images = []) {
  const dedicated = images.find(image => /close[-_ ]?up/i.test(`${image.src} ${image.label}`))
    || images.find(image => /(detail|pocket|collar|hardware|stitch|texture|cuff|zip)/i.test(`${image.src} ${image.label}`));
  if (dedicated) return { ...dedicated, isFallbackCrop: false };
  const genuineProductView = images.find(image => !/(model|back|infographic|lifestyle|swatch)/i.test(`${image.src} ${image.label}`))
    || images[0] || null;
  return genuineProductView ? { ...genuineProductView, isFallbackCrop: true } : null;
}

function FactualPDP({ product: p, go, addToCart }) {
  const sellableVariants = (p.variants || []).filter(variant =>
    variant.status !== 'disabled' && variant.availableForSale !== false);
  const initialVariant = sellableVariants.find(variant => Number(variant.quantity || 0) > 0)
    || sellableVariants[0] || null;
  const initialSelection = Object.fromEntries((p.options || []).map(option => {
    const key = option.name.toLowerCase();
    return [key, initialVariant?.attributes?.[key] || option.values?.[0] || ''];
  }));
  const [selection, setSelection] = React.useState(initialSelection);
  const [imgIdx, setImgIdx] = React.useState(0);
  const [openSection, setOpenSection] = React.useState('description');
  const [fitChartUnit, setFitChartUnit] = React.useState('inch');
  const [fitMode, setFitMode] = React.useState('standard');
  const [measurements, setMeasurements] = React.useState({
    height: '', chest: '', naturalWaist: '', lowerWaist: '',
    shoulder: '', hips: '', sleeves: '', weight: '',
  });
  const images = (p.images || [p.img, p.alt]).filter(Boolean).map((src, index) => ({
    src,
    label: p.imageMetadata?.find(item => item.path === src)?.altText ||
      (index === 0 ? `${p.name} featured image` : `${p.name} image ${index + 1}`),
  }));
  const editorialCloseUp = selectEditorialCloseUp(images);
  const selectedVariant = sellableVariants.find(variant =>
    Object.entries(selection).every(([key, value]) =>
      !value || !variant.attributes?.[key] || variant.attributes[key] === value)) || null;
  const baseSelectedPrice = Number(selectedVariant?.price ?? p.price ?? 0);
  const madeToMeasureSurcharge = Number(p.madeToMeasureSurcharge ?? 50);
  const isMadeToMeasure = fitMode === 'made-to-measure';
  const selectedPrice = baseSelectedPrice + (isMadeToMeasure ? madeToMeasureSurcharge : 0);
  const selectedCompareAt = Number(selectedVariant?.compareAtPrice ?? p.compareAtPrice ?? 0);
  const validCompareAt = selectedCompareAt > selectedPrice;
  const discount = validCompareAt && selectedCompareAt > 0
    ? Math.round(((selectedCompareAt - selectedPrice) / selectedCompareAt) * 100) : 0;
  const selectedAvailable = Boolean(selectedVariant &&
    Number(selectedVariant.quantity || 0) > 0 &&
    selectedVariant.status !== 'disabled' && selectedVariant.availableForSale !== false);
  const selectedMedia = p.imageMetadata?.find(item => item.id === selectedVariant?.imageId);

  React.useEffect(() => {
    if (!selectedMedia?.path) return;
    const nextIndex = images.findIndex(image => image.src === selectedMedia.path);
    if (nextIndex >= 0) setImgIdx(nextIndex);
  }, [selectedVariant?.id]);

  const optionAvailable = (optionName, value) => {
    const key = optionName.toLowerCase();
    const candidate = { ...selection, [key]: value };
    return sellableVariants.some(variant =>
      Number(variant.quantity || 0) > 0 &&
      Object.entries(candidate).every(([candidateKey, candidateValue]) =>
        !candidateValue || !variant.attributes?.[candidateKey] ||
        variant.attributes[candidateKey] === candidateValue));
  };
  const chooseOption = (optionName, value) => {
    const key = optionName.toLowerCase();
    const candidate = { ...selection, [key]: value };
    const compatible = sellableVariants.find(variant =>
      Object.entries(candidate).every(([candidateKey, candidateValue]) =>
        !candidateValue || !variant.attributes?.[candidateKey] ||
        variant.attributes[candidateKey] === candidateValue));
    setSelection(compatible ? {
      ...candidate,
      ...Object.fromEntries(Object.entries(compatible.attributes || {})),
    } : candidate);
  };
  const updateMeasurement = (key, value) => setMeasurements(current => ({ ...current, [key]: value }));
  const measurementFields = [
    ['height', 'Height', 'in/cm'], ['chest', 'Chest', 'in/cm'],
    ['naturalWaist', 'Natural waist', 'in/cm'], ['lowerWaist', 'Lower waist', 'in/cm'],
    ['shoulder', 'Shoulder', 'in/cm'], ['hips', 'Hips', 'in/cm'],
    ['sleeves', 'Sleeves', 'in/cm'], ['weight', 'Weight', 'lbs'],
  ];
  const categoryText = `${p.cat || ''} ${p.category || ''} ${p.productType || ''}`.toLowerCase();
  const isVest = categoryText.includes('vest');
  const isPants = categoryText.includes('pant') || categoryText.includes('trouser') || categoryText.includes('chap');
  const isChaps = categoryText.includes('chap');
  const isUpperBody = categoryText.includes('jacket') || categoryText.includes('shirt');
  const isSizedApparel = isVest || isPants || isUpperBody;
  const selectedSizeName = selection.size || selection.waist || null;
  const editorialCategory = isVest ? 'Vest' : isPants ? 'Trousers' : categoryText.includes('shirt') ? 'Leather Shirt' : isUpperBody ? 'Jacket' : 'Piece';
  const editorialOwner = p.gender === 'Women' ? "Women's" : p.gender === 'Men' ? "Men's" : 'Unisex';
  const factual = value => value !== undefined && value !== null && value !== '';
  const displayValue = value => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const metafieldLabels = {
    outerMaterial: 'Outer material',
    leatherType: 'Leather type',
    leatherThickness: 'Leather thickness',
    liningMaterial: 'Lining',
    closure: 'Closure',
    hardware: 'Hardware',
    pocketCount: 'Pocket count',
    concealedCarryPockets: 'Concealed-carry pockets',
    armorCompatibility: 'Armor compatibility',
    collar: 'Collar',
    sleeveType: 'Sleeve type',
    fit: 'Fit',
    countryOfManufacture: 'Country of manufacture',
    careInstructions: 'Care instructions',
    customSizingAvailable: 'Custom sizing available',
    personalizationAvailable: 'Personalization available',
  };
  const productDetails = Object.entries(metafieldLabels)
    .filter(([key]) => factual(p.metafields?.[key]))
    .map(([key, label]) => [label, displayValue(p.metafields[key])]);
  if (factual(p.shippingWeight)) productDetails.push(['Shipping weight', p.shippingWeight]);
  if (factual(p.shipping?.countryOfOrigin)) productDetails.push(['Country of origin', p.shipping.countryOfOrigin]);
  const sectionValue = value => {
    if (Array.isArray(value)) {
      if (!value.length) return null;
      if (Array.isArray(value[0])) return (
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          {value.map(([label, content]) => (
            <div key={`${label}-${content}`} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>{String(label).toUpperCase()}</div>
              <div>{displayValue(content)}</div>
            </div>
          ))}
        </div>
      );
      if (typeof value[0] === 'object') return (
        <div style={{ display: 'grid', gap: 14 }}>
          {value.map((item, index) => (
            <div key={item.question || index}>
              <strong>{item.question || item.title}</strong>
              <div style={{ marginTop: 5 }}>{item.answer || item.content}</div>
            </div>
          ))}
        </div>
      );
      return <ul>{value.map(item => <li key={String(item)}>{displayValue(item)}</li>)}</ul>;
    }
    if (!factual(value)) return null;
    return String(value).includes('<')
      ? <div dangerouslySetInnerHTML={{ __html: String(value) }} />
      : <div>{displayValue(value)}</div>;
  };
  const sections = [
    ['description', 'Description', p.publicDescription],
    ['features', 'Features', p.sections?.features],
    ['specifications', 'Specifications', p.sections?.specifications],
    ['details', 'Product details', productDetails],
    ['perfect-for', 'Perfect for', p.sections?.perfectFor],
    ['why', 'Why you’ll love it', p.sections?.whyYouWillLoveIt],
    ['faq', 'FAQ', p.sections?.faq],
    ['guide', 'Buying guide', p.sections?.buyingGuide],
  ].filter(([, , content]) => Array.isArray(content) ? content.length : factual(content));

  return (
    <div className="page-fade factual-pdp">
      <nav style={{ padding: '20px 48px', display: 'flex', gap: 8 }} className="mono">
        <button onClick={() => go('home')} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>HOME</button>
        <span>/</span>
        <button onClick={() => go('shop', { cat: p.cat })} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>{p.cat.toUpperCase()}</button>
        <span>/</span>
        <span style={{ fontSize: 10, color: 'var(--fg-2)' }}>{p.name.toUpperCase()}</span>
      </nav>
      <div className="factual-pdp-grid pdp-commerce-layout" style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr) minmax(390px, 0.62fr)', padding: '0 36px 80px', maxWidth: 1780, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          {images.map((image, index) => (
            <button key={image.src} onClick={() => setImgIdx(index)} aria-label={image.label}
              className="ph tiny" data-label=""
              style={{ width: 76, aspectRatio: '1', cursor: 'pointer', outline: imgIdx === index ? '1px solid var(--fg)' : 'none', outlineOffset: 2, opacity: imgIdx === index ? 1 : 0.65, background: 'var(--bg-2)', border: 0, padding: 0 }}>
              <img src={image.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
            </button>
          ))}
        </div>
        <div className="pdp-main-media" style={{ paddingLeft: 18 }}>
          {images.length > 0 && <div className="ph grain pdp-main-image" data-label=""
            role="img" aria-label={images[imgIdx]?.label} style={{ height: 'min(860px, calc(100vh - 190px))', minHeight: 620, position: 'relative', background: 'var(--bg-2)' }}>
            <img src={images[imgIdx]?.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
          </div>}
        </div>
        <div style={{ paddingLeft: 48, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 10 }}>
            {[p.brand || p.vendor, p.productType || p.cat, p.category].filter(Boolean).join(' · ').toUpperCase()}
          </div>
          <h1 className="display" style={{ fontSize: 48, lineHeight: 1, margin: 0, fontWeight: 400 }}>{p.name}</h1>
          {p.blurb && <div style={{ color: 'var(--fg-3)', fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{p.blurb}</div>}
          {Array.isArray(p.tags) && p.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {p.tags.map(tag => <span key={tag} className="mono" style={{ fontSize: 8, border: '1px solid var(--line-2)', padding: '5px 8px' }}>{tag.toUpperCase()}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, margin: '24px 0 28px' }}>
            <span className="display" style={{ fontSize: 32 }}>${selectedPrice.toLocaleString()}</span>
            {validCompareAt && <span className="display" style={{ fontSize: 20, color: 'var(--fg-4)', textDecoration: 'line-through' }}>${selectedCompareAt.toLocaleString()}</span>}
            {discount > 0 && <span className="mono" style={{ fontSize: 9, color: 'var(--accent-2)' }}>SAVE {discount}%</span>}
          </div>

          {(p.options || []).map(option => (
            <div key={option.name} style={{ marginBottom: 24 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>{option.name.toUpperCase()} · {String(selection[option.name.toLowerCase()] || '').toUpperCase()}</span>
                {option.name.toLowerCase() === 'size' && <button onClick={() => go('size')} className="ulink" style={{ color: 'var(--fg-2)', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10 }}>SIZE GUIDE ↗</button>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(option.values || []).map(value => {
                  const active = selection[option.name.toLowerCase()] === value;
                  const available = optionAvailable(option.name, value);
                  const colorSpec = option.name.toLowerCase() === 'color'
                    ? (p.colors || []).find(color => color.name === value)
                    : null;
                  return <button key={value} onClick={() => chooseOption(option.name, value)}
                    disabled={!available} aria-pressed={active}
                    aria-label={`${option.name} ${value}${available ? '' : ', unavailable'}`}
                    style={colorSpec ? {
                      padding: '4px',
                      border: 0,
                      background: 'transparent',
                      color: available ? (active ? 'var(--fg)' : 'var(--fg-4)') : 'var(--fg-4)',
                      opacity: available ? 1 : 0.45,
                      textDecoration: available ? 'none' : 'line-through',
                      cursor: available ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 9,
                    } : {
                      minHeight: 40,
                      padding: '0 14px',
                      border: `1px solid ${active ? 'var(--fg)' : 'var(--line-2)'}`,
                      background: active ? 'var(--fg)' : 'transparent',
                      color: active ? 'var(--bg)' : available ? 'var(--fg-2)' : 'var(--fg-4)',
                      opacity: available ? 1 : 0.45,
                      textDecoration: available ? 'none' : 'line-through',
                      cursor: available ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}>
                    {colorSpec && <span aria-hidden="true" style={{
                      width: 48,
                      height: 48,
                      flex: '0 0 48px',
                      borderRadius: '50%',
                      border: '1px solid var(--line-2)',
                      outline: active ? '1px solid var(--fg)' : 'none',
                      outlineOffset: active ? 4 : 0,
                      backgroundImage: `url(${colorSpec.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }} />}
                    <span className={colorSpec ? 'mono' : undefined} style={colorSpec ? { fontSize: 9, letterSpacing: '0.12em' } : undefined}>{value}</span>
                  </button>;
                })}
              </div>
            </div>
          ))}

          <div className="mono" style={{ fontSize: 9, color: selectedAvailable ? 'var(--accent-2)' : 'var(--fg-4)', marginBottom: 12 }}>
            {selectedAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
            {selectedVariant?.sku ? ` · SKU ${selectedVariant.sku}` : ''}
          </div>
          {p.madeToMeasureEnabled && (
            <div style={{ marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>FIT</span><span style={{ color: 'var(--fg-4)' }}>MADE TO MEASURE +${madeToMeasureSurcharge}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: isMadeToMeasure ? 14 : 0 }}>
                {[
                  { id: 'standard', title: 'Standard size', detail: `Cut to size ${selection.size || selection.waist || ''}` },
                  { id: 'made-to-measure', title: 'Made to measure', detail: `Pattern adjusted from your measurements · +$${madeToMeasureSurcharge}` },
                ].map(option => {
                  const active = fitMode === option.id;
                  return <button key={option.id} onClick={() => setFitMode(option.id)} aria-pressed={active} style={{ textAlign: 'left', padding: 11, border: `1px solid ${active ? 'var(--accent-2)' : 'var(--line-2)'}`, background: active ? 'rgba(176,138,76,0.08)' : 'transparent', color: 'var(--fg)', minHeight: 72, cursor: 'pointer' }}>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 18, lineHeight: 1.1 }}>{option.title}</div>
                    <div className="mono" style={{ fontSize: 8, color: active ? 'var(--accent-2)' : 'var(--fg-4)', marginTop: 8, lineHeight: 1.5 }}>{option.detail.toUpperCase()}</div>
                  </button>;
                })}
              </div>
              {isMadeToMeasure && <div className="page-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: 14, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                {measurementFields.map(([key, label, placeholder]) => <label key={key} className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {label.toUpperCase()}<input value={measurements[key]} onChange={event => updateMeasurement(key, event.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-2)', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
                </label>)}
              </div>}
            </div>
          )}
          <button className="btn" disabled={!selectedAvailable}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, opacity: selectedAvailable ? 1 : 0.55 }}
            onClick={() => selectedAvailable && addToCart(p, {
              ...selection,
              size: selection.size || selection.waist,
              leather: p.material || p.metafields?.outerMaterial || 'Leather',
              fitMode,
              fitLabel: isMadeToMeasure ? 'Made to measure' : 'Standard size',
              measurements: isMadeToMeasure ? measurements : (selection.inseam ? { inseam: `${selection.inseam} inches` } : null),
              surcharge: isMadeToMeasure ? madeToMeasureSurcharge : 0,
              variantId: selectedVariant?.id,
              sku: selectedVariant?.sku,
              price: selectedPrice,
            })}>
            {selectedAvailable ? `Add to Bag — $${selectedPrice.toLocaleString()}` : 'Currently unavailable'}
          </button>
          {p.madeToMeasureEnabled && <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }} onClick={() => go('mto', { startWith: p })}>
            Customize in Fit Lab <Icon name="arrow" size={14} />
          </button>}

          {sections.map(([id, title, content]) => (
            <div key={id} style={{ borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setOpenSection(openSection === id ? null : id)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 0', cursor: 'pointer', width: '100%', background: 'transparent', border: 0, color: 'var(--fg)', textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{title}</span>
                <span>{openSection === id ? '−' : '+'}</span>
              </button>
              {openSection === id && <div className="page-fade" style={{ paddingBottom: 18, color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.75 }}>{sectionValue(content)}</div>}
            </div>
          ))}
        </div>
      </div>
      {p.publicDescription && (
        <section className="pdp-editorial-story" style={{ padding: '96px 48px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>FROM THE BENCH · {(p.maker || 'MOTOGRIP WORKSHOP').toUpperCase()}</div>
            <h2 className="display" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.05, fontWeight: 400 }}>On the {editorialOwner} {editorialCategory}.</h2>
            <div style={{ color: 'var(--fg-3)', fontSize: 16, lineHeight: 1.85, marginTop: 24 }}>{p.publicDescription}</div>
            <button className="btn btn-ghost" style={{ marginTop: 28 }} onClick={() => go('journal')}>More from the journal</button>
          </div>
          <div className="ph grain pdp-editorial-close-up" role="img" aria-label={editorialCloseUp ? `Close-up detail of ${p.name}` : undefined} style={{ aspectRatio: '4/5', background: 'var(--bg-2)', overflow: 'hidden' }}>
            {editorialCloseUp && <img src={editorialCloseUp.src} alt="" style={{ width: '100%', height: '100%', objectFit: editorialCloseUp.isFallbackCrop ? 'cover' : 'contain', objectPosition: editorialCloseUp.isFallbackCrop ? 'center 28%' : 'center', transform: editorialCloseUp.isFallbackCrop ? 'scale(1.28)' : 'none' }} />}
          </div>
        </section>
      )}
      {isSizedApparel && (
        <section className="pdp-category-size-chart" style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 16 }}>
            {isVest ? `${editorialOwner.toUpperCase()} MOTORCYCLE LEATHER VEST SIZE CHART` : isPants ? `${editorialOwner.toUpperCase()} LEATHER TROUSERS SIZE CHART` : `${editorialOwner.toUpperCase()} ${editorialCategory.toUpperCase()} SIZE CHART`}
          </div>
          <h2 className="display" style={{ fontSize: 32, margin: 0, fontWeight: 400, marginBottom: 24 }}>Fit at a glance.</h2>
          {isVest && <>
            <JacketSizeChart unit={fitChartUnit} onUnitChange={setFitChartUnit} selectedSize={selectedSizeName} chart={p.gender === 'Women' ? SSM_WOMENS_VEST_SIZE_CHART : SSM_MENS_VEST_SIZE_CHART} ariaLabel={`${editorialOwner} vest size chart units`} note="Measure around the fullest part of your chest—or your stomach if it is larger—and use the larger body measurement. Measure over your usual riding layer and size up for a more relaxed fit." footer="GARMENT MEASUREMENTS REFER TO THE FINISHED VEST. BODY MEASUREMENTS REFER TO THE WEARER." />
            {p.gender === 'Women' ? <WomensVestMeasureGuide /> : <MensVestMeasureGuide />}
          </>}
          {isUpperBody && <>
            <JacketSizeChart unit={fitChartUnit} onUnitChange={setFitChartUnit} selectedSize={selectedSizeName} chart={p.gender === 'Women' ? SSM_WOMENS_JACKET_SIZE_CHART : SSM_JACKET_SIZE_CHART} ariaLabel={`${editorialOwner} ${editorialCategory.toLowerCase()} size chart units`} />
            {p.gender === 'Women' ? <WomensJacketMeasureGuide /> : <MensJacketMeasureGuide />}
          </>}
          {isPants && isChaps && <>
            <JacketSizeChart unit={fitChartUnit} onUnitChange={setFitChartUnit} selectedSize={selectedSizeName} chart={SSM_UNISEX_CHAPS_SIZE_CHART} ariaLabel="Unisex leather chaps size chart units" />
            <UnisexChapsMeasureGuide />
          </>}
          {isPants && !isChaps && (
            <div style={{ overflowX: 'auto', borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}>
              <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
                <thead><tr>{(p.options || []).map(option => <th key={option.name} className="mono" style={{ textAlign: 'left', padding: '15px 12px', color: 'var(--accent-2)', fontSize: 9, borderBottom: '1px solid var(--line-2)' }}>{option.name.toUpperCase()}</th>)}</tr></thead>
                <tbody><tr>{(p.options || []).map(option => <td key={option.name} className="mono" style={{ padding: '18px 12px', color: 'var(--fg-2)', borderRight: '1px solid var(--line)' }}>{(option.values || []).join(' · ')}</td>)}</tr></tbody>
              </table>
              <div className="mono" style={{ fontSize: 8, color: 'var(--fg-4)', padding: '12px' }}>SELECT WAIST AND INSEAM SEPARATELY WHERE OFFERED. USE THE PRODUCT PICKER ABOVE FOR CURRENT AVAILABILITY.</div>
            </div>
          )}
        </section>
      )}
      {Array.isArray(p.reviews) && p.reviews.length > 0 && (
        <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
          <h2 className="display" style={{ fontSize: 32, fontWeight: 400 }}>Verified product reviews</h2>
          <div style={{ display: 'grid', gap: 24 }}>
            {p.reviews.map(review => <blockquote key={review.id || review.author}>{review.body}</blockquote>)}
          </div>
        </section>
      )}
    </div>
  );
}

function PDP({ product, go, addToCart, onQuickView }) {
  const p = product || SSM_PRODUCTS[0];
  if (p.factualProjection) {
    return <FactualPDP product={p} go={go} addToCart={addToCart} />;
  }
  const [leather, setLeather] = React.useState(SSM_LEATHERS[0].id);
  const [size, setSize] = React.useState('M');
  const [imgIdx, setImgIdx] = React.useState(0);
  const [openSection, setOpenSection] = React.useState('details');
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState('');
  const [notifyDone, setNotifyDone] = React.useState(false);
  const [fitMode, setFitMode] = React.useState('standard');
  const [measurements, setMeasurements] = React.useState({
    height: '',
    chest: '',
    naturalWaist: '',
    lowerWaist: '',
    shoulder: '',
    hips: '',
    sleeves: '',
    weight: '',
  });

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
  const madeToMeasureSurcharge = p.madeToMeasureSurcharge ?? 50;
  const isMadeToMeasure = fitMode === 'made-to-measure';
  const displayPrice = p.price + (isMadeToMeasure ? madeToMeasureSurcharge : 0);
  const updateMeasurement = (key, value) => setMeasurements(m => ({ ...m, [key]: value }));
  const measurementFields = [
    ['height', 'Height', 'in/cm'],
    ['chest', 'Chest', 'in/cm'],
    ['naturalWaist', 'Natural waist', 'in/cm'],
    ['lowerWaist', 'Lower waist', 'in/cm'],
    ['shoulder', 'Shoulder', 'in/cm'],
    ['hips', 'Hips', 'in/cm'],
    ['sleeves', 'Sleeves', 'in/cm'],
    ['weight', 'Weight', 'lbs'],
  ];
  const productSpecs = [
    ['Body material', p.story?.craft?.split('.')[0] || p.blurb],
    ['Leather type', lObj?.name || 'Selected hide'],
    ['Lining', 'Breathable satin, selected for the house silhouette'],
    ['Closure', p.cat === 'Pants' ? 'Concealed zip and hand-finished waistband' : 'YKK Excella hardware'],
    ['Fit service', `Standard sizing or made to measure (+$${madeToMeasureSurcharge})`],
    ['Customization', 'Available by leather, size, measurements, and custom fit request'],
  ];

  return (
    <div className="page-fade">
      {/* Breadcrumb */}
      <nav className="mono pdp-breadcrumb" style={{ padding: '16px 0', display: 'flex', gap: 8, maxWidth: 1640, margin: '0 auto', width: '100%' }}>
        <button onClick={() => go('home')} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>HOUSE</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <button onClick={() => go('shop', { gender: p.gender })} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>{p.gender.toUpperCase()}</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <button onClick={() => go('shop', { cat: p.cat })} style={{ fontSize: 10, color: 'var(--fg-4)', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>{p.cat.toUpperCase()}</button>
        <span style={{ fontSize: 10, color: 'var(--fg-4)' }}>/</span>
        <span style={{ fontSize: 10, color: 'var(--fg-2)' }}>{p.name.toUpperCase()}</span>
      </nav>

      <div className="pdp-commerce-layout" style={{
        display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr) minmax(390px, 0.62fr)', gap: 0,
        padding: '0 36px 80px', maxWidth: 1780, margin: '0 auto', width: '100%',
      }}>
        {/* Thumbnails */}
        <div className="pdp-thumb-rail" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 0 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setImgIdx(i)}
              aria-label={img.label}
              className="ph tiny" data-img="1" data-label=""
              style={{
                width: 76, height: 76, aspectRatio: '1', cursor: 'pointer',
                '--img': `url(${img.src})`,
                outline: imgIdx === i ? '1px solid var(--fg)' : 'none',
                outlineOffset: 2, opacity: imgIdx === i ? 1 : 0.6,
                background: 'transparent', border: 0, padding: 0,
              }} />
          ))}
        </div>
        {/* Main image */}
        <div className="pdp-main-media" style={{ paddingLeft: 18 }}>
          <div className="ph grain pdp-main-image" data-img="1" data-label="" role="img" aria-label={images[imgIdx].alt || images[imgIdx].label}
            style={{ height: 'min(860px, calc(100vh - 190px))', minHeight: 620, position: 'relative', '--img': `url(${images[imgIdx].src})` }}>
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
        <div className="pdp-details-panel" style={{ paddingLeft: 42, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 8 }}>
            {p.cat.toUpperCase()} · {p.gender.toUpperCase()}
            {p.tag === 'Fit Lab' && <> · FIT LAB</>}
            {finalPiece && <> · FINAL PIECES</>}
          </div>
          <h1 className="display pdp-product-title" style={{ fontSize: 'clamp(36px, 3vw, 46px)', lineHeight: 1, margin: 0, fontWeight: 400 }}>{p.name}</h1>
          <div style={{ color: 'var(--fg-3)', fontSize: 14, marginTop: 10, lineHeight: 1.45 }}>{p.blurb}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 16, marginBottom: 20 }}>
            <span className="display" style={{ fontSize: 30 }}>${displayPrice.toLocaleString()}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>USD · DUTIES INCLUDED</span>
          </div>

          {/* Trust strip — moved above the picker */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
            {[
              { i: '✦', t: 'Hand-numbered' },
              { i: '⌖', t: 'Worldwide shipping' },
              { i: '↻', t: 'Warranty support' },
            ].map(b => (
              <div key={b.t} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'var(--accent-2)', marginBottom: 4 }}>{b.i}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{b.t}</div>
              </div>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>LEATHER · {lObj.name.toUpperCase()}</span>
            <span style={{ color: 'var(--fg-4)' }}>{lObj.desc}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {SSM_LEATHERS.map(l => (
              <button key={l.id} className={`swatch ${leather === l.id ? 'active' : ''}`}
                aria-label={l.name} title={l.name}
                style={{ background: l.swatch, padding: 0 }} onClick={() => setLeather(l.id)} />
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
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
                    height: 40, position: 'relative',
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
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', marginBottom: 16 }}>
              {inStock
                ? (sizeStock(size) <= 2
                    ? `${sizeStock(size)} ${sizeStock(size) === 1 ? 'PIECE' : 'PIECES'} REMAIN IN ${size}`
                    : `IN STOCK · ${size}`)
                : `SOLD OUT IN ${size} · NOTIFY ME WHEN RESTOCKED`}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>FIT</span>
              <span style={{ color: 'var(--fg-4)' }}>MADE TO MEASURE +${madeToMeasureSurcharge}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: isMadeToMeasure ? 14 : 0 }}>
              {[
                { id: 'standard', title: 'Standard size', detail: `Cut to size ${size}` },
                { id: 'made-to-measure', title: 'Made to measure', detail: `Pattern adjusted from your measurements · +$${madeToMeasureSurcharge}` },
              ].map(opt => {
                const active = fitMode === opt.id;
                return (
                  <button key={opt.id} onClick={() => setFitMode(opt.id)}
                    aria-pressed={active}
                    style={{
                      textAlign: 'left', padding: 11, border: `1px solid ${active ? 'var(--accent-2)' : 'var(--line-2)'}`,
                      background: active ? 'rgba(176,138,76,0.08)' : 'transparent',
                      color: 'var(--fg)', minHeight: 72, cursor: 'pointer',
                    }}>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 18, lineHeight: 1.1 }}>{opt.title}</div>
                    <div className="mono" style={{ fontSize: 8, color: active ? 'var(--accent-2)' : 'var(--fg-4)', marginTop: 8, lineHeight: 1.5 }}>
                      {opt.detail.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
            {isMadeToMeasure && (
              <div className="page-fade" style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
                padding: 14, border: '1px solid var(--line)', background: 'var(--bg-2)',
              }}>
                {measurementFields.map(([key, label, placeholder]) => (
                  <label key={key} className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {label.toUpperCase()}
                    <input value={measurements[key]} onChange={e => updateMeasurement(key, e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
                        borderBottom: '1px solid var(--line-2)', color: 'var(--fg)',
                        fontFamily: 'var(--sans)', fontSize: 13, outline: 'none',
                      }} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {inStock ? (
            <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={() => addToCart(p, {
                leather: lObj.name,
                size,
                price: displayPrice,
                surcharge: isMadeToMeasure ? madeToMeasureSurcharge : 0,
                fitMode,
                fitLabel: isMadeToMeasure ? 'Made to measure' : 'Standard size',
                measurements: isMadeToMeasure ? measurements : null,
              })}>
              Add to Bag — ${displayPrice.toLocaleString()}
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
            Customize in Fit Lab <Icon name="arrow" size={14} />
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
            { id: 'specs',   t: 'Specifications', content: productSpecs },
            { id: 'origin',  t: 'Made by', content: p.story?.origin || 'Cut and checked in the MOTOGRIP fit room.' },
            { id: 'ship',    t: 'Shipping & Returns', content: 'Worldwide shipping is available. Shipping costs, delivery estimates, and applicable duties are shown at checkout. Stock pieces can be returned within 30 days. Made-to-order pieces are final sale, with complimentary fit alterations within 60 days of receipt.' },
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
                  {Array.isArray(s.content) ? (
                    <div style={{ borderTop: '1px solid var(--line-2)' }}>
                      {s.content.map(([feature, spec]) => (
                        <div key={feature} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>{feature.toUpperCase()}</div>
                          <div>{spec}</div>
                        </div>
                      ))}
                    </div>
                  ) : s.content}
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
                  {stk === 0 ? 'SOLD OUT' : stk <= 2 ? `${stk} REMAIN` : 'IN STOCK'}
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

      {/* Verified reviews only */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent-2)', marginBottom: 12 }}>
              VERIFIED CUSTOMER REVIEWS
            </div>
            <h2 className="display" style={{ fontSize: 32, margin: 0, fontWeight: 400 }}>
              Built on genuine feedback.
            </h2>
          </div>
          <button className="btn btn-ghost">Write a review</button>
        </div>
        <div style={{ padding: 24, border: '1px solid var(--line)', color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.7 }}>
          Customer feedback appears here only after it has been linked to a verified purchase. No verified review has been published for this product yet.
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
