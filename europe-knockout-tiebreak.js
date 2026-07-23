/* UEFA aggregate-tie tiebreak v12: visible penalties instead of a hidden coin toss. */
function llV12PenaltyChance(state,teamName,opponentName){
  const teamStars=Number(state.teams?.[teamName]?.stars||llTeamDef(teamName)?.stars||3);
  const opponentStars=Number(state.teams?.[opponentName]?.stars||llTeamDef(opponentName)?.stars||3);
  return Math.max(.60,Math.min(.84,.72+(teamStars-opponentStars)*.03));
}

function llV12PenaltyShootout(state,player,opponent){
  const playerChance=llV12PenaltyChance(state,player,opponent);
  const opponentChance=llV12PenaltyChance(state,opponent,player);
  let playerPens=0,opponentPens=0;
  for(let kick=0;kick<5;kick++){
    if(Math.random()<playerChance)playerPens++;
    if(Math.random()<opponentChance)opponentPens++;
  }
  let suddenDeath=0;
  while(playerPens===opponentPens&&suddenDeath<20){
    const playerScored=Math.random()<playerChance;
    const opponentScored=Math.random()<opponentChance;
    if(playerScored)playerPens++;
    if(opponentScored)opponentPens++;
    suddenDeath++;
  }
  if(playerPens===opponentPens){
    if(Math.random()<.5)playerPens++;
    else opponentPens++;
  }
  return {
    player:playerPens,
    opponent:opponentPens,
    winner:playerPens>opponentPens?player:opponent,
    playerTeam:player,
    opponentTeam:opponent,
    suddenDeath:suddenDeath>0
  };
}

function llV12PenaltyText(shootout){
  if(!shootout)return '';
  return `Penaltılar ${Number(shootout.player)||0}-${Number(shootout.opponent)||0}`;
}

function llV12StorePenaltyResult(state,tie,last,shootout){
  tie.penalties=shootout;
  if(last){
    last.penaltyShootout={...shootout};
    last.knockoutWinner=shootout.winner;
  }
}

function llV12FinishKnockoutOutcome(state,e,tie,advanced,shootout=null){
  const player=state.playerTeam,stage=tie.stage;
  const scoreText=`Toplam ${tie.playerGoals}-${tie.opponentGoals}`;
  const penaltyText=shootout?` · ${llV12PenaltyText(shootout)}`:'';
  if(!advanced){
    e.alive=false;
    e.phase='eliminated';
    e.status=`${LL_EURO_KNOCKOUT_LABELS[stage]} aşamasında elendi · ${scoreText}${penaltyText}`;
    return;
  }
  if(stage==='final'){
    e.winner=player;
    e.alive=false;
    e.phase='winner';
    e.status=`Şampiyon · ${scoreText}${penaltyText}`;
    const trophy=e.type==='ucl'?'UEFA Şampiyonlar Ligi':e.type==='uel'?'UEFA Avrupa Ligi':'UEFA Konferans Ligi';
    if(!state.trophies.some(item=>item.season===state.season&&item.name===trophy)){
      state.trophies.push({season:state.season,name:trophy});
    }
    return;
  }
  const next=LL_V11_EURO_STAGES[LL_V11_EURO_STAGES.indexOf(stage)+1];
  e.phase=next;
  e.tie=null;
  e.alive=true;
  e.nextMatchWeek=Number(state.week)+1;
  e.status=`${LL_EURO_KNOCKOUT_LABELS[stage]} geçildi · ${scoreText}${penaltyText} · Sıradaki ${LL_EURO_KNOCKOUT_LABELS[next]}`;
}

llV2FinishEuropeRound=function(){
  const state=lexLeague.state,e=state.europe;
  if(!e)return;
  e.pending=null;
  if(e.phase==='league'){
    e.round++;
    if(e.round>=LL_EURO_LEAGUE_WEEKS[e.type].length)llV3EnterEuropeKnockout();
    return;
  }
  const tie=e.tie;
  if(!tie)return;
  const last=[...(state.results||[])].reverse().find(result=>
    result.userMatch&&
    result.competition===e.type&&
    result.league==='euro-knockout'
  );
  const playerGoals=last?(last.home===state.playerTeam?last.homeGoals:last.awayGoals):0;
  const opponentGoals=last?(last.home===state.playerTeam?last.awayGoals:last.homeGoals):0;
  tie.playerGoals+=Number(playerGoals)||0;
  tie.opponentGoals+=Number(opponentGoals)||0;
  if(tie.stage!=='final'&&tie.leg===1){
    tie.leg=2;
    e.nextMatchWeek=Number(state.week)+1;
    e.status=`${LL_EURO_KNOCKOUT_LABELS[tie.stage]} · İlk maç ${tie.playerGoals}-${tie.opponentGoals}`;
    llV11SyncEuropeKnockout(e.type);
    return;
  }
  let shootout=null;
  if(tie.playerGoals===tie.opponentGoals){
    shootout=llV12PenaltyShootout(state,state.playerTeam,tie.opponent);
    llV12StorePenaltyResult(state,tie,last,shootout);
  }
  const advanced=shootout
    ?shootout.winner===state.playerTeam
    :tie.playerGoals>tie.opponentGoals;
  if(last&&!shootout)last.knockoutWinner=advanced?state.playerTeam:tie.opponent;
  const type=e.type,stage=tie.stage,opponent=tie.opponent;
  llV12FinishKnockoutOutcome(state,e,tie,advanced,shootout);
  const competition=llV11SyncEuropeKnockout(type),stageData=competition?.stages?.[stage];
  const pair=llV11PlayerPair(stageData);
  if(pair){
    pair.winner=advanced?state.playerTeam:opponent;
    if(shootout)pair.penalties={...shootout};
    stageData.complete=stageData.pairs.every(item=>!!item.winner);
  }
};

function llV12RepairLegacyAggregateTie(state){
  const e=state?.europe,tie=e?.tie;
  if(!e||e.phase!=='eliminated'||!tie||tie.playerGoals!==tie.opponentGoals||tie.penalties)return false;
  const last=[...(state.results||[])].reverse().find(result=>
    result.userMatch&&
    result.competition===e.type&&
    result.league==='euro-knockout'
  );
  if(last?.penaltyShootout){
    tie.penalties={...last.penaltyShootout};
    return false;
  }
  const shootout=llV12PenaltyShootout(state,state.playerTeam,tie.opponent);
  llV12StorePenaltyResult(state,tie,last,shootout);
  llV12FinishKnockoutOutcome(state,e,tie,shootout.winner===state.playerTeam,shootout);
  return true;
}

const llV12RepairStateBase=llV2RepairState;
llV2RepairState=function(state){
  const repaired=llV12RepairStateBase(state);
  llV12RepairLegacyAggregateTie(repaired);
  return repaired;
};

const llV12ImportPlayerLegsBase=llV11ImportPlayerLegs;
llV11ImportPlayerLegs=function(type,stage,stageData){
  llV12ImportPlayerLegsBase(type,stage,stageData);
  const pair=llV11PlayerPair(stageData);
  const penaltyResult=llV11PlayerKnockoutResults(type,stage).find(result=>result.penaltyShootout);
  if(pair&&penaltyResult)pair.penalties={...penaltyResult.penaltyShootout};
};

llV11KnockoutPairHtml=function(pair,stage){
  const expected=stage==='final'?1:2,rows=[];
  for(let index=0;index<expected;index++){
    const leg=pair.legs?.[index];
    const home=leg?.home||(stage==='final'||index===0?pair.a:pair.b);
    const away=leg?.away||(home===pair.a?pair.b:pair.a);
    rows.push(`<div class="ll-muted" style="padding:7px 4px 3px">${stage==='final'?'Final':`${index+1}. maç`}</div>${llV2FixtureRow(home,away,leg||null)}`);
  }
  const totals=llV11PairTotals(pair),played=(pair.legs||[]).filter(Boolean).length;
  const penalties=pair.penalties?` · ${llV12PenaltyText(pair.penalties)}`:'';
  const summary=pair.winner
    ?`Toplam ${totals[pair.a]||0}-${totals[pair.b]||0}${penalties} · ${llEscape(pair.winner)} ${stage==='final'?'kupayı kazandı':'tur atladı'}`
    :played
      ?`Toplam ${totals[pair.a]||0}-${totals[pair.b]||0} · Eşleşme devam ediyor`
      :'Henüz oynanmadı';
  return `<div style="padding:5px 0 12px;border-bottom:1px solid rgba(255,255,255,.06)">${rows.join('')}<div class="ll-muted" style="padding:7px 4px 0">${summary}</div></div>`;
};

const llV12RenderCompetitionCenterBase=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=null){
  const repaired=llV12RepairLegacyAggregateTie(lexLeague.state);
  if(repaired)llSave();
  llV12RenderCompetitionCenterBase(tab,key);
};

const llV12RenderRoundSummaryBase=llRenderRoundSummary;
llRenderRoundSummary=function(completedWeek,lp,pg,og,comp='league',advanced=false){
  llV12RenderRoundSummaryBase(completedWeek,lp,pg,og,comp,advanced);
  if(!['ucl','uel','uecl'].includes(comp))return;
  const state=lexLeague.state;
  const result=[...(state.results||[])].reverse().find(item=>item.userMatch&&item.competition===comp);
  const stage=result?.league==='euro-knockout'?result.euroStage:null;
  if(!stage)return;
  const notice=llArea().querySelector('.ll-notice'),e=state.europe;
  let progress=e?.status||'Eleme maçı tamamlandı.';
  if(e?.phase===stage&&e?.tie?.leg===2){
    progress=`İlk maç tamamlandı · Toplam ${e.tie.playerGoals}-${e.tie.opponentGoals} · Rövanş sıradaki Avrupa maçında.`;
  }
  if(notice)notice.innerHTML=`+${lp} LP<br><b>${llV11EuroStageLabel(stage)}:</b> ${llEscape(progress)}`;
};
