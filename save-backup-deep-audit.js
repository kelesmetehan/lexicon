const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const league = fs.readFileSync('outputs/league-v2.js', 'utf8');
const marker = '/* Local career slots and portable JSON backups.';
const start = league.indexOf(marker);
assert(start >= 0, 'save block missing');
const runtime = league.slice(start) + '\n' + fs.readFileSync('outputs/save-backup-hardening.js', 'utf8');
const KEYS = {slots:'lexicon_league_save_slots_v1',active:'lexicon_league_active_slot_v1',legacy:'lexicon_league_save_v2',words:'lexicon_words',meta:'lexicon_meta'};
let checks = 0;
function ok(value,message){assert.ok(value,message);checks++;}
function equal(actual,expected,message){assert.strictEqual(actual,expected,message);checks++;}
function deep(actual,expected,message){assert.deepStrictEqual(actual,expected,message);checks++;}
function row(team){return {team,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0};}
function career(team='Ümraniyespor',season=1,week=1){
  const other=team==='Galatasaray'?'Bursaspor':'Galatasaray';
  return {version:2,season,week,playerTeam:team,ap:975,lp:433,teams:{[team]:{name:team,stars:3,cards:{gk:'Refleks',mid:'Çalım',fw:null}},[other]:{name:other,stars:5,cards:{gk:null,mid:null,fw:null}}},leagues:{super:[other],first:[team]},standings:{super:{[other]:row(other)},first:{[team]:row(team)}},schedules:{super:[],first:[]},results:[],usedWords:[],seasonHistory:[],trophies:[],cardPerformance:{},starterPackClaimed:true,seasonEnded:false,createdAt:'2026-01-01T00:00:00.000Z'};
}
function vocabulary(){return [{id:1,en:'proof',tr:'kanıt',example:'Workers need proof.',repetitions:2},{id:2,en:'öğrenmek',tr:'to learn',example:'I want to learn.',repetitions:1}];}
function record(state){return {state,updatedAt:'2026-07-21T10:00:00.000Z'};}
function fullPayload(slots,activeSlot=1,words=vocabulary(),meta={cycle:4,known:2}){return {app:'lexicon-league',type:'full',formatVersion:1,exportedAt:'2026-07-21T10:00:00.000Z',activeSlot,careerSlots:slots,vocabulary:{words,meta}};}
function memoryStorage(seed={}){
  const data=new Map(Object.entries(seed).map(([key,value])=>[key,String(value)]));let failKey=null,writes=0;
  return {data,api:{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>{if(failKey===key){failKey=null;throw new Error('QuotaExceededError');}writes++;data.set(key,String(value));},removeItem:key=>{if(failKey===key){failKey=null;throw new Error('QuotaExceededError');}writes++;data.delete(key);}},failOnce:key=>{failKey=key;},writes:()=>writes,snapshot:()=>Object.fromEntries(data)};
}
function env(seedOrStorage={}){
  const storage=seedOrStorage.api?seedOrStorage:memoryStorage(seedOrStorage),alerts=[],confirms=[],downloads=[],area={innerHTML:'',querySelector:()=>null};let modal='',reloaded=false;
  const context={console:{log(){},warn(){},error(){}},localStorage:storage.api,Date,Intl,Blob,URL,setTimeout,clearTimeout,LL_V2_SAVE_KEY:KEYS.legacy,DB_KEY:KEYS.words,META_KEY:KEYS.meta,lexLeague:{state:null,active:false},alert:message=>alerts.push(String(message)),confirm:()=>confirms.length?confirms.shift():true,llSave(){},llLoad(){},llContinueGame(){},llResetGame(){},llStartCareer(){},renderLexiconLeagueLanding(){},llRenderTeamSelect(){},llRenderDashboard(){},llV2RepairState:state=>state,llSetWide(){},llClearTransient(){},llSetEuropeMatchTheme(){},llArea:()=>area,llRenderStarterShop(){},llRenderSeasonEnd(){},llShowModal:html=>{modal=html;},llCloseModal(){modal='';},llTeamLogo:name=>'<logo>'+name+'</logo>',llEscape:value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),llStars:n=>'*'.repeat(n),llLeagueLabel:key=>key,llNewState:team=>career(team),llAssignStarterCardsToAi(){},llGoMainMenu(){},location:{reload(){reloaded=true;}},document:{body:{appendChild(){}},createElement:()=>({click(){},remove(){}}),getElementById:()=>null}};
  vm.createContext(context);vm.runInContext(runtime,context,{filename:'save-backup-runtime.js'});context.__downloads=downloads;vm.runInContext('llDownloadJson=(name,payload)=>__downloads.push({name,payload:llSlotClone(payload)})',context);
  return {context,storage,alerts,confirms,downloads,get modal(){return modal;},get reloaded(){return reloaded;}};
}
function run(e,code){return vm.runInContext(code,e.context);}
function parseStore(e){return JSON.parse(e.storage.api.getItem(KEYS.slots));}
function validate(e,payload){e.context.__json=JSON.stringify(payload);return run(e,'llValidateBackup(JSON.parse(__json))');}
function rejects(e,payload,pattern){e.context.__json=typeof payload==='string'?payload:JSON.stringify(payload);assert.throws(()=>run(e,'llValidateBackup(JSON.parse(__json))'),pattern);checks++;}
function setCareer(e,state,slot){e.context.__career=JSON.stringify(state);run(e,'llSetActiveSaveSlot('+slot+');lexLeague.state=JSON.parse(__career);llSave();');}

(async()=>{
  // 1-2: one-time legacy migration, no rewrite on every read.
  const legacy=career('Ümraniyespor');
  const e1=env({[KEYS.legacy]:JSON.stringify(legacy),[KEYS.words]:JSON.stringify(vocabulary()),[KEYS.meta]:JSON.stringify({cycle:4})});
  let store=parseStore(e1);equal(store.slots['1'].state.playerTeam,'Ümraniyespor','legacy migrates to slot 1');equal(store.slots['2'],null,'migration leaves slot 2 empty');
  const writesBefore=e1.storage.writes();run(e1,'llEnsureSaveSlots()');equal(e1.storage.writes(),writesBefore,'normal reads do not rewrite storage');
  run(e1,'llEnsureSaveSlots()');equal(parseStore(e1).slots['1'].state.playerTeam,'Ümraniyespor','migration is not duplicated');

  // 3-8: slot isolation, same team allowed, deletion and cancel.
  setCareer(e1,career('Bursaspor',2,7),2);setCareer(e1,career('Ümraniyespor',3,9),3);store=parseStore(e1);
  equal(store.slots['1'].state.season,1,'slot 1 season isolated');equal(store.slots['2'].state.week,7,'slot 2 week isolated');equal(store.slots['3'].state.playerTeam,'Ümraniyespor','same team can exist in another slot');equal(store.activeSlot,3,'active slot follows selected career');
  const wordsBefore=e1.storage.api.getItem(KEYS.words);e1.confirms.push(false);run(e1,'llResetGame(2)');ok(parseStore(e1).slots['2'],'delete cancel preserves career');e1.confirms.push(true);run(e1,'llResetGame(2)');equal(parseStore(e1).slots['2'],null,'confirmed delete clears only target');ok(parseStore(e1).slots['1']&&parseStore(e1).slots['3'],'other slots survive delete');equal(e1.storage.api.getItem(KEYS.words),wordsBefore,'delete never touches vocabulary');

  // 9-12: full/single export content and unsaved live state.
  run(e1,'llSetActiveSaveSlot(3)');e1.context.lexLeague.state=JSON.parse(JSON.stringify(career('Ümraniyespor',4,11)));const backup=run(e1,'llBuildFullBackup()');equal(backup.careerSlots['3'].state.season,4,'full export includes unsaved live active state');equal(backup.vocabulary.words[0].en,'proof','full export contains vocabulary');run(e1,'llExportCareerSlot(1)');equal(e1.downloads.at(-1).payload.type,'career','single export type');ok(!('vocabulary' in e1.downloads.at(-1).payload),'single export excludes vocabulary');run(e1,'llExportFullBackup()');equal(e1.downloads.at(-1).payload.type,'full','full export type');

  // 13-18: single import to empty/full slot, overwrite cancel, vocabulary isolation, repeated import.
  const single={app:'lexicon-league',type:'career',formatVersion:1,career:record(career('Antalyaspor',5,12))};
  e1.context.__input={value:'x',files:[{size:500,text:async()=>JSON.stringify(single)}]};await run(e1,'llHandleBackupFile(__input)');ok(e1.modal.includes('Antalyaspor'),'single import opens slot picker');equal(e1.context.__input.value,'','file input resets');
  const vocabSnapshot=e1.storage.api.getItem(KEYS.words);run(e1,'llApplyCareerImport(2)');equal(parseStore(e1).slots['2'].state.playerTeam,'Antalyaspor','single import fills empty slot');equal(e1.storage.api.getItem(KEYS.words),vocabSnapshot,'single import leaves vocabulary untouched');
  e1.context.__input={value:'x',files:[{size:500,text:async()=>JSON.stringify(single)}]};await run(e1,'llHandleBackupFile(__input)');e1.confirms.push(false);run(e1,'llApplyCareerImport(1)');equal(parseStore(e1).slots['1'].state.playerTeam,'Ümraniyespor','overwrite cancel preserves occupied slot');run(e1,'llCloseModal()');
  e1.context.__input={value:'x',files:[{size:500,text:async()=>JSON.stringify(single)}]};await run(e1,'llHandleBackupFile(__input)');e1.confirms.push(true);run(e1,'llApplyCareerImport(1)');equal(parseStore(e1).slots['1'].state.playerTeam,'Antalyaspor','confirmed overwrite replaces target');

  // 19-23: malformed, wrong app/type, missing fields, future version, numeric/cross consistency.
  rejects(e1,'{}',/geçerli|desteklenen/);rejects(e1,{app:'wrong',type:'full',formatVersion:1},/geçerli|desteklenen/);rejects(e1,{app:'lexicon-league',type:'mystery',formatVersion:1},/tür|alan/);rejects(e1,{...single,formatVersion:2},/geçerli|desteklenen/);
  const missing=JSON.parse(JSON.stringify(single));delete missing.career.state.teams;rejects(e1,missing,/takım listesinde/);const badNumber=JSON.parse(JSON.stringify(single));badNumber.career.state.ap=-1;rejects(e1,badNumber,/AP/);const badMembership=JSON.parse(JSON.stringify(single));badMembership.career.state.leagues.first=['Başka'];rejects(e1,badMembership,/birden fazla|takım verilerinde|hiçbir ligde/);

  // 24-26: security: unsafe keys, HTML escaped, strings never executed.
  rejects(e1,'{"app":"lexicon-league","type":"full","formatVersion":1,"__proto__":{"polluted":true},"careerSlots":{},"vocabulary":{"words":[],"meta":{}}}',/güvenli olmayan/);equal({}.polluted,undefined,'prototype remains clean');
  const evilTeam='<img src=x onerror="globalThis.pwned=1">',evil={app:'lexicon-league',type:'career',formatVersion:1,career:record(career(evilTeam))};e1.context.__input={value:'x',files:[{size:900,text:async()=>JSON.stringify(evil)}]};await run(e1,'llHandleBackupFile(__input)');ok(e1.modal.includes('&lt;img'),'team name is escaped in modal');ok(!e1.modal.includes('<img src=x'),'raw HTML is not inserted');equal(run(e1,'globalThis.pwned'),undefined,'backup strings are never executed');run(e1,'llCloseModal()');

  // 27-30: picker cancel, oversized file, invalid file preservation, concurrent imports.
  const snapshotInvalid=JSON.stringify(e1.storage.snapshot());await run(e1,'llHandleBackupFile({files:[]})');equal(JSON.stringify(e1.storage.snapshot()),snapshotInvalid,'file picker cancel changes nothing');
  e1.context.__input={value:'x',files:[{size:13*1024*1024,text:async()=>JSON.stringify(single)}]};await run(e1,'llHandleBackupFile(__input)');ok(e1.alerts.some(x=>x.includes('12 MB')),'oversized file is rejected');equal(JSON.stringify(e1.storage.snapshot()),snapshotInvalid,'oversized file preserves storage');
  e1.context.__input={value:'x',files:[{size:20,text:async()=>'{bad'}]};await run(e1,'llHandleBackupFile(__input)');equal(JSON.stringify(e1.storage.snapshot()),snapshotInvalid,'invalid JSON preserves existing save');
  let release;const delayed=new Promise(resolve=>release=resolve);e1.context.__slow={value:'x',files:[{size:500,text:()=>delayed}]};const first=run(e1,'llHandleBackupFile(__slow)');e1.context.__second={value:'x',files:[{size:500,text:async()=>JSON.stringify(single)}]};await run(e1,'llHandleBackupFile(__second)');ok(e1.alerts.some(x=>x.includes('Başka bir yedek')),'concurrent import is blocked');release(JSON.stringify(single));await first;run(e1,'llCloseModal()');

  // 31-36: full restore, active slot, round-trip and reload persistence.
  const slots={'1':record(career('Kayserispor',2,6)),'2':record(career('Sivasspor',3,8)),'3':null},payload=fullPayload(slots,2,vocabulary(),{cycle:9,known:12});const e2=env();const validated=validate(e2,payload);e2.context.__validated=validated;e2.confirms.push(true);run(e2,'llApplyFullBackup(__validated)');equal(parseStore(e2).slots['1'].state.playerTeam,'Kayserispor','full restore slot 1');equal(parseStore(e2).slots['2'].state.playerTeam,'Sivasspor','full restore slot 2');equal(parseStore(e2).activeSlot,2,'full restore active slot');equal(JSON.parse(e2.storage.api.getItem(KEYS.meta)).cycle,9,'full restore vocabulary meta');ok(e2.reloaded,'successful full restore requests reload');
  const reloaded=env(e2.storage);equal(run(reloaded,'llLoad(2).playerTeam'),'Sivasspor','career persists after reload');equal(JSON.parse(reloaded.storage.api.getItem(KEYS.words))[1].en,'öğrenmek','Turkish/Unicode survives round trip');const exportedAgain=run(reloaded,'llBuildFullBackup()');equal(exportedAgain.careerSlots['1'].state.season,2,'re-export retains critical career fields');

  // 37-40: atomic rollback on quota/partial write and load remains usable.
  const e3=env({[KEYS.slots]:JSON.stringify({version:1,activeSlot:1,slots:{'1':record(career('Bursaspor')),'2':null,'3':null}}),[KEYS.active]:'1',[KEYS.legacy]:JSON.stringify(career('Bursaspor')),[KEYS.words]:JSON.stringify(vocabulary()),[KEYS.meta]:JSON.stringify({cycle:1})});const beforeAtomic=e3.storage.snapshot(),incoming=validate(e3,payload);e3.context.__validated=incoming;e3.confirms.push(true);e3.storage.failOnce(KEYS.words);run(e3,'llApplyFullBackup(__validated)');deep(e3.storage.snapshot(),beforeAtomic,'full import rolls back every key after partial write');ok(!e3.reloaded,'failed full import does not reload');
  e3.storage.failOnce(KEYS.legacy);const loaded=run(e3,'llLoad(1)');equal(loaded.playerTeam,'Bursaspor','valid career still loads when mirror write fails');
  const beforeStart=e3.storage.snapshot();e3.storage.failOnce(KEYS.slots);e3.context.lexLeague.state=JSON.parse(JSON.stringify(career('Bursaspor')));run(e3,"llSaveSlotPendingCareer=1;llStartCareer('Antalyaspor')");deep(e3.storage.snapshot(),beforeStart,'failed new career creation never deletes old slot');equal(e3.context.lexLeague.state.playerTeam,'Bursaspor','failed new career restores in-memory state');

  // 41-43: corrupt slot store is never silently rewritten; full schema extras rejected.
  const corrupt=memoryStorage({[KEYS.slots]:'{broken',[KEYS.legacy]:JSON.stringify(career('Ümraniyespor'))}),beforeCorrupt=corrupt.snapshot(),e4=env(corrupt);deep(corrupt.snapshot(),beforeCorrupt,'corrupt slot JSON is preserved verbatim');equal(run(e4,'llSave()'),false,'save refuses to overwrite unreadable slot store');deep(corrupt.snapshot(),beforeCorrupt,'refused save leaves corrupt evidence untouched');
  const extra=fullPayload({'1':record(career()),'2':null,'3':null,'4':record(career('Bursaspor'))});rejects(e4,extra,/Desteklenmeyen kariyer yuvası/);

  console.log('save/backup deep audit: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});