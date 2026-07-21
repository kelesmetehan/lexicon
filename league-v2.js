/* Lexicon League V2 — two divisions, promotion/relegation and cups */
const LL_V2_SAVE_KEY='lexicon_league_save_v2';
const LL_FIRST_TEAMS=[
  {name:'Antalyaspor',short:'ANT',stars:3,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/589.png'},
  {name:'Bursaspor',short:'BUR',stars:3,icon:'🐊',logo:'https://tmssl.akamaized.net/images/wappen/head/20.png'},
  {name:'Bodrum FK',short:'BDR',stars:3,icon:'🌊',logo:'https://tmssl.akamaized.net/images/wappen/head/44006.png'},
  {name:'Kayserispor',short:'KAY',stars:3,icon:'🟡',logo:'https://tmssl.akamaized.net/images/wappen/head/3205.png'},
  {name:'Sivasspor',short:'SİV',stars:3,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/2381.png'},
  {name:'Fatih Karagümrük',short:'FKG',stars:3,icon:'⚫',logo:'https://tmssl.akamaized.net/images/wappen/head/6646.png'},
  {name:'Manisa FK',short:'MAN',stars:2,icon:'⚫',logo:'https://tmssl.akamaized.net/images/wappen/head/48913.png'},
  {name:'Iğdır FK',short:'IĞD',stars:2,icon:'🟢',logo:'https://tmssl.akamaized.net/images/wappen/head/74664.png'},
  {name:'İstanbulspor',short:'İST',stars:2,icon:'🟡',logo:'https://tmssl.akamaized.net/images/wappen/head/924.png'},
  {name:'Bandırmaspor',short:'BAN',stars:2,icon:'🟣',logo:'https://tmssl.akamaized.net/images/wappen/head/20760.png'},
  {name:'Batman Petrolspor',short:'BAT',stars:2,icon:'🟢',logo:'https://tmssl.akamaized.net/images/wappen/head/3211.png'},
  {name:'Pendikspor',short:'PEN',stars:2,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/3209.png'},
  {name:'Van Spor FK',short:'VAN',stars:2,icon:'🔵',logo:'https://tmssl.akamaized.net/images/wappen/head/3173.png'},
  {name:'Ankara Keçiörengücü',short:'KEÇ',stars:2,icon:'🟣',logo:'https://tmssl.akamaized.net/images/wappen/head/12388.png'},
  {name:'Sarıyerspor',short:'SAR',stars:1,icon:'⚪',logo:'https://tmssl.akamaized.net/images/wappen/head/518.png'},
  {name:'Esenler Erokspor',short:'ERO',stars:1,icon:'🟢',logo:'https://tmssl.akamaized.net/images/wappen/head/45269.png'},
  {name:'Ümraniyespor',short:'ÜMR',stars:1,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/24245.png'},
  {name:'Mardin 1969 Spor',short:'MAR',stars:1,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/68377.png'},
  {name:'Muğlaspor',short:'MUĞ',stars:1,icon:'🟢',logo:'https://tmssl.akamaized.net/images/wappen/head/2378.png'},
  {name:'Boluspor',short:'BOL',stars:2,icon:'🔴',logo:'https://tmssl.akamaized.net/images/wappen/head/3207.png'}
];
const LL_SUPER_STAR_MAP={Galatasaray:5,'Fenerbahçe':5,'Beşiktaş':4,Trabzonspor:4,'Başakşehir':3,Konyaspor:3,Alanyaspor:3,'Kasımpaşa':3,'Göztepe':3,Samsunspor:3,'Ç. Rizespor':3,Eyüpspor:3,'Amed SK':2,'Çorum FK':2,'Erzurumspor FK':2,'Gaziantep FK':2,'Gençlerbirliği':2,Kocaelispor:2};
LL_TEAMS.forEach(t=>t.stars=LL_SUPER_STAR_MAP[t.name]||2);
const LL_ALL_TEAMS=[...LL_TEAMS,...LL_FIRST_TEAMS];
const LL_COMP_REWARDS={league:{ap:5,win:50,draw:20,loss:5},cup:{ap:5,win:60,draw:20,loss:8},playoff:{ap:5,win:60,draw:20,loss:8},ucl:{ap:7,win:90,draw:40,loss:15},uel:{ap:7,win:85,draw:35,loss:12},uecl:{ap:6,win:80,draw:30,loss:10}};
const LL_CUP_WEEKS=[3,8,14,20,26,32],LL_EURO_WEEKS=[5,11,17,23,29];
const LL_CUP_ROUNDS=['1. Tur','Son 32','Son 16','Çeyrek Final','Yarı Final','Final'];
const LL_EURO_ROUNDS=['Son 32','Son 16','Çeyrek Final','Yarı Final','Final'];
const LL_EURO_LOGO_IDS={
  'Paris Saint-Germain':583,'Real Madrid':418,'Manchester City':281,'Bayern München':27,Liverpool:31,Inter:46,Chelsea:631,'Borussia Dortmund':16,Barcelona:131,Arsenal:11,'Bayer Leverkusen':15,'Atlético Madrid':13,Benfica:294,Atalanta:800,Villarreal:1050,Juventus:506,'Eintracht Frankfurt':24,'Club Brugge':2282,'Tottenham Hotspur':148,'PSV Eindhoven':383,Ajax:610,Napoli:6195,'Sporting CP':336,Olympiacos:683,Marseille:244,Copenhagen:190,Monaco:162,Galatasaray:141,'Union Saint-Gilloise':3948,'Qarabağ':10625,'Athletic Club':621,'Newcastle United':762,'Bodø/Glimt':2619,'Slavia Praha':62,Pafos:20401,'Kairat Almaty':10470
};
const LL_RECOVERY_AP=3,LL_PROMOTION_SUPPORT_AP=300,LL_SEASON_GOAL_VERSION=5,LL_TEAM_TARGET_VERSION=3,LL_SEASON_HISTORY_VERSION=1;
function llV2PlayerLeagueInState(state){return state?.leagues?.super?.includes(state.playerTeam)?'super':'first';}
function llV2TeamStarsInState(state,name){return Math.max(1,Math.min(6,Number(state?.teams?.[name]?.stars||LL_ALL_TEAMS.find(t=>t.name===name)?.stars||1)));}
function llV2TeamTargetOptions(league,stars){
  if(league==='first'){
    if(stars>=3)return [
      {type:'champion',label:'TFF 1. Lig şampiyonu ol',reward:{ap:180,lp:220}},
      {type:'direct_promote',label:'İlk 2’ye girerek doğrudan yüksel',reward:{ap:140,lp:200}},
      {type:'promote',label:'Süper Lig’e yüksel',reward:{ap:100,lp:180}}
    ];
    if(stars===2)return [
      {type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:100,lp:80}},
      {type:'playoff',label:'Play-Off bileti al',reward:{ap:120,lp:100}},
      {type:'league_position',value:8,label:'Ligi ilk 8 içinde bitir',reward:{ap:110,lp:90}}
    ];
    return [
      {type:'first_survive',label:'TFF 1. Lig’de kümede kal',reward:{ap:100,lp:60}},
      {type:'league_position',value:15,label:'Ligi ilk 15 içinde bitir',reward:{ap:105,lp:60}},
      {type:'league_position',value:14,label:'Ligi ilk 14 içinde bitir',reward:{ap:110,lp:70}}
    ];
  }
  if(stars>=5)return [
    {type:'champion',label:'Süper Lig şampiyonu ol',reward:{ap:220,lp:240}},
    {type:'league_position',value:2,label:'Ligi ilk 2 içinde bitir',reward:{ap:180,lp:190}}
  ];
  if(stars===4)return [
    {type:'league_position',value:3,label:'Ligi ilk 3 içinde bitir',reward:{ap:170,lp:170}},
    {type:'europe',label:'Avrupa kupalarına katıl',reward:{ap:160,lp:160}}
  ];
  if(stars===3)return [
    {type:'league_position',value:7,label:'Ligi ilk 7 içinde bitir',reward:{ap:130,lp:100}},
    {type:'league_position',value:5,label:'Ligi ilk 5 içinde bitir',reward:{ap:150,lp:120}},
    {type:'europe',label:'Avrupa kupalarına katıl',reward:{ap:170,lp:140}}
  ];
  if(stars===2)return [
    {type:'survive',label:'Süper Lig’de kümede kal',reward:{ap:120,lp:80}},
    {type:'league_position',value:12,label:'Ligi ilk 12 içinde bitir',reward:{ap:130,lp:90}},
    {type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:150,lp:100}}
  ];
  return [{type:'survive',label:'Süper Lig’de kümede kal',reward:{ap:140,lp:90}}];
}
function llV2PreviousTeamContext(state,name){
  const previous=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-1);if(!previous)return null;
  const superIndex=(previous.superRows||[]).findIndex(row=>row.team===name),firstIndex=(previous.firstRows||[]).findIndex(row=>row.team===name),league=superIndex>=0?'super':firstIndex>=0?'first':null,index=league==='super'?superIndex:firstIndex;
  if(!league||index<0)return null;const row=(league==='super'?previous.superRows:previous.firstRows)[index];
  return {league,position:Number(row?.position)||index+1,promoted:(previous.promoted||[]).includes(name),relegated:(previous.relegated||[]).includes(name)};
}
function llV2ContextualTeamTargetOptions(state,name,league,stars){
  const previous=llV2PreviousTeamContext(state,name);if(!previous)return llV2TeamTargetOptions(league,stars);
  if(league==='super'&&previous.promoted){
    if(stars>=4)return [{type:'league_position',value:8,label:'Ligi ilk 8 içinde bitir',reward:{ap:155,lp:125}}];
    if(stars===3)return [{type:'league_position',value:previous.position<=2?10:12,label:`Ligi ilk ${previous.position<=2?10:12} içinde bitir`,reward:{ap:145,lp:110}}];
    if(stars===2&&previous.position<=2)return [{type:'league_position',value:12,label:'Ligi ilk 12 içinde bitir',reward:{ap:135,lp:95}}];
    return [{type:'survive',label:'Süper Lig’de kümede kal',reward:{ap:130,lp:90}}];
  }
  if(league==='first'&&previous.relegated){
    if(stars>=3)return [{type:'direct_promote',label:'İlk 2’ye girerek doğrudan yüksel',reward:{ap:160,lp:210}}];
    if(stars===2)return [{type:'playoff',label:'Play-Off bileti al',reward:{ap:130,lp:110}}];
    return [{type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:115,lp:80}}];
  }
  if(league==='super'&&previous.league==='super'){
    if(stars>=5)return previous.position===1?[{type:'champion',label:'Süper Lig şampiyonu ol',reward:{ap:220,lp:240}}]:[{type:'league_position',value:2,label:'Ligi ilk 2 içinde bitir',reward:{ap:185,lp:195}}];
    if(stars===4)return previous.position<=3?[{type:'league_position',value:3,label:'Ligi ilk 3 içinde bitir',reward:{ap:175,lp:175}}]:previous.position<=6?[{type:'europe',label:'Avrupa kupalarına katıl',reward:{ap:165,lp:165}}]:[{type:'league_position',value:7,label:'Ligi ilk 7 içinde bitir',reward:{ap:150,lp:130}}];
    if(stars===3)return previous.position<=6?[{type:'league_position',value:7,label:'Ligi ilk 7 içinde bitir',reward:{ap:140,lp:110}}]:previous.position<=10?[{type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:130,lp:100}}]:[{type:'league_position',value:12,label:'Ligi ilk 12 içinde bitir',reward:{ap:125,lp:90}}];
    if(stars===2)return previous.position<=10?[{type:'league_position',value:12,label:'Ligi ilk 12 içinde bitir',reward:{ap:130,lp:90}}]:[{type:'survive',label:'Süper Lig’de kümede kal',reward:{ap:120,lp:80}}];
    return [{type:'survive',label:'Süper Lig’de kümede kal',reward:{ap:140,lp:90}}];
  }
  if(league==='first'&&previous.league==='first'){
    if(stars>=3)return previous.position<=7?[{type:'promote',label:'Süper Lig’e yüksel',reward:{ap:120,lp:190}}]:previous.position<=12?[{type:'playoff',label:'Play-Off bileti al',reward:{ap:125,lp:110}}]:[{type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:115,lp:90}}];
    if(stars===2)return previous.position<=7?[{type:'playoff',label:'Play-Off bileti al',reward:{ap:120,lp:100}}]:previous.position<=12?[{type:'league_position',value:10,label:'Ligi ilk 10 içinde bitir',reward:{ap:105,lp:85}}]:[{type:'league_position',value:14,label:'Ligi ilk 14 içinde bitir',reward:{ap:105,lp:70}}];
    return [{type:'first_survive',label:'TFF 1. Lig’de kümede kal',reward:{ap:100,lp:60}}];
  }
  return llV2TeamTargetOptions(league,stars);
}
function llV2TeamTierIndex(state,name,league){const stars=llV2TeamStarsInState(state,name),same=(state.leagues?.[league]||[]).filter(n=>llV2TeamStarsInState(state,n)===stars).sort((a,b)=>a.localeCompare(b,'tr'));return Math.max(0,same.indexOf(name));}
function llV2CreateTeamSeasonTargets(state){
  const targets={};
  ['super','first'].forEach(league=>(state.leagues?.[league]||[]).forEach(name=>{const stars=llV2TeamStarsInState(state,name),options=llV2ContextualTeamTargetOptions(state,name,league,stars),choice=options[llV2TeamTierIndex(state,name,league)%options.length];targets[name]={...choice,team:name,league,stars};}));
  return {version:LL_TEAM_TARGET_VERSION,season:state.season,targets,evaluated:false,results:{}};
}
function llV2EnsureTeamSeasonTargets(state=lexLeague.state){
  if(!state)return null;
  const expected=(state.leagues?.super?.length||0)+(state.leagues?.first?.length||0),current=state.teamSeasonTargets;
  if(!current||current.version!==LL_TEAM_TARGET_VERSION||current.season!==state.season||Object.keys(current.targets||{}).length!==expected)state.teamSeasonTargets=llV2CreateTeamSeasonTargets(state);
  return state.teamSeasonTargets;
}
function llV2TeamTarget(name,state=lexLeague.state){return llV2EnsureTeamSeasonTargets(state)?.targets?.[name]||null;}
function llV2CupGoalForTeam(state,name,league,stars){
  const variant=llV2TeamTierIndex(state,name,league),pool=stars>=5?
    [{type:'cup_win',label:'Türkiye Kupası’nı kazan',reward:{ap:180,lp:180}},{type:'cup_final',label:'Türkiye Kupası finaline çık',reward:{ap:160,lp:160}}]:stars===4?
    [{type:'cup_final',label:'Türkiye Kupası finaline çık',reward:{ap:150,lp:140}},{type:'cup_sf',label:'Türkiye Kupası’nda yarı final gör',reward:{ap:130,lp:120}}]:stars===3?
    [{type:'cup_sf',label:'Türkiye Kupası’nda yarı final gör',reward:{ap:130,lp:100}},{type:'cup_qf',label:'Türkiye Kupası’nda çeyrek final gör',reward:{ap:110,lp:90}}]:stars===2?
    [{type:'cup_qf',label:'Türkiye Kupası’nda çeyrek final gör',reward:{ap:110,lp:80}},{type:'cup_ro16',label:'Türkiye Kupası’nda son 16’ya kal',reward:{ap:90,lp:70}}]:
    [{type:'cup_ro16',label:'Türkiye Kupası’nda son 16’ya kal',reward:{ap:100,lp:60}},{type:'cup_win_one',label:'Türkiye Kupası’nda en az 1 maç kazan',reward:{ap:80,lp:50}}];
  return {...pool[variant%pool.length],id:'cup_expectation'};
}
function llV2CreateSeasonGoals(state){
  const league=llV2PlayerLeagueInState(state),team=state.playerTeam,stars=llV2TeamStarsInState(state,team),primary={...llV2TeamTarget(team,state),id:'club_primary'},wins=(league==='first'?[0,10,13,17,20,22,24]:[0,8,10,13,16,19,22])[stars],goalsFor=(league==='first'?[0,32,42,52,60,68,74]:[0,28,36,45,54,62,68])[stars],items=[
    primary,
    llV2CupGoalForTeam(state,team,league,stars),
    {id:'league_wins',type:'wins',value:wins,label:`En az ${wins} lig maçı kazan`,reward:{ap:0,lp:stars>=4?160:stars===3?140:120}},
    {id:'league_goals',type:'goals_for',value:goalsFor,label:`Ligde en az ${goalsFor} gol at`,reward:{ap:stars>=4?150:stars===3?130:110,lp:0}}
  ];
  return {version:LL_SEASON_GOAL_VERSION,season:state.season,league,stars,items,evaluated:false,results:[],earnedAp:0,earnedLp:0,promotionSupportAp:0,badge:null};
}
const LL_V2_CARD_REPAIR_VERSION=1;
function llV2CardFitsSlot(card,position,stars){return !!card&&(card.position===position||card.position==='Evrensel')&&Number(card.minStar||1)<=Number(stars||1);}
function llV2RepairCardId(oldId,position,stars,usedFamilies=new Set()){
  if(!oldId)return null;
  const migratedId=LL_LEGACY_CARD_REPLACEMENTS[oldId]||oldId,migrated=llCard(migratedId);
  if(llV2CardFitsSlot(migrated,position,stars))return migratedId;
  const legacy=LL_LEGACY_CARD_POOL.find(card=>card.id===oldId),legacyFamily=llCardFamilyName(legacy),targetRank=LL_CARD_RARITY_RANK[legacy?.rarity]||LL_CARD_RARITY_RANK.rare;
  const candidates=LL_CARD_POOL.filter(card=>!card.upgradeOnly&&!card.clubCard&&llV2CardFitsSlot(card,position,stars)&&!usedFamilies.has(llCardFamilyName(card)));
  return [...candidates].sort((a,b)=>{
    const familyA=legacyFamily&&llCardFamilyName(a)===legacyFamily?0:1,familyB=legacyFamily&&llCardFamilyName(b)===legacyFamily?0:1;
    if(familyA!==familyB)return familyA-familyB;
    const gapA=Math.abs((LL_CARD_RARITY_RANK[a.rarity]||1)-targetRank),gapB=Math.abs((LL_CARD_RARITY_RANK[b.rarity]||1)-targetRank);
    if(gapA!==gapB)return gapA-gapB;
    const exactA=a.position===position?0:1,exactB=b.position===position?0:1;if(exactA!==exactB)return exactA-exactB;
    return a.id.localeCompare(b.id);
  })[0]?.id||null;
}
function llV2RepairState(state){
  if(!state)return state;
  Object.entries(state.teams||{}).forEach(([teamName,team])=>{
    if(!team.cards||typeof team.cards!=='object')team.cards={'Kaleci':null,'Orta Saha':null,'Forvet':null};
    const usedFamilies=new Set();
    LL_POSITIONS.forEach(position=>{
      const repairedId=llV2RepairCardId(team.cards[position],position,team.stars,usedFamilies),card=llCard(repairedId);
      team.cards[position]=card?repairedId:null;
      const family=llCardFamilyName(card);if(family)usedFamilies.add(family);
    });
    if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];
    usedFamilies.forEach(family=>{if(!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);});
  });
  state.cardRepairVersion=LL_V2_CARD_REPAIR_VERSION;
  if(!Array.isArray(state.discoveredCards))state.discoveredCards=[];
  const owned=Object.values(state.teams?.[state.playerTeam]?.cards||{}).filter(Boolean).map(id=>LL_LEGACY_CARD_REPLACEMENTS[id]||id).filter(id=>llCard(id));
  state.discoveredCards=[...new Set([...state.discoveredCards.map(id=>LL_LEGACY_CARD_REPLACEMENTS[id]||id).filter(id=>llCard(id)),...owned])];
  const repairedPerformance={};
  Object.entries(state.cardPerformance||{}).forEach(([rawId,raw])=>{
    const id=LL_LEGACY_CARD_REPLACEMENTS[rawId]||rawId;if(!llCard(id)||!raw||typeof raw!=='object')return;
    const target=repairedPerformance[id]||{wins:0,draws:0,losses:0,matches:0,triggers:0,triggeredWins:0,triggeredDraws:0,triggeredLosses:0,goalsFor:0,goalsAgainst:0,firstSeason:null,lastSeason:null,byCompetition:{}};
    target.wins+=Math.max(0,Number(raw.wins)||0);target.draws+=Math.max(0,Number(raw.draws)||0);target.losses+=Math.max(0,Number(raw.losses)||0);target.matches=target.wins+target.draws+target.losses;
    target.triggers+=Math.max(0,Number(raw.triggers)||0);target.triggeredWins+=Math.max(0,Number(raw.triggeredWins)||0);target.triggeredDraws+=Math.max(0,Number(raw.triggeredDraws)||0);target.triggeredLosses+=Math.max(0,Number(raw.triggeredLosses)||0);target.triggers=Math.max(target.triggers,target.triggeredWins+target.triggeredDraws+target.triggeredLosses);
    target.goalsFor+=Math.max(0,Number(raw.goalsFor)||0);target.goalsAgainst+=Math.max(0,Number(raw.goalsAgainst)||0);
    const first=Number(raw.firstSeason),last=Number(raw.lastSeason);if(Number.isFinite(first)&&first>0)target.firstSeason=target.firstSeason==null?first:Math.min(target.firstSeason,first);if(Number.isFinite(last)&&last>0)target.lastSeason=target.lastSeason==null?last:Math.max(target.lastSeason,last);
    Object.entries(raw.byCompetition||{}).forEach(([competition,comp])=>{if(!comp||typeof comp!=='object')return;const entry=target.byCompetition[competition]||{wins:0,draws:0,losses:0,matches:0,triggers:0};entry.wins+=Math.max(0,Number(comp.wins)||0);entry.draws+=Math.max(0,Number(comp.draws)||0);entry.losses+=Math.max(0,Number(comp.losses)||0);entry.triggers+=Math.max(0,Number(comp.triggers)||0);entry.matches=entry.wins+entry.draws+entry.losses;target.byCompetition[competition]=entry;});
    repairedPerformance[id]=target;
  });
  state.cardPerformance=repairedPerformance;
  if(!Array.isArray(state.clubBadges))state.clubBadges=[];
  if(!Array.isArray(state.seasonHistory))state.seasonHistory=[];
  if(state.seasonEnded&&state.lastSeasonSummary?.superRows&&state.lastSeasonSummary?.firstRows)llV2ArchiveSeason(state,state.lastSeasonSummary);
  if(!state.shopSeenByWindow||typeof state.shopSeenByWindow!=='object')state.shopSeenByWindow={};
  Object.values(state.teams||{}).forEach(team=>{if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];Object.values(team.cards||{}).forEach(id=>{const family=llCardFamilyName(llCard(id));if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);});});
  llV2EnsureEuropeStandings(state);
  llV2EnsureTeamSeasonTargets(state);
  if(!state.seasonGoals||state.seasonGoals.season!==state.season||(!state.seasonGoals.evaluated&&state.seasonGoals.version!==LL_SEASON_GOAL_VERSION))state.seasonGoals=llV2CreateSeasonGoals(state);
  return state;
}
function llV2CupMaxRoundReached(state,team=state.playerTeam){
  let max=-1;const history=state.cup?.history||{};
  Object.entries(history).forEach(([round,field])=>{if(Array.isArray(field)&&field.includes(team))max=Math.max(max,Number(round));});
  (state.results||[]).forEach(r=>{if(r.competition==='cup'&&(r.home===team||r.away===team))max=Math.max(max,llV2CupResultRound(r));});
  if(state.cup?.winner===team)max=Math.max(max,LL_CUP_ROUNDS.length-1);return max;
}
function llV2CupMatchWon(state,team=state.playerTeam){return (state.results||[]).some(r=>r.competition==='cup'&&(r.home===team||r.away===team)&&((r.home===team&&r.homeGoals>r.awayGoals)||(r.away===team&&r.awayGoals>r.homeGoals)));}
function llV2TargetStatus(state,goal,team=state.playerTeam,summary=null){
  const league=goal.league||summary?.playerLeague||((state.leagues?.super||[]).includes(team)?'super':'first'),rows=summary?(league==='super'?summary.superRows:summary.firstRows):Object.values(state.standings?.[league]||{}).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.team.localeCompare(b.team,'tr')),row=rows.find(r=>r.team===team),position=rows.findIndex(r=>r.team===team)+1,wins=Number(row?.W||0),goalsFor=Number(row?.GF||0),type=goal.type||goal.id;
  if(type==='league_position')return {achieved:position>0&&position<=goal.value,progress:`${position||'—'}. sıra / hedef ilk ${goal.value}`};
  if(type==='champion')return {achieved:position===1,progress:`${position||'—'}. sıra / hedef şampiyonluk`};
  if(type==='direct_promote')return {achieved:position>0&&position<=2,progress:`${position||'—'}. sıra / doğrudan yükselme ilk 2`};
  if(type==='playoff')return {achieved:position>0&&position<=7,progress:`${position||'—'}. sıra / Play-Off sınırı ilk 7`};
  if(type==='survive'||type==='first_survive'){const safeLimit=Math.max(1,rows.length-(league==='super'?3:4));return {achieved:position>0&&position<=safeLimit,progress:`${position||'—'}. sıra / güvenli bölge ilk ${safeLimit}`};}
  if(type==='promote'){const achieved=summary?!!summary.promoted?.includes(team):position>0&&position<=2;return {achieved,progress:summary?(achieved?'Süper Lig’e yükseldi':'Yükselemedi'):`${position||'—'}. sıra · ilk 2 veya Play-Off`};}
  if(type==='europe'||type==='ucl'){const q=summary?.qualifications||(league==='super'?llV2Qualifications(rows,state.cup?.winner):{ucl:[],uel:[],uecl:[]}),clubs=type==='ucl'?q.ucl:[...q.ucl,...q.uel,...q.uecl],achieved=clubs.includes(team);return {achieved,progress:achieved?(type==='ucl'?'Şampiyonlar Ligi bileti alındı':'Avrupa bileti alındı'):`${position||'—'}. sıra · Avrupa hattı takip ediliyor`};}
  if(type==='wins')return {achieved:wins>=goal.value,progress:`${wins}/${goal.value} lig galibiyeti`};
  if(type==='goals_for')return {achieved:goalsFor>=goal.value,progress:`${goalsFor}/${goal.value} lig golü`};
  const cupRound=llV2CupMaxRoundReached(state,team),cupTargets={cup_ro16:2,cup_qf:3,cup_sf:4,cup_final:5};
  if(type==='cup_win')return {achieved:state.cup?.winner===team,progress:state.cup?.winner===team?'Kupa kazanıldı':`${cupRound>=0?LL_CUP_ROUNDS[cupRound]:'Henüz kupa maçı yok'} · hedef şampiyonluk`};
  if(type==='cup_win_one'){const achieved=llV2CupMatchWon(state,team);return {achieved,progress:achieved?'En az 1 kupa maçı kazanıldı':'Henüz kupa galibiyeti yok'};}
  if(type in cupTargets){const targetRound=cupTargets[type],achieved=cupRound>=targetRound;return {achieved,progress:achieved?`${LL_CUP_ROUNDS[targetRound]} görüldü`:`Ulaşılan: ${cupRound>=0?LL_CUP_ROUNDS[cupRound]:'Henüz kupa maçı yok'}`};}
  return {achieved:false,progress:'Sonuç yok'};
}
function llV2GoalStatus(state,goal,summary=null){return llV2TargetStatus(state,goal,state.playerTeam,summary);}
function llV2EvaluateTeamTargets(state,summary){const profile=llV2EnsureTeamSeasonTargets(state);if(profile.evaluated)return profile;profile.results=Object.fromEntries(Object.entries(profile.targets).map(([team,target])=>[team,llV2TargetStatus(state,target,team,summary)]));profile.evaluated=true;return profile;}
function llV2EnsureSeasonGoals(state=lexLeague.state){if(!state)return null;llV2RepairState(state);return state.seasonGoals;}
function llV2EvaluateSeasonGoals(state,summary){
  const goals=llV2EnsureSeasonGoals(state);if(goals.evaluated)return goals;
  goals.results=goals.items.map(goal=>{const status=llV2GoalStatus(state,goal,summary),ap=status.achieved?Number(goal.reward.ap||0):0,lp=status.achieved?Number(goal.reward.lp||0):0;return {...goal,...status,awardedAp:ap,awardedLp:lp};});
  goals.earnedAp=goals.results.reduce((sum,g)=>sum+g.awardedAp,0);goals.earnedLp=goals.results.reduce((sum,g)=>sum+g.awardedLp,0);
  goals.promotionSupportAp=summary.promoted.includes(state.playerTeam)?LL_PROMOTION_SUPPORT_AP:0;state.ap+=goals.earnedAp+goals.promotionSupportAp;state.lp+=goals.earnedLp;
  if(goals.results.every(g=>g.achieved)){goals.badge='Yönetimden Tam Not';if(!state.clubBadges.some(b=>b.season===state.season&&b.name===goals.badge))state.clubBadges.push({season:state.season,name:goals.badge});}
  goals.evaluated=true;return goals;
}
function llV2RewardText(goal,achieved){const ap=Number(goal.reward?.ap||0),lp=Number(goal.reward?.lp||0);return achieved?`${ap?`+${ap} AP`:''}${ap&&lp?' · ':''}${lp?`+${lp} LP`:''}`:`0 ${ap?'AP':'LP'}`;}
function llV2SeasonGoalsHtml(final=false){
  const s=lexLeague.state,goals=llV2EnsureSeasonGoals(s),items=final&&goals.evaluated?goals.results:goals.items.map(g=>({...g,...llV2GoalStatus(s,g)}));
  return `<div class="ll-card"><div class="ll-card-title">${final?'Yönetim Hedefleri · Sezon Sonu':'Sezonluk Yönetim Hedefleri'}</div><div class="ll-muted" style="margin-bottom:10px">${llStars(goals.stars||llV2TeamStarsInState(s,s.playerTeam))} ${llEscape(llLeagueLabel(goals.league))} beklentileri · kulübün gücüne göre belirlendi</div><div class="ll-goals">${items.map(g=>`<div class="ll-goal ${final?(g.achieved?'success':'fail'):''}"><div><div class="ll-goal-title">${final?(g.achieved?'✓':'✕'):'◆'} ${llEscape(g.label)}</div><div class="ll-goal-progress">${llEscape(g.progress)}</div></div><div class="ll-goal-reward">${llV2RewardText(g,final?g.achieved:true)}</div></div>`).join('')}</div>${final?`<div class="ll-notice" style="margin-top:12px"><b>Hedef ödülleri:</b> +${goals.earnedAp} AP · +${goals.earnedLp} LP${goals.promotionSupportAp?`<br><b>Yükselme desteği:</b> +${goals.promotionSupportAp} AP`:''}${goals.badge?`<br><b>Kulüp rozeti:</b> 🏅 ${llEscape(goals.badge)}`:''}</div>`:`<div class="ll-muted" style="margin-top:10px">Hedefler sezon başında sabitlenir. Yıldızın sezon içinde yükselirse mevcut hedef değişmez; daha güçlü hedefler sonraki sezon başlar. Başarılmayan hedef 0 puan verir.</div>`}</div>`;
}
function llIsTransferWindow(week=lexLeague.state?.week){const s=lexLeague.state,n=Number(week);return !!s?.seasonEnded||(n>=1&&n<=3)||[10,20,30].includes(n);}
function llV2MatchImportance(f,key){
  const s=lexLeague.state,comp=f.competition||'league',pair=[f.home,f.away].sort((a,b)=>a.localeCompare(b,'tr')).join('|'),derbies=new Set([['Galatasaray','Fenerbahçe'].sort((a,b)=>a.localeCompare(b,'tr')).join('|'),['Galatasaray','Beşiktaş'].sort((a,b)=>a.localeCompare(b,'tr')).join('|'),['Fenerbahçe','Beşiktaş'].sort((a,b)=>a.localeCompare(b,'tr')).join('|')]);
  if(comp==='cup'&&/Final/i.test(f.roundLabel||''))return '🏆 TÜRKİYE KUPASI FİNALİ';
  if(comp==='playoff'&&/Final/i.test(f.roundLabel||''))return '🚀 SÜPER LİG’E YÜKSELME FİNALİ';
  if(comp==='playoff')return '🚀 YÜKSELME PLAY-OFF MAÇI';
  if(comp==='league'&&derbies.has(pair))return '🔥 BÜYÜK DERBİ';
  if(comp==='league'&&Number(s.week)>=20){const rows=llSortTable(key),positions=[f.home,f.away].map(n=>rows.findIndex(r=>r.team===n)+1);if(key==='super'&&positions.some(p=>p>rows.length-5))return '⚠️ DÜŞME HATTI MAÇI';if(key==='first'&&positions.some(p=>p>0&&p<=7))return '⬆️ YÜKSELME YARIŞI MAÇI';}
  if(comp==='league'&&Number(s.week)>=20&&key==='super'){const rows=llSortTable(key),positions=[f.home,f.away].map(n=>rows.findIndex(r=>r.team===n)+1);if(positions.some(p=>p>0&&p<=6))return '\uD83C\uDF0D AVRUPA YARI\u015eI MA\u00c7I';}
  return '';
}

function llTeamDef(name){
  const domestic=LL_ALL_TEAMS.find(t=>t.name===name);if(domestic)return domestic;
  const euro=UCL_TEAMS.find(t=>t.name===name),logoId=LL_EURO_LOGO_IDS[name];return euro?{name:euro.name,short:euro.short,stars:euro.pot===1?6:euro.pot===2?5:euro.pot===3?4:3,icon:euro.flag,logo:logoId?`https://tmssl.akamaized.net/images/wappen/head/${logoId}.png`:''}:{name,short:name,stars:3,icon:'🌍',logo:''};
}
function llTeamLogo(teamOrName,variant=''){
  const team=typeof teamOrName==='string'?llTeamDef(teamOrName):teamOrName;if(!team)return '';
  if(!team.logo)return `<span class="ll-team-logo-fallback" style="display:inline-flex">${team.icon||'⚽'}</span>`;
  return `<img class="ll-team-logo ${variant}" src="${team.logo}" alt="${llEscape(team.name)} logosu" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="ll-team-logo-fallback">${team.icon||'⚽'}</span>`;
}
function llRange(stars){return stars<=1?[1,4]:stars===2?[1,5]:stars===3?[2,6]:stars===4?[3,6]:[4,6];}
function llRangeText(stars){const [a,b]=llRange(stars);return `${a}-${b}`;}
function llStars(n){return '⭐'.repeat(n);}
function llTeamLeague(name){const s=lexLeague.state;if(s?.leagues?.super?.includes(name))return 'super';if(s?.leagues?.first?.includes(name))return 'first';return null;}
function llLeagueLabel(key){return key==='super'?'Süper Lig':'TFF 1. Lig';}
function llLeaguePositionLabel(name){const key=llTeamLeague(name);if(!key)return 'Avrupa kupası rakibi';const position=llSortTable(key).findIndex(row=>row.team===name)+1;return `${llLeagueLabel(key)} · ${position>0?`${position}. sıra`:'Sıralama yok'}`;}
function llBlankStandings(names){return Object.fromEntries(names.map(n=>[n,llBlankStanding(n)]));}
function llV2EuroLabel(type){return type==='ucl'?'Şampiyonlar Ligi':type==='uel'?'Avrupa Ligi':'Konferans Ligi';}
function llV2ApplyEuropeStanding(state,type,home,homeGoals,away,awayGoals){
  const table=state?.europeStandings?.[type];if(!table)return;
  [home,away].forEach(name=>{if(!table.standings[name])table.standings[name]=llBlankStanding(name);if(!table.teams.includes(name))table.teams.push(name);});
  [[home,homeGoals,awayGoals],[away,awayGoals,homeGoals]].forEach(([name,gf,ga])=>{const row=table.standings[name];row.P++;row.GF+=gf;row.GA+=ga;row.GD=row.GF-row.GA;if(gf>ga){row.W++;row.Pts+=3;}else if(gf===ga){row.D++;row.Pts++;}else row.L++;});
}
function llV2CreateEuropeStandings(state){
  const types=['ucl','uel','uecl'],all=[...new Set(UCL_TEAMS.map(team=>team.name))],shift=((Number(state.season)||1)-1)*12%all.length,rotated=[...all.slice(shift),...all.slice(0,shift)],groups={ucl:rotated.slice(0,12),uel:rotated.slice(12,24),uecl:rotated.slice(24,36)};
  if(state.europe?.type&&types.includes(state.europe.type)){types.forEach(type=>groups[type]=groups[type].filter(name=>name!==state.playerTeam));groups[state.europe.type]=[state.playerTeam,...groups[state.europe.type].slice(0,11)];}
  const standings={season:state.season};types.forEach(type=>{const teams=groups[type],fixtures=llGenerateSchedule(teams).slice(0,LL_EURO_WEEKS.length);standings[type]={teams:[...teams],standings:llBlankStandings(teams),fixtures,playedRounds:0};});
  state.europeStandings=standings;
  (state.results||[]).filter(result=>types.includes(result.competition)&&Number(result.season)===Number(state.season)).forEach(result=>llV2ApplyEuropeStanding(state,result.competition,result.home,result.homeGoals,result.away,result.awayGoals));
  return standings;
}
function llV2EnsureEuropeStandings(state){
  if(!state.europeStandings||Number(state.europeStandings.season)!==Number(state.season))return llV2CreateEuropeStandings(state);
  const types=['ucl','uel','uecl'],valid=types.every(type=>{const table=state.europeStandings[type];return table&&Array.isArray(table.teams)&&table.standings&&Array.isArray(table.fixtures);});
  if(!valid)return llV2CreateEuropeStandings(state);
  types.forEach(type=>{const table=state.europeStandings[type];table.playedRounds=Math.max(0,Math.min(LL_EURO_WEEKS.length,Number(table.playedRounds)||0));});
  return state.europeStandings;
}
function llV2SortEuropeTable(type){const table=llV2EnsureEuropeStandings(lexLeague.state)?.[type];return table?Object.values(table.standings).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.team.localeCompare(b.team,'tr')):[];}
function llV2SimpleEuropeScore(home,away){
  const homeStars=llTeamDef(home)?.stars||3,awayStars=llTeamDef(away)?.stars||3,roll=stars=>Math.max(0,Math.min(5,Math.floor(Math.random()*3)+Math.floor((stars-2)/2)));
  return {homeGoals:roll(homeStars)+(homeStars>awayStars&&Math.random()<.35?1:0),awayGoals:roll(awayStars)+(awayStars>homeStars&&Math.random()<.25?1:0)};
}
function llV2SimulateEuropeTables(){
  const s=lexLeague.state,tables=llV2EnsureEuropeStandings(s),due=LL_EURO_WEEKS.filter(week=>Number(s.week)>=week).length;
  ['ucl','uel','uecl'].forEach(type=>{const table=tables[type];while(table.playedRounds<due){const roundIndex=table.playedRounds,round=table.fixtures[roundIndex]||[];round.forEach(fixture=>{const involvesPlayer=fixture.home===s.playerTeam||fixture.away===s.playerTeam;if(involvesPlayer)return;const score=llV2SimpleEuropeScore(fixture.home,fixture.away);llRecordMatch(fixture.home,fixture.away,score.homeGoals,score.awayGoals,LL_EURO_WEEKS[roundIndex],false,type,'euro-table');});table.playedRounds++;}});
}
function llNewState(teamName){
  const teams={};LL_ALL_TEAMS.forEach(t=>teams[t.name]={name:t.name,stars:t.stars,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}});
  const superNames=LL_TEAMS.map(t=>t.name),firstNames=LL_FIRST_TEAMS.map(t=>t.name);
  const state={version:2,season:1,week:1,playerTeam:teamName,ap:0,lp:0,teams,leagues:{super:superNames,first:firstNames},standings:{super:llBlankStandings(superNames),first:llBlankStandings(firstNames)},schedules:{super:llGenerateSchedule(superNames),first:llGenerateSchedule(firstNames)},results:[],usedWords:[],transferWindowsVisited:{},aiTransferWindows:{},aiShopVersion:2,starterPackClaimed:false,starterAiAssigned:false,starterOffers:{},cardPerformance:{},seasonEnded:false,lastSeasonSummary:null,seasonHistory:[],pendingFixture:null,playoff:null,europe:null,europeStandings:null,trophies:[],discoveredCards:[],clubBadges:[],shopSeenByWindow:{},teamSeasonTargets:null,seasonGoals:null,createdAt:new Date().toISOString()};
  llV2InitCup(state);llV2RepairState(state);return state;
}
function llSave(){if(lexLeague.state)localStorage.setItem(LL_V2_SAVE_KEY,JSON.stringify(lexLeague.state));}
function llLoad(){try{const s=JSON.parse(localStorage.getItem(LL_V2_SAVE_KEY)||'null');return s?.version===2?llV2RepairState(s):null;}catch{return null;}}
function llResetGame(){if(!confirm('İki ligli kariyer kaydı tamamen silinsin mi?'))return;localStorage.removeItem(LL_V2_SAVE_KEY);lexLeague.state=null;llClearTransient();renderLexiconLeagueLanding();}
function llContinueGame(){const s=llLoad();if(!s){llRenderTeamSelect();return;}lexLeague.state=s;llSave();lexLeague.active=true;llSetWide(true);if(!s.starterPackClaimed)llRenderStarterShop();else if(s.seasonEnded)llRenderSeasonEnd();else llRenderDashboard();}
function llRenderTeamSelect(){lexLeague.active=true;llSetWide(true);llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">TFF 1. Lig'den <em>Başla</em></div><div class="ll-muted">20 kulüp · 6 yıldızlı yeni güç sistemi · Hedef Süper Lig</div></div><button class="ll-btn" onclick="renderLexiconLeagueLanding()">← Geri</button></div><div class="ll-team-grid">${LL_FIRST_TEAMS.map(t=>`<button class="ll-team-option" onclick="llStartCareer('${llEscape(t.name)}')"><div class="ll-team-name team-with-logo">${llTeamLogo(t,'compact')}<span>${llEscape(t.name)}</span></div><div class="ll-stars">${llStars(t.stars)}</div><div class="ll-range">Zar aralığı ${llRangeText(t.stars)}</div></button>`).join('')}</div></div></div>`;}
function llAssignStarterCardsToAi(){const s=lexLeague.state;if(!s||s.starterAiAssigned)return;LL_ALL_TEAMS.map(t=>t.name).filter(n=>n!==s.playerTeam).forEach(llAssignAiCard);s.starterAiAssigned=true;}
function llHeldCardIds(){const ids=new Set();Object.values(lexLeague.state.teams).forEach(t=>LL_POSITIONS.forEach(p=>{if(t.cards?.[p])ids.add(t.cards[p]);}));return ids;}

function llSortTable(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){return Object.values(lexLeague.state.standings[key]).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.team.localeCompare(b.team,'tr'));}
function llUpdateStanding(team,gf,ga){const key=llTeamLeague(team),r=lexLeague.state.standings[key][team];r.P++;r.GF+=gf;r.GA+=ga;r.GD=r.GF-r.GA;if(gf>ga){r.W++;r.Pts+=3;}else if(gf===ga){r.D++;r.Pts++;}else r.L++;const ts=llTeamState(team);ts.lastResults.push(gf>ga?'W':gf===ga?'D':'L');ts.lastResults=ts.lastResults.slice(-5);if(gf>ga)ts.wins++;}
function llPlayerFixture(){const s=lexLeague.state;if(s.pendingFixture)return s.pendingFixture;const key=llTeamLeague(s.playerTeam),round=s.schedules[key][s.week-1]||[];const f=round.find(x=>x.home===s.playerTeam||x.away===s.playerTeam);return f?{...f,competition:'league',league:key,roundLabel:`${s.week}. Hafta`}:null;}
function llCurrentRound(key=llTeamLeague(lexLeague.state.playerTeam)){return lexLeague.state.schedules[key]?.[lexLeague.state.week-1]||[];}
function llTableHtml(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){
  const rows=llSortTable(key),qualifications=key==='super'?llV2Qualifications(rows,lexLeague.state.cup?.winner):null;
  const euroZones=qualifications?{ucl:new Set(qualifications.ucl),uel:new Set(qualifications.uel),uecl:new Set(qualifications.uecl)}:null;
  const legend=key==='first'
    ?`<div class="ll-zone-legend"><span><i class="ll-zone-dot direct"></i>1–2: Doğrudan Süper Lig'e yükselir</span><span><i class="ll-zone-dot playoff"></i>3–7: Play-Off oynar</span></div>`
    :`<div class="ll-zone-legend"><span><i class="ll-zone-dot ucl"></i>Şampiyonlar Ligi</span><span><i class="ll-zone-dot uel"></i>Avrupa Ligi</span><span><i class="ll-zone-dot uecl"></i>Konferans Ligi</span><span><i class="ll-zone-dot relegation"></i>Son 3: TFF 1. Lig'e düşer</span></div>`;
  return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>Kart</th><th>AI AP</th><th>P</th></tr></thead><tbody>${rows.map((r,i)=>{const t=llTeamState(r.team),cards=LL_POSITIONS.filter(p=>llCardContractSlotActive(t,p)).length,euroClass=key!=='super'?'':euroZones.ucl.has(r.team)?'ucl-zone ':euroZones.uel.has(r.team)?'uel-zone ':euroZones.uecl.has(r.team)?'uecl-zone ':'';return `<tr class="${r.team===lexLeague.state.playerTeam?'player ':''}${key==='first'&&i<2?'champion-zone ':''}${key==='first'&&i>=2&&i<=6?'playoff-zone ':''}${euroClass}${key==='super'&&i>=rows.length-3?'relegation-zone ':''}"><td>${i+1}</td><td>${llTeamLogo(r.team,'table')}${llEscape(r.team)} <span class="ll-stars">${llStars(t.stars)}</span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GD}</td><td>${cards}/3</td><td>${r.team===lexLeague.state.playerTeam?'—':Math.floor(t.aiAp||0)}</td><td><b>${r.Pts}</b></td></tr>`;}).join('')}</tbody></table></div>${legend}`;}
function llV2CupResultRound(result){
  if(Number.isInteger(result?.cupRound))return result.cupRound;
  let round=0;for(let i=0;i<LL_CUP_WEEKS.length;i++)if(Number(result?.week)>=LL_CUP_WEEKS[i])round=i;return round;
}
function llV2FixtureResult(home,away,competition='league',week=null,round=null){
  return [...(lexLeague.state.results||[])].reverse().find(r=>r.season===lexLeague.state.season&&r.competition===competition&&r.home===home&&r.away===away&&(week==null||Number(r.week)===Number(week))&&(round==null||llV2CupResultRound(r)===round));
}
function llV2FixtureTeamHtml(name,away=false){
  if(!name)return `<div class="ll-fixture-team ${away?'away':''}"><span>BAY</span></div>`;
  return `<div class="ll-fixture-team ${away?'away':''}">${away?`<span>${llEscape(name)}</span>${llTeamLogo(name,'table')}`:`${llTeamLogo(name,'table')}<span>${llEscape(name)}</span>`}</div>`;
}
function llV2FixtureRow(home,away,result=null){
  const player=lexLeague.state.playerTeam,isPlayer=home===player||away===player,score=!home||!away?'BAY':result?`${result.homeGoals} - ${result.awayGoals}`:'VS';
  return `<div class="ll-fixture-row ${isPlayer?'player':''}">${llV2FixtureTeamHtml(home)}<div class="ll-fixture-score">${score}</div>${llV2FixtureTeamHtml(away,true)}</div>`;
}
function llV2LeagueFixturesHtml(key){
  const s=lexLeague.state,schedule=s.schedules[key]||[],focus=Math.min(Math.max(Number(s.week)||1,1),schedule.length);
  return `<div class="ll-round-list">${schedule.map((round,index)=>{const week=index+1,played=round.filter(f=>llV2FixtureResult(f.home,f.away,'league',week)).length;return `<details class="ll-round-card" ${week===focus?'open':''}><summary><span>${week}. Hafta</span><span class="ll-round-meta">${played}/${round.length} oynandı</span></summary><div class="ll-fixture-list">${round.map(f=>llV2FixtureRow(f.home,f.away,llV2FixtureResult(f.home,f.away,'league',week))).join('')}</div></details>`;}).join('')}</div>`;
}
function llV2CupRoundField(round){
  const c=lexLeague.state.cup||{},saved=c.history?.[round];if(Array.isArray(saved)&&saved.length)return saved;
  if(c.round===round&&Array.isArray(c.field)&&c.field.length)return c.field;
  const results=(lexLeague.state.results||[]).filter(r=>r.competition==='cup'&&llV2CupResultRound(r)===round);return results.length?results.flatMap(r=>[r.home,r.away]):null;
}
function llV2CupRoundsHtml(){
  const s=lexLeague.state,c=s.cup||{},cupResults=(s.results||[]).filter(r=>r.competition==='cup');
  return `<div class="ll-round-list">${LL_CUP_ROUNDS.map((name,round)=>{const field=llV2CupRoundField(round),roundResults=cupResults.filter(r=>llV2CupResultRound(r)===round),pairs=[];if(field)for(let i=0;i<field.length;i+=2)pairs.push([field[i]||null,field[i+1]||null]);const stateText=c.winner||round<c.round?'Tamamlandı':round===c.round?'Güncel tur':'Bekliyor',rows=pairs.length?pairs.map(([home,away])=>llV2FixtureRow(home,away,home&&away?roundResults.find(r=>r.home===home&&r.away===away):null)).join(''):`<div class="ll-muted" style="padding:4px 4px 10px">Eşleşmeler önceki tur tamamlanınca belli olacak.</div>`;return `<details class="ll-round-card" ${round===c.round&&!c.winner?'open':''}><summary><span>${name}</span><span class="ll-round-meta">${LL_CUP_WEEKS[round]}. hafta öncesi · ${stateText}</span></summary><div class="ll-fixture-list">${rows}</div></details>`;}).join('')}</div>`;
}
function llV2EuropeTableHtml(type){
  const rows=llV2SortEuropeTable(type),player=lexLeague.state.playerTeam;
  return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((row,index)=>`<tr class="${row.team===player?'player ':''}${index<4?'ucl-zone ':''}"><td>${index+1}</td><td>${llTeamLogo(row.team,'table')}${llEscape(row.team)}</td><td>${row.P}</td><td>${row.W}</td><td>${row.D}</td><td>${row.L}</td><td>${row.GF}</td><td>${row.GA}</td><td>${row.GD}</td><td><b>${row.Pts}</b></td></tr>`).join('')}</tbody></table></div><div class="ll-zone-legend"><span><i class="ll-zone-dot ucl"></i>İlk 4: en yüksek Avrupa performansı</span><span>Puan eşitliğinde averaj ve atılan gol uygulanır</span></div>`;
}
function llV2EuropeFixturesHtml(type){
  const s=lexLeague.state,table=llV2EnsureEuropeStandings(s)[type],results=(s.results||[]).filter(result=>result.competition===type&&result.league==='euro-table');
  return `<div class="ll-round-list">${(table.fixtures||[]).map((round,index)=>{const played=round.filter(f=>results.some(r=>r.home===f.home&&r.away===f.away)).length;return `<details class="ll-round-card" ${index===Math.min(table.playedRounds,LL_EURO_WEEKS.length-1)?'open':''}><summary><span>${LL_EURO_ROUNDS[index]} · ${LL_EURO_WEEKS[index]}. hafta</span><span class="ll-round-meta">${played}/${round.length} oynandı</span></summary><div class="ll-fixture-list">${round.map(f=>llV2FixtureRow(f.home,f.away,results.find(r=>r.home===f.home&&r.away===f.away)||null)).join('')}</div></details>`;}).join('')}</div>`;
}
function llV2EuropeResultRound(result){if(result?.euroRound!=null&&Number.isInteger(Number(result.euroRound)))return Number(result.euroRound);const index=LL_EURO_WEEKS.indexOf(Number(result?.week));return index>=0?index:null;}
function llV2EuropePlayerResult(type,round){const player=lexLeague.state.playerTeam;return (lexLeague.state.results||[]).find(result=>result.competition===type&&result.userMatch&&(result.home===player||result.away===player)&&llV2EuropeResultRound(result)===round)||null;}
function llV2EuropeRoadHtml(type){
  const s=lexLeague.state,e=s.europe,participates=e?.type===type,player=s.playerTeam;
  return `<div class="ll-round-list">${LL_EURO_ROUNDS.map((name,round)=>{const result=llV2EuropePlayerResult(type,round),pending=s.pendingFixture?.competition===type&&Number(e?.round)===round?s.pendingFixture:null,current=participates&&e?.alive&&Number(e.round)===round;if(result){const advanced=result.knockoutWinner?result.knockoutWinner===player:(Number(e?.round)>round||e?.winner===player),stateText=advanced?(round===LL_EURO_ROUNDS.length-1?'Kupa kazanıldı':'Tur geçildi'):'Elendi';return `<details class="ll-round-card" ${round===Number(e?.round)||(!e?.alive&&!advanced)?'open':''}><summary><span>${name}</span><span class="ll-round-meta">${stateText}</span></summary><div class="ll-fixture-list">${llV2FixtureRow(result.home,result.away,result)}<div class="ll-muted" style="padding:8px 4px">${advanced?(round===LL_EURO_ROUNDS.length-1?`${llV2EuroLabel(type)} şampiyonluğu`:`Sıradaki tur: ${LL_EURO_ROUNDS[round+1]}`):`${name} aşamasında Avrupa serüveni sona erdi.`}</div></div></details>`;}const status=current?'Güncel tur':participates&&!e?.alive?'Serüven sona erdi':'Bekliyor',body=pending?llV2FixtureRow(pending.home,pending.away,null):`<div class="ll-muted" style="padding:8px 4px">${current?`${LL_EURO_WEEKS[round]}. hafta civarında oynanacak; eşleşme hazır olduğunda rakip burada görünür.`:'Eşleşme önceki tur tamamlanınca belli olacak.'}</div>`;return `<details class="ll-round-card" ${current?'open':''}><summary><span>${name}</span><span class="ll-round-meta">${LL_EURO_WEEKS[round]}. hafta · ${status}</span></summary><div class="ll-fixture-list">${body}</div></details>`;}).join('')}</div>`;
}
function llRenderCompetitionCenter(tab='league',key=llTeamLeague(lexLeague.state.playerTeam)||'first'){
  const s=lexLeague.state;if(!s){renderLexiconLeagueLanding();return;}llSetWide(true);llV2RepairCupProgress(s);llV2EnsureEuropeStandings(s);const c=s.cup||{},playerCupMatches=(s.results||[]).filter(r=>r.competition==='cup'&&(r.home===s.playerTeam||r.away===s.playerTeam)).length,cupStatus=c.winner?`Şampiyon: ${c.winner}`:c.alive?'Kupada devam ediyor':'Kupadan elendi',euroType=['ucl','uel','uecl'].includes(key)?key:(s.europe?.type||'ucl'),leagueKey=['super','first'].includes(key)?key:(llTeamLeague(s.playerTeam)||'first');
  const tabs=`<div class="ll-comp-tabs"><button class="ll-comp-tab ${tab==='league'?'active':''}" onclick="llRenderCompetitionCenter('league','${llTeamLeague(s.playerTeam)||'first'}')">Ligler ve Fikstür</button><button class="ll-comp-tab ${tab==='cup'?'active':''}" onclick="llRenderCompetitionCenter('cup','${llTeamLeague(s.playerTeam)||'first'}')">Ziraat Türkiye Kupası</button><button class="ll-comp-tab ${tab==='europe'?'active':''}" onclick="llRenderCompetitionCenter('europe','${euroType}')">Avrupa Kupaları</button></div>`;
  const league=`<div class="ll-subtabs"><button class="ll-btn ${leagueKey==='super'?'primary':''}" onclick="llRenderCompetitionCenter('league','super')">Süper Lig</button><button class="ll-btn ${leagueKey==='first'?'primary':''}" onclick="llRenderCompetitionCenter('league','first')">TFF 1. Lig</button></div><div class="ll-card"><div class="ll-card-title">${llLeagueLabel(leagueKey)} Puan Tablosu</div>${llTableHtml(leagueKey)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llLeagueLabel(leagueKey)} · Tüm Eşleşmeler</div>${llV2LeagueFixturesHtml(leagueKey)}</div>`;
  const cup=`<div class="ll-cup-status"><div class="ll-metric"><strong>${cupStatus}</strong><span>Durum</span></div><div class="ll-metric"><strong>${c.winner?LL_CUP_ROUNDS.length:Math.min((c.round||0)+1,LL_CUP_ROUNDS.length)}/${LL_CUP_ROUNDS.length}</strong><span>Tur</span></div><div class="ll-metric"><strong>${playerCupMatches}</strong><span>Oynadığın Kupa Maçı</span></div></div><div class="ll-card"><div class="ll-card-title">Türkiye Kupası · Tüm Turlar ve Eşleşmeler</div>${llV2CupRoundsHtml()}</div>`;
  const activeText=s.europe?.type===euroType?(s.europe.alive?`${llV2EuroLabel(euroType)}'nde devam ediyorsun`:`${llV2EuroLabel(euroType)} serüvenin tamamlandı`):`Bu sezon ${llV2EuroLabel(euroType)} katılımın yok`,playerEuroMatches=(s.results||[]).filter(r=>r.competition===euroType&&(r.home===s.playerTeam||r.away===s.playerTeam)).length;
  const europe=`<div class="ll-subtabs"><button class="ll-btn ${euroType==='ucl'?'primary':''}" onclick="llRenderCompetitionCenter('europe','ucl')">Şampiyonlar Ligi</button><button class="ll-btn ${euroType==='uel'?'primary':''}" onclick="llRenderCompetitionCenter('europe','uel')">Avrupa Ligi</button><button class="ll-btn ${euroType==='uecl'?'primary':''}" onclick="llRenderCompetitionCenter('europe','uecl')">Konferans Ligi</button></div><div class="ll-cup-status"><div class="ll-metric"><strong>${activeText}</strong><span>Senin Durumun</span></div><div class="ll-metric"><strong>${playerEuroMatches}</strong><span>Oynadığın Maç</span></div><div class="ll-metric"><strong>${llV2EnsureEuropeStandings(s)[euroType].playedRounds}/${LL_EURO_WEEKS.length}</strong><span>İşlenen Tur</span></div></div><div class="ll-notice">Bu puan tablosu Avrupa eleme maçlarındaki sezon performansını karşılaştırır. Galibiyet 3, beraberlik 1 puandır; tur atlamayı puan sırası değil, oynanan eleme maçının sonucu belirler.</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llV2EuroLabel(euroType)} · Üst Tur Yol Haritası</div>${llV2EuropeRoadHtml(euroType)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llV2EuroLabel(euroType)} · Puan Durumu</div>${llV2EuropeTableHtml(euroType)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llV2EuroLabel(euroType)} · Tüm Eşleşmeler</div>${llV2EuropeFixturesHtml(euroType)}</div>`;
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Müsabaka <em>Merkezi</em></div><div class="ll-muted">Sezon ${s.season} · Lig, kupa ve Avrupa eşleşmeleri</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div>${tabs}${tab==='cup'?cup:tab==='europe'?europe:league}</div></div>`;
}
function llRenderStandings(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){llRenderCompetitionCenter('league',key);}
function llV2RewardTable(){return `<div class="ll-card"><div class="ll-card-title">AP / LP Ödülleri</div><div class="ll-table-wrap"><table class="ll-table" style="min-width:520px"><thead><tr><th>Organizasyon</th><th>Doğru AP</th><th>Galibiyet LP</th><th>Beraberlik LP</th><th>Mağlubiyet LP</th></tr></thead><tbody>${[['Lig',LL_COMP_REWARDS.league],['Türkiye Kupası',LL_COMP_REWARDS.cup],['Play-Off',LL_COMP_REWARDS.playoff],['Şampiyonlar Ligi',LL_COMP_REWARDS.ucl],['Avrupa Ligi',LL_COMP_REWARDS.uel],['Konferans Ligi',LL_COMP_REWARDS.uecl]].map(([n,r])=>`<tr><td>${n}</td><td>${r.ap}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td></tr>`).join('')}</tbody></table></div><div class="ll-muted" style="margin-top:9px">Aktif yanlış listesindeki bir kelimeyi doğru bilmek ayrıca +${LL_RECOVERY_AP} AP kazandırır.</div></div>`;}
function llTransferWindowBanner(week){if(!llIsTransferWindow(week))return '';const seasonEnd=!!lexLeague.state?.seasonEnded,n=Number(week),early=n>=1&&n<=3,cost=llShopCost(),period=seasonEnd?`Sezon ${lexLeague.state.season} sonu`:early?`Sezon başlangıcı · ${n}/3. açık hafta`:`${week}. hafta`;return `<div class="ll-transfer-banner"><div><strong>🛒 TRANSFER DÖNEMİ AÇIK</strong><span>${period} · Kart kasası ${cost} AP · Mevcut AP: ${lexLeague.state.ap}${early?' · 4. hafta kapanır':''}</span></div><button class="ll-btn" onclick="llRenderShop()">Transfer Merkezine Git</button></div>`;}
function llRenderDashboard(){
  const s=lexLeague.state;if(!s){renderLexiconLeagueLanding();return;}if(s.seasonEnded){llRenderSeasonEnd();return;}lexLeague.active=true;llSetWide(true);llClearTransient();llV2EnsureSpecial();
  const f=llPlayerFixture();if(!f){llCompleteSeason();return;}const key=llTeamLeague(s.playerTeam),team=llTeamState(s.playerTeam),def=llTeamDef(s.playerTeam),oppName=f.home===s.playerTeam?f.away:f.home,opp=llTeamState(oppName),oppDef=llTeamDef(oppName),comp=f.competition||'league';
  const compLabel=comp==='league'?llLeagueLabel(key):comp==='cup'?'Ziraat Türkiye Kupası':comp==='playoff'?'1. Lig Play-Off':comp==='ucl'?'Şampiyonlar Ligi':comp==='uel'?'Avrupa Ligi':'Konferans Ligi',importance=llV2MatchImportance(f,key);
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div class="ll-brand"><div class="ll-brand-mark">${llTeamLogo(def,'brand')}</div><div><div class="ll-title">${llEscape(s.playerTeam)}</div><div class="ll-muted">Sezon ${s.season} · ${llLeagueLabel(key)} · ${s.week}. hafta</div></div></div><div class="ll-actions"><button class="ll-btn" onclick="llRenderStandings('${key}')">Lig Tablosu</button><button class="ll-btn" onclick="llRenderStandings('${key==='super'?'first':'super'}')">Diğer Lig</button><button class="ll-btn" onclick="llRenderCompetitionCenter('europe','${s.europe?.type||'ucl'}')">Avrupa Kupaları</button><button class="ll-btn" onclick="llRenderSeasonArchive()">Sezon Arşivi</button><button class="ll-btn" onclick="llRenderCardArchive()">Kart Arşivi</button>${llIsTransferWindow(s.week)?'<button class="ll-btn gold" onclick="llRenderShop()">Transfer Merkezi</button>':''}<button class="ll-btn" onclick="llGoMainMenu()">Ana Menü</button></div></div><div class="ll-metrics"><div class="ll-metric"><strong>${s.ap}</strong><span>AP</span></div><div class="ll-metric"><strong>${s.lp}</strong><span>LP</span></div><div class="ll-metric"><strong>${llStars(team.stars)}</strong><span>Yıldız</span></div><div class="ll-metric"><strong>${llSortTable(key).findIndex(x=>x.team===s.playerTeam)+1}.</strong><span>Sıra</span></div></div><div class="ll-grid"><div><div class="ll-card ${importance?'ll-big-match':''}">${importance?`<div class="ll-match-importance">${importance}</div>`:''}<div class="ll-card-title">${compLabel} · ${f.roundLabel||''}</div><div class="ll-next-match"><div class="ll-club"><div class="ll-club-icon">${llTeamLogo(def,'match')}</div><b>${llEscape(s.playerTeam)}</b></div><div class="ll-vs">VS</div><div class="ll-club"><div class="ll-club-icon">${llTeamLogo(oppDef,'match')}</div><b>${llEscape(oppName)}</b></div></div><button class="ll-btn primary" style="width:100%;margin-top:13px" onclick="llStartMatchPreparation()">10 Kelimelik Maça Başla</button></div><div class="ll-card" style="margin-top:12px"><div class="ll-card-title">Kadro ve Yetenekler</div><div class="ll-squad">${LL_POSITIONS.map(pos=>`<div class="ll-slot"><div class="ll-slot-head"><span class="ll-position">${LL_POSITION_ICONS[pos]} ${pos}</span><span class="ll-die-mini star${team.stars}">${llRangeText(team.stars)}</span></div>${llCardHtml(team.cards[pos],s.playerTeam)}</div>`).join('')}</div>${llRealCardSynergyHtml(s.playerTeam)}<button class="ll-btn" style="width:100%;margin-top:12px" ${team.stars>=6?'disabled':''} onclick="llUpgradeStars()">${team.stars>=6?'Maksimum 6 yıldız':`Yıldızı Yükselt · ${llV2UpgradeCost(team.stars)} LP`}</button></div><div style="margin-top:12px">${llV2SeasonGoalsHtml(false)}</div>${llV2RewardTable()}</div><div>${llTableHtml(key)}</div></div></div></div>`;
  const transferBanner=llTransferWindowBanner(s.week);if(transferBanner)llArea().innerHTML=llArea().innerHTML.replace('<div class="ll-grid">',`${transferBanner}<div class="ll-grid">`);
}

function llFinishLeagueQuiz(){const q=lexLeague.quiz;if(!q||q.committed)return;q.committed=true;const comp=llPlayerFixture()?.competition||'league',reward=LL_COMP_REWARDS[comp]||LL_COMP_REWARDS.league,baseAp=q.correct*reward.ap,recoveryAp=Number(q.recoveryBonus||0),ap=baseAp+recoveryAp;lexLeague.state.ap+=ap;const completed=!q.skipped&&q.index>=q.queue.length;let bonus='none';if(completed&&q.correct===10){bonus='perfect';lexLeague.state.lp+=10;}else if(completed&&q.correct===9)bonus='reroll';q.baseApEarned=baseAp;q.recoveryApEarned=recoveryAp;q.apEarned=ap;q.reward=bonus;q.totalAnswered=Number.isFinite(q.totalAnswered)?q.totalAnswered:q.index;llSave();llRenderQuizReward();}
function llRecordMatch(home,away,hg,ag,week,userMatch=false,competition='league',league=null){
  if(competition==='league'){llUpdateStanding(home,hg,ag);llUpdateStanding(away,ag,hg);[[home,hg,ag],[away,ag,hg]].forEach(([n,gf,ga])=>{if(n===lexLeague.state.playerTeam)return;const t=llTeamState(n);t.aiAp=(t.aiAp||0)+(gf>ga?20:gf===ga?12:6);});}
  else if(['ucl','uel','uecl'].includes(competition)&&league==='euro-table')llV2ApplyEuropeStanding(lexLeague.state,competition,home,hg,away,ag);
  const euroRound=userMatch&&['ucl','uel','uecl'].includes(competition)?Number(lexLeague.state.europe?.round):null;lexLeague.state.results.push({season:lexLeague.state.season,week,home,away,homeGoals:hg,awayGoals:ag,userMatch,competition,league,cupRound:competition==='cup'?lexLeague.state.cup?.round:null,euroRound:Number.isInteger(euroRound)?euroRound:null});
}
function llV2SimFixture(f,competition='league',league=null,week=lexLeague.state.week){const sim=llSimulateMatch(f.home,f.away);llRecordMatch(f.home,f.away,sim.homeGoals,sim.awayGoals,week,false,competition,league);llApplyLocks(sim.resolution,f.home,f.away);return sim.homeGoals===sim.awayGoals?(Math.random()<.5?f.home:f.away):sim.homeGoals>sim.awayGoals?f.home:f.away;}
function llV2PlayLeagueWeek(key,skipFixture){const round=lexLeague.state.schedules[key]?.[lexLeague.state.week-1]||[];round.filter(f=>!skipFixture||!(f.home===skipFixture.home&&f.away===skipFixture.away)).forEach(f=>llV2SimFixture(f,'league',key));}
function llCommitCurrentMatch(){
  const m=lexLeague.match;if(!m||m.committed||!m.resolution)return;m.committed=true;const s=lexLeague.state,f=m.fixture,comp=f.competition||'league',r=m.resolution,hg=m.playerHome?r.scoreA:r.scoreB,ag=m.playerHome?r.scoreB:r.scoreA,pg=r.scoreA,og=r.scoreB,reward=LL_COMP_REWARDS[comp]||LL_COMP_REWARDS.league;
  const lp=pg>og?reward.win:pg===og?reward.draw:reward.loss;s.lp+=lp;
  const usedCardIds=(m.playerDice||[]).map(die=>die.cardId).filter(Boolean),triggeredCardIds=llTriggeredPlayerCardIds(m);llRecordPlayerCardPerformance(usedCardIds,pg>og?'win':pg===og?'draw':'loss',comp,pg,og,triggeredCardIds);
  llRecordMatch(f.home,f.away,hg,ag,s.week,true,comp,f.league||null);llApplyLocks(r,m.player,m.opponent);
  let winner=pg===og?(Math.random()<.5?m.player:m.opponent):pg>og?m.player:m.opponent;
  if(comp!=='league'){const recorded=s.results[s.results.length-1];if(recorded?.userMatch)recorded.knockoutWinner=winner;}
  if(comp==='league'){llV2PlayLeagueWeek('super',f.league==='super'?f:null);llV2PlayLeagueWeek('first',f.league==='first'?f:null);llDevelopOpponents(s.week);s.week++;}
  else if(comp==='cup')llV2FinishCupRound(winner);
  else if(['ucl','uel','uecl'].includes(comp))llV2FinishEuropeRound(winner);
  else if(comp==='playoff')llV2FinishPlayoffMatch(winner);
  s.pendingFixture=null;llSave();llRenderRoundSummary(s.week-(comp==='league'?1:0),lp,pg,og,comp,winner===m.player);
}
function llRenderRoundSummary(completedWeek,lp,pg,og,comp='league',advanced=false){
  const isEurope=['ucl','uel','uecl'].includes(comp),label=comp==='league'?'Lig':comp==='cup'?'Türkiye Kupası':comp==='playoff'?'Play-Off':isEurope?llV2EuroLabel(comp):comp.toUpperCase(),result=pg>og?'Galibiyet':pg===og?'Beraberlik':'Mağlubiyet',e=lexLeague.state.europe;
  const completedRound=isEurope?Math.max(0,Math.min(LL_EURO_ROUNDS.length-1,advanced?Number(e?.round||1)-1:Number(e?.round||0))):null,stageName=isEurope?LL_EURO_ROUNDS[completedRound]:'',nextStage=isEurope&&advanced?(e?.winner===lexLeague.state.playerTeam?'Avrupa kupasını kazandın.':`Sıradaki tur: ${LL_EURO_ROUNDS[Number(e?.round)||0]} · ${LL_EURO_WEEKS[Number(e?.round)||0]}. hafta`):isEurope?`${stageName} aşamasında elendin.`:'';
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel" style="text-align:center"><div class="quiz-start-title">${label} · ${result} <em>${pg}-${og}</em></div><div class="ll-notice">+${lp} LP${comp!=='league'&&pg===og?` · Penaltılar: ${advanced?'Tur atladın':'Elendin'}`:''}${isEurope?`<br><b>${stageName}:</b> ${llEscape(nextStage)}`:''}</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">${isEurope?`<button class="ll-btn" onclick="llRenderCompetitionCenter('europe','${comp}')">Avrupa Tur Yolunu Gör</button>`:''}<button class="ll-btn primary" onclick="llRenderDashboard()">Devam Et</button></div></div></div>`;
}

function llV2InitCup(state){
  const domestic=llShuffle([...state.leagues.super,...state.leagues.first]),preliminary=domestic.slice(0,12),byes=domestic.slice(12),field=[...preliminary,...byes.flatMap(team=>[team,null])];
  state.cup={round:0,field,alive:true,winner:null,pending:null,formatVersion:2,history:{0:[...field]}};
}
function llV2RepairCupProgress(state){
  const c=state?.cup;if(!c||c.pending||c.winner||!c.alive||!Array.isArray(c.field))return;
  if(c.round===0){
    const hasEmptyPair=Array.from({length:Math.ceil(c.field.length/2)},(_,i)=>[c.field[i*2],c.field[i*2+1]]).some(([a,b])=>!a&&!b);
    if(hasEmptyPair){llV2InitCup(state);return;}c.history=c.history||{0:[...c.field]};c.formatVersion=2;return;
  }
  const player=state.playerTeam,played=(state.results||[]).filter(r=>r.competition==='cup'&&(r.home===player||r.away===player));
  const openingPlayed=played.some(r=>Number(r.week)<=LL_CUP_WEEKS[0]),maxProcessed=Math.min(LL_CUP_ROUNDS.length,played.length+(openingPlayed?0:1));
  const expectedCurrent=64>>Math.min(c.round,5),skippedPlayerRound=c.round>maxProcessed,malformedSize=c.field.length!==expectedCurrent;
  if(!skippedPlayerRound&&!malformedSize){c.history=c.history||{};if(!c.history[c.round])c.history[c.round]=[...c.field];c.formatVersion=2;return;}
  const targetRound=skippedPlayerRound?maxProcessed:c.round,expectedSize=64>>Math.min(targetRound,5),domestic=[...state.leagues.super,...state.leagues.first];
  const candidates=[...new Set([...c.field.filter(Boolean),...llShuffle(domestic)])].filter(n=>n!==player),field=[player,...candidates.slice(0,Math.max(0,expectedSize-1))];
  c.round=targetRound;c.field=llShuffle(field);c.pending=null;c.formatVersion=2;c.history=c.history||{};c.history[targetRound]=[...c.field];
  if(state.pendingFixture?.competition==='cup')state.pendingFixture=null;
}
function llV2EnsureSpecial(){const s=lexLeague.state;if(s.pendingFixture||s.seasonEnded)return;if(s.playoff){llV2EnsurePlayoff();return;}llV2EnsureCup();if(s.pendingFixture)return;llV2EnsureEurope();}
function llV2EnsureCup(){const s=lexLeague.state;llV2RepairCupProgress(s);const c=s.cup;if(!c||c.round>=LL_CUP_WEEKS.length||s.week<LL_CUP_WEEKS[c.round]||c.pending)return;c.history=c.history||{};c.history[c.round]=[...c.field];const next=[];let playerPair=null;for(let i=0;i<c.field.length;i+=2){const a=c.field[i],b=c.field[i+1];if(!a&&!b)continue;if(!a||!b){next.push(a||b);continue;}if(a===s.playerTeam||b===s.playerTeam){playerPair=[a,b];continue;}next.push(llV2SimFixture({home:a,away:b},'cup'));}if(playerPair){c.pending={next,pair:playerPair};s.pendingFixture={home:playerPair[0],away:playerPair[1],competition:'cup',roundLabel:LL_CUP_ROUNDS[c.round]};}else{c.field=next;c.round++;if(c.field.length===1){c.winner=c.field[0];c.alive=false;}}}
function llV2FinishCupRound(winner){const c=lexLeague.state.cup;if(!c?.pending)return;c.pending.next.push(winner);c.field=c.pending.next;c.pending=null;c.round++;if(winner!==lexLeague.state.playerTeam)c.alive=false;if(c.field.length===1){c.winner=c.field[0];if(c.winner===lexLeague.state.playerTeam)lexLeague.state.trophies.push({season:lexLeague.state.season,name:'Ziraat Türkiye Kupası'});}}
function llV2EnsureEurope(){
  const s=lexLeague.state;llV2SimulateEuropeTables();const e=s.europe;if(!e||!e.alive||e.round>=LL_EURO_WEEKS.length||s.week<LL_EURO_WEEKS[e.round]||e.pending)return;
  const table=llV2EnsureEuropeStandings(s)[e.type],scheduled=table?.fixtures?.[e.round]?.find(f=>f.home===s.playerTeam||f.away===s.playerTeam),fallback=table?.teams?.find(name=>name!==s.playerTeam)||UCL_TEAMS.find(team=>team.name!==s.playerTeam)?.name,home=scheduled?.home||(e.round%2?s.playerTeam:fallback),away=scheduled?.away||(e.round%2?fallback:s.playerTeam),oppName=home===s.playerTeam?away:home,opp=UCL_TEAMS.find(team=>team.name===oppName);
  if(!s.teams[oppName])s.teams[oppName]={name:oppName,stars:opp?.pot===1?6:opp?.pot===2?5:opp?.pot===3?4:3,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};
  e.pending=oppName;s.pendingFixture={home,away,competition:e.type,league:'euro-table',roundLabel:LL_EURO_ROUNDS[e.round]};
}
function llV2FinishEuropeRound(winner){const e=lexLeague.state.europe;if(!e)return;e.pending=null;if(winner!==lexLeague.state.playerTeam){e.alive=false;return;}e.round++;if(e.round>=LL_EURO_ROUNDS.length){e.winner=lexLeague.state.playerTeam;e.alive=false;lexLeague.state.trophies.push({season:lexLeague.state.season,name:e.type==='ucl'?'UEFA Şampiyonlar Ligi':e.type==='uel'?'UEFA Avrupa Ligi':'UEFA Konferans Ligi'});}}

function llV2FinishRemainingLeague(){const s=lexLeague.state;for(const key of ['super','first'])for(let w=0;w<s.schedules[key].length;w++){const round=s.schedules[key][w];if(round.every(f=>s.results.some(r=>r.season===s.season&&r.competition==='league'&&r.home===f.home&&r.away===f.away)))continue;round.forEach(f=>llV2SimFixture(f,'league',key,w+1));}}
function llV2AiPlayoffWinner(rows){const win=(a,b)=>llV2SimFixture({home:a,away:b},'playoff');const q1=win(rows[3].team,rows[6].team),q2=win(rows[4].team,rows[5].team),sf=win(q1,q2);return win(rows[2].team,sf);}
function llCompleteSeason(){const s=lexLeague.state;llV2FinishRemainingLeague();const first=llSortTable('first'),pos=first.findIndex(r=>r.team===s.playerTeam)+1;if(llTeamLeague(s.playerTeam)==='first'&&pos>=3&&pos<=7){llV2StartPlayerPlayoff(first,pos);llSave();llRenderDashboard();return;}llV2FinalizeSeason(llV2AiPlayoffWinner(first));}
function llV2StartPlayerPlayoff(rows,pos){const s=lexLeague.state,seed3=rows[2].team,q1=[rows[3].team,rows[6].team],q2=[rows[4].team,rows[5].team];s.playoff={seed3,stage:null,other:null};if(pos===3){const w1=llV2SimFixture({home:q1[0],away:q1[1]},'playoff'),w2=llV2SimFixture({home:q2[0],away:q2[1]},'playoff'),sf=llV2SimFixture({home:w1,away:w2},'playoff');s.playoff.stage='final';s.playoff.opponent=sf;}else{const mine=q1.includes(s.playerTeam)?q1:q2,other=mine===q1?q2:q1;s.playoff.other=llV2SimFixture({home:other[0],away:other[1]},'playoff');s.playoff.stage='qf';s.playoff.opponent=mine.find(n=>n!==s.playerTeam);}}
function llV2EnsurePlayoff(){const s=lexLeague.state,p=s.playoff;if(!p||s.pendingFixture)return;s.pendingFixture={home:s.playerTeam,away:p.opponent,competition:'playoff',roundLabel:p.stage==='qf'?'Play-Off 1. Tur':p.stage==='sf'?'Play-Off Yarı Final':'Play-Off Final'};}
function llV2FinishPlayoffMatch(winner){const s=lexLeague.state,p=s.playoff;if(winner!==s.playerTeam){const aiWinner=p.stage==='final'?p.opponent:p.stage==='sf'?llV2SimFixture({home:p.opponent,away:p.seed3},'playoff'):llV2SimFixture({home:llV2SimFixture({home:p.opponent,away:p.other},'playoff'),away:p.seed3},'playoff');s.playoff=null;llV2FinalizeSeason(aiWinner);return;}if(p.stage==='qf'){p.stage='sf';p.opponent=p.other;}else if(p.stage==='sf'){p.stage='final';p.opponent=p.seed3;}else{s.playoff=null;llV2FinalizeSeason(s.playerTeam);}}
function llV2Qualifications(superRows,cupWinner){const q={ucl:[superRows[0].team,superRows[1].team],uel:[],uecl:[]},used=new Set(q.ucl);if(cupWinner&&!used.has(cupWinner)){q.uel.push(cupWinner);used.add(cupWinner);}for(const row of superRows){if(used.has(row.team))continue;if(q.uel.length<2){q.uel.push(row.team);used.add(row.team);}else if(q.uecl.length<2){q.uecl.push(row.team);used.add(row.team);}if(q.uecl.length===2)break;}return q;}
function llV2SnapshotRows(rows,state){return (rows||[]).map((row,index)=>({...llDeep(row),position:index+1,stars:llV2TeamStarsInState(state,row.team)}));}
function llV2ArchiveSeason(state,summary){
  if(!state||!summary?.superRows||!summary?.firstRows)return null;if(!Array.isArray(state.seasonHistory))state.seasonHistory=[];
  const entry={version:LL_SEASON_HISTORY_VERSION,season:Number(summary.season),superRows:llV2SnapshotRows(summary.superRows,state),firstRows:llV2SnapshotRows(summary.firstRows,state),cupWinner:summary.cupWinner||null,playoffWinner:summary.playoffWinner||null,relegated:[...(summary.relegated||[])],promoted:[...(summary.promoted||[])],qualifications:llDeep(summary.qualifications||{ucl:[],uel:[],uecl:[]}),playerLeague:summary.playerLeague||null,playerPosition:Number(summary.playerPosition||0)};
  const index=state.seasonHistory.findIndex(item=>Number(item.season)===entry.season);if(index>=0)state.seasonHistory[index]=entry;else state.seasonHistory.push(entry);state.seasonHistory.sort((a,b)=>a.season-b.season);return entry;
}
function llV2ArchivedTableHtml(entry,key){
  const rows=key==='super'?entry.superRows:entry.firstRows,q=entry.qualifications||{ucl:[],uel:[],uecl:[]},ucl=new Set(q.ucl||[]),uel=new Set(q.uel||[]),uecl=new Set(q.uecl||[]);
  return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((r,i)=>{const euro=key!=='super'?'':ucl.has(r.team)?'ucl-zone ':uel.has(r.team)?'uel-zone ':uecl.has(r.team)?'uecl-zone ':'';return `<tr class="${r.team===lexLeague.state.playerTeam?'player ':''}${key==='first'&&i<2?'champion-zone ':''}${key==='first'&&i>=2&&i<=6?'playoff-zone ':''}${euro}${key==='super'&&i>=rows.length-3?'relegation-zone ':''}"><td>${i+1}</td><td>${llTeamLogo(r.team,'table')}${llEscape(r.team)} <span class="ll-stars">${llStars(Number(r.stars||llV2TeamStarsInState(lexLeague.state,r.team)))}</span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GD}</td><td><b>${r.Pts}</b></td></tr>`;}).join('')}</tbody></table></div>`;
}
function llRenderSeasonArchive(season=null,key='super'){
  const s=lexLeague.state,history=[...(s?.seasonHistory||[])].sort((a,b)=>b.season-a.season);llSetWide(true);if(!history.length){llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Sezon <em>Arşivi</em></div><div class="ll-muted">Tamamlanan sezonların iki lig tablosu burada saklanacak.</div></div><button class="ll-btn" onclick="${s?.seasonEnded?'llRenderSeasonEnd()':'llRenderDashboard()'}">← Geri</button></div><div class="ll-notice">Henüz tamamlanmış ve arşivlenmiş sezon yok.</div></div></div>`;return;}
  const requested=Number(season),entry=history.find(item=>item.season===requested)||history[0],league=key==='first'?'first':'super',back=s.seasonEnded?'llRenderSeasonEnd()':'llRenderDashboard()';
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Sezon <em>Arşivi</em></div><div class="ll-muted">Süper Lig ve TFF 1. Lig sezon sonu puan durumları kalıcı olarak saklanır.</div></div><button class="ll-btn" onclick="${back}">← Geri</button></div><div class="ll-comp-tabs">${history.map(item=>`<button class="ll-comp-tab ${item.season===entry.season?'active':''}" onclick="llRenderSeasonArchive(${item.season},'${league}')">Sezon ${item.season}</button>`).join('')}</div><div class="ll-actions" style="margin:13px 0"><button class="ll-btn ${league==='super'?'primary':''}" onclick="llRenderSeasonArchive(${entry.season},'super')">Süper Lig</button><button class="ll-btn ${league==='first'?'primary':''}" onclick="llRenderSeasonArchive(${entry.season},'first')">TFF 1. Lig</button></div><div class="ll-metrics"><div class="ll-metric"><strong>${llEscape(entry.superRows?.[0]?.team||'—')}</strong><span>Süper Lig Şampiyonu</span></div><div class="ll-metric"><strong>${llEscape(entry.firstRows?.[0]?.team||'—')}</strong><span>1. Lig Şampiyonu</span></div><div class="ll-metric"><strong>${llEscape(entry.cupWinner||'—')}</strong><span>Türkiye Kupası</span></div><div class="ll-metric"><strong>${entry.playerPosition||'—'}.</strong><span>Senin Sıran</span></div></div><div class="ll-card-title" style="margin:16px 0 9px">Sezon ${entry.season} · ${llLeagueLabel(league)} Puan Durumu</div>${llV2ArchivedTableHtml(entry,league)}<div class="ll-zone-legend">${league==='first'?'<span><i class="ll-zone-dot direct"></i>1–2 Doğrudan yükselir</span><span><i class="ll-zone-dot playoff"></i>3–7 Play-Off</span>':'<span><i class="ll-zone-dot ucl"></i>Şampiyonlar Ligi</span><span><i class="ll-zone-dot uel"></i>Avrupa Ligi</span><span><i class="ll-zone-dot uecl"></i>Konferans Ligi</span><span><i class="ll-zone-dot relegation"></i>Son 3 düşer</span>'}</div></div></div>`;
}
function llV2FinalizeSeason(playoffWinner){const s=lexLeague.state,superRows=llSortTable('super'),firstRows=llSortTable('first'),relegated=superRows.slice(-3).map(r=>r.team),promoted=[firstRows[0].team,firstRows[1].team,playoffWinner],qualifications=llV2Qualifications(superRows,s.cup?.winner),playerLeague=llTeamLeague(s.playerTeam),summary={season:s.season,superRows:llV2SnapshotRows(superRows,s),firstRows:llV2SnapshotRows(firstRows,s),relegated,promoted,playoffWinner,cupWinner:s.cup?.winner,qualifications,playerLeague,playerPosition:(playerLeague==='super'?superRows:firstRows).findIndex(r=>r.team===s.playerTeam)+1,aiPromotionSupportApplied:true};promoted.filter(name=>name!==s.playerTeam).forEach(name=>{const team=s.teams[name];if(team)team.aiAp=Number(team.aiAp||0)+LL_PROMOTION_SUPPORT_AP;});s.lastSeasonSummary=summary;llV2EvaluateTeamTargets(s,summary);llV2EvaluateSeasonGoals(s,summary);llV2ArchiveSeason(s,summary);s.seasonEnded=true;llSave();llRenderSeasonEnd();}
function llRenderSeasonEnd(){const x=lexLeague.state.lastSeasonSummary;if(!x){llRenderDashboard();return;}llV2EvaluateTeamTargets(lexLeague.state,x);llV2EvaluateSeasonGoals(lexLeague.state,x);llV2ArchiveSeason(lexLeague.state,x);llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="quiz-start-title">Sezon ${x.season} <em>Tamamlandı</em></div><div class="ll-metrics"><div class="ll-metric"><strong>${x.playerPosition}.</strong><span>Sıra</span></div><div class="ll-metric"><strong>${x.cupWinner||'—'}</strong><span>Türkiye Kupası</span></div><div class="ll-metric"><strong>${x.promoted.length}</strong><span>Yükselen</span></div><div class="ll-metric"><strong>${x.relegated.length}</strong><span>Düşen</span></div></div>${llTransferWindowBanner(lexLeague.state.week)}${llV2SeasonGoalsHtml(true)}<div class="ll-grid" style="margin-top:14px"><div><div class="ll-card"><div class="ll-card-title">Süper Lig'den Düşenler</div><div class="ll-sub">${x.relegated.join(' · ')}</div></div><div class="ll-card" style="margin-top:12px"><div class="ll-card-title">Süper Lig'e Yükselenler</div><div class="ll-sub">${x.promoted.join(' · ')}</div></div></div>${llV2RewardTable()}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="ll-btn primary" onclick="llStartNextSeason()">Transferlerini Tamamla · Yeni Sezona Başla</button><button class="ll-btn" onclick="llRenderSeasonArchive(${x.season})">Sezon ${x.season} Puan Durumları</button></div></div></div>`;}
function llStartNextSeason(){const s=lexLeague.state,x=s.lastSeasonSummary,superSet=new Set(s.leagues.super),firstSet=new Set(s.leagues.first);x.relegated.forEach(n=>{superSet.delete(n);firstSet.add(n);});x.promoted.forEach(n=>{firstSet.delete(n);superSet.add(n);});s.leagues={super:[...superSet],first:[...firstSet]};s.season++;s.week=1;s.seasonEnded=false;s.standings={super:llBlankStandings(s.leagues.super),first:llBlankStandings(s.leagues.first)};s.schedules={super:llGenerateSchedule(s.leagues.super),first:llGenerateSchedule(s.leagues.first)};s.pendingFixture=null;s.playoff=null;s.results=[];s.europeStandings=null;s.aiTransferWindows={};s.lastSeasonSummary=null;s.teamSeasonTargets=null;s.seasonGoals=null;Object.values(s.teams).forEach(t=>{t.lastResults=[];t.wins=0;t.lockedDice={};});x.promoted.filter(name=>name!==s.playerTeam).forEach(name=>{const t=s.teams[name];while(t&&t.aiAp>=150){const attempt=llAiShopAttempt(name);if(!attempt.spent)break;}});const type=x.qualifications.ucl.includes(s.playerTeam)?'ucl':x.qualifications.uel.includes(s.playerTeam)?'uel':x.qualifications.uecl.includes(s.playerTeam)?'uecl':null;s.europe=type?{type,round:0,alive:true,pending:null,winner:null}:null;llV2InitCup(s);llV2RepairState(s);llSave();llRenderDashboard();}
function llDevelopOpponents(completedWeek){const s=lexLeague.state;if(completedWeek<10)return;if(!s.aiTransferWindows)s.aiTransferWindows={};[10,20,30].filter(w=>completedWeek>=w&&!s.aiTransferWindows[`${s.season}-${w}`]).forEach(w=>{LL_ALL_TEAMS.map(t=>t.name).filter(n=>n!==s.playerTeam).forEach(n=>{const t=llTeamState(n);while(t.aiAp>=150){const r=llAiShopAttempt(n);if(!r.spent)break;}});s.aiTransferWindows[`${s.season}-${w}`]=true;});}

/* Premium card packs and UEFA 2026/27 league-phase compatibility layer. */
const LL_PREMIUM_PACK_COST=900;
const LL_PREMIUM_EPIC_CHANCE=.65;
const LL_EURO_FORMAT_VERSION=3;
const LL_EURO_LEAGUE_WEEKS={ucl:[4,7,10,13,16,19,22,25],uel:[4,7,10,13,16,19,22,25],uecl:[4,7,10,13,16,19]};
const LL_EURO_KNOCKOUT_LABELS={playoff:'Eleme Turu Play-Off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',final:'Final'};

function llV3EnsurePremiumState(state){
  if(!state)return state;
  state.premiumPackPaidSeason=Math.max(0,Number(state.premiumPackPaidSeason)||0);
  state.sealedPremiumPacks=Math.max(0,Number(state.sealedPremiumPacks)||0);
  if(!Array.isArray(state.premiumPackHistory))state.premiumPackHistory=[];
  if(!state.objectivePremiumGranted||typeof state.objectivePremiumGranted!=='object')state.objectivePremiumGranted={};
  const pending=state.pendingPremiumPack;
  if(pending&&(!LL_POSITIONS.includes(pending.position)||!Array.isArray(pending.offers)||pending.offers.length!==2||pending.offers.some(id=>!llCard(id))))state.pendingPremiumPack=null;
  const regular=state.pendingRegularPack;
  if(regular&&(!LL_POSITIONS.includes(regular.position)||!Array.isArray(regular.offers)||regular.offers.length!==2||regular.offers.some(id=>!llCard(id))))state.pendingRegularPack=null;
  return state;
}
function llPaidPremiumPackUsed(state){return !!state&&(state.premiumPackHistory||[]).some(item=>Number(item?.season)===Number(state.season)&&item?.source==='paid');}
function llV3GrantObjectivePack(state,goals){
  llV3EnsurePremiumState(state);if(!goals?.evaluated)return false;
  const primary=(goals.results||[]).find(goal=>goal.id==='club_primary');
  const key=String(goals.season||state.season);if(!primary?.achieved||state.objectivePremiumGranted[key])return false;
  state.objectivePremiumGranted[key]=true;state.sealedPremiumPacks++;goals.premiumPackEarned=true;return true;
}
function llV3PremiumPool(position){
  const s=lexLeague.state,team=llTeamState(s.playerTeam),seen=new Set(llEnsureDiscoveredCards()),used=llTeamCardFamilyHistory(s.playerTeam);
  return LL_CARD_POOL.filter(card=>card.position===position&&['epic','legendary'].includes(card.rarity)&&Number(card.minStar||1)<=Number(team.stars||1)&&!seen.has(card.id)&&!used.has(llCardFamilyName(card)));
}
function llV3PickPremiumPair(pool){
  const pick=(source,blockedFamily)=>{const available=source.filter(card=>llCardFamilyName(card)!==blockedFamily),wanted=Math.random()<LL_PREMIUM_EPIC_CHANCE?'epic':'legendary',same=available.filter(card=>card.rarity===wanted),choices=same.length?same:available;return choices[Math.floor(Math.random()*choices.length)]||null;};
  const first=pick(pool,''),second=first?pick(pool,llCardFamilyName(first)):null;return first&&second?[first,second]:[];
}
function llOpenPremiumPack(position,source='paid'){
  const s=lexLeague.state;llV3EnsurePremiumState(s);
  if(!llIsTransferWindow(s.week)){alert('Elit rol paketi yalnızca transfer döneminde açılabilir.');return;}
  if(s.pendingPremiumPack){lexLeague.shop={mode:'premium',position:s.pendingPremiumPack.position,offers:[...s.pendingPremiumPack.offers],source:s.pendingPremiumPack.source};llRenderShopOffers();return;}
  if(s.pendingRegularPack){alert('Önce açık normal kasadaki iki karttan birini seç veya kasadan vazgeç.');lexLeague.shop={mode:'regular',position:s.pendingRegularPack.position,offers:[...s.pendingRegularPack.offers]};llRenderShopOffers();return;}
  if(!LL_POSITIONS.includes(position))return;
  if(source==='voucher'&&s.sealedPremiumPacks<1){alert('Kapalı ücretsiz elit paketin yok.');return;}
  if(source==='paid'&&llPaidPremiumPackUsed(s)){alert('Bu sezon ücretli elit paket hakkını kullandın. Hedef ödülü paketi bu sınırı tüketmez.');return;}
  if(source==='paid'&&s.ap<LL_PREMIUM_PACK_COST){alert(`Yetersiz AP. Gerekli: ${LL_PREMIUM_PACK_COST} AP`);return;}
  const pool=llV3PremiumPool(position);if(new Set(pool.map(llCardFamilyName)).size<2){alert('Bu rol ve takım yıldızı için iki farklı, kullanılabilir ve yeni Destansı/Efsanevi kart bulunmuyor. AP veya paket hakkı harcanmadı.');return;}
  const offers=llV3PickPremiumPair(pool);if(offers.length<2)return;
  if(source==='paid'){s.ap-=LL_PREMIUM_PACK_COST;s.premiumPackPaidSeason=s.season;}else s.sealedPremiumPacks--;
  const pending={season:s.season,source,position,offers:offers.map(card=>card.id),openedAt:new Date().toISOString()};s.pendingPremiumPack=pending;
  s.premiumPackHistory.push({...pending,status:'pending'});lexLeague.shop={mode:'premium',position,offers:[...pending.offers],source};llDiscoverCards(pending.offers);llSave();llRenderShop();
  llShowPackOpening('elite',pending.offers,{cost:source==='paid'?LL_PREMIUM_PACK_COST:0,source});
}
function llDeferPremiumPack(){
  const s=lexLeague.state;llV3EnsurePremiumState(s);const pending=s.pendingPremiumPack;
  if(pending){
    const history=[...s.premiumPackHistory].reverse().find(item=>item.status==='pending'&&Number(item.season)===Number(pending.season)&&item.position===pending.position&&item.offers?.length===pending.offers?.length&&item.offers.every(id=>pending.offers.includes(id)));
    if(history){history.status='skipped';history.skippedAt=new Date().toISOString();}
  }
  s.pendingPremiumPack=null;lexLeague.shop=null;llSave();llRenderShop();
}

const llV3RepairStateBase=llV2RepairState;
llV2RepairState=function(state){state=llV3RepairStateBase(state);llV3EnsurePremiumState(state);if(state?.seasonGoals?.evaluated)llV3GrantObjectivePack(state,state.seasonGoals);return state;};
const llV3EvaluateSeasonGoalsBase=llV2EvaluateSeasonGoals;
llV2EvaluateSeasonGoals=function(state,summary){const goals=llV3EvaluateSeasonGoalsBase(state,summary);llV3GrantObjectivePack(state,goals);return goals;};
const llV3SeasonGoalsHtmlBase=llV2SeasonGoalsHtml;
llV2SeasonGoalsHtml=function(final=false){const html=llV3SeasonGoalsHtmlBase(final),goals=lexLeague.state?.seasonGoals;if(!final||!goals?.premiumPackEarned)return html;return `${html}<div class="ll-notice" style="margin-top:12px"><b>🎁 Yönetim hedefi paketi:</b> Bir ücretsiz Elit Rol Paketi kazandın. Şimdi açabilir veya sonraki transfer dönemine saklayabilirsin.</div>`;};

const llV3RenderShopOffersBase=llRenderShopOffers;
llRenderShopOffers=function(){
  const sh=lexLeague.shop;if(sh?.mode!=='premium'){llV3RenderShopOffersBase();return;}
  const host=document.getElementById('ll-shop-offers');if(!host)return;
  host.innerHTML=`<div class="ll-card" style="margin-top:16px;border-color:rgba(234,179,8,.7)"><div class="ll-card-title">✨ ${LL_POSITION_ICONS[sh.position]} ${sh.position} Elit Rol Paketi</div><div class="ll-notice" style="margin-bottom:12px">İki teklif de en az Destansı seviyededir. Birini seçtiğinde diğer teklif kapanır; sayfayı yenilemek kartları değiştirmez.</div><div class="ll-offers">${sh.offers.map(id=>{const c=llCard(id);return `<div class="ll-offer ${c.rarity}"><div class="ll-rarity">${LL_RARITY_LABELS[c.rarity]}</div><div class="ll-team-name">${llEscape(c.name)}</div><div class="ll-muted">${llEscape(c.position)} · Min ${c.minStar}★</div><div class="ll-sub" style="margin-top:9px"><b>Tetikleyici:</b> ${llEscape(c.trigger)}<br><b>Etki:</b> ${llEscape(c.effect)}</div><button class="ll-btn primary" style="width:100%;margin-top:13px" onclick="llChooseShopCard('${id}')">Bu Kartı Seç</button></div>`;}).join('')}</div><button class="ll-btn" style="width:100%;margin-top:12px" onclick="llDeferPremiumPack()">Sonra Seç · Paket Kayıtta Kalsın</button></div>`;
  host.insertAdjacentHTML('afterbegin','<div class="ll-pack-opened-banner">&#10024; EL&#304;T KASA A&#199;ILDI &middot; 2 KART SE&#199;&#304;M&#304;N&#304; BEKL&#304;YOR</div>');
  const discardButton=host.querySelector('button[onclick="llDeferPremiumPack()"]');
  if(discardButton){discardButton.classList.add('danger');discardButton.textContent='Paketi Atla · Kartları Alma ve Paketi Sil (İade Yok)';}
};
const llV3ChooseShopCardBase=llChooseShopCard;
llChooseShopCard=function(id){
  const sh=lexLeague.shop;if(sh?.mode!=='premium'){llV3ChooseShopCardBase(id);return;}if(!sh.offers.includes(id))return;
  const s=lexLeague.state,player=llTeamState(s.playerTeam),family=llCardFamilyName(llCard(id));if(!Array.isArray(player.usedCardFamilies))player.usedCardFamilies=[];if(family&&!player.usedCardFamilies.includes(family))player.usedCardFamilies.push(family);player.cards[sh.position]=id;llDiscoverCards([id]);
  const history=[...s.premiumPackHistory].reverse().find(item=>item.status==='pending'&&item.offers?.includes(id));if(history){history.status='chosen';history.chosen=id;history.chosenAt=new Date().toISOString();}
  s.pendingPremiumPack=null;lexLeague.shop=null;llSave();llRenderShop();
};
llRenderShop=function(){
  const s=lexLeague.state,week=Number(s.week),seasonEnd=!!s.seasonEnded,earlySeason=week>=1&&week<=3;if(!llIsTransferWindow(week)){alert('Transfer merkezi sezonun ilk 3 haftasında, 10., 20., 30. haftalarda ve sezon sonunda açıktır.');return;}
  llV3EnsurePremiumState(s);const pending=s.pendingPremiumPack,regularPending=s.pendingRegularPack;if(pending)lexLeague.shop={mode:'premium',position:pending.position,offers:[...pending.offers],source:pending.source};else if(regularPending)lexLeague.shop={mode:'regular',position:regularPending.position,offers:[...regularPending.offers]};else lexLeague.shop={position:null,offers:[]};
  const cost=llShopCost(),period=seasonEnd?`Sezon ${s.season} sonu`:earlySeason?`Sezon başlangıcı · ${week}/3. açık hafta`:`${week}. hafta`,paidUsed=llPaidPremiumPackUsed(s),packPending=!!(pending||regularPending);
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Transfer <em>Merkezi</em></div><div class="ll-muted">${period} · Normal kasa ${cost} AP · AP: ${s.ap}</div></div><button class="ll-btn" onclick="${seasonEnd?'llRenderSeasonEnd()':'llRenderDashboard()'}">← ${seasonEnd?'Sezon Sonu':'Dashboard'}</button></div><div class="ll-notice"><b>Tekrarsız teklifler:</b> Aynı transfer döneminde gördüğün kart ailesi yeniden çıkmaz. Elit paket de yalnızca kullanılabilir, daha önce keşfedilmemiş ve seçilen role ait kartlardan oluşur.</div>${packPending?`<div class="ll-notice" style="margin-top:12px;border-color:rgba(250,204,21,.42)"><b>📦 Açık kasa seçimi:</b> ${pending?'Elit':'Normal'} kasadaki iki karttan birini seçmeden yeni kasa açılamaz.</div>`:''}<div class="ll-shop-grid" style="margin-top:16px">${LL_POSITIONS.map(pos=>`<div class="ll-card"><div class="ll-slot-head"><div class="ll-card-title" style="margin:0">${LL_POSITION_ICONS[pos]} ${pos}</div><div class="ll-stars">${llStars(llTeamState(s.playerTeam).stars)}</div></div>${llCardHtml(llTeamState(s.playerTeam).cards[pos],s.playerTeam,'Mevcut kart yok')}<button class="ll-btn gold" style="width:100%;margin-top:11px" ${packPending?'disabled':''} onclick="llOpenShopPack('${pos}')">${cost} AP ile Kasa Aç</button></div>`).join('')}</div><div class="ll-card" style="margin-top:16px;border-color:rgba(234,179,8,.7);background:linear-gradient(135deg,rgba(88,28,135,.22),rgba(161,98,7,.18))"><div class="ll-card-title">✨ Elit Rol Paketi · ${LL_PREMIUM_PACK_COST} AP</div><div class="ll-sub">Seçtiğin role ait iki farklı kart açar. Her kart için Destansı %65 · Efsanevi %35. Sezon başına yalnızca bir ücretli paket; ücretsiz hedef paketi bu sınırı tüketmez.</div><div class="ll-muted" style="margin:8px 0 12px">${pending?'Açılmış elit paketin seçimi bekliyor; ücretsiz veya ücretli olduğu paket kaydında korunuyor.':regularPending?'Önce açık normal kasadaki seçimini tamamla.':paidUsed?'Bu sezon ücretli 900 AP paketi kullanıldı.':`Ücretli 900 AP paketi kullanılabilir · Mevcut AP: ${s.ap}`}${s.sealedPremiumPacks?` · Geçen sezon yönetim hedefi ödülü: ${s.sealedPremiumPacks}`:''}</div><div class="ll-actions">${LL_POSITIONS.map(pos=>`<button class="ll-btn gold" ${packPending||paidUsed?'disabled':''} onclick="llOpenPremiumPack('${pos}','paid')">${LL_POSITION_ICONS[pos]} ${pos} · ${LL_PREMIUM_PACK_COST} AP</button>`).join('')}${s.sealedPremiumPacks&&!packPending?LL_POSITIONS.map(pos=>`<button class="ll-btn primary" onclick="llOpenPremiumPack('${pos}','voucher')">🎁 ${pos} · Hedef Ödülü</button>`).join(''):''}</div></div><div id="ll-shop-offers"></div></div></div>`;
  if(packPending)llRenderShopOffers();
};

function llV3ValidQualifications(q){const all=['ucl','uel','uecl'].flatMap(type=>Array.isArray(q?.[type])?q[type]:[]);return ['ucl','uel','uecl'].every(type=>q?.[type]?.length===2)&&all.length===6&&new Set(all).size===6;}
function llV3ResolveEuropeQualifications(state){
  if(llV3ValidQualifications(state.europeQualifications))return state.europeQualifications;
  const latest=[...(state.seasonHistory||[])].sort((a,b)=>b.season-a.season).find(item=>Number(item.season)===Number(state.season)-1&&llV3ValidQualifications(item.qualifications));
  let q=latest?llDeep(latest.qualifications):null;
  if(!q){const ordered=[...(state.leagues?.super||[])].sort((a,b)=>llV2TeamStarsInState(state,b)-llV2TeamStarsInState(state,a)||a.localeCompare(b,'tr'));q={ucl:ordered.slice(0,2),uel:ordered.slice(2,4),uecl:ordered.slice(4,6)};}
  const legacyType=state.europe?.type;if(legacyType&&q[legacyType]&&!q[legacyType].includes(state.playerTeam)){
    ['ucl','uel','uecl'].forEach(type=>q[type]=q[type].filter(name=>name!==state.playerTeam));q[legacyType].push(state.playerTeam);q[legacyType]=q[legacyType].slice(-2);
    const used=new Set();['ucl','uel','uecl'].forEach(type=>{q[type]=q[type].filter(name=>!used.has(name));q[type].forEach(name=>used.add(name));for(const name of state.leagues.super||[]){if(q[type].length>=2)break;if(!used.has(name)){q[type].push(name);used.add(name);}}});
  }
  state.europeQualifications=q;return q;
}
function llV3BuildEuropeFixtures(teams,roundCount){
  let rotation=[...teams];const edges=[],byRound=Array.from({length:roundCount},()=>[]);
  for(let round=0;round<roundCount;round++){for(let i=0;i<rotation.length/2;i++){const edge={id:edges.length,round,a:rotation[i],b:rotation[rotation.length-1-i],home:null,away:null,used:false};edges.push(edge);byRound[round].push(edge);}rotation=[rotation[0],rotation[rotation.length-1],...rotation.slice(1,-1)];}
  const adjacency=Object.fromEntries(teams.map(team=>[team,[]]));edges.forEach(edge=>{adjacency[edge.a].push(edge.id);adjacency[edge.b].push(edge.id);});const cursor=Object.fromEntries(teams.map(team=>[team,0]));
  const nextEdge=team=>{while(cursor[team]<adjacency[team].length&&edges[adjacency[team][cursor[team]]].used)cursor[team]++;return adjacency[team][cursor[team]];};
  teams.forEach(root=>{if(nextEdge(root)==null)return;const stack=[root];while(stack.length){const team=stack[stack.length-1],edgeId=nextEdge(team);if(edgeId==null){stack.pop();continue;}const edge=edges[edgeId];edge.used=true;const other=edge.a===team?edge.b:edge.a;edge.home=team;edge.away=other;stack.push(other);}});
  return byRound.map(round=>round.map(edge=>({home:edge.home,away:edge.away})));
}
function llV3EuropeTeamOrder(qualifiers,foreign,roundCount){
  for(let position=1;position<36;position++){const list=[qualifiers[0],...foreign.slice(0,35)];list.splice(Math.min(position,list.length),0,qualifiers[1]);const teams=list.slice(0,36),fixtures=llV3BuildEuropeFixtures(teams,roundCount),same=fixtures.some(round=>round.some(f=>qualifiers.includes(f.home)&&qualifiers.includes(f.away)));if(!same)return {teams,fixtures};}
  const teams=[...qualifiers,...foreign].slice(0,36);return {teams,fixtures:llV3BuildEuropeFixtures(teams,roundCount)};
}
llV2CreateEuropeStandings=function(state){
  const types=['ucl','uel','uecl'],q=llV3ResolveEuropeQualifications(state),domestic=new Set(LL_ALL_TEAMS.map(team=>team.name)),base=[...new Set(UCL_TEAMS.map(team=>team.name))].filter(name=>!domestic.has(name));
  const standings={season:state.season,formatVersion:LL_EURO_FORMAT_VERSION,qualifications:llDeep(q)};
  types.forEach((type,typeIndex)=>{const rounds=LL_EURO_LEAGUE_WEEKS[type].length,shift=(Number(state.season)*7+typeIndex*11)%Math.max(1,base.length),foreign=[...base.slice(shift),...base.slice(0,shift)].filter(name=>!q[type].includes(name));while(foreign.length<34)foreign.push(`${llV2EuroLabel(type)} Kulübü ${foreign.length+1}`);const draw=llV3EuropeTeamOrder(q[type],foreign,rounds),teams=draw.teams;standings[type]={formatVersion:LL_EURO_FORMAT_VERSION,teams,standings:llBlankStandings(teams),fixtures:draw.fixtures,playedRounds:0,leagueMatches:rounds};});
  state.europeStandings=standings;
  (state.results||[]).filter(result=>types.includes(result.competition)&&result.league==='euro-table'&&Number(result.season)===Number(state.season)).forEach(result=>{const table=standings[result.competition];if(table?.teams.includes(result.home)&&table.teams.includes(result.away))llV2ApplyEuropeStanding(state,result.competition,result.home,result.homeGoals,result.away,result.awayGoals);});
  return standings;
};
llV2EnsureEuropeStandings=function(state){
  const valid=state.europeStandings&&Number(state.europeStandings.season)===Number(state.season)&&state.europeStandings.formatVersion===LL_EURO_FORMAT_VERSION&&['ucl','uel','uecl'].every(type=>{const table=state.europeStandings[type],count=LL_EURO_LEAGUE_WEEKS[type].length;return table?.teams?.length===36&&table.fixtures?.length===count&&table.fixtures.every(round=>round.length===18);});
  if(!valid)llV2CreateEuropeStandings(state);const q=llV3ResolveEuropeQualifications(state),type=['ucl','uel','uecl'].find(key=>q[key].includes(state.playerTeam));
  if(type){const count=LL_EURO_LEAGUE_WEEKS[type].length,userResults=(state.results||[]).filter(r=>r.competition===type&&r.league==='euro-table'&&r.userMatch&&(r.home===state.playerTeam||r.away===state.playerTeam)).length;if(!state.europe||state.europe.type!==type)state.europe={type,phase:'league',round:Math.min(count,userResults),alive:true,pending:null,winner:null,usedOpponents:[]};else if(!state.europe.phase){state.europe.phase='league';state.europe.round=Math.min(count,Math.max(Number(state.europe.round)||0,userResults));state.europe.alive=true;state.europe.usedOpponents=[];}}
  else if(state.europe?.phase==='league')state.europe=null;
  return state.europeStandings;
};
llV2SortEuropeTable=function(type){const table=llV2EnsureEuropeStandings(lexLeague.state)?.[type];return table?Object.values(table.standings).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||b.W-a.W||a.team.localeCompare(b.team,'tr')):[];};
llV2SimulateEuropeTables=function(){
  const s=lexLeague.state,tables=llV2EnsureEuropeStandings(s);['ucl','uel','uecl'].forEach(type=>{const table=tables[type],weeks=LL_EURO_LEAGUE_WEEKS[type],due=weeks.filter(week=>Number(s.week)>=week).length;while(table.playedRounds<due){const roundIndex=table.playedRounds,round=table.fixtures[roundIndex]||[];round.forEach(fixture=>{const exists=(s.results||[]).some(r=>r.season===s.season&&r.competition===type&&r.league==='euro-table'&&r.home===fixture.home&&r.away===fixture.away);if(exists||fixture.home===s.playerTeam||fixture.away===s.playerTeam)return;const score=llV2SimpleEuropeScore(fixture.home,fixture.away);llRecordMatch(fixture.home,fixture.away,score.homeGoals,score.awayGoals,weeks[roundIndex],false,type,'euro-table');});table.playedRounds++;}});llSave();
};
function llV3EuropeRank(type,team=lexLeague.state.playerTeam){return llV2SortEuropeTable(type).findIndex(row=>row.team===team)+1;}
function llV3EnterEuropeKnockout(){
  const s=lexLeague.state,e=s.europe;if(!e)return;const rank=llV3EuropeRank(e.type);e.leagueRank=rank;e.pending=null;e.usedOpponents=e.usedOpponents||[];
  if(rank<1||rank>24){e.alive=false;e.phase='eliminated';e.status='Lig aşamasını ilk 24 dışında tamamladı';return;}
  e.phase=rank<=8?'r16':'playoff';e.seedRank=rank;e.tie=null;e.nextMatchWeek=Number(s.week)+1;e.status=rank<=8?'İlk 8 · Doğrudan Son 16':`${rank}. sıra · Eleme turu play-off`;
}
function llV3KnockoutOpponent(stage){
  const s=lexLeague.state,e=s.europe,rows=llV2SortEuropeTable(e.type),rank=e.seedRank||llV3EuropeRank(e.type),used=new Set([s.playerTeam,...(e.usedOpponents||[])]);let indexes=[];
  if(stage==='playoff'){const pairs=rank<=16?{9:[23,24],10:[23,24],11:[21,22],12:[21,22],13:[19,20],14:[19,20],15:[17,18],16:[17,18]}:{17:[15,16],18:[15,16],19:[13,14],20:[13,14],21:[11,12],22:[11,12],23:[9,10],24:[9,10]};indexes=pairs[rank]||[];}
  else if(stage==='r16')indexes=rank<=8?[9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]:[1,2,3,4,5,6,7,8];
  else indexes=Array.from({length:24},(_,index)=>index+1);
  const candidates=indexes.map(position=>rows[position-1]?.team).filter(name=>name&&!used.has(name)),fallback=rows.map(row=>row.team).filter(name=>!used.has(name));return (candidates.length?candidates:fallback)[Math.floor(Math.random()*Math.max(1,(candidates.length?candidates:fallback).length))];
}
function llV3EnsureEuroOpponent(name){const s=lexLeague.state;if(!name||s.teams[name])return;const def=llTeamDef(name);s.teams[name]={name,stars:def?.stars||3,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};}
llV2EnsureEurope=function(){
  const s=lexLeague.state;llV2SimulateEuropeTables();const e=s.europe;if(!e||!e.alive||e.pending)return;
  if(e.phase==='league'){
    const weeks=LL_EURO_LEAGUE_WEEKS[e.type],table=llV2EnsureEuropeStandings(s)[e.type];
    while(e.round<weeks.length){const scheduled=table.fixtures[e.round]?.find(f=>f.home===s.playerTeam||f.away===s.playerTeam),already=scheduled&&(s.results||[]).some(r=>r.competition===e.type&&r.league==='euro-table'&&r.home===scheduled.home&&r.away===scheduled.away);if(already){e.round++;continue;}if(Number(s.week)<weeks[e.round])return;if(!scheduled){e.round++;continue;}const opponent=scheduled.home===s.playerTeam?scheduled.away:scheduled.home;llV3EnsureEuroOpponent(opponent);e.pending=opponent;s.pendingFixture={...scheduled,competition:e.type,league:'euro-table',roundLabel:`Lig Aşaması ${e.round+1}/${weeks.length}`};return;}
    llV3EnterEuropeKnockout();return;
  }
  if(e.phase==='eliminated'||e.phase==='winner'||Number(s.week)<Number(e.nextMatchWeek||0))return;
  if(!e.tie){const opponent=llV3KnockoutOpponent(e.phase);if(!opponent){e.alive=false;e.phase='eliminated';return;}e.tie={stage:e.phase,opponent,leg:1,playerGoals:0,opponentGoals:0};e.usedOpponents.push(opponent);}
  const tie=e.tie,final=tie.stage==='final',playerHome=final||tie.leg===2,home=playerHome?s.playerTeam:tie.opponent,away=playerHome?tie.opponent:s.playerTeam;llV3EnsureEuroOpponent(tie.opponent);e.pending=tie.opponent;s.pendingFixture={home,away,competition:e.type,league:'euro-knockout',roundLabel:final?`${LL_EURO_KNOCKOUT_LABELS.final} · Tarafsız Saha`:`${LL_EURO_KNOCKOUT_LABELS[tie.stage]} · ${tie.leg===1?'1. Maç':'Rövanş'}`};
};
llV2FinishEuropeRound=function(winner){
  const s=lexLeague.state,e=s.europe;if(!e)return;e.pending=null;
  if(e.phase==='league'){e.round++;if(e.round>=LL_EURO_LEAGUE_WEEKS[e.type].length)llV3EnterEuropeKnockout();return;}
  const tie=e.tie,last=[...(s.results||[])].reverse().find(r=>r.userMatch&&r.competition===e.type&&r.league==='euro-knockout'),playerGoals=last?(last.home===s.playerTeam?last.homeGoals:last.awayGoals):0,opponentGoals=last?(last.home===s.playerTeam?last.awayGoals:last.homeGoals):0;tie.playerGoals+=playerGoals;tie.opponentGoals+=opponentGoals;
  if(tie.stage!=='final'&&tie.leg===1){tie.leg=2;e.nextMatchWeek=Number(s.week)+1;e.status=`${LL_EURO_KNOCKOUT_LABELS[tie.stage]} · İlk maç ${tie.playerGoals}-${tie.opponentGoals}`;return;}
  const advanced=tie.playerGoals===tie.opponentGoals?Math.random()<.5:tie.playerGoals>tie.opponentGoals;if(!advanced){e.alive=false;e.phase='eliminated';e.status=`${LL_EURO_KNOCKOUT_LABELS[tie.stage]} aşamasında elendi · Toplam ${tie.playerGoals}-${tie.opponentGoals}`;return;}
  if(tie.stage==='final'){e.winner=s.playerTeam;e.alive=false;e.phase='winner';e.status='Şampiyon';const trophy=e.type==='ucl'?'UEFA Şampiyonlar Ligi':e.type==='uel'?'UEFA Avrupa Ligi':'UEFA Konferans Ligi';if(!s.trophies.some(item=>item.season===s.season&&item.name===trophy))s.trophies.push({season:s.season,name:trophy});return;}
  const stages=['playoff','r16','qf','sf','final'],next=stages[stages.indexOf(tie.stage)+1];e.phase=next;e.tie=null;e.nextMatchWeek=Number(s.week)+1;e.status=`${LL_EURO_KNOCKOUT_LABELS[tie.stage]} geçildi · Sıradaki ${LL_EURO_KNOCKOUT_LABELS[next]}`;
};
llV2EuropeTableHtml=function(type){
  const rows=llV2SortEuropeTable(type),player=lexLeague.state.playerTeam,q=llV3ResolveEuropeQualifications(lexLeague.state),turkish=new Set(q[type]||[]);
  return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((row,index)=>`<tr class="${row.team===player?'player ':''}${index<8?'champion-zone ':index<24?'playoff-zone ':'relegation-zone '}"><td>${index+1}</td><td>${llTeamLogo(row.team,'table')}${llEscape(row.team)}${turkish.has(row.team)?' <span title="Türkiye temsilcisi">🇹🇷</span>':''}</td><td>${row.P}</td><td>${row.W}</td><td>${row.D}</td><td>${row.L}</td><td>${row.GF}</td><td>${row.GA}</td><td>${row.GD}</td><td><b>${row.Pts}</b></td></tr>`).join('')}</tbody></table></div><div class="ll-zone-legend"><span><i class="ll-zone-dot direct"></i>1–8: Doğrudan Son 16</span><span><i class="ll-zone-dot playoff"></i>9–24: Play-Off</span><span><i class="ll-zone-dot relegation"></i>25–36: Elenir</span></div>`;
};
llV2EuropeFixturesHtml=function(type){
  const s=lexLeague.state,table=llV2EnsureEuropeStandings(s)[type],results=(s.results||[]).filter(result=>result.competition===type&&result.league==='euro-table'),resultMap=new Map(results.map(r=>[`${r.home}|${r.away}`,r]));
  return table.fixtures.map((round,index)=>`<details ${index===Math.min(table.playedRounds,table.fixtures.length-1)?'open':''} style="margin:8px 0"><summary class="ll-btn" style="cursor:pointer">Lig Aşaması ${index+1}/${table.fixtures.length} · ${LL_EURO_LEAGUE_WEEKS[type][index]}. hafta</summary><div class="ll-cup-list">${round.map(f=>{const r=resultMap.get(`${f.home}|${f.away}`),score=r?`${r.homeGoals}-${r.awayGoals}`:'VS';return `<div class="ll-cup-row"><span>${llTeamLogo(f.home,'table')}${llEscape(f.home)}</span><b>${score}</b><span>${llTeamLogo(f.away,'table')}${llEscape(f.away)}</span></div>`;}).join('')}</div></details>`).join('');
};
const llV3RenderCompetitionCenterBase=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=null){llV3RenderCompetitionCenterBase(tab,key);if(tab!=='europe')return;const s=lexLeague.state,type=['ucl','uel','uecl'].includes(key)?key:(s.europe?.type||'ucl'),table=llV2EnsureEuropeStandings(s)[type],metrics=llArea().querySelectorAll('.ll-cup-status .ll-metric strong');if(metrics[2])metrics[2].textContent=`${table.playedRounds}/${LL_EURO_LEAGUE_WEEKS[type].length}`;const notice=llArea().querySelector('.ll-notice');if(notice)notice.innerHTML=`<b>36 takımlı lig aşaması:</b> ${type==='uecl'?'6 farklı rakip · 3 iç saha / 3 deplasman':'8 farklı rakip · 4 iç saha / 4 deplasman'}. Galibiyet 3, beraberlik 1 puan. İlk 8 doğrudan Son 16'ya, 9–24 play-off'a gider; 25–36 elenir ve alt kupaya düşmez.${s.europe?.type===type?`<br><b>Senin durumun:</b> ${llEscape(s.europe.status||`Lig aşaması ${Math.min((s.europe.round||0)+1,LL_EURO_LEAGUE_WEEKS[type].length)}/${LL_EURO_LEAGUE_WEEKS[type].length}`)}`:''}`;};
const llV3StartNextSeasonBase=llStartNextSeason;
llStartNextSeason=function(){const q=llDeep(lexLeague.state.lastSeasonSummary?.qualifications||{ucl:[],uel:[],uecl:[]});llV3StartNextSeasonBase();const s=lexLeague.state;if(llV3ValidQualifications(q))s.europeQualifications=q;s.europeStandings=null;const type=['ucl','uel','uecl'].find(key=>s.europeQualifications?.[key]?.includes(s.playerTeam));s.europe=type?{type,phase:'league',round:0,alive:true,pending:null,winner:null,usedOpponents:[],status:'Lig aşaması başlamadı'}:null;llV2RepairState(s);llSave();llRenderDashboard();};
const llV3CompleteSeasonBase=llCompleteSeason;
llCompleteSeason=function(){const s=lexLeague.state,e=s.europe;if(e?.alive&&e.phase&&e.phase!=='league'){e.nextMatchWeek=Number(s.week);llV2EnsureEurope();if(s.pendingFixture){llRenderDashboard();return;}}llV3CompleteSeasonBase();};
function llV2UpgradeCost(stars){return ({1:800,2:1400,3:2300,4:3500,5:5000})[stars]||0;}
function llUpgradeStars(){const t=llTeamState(lexLeague.state.playerTeam),cost=llV2UpgradeCost(t.stars);if(!cost)return;if(lexLeague.state.lp<cost){alert(`Yetersiz LP. Gerekli: ${cost} LP`);return;}if(!confirm(`${cost} LP ile takımı ${t.stars+1} yıldıza yükseltmek istiyor musun?`))return;lexLeague.state.lp-=cost;t.stars++;llSave();llRenderDashboard();}
function llStartCareer(teamName){if(localStorage.getItem(LL_V2_SAVE_KEY)&&!confirm('Mevcut iki ligli kariyerin üzerine yeni kariyer yazılsın mı?'))return;lexLeague.state=llNewState(teamName);llAssignStarterCardsToAi();llSave();llRenderStarterShop();}

/* Card contracts, active-slot chemistry and full European AI squads. */
const LL_CARD_CONTRACT_VERSION=1;
const LL_CARD_CONTRACT_RULES={common:{matches:18,renewLp:40},rare:{matches:16,renewLp:60},epic:{matches:14,renewLp:90},legendary:{matches:12,renewLp:130}};
const LL_AI_TRANSFER_WEEKS=[1,10,20,30];
function llCardContractRule(cardOrId){const card=typeof cardOrId==='string'?llCard(cardOrId):cardOrId;return LL_CARD_CONTRACT_RULES[card?.rarity]||LL_CARD_CONTRACT_RULES.common;}
function llEnsureTeamContracts(team){if(!team)return team;if(!team.cardContracts||typeof team.cardContracts!=='object')team.cardContracts={};if(!Number.isFinite(team.aiLp))team.aiLp=0;LL_POSITIONS.forEach(pos=>{const cardId=team.cards?.[pos]||null,current=team.cardContracts[pos];if(!cardId){delete team.cardContracts[pos];return;}const rule=llCardContractRule(cardId);if(!current||current.cardId!==cardId)team.cardContracts[pos]={cardId,remaining:rule.matches,total:rule.matches};else{current.total=rule.matches;current.remaining=Math.max(0,Math.min(rule.matches,Number.isFinite(Number(current.remaining))?Number(current.remaining):rule.matches));}});return team;}
function llResetCardContract(team,pos,cardId=team?.cards?.[pos]){if(!team||!cardId)return null;if(!team.cardContracts||typeof team.cardContracts!=='object')team.cardContracts={};const rule=llCardContractRule(cardId);return team.cardContracts[pos]={cardId,remaining:rule.matches,total:rule.matches};}
function llCardContractSlotActive(team,pos){if(!team?.cards?.[pos])return false;llEnsureTeamContracts(team);const contract=team.cardContracts[pos];return !!contract&&contract.cardId===team.cards[pos]&&contract.remaining>0;}
function llActiveCardId(teamName,pos){const team=llTeamState(teamName);return llCardContractSlotActive(team,pos)?team.cards[pos]:null;}
function llActiveCardCount(team){return LL_POSITIONS.filter(pos=>llCardContractSlotActive(team,pos)).length;}
function llUseTeamCardContracts(team){if(!team)return;llEnsureTeamContracts(team);LL_POSITIONS.forEach(pos=>{const contract=team.cardContracts[pos];if(contract&&team.cards[pos]===contract.cardId&&contract.remaining>0)contract.remaining--;});}
function llEnsureContractState(state){if(!state)return state;Object.values(state.teams||{}).forEach(llEnsureTeamContracts);if(!state.aiContractWindows||typeof state.aiContractWindows!=='object')state.aiContractWindows={};state.cardContractVersion=LL_CARD_CONTRACT_VERSION;return state;}
function llV4CreateEuroTeam(state,name){if(!name)return null;if(!state.teams[name]){const def=llTeamDef(name);state.teams[name]={name,stars:def?.stars||3,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:150,aiLp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};}return state.teams[name];}
function llV4FreeCardForState(state,teamName,pos){const team=state.teams[teamName],used=new Set(team.usedCardFamilies||[]),pool=LL_CARD_POOL.filter(card=>!card.upgradeOnly&&!card.clubCard&&(card.position===pos||card.position==='Evrensel')&&!used.has(llCardFamilyName(card))&&llOwnTriggerCompatible(card,team.stars));if(!pool.length)return false;const card=llWeightedPick(pool)||pool[0],family=llCardFamilyName(card);team.cards[pos]=card.id;if(family&&!used.has(family)){team.usedCardFamilies.push(family);used.add(family);}llResetCardContract(team,pos,card.id);return true;}
function llV4EnsureEuropeTeams(state,tables=state?.europeStandings){if(!state||!tables)return;const domestic=new Set(LL_ALL_TEAMS.map(team=>team.name));['ucl','uel','uecl'].forEach(type=>(tables[type]?.teams||[]).forEach(name=>{if(domestic.has(name))return;const team=llV4CreateEuroTeam(state,name);LL_POSITIONS.forEach(pos=>{if(!team.cards[pos])llV4FreeCardForState(state,name,pos);});llEnsureTeamContracts(team);}));}
const llV4EnsureEuropeStandingsBase=llV2EnsureEuropeStandings;
llV2EnsureEuropeStandings=function(state){const tables=llV4EnsureEuropeStandingsBase(state);llV4EnsureEuropeTeams(state,tables);return tables;};
const llV4RepairStateBase=llV2RepairState;
llV2RepairState=function(state){state=llV4RepairStateBase(state);llV4EnsureEuropeTeams(state,state?.europeStandings);return llEnsureContractState(state);};
const llV4EnsureEuroOpponentBase=llV3EnsureEuroOpponent;
llV3EnsureEuroOpponent=function(name){llV4EnsureEuroOpponentBase(name);const team=llV4CreateEuroTeam(lexLeague.state,name);LL_POSITIONS.forEach(pos=>{if(!team.cards[pos])llV4FreeCardForState(lexLeague.state,name,pos);});llEnsureTeamContracts(team);};
const llV4ChooseShopCardBase=llChooseShopCard;
llChooseShopCard=function(id){const state=lexLeague.state,team=llTeamState(state.playerTeam),mode=lexLeague.shop?.mode,pos=lexLeague.shop?.position,before=pos?team.cards[pos]:null;llV4ChooseShopCardBase(id);if(pos&&team.cards[pos]&&team.cards[pos]!==before){llResetCardContract(team,pos,team.cards[pos]);llSave();if(mode==='starter')llRenderDashboard();else llRenderShop();}};
const llV4AssignAiCardBase=llAssignAiCard;
llAssignAiCard=function(teamName){const team=llTeamState(teamName),before=team?Object.fromEntries(LL_POSITIONS.map(pos=>[pos,team.cards[pos]])):{};const changed=llV4AssignAiCardBase(teamName);if(team)LL_POSITIONS.forEach(pos=>{if(team.cards[pos]&&team.cards[pos]!==before[pos])llResetCardContract(team,pos,team.cards[pos]);});return changed;};
function llAiTargetPosition(teamName){const team=llTeamState(teamName);llEnsureTeamContracts(team);const inactive=llShuffle(LL_POSITIONS.filter(pos=>!llCardContractSlotActive(team,pos)));if(inactive.length)return inactive[0];return llShuffle(LL_POSITIONS).sort((a,b)=>llAiCardScore(llCard(team.cards[a]))-llAiCardScore(llCard(team.cards[b])))[0];}
function llAiShopAttempt(teamName){const team=llTeamState(teamName);if(!team||team.aiAp<150)return {spent:false,upgraded:false};llEnsureTeamContracts(team);const position=llAiTargetPosition(teamName),pool=llEligibleCards(teamName,position),offers=llPickDistinctOfferPair(pool);if(offers.length<2)return {spent:false,upgraded:false};team.aiAp-=150;const current=llCardContractSlotActive(team,position)?llCard(team.cards[position]):null,best=[...offers].sort((a,b)=>llAiCardScore(b)-llAiCardScore(a))[0];if(!current||llAiCardScore(best)>llAiCardScore(current)){const oldId=team.cards[position]||null,family=llCardFamilyName(best);if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);team.cards[position]=best.id;llResetCardContract(team,position,best.id);return {spent:true,upgraded:true,position,oldId,newId:best.id};}return {spent:true,upgraded:false,position,oldId:current.id,newId:null};}
function llV4RenewAiContracts(teamName){const team=llTeamState(teamName);if(!team)return;llEnsureTeamContracts(team);let attempts=0;while(team.aiAp>=150&&attempts<20){const result=llAiShopAttempt(teamName);if(!result.spent)break;attempts++;}LL_POSITIONS.forEach(pos=>{const card=llCard(team.cards[pos]),contract=team.cardContracts[pos];if(!card||!contract||contract.remaining>10)return;const rule=llCardContractRule(card);if(team.aiLp>=rule.renewLp){team.aiLp-=rule.renewLp;llResetCardContract(team,pos,card.id);}else if(contract.remaining<=0){team.cards[pos]=null;delete team.cardContracts[pos];}});}
function llDevelopOpponents(completedWeek){const state=lexLeague.state;if(!state)return;llV2EnsureEuropeStandings(state);if(!state.aiContractWindows)state.aiContractWindows={};LL_AI_TRANSFER_WEEKS.filter(week=>Number(completedWeek)>=week&&!state.aiContractWindows[`${state.season}-${week}`]).forEach(week=>{Object.keys(state.teams).filter(name=>name!==state.playerTeam).forEach(llV4RenewAiContracts);state.aiContractWindows[`${state.season}-${week}`]=true;if(!state.aiTransferWindows)state.aiTransferWindows={};state.aiTransferWindows[`${state.season}-${week}`]=true;});}
const llV4RecordMatchBase=llRecordMatch;
llRecordMatch=function(home,away,hg,ag,week,userMatch=false,competition='league',league=null){const state=lexLeague.state;llV4CreateEuroTeam(state,home);llV4CreateEuroTeam(state,away);llEnsureTeamContracts(state.teams[home]);llEnsureTeamContracts(state.teams[away]);llV4RecordMatchBase(home,away,hg,ag,week,userMatch,competition,league);const reward=LL_COMP_REWARDS[competition]||LL_COMP_REWARDS.league;[[home,hg,ag],[away,ag,hg]].forEach(([name,gf,ga])=>{const team=state.teams[name];if(name!==state.playerTeam){team.aiLp=(team.aiLp||0)+(gf>ga?reward.win:gf===ga?reward.draw:reward.loss);if(competition!=='league')team.aiAp=(team.aiAp||0)+(gf>ga?20:gf===ga?12:6);}});};
llV2SimulateEuropeTables=function(){const state=lexLeague.state,tables=llV2EnsureEuropeStandings(state);['ucl','uel','uecl'].forEach(type=>{const table=tables[type],weeks=LL_EURO_LEAGUE_WEEKS[type],due=weeks.filter(week=>Number(state.week)>=week).length;while(table.playedRounds<due){const roundIndex=table.playedRounds,round=table.fixtures[roundIndex]||[];round.forEach(fixture=>{const exists=(state.results||[]).some(result=>result.season===state.season&&result.competition===type&&result.league==='euro-table'&&result.home===fixture.home&&result.away===fixture.away);if(exists||fixture.home===state.playerTeam||fixture.away===state.playerTeam)return;llV2SimFixture(fixture,type,'euro-table',weeks[roundIndex]);});table.playedRounds++;}});llSave();};
function llRollValue(teamName,pos){const team=llTeamState(teamName),[min,max]=llRange(team.stars),locked=team.lockedDice?.[pos];let value;if(Number.isFinite(locked)){delete team.lockedDice[pos];value=locked;}else value=llRandomInt(min,max);const bonus=Number(team.nextMatchBonuses?.[pos]||0);if(bonus){delete team.nextMatchBonuses[pos];value+=bonus;}const card=llCard(llActiveCardId(teamName,pos));if(llBaseName(card)==='Yıldız Oyuncu'&&team.stars>=3)value=Math.max(4,value);return value;}
function llMakeDice(teamName,plusPos=null){const team=llTeamState(teamName);llEnsureTeamContracts(team);return LL_POSITIONS.map(pos=>({uid:`${teamName}-${pos}-${Math.random()}`,position:pos,value:llRollValue(teamName,pos)+(pos===plusPos?1:0),cardId:llActiveCardId(teamName,pos),stars:team.stars}));}
function llHasBase(teamName,base){return LL_POSITIONS.some(pos=>llBaseName(llCard(llActiveCardId(teamName,pos)))===base);}
function llNadirKimyaActiveForTeam(teamName,slot){const team=llTeamState(teamName),others=LL_POSITIONS.filter(pos=>pos!==slot).map(pos=>llCard(llCardContractSlotActive(team,pos)?team.cards[pos]:null));return llCardContractSlotActive(team,slot)&&others.length===2&&others.every(card=>card&&(LL_CARD_RARITY_RANK[card.rarity]||0)>=LL_CARD_RARITY_RANK.rare);}
function llRealCardSynergies(teamName){const team=llTeamState(teamName);if(!team)return [];const slots=LL_POSITIONS.map(position=>({position,card:llCard(llCardContractSlotActive(team,position)?team.cards[position]:null)})),active=[];const full=slots.every(slot=>slot.card),chemistry=slots.find(slot=>llBaseName(slot.card)==='Takım Kimyası');if(chemistry&&full)active.push({name:'Takım Kimyası',reason:'Üç kart sözleşmesi de aktif; takımın en düşük zarı +1 kazanır.'});const rare=slots.find(slot=>llBaseName(slot.card)==='Nadir Kimya');if(rare){const others=slots.filter(slot=>slot.position!==rare.position).map(slot=>slot.card),ready=others.length===2&&others.every(card=>card&&(LL_CARD_RARITY_RANK[card.rarity]||0)>=LL_CARD_RARITY_RANK.rare);if(ready)active.push({name:'Nadir Kimya',reason:'Diğer iki aktif kart Nadir veya üstü; +1 ücretsiz reroll hazır.'});}return active;}
function llExtraRerolls(teamName){let total=0;LL_POSITIONS.forEach(pos=>{const card=llCard(llActiveCardId(teamName,pos)),base=llBaseName(card);if(['Metronom','Reflex'].includes(base))total+=llEffectAmount(card,1);if(base==='Nadir Kimya'&&llNadirKimyaActiveForTeam(teamName,pos))total++;});return total;}
function llApplyLocks(resolution,aName,bName){Object.assign(llTeamState(aName).lockedDice,resolution.nextLocks.a||{});Object.assign(llTeamState(bName).lockedDice,resolution.nextLocks.b||{});[[aName,resolution.aDice,resolution.scoreA,resolution.scoreB],[bName,resolution.bDice,resolution.scoreB,resolution.scoreA]].forEach(([name,dice,gf,ga])=>{const team=llTeamState(name);if(gf<ga&&llHasBase(name,'Yedek Kulübesi'))team.nextMatchRerolls=(team.nextMatchRerolls||0)+1;LL_POSITIONS.forEach(pos=>{if(llBaseName(llCard(llActiveCardId(name,pos)))!=='Form Tutmuyor')return;const die=llFindPosition(dice,pos);team.sixStreaks[pos]=die?.value===6?(team.sixStreaks[pos]||0)+1:0;if(team.sixStreaks[pos]>=3){team.nextMatchBonuses[pos]=(team.nextMatchBonuses[pos]||0)+1;team.sixStreaks[pos]=0;}});});llUseTeamCardContracts(llTeamState(aName));llUseTeamCardContracts(llTeamState(bName));}
const llV4CardHtmlBase=llCardHtml;
llCardHtml=function(cardId,teamName,emptyText='Kart yok'){let html=llV4CardHtmlBase(cardId,teamName,emptyText),team=llTeamState(teamName);if(!cardId||!team)return html;const pos=LL_POSITIONS.find(position=>team.cards?.[position]===cardId);if(!pos)return html;llEnsureTeamContracts(team);const contract=team.cardContracts[pos],expired=!llCardContractSlotActive(team,pos),text=expired?'⛔ Sözleşme bitti · Kart etkisiz':`⌛ ${contract.remaining}/${contract.total} maç hakkı`;if(expired)html=html.replace('class="ll-ability ','class="ll-ability ll-contract-expired ').replace('<button ','<button style="opacity:.58;filter:saturate(.45)" ');return html.replace('</button>',`<span style="display:block;margin-top:7px;font-size:11px;font-weight:800;color:${expired?'#fb7185':contract.remaining<=3?'#facc15':'#67e8f9'}">${text}</span></button>`);};
function llContractPopupHtml(teamName,cardId){const team=llTeamState(teamName),pos=LL_POSITIONS.find(position=>team?.cards?.[position]===cardId);if(!team||!pos)return '';llEnsureTeamContracts(team);const contract=team.cardContracts[pos],rule=llCardContractRule(cardId),expired=contract.remaining<=0;return `<div class="ll-notice" style="margin-top:10px;border-color:${expired?'rgba(244,63,94,.6)':'rgba(34,211,238,.35)'}"><b>${expired?'⛔ Sözleşme bitti':'⌛ Kart sözleşmesi'}</b><br>${contract.remaining}/${contract.total} resmi maç hakkı kaldı · Yenileme ${rule.renewLp} LP${expired?'<br>Bu kart slotta görünür ancak zar ve kart etkilerinde yok sayılır.':''}</div>`;}
function llShowCardPopup(cardId,teamName=''){const card=llCard(cardId);if(!card)return;const showPerformance=!teamName||teamName===lexLeague.state?.playerTeam;llShowModal(`<div class="ll-rarity">${llRarityLabel(card)}</div>${llCardUpgradeBadgeHtml(card)}<div class="quiz-start-title" style="font-size:29px;margin-bottom:6px">${llEscape(card.name)}</div><div class="ll-sub" style="margin-bottom:12px">${teamName?`${llEscape(teamName)} · `:''}${llEscape(card.position)} · Min ${card.minStar}★</div><div class="ll-notice"><b>Tetikleyici:</b> ${llEscape(card.trigger)}<br><b>Etki türü:</b> ${llEscape(llCardEffectKind(card))}<br><b>Efekt:</b> ${llEscape(card.effect)}</div>${llCardUpgradePreviewHtml(card)}${teamName?llContractPopupHtml(teamName,card.id):''}${showPerformance?llCardPerformanceHtml(card.id):''}`);}
function llOpponentIcons(teamName){const team=llTeamState(teamName);llEnsureTeamContracts(team);return `<div class="ll-card-icons">${LL_POSITIONS.map(pos=>{const id=team.cards[pos],card=llCard(id),active=llCardContractSlotActive(team,pos),title=active?pos:`${pos} · Sözleşmesi bitti`;return `<button class="ll-icon-btn" title="${llEscape(title)}" style="${card&&!active?'opacity:.45;border-color:#fb7185':''}" onclick="${id?`llShowCardPopup('${id}','${llEscape(teamName)}')`:`llShowEmptyCard('${llEscape(teamName)}','${llEscape(pos)}')`}">${card?(active?LL_POSITION_ICONS[pos]:'⏳'):'·'}</button>`;}).join('')}</div>`;}
function llRenewPlayerContract(pos){const state=lexLeague.state;if(!llIsTransferWindow(state.week)){alert('Kart sözleşmesi yalnızca transfer döneminde yenilenebilir.');return;}const team=llTeamState(state.playerTeam);llEnsureTeamContracts(team);const card=llCard(team.cards[pos]),contract=team.cardContracts[pos];if(!card||!contract)return;if(contract.remaining>10){alert('Yenileme, son 10 maç hakkına girince açılır.');return;}const rule=llCardContractRule(card);if(state.lp<rule.renewLp){alert(`Yetersiz LP. Gerekli: ${rule.renewLp} LP`);return;}if(!confirm(`${card.name} sözleşmesi ${rule.renewLp} LP karşılığında ${rule.matches} maça yenilensin mi?`))return;state.lp-=rule.renewLp;llResetCardContract(team,pos,card.id);llSave();llRenderShop();}
function llReleaseExpiredCard(pos){const state=lexLeague.state;if(!llIsTransferWindow(state.week))return;const team=llTeamState(state.playerTeam);llEnsureTeamContracts(team);const contract=team.cardContracts[pos];if(!team.cards[pos]||!contract||contract.remaining>0)return;if(!confirm('Sözleşmesi biten kart slotundan çıkarılsın mı? Kart arşivinde kalmaya devam eder.'))return;team.cards[pos]=null;delete team.cardContracts[pos];llSave();llRenderShop();}
function llContractShopHtml(){const state=lexLeague.state,team=llTeamState(state.playerTeam);llEnsureTeamContracts(team);return `<div class="ll-card" style="margin-top:16px"><div class="ll-card-title">📑 Kart Sözleşmeleri · LP: ${state.lp}</div><div class="ll-sub" style="margin-bottom:12px">Kart, takılı olduğu her resmi maçta 1 kullanım harcar; tetiklenmesi gerekmez. Süresi biten kart slotta görünür fakat etkisizdir ve takım 2/3 aktif kartlı sayılır.</div><div class="ll-shop-grid">${LL_POSITIONS.map(pos=>{const card=llCard(team.cards[pos]);if(!card)return `<div class="ll-card"><b>${LL_POSITION_ICONS[pos]} ${pos}</b><div class="ll-muted" style="margin-top:9px">Boş slot</div></div>`;const contract=team.cardContracts[pos],rule=llCardContractRule(card),expired=contract.remaining<=0,canRenew=contract.remaining<=10;return `<div class="ll-card" style="${expired?'border-color:rgba(244,63,94,.65)':''}"><b>${LL_POSITION_ICONS[pos]} ${llEscape(card.name)}</b>${llCardUpgradeBadgeHtml(card)}<div class="ll-muted" style="margin:7px 0">${llRarityLabel(card)} · ${contract.remaining}/${contract.total} maç</div><div class="ll-sub">${expired?'Sözleşme bitti; kart şu anda etkisiz.':canRenew?'Yenileme penceresi açık.':'10 maç hakkına girince yenilenebilir.'}</div><div class="ll-actions" style="margin-top:10px"><button class="ll-btn ${expired?'danger':''}" ${canRenew?'':'disabled'} onclick="llRenewPlayerContract('${pos}')">${rule.renewLp} LP ile Yenile</button>${expired?`<button class="ll-btn" onclick="llReleaseExpiredCard('${pos}')">Slottan Çıkar</button>`:''}</div></div>`;}).join('')}</div><div class="ll-muted" style="margin-top:10px">Süre / yenileme: Yaygın 18 maç / 40 LP · Nadir 16 / 60 · Destansı 14 / 90 · Efsanevi 12 / 130.</div></div>`;}
const llV4RenderShopBase=llRenderShop;
llRenderShop=function(){llV4RenderShopBase();const host=document.getElementById('ll-shop-offers');if(host&&!document.getElementById('ll-contract-shop'))host.insertAdjacentHTML('beforebegin',`<div id="ll-contract-shop">${llContractShopHtml()}</div>`);};
/* TFF 1. Lig career-loss boundary and visible relegation zone. */
const LL_FIRST_RELEGATION_COUNT=4;
function llV5IsFirstLeagueRelegated(position,total=20){return Number(position)>Math.max(0,Number(total)-LL_FIRST_RELEGATION_COUNT);}
function llV5DecorateFirstTableHtml(html,withLegend=true){
  const template=document.createElement('template');template.innerHTML=html;
  const rows=[...template.content.querySelectorAll('tbody tr')];rows.slice(-LL_FIRST_RELEGATION_COUNT).forEach(row=>row.classList.add('relegation-zone'));
  const legend=template.content.querySelector('.ll-zone-legend');
  if(withLegend&&legend&&!legend.querySelector('.ll-first-career-loss'))legend.insertAdjacentHTML('beforeend','<span class="ll-first-career-loss"><i class="ll-zone-dot relegation"></i>17\u201320: TFF 2. Lig\u2019e d\u00fc\u015fer; kariyer sona erer</span>');
  return template.innerHTML;
}
const llV5TableHtmlBase=llTableHtml;
llTableHtml=function(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){const leagueKey=key==='super'?'super':'first',html=llV5TableHtmlBase(leagueKey);return leagueKey==='first'?llV5DecorateFirstTableHtml(html,true):html;};
const llV5ArchivedTableHtmlBase=llV2ArchivedTableHtml;
llV2ArchivedTableHtml=function(entry,key){const html=llV5ArchivedTableHtmlBase(entry,key);return key==='first'?llV5DecorateFirstTableHtml(html,false):html;};
const llV5RenderSeasonArchiveBase=llRenderSeasonArchive;
llRenderSeasonArchive=function(season=null,key='super'){
  llV5RenderSeasonArchiveBase(season,key);
  if(key!=='first')return;
  const legends=[...llArea().querySelectorAll('.ll-zone-legend')],legend=legends[legends.length-1];
  if(legend&&!legend.querySelector('.ll-first-career-loss'))legend.insertAdjacentHTML('beforeend','<span class="ll-first-career-loss"><i class="ll-zone-dot relegation"></i>17\u201320: Kariyer sona erer</span>');
};
const llV5MatchImportanceBase=llV2MatchImportance;
llV2MatchImportance=function(f,key){
  const current=llV5MatchImportanceBase(f,key);if(current)return current;
  const s=lexLeague.state,comp=f.competition||'league';if(comp!=='league'||Number(s.week)<20||key!=='first')return '';
  const rows=llSortTable('first'),positions=[f.home,f.away].map(name=>rows.findIndex(row=>row.team===name)+1);
  return positions.some(position=>llV5IsFirstLeagueRelegated(position,rows.length))?'\u26a0\ufe0f K\u00dcME D\u00dc\u015eME HATTI MA\u00c7I':'';
};
const llV5RepairStateBase=llV2RepairState;
llV2RepairState=function(state){
  state=llV5RepairStateBase(state);if(!state)return state;
  if(typeof state.careerEnded!=='boolean'){const summary=state.lastSeasonSummary,total=summary?.firstRows?.length||20;state.careerEnded=!!(state.seasonEnded&&summary?.playerLeague==='first'&&llV5IsFirstLeagueRelegated(summary.playerPosition,total));}
  if(state.careerEnded&&!state.careerEndReason)state.careerEndReason='TFF 1. Lig k\u00fcme d\u00fc\u015fme hatt\u0131nda sezonu tamamlama';
  return state;
};
const llV5ArchiveSeasonBase=llV2ArchiveSeason;
llV2ArchiveSeason=function(state,summary){const entry=llV5ArchiveSeasonBase(state,summary);if(entry)entry.careerEnded=!!state?.careerEnded;return entry;};
const llV5FinalizeSeasonBase=llV2FinalizeSeason;
llV2FinalizeSeason=function(playoffWinner){
  const state=lexLeague.state,firstRows=llSortTable('first'),playerLeague=llTeamLeague(state.playerTeam),position=firstRows.findIndex(row=>row.team===state.playerTeam)+1;
  const lost=playerLeague==='first'&&llV5IsFirstLeagueRelegated(position,firstRows.length);
  state.careerEnded=lost;state.careerEndReason=lost?'TFF 1. Lig k\u00fcme d\u00fc\u015fme hatt\u0131nda sezonu tamamlama':null;state.careerEndSeason=lost?state.season:null;state.careerEndPosition=lost?position:null;
  llV5FinalizeSeasonBase(playoffWinner);
  if(state.lastSeasonSummary){state.lastSeasonSummary.careerEnded=lost;state.lastSeasonSummary.careerEndReason=state.careerEndReason;}
  llSave();if(lost)llRenderSeasonEnd();
};
const llV5RenderSeasonEndBase=llRenderSeasonEnd;
llRenderSeasonEnd=function(){
  const state=lexLeague.state,summary=state?.lastSeasonSummary;if(!state?.careerEnded){llV5RenderSeasonEndBase();return;}if(!summary){llRenderDashboard();return;}
  llSetWide(true);
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div style="text-align:center"><div style="font-size:64px">\u26d4</div><div class="quiz-start-title">Kariyer <em>Sona Erdi</em></div><div class="ll-sub">TFF 1. Lig\u2019i ${summary.playerPosition}. s\u0131rada tamamlad\u0131n ve k\u00fcme d\u00fc\u015fme hatt\u0131nda kald\u0131n. Bu kariyerde yeni sezona ge\u00e7ilemez.</div></div><div class="ll-metrics"><div class="ll-metric"><strong>${summary.season}</strong><span>Son Sezon</span></div><div class="ll-metric"><strong>${summary.playerPosition}.</strong><span>Lig S\u0131ras\u0131</span></div><div class="ll-metric"><strong>17\u201320</strong><span>Kariyer Kayb\u0131 B\u00f6lgesi</span></div><div class="ll-metric"><strong>\u26d4</strong><span>Durum</span></div></div><div class="ll-card" style="margin-top:14px;border-color:rgba(244,63,94,.65)"><div class="ll-card-title">Neden sona erdi?</div><div class="ll-sub">TFF 1. Lig\u2019de son 4 s\u0131ra alt lige d\u00fc\u015fme b\u00f6lgesidir. Oyunda TFF 2. Lig bulunmad\u0131\u011f\u0131 i\u00e7in bu sonu\u00e7 kariyer kayb\u0131 say\u0131l\u0131r. Kelime ve s\u00f6zl\u00fck istatistiklerin silinmez.</div></div><div style="margin-top:14px">${llV2SeasonGoalsHtml(true)}</div><div class="ll-card-title" style="margin:16px 0 9px">Son TFF 1. Lig Puan Durumu</div>${llTableHtml('first')}<div class="ll-actions" style="justify-content:center;margin-top:16px"><button class="ll-btn" onclick="llRenderSeasonArchive(${Number(summary.season)},'first')">Sezon Ar\u015fivi</button><button class="ll-btn primary" onclick="llRenderTeamSelect()">Yeni Kariyer Kur</button><button class="ll-btn" onclick="llGoMainMenu()">Ana Men\u00fc</button></div></div></div>`;
};
const llV5StartNextSeasonBase=llStartNextSeason;
llStartNextSeason=function(){if(lexLeague.state?.careerEnded){llRenderSeasonEnd();return;}llV5StartNextSeasonBase();};
const llV5RenderShopBase=llRenderShop;
llRenderShop=function(){if(lexLeague.state?.careerEnded){alert('Bu kariyer sona erdi; transfer merkezi kullan\u0131lamaz.');llRenderSeasonEnd();return;}llV5RenderShopBase();};

/* Six-star elite tier and one-time migration for existing European opponents. */
const LL_SIX_STAR_SYSTEM_VERSION=1;
function llV6EuroStars(name){
  const team=UCL_TEAMS.find(item=>item.name===name);
  return team?(team.pot===1?6:team.pot===2?5:team.pot===3?4:3):null;
}
function llV6EnsureStarSystem(state){
  if(!state)return state;
  Object.values(state.teams||{}).forEach(team=>{team.stars=Math.max(1,Math.min(6,Number(team.stars)||1));});
  if(Number(state.sixStarSystemVersion)!==LL_SIX_STAR_SYSTEM_VERSION){
    const domestic=new Set(LL_ALL_TEAMS.map(team=>team.name));
    Object.entries(state.teams||{}).forEach(([name,team])=>{
      if(domestic.has(name))return;
      const stars=llV6EuroStars(name);if(stars!==null)team.stars=stars;
    });
    state.sixStarSystemVersion=LL_SIX_STAR_SYSTEM_VERSION;
  }
  return state;
}
const llV6RepairStateBase=llV2RepairState;

/* Card families V7: club card, role rerolls and deterministic upgrades. */
llV2RepairState=function(state){return llV6EnsureStarSystem(llV6RepairStateBase(state));};
const LL_CARD_UPGRADE_SYSTEM_VERSION=1;
const LL_CARD_UPGRADE_LIMIT=2;
const LL_CARD_UPGRADE_COSTS={common:120,rare:220};
const LL_CARD_UPGRADE_MAP=Object.fromEntries(LL_CARD_UPGRADE_DEFINITIONS.map(item=>[item.from,item.card.id]));
function llRarityLabel(card){return llCardDisplayRarity(card);}
function llEnsureUpgradeState(team,state=lexLeague.state){
  if(!team)return team;if(Number(team.cardUpgradeSeason)!==Number(state?.season)){team.cardUpgradeSeason=Number(state?.season)||1;team.cardUpgradesUsed=0;}
  team.cardUpgradesUsed=Math.max(0,Math.min(LL_CARD_UPGRADE_LIMIT,Number(team.cardUpgradesUsed)||0));return team;
}
function llUpgradeTarget(cardId){const id=LL_CARD_UPGRADE_MAP[cardId],card=llCard(id);return card||null;}
function llUpgradeCost(card){return LL_CARD_UPGRADE_COSTS[card?.rarity]||0;}
function llPrepareV7Team(team,state){
  if(!team)return;if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];team.clubCards=team.clubCards&&typeof team.clubCards==='object'?team.clubCards:{market:null};if(!Array.isArray(team.reserveCards))team.reserveCards=[];
  LL_POSITIONS.forEach(pos=>{if(team.cards?.[pos]==='RBU04'){team.cards[pos]=null;team.clubCards.market='RBU04';if(team.cardContracts)delete team.cardContracts[pos];}});
  [['RBF10','Orta Saha'],['NCM06','Forvet']].forEach(([id,target])=>{const source=LL_POSITIONS.find(pos=>team.cards?.[pos]===id);if(!source||source===target)return;if(!team.cards[target]){team.cards[target]=id;team.cards[source]=null;if(team.cardContracts){team.cardContracts[target]=team.cardContracts[source];delete team.cardContracts[source];}}else{team.reserveCards.push(id);team.cards[source]=null;if(team.cardContracts)delete team.cardContracts[source];}});
  team.reserveCards=[...new Set(team.reserveCards.filter(id=>llCard(id)))];const clubFamily=llCardFamilyName(llCard(team.clubCards.market));if(clubFamily&&!team.usedCardFamilies.includes(clubFamily))team.usedCardFamilies.push(clubFamily);if(!team.dieHistory||typeof team.dieHistory!=='object')team.dieHistory={};LL_POSITIONS.forEach(pos=>{if(!Array.isArray(team.dieHistory[pos]))team.dieHistory[pos]=[];});team.chanceMisses=Math.max(0,Number(team.chanceMisses)||0);llEnsureUpgradeState(team,state);
}
const llV7RepairStateBase=llV2RepairState;
llV2RepairState=function(state){
  if(!state)return state;Object.values(state.teams||{}).forEach(team=>llPrepareV7Team(team,state));state=llV7RepairStateBase(state);Object.values(state.teams||{}).forEach(team=>llPrepareV7Team(team,state));
  const player=state.teams?.[state.playerTeam],owned=[...Object.values(player?.clubCards||{}),...(player?.reserveCards||[])].filter(Boolean);if(!Array.isArray(state.discoveredCards))state.discoveredCards=[];state.discoveredCards=[...new Set([...state.discoveredCards,...owned].filter(id=>llCard(id)))];state.cardUpgradeSystemVersion=LL_CARD_UPGRADE_SYSTEM_VERSION;return state;
};
function llExtraRerolls(teamName){const dice=LL_POSITIONS.map(pos=>({uid:`preview-${pos}`,position:pos,cardId:llActiveCardId(teamName,pos)}));return llExtraRerollsFromDice(dice);}
function llUpgradeCard(pos){
  const state=lexLeague.state;if(!llIsTransferWindow(state.week)){alert('Kart yalnızca transfer döneminde geliştirilebilir.');return;}const team=llTeamState(state.playerTeam);llEnsureTeamContracts(team);llEnsureUpgradeState(team,state);
  if(team.cardUpgradesUsed>=LL_CARD_UPGRADE_LIMIT){alert('Bu sezon iki kart geliştirme hakkını da kullandın.');return;}const current=llCard(team.cards[pos]),target=llUpgradeTarget(current?.id),cost=llUpgradeCost(current);if(!current||!target||!cost)return;if(!llCardContractSlotActive(team,pos)){alert('Sözleşmesi biten kart geliştirilemez.');return;}if(state.lp<cost){alert(`Yetersiz LP. Gerekli: ${cost} LP`);return;}
  if(!confirm(`${current.name} kartı ${cost} LP ile geliştirilsin mi?\n\nÖNCE: ${current.trigger} → ${current.effect}\nSONRA: ${target.trigger} → ${target.effect}`))return;state.lp-=cost;const contract=team.cardContracts[pos];team.cards[pos]=target.id;if(contract)contract.cardId=target.id;team.cardUpgradesUsed++;llDiscoverCards([target.id]);llSave();llRenderShop();
}
function llUpgradeShopHtml(){
  const state=lexLeague.state,team=llTeamState(state.playerTeam);llEnsureUpgradeState(team,state);const cards=LL_POSITIONS.map(pos=>({pos,current:llCard(team.cards[pos])})).map(item=>({...item,target:llUpgradeTarget(item.current?.id)})).filter(item=>item.target);
  return `<div class="ll-card" style="margin-top:16px"><div class="ll-card-title">⬆ Kart Geliştirme · ${team.cardUpgradesUsed}/${LL_CARD_UPGRADE_LIMIT} kullanıldı · LP: ${state.lp}</div><div class="ll-sub" style="margin-bottom:12px">Yalnızca işaretli Yaygın ve Nadir kartlar, transfer döneminde ve sezonda en fazla iki kez geliştirilir. Takım yıldızı 1–6★ olabilir; sonuç rastgele değildir.</div>${cards.length?`<div class="ll-shop-grid">${cards.map(({pos,current,target})=>{const cost=llUpgradeCost(current),active=llCardContractSlotActive(team,pos),disabled=team.cardUpgradesUsed>=LL_CARD_UPGRADE_LIMIT||!active||state.lp<cost;return `<div class="ll-card"><b>${LL_POSITION_ICONS[pos]} ${llEscape(current.name)}</b><div class="ll-muted">${llRarityLabel(current)} → ${llRarityLabel(target)} · ${cost} LP</div><div class="ll-sub" style="margin-top:8px"><b>Önce:</b> ${llEscape(current.trigger)} → ${llEscape(current.effect)}<br><b>Sonra:</b> ${llEscape(target.trigger)} → ${llEscape(target.effect)}</div><button class="ll-btn primary" style="width:100%;margin-top:10px" ${disabled?'disabled':''} onclick="llUpgradeCard('${pos}')">${cost} LP ile Geliştir</button></div>`;}).join('')}</div>`:'<div class="ll-notice">Aktif kadroda geliştirilebilir kart bulunmuyor.</div>'}</div>`;
}
function llClubCardShopHtml(){const team=llTeamState(lexLeague.state.playerTeam),card=llCard(team?.clubCards?.market);return `<div class="ll-card" style="margin-top:16px"><div class="ll-card-title">🏢 Kulüp / Market Kartı</div>${card?`<div class="ll-notice"><b>${llEscape(card.name)}</b> · Kalıcı, sözleşmesiz<br>${llEscape(card.effect)}</div>`:'<div class="ll-muted">Henüz kulüp/market kartın yok. Taktik Tahtası aktif zar yuvalarını işgal etmez.</div>'}</div>`;}
const llV7ChooseShopCardBase=llChooseShopCard;
llChooseShopCard=function(id){const card=llCard(id),sh=lexLeague.shop;if(!card?.clubCard){llV7ChooseShopCardBase(id);return;}if(!sh||!sh.offers.includes(id))return;const team=llTeamState(lexLeague.state.playerTeam);llPrepareV7Team(team,lexLeague.state);team.clubCards.market=id;const family=llCardFamilyName(card);if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);llDiscoverCards([id]);if(sh.mode==='starter'){lexLeague.state.starterPackClaimed=true;lexLeague.state.starterOffers={};lexLeague.shop=null;llSave();llRenderDashboard();return;}lexLeague.shop={position:null,offers:[]};llSave();llRenderShop();};
const llV7RenderShopBase=llRenderShop;
llRenderShop=function(){llV7RenderShopBase();const offers=document.getElementById('ll-shop-offers');if(offers&&!document.getElementById('ll-upgrade-shop'))offers.insertAdjacentHTML('beforebegin',`<div id="ll-club-card-shop">${llClubCardShopHtml()}</div><div id="ll-upgrade-shop">${llUpgradeShopHtml()}</div>`);};
const llV7EnsureDiscoveredBase=llEnsureDiscoveredCards;
llEnsureDiscoveredCards=function(){const known=llV7EnsureDiscoveredBase(),team=llTeamState(lexLeague.state.playerTeam);[...Object.values(team?.clubCards||{}),...(team?.reserveCards||[])].filter(Boolean).forEach(id=>{if(llCard(id)&&!known.includes(id))known.push(id);});lexLeague.state.discoveredCards=[...new Set(known)];return lexLeague.state.discoveredCards;};
const llV7RenderArchiveBase=llRenderCardArchive;
llRenderCardArchive=function(filter='discovered'){llV7RenderArchiveBase(filter);const team=llTeamState(lexLeague.state.playerTeam),special=[...Object.values(team?.clubCards||{}),...(team?.reserveCards||[])].map(llCard).filter(Boolean);if(!special.length)return;const tabs=llArea().querySelector('.ll-comp-tabs');if(tabs)tabs.insertAdjacentHTML('afterend',`<div class="ll-notice" style="margin:12px 0"><b>Kulüp / yedek kartlar:</b> ${special.map(card=>`${llEscape(card.name)} (${llRarityLabel(card)})`).join(' · ')}</div>`);};
function llAiUpgradeCards(teamName){const state=lexLeague.state,team=llTeamState(teamName);if(!team)return;llEnsureTeamContracts(team);llEnsureUpgradeState(team,state);while(team.cardUpgradesUsed<LL_CARD_UPGRADE_LIMIT){const choices=LL_POSITIONS.map(pos=>({pos,current:llCard(team.cards[pos])})).map(item=>({...item,target:llUpgradeTarget(item.current?.id)})).filter(item=>item.target&&llCardContractSlotActive(team,item.pos)&&team.aiLp>=llUpgradeCost(item.current)).sort((a,b)=>(llAiCardScore(b.target)+35-llAiCardScore(b.current))-(llAiCardScore(a.target)+35-llAiCardScore(a.current)));const choice=choices[0];if(!choice)break;const cost=llUpgradeCost(choice.current),contract=team.cardContracts[choice.pos];team.aiLp-=cost;team.cards[choice.pos]=choice.target.id;if(contract)contract.cardId=choice.target.id;team.cardUpgradesUsed++;}}
const llV7AiRenewBase=llV4RenewAiContracts;
llV4RenewAiContracts=function(teamName){llV7AiRenewBase(teamName);llAiUpgradeCards(teamName);};
function llAiShopAttempt(teamName){const team=llTeamState(teamName);if(!team||team.aiAp<150)return {spent:false,upgraded:false};llEnsureTeamContracts(team);llPrepareV7Team(team,lexLeague.state);const position=llAiTargetPosition(teamName),pool=llEligibleCards(teamName,position),offers=llPickDistinctOfferPair(pool);if(offers.length<2)return {spent:false,upgraded:false};team.aiAp-=150;const current=llCardContractSlotActive(team,position)?llCard(team.cards[position]):null,best=[...offers].sort((a,b)=>llAiCardScore(b)-llAiCardScore(a))[0];if(best.clubCard){if(!team.clubCards.market){team.clubCards.market=best.id;const family=llCardFamilyName(best);if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);return {spent:true,upgraded:true,position:'Kulüp/Market',oldId:null,newId:best.id};}return {spent:true,upgraded:false,position:'Kulüp/Market',oldId:team.clubCards.market,newId:null};}if(!current||llAiCardScore(best)>llAiCardScore(current)){const oldId=team.cards[position]||null,family=llCardFamilyName(best);if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);team.cards[position]=best.id;llResetCardContract(team,position,best.id);return {spent:true,upgraded:true,position,oldId,newId:best.id};}return {spent:true,upgraded:false,position,oldId:current.id,newId:null};}
function llApplyLocks(resolution,aName,bName){
  Object.assign(llTeamState(aName).lockedDice,resolution.nextLocks.a||{});Object.assign(llTeamState(bName).lockedDice,resolution.nextLocks.b||{});
  [[aName,resolution.aDice,resolution.scoreA,resolution.scoreB,resolution.triggeredCardIds?.a||[]],[bName,resolution.bDice,resolution.scoreB,resolution.scoreA,resolution.triggeredCardIds?.b||[]]].forEach(([name,dice,gf,ga,triggered])=>{const team=llTeamState(name);llPrepareV7Team(team,lexLeague.state);const benchPos=LL_POSITIONS.find(pos=>llBaseName(llCard(llActiveCardId(name,pos)))==='Yedek Kulübesi'),bench=llCard(benchPos?llActiveCardId(name,benchPos):null);if(bench&&((bench.upgradeLevel&&gf<=ga)||(!bench.upgradeLevel&&gf<ga)))team.nextMatchRerolls=(team.nextMatchRerolls||0)+1;
    LL_POSITIONS.forEach(pos=>{const card=llCard(llActiveCardId(name,pos));if(llBaseName(card)!=='Form Tutmuyor')return;const die=llFindPosition(dice,pos);if(card.upgradeRule==='form-burst'){team.dieHistory[pos]=[...team.dieHistory[pos],die?.value].slice(-3);if(team.dieHistory[pos].length===3&&team.dieHistory[pos].filter(value=>value===6).length>=2){team.nextMatchBonuses[pos]=(team.nextMatchBonuses[pos]||0)+1;team.dieHistory[pos]=[];}}else{team.sixStreaks[pos]=die?.value===6?(team.sixStreaks[pos]||0)+1:0;if(team.sixStreaks[pos]>=3){team.nextMatchBonuses[pos]=(team.nextMatchBonuses[pos]||0)+1;team.sixStreaks[pos]=0;}}});
    const chancePos=LL_POSITIONS.find(pos=>llCard(llActiveCardId(name,pos))?.upgradeRule==='chance-pity'),chance=chancePos?llCard(llActiveCardId(name,chancePos)):null;if(chance)team.chanceMisses=triggered.includes(chance.id)?0:Math.min(4,team.chanceMisses+1);
  });llUseTeamCardContracts(llTeamState(aName));llUseTeamCardContracts(llTeamState(bName));
}
/* Card upgrades V8: consistent labels, safe downgrade and recoverable base cards. */
const LL_CARD_UPGRADE_RELEASE_VERSION=1;
function llPrepareUpgradeReleaseTeam(team){
  if(!team)return team;
  if(!Array.isArray(team.releasedBaseCards))team.releasedBaseCards=[];
  team.releasedBaseCards=[...new Set(team.releasedBaseCards.filter(id=>{const card=llCard(id);return card&&!card.upgradeLevel&&!card.upgradeOnly;}))];
  const owned=[...Object.values(team.cards||{}),...(team.reserveCards||[]),...Object.values(team.clubCards||{})].map(llCard).filter(Boolean),ownedFamilies=new Set(owned.map(llCardFamilyName));
  team.releasedBaseCards=team.releasedBaseCards.filter(id=>!ownedFamilies.has(llCardFamilyName(llCard(id))));
  const releasedFamilies=new Set(team.releasedBaseCards.map(id=>llCardFamilyName(llCard(id))).filter(Boolean));
  if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];
  team.usedCardFamilies=team.usedCardFamilies.filter(family=>!releasedFamilies.has(family)||ownedFamilies.has(family));
  return team;
}
function llReleaseCardToMarket(team,cardOrId){
  const card=typeof cardOrId==='string'?llCard(cardOrId):cardOrId,marketCard=card?.upgradeLevel&&card?.upgradeFrom?llCard(card.upgradeFrom):card;
  if(!team||!marketCard||marketCard.clubCard||marketCard.upgradeOnly)return null;
  llPrepareUpgradeReleaseTeam(team);
  if(!team.releasedBaseCards.includes(marketCard.id))team.releasedBaseCards.push(marketCard.id);
  const family=llCardFamilyName(marketCard),stillOwned=[...Object.values(team.cards||{}),...(team.reserveCards||[]),...Object.values(team.clubCards||{})].map(llCard).filter(Boolean).some(item=>llCardFamilyName(item)===family);
  if(!stillOwned)team.usedCardFamilies=team.usedCardFamilies.filter(item=>item!==family);
  return marketCard.id;
}
function llReleaseUpgradedCardToMarket(team,cardOrId){
  const card=typeof cardOrId==='string'?llCard(cardOrId):cardOrId;
  return card?.upgradeLevel?llReleaseCardToMarket(team,card):null;
}
function llConsumeReleasedBase(team,cardId){
  if(!team||!Array.isArray(team.releasedBaseCards))return;
  team.releasedBaseCards=team.releasedBaseCards.filter(id=>id!==cardId);
}
const llV8RepairStateBase=llV2RepairState;
llV2RepairState=function(state){state=llV8RepairStateBase(state);Object.values(state?.teams||{}).forEach(llPrepareUpgradeReleaseTeam);if(state)state.cardUpgradeReleaseVersion=LL_CARD_UPGRADE_RELEASE_VERSION;return state;};
const llV8EligibleCardsBase=llEligibleCards;
llEligibleCards=function(teamName,pos){
  const team=llTeamState(teamName);llPrepareUpgradeReleaseTeam(team);const released=(team?.releasedBaseCards||[]).map(llCard).filter(Boolean),releasedByFamily=new Map(released.map(card=>[llCardFamilyName(card),card.id]));
  return llV8EligibleCardsBase(teamName,pos).filter(card=>{const required=releasedByFamily.get(llCardFamilyName(card));return !required||card.id===required;});
};
const llV8ChooseShopCardBase=llChooseShopCard;
llChooseShopCard=function(id){
  const sh=lexLeague.shop,newCard=llCard(id),team=llTeamState(lexLeague.state?.playerTeam),pos=sh?.position,oldCard=pos?llCard(team?.cards?.[pos]):null;
  if(oldCard?.upgradeLevel&&!newCard?.clubCard&&oldCard.id!==id&&!confirm('Bu kart ayrılırsa geliştirmesi kalıcı olarak kaybolacak. Temel sürümü daha sonra transfer kasalarında yeniden bulunabilir. Devam edilsin mi?'))return false;
  llV8ChooseShopCardBase(id);
  if(pos&&team?.cards?.[pos]===id){if(oldCard&&oldCard.id!==id)llReleaseCardToMarket(team,oldCard);llConsumeReleasedBase(team,id);llSave();}
  return true;
};
const llV8ReleaseExpiredCardBase=llReleaseExpiredCard;
llReleaseExpiredCard=function(pos){
  const state=lexLeague.state,team=llTeamState(state?.playerTeam),card=llCard(team?.cards?.[pos]),contract=team?.cardContracts?.[pos];
  if(!llIsTransferWindow(state.week)||!card||!contract||contract.remaining>0)return;
  const message=card.upgradeLevel?'Bu kart ayrılırsa geliştirmesi kalıcı olarak kaybolacak. Temel sürümü daha sonra transfer kasalarında yeniden bulunabilir. Devam edilsin mi?':'Sözleşmesi biten kart slotundan çıkarılsın mı? Kart arşivinde kalır ve daha sonra transfer kasalarında yeniden bulunabilir.';
  if(!confirm(message))return;
  team.cards[pos]=null;delete team.cardContracts[pos];llReleaseCardToMarket(team,card);llSave();llRenderShop();
};
const llV8AiShopAttemptBase=llAiShopAttempt;
llAiShopAttempt=function(teamName){
  const team=llTeamState(teamName),before=Object.fromEntries(LL_POSITIONS.map(pos=>[pos,llCard(team?.cards?.[pos])]));
  const result=llV8AiShopAttemptBase(teamName);
  LL_POSITIONS.forEach(pos=>{const old=before[pos],current=llCard(team?.cards?.[pos]);if(old&&current?.id!==old.id&&current?.upgradeFrom!==old.id)llReleaseCardToMarket(team,old);});
  if(result?.newId)llConsumeReleasedBase(team,result.newId);
  return result;
};
const llV8RenewAiContractsBase=llV4RenewAiContracts;
llV4RenewAiContracts=function(teamName){
  const team=llTeamState(teamName),before=Object.fromEntries(LL_POSITIONS.map(pos=>[pos,llCard(team?.cards?.[pos])]));
  llV8RenewAiContractsBase(teamName);
  LL_POSITIONS.forEach(pos=>{const old=before[pos],current=llCard(team?.cards?.[pos]);if(old&&current?.id!==old.id&&current?.upgradeFrom!==old.id)llReleaseCardToMarket(team,old);});
};


/* Season opening presentation and dual competition rankings. */
function llV9DomesticPosition(name){const key=llTeamLeague(name);if(!key)return null;const rows=llSortTable(key),position=rows.findIndex(row=>row.team===name)+1;return position>0?{label:llLeagueLabel(key),position,total:rows.length}:null;}
function llV9EuropeanPosition(name,type){if(!['ucl','uel','uecl'].includes(type)||!lexLeague.state)return null;llV2EnsureEuropeStandings(lexLeague.state);const rows=llV2SortEuropeTable(type),position=rows.findIndex(row=>row.team===name)+1;return position>0?{label:llV2EuroLabel(type),position,total:rows.length}:null;}
function llV9MatchRankHtml(name,competition){const domestic=llV9DomesticPosition(name),europe=llV9EuropeanPosition(name,competition),domesticText=domestic?`🏟 ${llEscape(domestic.label)} · ${domestic.position}. / ${domestic.total}`:'🏟 Yerel lig · oyunda takip edilmiyor';return `<div class="ll-team-ranks"><span>${domesticText}</span>${europe?`<span class="europe">🌍 ${llEscape(europe.label)} · ${europe.position}. / ${europe.total}</span>`:''}</div>`;}
function llV9DecorateDashboard(){const state=lexLeague.state,fixture=llPlayerFixture(),match=llArea()?.querySelector('.ll-next-match');if(!state||!fixture||!match)return;const opponent=fixture.home===state.playerTeam?fixture.away:fixture.home,names=[state.playerTeam,opponent],clubs=[...match.querySelectorAll('.ll-club')];clubs.forEach((club,index)=>{club.querySelector('.ll-team-ranks')?.remove();club.querySelector('b')?.insertAdjacentHTML('afterend',llV9MatchRankHtml(names[index],fixture.competition||'league'));});const actions=llArea()?.querySelector('.ll-topbar .ll-actions');if(actions&&!actions.querySelector('[data-season-opening]'))actions.insertAdjacentHTML('afterbegin',`<button class="ll-btn" data-season-opening onclick="llRenderSeasonOpening()">${Number(state.week)===1?'Sezon Açılışı':'Sezon Bilgileri'}</button>`);}
function llV9ArchiveStar(entry,name){const row=[...(entry?.superRows||[]),...(entry?.firstRows||[])].find(item=>item.team===name);return row?Number(row.stars||0):0;}
function llV9SeasonStarChanges(state,latest){const older=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-2),changes=[];[...state.leagues.super,...state.leagues.first].forEach(name=>{const from=older?llV9ArchiveStar(older,name):llV9ArchiveStar(latest,name),to=older?llV9ArchiveStar(latest,name):Number(state.teams?.[name]?.stars||0);if(from&&to&&from!==to)changes.push({name,from,to});});return changes.sort((a,b)=>Math.abs(b.to-b.from)-Math.abs(a.to-a.from)||a.name.localeCompare(b.name,'tr'));}
function llV9TeamRows(names,emptyText){if(!names?.length)return `<div class="ll-muted">${llEscape(emptyText)}</div>`;return `<div class="ll-season-team-list">${names.map(name=>`<div class="ll-season-team-row"><strong>${llTeamLogo(name,'table')}${llEscape(name)}</strong><span>${llStars(llV2TeamStarsInState(lexLeague.state,name))}</span></div>`).join('')}</div>`;}
function llV9GoalReward(goal){const parts=[];if(Number(goal.reward?.ap||0))parts.push('+'+Number(goal.reward.ap)+' AP');if(Number(goal.reward?.lp||0))parts.push('+'+Number(goal.reward.lp)+' LP');return parts.join(' · ')||'Rozet';}
function llRenderSeasonOpening(){const state=lexLeague.state;if(!state)return;lexLeague.active=true;llSetWide(true);llClearTransient();llSetEuropeMatchTheme(null);const league=llTeamLeague(state.playerTeam)||'first',leagueNames=state.leagues[league]||[],team=llTeamState(state.playerTeam),latest=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-1)||null,goals=llV2EnsureSeasonGoals(state),qualifications=llV3ResolveEuropeQualifications(state),changes=llV9SeasonStarChanges(state,latest),rivals=leagueNames.filter(name=>name!==state.playerTeam).sort((a,b)=>llV2TeamStarsInState(state,b)-llV2TeamStarsInState(state,a)||(llV2PreviousTeamContext(state,a)?.position||99)-(llV2PreviousTeamContext(state,b)?.position||99)||a.localeCompare(b,'tr')).slice(0,5),distribution=[6,5,4,3,2,1].map(star=>({star,count:leagueNames.filter(name=>llV2TeamStarsInState(state,name)===star).length})).filter(item=>item.count);const movement=latest?`<div class="ll-season-grid"><div class="ll-season-card"><div class="ll-card-title">Süper Lig'e Yükselenler</div>${llV9TeamRows(latest.promoted,'Yükselen takım kaydı yok.')}</div><div class="ll-season-card"><div class="ll-card-title">TFF 1. Lig'e Düşenler</div>${llV9TeamRows(latest.relegated,'Düşen takım kaydı yok.')}</div></div>`:`<div class="ll-notice" style="margin-top:14px">İlk sezon başlangıcı: yükselme ve düşme hareketleri sezon sonunda oluşacak.</div>`;const starHtml=changes.length?llV9TeamRows(changes.slice(0,8).map(item=>item.name),'')+`<div class="ll-muted" style="margin-top:8px">${changes.slice(0,8).map(item=>`${llEscape(item.name)}: ${item.from}★ → ${item.to}★`).join(' · ')}</div>`:`<div class="ll-muted">Kaydedilen sezonlar arasında yıldız değişimi yok.</div>`;llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-season-opening-hero"><div class="ll-season-opening-kicker">${Number(state.week)===1?'Yeni sezon · Yeni hikâye':`Sezon genel görünümü · ${state.week}. hafta`}</div><div class="ll-season-opening-title">Sezon ${state.season} <em>${Number(state.week)===1?'Açılışı':'Bilgileri'}</em></div><div class="ll-season-opening-sub">${llTeamLogo(state.playerTeam,'table')} <b>${llEscape(state.playerTeam)}</b> · ${llEscape(llLeagueLabel(league))} · ${leagueNames.length} takım · ${llStars(team.stars)}</div></div>${movement}<div class="ll-season-grid"><div class="ll-season-card"><div class="ll-card-title">Başlıca Lig Rakipleri</div>${llV9TeamRows(rivals,'Rakip bulunamadı.')}</div><div class="ll-season-card"><div class="ll-card-title">Yıldız Dengesi ve Değişimler</div><div class="ll-muted" style="margin-bottom:9px">${distribution.map(item=>`${item.star}★: ${item.count} takım`).join(' · ')}</div>${starHtml}</div></div><div class="ll-season-grid"><div class="ll-season-card"><div class="ll-card-title">Yönetim Hedefleri</div>${goals.items.map(goal=>`<div class="ll-season-goal"><span>${llEscape(goal.label)}</span><span>${llEscape(llV9GoalReward(goal))}</span></div>`).join('')}</div><div class="ll-season-card"><div class="ll-card-title">Türkiye'nin Avrupa Temsilcileri</div><div class="ll-season-europe-grid">${['ucl','uel','uecl'].map(type=>`<div class="ll-season-europe"><b>${llEscape(llV2EuroLabel(type))}</b>${(qualifications[type]||[]).map(name=>`<div class="ll-season-team-row"><strong>${llTeamLogo(name,'table')}${llEscape(name)}</strong><span>${name===state.playerTeam?'SEN':''}</span></div>`).join('')}</div>`).join('')}</div></div></div><div class="ll-actions" style="justify-content:center;margin-top:17px"><button class="ll-btn primary" onclick="llV9FinishSeasonOpening('dashboard')">${Number(state.week)===1&&Number(state.seasonOpeningViewed)!==Number(state.season)?'Sezona Başla':'Dashboarda Dön'}</button>${llIsTransferWindow(state.week)?`<button class="ll-btn gold" onclick="llV9FinishSeasonOpening('shop')">Transfer Merkezine Git</button>`:''}</div></div></div>`;}
function llV9FinishSeasonOpening(destination='dashboard'){const state=lexLeague.state;if(!state)return;state.seasonOpeningViewed=Number(state.season);llSave();if(destination==='shop')llRenderShop();else{llV9RenderDashboardBase();llV9DecorateDashboard();}}
const llV9RenderDashboardBase=llRenderDashboard;
llRenderDashboard=function(){const state=lexLeague.state;if(state&&!state.seasonEnded&&state.starterPackClaimed&&Number(state.week)===1&&Number(state.seasonOpeningViewed)!==Number(state.season)){llRenderSeasonOpening();return;}llV9RenderDashboardBase();llV9DecorateDashboard();};

/* Normal and elite two-card pack presentation with reload-safe offers. */
var llPackOpeningRuntime=null;
function llPackCardPalette(rarity){return {common:['#475569','#94a3b8'],rare:['#1d4ed8','#60a5fa'],epic:['#7e22ce','#c084fc'],legendary:['#b45309','#facc15']}[rarity]||['#334155','#94a3b8'];}
function llPackCardCinematicHtml(id,index,mode){const card=llCard(id),palette=llPackCardPalette(card?.rarity),icon=LL_POSITION_ICONS[card?.position]||'◆';if(!card)return '';return `<div class="ll-pack-card" data-pack-card="${index}" onclick="llRevealPackCard(${index})" style="--card-color:${palette[0]};--card-light:${palette[1]}"><div class="ll-pack-card-face ll-pack-card-back">${mode==='elite'?'ELİT ROL PAKETİ':'TRANSFER PAKETİ'}</div><div class="ll-pack-card-face ll-pack-card-front"><div class="ll-pack-rarity">${llEscape(LL_RARITY_LABELS[card.rarity]||card.rarity)}</div><div class="ll-pack-pos-icon">${icon}</div><div class="ll-pack-card-name">${llEscape(card.name)}</div><div class="ll-pack-card-meta">${llEscape(card.position)} · Min ${Number(card.minStar||1)}★</div><div class="ll-pack-card-effect"><b>Tetikleyici:</b> ${llEscape(card.trigger)}<br><b>Etki:</b> ${llEscape(card.effect)}</div><div class="ll-pack-card-actions"><button class="ll-btn ${mode==='elite'?'gold':'primary'}" type="button" onclick="event.stopPropagation();llSelectPackCard('${llEscape(card.id)}')">Bu Kartı Seç</button></div></div></div>`;}
function llShowPackOpening(mode,offerIds,options={}){const offers=(offerIds||[]).map(llCard).filter(Boolean);if(offers.length!==2){llRevealOpenedPack();return;}llClosePackOpening();const elite=mode==='elite',cost=Number(options.cost||0),costText=options.source==='voucher'?'HEDEF ÖDÜLÜ':`${cost||LL_PREMIUM_PACK_COST} AP`;llPackOpeningRuntime={mode,offers:offers.map(card=>card.id),timers:[],revealed:new Set(),started:false};document.body.classList.add('ll-cinematic-open');document.body.insertAdjacentHTML('beforeend',`<div class="ll-pack-cinematic ${elite?'elite':'regular'}" id="ll-pack-cinematic" role="dialog" aria-modal="true" aria-label="${elite?'Elit':'Normal'} kart paketi açılışı"><div class="ll-pack-particles"></div><button class="ll-pack-skip" type="button" onclick="llSkipPackAnimation()">Animasyonu Geç</button><div class="ll-pack-stage"><div class="ll-pack-kicker">${elite?'Destansı veya Efsanevi':'İki farklı kart teklifi'}</div><div class="ll-pack-title">${elite?'Elit Rol':'Transfer'} <em>Paketi</em></div><button class="ll-pack-shell" type="button" onclick="llBeginPackCinematic()"><span class="ll-pack-crown">${elite?'👑':'◇'}</span><span class="ll-pack-brand">LEXICON LİG</span><span class="ll-pack-line"></span><span class="ll-pack-type">${elite?'ELİT KASA':'NORMAL KASA'}</span><span class="ll-pack-cost">${llEscape(costText)}</span><span class="ll-pack-tap">▲ DOKUN VE AÇ ▲</span></button><div class="ll-pack-cards">${offers.map((card,index)=>llPackCardCinematicHtml(card.id,index,mode)).join('')}</div><div class="ll-pack-controls"><button class="ll-btn danger" type="button" onclick="llDiscardOpenedPack()">İki Kartı da İstemiyorum · AP İadesi Yok</button></div></div></div>`);if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)llSkipPackAnimation();}
function llPackSchedule(fn,delay){const id=setTimeout(fn,delay);if(llPackOpeningRuntime)llPackOpeningRuntime.timers.push(id);return id;}
function llBeginPackCinematic(){const runtime=llPackOpeningRuntime,root=document.getElementById('ll-pack-cinematic');if(!runtime||!root||runtime.started)return;runtime.started=true;const shell=root.querySelector('.ll-pack-shell'),elite=runtime.mode==='elite';shell?.classList.add('charging');if(typeof navigator.vibrate==='function')navigator.vibrate(elite?[35,35,55]:30);llPackSchedule(()=>{shell?.classList.remove('charging');shell?.classList.add('launched');root.classList.add('blast');llSpawnCinematicParticles(root,elite?78:36,elite?['#fde68a','#facc15','#c084fc']:['#bfdbfe','#60a5fa','#94a3b8']);llPackSchedule(()=>{root.classList.add('cards-ready');if(runtime.mode==='regular')llPackSchedule(()=>{llRevealPackCard(0);llRevealPackCard(1);},90);},elite?520:330);},elite?850:610);}
function llRevealPackCard(index){const runtime=llPackOpeningRuntime,root=document.getElementById('ll-pack-cinematic');if(!runtime||!root||!root.classList.contains('cards-ready')||runtime.revealed.has(index))return;runtime.revealed.add(index);root.querySelector(`[data-pack-card="${index}"]`)?.classList.add('revealed');if(typeof navigator.vibrate==='function')navigator.vibrate(22);if(runtime.revealed.size>=runtime.offers.length){root.classList.add('all-revealed');const skip=root.querySelector('.ll-pack-skip');if(skip)skip.hidden=true;}}
function llSkipPackAnimation(){const runtime=llPackOpeningRuntime,root=document.getElementById('ll-pack-cinematic');if(!runtime||!root)return;runtime.timers.forEach(clearTimeout);runtime.timers=[];runtime.started=true;root.classList.add('cards-ready','all-revealed');runtime.offers.forEach((id,index)=>{runtime.revealed.add(index);root.querySelector(`[data-pack-card="${index}"]`)?.classList.add('revealed');});const skip=root.querySelector('.ll-pack-skip');if(skip)skip.hidden=true;}
function llSpawnCinematicParticles(root,count,colors){const host=root?.querySelector('.ll-pack-particles');if(!host||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<count;i++){const particle=document.createElement('i'),angle=Math.random()*Math.PI*2,distance=90+Math.random()*(root.classList.contains('elite')?470:330);particle.className='ll-pack-particle';particle.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);particle.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);particle.style.setProperty('--duration',`${.75+Math.random()*1.15}s`);particle.style.setProperty('--delay',`${Math.random()*.18}s`);particle.style.setProperty('--particle',colors[Math.floor(Math.random()*colors.length)]);host.appendChild(particle);}}
function llSelectPackCard(id){const result=llChooseShopCard(id);if(result!==false)llClosePackOpening();}
function llDiscardOpenedPack(){const runtime=llPackOpeningRuntime;if(!runtime)return;if(!confirm('Bu iki kart alınmadan paket silinecek ve AP/paket hakkı iade edilmeyecek. Devam edilsin mi?'))return;const mode=runtime.mode;llClosePackOpening();if(mode==='elite')llDeferPremiumPack();else llSkipShopCards();}
function llClosePackOpening(){const runtime=llPackOpeningRuntime;if(runtime?.timers)runtime.timers.forEach(clearTimeout);document.getElementById('ll-pack-cinematic')?.remove();document.body?.classList.remove('ll-cinematic-open');llPackOpeningRuntime=null;}
/* Local career slots and portable JSON backups. Vocabulary remains shared between slots. */
const LL_SAVE_SLOTS_KEY='lexicon_league_save_slots_v1';
const LL_ACTIVE_SLOT_KEY='lexicon_league_active_slot_v1';
const LL_SAVE_SLOT_COUNT=3;
const LL_BACKUP_FORMAT_VERSION=1;
let llSaveSlotPendingCareer=null;
let llSaveSlotPendingImport=null;

function llSlotNumber(value){const slot=Number(value);return Number.isInteger(slot)&&slot>=1&&slot<=LL_SAVE_SLOT_COUNT?slot:null;}
function llSlotClone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
function llSlotCareerLooksValid(state){return !!(state&&typeof state==='object'&&Number(state.version)===2&&typeof state.playerTeam==='string'&&state.playerTeam&&Number.isFinite(Number(state.season))&&Number.isFinite(Number(state.week))&&state.teams&&typeof state.teams==='object'&&state.teams[state.playerTeam]&&state.leagues&&typeof state.leagues==='object'&&state.standings&&typeof state.standings==='object');}
function llSlotEmptyStore(){return {version:1,activeSlot:1,slots:{'1':null,'2':null,'3':null}};}
function llSlotNormalizeRecord(record){if(!record)return null;const state=record.state||record;if(!llSlotCareerLooksValid(state))return null;return {state:llSlotClone(state),updatedAt:typeof record.updatedAt==='string'?record.updatedAt:(state.updatedAt||state.createdAt||new Date().toISOString())};}
function llSlotWriteStore(store){try{localStorage.setItem(LL_SAVE_SLOTS_KEY,JSON.stringify(store));localStorage.setItem(LL_ACTIVE_SLOT_KEY,String(store.activeSlot));return true;}catch(error){console.error('Kariyer yuvaları kaydedilemedi.',error);alert('Kayıt alanı dolu veya tarayıcı kayda izin vermiyor. Tam yedek alıp kullanılmayan bir kariyeri silmen gerekebilir.');return false;}}
function llEnsureSaveSlots(){
  let raw=null;try{raw=JSON.parse(localStorage.getItem(LL_SAVE_SLOTS_KEY)||'null');}catch{raw=null;}
  const store=llSlotEmptyStore();
  if(raw&&typeof raw==='object'){
    for(let slot=1;slot<=LL_SAVE_SLOT_COUNT;slot++)store.slots[String(slot)]=llSlotNormalizeRecord(raw.slots?.[String(slot)]);
    store.activeSlot=llSlotNumber(localStorage.getItem(LL_ACTIVE_SLOT_KEY))||llSlotNumber(raw.activeSlot)||1;
  }else{
    let legacy=null;try{legacy=JSON.parse(localStorage.getItem(LL_V2_SAVE_KEY)||'null');}catch{legacy=null;}
    if(llSlotCareerLooksValid(legacy))store.slots['1']={state:llSlotClone(legacy),updatedAt:legacy.updatedAt||legacy.createdAt||new Date().toISOString()};
  }
  llSlotWriteStore(store);return store;
}
function llGetActiveSaveSlot(){const store=llEnsureSaveSlots();return llSlotNumber(localStorage.getItem(LL_ACTIVE_SLOT_KEY))||store.activeSlot||1;}
function llMirrorActiveCareer(store){const record=store.slots[String(store.activeSlot)];if(record?.state)localStorage.setItem(LL_V2_SAVE_KEY,JSON.stringify(record.state));else localStorage.removeItem(LL_V2_SAVE_KEY);}
function llSetActiveSaveSlot(slot){const selected=llSlotNumber(slot);if(!selected)return false;const store=llEnsureSaveSlots();store.activeSlot=selected;llSlotWriteStore(store);llMirrorActiveCareer(store);return true;}
function llRepairPortableCareer(raw){if(!llSlotCareerLooksValid(raw))throw new Error('Kariyer verisinin yapısı geçerli değil.');const state=llV2RepairState(llSlotClone(raw));if(!llSlotCareerLooksValid(state))throw new Error('Kariyer verisi onarılamadı.');return state;}

llSave=function(){
  if(!lexLeague.state)return false;
  const store=llEnsureSaveSlots(),slot=llSlotNumber(store.activeSlot)||1,now=new Date().toISOString();
  lexLeague.state.updatedAt=now;store.activeSlot=slot;store.slots[String(slot)]={state:llSlotClone(lexLeague.state),updatedAt:now};
  const saved=llSlotWriteStore(store);if(saved)localStorage.setItem(LL_V2_SAVE_KEY,JSON.stringify(lexLeague.state));return saved;
};
llLoad=function(slot=null){
  const store=llEnsureSaveSlots(),selected=llSlotNumber(slot)||llSlotNumber(store.activeSlot)||1,record=store.slots[String(selected)];if(!record)return null;
  try{const state=llRepairPortableCareer(record.state);store.activeSlot=selected;store.slots[String(selected)]={state:llSlotClone(state),updatedAt:record.updatedAt||new Date().toISOString()};llSlotWriteStore(store);localStorage.setItem(LL_V2_SAVE_KEY,JSON.stringify(state));return state;}catch(error){console.error('Kariyer yüklenemedi.',error);return null;}
};
llContinueGame=function(slot=null){const selected=llSlotNumber(slot)||llGetActiveSaveSlot(),state=llLoad(selected);if(!state){llCreateCareerInSlot(selected);return;}lexLeague.state=state;lexLeague.active=true;llSetWide(true);llSave();if(!state.starterPackClaimed)llRenderStarterShop();else if(state.seasonEnded)llRenderSeasonEnd();else llRenderDashboard();};
llResetGame=function(slot=null){const selected=llSlotNumber(slot)||llGetActiveSaveSlot(),store=llEnsureSaveSlots(),record=store.slots[String(selected)];if(!record)return;if(!confirm(`${selected}. kariyer yuvasındaki ${record.state.playerTeam} kaydı kalıcı olarak silinsin mi?\n\nKelime ve sözlük ilerlemen silinmez.`))return;store.slots[String(selected)]=null;const next=Object.keys(store.slots).find(key=>store.slots[key]);store.activeSlot=next?Number(next):1;llSlotWriteStore(store);llMirrorActiveCareer(store);lexLeague.state=null;llClearTransient();renderLexiconLeagueLanding();};
const llSlotTeamSelectBase=llRenderTeamSelect;
llRenderTeamSelect=function(slot=null){
  const store=llEnsureSaveSlots();llSaveSlotPendingCareer=llSlotNumber(slot)||llSaveSlotPendingCareer||Number(Object.keys(store.slots).find(key=>!store.slots[key]))||store.activeSlot||1;
  llSlotTeamSelectBase();const muted=llArea()?.querySelector('.ll-topbar .ll-muted');if(muted)muted.innerHTML=`${llSaveSlotPendingCareer}. kariyer yuvası · 20 kulüp · 6 yıldızlı güç sistemi · Kelime ilerlemesi tüm kariyerlerde ortaktır.`;
};
function llCreateCareerInSlot(slot){const selected=llSlotNumber(slot);if(!selected)return;const store=llEnsureSaveSlots(),record=store.slots[String(selected)];if(record&&!confirm(`${selected}. yuvadaki ${record.state.playerTeam} kariyerinin üzerine yeni kariyer yazılsın mı?`))return;llSaveSlotPendingCareer=selected;llRenderTeamSelect(selected);}
llStartCareer=function(teamName){
  const store=llEnsureSaveSlots(),slot=llSlotNumber(llSaveSlotPendingCareer)||Number(Object.keys(store.slots).find(key=>!store.slots[key]))||store.activeSlot||1,record=store.slots[String(slot)];
  if(record&&!confirm(`${slot}. yuvadaki ${record.state.playerTeam} kariyerinin üzerine yeni kariyer yazılsın mı?`))return;
  store.activeSlot=slot;store.slots[String(slot)]=null;llSlotWriteStore(store);llMirrorActiveCareer(store);lexLeague.state=llNewState(teamName);llAssignStarterCardsToAi();llSaveSlotPendingCareer=null;llSave();llRenderStarterShop();
};

function llSlotStateLeague(state){if(state?.leagues?.super?.includes(state.playerTeam))return 'super';if(state?.leagues?.first?.includes(state.playerTeam))return 'first';return null;}
function llSlotPosition(state,key){const rows=Object.values(state?.standings?.[key]||{}).sort((a,b)=>(Number(b.Pts)||0)-(Number(a.Pts)||0)||(Number(b.GD)||0)-(Number(a.GD)||0)||(Number(b.GF)||0)-(Number(a.GF)||0));const index=rows.findIndex(row=>row.team===state.playerTeam);return index>=0?index+1:null;}
function llSlotDate(value){try{return new Intl.DateTimeFormat('tr-TR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}catch{return 'Tarih yok';}}
function llSlotCardHtml(slot,record,activeSlot){
  if(!record)return `<div class="ll-save-card empty"><div class="ll-save-slot-label"><span>${slot}. Kariyer Yuvası</span><i>BOŞ</i></div><div class="ll-title" style="font-size:25px;margin-top:18px">Yeni bir <em>hikâye</em> başlat</div><div class="ll-muted" style="margin:9px 0 17px">Bu yuva diğer kariyerlerden bağımsızdır. Kelime ilerlemen ortak kalır.</div><button class="ll-btn gold" onclick="llCreateCareerInSlot(${slot})">Yeni Kariyer Başlat</button></div>`;
  const state=record.state,key=llSlotStateLeague(state),team=state.teams?.[state.playerTeam]||{},position=key?llSlotPosition(state,key):null,status=state.careerEnded?'Kariyer sona erdi':state.seasonEnded?'Sezon tamamlandı':`${Number(state.week)||1}. hafta`;
  return `<div class="ll-save-card ${slot===activeSlot?'active':''}"><div class="ll-save-slot-label"><span>${slot}. Kariyer Yuvası</span>${slot===activeSlot?'<i>AKTİF</i>':''}</div><div class="ll-save-team">${llTeamLogo(state.playerTeam,'compact')}<span>${llEscape(state.playerTeam)}</span></div><div class="ll-stars" style="margin-top:8px">${llStars(Math.max(1,Math.min(6,Number(team.stars)||1)))}</div><div class="ll-save-meta"><span>Sezon ${Number(state.season)||1} · ${llEscape(status)}</span><span>${llEscape(key?llLeagueLabel(key):'Lig yok')}${position?` · ${position}. sıra`:''}</span><span>AP ${Math.floor(Number(state.ap)||0)}</span><span>LP ${Math.floor(Number(state.lp)||0)}</span></div><div class="ll-save-updated">Son kayıt: ${llEscape(llSlotDate(record.updatedAt))}</div><div class="ll-save-actions"><button class="ll-btn primary" onclick="llContinueGame(${slot})">Kariyere Devam Et</button><button class="ll-btn" onclick="llExportCareerSlot(${slot})">Bu Kariyeri Dışa Aktar</button><button class="ll-btn danger" onclick="llResetGame(${slot})">Sil</button></div></div>`;
}

renderLexiconLeagueLanding=function(){
  lexLeague.active=true;llSetWide(true);llClearTransient();if(typeof llSetEuropeMatchTheme==='function')llSetEuropeMatchTheme(null);const store=llEnsureSaveSlots(),occupied=Object.values(store.slots).filter(Boolean).length;
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div class="ll-brand"><div class="ll-brand-mark">🎲⚽</div><div><div class="ll-title">Lexicon <em>League</em></div><div class="ll-muted">3 bağımsız kariyer · Ortak kelime ilerlemesi · Bulutsuz taşınabilir yedek</div></div></div><button class="ll-btn" onclick="llGoMainMenu()">← Ana Menü</button></div><div class="ll-notice"><b>Kariyerler ayrıdır:</b> takım, sezon, AP, LP, kartlar ve kupalar yalnızca kendi yuvasında saklanır. <b>Kelimeler ortaktır:</b> bilme oranı, tekrar geçmişi ve sözlük ilerlemesi üç kariyerde de aynıdır.</div><div class="ll-save-grid">${[1,2,3].map(slot=>llSlotCardHtml(slot,store.slots[String(slot)],store.activeSlot)).join('')}</div><div class="ll-backup-panel"><div class="ll-backup-head"><div><div class="ll-card-title" style="margin-bottom:5px">Yedekleme ve Cihazlar Arası Taşıma</div><div class="ll-sub">Bu cihazda ${occupied}/3 kariyer yuvası dolu. Yedekler cihazına JSON dosyası olarak indirilir; bulut bağlantısı kullanılmaz.</div></div><div class="ll-backup-actions"><button class="ll-btn primary" onclick="llExportFullBackup()">Tam Yedek İndir (Her Şey)</button><button class="ll-btn" onclick="document.getElementById('ll-backup-file').click()">JSON Yedeğini İçe Aktar</button><input id="ll-backup-file" type="file" accept="application/json,.json" hidden onchange="llHandleBackupFile(this)"></div></div><div class="ll-backup-guide"><div class="ll-backup-guide-item"><b>1 · Bu Kariyeri Dışa Aktar</b><span>Yalnızca ilgili yuvadaki takım, sezon, AP/LP, kart, kupa ve lig verisini indirir. Kelimeler dahil değildir. İçe aktarırken hedef yuvayı sen seçersin.</span></div><div class="ll-backup-guide-item"><b>2 · Tam Yedek İndir (Her Şey)</b><span>Üç kariyer yuvasının tamamını; kelimeleri, bilme/tekrar geçmişini ve çalışma istatistiklerini tek JSON dosyasına koyar.</span></div><div class="ll-backup-guide-item"><b>3 · JSON Yedeğini İçe Aktar</b><span>Tek kariyer dosyasında yalnızca seçtiğin yuva değişir. Tam yedekte cihazdaki üç yuva ve ortak kelime ilerlemesi yedekteki hâlle değiştirilir.</span></div></div><div class="ll-notice" style="margin-top:10px"><b>Önemli:</b> Tam yedeği içe aktarmak mevcut tüm kariyer ve kelime verilerini değiştirir. Onay verdiğinde işlem öncesindeki mevcut durum ayrıca otomatik güvenlik yedeği olarak indirilir.</div><div class="ll-muted" style="margin-top:9px">Telefon → PC örneği: telefonda uygun JSON yedeğini indir → dosyayı PC'ye gönder → PC'de “JSON Yedeğini İçe Aktar” seçeneğini kullan.</div></div></div></div>`;
};
function llBackupFileStamp(){const date=new Date(),pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;}
function llDownloadJson(filename,payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function llBuildFullBackup(){if(lexLeague.state)llSave();const store=llEnsureSaveSlots();let words=[],meta={};try{words=JSON.parse(localStorage.getItem(DB_KEY)||'[]');}catch{words=[];}try{meta=JSON.parse(localStorage.getItem(META_KEY)||'{}');}catch{meta={};}return {app:'lexicon-league',type:'full',formatVersion:LL_BACKUP_FORMAT_VERSION,exportedAt:new Date().toISOString(),activeSlot:store.activeSlot,careerSlots:llSlotClone(store.slots),vocabulary:{words:Array.isArray(words)?words:[],meta:meta&&typeof meta==='object'?meta:{}}};}
function llExportFullBackup(){llDownloadJson(`lexicon-league-tam-yedek_${llBackupFileStamp()}.json`,llBuildFullBackup());}
function llExportCareerSlot(slot){const selected=llSlotNumber(slot),record=llEnsureSaveSlots().slots[String(selected)];if(!record)return;llDownloadJson(`lexicon-league-${record.state.playerTeam.replace(/[^a-z0-9çğıöşü_-]+/gi,'-')}-yuva-${selected}_${llBackupFileStamp()}.json`,{app:'lexicon-league',type:'career',formatVersion:LL_BACKUP_FORMAT_VERSION,exportedAt:new Date().toISOString(),career:llSlotClone(record)});}
function llValidateBackup(payload){
  if(!payload||typeof payload!=='object'||payload.app!=='lexicon-league'||Number(payload.formatVersion)!==LL_BACKUP_FORMAT_VERSION)throw new Error('Bu dosya geçerli bir Lexicon League yedeği değil.');
  if(payload.type==='career'){const record=llSlotNormalizeRecord(payload.career);if(!record)throw new Error('Dosyada geçerli kariyer bulunamadı.');return {type:'career',record};}
  if(payload.type!=='full'||!payload.careerSlots||typeof payload.careerSlots!=='object')throw new Error('Yedek türü desteklenmiyor.');
  const slots={};for(let slot=1;slot<=LL_SAVE_SLOT_COUNT;slot++){const raw=payload.careerSlots[String(slot)],record=raw?llSlotNormalizeRecord(raw):null;if(raw&&!record)throw new Error(`${slot}. kariyer yuvası bozuk.`);slots[String(slot)]=record;}
  const words=payload.vocabulary?.words,meta=payload.vocabulary?.meta;if(!Array.isArray(words)||!meta||typeof meta!=='object'||Array.isArray(meta))throw new Error('Kelime veya çalışma istatistiği verisi geçerli değil.');
  return {type:'full',activeSlot:llSlotNumber(payload.activeSlot)||1,slots,words:llSlotClone(words),meta:llSlotClone(meta),exportedAt:payload.exportedAt||null};
}
async function llHandleBackupFile(input){
  const file=input?.files?.[0];if(!file)return;input.value='';if(file.size>12*1024*1024){alert('Yedek dosyası 12 MB sınırını aşıyor.');return;}
  try{const validated=llValidateBackup(JSON.parse(await file.text()));if(validated.type==='career'){llSaveSlotPendingImport=validated.record;const store=llEnsureSaveSlots();llShowModal(`<div class="ll-card-title">Kariyeri Hangi Yuvaya Aktaralım?</div><div class="ll-sub" style="margin-bottom:12px"><b>${llEscape(validated.record.state.playerTeam)}</b> · Sezon ${Number(validated.record.state.season)||1}. Dolu bir yuva seçilirse yalnızca o kariyerin üzerine yazılır; kelime ilerlemesi değişmez.</div><div class="ll-save-grid">${[1,2,3].map(slot=>`<button class="ll-team-option" onclick="llApplyCareerImport(${slot})"><b>${slot}. Yuva</b><div class="ll-range">${store.slots[String(slot)]?llEscape(store.slots[String(slot)].state.playerTeam):'Boş'}</div></button>`).join('')}</div>`);return;}llApplyFullBackup(validated);}catch(error){console.error(error);alert(`Yedek içe aktarılamadı: ${error.message||'Geçersiz dosya'}`);}
}
function llApplyCareerImport(slot){
  const selected=llSlotNumber(slot),record=llSaveSlotPendingImport;if(!selected||!record)return;const store=llEnsureSaveSlots(),existing=store.slots[String(selected)];if(existing&&!confirm(`${selected}. yuvadaki ${existing.state.playerTeam} kariyerinin üzerine yazılsın mı?`))return;
  try{const state=llRepairPortableCareer(record.state);llDownloadJson(`lexicon-league-aktarim-oncesi_${llBackupFileStamp()}.json`,llBuildFullBackup());store.slots[String(selected)]={state:llSlotClone(state),updatedAt:record.updatedAt||new Date().toISOString()};store.activeSlot=selected;if(!llSlotWriteStore(store))return;llMirrorActiveCareer(store);lexLeague.state=null;llSaveSlotPendingImport=null;llCloseModal();renderLexiconLeagueLanding();alert('Kariyer başarıyla içe aktarıldı. Kelime ilerlemesi değiştirilmedi.');}catch(error){alert(`Kariyer içe aktarılamadı: ${error.message}`);}
}
function llApplyFullBackup(validated){
  const careerCount=Object.values(validated.slots).filter(Boolean).length,wordCount=validated.words.length;if(!confirm(`Yedekte ${careerCount} kariyer ve ${wordCount} kelime kaydı var.\n\nMevcut üç kariyer yuvası ve ortak kelime ilerlemesi bu yedekle değiştirilecek. Devam edilsin mi?`))return;
  try{const repaired={};for(let slot=1;slot<=LL_SAVE_SLOT_COUNT;slot++){const record=validated.slots[String(slot)];repaired[String(slot)]=record?{state:llRepairPortableCareer(record.state),updatedAt:record.updatedAt||new Date().toISOString()}:null;}llDownloadJson(`lexicon-league-aktarim-oncesi_${llBackupFileStamp()}.json`,llBuildFullBackup());const store={version:1,activeSlot:validated.activeSlot,slots:repaired};if(!store.slots[String(store.activeSlot)]){const first=Object.keys(store.slots).find(key=>store.slots[key]);store.activeSlot=first?Number(first):1;}if(!llSlotWriteStore(store))return;localStorage.setItem(DB_KEY,JSON.stringify(validated.words));localStorage.setItem(META_KEY,JSON.stringify(validated.meta));llMirrorActiveCareer(store);lexLeague.state=null;alert('Tam yedek başarıyla içe aktarıldı. Sayfa yeni kariyerleri ve kelime ilerlemesini yüklemek için yenilenecek.');location.reload();}catch(error){console.error(error);alert(`Tam yedek içe aktarılamadı: ${error.message}`);}
}

const llSaveSlotDashboardBase=llRenderDashboard;
llRenderDashboard=function(){llSaveSlotDashboardBase();const actions=llArea()?.querySelector('.ll-topbar .ll-actions');if(actions&&!actions.querySelector('[data-save-manager]'))actions.insertAdjacentHTML('beforeend','<button class="ll-btn" data-save-manager onclick="renderLexiconLeagueLanding()">Kariyerler / Yedek</button>');};

/* Initialization is performed by save-backup-hardening.js. */
