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

const leagueSource=fs.readFileSync(path.join(root,'league-v2.js'),'utf8');
const poolSource=fs.readFileSync(path.join(root,'europe-team-pools.js'),'utf8');
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

const counts={TUR:{ucl:2,uel:2,uecl:2},ENG:{ucl:5,uel:2,uecl:1},ESP:{ucl:5,uel:2,uecl:1},GER:{ucl:4,uel:2,uecl:1},ITA:{ucl:4,uel:2,uecl:1},FRA:{ucl:4,uel:2,uecl:1},NED:{ucl:3,uel:2,uecl:1}};
for(const [country,byType] of Object.entries(counts)){
  for(const type of ['ucl','uel','uecl']){
    const opening=expected[type],openingQualifiers=opening.filter(name=>api.llV14TeamCountry(name)===country),openingForeign=api.llV14ForeignTeams({playerCountry:country,playerTeam:'TEST',season:1,results:[]},type,openingQualifiers,new Set());
    assert.strictEqual(new Set([...openingQualifiers,...openingForeign]).size,36);
    opening.forEach(name=>assert(new Set([...openingQualifiers,...openingForeign]).has(name),`${country}/${type} ilk sezon sabit havuzu bozuldu`));

    const qualifiers=Array.from({length:byType[type]},(_,index)=>`${country}-${type}-${index}`);qualifiers.forEach(name=>{context.LL_TEAM_REGISTRY[name]={country};});
    const foreign=api.llV14ForeignTeams({playerCountry:country,playerTeam:'TEST',season:2,results:[]},type,qualifiers,new Set());
    assert.strictEqual(qualifiers.length+foreign.length,36,`${country}/${type} 36 takım değil`);
    assert(!foreign.some(name=>api.llV14TeamCountry(name)===country),`${country}/${type} sabit listede aktif ülke kulübü kaldı`);
    const draw=api.llV14ParticipantOrder(qualifiers,foreign,type==='uecl'?6:8);
    assert(draw.fixtures.every(round=>round.length===18),`${country}/${type} tur başına 18 maç yok`);
    assert(!draw.fixtures.flat().some(fixture=>api.llV14TeamCountry(fixture.home)&&api.llV14TeamCountry(fixture.home)===api.llV14TeamCountry(fixture.away)),`${country}/${type} aynı ülke eşleşmesi oluştu`);
  }
}

const multiSource=fs.readFileSync(path.join(root,'multi-league-engine.js'),'utf8');
const qualificationStart=multiSource.indexOf('const LL_ML_EURO_QUALIFICATION_VERSION');
const qualificationEnd=multiSource.indexOf('var llMLLegacyQualifications=',qualificationStart);
assert(qualificationStart>=0&&qualificationEnd>qualificationStart,'Qualification block bulunamadı');
const registry={};for(const country of Object.keys(counts))for(let position=1;position<=20;position++)registry[`${country}${position}`]={country};
const qContext={console,LL_TEAM_REGISTRY:registry,llMLCountryForTeam:name=>registry[name]?.country,llV2TeamStarsInState:()=>3};
vm.createContext(qContext);
vm.runInContext(`${multiSource.slice(qualificationStart,qualificationEnd)}\n;globalThis.Q={llMLQualificationsForCountry};`,qContext);
const practical={ENG:[5,2,1],ESP:[5,2,1],GER:[4,2,1],ITA:[4,2,1],FRA:[4,2,1],NED:[3,2,1]};
for(const [country,lengths] of Object.entries(practical)){
  const rows=Array.from({length:20},(_,index)=>({team:`${country}${index+1}`,position:index+1}));
  const passDown=qContext.Q.llMLQualificationsForCountry({season:2},country,rows,`${country}1`);
  assert.deepStrictEqual([passDown.ucl.length,passDown.uel.length,passDown.uecl.length],lengths,`${country} kontenjan sayısı yanlış`);
  const outsideCup=qContext.Q.llMLQualificationsForCountry({season:2},country,rows,`${country}10`);
  assert(outsideCup.uel.includes(`${country}10`),`${country} kupa şampiyonu Avrupa Ligi'ne gitmedi`);
}
assert.deepStrictEqual(Array.from(qContext.Q.llMLQualificationsForCountry({season:2},'ENG',Array.from({length:20},(_,i)=>({team:`ENG${i+1}`})),'ENG1').ucl),['ENG1','ENG2','ENG3','ENG4','ENG5']);
assert.deepStrictEqual(Array.from(qContext.Q.llMLQualificationsForCountry({season:2},'FRA',Array.from({length:20},(_,i)=>({team:`FRA${i+1}`})),'FRA1').ucl),['FRA1','FRA2','FRA3','FRA4']);
assert.strictEqual(qContext.Q.llMLQualificationsForCountry({season:2},'NED',Array.from({length:20},(_,i)=>({team:`NED${i+1}`})),'NED10').uecl.length,1);

console.log('European fixed pools and qualification rules: all checks passed.');
