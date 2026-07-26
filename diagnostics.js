/* Word-cycle cooldown and privacy-conscious diagnostic export. */
const LL_RECENT_QUIZ_WORD_LIMIT=30;
const LL_DIAGNOSTIC_LOG_VERSION=1;
const LL_DIAGNOSTIC_EVENTS=[];

function llDiagnosticEvent(type,details={}){
  LL_DIAGNOSTIC_EVENTS.push({at:new Date().toISOString(),type:String(type||'event'),details});
  if(LL_DIAGNOSTIC_EVENTS.length>80)LL_DIAGNOSTIC_EVENTS.splice(0,LL_DIAGNOSTIC_EVENTS.length-80);
}
function llDiagnosticShuffle(items){
  if(typeof llShuffle==='function')return llShuffle(items);
  const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
function llOrderQuizCandidates(pool,recentIds){
  const recent=recentIds instanceof Set?recentIds:new Set(recentIds||[]),shuffled=llDiagnosticShuffle(pool);
  return [...shuffled.filter(word=>!recent.has(word.id)),...shuffled.filter(word=>recent.has(word.id))];
}
globalThis.llPickQuizWords=function(count=10){
  const words=typeof loadUserWords==='function'?loadUserWords():[];if(!words.length)return [];
  const state=globalThis.lexLeague?.state;if(!state)return [];
  if(!Array.isArray(state.usedWords))state.usedWords=[];
  if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];
  const target=Math.min(Math.max(0,Number(count)||0),words.length),used=new Set(state.usedWords),recent=new Set(state.recentQuizWords.slice(-LL_RECENT_QUIZ_WORD_LIMIT));
  const remaining=llOrderQuizCandidates(words.filter(word=>!used.has(word.id)),recent),closing=remaining.slice(0,target),queue=closing.map(word=>({id:word.id,askTrToEn:Math.random()>.5,cycleStart:false}));
  if(queue.length<target){
    const closingIds=new Set(closing.map(word=>word.id)),nextCycle=llOrderQuizCandidates(words.filter(word=>!closingIds.has(word.id)),recent).slice(0,target-queue.length);
    nextCycle.forEach((word,index)=>queue.push({id:word.id,askTrToEn:Math.random()>.5,cycleStart:index===0}));
  }
  llDiagnosticEvent('quiz_queue_created',{requested:count,selected:queue.length,totalWords:words.length,usedInCycle:used.size,recentCooldown:recent.size,cycleCrossed:queue.some(ref=>ref.cycleStart),ids:queue.map(ref=>ref.id)});
  return queue;
};
globalThis.llRecordQuizWordShown=function(ref,word){
  const state=globalThis.lexLeague?.state,q=globalThis.lexLeague?.quiz;if(!state||!q||!ref)return;
  if(!Array.isArray(q.shownWordIds))q.shownWordIds=[];
  if(q.shownWordIds.includes(ref.id))return;
  q.shownWordIds.push(ref.id);
  if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];
  state.recentQuizWords.push(ref.id);
  state.recentQuizWords=state.recentQuizWords.slice(-LL_RECENT_QUIZ_WORD_LIMIT);
  llDiagnosticEvent('quiz_word_shown',{id:ref.id,en:word?.en||'',tr:word?.tr||'',question:q.index+1,cycleStart:!!ref.cycleStart});
  if(typeof llSave==='function')llSave();
};
function llDiagnosticWordMap(){
  const words=typeof loadUserWords==='function'?loadUserWords():[];return new Map(words.map(word=>[word.id,word]));
}
function llDiagnosticWordRef(id,map){const word=map.get(id);return {id,en:word?.en||null,tr:word?.tr||null};}
function llDiagnosticRepeatDistances(ids){
  const last=new Map(),repeats=[];(ids||[]).forEach((id,index)=>{if(last.has(id))repeats.push({id,previousIndex:last.get(id),index,distance:index-last.get(id)});last.set(id,index);});return repeats;
}
function llDiagnosticCareerSummary(state){
  if(!state)return null;const team=state.teams?.[state.playerTeam]||{},league=(state.leagues?.super||[]).includes(state.playerTeam)?'super':(state.leagues?.first||[]).includes(state.playerTeam)?'first':null;
  return {playerTeam:state.playerTeam||null,season:Number(state.season)||null,week:Number(state.week)||null,league,stars:Number(team.stars)||null,ap:Number(state.ap)||0,lp:Number(state.lp)||0,seasonEnded:!!state.seasonEnded,careerEnded:!!state.careerEnded,pendingCompetition:state.pendingFixture?.competition||null,pendingRound:state.pendingFixture?.roundLabel||null,resultCount:Array.isArray(state.results)?state.results.length:0,targetVersion:state.teamSeasonTargets?.version||null,targetSeason:state.teamSeasonTargets?.season||null,target:state.teamSeasonTargets?.targets?.[state.playerTeam]||null};
}
function llDiagnosticResult(result){return {season:result.season,week:result.week,competition:result.competition,roundLabel:result.roundLabel||null,home:result.home,away:result.away,homeGoals:result.homeGoals,awayGoals:result.awayGoals,penalties:result.penalties||null};}
function llDiagnosticStorageSummary(){
  const rows={};try{for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key)continue;rows[key]={characters:(localStorage.getItem(key)||'').length};}}catch(error){rows.error=String(error?.message||error);}return rows;
}
function llBuildDiagnosticReport(){
  const state=globalThis.lexLeague?.state||null,q=globalThis.lexLeague?.quiz||null,map=llDiagnosticWordMap(),recent=Array.isArray(state?.recentQuizWords)?state.recentQuizWords.slice(-LL_RECENT_QUIZ_WORD_LIMIT):[],used=Array.isArray(state?.usedWords)?state.usedWords:[],queue=Array.isArray(q?.queue)?q.queue:[];
  const scripts=typeof document==='undefined'?[]:[...document.scripts].map(script=>script.getAttribute('src')).filter(Boolean);
  return {app:'lexicon-league',type:'diagnostic',formatVersion:LL_DIAGNOSTIC_LOG_VERSION,exportedAt:new Date().toISOString(),page:{origin:typeof location==='undefined'?null:location.origin,path:typeof location==='undefined'?null:location.pathname,scripts},device:{userAgent:typeof navigator==='undefined'?null:navigator.userAgent,language:typeof navigator==='undefined'?null:navigator.language,online:typeof navigator==='undefined'?null:navigator.onLine,viewport:typeof window==='undefined'?null:{width:window.innerWidth,height:window.innerHeight,pixelRatio:window.devicePixelRatio}},activeSlot:typeof llGetActiveSaveSlot==='function'?llGetActiveSaveSlot():null,career:llDiagnosticCareerSummary(state),wordCycle:{totalWords:map.size,usedInCurrentCycle:used.length,usedIds:used.slice(-100),recentLimit:LL_RECENT_QUIZ_WORD_LIMIT,recentShown:recent.map(id=>llDiagnosticWordRef(id,map)),recentRepeats:llDiagnosticRepeatDistances(recent),currentQuiz:q?{index:q.index,correct:q.correct,revealed:!!q.revealed,skipped:!!q.skipped,shownWordIds:(q.shownWordIds||[]).map(id=>llDiagnosticWordRef(id,map)),queue:queue.map(ref=>({...llDiagnosticWordRef(ref.id,map),cycleStart:!!ref.cycleStart,askTrToEn:!!ref.askTrToEn}))}:null},recentOfficialResults:(state?.results||[]).slice(-30).map(llDiagnosticResult),runtimeEvents:[...LL_DIAGNOSTIC_EVENTS],storage:llDiagnosticStorageSummary()};
}
function llDiagnosticFileStamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
globalThis.llDownloadDiagnosticLog=function(){
  try{const report=llBuildDiagnosticReport(),team=(report.career?.playerTeam||'kayit').replace(/[^a-z0-9çğıöşü_-]+/gi,'-'),filename=`lexicon-hata-kaydi-${team}-${llDiagnosticFileStamp()}.json`;if(typeof llDownloadJson==='function')llDownloadJson(filename,report);else{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}llDiagnosticEvent('diagnostic_downloaded',{filename});}catch(error){alert('Hata kaydı indirilemedi: '+(error?.message||error));}
};
function llInstallDiagnosticButton(){
  if(typeof document==='undefined'||document.getElementById('ll-diagnostic-download'))return;const area=document.getElementById('flashcard-area'),card=area?.querySelector('.quiz-start-card');if(!card)return;
  card.insertAdjacentHTML('beforeend',`<div id="ll-diagnostic-download" style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.09);text-align:center"><button class="btn btn-outline" style="width:100%;max-width:320px" onclick="llDownloadDiagnosticLog()">🧾 Hata Kaydını İndir</button><div style="color:var(--text3);font-size:11px;line-height:1.45;margin:8px auto 0;max-width:470px">Telefonda veya bilgisayarda karşılaştığın hatayı gönderirken bu JSON dosyasını ekle. Kariyer özeti, son maçlar ve kelime tekrar geçmişi bulunur; tam yedek değildir.</div></div>`);
}
if(typeof window!=='undefined'){
  window.addEventListener('error',event=>llDiagnosticEvent('runtime_error',{message:event.message,source:(event.filename||'').split('/').pop(),line:event.lineno,column:event.colno,stack:String(event.error?.stack||'').slice(0,1500)}));
  window.addEventListener('unhandledrejection',event=>llDiagnosticEvent('unhandled_rejection',{message:String(event.reason?.message||event.reason||'Bilinmeyen promise hatası'),stack:String(event.reason?.stack||'').slice(0,1500)}));
}
if(typeof globalThis.renderPreStart==='function'){
  const llDiagnosticRenderPreStartBase=globalThis.renderPreStart;globalThis.renderPreStart=function(){const result=llDiagnosticRenderPreStartBase.apply(this,arguments);llInstallDiagnosticButton();return result;};
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',llInstallDiagnosticButton,{once:true});else llInstallDiagnosticButton();}
globalThis.llDiagnosticTestHooks={orderCandidates:llOrderQuizCandidates,repeatDistances:llDiagnosticRepeatDistances,buildReport:llBuildDiagnosticReport,recentLimit:LL_RECENT_QUIZ_WORD_LIMIT};