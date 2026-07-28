'use strict';

/*
 * Trophy / promotion cinematic integration.
 * Loaded after every league extension so it can observe the final runtime
 * versions of cup, Europe and season-finalization functions.
 */

var LL_TROPHY_CINEMATIC_VERSION=1;
var LL_TROPHY_CINEMATIC_MAX_HISTORY=120;

function llTrophyCinematicState(state=lexLeague?.state){
  if(!state)return null;
  const current=state.achievementCinematics;
  if(!current||typeof current!=='object'||Array.isArray(current)){
    state.achievementCinematics={version:LL_TROPHY_CINEMATIC_VERSION,queue:[],shown:[]};
  }
  const data=state.achievementCinematics;
  data.version=LL_TROPHY_CINEMATIC_VERSION;
  if(!Array.isArray(data.queue))data.queue=[];
  if(!Array.isArray(data.shown))data.shown=[];
  data.queue=data.queue.filter(item=>item&&typeof item==='object'&&item.key&&item.name);
  data.shown=[...new Set(data.shown.filter(Boolean))].slice(-LL_TROPHY_CINEMATIC_MAX_HISTORY);
  return data;
}

function llTrophyCinematicKey(event){
  return [
    Number(event?.season)||Number(lexLeague?.state?.season)||0,
    event?.kind||'trophy',
    event?.country||'',
    event?.tier||'',
    event?.name||'',
    event?.team||lexLeague?.state?.playerTeam||''
  ].join('|');
}

function llQueueTrophyAnimation(event){
  const state=lexLeague?.state,data=llTrophyCinematicState(state);
  if(!state||!data||!event?.name)return false;
  const normalized={
    season:Number(event.season)||Number(state.season)||1,
    kind:event.kind||'trophy',
    country:event.country||state.playerCountry||'TUR',
    tier:event.tier||null,
    title:event.title||'Şampiyon',
    name:String(event.name),
    subtitle:event.subtitle||'',
    team:event.team||state.playerTeam||'',
    icon:event.icon||'🏆'
  };
  normalized.key=event.key||llTrophyCinematicKey(normalized);
  if(data.shown.includes(normalized.key)||data.queue.some(item=>item.key===normalized.key))return false;
  data.queue.push(normalized);
  if(typeof llSave==='function')llSave();
  return true;
}

function llTrophyOtherCinematicOpen(){
  if(typeof document==='undefined')return true;
  return !!document.querySelector('#ll-trophy-cinematic,#ll-pack-cinematic,#ll-manager-signing,.ll-signing-cinematic');
}

function llTrophySpawnParticles(root,count,colors){
  const host=root?.querySelector('.ll-pack-particles');
  if(!host||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  for(let i=0;i<count;i++){
    const particle=document.createElement('i');
    const angle=Math.random()*Math.PI*2;
    const distance=90+Math.random()*330;
    particle.className='ll-pack-particle';
    particle.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
    particle.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
    particle.style.setProperty('--duration',`${.75+Math.random()*1.15}s`);
    particle.style.setProperty('--delay',`${Math.random()*.18}s`);
    particle.style.setProperty('--particle',colors[Math.floor(Math.random()*colors.length)]);
    host.appendChild(particle);
  }
}

function llShowTrophyAnimation(trophyName,options={}){
  if(typeof document==='undefined'||document.getElementById('ll-trophy-cinematic'))return false;
  const state=lexLeague?.state;
  const team=options.team||state?.playerTeam||'';
  const title=options.title||'Şampiyon';
  const subtitle=options.subtitle||`${team} kupayı kaldırdı!`;
  const icon=options.icon||'🏆';
  document.body.classList.add('ll-cinematic-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="ll-trophy-cinematic" id="ll-trophy-cinematic" role="dialog" aria-modal="true" aria-label="${llEscape(title)}"><div class="ll-pack-particles"></div><div class="ll-trophy-stage"><div class="ll-trophy-icon" aria-hidden="true">${llEscape(icon)}</div><div class="ll-trophy-title">${llEscape(title)}</div><div class="ll-trophy-name">${llEscape(trophyName)}</div><div class="ll-trophy-sub">${llEscape(subtitle)}</div><button class="ll-btn primary ll-trophy-continue" type="button" onclick="llCloseTrophyAnimation()">Devam Et</button></div></div>`);
  const root=document.getElementById('ll-trophy-cinematic');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
    llTrophySpawnParticles(root,70,['#facc15','#fde68a','#f59e0b','#ffffff','#fca5a5']);
    if(typeof navigator.vibrate==='function')navigator.vibrate([40,40,60]);
  }else root.style.animation='none';
  window.setTimeout(()=>root?.querySelector('.ll-trophy-continue')?.focus(),1050);
  return true;
}

function llCloseTrophyAnimation(){
  document.getElementById('ll-trophy-cinematic')?.remove();
  document.body?.classList.remove('ll-cinematic-open');
  window.setTimeout(llTryShowQueuedTrophyAnimation,180);
}

function llTryShowQueuedTrophyAnimation(){
  const state=lexLeague?.state,data=llTrophyCinematicState(state);
  if(!state||!data?.queue.length||llTrophyOtherCinematicOpen())return false;
  const event=data.queue.shift();
  data.shown.push(event.key);
  data.shown=data.shown.slice(-LL_TROPHY_CINEMATIC_MAX_HISTORY);
  if(typeof llSave==='function')llSave();
  return llShowTrophyAnimation(event.name,event);
}

function llScheduleTrophyAnimation(delay=70){
  if(typeof window==='undefined')return;
  window.setTimeout(llTryShowQueuedTrophyAnimation,Math.max(0,Number(delay)||0));
}

function llDomesticCupDisplayName(state){
  const country=state?.playerCountry||state?.cup?.country||'TUR';
  return state?.cup?.name||((typeof LL_DOMESTIC_CUP_NAMES==='object'&&LL_DOMESTIC_CUP_NAMES[country])||'Yerel Kupa');
}

function llEuropeTrophyDisplayName(type){
  return type==='ucl'?'UEFA Şampiyonlar Ligi':type==='uel'?'UEFA Avrupa Ligi':'UEFA Konferans Ligi';
}

function llLeagueDisplayName(country,tier){
  if(typeof llMLLeagueLabel==='function')return llMLLeagueLabel(country,tier);
  if(typeof llLeagueLabel==='function')return llLeagueLabel(tier==='tier1'?'super':'first');
  return tier==='tier1'?'1. Lig':'2. Lig';
}

/* Preserve queued cinematics across save repairs and imports. */
if(typeof llV2RepairState==='function'){
  const llTrophyRepairStateBase=llV2RepairState;
  llV2RepairState=function(state){
    const repaired=llTrophyRepairStateBase(state);
    llTrophyCinematicState(repaired);
    return repaired;
  };
}

/* Domestic cup final: queue after the actual final winner is committed. */
if(typeof llV2FinishCupRound==='function'){
  const llTrophyFinishCupRoundBase=llV2FinishCupRound;
  llV2FinishCupRound=function(winner){
    const state=lexLeague?.state;
    const previousWinner=state?.cup?.winner||null;
    const previousTrophyCount=Array.isArray(state?.trophies)?state.trophies.length:0;
    llTrophyFinishCupRoundBase(winner);
    if(!state||previousWinner===state.cup?.winner||state.cup?.winner!==state.playerTeam)return;
    const cupName=llDomesticCupDisplayName(state);
    const added=(state.trophies||[]).slice(previousTrophyCount);
    const record=added.find(item=>Number(item?.season)===Number(state.season)&&!/UEFA/i.test(item?.name||''));
    if(record){record.name=cupName;record.team=state.playerTeam;}
    llQueueTrophyAnimation({
      season:state.season,
      kind:'domestic-cup',
      country:state.playerCountry||state.cup?.country||'TUR',
      title:'Şampiyon',
      name:cupName,
      subtitle:`${state.playerTeam} kupayı kaldırdı!`,
      team:state.playerTeam
    });
  };
}

/* UEFA final: works with both normal and penalty-shootout knockout paths. */
if(typeof llV2FinishEuropeRound==='function'){
  const llTrophyFinishEuropeRoundBase=llV2FinishEuropeRound;
  llV2FinishEuropeRound=function(winner){
    const state=lexLeague?.state;
    const wasChampion=state?.europe?.phase==='winner'&&state.europe?.winner===state.playerTeam;
    const type=state?.europe?.type;
    llTrophyFinishEuropeRoundBase(winner);
    if(!state||wasChampion||state.europe?.phase!=='winner'||state.europe?.winner!==state.playerTeam)return;
    const trophyName=llEuropeTrophyDisplayName(type);
    llQueueTrophyAnimation({
      season:state.season,
      kind:'europe-cup',
      country:state.playerCountry||'TUR',
      title:'Avrupa Şampiyonu',
      name:trophyName,
      subtitle:`${state.playerTeam} Avrupa kupasını kaldırdı!`,
      team:state.playerTeam
    });
  };
}

/* Season final: league title and promotion are only known after tables close. */
if(typeof llV2FinalizeSeason==='function'){
  const llTrophyFinalizeSeasonBase=llV2FinalizeSeason;
  llV2FinalizeSeason=function(playoffWinner){
    const state=lexLeague?.state;
    const team=state?.playerTeam||'';
    const season=Number(state?.season)||1;
    const country=state?.playerCountry||'TUR';
    const competition=typeof llMLTeamCompetition==='function'?llMLTeamCompetition(team,state):null;
    const tier=competition?.tier||(typeof llTeamLeague==='function'&&llTeamLeague(team)==='super'?'tier1':'tier2');
    llTrophyFinalizeSeasonBase(playoffWinner);
    const summary=state?.lastSeasonSummary;
    if(!state||!summary)return;
    const countrySummary=summary.countrySummaries?.[country];
    const rows=tier==='tier1'
      ?(countrySummary?.tier1Rows||summary.tier1Rows||summary.superRows||[])
      :(countrySummary?.tier2Rows||summary.tier2Rows||summary.firstRows||[]);
    const position=rows.findIndex(row=>row?.team===team)+1;
    const promoted=(countrySummary?.promoted||summary.promoted||[]).includes(team);
    const leagueName=llLeagueDisplayName(country,tier);
    if(position===1){
      llQueueTrophyAnimation({
        season,
        kind:'league-title',
        country,
        tier,
        title:'Lig Şampiyonu',
        name:leagueName,
        subtitle:`${team} ligi zirvede tamamladı ve kupayı kaldırdı!`,
        team
      });
    }
    if(promoted){
      const targetLeague=llLeagueDisplayName(country,'tier1');
      llQueueTrophyAnimation({
        season,
        kind:'promotion',
        country,
        tier:'tier1',
        title:'Üst Lige Yükseldi',
        name:targetLeague,
        subtitle:`${team} bir üst lige yükseldi!`,
        team
      });
    }
    if(typeof llSave==='function')llSave();
    llScheduleTrophyAnimation(90);
  };
}

/* Show queued events after the underlying result screen has rendered. */
if(typeof llRenderRoundSummary==='function'){
  const llTrophyRenderRoundSummaryBase=llRenderRoundSummary;
  llRenderRoundSummary=function(...args){
    const result=llTrophyRenderRoundSummaryBase(...args);
    llScheduleTrophyAnimation(80);
    return result;
  };
}
if(typeof llRenderSeasonEnd==='function'){
  const llTrophyRenderSeasonEndBase=llRenderSeasonEnd;
  llRenderSeasonEnd=function(...args){
    const result=llTrophyRenderSeasonEndBase(...args);
    llScheduleTrophyAnimation(90);
    return result;
  };
}
if(typeof llRenderDashboard==='function'){
  const llTrophyRenderDashboardBase=llRenderDashboard;
  llRenderDashboard=function(...args){
    const result=llTrophyRenderDashboardBase(...args);
    llScheduleTrophyAnimation(90);
    return result;
  };
}

llTrophyCinematicState(lexLeague?.state);
