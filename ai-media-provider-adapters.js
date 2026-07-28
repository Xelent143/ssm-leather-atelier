const PROVIDER_IDS = Object.freeze(['uploaded', 'openai', 'google_flow', 'none']);

const CAPABILITIES = Object.freeze({
  uploaded: {
    generateImage: false, editImage: false, multipleReferences: true,
    highFidelityInput: true, backgroundReplacement: false, ghostMannequin: false,
    lifestyleGeneration: false, multiAngleGeneration: false, masks: false,
    costEstimation: true, execution: false,
  },
  openai: {
    generateImage: true, editImage: true, multipleReferences: true,
    highFidelityInput: true, backgroundReplacement: true, ghostMannequin: true,
    lifestyleGeneration: true, multiAngleGeneration: true, masks: true,
    costEstimation: true, execution: false,
  },
  google_flow: {
    generateImage: false, editImage: false, multipleReferences: true,
    highFidelityInput: true, backgroundReplacement: false, ghostMannequin: false,
    lifestyleGeneration: false, multiAngleGeneration: false, masks: false,
    costEstimation: false, execution: false,
  },
  none: {
    generateImage: false, editImage: false, multipleReferences: false,
    highFidelityInput: false, backgroundReplacement: false, ghostMannequin: false,
    lifestyleGeneration: false, multiAngleGeneration: false, masks: false,
    costEstimation: true, execution: false,
  },
});

function safeEnvironmentStatus(providerId, settings = {}, env = process.env) {
  if (providerId === 'uploaded') return { configured: true, available: true, status: 'Always Available' };
  if (providerId === 'none') return { configured: true, available: true, status: 'Not Required' };
  if (providerId === 'google_flow') {
    return {
      configured: true,
      available: settings.enabled !== false,
      status: settings.enabled === false ? 'Disabled' : 'Manual Prompt Workflow',
    };
  }
  const configured = Boolean(env.OPENAI_API_KEY);
  const enabled = settings.enabled === true;
  return {
    configured,
    available: configured && enabled,
    status: !enabled ? 'Disabled' : configured ? 'Configured — Execution Disabled' : 'Not Configured',
  };
}

function createProviderRegistry(options = {}) {
  const env = options.env || process.env;
  const settings = options.settings || {};
  const definitions = {
    uploaded: {
      id: 'uploaded', displayName: 'Uploaded Images', mode: 'local',
      assetSupport: 'uploaded_media', executionSupported: false,
    },
    openai: {
      id: 'openai', displayName: 'OpenAI', mode: 'adapter_foundation',
      targetModel: 'gpt-image-2', assetSupport: 'future_generation', executionSupported: false,
    },
    google_flow: {
      id: 'google_flow', displayName: 'Google Flow', mode: 'manual_prompt_workflow',
      directApi: 'unsupported', assetSupport: 'prompt_export_and_manual_upload', executionSupported: false,
    },
    none: {
      id: 'none', displayName: 'Not Required', mode: 'none',
      assetSupport: 'none', executionSupported: false,
    },
  };
  const provider = (id) => {
    if (!PROVIDER_IDS.includes(id)) return null;
    const state = safeEnvironmentStatus(id, settings[id] || {}, env);
    return {
      ...definitions[id],
      ...state,
      enabled: id === 'uploaded' || id === 'none' ? true : settings[id]?.enabled === true,
      capabilities: CAPABILITIES[id],
      credentialPresent: id === 'openai' ? state.configured : undefined,
      credentialValue: undefined,
    };
  };
  return {
    list: () => PROVIDER_IDS.map(provider),
    get: provider,
    estimate(id) {
      if (id === 'uploaded' || id === 'none') return { status: 'available', amount: 0, currency: 'USD', label: '$0.00' };
      if (id === 'google_flow') return { status: 'external', amount: null, currency: null, label: 'External/manual cost — not tracked' };
      return { status: 'unavailable', amount: null, currency: null, label: 'Unavailable until API pricing configuration is enabled' };
    },
    execute() {
      throw Object.assign(new Error('Provider execution is disabled in this sprint.'), {
        code: 'PROVIDER_EXECUTION_DISABLED',
      });
    },
  };
}

module.exports = { CAPABILITIES, PROVIDER_IDS, createProviderRegistry, safeEnvironmentStatus };
