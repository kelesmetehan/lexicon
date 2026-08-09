'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');

function functionSource(source,name){
  const start=source.indexOf(`function ${name}(`);assert(start>=0,`${name} bulunamadı`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escaped=false;
  for(let index=brace;index<source.length;index++){
    const char=source[index];
    if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote=null;continue;}
    if(char==='"'||char==="'"||char==='`'){quote=char;continue;}
    if(char==='{')depth++;else if(char==='}'&&--depth===0)return source.slice(start,index+1);
  }
  throw new Error(`${name} gövdesi eksik`);
}

const leagueSource=fs.readFileSync(path.join(root,'outputs','league-v2.js'),'utf8');
const poolSource=fs.readFileSync(path.join(root,'outputs','europe-team-pools.js'),'utf8');
const buildFixtures=functionSource(leagueSource,'llV3BuildEuropeFixtures');
const context={
  console,LL_EURO_LOGO_IDS:{},llTeamDef:name=>({name}),LL_ALL_TEAMS:[],LL_ALL_DOMESTIC_TEAMS:[],LL_TEAM_REGISTRY:{},LL_POSITIONS:[],
  LL_EURO_LEAGUE_WEEKS:{ucl:Array(8),uel:Array(8),uecl:Array(6)},LL_EURO_FORMAT_VERSION:3,lexLeague:{state:null},llV2EuroLabel:type=>type,
  llBlankStandings:()=>({}),llDeep:value=>JSON.parse(JSON.stringify(value)),llV2ApplyEuropeStanding:()=>{},llV2SimpleEuropeScore:()=>({homeGoals:0,awayGoals:0}),
  llV4EnsureEuropeTeams:()=>{},llV2CreateEuropeStandings:()=>{},llV2EnsureEuropeStandings:state=>state.europeStandings,llV2RepairState:state=>state
};
vm.createContext(context);
vm.runInContext(`${buildFixtures}\n${poolSource}\n;globalThis.API={LL_V14_EURO_POOLS,LL_V14_EURO_META,llV14EuroPool,llV14TeamCountry,llV14ForeignTeams,llV14ParticipantOrder};`,context);
const api=context.API;
Object.entries(api.LL_V14_EURO_META).forEach(([name,team])=>{context.LL_TEAM_REGISTRY[name]={country:team.country};});

const expected={
  ucl:['Manchester City','Real Madrid','Paris Saint-Germain','Arsenal','Chelsea FC','FC Barcelona','FC Bayern Münih','Liverpool FC','Tottenham Hotspur','Inter Milan','Atlético Madrid','Newcastle United','Juventus','Bayer 04 Leverkusen','SSC Napoli','Borussia Dortmund','Sporting Lizbon','Atalanta Bergamo','SL Benfica','AS Monaco','Eintracht Frankfurt','Villarreal CF','Galatasaray SK','PSV Eindhoven','Athletic Bilbao','Olympique Marsilya','Ajax Amsterdam','Club Brugge','Olympiakos','Union Saint-Gilloise','SK Slavia Prag','FK Bodø/Glimt','FC Kopenhag','Pafos FC','Qarabağ FK','Kairat Almaty'],
  uel:['Lyon','Aston Villa','Midtjylland','Real Betis','Porto','Braga','Freiburg','Roma','Genk','Bologna','Stuttgart','Ferencváros','Nottingham Forest','Viktoria Plzeň','Crvena zvezda','Celta Vigo','PAOK','Lille','Fenerbahçe','Panathinaikos','Celtic','Ludogorets','Dinamo Zagreb','Brann','Young Boys','Sturm Graz','FCSB','Go Ahead Eagles','Feyenoord','Basel','Red Bull Salzburg','Rangers','Nice','Utrecht','Malmö','Maccabi Tel Aviv'],
  uecl:['Crystal Palace','RC Strasbourg Alsace','ACF Fiorentina','Shakhtar Donetsk','AZ Alkmaar','1.FSV Mainz 05','Dinamo Kiev','AC Sparta Prag','Rayo Vallecano','AEK','Lech Poznan','Samsunspor','SK Rapid Wien','CS Universitatea Craiova','HNK Rijeka','Slovan Bratislava','Raków Częstochowa','SK Sigma Olomouc','Jagiellonia Bialystok','FC Lausanne-Sport','Legia Varşova','BK Häcken','Aberdeen FC','Omonia Lefkoşa','AEK Larnaca','NK Celje','FC Noah Erivan','FC Drita','HSK Zrinjski Mostar','Shkendija Tetovo','Shamrock Rovers','Kuopion Palloseura','Hamrun Spartans','Shelbourne FC','Breidablik Kópavogur','Lincoln Red Imps FC']
};
for(const type of ['ucl','uel','uecl'])assert.deepStrictEqual(Array.from(api.llV14EuroPool(type)),expected[type],`${type} sabit listesi değişti`);

const dynamicCountries=['TUR','ENG','GER','ESP','FRA','ITA','NED'];
for(const type of ['ucl','uel','uecl']){
  const qualifiers=[];
  dynamicCountries.forEach(country=>{for(let index=0;index<2;index++){const name=`${country}-${type}-${index}`;qualifiers.push(name);context.LL_TEAM_REGISTRY[name]={country};}});
  const foreign=api.llV14ForeignTeams({playerCountry:'TUR',playerTeam:'TEST',season:2,results:[]},type,qualifiers,new Set());
  assert.strictEqual(qualifiers.length+foreign.length,36,`${type} 36 tak?m de?il`);
  assert(!foreign.some(name=>dynamicCountries.includes(api.llV14TeamCountry(name))),`${type} sabit havuzda oynanabilir lig kul?b? kald?`);
  const draw=api.llV14ParticipantOrder(qualifiers,foreign,type==='uecl'?6:8);
  assert(draw.fixtures.every(round=>round.length===18),`${type} tur ba??na 18 ma? yok`);
}

const multiSource=fs.readFileSync(path.join(root,'outputs','multi-league-engine.js'),'utf8');
assert(multiSource.includes('function llMLSeedEuropeQualifications(state,country)'),'First-season country qualification seed is missing.');
assert(multiSource.includes("initial seeded domestic qualification"),'Initial domestic qualification source is missing.');
assert(multiSource.includes('for(const country of LL_COUNTRY_CODES)'),'All playable countries must contribute domestic qualifiers.');
console.log('European fixed pools and domestic qualification: all checks passed.');
