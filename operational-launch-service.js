const crypto = require('crypto');

const WORKFLOW_STATES = new Set([
  'Draft', 'In Progress', 'Submitted for Review', 'Changes Requested',
  'Approved', 'Publishing', 'Live', 'Syncing', 'Conflict', 'Failed',
]);

function createOperationalLaunchService(options = {}) {
  const {
    store, identity, listingStore, listingService, productIdentityService,
    catalogService, catalogLinkService, websiteAdapter,
  } = options;
  const now = options.now || (() => Date.now());
  const subscribers = new Set();

  function user(session, allowed = ['owner', 'listing_editor']) {
    const record = session?.actorType === 'named_user' ? identity.findById(session.userId) : null;
    if (!record || record.status !== 'active' || !allowed.includes(record.accountType)) {
      throw Object.assign(new Error('Authorized named-user access is required.'), {
        code: 'FORBIDDEN',
      });
    }
    return record;
  }

  function actorRecord(session, actorType = null) {
    if (actorType === 'codex') return { id: 'codex', type: 'codex', role: 'codex' };
    if (actorType === 'system') return { id: 'system', type: 'system', role: 'system' };
    const record = user(session);
    return {
      id: record.id,
      type: record.accountType === 'owner' ? 'named_owner' : 'listing_editor',
      role: record.accountType,
    };
  }

  function appendAudit(state, details) {
    state.auditEvents.push({
      id: crypto.randomUUID(),
      actorId: details.actor.id,
      actorType: details.actor.type,
      actorRole: details.actor.role,
      productUuid: details.productUuid,
      catalogId: details.catalogId || null,
      websiteProductId: details.websiteProductId || null,
      action: details.action,
      changedFields: [...new Set(details.changedFields || [])].slice(0, 80),
      previousRevision: details.previousRevision ?? null,
      newRevision: details.newRevision ?? null,
      timestamp: new Date(now()).toISOString(),
      result: details.result || 'success',
      errorCode: details.errorCode || null,
    });
  }

  function notify(event) {
    const safe = JSON.stringify({
      type: event.type,
      productUuid: event.productUuid || null,
      revision: event.revision ?? null,
      at: new Date(now()).toISOString(),
    });
    for (const response of subscribers) response.write(`data: ${safe}\n\n`);
  }

  function currentWorkflow(state, productUuid) {
    return [...state.workflows]
      .filter((item) => item.productUuid === productUuid)
      .sort((a, b) => b.workflowRevision - a.workflowRevision)[0] || null;
  }

  function workflow(session, productUuid) {
    user(session);
    const state = store.read();
    const latest = currentWorkflow(state, productUuid);
    const catalogProduct = catalogLinkService.catalog().products.find((item) =>
      item.productUuid === productUuid && item.linkStatus === 'Linked');
    const sourceHandle = catalogProduct?.productUrl?.split('/').filter(Boolean).at(-1);
    const website = catalogProduct
      ? websiteAdapter.inspect(catalogProduct.source.sourceId, sourceHandle)
      : { product: null, revision: null };
    return {
      storeRevision: state.storeRevision,
      workflow: latest,
      websiteRevision: website.revision,
      publicationHistory: state.publications.filter((item) => item.productUuid === productUuid),
      activity: state.auditEvents.filter((item) => item.productUuid === productUuid).slice(-100).reverse(),
    };
  }

  async function transition(session, input, action, note = '') {
    const actor = user(session);
    const ownerOnly = new Set(['approve', 'request_changes']);
    if (ownerOnly.has(action) && actor.accountType !== 'owner') {
      throw Object.assign(new Error('Named Owner access is required.'), { code: 'FORBIDDEN' });
    }
    const targetStates = {
      start: 'In Progress',
      submit: 'Submitted for Review',
      request_changes: 'Changes Requested',
      approve: 'Approved',
    };
    const target = targetStates[action];
    if (!target || !WORKFLOW_STATES.has(target)) {
      throw Object.assign(new Error('Unsupported workflow transition.'), { code: 'VALIDATION' });
    }
    const result = await store.mutate((state) => {
      const prior = currentWorkflow(state, input.productUuid);
      const allowed = {
        start: [null, 'Draft', 'Changes Requested', 'In Progress'],
        submit: [null, 'Draft', 'In Progress', 'Changes Requested'],
        request_changes: ['Submitted for Review'],
        approve: ['Submitted for Review'],
      };
      if (!allowed[action].includes(prior?.status || null)) {
        throw Object.assign(new Error('Workflow transition is not allowed from the current state.'), {
          code: 'WORKFLOW_CONFLICT',
        });
      }
      const record = {
        id: crypto.randomUUID(),
        productUuid: input.productUuid,
        catalogId: input.catalogId || prior?.catalogId || null,
        draftId: input.draftId || prior?.draftId || null,
        status: target,
        workflowRevision: Number(prior?.workflowRevision || 0) + 1,
        note: String(note || '').trim().slice(0, 1000),
        createdAt: new Date(now()).toISOString(),
        createdBy: `user:${actor.id}`,
        previousWorkflowId: prior?.id || null,
      };
      state.workflows.push(record);
      appendAudit(state, {
        actor: actorRecord(session),
        productUuid: input.productUuid,
        catalogId: record.catalogId,
        action: `listing_${action}`,
        changedFields: ['status', ...(record.note ? ['reviewNote'] : [])],
        previousRevision: prior?.workflowRevision || 0,
        newRevision: record.workflowRevision,
      });
      return { store: state, value: record };
    }, input.expectedRevision);
    notify({ type: 'workflow.updated', productUuid: input.productUuid, revision: result.value.workflowRevision });
    return workflow(session, input.productUuid);
  }

  function publishFields(draft, workspace, catalogProduct) {
    const website = draft.content.website || draft.content.shopify;
    const values = workspace.inputDraft.values;
    const stock = Object.fromEntries((catalogProduct?.variants || []).map((variant) => [
      variant.value, Number(variant.quantity || 0),
    ]));
    return {
      title: website.title,
      shortDescription: website.shortDescription,
      description: website.fullDescription || website.description,
      features: website.features,
      specifications: website.specifications,
      perfectFor: website.perfectFor,
      whyYouWillLoveIt: website.whyYouWillLoveIt,
      faq: website.faq,
      buyingGuide: website.buyingGuide,
      seoTitle: website.seoTitle,
      metaDescription: website.metaDescription,
      tags: website.tags,
      brand: values.brand,
      productType: values.productType,
      slug: website.urlHandle,
      price: Number(values.price),
      compareAtPrice: catalogProduct?.compareAtPrice || null,
      status: catalogProduct?.productStatus || 'active',
      stock,
      inventory: Object.values(stock).reduce((sum, quantity) => sum + quantity, 0),
    };
  }

  async function publish(session, input, context = {}) {
    const actor = input.actorType === 'codex'
      ? actorRecord(null, 'codex')
      : actorRecord(session);
    if (actor.type !== 'named_owner' && actor.type !== 'codex') {
      throw Object.assign(new Error('Only the Named Owner may publish.'), { code: 'FORBIDDEN' });
    }
    if (input.actorType === 'codex' && context.codexAuthorized !== true) {
      throw Object.assign(new Error('Codex service authorization is required.'), { code: 'FORBIDDEN' });
    }
    const current = store.read();
    if (Number(input.expectedOperationalRevision) !== current.storeRevision) {
      throw Object.assign(new Error('Operational record changed. Refresh and try again.'), {
        code: 'REVISION_CONFLICT',
        currentRevision: current.storeRevision,
      });
    }
    const priorIdempotency = current.idempotencyKeys.find((item) => item.key === input.idempotencyKey);
    if (priorIdempotency) return workflow(session, input.productUuid);
    const workflowRecord = currentWorkflow(current, input.productUuid);
    if (!workflowRecord ||
        !['Approved', 'Failed'].includes(workflowRecord.status) ||
        (workflowRecord.status === 'Failed' && !workflowRecord.publishRetryEligible) ||
        workflowRecord.draftId !== input.draftId) {
      throw Object.assign(new Error('The current listing draft requires Owner approval.'), {
        code: 'APPROVAL_REQUIRED',
      });
    }
    const identityRecord = productIdentityService.view(input.productUuid).identity;
    if (!identityRecord || identityRecord.state !== 'locked') {
      throw Object.assign(new Error('A locked Product Identity is required.'), {
        code: 'IDENTITY_NOT_LOCKED',
      });
    }
    if (!input.idempotencyKey || !input.expectedWebsiteRevision) {
      throw Object.assign(new Error('Idempotency key and current website revision are required.'), {
        code: 'VALIDATION',
      });
    }
    const workspace = listingService.workspace(session, input.productUuid);
    const draft = listingStore.read().drafts.find((item) =>
      item.id === input.draftId && item.productUuid === input.productUuid);
    if (!draft) throw Object.assign(new Error('Listing draft was not found.'), { code: 'VALIDATION' });
    if (draft.warnings.some((item) => item.severity === 'critical' && item.missing)) {
      throw Object.assign(new Error('Complete critical product information before publishing.'), {
        code: 'MISSING_CRITICAL',
      });
    }
    const catalogProduct = catalogLinkService.catalog().products.find((item) =>
      item.productUuid === input.productUuid && item.linkStatus === 'Linked');
    if (!catalogProduct) {
      throw Object.assign(new Error('A linked Catalog identity is required.'), {
        code: 'CATALOG_LINK_REQUIRED',
      });
    }
    let publication;
    try {
      publication = await websiteAdapter.publish({
        websiteProductId: catalogProduct.source.sourceId,
        currentHandle: catalogProduct.productUrl?.split('/').filter(Boolean).at(-1),
        expectedWebsiteRevision: input.expectedWebsiteRevision,
        fields: publishFields(draft, workspace, catalogProduct),
      });
    } catch (error) {
      await store.mutate((state) => {
        const prior = currentWorkflow(state, input.productUuid);
        const failed = {
          ...prior,
          id: crypto.randomUUID(),
          status: 'Failed',
          workflowRevision: prior.workflowRevision + 1,
          previousWorkflowId: prior.id,
          publishRetryEligible: true,
          errorCode: String(error.code || 'PUBLISH_FAILED').slice(0, 80),
          createdAt: new Date(now()).toISOString(),
          createdBy: actor.type === 'codex' ? 'codex' : `user:${actor.id}`,
        };
        state.workflows.push(failed);
        appendAudit(state, {
          actor,
          productUuid: input.productUuid,
          catalogId: catalogProduct.catalogProductId,
          websiteProductId: catalogProduct.source.sourceId,
          action: 'website_publish',
          changedFields: [],
          previousRevision: input.expectedWebsiteRevision,
          result: 'failed',
          errorCode: failed.errorCode,
        });
        return { store: state, value: failed };
      }, input.expectedOperationalRevision);
      notify({ type: 'workflow.updated', productUuid: input.productUuid });
      throw error;
    }
    await store.mutate((state) => {
      const prior = currentWorkflow(state, input.productUuid);
      const nextWorkflow = {
        ...prior,
        id: crypto.randomUUID(),
        status: 'Live',
        workflowRevision: prior.workflowRevision + 1,
        previousWorkflowId: prior.id,
        createdAt: new Date(now()).toISOString(),
        createdBy: actor.type === 'codex' ? 'codex' : `user:${actor.id}`,
      };
      state.workflows.push(nextWorkflow);
      state.publications.push({
        id: crypto.randomUUID(),
        productUuid: input.productUuid,
        catalogId: catalogProduct.catalogProductId,
        websiteProductId: publication.product.id,
        draftId: input.draftId,
        status: 'Live',
        previousRevision: publication.previousRevision,
        newRevision: publication.newRevision,
        publishedAt: new Date(now()).toISOString(),
        publishedBy: actor.type === 'codex' ? 'codex' : `user:${actor.id}`,
      });
      state.idempotencyKeys.push({
        key: String(input.idempotencyKey || crypto.randomUUID()).slice(0, 200),
        productUuid: input.productUuid,
        createdAt: new Date(now()).toISOString(),
      });
      appendAudit(state, {
        actor,
        productUuid: input.productUuid,
        catalogId: catalogProduct.catalogProductId,
        websiteProductId: publication.product.id,
        action: 'website_publish',
        changedFields: Object.keys(publishFields(draft, workspace, catalogProduct)),
        previousRevision: publication.previousRevision,
        newRevision: publication.newRevision,
      });
      return { store: state, value: nextWorkflow };
    }, input.expectedOperationalRevision);
    notify({ type: 'website.published', productUuid: input.productUuid, revision: publication.newRevision });
    return workflow(session, input.productUuid);
  }

  function subscribe(response) {
    subscribers.add(response);
    response.on('close', () => subscribers.delete(response));
  }

  return {
    announce: notify,
    approve: (session, input) => transition(session, input, 'approve'),
    requestChanges: (session, input) => transition(session, input, 'request_changes', input.note),
    start: (session, input) => transition(session, input, 'start'),
    submit: (session, input) => transition(session, input, 'submit'),
    publish,
    subscribe,
    workflow,
  };
}

module.exports = { WORKFLOW_STATES, createOperationalLaunchService };
