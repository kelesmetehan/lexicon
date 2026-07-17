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
const LL_RECOVERY_AP=3,LL_PROMOTION_SUPPORT_AP=300,LL_SEASON_GOAL_VERSION=3,LL_TEAM_TARGET_VERSION=2,LL_SEASON_HISTORY_VERSION=1;
function llV2PlayerLeagueInState(state){return state?.leagues?.super?.includes(state.playerTeam)?'super':'first';}
function llV2TeamStarsInState(state,name){return Math.max(1,Math.min(5,Number(state?.teams?.[name]?.stars||LL_ALL_TEAMS.find(t=>t.name===name)?.stars||1)));}
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
function llV2TeamTierIndex(state,name,league){const stars=llV2TeamStarsInState(state,name),same=(state.leagues?.[league]||[]).filter(n=>llV2TeamStarsInState(state,n)===stars).sort((a,b)=>a.localeCompare(b,'tr'));return Math.max(0,same.indexOf(name));}
function llV2CreateTeamSeasonTargets(state){
  const targets={};
  ['super','first'].forEach(league=>(state.leagues?.[league]||[]).forEach(name=>{const stars=llV2TeamStarsInState(state,name),options=llV2TeamTargetOptions(league,stars),choice=options[llV2TeamTierIndex(state,name,league)%options.length];targets[name]={...choice,team:name,league,stars};}));
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
  const league=llV2PlayerLeagueInState(state),team=state.playerTeam,stars=llV2TeamStarsInState(state,team),primary={...llV2TeamTarget(team,state),id:'club_primary'},wins=(league==='first'?[0,10,13,17,20,22]:[0,8,10,13,16,19])[stars],goalsFor=(league==='first'?[0,32,42,52,60,68]:[0,28,36,45,54,62])[stars],items=[
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
  const candidates=LL_CARD_POOL.filter(card=>llV2CardFitsSlot(card,position,stars)&&!usedFamilies.has(llCardFamilyName(card)));
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
  return '';
}

function llTeamDef(name){
  const domestic=LL_ALL_TEAMS.find(t=>t.name===name);if(domestic)return domestic;
  const euro=UCL_TEAMS.find(t=>t.name===name),logoId=LL_EURO_LOGO_IDS[name];return euro?{name:euro.name,short:euro.short,stars:euro.pot===1?5:euro.pot===2?4:3,icon:euro.flag,logo:logoId?`https://tmssl.akamaized.net/images/wappen/head/${logoId}.png`:''}:{name,short:name,stars:3,icon:'🌍',logo:''};
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
function llRenderTeamSelect(){lexLeague.active=true;llSetWide(true);llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">TFF 1. Lig'den <em>Başla</em></div><div class="ll-muted">20 kulüp · 5 yıldızlı yeni güç sistemi · Hedef Süper Lig</div></div><button class="ll-btn" onclick="renderLexiconLeagueLanding()">← Geri</button></div><div class="ll-team-grid">${LL_FIRST_TEAMS.map(t=>`<button class="ll-team-option" onclick="llStartCareer('${llEscape(t.name)}')"><div class="ll-team-name team-with-logo">${llTeamLogo(t,'compact')}<span>${llEscape(t.name)}</span></div><div class="ll-stars">${llStars(t.stars)}</div><div class="ll-range">Zar aralığı ${llRangeText(t.stars)}</div></button>`).join('')}</div></div></div>`;}
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
  return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>Kart</th><th>AI AP</th><th>P</th></tr></thead><tbody>${rows.map((r,i)=>{const t=llTeamState(r.team),cards=LL_POSITIONS.filter(p=>llCard(t.cards[p])).length,euroClass=key!=='super'?'':euroZones.ucl.has(r.team)?'ucl-zone ':euroZones.uel.has(r.team)?'uel-zone ':euroZones.uecl.has(r.team)?'uecl-zone ':'';return `<tr class="${r.team===lexLeague.state.playerTeam?'player ':''}${key==='first'&&i<2?'champion-zone ':''}${key==='first'&&i>=2&&i<=6?'playoff-zone ':''}${euroClass}${key==='super'&&i>=rows.length-3?'relegation-zone ':''}"><td>${i+1}</td><td>${llTeamLogo(r.team,'table')}${llEscape(r.team)} <span class="ll-stars">${llStars(t.stars)}</span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GD}</td><td>${cards}/3</td><td>${r.team===lexLeague.state.playerTeam?'—':Math.floor(t.aiAp||0)}</td><td><b>${r.Pts}</b></td></tr>`;}).join('')}</tbody></table></div>${legend}`;}
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
function llRenderCompetitionCenter(tab='league',key=llTeamLeague(lexLeague.state.playerTeam)||'first'){
  const s=lexLeague.state;if(!s){renderLexiconLeagueLanding();return;}llSetWide(true);llV2RepairCupProgress(s);llV2EnsureEuropeStandings(s);const c=s.cup||{},playerCupMatches=(s.results||[]).filter(r=>r.competition==='cup'&&(r.home===s.playerTeam||r.away===s.playerTeam)).length,cupStatus=c.winner?`Şampiyon: ${c.winner}`:c.alive?'Kupada devam ediyor':'Kupadan elendi',euroType=['ucl','uel','uecl'].includes(key)?key:(s.europe?.type||'ucl'),leagueKey=['super','first'].includes(key)?key:(llTeamLeague(s.playerTeam)||'first');
  const tabs=`<div class="ll-comp-tabs"><button class="ll-comp-tab ${tab==='league'?'active':''}" onclick="llRenderCompetitionCenter('league','${llTeamLeague(s.playerTeam)||'first'}')">Ligler ve Fikstür</button><button class="ll-comp-tab ${tab==='cup'?'active':''}" onclick="llRenderCompetitionCenter('cup','${llTeamLeague(s.playerTeam)||'first'}')">Ziraat Türkiye Kupası</button><button class="ll-comp-tab ${tab==='europe'?'active':''}" onclick="llRenderCompetitionCenter('europe','${euroType}')">Avrupa Kupaları</button></div>`;
  const league=`<div class="ll-subtabs"><button class="ll-btn ${leagueKey==='super'?'primary':''}" onclick="llRenderCompetitionCenter('league','super')">Süper Lig</button><button class="ll-btn ${leagueKey==='first'?'primary':''}" onclick="llRenderCompetitionCenter('league','first')">TFF 1. Lig</button></div><div class="ll-card"><div class="ll-card-title">${llLeagueLabel(leagueKey)} Puan Tablosu</div>${llTableHtml(leagueKey)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llLeagueLabel(leagueKey)} · Tüm Eşleşmeler</div>${llV2LeagueFixturesHtml(leagueKey)}</div>`;
  const cup=`<div class="ll-cup-status"><div class="ll-metric"><strong>${cupStatus}</strong><span>Durum</span></div><div class="ll-metric"><strong>${c.winner?LL_CUP_ROUNDS.length:Math.min((c.round||0)+1,LL_CUP_ROUNDS.length)}/${LL_CUP_ROUNDS.length}</strong><span>Tur</span></div><div class="ll-metric"><strong>${playerCupMatches}</strong><span>Oynadığın Kupa Maçı</span></div></div><div class="ll-card"><div class="ll-card-title">Türkiye Kupası · Tüm Turlar ve Eşleşmeler</div>${llV2CupRoundsHtml()}</div>`;
  const activeText=s.europe?.type===euroType?(s.europe.alive?`${llV2EuroLabel(euroType)}'nde devam ediyorsun`:`${llV2EuroLabel(euroType)} serüvenin tamamlandı`):`Bu sezon ${llV2EuroLabel(euroType)} katılımın yok`,playerEuroMatches=(s.results||[]).filter(r=>r.competition===euroType&&(r.home===s.playerTeam||r.away===s.playerTeam)).length;
  const europe=`<div class="ll-subtabs"><button class="ll-btn ${euroType==='ucl'?'primary':''}" onclick="llRenderCompetitionCenter('europe','ucl')">Şampiyonlar Ligi</button><button class="ll-btn ${euroType==='uel'?'primary':''}" onclick="llRenderCompetitionCenter('europe','uel')">Avrupa Ligi</button><button class="ll-btn ${euroType==='uecl'?'primary':''}" onclick="llRenderCompetitionCenter('europe','uecl')">Konferans Ligi</button></div><div class="ll-cup-status"><div class="ll-metric"><strong>${activeText}</strong><span>Senin Durumun</span></div><div class="ll-metric"><strong>${playerEuroMatches}</strong><span>Oynadığın Maç</span></div><div class="ll-metric"><strong>${llV2EnsureEuropeStandings(s)[euroType].playedRounds}/${LL_EURO_WEEKS.length}</strong><span>İşlenen Tur</span></div></div><div class="ll-notice">Bu puan tablosu Avrupa eleme maçlarındaki sezon performansını karşılaştırır. Galibiyet 3, beraberlik 1 puandır; tur atlamayı puan sırası değil, oynanan eleme maçının sonucu belirler.</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llV2EuroLabel(euroType)} · Puan Durumu</div>${llV2EuropeTableHtml(euroType)}</div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llV2EuroLabel(euroType)} · Tüm Eşleşmeler</div>${llV2EuropeFixturesHtml(euroType)}</div>`;
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Müsabaka <em>Merkezi</em></div><div class="ll-muted">Sezon ${s.season} · Lig, kupa ve Avrupa eşleşmeleri</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div>${tabs}${tab==='cup'?cup:tab==='europe'?europe:league}</div></div>`;
}
function llRenderStandings(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){llRenderCompetitionCenter('league',key);}
function llV2RewardTable(){return `<div class="ll-card"><div class="ll-card-title">AP / LP Ödülleri</div><div class="ll-table-wrap"><table class="ll-table" style="min-width:520px"><thead><tr><th>Organizasyon</th><th>Doğru AP</th><th>Galibiyet LP</th><th>Beraberlik LP</th><th>Mağlubiyet LP</th></tr></thead><tbody>${[['Lig',LL_COMP_REWARDS.league],['Türkiye Kupası',LL_COMP_REWARDS.cup],['Play-Off',LL_COMP_REWARDS.playoff],['Şampiyonlar Ligi',LL_COMP_REWARDS.ucl],['Avrupa Ligi',LL_COMP_REWARDS.uel],['Konferans Ligi',LL_COMP_REWARDS.uecl]].map(([n,r])=>`<tr><td>${n}</td><td>${r.ap}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td></tr>`).join('')}</tbody></table></div><div class="ll-muted" style="margin-top:9px">Aktif yanlış listesindeki bir kelimeyi doğru bilmek ayrıca +${LL_RECOVERY_AP} AP kazandırır.</div></div>`;}
function llTransferWindowBanner(week){if(!llIsTransferWindow(week))return '';const seasonEnd=!!lexLeague.state?.seasonEnded,n=Number(week),early=n>=1&&n<=3,cost=llShopCost(),period=seasonEnd?`Sezon ${lexLeague.state.season} sonu`:early?`Sezon başlangıcı · ${n}/3. açık hafta`:`${week}. hafta`;return `<div class="ll-transfer-banner"><div><strong>🛒 TRANSFER DÖNEMİ AÇIK</strong><span>${period} · Kart kasası ${cost} AP · Mevcut AP: ${lexLeague.state.ap}${early?' · 4. hafta kapanır':''}</span></div><button class="ll-btn" onclick="llRenderShop()">Transfer Merkezine Git</button></div>`;}
function llRenderDashboard(){
  const s=lexLeague.state;if(!s){renderLexiconLeagueLanding();return;}if(s.seasonEnded){llRenderSeasonEnd();return;}lexLeague.active=true;llSetWide(true);llClearTransient();llV2EnsureSpecial();
  const f=llPlayerFixture();if(!f){llCompleteSeason();return;}const key=llTeamLeague(s.playerTeam),team=llTeamState(s.playerTeam),def=llTeamDef(s.playerTeam),oppName=f.home===s.playerTeam?f.away:f.home,opp=llTeamState(oppName),oppDef=llTeamDef(oppName),comp=f.competition||'league';
  const compLabel=comp==='league'?llLeagueLabel(key):comp==='cup'?'Ziraat Türkiye Kupası':comp==='playoff'?'1. Lig Play-Off':comp==='ucl'?'Şampiyonlar Ligi':comp==='uel'?'Avrupa Ligi':'Konferans Ligi',importance=llV2MatchImportance(f,key);
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div class="ll-brand"><div class="ll-brand-mark">${llTeamLogo(def,'brand')}</div><div><div class="ll-title">${llEscape(s.playerTeam)}</div><div class="ll-muted">Sezon ${s.season} · ${llLeagueLabel(key)} · ${s.week}. hafta</div></div></div><div class="ll-actions"><button class="ll-btn" onclick="llRenderStandings('${key}')">Lig Tablosu</button><button class="ll-btn" onclick="llRenderStandings('${key==='super'?'first':'super'}')">Diğer Lig</button><button class="ll-btn" onclick="llRenderCompetitionCenter('europe','${s.europe?.type||'ucl'}')">Avrupa Kupaları</button><button class="ll-btn" onclick="llRenderSeasonArchive()">Sezon Arşivi</button><button class="ll-btn" onclick="llRenderCardArchive()">Kart Arşivi</button>${llIsTransferWindow(s.week)?'<button class="ll-btn gold" onclick="llRenderShop()">Transfer Merkezi</button>':''}<button class="ll-btn" onclick="llGoMainMenu()">Ana Menü</button></div></div><div class="ll-metrics"><div class="ll-metric"><strong>${s.ap}</strong><span>AP</span></div><div class="ll-metric"><strong>${s.lp}</strong><span>LP</span></div><div class="ll-metric"><strong>${llStars(team.stars)}</strong><span>Yıldız</span></div><div class="ll-metric"><strong>${llSortTable(key).findIndex(x=>x.team===s.playerTeam)+1}.</strong><span>Sıra</span></div></div><div class="ll-grid"><div><div class="ll-card ${importance?'ll-big-match':''}">${importance?`<div class="ll-match-importance">${importance}</div>`:''}<div class="ll-card-title">${compLabel} · ${f.roundLabel||''}</div><div class="ll-next-match"><div class="ll-club"><div class="ll-club-icon">${llTeamLogo(def,'match')}</div><b>${llEscape(s.playerTeam)}</b></div><div class="ll-vs">VS</div><div class="ll-club"><div class="ll-club-icon">${llTeamLogo(oppDef,'match')}</div><b>${llEscape(oppName)}</b></div></div><button class="ll-btn primary" style="width:100%;margin-top:13px" onclick="llStartMatchPreparation()">10 Kelimelik Maça Başla</button></div><div class="ll-card" style="margin-top:12px"><div class="ll-card-title">Kadro ve Yetenekler</div><div class="ll-squad">${LL_POSITIONS.map(pos=>`<div class="ll-slot"><div class="ll-slot-head"><span class="ll-position">${LL_POSITION_ICONS[pos]} ${pos}</span><span class="ll-die-mini star${team.stars}">${llRangeText(team.stars)}</span></div>${llCardHtml(team.cards[pos],s.playerTeam)}</div>`).join('')}</div>${llRealCardSynergyHtml(s.playerTeam)}<button class="ll-btn" style="width:100%;margin-top:12px" ${team.stars>=5?'disabled':''} onclick="llUpgradeStars()">${team.stars>=5?'Maksimum 5 yıldız':`Yıldızı Yükselt · ${llV2UpgradeCost(team.stars)} LP`}</button></div><div style="margin-top:12px">${llV2SeasonGoalsHtml(false)}</div>${llV2RewardTable()}</div><div>${llTableHtml(key)}</div></div></div></div>`;
  const transferBanner=llTransferWindowBanner(s.week);if(transferBanner)llArea().innerHTML=llArea().innerHTML.replace('<div class="ll-grid">',`${transferBanner}<div class="ll-grid">`);
}

function llFinishLeagueQuiz(){const q=lexLeague.quiz;if(!q||q.committed)return;q.committed=true;const comp=llPlayerFixture()?.competition||'league',reward=LL_COMP_REWARDS[comp]||LL_COMP_REWARDS.league,baseAp=q.correct*reward.ap,recoveryAp=Number(q.recoveryBonus||0),ap=baseAp+recoveryAp;lexLeague.state.ap+=ap;const completed=!q.skipped&&q.index>=q.queue.length;let bonus='none';if(completed&&q.correct===10){bonus='perfect';lexLeague.state.lp+=10;}else if(completed&&q.correct===9)bonus='reroll';q.baseApEarned=baseAp;q.recoveryApEarned=recoveryAp;q.apEarned=ap;q.reward=bonus;q.totalAnswered=Number.isFinite(q.totalAnswered)?q.totalAnswered:q.index;llSave();llRenderQuizReward();}
function llRecordMatch(home,away,hg,ag,week,userMatch=false,competition='league',league=null){if(competition==='league'){llUpdateStanding(home,hg,ag);llUpdateStanding(away,ag,hg);[[home,hg,ag],[away,ag,hg]].forEach(([n,gf,ga])=>{if(n===lexLeague.state.playerTeam)return;const t=llTeamState(n);t.aiAp=(t.aiAp||0)+(gf>ga?20:gf===ga?12:6);});}else if(['ucl','uel','uecl'].includes(competition)&&league==='euro-table')llV2ApplyEuropeStanding(lexLeague.state,competition,home,hg,away,ag);lexLeague.state.results.push({season:lexLeague.state.season,week,home,away,homeGoals:hg,awayGoals:ag,userMatch,competition,league,cupRound:competition==='cup'?lexLeague.state.cup?.round:null});}
function llV2SimFixture(f,competition='league',league=null,week=lexLeague.state.week){const sim=llSimulateMatch(f.home,f.away);llRecordMatch(f.home,f.away,sim.homeGoals,sim.awayGoals,week,false,competition,league);llApplyLocks(sim.resolution,f.home,f.away);return sim.homeGoals===sim.awayGoals?(Math.random()<.5?f.home:f.away):sim.homeGoals>sim.awayGoals?f.home:f.away;}
function llV2PlayLeagueWeek(key,skipFixture){const round=lexLeague.state.schedules[key]?.[lexLeague.state.week-1]||[];round.filter(f=>!skipFixture||!(f.home===skipFixture.home&&f.away===skipFixture.away)).forEach(f=>llV2SimFixture(f,'league',key));}
function llCommitCurrentMatch(){
  const m=lexLeague.match;if(!m||m.committed||!m.resolution)return;m.committed=true;const s=lexLeague.state,f=m.fixture,comp=f.competition||'league',r=m.resolution,hg=m.playerHome?r.scoreA:r.scoreB,ag=m.playerHome?r.scoreB:r.scoreA,pg=r.scoreA,og=r.scoreB,reward=LL_COMP_REWARDS[comp]||LL_COMP_REWARDS.league;
  const lp=pg>og?reward.win:pg===og?reward.draw:reward.loss;s.lp+=lp;
  const usedCardIds=(m.playerDice||[]).map(die=>die.cardId).filter(Boolean),triggeredCardIds=llTriggeredPlayerCardIds(m);llRecordPlayerCardPerformance(usedCardIds,pg>og?'win':pg===og?'draw':'loss',comp,pg,og,triggeredCardIds);
  llRecordMatch(f.home,f.away,hg,ag,s.week,true,comp,f.league||null);llApplyLocks(r,m.player,m.opponent);
  let winner=pg===og?(Math.random()<.5?m.player:m.opponent):pg>og?m.player:m.opponent;
  if(comp==='league'){llV2PlayLeagueWeek('super',f.league==='super'?f:null);llV2PlayLeagueWeek('first',f.league==='first'?f:null);llDevelopOpponents(s.week);s.week++;}
  else if(comp==='cup')llV2FinishCupRound(winner);
  else if(['ucl','uel','uecl'].includes(comp))llV2FinishEuropeRound(winner);
  else if(comp==='playoff')llV2FinishPlayoffMatch(winner);
  s.pendingFixture=null;llSave();llRenderRoundSummary(s.week-(comp==='league'?1:0),lp,pg,og,comp,winner===m.player);
}
function llRenderRoundSummary(completedWeek,lp,pg,og,comp='league',advanced=false){const label=comp==='league'?'Lig':comp==='cup'?'Türkiye Kupası':comp==='playoff'?'Play-Off':comp.toUpperCase(),result=pg>og?'Galibiyet':pg===og?'Beraberlik':'Mağlubiyet';llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel" style="text-align:center"><div class="quiz-start-title">${label} · ${result} <em>${pg}-${og}</em></div><div class="ll-notice">+${lp} LP${comp!=='league'&&pg===og?` · Penaltılar: ${advanced?'Tur atladın':'Elendin'}`:''}</div><button class="ll-btn primary" style="margin-top:16px" onclick="llRenderDashboard()">Devam Et</button></div></div>`;}

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
  if(!s.teams[oppName])s.teams[oppName]={name:oppName,stars:opp?.pot===1?5:opp?.pot===2?4:3,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};
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
  return state;
}
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
  if(!LL_POSITIONS.includes(position))return;
  if(source==='voucher'&&s.sealedPremiumPacks<1){alert('Kapalı ücretsiz elit paketin yok.');return;}
  if(source==='paid'&&s.premiumPackPaidSeason===s.season){alert('Bu sezon ücretli elit paket hakkını kullandın.');return;}
  if(source==='paid'&&s.ap<LL_PREMIUM_PACK_COST){alert(`Yetersiz AP. Gerekli: ${LL_PREMIUM_PACK_COST} AP`);return;}
  const pool=llV3PremiumPool(position);if(new Set(pool.map(llCardFamilyName)).size<2){alert('Bu rol ve takım yıldızı için iki farklı, kullanılabilir ve yeni Destansı/Efsanevi kart bulunmuyor. AP veya paket hakkı harcanmadı.');return;}
  const offers=llV3PickPremiumPair(pool);if(offers.length<2)return;
  if(source==='paid'){s.ap-=LL_PREMIUM_PACK_COST;s.premiumPackPaidSeason=s.season;}else s.sealedPremiumPacks--;
  const pending={season:s.season,source,position,offers:offers.map(card=>card.id),openedAt:new Date().toISOString()};s.pendingPremiumPack=pending;
  s.premiumPackHistory.push({...pending,status:'pending'});lexLeague.shop={mode:'premium',position,offers:[...pending.offers],source};llDiscoverCards(pending.offers);llSave();llRenderShop();
}
function llDeferPremiumPack(){lexLeague.shop=null;llSave();llRenderShop();}

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
  llV3EnsurePremiumState(s);const pending=s.pendingPremiumPack;if(pending)lexLeague.shop={mode:'premium',position:pending.position,offers:[...pending.offers],source:pending.source};else lexLeague.shop={position:null,offers:[]};
  const cost=llShopCost(),period=seasonEnd?`Sezon ${s.season} sonu`:earlySeason?`Sezon başlangıcı · ${week}/3. açık hafta`:`${week}. hafta`,paidUsed=s.premiumPackPaidSeason===s.season;
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Transfer <em>Merkezi</em></div><div class="ll-muted">${period} · Normal kasa ${cost} AP · AP: ${s.ap}</div></div><button class="ll-btn" onclick="${seasonEnd?'llRenderSeasonEnd()':'llRenderDashboard()'}">← ${seasonEnd?'Sezon Sonu':'Dashboard'}</button></div><div class="ll-notice"><b>Tekrarsız teklifler:</b> Aynı transfer döneminde gördüğün kart ailesi yeniden çıkmaz. Elit paket de yalnızca kullanılabilir, daha önce keşfedilmemiş ve seçilen role ait kartlardan oluşur.</div><div class="ll-shop-grid" style="margin-top:16px">${LL_POSITIONS.map(pos=>`<div class="ll-card"><div class="ll-slot-head"><div class="ll-card-title" style="margin:0">${LL_POSITION_ICONS[pos]} ${pos}</div><div class="ll-stars">${llStars(llTeamState(s.playerTeam).stars)}</div></div>${llCardHtml(llTeamState(s.playerTeam).cards[pos],s.playerTeam,'Mevcut kart yok')}<button class="ll-btn gold" style="width:100%;margin-top:11px" onclick="llOpenShopPack('${pos}')">${cost} AP ile Kasa Aç</button></div>`).join('')}</div><div class="ll-card" style="margin-top:16px;border-color:rgba(234,179,8,.7);background:linear-gradient(135deg,rgba(88,28,135,.22),rgba(161,98,7,.18))"><div class="ll-card-title">✨ Elit Rol Paketi · ${LL_PREMIUM_PACK_COST} AP</div><div class="ll-sub">Seçtiğin role ait iki farklı kart açar. Her kart için Destansı %65 · Efsanevi %35. Sezon başına yalnızca bir ücretli paket; ücretsiz hedef paketi bu sınırı tüketmez.</div><div class="ll-muted" style="margin:8px 0 12px">${pending?'Açılmış paketin seçim bekliyor.':paidUsed?'Bu sezon ücretli paket kullanıldı.':`Mevcut AP: ${s.ap}`}${s.sealedPremiumPacks?` · Kapalı ücretsiz paket: ${s.sealedPremiumPacks}`:''}</div><div class="ll-actions">${LL_POSITIONS.map(pos=>`<button class="ll-btn gold" ${pending||paidUsed?'disabled':''} onclick="llOpenPremiumPack('${pos}','paid')">${LL_POSITION_ICONS[pos]} ${pos} · ${LL_PREMIUM_PACK_COST} AP</button>`).join('')}${s.sealedPremiumPacks&&!pending?LL_POSITIONS.map(pos=>`<button class="ll-btn primary" onclick="llOpenPremiumPack('${pos}','voucher')">🎁 ${pos} · Ücretsiz</button>`).join(''):''}</div></div><div id="ll-shop-offers"></div></div></div>`;
  if(pending)llRenderShopOffers();
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
function llV2UpgradeCost(stars){return ({1:800,2:1400,3:2300,4:3500})[stars]||0;}
function llUpgradeStars(){const t=llTeamState(lexLeague.state.playerTeam),cost=llV2UpgradeCost(t.stars);if(!cost)return;if(lexLeague.state.lp<cost){alert(`Yetersiz LP. Gerekli: ${cost} LP`);return;}if(!confirm(`${cost} LP ile takımı ${t.stars+1} yıldıza yükseltmek istiyor musun?`))return;lexLeague.state.lp-=cost;t.stars++;llSave();llRenderDashboard();}
function llStartCareer(teamName){if(localStorage.getItem(LL_V2_SAVE_KEY)&&!confirm('Mevcut iki ligli kariyerin üzerine yeni kariyer yazılsın mı?'))return;lexLeague.state=llNewState(teamName);llAssignStarterCardsToAi();llSave();llRenderStarterShop();}
