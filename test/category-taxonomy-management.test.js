const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createCategoryTaxonomyStore } = require('../category-taxonomy-store');
const { createCategoryTaxonomyService } = require('../category-taxonomy-service');

function fixture(accountType = 'owner') {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-taxonomy-'));
  const user = { id: accountType === 'owner' ? 'owner-1' : 'editor-1', accountType, status: 'active' };
  const website = { products: [
    { id:'dean',title:'Dean Brown Leather Biker Jacket',slug:'dean-brown-jacket',sku:'MG-MJ01',category:'Leather Jackets',collections:['Men','Biker Jackets'],productType:'Motorcycle Jacket',brand:'MOTOGRIP GEAR',tags:['Brown'],price:299,stock:{M:100,L:100},image:'/dean.jpg',status:'active' },
    { id:'vest',title:'Brown Western Vest',slug:'brown-western-vest',sku:'MG-VST-0001',category:'Leather Vests',collections:['Men','Western Vests'],productType:'Leather Vest',brand:'MOTOGRIP GEAR',tags:['Western'],price:199,stock:{M:5},image:'/vest.jpg',status:'active' },
  ]};
  const events = [];
  const store = createCategoryTaxonomyStore({ dataDir, now: () => Date.parse('2026-07-27T10:00:00Z') });
  const service = createCategoryTaxonomyService({
    store, identity:{findById:()=>user}, readWebsiteCatalog:()=>website,
    readEditorProducts:()=>({products:[]}), announce:(event)=>events.push(event),
    now:()=>Date.parse('2026-07-27T10:00:00Z'),
  });
  return { dataDir, store, service, events, session:{actorType:'named_user',userId:user.id} };
}

test('website taxonomy import is stable, deduplicated, assigned, and restart-safe', async () => {
  const f=fixture(); let workspace=await f.service.sync(f.session);
  assert.equal(workspace.categories.length,5);
  assert.equal(workspace.categories.find((item)=>item.name==='Men').productCount,2);
  const ids=workspace.categories.map((item)=>item.id);
  workspace=await f.service.sync(f.session);
  assert.deepEqual(workspace.categories.map((item)=>item.id),ids);
  assert.equal(f.store.read().assignments.length,6);
  const reopened=createCategoryTaxonomyStore({dataDir:f.dataDir});
  assert.deepEqual(reopened.read().categories.map((item)=>item.id),ids);
});

test('root, subcategory, nested category and safe parent moves preserve stable IDs', async () => {
  const f=fixture(); const root=(await f.service.create(f.session,{name:'Men',slug:'men'})).category;
  const child=(await f.service.create(f.session,{name:'Leather Jackets',slug:'men-leather-jackets',parentId:root.id})).category;
  const nested=(await f.service.create(f.session,{name:'Cafe Racer Jackets',slug:'cafe-racer-jackets',parentId:child.id})).category;
  assert.equal(nested.hierarchyPath,'Men > Leather Jackets > Cafe Racer Jackets');
  const accessories=(await f.service.create(f.session,{name:'Accessories',slug:'accessories'})).category;
  const moved=(await f.service.update(f.session,nested.id,{parentId:accessories.id})).category;
  assert.equal(moved.id,nested.id); assert.equal(moved.hierarchyPath,'Accessories > Cafe Racer Jackets');
});

test('duplicate slugs, circular relationships and deeper than three levels are rejected', async () => {
  const f=fixture(); const root=(await f.service.create(f.session,{name:'Men',slug:'men'})).category;
  const child=(await f.service.create(f.session,{name:'Jackets',slug:'jackets',parentId:root.id})).category;
  const nested=(await f.service.create(f.session,{name:'Biker',slug:'biker',parentId:child.id})).category;
  await assert.rejects(f.service.create(f.session,{name:'Other',slug:'men'}),/handle already exists/i);
  await assert.rejects(f.service.update(f.session,root.id,{parentId:nested.id}),/Circular/i);
  await assert.rejects(f.service.create(f.session,{name:'Deep',slug:'deep',parentId:nested.id}),/maximum of three/i);
});

test('assignments are many-to-many, audited, deduplicated, and revision checked', async () => {
  const f=fixture(); const category=(await f.service.create(f.session,{name:'Featured',slug:'featured'})).category;
  let workspace=await f.service.assign(f.session,category.id,{add:['dean','vest']});
  assert.equal(workspace.categories.find((item)=>item.id===category.id).productCount,2);
  workspace=await f.service.assign(f.session,category.id,{add:['dean'],remove:['vest']});
  assert.equal(workspace.categories.find((item)=>item.id===category.id).productCount,1);
  const activity=f.service.activity(f.session,category.id);
  assert.equal(activity.events.filter((item)=>item.action==='category_assignments_updated').length,2);
  await assert.rejects(f.service.update(f.session,category.id,{name:'Stale',expectedRevision:0}),/changed/i);
});

test('Listing Editor drafts but cannot approve, publish, or delete', async () => {
  const f=fixture('listing_editor'); const category=(await f.service.create(f.session,{name:'Vests',slug:'vests'})).category;
  await f.service.update(f.session,category.id,{submit:true});
  await assert.rejects(f.service.workflow(f.session,category.id,'approve'),/Named Owner/);
  await assert.rejects(f.service.workflow(f.session,category.id,'publish'),/Named Owner/);
  await assert.rejects(f.service.workflow(f.session,category.id,'delete',{confirmation:'DELETE'}),/Named Owner/);
});

test('Owner approval and publish expose only factual live category projection', async () => {
  const f=fixture(); const category=(await f.service.create(f.session,{name:'Western Vests',slug:'western-vests',description:'Published factual description',seoTitle:'Western Leather Vests',metaDescription:'Factual vest collection.'})).category;
  await f.service.assign(f.session,category.id,{add:['vest']});
  await f.service.update(f.session,category.id,{submit:true});
  await f.service.workflow(f.session,category.id,'approve');
  await f.service.workflow(f.session,category.id,'publish');
  const publicCategory=f.service.publicCategory('western-vests');
  assert.equal(publicCategory.description,'Published factual description');
  assert.deepEqual(publicCategory.products.map((item)=>item.id),['vest']);
});

test('unsafe deletion is blocked while disposable empty drafts require explicit confirmation', async () => {
  const f=fixture(); const parent=(await f.service.create(f.session,{name:'Parent',slug:'parent'})).category;
  await f.service.create(f.session,{name:'Child',slug:'child',parentId:parent.id});
  await assert.rejects(f.service.workflow(f.session,parent.id,'delete',{confirmation:'DELETE'}),/dependencies/i);
  const disposable=(await f.service.create(f.session,{name:'Disposable',slug:'disposable'})).category;
  await assert.rejects(f.service.workflow(f.session,disposable.id,'delete',{}),/Type DELETE/i);
  const result=await f.service.workflow(f.session,disposable.id,'delete',{confirmation:'DELETE'});
  assert.equal(result.result.deleted,true);
});

test('rule preview is non-mutating and category UI exposes management controls', () => {
  const f=fixture(); const preview=f.service.previewRules(f.session,{mode:'all',rules:[{field:'productType',value:'Leather Vest'},{field:'tag',value:'Western'}]});
  assert.deepEqual(preview.add,['vest']); assert.equal(f.store.read().assignments.length,0);
  const admin=fs.readFileSync(path.join(__dirname,'..','admin.js'),'utf8');
  for (const phrase of ['Categories & Collections','Add category','Bulk edit','Sync website','Category Editor','Manual product assignments','Owner approve','Publish website']) assert.match(admin,new RegExp(phrase,'i'));
  assert.match(fs.readFileSync(path.join(__dirname,'..','product-editor-v2-ui.js'),'utf8'),/Select synced category/);
});
