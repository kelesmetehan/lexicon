'use strict';

/*
 * Global club-star rebalance v1.
 * Scale:
 * 6★ European elite; 5★ title/UCL contender; 4★ European contender;
 * 3★ solid top-flight / leading second-tier; 2★ lower top-flight / regular second-tier;
 * 1★ lower-end second-tier.
 *
 * Loaded after multi-league-engine.js. Baseline changes are migrated into
 * existing careers while preserving star levels bought with LP.
 */
var LL_TEAM_STAR_REBALANCE_VERSION=1;
var LL_DOMESTIC_STAR_REBALANCE={"Galatasaray":5,"Fenerbahçe":5,"Beşiktaş":4,"Trabzonspor":4,"Başakşehir":3,"Konyaspor":3,"Alanyaspor":3,"Göztepe":3,"Samsunspor":3,"Ç. Rizespor":3,"Eyüpspor":3,"Kasımpaşa":2,"Amed SK":2,"Çorum FK":2,"Erzurumspor FK":2,"Gaziantep FK":2,"Gençlerbirliği":2,"Kocaelispor":2,"Antalyaspor":3,"Bursaspor":3,"Bodrum FK":3,"Kayserispor":3,"Sivasspor":3,"Fatih Karagümrük":3,"Manisa FK":2,"Iğdır FK":2,"İstanbulspor":2,"Bandırmaspor":2,"Batman Petrolspor":2,"Pendikspor":2,"Van Spor FK":2,"Ankara Keçiörengücü":2,"Ümraniyespor":2,"Boluspor":2,"Sarıyerspor":1,"Esenler Erokspor":1,"Mardin 1969 Spor":1,"Muğlaspor":1,"Manchester City":6,"Arsenal FC":6,"Chelsea FC":6,"Liverpool FC":6,"Manchester United":5,"Tottenham Hotspur":5,"Newcastle United":5,"Aston Villa":5,"AFC Bournemouth":4,"Nottingham Forest":4,"Brighton & Hove Albion":4,"Crystal Palace":4,"Brentford FC":4,"Sunderland AFC":4,"Everton FC":3,"Leeds United":3,"Fulham FC":3,"Ipswich Town":3,"Coventry City":2,"Hull City":2,"Southampton FC":3,"Middlesbrough FC":3,"Sheffield United":3,"Leicester City":3,"Birmingham City":3,"Norwich City":3,"Millwall FC":3,"West Ham United":3,"Wolverhampton Wanderers":3,"Burnley FC":3,"Watford FC":2,"Swansea City":2,"Stoke City":2,"Wrexham AFC":2,"Bristol City":2,"Queens Park Rangers":2,"West Bromwich Albion":2,"Derby County":2,"Blackburn Rovers":2,"Portsmouth FC":2,"Preston North End":1,"Oxford United":1,"Charlton Athletic":1,"Sheffield Wednesday":1,"Bayern Munich":6,"RB Leipzig":5,"Borussia Dortmund":5,"Bayer 04 Leverkusen":5,"VfB Stuttgart":4,"Eintracht Frankfurt":4,"TSG 1899 Hoffenheim":4,"SC Freiburg":4,"1.FSV Mainz 05":4,"Hamburger SV":3,"SV Werder Bremen":3,"FC Augsburg":3,"1.FC Köln":3,"Borussia Mönchengladbach":3,"1.FC Union Berlin":3,"FC Schalke 04":3,"SC Paderborn 07":2,"SV 07 Elversberg":2,"Hertha BSC":3,"Hannover 96":3,"1.FC Nuremberg":3,"VfL Bochum":3,"Karlsruher SC":3,"Holstein Kiel":3,"1.FC Kaiserslautern":3,"VfL Wolfsburg":3,"1.FC Heidenheim 1846":3,"FC St. Pauli":3,"SV Darmstadt 98":2,"SpVgg Greuther Fürth":2,"Fortuna Düsseldorf":2,"1.FC Magdeburg":2,"SG Dynamo Dresden":2,"Eintracht Braunschweig":2,"Arminia Bielefeld":2,"Preußen Münster":1,"Real Madrid":6,"FC Barcelona":6,"Atlético de Madrid":5,"Villarreal CF":4,"Real Sociedad":4,"Real Betis Balompié":4,"Athletic Bilbao":4,"Celta de Vigo":4,"Rayo Vallecano":4,"Sevilla FC":3,"Valencia CF":3,"RCD Espanyol Barcelona":3,"Levante UD":3,"Elche CF":3,"CA Osasuna":3,"Getafe CF":3,"Deportivo Alavés":3,"Racing Santander":2,"Deportivo de La Coruña":2,"Málaga CF":2,"UD Almería":3,"UD Las Palmas":3,"Real Valladolid CF":3,"Sporting Gijón":3,"Granada CF":3,"Girona FC":3,"RCD Mallorca":3,"Real Oviedo":3,"Real Sociedad B":2,"FC Andorra":2,"Real Zaragoza":2,"Cádiz CF":2,"CD Castellón":2,"CD Mirandés":2,"Burgos CF":2,"CD Leganés":2,"Córdoba CF":2,"SD Eibar":2,"Albacete Balompié":2,"SD Huesca":2,"AD Ceuta FC":1,"Cultural Leonesa":1,"Paris Saint-Germain":6,"AS Monaco":5,"Olympique Marseille":5,"RC Strasbourg Alsace":4,"Olympique Lyon":4,"Stade Rennais FC":4,"LOSC Lille":4,"RC Lens":4,"OGC Nice":4,"FC Toulouse":3,"Paris FC":3,"FC Lorient":3,"AJ Auxerre":3,"Stade Brestois 29":3,"Angers SCO":2,"Le Havre AC":2,"ESTAC Troyes":2,"Le Mans FC":2,"Stade Reims":3,"AS Saint-Étienne":3,"USL Dunkerque":3,"Montpellier HSC":3,"FC Nantes":3,"FC Metz":3,"Amiens SC":2,"Clermont Foot 63":2,"Pau FC":2,"Rodez AF":2,"Red Star FC":2,"EA Guingamp":2,"AS Nancy-Lorraine":2,"SC Bastia":2,"Grenoble Foot 38":2,"FC Annecy":2,"Stade Lavallois":2,"US Boulogne":1,"Inter Milan":6,"Juventus FC":5,"AS Roma":5,"AC Milan":5,"SSC Napoli":5,"Atalanta BC":5,"Como 1907":4,"Bologna FC 1909":4,"ACF Fiorentina":4,"SS Lazio":4,"US Sassuolo":3,"Udinese Calcio":3,"Parma Calcio 1913":3,"Cagliari Calcio":3,"Genoa CFC":3,"Torino FC":3,"AC Monza":3,"US Lecce":2,"Venezia FC":2,"Frosinone Calcio":2,"UC Sampdoria":3,"US Catanzaro":3,"Palermo FC":3,"Modena FC":3,"FC Empoli":3,"Spezia Calcio":3,"Pisa Sporting Club":3,"Hellas Verona":3,"US Cremonese":3,"Mantova 1911":2,"Cesena FC":2,"SS Juve Stabia":2,"Carrarese Calcio 1908":2,"SSC Bari":2,"US Avellino 1912":2,"FC Südtirol":2,"Calcio Padova":2,"AC Reggiana 1919":2,"Delfino Pescara 1936":1,"Virtus Entella":1,"PSV Eindhoven":5,"Feyenoord Rotterdam":4,"Ajax Amsterdam":4,"AZ Alkmaar":4,"FC Utrecht":4,"FC Twente Enschede":4,"NEC Nijmegen":3,"SC Heerenveen":3,"FC Groningen":3,"Sparta Rotterdam":3,"Go Ahead Eagles":3,"SC Cambuur Leeuwarden":3,"PEC Zwolle":2,"Fortuna Sittard":2,"Excelsior Rotterdam":2,"SC Telstar":2,"Willem II Tilburg":2,"ADO Den Haag":2,"Almere City FC":3,"RKC Waalwijk":3,"FC Emmen":3,"FC Volendam":3,"NAC Breda":3,"Heracles Almelo":3,"AZ Alkmaar U21":2,"PSV Eindhoven U21":2,"Ajax Amsterdam U21":2,"FC Dordrecht":2,"Roda JC Kerkrade":2,"FC Utrecht U21":2,"De Graafschap Doetinchem":2,"FC Den Bosch":2,"FC Eindhoven":2,"MVV Maastricht":2,"Helmond Sport":2,"VVV-Venlo":2,"Vitesse Arnhem":1,"TOP Oss":1};
var LL_EURO_STAR_REBALANCE={"1.FSV Mainz 05":4,"ACF Fiorentina":4,"AS Monaco":5,"AZ Alkmaar":4,"Ajax Amsterdam":4,"Arsenal":6,"Aston Villa":5,"Atalanta Bergamo":5,"Athletic Bilbao":4,"Atlético Madrid":5,"Bayer 04 Leverkusen":5,"Bologna":4,"Borussia Dortmund":5,"Celta Vigo":4,"Chelsea FC":6,"Crystal Palace":4,"Eintracht Frankfurt":4,"FC Barcelona":6,"FC Bayern Münih":6,"Fenerbahçe":5,"Feyenoord":4,"Freiburg":4,"Galatasaray SK":5,"Go Ahead Eagles":3,"Inter Milan":6,"Juventus":5,"Lille":4,"Liverpool FC":6,"Lyon":4,"Manchester City":6,"Newcastle United":5,"Nice":4,"Nottingham Forest":4,"Olympique Marsilya":5,"PSV Eindhoven":5,"Paris Saint-Germain":6,"RC Strasbourg Alsace":4,"Rayo Vallecano":4,"Real Betis":4,"Real Madrid":6,"Roma":5,"SSC Napoli":5,"Samsunspor":3,"Stuttgart":4,"Tottenham Hotspur":5,"Utrecht":4,"Villarreal CF":4,"Sporting Lizbon":5,"SL Benfica":5,"Porto":5,"FC Porto":5,"Sporting CP":5,"Club Brugge":4,"Olympiakos":4,"Union Saint-Gilloise":4,"SK Slavia Prag":4,"FK Bodø/Glimt":4,"FC Kopenhag":4,"Midtjylland":4,"Braga":4,"Genk":4,"Crvena zvezda":4,"Celtic":4,"Dinamo Zagreb":4,"Red Bull Salzburg":4,"Rangers":4,"Shakhtar Donetsk":4,"AC Sparta Prag":4,"RSC Anderlecht":4,"SC Braga":4,"Club Brugge KV":4,"Celtic FC":4,"Rangers FC":4,"Slavia Prague":4,"Red Star Belgrade":4,"Olympiacos FC":4,"FC Copenhagen":4,"Bodo/Glimt":4,"Qarabağ FK":3,"Ferencváros":3,"Viktoria Plzeň":3,"PAOK":3,"Panathinaikos":3,"Ludogorets":3,"Brann":3,"Young Boys":3,"Sturm Graz":3,"FCSB":3,"Basel":3,"Malmö":3,"Maccabi Tel Aviv":3,"Dinamo Kiev":3,"AEK":3,"Lech Poznan":3,"SK Rapid Wien":3,"CS Universitatea Craiova":3,"HNK Rijeka":3,"Slovan Bratislava":3,"Raków Częstochowa":3,"SK Sigma Olomouc":3,"Jagiellonia Bialystok":3,"Legia Varşova":3,"BK Häcken":3,"Aberdeen FC":3,"Omonia Lefkoşa":3,"AEK Larnaca":3,"NK Celje":3,"HSK Zrinjski Mostar":3,"Standard Liège":3,"Heart of Midlothian":3,"Hibernian FC":3,"Molde FK":3,"Rosenborg BK":3,"FK Partizan Belgrade":3,"Grasshopper Club Zürich":3,"Royal Antwerp FC":3,"Dynamo Kyiv":3,"FC Basel":3,"Sparta Prague":3,"Hajduk Split":3,"Panathinaikos FC":3,"AEK Athens FC":3,"Malmo FF":3,"Legia Warsaw":3,"Ludogorets Razgrad":3,"Qarabag FK":3,"Pafos FC":2,"Kairat Almaty":2,"FC Lausanne-Sport":2,"FC Noah Erivan":2,"FC Drita":2,"Shkendija Tetovo":2,"Shamrock Rovers":2,"Kuopion Palloseura":2,"Hamrun Spartans":2,"Shelbourne FC":2,"Breidablik Kópavogur":2,"Lincoln Red Imps FC":2};
var LL_STAR_REBALANCE_ALIASES={
  'Arsenal':'Arsenal FC','Bayern München':'Bayern Munich','FC Bayern Münih':'Bayern Munich',
  'Liverpool':'Liverpool FC','Inter':'Inter Milan','Chelsea':'Chelsea FC','Barcelona':'FC Barcelona',
  'Atlético Madrid':'Atlético de Madrid','Juventus':'Juventus FC','Bayer Leverkusen':'Bayer 04 Leverkusen',
  'Atalanta':'Atalanta BC','Atalanta Bergamo':'Atalanta BC','Villarreal':'Villarreal CF',
  'Benfica':'SL Benfica','Ajax':'Ajax Amsterdam','Napoli':'SSC Napoli','Olympiacos':'Olympiakos',
  'Slavia Praha':'SK Slavia Prag','Bodø/Glimt':'FK Bodø/Glimt','Bodo/Glimt':'FK Bodø/Glimt',
  'Marseille':'Olympique Marseille','Olympique Marsilya':'Olympique Marseille','Copenhagen':'FC Kopenhag',
  'Monaco':'AS Monaco','Galatasaray SK':'Galatasaray','Qarabağ':'Qarabağ FK','Qarabag FK':'Qarabağ FK',
  'Athletic Club':'Athletic Bilbao','Pafos':'Pafos FC','Lyon':'Olympique Lyon',
  'Real Betis':'Real Betis Balompié','Freiburg':'SC Freiburg','Roma':'AS Roma',
  'Bologna':'Bologna FC 1909','Stuttgart':'VfB Stuttgart','Celta Vigo':'Celta de Vigo',
  'Lille':'LOSC Lille','Feyenoord':'Feyenoord Rotterdam','Nice':'OGC Nice','Utrecht':'FC Utrecht'
};
var LL_STAR_REBALANCE_PREVIOUS_BASE=Object.create(null);

function llStarRebalanceClamp(value){return Math.max(1,Math.min(6,Math.round(Number(value)||1)));}
function llStarRebalanceCanonical(name){return LL_STAR_REBALANCE_ALIASES[name]||(typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name);}
function llStarRebalanceRating(name,definition=null){
  const canonical=llStarRebalanceCanonical(name);
  return LL_DOMESTIC_STAR_REBALANCE[name]??LL_DOMESTIC_STAR_REBALANCE[canonical]??LL_EURO_STAR_REBALANCE[name]??LL_EURO_STAR_REBALANCE[canonical]??LL_DOMESTIC_STAR_REBALANCE[definition?.name]??LL_EURO_STAR_REBALANCE[definition?.name]??null;
}
function llStarRebalanceCapture(name,stars){
  if(!name||Object.prototype.hasOwnProperty.call(LL_STAR_REBALANCE_PREVIOUS_BASE,name))return;
  const value=Number(stars);if(Number.isFinite(value))LL_STAR_REBALANCE_PREVIOUS_BASE[name]=llStarRebalanceClamp(value);
}
function llStarRebalancePot(stars){return stars>=6?1:stars===5?2:stars===4?3:4;}
function llStarRebalanceCollection(collection){
  if(!Array.isArray(collection))return;
  for(const team of collection){
    if(!team?.name)continue;llStarRebalanceCapture(team.name,team.stars);
    const rating=llStarRebalanceRating(team.name,team);if(rating===null)continue;
    team.stars=llStarRebalanceClamp(rating);if(Object.prototype.hasOwnProperty.call(team,'pot'))team.pot=llStarRebalancePot(team.stars);
  }
}
function llApplyStarRebalanceDefinitions(){
  if(typeof LL_TEAMS!=='undefined')llStarRebalanceCollection(LL_TEAMS);
  if(typeof LL_FIRST_TEAMS!=='undefined')llStarRebalanceCollection(LL_FIRST_TEAMS);
  if(typeof LL_TIER1_POOLS==='object')Object.values(LL_TIER1_POOLS).forEach(llStarRebalanceCollection);
  if(typeof LL_TIER2_POOLS==='object')Object.values(LL_TIER2_POOLS).forEach(llStarRebalanceCollection);
  if(typeof LL_ALL_DOMESTIC_TEAMS!=='undefined')llStarRebalanceCollection(LL_ALL_DOMESTIC_TEAMS);
  if(typeof LL_V14_EURO_META==='object'){
    for(const [name,team] of Object.entries(LL_V14_EURO_META)){
      llStarRebalanceCapture(name,team?.stars);const rating=llStarRebalanceRating(name,team);if(rating===null)continue;
      team.stars=llStarRebalanceClamp(rating);team.pot=llStarRebalancePot(team.stars);
    }
  }
  if(typeof UCL_TEAMS!=='undefined'){
    for(const team of UCL_TEAMS){const rating=llStarRebalanceRating(team?.name,team);if(rating!==null){team.stars=llStarRebalanceClamp(rating);team.pot=llStarRebalancePot(team.stars);}}
  }
  if(typeof LL_SUPER_STAR_MAP==='object')for(const name of Object.keys(LL_SUPER_STAR_MAP))if(LL_DOMESTIC_STAR_REBALANCE[name])LL_SUPER_STAR_MAP[name]=LL_DOMESTIC_STAR_REBALANCE[name];
  if(typeof LL_TEAM_REGISTRY==='object'){
    for(const [name,team] of Object.entries(LL_TEAM_REGISTRY)){
      if(!team)continue;llStarRebalanceCapture(name,team.stars);const rating=llStarRebalanceRating(name,team);if(rating===null)continue;
      team.stars=llStarRebalanceClamp(rating);if(Object.prototype.hasOwnProperty.call(team,'pot'))team.pot=llStarRebalancePot(team.stars);
    }
  }
}
function llStarRebalanceOldBase(name,current){
  const canonical=llStarRebalanceCanonical(name);
  return LL_STAR_REBALANCE_PREVIOUS_BASE[name]??LL_STAR_REBALANCE_PREVIOUS_BASE[canonical]??llStarRebalanceClamp(current);
}
function llStarRebalanceUpgradeCostBetween(fromStars,toStars){
  if(typeof llV2UpgradeCostBetween==='function')return llV2UpgradeCostBetween(fromStars,toStars);
  const costs={1:800,2:1400,3:2300,4:3500,5:5000};let total=0;
  for(let star=llStarRebalanceClamp(fromStars);star<llStarRebalanceClamp(toStars);star++)total+=costs[star]||0;
  return total;
}
function llStarRebalanceClone(value){try{return JSON.parse(JSON.stringify(value));}catch{return null;}}
function llStarRebalanceNormalizeInvestmentEntry(entry={}){
  const normalized=entry&&typeof entry==='object'?entry:{};
  normalized.spentLp=Math.max(0,Math.floor(Number(normalized.spentLp)||0));
  normalized.settledLp=Math.max(0,Math.min(normalized.spentLp,Math.floor(Number(normalized.settledLp)||0)));
  normalized.refundedLp=Math.max(0,Math.floor(Number(normalized.refundedLp)||0));
  if(!Array.isArray(normalized.upgrades))normalized.upgrades=[];
  if(!Array.isArray(normalized.settlements))normalized.settlements=[];
  return normalized;
}
function llApplyStarRebalanceToState(state){
  if(!state||Number(state.teamStarRebalanceVersion)>=LL_TEAM_STAR_REBALANCE_VERSION)return state;
  const ledger=state.starUpgradeInvestments?.clubs||{};
  for(const [name,team] of Object.entries(state.teams||{})){
    if(!team)continue;const newBase=llStarRebalanceRating(name,team);if(newBase===null)continue;
    const current=llStarRebalanceClamp(team.stars),oldBase=llStarRebalanceOldBase(name,current),purchasedOrRetainedLevels=Math.max(0,current-oldBase);
    team.stars=llStarRebalanceClamp(Number(newBase)+purchasedOrRetainedLevels);
    const entry=ledger[name];if(entry&&typeof entry==='object'){entry.rebalanceLegacyBaseStars=oldBase;entry.rebalanceBaseStars=llStarRebalanceClamp(newBase);entry.rebalancePreservedLevels=purchasedOrRetainedLevels;}
  }
  state.teamStarRebalanceVersion=LL_TEAM_STAR_REBALANCE_VERSION;
  state.teamStarRebalanceAppliedAt=new Date().toISOString();
  return state;
}

/* Capture old baselines first, then activate the new global scale. */
(function llInitializeTeamStarRebalance(){
  if(typeof LL_TEAMS!=='undefined')for(const team of LL_TEAMS)llStarRebalanceCapture(team?.name,team?.stars);
  if(typeof LL_FIRST_TEAMS!=='undefined')for(const team of LL_FIRST_TEAMS)llStarRebalanceCapture(team?.name,team?.stars);
  if(typeof LL_TIER1_POOLS==='object')for(const pool of Object.values(LL_TIER1_POOLS))for(const team of pool||[])llStarRebalanceCapture(team?.name,team?.stars);
  if(typeof LL_TIER2_POOLS==='object')for(const pool of Object.values(LL_TIER2_POOLS))for(const team of pool||[])llStarRebalanceCapture(team?.name,team?.stars);
  if(typeof LL_V14_EURO_META==='object')for(const [name,team] of Object.entries(LL_V14_EURO_META))llStarRebalanceCapture(name,team?.stars);
  llApplyStarRebalanceDefinitions();
})();

/* Keep the exact LP amounts actually paid before the baseline rebalance. */
if(typeof llV2EnsureStarUpgradeInvestments==='function'){
  var llStarRebalanceInvestmentBase=llV2EnsureStarUpgradeInvestments;
  llV2EnsureStarUpgradeInvestments=function(state=lexLeague?.state){
    if(!state)return llStarRebalanceInvestmentBase(state);
    const before=llStarRebalanceClone(state.starUpgradeInvestments),player=state.playerTeam,current=Number(state.teams?.[player]?.stars);
    const ledger=llStarRebalanceInvestmentBase(state);
    if(!ledger)return ledger;
    if(before?.clubs&&typeof before.clubs==='object'){
      for(const [name,entry] of Object.entries(before.clubs))ledger.clubs[name]=llStarRebalanceNormalizeInvestmentEntry(llStarRebalanceClone(entry)||{});
      if(Array.isArray(before.history))ledger.history=llStarRebalanceClone(before.history)||[];
    }
    if(player&&!before?.clubs?.[player]&&Number.isFinite(current)){
      const newBase=llStarRebalanceRating(player,state.teams?.[player]);
      const inferenceBase=Number(state.teamStarRebalanceVersion)>=LL_TEAM_STAR_REBALANCE_VERSION&&newBase!==null?newBase:llStarRebalanceOldBase(player,current);
      const inferred=llStarRebalanceUpgradeCostBetween(inferenceBase,current);
      if(inferred>0){
        const entry=llStarRebalanceNormalizeInvestmentEntry(ledger.clubs[player]||{});entry.spentLp=inferred;entry.rebalanceInferred=true;ledger.clubs[player]=entry;
      }else if(ledger.clubs[player]){
        ledger.clubs[player]=llStarRebalanceNormalizeInvestmentEntry(ledger.clubs[player]);ledger.clubs[player].spentLp=0;ledger.clubs[player].settledLp=0;
      }
    }
    return ledger;
  };
}
if(typeof llV2RepairState==='function'){
  var llStarRebalanceRepairBase=llV2RepairState;
  llV2RepairState=function(state){return llApplyStarRebalanceToState(llStarRebalanceRepairBase(state));};
}
if(typeof llTeamDef==='function'){
  var llStarRebalanceTeamDefBase=llTeamDef;
  llTeamDef=function(name){const def=llStarRebalanceTeamDefBase(name),rating=llStarRebalanceRating(name,def);return def&&rating!==null?{...def,stars:llStarRebalanceClamp(rating)}:def;};
}
if(typeof lexLeague==='object'&&lexLeague?.state)llApplyStarRebalanceToState(lexLeague.state);
