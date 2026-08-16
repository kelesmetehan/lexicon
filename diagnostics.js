/*
 * Lexicon League diagnostic trail.
 * This module is deliberately fail-open: a diagnostic failure must never stop
 * a save, match, quiz, render, or normal button handler.
 */
// Aynı kelime, yönü tersine dönse bile son 12 farklı kelime içinde yeniden
// sorulmaz. Bu sayı "tercih" değil, yeterli kelime olduğunda zorunlu soğuma
// mesafesidir.
const LL_RECENT_QUIZ_WORD_LIMIT=12;
const LL_DIAGNOSTIC_LOG_VERSION=2;
const LL_DIAGNOSTIC_STORAGE_KEY='lexiconLeagueDiagnosticRollingV2';
const LL_DIAGNOSTIC_MAX_EVENTS=1000;
const LL_DIAGNOSTIC_MAX_STORAGE_BYTES=1024*1024;
const LL_DIAGNOSTIC_FLUSH_DELAY=900;
const LL_DIAGNOSTIC_POINTER_TIMEOUT=1100;
const LL_DIAGNOSTIC_HANDLER_TIMEOUT=350;
const LL_DIAGNOSTIC_UI_RESPONSE_TIMEOUT=1150;
const LL_DIAGNOSTIC_BUSY_TIMEOUT=2800;
const LL_DIAGNOSTIC_EVENTS=[];
const LL_DIAGNOSTIC_INTERACTIONS=new Map();
const LL_DIAGNOSTIC_POINTERS=new WeakMap();
let LL_DIAGNOSTIC_NEXT_ID=1;
let LL_DIAGNOSTIC_APPROX_BYTES=0;
let LL_DIAGNOSTIC_DIRTY=false;
let LL_DIAGNOSTIC_FLUSH_TIMER=null;
let LL_DIAGNOSTIC_STORAGE_FAILED=false;
let LL_DIAGNOSTIC_LAST_INTERACTION_ID=null;

function llDiagnosticNow(){return new Date().toISOString();}
function llDiagnosticStorage(){try{return typeof localStorage==='undefined'?null:localStorage;}catch(error){return null;}}
function llDiagnosticBytes(value){
  try{const text=typeof value==='string'?value:JSON.stringify(value);if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(text).length;return unescape(encodeURIComponent(text)).length;}
  catch(error){return 0;}
}
function llDiagnosticCompact(value,depth=0){
  if(value===null||value===undefined||typeof value==='number'||typeof value==='boolean')return value??null;
  if(typeof value==='string')return value.length>1200?value.slice(0,1200)+'...':value;
  if(value instanceof Error)return {name:value.name||'Error',message:String(value.message||value).slice(0,1200),stack:String(value.stack||'').slice(0,1600)};
  if(depth>3)return '[trimmed]';
  if(Array.isArray(value))return value.slice(0,16).map(item=>llDiagnosticCompact(item,depth+1));
  if(typeof value==='object'){
    const output={};Object.keys(value).filter(key=>key!=='__diagBytes').slice(0,24).forEach(key=>{output[String(key).slice(0,80)]=llDiagnosticCompact(value[key],depth+1);});return output;
  }
  return String(value).slice(0,1200);
}
function llDiagnosticLeagueContext(){
  try{if(typeof lexLeague!=='undefined')return lexLeague;}catch(error){}
  return globalThis.lexLeague||null;
}
function llDiagnosticStateSnapshot(){
  try{
    const league=llDiagnosticLeagueContext(),state=league?.state||{},q=league?.quiz||null;
    return {season:Number(state.season)||null,week:Number(state.week)||null,team:state.playerTeam||null,ap:Number(state.ap)||0,lp:Number(state.lp)||0,matchPhase:league?.match?.phase||null,quiz:q?{index:Number(q.index)||0,correct:Number(q.correct)||0,revealed:!!q.revealed,answerBusy:!!q.answerBusy,committed:!!q.committed,wordId:q.queue?.[Number(q.index)||0]?.id||null}:null};
  }catch(error){return {snapshotError:String(error?.message||error)};}
}
function llDiagnosticScreen(){
  try{
    const league=llDiagnosticLeagueContext();if(league?.quiz)return 'league_quiz';if(league?.match)return 'match';
    const area=typeof document==='undefined'?null:document.getElementById('flashcard-area');return area?.dataset?.screen||'app';
  }catch(error){return 'unknown';}
}
function llDiagnosticTargetSnapshot(element){
  if(!element)return null;
  try{
    const style=typeof getComputedStyle==='function'?getComputedStyle(element):null;
    return {tag:String(element.tagName||'').toLowerCase()||null,id:element.id||null,className:String(element.className||'').slice(0,180)||null,label:String(element.getAttribute?.('aria-label')||element.dataset?.quizAnswer||element.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)||null,disabled:!!element.disabled,pointerEvents:style?.pointerEvents||element.style?.pointerEvents||null,display:style?.display||element.style?.display||null,visibility:style?.visibility||element.style?.visibility||null,connected:element.isConnected!==false};
  }catch(error){return {targetError:String(error?.message||error)};}
}
function llDiagnosticActionForElement(element){
  if(!element)return null;
  const onclick=String(element.getAttribute?.('onclick')||'');
  if(element.dataset?.quizAnswer)return 'quiz_'+String(element.dataset.quizAnswer);
  if(onclick.includes('llRateLeagueQuiz'))return 'quiz_answer';
  if(onclick.includes('llSkipLeagueQuiz'))return 'quiz_skip';
  if(onclick.includes('llRevealQuiz'))return 'quiz_reveal';
  if(onclick.includes('llStartMatchPreparation'))return 'match_preparation';
  if(onclick.includes('llRollCurrentMatch'))return 'match_roll';
  if(onclick.includes('llUseReroll'))return 'match_reroll_use';
  if(onclick.includes('llSkipRerolls'))return 'match_reroll_skip';
  if(onclick.includes('llFinalizeCurrentMatch'))return 'match_finalize';
  if(onclick.includes('llCommitCurrentMatch'))return 'match_commit';
  if(onclick.includes('llSaveMatch'))return 'match_save';
  if(onclick.includes('llReroll'))return 'match_reroll';
  if(onclick.includes('llDownloadDiagnosticLog'))return 'diagnostic_download';
  if(onclick)return onclick.match(/([A-Za-z0-9_]+)\s*\(/)?.[1]||'inline_action';
  if(element.matches?.('select'))return 'select_change';
  if(element.matches?.('input[type="checkbox"]'))return 'checkbox_change';
  if(element.matches?.('a[href]'))return 'navigation';
  if(element.matches?.('button,[role="button"]'))return 'button';
  return null;
}
function llDiagnosticDiff(before,after){
  const changes=[];const visit=(left,right,path,depth=0)=>{
    if(depth>2||changes.length>=18)return;
    if(left===right)return;
    const leftObject=left&&typeof left==='object',rightObject=right&&typeof right==='object';
    if(leftObject&&rightObject){const keys=new Set([...Object.keys(left),...Object.keys(right)]);keys.forEach(key=>visit(left[key],right[key],path?path+'.'+key:key,depth+1));return;}
    changes.push({field:path,before:llDiagnosticCompact(left),after:llDiagnosticCompact(right)});
  };visit(before,after,'');return changes;
}
function llDiagnosticLevelFor(type,level){if(level)return level;const text=String(type||'').toLowerCase();return text.includes('error')||text.includes('exception')?'ERROR':text.includes('warn')||text.includes('ignored')||text.includes('blocked')||text.includes('timeout')?'WARN':'INFO';}
function llDiagnosticSetBytes(event,bytes){try{Object.defineProperty(event,'__diagBytes',{value:Number(bytes)||0,writable:true,configurable:true,enumerable:false});}catch(error){event.__diagBytes=Number(bytes)||0;}return event;}
function llDiagnosticTrimRuntime(){
  while(LL_DIAGNOSTIC_EVENTS.length>LL_DIAGNOSTIC_MAX_EVENTS||LL_DIAGNOSTIC_APPROX_BYTES>LL_DIAGNOSTIC_MAX_STORAGE_BYTES){const removed=LL_DIAGNOSTIC_EVENTS.shift();LL_DIAGNOSTIC_APPROX_BYTES-=Number(removed?.__diagBytes)||0;}
  LL_DIAGNOSTIC_APPROX_BYTES=Math.max(0,LL_DIAGNOSTIC_APPROX_BYTES);
}
function llDiagnosticScheduleFlush(immediate=false){
  if(LL_DIAGNOSTIC_STORAGE_FAILED)return;
  if(immediate){if(LL_DIAGNOSTIC_FLUSH_TIMER){clearTimeout(LL_DIAGNOSTIC_FLUSH_TIMER);LL_DIAGNOSTIC_FLUSH_TIMER=null;}llDiagnosticFlush();return;}
  if(LL_DIAGNOSTIC_FLUSH_TIMER)return;
  LL_DIAGNOSTIC_FLUSH_TIMER=setTimeout(()=>{LL_DIAGNOSTIC_FLUSH_TIMER=null;llDiagnosticFlush();},LL_DIAGNOSTIC_FLUSH_DELAY);
}
function llDiagnosticFlush(){
  if(!LL_DIAGNOSTIC_DIRTY||LL_DIAGNOSTIC_STORAGE_FAILED)return true;
  try{
    const storage=llDiagnosticStorage();if(!storage)return false;
    let payload={version:LL_DIAGNOSTIC_LOG_VERSION,nextId:LL_DIAGNOSTIC_NEXT_ID,events:LL_DIAGNOSTIC_EVENTS};let encoded=JSON.stringify(payload);
    while(LL_DIAGNOSTIC_EVENTS.length&&llDiagnosticBytes(encoded)>LL_DIAGNOSTIC_MAX_STORAGE_BYTES){const removed=LL_DIAGNOSTIC_EVENTS.shift();LL_DIAGNOSTIC_APPROX_BYTES-=Number(removed?.__diagBytes)||0;payload={version:LL_DIAGNOSTIC_LOG_VERSION,nextId:LL_DIAGNOSTIC_NEXT_ID,events:LL_DIAGNOSTIC_EVENTS};encoded=JSON.stringify(payload);}
    storage.setItem(LL_DIAGNOSTIC_STORAGE_KEY,encoded);LL_DIAGNOSTIC_DIRTY=false;return true;
  }catch(error){LL_DIAGNOSTIC_STORAGE_FAILED=true;return false;}
}
function llDiagnosticLoadRollingLog(){
  try{
    const raw=llDiagnosticStorage()?.getItem(LL_DIAGNOSTIC_STORAGE_KEY);if(!raw)return;
    const parsed=JSON.parse(raw),events=Array.isArray(parsed?.events)?parsed.events:[];
    events.slice(-LL_DIAGNOSTIC_MAX_EVENTS).forEach(event=>{const safe=llDiagnosticCompact(event);safe.id=Number(safe.id)||LL_DIAGNOSTIC_NEXT_ID++;llDiagnosticSetBytes(safe,llDiagnosticBytes(safe)+1);LL_DIAGNOSTIC_EVENTS.push(safe);LL_DIAGNOSTIC_APPROX_BYTES+=safe.__diagBytes;LL_DIAGNOSTIC_NEXT_ID=Math.max(LL_DIAGNOSTIC_NEXT_ID,safe.id+1);});
    LL_DIAGNOSTIC_NEXT_ID=Math.max(LL_DIAGNOSTIC_NEXT_ID,Number(parsed?.nextId)||1);llDiagnosticTrimRuntime();
  }catch(error){/* A corrupt diagnostic log is intentionally discarded, never game data. */}
}
function llDiagnosticEvent(type,details={},meta={}){
  try{
    const event={id:LL_DIAGNOSTIC_NEXT_ID++,at:llDiagnosticNow(),ts:Date.now(),level:llDiagnosticLevelFor(type,meta.level),type:String(type||'EVENT'),interactionId:meta.interactionId||LL_DIAGNOSTIC_LAST_INTERACTION_ID||null,screen:meta.screen||llDiagnosticScreen(),action:meta.action||null,target:meta.target||null,details:llDiagnosticCompact(details),context:llDiagnosticStateSnapshot()};
    llDiagnosticSetBytes(event,llDiagnosticBytes(event)+1);LL_DIAGNOSTIC_EVENTS.push(event);LL_DIAGNOSTIC_APPROX_BYTES+=event.__diagBytes;llDiagnosticTrimRuntime();LL_DIAGNOSTIC_DIRTY=true;llDiagnosticScheduleFlush(event.level==='ERROR');return event;
  }catch(error){return null;}
}
function llDiagnosticNewInteraction(action,target,details={}){
  const id='i'+Date.now().toString(36)+'-'+LL_DIAGNOSTIC_NEXT_ID.toString(36);const record={id,action,createdAt:Date.now(),target,clicked:false,handlerStarted:false,renderStarted:false,renderCompleted:false,uiObserved:false,completed:false,before:llDiagnosticStateSnapshot(),pointerTimer:null,handlerTimer:null,responseTimer:null,observer:null};LL_DIAGNOSTIC_INTERACTIONS.set(id,record);LL_DIAGNOSTIC_LAST_INTERACTION_ID=id;
  llDiagnosticEvent('INTERACTION_POINTERDOWN',details,{level:'DEBUG',interactionId:id,action,target});return record;
}
function llDiagnosticRecordForCurrent(action){
  const current=LL_DIAGNOSTIC_INTERACTIONS.get(LL_DIAGNOSTIC_LAST_INTERACTION_ID);if(current&&current.action===action&&Date.now()-current.createdAt<1800)return current;
  const record={id:'i'+Date.now().toString(36)+'-'+LL_DIAGNOSTIC_NEXT_ID.toString(36),action,createdAt:Date.now(),target:null,clicked:true,handlerStarted:false,renderStarted:false,renderCompleted:false,uiObserved:false,completed:false,before:llDiagnosticStateSnapshot(),pointerTimer:null,handlerTimer:null,responseTimer:null,observer:null};LL_DIAGNOSTIC_INTERACTIONS.set(record.id,record);LL_DIAGNOSTIC_LAST_INTERACTION_ID=record.id;return record;
}
function llDiagnosticObserveUi(record){
  try{
    if(typeof MutationObserver==='undefined'||typeof document==='undefined'||!document.body)return;
    record.observer=new MutationObserver(()=>{record.uiObserved=true;});record.observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class','style']});
  }catch(error){}
}
function llDiagnosticStopObservation(record){try{record?.observer?.disconnect?.();}catch(error){}}
function llDiagnosticHandlerStarted(action,details={}){
  try{const record=llDiagnosticRecordForCurrent(action);record.action=action||record.action;record.handlerStarted=true;if(record.handlerTimer){clearTimeout(record.handlerTimer);record.handlerTimer=null;}llDiagnosticObserveUi(record);llDiagnosticEvent('HANDLER_STARTED',details,{level:'DEBUG',interactionId:record.id,action:record.action,target:record.target});return record.id;}catch(error){return null;}
}
function llDiagnosticHandlerEnded(interactionId,result='SUCCESS',details={}){
  try{const record=LL_DIAGNOSTIC_INTERACTIONS.get(interactionId);if(!record)return;record.completed=true;const after=llDiagnosticStateSnapshot(),changes=llDiagnosticDiff(record.before,after);if(!changes.length&&result==='SUCCESS')llDiagnosticEvent('STATE_NOT_CHANGED',{result,reason:'expected_state_change_missing'},{level:'WARN',interactionId,action:record.action,target:record.target});llDiagnosticEvent('ACTION_COMPLETED',{result,stateChanges:changes,...details},{level:result==='ERROR'||result==='TIMEOUT'?'ERROR':result==='IGNORED'||result==='BLOCKED'||result==='NO_EFFECT'?'WARN':'INFO',interactionId,action:record.action,target:record.target});
    setTimeout(()=>{if(!record.uiObserved&&!record.renderCompleted&&result==='SUCCESS')llDiagnosticEvent('UI_NO_RESPONSE',{timeoutMs:LL_DIAGNOSTIC_UI_RESPONSE_TIMEOUT},{level:'WARN',interactionId,action:record.action,target:record.target});llDiagnosticStopObservation(record);LL_DIAGNOSTIC_INTERACTIONS.delete(interactionId);},LL_DIAGNOSTIC_UI_RESPONSE_TIMEOUT+20);
  }catch(error){}
}
function llDiagnosticRenderStarted(interactionId,name){const record=LL_DIAGNOSTIC_INTERACTIONS.get(interactionId);if(record)record.renderStarted=true;llDiagnosticEvent('RENDER_STARTED',{name},{level:'DEBUG',interactionId,action:record?.action||name,target:record?.target||null});}
function llDiagnosticRenderEnded(interactionId,name){const record=LL_DIAGNOSTIC_INTERACTIONS.get(interactionId);if(record)record.renderCompleted=true;llDiagnosticEvent('RENDER_COMPLETED',{name},{level:'DEBUG',interactionId,action:record?.action||name,target:record?.target||null});}
function llDiagnosticRenderError(interactionId,name,error){llDiagnosticEvent('RENDER_EXCEPTION',{name,message:String(error?.message||error),stack:String(error?.stack||'').slice(0,1600)},{level:'ERROR',interactionId,action:name});}
function llDiagnosticSaveEvent(interactionId,phase,details={}){llDiagnosticEvent('PERSISTENCE_'+String(phase||'').toUpperCase(),details,{level:phase==='error'?'ERROR':'DEBUG',interactionId,action:'save'});}
function llDiagnosticQuizAnswerStart(correct){return llDiagnosticHandlerStarted('quiz_answer',{phase:'rate_enter',correct:!!correct,quiz:llDiagnosticStateSnapshot().quiz});}
function llDiagnosticQuizIgnored(interactionId,reason,correct,q){llDiagnosticHandlerEnded(interactionId,'IGNORED',{reason,correct:!!correct,quiz:{index:Number(q?.index)||0,revealed:!!q?.revealed,answerBusy:!!q?.answerBusy,committed:!!q?.committed,wordId:q?.queue?.[Number(q?.index)||0]?.id||null}});}
function llDiagnosticQuizBusy(interactionId,value,q){llDiagnosticEvent('QUIZ_BUSY_CHANGED',{value:!!value,quiz:{index:Number(q?.index)||0,wordId:q?.queue?.[Number(q?.index)||0]?.id||null}},{level:'DEBUG',interactionId,action:'quiz_answer'});if(value){setTimeout(()=>{if(q?.answerBusy)llDiagnosticEvent('QUIZ_BUSY_STUCK',{timeoutMs:LL_DIAGNOSTIC_BUSY_TIMEOUT,quiz:{index:Number(q?.index)||0,wordId:q?.queue?.[Number(q?.index)||0]?.id||null}},{level:'WARN',interactionId,action:'quiz_answer'});},LL_DIAGNOSTIC_BUSY_TIMEOUT);}}
function llDiagnosticQuizCompleted(interactionId,details={}){llDiagnosticHandlerEnded(interactionId,'SUCCESS',details);}
function llDiagnosticShuffle(items){if(typeof llShuffle==='function')return llShuffle(items);const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function llOrderQuizCandidates(pool,recentIds,blockedIds){
  const recent=recentIds instanceof Set?recentIds:new Set(recentIds||[]);
  const blocked=blockedIds instanceof Set?blockedIds:new Set(blockedIds||[]);
  return llDiagnosticShuffle(pool.filter(word=>!blocked.has(word.id)&&!recent.has(word.id)));
}
function llTakeQuizCandidates(pool,count,recent,blocked,{allowCooldownFallback=false}={}){
  const selected=llOrderQuizCandidates(pool,recent,blocked).slice(0,count);
  if(selected.length>=count||!allowCooldownFallback)return selected;
  const selectedIds=new Set(selected.map(word=>word.id));
  const fallback=llDiagnosticShuffle(pool.filter(word=>!blocked.has(word.id)&&!selectedIds.has(word.id))).slice(0,count-selected.length);
  if(fallback.length){
    llDiagnosticEvent('QUIZ_COOLDOWN_RELAXED',{requested:count,selectedBeforeFallback:selected.length,fallbackIds:fallback.map(word=>word.id),reason:'current_cycle_must_finish_or_word_pool_is_too_small'},{level:'WARN'});
  }
  return [...selected,...fallback];
}
globalThis.llPickQuizWords=function(count=10){
  const words=typeof loadUserWords==='function'?loadUserWords():[];if(!words.length)return [];
  const state=llDiagnosticLeagueContext()?.state;if(!state)return [];
  if(!Array.isArray(state.usedWords))state.usedWords=[];if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];
  const target=Math.min(Math.max(0,Number(count)||0),words.length),used=new Set(state.usedWords),recent=new Set(state.recentQuizWords.slice(-LL_RECENT_QUIZ_WORD_LIMIT));
  const needsIntro=word=>typeof globalThis.llNeedsPriorityIntroduction==='function'?llNeedsPriorityIntroduction(word):!!(word&&word.id&&(Number(word.reviewCount)||0)===0&&!word.firstExposureAt);
  const orderPending=list=>typeof globalThis.llPriorityIntroductionOrder==='function'?llPriorityIntroductionOrder(list):list.slice().sort((a,b)=>String(b?.addedAt||'').localeCompare(String(a?.addedAt||''))||String(a?.en||'').localeCompare(String(b?.en||''),'en'));
  const pending=target===10?orderPending(words.filter(needsIntro)):[];
  const introduced=target===10?words.filter(word=>!needsIntro(word)):words;
  // 10 soruluk normal sınavın kontrollü hedefi: 7 normal + NET 3 yeni kelime.
  // En son eklenen bekleyen kelimeler önceliklidir. 3'ten az bekleyen varsa aynı
  // kelimeyi tekrarlamayız; mevcutların tamamını kullanırız. Fresh havuzda yeterli
  // normal kelime yoksa sınav kilitlenmesin diye genel seçim davranışı korunur.
  const desiredIntroCount=target===10?Math.min(3,pending.length):0;
  const canInjectIntroductions=target===10&&desiredIntroCount>0&&introduced.length>=target-desiredIntroCount;
  const priorities=canInjectIntroductions?pending.slice(0,desiredIntroCount):[];
  const priorityIds=new Set(priorities.map(word=>word.id));
  const selectable=priorities.length?[...introduced,...priorities]:words;
  const closingPool=selectable.filter(word=>!used.has(word.id));
  let closing=[];
  if(priorities.length){
    const normalClosing=llTakeQuizCandidates(closingPool.filter(word=>!priorityIds.has(word.id)),target-priorities.length,recent,new Set(),{allowCooldownFallback:true});
    const introSlots=priorities.length===3?[1,4,7]:priorities.length===2?[2,6]:[3];
    let normalIndex=0,introIndex=0;
    for(let position=0;position<target&&(normalIndex<normalClosing.length||introIndex<priorities.length);position++){
      if(introSlots.includes(position)&&introIndex<priorities.length)closing.push(priorities[introIndex++]);
      else if(normalIndex<normalClosing.length)closing.push(normalClosing[normalIndex++]);
      else if(introIndex<priorities.length)closing.push(priorities[introIndex++]);
    }
    while(normalIndex<normalClosing.length)closing.push(normalClosing[normalIndex++]);
    while(introIndex<priorities.length)closing.push(priorities[introIndex++]);
  }else{
    // Mevcut döngüde henüz kullanılmamış kelimeler önce tamamlanır. Soğuma
    // yalnızca bu mevcut döngüyü terk ettirmemeli; aksi halde kelimeler atlanır.
    closing=llTakeQuizCandidates(closingPool,target,recent,new Set(),{allowCooldownFallback:true});
  }
  const queue=closing.map(word=>({id:word.id,askTrToEn:Math.random()>.5,cycleStart:false,introPriority:priorityIds.has(word.id)}));
  if(queue.length<target){
    const chosenIds=new Set(queue.map(ref=>ref.id));
    let nextCycle=llTakeQuizCandidates(selectable,target-queue.length,recent,chosenIds);
    // 12 kelimelik havuzdan daha küçük özel test/kariyer kayıtlarında döngü
    // kilitlenmesin; yalnızca yeterli alternatif yoksa kural gevşetilir.
    if(nextCycle.length<target-queue.length)nextCycle=llTakeQuizCandidates(selectable,target-queue.length,recent,chosenIds,{allowCooldownFallback:true});
    nextCycle.forEach((word,index)=>queue.push({id:word.id,askTrToEn:Math.random()>.5,cycleStart:index===0,introPriority:priorityIds.has(word.id)}));
  }
  llDiagnosticEvent('QUIZ_QUEUE_CREATED',{requested:count,selected:queue.length,totalWords:words.length,usedInCycle:used.size,recentCooldown:recent.size,cycleCrossed:queue.some(ref=>ref.cycleStart),introPriorityIds:priorities.map(word=>word.id),introPriorityCount:priorities.length,pendingFirstExposure:pending.length,ids:queue.map(ref=>ref.id)});return queue;
};
globalThis.llRecordQuizWordShown=function(ref,word){
  const league=llDiagnosticLeagueContext(),state=league?.state,q=league?.quiz;if(!state||!q||!ref)return;
  if(!Array.isArray(q.shownWordRefs))q.shownWordRefs=[];const shownKey=`${Number(q.index)||0}:${ref.id}`;
  if(q.shownWordRefs.includes(shownKey))return;q.shownWordRefs.push(shownKey);
  // Aynı kelime ileride yeniden gelirse onu tekrar listenin sonuna taşır;
  // bu, yön değişse bile yeni 12 kelimelik mesafeyi yeniden başlatır.
  if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];
  state.recentQuizWords=[...state.recentQuizWords.filter(id=>id!==ref.id),ref.id].slice(-LL_RECENT_QUIZ_WORD_LIMIT);
  llDiagnosticEvent('QUIZ_WORD_SHOWN',{id:ref.id,question:Number(q.index)+1,cycleStart:!!ref.cycleStart});if(typeof llSave==='function')llSave();
};
function llDiagnosticRepeatDistances(ids){const last=new Map(),repeats=[];(ids||[]).forEach((id,index)=>{if(last.has(id))repeats.push({id,previousIndex:last.get(id),index,distance:index-last.get(id)});last.set(id,index);});return repeats;}
function llDiagnosticCareerSummary(state){
  if(!state)return null;const team=state.teams?.[state.playerTeam]||{},league=(state.leagues?.super||[]).includes(state.playerTeam)?'super':(state.leagues?.first||[]).includes(state.playerTeam)?'first':null;
  return {playerTeam:state.playerTeam||null,season:Number(state.season)||null,week:Number(state.week)||null,league,stars:Number(team.stars)||null,ap:Number(state.ap)||0,lp:Number(state.lp)||0,seasonEnded:!!state.seasonEnded,careerEnded:!!state.careerEnded,pendingCompetition:state.pendingFixture?.competition||null,pendingRound:state.pendingFixture?.roundLabel||null,resultCount:Array.isArray(state.results)?state.results.length:0,managerMarketStatus:state.managerMarket?.status||null,managerSelectedTeam:state.managerMarket?.selectedTeam||state.pendingManagerSigning?.team||null,pendingManagerSigning:state.pendingManagerSigning||null,managerTransitionError:state.managerTransitionError||null,managerTransitionTrace:Array.isArray(state.managerTransitionTrace)?state.managerTransitionTrace.slice(-12):[]};
}
function llDiagnosticResult(result){return {season:result.season,week:result.week,competition:result.competition,roundLabel:result.roundLabel||null,home:result.home,away:result.away,homeGoals:result.homeGoals,awayGoals:result.awayGoals,penalties:result.penalties||null};}
function llDiagnosticStorageSummary(){
  const rows={};try{const storage=llDiagnosticStorage();if(!storage)return {available:false};for(let index=0;index<storage.length;index++){const key=storage.key(index);if(!key)continue;rows[key]={characters:(storage.getItem(key)||'').length};}rows[LL_DIAGNOSTIC_STORAGE_KEY]={characters:(storage.getItem(LL_DIAGNOSTIC_STORAGE_KEY)||'').length,approxBytes:LL_DIAGNOSTIC_APPROX_BYTES};}catch(error){rows.error=String(error?.message||error);}return rows;
}
function llDiagnosticSuspiciousInteractions(){
  const suspicious=[];LL_DIAGNOSTIC_EVENTS.forEach(event=>{const type=String(event.type||''),ignored=type==='ACTION_COMPLETED'&&/^(IGNORED|BLOCKED|NO_EFFECT|TIMEOUT|ERROR)$/.test(String(event.details?.result||''));if(/POINTER_WITHOUT_CLICK|CLICK_WITHOUT_HANDLER|ACTION_IGNORED|STATE_NOT_CHANGED|STATE_CHANGED_WITHOUT_RENDER|UI_NO_RESPONSE|EXCEPTION|UNHANDLED|BUSY_STUCK|TIMEOUT/.test(type)||ignored)suspicious.push({id:event.id,at:event.at,type:event.type,interactionId:event.interactionId,action:event.action,details:event.details});});return suspicious.slice(-160);
}
function llDiagnosticEventSummary(){const counts={DEBUG:0,INFO:0,WARN:0,ERROR:0,byType:{}};LL_DIAGNOSTIC_EVENTS.forEach(event=>{counts[event.level]=(counts[event.level]||0)+1;const type=String(event.type||'EVENT');counts.byType[type]=(counts.byType[type]||0)+1;});return counts;}
function llBuildDiagnosticReport(){
  const league=llDiagnosticLeagueContext(),state=league?.state||null,q=league?.quiz||null,recent=Array.isArray(state?.recentQuizWords)?state.recentQuizWords.slice(-LL_RECENT_QUIZ_WORD_LIMIT):[],used=Array.isArray(state?.usedWords)?state.usedWords:[],queue=Array.isArray(q?.queue)?q.queue:[];
  const scripts=typeof document==='undefined'?[]:[...document.scripts].map(script=>script.getAttribute('src')).filter(Boolean);
  return {app:'lexicon-league',type:'diagnostic',diagnosticVersion:LL_DIAGNOSTIC_LOG_VERSION,eventCount:LL_DIAGNOSTIC_EVENTS.length,maxEvents:LL_DIAGNOSTIC_MAX_EVENTS,maxStorageBytes:LL_DIAGNOSTIC_MAX_STORAGE_BYTES,approxStorageBytes:LL_DIAGNOSTIC_APPROX_BYTES,exportedAt:llDiagnosticNow(),page:{origin:typeof location==='undefined'?null:location.origin,path:typeof location==='undefined'?null:location.pathname,scripts},device:{userAgent:typeof navigator==='undefined'?null:navigator.userAgent,language:typeof navigator==='undefined'?null:navigator.language,online:typeof navigator==='undefined'?null:navigator.onLine,viewport:typeof window==='undefined'?null:{width:window.innerWidth,height:window.innerHeight,pixelRatio:window.devicePixelRatio}},activeSlot:typeof llGetActiveSaveSlot==='function'?llGetActiveSaveSlot():null,career:llDiagnosticCareerSummary(state),storedCareer:typeof globalThis.llStorageActiveCareerSummary==='function'?globalThis.llStorageActiveCareerSummary():null,storageBoot:typeof globalThis.llStorageBootStatus==='function'?globalThis.llStorageBootStatus():{available:false,events:Array.isArray(globalThis.llStorageBootEvents)?globalThis.llStorageBootEvents.slice(-40):[]},seasonTransitionError:globalThis.llLastSeasonTransitionError||null,wordCycle:{totalWords:typeof loadUserWords==='function'?loadUserWords().length:0,usedInCurrentCycle:used.length,usedIds:used.slice(-100),recentLimit:LL_RECENT_QUIZ_WORD_LIMIT,recentShownIds:recent,recentRepeats:llDiagnosticRepeatDistances(recent),currentQuiz:q?{index:q.index,correct:q.correct,revealed:!!q.revealed,skipped:!!q.skipped,shownWordRefs:(q.shownWordRefs||[]),queue:queue.map(ref=>({id:ref.id,cycleStart:!!ref.cycleStart,askTrToEn:!!ref.askTrToEn}))}:null},recentOfficialResults:(state?.results||[]).slice(-30).map(llDiagnosticResult),summary:llDiagnosticEventSummary(),suspiciousInteractions:llDiagnosticSuspiciousInteractions(),runtimeEvents:[...LL_DIAGNOSTIC_EVENTS],storage:llDiagnosticStorageSummary()};
}
function llDiagnosticFileStamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
globalThis.llDownloadDiagnosticLog=function(){
  try{llDiagnosticEvent('DIAGNOSTIC_DOWNLOAD_REQUESTED',{});llDiagnosticFlush();const report=llBuildDiagnosticReport(),team=(report.career?.playerTeam||'kayit').replace(/[^a-z0-9_-]+/gi,'-'),filename=`lexicon-diagnostic-${team}-${llDiagnosticFileStamp()}.json`;if(typeof llDownloadJson==='function')llDownloadJson(filename,report);else{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}}catch(error){try{alert('Diagnostic download failed: '+(error?.message||error));}catch(ignore){}};
};
function llInstallDiagnosticButton(){
  if(typeof document==='undefined'||document.getElementById('ll-diagnostic-download'))return;const area=document.getElementById('flashcard-area'),card=area?.querySelector('.quiz-start-card');if(!card)return;
  card.insertAdjacentHTML('beforeend',`<div id="ll-diagnostic-download" style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.09);text-align:center"><button class="btn btn-outline" style="width:100%;max-width:320px" onclick="llDownloadDiagnosticLog()">&#128203; Hata Kayd&#305;n&#305; &#304;ndir</button><div style="color:var(--text3);font-size:11px;line-height:1.45;margin:8px auto 0;max-width:470px">Bu dosya yaln&#305;zca hata tan&#305;s&#305; i&#231;indir: son kullan&#305;c&#305; eylemleri, hata zinciri ve k&#305;sa oyun durumu bulunur. Tam yedek de&#287;ildir.</div></div>`);
}
function llDiagnosticRelevantElement(target){return target?.closest?.('button,[role="button"],[onclick],select,input[type="checkbox"],a[href]')||null;}
function llDiagnosticInstallInteractionListeners(){
  if(typeof document==='undefined'||document.__llDiagnosticInteractionListeners)return;document.__llDiagnosticInteractionListeners=true;
  document.addEventListener('pointerdown',event=>{try{const element=llDiagnosticRelevantElement(event.target),action=llDiagnosticActionForElement(element);if(!element||!action)return;const record=llDiagnosticNewInteraction(action,llDiagnosticTargetSnapshot(element),{pointerType:event.pointerType||'mouse'});LL_DIAGNOSTIC_POINTERS.set(element,record.id);record.pointerTimer=setTimeout(()=>{if(!record.clicked)llDiagnosticEvent('POINTER_WITHOUT_CLICK',{timeoutMs:LL_DIAGNOSTIC_POINTER_TIMEOUT},{level:'WARN',interactionId:record.id,action:record.action,target:record.target});},LL_DIAGNOSTIC_POINTER_TIMEOUT);}catch(error){}},true);
  document.addEventListener('click',event=>{try{const element=llDiagnosticRelevantElement(event.target),action=llDiagnosticActionForElement(element);if(!element||!action)return;const interactionId=LL_DIAGNOSTIC_POINTERS.get(element),record=LL_DIAGNOSTIC_INTERACTIONS.get(interactionId)||llDiagnosticRecordForCurrent(action);record.clicked=true;if(record.pointerTimer){clearTimeout(record.pointerTimer);record.pointerTimer=null;}LL_DIAGNOSTIC_LAST_INTERACTION_ID=record.id;llDiagnosticEvent('INTERACTION_CLICK',{},{level:'DEBUG',interactionId:record.id,action,target:llDiagnosticTargetSnapshot(element)});if(/^(quiz_answer|quiz_skip|quiz_reveal|match_preparation|match_roll|match_reroll_use|match_reroll_skip|match_finalize|match_commit|match_save|match_reroll|diagnostic_download)$/.test(action)){record.handlerTimer=setTimeout(()=>{if(!record.handlerStarted)llDiagnosticEvent('CLICK_WITHOUT_HANDLER',{timeoutMs:LL_DIAGNOSTIC_HANDLER_TIMEOUT},{level:'WARN',interactionId:record.id,action,target:record.target});},LL_DIAGNOSTIC_HANDLER_TIMEOUT);}}catch(error){}},true);
}
function llDiagnosticSafeActionArgs(args){
  return Array.from(args||[]).slice(0,4).map(value=>typeof value==='string'?value.slice(0,100):typeof value==='number'||typeof value==='boolean'?value:typeof value);
}
function llDiagnosticWrapKnownAction(functionName,action){
  try{
    const original=globalThis[functionName];
    if(typeof original!=='function'||original.__llDiagnosticWrapped)return false;
    const wrapped=function(){
      const interactionId=llDiagnosticHandlerStarted(action,{handler:functionName,args:llDiagnosticSafeActionArgs(arguments)});
      try{
        const result=original.apply(this,arguments);
        if(result&&typeof result.then==='function'){
          llDiagnosticEvent('ASYNC_HANDLER_STARTED',{handler:functionName},{level:'DEBUG',interactionId,action});
          return result.then(value=>{llDiagnosticHandlerEnded(interactionId,'SUCCESS',{handler:functionName,async:true});return value;},error=>{llDiagnosticEvent('HANDLER_EXCEPTION',{handler:functionName,message:String(error?.message||error),stack:String(error?.stack||'').slice(0,1600)},{level:'ERROR',interactionId,action});llDiagnosticHandlerEnded(interactionId,'ERROR',{handler:functionName,async:true});throw error;});
        }
        llDiagnosticHandlerEnded(interactionId,'SUCCESS',{handler:functionName});
        return result;
      }catch(error){
        llDiagnosticEvent('HANDLER_EXCEPTION',{handler:functionName,message:String(error?.message||error),stack:String(error?.stack||'').slice(0,1600)},{level:'ERROR',interactionId,action});
        llDiagnosticHandlerEnded(interactionId,'ERROR',{handler:functionName});
        throw error;
      }
    };
    Object.defineProperty(wrapped,'__llDiagnosticWrapped',{value:true});
    globalThis[functionName]=wrapped;
    return true;
  }catch(error){return false;}
}
function llDiagnosticInstallKnownActionWrappers(){
  [
    ['llStartMatchPreparation','match_preparation'],
    ['llRollCurrentMatch','match_roll'],
    ['llUseReroll','match_reroll_use'],
    ['llSkipRerolls','match_reroll_skip'],
    ['llFinalizeCurrentMatch','match_finalize'],
    ['llCommitCurrentMatch','match_commit'],
    ['llRevealQuiz','quiz_reveal'],
    ['llSkipLeagueQuiz','quiz_skip']
  ].forEach(([functionName,action])=>llDiagnosticWrapKnownAction(functionName,action));
}
llDiagnosticLoadRollingLog();
if(typeof window!=='undefined'){
  window.addEventListener('error',event=>llDiagnosticEvent('RUNTIME_EXCEPTION',{message:event.message,source:(event.filename||'').split('/').pop(),line:event.lineno,column:event.colno,stack:String(event.error?.stack||'').slice(0,1600)},{level:'ERROR'}));
  window.addEventListener('unhandledrejection',event=>llDiagnosticEvent('UNHANDLED_REJECTION',{message:String(event.reason?.message||event.reason||'Unknown promise rejection'),stack:String(event.reason?.stack||'').slice(0,1600)},{level:'ERROR'}));
  window.addEventListener('pagehide',()=>llDiagnosticFlush());
}
if(typeof globalThis.renderPreStart==='function'){const base=globalThis.renderPreStart;globalThis.renderPreStart=function(){const result=base.apply(this,arguments);llInstallDiagnosticButton();return result;};}
if(typeof document!=='undefined'){llDiagnosticInstallInteractionListeners();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',llInstallDiagnosticButton,{once:true});else llInstallDiagnosticButton();}
llDiagnosticInstallKnownActionWrappers();
globalThis.llDiagnosticEvent=llDiagnosticEvent;
globalThis.llDiagnosticHandlerStarted=llDiagnosticHandlerStarted;
globalThis.llDiagnosticHandlerEnded=llDiagnosticHandlerEnded;
globalThis.llDiagnosticRenderStarted=llDiagnosticRenderStarted;
globalThis.llDiagnosticRenderEnded=llDiagnosticRenderEnded;
globalThis.llDiagnosticRenderError=llDiagnosticRenderError;
globalThis.llDiagnosticSaveEvent=llDiagnosticSaveEvent;
globalThis.llDiagnosticQuizAnswerStart=llDiagnosticQuizAnswerStart;
globalThis.llDiagnosticQuizIgnored=llDiagnosticQuizIgnored;
globalThis.llDiagnosticQuizBusy=llDiagnosticQuizBusy;
globalThis.llDiagnosticQuizCompleted=llDiagnosticQuizCompleted;
globalThis.llDiagnosticTestHooks={orderCandidates:llOrderQuizCandidates,repeatDistances:llDiagnosticRepeatDistances,buildReport:llBuildDiagnosticReport,recentLimit:LL_RECENT_QUIZ_WORD_LIMIT,maxEvents:LL_DIAGNOSTIC_MAX_EVENTS,maxStorageBytes:LL_DIAGNOSTIC_MAX_STORAGE_BYTES,events:()=>LL_DIAGNOSTIC_EVENTS,clear:()=>{LL_DIAGNOSTIC_EVENTS.splice(0);LL_DIAGNOSTIC_APPROX_BYTES=0;LL_DIAGNOSTIC_DIRTY=true;},flush:llDiagnosticFlush,load:llDiagnosticLoadRollingLog,event:llDiagnosticEvent,actionForElement:llDiagnosticActionForElement,wrapKnownActions:llDiagnosticInstallKnownActionWrappers,storageKey:LL_DIAGNOSTIC_STORAGE_KEY};
