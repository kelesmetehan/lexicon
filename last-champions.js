/* Last champions v13: persistent winners for every domestic and European competition. */
const LL_V13_COMPETITIONS=['super','first','cup','ucl','uel','uecl'];
const LL_V13_EURO_TYPES=['ucl','uel','uecl'];

function llV13Hash(value){
  let hash=2166136261;
  for(const character of String(value||'')){
    hash^=character.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function llV13CompetitionLabel(key){
  return key==='super'?'Süper Lig':
    key==='first'?'TFF 1. Lig':
    key==='cup'?'Ziraat Türkiye Kupası':
    key==='ucl'?'Şampiyonlar Ligi':
    key==='uel'?'Avrupa Ligi':'Konferans Ligi';
}

function llV13TrophyCompetition(name){
  const value=String(name||'').toLocaleLowerCase('tr');
  if(value.includes('şampiyonlar'))return 'ucl';
  if(value.includes('konferans'))return 'uecl';
  if(value.includes('avrupa ligi'))return 'uel';
  if(value.includes('türkiye kupası'))return 'cup';
  return null;
}

function llV13ManagerTeamForSeason(state,season){
  const move=(state.managerProfile?.history||[]).find(item=>Number(item.season)===Number(season));
  const archived=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(season));
  return move?.from||archived?.playerTeam||(Number(season)===Number(state.season)?state.playerTeam:null);
}

function llV13ChampionStore(state){
  if(!Array.isArray(state.competitionChampions))state.competitionChampions=[];
  state.competitionChampions=state.competitionChampions.filter(item=>
    item&&
    LL_V13_COMPETITIONS.includes(item.competition)&&
    Number(item.season)>0&&
    typeof item.team==='string'&&
    item.team.trim()
  );
  return state.competitionChampions;
}

function llV13RecordChampion(state,season,competition,team,source='season'){
  const value=String(team||'').trim(),number=Number(season);
  if(!state||!LL_V13_COMPETITIONS.includes(competition)||!value||!Number.isFinite(number)||number<1)return null;
  const store=llV13ChampionStore(state);
  const existing=store.find(item=>Number(item.season)===number&&item.competition===competition);
  const record={season:number,competition,team:value,source};
  if(existing)Object.assign(existing,record);
  else store.push(record);
  store.sort((a,b)=>Number(a.season)-Number(b.season)||LL_V13_COMPETITIONS.indexOf(a.competition)-LL_V13_COMPETITIONS.indexOf(b.competition));
  return existing||record;
}

function llV13LegacyTrophyWinner(state,season,type){
  const trophy=(state.trophies||[]).find(item=>
    Number(item.season)===Number(season)&&
    llV13TrophyCompetition(item.name)===type
  );
  if(!trophy)return null;
  return trophy.team||llV13ManagerTeamForSeason(state,season)||state.playerTeam||null;
}

function llV13EuropeanFinalWinner(state,season,type){
  const root=state.europeKnockouts;
  if(Number(root?.season)!==Number(season))return null;
  const final=root?.competitions?.[type]?.stages?.final;
  return final?.pairs?.find(pair=>pair?.winner)?.winner||null;
}

function llV13SimulatedEuropeanChampion(state,season,type,used=new Set()){
  const archive=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(season));
  const qualified=archive?.qualifications?.[type]||[];
  const foreign=(typeof UCL_TEAMS!=='undefined'?UCL_TEAMS:[]).map(team=>team?.name).filter(Boolean);
  const pool=[...new Set([...qualified,...foreign])].filter(team=>!used.has(team));
  if(!pool.length)return null;
  return [...pool].sort((a,b)=>{
    const starsA=Number(state.teams?.[a]?.stars||llTeamDef(a)?.stars||3);
    const starsB=Number(state.teams?.[b]?.stars||llTeamDef(b)?.stars||3);
    const scoreA=(llV13Hash(`${season}|${type}|${a}`)%100000)+starsA*18000;
    const scoreB=(llV13Hash(`${season}|${type}|${b}`)%100000)+starsB*18000;
    return scoreB-scoreA||a.localeCompare(b,'tr');
  })[0]||null;
}

function llV13CaptureEuropeanChampions(state,season,summary=null){
  const used=new Set();
  LL_V13_EURO_TYPES.forEach(type=>{
    const archived=summary?.champions?.[type]||
      (state.seasonHistory||[]).find(item=>Number(item.season)===Number(season))?.champions?.[type];
    const actual=llV13LegacyTrophyWinner(state,season,type)||
      llV13EuropeanFinalWinner(state,season,type)||
      archived;
    if(actual){
      llV13RecordChampion(state,season,type,actual,actual===archived?'archive':'played');
      used.add(actual);
    }
  });
  LL_V13_EURO_TYPES.forEach(type=>{
    if(llV13ChampionStore(state).some(item=>Number(item.season)===Number(season)&&item.competition===type))return;
    const simulated=llV13SimulatedEuropeanChampion(state,season,type,used);
    if(simulated){
      llV13RecordChampion(state,season,type,simulated,'legacy-simulation');
      used.add(simulated);
    }
  });
}

function llV13CaptureSeasonChampions(state,summary){
  if(!state||!summary)return;
  const season=Number(summary.season);
  llV13RecordChampion(state,season,'super',summary.superRows?.[0]?.team,'table');
  llV13RecordChampion(state,season,'first',summary.firstRows?.[0]?.team,'table');
  llV13RecordChampion(state,season,'cup',summary.cupWinner,'cup');
  llV13CaptureEuropeanChampions(state,season,summary);
  summary.champions=Object.fromEntries(LL_V13_COMPETITIONS.map(type=>[
    type,
    llV13ChampionStore(state).find(item=>Number(item.season)===season&&item.competition===type)?.team||null
  ]));
}

function llV13EnsureChampionHistory(state){
  if(!state)return state;
  llV13ChampionStore(state);
  [...(state.seasonHistory||[])].sort((a,b)=>Number(a.season)-Number(b.season)).forEach(entry=>{
    llV13CaptureSeasonChampions(state,entry);
    entry.champions=Object.fromEntries(LL_V13_COMPETITIONS.map(type=>[
      type,
      llV13ChampionStore(state).find(item=>Number(item.season)===Number(entry.season)&&item.competition===type)?.team||null
    ]));
  });
  if(state.cup?.winner)llV13RecordChampion(state,state.season,'cup',state.cup.winner,'cup');
  if(state.europe?.phase==='winner'&&state.europe?.winner&&LL_V13_EURO_TYPES.includes(state.europe.type)){
    llV13RecordChampion(state,state.season,state.europe.type,state.europe.winner,'played');
  }
  return state;
}

function llV13LastChampion(state,competition){
  return [...llV13ChampionStore(state)]
    .filter(item=>item.competition===competition&&Number(item.season)<=Number(state.season))
    .sort((a,b)=>Number(b.season)-Number(a.season))[0]||null;
}

function llV13ChampionBadge(record){
  if(!record)return '<span class="ll-last-champion empty">Son şampiyon: Henüz belirlenmedi</span>';
  return `<span class="ll-last-champion" title="${llEscape(llV13CompetitionLabel(record.competition))} · Sezon ${Number(record.season)}">${llTeamLogo(record.team,'table')}<span>Son şampiyon: <b>${llEscape(record.team)}</b> · S${Number(record.season)}</span></span>`;
}

function llV13InjectChampionStyle(){
  if(typeof document==='undefined'||document.getElementById('ll-last-champion-style'))return;
  const style=document.createElement('style');
  style.id='ll-last-champion-style';
  style.textContent=`
    .ll-card-title.ll-with-last-champion{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .ll-last-champion{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(201,168,76,.38);border-radius:999px;background:rgba(201,168,76,.08);color:#e8d28a;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:500;letter-spacing:.01em;text-transform:none}
    .ll-last-champion .ll-team-logo,.ll-last-champion .ll-team-logo-fallback{width:20px;height:20px;object-fit:contain;flex:0 0 20px}
    .ll-last-champion.empty{color:var(--text3);border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.025)}
    @media(max-width:640px){.ll-card-title.ll-with-last-champion{align-items:flex-start;flex-direction:column}.ll-last-champion{max-width:100%;white-space:normal}}
  `;
  document.head.appendChild(style);
}

function llV13AddChampionToCenter(tab,key){
  const state=lexLeague.state;
  const competition=tab==='league'
    ?(key==='super'?'super':'first')
    :tab==='cup'
      ?'cup'
      :(['ucl','uel','uecl'].includes(key)?key:(state.europe?.type||'ucl'));
  const titles=[...llArea().querySelectorAll('.ll-card-title')];
  const target=tab==='league'
    ?titles.find(node=>/Puan Tablosu/i.test(node.textContent))
    :tab==='cup'
      ?titles.find(node=>/Tüm Turlar ve Eşleşmeler/i.test(node.textContent))
      :titles.find(node=>/Puan Durumu/i.test(node.textContent));
  if(!target)return;
  target.classList.add('ll-with-last-champion');
  target.insertAdjacentHTML('beforeend',llV13ChampionBadge(llV13LastChampion(state,competition)));
}

const llV13RepairStateBase=llV2RepairState;
llV2RepairState=function(state){
  return llV13EnsureChampionHistory(llV13RepairStateBase(state));
};

const llV13ArchiveSeasonBase=llV2ArchiveSeason;
llV2ArchiveSeason=function(state,summary){
  if(state&&summary)llV13CaptureSeasonChampions(state,summary);
  const entry=llV13ArchiveSeasonBase(state,summary);
  if(entry&&summary?.champions)entry.champions={...summary.champions};
  return entry;
};

const llV13FinalizeSeasonBase=llV2FinalizeSeason;
llV2FinalizeSeason=function(playoffWinner){
  llV13FinalizeSeasonBase(playoffWinner);
  const state=lexLeague.state,summary=state?.lastSeasonSummary;
  if(state&&summary){
    llV13CaptureSeasonChampions(state,summary);
    llV2ArchiveSeason(state,summary);
    llSave();
  }
};

const llV13FinishCupRoundBase=llV2FinishCupRound;
llV2FinishCupRound=function(winner){
  llV13FinishCupRoundBase(winner);
  const state=lexLeague.state;
  if(state?.cup?.winner){
    llV13RecordChampion(state,state.season,'cup',state.cup.winner,'cup');
    const trophy=(state.trophies||[]).find(item=>Number(item.season)===Number(state.season)&&llV13TrophyCompetition(item.name)==='cup');
    if(trophy&&!trophy.team)trophy.team=state.playerTeam;
    llSave();
  }
};

const llV13FinishEuropeRoundBase=llV2FinishEuropeRound;
llV2FinishEuropeRound=function(winner){
  const state=lexLeague.state,type=state?.europe?.type;
  llV13FinishEuropeRoundBase(winner);
  if(state?.europe?.phase==='winner'&&state.europe.winner&&LL_V13_EURO_TYPES.includes(type)){
    llV13RecordChampion(state,state.season,type,state.europe.winner,'played');
    const trophy=(state.trophies||[]).find(item=>Number(item.season)===Number(state.season)&&llV13TrophyCompetition(item.name)===type);
    if(trophy&&!trophy.team)trophy.team=state.playerTeam;
    llSave();
  }
};

const llV13RenderCompetitionCenterBase=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=null){
  llV13EnsureChampionHistory(lexLeague.state);
  llV13RenderCompetitionCenterBase(tab,key);
  llV13InjectChampionStyle();
  llV13AddChampionToCenter(tab,key);
  llSave();
};

