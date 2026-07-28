(function productEditorV2Ui() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', 'Custom Size'];
  const colors = ['Black', 'Brown', 'Dark Brown', 'Tan', 'Cognac', 'Burgundy', 'Red', 'Blue', 'White', 'Green', 'Grey', 'Custom Color'];
  const productTypes = ['Leather Jacket', 'Motorcycle Jacket', 'Leather Vest', 'Biker Vest', 'Western Vest', 'Waistcoat', 'Leather Pants', 'Leather Shorts', 'Chaps', 'Leather Bag', 'Gloves', 'Accessories', 'Other'];
  const metafields = [
    ['outerMaterial', 'Outer material'], ['leatherType', 'Leather type'], ['leatherThickness', 'Leather thickness'],
    ['liningMaterial', 'Lining material'], ['closure', 'Closure'], ['hardware', 'Hardware'],
    ['pocketCount', 'Pocket count'], ['concealedCarryPockets', 'Concealed carry pockets'],
    ['armorCompatibility', 'Armor compatibility'], ['collar', 'Collar'], ['sleeveType', 'Sleeve type'],
    ['fit', 'Fit'], ['careInstructions', 'Care instructions'], ['customSizingAvailable', 'Custom sizing available'],
    ['personalizationAvailable', 'Personalization available'], ['manufacturer', 'Manufacturer / Maker'],
    ['countryOfManufacture', 'Country of manufacture'],
  ];
  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const empty = () => ({
    id: null, revision: 0, workflowState: 'draft', ownerReviewStatus: 'not_submitted',
    websiteSyncStatus: 'not_published', title: '', descriptionHtml: '', sections: {}, media: [],
    websiteContent: { description: [], features: [], specifications: [], perfectFor: '', whyYouWillLoveIt: '' },
    classification: {
      gender: { value: '', confidence: 'low', status: 'needs_confirmation', evidence: [] },
      ageGroup: { value: '', confidence: 'low', status: 'needs_confirmation', evidence: [] },
    },
    merchantAttributes: {}, merchantReadiness: { percentage: 0, status: 'Not Ready', missing: [], needsConfirmation: [], invalid: [] },
    organization: { brand: 'MOTOGRIP GEAR', vendor: 'MOTOGRIP GEAR', productType: 'Leather Vest', category: '', gender: 'Unisex', ageGroup: '', collections: [], tags: [], themeTemplate: 'default', status: 'draft' },
    pricing: { price: 0, compareAtPrice: null, cost: null, taxable: true },
    inventory: { trackInventory: true, continueSellingWhenOutOfStock: false },
    shipping: { physicalProduct: true, weight: 0, weightUnit: 'lb', packagePreset: '', countryOfOrigin: 'PK', hsCode: '', processingTime: '' },
    metafields: {}, seo: { title: '', metaDescription: '', handle: '' }, options: [], variants: [],
  });
  const input = (label, name, value = '', type = 'text', attrs = '') =>
    `<label class="pe-field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value ?? '')}" ${attrs}></label>`;
  const textarea = (label, name, value = '') =>
    `<label class="pe-field"><span>${esc(label)}</span><textarea name="${name}">${esc(value ?? '')}</textarea></label>`;
  const select = (label, name, value, choices) =>
    `<label class="pe-field"><span>${esc(label)}</span><select name="${name}">${choices.map((choice) => {
      const pair = Array.isArray(choice) ? choice : [choice, choice];
      return `<option value="${esc(pair[0])}" ${pair[0] === value ? 'selected' : ''}>${esc(pair[1])}</option>`;
    }).join('')}</select></label>`;
  const status = (label, value) =>
    `<div class="pe-status"><span>${esc(label)}</span><strong>${esc(String(value || '').replaceAll('_', ' '))}</strong></div>`;
  const csv = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  const code = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  const mediaUrl = (value) => window.MotogripMediaUrl.canonicalMediaUrl(value, { fallback: null });

  function visionPanel(product, workspace) {
    if (!product.id) return `<section class="card pe-card pe-vision">
      <div class="card-head"><div><span class="eyebrow">AI Vision Engine v1</span><h2>Product image intelligence</h2><p>Save the product before creating a governed Vision analysis.</p></div><span class="pe-ai-state">Draft required</span></div>
    </section>`;
    const vision = workspace.aiVision;
    if (!vision) return '';
    const analysis = vision.latest;
    const selected = analysis?.selectedMediaIds || [];
    const roleFor = (item) => analysis?.imageRoles?.[item.id] || item.currentRole || 'Unknown';
    const badge = (fact) => `<span class="pe-v-confidence ${fact.confidenceLabel.toLowerCase()}">${fact.confidenceScore}% · ${esc(fact.confidenceLabel)}</span>`;
    return `<section class="card pe-card pe-vision" id="pe-vision">
      <div class="card-head"><div><span class="eyebrow">AI Vision Engine v1 · Intelligence foundation</span><h2>Images → evidence-backed product facts</h2><p>Suggestions remain separate from trusted Product DNA until explicitly approved and applied.</p></div><div class="pe-v-state"><span>${esc(analysis?.status?.replaceAll('_', ' ') || 'No analysis')}</span><strong>${analysis ? `Version ${analysis.version}` : 'Start'}</strong></div></div>
      <div class="pe-v-provider-row">${vision.providers.map((provider) => `<article class="${provider.available ? 'available' : 'unavailable'}"><strong>${esc(provider.displayName)}</strong><span>${esc(provider.status || (provider.available ? 'Available' : 'Unavailable'))}</span><small>${provider.developmentOnly ? 'Development/test only' : provider.executionEnabled ? 'Local, non-billable analysis' : 'Execution disabled'}</small></article>`).join('')}</div>
      <div class="pe-v-create">
        <label class="pe-field"><span>Analysis provider</span><select id="pe-v-provider">${vision.providers.map((provider) => `<option value="${provider.id}" ${analysis?.providerId === provider.id ? 'selected' : ''} ${!provider.available ? 'disabled' : ''}>${esc(provider.displayName)} — ${esc(provider.status || (provider.available ? 'Available' : 'Unavailable'))}</option>`).join('')}</select></label>
        <label class="pe-field"><span>Analysis note</span><input id="pe-v-note" value="${esc(analysis?.note || '')}" placeholder="Analyze factual visible construction only."></label>
      </div>
      <div class="card-head compact"><div><h3>Selected images and roles</h3><p>Multiple images per role are allowed. Unchecked images are excluded.</p></div><span>${selected.length} selected</span></div>
      <div class="pe-v-images">${vision.media.length ? vision.media.map((item) => `<article>
        <label><input type="checkbox" data-v-image="${item.id}" ${selected.includes(item.id) ? 'checked' : ''}> Include</label>
        <img src="${esc(mediaUrl(item.path) || '')}" alt="${esc(item.title)}">
        <strong>${esc(item.title)}</strong>
        <select data-v-role="${item.id}">${vision.roles.map((role) => `<option ${roleFor(item) === role ? 'selected' : ''}>${esc(role)}</option>`).join('')}</select>
        ${analysis?.suggestedRoles?.[item.id] ? `<small>AI suggestion: ${esc(analysis.suggestedRoles[item.id])}</small>` : ''}
      </article>`).join('') : '<div class="pe-empty">Upload images in the Media section first.</div>'}</div>
      <div class="button-row"><button class="btn" id="pe-v-save-draft" type="button" ${!vision.permissions.prepare ? 'disabled' : ''}>Create Analysis Draft</button><button class="btn primary" id="pe-v-run" type="button" ${!analysis || !vision.permissions.run ? 'disabled' : ''}>Run Vision Analysis</button><button class="btn" id="pe-v-history" type="button">Analysis History (${vision.history.length})</button></div>
      ${analysis?.facts?.length ? `<div class="pe-v-results">
        <div>
          <div class="card-head compact"><div><h3>Product classification and visible facts</h3><p>Approve, correct, or reject each observation independently.</p></div></div>
          <div class="pe-v-facts">${analysis.facts.map((fact) => `<article class="${fact.status}">
            <header><div><strong>${esc(fact.key.replace(/([A-Z])/g, ' $1'))}</strong><span>${esc(fact.status)}</span></div>${badge(fact)}</header>
            <p>${esc(fact.userConfirmedValue ?? fact.value)}</p>
            <small>${esc(fact.evidenceNotes || 'Evidence-linked observation')} · ${fact.evidenceMediaIds.length} image reference(s)</small>
            ${fact.needsConfirmation ? '<b>Needs Confirmation</b>' : ''}${fact.conflict ? '<b class="conflict">Conflict</b>' : ''}
            <div class="button-row"><button class="btn" type="button" data-v-fact-approve="${fact.factId}" ${!vision.permissions.approve ? 'disabled' : ''}>Approve</button><button class="btn" type="button" data-v-fact-correct="${fact.factId}" ${!vision.permissions.approve ? 'disabled' : ''}>Edit & Approve</button><button class="btn danger" type="button" data-v-fact-reject="${fact.factId}" ${!vision.permissions.approve ? 'disabled' : ''}>Reject</button></div>
          </article>`).join('')}</div>
        </div>
        <aside>
          <h3>Merchant readiness</h3><div class="pe-v-score"><strong>${vision.merchantReadiness.score}%</strong><span>${esc(vision.merchantReadiness.status)}</span></div>
          ${vision.merchantReadiness.blockers.length ? `<ul>${vision.merchantReadiness.blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '<p>Trusted attributes are ready for review.</p>'}
          <h3>Missing-image plan</h3><div class="pe-v-coverage"><strong>${analysis.coverage?.percentage || 0}%</strong><span>${esc((analysis.coverage?.missing || []).join(', ') || 'Complete')}</span></div>
          <ul>${(analysis.recommendations || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
          <div class="button-row"><button class="btn" id="pe-v-share-coverage" type="button" ${!vision.permissions.prepare ? 'disabled' : ''}>Update Media Coverage Plan</button><button class="btn primary" id="pe-v-apply-dna" type="button" ${!vision.permissions.apply ? 'disabled' : ''}>Apply Approved Facts to Product DNA</button></div>
        </aside>
      </div>` : ''}
      ${analysis?.conflicts?.length ? `<div class="pe-v-conflicts"><h3>Conflict-resolution queue</h3>${analysis.conflicts.map((item) => `<article class="${item.status}"><strong>${esc(item.key)}</strong><p>Trusted: ${esc(item.trustedValue)} · Observed: ${esc(item.observedValue)}</p><small>${esc(item.status)}</small>${item.status === 'unresolved' ? `<div class="button-row"><button class="btn" type="button" data-v-resolve="${item.conflictId}" data-choice="keep_trusted">Keep Product DNA</button><button class="btn" type="button" data-v-resolve="${item.conflictId}" data-choice="accept_observed">Accept AI Suggestion</button><button class="btn" type="button" data-v-resolve="${item.conflictId}" data-choice="variation">Confirm Variation</button></div>` : ''}</article>`).join('')}</div>` : ''}
      ${analysis?.quality?.length ? `<details class="pe-v-quality"><summary>Image-quality assessment (${analysis.quality.length})</summary><div>${analysis.quality.map((item) => `<article><strong>${esc(vision.media.find((media) => media.id === item.mediaId)?.title || item.mediaId)}</strong><span>${esc(item.status)}</span><p>${esc(item.recommendations.join(' ') || 'No corrective recommendation.')}</p></article>`).join('')}</div></details>` : ''}
    </section>`;
  }

  function mediaStudioPanel(product, workspace) {
    if (!product.id) return `<section class="card pe-card pe-media-studio">
      <div class="card-head"><div><span class="eyebrow">AI Media Studio v2 · V1-compatible</span><h2>Product media workflow</h2><p>Save the product draft before preparing its reference-image and asset plan.</p></div><span class="pe-ai-state">Draft required</span></div>
    </section>`;
    const studio = workspace.aiMediaStudio;
    if (!studio) return '';
    const plan = studio.plan;
    const analysis = plan.analysis;
    const canPrepare = studio.permissions.prepare;
    const modeLabel = {
      uploaded_only: 'Uploaded Images Only',
      hybrid: 'Hybrid',
      ai_generated: 'AI Generated',
    };
    const modeDescription = {
      uploaded_only: 'Use uploaded product images only. No future generated assets are required.',
      hybrid: 'Use uploaded references and plan only the missing assets for future generation.',
      ai_generated: 'Use reference images to plan a complete future generated asset package.',
    };
    const assignedRole = (item) => plan.roleAssignments?.[item.id] || item.currentRole || 'Unknown';
    return `<section class="card pe-card pe-media-studio" id="pe-media-studio">
      <div class="card-head"><div><span class="eyebrow">AI Media Studio v2 · V1-compatible multi-source foundation</span><h2>Reference images → governed asset plan</h2><p>Mix uploaded, OpenAI-planned, and Google Flow manual assets without changing stable asset identities.</p></div><div class="pe-ms-state"><span>${esc(plan.state.replaceAll('_', ' '))}</span><strong>${analysis?.coveragePercentage ?? 0}% coverage</strong></div></div>
      <div class="pe-ms-notice"><strong>Provider-neutral planning</strong><span>AI Media Studio v1 plans remain compatible. No image provider connected for execution; uploaded media stays the default and Google Flow is manual.</span></div>
      <div class="pe-ms-providers">
        ${studio.providers.map((provider) => `<article class="${provider.available ? 'available' : 'unavailable'}">
          <div><strong>${esc(provider.displayName)}</strong><span>${esc(provider.mode.replaceAll('_', ' '))}</span></div>
          <b>${esc(provider.status)}</b>
          ${provider.id === 'openai' ? `<small>Target model: ${esc(provider.targetModel || 'gpt-image-2')} · API key value is never exposed.</small>` : ''}
          ${provider.id === 'google_flow' ? '<small>Manual Prompt Workflow · Direct API: unsupported · Prompt export and manual result upload only.</small>' : ''}
        </article>`).join('')}
      </div>
      ${studio.permissions.configureProvider ? `<details class="pe-ms-settings"><summary>Owner provider settings</summary>
        <div class="pe-ms-settings-grid">
          <label><input type="checkbox" id="pe-ms-openai-enabled" ${studio.providers.find((item) => item.id === 'openai')?.enabled ? 'checked' : ''}> Enable OpenAI planning option</label>
          <label><input type="checkbox" id="pe-ms-flow-enabled" ${studio.providers.find((item) => item.id === 'google_flow')?.enabled ? 'checked' : ''}> Enable Google Flow manual workflow</label>
          <button class="btn" type="button" id="pe-ms-provider-save">Save provider settings</button>
        </div>
      </details>` : ''}
      <div class="pe-ms-modes" role="radiogroup" aria-label="Image source workflow">
        ${studio.constants.sourceModes.map((mode) => `<label class="${plan.mode === mode ? 'active' : ''}"><input type="radio" name="mediaStudio.mode" value="${mode}" ${plan.mode === mode ? 'checked' : ''} ${!canPrepare ? 'disabled' : ''}><strong>${esc(modeLabel[mode])}</strong><span>${esc(modeDescription[mode])}</span></label>`).join('')}
      </div>
      <div class="pe-ms-grid">
        <div>
          <div class="card-head compact"><div><h3>Reference images</h3><p>Choose images and confirm the role of every reference.</p></div><span>${plan.referenceMediaIds.length} selected</span></div>
          <div class="pe-ms-references">
            ${studio.referenceMedia.length ? studio.referenceMedia.map((item) => `<article class="pe-ms-reference" draggable="true" data-ms-reference="${item.id}">
              <label class="pe-ms-select"><input type="checkbox" data-ms-image="${item.id}" ${plan.referenceMediaIds.includes(item.id) ? 'checked' : ''} ${!canPrepare ? 'disabled' : ''}><span>Use reference</span></label>
              <img src="${esc(mediaUrl(item.path) || '')}" alt="${esc(item.title)}">
              <strong>${esc(item.title)}</strong>
              <select data-ms-role="${item.id}" ${!canPrepare ? 'disabled' : ''}>${studio.constants.referenceRoles.map((role) => `<option ${assignedRole(item) === role ? 'selected' : ''}>${esc(role)}</option>`).join('')}</select>
            </article>`).join('') : '<div class="pe-empty">Upload product images in the Media card to begin.</div>'}
          </div>
          <div class="button-row"><button class="btn" id="pe-ms-save" type="button" ${!canPrepare ? 'disabled' : ''}>Save Media Plan</button><button class="btn primary" id="pe-ms-analyze" type="button" ${!studio.permissions.analyze || !plan.referenceMediaIds.length ? 'disabled' : ''}>Analyze Images</button></div>
        </div>
        <aside class="pe-ms-analysis">
          <h3>Image analysis</h3>
          ${analysis ? `
            <div class="pe-ms-metric"><strong>${analysis.coveragePercentage}%</strong><span>Role coverage</span></div>
            ${status('Detected angles', analysis.detectedAngles.join(', ') || 'None confirmed')}
            ${status('Missing angles', analysis.missingAngles.join(', ') || 'None')}
            ${status('Detected color', analysis.detectedColor)}
            ${status('Detected style', analysis.detectedStyle)}
            ${status('Product type', analysis.detectedProductType)}
            ${status('Detected quality', analysis.detectedQuality)}
            <small>${esc(analysis.notice)}</small>
          ` : '<div class="pe-empty">Save the plan, then analyze confirmed roles and coverage.</div>'}
        </aside>
      </div>
      <div class="pe-ms-section">
        <div class="card-head compact"><div><h3>Image coverage</h3><p>See what exists and what remains for the selected production workflow.</p></div></div>
        ${studio.visionCoverage ? `<div class="pe-ms-vision-coverage"><strong>Approved Vision coverage update</strong><span>Confirmed: ${esc(studio.visionCoverage.confirmed.join(', ') || 'None')} · Missing: ${esc(studio.visionCoverage.missing.join(', ') || 'None')}</span><small>No source selection or approved asset was changed.</small></div>` : ''}
        <div class="pe-ms-coverage">${(analysis?.coverage || ['Front', 'Back', 'Left', 'Right', 'Interior', 'Detail', 'Hardware', 'Lifestyle'].map((role) => ({ role, available: plan.referenceMediaIds.some((id) => plan.roleAssignments?.[id] === role) }))).map((item) => `<div class="${item.available ? 'complete' : 'missing'}"><span>${item.available ? '✓' : '✕'}</span><strong>${esc(item.role)}</strong></div>`).join('')}<div class="${plan.selectedAssets.includes('Ghost Mannequin') ? 'planned' : 'missing'}"><span>${plan.selectedAssets.includes('Ghost Mannequin') ? '◷' : '✕'}</span><strong>Ghost</strong></div></div>
      </div>
      <div class="pe-ms-section">
        <div class="card-head compact"><div><h3>Per-asset source plan</h3><p>Each stable asset identity may use a different source. Generated or returned assets require approval.</p></div><strong>${esc(studio.costEstimate.total.label || `$${Number(studio.costEstimate.total.amount || 0).toFixed(2)}`)}</strong></div>
        <div class="pe-ms-assets">${plan.assets.map((asset) => {
          const estimate = studio.costEstimate.items.find((item) => item.assetId === asset.assetId);
          const provider = studio.providers.find((item) => item.id === asset.provider);
          const options = [
            ['uploaded', 'Use Uploaded Image'],
            ['openai', 'Generate with OpenAI'],
            ['google_flow', 'Prepare for Google Flow'],
            ['none', 'Not Required'],
          ];
          const mediaOptions = (selected = []) => studio.referenceMedia.map((item) =>
            `<option value="${item.id}" ${selected.includes(item.id) ? 'selected' : ''}>${esc(item.title)}</option>`).join('');
          return `<article class="pe-ms-asset" data-ms-asset-id="${asset.assetId}">
            <header><div><strong>${esc(asset.assetType)}</strong><span>${esc(asset.status.replaceAll('_', ' '))}</span></div><b>${esc(estimate?.label || '—')}</b></header>
            <label class="pe-field"><span>Asset source</span><select data-ms-source="${asset.assetId}" ${!canPrepare ? 'disabled' : ''}>${options.map(([value, label]) => `<option value="${value}" ${asset.provider === value ? 'selected' : ''} ${value !== 'uploaded' && value !== 'none' && !studio.providers.find((item) => item.id === value)?.enabled ? 'disabled' : ''}>${label}</option>`).join('')}</select></label>
            <div class="pe-ms-ref-selectors">
              <label class="pe-field"><span>Product identity references</span><select multiple data-ms-product-refs="${asset.assetId}">${mediaOptions(asset.productReferenceMediaIds)}</select><small>Factual garment details.</small></label>
              <label class="pe-field"><span>Style / composition references</span><select multiple data-ms-style-refs="${asset.assetId}">${mediaOptions(asset.styleReferenceMediaIds)}</select><small>Must never override product facts.</small></label>
            </div>
            <label class="pe-field"><span>Asset instructions</span><input data-ms-asset-instructions="${asset.assetId}" value="${esc(asset.instructions)}" placeholder="Keep exact color, stitching and hardware."></label>
            <button class="btn" type="button" data-ms-save-asset="${asset.assetId}" ${!canPrepare ? 'disabled' : ''}>Save Asset Plan</button>
            ${asset.promptPackage ? `<details class="pe-ms-prompt"><summary>Prompt package preview</summary><textarea data-ms-prompt-edit="${asset.assetId}">${esc(asset.promptPackage.editablePrompt)}</textarea><div class="button-row"><button class="btn" type="button" data-ms-copy-prompt="${asset.assetId}">Copy</button><button class="btn" type="button" data-ms-export-prompt="${asset.assetId}">Export text</button></div><small>${esc(asset.promptPackage.providerNotes)}</small></details>` : ''}
            ${['openai', 'google_flow'].includes(asset.provider) ? `<button class="btn" type="button" data-ms-prompt="${asset.assetId}" ${!canPrepare ? 'disabled' : ''}>${asset.promptPackage ? 'Regenerate Prompt' : asset.provider === 'google_flow' ? 'Prepare Flow Prompt' : 'Prepare OpenAI Prompt'}</button>` : ''}
            ${asset.provider === 'google_flow' ? `<label class="pe-field"><span>Attach manually returned result</span><select data-ms-result="${asset.assetId}"><option value="">Select uploaded media…</option>${mediaOptions()}</select></label>` : ''}
            <div class="button-row">
              ${asset.provider === 'google_flow' ? `<button class="btn" type="button" data-ms-attach="${asset.assetId}">Attach Result</button>` : ''}
              <button class="btn primary" type="button" data-ms-approve="${asset.assetId}" ${!studio.permissions.approve ? 'disabled' : ''}>Approve</button>
              <button class="btn danger" type="button" data-ms-reject="${asset.assetId}" ${!studio.permissions.approve ? 'disabled' : ''}>Reject</button>
              ${asset.replacedAssetReference ? `<button class="btn" type="button" data-ms-restore="${asset.assetId}" ${!studio.permissions.approve ? 'disabled' : ''}>Restore Previous Approved Asset</button>` : ''}
              <button class="btn" type="button" data-ms-history="${asset.assetId}">History</button>
            </div>
            ${!provider?.available && asset.provider === 'openai' ? '<p class="pe-ms-warning">OpenAI is unavailable or disabled. The stable asset plan remains saved; execution is not attempted.</p>' : ''}
          </article>`;
        }).join('')}</div>
      </div>
      <div class="pe-ms-section">
        <h3>Design lock <small>Future generation constraints</small></h3>
        <div class="pe-ms-locks">${studio.constants.designLocks.map((lock) => `<label><input type="checkbox" data-ms-lock="${esc(lock)}" ${plan.designLocks.includes(lock) ? 'checked' : ''} ${!canPrepare ? 'disabled' : ''}><span>🔒 ${esc(lock)}</span></label>`).join('')}</div>
      </div>
      <div class="pe-ms-bottom">
        <label class="pe-field"><span>Image instructions</span><textarea name="mediaStudio.instructions" placeholder="Keep exact leather color. Keep exact zipper. Use premium USA lifestyle.">${esc(plan.instructions)}</textarea><small>Stored with this versioned plan. No instruction is executed in this sprint.</small></label>
        <aside><h3>Estimated cost</h3><strong>${esc(studio.costEstimate.total.label || `$${Number(studio.costEstimate.total.amount || 0).toFixed(2)}`)}</strong><p>Uploaded assets cost $0.00. Google Flow is external/manual. OpenAI pricing remains configuration-driven.</p>${studio.permissions.configureProvider ? '<span class="pe-ms-owner">Owner provider controls are available above.</span>' : '<span>Provider configuration is unavailable for this role.</span>'}</aside>
      </div>
    </section>`;
  }

  function media(product) {
    if (!product.media.length) return `<label class="pe-drop" id="pe-drop"><input id="pe-files" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple hidden><strong>Drop product images here</strong><span>or choose JPG, PNG or WEBP files up to 5 MB</span><span class="btn">Choose files</span></label>`;
    return `<div class="pe-media-grid">${[...product.media].sort((a, b) => a.order - b.order).map((item) => `
      <article class="pe-media" draggable="true" data-media-id="${item.id}">
        <div class="pe-media-preview ${mediaUrl(item.path) ? 'is-loading' : 'is-broken'}">
          ${mediaUrl(item.path) ? `<img src="${esc(mediaUrl(item.path))}" alt="${esc(item.altText || item.title || 'Product image')}" loading="lazy">` : ''}
          <span class="pe-media-loading">Loading image…</span>
          <div class="pe-media-error"><strong>Media unavailable</strong><code>${esc(String(item.path || '').slice(0, 180))}</code><div class="button-row"><button class="btn" type="button" data-media-retry>Retry</button><label class="btn"><input type="file" data-media-replace="${item.id}" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden>Replace</label></div></div>
        </div>
        ${item.featured ? '<b>Featured</b>' : ''}
        <input data-media-field="altText" value="${esc(item.altText)}" placeholder="Alt text">
        <input data-media-field="title" value="${esc(item.title)}" placeholder="Image title">
        <select data-media-field="role">${['Front', 'Back', 'Left Side', 'Right Side', 'Side', 'Interior', 'Detail', 'Hardware', 'Lifestyle', 'Size Chart', 'Unknown', 'Other'].map((role) => `<option ${role === item.role ? 'selected' : ''}>${role}</option>`).join('')}</select>
        <div class="button-row"><button class="btn" type="button" data-feature="${item.id}">Featured</button><button class="btn danger" type="button" data-remove="${item.id}">Remove</button></div>
      </article>`).join('')}</div><label class="btn pe-add-media"><input id="pe-files" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple hidden>＋ Add media</label>`;
  }

  function options(product) {
    return `<div id="pe-options">${product.options.map((option, index) => `
      <div class="pe-option" data-option="${index}">
        <input data-option-name value="${esc(option.name)}" placeholder="Option name">
        <input data-option-values value="${esc(option.values.join(', '))}" placeholder="Values separated by commas">
        <button class="btn" type="button" data-option-remove="${index}">Remove</button>
        ${['size', 'color'].includes(option.name.toLowerCase()) ? `<div class="pe-presets">${(option.name.toLowerCase() === 'size' ? sizes : colors).map((value) => `<button type="button" data-preset="${index}" data-value="${esc(value)}">${esc(value)}</button>`).join('')}</div>` : ''}
      </div>`).join('')}</div><div class="button-row"><button class="btn" id="pe-add-size" type="button">＋ Size</button><button class="btn" id="pe-add-color" type="button">＋ Color</button><button class="btn" id="pe-add-custom" type="button">＋ Custom</button><button class="btn primary" id="pe-generate" type="button">Generate combinations</button></div>`;
  }

  function variants(product) {
    if (!product.variants.length) return '<div class="pe-empty">Add options and generate sellable combinations.</div>';
    return `<div class="pe-bulk"><input id="pe-variant-search" type="search" placeholder="Search variants"><input id="pe-bulk-price" type="number" min="0" step=".01" placeholder="Bulk price"><button class="btn" id="pe-apply-price" type="button">Apply</button><input id="pe-bulk-qty" type="number" min="0" placeholder="Bulk quantity"><button class="btn" id="pe-apply-qty" type="button">Apply</button><select id="pe-bulk-status"><option value="active">Active</option><option value="disabled">Disabled</option></select><button class="btn" id="pe-apply-status" type="button">Apply status</button></div>
      <div class="pe-table-scroll"><table class="pe-table"><thead><tr><th><input id="pe-all" type="checkbox"></th><th>Variant</th><th>Image</th><th>Variant SKU</th><th>Price</th><th>Compare at</th><th>Cost</th><th>Quantity</th><th>Weight</th><th>Status</th><th>Sell</th></tr></thead><tbody>${product.variants.map((variant) => `<tr data-variant="${variant.id}" data-signature="${esc(variant.signature)}"><td><input data-v-select type="checkbox"></td><td><strong>${esc(Object.values(variant.attributes).join(' / ') || 'Default')}</strong></td><td><select data-v="imageId"><option value="">Default</option>${product.media.map((item) => `<option value="${item.id}" ${variant.imageId === item.id ? 'selected' : ''}>${esc(item.title || item.role || item.originalName)}</option>`).join('')}</select></td><td><code>${esc(variant.sku || 'Generated after approval')}</code></td><td><input data-v="price" type="number" min="0" step=".01" value="${variant.price}"></td><td><input data-v="compareAtPrice" type="number" min="0" step=".01" value="${variant.compareAtPrice ?? ''}"></td><td><input data-v="cost" type="number" min="0" step=".01" value="${variant.cost ?? ''}"></td><td><input data-v="quantity" type="number" min="0" value="${variant.quantity}"></td><td><input data-v="weight" type="number" min="0" step=".01" value="${variant.weight}"></td><td><select data-v="status"><option ${variant.status === 'active' ? 'selected' : ''}>active</option><option ${variant.status === 'disabled' ? 'selected' : ''}>disabled</option></select></td><td><input data-v="availableForSale" type="checkbox" ${variant.availableForSale ? 'checked' : ''}></td></tr>`).join('')}</tbody></table></div>`;
  }

  function suggestionCurrentValue(product, field) {
    const paths = {
      title: product.title,
      'organization.productType': product.organization.productType,
      'organization.category': product.organization.category,
      'classification.gender': product.classification?.gender?.value,
      'classification.ageGroup': product.classification?.ageGroup?.value,
      'organization.tags': product.organization.tags,
      'section.shortDescription': product.sections.shortDescription,
      'websiteContent.description': product.websiteContent?.description,
      'websiteContent.features': product.websiteContent?.features,
      'websiteContent.specifications': product.websiteContent?.specifications?.map((item) => `${item.label}: ${item.value}`),
      'websiteContent.perfectFor': product.websiteContent?.perfectFor,
      'websiteContent.whyYouWillLoveIt': product.websiteContent?.whyYouWillLoveIt,
      'section.faq': product.sections.faq,
      'section.buyingGuide': product.sections.buyingGuide,
      'seo.title': product.seo.title,
      'seo.metaDescription': product.seo.metaDescription,
      'seo.handle': product.seo.handle,
    };
    const value = paths[field] ?? (field.startsWith('merchant.') ?
      product.merchantAttributes?.[field.slice('merchant.'.length)] : '');
    return Array.isArray(value) ? value.join(', ') : String(value || '');
  }

  function copilotPanel(product, workspace) {
    if (!product.id) return `<section class="card pe-card pe-copilot" id="pe-copilot">
      <div class="card-head"><div><span class="eyebrow">AI Copilot</span><h2>Analyze Product Images</h2><p>Save the initial draft, then upload factual source images before analysis.</p></div><span class="pe-ai-state">Waiting for Images</span></div>
    </section>`;
    const copilot = workspace.aiCopilot;
    if (!copilot) return '';
    const latest = copilot.latest;
    const result = latest?.result;
    const canRun = copilot.permissions?.run || copilot.permissions?.reanalyze;
    const providerReady = copilot.provider?.configured;
    const imageName = (id) => product.media.find((item) => item.id === id)?.title ||
      product.media.find((item) => item.id === id)?.originalName || id;
    return `<section class="card pe-card pe-copilot" id="pe-copilot">
      <div class="card-head"><div><span class="eyebrow">AI Product Listing Copilot v1</span><h2>Image analysis → factual website draft</h2><p>AI creates versioned suggestions. Nothing is applied or published without your action.</p></div><span class="pe-ai-state ${latest?.status || ''}">${esc(latest?.status?.replaceAll('_', ' ') || (product.media.length ? 'Ready to Analyze' : 'Waiting for Images'))}</span></div>
      <div class="pe-mode-switch" role="radiogroup" aria-label="Create product mode"><label><input type="radio" name="pe-create-mode" value="manual" ${!latest ? 'checked' : ''}> Manual Entry</label><label><input type="radio" name="pe-create-mode" value="ai" ${latest ? 'checked' : ''}> Analyze with AI</label></div>
      <div class="pe-ai-grid">
        <div class="pe-ai-inputs">
          <h3>Analysis brief</h3>
          ${input('Optional product name', 'ai.productName', product.title)}
          ${textarea('Instructions', 'ai.instruction', latest?.instruction || '')}
          ${textarea('Known facts (one per line)', 'ai.knownFacts', '')}
          <div class="pe-grid-2">${input('Target audience', 'ai.targetAudience', 'Leather apparel shoppers')}${input('Target market', 'ai.targetMarket', 'USA')}${select('Brand', 'ai.brand', product.organization.brand, ['MOTOGRIP GEAR', 'BLACKTOP GEAR', 'Vintage Leather Goods', 'BRANDS JACKET HUB', 'The Western Hides', 'Custom Jacket Co', 'Be Smart'])}${select('Preferred tone', 'ai.tone', 'Premium, factual, human and trustworthy', ['Premium, factual, human and trustworthy', 'Technical and concise', 'Western heritage', 'Motorcycle performance'])}</div>
          <h3>Source images</h3>
          <div class="pe-ai-images">${product.media.map((item) => `<label><input type="checkbox" data-ai-image="${item.id}" checked><img src="${esc(mediaUrl(item.path) || '')}" alt=""><span>${esc(item.role || 'Unknown')} · ${esc(item.title || item.originalName)}</span></label>`).join('') || '<p class="pe-warning">Upload at least one image in the Media card.</p>'}</div>
          <label class="pe-field"><span>Image source policy</span><select name="ai.imageSource"><option>Uploaded Images Only</option><option disabled>AI Generated Images — later</option><option disabled>Hybrid — later</option></select></label>
          <div class="button-row"><button class="btn primary" type="button" id="pe-ai-analyze" ${!canRun || !providerReady || !product.media.length ? 'disabled' : ''}>${latest ? 'Reanalyze' : 'Analyze with AI'}</button><button class="btn" type="button" id="pe-ai-cancel" ${!canRun ? 'disabled' : ''}>Cancel Analysis</button><button class="btn" type="button" id="pe-ai-start-over">Start Over</button></div>
          <div class="pe-ai-shortcuts" aria-label="AI Copilot actions">
            ${['Suggest Title', 'Generate SEO', 'Generate FAQ', 'Generate Buying Guide', 'Suggest Categories', 'Check Missing Information'].map((label) => `<button class="btn" type="button" data-ai-shortcut="${esc(label)}" ${!canRun || !providerReady || !product.media.length ? 'disabled' : ''}>✨ ${esc(label)}</button>`).join('')}
          </div>
          ${!providerReady ? '<div class="alert warning"><strong>Provider not configured</strong><p>Add the protected server-side provider credential to enable live analysis. Manual Product Editor remains fully available.</p></div>' : ''}
        </div>
        <aside class="pe-ai-usage"><h3>Usage & provider</h3>${status('Provider', copilot.provider?.status)}${status('Model', copilot.provider?.model)}${status('Analyses today', copilot.usage?.analysesToday)}${status('Images today', copilot.usage?.imagesAnalyzedToday)}${status('Failed today', copilot.usage?.failedToday)}<small>Daily limit: ${copilot.limits?.maxRequestsPerUserDay} analyses · ${copilot.limits?.maxImages} images each</small></aside>
      </div>
      ${latest && result ? `<div class="pe-ai-results">
        <div class="card-head"><div><h3>AI Suggestions Review</h3><p>Analysis ${latest.version} · ${new Date(latest.generatedAt).toLocaleString()}</p></div><span>${latest.copyAnalysis?.scores?.overallQuality || 0}/100 Copy Quality</span></div>
        ${latest.trustedConflicts?.length ? `<div class="alert warning"><strong>Trusted-data conflicts</strong>${latest.trustedConflicts.map((item) => `<p>${esc(item.field)}: trusted value retained; AI suggestion requires confirmation.</p>`).join('')}</div>` : ''}
        <div class="pe-suggestion-list">${latest.suggestions.map((item) => `<article class="pe-suggestion">
          <label><input type="checkbox" data-ai-suggestion="${esc(item.field)}" ${item.status === 'accepted' ? 'checked' : ''}><strong>${esc(item.field.replaceAll('.', ' › '))}</strong></label>
          <div><small>Current</small><p>${esc(suggestionCurrentValue(product, item.field) || 'Empty')}</p></div>
          <div><small>AI suggestion · ${esc(item.confidence)}</small><textarea data-ai-edit="${esc(item.field)}">${esc(Array.isArray(item.value) ? item.value.join(', ') : item.value)}</textarea></div>
          <div><small>Evidence</small><p>${item.evidence?.length ? item.evidence.map((evidence) => esc(imageName(evidence.imageId))).join(', ') : 'Generated from confirmed facts and brief'}</p></div>
        </article>`).join('')}</div>
        <div class="button-row"><button class="btn primary" id="pe-ai-apply-selected" type="button">Apply Selected Suggestions</button><button class="btn" id="pe-ai-apply-safe" type="button">Apply All Safe Suggestions</button><button class="btn" id="pe-ai-reject-uncertain" type="button">Reject All Uncertain</button></div>
        <div class="pe-ai-review-grid">
          <section><h3>Fact confidence & evidence</h3>${[...result.visualAnalysis, ...result.productFacts, result.audienceClassification.gender, result.audienceClassification.ageGroup, ...result.merchantAttributes].map((fact) => `<article class="pe-fact ${fact.status}"><strong>${esc(fact.field)}: ${esc(fact.value || 'Not visible')}</strong><span>${esc(fact.confidence)} · ${esc(fact.status.replaceAll('_', ' '))}</span><small>${fact.evidence.map((evidence) => esc(imageName(evidence.imageId))).join(', ') || 'No visual evidence claimed'}</small></article>`).join('')}<div class="pe-merchant-score"><strong>${result.merchantReadiness?.percentage || 0}%</strong><span>${esc(result.merchantReadiness?.status || 'Not Ready')}</span></div></section>
          <section><h3>Missing information</h3>${result.missingInformation.map((item) => `<label class="pe-question"><span>${esc(item.question)} ${item.critical ? '<b>Critical</b>' : ''}</span><select data-ai-answer="${esc(item.field)}"><option value="">Select an answer</option>${item.options.map((option) => `<option>${esc(option)}</option>`).join('')}</select></label>`).join('') || '<p>No unanswered questions.</p>'}</section>
          <section><h3>Image coverage</h3>${result.imageCoverage.map((item) => `<div class="pe-coverage ${item.available ? 'available' : 'missing'}"><strong>${item.available ? '✓' : '✗'} ${esc(item.role)}</strong><span>${esc(item.recommendation)}</span></div>`).join('')}</section>
          <section><h3>Secondary drafts</h3><details><summary>eBay (${result.ebayDraft.title.length}/80)</summary><p>${esc(result.ebayDraft.title)}</p><p>${esc(result.ebayDraft.description)}</p></details><details><summary>Etsy (${result.etsyDraft.title.length}/140 · 13 tags)</summary><p>${esc(result.etsyDraft.title)}</p><p>${esc(result.etsyDraft.description)}</p><p>${result.etsyDraft.tags.map(esc).join(' · ')}</p></details><details><summary>AEO / GEO answers</summary>${[...result.aeo, ...result.geo].map((item) => `<p><strong>${esc(item.question)}</strong><br>${esc(item.answer)}</p>`).join('')}</details></section>
        </div>
      </div>` : ''}
      ${copilot.analyses?.length > 1 ? `<details><summary>Analysis history (${copilot.analyses.length})</summary><div class="activity-list">${copilot.analyses.map((item) => `<div><strong>Analysis ${item.version}</strong><span>${esc(item.status.replaceAll('_', ' '))} · ${new Date(item.generatedAt).toLocaleString()}</span></div>`).join('')}</div></details>` : ''}
    </section>`;
  }

  function merchantPanel(product) {
    const merchant = product.merchantAttributes || {};
    const readiness = product.merchantReadiness || { percentage: 0, status: 'Not Ready', missing: [], needsConfirmation: [], invalid: [] };
    const attr = (label, key, choices = null) => choices
      ? select(label, `merchant.${key}`, merchant[key] ?? '', [['', 'Select…'], ...choices])
      : input(label, `merchant.${key}`, merchant[key] ?? '');
    return `<section class="card pe-card pe-merchant">
      <div class="card-head"><div><span class="eyebrow">Google Merchant</span><h2>Attribute workspace</h2><p>Website publishing remains governed separately. Merchant readiness stays blocked until required attributes are valid and confirmed.</p></div><div class="pe-merchant-score"><strong>${readiness.percentage}%</strong><span>${esc(readiness.status)}</span></div></div>
      <div class="pe-merchant-progress"><span style="width:${Math.max(0, Math.min(100, readiness.percentage))}%"></span></div>
      <div class="pe-grid-3">
        ${select('Target gender', 'classification.gender', product.classification?.gender?.value || '', [['', 'Needs confirmation'], ['male', 'Men'], ['female', 'Women'], ['unisex', 'Unisex']])}
        ${select('Target age group', 'classification.ageGroup', product.classification?.ageGroup?.value || '', [['', 'Needs confirmation'], ['newborn', 'Newborn'], ['infant', 'Infant / Baby'], ['toddler', 'Toddler'], ['kids', 'Kids'], ['adult', 'Adult']])}
        ${attr('Condition', 'condition', [['new', 'New'], ['used', 'Used'], ['refurbished', 'Refurbished']])}
        ${attr('Color', 'color')}${attr('Material', 'material')}${attr('Pattern', 'pattern')}
        ${attr('Availability', 'availability', [['in_stock', 'In stock'], ['out_of_stock', 'Out of stock'], ['preorder', 'Preorder'], ['backorder', 'Backorder']])}
        ${attr('Brand', 'brand')}${attr('Size', 'size')}
        ${attr('Size system', 'size_system', [['US', 'US'], ['UK', 'UK'], ['EU', 'EU'], ['AU', 'AU'], ['JP', 'JP'], ['CN', 'CN'], ['BR', 'BR'], ['MEX', 'MEX']])}
        ${attr('Size type', 'size_type', [['regular', 'Regular'], ['petite', 'Petite'], ['plus', 'Plus'], ['tall', 'Tall'], ['big', 'Big'], ['maternity', 'Maternity']])}
        ${attr('Product type', 'product_type')}${attr('Google product category', 'google_product_category')}
        ${attr('MPN (when factual)', 'mpn')}${attr('GTIN (when factual)', 'gtin')}
        ${select('Identifier exists', 'merchant.identifier_exists', merchant.identifier_exists === true ? 'true' : merchant.identifier_exists === false ? 'false' : '', [['', 'Needs confirmation'], ['true', 'Yes — valid GTIN or MPN'], ['false', 'No identifier exists']])}
        ${attr('Item group ID', 'item_group_id')}${attr('Shipping weight', 'shipping_weight')}
      </div>
      <div class="pe-merchant-statuses">
        ${readiness.missing?.length ? `<div class="alert warning"><strong>Missing required</strong><p>${readiness.missing.map(esc).join(', ')}</p></div>` : ''}
        ${readiness.needsConfirmation?.length ? `<div class="alert warning"><strong>Needs confirmation</strong><p>${readiness.needsConfirmation.map(esc).join(', ')}</p></div>` : ''}
        ${readiness.invalid?.length ? `<div class="alert danger"><strong>Invalid or conflicting</strong><p>${readiness.invalid.map(esc).join(', ')}</p></div>` : ''}
      </div>
    </section>`;
  }

  function render(productInput, workspace, context) {
    const product = productInput || empty();
    const owner = context.owner;
    const editable = ['draft', 'changes_requested'].includes(product.workflowState);
    const identity = product.identity;
    const inventory = product.variants.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const margin = product.pricing.cost != null && product.pricing.price
      ? `${Math.round(((product.pricing.price - product.pricing.cost) / product.pricing.price) * 100)}% estimated margin`
      : 'Add cost to calculate margin';
    return `<div class="pe-page">
      <header class="pe-head"><div><a href="/admin/products" data-route="products">Products</a><h1>${esc(product.id ? product.title || 'Product Editor v2' : 'Add Product')}</h1><p>Complete website product content, media, variants, inventory, SEO and governed publishing.</p></div><div class="button-row"><a class="btn" href="/admin/products" data-route="products">Back</a>${editable ? '<button class="btn" id="pe-save-continue">Save and continue</button><button class="btn primary" id="pe-save">Save Draft</button>' : ''}</div></header>
      ${!product.id ? '<div class="alert info"><strong>New governed product</strong><p>Save the draft first. Product DNA and automatic identities are created only after explicit Owner approval.</p></div>' : ''}
      <form id="pe-form" class="pe-layout">
        <main class="pe-main">
          ${visionPanel(product, workspace)}
          ${mediaStudioPanel(product, workspace)}
          ${copilotPanel(product, workspace)}
          <section class="card pe-card"><h2>Product content</h2>${input('Product title', 'title', product.title, 'text', 'required maxlength="300"')}
            <div class="pe-content-contract"><p><strong>Permanent website content contract</strong> — the Rich description and four supporting sections publish in this exact order on every factual PDP.</p>
              ${textarea('1. Description — separate 1–3 paragraphs with blank lines', 'websiteContent.description', (product.websiteContent?.description || []).join('\n\n'))}
              ${textarea('2. Features — one factual bullet per line', 'websiteContent.features', (product.websiteContent?.features || []).join('\n'))}
              ${textarea('3. Specifications — Label: Value, one per line', 'websiteContent.specifications', (product.websiteContent?.specifications || []).map((item) => `${item.label}: ${item.value}`).join('\n'))}
              ${textarea('4. Perfect for', 'websiteContent.perfectFor', product.websiteContent?.perfectFor)}
              ${textarea('5. Why you’ll love it', 'websiteContent.whyYouWillLoveIt', product.websiteContent?.whyYouWillLoveIt)}
            </div>
            <details><summary>Additional SEO/AEO content</summary><div class="pe-grid-2">${textarea('FAQ', 'section.faq', product.sections.faq)}${textarea('Buying Guide', 'section.buyingGuide', product.sections.buyingGuide)}</div></details>
          </section>
          <section class="card pe-card"><div class="card-head"><div><h2>Media</h2><p>Upload, reorder, classify and describe product images.</p></div><button class="btn" id="pe-library" type="button">Media Library</button></div>${media(product)}</section>
          <section class="card pe-card"><h2>Category</h2><div class="pe-grid-2">${workspace?.taxonomy?.length ? `<label>Primary category<input name="organization.category" required list="pe-taxonomy-options" value="${esc(product.organization.category)}" placeholder="Select synced category"><datalist id="pe-taxonomy-options">${workspace.taxonomy.map((item) => `<option value="${esc(item.name)}" label="${esc(item.hierarchyPath)}"></option>`).join('')}</datalist><small>Published MOTOGRIP taxonomy · searchable hierarchy path</small></label>` : input('Category', 'organization.category', product.organization.category, 'text', 'required')}<div class="pe-field"><span>Audience classification</span><p>${esc(product.organization.gender || 'Needs confirmation')} · ${esc(product.organization.ageGroup || 'Needs confirmation')}</p><small>Manage canonical gender and age group in Google Merchant attributes below.</small></div></div>${workspace?.assignedTaxonomy?.length ? `<div class="pe-taxonomy-assignments"><strong>Category Manager assignments</strong>${workspace.assignedTaxonomy.map((item) => `<span>${esc(item.hierarchyPath)}</span>`).join('')}</div>` : ''}</section>
          <section class="card pe-card"><h2>Pricing</h2><div class="pe-grid-3">${input('Base price', 'pricing.price', product.pricing.price, 'number', 'min="0" step=".01" required')}${input('Compare-at price', 'pricing.compareAtPrice', product.pricing.compareAtPrice, 'number', 'min="0" step=".01"')}${input('Cost per item', 'pricing.cost', product.pricing.cost, 'number', 'min="0" step=".01"')}</div><label class="pe-toggle"><input name="pricing.taxable" type="checkbox" ${product.pricing.taxable ? 'checked' : ''}> Taxable</label><p>${margin}</p></section>
          <section class="card pe-card"><h2>Inventory & identity</h2><div class="pe-grid-4">${input('Product SKU', 'identity.productSku', identity?.productSku || 'Generated after approval', 'text', 'readonly')}${input('Internal Product Code', 'identity.internalProductCode', identity?.internalProductCode || 'Generated automatically', 'text', 'readonly')}${input('Factory Code', 'identity.factoryCode', identity?.factoryCode || 'Generated automatically', 'text', 'readonly')}${input('Total inventory', 'inventory.total', inventory, 'number', 'readonly')}</div><div class="button-row"><label class="pe-toggle"><input name="inventory.trackInventory" type="checkbox" ${product.inventory.trackInventory ? 'checked' : ''}> Track inventory</label><label class="pe-toggle"><input name="inventory.continueSellingWhenOutOfStock" type="checkbox" ${product.inventory.continueSellingWhenOutOfStock ? 'checked' : ''}> Continue selling when out of stock</label></div></section>
          <section class="card pe-card"><h2>Variants</h2><p>Add up to three options. Disable combinations that are not sold.</p>${options(product)}${variants(product)}</section>
          <section class="card pe-card"><h2>Shipping</h2><label class="pe-toggle"><input name="shipping.physicalProduct" type="checkbox" ${product.shipping.physicalProduct ? 'checked' : ''}> Physical product</label><div class="pe-grid-3">${input('Weight', 'shipping.weight', product.shipping.weight, 'number', 'min="0" step=".01"')}${select('Weight unit', 'shipping.weightUnit', product.shipping.weightUnit, ['lb', 'oz', 'kg', 'g'])}${input('Package preset', 'shipping.packagePreset', product.shipping.packagePreset)}${input('Country of origin', 'shipping.countryOfOrigin', product.shipping.countryOfOrigin, 'text', 'maxlength="2"')}${input('HS code', 'shipping.hsCode', product.shipping.hsCode)}${input('Processing time', 'shipping.processingTime', product.shipping.processingTime)}</div></section>
          <section class="card pe-card"><h2>Product metafields</h2><div class="pe-grid-2">${metafields.map(([key, label]) => input(label, `metafield.${key}`, product.metafields[key] ?? '')).join('')}</div></section>
          ${merchantPanel(product)}
          <section class="card pe-card"><h2>Search engine listing</h2><div class="pe-search-preview"><strong>${esc(product.seo.title || product.title || 'Product SEO title')}</strong><span>${esc(`${location.origin}/products/${product.seo.handle || 'product-handle'}`)}</span><p>${esc(product.seo.metaDescription || 'Add a useful meta description for customers in search.')}</p></div>${input(`SEO title (${product.seo.title.length}/60)`, 'seo.title', product.seo.title)}${product.seo.title.length && (product.seo.title.length < 50 || product.seo.title.length > 60) ? '<p class="pe-warning">Recommended target: 50–60 characters.</p>' : ''}${textarea(`Meta description (${product.seo.metaDescription.length}/160)`, 'seo.metaDescription', product.seo.metaDescription)}${product.seo.metaDescription.length && (product.seo.metaDescription.length < 150 || product.seo.metaDescription.length > 160) ? '<p class="pe-warning">Recommended target: 150–160 characters.</p>' : ''}${input('URL handle', 'seo.handle', product.seo.handle)}${product.workflowState === 'live' ? '<p class="pe-warning">Changing a live handle needs explicit confirmation and a future redirect.</p>' : ''}</section>
        </main>
        <aside class="pe-side">
          <section class="card pe-card pe-sticky"><h2>Status</h2>${select('Product status', 'organization.status', product.organization.status, [['draft', 'Draft'], ['active', 'Active'], ['archived', 'Archived']])}${status('Publishing state', product.workflowState)}${status('Owner review', product.ownerReviewStatus)}${status('Website sync', product.websiteSyncStatus)}${status('Identity', identity?.state || 'not generated')}<button class="btn full" id="pe-preview" type="button">Preview Website</button></section>
          <section class="card pe-card"><h2>Product organization</h2>${select('Brand / Vendor', 'organization.brand', product.organization.brand, ['MOTOGRIP GEAR', 'BLACKTOP GEAR', 'Vintage Leather Goods', 'BRANDS JACKET HUB', 'The Western Hides', 'Custom Jacket Co', 'Be Smart'])}${input('Vendor', 'organization.vendor', product.organization.vendor)}${select('Product type', 'organization.productType', product.organization.productType, workspace?.productTypes || productTypes)}${input('Collections (comma separated)', 'organization.collections', product.organization.collections.join(', '))}${input('Tags (comma separated)', 'organization.tags', product.organization.tags.join(', '))}${input('Theme template', 'organization.themeTemplate', product.organization.themeTemplate)}</section>
          <section class="card pe-card"><h2>Publishing requirements</h2><ul class="pe-checks"><li class="done">Product UUID reserved</li><li class="${identity?.state === 'locked' ? 'done' : ''}">Locked Product Identity</li><li>Trusted Product Release</li><li>Valid Knowledge Lock</li><li class="${product.title && product.media.length && product.organization.category ? 'done' : ''}">Critical fields complete</li><li class="${product.workflowState === 'approved' ? 'done' : ''}">Owner-approved revision</li></ul></section>
        </aside>
      </form>
      <div class="pe-actions"><div><strong>Revision ${product.revision}</strong><span>${product.updatedAt ? `Updated ${new Date(product.updatedAt).toLocaleString()}` : 'Not saved yet'}</span></div><div class="button-row">${product.id && product.workflowState === 'live' ? '<button class="btn" id="pe-revise">Create New Revision</button>' : ''}${editable && product.id ? '<button class="btn primary" id="pe-submit">Submit for Review</button>' : ''}${owner && product.workflowState === 'submitted' ? '<button class="btn" id="pe-changes">Request Changes</button><button class="btn primary" id="pe-approve">Approve</button>' : ''}${owner && product.workflowState === 'approved' ? '<button class="btn primary" id="pe-publish">Approve & Publish</button>' : ''}</div></div>
    </div>`;
  }

  function collect(product) {
    const form = document.getElementById('pe-form');
    const get = (name) => form.elements.namedItem(name);
    const value = (name) => get(name)?.value ?? '';
    const checked = (name) => Boolean(get(name)?.checked);
    const optionRows = [...form.querySelectorAll('.pe-option')];
    const optionsValue = optionRows.map((row) => ({
      name: row.querySelector('[data-option-name]').value.trim(),
      values: csv(row.querySelector('[data-option-values]').value),
    })).filter((item) => item.name && item.values.length);
    const variantsValue = [...form.querySelectorAll('tr[data-variant]')].map((row) => {
      const original = product.variants.find((item) => item.id === row.dataset.variant) || {};
      const field = (name) => row.querySelector(`[data-v="${name}"]`);
      return {
        ...original, id: row.dataset.variant, signature: row.dataset.signature,
        imageId: field('imageId').value || null,
        price: Number(field('price').value || 0),
        compareAtPrice: field('compareAtPrice').value === '' ? null : Number(field('compareAtPrice').value),
        cost: field('cost').value === '' ? null : Number(field('cost').value),
        quantity: Number(field('quantity').value || 0), weight: Number(field('weight').value || 0),
        status: field('status').value, availableForSale: field('availableForSale').checked,
      };
    });
    return {
      expectedRevision: product.id ? window.__peWorkspace.storeRevision : undefined,
      title: value('title'), descriptionHtml: '',
      websiteContent: {
        description: value('websiteContent.description').split(/\n{2,}/).map((item) => item.trim()).filter(Boolean),
        features: value('websiteContent.features').split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        specifications: value('websiteContent.specifications').split(/\r?\n/).map((line) => {
          const [label, entry] = line.split(/:(.*)/s);
          return { label: label?.trim(), value: entry?.trim() };
        }).filter((item) => item.label && item.value),
        perfectFor: value('websiteContent.perfectFor'),
        whyYouWillLoveIt: value('websiteContent.whyYouWillLoveIt'),
      },
      sections: { faq: value('section.faq'), buyingGuide: value('section.buyingGuide') },
      classification: {
        gender: {
          value: value('classification.gender'), confidence: 'high',
          status: value('classification.gender') ? 'confirmed' : 'needs_confirmation',
          evidence: [], source: 'manual_product_editor',
        },
        ageGroup: {
          value: value('classification.ageGroup'), confidence: 'high',
          status: value('classification.ageGroup') ? 'confirmed' : 'needs_confirmation',
          evidence: [], source: 'manual_product_editor',
        },
      },
      merchantAttributes: {
        ...Object.fromEntries(['condition', 'color', 'material', 'pattern', 'availability', 'brand', 'size',
          'size_system', 'size_type', 'product_type', 'google_product_category', 'mpn', 'gtin',
          'item_group_id', 'shipping_weight'].map((key) => [key, value(`merchant.${key}`)])),
        gender: value('classification.gender'), age_group: value('classification.ageGroup'),
        identifier_exists: value('merchant.identifier_exists') === '' ? null : value('merchant.identifier_exists') === 'true',
      },
      organization: {
        brand: value('organization.brand'), vendor: value('organization.vendor'),
        productType: value('organization.productType'), category: value('organization.category'),
        gender: value('classification.gender') === 'male' ? 'Men' :
          value('classification.gender') === 'female' ? 'Women' : 'Unisex',
        ageGroup: value('classification.ageGroup'), collections: csv(value('organization.collections')),
        tags: csv(value('organization.tags')), themeTemplate: value('organization.themeTemplate'),
        status: value('organization.status'),
      },
      pricing: { price: Number(value('pricing.price') || 0), compareAtPrice: value('pricing.compareAtPrice'), cost: value('pricing.cost'), taxable: checked('pricing.taxable') },
      inventory: { trackInventory: checked('inventory.trackInventory'), continueSellingWhenOutOfStock: checked('inventory.continueSellingWhenOutOfStock') },
      shipping: { physicalProduct: checked('shipping.physicalProduct'), weight: Number(value('shipping.weight') || 0), weightUnit: value('shipping.weightUnit'), packagePreset: value('shipping.packagePreset'), countryOfOrigin: value('shipping.countryOfOrigin'), hsCode: value('shipping.hsCode'), processingTime: value('shipping.processingTime') },
      metafields: Object.fromEntries(metafields.map(([key]) => [key, value(`metafield.${key}`)])),
      seo: { title: value('seo.title'), metaDescription: value('seo.metaDescription'), handle: value('seo.handle') },
      options: optionsValue, variants: variantsValue,
    };
  }

  function combinations(optionValues, product) {
    const active = optionValues.filter((option) => option.name && option.values.length);
    const rows = active.length ? active.reduce((items, option) => items.flatMap((item) =>
      option.values.map((value) => ({ ...item, [code(option.name)]: value }))), [{}]) : [{}];
    const prior = new Map(product.variants.map((item) => [item.signature, item]));
    return rows.map((attributes) => {
      const signature = Object.entries(attributes).map(([key, value]) => `${key}:${value}`).join('|') || 'default';
      return prior.get(signature) || {
        id: crypto.randomUUID(), signature, attributes, sku: '', imageId: null,
        price: product.pricing.price, compareAtPrice: product.pricing.compareAtPrice,
        cost: product.pricing.cost, quantity: 0, weight: product.shipping.weight,
        barcodeId: null, status: 'active', availableForSale: true,
      };
    });
  }

  function bind(productInput, workspace, context) {
    const product = productInput || empty();
    window.__peWorkspace = workspace || { storeRevision: 0 };
    const action = async (path, method = 'POST', payload = {}) => {
      try {
        const result = await context.api(path, { method, body: JSON.stringify(payload) });
        context.update(result.product, result);
        context.toast('Product Editor updated');
        return result;
      } catch (error) { context.toast(error.message); }
    };
    const aiValue = (name) => document.getElementById('pe-form')?.elements.namedItem(name)?.value || '';
    const knownFacts = () => Object.fromEntries(aiValue('ai.knownFacts').split('\n')
      .map((line) => line.split(/:(.*)/s)).filter((pair) => pair[0]?.trim() && pair[1]?.trim())
      .map(([key, value]) => [key.trim(), value.trim()]));
    const confirmedAnswers = () => Object.fromEntries(
      [...document.querySelectorAll('[data-ai-answer]')]
        .filter((item) => item.value !== '')
        .map((item) => [item.dataset.aiAnswer, item.value]),
    );
    const refreshCopilot = (response) => {
      workspace.aiCopilot = response.workspace;
      context.update(product, workspace);
    };
    const refreshVision = (response, message) => {
      workspace.aiVision = response.workspace;
      if (response.coverage && workspace.aiMediaStudio) workspace.aiMediaStudio.visionCoverage = response.coverage;
      if (response.application && workspace.aiCopilot) {
        workspace.aiCopilot.approvedVisionFacts = response.workspace.approvedFacts;
      }
      context.update(product, workspace);
      context.toast(message);
    };
    const visionAction = async (path, payload = {}, message = 'Vision workflow updated') => {
      try {
        const response = await context.api(path, {
          method: 'POST',
          body: JSON.stringify({ expectedRevision: workspace.aiVision.storeRevision, ...payload }),
        });
        refreshVision(response, message);
      } catch (error) { context.toast(error.message); }
    };
    document.getElementById('pe-v-save-draft')?.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/draft`,
      {
        providerId: document.getElementById('pe-v-provider')?.value || 'metadata_only',
        selectedMediaIds: [...document.querySelectorAll('[data-v-image]:checked')].map((item) => item.dataset.vImage),
        imageRoles: Object.fromEntries([...document.querySelectorAll('[data-v-role]')].map((item) => [item.dataset.vRole, item.value])),
        excludedMediaIds: [...document.querySelectorAll('[data-v-image]:not(:checked)')].map((item) => item.dataset.vImage),
        note: document.getElementById('pe-v-note')?.value || '',
      },
      'Versioned Vision analysis draft created',
    ));
    document.getElementById('pe-v-run')?.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/run`,
      {},
      'Vision analysis complete — no external provider call was made',
    ));
    document.querySelectorAll('[data-v-fact-approve]').forEach((button) => button.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/facts/${button.dataset.vFactApprove}/approve`,
      {}, 'Vision fact approved',
    )));
    document.querySelectorAll('[data-v-fact-reject]').forEach((button) => button.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/facts/${button.dataset.vFactReject}/reject`,
      { note: prompt('Rejection note') || '' }, 'Vision fact rejected',
    )));
    document.querySelectorAll('[data-v-fact-correct]').forEach((button) => button.addEventListener('click', () => {
      const value = prompt('Correct factual value');
      if (value != null) visionAction(
        `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/facts/${button.dataset.vFactCorrect}/correct`,
        { value }, 'Corrected Vision fact approved',
      );
    }));
    document.querySelectorAll('[data-v-resolve]').forEach((button) => button.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/conflicts/${button.dataset.vResolve}/resolve`,
      { choice: button.dataset.choice }, 'Vision conflict resolved',
    )));
    document.getElementById('pe-v-share-coverage')?.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/update-media-coverage`,
      {}, 'Missing-image plan shared with AI Media Studio',
    ));
    document.getElementById('pe-v-apply-dna')?.addEventListener('click', () => visionAction(
      `/api/admin/ai-vision/products/${product.id}/analyses/${workspace.aiVision.latest.id}/apply-product-dna`,
      {}, 'Approved facts applied to the governed Product DNA overlay',
    ));
    document.getElementById('pe-v-history')?.addEventListener('click', () =>
      context.toast(`${workspace.aiVision.history.length} Vision analysis version${workspace.aiVision.history.length === 1 ? '' : 's'}`));
    const mediaStudioPayload = () => ({
      expectedRevision: workspace.aiMediaStudio.storeRevision,
      mode: document.querySelector('[name="mediaStudio.mode"]:checked')?.value || 'uploaded_only',
      referenceMediaIds: [...document.querySelectorAll('[data-ms-image]:checked')].map((item) => item.dataset.msImage),
      roleAssignments: Object.fromEntries([...document.querySelectorAll('[data-ms-role]')].map((item) => [item.dataset.msRole, item.value])),
      selectedAssets: [...document.querySelectorAll('[data-ms-asset]:checked')].map((item) => item.dataset.msAsset),
      designLocks: [...document.querySelectorAll('[data-ms-lock]:checked')].map((item) => item.dataset.msLock),
      instructions: document.getElementById('pe-form')?.elements.namedItem('mediaStudio.instructions')?.value || '',
    });
    const refreshMediaStudio = (response, message) => {
      workspace.aiMediaStudio = response.workspace;
      context.update(product, workspace);
      context.toast(message);
    };
    document.getElementById('pe-ms-save')?.addEventListener('click', async () => {
      try {
        const response = await context.api(`/api/admin/ai-media-studio/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(mediaStudioPayload()),
        });
        refreshMediaStudio(response, 'Media production plan saved');
      } catch (error) { context.toast(error.message); }
    });
    document.getElementById('pe-ms-analyze')?.addEventListener('click', async () => {
      try {
        const saved = await context.api(`/api/admin/ai-media-studio/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(mediaStudioPayload()),
        });
        const response = await context.api(`/api/admin/ai-media-studio/products/${product.id}/analyze`, {
          method: 'POST',
          body: JSON.stringify({ expectedRevision: saved.workspace.storeRevision }),
        });
        refreshMediaStudio(response, 'Coverage analysis complete — no image API was called');
      } catch (error) { context.toast(error.message); }
    });
    const mediaAssetAction = async (assetId, operation, payload = {}) => {
      try {
        const response = await context.api(`/api/admin/ai-media-studio/products/${product.id}/assets/${assetId}/${operation}`, {
          method: 'POST',
          body: JSON.stringify({ expectedRevision: workspace.aiMediaStudio.storeRevision, ...payload }),
        });
        refreshMediaStudio(response, `Media asset ${operation.replaceAll('_', ' ')} complete`);
      } catch (error) { context.toast(error.message); }
    };
    const saveAssetSource = (assetId) => {
      const control = document.querySelector(`[data-ms-source="${assetId}"]`);
      const selected = (name) => [...(document.querySelector(`[${name}="${assetId}"]`)?.selectedOptions || [])].map((item) => item.value);
      return mediaAssetAction(assetId, 'source', {
        source: control.value,
        productReferenceMediaIds: selected('data-ms-product-refs'),
        styleReferenceMediaIds: selected('data-ms-style-refs'),
        designLocks: [...document.querySelectorAll('[data-ms-lock]:checked')].map((item) => item.dataset.msLock),
        instructions: document.querySelector(`[data-ms-asset-instructions="${assetId}"]`)?.value || '',
      });
    };
    document.querySelectorAll('[data-ms-source]').forEach((control) => control.addEventListener('change',
      () => saveAssetSource(control.dataset.msSource)));
    document.querySelectorAll('[data-ms-save-asset]').forEach((button) => button.addEventListener('click',
      () => saveAssetSource(button.dataset.msSaveAsset)));
    document.querySelectorAll('[data-ms-prompt]').forEach((button) => button.addEventListener('click',
      () => mediaAssetAction(button.dataset.msPrompt, 'prompt')));
    document.querySelectorAll('[data-ms-attach]').forEach((button) => button.addEventListener('click', () => {
      const mediaId = document.querySelector(`[data-ms-result="${button.dataset.msAttach}"]`)?.value;
      mediaAssetAction(button.dataset.msAttach, 'result', { mediaId });
    }));
    document.querySelectorAll('[data-ms-approve]').forEach((button) => button.addEventListener('click',
      () => mediaAssetAction(button.dataset.msApprove, 'approve')));
    document.querySelectorAll('[data-ms-reject]').forEach((button) => button.addEventListener('click',
      () => mediaAssetAction(button.dataset.msReject, 'reject', { reason: prompt('Rejection reason') || '' })));
    document.querySelectorAll('[data-ms-restore]').forEach((button) => button.addEventListener('click',
      () => mediaAssetAction(button.dataset.msRestore, 'restore')));
    document.querySelectorAll('[data-ms-history]').forEach((button) => button.addEventListener('click', async () => {
      try {
        const result = await context.api(`/api/admin/ai-media-studio/products/${product.id}/assets/${button.dataset.msHistory}/history`);
        context.toast(`${result.events.length} safe audit event${result.events.length === 1 ? '' : 's'} recorded`);
      } catch (error) { context.toast(error.message); }
    }));
    document.querySelectorAll('[data-ms-copy-prompt]').forEach((button) => button.addEventListener('click', async () => {
      const text = document.querySelector(`[data-ms-prompt-edit="${button.dataset.msCopyPrompt}"]`)?.value || '';
      await navigator.clipboard.writeText(text);
      context.toast('Prompt copied');
    }));
    document.querySelectorAll('[data-ms-export-prompt]').forEach((button) => button.addEventListener('click', () => {
      const text = document.querySelector(`[data-ms-prompt-edit="${button.dataset.msExportPrompt}"]`)?.value || '';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      link.download = `motogrip-media-prompt-${button.dataset.msExportPrompt}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    }));
    document.getElementById('pe-ms-provider-save')?.addEventListener('click', async () => {
      try {
        await context.api('/api/admin/ai-media-studio/providers', {
          method: 'PUT',
          body: JSON.stringify({
            expectedRevision: workspace.aiMediaStudio.storeRevision,
            openai: { enabled: document.getElementById('pe-ms-openai-enabled')?.checked === true },
            googleFlow: { enabled: document.getElementById('pe-ms-flow-enabled')?.checked !== false },
          }),
        });
        const response = await context.api(`/api/admin/ai-media-studio/products/${product.id}`);
        refreshMediaStudio({ workspace: response }, 'Provider settings saved without exposing credentials');
      } catch (error) { context.toast(error.message); }
    });
    document.getElementById('pe-ai-analyze')?.addEventListener('click', async () => {
      try {
        context.toast('Analyzing product images…');
        const response = await context.api(`/api/admin/ai-product-copilot/products/${product.id}/analyze`, {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: workspace.aiCopilot.storeRevision,
            imageIds: [...document.querySelectorAll('[data-ai-image]:checked')].map((item) => item.dataset.aiImage),
            productName: aiValue('ai.productName'), instruction: aiValue('ai.instruction'),
            knownFacts: { ...knownFacts(), ...confirmedAnswers() },
            targetAudience: aiValue('ai.targetAudience'),
            targetMarket: aiValue('ai.targetMarket'), brand: aiValue('ai.brand'),
            tone: aiValue('ai.tone'),
          }),
        });
        refreshCopilot(response);
        context.toast('AI analysis complete. Review suggestions before applying.');
      } catch (error) { context.toast(error.message); }
    });
    document.querySelectorAll('[data-ai-shortcut]').forEach((button) => button.addEventListener('click', () => {
      const instruction = document.getElementById('pe-form')?.elements.namedItem('ai.instruction');
      if (instruction) {
        const request = `${button.dataset.aiShortcut}. Keep every suggestion factual and require confirmation for uncertain details.`;
        instruction.value = instruction.value ? `${instruction.value}\n${request}` : request;
      }
      document.getElementById('pe-ai-analyze')?.click();
    }));
    document.getElementById('pe-ai-cancel')?.addEventListener('click', async () => {
      try {
        const response = await context.api(`/api/admin/ai-product-copilot/products/${product.id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: workspace.aiCopilot.storeRevision,
            instruction: aiValue('ai.instruction'),
          }),
        });
        refreshCopilot(response); context.toast('Analysis cancelled safely');
      } catch (error) { context.toast(error.message); }
    });
    document.getElementById('pe-ai-start-over')?.addEventListener('click', () => {
      document.querySelectorAll('[data-ai-suggestion]').forEach((item) => { item.checked = false; });
      const instruction = document.getElementById('pe-form')?.elements.namedItem('ai.instruction');
      const facts = document.getElementById('pe-form')?.elements.namedItem('ai.knownFacts');
      if (instruction) instruction.value = '';
      if (facts) facts.value = '';
      context.toast('AI selections cleared. Previous analysis history is preserved.');
    });
    const setSuggestedField = (field, value) => {
      const form = document.getElementById('pe-form');
      if (field === 'title') form.elements.namedItem('title').value = value;
      else if (field === 'organization.tags') form.elements.namedItem(field).value = value;
      else {
        const target = form.elements.namedItem(field);
        if (target) target.value = value;
      }
    };
    const reviewSuggestions = async (mode) => {
      const latest = workspace.aiCopilot?.latest;
      if (!latest) return;
      const selected = [];
      const rejected = [];
      latest.suggestions.forEach((suggestion) => {
        const checkbox = document.querySelector(`[data-ai-suggestion="${CSS.escape(suggestion.field)}"]`);
        const safe = suggestion.confidence === 'high' &&
          !latest.trustedConflicts?.some((conflict) => conflict.field === suggestion.field);
        const accept = mode === 'safe' ? safe : mode === 'selected' ? checkbox?.checked : false;
        if (mode === 'reject-uncertain' && !safe) {
          if (checkbox) checkbox.checked = false;
          rejected.push(suggestion.field);
        } else if (accept) {
          const editor = document.querySelector(`[data-ai-edit="${CSS.escape(suggestion.field)}"]`);
          setSuggestedField(suggestion.field, editor?.value ?? suggestion.value);
          selected.push(suggestion.field);
        }
      });
      if (mode !== 'reject-uncertain' && !selected.length) return context.toast('Select at least one AI suggestion');
      try {
        const response = await context.api(`/api/admin/ai-product-copilot/products/${product.id}/review`, {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: workspace.aiCopilot.storeRevision,
            analysisId: latest.id, acceptedFields: selected, rejectedFields: rejected,
            draftRevision: product.revision,
          }),
        });
        workspace.aiCopilot = response.workspace;
        context.dirty();
        context.toast(selected.length ? 'Suggestions applied locally. Save Draft to persist them.' : 'Uncertain suggestions rejected.');
      } catch (error) { context.toast(error.message); }
    };
    document.getElementById('pe-ai-apply-selected')?.addEventListener('click', () => reviewSuggestions('selected'));
    document.getElementById('pe-ai-apply-safe')?.addEventListener('click', () => reviewSuggestions('safe'));
    document.getElementById('pe-ai-reject-uncertain')?.addEventListener('click', () => reviewSuggestions('reject-uncertain'));
    document.querySelectorAll('[data-rich]').forEach((button) => button.addEventListener('click', () => {
      const [command, value] = button.dataset.rich.split(':');
      document.execCommand(command, false, value || null);
    }));
    document.getElementById('pe-link')?.addEventListener('click', () => {
      const url = prompt('Enter a safe HTTPS URL');
      if (url && /^https:\/\//i.test(url)) document.execCommand('createLink', false, url);
    });
    document.getElementById('pe-table')?.addEventListener('click', () =>
      document.execCommand('insertHTML', false, '<table><tbody><tr><th>Specification</th><th>Details</th></tr><tr><td></td><td></td></tr></tbody></table>'));
    document.getElementById('pe-rich')?.addEventListener('paste', (event) => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    const save = async () => {
      const payload = collect(product);
      if (product.id) return action(`/api/admin/product-editor-v2/products/${product.id}`, 'PUT', payload);
      return action('/api/admin/product-editor-v2/products', 'POST', payload);
    };
    document.getElementById('pe-save')?.addEventListener('click', save);
    document.getElementById('pe-save-continue')?.addEventListener('click', save);
    document.getElementById('pe-form')?.addEventListener('input', () => context.dirty());
    const preserveForm = () => {
      const payload = collect(product);
      payload.options = [...document.querySelectorAll('.pe-option')].map((row) => ({
        name: row.querySelector('[data-option-name]').value.trim(),
        values: csv(row.querySelector('[data-option-values]').value),
      }));
      Object.assign(product, payload);
      return payload;
    };
    const addOption = (name) => {
      if (product.options.length >= 3) return context.toast('A maximum of three options is supported');
      preserveForm();
      product.options.push({ id: crypto.randomUUID(), name, values: [] });
      context.update(product, workspace);
    };
    document.getElementById('pe-add-size')?.addEventListener('click', () => addOption('Size'));
    document.getElementById('pe-add-color')?.addEventListener('click', () => addOption('Color'));
    document.getElementById('pe-add-custom')?.addEventListener('click', () => addOption('Custom option'));
    document.querySelectorAll('[data-option-remove]').forEach((button) => button.addEventListener('click', () => {
      preserveForm();
      product.options.splice(Number(button.dataset.optionRemove), 1); context.update(product, workspace);
    }));
    document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
      const row = document.querySelector(`[data-option="${button.dataset.preset}"]`);
      const field = row.querySelector('[data-option-values]');
      field.value = [...new Set([...csv(field.value), button.dataset.value])].join(', ');
    }));
    document.getElementById('pe-generate')?.addEventListener('click', () => {
      const payload = preserveForm();
      product.options = payload.options; product.variants = combinations(payload.options, product);
      context.update(product, workspace); context.toast(`${product.variants.length} variant combinations generated`);
    });
    document.getElementById('pe-all')?.addEventListener('change', (event) =>
      document.querySelectorAll('[data-v-select]').forEach((checkbox) => { checkbox.checked = event.target.checked; }));
    const bulk = (field, source) => {
      const value = document.getElementById(source).value;
      if (value === '') return;
      document.querySelectorAll('tr[data-variant]').forEach((row) => {
        if (row.querySelector('[data-v-select]').checked) row.querySelector(`[data-v="${field}"]`).value = value;
      });
    };
    document.getElementById('pe-apply-price')?.addEventListener('click', () => bulk('price', 'pe-bulk-price'));
    document.getElementById('pe-apply-qty')?.addEventListener('click', () => bulk('quantity', 'pe-bulk-qty'));
    document.getElementById('pe-apply-status')?.addEventListener('click', () => bulk('status', 'pe-bulk-status'));
    document.getElementById('pe-variant-search')?.addEventListener('input', (event) =>
      document.querySelectorAll('tr[data-variant]').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(event.target.value.toLowerCase()); }));
    document.getElementById('pe-files')?.addEventListener('change', async (event) => {
      if (!product.id) return context.toast('Save the product draft before uploading media');
      for (const file of event.target.files) {
        const dataBase64 = await new Promise((resolve) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(file);
        });
        await action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'POST', {
          expectedRevision: window.__peWorkspace.storeRevision, fileName: file.name,
          mimeType: file.type, dataBase64, role: 'Other', altText: product.title,
        });
      }
    });
    document.querySelectorAll('[data-feature]').forEach((button) => button.addEventListener('click', () => {
      const next = product.media.map((item) => ({ ...item, featured: item.id === button.dataset.feature }));
      action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'PUT', { expectedRevision: workspace.storeRevision, media: next });
    }));
    document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/media/${button.dataset.remove}`, 'DELETE', { expectedRevision: workspace.storeRevision })));
    let dragged = null;
    document.querySelectorAll('.pe-media').forEach((card) => {
      card.addEventListener('dragstart', () => { dragged = card.dataset.mediaId; });
      card.addEventListener('dragover', (event) => event.preventDefault());
      card.addEventListener('drop', () => {
        const ids = product.media.map((item) => item.id);
        const from = ids.indexOf(dragged); const to = ids.indexOf(card.dataset.mediaId);
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        const next = ids.map((id) => product.media.find((item) => item.id === id));
        action(`/api/admin/product-editor-v2/products/${product.id}/media`, 'PUT', { expectedRevision: workspace.storeRevision, media: next });
      });
    });
    document.querySelectorAll('.pe-media-preview img').forEach((image) => {
      const preview = image.closest('.pe-media-preview');
      image.addEventListener('load', () => preview.classList.replace('is-loading', 'is-loaded'));
      image.addEventListener('error', () => preview.classList.replace('is-loading', 'is-broken'));
      if (image.complete) preview.classList.replace('is-loading', image.naturalWidth ? 'is-loaded' : 'is-broken');
    });
    document.querySelectorAll('[data-media-retry]').forEach((button) => button.addEventListener('click', () => {
      const preview = button.closest('.pe-media-preview');
      const image = preview.querySelector('img');
      if (!image) return;
      preview.className = 'pe-media-preview is-loading';
      const url = new URL(image.src, location.origin);
      url.searchParams.set('retry', Date.now());
      image.src = url.href;
    }));
    document.querySelectorAll('[data-media-replace]').forEach((input) => input.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const dataBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.readAsDataURL(file);
      });
      try {
        const uploaded = await context.api(`/api/admin/product-editor-v2/products/${product.id}/media`, {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: workspace.storeRevision,
            fileName: file.name,
            mimeType: file.type,
            dataBase64,
            role: product.media.find((item) => item.id === input.dataset.mediaReplace)?.role || 'Other',
            altText: product.media.find((item) => item.id === input.dataset.mediaReplace)?.altText || product.title,
          }),
        });
        const prior = product.media.find((item) => item.id === input.dataset.mediaReplace);
        const priorIds = new Set(product.media.map((item) => item.id));
        const replacement = uploaded.product.media.find((item) => !priorIds.has(item.id));
        if (!prior || !replacement) throw new Error('Replacement image could not be resolved');
        const ordered = product.media.map((item) => item.id === prior.id ? {
          ...replacement,
          featured: prior.featured,
          role: prior.role,
          altText: prior.altText,
          title: prior.title,
        } : item);
        const reordered = await context.api(`/api/admin/product-editor-v2/products/${product.id}/media`, {
          method: 'PUT',
          body: JSON.stringify({ expectedRevision: uploaded.storeRevision, media: ordered }),
        });
        const replaced = await context.api(`/api/admin/product-editor-v2/products/${product.id}/media/${input.dataset.mediaReplace}`, {
          method: 'DELETE',
          body: JSON.stringify({ expectedRevision: reordered.storeRevision }),
        });
        context.update(replaced.product, replaced);
        context.toast('Product image replaced');
      } catch (error) {
        context.toast(error.message);
      }
    }));
    document.getElementById('pe-submit')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/submit`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-changes')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/request-changes`, 'POST', { expectedRevision: workspace.storeRevision, note: prompt('Requested changes') || '' }));
    document.getElementById('pe-approve')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/approve`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-publish')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/publish`, 'POST', { expectedRevision: workspace.storeRevision, expectedWebsiteRevision: product.websiteRevision, idempotencyKey: crypto.randomUUID() }));
    document.getElementById('pe-revise')?.addEventListener('click', () =>
      action(`/api/admin/product-editor-v2/products/${product.id}/revise`, 'POST', { expectedRevision: workspace.storeRevision }));
    document.getElementById('pe-preview')?.addEventListener('click', () => {
      if (product.seo.handle) window.open(`/products/${encodeURIComponent(product.seo.handle)}`, '_blank', 'noopener');
      else context.toast('Save a URL handle before previewing');
    });
    document.getElementById('pe-library')?.addEventListener('click', async () => {
      if (!product.id) return context.toast('Save the product draft before selecting Media Library assets');
      const choices = (workspace.mediaLibrary || []).filter((item) =>
        !product.media.some((current) => current.path === item.path));
      if (!choices.length) return context.toast('No additional Product Editor media is available');
      const selected = prompt(`Enter the number of an existing asset:\n${choices.map((item, index) => `${index + 1}. ${item.title || item.originalName || item.role}`).join('\n')}`);
      const asset = choices[Number(selected) - 1];
      if (asset) await action(`/api/admin/product-editor-v2/products/${product.id}/media-library`, 'POST', {
        expectedRevision: workspace.storeRevision, sourceMediaId: asset.id,
      });
    });
  }

  window.ProductEditorV2UI = { bind, empty, render };
}());
