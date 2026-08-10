const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.resolve(__dirname,'..','outputs','diagnostics.js'),'utf8');
const quizSource=fs.readFileSync(path.resolve(__dirname,'..','outputs','lexicon-fixed.html'),'utf8');
for(const expected of [
  "llDiagnosticQuizIgnored(diagId,'no_quiz'",
  "llDiagnosticQuizIgnored(diagId,'not_revealed'",
  "llDiagnosticQuizIgnored(diagId,'answer_busy'",
  "llDiagnosticQuizIgnored(diagId,'missing_question_ref'",
  'llDiagnosticQuizBusy(diagId,true,q)',
  'llDiagnosticQuizBusy(diagId,false,q)',
  "llDiagnosticSaveEvent(diagId,'start'",
  "llDiagnosticSaveEvent(diagId,'completed'",
  'llDiagnosticRenderStarted(diagId,\'llRenderLeagueQuiz\')',
  'llDiagnosticRenderEnded(diagId,\'llRenderLeagueQuiz\')',
  'onclick="llCommitCurrentMatch()"'
])assert(quizSource.includes(expected),`quiz action trail must include ${expected}`);
function makeStorage(seed={}){
  const values=new Map(Object.entries(seed));
  return {get length(){return values.size;},key(index){return [...values.keys()][index]||null;},getItem(key){return values.has(key)?values.get(key):null;},setItem(key,value){values.set(key,String(value));},removeItem(key){values.delete(key);},dump(){return Object.fromEntries(values);}};
}
function makeSandbox(storage,withDocument=false){
  const timers=[];
  const sandbox={console,Date,Math,JSON,Map,Set,WeakMap,Error,TextEncoder,encodeURIComponent,unescape,Blob:class {constructor(parts){this.size=String(parts?.join('')||'').length;}},localStorage:storage,loadUserWords:()=>[{id:'a'},{id:'b'},{id:'c'}],llShuffle:items=>[...items],llSave:()=>{},matchCommitCalls:0,llCommitCurrentMatch(){this.matchCommitCalls++;return 'committed';},setTimeout(fn,ms){timers.push({fn,ms,cancelled:false});return timers.length-1;},clearTimeout(id){if(timers[id])timers[id].cancelled=true;},__runTimers(ms=Infinity){timers.filter(timer=>!timer.cancelled&&timer.ms<=ms).forEach(timer=>{timer.cancelled=true;timer.fn();});}};
  if(withDocument){
    const listeners={};
    sandbox.document={readyState:'complete',scripts:[],body:{},addEventListener(type,handler){(listeners[type]||=[]).push(handler);},getElementById(){return null;}};
    sandbox.__dispatch=(type,target)=>{for(const listener of listeners[type]||[])listener({target,pointerType:'mouse'});};
  }
  vm.createContext(sandbox);
  vm.runInContext("let lexLeague={state:{season:3,week:9,playerTeam:'Test FC',ap:100,lp:200,usedWords:[],recentQuizWords:[]},quiz:{index:0,correct:0,revealed:true,answerBusy:false,committed:false,queue:[{id:'a'}]}};",sandbox);
  vm.runInContext(source,sandbox);
  return sandbox;
}
function events(sandbox){return sandbox.llDiagnosticTestHooks.events();}
function types(sandbox){return events(sandbox).map(event=>event.type);}

const storage=makeStorage();
const sandbox=makeSandbox(storage);
const hooks=sandbox.llDiagnosticTestHooks;
assert.equal(hooks.maxEvents,1000,'event cap must be 1000');
assert.equal(hooks.maxStorageBytes,1024*1024,'storage cap must be 1 MiB');
assert(source.includes("const LL_DIAGNOSTIC_STORAGE_KEY='lexiconLeagueDiagnosticRollingV2';"),'diagnostics must use its own storage key');
assert(!source.includes('LL_SAVE_KEY'),'diagnostics must not write through the gameplay save key');
assert(source.includes("if(onclick.includes('llCommitCurrentMatch'))return 'match_commit';"),'save button must be identified as match commit');
assert(source.includes("['llCommitCurrentMatch','match_commit']"),'commit handler must be wrapped for diagnostic tracing');

const commitResult=sandbox.llCommitCurrentMatch();
assert.equal(commitResult,'committed','wrapped match commit must preserve original return value');
assert.equal(sandbox.matchCommitCalls,1,'wrapped match commit must run exactly once');
assert(types(sandbox).includes('HANDLER_STARTED'),'match commit wrapper must record handler start');
assert(events(sandbox).some(event=>event.action==='match_commit'&&event.type==='ACTION_COMPLETED'),'match commit wrapper must record final result');

const interactive=makeSandbox(makeStorage(),true);
const inactiveButton={tagName:'BUTTON',id:'inactive',className:'',textContent:'Pasif',disabled:false,isConnected:true,style:{},dataset:{},getAttribute(name){return name==='onclick'?'llCommitCurrentMatch()':'';},closest(){return this;},matches(){return false;}};
interactive.__dispatch('pointerdown',inactiveButton);
interactive.__runTimers(1100);
assert(types(interactive).includes('POINTER_WITHOUT_CLICK'),'a pointerdown with no click must be reported');
interactive.__dispatch('pointerdown',inactiveButton);
interactive.__dispatch('click',inactiveButton);
interactive.__runTimers(350);
assert(types(interactive).includes('CLICK_WITHOUT_HANDLER'),'a click with no matching handler execution must be reported');
const interactiveCommit=interactive.llCommitCurrentMatch();
assert.equal(interactiveCommit,'committed','interactive wrapper must preserve the original result');
interactive.__runTimers(1200);
interactive.__runTimers(1200);
assert(types(interactive).includes('STATE_NOT_CHANGED'),'a completed handler with no state change must be reported');
assert(types(interactive).includes('UI_NO_RESPONSE'),'a completed handler with no render/UI response must be reported');

for(let index=0;index<1040;index++)hooks.event('TEST_EVENT',{index});
assert.equal(events(sandbox).length,1000,'rolling event count must evict FIFO entries');
assert.equal(events(sandbox)[0].details.index,40,'oldest events must be removed first');
hooks.flush();
const stored=JSON.parse(storage.getItem(hooks.storageKey));
assert(stored.events.length<=1000,'persisted event count must be capped');
assert(Buffer.byteLength(storage.getItem(hooks.storageKey),'utf8')<=1024*1024,'persisted log must stay below byte cap');
assert.equal(stored.version,2,'stored log must expose diagnostic version');
assert(!Object.prototype.hasOwnProperty.call(stored.events[0],'__diagBytes'),'internal byte accounting must not leak into the exported event schema');

const reloaded=makeSandbox(storage);
assert(reloaded.llDiagnosticTestHooks.events().length>0,'saved diagnostic log must survive reload');
const corruptStorage=makeStorage({[hooks.storageKey]:'{not-json'});
const corrupt=makeSandbox(corruptStorage);
assert.equal(corrupt.llDiagnosticTestHooks.events().length,0,'corrupt diagnostic storage must fail open');

const quizId=sandbox.llDiagnosticQuizAnswerStart(true);
assert(quizId,'quiz handler must get an interaction id');
vm.runInContext('lexLeague.quiz.answerBusy=true;',sandbox);
sandbox.llDiagnosticQuizBusy(quizId,true,vm.runInContext('lexLeague.quiz',sandbox));
sandbox.__runTimers(2800);
assert(types(sandbox).includes('QUIZ_BUSY_STUCK'),'busy guard must report a stuck answer');
sandbox.llDiagnosticQuizBusy(quizId,false,vm.runInContext('lexLeague.quiz',sandbox));
sandbox.llDiagnosticRenderStarted(quizId,'test-render');
sandbox.llDiagnosticRenderEnded(quizId,'test-render');
vm.runInContext('lexLeague.quiz.index=1;lexLeague.quiz.revealed=false;',sandbox);
sandbox.llDiagnosticQuizCompleted(quizId,{wordId:'a',correct:true});
assert(types(sandbox).includes('HANDLER_STARTED'),'handler start must be recorded');
assert(types(sandbox).includes('RENDER_COMPLETED'),'render completion must be recorded');
assert(types(sandbox).includes('ACTION_COMPLETED'),'action outcome must be recorded');

const ignoredId=sandbox.llDiagnosticQuizAnswerStart(false);
sandbox.llDiagnosticQuizIgnored(ignoredId,'not_revealed',false,vm.runInContext('lexLeague.quiz',sandbox));
assert(types(sandbox).includes('ACTION_COMPLETED'),'ignored action must still have an outcome');
assert(events(sandbox).some(event=>event.details?.reason==='not_revealed'),'early-return reason must be exported');

hooks.event('RUNTIME_EXCEPTION',{message:'test exception'},{level:'ERROR'});
hooks.event('UNHANDLED_REJECTION',{message:'test rejection'},{level:'ERROR'});
hooks.flush();
const report=hooks.buildReport();
assert.equal(report.diagnosticVersion,2,'export header must include v2');
assert.equal(report.maxEvents,1000,'export must include event cap');
assert.equal(report.maxStorageBytes,1024*1024,'export must include storage cap');
assert.equal(report.eventCount,events(sandbox).length,'export event count must match rolling log');
assert(Array.isArray(report.suspiciousInteractions),'export must compute suspicious interactions');
assert(report.suspiciousInteractions.some(item=>item.type==='QUIZ_BUSY_STUCK'),'suspicious list must include busy timeout');
assert(report.summary.ERROR>=2,'error summary must include runtime and rejection events');
assert(!JSON.stringify(report).includes('alpha'),'diagnostic export must not include word text');

console.log('Diagnostic trail v2: rolling storage, reload, corruption, quiz guards, busy timeout, render, export and privacy checks passed.');
