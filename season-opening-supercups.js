/* Lexicon League · Season-opening Super Cups
 * Game-format rule chosen deliberately for simplicity:
 * - every domestic super cup is one match: top-tier champion vs domestic cup champion
 * - if one club wins both, top-tier runner-up replaces the cup slot
 * - UEFA Super Cup: UCL champion vs UEL champion
 * - all are played before league week 1; they never consume/increment a league week
 */
(function(global){
'use strict';

const VERSION=1;
const COUNTRY_CODES=['TUR','ENG','GER','ESP','FRA','ITA','NED'];
const DOMESTIC_NAMES={
  TUR:'TFF Süper Kupa',ENG:'Community Shield',GER:'Franz Beckenbauer Supercup',
  ESP:'Supercopa de España',FRA:'Trophée des Champions',ITA:'Supercoppa Italiana',NED:'Johan Cruijff Schaal'
};
const UEFA_NAME='UEFA Süper Kupa';
const UEFA_ACHIEVEMENT_REWARD={ap:30,lp:40};
const LEGACY_FINISH_SUPER_CUP=typeof global.llFinishSuperCup==='function'?global.llFinishSuperCup:null;

function stateNow(){return global.lexLeague?.state||null;}
function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d;}
function esc(v){return typeof global.llEscape==='function'?global.llEscape(v):String(v??'');}
function deep(v){try{return JSON.parse(JSON.stringify(v));}catch(_){return v;}}
function save(){try{if(typeof global.llSave==='function')global.llSave();}catch(_){}}
function teamStars(state,name){try{return num(state?.teams?.[name]?.stars||global.llTeamDef?.(name)?.stars,3);}catch(_){return num(state?.teams?.[name]?.stars,3);}}
function eventId(season,scope,country=''){return `opening-supercup|${num(season)}|${scope}|${country||'UEFA'}`;}
function countryName(code){return global.LL_COUNTRY_META?.[code]?.country||code;}

function ensureHistory(state){if(!Array.isArray(state.seasonOpeningSuperCupHistory))state.seasonOpeningSuperCupHistory=[];return state.seasonOpeningSuperCupHistory;}
function historyRecord(state,event){
  const history=ensureHistory(state),record={
    version:VERSION,id:event.id,season:num(event.season),sourceSeason:num(event.sourceSeason),scope:event.scope,country:event.country||null,
    name:event.name,home:event.home,away:event.away,winner:event.winner||null,homeGoals:num(event.homeGoals),awayGoals:num(event.awayGoals),
    penalties:event.penalties||null,leagueChampion:event.leagueChampion||null,cupChampion:event.cupChampion||null,
    fallback:event.fallback||null,userMatch:!!event.userMatch,completedAt:event.completedAt||new Date().toISOString()
  };
  const i=history.findIndex(item=>item?.id===event.id);if(i>=0)history[i]=record;else history.push(record);
  history.sort((a,b)=>num(a.season)-num(b.season)||String(a.id).localeCompare(String(b.id)));return record;
}
function championFor(state,season,competition){
  try{if(typeof global.llV13EnsureChampionHistory==='function')global.llV13EnsureChampionHistory(state);}catch(_){}
  const direct=(state.competitionChampions||[]).find(item=>num(item?.season)===num(season)&&item?.competition===competition&&item?.team)?.team;
  if(direct)return direct;
  return (state.seasonHistory||[]).find(item=>num(item?.season)===num(season))?.champions?.[competition]||null;
}
function domesticEvent(summary,country,openingSeason){
  const info=summary?.countrySummaries?.[country];if(!info)return null;
  const leagueChampion=info?.tier1Rows?.[0]?.team||null,runnerUp=info?.tier1Rows?.[1]?.team||null,cupChampion=info?.cupWinner||null;
  if(!leagueChampion||!cupChampion)return null;
  const double=leagueChampion===cupChampion,challenger=double?runnerUp:cupChampion;if(!challenger||challenger===leagueChampion)return null;
  return {version:VERSION,id:eventId(openingSeason,'domestic',country),season:openingSeason,sourceSeason:num(summary.season),scope:'domestic',country,name:DOMESTIC_NAMES[country]||`${countryName(country)} Süper Kupa`,home:leagueChampion,away:challenger,leagueChampion,cupChampion,fallback:double?'league-runner-up':null,status:'pending',winner:null,homeGoals:null,awayGoals:null,penalties:null,userMatch:false};
}
function uefaEvent(state,summary,openingSeason){
  const sourceSeason=num(summary?.season),ucl=championFor(state,sourceSeason,'ucl'),uel=championFor(state,sourceSeason,'uel');
  /* Aynı takım iki slotta görünürse kendi kendine maç üretme. Oyunda bunun için doğrulanmış
   * bir runner-up kaynağı yok; varsayım yapmak yerine eventi güvenli biçimde atla. */
  if(!ucl||!uel||ucl===uel)return null;
  return {version:VERSION,id:eventId(openingSeason,'uefa'),season:openingSeason,sourceSeason,scope:'uefa',country:'UEFA',name:UEFA_NAME,home:ucl,away:uel,uclWinner:ucl,uelWinner:uel,status:'pending',winner:null,homeGoals:null,awayGoals:null,penalties:null,userMatch:false};
}
function eventPenalty(state,home,away){
  try{if(typeof global.llV12PenaltyShootout==='function'){const p=global.llV12PenaltyShootout(state,home,away);return {home:num(p.player),away:num(p.opponent),winner:p.winner,raw:p};}}catch(_){}
  const hs=Math.max(1,teamStars(state,home)),as=Math.max(1,teamStars(state,away)),winner=Math.random()<hs/(hs+as)?home:away;return {home:winner===home?5:4,away:winner===away?5:4,winner};
}
function simulateEvent(state,event){
  let score=null;try{if(typeof global.llV2SimpleEuropeScore==='function')score=global.llV2SimpleEuropeScore(event.home,event.away);}catch(_){}
  if(!score){const hs=teamStars(state,event.home),as=teamStars(state,event.away),roll=s=>Math.max(0,Math.floor(Math.random()*3)+Math.floor((s-2)/2));score={homeGoals:roll(hs)+(hs>as&&Math.random()<.35?1:0),awayGoals:roll(as)+(as>hs&&Math.random()<.25?1:0)};}
  event.homeGoals=num(score.homeGoals);event.awayGoals=num(score.awayGoals);if(event.homeGoals===event.awayGoals){const p=eventPenalty(state,event.home,event.away);event.penalties={home:p.home,away:p.away};event.winner=p.winner;}else event.winner=event.homeGoals>event.awayGoals?event.home:event.away;
  event.status='completed';event.completedAt=new Date().toISOString();event.userMatch=false;historyRecord(state,event);return event;
}
function rootFor(state){const root=state?.seasonOpeningSuperCups;return root&&typeof root==='object'?root:null;}
function playerPendingEvents(state){const root=rootFor(state);return (root?.events||[]).filter(event=>event?.status==='pending'&&(event.home===state.playerTeam||event.away===state.playerTeam));}
function fixtureFor(event){return {home:event.home,away:event.away,competition:'supercup',league:event.scope==='uefa'?'uefa-supercup':`domestic-supercup:${event.country}`,roundLabel:`${event.name} · Tek Maç`,dateLabel:'Sezon Açılışı',neutral:true,superCupId:event.id,superCupScope:event.scope,superCupCountry:event.country||null,superCupName:event.name,seasonOpeningSuperCup:true};}
function queueNextPlayerEvent(state){
  if(!state||state.seasonEnded||state.pendingFixture)return false;const next=playerPendingEvents(state)[0];if(!next)return false;next.userMatch=true;state.pendingFixture=fixtureFor(next);return true;
}
function createOpeningEvents(state,summary){
  if(!state||!summary||state.seasonEnded)return null;const openingSeason=num(state.season),sourceSeason=num(summary.season);if(!sourceSeason||openingSeason<=sourceSeason)return null;
  const existing=rootFor(state);if(existing&&num(existing.season)===openingSeason&&num(existing.sourceSeason)===sourceSeason){queueNextPlayerEvent(state);return existing;}
  const events=COUNTRY_CODES.map(country=>domesticEvent(summary,country,openingSeason)).filter(Boolean),uefa=uefaEvent(state,summary,openingSeason);if(uefa)events.push(uefa);
  const root=state.seasonOpeningSuperCups={version:VERSION,season:openingSeason,sourceSeason,createdAt:new Date().toISOString(),events};
  for(const event of events){if(event.home===state.playerTeam||event.away===state.playerTeam)event.userMatch=true;else simulateEvent(state,event);}
  queueNextPlayerEvent(state);return root;
}
function findEvent(state,id){return (rootFor(state)?.events||[]).find(event=>event?.id===id)||null;}
function latestResult(state,event){
  return [...(state.results||[])].reverse().find(result=>result?.competition==='supercup'&&result?.league===(event.scope==='uefa'?'uefa-supercup':`domestic-supercup:${event.country}`)&&result?.home===event.home&&result?.away===event.away)||null;
}
function addTrophy(state,event){
  if(event.winner!==state.playerTeam)return;if(!Array.isArray(state.trophies))state.trophies=[];
  if(!state.trophies.some(t=>num(t?.season)===num(state.season)&&t?.name===event.name&&(!t?.team||t?.team===state.playerTeam))){state.trophies.push({season:state.season,name:event.name,team:state.playerTeam,source:'season-opening-supercup'});try{if(typeof global.llQueueTrophyAnimation==='function')global.llQueueTrophyAnimation({key:`opening-supercup|${event.id}|trophy`,season:state.season,kind:'supercup-trophy',country:event.country||'UEFA',title:'Süper Kupa Şampiyonu',name:event.name,subtitle:`${state.playerTeam}, ${event.name} kupasını kazandı!`,detail:'Sezon açılışı · tek maç',team:state.playerTeam,icon:'🏆',theme:'celebration'});}catch(_){}}
}
function addPrestige(state,event){
  if(event.winner!==state.playerTeam)return;try{if(typeof global.llManagerProfile!=='function')return;const p=global.llManagerProfile(state);if(!p)return;p.reputationEvents=Array.isArray(p.reputationEvents)?p.reputationEvents:[];const key=`opening-supercup|${event.id}|${state.playerTeam}`;if(p.reputationEvents.some(x=>x?.key===key))return;const before=num(p.reputation,50),delta=event.scope==='uefa'?5:3,after=Math.max(0,Math.min(100,before+delta));p.reputation=after;p.reputationEvents.push({key,season:state.season,before,delta:after-before,after,label:`${event.name} şampiyonluğu`,team:state.playerTeam,at:new Date().toISOString()});}catch(_){}
}
function addUefaAchievement(state,event){
  if(event.scope!=='uefa'||event.winner!==state.playerTeam)return;if(!state.superCupAchievements||typeof state.superCupAchievements!=='object')state.superCupAchievements={};if(state.superCupAchievements['uefa-super-cup'])return;
  state.superCupAchievements['uefa-super-cup']={season:state.season,team:state.playerTeam,...UEFA_ACHIEVEMENT_REWARD,rewardVersion:3};state.ap=num(state.ap)+UEFA_ACHIEVEMENT_REWARD.ap;state.lp=num(state.lp)+UEFA_ACHIEVEMENT_REWARD.lp;
}
function finishOpeningEvent(winner){
  const state=stateNow(),fx=global.lexLeague?.match?.fixture||{},event=state&&findEvent(state,fx.superCupId);if(!state||!event||event.status==='completed')return false;
  const result=latestResult(state,event);event.status='completed';event.winner=winner||result?.knockoutWinner||null;event.homeGoals=num(result?.homeGoals,event.homeGoals);event.awayGoals=num(result?.awayGoals,event.awayGoals);event.penalties=result?.penaltyShootout?{home:num(result.penaltyShootout.player),away:num(result.penaltyShootout.opponent),winner:result.penaltyShootout.winner}:null;event.completedAt=new Date().toISOString();event.userMatch=true;
  historyRecord(state,event);addTrophy(state,event);addPrestige(state,event);addUefaAchievement(state,event);
  if(event.scope==='uefa'){
    state.superCup={season:event.season,sourceSeason:event.sourceSeason,status:'completed',uclWinner:event.home,uelWinner:event.away,home:event.home,away:event.away,winner:event.winner,homeGoals:event.homeGoals,awayGoals:event.awayGoals,penalties:event.penalties};
    if(!Array.isArray(state.superCupHistory))state.superCupHistory=[];const rec={season:event.season,sourceSeason:event.sourceSeason,uclWinner:event.home,uelWinner:event.away,winner:event.winner,home:event.home,away:event.away,homeGoals:event.homeGoals,awayGoals:event.awayGoals,penalties:event.penalties};const i=state.superCupHistory.findIndex(x=>num(x?.season)===num(event.season));if(i>=0)state.superCupHistory[i]=rec;else state.superCupHistory.push(rec);
  }
  save();return true;
}
function repairOpeningState(state){
  const root=rootFor(state);if(!root)return state;root.version=VERSION;root.events=Array.isArray(root.events)?root.events:[];for(const event of root.events){if(event?.status==='completed')historyRecord(state,event);}return state;
}
function historyRows(state,scope,country=null){return ensureHistory(state).filter(item=>item.scope===scope&&(!country||item.country===country)).sort((a,b)=>num(b.season)-num(a.season));}
function scoreText(row){const pens=row.penalties?` · Pen ${num(row.penalties.home)}-${num(row.penalties.away)}`:'';return `${num(row.homeGoals)}-${num(row.awayGoals)}${pens}`;}
function historyTable(rows){if(!rows.length)return '<div class="ll-muted">Henüz oynanmış Süper Kupa yok.</div>';return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>Sezon</th><th>Kupa</th><th>Eşleşme</th><th>Skor</th><th>Şampiyon</th></tr></thead><tbody>${rows.map(r=>`<tr><td>S${num(r.season)}</td><td>${esc(r.name)}</td><td>${esc(r.home)} - ${esc(r.away)}</td><td>${esc(scoreText(r))}</td><td><b>${esc(r.winner||'—')}</b></td></tr>`).join('')}</tbody></table></div>`;}
function renderSuperCupCenter(){
  const state=stateNow();if(!state)return;const country=state.playerCountry||'TUR',domestic=historyRows(state,'domestic',country),uefa=historyRows(state,'uefa'),current=(rootFor(state)?.events||[]).filter(e=>e.country===country||e.scope==='uefa');
  const currentHtml=current.length?current.map(e=>`<div class="ll-card" style="margin-top:12px"><div class="ll-card-title">${esc(e.name)} · S${num(e.season)}</div><div class="ll-next-match"><div class="ll-club"><b>${esc(e.home)}</b></div><div class="ll-vs">${e.status==='completed'?esc(`${num(e.homeGoals)} - ${num(e.awayGoals)}`):'VS'}</div><div class="ll-club"><b>${esc(e.away)}</b></div></div><div class="ll-muted" style="margin-top:8px">${e.status==='completed'?`Şampiyon: ${esc(e.winner||'—')}`:'Sezon açılışında oynanacak.'}${e.fallback==='league-runner-up'?' · Double nedeniyle kupa slotunu lig ikincisi aldı.':''}</div></div>`).join(''):'<div class="ll-muted">Bu sezon için kayıtlı Süper Kupa eşleşmesi yok.</div>';
  global.llSetWide?.(true);global.llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Süper Kupa <em>Merkezi</em></div><div class="ll-muted">Sezon açılışı · tek maç · lig haftası tüketmez</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div><div class="ll-notice"><b>Oyun formatı:</b> Yerel lig şampiyonu vs yerel kupa şampiyonu. Double olursa lig ikincisi gelir. UEFA Süper Kupa, Şampiyonlar Ligi şampiyonu ile Avrupa Ligi şampiyonu arasındadır.</div>${currentHtml}<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${esc(DOMESTIC_NAMES[country]||'Yerel Süper Kupa')} · Geçmiş</div>${historyTable(domestic)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">UEFA Süper Kupa · Geçmiş</div>${historyTable(uefa)}</div></div></div>`;
}

/* The old module's season-end gate must not create a second UEFA Super Cup. */
global.llEnsureSuperCupAtSeasonEnd=function(){return false;};
global.llFinishSuperCup=function(winner){
  const state=stateNow(),fx=global.lexLeague?.match?.fixture||{};
  if(fx.seasonOpeningSuperCup&&fx.superCupId)return finishOpeningEvent(winner);
  /* Legacy pending saves from the old season-end implementation remain finishable. */
  const legacy=state?.superCup;if(!state||!legacy||legacy.status==='completed')return false;
  if(LEGACY_FINISH_SUPER_CUP)return LEGACY_FINISH_SUPER_CUP(winner);
  const result=[...(state.results||[])].reverse().find(r=>r?.competition==='supercup'&&r?.league==='uefa-supercup');legacy.status='completed';legacy.winner=winner||result?.knockoutWinner||null;legacy.home=result?.home||legacy.uclWinner;legacy.away=result?.away||legacy.uelWinner;legacy.homeGoals=num(result?.homeGoals);legacy.awayGoals=num(result?.awayGoals);legacy.penalties=result?.penaltyShootout||null;save();return true;
};

const BASE_REPAIR=global.llV2RepairState;
if(typeof BASE_REPAIR==='function')global.llV2RepairState=function(state){state=BASE_REPAIR.apply(this,arguments);repairOpeningState(state);return state;};

const BASE_START=global.llStartNextSeason;
if(typeof BASE_START==='function')global.llStartNextSeason=function(){
  const state=stateNow();if(!state)return BASE_START.apply(this,arguments);const before=num(state.season),summary=deep(state.lastSeasonSummary);
  /* Ensure European winners are captured before another wrapper clears lastSeasonSummary. */
  try{if(summary&&typeof global.llV13CaptureSeasonChampions==='function')global.llV13CaptureSeasonChampions(state,summary);}catch(_){}
  const result=BASE_START.apply(this,arguments),after=stateNow();
  if(after&&num(after.season)===before+1&&summary&&num(summary.season)===before){createOpeningEvents(after,summary);save();global.llRenderDashboard?.();}
  return result;
};

const BASE_DASH=global.llRenderDashboard;
if(typeof BASE_DASH==='function')global.llRenderDashboard=function(){const state=stateNow();if(state&&!state.seasonEnded&&!state.pendingFixture)queueNextPlayerEvent(state);return BASE_DASH.apply(this,arguments);};

const BASE_CENTER=global.llRenderCompetitionCenter;
if(typeof BASE_CENTER==='function')global.llRenderCompetitionCenter=function(tab,key){if(tab==='europe'&&key==='supercup'){renderSuperCupCenter();return;}return BASE_CENTER.apply(this,arguments);};
global.llRenderSuperCupArchive=renderSuperCupCenter;

global.llSeasonOpeningSuperCupTestApi={VERSION,COUNTRY_CODES,DOMESTIC_NAMES,domesticEvent,uefaEvent,createOpeningEvents,queueNextPlayerEvent,finishOpeningEvent,historyRows,repairOpeningState};
try{repairOpeningState(stateNow());}catch(_){}
})(globalThis);
