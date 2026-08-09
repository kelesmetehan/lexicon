'use strict';
const assert=require('assert');
const vm=require('vm');
const {loadRuntime,reportRunner}=require('./multi-league-test-helpers');
const {api,context}=loadRuntime();const run=reportRunner('multi-league-engine-simulation');
function fillSeason(state,country){for(const tier of ['tier1','tier2']){const rows=state.standings[country][tier],schedule=state.schedules[country][tier];for(const round of schedule)for(const f of round){const hg=(f.home.length+f.away.length+round.length)%4,ag=(f.home.charCodeAt(0)+f.away.charCodeAt(0))%3;for(const [name,gf,ga] of [[f.home,hg,ag],[f.away,ag,hg]]){const r=rows[name];r.P++;r.GF+=gf;r.GA+=ga;r.GD=r.GF-r.GA;if(gf>ga){r.W++;r.Pts+=3;}else if(gf===ga){r.D++;r.Pts++;}else r.L++;}}}}
function reset(state){state.standings={};state.schedules={};state.cups={};for(const country of api.LL_COUNTRY_CODES){state.standings[country]={};state.schedules[country]={};for(const tier of ['tier1','tier2']){state.standings[country][tier]=api.llBlankStandings(state.leagues[country][tier]);state.schedules[country][tier]=api.llGenerateSchedule(state.leagues[country][tier]);}state.cups[country]=api.llMLCreateCup(state,country);}api.llMLAttachLegacyAliases(state);}
const state=api.llNewState('Birmingham City');
for(let season=1;season<=5;season++){for(const country of api.LL_COUNTRY_CODES)fillSeason(state,country);const before=Object.fromEntries(api.LL_COUNTRY_CODES.map(c=>[c,{one:[...state.leagues[c].tier1],two:[...state.leagues[c].tier2]}])),countrySummaries={},leagueRows={};for(const country of api.LL_COUNTRY_CODES){const s=api.llMLCountrySeasonSummary(state,country);countrySummaries[country]=s;leagueRows[country]={tier1:s.tier1Rows,tier2:s.tier2Rows};assert.strictEqual(s.relegated.length,s.rules.relegateCount);assert.strictEqual(s.promoted.length,s.rules.directCount+s.rules.playoffCount);}api.llMLApplyMovements(state,{season,countrySummaries,leagueRows});for(const country of api.LL_COUNTRY_CODES){assert.strictEqual(state.leagues[country].tier1.length,before[country].one.length);assert.strictEqual(state.leagues[country].tier2.length,before[country].two.length);assert.strictEqual(new Set([...state.leagues[country].tier1,...state.leagues[country].tier2]).size,before[country].one.length+before[country].two.length);for(const other of api.LL_COUNTRY_CODES.filter(c=>c!==country))assert(!state.leagues[country].tier1.some(team=>before[other].one.includes(team)||before[other].two.includes(team)));}state.season++;reset(state);}
run.check('five parallel seasons preserve metadata-driven promotion/relegation and league sizes',()=>assert(true));
for(const country of api.LL_COUNTRY_CODES)run.check(`${country} cup bracket is valid and resolves to a domestic winner`,()=>{const cup=api.llMLCreateCup(state,country),domestic=new Set([...state.leagues[country].tier1,...state.leagues[country].tier2]);assert((cup.field.length&(cup.field.length-1))===0);let field=[...cup.field];while(field.length>1){const next=[];for(let i=0;i<field.length;i+=2)next.push(field[i]||field[i+1]);field=next;}assert(domestic.has(field[0]));});
run.check('season position thresholds scale by real team count',()=>{assert.strictEqual(api.llMLScalePosition(8,20),8);assert.strictEqual(api.llMLScalePosition(8,18),7);assert.strictEqual(api.llMLScalePosition(15,24),18);});
run.check('repair preserves a non-player club star development',()=>{
  const repaired=api.llNewState('Birmingham City');
  const rival='Aston Villa';
  assert.notStrictEqual(repaired.playerTeam,rival);
  const base=Number(repaired.teams[rival].stars);
  repaired.teams[rival].stars=Math.min(6,base+1);
  const developed=Number(repaired.teams[rival].stars);
  api.llV2RepairState(repaired);
  assert.strictEqual(Number(repaired.teams[rival].stars),developed);
});
run.check('season archive persists every country summary and table',()=>{
  const archived=api.llNewState('Birmingham City');
  archived.seasonHistory=[];
  const countrySummaries={},leagueRows={};
  for(const country of api.LL_COUNTRY_CODES){
    const summary=api.llMLCountrySeasonSummary(archived,country);
    countrySummaries[country]=summary;
    leagueRows[country]={tier1:summary.tier1Rows,tier2:summary.tier2Rows};
  }
  const active=countrySummaries.ENG;
  const summary={season:1,country:'ENG',superRows:active.tier1Rows,firstRows:active.tier2Rows,cupWinner:active.cupWinner,playoffWinner:active.playoffWinner,relegated:active.relegated,promoted:active.promoted,qualifications:active.qualifications,playerLeague:'first',playerPosition:1,countrySummaries,leagueRows};
  const entry=context.llV2ArchiveSeason(archived,summary);
  assert.deepStrictEqual(Object.keys(entry.countrySummaries).sort(),[...api.LL_COUNTRY_CODES].sort());
  assert.strictEqual(entry.leagueRows.ENG.tier1.length,archived.leagues.ENG.tier1.length);
});
run.check('Europe participants come from all previous domestic seasons without cross-cup duplicates',()=>{
  const european=api.llNewState('Birmingham City');
  european.season=2;
  const summaries={};
  for(const country of api.LL_COUNTRY_CODES)summaries[country]=api.llMLCountrySeasonSummary(european,country);
  european.lastSeasonSummary={season:1,countrySummaries:summaries};
  const participants=context.llMLResolveEuropeParticipants(european);
  const flat=['ucl','uel','uecl'].flatMap(type=>participants[type]);
  assert.strictEqual(new Set(flat).size,flat.length);
  for(const type of ['ucl','uel','uecl']){
    assert.strictEqual(participants[type].length,api.LL_COUNTRY_CODES.length*2);
    assert.strictEqual(new Set(participants[type]).size,participants[type].length);
  }
  context.llV14RebuildEuropeStandings(european,false);
  const tables=european.europeStandings;
  for(const type of ['ucl','uel','uecl']){
    const table=tables[type];
    assert.strictEqual(table.teams.length,36);
    assert.strictEqual(new Set(table.teams).size,36);
    for(const team of participants[type])assert(table.teams.includes(team),`${type} missing ${team}`);
    const clashes=table.fixtures.flat().filter(f=>api.LL_TEAM_REGISTRY[f.home]?.country&&api.LL_TEAM_REGISTRY[f.home]?.country===api.LL_TEAM_REGISTRY[f.away]?.country);
    assert.strictEqual(clashes.length,0,`${type} contains same-country league-phase match`);
  }
  const lists=['ucl','uel','uecl'].map(type=>new Set(tables[type].teams));
  assert.strictEqual([...lists[0]].filter(team=>lists[1].has(team)).length,0);
  assert.strictEqual([...lists[0]].filter(team=>lists[2].has(team)).length,0);
  assert.strictEqual([...lists[1]].filter(team=>lists[2].has(team)).length,0);
});
run.check('promotion and relegation counts are read from league metadata',()=>{
  const metadataState=api.llNewState('Birmingham City');
  const original=vm.runInContext(`({top:{...LL_LEAGUE_META.ENG.tier1},lower:{...LL_LEAGUE_META.ENG.tier2}})`,context);
  vm.runInContext(`Object.assign(LL_LEAGUE_META.ENG.tier1,{relegate:2});Object.assign(LL_LEAGUE_META.ENG.tier2,{promoteDirect:1,promotePlayoff:1,playoffFrom:2,playoffTo:4});`,context);
  try{
    const summary=api.llMLCountrySeasonSummary(metadataState,'ENG');
    assert.strictEqual(summary.relegated.length,2);
    assert.strictEqual(summary.promoted.length,2);
    assert.deepStrictEqual(Array.from(api.llMLActivePromotedTeams(summary,'ENG','TEST PLAYOFF WINNER')),[summary.tier2Rows[0].team,'TEST PLAYOFF WINNER']);
    assert.strictEqual(JSON.stringify(summary.rules),JSON.stringify({relegateCount:2,directCount:1,playoffCount:1,playoffFrom:2,playoffTo:4}));
  }finally{
    context.__restoreMeta=original;
    vm.runInContext(`LL_LEAGUE_META.ENG.tier1=__restoreMeta.top;LL_LEAGUE_META.ENG.tier2=__restoreMeta.lower;delete globalThis.__restoreMeta;`,context);
  }
});
run.check('career-loss boundary is country metadata driven',()=>{
  const expected={TUR:4,ENG:3,GER:2,ESP:4,FRA:2,ITA:3,NED:0};
  for(const [country,count] of Object.entries(expected)){
    const team=api.LL_TIER2_POOLS[country][0].name,state=api.llNewState(team);
    api.lexLeague.state=state;
    assert.strictEqual(api.llMLCareerLossPlaces(country),count);
    const total=state.leagues[country].tier2.length;
    assert.strictEqual(api.llV5IsFirstLeagueRelegated(total,total),count>0);
    if(count)assert.strictEqual(api.llV5IsFirstLeagueRelegated(total-count,total),false);
  }
});
run.check('archive resolver returns each saved country without live-state recomputation',()=>{
  const archived=api.llNewState('Birmingham City'),countrySummaries={};
  for(const country of api.LL_COUNTRY_CODES)countrySummaries[country]=api.llMLCountrySeasonSummary(archived,country);
  const entry={season:1,country:'ENG',countrySummaries};
  for(const country of api.LL_COUNTRY_CODES)assert.strictEqual(api.llMLArchiveSummary(entry,country),countrySummaries[country]);
  assert.strictEqual(api.llMLArchiveSummary(entry,'XXX'),null);
});
run.check('promoted and relegated clubs receive country-aware contextual targets',()=>{
  const targetState=api.llNewState('Birmingham City'),country='ENG',promoted=targetState.leagues.ENG.tier2[0],relegated=targetState.leagues.ENG.tier1.at(-1);
  targetState.season=2;targetState.teams[promoted].stars=3;targetState.teams[relegated].stars=3;
  const tier1Rows=targetState.leagues.ENG.tier1.map((team,index)=>({team,position:index+1})),tier2Rows=targetState.leagues.ENG.tier2.map((team,index)=>({team,position:index+1}));
  targetState.seasonHistory=[{season:1,countrySummaries:{ENG:{country:'ENG',tier1Rows,tier2Rows,promoted:[promoted],relegated:[relegated]}}}];
  targetState.leagues.ENG.tier1=targetState.leagues.ENG.tier1.filter(team=>team!==relegated).concat(promoted);
  targetState.leagues.ENG.tier2=targetState.leagues.ENG.tier2.filter(team=>team!==promoted).concat(relegated);
  api.llMLAttachLegacyAliases(targetState);
  const targets=api.llV2CreateTeamSeasonTargets(targetState).targets;
  assert.strictEqual(targets[promoted].country,'ENG');
  assert.match(targets[promoted].label,/ilk 9|ilk 10|ilk 11|ilk 12/);
  assert.match(targets[relegated].label,/doğrudan geri yüksel|yeniden yüksel/);
});
run.finish({seasons:5,countries:api.LL_COUNTRY_CODES.length});
