const AI_STUDIO_REPOSITORY_CONTRACT = Object.freeze({
  contractVersion: 1,
  methods: Object.freeze([
    'read',
    'write',
    'mutate',
  ]),
  concurrencyModel: 'single_replica_revision_checked',
  persistenceModel: 'versioned_json_metadata',
});

function validateAiStudioRepository(repository) {
  if (!repository || AI_STUDIO_REPOSITORY_CONTRACT.methods.some(
    (method) => typeof repository[method] !== 'function',
  )) {
    throw new Error('AI Studio repository contract is invalid.');
  }
  return repository;
}

module.exports = {
  AI_STUDIO_REPOSITORY_CONTRACT,
  validateAiStudioRepository,
};
