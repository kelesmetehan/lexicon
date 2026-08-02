'use strict';

/*
 * Trophy / promotion / elimination cinematic integration.
 * Loaded after every league extension so it can observe the final runtime
 * versions of cup, Europe and season-finalization functions.
 */

var LL_TROPHY_CINEMATIC_VERSION=2;
var LL_TROPHY_CINEMATIC_MAX_HISTORY=140;

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
    detail:event.detail||'',
    team:event.team||state.playerTeam||'',
    icon:event.icon||'🏆',
    theme:event.theme||'celebration'
  };
  normalized.key=event.key||llTrophyCinematicKey(normalized);
  if(data.shown.includes(normalized.key)||data.queue.some(item=>item.key===normalized.key))return false;
  data.queue.push(normalized);
  if(typeof llSave==='function')llSave();
  return true;
}

function llTrophyOtherCinematicOpen(){
  if(typeof document==='undefined')return true;
  return !!document.querySelector('#ll-trophy-cinematic,#ll-pack-cinematic,#ll-manager-signing,.ll-signing-cinematic,#ll-penalty-shootout');
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
  const detail=options.detail||'';
  const icon=options.icon||'🏆';
  const theme=options.theme==='elimination'?'elimination':'celebration';
  const className=theme==='elimination'?'ll-trophy-cinematic loss':'ll-trophy-cinematic';
  const particleColors=theme==='elimination'
    ?['#f87171','#fecaca','#e2e8f0','#fca5a5','#f8fafc']
    :['#facc15','#fde68a','#f59e0b','#ffffff','#fca5a5'];
  document.body.classList.add('ll-cinematic-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="${className}" id="ll-trophy-cinematic" role="dialog" aria-modal="true" aria-label="${llEscape(title)}"><div class="ll-pack-particles"></div><div class="ll-trophy-stage"><div class="ll-trophy-icon" aria-hidden="true">${llEscape(icon)}</div><div class="ll-trophy-title">${llEscape(title)}</div><div class="ll-trophy-name">${llEscape(trophyName)}</div><div class="ll-trophy-sub">${llEscape(subtitle)}</div>${detail?`<div class="ll-trophy-detail">${llEscape(detail)}</div>`:''}<button class="ll-btn primary ll-trophy-continue" type="button" onclick="llCloseTrophyAnimation()">Devam Et</button></div></div>`);
  const root=document.getElementById('ll-trophy-cinematic');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
    /* Elenme anı sade kalır; parçacıklar yalnızca kutlamada kullanılır. */
    if(theme!=='elimination')llTrophySpawnParticles(root,70,particleColors);
    if(typeof navigator.vibrate==='function')navigator.vibrate(theme==='elimination'?[70,40,70]:[40,40,60]);
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

function llEuroKnockoutStageLabel(stage){
  if(typeof LL_EURO_KNOCKOUT_LABELS==='object'&&LL_EURO_KNOCKOUT_LABELS?.[stage])return LL_EURO_KNOCKOUT_LABELS[stage];
  return stage==='r16'?'Son 16':stage==='qf'?'Çeyrek Final':stage==='sf'?'Yarı Final':stage==='final'?'Final':stage==='playoff'?'Eleme Turu Play-Off':'Eleme Turu';
}

function llPenaltyShootoutText(shootout){
  if(!shootout)return '';
  const player=Number(shootout.player)||0;
  const opponent=Number(shootout.opponent)||0;
  return `Penaltılar ${player}-${opponent}`;
}

function llQueueDomesticCupElimination(state,roundLabel){
  if(!state?.playerTeam)return false;
  const cupName=llDomesticCupDisplayName(state);
  return llQueueTrophyAnimation({
    season:state.season,
    kind:'domestic-cup-elimination',
    country:state.playerCountry||state.cup?.country||'TUR',
    title:'Kupadan Elendi',
    name:cupName,
    subtitle:`${state.playerTeam} ${roundLabel} aşamasında turnuvaya veda etti.`,
    detail:roundLabel,
    team:state.playerTeam,
    icon:'💔',
    theme:'elimination'
  });
}

function llQueueEuropeLeagueElimination(state,type,rank){
  if(!state?.playerTeam||!type||!rank)return false;
  const trophyName=llEuropeTrophyDisplayName(type);
  return llQueueTrophyAnimation({
    season:state.season,
    kind:'europe-league-elimination',
    country:state.playerCountry||'TUR',
    title:'Avrupa Defteri Kapandı',
    name:trophyName,
    subtitle:`${state.playerTeam} lig aşamasını ${rank}. sırada bitirdi ve ilk 24 dışında kaldı.`,
    detail:`Lig aşaması · ${rank}. sıra`,
    team:state.playerTeam,
    icon:'💔',
    theme:'elimination'
  });
}

function llQueueEuropeKnockoutElimination(state,type,stage,opponent,scoreText,shootout){
  if(!state?.playerTeam||!type||!stage)return false;
  const trophyName=llEuropeTrophyDisplayName(type);
  const stageLabel=llEuroKnockoutStageLabel(stage);
  const penaltyText=llPenaltyShootoutText(shootout);
  const detail=[scoreText,penaltyText].filter(Boolean).join(' · ');
  return llQueueTrophyAnimation({
    season:state.season,
    kind:'europe-knockout-elimination',
    country:state.playerCountry||'TUR',
    title:"Avrupa'dan Elendi",
    name:trophyName,
    subtitle:`${state.playerTeam}, ${stageLabel} aşamasında${opponent?` ${opponent} karşısında`:''} elendi.`,
    detail:detail||stageLabel,
    team:state.playerTeam,
    icon:'💔',
    theme:'elimination'
  });
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

/* Domestic cup final / elimination: queue after the actual round result is committed. */
if(typeof llV2FinishCupRound==='function'){
  const llTrophyFinishCupRoundBase=llV2FinishCupRound;
  llV2FinishCupRound=function(winner){
    const state=lexLeague?.state;
    const previousWinner=state?.cup?.winner||null;
    const previousTrophyCount=Array.isArray(state?.trophies)?state.trophies.length:0;
    const roundIndex=Number(state?.cup?.round||0);
    const roundLabel=state?.pendingFixture?.roundLabel||((typeof LL_CUP_ROUNDS!=='undefined'&&LL_CUP_ROUNDS?.[roundIndex])||'Tur');
    const playerTeam=state?.playerTeam||'';
    llTrophyFinishCupRoundBase(winner);
    if(!state)return;
    if(previousWinner!==state.cup?.winner&&state.cup?.winner===playerTeam){
      const cupName=llDomesticCupDisplayName(state);
      const added=(state.trophies||[]).slice(previousTrophyCount);
      const record=added.find(item=>Number(item?.season)===Number(state.season)&&!/UEFA/i.test(item?.name||''));
      if(record){record.name=cupName;record.team=playerTeam;}
      llQueueTrophyAnimation({
        season:state.season,
        kind:'domestic-cup',
        country:state.playerCountry||state.cup?.country||'TUR',
        title:'Şampiyon',
        name:cupName,
        subtitle:`${playerTeam} kupayı kaldırdı!`,
        team:playerTeam
      });
      return;
    }
    if(winner!==playerTeam&&!state.cup?.alive){
      llQueueDomesticCupElimination(state,roundLabel);
    }
  };
}

/* UEFA final / elimination: works with both normal and penalty-shootout knockout paths. */
if(typeof llV2FinishEuropeRound==='function'){
  const llTrophyFinishEuropeRoundBase=llV2FinishEuropeRound;
  llV2FinishEuropeRound=function(winner){
    const state=lexLeague?.state;
    const before=state?.europe?{
      phase:state.europe.phase,
      type:state.europe.type,
      status:state.europe.status,
      leagueRank:state.europe.leagueRank,
      tie:state.europe.tie?{
        stage:state.europe.tie.stage,
        opponent:state.europe.tie.opponent,
        playerGoals:Number(state.europe.tie.playerGoals)||0,
        opponentGoals:Number(state.europe.tie.opponentGoals)||0,
        penalties:state.europe.tie.penalties?{...state.europe.tie.penalties}:null
      }:null
    }:null;
    const wasChampion=state?.europe?.phase==='winner'&&state.europe?.winner===state.playerTeam;
    llTrophyFinishEuropeRoundBase(winner);
    if(!state)return;
    const after=state.europe;
    if(!before||!after)return;
    if(!wasChampion&&after.phase==='winner'&&after.winner===state.playerTeam){
      const trophyName=llEuropeTrophyDisplayName(before.type||after.type);
      llQueueTrophyAnimation({
        season:state.season,
        kind:'europe-cup',
        country:state.playerCountry||'TUR',
        title:'Avrupa Şampiyonu',
        name:trophyName,
        subtitle:`${state.playerTeam} Avrupa kupasını kaldırdı!`,
        team:state.playerTeam
      });
      return;
    }
    if(before.phase==='eliminated'||after.phase!=='eliminated')return;
    if(before.phase==='league'){
      const rank=Number(after.leagueRank)||Number(before.leagueRank)||0;
      if(rank>=25)llQueueEuropeLeagueElimination(state,after.type||before.type,rank);
      return;
    }
    const stage=(before.tie?.stage)||before.phase;
    if(!['playoff','r16','qf','sf','final'].includes(stage))return;
    const tie=after.tie||before.tie||{};
    const scoreText=`Toplam ${Number(tie.playerGoals)||0}-${Number(tie.opponentGoals)||0}`;
    llQueueEuropeKnockoutElimination(state,after.type||before.type,stage,tie.opponent||'',scoreText,tie.penalties||null);
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

/* V3: dedicated relegation cinematic, separate from cup/Europe elimination. */
LL_TROPHY_CINEMATIC_VERSION=3;
function llShowRelegationAnimation(fromLeagueLabel,detail,options={}){
  if(typeof document==='undefined'||document.getElementById('ll-trophy-cinematic'))return false;
  const state=lexLeague?.state,team=options.team||state?.playerTeam||'';
  const title=options.title||'Küme Düştün';
  const subtitle=options.subtitle||`${team} sezonu küme düşme hattında tamamladı.`;
  document.body.classList.add('ll-cinematic-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="ll-relegation-cinematic" id="ll-trophy-cinematic" role="dialog" aria-modal="true" aria-label="${llEscape(title)}"><div class="ll-relegation-stage"><div class="ll-relegation-icon" aria-hidden="true">⬇️</div><div class="ll-relegation-title">${llEscape(title)}</div><div class="ll-relegation-name">${llEscape(fromLeagueLabel)}</div><div class="ll-relegation-sub">${llEscape(subtitle)}</div>${detail?`<div class="ll-relegation-detail">${llEscape(detail)}</div>`:''}<button class="ll-btn ll-relegation-continue" type="button" onclick="llCloseTrophyAnimation()">Devam Et</button></div></div>`);
  const root=document.getElementById('ll-trophy-cinematic');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduced&&typeof navigator.vibrate==='function')navigator.vibrate([70,40,70]);
  if(reduced)root.style.animation='none';
  window.setTimeout(()=>root?.querySelector('.ll-relegation-continue')?.focus(),1000);
  return true;
}
const llTrophyShowAnimationV3Base=llShowTrophyAnimation;
llShowTrophyAnimation=function(trophyName,options={}){
  if(options?.theme==='relegation')return llShowRelegationAnimation(trophyName,options.detail,options);
  return llTrophyShowAnimationV3Base(trophyName,options);
};
function llQueueSeasonRelegationIfNeeded(state=lexLeague?.state){
  if(!state?.seasonEnded||!state?.playerTeam)return false;
  const summary=state.lastSeasonSummary||{},team=state.playerTeam,country=state.playerCountry||summary.country||'TUR';
  const competition=typeof llMLTeamCompetition==='function'?llMLTeamCompetition(team,state):null;
  const tier=competition?.tier||(summary.playerLeague==='super'?'tier1':summary.playerLeague==='first'?'tier2':null);
  const countrySummary=summary.countrySummaries?.[country]||summary;
  const rows=tier==='tier1'?(countrySummary.tier1Rows||summary.tier1Rows||summary.superRows||[]):(countrySummary.tier2Rows||summary.tier2Rows||summary.firstRows||[]);
  const position=rows.findIndex(row=>row?.team===team)+1;
  const relegated=(countrySummary.relegated||summary.relegated||[]).includes(team);
  const careerDrop=Boolean(state.careerEnded&&tier==='tier2');
  if(!relegated&&!careerDrop)return false;
  const leagueName=llLeagueDisplayName(country,tier||'tier1'),nextLeague=llLeagueDisplayName(country,'tier2');
  return llQueueTrophyAnimation({season:state.season,kind:careerDrop?'career-relegation':'league-relegation',country,tier:tier||'tier1',title:careerDrop?'Kariyer Sona Erdi':'Küme Düştün',name:leagueName,subtitle:careerDrop?`${team} alt lige düştü.`:`${team} sezonu küme düşme hattında tamamladı.`,detail:careerDrop?`${position||'—'}. sırada tamamladın · Kulüp oynanmayan alt lige düştü; kariyerin sona erdi.`:`${position||'—'}. sırada tamamladın · ${nextLeague} ligine düştün.`,team,icon:'⬇️',theme:'relegation'});
}
if(typeof llV2FinalizeSeason==='function'){
  const llTrophyFinalizeSeasonV3Base=llV2FinalizeSeason;
  llV2FinalizeSeason=function(...args){const result=llTrophyFinalizeSeasonV3Base(...args);llQueueSeasonRelegationIfNeeded(lexLeague?.state);if(typeof llSave==='function')llSave();return result;};
}
if(typeof llRenderSeasonEnd==='function'){
  const llTrophyRenderSeasonEndV3Base=llRenderSeasonEnd;
  llRenderSeasonEnd=function(...args){const result=llTrophyRenderSeasonEndV3Base(...args);llQueueSeasonRelegationIfNeeded(lexLeague?.state);llScheduleTrophyAnimation(90);return result;};
}
llTrophyCinematicState(lexLeague?.state);