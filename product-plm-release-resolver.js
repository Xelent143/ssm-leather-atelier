const { computeKnowledgeLockHash } = require('./product-plm-knowledge-locks');
const { computeApprovalPolicyHash } = require('./product-plm-approval-policies');
const {
  computeApprovalDecisionHash,
  computeApprovalRequestHash,
} = require('./product-plm-approvals');
const { computeEvidenceRecordHash } = require('./product-plm-evidence');
const {
  computeApprovalSnapshotHash,
  computeReleaseLifecycleEventHash,
  computeReleaseManifestHash,
  deriveReleaseLifecycle,
} = require('./product-plm-releases');
const { computeEvidenceSetHash, computeProductVersionHash } = require('./product-plm-versions');

function approvalSatisfied(policy, decisions) {
  if (!policy || !decisions.length) return false;
  if (decisions.some((decision) =>
    ['rejected', 'needs_changes', 'blocked', 'expired', 'superseded', 'revoked']
      .includes(decision.decisionCode))) {
    return false;
  }
  return policy.requiredApprovals.every((rule) => {
    const actors = new Set(
      decisions
        .filter((decision) =>
          decision.actorRole === rule.role && decision.decisionCode === 'approved')
        .map((decision) => decision.actorId),
    );
    return actors.size >= rule.minimumApprovals;
  });
}

function verifyRelease(store, release) {
  const version = store.productVersions.find((item) => item.id === release.productVersionId);
  if (!version || version.contentHash !== computeProductVersionHash(version) ||
      version.contentHash !== release.productVersionHash) {
    return { trusted: false, reason: 'invalid_version' };
  }
  const evidenceRecords = release.evidenceReferenceIds
    .map((id) => store.evidenceRecords.find((record) => record.id === id));
  if (evidenceRecords.some((record) =>
    !record || record.recordHash !== computeEvidenceRecordHash(record)) ||
      release.evidenceSetHash !==
      computeEvidenceSetHash(release.evidenceReferenceIds, store.evidenceRecords)) {
    return { trusted: false, reason: 'invalid_evidence' };
  }
  const request = store.approvalRequests.find((item) => item.id === release.approvalRequestId);
  const policy = request &&
    store.approvalPolicies.find((item) => item.id === request.approvalPolicyId);
  const snapshotDecisions = release.approvalDecisionIds
    .map((id) => store.approvalDecisions.find((item) => item.id === id))
    .filter(Boolean);
  const currentDecisions = request
    ? store.approvalDecisions.filter((item) => item.approvalRequestId === request.id)
    : [];
  const sortedCurrentDecisions = [...currentDecisions]
    .sort((left, right) => left.sequence - right.sequence);
  const decisionChainValid = sortedCurrentDecisions.every((decision, index) =>
    decision.sequence === index + 1 &&
    decision.previousDecisionHash ===
      (index === 0 ? null : sortedCurrentDecisions[index - 1].decisionHash) &&
    decision.decisionHash === computeApprovalDecisionHash(decision));
  if (!request || !policy ||
      policy.policyHash !== computeApprovalPolicyHash(policy) ||
      request.requestHash !== computeApprovalRequestHash(request) ||
      snapshotDecisions.length !== release.approvalDecisionIds.length ||
      request.productVersionId !== version.id ||
      request.versionContentHash !== version.contentHash ||
      request.evidenceSetHash !== release.evidenceSetHash ||
      release.approvalSnapshotHash !==
        computeApprovalSnapshotHash(policy, request, snapshotDecisions) ||
      !decisionChainValid ||
      !approvalSatisfied(policy, currentDecisions)) {
    return { trusted: false, reason: 'invalid_approval' };
  }
  if (release.releaseManifestHash !== computeReleaseManifestHash(release)) {
    return { trusted: false, reason: 'invalid_manifest' };
  }
  const lock = store.knowledgeLocks.find((item) => item.releaseId === release.id);
  if (!lock || lock.productVersionHash !== release.productVersionHash ||
      lock.evidenceSetHash !== release.evidenceSetHash ||
      lock.releaseManifestHash !== release.releaseManifestHash ||
      lock.approvalSnapshotHash !== release.approvalSnapshotHash ||
      lock.knowledgeLockHash !== computeKnowledgeLockHash(lock)) {
    return { trusted: false, reason: 'invalid_knowledge_lock' };
  }
  const lifecycle = store.releaseLifecycleEvents
    .filter((event) => event.releaseId === release.id)
    .sort((left, right) => left.sequence - right.sequence);
  const lifecycleValid = lifecycle.every((event, index) =>
    event.sequence === index + 1 &&
    event.previousEventHash === (index === 0 ? null : lifecycle[index - 1].eventHash) &&
    event.eventHash === computeReleaseLifecycleEventHash(event));
  if (!lifecycleValid) {
    return { trusted: false, reason: 'invalid_manifest' };
  }
  const state = deriveReleaseLifecycle(lifecycle);
  if (state === 'draft' || state === 'absent') {
    return { trusted: false, reason: 'not_approved' };
  }
  if (['withdrawn', 'superseded', 'revoked', 'expired'].includes(state)) {
    return { trusted: false, reason: state };
  }
  if (!['approved', 'active'].includes(state)) {
    return { trusted: false, reason: 'not_approved' };
  }
  return { trusted: true, reason: 'trusted', lock, state };
}

function resolveApprovedRelease(store, input = {}) {
  const releases = store.productReleases
    .filter((release) => release.productUuid === input.productUuid)
    .filter((release) => !input.channel || release.channels.includes(input.channel))
    .filter((release) => !input.purpose || release.purposes.includes(input.purpose))
    .sort((left, right) => right.releaseNumber - left.releaseNumber);
  if (!releases.length) {
    const productReleases = store.productReleases
      .filter((release) => release.productUuid === input.productUuid);
    if (input.channel && productReleases.length &&
        !productReleases.some((release) => release.channels.includes(input.channel))) {
      return { trusted: false, reason: 'channel_not_authorized', release: null };
    }
    if (input.purpose && productReleases.length &&
        !productReleases.some((release) => release.purposes.includes(input.purpose))) {
      return { trusted: false, reason: 'purpose_not_authorized', release: null };
    }
    return { trusted: false, reason: 'not_found', release: null };
  }
  const result = verifyRelease(store, releases[0]);
  return result.trusted
    ? { ...result, release: releases[0] }
    : { ...result, release: null };
}

module.exports = {
  approvalSatisfied,
  resolveApprovedRelease,
  verifyRelease,
};
