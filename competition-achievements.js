/* Lexicon League: one-time live title achievements for every playable country. */
(function(){
'use strict';

const COMPETITIONS=[
  {country:'TUR',name:'T\u00fcrkiye',top:'S\u00fcper Lig',second:'TFF 1. Lig',cup:'Ziraat T\u00fcrkiye Kupas\u0131'},
  {country:'ENG',name:'\u0130ngiltere',top:'Premier League',second:'Championship',cup:'FA Cup'},
  {country:'GER',name:'Almanya',top:'Bundesliga',second:'2. Bundesliga',cup:'DFB-Pokal'},
  {country:'ESP',name:'\u0130spanya',top:'La Liga',second:'Segunda Divisi\u00f3n',cup:'Copa del Rey'},
  {country:'FRA',name:'Fransa',top:'Ligue 1',second:'Ligue 2',cup:'Coupe de France'},
  {country:'ITA',name:'\u0130talya',top:'Serie A',second:'Serie B',cup:'Coppa Italia'},
  {country:'NED',name:'Hollanda',top:'Eredivisie',second:'Eerste Divisie',cup:'KNVB Beker'}
];
const EUROPE=[
  {id:'ucl',name:'UEFA \u015eampiyonlar Ligi',reward:{ap:550,lp:600}},
  {id:'uel',name:'UEFA Avrupa Ligi',reward:{ap:450,lp:500}},
  {id:'uecl',name:'UEFA Konferans Ligi',reward:{ap:375,lp:425}}
];
const REWARDS={top:{ap:300,lp:360},second:{ap:150,lp:180},cup:{ap:220,lp:250}};
const PREFIX='competition_title_';
const definitions=[];

COMPETITIONS.forEach(meta=>{
  definitions.push(
    {id:`${PREFIX}${meta.country.toLowerCase()}_top`,country:meta.country,kind:'top',name:`${meta.name} \u00b7 ${meta.top} \u015eampiyonu`,description:`${meta.top} sezonunu zirvede bitir.`,reward:REWARDS.top},
    {id:`${PREFIX}${meta.country.toLowerCase()}_second`,country:meta.country,kind:'second',name:`${meta.name} \u00b7 ${meta.second} \u015eampiyonu`,description:`${meta.second} sezonunu zirvede bitir.`,reward:REWARDS.second},
    {id:`${PREFIX}${meta.country.toLowerCase()}_cup`,country:meta.country,kind:'cup',name:`${meta.name} \u00b7 ${meta.cup} \u015eampiyonu`,description:`${meta.cup}'n\u0131 kazan.`,reward:REWARDS.cup}
  );
});
EUROPE.forEach(meta=>definitions.push({id:`${PREFIX}${meta.id}`,kind:'europe',europe:meta.id,name:`${meta.name} \u015eampiyonu`,description:`${meta.name}'ni kazan.`,reward:meta.reward}));

function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function escapeHtml(value){const text=String(value??'');return typeof globalThis.llEscape==='function'?globalThis.llEscape(text):text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function ensure(state){
  if(!state)return null;
  if(!state.achievements||typeof state.achievements!=='object')state.achievements={version:2,unlocked:{},migrationNote:null};
  if(!state.achievements.unlocked||typeof state.achievements.unlocked!=='object')state.achievements.unlocked={};
  if(!state.achievementStats||typeof state.achievementStats!=='object')state.achievementStats={};
  if(!state.achievementStats.competitionTitleAwards||typeof state.achievementStats.competitionTitleAwards!=='object')state.achievementStats.competitionTitleAwards={};
  return state.achievements;
}
function appendDefinitions(){
  const list=globalThis.LL_ACHIEVEMENTS;
  if(!Array.isArray(list))return;
  definitions.forEach(def=>{
    if(list.some(existing=>existing?.id===def.id))return;
    // These achievements are deliberately awarded only by the season-finalizer below.
    // A passive check prevents historical saves from being backfilled when this file loads.
    list.push({...def,check:()=>false,progress:()=> 'Yeni sezondaki canl\u0131 \u015fampiyonluk bekleniyor'});
  });
}
function rowsFor(summary,country,tier){
  const perCountry=summary?.countrySummaries?.[country]||{};
  if(tier==='top')return perCountry.tier1Rows||summary?.tier1Rows||summary?.superRows||[];
  return perCountry.tier2Rows||summary?.tier2Rows||summary?.firstRows||[];
}
function didWin(def,state,summary,team,country){
  if(def.kind==='europe')return state.europe?.type===def.europe&&state.europe?.winner===team;
  if(def.country!==country)return false;
  if(def.kind==='cup'){
    const perCountry=summary?.countrySummaries?.[country]||{};
    return (perCountry.cupWinner||summary?.cupWinner)===team;
  }
  return rowsFor(summary,country,def.kind)[0]?.team===team;
}
function award(state,def,season,team){
  const unlocked=ensure(state)?.unlocked;
  if(!unlocked||unlocked[def.id])return null;
  const reward=def.reward||{ap:0,lp:0};
  state.ap=number(state.ap)+number(reward.ap);
  state.lp=number(state.lp)+number(reward.lp);
  const entry={season,team,at:new Date().toISOString(),source:'live-competition-title',reward:{ap:number(reward.ap),lp:number(reward.lp)}};
  unlocked[def.id]=entry;
  return {...def,entry};
}
function resolveLiveSeasonTitles(state){
  const summary=state?.lastSeasonSummary;
  if(!state||!summary||!state.seasonEnded)return [];
  const team=state.playerTeam;
  const country=summary.country||summary.playerCountry||state.playerCountry||'TUR';
  const season=number(summary.season,state.season);
  if(!team||!season)return [];
  const ledger=state.achievementStats.competitionTitleAwards;
  const key=`${season}|${country}|${team}`;
  if(ledger[key])return [];
  // Write the event ledger even when no title is won so repeated finalization cannot double-award.
  ledger[key]={at:new Date().toISOString(),titles:[]};
  const unlocked=definitions.filter(def=>didWin(def,state,summary,team,country)).map(def=>award(state,def,season,team)).filter(Boolean);
  ledger[key].titles=unlocked.map(item=>item.id);
  return unlocked;
}
function celebrate(items){
  if(!items.length)return;
  const cinematic=globalThis.llAchievementCinematic;
  if(typeof cinematic==='function')cinematic(items.map(item=>({id:item.id,name:item.name,description:item.description,reward:item.reward,entry:item.entry})));
}
function wrapFinalizer(){
  const base=globalThis.llV2FinalizeSeason;
  if(typeof base!=='function'||base.__competitionTitleAchievements)return;
  const wrapped=function(){
    const result=base.apply(this,arguments);
    const state=globalThis.lexLeague?.state;
    if(!state)return result;
    ensure(state);
    const unlocked=resolveLiveSeasonTitles(state);
    if(unlocked.length&&typeof globalThis.llSave==='function')globalThis.llSave();
    celebrate(unlocked);
    return result;
  };
  wrapped.__competitionTitleAchievements=true;
  globalThis.llV2FinalizeSeason=wrapped;
}
function rewardText(reward){return `${reward.ap?`+${reward.ap} AP`:''}${reward.ap&&reward.lp?' \u00b7 ':''}${reward.lp?`+${reward.lp} LP`:''}`||'Rozet';}
function card(def,unlocked){
  const done=unlocked[def.id];
  return `<div class="ll-achievement-card ${done?'done':''}"><div class="ll-achievement-card-head"><span>${done?'\ud83c\udfc6':'\ud83d\udd12'}</span><b>${escapeHtml(def.name)}</b></div><div class="ll-sub">${escapeHtml(def.description)}</div><div class="ll-achievement-progress">${done?`A\u00e7\u0131ld\u0131 \u00b7 S${escapeHtml(done.season)}${done.team?` \u00b7 ${escapeHtml(done.team)}`:''}`:'Yaln\u0131zca yeni sezondaki canl\u0131 \u015fampiyonlukla a\u00e7\u0131l\u0131r'}</div><div class="ll-achievement-reward">${rewardText(def.reward)}</div></div>`;
}
function renderSection(){
  if(typeof document==='undefined')return;
  const state=globalThis.lexLeague?.state;
  if(!state)return;
  const unlocked=ensure(state).unlocked;
  document.querySelector('[data-competition-title-achievements]')?.remove();
  const panel=document.querySelector('.ll-shell .ll-panel');
  if(!panel)return;
  const countries=COMPETITIONS.map(meta=>{
    const cards=definitions.filter(def=>def.country===meta.country).map(def=>card(def,unlocked)).join('');
    return `<div class="ll-competition-achievement-country"><div class="ll-card-title">${escapeHtml(meta.name)}</div><div class="ll-achievement-grid">${cards}</div></div>`;
  }).join('');
  const europe=definitions.filter(def=>def.kind==='europe').map(def=>card(def,unlocked)).join('');
  panel.insertAdjacentHTML('beforeend',`<div class="ll-card ll-competition-achievements" data-competition-title-achievements><div class="ll-card-title">Lig ve Yerel Kupa \u015eampiyonluklar\u0131</div><div class="ll-muted">Sadece bu dosya eklendikten sonraki ger\u00e7ek sezon sonu zaferleriyle a\u00e7\u0131l\u0131r; eski kariyer kupalar\u0131 geriye d\u00f6n\u00fck \u00f6d\u00fcl vermez.</div><div class="ll-competition-achievement-countries">${countries}</div><div class="ll-card-title" style="margin-top:16px">Avrupa Kupalar\u0131 \u015eampiyonluklar\u0131</div><div class="ll-achievement-grid">${europe}</div></div>`);
}
function wrapRenderer(){
  const base=globalThis.llRenderAchievements;
  if(typeof base!=='function'||base.__competitionTitleAchievements)return;
  const wrapped=function(){const result=base.apply(this,arguments);renderSection();return result;};
  wrapped.__competitionTitleAchievements=true;
  globalThis.llRenderAchievements=wrapped;
}
function injectStyle(){
  if(typeof document==='undefined'||document.getElementById('ll-competition-title-achievement-styles'))return;
  const style=document.createElement('style');style.id='ll-competition-title-achievement-styles';
  style.textContent='.ll-competition-achievement-countries{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px}.ll-competition-achievement-country{padding:12px;border:1px solid rgba(45,212,191,.18);border-radius:10px;background:rgba(2,6,23,.18)}.ll-competition-achievements .ll-achievement-grid{grid-template-columns:repeat(auto-fit,minmax(205px,1fr))}@media(max-width:650px){.ll-competition-achievement-countries{grid-template-columns:1fr}}';
  document.head.appendChild(style);
}
appendDefinitions();
injectStyle();
wrapFinalizer();
wrapRenderer();
})();
