/* European team pools v14: separate 2025/26 club fields for UCL, UEL and UECL. */
const LL_V14_EURO_POOL_VERSION=2;
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
    llV14Club('Arsenal','ENG',6,11),llV14Club('Bayern München','GER',6,27),llV14Club('Liverpool','ENG',6,31),
    llV14Club('Tottenham Hotspur','ENG',5,148),llV14Club('Barcelona','ESP',6,131),llV14Club('Chelsea','ENG',6,631),
    llV14Club('Sporting CP','POR',5,336),llV14Club('Manchester City','ENG',6,281),llV14Club('Real Madrid','ESP',6,418),
    llV14Club('Inter','ITA',6,46),llV14Club('Paris Saint-Germain','FRA',6,583),llV14Club('Newcastle United','ENG',5,762),
    llV14Club('Juventus','ITA',5,506),llV14Club('Atlético Madrid','ESP',5,13),llV14Club('Atalanta','ITA',5,800),
    llV14Club('Bayer Leverkusen','GER',5,15),llV14Club('Borussia Dortmund','GER',5,16),llV14Club('Olympiacos','GRE',4,683),
    llV14Club('Club Brugge','BEL',4,2282),llV14Club('Galatasaray','TUR',5,141),llV14Club('Monaco','FRA',4,162),
    llV14Club('Qarabağ','AZE',3,10625),llV14Club('Bodø/Glimt','NOR',4,2619),llV14Club('Benfica','POR',5,294),
    llV14Club('Marseille','FRA',4,244),llV14Club('Pafos','CYP',3,20401),llV14Club('Union Saint-Gilloise','BEL',3,3948),
    llV14Club('PSV Eindhoven','NED',4,383),llV14Club('Athletic Club','ESP',5,621),llV14Club('Napoli','ITA',5,6195),
    llV14Club('Copenhagen','DEN',4,190),llV14Club('Ajax','NED',4,610),llV14Club('Eintracht Frankfurt','GER',4,24),
    llV14Club('Slavia Praha','CZE',3,62),llV14Club('Villarreal','ESP',4,1050),llV14Club('Kairat Almaty','KAZ',2,10470)
  ],
  uel:[
    llV14Club('Lyon','FRA',5,1041),llV14Club('Aston Villa','ENG',5,405),llV14Club('Midtjylland','DEN',4,865),
    llV14Club('Real Betis','ESP',5,150),llV14Club('Porto','POR',5,720),llV14Club('Braga','POR',4,1075),
    llV14Club('SC Freiburg','GER',4,60),llV14Club('Roma','ITA',5,12),llV14Club('Genk','BEL',4,1184),
    llV14Club('Bologna','ITA',4,1025),llV14Club('VfB Stuttgart','GER',4,79),llV14Club('Ferencváros','HUN',3,279),
    llV14Club('Nottingham Forest','ENG',4,703),llV14Club('Viktoria Plzeň','CZE',3,941),llV14Club('Red Star Belgrade','SRB',4,159),
    llV14Club('Celta Vigo','ESP',4,940),llV14Club('PAOK','GRE',4,1091),llV14Club('Lille','FRA',4,1082),
    llV14Club('Fenerbahçe','TUR',5,36),llV14Club('Panathinaikos','GRE',4,265),llV14Club('Celtic','SCO',4,371),
    llV14Club('Ludogorets Razgrad','BUL',3,31614),llV14Club('Dinamo Zagreb','CRO',4,419),llV14Club('Brann','NOR',3,678),
    llV14Club('Young Boys','SUI',3,452),llV14Club('Sturm Graz','AUT',3,122),llV14Club('FCSB','ROU',3,301),
    llV14Club('Go Ahead Eagles','NED',3,1435),llV14Club('Feyenoord','NED',4,234),llV14Club('Basel','SUI',4,26),
    llV14Club('Red Bull Salzburg','AUT',4,409),llV14Club('Rangers','SCO',4,124),llV14Club('Nice','FRA',4,417),
    llV14Club('Utrecht','NED',3,200),llV14Club('Malmö FF','SWE',3,496),llV14Club('Maccabi Tel Aviv','ISR',3,119)
  ],
  uecl:[
    llV14Club('Strasbourg','FRA',4,667),llV14Club('Raków Częstochowa','POL',3,38594),llV14Club('AEK Athens','GRE',4,2441),
    llV14Club('Sparta Prague','CZE',4,1971),llV14Club('Rayo Vallecano','ESP',4,367),llV14Club('Shakhtar Donetsk','UKR',4,660),
    llV14Club('Mainz 05','GER',4,39),llV14Club('AEK Larnaca','CYP',3,28095),llV14Club('Lausanne-Sport','SUI',3,527),
    llV14Club('Crystal Palace','ENG',5,873),llV14Club('Lech Poznań','POL',4,238),llV14Club('Samsunspor','TUR',4,449),
    llV14Club('Celje','SVN',3,379),llV14Club('AZ','NED',4,1090),llV14Club('Fiorentina','ITA',5,430),
    llV14Club('Rijeka','CRO',3,144),llV14Club('Jagiellonia Białystok','POL',3,1288),llV14Club('Omonia','CYP',3,766),
    llV14Club('Noah','ARM',2,26730),llV14Club('Drita','KOS',2,48320),llV14Club('KuPS','FIN',2,2728),
    llV14Club('Shkëndija','MKD',2,6020),llV14Club('Zrinjski Mostar','BIH',3,110),llV14Club('Sigma Olomouc','CZE',3,518),
    llV14Club('Universitatea Craiova','ROU',3,40812),llV14Club('Lincoln Red Imps','GIB',2,12430),llV14Club('Dynamo Kyiv','UKR',4,338),
    llV14Club('Legia Warsaw','POL',4,255),llV14Club('Slovan Bratislava','SVK',3,540),llV14Club('Breiðablik','ISL',2,1899),
    llV14Club('Shamrock Rovers','IRL',3,3258),llV14Club('BK Häcken','SWE',3,1093),llV14Club('Hamrun Spartans','MLT',2,4669),
    llV14Club('Shelbourne','IRL',2,3700),llV14Club('Aberdeen','SCO',3,370),llV14Club('Rapid Wien','AUT',4,170)
  ]
};
const LL_V14_EURO_META=Object.fromEntries(Object.values(LL_V14_EURO_POOLS).flat().map(team=>[team.name,team]));
Object.values(LL_V14_EURO_META).forEach(team=>{if(team.logoId)LL_EURO_LOGO_IDS[team.name]=team.logoId;});
function llV14EuroPool(type){return (LL_V14_EURO_POOLS[type]||[]).map(team=>team.name);}
const llV14TeamDefBase=llTeamDef;
llTeamDef=function(name){
  const domestic=LL_ALL_TEAMS.find(team=>team.name===name);
  if(domestic)return domestic;
  const team=LL_V14_EURO_META[name];
  if(!team)return llV14TeamDefBase(name);
  return {name:team.name,short:team.short,stars:team.stars,icon:team.flag,logo:team.logoId?`https://tmssl.akamaized.net/images/wappen/head/${team.logoId}.png`:''};
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
function llV14ForeignTeams(state,type,qualifiers){
  const domestic=new Set(LL_ALL_TEAMS.map(team=>team.name));
  const pinned=llV14PinnedTeams(state,type).filter(name=>!qualifiers.includes(name)&&!domestic.has(name));
  const pool=llV14EuroPool(type).filter(name=>!domestic.has(name)&&!qualifiers.includes(name)&&!pinned.includes(name));
  const shift=(Number(state.season)*7+({ucl:0,uel:11,uecl:23}[type]||0))%Math.max(1,pool.length);
  const rotated=[...pool.slice(shift),...pool.slice(0,shift)];
  return [...pinned,...rotated].slice(0,34);
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
function llV14RebuildEuropeStandings(state,preserveCurrent=true){
  const types=['ucl','uel','uecl'],qualifications=llV3ResolveEuropeQualifications(state),previous=state.europeStandings;
  const oldRounds=Object.fromEntries(types.map(type=>[type,Number(previous?.[type]?.playedRounds)||0]));
  if(preserveCurrent)state.results=(state.results||[]).filter(result=>!(Number(result.season)===Number(state.season)&&types.includes(result.competition)&&result.league==='euro-table'&&!result.userMatch));
  const standings={season:state.season,formatVersion:LL_EURO_FORMAT_VERSION,poolVersion:LL_V14_EURO_POOL_VERSION,qualifications:llDeep(qualifications)};
  types.forEach(type=>{
    const rounds=LL_EURO_LEAGUE_WEEKS[type].length,foreign=llV14ForeignTeams(state,type,qualifications[type]),draw=llV3EuropeTeamOrder(qualifications[type],foreign,rounds),fixtures=llV14PinPlayerFixtures(state,type,draw.fixtures);
    standings[type]={formatVersion:LL_EURO_FORMAT_VERSION,poolVersion:LL_V14_EURO_POOL_VERSION,teams:draw.teams,standings:llBlankStandings(draw.teams),fixtures,playedRounds:Math.min(rounds,oldRounds[type]),leagueMatches:rounds};
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
  const valid=state?.europeStandings&&Number(state.europeStandings.season)===Number(state.season)&&Number(state.europeStandings.poolVersion)===LL_V14_EURO_POOL_VERSION&&['ucl','uel','uecl'].every(type=>{const table=state.europeStandings[type],rounds=LL_EURO_LEAGUE_WEEKS[type].length;return Number(table?.poolVersion)===LL_V14_EURO_POOL_VERSION&&table?.teams?.length===36&&table.fixtures?.length===rounds&&table.fixtures.every(round=>round.length===18);});
  if(!valid)llV14RebuildEuropeStandings(state,true);const tables=llV14EnsureEuropeStandingsBase(state);tables.poolVersion=LL_V14_EURO_POOL_VERSION;
  Object.values(tables).filter(value=>value&&typeof value==='object'&&Array.isArray(value.teams)).forEach(table=>table.poolVersion=LL_V14_EURO_POOL_VERSION);state.europePoolVersion=LL_V14_EURO_POOL_VERSION;return tables;
};
const llV14RepairStateBase=llV2RepairState;
llV2RepairState=function(state){state=llV14RepairStateBase(state);if(state)llV2EnsureEuropeStandings(state);return state;};
