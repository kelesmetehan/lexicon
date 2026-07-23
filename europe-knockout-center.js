/* UEFA knockout center v11: keep league-phase and knockout records separate. */
const LL_V11_EURO_STAGES=['playoff','r16','qf','sf','final'];

function llV11EuroStageLabel(stage){
  return LL_EURO_KNOCKOUT_LABELS[stage]||stage;
}

function llV11EuropeKnockoutStore(state){
  if(!state.europeKnockouts||Number(state.europeKnockouts.season)!==Number(state.season)){
    state.europeKnockouts={season:state.season,competitions:{}};
  }
  if(!state.europeKnockouts.competitions||typeof state.europeKnockouts.competitions!=='object'){
    state.europeKnockouts.competitions={};
  }
  return state.europeKnockouts;
}

function llV11CompetitionKnockout(state,type){
  const root=llV11EuropeKnockoutStore(state);
  if(!root.competitions[type])root.competitions[type]={stages:{}};
  return root.competitions[type];
}

function llV11TagLegacyPlayerKnockoutResults(state,type){
  const player=state.playerTeam,e=state.europe;
  const results=(state.results||[]).filter(result=>
    result.season===state.season&&
    result.competition===type&&
    result.league==='euro-knockout'&&
    result.userMatch&&
    (result.home===player||result.away===player)
  );
  const startsAtPlayoff=Number(e?.seedRank)>8||e?.phase==='playoff'||/play.?off/i.test(e?.status||'')||results.length>7;
  const firstIndex=startsAtPlayoff?0:1;
  results.forEach((result,index)=>{
    const stageIndex=Math.min(LL_V11_EURO_STAGES.length-1,firstIndex+Math.floor(index/2));
    const stage=LL_V11_EURO_STAGES[stageIndex];
    if(!LL_V11_EURO_STAGES.includes(result.euroStage))result.euroStage=stage;
    if(!Number.isInteger(Number(result.euroLeg)))result.euroLeg=result.euroStage==='final'?1:(index%2)+1;
  });
  return results;
}

function llV11PlayerKnockoutResults(type,stage){
  return llV11TagLegacyPlayerKnockoutResults(lexLeague.state,type)
    .filter(result=>result.euroStage===stage)
    .sort((a,b)=>(Number(a.euroLeg)||0)-(Number(b.euroLeg)||0));
}

function llV11UniqueTeams(list){
  return [...new Set((list||[]).filter(Boolean))];
}

function llV11PreviousStage(stage){
  const index=LL_V11_EURO_STAGES.indexOf(stage);
  return index>0?LL_V11_EURO_STAGES[index-1]:null;
}

function llV11StagePool(type,stage,competition){
  const rows=llV2SortEuropeTable(type).map(row=>row.team);
  const previous=llV11PreviousStage(stage);
  const previousWinners=previous?(competition.stages[previous]?.pairs||[]).map(pair=>pair.winner).filter(Boolean):[];
  if(stage==='playoff')return rows.slice(8,24);
  if(stage==='r16'){
    return llV11UniqueTeams([
      ...rows.slice(0,8),
      ...(previousWinners.length>=8?previousWinners:rows.slice(8,16))
    ]).slice(0,16);
  }
  const fallbackCount=stage==='qf'?8:stage==='sf'?4:2;
  return llV11UniqueTeams(previousWinners.length>=fallbackCount?previousWinners:rows.slice(0,fallbackCount)).slice(0,fallbackCount);
}

function llV11StageOpponent(type,stage){
  const state=lexLeague.state,e=state.europe;
  const result=llV11PlayerKnockoutResults(type,stage)[0];
  if(e?.type===type&&e?.tie?.stage===stage&&e.tie.opponent)return e.tie.opponent;
  if(result)return result.home===state.playerTeam?result.away:result.home;
  return null;
}

function llV11EnsureKnockoutStage(type,stage){
  const state=lexLeague.state,competition=llV11CompetitionKnockout(state,type);
  if(competition.stages[stage])return competition.stages[stage];
  const e=state.europe,playerResults=llV11PlayerKnockoutResults(type,stage);
  const current=e?.type===type&&e?.phase===stage,opponent=llV11StageOpponent(type,stage);
  if(!current&&!playerResults.length)return null;
  let pool=llV11StagePool(type,stage,competition),pairs=[];
  if(opponent){
    const first=playerResults[0],a=first?.home||state.playerTeam,b=first?.away||opponent;
    pairs.push({id:`${stage}-player`,stage,a,b,legs:[],winner:null});
    pool=pool.filter(team=>team!==state.playerTeam&&team!==opponent);
  }
  pool=llV11UniqueTeams(pool);
  while(pool.length>1){
    const a=pool.shift(),b=pool.pop();
    pairs.push({id:`${stage}-${pairs.length+1}`,stage,a,b,legs:[],winner:null});
  }
  competition.stages[stage]={stage,pairs,complete:false};
  return competition.stages[stage];
}

function llV11PlayerPair(stageData,player=lexLeague.state.playerTeam){
  return stageData?.pairs?.find(pair=>pair.a===player||pair.b===player)||null;
}

function llV11PairTotals(pair){
  const totals={[pair.a]:0,[pair.b]:0};
  (pair.legs||[]).forEach(leg=>{
    totals[leg.home]=(totals[leg.home]||0)+Number(leg.homeGoals||0);
    totals[leg.away]=(totals[leg.away]||0)+Number(leg.awayGoals||0);
  });
  return totals;
}

function llV11ResolvePair(pair,stage){
  const expected=stage==='final'?1:2;
  if((pair.legs||[]).filter(Boolean).length<expected)return null;
  const totals=llV11PairTotals(pair),a=totals[pair.a]||0,b=totals[pair.b]||0;
  if(a!==b)return a>b?pair.a:pair.b;
  return Math.random()<.5?pair.a:pair.b;
}

function llV11ImportPlayerLegs(type,stage,stageData){
  const pair=llV11PlayerPair(stageData);
  if(!pair)return;
  llV11PlayerKnockoutResults(type,stage).forEach((result,index)=>{
    const leg=Math.max(1,Number(result.euroLeg)||index+1);
    pair.legs[leg-1]={
      home:result.home,
      away:result.away,
      homeGoals:Number(result.homeGoals)||0,
      awayGoals:Number(result.awayGoals)||0,
      userMatch:true
    };
  });
}

function llV11InferPlayerWinner(type,stage,pair){
  const state=lexLeague.state,e=state.europe,expected=stage==='final'?1:2;
  if(!pair||(pair.legs||[]).filter(Boolean).length<expected)return null;
  if(e?.type===type){
    if(e.phase==='winner')return state.playerTeam;
    const lastResult=llV11TagLegacyPlayerKnockoutResults(state,type).slice(-1)[0];
    if(e.phase==='eliminated'&&lastResult?.euroStage===stage){
      return pair.a===state.playerTeam?pair.b:pair.a;
    }
    const currentIndex=LL_V11_EURO_STAGES.indexOf(e.phase);
    const stageIndex=LL_V11_EURO_STAGES.indexOf(stage);
    if(currentIndex>stageIndex)return state.playerTeam;
  }
  return llV11ResolvePair(pair,stage);
}

function llV11SimulateOtherKnockoutLegs(stageData,stage,playedLegs){
  const state=lexLeague.state,expected=stage==='final'?1:2,target=Math.min(expected,playedLegs);
  (stageData?.pairs||[]).forEach(pair=>{
    if(pair.a===state.playerTeam||pair.b===state.playerTeam)return;
    for(let index=(pair.legs||[]).filter(Boolean).length;index<target;index++){
      const home=stage==='final'||index===0?pair.a:pair.b;
      const away=home===pair.a?pair.b:pair.a;
      const score=llV2SimpleEuropeScore(home,away);
      pair.legs[index]={home,away,homeGoals:score.homeGoals,awayGoals:score.awayGoals,userMatch:false};
    }
    if(!pair.winner)pair.winner=llV11ResolvePair(pair,stage);
  });
}

function llV11SyncEuropeKnockout(type){
  const state=lexLeague.state;
  if(!state||!['ucl','uel','uecl'].includes(type))return null;
  const results=llV11TagLegacyPlayerKnockoutResults(state,type),e=state.europe;
  const stages=llV11UniqueTeams([
    ...results.map(result=>result.euroStage),
    ...(e?.type===type&&LL_V11_EURO_STAGES.includes(e.phase)?[e.phase]:[])
  ]);
  stages.sort((a,b)=>LL_V11_EURO_STAGES.indexOf(a)-LL_V11_EURO_STAGES.indexOf(b)).forEach(stage=>{
    const stageData=llV11EnsureKnockoutStage(type,stage);
    if(!stageData)return;
    llV11ImportPlayerLegs(type,stage,stageData);
    const playerPair=llV11PlayerPair(stageData);
    const playerWinner=llV11InferPlayerWinner(type,stage,playerPair);
    if(playerPair&&playerWinner)playerPair.winner=playerWinner;
    const playedLegs=Math.max(0,...llV11PlayerKnockoutResults(type,stage).map(result=>Number(result.euroLeg)||0));
    llV11SimulateOtherKnockoutLegs(stageData,stage,playedLegs);
    stageData.complete=stageData.pairs.length>0&&stageData.pairs.every(pair=>!!pair.winner);
  });
  return llV11CompetitionKnockout(state,type);
}

function llV11KnockoutPairHtml(pair,stage){
  const expected=stage==='final'?1:2,rows=[];
  for(let index=0;index<expected;index++){
    const leg=pair.legs?.[index];
    const home=leg?.home||(stage==='final'||index===0?pair.a:pair.b);
    const away=leg?.away||(home===pair.a?pair.b:pair.a);
    rows.push(`<div class="ll-muted" style="padding:7px 4px 3px">${stage==='final'?'Final':`${index+1}. maç`}</div>${llV2FixtureRow(home,away,leg||null)}`);
  }
  const totals=llV11PairTotals(pair),played=(pair.legs||[]).filter(Boolean).length;
  const summary=pair.winner
    ?`Toplam ${totals[pair.a]||0}-${totals[pair.b]||0} · ${llEscape(pair.winner)} ${stage==='final'?'kupayı kazandı':'tur atladı'}`
    :played
      ?`Toplam ${totals[pair.a]||0}-${totals[pair.b]||0} · Eşleşme devam ediyor`
      :'Henüz oynanmadı';
  return `<div style="padding:5px 0 12px;border-bottom:1px solid rgba(255,255,255,.06)">${rows.join('')}<div class="ll-muted" style="padding:7px 4px 0">${summary}</div></div>`;
}

llV2EuropePlayerResult=function(type,roundOrStage){
  const stage=typeof roundOrStage==='string'?roundOrStage:LL_V11_EURO_STAGES[Number(roundOrStage)];
  return stage?llV11PlayerKnockoutResults(type,stage)[0]||null:null;
};

llV2EuropeRoadHtml=function(type){
  const state=lexLeague.state,e=state.europe,player=state.playerTeam;
  const competition=llV11SyncEuropeKnockout(type);
  return `<div class="ll-round-list">${LL_V11_EURO_STAGES.map(stage=>{
    const stageData=competition?.stages?.[stage],pair=llV11PlayerPair(stageData,player);
    const results=llV11PlayerKnockoutResults(type,stage);
    const current=e?.type===type&&e?.alive&&e.phase===stage;
    let status='Bekliyor',body='';
    if(pair?.winner===player)status=stage==='final'?'Kupa kazanıldı':'Tur geçildi';
    else if(pair?.winner)status='Elendi';
    else if(current)status=results.length?'Eşleşme devam ediyor':'Güncel tur';
    else if(results.length)status='Sonuç bekleniyor';
    else if(e?.type===type&&!e.alive)status='Ulaşılamadı';
    if(pair)body=llV11KnockoutPairHtml(pair,stage);
    else if(current&&state.pendingFixture?.competition===type){
      body=llV2FixtureRow(state.pendingFixture.home,state.pendingFixture.away,null);
    }else{
      body=`<div class="ll-muted" style="padding:8px 4px">${e?.type===type&&!e.alive?'Avrupa serüvenin sona erdiği için bu tura ulaşılmadı.':'Eşleşme önceki tur tamamlanınca belli olacak.'}</div>`;
    }
    const open=current||(e?.type===type&&!e.alive&&results.length>0);
    return `<details class="ll-round-card" ${open?'open':''}><summary><span>${llV11EuroStageLabel(stage)}</span><span class="ll-round-meta">${status}</span></summary><div class="ll-fixture-list">${body}</div></details>`;
  }).join('')}</div>`;
};

function llV11EuropeKnockoutFixturesHtml(type){
  const competition=llV11SyncEuropeKnockout(type);
  return `<div class="ll-card-title" style="margin:18px 0 8px">Eleme Aşaması · Tüm Takımlar</div><div class="ll-round-list">${LL_V11_EURO_STAGES.map(stage=>{
    const stageData=competition?.stages?.[stage],expected=stage==='final'?1:2;
    const played=(stageData?.pairs||[]).reduce((sum,pair)=>sum+(pair.legs||[]).filter(Boolean).length,0);
    const total=(stageData?.pairs?.length||0)*expected;
    const body=stageData?.pairs?.length
      ?stageData.pairs.map(pair=>llV11KnockoutPairHtml(pair,stage)).join('')
      :`<div class="ll-muted" style="padding:8px 4px">Eşleşmeler önceki tur tamamlanınca belli olacak.</div>`;
    return `<details class="ll-round-card" ${stageData&&!stageData.complete?'open':''}><summary><span>${llV11EuroStageLabel(stage)}</span><span class="ll-round-meta">${stageData?`${played}/${total} maç oynandı`:'Bekliyor'}</span></summary><div class="ll-fixture-list">${body}</div></details>`;
  }).join('')}</div>`;
}

llV2EuropeFixturesHtml=function(type){
  const state=lexLeague.state,table=llV2EnsureEuropeStandings(state)[type];
  const results=(state.results||[]).filter(result=>result.competition===type&&result.league==='euro-table');
  const resultMap=new Map(results.map(result=>[`${result.home}|${result.away}`,result]));
  const leagueHtml=table.fixtures.map((round,index)=>`<details ${index===Math.min(table.playedRounds,table.fixtures.length-1)?'open':''} style="margin:8px 0"><summary class="ll-btn" style="cursor:pointer">Lig Aşaması ${index+1}/${table.fixtures.length} · ${LL_EURO_LEAGUE_WEEKS[type][index]}. hafta</summary><div class="ll-cup-list">${round.map(fixture=>{
    const result=resultMap.get(`${fixture.home}|${fixture.away}`),score=result?`${result.homeGoals}-${result.awayGoals}`:'VS';
    return `<div class="ll-cup-row"><span>${llTeamLogo(fixture.home,'table')}${llEscape(fixture.home)}</span><b>${score}</b><span>${llTeamLogo(fixture.away,'table')}${llEscape(fixture.away)}</span></div>`;
  }).join('')}</div></details>`).join('');
  return `<div class="ll-card-title" style="margin:4px 0 8px">Lig Aşaması · Tüm Takımlar</div>${leagueHtml}${llV11EuropeKnockoutFixturesHtml(type)}`;
};

const llV11RecordMatchBase=llRecordMatch;
llRecordMatch=function(home,away,hg,ag,week,userMatch=false,competition='league',league=null){
  const e=lexLeague.state?.europe;
  const stage=league==='euro-knockout'&&LL_V11_EURO_STAGES.includes(e?.phase)?e.phase:null;
  const leg=stage==='final'?1:Number(e?.tie?.leg)||1;
  llV11RecordMatchBase(home,away,hg,ag,week,userMatch,competition,league);
  if(userMatch&&stage){
    const result=lexLeague.state.results[lexLeague.state.results.length-1];
    result.euroStage=stage;
    result.euroLeg=leg;
  }
};

const llV11FinishEuropeRoundBase=llV2FinishEuropeRound;
llV2FinishEuropeRound=function(winner){
  const state=lexLeague.state,e=state?.europe;
  const snapshot=e&&e.tie&&LL_V11_EURO_STAGES.includes(e.phase)
    ?{type:e.type,stage:e.phase,leg:Number(e.tie.leg)||1,opponent:e.tie.opponent}
    :null;
  llV11FinishEuropeRoundBase(winner);
  if(snapshot){
    const competition=llV11SyncEuropeKnockout(snapshot.type);
    const stageData=competition?.stages?.[snapshot.stage],pair=llV11PlayerPair(stageData);
    if(pair&&snapshot.leg>=(snapshot.stage==='final'?1:2)){
      pair.winner=state.europe?.phase==='eliminated'?snapshot.opponent:state.playerTeam;
      stageData.complete=stageData.pairs.every(item=>!!item.winner);
    }
  }
};

const llV11RenderCompetitionCenterBase=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=null){
  llV11RenderCompetitionCenterBase(tab,key);
  if(tab!=='europe')return;
  const type=['ucl','uel','uecl'].includes(key)?key:(lexLeague.state.europe?.type||'ucl');
  const metrics=llArea().querySelectorAll('.ll-cup-status .ll-metric');
  if(metrics[2]){
    const label=metrics[2].querySelector('span');
    if(label)label.textContent='Lig Aşaması';
  }
  llV11SyncEuropeKnockout(type);
  llSave();
};

const llV11RenderRoundSummaryBase=llRenderRoundSummary;
llRenderRoundSummary=function(completedWeek,lp,pg,og,comp='league',advanced=false){
  llV11RenderRoundSummaryBase(completedWeek,lp,pg,og,comp,advanced);
  if(!['ucl','uel','uecl'].includes(comp))return;
  const state=lexLeague.state;
  const result=[...(state.results||[])].reverse().find(item=>item.userMatch&&item.competition===comp);
  const stage=result?.league==='euro-knockout'?result.euroStage:null;
  if(!stage)return;
  const notice=llArea().querySelector('.ll-notice'),e=state.europe;
  let progress=e?.status||'Eleme maçı tamamlandı.';
  if(e?.phase==='winner')progress=`${llV2EuroLabel(comp)} kupasını kazandın.`;
  else if(e?.phase==='eliminated')progress=e.status||`${llV11EuroStageLabel(stage)} aşamasında elendin.`;
  else if(e?.phase===stage&&e?.tie?.leg===2)progress='İlk maç tamamlandı · Rövanş sıradaki Avrupa maçında oynanacak.';
  else if(LL_V11_EURO_STAGES.indexOf(e?.phase)>LL_V11_EURO_STAGES.indexOf(stage)){
    progress=`Turu geçtin · Sıradaki tur: ${llV11EuroStageLabel(e.phase)}.`;
  }
  if(notice)notice.innerHTML=`+${lp} LP<br><b>${llV11EuroStageLabel(stage)}:</b> ${llEscape(progress)}`;
};
