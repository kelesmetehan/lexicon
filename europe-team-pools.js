/* European team pools v15: cross-competition participant integrity and separate club fields. */
const LL_V14_EURO_POOL_VERSION=5;
const LL_V14_COUNTRY_FLAGS={
  ENG:'🇬🇧',GER:'🇩🇪',ESP:'🇪🇸',ITA:'🇮🇹',FRA:'🇫🇷',POR:'🇵🇹',BEL:'🇧🇪',GRE:'🇬🇷',
  AZE:'🇦🇿',NOR:'🇳🇴',DEN:'🇩🇰',NED:'🇳🇱',CZE:'🇨🇿',CYP:'🇨🇾',KAZ:'🇰🇿',TUR:'🇹🇷',
  HUN:'🇭🇺',SRB:'🇷🇸',SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',BUL:'🇧🇬',CRO:'🇭🇷',SUI:'🇨🇭',AUT:'🇦🇹',
  ROU:'🇷🇴',SWE:'🇸🇪',ISR:'🇮🇱',POL:'🇵🇱',UKR:'🇺🇦',SVN:'🇸🇮',ARM:'🇦🇲',
  KOS:'🇽🇰',FIN:'🇫🇮',MKD:'🇲🇰',BIH:'🇧🇦',GIB:'🇬🇮',SVK:'🇸🇰',ISL:'🇮🇸',
  IRL:'🇮🇪',MLT:'🇲🇹'
};
function llV14Club(name,country,stars,logoId=null,short=null){
  return {name,short:short||name,country,stars,pot:stars>=6?1:stars===5?2:stars===4?3:4,flag:LL_V14_COUNTRY_FLAGS[country]||'🌍',logoId};
}
const LL_V14_EURO_POOLS={
  ucl:[
    llV14Club("Manchester City","ENG",6,281),
    llV14Club("Real Madrid","ESP",6,418),
    llV14Club("Paris Saint-Germain","FRA",6,583),
    llV14Club("Arsenal","ENG",6,11),
    llV14Club("Chelsea FC","ENG",6,631),
    llV14Club("FC Barcelona","ESP",6,131),
    llV14Club("FC Bayern Münih","GER",6,27),
    llV14Club("Liverpool FC","ENG",6,31),
    llV14Club("Tottenham Hotspur","ENG",5,148),
    llV14Club("Inter Milan","ITA",6,46),
    llV14Club("Atlético Madrid","ESP",5,13),
    llV14Club("Newcastle United","ENG",5,762),
    llV14Club("Juventus","ITA",5,506),
    llV14Club("Bayer 04 Leverkusen","GER",5,15),
    llV14Club("SSC Napoli","ITA",5,6195),
    llV14Club("Borussia Dortmund","GER",5,16),
    llV14Club("Sporting Lizbon","POR",5,336),
    llV14Club("Atalanta Bergamo","ITA",5,800),
    llV14Club("SL Benfica","POR",5,294),
    llV14Club("AS Monaco","FRA",4,162),
    llV14Club("Eintracht Frankfurt","GER",4,24),
    llV14Club("Villarreal CF","ESP",4,1050),
    llV14Club("Galatasaray SK","TUR",5,141),
    llV14Club("PSV Eindhoven","NED",4,383),
    llV14Club("Athletic Bilbao","ESP",5,621),
    llV14Club("Olympique Marsilya","FRA",4,244),
    llV14Club("Ajax Amsterdam","NED",4,610),
    llV14Club("Club Brugge","BEL",4,2282),
    llV14Club("Olympiakos","GRE",4,683),
    llV14Club("Union Saint-Gilloise","BEL",3,3948),
    llV14Club("SK Slavia Prag","CZE",3,62),
    llV14Club("FK Bodø/Glimt","NOR",4,2619),
    llV14Club("FC Kopenhag","DEN",4,190),
    llV14Club("Pafos FC","CYP",3,20401),
    llV14Club("Qarabağ FK","AZE",3,10625),
    llV14Club("Kairat Almaty","KAZ",2,10470)
  ],
  uel:[
    llV14Club("Lyon","FRA",5,1041),
    llV14Club("Aston Villa","ENG",5,405),
    llV14Club("Midtjylland","DEN",4,865),
    llV14Club("Real Betis","ESP",5,150),
    llV14Club("Porto","POR",5,720),
    llV14Club("Braga","POR",4,1075),
    llV14Club("Freiburg","GER",4,60),
    llV14Club("Roma","ITA",5,12),
    llV14Club("Genk","BEL",4,1184),
    llV14Club("Bologna","ITA",4,1025),
    llV14Club("Stuttgart","GER",4,79),
    llV14Club("Ferencváros","HUN",3,279),
    llV14Club("Nottingham Forest","ENG",4,703),
    llV14Club("Viktoria Plzeň","CZE",3,941),
    llV14Club("Crvena zvezda","SRB",4,159),
    llV14Club("Celta Vigo","ESP",4,940),
    llV14Club("PAOK","GRE",4,1091),
    llV14Club("Lille","FRA",4,1082),
    llV14Club("Fenerbahçe","TUR",5,36),
    llV14Club("Panathinaikos","GRE",4,265),
    llV14Club("Celtic","SCO",4,371),
    llV14Club("Ludogorets","BUL",3,31614),
    llV14Club("Dinamo Zagreb","CRO",4,419),
    llV14Club("Brann","NOR",3,678),
    llV14Club("Young Boys","SUI",3,452),
    llV14Club("Sturm Graz","AUT",3,122),
    llV14Club("FCSB","ROU",3,301),
    llV14Club("Go Ahead Eagles","NED",3,1435),
    llV14Club("Feyenoord","NED",4,234),
    llV14Club("Basel","SUI",4,26),
    llV14Club("Red Bull Salzburg","AUT",4,409),
    llV14Club("Rangers","SCO",4,124),
    llV14Club("Nice","FRA",4,417),
    llV14Club("Utrecht","NED",3,200),
    llV14Club("Malmö","SWE",3,496),
    llV14Club("Maccabi Tel Aviv","ISR",3,119)
  ],
  uecl:[
    llV14Club("Crystal Palace","ENG",5,873),
    llV14Club("RC Strasbourg Alsace","FRA",4,667),
    llV14Club("ACF Fiorentina","ITA",5,430),
    llV14Club("Shakhtar Donetsk","UKR",4,660),
    llV14Club("AZ Alkmaar","NED",4,1090),
    llV14Club("1.FSV Mainz 05","GER",4,39),
    llV14Club("Dinamo Kiev","UKR",4,338),
    llV14Club("AC Sparta Prag","CZE",4,1971),
    llV14Club("Rayo Vallecano","ESP",4,367),
    llV14Club("AEK","GRE",4,2441),
    llV14Club("Lech Poznan","POL",4,238),
    llV14Club("Samsunspor","TUR",4,449),
    llV14Club("SK Rapid Wien","AUT",4,170),
    llV14Club("CS Universitatea Craiova","ROU",3,40812),
    llV14Club("HNK Rijeka","CRO",3,144),
    llV14Club("Slovan Bratislava","SVK",3,540),
    llV14Club("Raków Częstochowa","POL",3,38594),
    llV14Club("SK Sigma Olomouc","CZE",3,518),
    llV14Club("Jagiellonia Bialystok","POL",3,1288),
    llV14Club("FC Lausanne-Sport","SUI",3,527),
    llV14Club("Legia Varşova","POL",4,255),
    llV14Club("BK Häcken","SWE",3,1093),
    llV14Club("Aberdeen FC","SCO",3,370),
    llV14Club("Omonia Lefkoşa","CYP",3,766),
    llV14Club("AEK Larnaca","CYP",3,28095),
    llV14Club("NK Celje","SVN",3,379),
    llV14Club("FC Noah Erivan","ARM",2,26730),
    llV14Club("FC Drita","KOS",2,48320),
    llV14Club("HSK Zrinjski Mostar","BIH",3,110),
    llV14Club("Shkendija Tetovo","MKD",2,6020),
    llV14Club("Shamrock Rovers","IRL",3,3258),
    llV14Club("Kuopion Palloseura","FIN",2,2728),
    llV14Club("Hamrun Spartans","MLT",2,4669),
    llV14Club("Shelbourne FC","IRL",2,3700),
    llV14Club("Breidablik Kópavogur","ISL",2,1899),
    llV14Club("Lincoln Red Imps FC","GIB",2,12430)
  ]
};
const LL_V14_EURO_META=Object.fromEntries(Object.values(LL_V14_EURO_POOLS).flat().map(team=>[team.name,team]));
const LL_V14_SUPPLEMENTAL_TEAMS=[
  llV14Club('RSC Anderlecht','BEL',4,58),
  llV14Club('Standard Liège','BEL',3,3057),
  llV14Club('Heart of Midlothian','SCO',3,43),
  llV14Club('Hibernian FC','SCO',3,903),
  llV14Club('Molde FK','NOR',3,687),
  llV14Club('Rosenborg BK','NOR',3,1957),
  llV14Club('FK Partizan Belgrade','SRB',3,669),
  llV14Club('Grasshopper Club Zürich','SUI',3,504),
  llV14Club('FC Porto','POR',6,720),
  llV14Club('Sporting CP','POR',5,336),
  llV14Club('SL Benfica','POR',5,294),
  llV14Club('SC Braga','POR',3,2425),
  llV14Club('Club Brugge KV','BEL',5,2282),
  llV14Club('Royal Antwerp FC','BEL',3,1747),
  llV14Club('Union Saint-Gilloise','BEL',4,201),
  llV14Club('Celtic FC','SCO',5,371),
  llV14Club('Rangers FC','SCO',4,3120),
  llV14Club('Shakhtar Donetsk','UKR',4,660),
  llV14Club('Dynamo Kyiv','UKR',3,3446),
  llV14Club('Red Bull Salzburg','AUT',5,409),
  llV14Club('Sturm Graz','AUT',3,564),
  llV14Club('FC Basel','SUI',4,146),
  llV14Club('Young Boys','SUI',4,565),
  llV14Club('Slavia Prague','CZE',4,1230),
  llV14Club('Sparta Prague','CZE',3,1234),
  llV14Club('Red Star Belgrade','SRB',4,236),
  llV14Club('Dinamo Zagreb','CRO',4,2288),
  llV14Club('Hajduk Split','CRO',3,2287),
  llV14Club('Olympiacos FC','GRE',4,2159),
  llV14Club('Panathinaikos FC','GRE',3,2181),
  llV14Club('AEK Athens FC','GRE',3,2158),
  llV14Club('FC Copenhagen','DEN',4,1966),
  llV14Club('Bodo/Glimt','NOR',4,1859),
  llV14Club('Malmo FF','SWE',3,1873),
  llV14Club('Legia Warsaw','POL',3,1035),
  llV14Club('Maccabi Tel Aviv','ISR',3,3644),
  llV14Club('Ludogorets Razgrad','BUL',3,31059),
  llV14Club('Qarabag FK','AZE',3,7395)
];
const LL_V14_RECONCILIATION_RESERVES=[
  'RSC Anderlecht','Standard Liège','Heart of Midlothian','Hibernian FC',
  'Molde FK','Rosenborg BK','FK Partizan Belgrade','Grasshopper Club Zürich'
];
LL_V14_SUPPLEMENTAL_TEAMS.forEach(team=>{LL_V14_EURO_META[team.name]=team;});
// This registry is optional metadata used by the logo resolver.  Keep it on
// globalThis so loading this pool never aborts before local crest paths are
// registered (an undefined registry previously caused exactly that failure).
globalThis.LL_EURO_LOGO_IDS=globalThis.LL_EURO_LOGO_IDS||{};
Object.values(LL_V14_EURO_META).forEach(team=>{if(team.logoId)globalThis.LL_EURO_LOGO_IDS[team.name]=team.logoId;});
// Avrupa havuzundaki armalar artık dış CDN'den çağrılmaz. Mobil tarayıcılar
// uzak görsel isteğini engellese bile her takımın gerçek arması GitHub Pages
// üzerinden aynı origin'den yüklenir.
const LL_V14_LOCAL_LOGO_DIRECTORY='assets/team-logos/europe/official';
// Bazı açık kaynak sağlayıcılar armanın özgün biçimini WebP/JPEG döndürür.
// Uzantıyı doğru tutmak, GitHub Pages'in yanlış image/png üstbilgisi vermesini
// önler; geri kalan tüm yerel armalar PNG'dir.
const LL_V14_LOCAL_LOGO_EXTENSIONS={11:'jpg',1025:'jpg',2728:'webp',31614:'webp',3258:'webp',3700:'webp'};
globalThis.LL_LOCAL_TEAM_LOGOS=globalThis.LL_LOCAL_TEAM_LOGOS||{};
Object.values(LL_V14_EURO_META).forEach(team=>{
  if(team.logoId){const extension=LL_V14_LOCAL_LOGO_EXTENSIONS[team.logoId]||'png';globalThis.LL_LOCAL_TEAM_LOGOS[team.name]=`${LL_V14_LOCAL_LOGO_DIRECTORY}/${team.logoId}.${extension}`;}
});
function llV14EuroPool(type){return (LL_V14_EURO_POOLS[type]||[]).map(team=>team.name);}
const llV14TeamDefBase=llTeamDef;
llTeamDef=function(name){
  const domestic=LL_ALL_TEAMS.find(team=>team.name===name);
  if(domestic)return domestic;
  const team=LL_V14_EURO_META[name];
  if(!team)return llV14TeamDefBase(name);
  const extension=LL_V14_LOCAL_LOGO_EXTENSIONS[team.logoId]||'png';
  return {name:team.name,short:team.short,stars:team.stars,icon:team.flag,logo:team.logoId?`${LL_V14_LOCAL_LOGO_DIRECTORY}/${team.logoId}.${extension}`:''};
};
function llV14CurrentEuropeResults(state,type,userOnly=false){
  return (state.results||[]).filter(result=>Number(result.season)===Number(state.season)&&result.competition===type&&result.league==='euro-table'&&(!userOnly||result.userMatch));
}
function llV14PinnedTeams(state,type){
  const teams=[];llV14CurrentEuropeResults(state,type,true).forEach(result=>teams.push(result.home,result.away));
  if(state.europe?.type===type&&state.europe?.tie?.opponent)teams.push(state.europe.tie.opponent);
  if(state.pendingFixture?.competition===type)teams.push(state.pendingFixture.home,state.pendingFixture.away);
  return [...new Set(teams.filter(Boolean))];
}
function llV14TeamCountry(name){
  const canonical=typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name;
  return LL_V14_EURO_META[name]?.country||LL_V14_EURO_META[canonical]?.country||(typeof LL_TEAM_REGISTRY==='object'?LL_TEAM_REGISTRY[name]?.country||LL_TEAM_REGISTRY[canonical]?.country:null)||null;
}
function llV14ForeignTeams(state,type,qualifiers,reserved=new Set()){
  const canonical=name=>typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name;
  const player=canonical(state?.playerTeam),registryCountry=typeof LL_TEAM_REGISTRY==='object'?LL_TEAM_REGISTRY[player]?.country:null;
  // Oynanabilir ligi olan ülkelerin temsilcileri yalnızca kendi sezon sonu
  // kontenjanından gelir. Sabit havuz, oyunda ligi olmayan ülkeler içindir.
  const dynamicCountryCodes=typeof LL_COUNTRY_CODES!=='undefined'&&Array.isArray(LL_COUNTRY_CODES)?LL_COUNTRY_CODES:['TUR','ENG','GER','ESP','FRA','ITA','NED'],dynamicCountries=new Set(dynamicCountryCodes),blocked=new Set([...qualifiers.map(canonical),...reserved]);
  const pinned=[];
  for(const name of llV14PinnedTeams(state,type)){
    const key=canonical(name);if(!name||blocked.has(key))continue;
    blocked.add(key);pinned.push(name);
  }
  const fixed=[];
  for(const name of llV14EuroPool(type)){
    const key=canonical(name);if(dynamicCountries.has(llV14TeamCountry(name))||blocked.has(key))continue;
    blocked.add(key);fixed.push(name);
  }
  const needed=Math.max(0,36-qualifiers.length),combined=[...pinned,...fixed];
  for(const name of [...LL_V14_RECONCILIATION_RESERVES,...LL_V14_SUPPLEMENTAL_TEAMS.map(team=>team.name)]){
    if(combined.length>=needed)break;
    const key=canonical(name);if(!name||blocked.has(key)||dynamicCountries.has(llV14TeamCountry(name)))continue;
    blocked.add(key);combined.push(name);
  }
  if(combined.length<needed){const label=typeof llV2EuroLabel==='function'?llV2EuroLabel(type):String(type||'Avrupa kupas\u0131');console.warn(`${label} sabit havuzu ${needed-combined.length} ger\u00e7ek kul\u00fcp eksik kald\u0131.`);}
  return combined.slice(0,needed);
}
function llV14PinPlayerFixtures(state,type,fixtures){
  const player=state.playerTeam,pins=[...llV14CurrentEuropeResults(state,type,true)];
  if(state.pendingFixture?.competition===type&&state.pendingFixture.league==='euro-table')pins.push({...state.pendingFixture,euroRound:Number(state.europe?.round)||0});
  pins.forEach(result=>{
    const weekIndex=LL_EURO_LEAGUE_WEEKS[type].indexOf(Number(result.week));
    const roundIndex=Number.isInteger(Number(result.euroRound))?Number(result.euroRound):weekIndex,round=fixtures[roundIndex];if(!round)return;
    const opponent=result.home===player?result.away:result.home,playerIndex=round.findIndex(fixture=>fixture.home===player||fixture.away===player),opponentIndex=round.findIndex(fixture=>fixture.home===opponent||fixture.away===opponent);if(playerIndex<0)return;
    const previous=round[playerIndex],previousOpponent=previous.home===player?previous.away:previous.home;
    if(opponentIndex>=0&&opponentIndex!==playerIndex){const opponentFixture=round[opponentIndex];if(opponentFixture.home===opponent)opponentFixture.home=previousOpponent;else opponentFixture.away=previousOpponent;}
    round[playerIndex]={home:result.home,away:result.away};
  });
  return fixtures;
}
function llV14ParticipantOrder(qualifiers,foreign,roundCount){
  const teams=[...new Set([...qualifiers,...foreign])].slice(0,36);
  const country=name=>typeof LL_TEAM_REGISTRY==='object'?LL_TEAM_REGISTRY[name]?.country:null;
  const hash=value=>{let out=2166136261;for(const ch of String(value)){out^=ch.charCodeAt(0);out=Math.imul(out,16777619);}return out>>>0;};
  const positionRounds=llV3BuildEuropeFixtures(Array.from({length:teams.length},(_,index)=>index),roundCount),edges=positionRounds.flat().map(fixture=>[fixture.home,fixture.away]);
  const conflicts=ordered=>edges.reduce((sum,[a,b])=>sum+(country(ordered[a])&&country(ordered[a])===country(ordered[b])?1:0),0);
  let best=[...teams],bestScore=conflicts(best);
  for(let restart=0;restart<24&&bestScore;restart++){
    let seed=hash(`${restart}|${teams.join('|')}|${roundCount}`)||1;
    const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
    const ordered=[...teams];for(let index=ordered.length-1;index>0;index--){const pick=Math.floor(random()*(index+1));[ordered[index],ordered[pick]]=[ordered[pick],ordered[index]];}
    let score=conflicts(ordered);if(score<bestScore){best=[...ordered];bestScore=score;}
    for(let iteration=0;iteration<6000&&score;iteration++){
      const first=Math.floor(random()*ordered.length),second=Math.floor(random()*ordered.length);if(first===second||country(ordered[first])===country(ordered[second]))continue;
      [ordered[first],ordered[second]]=[ordered[second],ordered[first]];const next=conflicts(ordered);
      if(next<=score||random()<.002){score=next;if(score<bestScore){best=[...ordered];bestScore=score;if(!score)break;}}else [ordered[first],ordered[second]]=[ordered[second],ordered[first]];
    }
  }
  const fixtures=llV3BuildEuropeFixtures(best,roundCount);if(bestScore)console.warn(`Avrupa kura motoru ${bestScore} aynı ülke eşleşmesini önleyemedi.`);return {teams:best,fixtures};
}
function llV14RebuildEuropeStandings(state,preserveCurrent=true){
  const types=['ucl','uel','uecl'],qualifications=typeof llMLResolveEuropeParticipants==='function'?llMLResolveEuropeParticipants(state):llV3ResolveEuropeQualifications(state),previous=state.europeStandings;
  const oldRounds=Object.fromEntries(types.map(type=>[type,Number(previous?.[type]?.playedRounds)||0]));
  if(preserveCurrent)state.results=(state.results||[]).filter(result=>!(Number(result.season)===Number(state.season)&&types.includes(result.competition)&&result.league==='euro-table'&&!result.userMatch));
  const standings={season:state.season,formatVersion:LL_EURO_FORMAT_VERSION,poolVersion:LL_V14_EURO_POOL_VERSION,qualifications:llDeep(qualifications)};
  const reserved=new Set();
  types.forEach(type=>{
    const rounds=LL_EURO_LEAGUE_WEEKS[type].length,foreign=llV14ForeignTeams(state,type,qualifications[type],reserved),draw=llV14ParticipantOrder(qualifications[type],foreign,rounds),fixtures=llV14PinPlayerFixtures(state,type,draw.fixtures);
    standings[type]={formatVersion:LL_EURO_FORMAT_VERSION,poolVersion:LL_V14_EURO_POOL_VERSION,teams:draw.teams,standings:llBlankStandings(draw.teams),fixtures,playedRounds:Math.min(rounds,oldRounds[type]),leagueMatches:rounds};
    draw.teams.forEach(name=>reserved.add(typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name));
  });
  state.europeStandings=standings;
  types.forEach(type=>llV14CurrentEuropeResults(state,type,true).forEach(result=>{if(standings[type].teams.includes(result.home)&&standings[type].teams.includes(result.away))llV2ApplyEuropeStanding(state,type,result.home,result.homeGoals,result.away,result.awayGoals);}));
  types.forEach(type=>{const table=standings[type],weeks=LL_EURO_LEAGUE_WEEKS[type];for(let roundIndex=0;roundIndex<table.playedRounds;roundIndex++)(table.fixtures[roundIndex]||[]).forEach(fixture=>{if(fixture.home===state.playerTeam||fixture.away===state.playerTeam)return;const score=llV2SimpleEuropeScore(fixture.home,fixture.away);llV2ApplyEuropeStanding(state,type,fixture.home,score.homeGoals,fixture.away,score.awayGoals);state.results.push({season:state.season,week:weeks[roundIndex],home:fixture.home,away:fixture.away,homeGoals:score.homeGoals,awayGoals:score.awayGoals,userMatch:false,competition:type,league:'euro-table',cupRound:null,euroRound:roundIndex});});});
  state.europePoolVersion=LL_V14_EURO_POOL_VERSION;if(Number(state.europeKnockouts?.season)===Number(state.season))state.europeKnockouts=null;
  if(typeof llV4EnsureEuropeTeams==='function')llV4EnsureEuropeTeams(state,standings);return standings;
}
llV2CreateEuropeStandings=function(state){return llV14RebuildEuropeStandings(state,false);};
const llV14EnsureEuropeStandingsBase=llV2EnsureEuropeStandings;
llV2EnsureEuropeStandings=function(state){
  const allTypes=['ucl','uel','uecl'],canonical=name=>typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name,allTeams=allTypes.flatMap(type=>state?.europeStandings?.[type]?.teams||[]).map(canonical),valid=state?.europeStandings&&Number(state.europeStandings.season)===Number(state.season)&&Number(state.europeStandings.poolVersion)===LL_V14_EURO_POOL_VERSION&&new Set(allTeams).size===allTeams.length&&allTypes.every(type=>{const table=state.europeStandings[type],rounds=LL_EURO_LEAGUE_WEEKS[type].length;return Number(table?.poolVersion)===LL_V14_EURO_POOL_VERSION&&table?.teams?.length===36&&table.fixtures?.length===rounds&&table.fixtures.every(round=>round.length===18);});
  if(!valid)llV14RebuildEuropeStandings(state,true);const tables=llV14EnsureEuropeStandingsBase(state);tables.poolVersion=LL_V14_EURO_POOL_VERSION;
  Object.values(tables).filter(value=>value&&typeof value==='object'&&Array.isArray(value.teams)).forEach(table=>table.poolVersion=LL_V14_EURO_POOL_VERSION);state.europePoolVersion=LL_V14_EURO_POOL_VERSION;return tables;
};
const llV14RepairStateBase=llV2RepairState;
llV2RepairState=function(state){state=llV14RepairStateBase(state);if(state)llV2EnsureEuropeStandings(state);return state;};
