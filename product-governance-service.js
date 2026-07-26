const crypto = require('crypto');
const { computeApprovalPolicyHash } = require('./product-plm-approval-policies');
const {
  authorizeApprovalActor,
  computeApprovalDecisionHash,
  computeApprovalRequestHash,
} = require('./product-plm-approvals');
const { computeHistoryEventHash } = require('./product-plm-history');
const { computeKnowledgeLockHash } = require('./product-plm-knowledge-locks');
const {
  computeApprovalSnapshotHash,
  computeReleaseLifecycleEventHash,
  computeReleaseManifestHash,
  deriveReleaseLifecycle,
} = require('./product-plm-releases');
const {
  computeEntityHashes,
  computeEvidenceSetHash,
  computeProductVersionHash,
  hashValue,
} = require('./product-plm-versions');

function emptyApprovalReferences() {
  return {
    delegationReferences: {
      delegatedFromActorId: null,
      delegatedToActorId: null,
      delegationPolicyReferenceId: null,
    },
    escalationReferences: {
      escalationReferenceId: null,
      escalationReasonCode: null,
      escalationLevel: null,
    },
    complianceReferences: { regulatoryReferenceIds: [], auditReferenceIds: [] },
    aiReviewReferences: {
      aiReviewReferenceId: null,
      aiRiskAssessmentReferenceId: null,
    },
    wholesaleClientReferences: {
      wholesaleApprovalReferenceId: null,
      clientApprovalReferenceId: null,
    },
  };
}

function createProductGovernanceService(options = {}) {
  const store = options.store;
  const identity = options.identity;
  const now = options.now || (() => Date.now());

  function owner(session) {
    const user = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    const authorization = authorizeApprovalActor(session, user, 'owner');
    if (!authorization.allowed) {
      const error = new Error('Named Owner access is required.');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }
    return { user, authorization, actorId: `user:${user.id}` };
  }

  function product(storeValue, productUuid) {
    const identityRecord = storeValue.productIdentities.find((item) => item.id === productUuid);
    if (!identityRecord) {
      const error = new Error('Product identity was not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return identityRecord;
  }

  function snapshot(storeValue, productUuid) {
    const identityRecord = product(storeValue, productUuid);
    const brand = storeValue.brands.find((item) => item.id === identityRecord.brandId);
    const legalEntity = storeValue.legalEntities.find((item) =>
      item.id === identityRecord.legalEntityId);
    const style = storeValue.productStyles.find((item) => item.productUuid === productUuid);
    const family = style
      ? storeValue.productFamilies.find((item) => item.id === style.familyId)
      : null;
    if (!brand || !legalEntity || !style || !family) {
      const error = new Error('Product hierarchy is incomplete.');
      error.code = 'VALIDATION';
      throw error;
    }
    const productComponents = storeValue.productComponents.filter((item) =>
      item.styleId === style.id);
    const entityIds = new Set([style.id, ...productComponents.map((item) => item.id)]);
    const styleOptionAssignments = storeValue.styleOptionAssignments.filter((item) =>
      item.styleId === style.id);
    const sellableItems = storeValue.sellableItems.filter((item) => item.styleId === style.id);
    const optionDefinitionIds = new Set([
      ...styleOptionAssignments.map((item) => item.optionDefinitionId),
      ...sellableItems.flatMap((item) =>
        item.optionSelections.map((selection) => selection.optionDefinitionId)),
    ]);
    const sellableIds = new Set(sellableItems.map((item) => item.id));
    return {
      productIdentity: structuredClone(identityRecord),
      brand: structuredClone(brand),
      legalEntity: structuredClone(legalEntity),
      productFamily: structuredClone(family),
      productStyle: structuredClone(style),
      productComponents: productComponents.map((item) => structuredClone(item)),
      productRelationships: storeValue.productRelationships.filter((item) =>
        entityIds.has(item.sourceEntityId) && entityIds.has(item.targetEntityId))
        .map((item) => structuredClone(item)),
      optionDefinitions: storeValue.optionDefinitions.filter((item) =>
        optionDefinitionIds.has(item.id)).map((item) => structuredClone(item)),
      optionValues: storeValue.optionValues.filter((item) =>
        optionDefinitionIds.has(item.optionDefinitionId)).map((item) => structuredClone(item)),
      styleOptionAssignments: styleOptionAssignments.map((item) => structuredClone(item)),
      sellableItems: sellableItems.map((item) => structuredClone(item)),
      marketplaceIdentities: storeValue.marketplaceIdentities.filter((item) =>
        item.subjectId === style.id || sellableIds.has(item.subjectId))
        .map((item) => structuredClone(item)),
    };
  }

  function appendHistory(draft, session, input) {
    const previous = draft.productHistoryEvents
      .filter((item) => item.productUuid === input.productUuid)
      .sort((left, right) => right.sequence - left.sequence)[0] || null;
    const event = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      productUuid: input.productUuid,
      sequence: previous ? previous.sequence + 1 : 1,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      action: input.action,
      result: 'success',
      actorId: input.actorId,
      sessionId: session.id || null,
      timestamp: new Date(now()).toISOString(),
      previousEventHash: previous?.eventHash || null,
      eventHash: null,
      relatedVersionId: input.relatedVersionId || null,
      relatedEvidenceId: null,
      changedFields: input.changedFields,
      beforeHash: null,
      afterHash: input.afterHash || null,
      dataClassification: 'internal',
      relatedApprovalPolicyId: input.relatedApprovalPolicyId || null,
      relatedApprovalRequestId: input.relatedApprovalRequestId || null,
      relatedApprovalDecisionId: input.relatedApprovalDecisionId || null,
      relatedReleaseId: input.relatedReleaseId || null,
      relatedKnowledgeLockId: input.relatedKnowledgeLockId || null,
    };
    event.eventHash = computeHistoryEventHash(event);
    draft.productHistoryEvents.push(event);
  }

  async function mutate(session, input, operation) {
    const actor = owner(session);
    return store.mutate((draft) => ({
      store: draft,
      value: operation(draft, actor),
    }), input.expectedRevision).then((result) => ({
      ...result.value,
      storeRevision: result.store.storeRevision,
    }));
  }

  async function createVersion(session, input) {
    return mutate(session, input, (draft, actor) => {
      const productSnapshot = snapshot(draft, input.productUuid);
      const prior = draft.productVersions.filter((item) =>
        item.productUuid === input.productUuid);
      const evidenceReferenceIds = [];
      const version = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        productUuid: input.productUuid,
        versionNumber: prior.length + 1,
        snapshotSchemaVersion: 1,
        sourceStoreRevision: draft.storeRevision,
        snapshot: productSnapshot,
        entityHashes: computeEntityHashes(productSnapshot),
        evidenceReferenceIds,
        evidenceSetHash: computeEvidenceSetHash(evidenceReferenceIds, draft.evidenceRecords),
        contentHash: null,
        captureReason: 'Owner-created Business MVP release candidate.',
        status: 'candidate',
        productDnaReferences: {
          dnaFingerprint: null,
          dnaGeneration: prior.length + 1,
          dnaParentVersionId: prior.at(-1)?.id || null,
          dnaScoreReferenceId: null,
        },
        competitorReferenceIds: [],
        searchIntelligenceReferences: {
          keywordClusterIds: [],
          searchIntentIds: [],
          faqClusterIds: [],
          trendIds: [],
          blogTopicIds: [],
        },
        aiProvenance: {
          aiSessionReferenceId: null,
          promptTemplateReferenceId: null,
          aiEngineVersionReferenceId: null,
          humanApprovalReferenceId: null,
        },
        dataClassification: 'confidential',
        createdAt: new Date(now()).toISOString(),
        createdBy: actor.actorId,
      };
      version.contentHash = computeProductVersionHash(version);
      draft.productVersions.push(version);
      appendHistory(draft, session, {
        productUuid: input.productUuid,
        aggregateType: 'product_version',
        aggregateId: version.id,
        action: 'version_captured',
        actorId: actor.actorId,
        relatedVersionId: version.id,
        changedFields: ['productVersions'],
        afterHash: version.contentHash,
      });
      return { version };
    });
  }

  async function requestApproval(session, input) {
    return mutate(session, input, (draft, actor) => {
      const version = draft.productVersions.find((item) => item.id === input.productVersionId);
      if (!version || version.productUuid !== input.productUuid) {
        const error = new Error('Product Version was not found.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      let policy = draft.approvalPolicies.find((item) =>
        item.policyCode === 'OWNER_BUSINESS_MVP_REVIEW' && item.status === 'active');
      if (!policy) {
        policy = {
          id: crypto.randomUUID(),
          schemaVersion: 1,
          policyCode: 'OWNER_BUSINESS_MVP_REVIEW',
          policyVersion: 1,
          name: 'Business MVP Owner review',
          riskLevel: 'low',
          approvalReasonCodes: ['product_change'],
          requiredApprovals: [{
            role: 'owner',
            minimumApprovals: 1,
            allowSelfApproval: true,
            permittedDecisionCodes: ['approved', 'rejected', 'needs_changes', 'blocked',
              'expired', 'superseded', 'revoked'],
          }],
          evidenceRequirements: [],
          expiresAfterSeconds: 604800,
          status: 'active',
          policyHash: null,
          dataClassification: 'internal',
          createdAt: new Date(now()).toISOString(),
          createdBy: actor.actorId,
        };
        policy.policyHash = computeApprovalPolicyHash(policy);
        draft.approvalPolicies.push(policy);
      }
      const request = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        productUuid: input.productUuid,
        productVersionId: version.id,
        versionContentHash: version.contentHash,
        evidenceReferenceIds: [...version.evidenceReferenceIds],
        evidenceSetHash: version.evidenceSetHash,
        approvalPolicyId: policy.id,
        approvalPolicyHash: policy.policyHash,
        approvalReasonCode: 'product_change',
        riskLevel: 'low',
        requestNonceHash: hashValue(crypto.randomUUID()),
        requestHash: null,
        expiresAt: new Date(now() + policy.expiresAfterSeconds * 1000).toISOString(),
        status: 'requested',
        ...emptyApprovalReferences(),
        dataClassification: 'confidential',
        createdAt: new Date(now()).toISOString(),
        createdBy: actor.actorId,
      };
      request.requestHash = computeApprovalRequestHash(request);
      draft.approvalRequests.push(request);
      appendHistory(draft, session, {
        productUuid: input.productUuid,
        aggregateType: 'approval_request',
        aggregateId: request.id,
        action: 'approval_requested',
        actorId: actor.actorId,
        relatedVersionId: version.id,
        relatedApprovalPolicyId: policy.id,
        relatedApprovalRequestId: request.id,
        changedFields: ['approvalRequests'],
        afterHash: request.requestHash,
      });
      return { request, policy };
    });
  }

  async function approve(session, input) {
    return mutate(session, input, (draft, actor) => {
      const request = draft.approvalRequests.find((item) => item.id === input.approvalRequestId);
      if (!request || request.productUuid !== input.productUuid) {
        const error = new Error('Approval Request was not found.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      const existing = draft.approvalDecisions.filter((item) =>
        item.approvalRequestId === request.id);
      if (existing.some((item) => item.decisionCode === 'approved')) {
        const error = new Error('This Product Version is already approved.');
        error.code = 'CONFLICT';
        throw error;
      }
      const references = emptyApprovalReferences();
      const previous = existing.sort((a, b) => a.sequence - b.sequence).at(-1) || null;
      const decision = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        approvalRequestId: request.id,
        sequence: existing.length + 1,
        decisionCode: 'approved',
        actorId: actor.user.id,
        actorType: 'named_user',
        actorRole: 'owner',
        authorizationSnapshotHash: hashValue({
          actorId: actor.user.id,
          accountType: actor.user.accountType,
          status: actor.user.status,
        }),
        evidenceReferenceIds: [...request.evidenceReferenceIds],
        versionContentHash: request.versionContentHash,
        evidenceSetHash: request.evidenceSetHash,
        approvalPolicyHash: request.approvalPolicyHash,
        decisionNonceHash: hashValue(crypto.randomUUID()),
        previousDecisionHash: previous?.decisionHash || null,
        decisionHash: null,
        signatureReferences: {
          signatureReferenceId: null,
          signatureMethodReferenceId: null,
        },
        ...references,
        dataClassification: 'confidential',
        decidedAt: new Date(now()).toISOString(),
      };
      decision.decisionHash = computeApprovalDecisionHash(decision);
      draft.approvalDecisions.push(decision);
      appendHistory(draft, session, {
        productUuid: input.productUuid,
        aggregateType: 'approval_decision',
        aggregateId: decision.id,
        action: 'approval_decided',
        actorId: actor.actorId,
        relatedVersionId: request.productVersionId,
        relatedApprovalRequestId: request.id,
        relatedApprovalDecisionId: decision.id,
        changedFields: ['approvalDecisions'],
        afterHash: decision.decisionHash,
      });
      return { decision };
    });
  }

  function emptyReleaseReferences() {
    return {
      integrityReferences: {
        integrityCheckReferenceId: null,
        verificationReferenceId: null,
        trustLevelReferenceId: null,
      },
      consumptionEngineReferences: {
        productStudioReferenceIds: [],
        searchIntelligenceReferenceIds: [],
        competitorIntelligenceReferenceIds: [],
        ceoDashboardReferenceIds: [],
        factoryOsReferenceIds: [],
        wholesaleOsReferenceIds: [],
      },
      trustProvenanceReferences: {
        trustProvenanceReferenceId: null,
        releaseCertificationReferenceId: null,
      },
      aiCompatibilityReferences: {
        supportedAIModelReferenceIds: [],
        promptProfileReferenceIds: [],
      },
      customerExperienceReferences: {
        customerJourneyReferenceIds: [],
        supportKnowledgeReferenceIds: [],
      },
      analyticsReferences: { analyticsReferenceIds: [], performanceReferenceIds: [] },
      lifecyclePolicyReferences: {
        lifecyclePolicyReferenceId: null,
        archivalPolicyReferenceId: null,
      },
    };
  }

  async function createRelease(session, input) {
    return mutate(session, input, (draft, actor) => {
      const request = draft.approvalRequests.find((item) => item.id === input.approvalRequestId);
      const version = request &&
        draft.productVersions.find((item) => item.id === request.productVersionId);
      const policy = request &&
        draft.approvalPolicies.find((item) => item.id === request.approvalPolicyId);
      const decisions = request
        ? draft.approvalDecisions.filter((item) =>
          item.approvalRequestId === request.id && item.decisionCode === 'approved')
        : [];
      if (!request || !version || !policy || !decisions.length ||
          request.productUuid !== input.productUuid) {
        const error = new Error('An approved Product Version is required.');
        error.code = 'CONFLICT';
        throw error;
      }
      const release = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        productUuid: input.productUuid,
        releaseNumber: draft.productReleases.filter((item) =>
          item.productUuid === input.productUuid).length + 1,
        productVersionId: version.id,
        productVersionHash: version.contentHash,
        evidenceReferenceIds: [...version.evidenceReferenceIds],
        evidenceSetHash: version.evidenceSetHash,
        approvalRequestId: request.id,
        approvalDecisionIds: decisions.map((item) => item.id),
        approvalSnapshotHash: computeApprovalSnapshotHash(policy, request, decisions),
        channels: ['website', 'ebay', 'etsy', 'internal', 'ai_generation'],
        purposes: ['product_listing', 'seo', 'buying_guide', 'faq'],
        releaseNonceHash: hashValue(crypto.randomUUID()),
        releaseManifestHash: null,
        ...emptyReleaseReferences(),
        dataClassification: 'confidential',
        createdAt: new Date(now()).toISOString(),
        createdBy: actor.actorId,
      };
      release.releaseManifestHash = computeReleaseManifestHash(release);
      draft.productReleases.push(release);
      const lifecycleCodes = ['release_drafted', 'release_approved', 'release_activated'];
      let previousEventHash = null;
      for (let index = 0; index < lifecycleCodes.length; index += 1) {
        const event = {
          id: crypto.randomUUID(),
          schemaVersion: 1,
          productUuid: input.productUuid,
          releaseId: release.id,
          sequence: index + 1,
          eventCode: lifecycleCodes[index],
          reasonCode: 'OWNER_BUSINESS_MVP',
          eventNonceHash: hashValue(crypto.randomUUID()),
          previousEventHash,
          eventHash: null,
          actorId: actor.actorId,
          actorType: 'named_user',
          timestamp: new Date(now()).toISOString(),
          dataClassification: 'internal',
        };
        event.eventHash = computeReleaseLifecycleEventHash(event);
        previousEventHash = event.eventHash;
        draft.releaseLifecycleEvents.push(event);
      }
      appendHistory(draft, session, {
        productUuid: input.productUuid,
        aggregateType: 'product_release',
        aggregateId: release.id,
        action: 'release_activated',
        actorId: actor.actorId,
        relatedVersionId: version.id,
        relatedApprovalRequestId: request.id,
        relatedReleaseId: release.id,
        changedFields: ['productReleases', 'releaseLifecycleEvents'],
        afterHash: release.releaseManifestHash,
      });
      return { release, state: 'active' };
    });
  }

  async function createKnowledgeLock(session, input) {
    return mutate(session, input, (draft, actor) => {
      const release = draft.productReleases.find((item) => item.id === input.releaseId);
      if (!release || release.productUuid !== input.productUuid) {
        const error = new Error('Product Release was not found.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      const lifecycle = draft.releaseLifecycleEvents.filter((item) =>
        item.releaseId === release.id);
      if (deriveReleaseLifecycle(lifecycle) !== 'active') {
        const error = new Error('Only an active Product Release can be locked.');
        error.code = 'CONFLICT';
        throw error;
      }
      if (draft.knowledgeLocks.some((item) => item.releaseId === release.id)) {
        const error = new Error('This Product Release already has a Knowledge Lock.');
        error.code = 'CONFLICT';
        throw error;
      }
      const lock = {
        id: crypto.randomUUID(),
        schemaVersion: 1,
        productUuid: input.productUuid,
        releaseId: release.id,
        productVersionId: release.productVersionId,
        productVersionHash: release.productVersionHash,
        evidenceSetHash: release.evidenceSetHash,
        releaseManifestHash: release.releaseManifestHash,
        approvalSnapshotHash: release.approvalSnapshotHash,
        canonicalizationVersion: 1,
        hashAlgorithm: 'sha256',
        knowledgeLockNonceHash: hashValue(crypto.randomUUID()),
        knowledgeLockHash: null,
        integrityReferences: release.integrityReferences,
        trustProvenanceReferences: release.trustProvenanceReferences,
        lifecyclePolicyReferences: release.lifecyclePolicyReferences,
        dataClassification: 'confidential',
        createdAt: new Date(now()).toISOString(),
        createdBy: actor.actorId,
      };
      lock.knowledgeLockHash = computeKnowledgeLockHash(lock);
      draft.knowledgeLocks.push(lock);
      appendHistory(draft, session, {
        productUuid: input.productUuid,
        aggregateType: 'knowledge_lock',
        aggregateId: lock.id,
        action: 'knowledge_locked',
        actorId: actor.actorId,
        relatedVersionId: release.productVersionId,
        relatedReleaseId: release.id,
        relatedKnowledgeLockId: lock.id,
        changedFields: ['knowledgeLocks'],
        afterHash: lock.knowledgeLockHash,
      });
      return { knowledgeLock: lock };
    });
  }

  function status(productUuid) {
    const current = store.read();
    product(current, productUuid);
    const versions = current.productVersions.filter((item) =>
      item.productUuid === productUuid);
    const latestVersion = versions.at(-1) || null;
    const requests = current.approvalRequests.filter((item) =>
      item.productUuid === productUuid);
    const latestRequest = requests.at(-1) || null;
    const decisions = latestRequest
      ? current.approvalDecisions.filter((item) =>
        item.approvalRequestId === latestRequest.id)
      : [];
    const releases = current.productReleases.filter((item) =>
      item.productUuid === productUuid);
    const latestRelease = releases.at(-1) || null;
    const lifecycle = latestRelease
      ? current.releaseLifecycleEvents.filter((item) => item.releaseId === latestRelease.id)
      : [];
    const lock = latestRelease
      ? current.knowledgeLocks.find((item) => item.releaseId === latestRelease.id) || null
      : null;
    return {
      storeRevision: current.storeRevision,
      latestVersion,
      latestApprovalRequest: latestRequest,
      latestApprovalDecision: decisions.at(-1) || null,
      latestRelease,
      releaseState: latestRelease ? deriveReleaseLifecycle(lifecycle) : 'absent',
      knowledgeLock: lock,
    };
  }

  return {
    approve,
    createKnowledgeLock,
    createRelease,
    createVersion,
    requestApproval,
    status,
  };
}

module.exports = { createProductGovernanceService };
