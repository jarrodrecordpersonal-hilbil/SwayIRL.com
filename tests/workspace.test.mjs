import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
const root=process.cwd();
const temp=await fs.mkdtemp(path.join(root,'.sites-runtime/api-tests-'));
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
try{
const runtime=`import { DatabaseSync } from 'node:sqlite';
export const sqlite=new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
class Statement { constructor(sql,args=[]){this.sql=sql;this.args=args;}bind(...args){return new Statement(this.sql,args)}async first(){return sqlite.prepare(this.sql).get(...this.args)||null}async all(){return {results:sqlite.prepare(this.sql).all(...this.args)}}async run(){const r=sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}}}}
export const env={SWAY_ADMIN_EMAILS:'owner@example.test',DB:{prepare:(sql)=>new Statement(sql),batch:async(stmts)=>{sqlite.exec('BEGIN');try{const results=[];for(const s of stmts){if(/^SELECT/i.test(s.sql.trim()))results.push(await s.all());else results.push(await s.run());}sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}}};
export let identity=null;export function signIn(id,email=id+'@example.test'){identity={userId:id,email,displayName:id,fullName:id}}export function signOut(){identity=null}export async function getChatGPTUser(){return identity}`;
await fs.writeFile(path.join(temp,'runtime.mjs'),runtime);
for(const [input,output,replacements] of [
 ['lib/onboarding.ts','onboarding.mjs',[]],
 ['lib/application-validation.ts','application-validation.mjs',[[/from ".\/onboarding"/g,'from "./onboarding.mjs"']]],
 ['lib/server.ts','server.mjs',[[/from "cloudflare:workers"/g,'from "./runtime.mjs"']]],
 ['app/api/workspace/route.ts','route.mjs',[[/from "@\/app\/chatgpt-auth"/g,'from "./runtime.mjs"'],[/from "@\/lib\/server"/g,'from "./server.mjs"'],[/from "@\/lib\/application-validation"/g,'from "./application-validation.mjs"'],[/from "@\/lib\/onboarding"/g,'from "./onboarding.mjs"']]]
]){let text=await fs.readFile(path.join(root,input),'utf8');for(const [a,b] of replacements)text=text.replace(a,b);await fs.writeFile(path.join(temp,output),ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText)}
const runtimeModule=await import(path.join(temp,'runtime.mjs'));
const {sqlite,signIn,signOut}=runtimeModule;
const {GET,POST}=await import(path.join(temp,'route.mjs'));
for(const name of (await fs.readdir(path.join(root,'drizzle'))).filter(n=>n.endsWith('.sql')).sort())sqlite.exec(await fs.readFile(path.join(root,'drizzle',name),'utf8'));
async function post(action,data,id,extra={},origin='https://sway.test'){const r=await POST(new Request('https://sway.test/api/workspace',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({action,data,id,...extra})}));return {status:r.status,body:await r.json()}}
async function get(){const r=await GET();return {status:r.status,body:await r.json()}}
const applications={
brand:{products:'Small batch bourbon',distribution:'Nashville independent bottle shops',storeCount:'10 ($1,200/month)',goal:'Brand awareness',creative:'I need a creator match'},
retailer:{address:'1 Test Lane, Austin TX 78701',locations:'1',placement:'Shelf / endcap',connection:'Wi-Fi available',pos:'Test POS'},
distributor:{territory:'Tennessee',portfolio:'Bourbon and agave',retailReach:'26–100',introduction:'Both brands and stores'},
influencer:{categories:'Cocktail education',audience:'Adults interested in spirits, Nashville',availability:'Ready for a campaign',sample:'https://example.test/sample'},
};
async function profile(id,role='brand'){signIn(id);const r=await post('profile.save',{name:id,company:id+' Company',role,markets:'TN',website:role==='influencer'?'https://example.test/creator':'',notes:'',application:applications[role]});check(r.status===200,'profile creates successfully: '+id);}
check((await get()).status===401,'anonymous read denied');
check((await post('store.save',{})).status===401,'anonymous mutation denied');
signIn('incomplete');
check((await post('profile.save',{name:'New',company:'New Brand',role:'brand',application:{}})).status===400,'incomplete role application rejected');
check(!sqlite.prepare("SELECT id FROM partners WHERE id='incomplete'").get(),'invalid application creates no partial profile');
await profile('brand-a');
check((await get()).body.applicationStage==='New','new application has review status');
check(JSON.parse((await get()).body.profile.application).products==='Small batch bourbon','role application persists');
check((await post('profile.save',{name:'A',company:'A',role:'retailer'})).status===400,'role change requires new role details');
check((await post('profile.save',{name:'A',company:'A',role:'brand',application:{...applications.brand,storeCount:'unsupported'}})).status===400,'unrecognized option rejected');
check((await post('profile.save',{name:'A',company:'A',role:'brand',application:{...applications.brand,approval:'Won'}})).status===400,'application cannot carry an approval claim');

check((await post('profile.save',{name:'Admin',company:'x',role:'admin'})).status===400,'admin role cannot be self-selected');
check((await post('profile.save',{name:'X',company:'x',role:'brand',website:'javascript:alert(1)'})).status===400,'unsafe website URLs rejected');
check((await post('store.save',{})).status===403,'partner cannot manage stores');
check((await post('lead.save',{})).status===403,'partner cannot manage sales pipeline');
check((await post('profile.save',{name:'brand-a',company:'changed',role:'brand'},undefined,{},'https://evil.test')).status===403,'cross-origin mutation denied');
check((await post('profile.save',{name:'brand-a',company:'A Company',role:'brand'})).status===200,'profile updates');
check(sqlite.prepare("SELECT COUNT(*) AS n FROM leads WHERE id='signup_brand-a'").get().n===1,'signup lead is not duplicated');
await profile('brand-b');await profile('retailer','retailer');await profile('distributor','distributor');await profile('creator','influencer');
signIn('owner','owner@example.test');
const store={name:'QA Store',city:'Nashville',state:'TN',type:'Bottle shop',capacity:1,monthly_cents:10000,annual_cents:100000,status:'draft',description:'Test only',partner_id:'retailer'};
check((await post('store.save',store)).status===200,'admin creates store');
let state=(await get()).body;const sid=state.stores[0].id;
check(state.isAdmin&&state.partners.length===5,'admin sees partners');
check(JSON.parse(state.partners.find(p=>p.id==='creator').application).categories==='Cocktail education','admin can review creator application');
check((await post('lead.save',{name:'brand-a',email:'brand-a@example.test',company:'A Company',role:'brand',stage:'Qualified',notes:'Private review',next_step:'Discuss launch'},'signup_brand-a')).status===200,'admin advances application');
signIn('brand-a');
check((await post('profile.save',{name:'brand-a',company:'A Company',role:'brand',application:applications.brand})).status===200,'partner updates application after review');
state=(await get()).body;
check(state.applicationStage==='Qualified','editing application preserves review stage');
check(sqlite.prepare("SELECT notes FROM leads WHERE id='signup_brand-a'").get().notes==='Private review','editing application preserves staff notes');
check(!JSON.stringify(state).includes('Private review'),'partner cannot read internal review notes');
check(state.stores.length===0&&state.partners.length===0&&state.leads.length===0,'partner cannot read draft stores or private admin records');
check((await post('request.create',{store_id:sid,campaign:'Campaign A',billing:'monthly'})).status===409,'draft store cannot receive requests');
signIn('owner','owner@example.test');check((await post('store.save',{...store,status:'published'},sid)).status===200,'store publishes');
signIn('brand-a');const a=await post('request.create',{store_id:sid,campaign:'Campaign A',billing:'monthly'});check(a.status===200,'partner requests published store');
check((await post('request.create',{store_id:sid,campaign:'Duplicate A',billing:'monthly'})).status===409,'duplicate active request denied');
signIn('brand-b');check((await post('request.create',{store_id:sid,campaign:'Campaign B',billing:'annual'})).status===400,'unapproved annual pricing is not offered');const b=await post('request.create',{store_id:sid,campaign:'Campaign B',billing:'monthly'});check(b.status===200,'second pending request accepted without claiming inventory');
check((await post('request.cancel',undefined,a.body.id)).status===409,'other partner cannot cancel request');
state=(await get()).body;check(state.requests.length===1&&state.requests[0].campaign==='Campaign B','partner reads only their requests');
check((await post('request.review',undefined,b.body.id,{status:'confirmed'})).status===403,'partner cannot confirm own request');
signIn('owner','owner@example.test');
const results=await Promise.all([post('request.review',undefined,a.body.id,{status:'confirmed'}),post('request.review',undefined,b.body.id,{status:'confirmed'})]);
check(results.filter(r=>r.status===200).length===1&&results.filter(r=>r.status===409).length===1,'concurrent confirmations cannot overbook final spot');
state=(await get()).body;check(state.stores[0].used===1&&state.stores[0].open===0,'capacity reflects confirmed position');
check((await post('store.save',{...store,status:'published',monthly_cents:15000},sid)).status===200,'store pricing can be changed');
const winner=state.requests.find(r=>r.status==='confirmed');check(winner.rate_cents===(winner.billing==='monthly'?10000:100000),'existing request retains quoted rate');
check((await post('request.review',undefined,winner.id,{status:'confirmed'})).status===409,'already confirmed request cannot be confirmed again');
signIn(winner.partner_id);check((await post('request.cancel',undefined,winner.id)).status===409,'partner cannot release confirmed placement');
signIn('owner','owner@example.test');check((await post('request.review',undefined,winner.id,{status:'cancelled'})).status===200,'admin releases confirmed position');
state=(await get()).body;check(state.stores[0].open===1,'released position returns to inventory');
check((await post('lead.save',{name:'Contact',email:'contact@example.test',company:'New company',role:'brand',stage:'Proposal',follow_up:'2026-10-01',next_step:'Send proposal',owner:'Team',value_cents:120000,notes:'Private note'})).status===200,'sales opportunity saves');
state=(await get()).body;check(state.leads.some(l=>l.stage==='Proposal'&&l.next_step==='Send proposal'&&l.follow_up==='2026-10-01'),'pipeline follow-up persists');
signIn('retailer');check((await post('store.propose',{name:'My store',city:'Austin',state:'TX',type:'Bottle shop',status:'published',capacity:999})).status===200,'retailer submits a store');
state=(await get()).body;const own=state.ownStores.find(s=>s.name==='My store');check(own&&own.status==='draft'&&own.capacity===30&&own.monthly_cents===12000,'retailer cannot self-publish or override capacity');
signIn('brand-a');check((await post('store.propose',{name:'Bad'})).status===403,'non-retailer store submission denied');
signIn('distributor');check((await post('referral.create',{name:'Expected contact',email:'refer@example.test',company:'Referral company',role:'brand',stage:'Won',notes:'Introduction context'})).status===200,'distributor submits referral');
state=(await get()).body;check(state.referrals.length===1&&state.referrals[0].stage==='New'&&!('notes' in state.referrals[0]),'referral starts New and does not expose internal notes');
signIn('brand-b');check((await get()).body.referrals.length===0,'unrelated account cannot see referrals');
check((await post('request.create',{store_id:sid,campaign:'',billing:'monthly'})).status===400,'blank campaign rejected');
console.log(`PASS: ${checks} checks covering identity, ownership, capacity, pricing, onboarding, retailer proposals, distributor referrals, and sales follow-ups.`);
}finally{await fs.rm(temp,{recursive:true,force:true})}
