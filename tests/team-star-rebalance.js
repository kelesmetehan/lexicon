'use strict';

const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'team-star-rebalance.js'),'utf8');

function extractLiteral(text,marker){
  const start=text.indexOf(marker);
  assert.ok(start>=0,`Missing marker: ${marker}`);
  let cursor=start+marker.length;
  while(/\s/.test(text[cursor]))cursor++;
  const opener=text[cursor];
  const closer=opener==='['?']':opener==='{'?'}':null;
  assert.ok(closer,`Unsupported literal after ${marker}`);
  let depth=0,quote=null,escaped=false;
  for(let index=cursor;index<text.length;index++){
    const char=text[index];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(char==='\\'){escaped=true;continue;}
      if(char===quote)quote=null;
      continue;
    }
    if(char==='"'||char==="'"||char==='`'){quote=char;continue;}
    if(char===opener)depth++;
    else if(char===closer){
      depth--;
      if(depth===0)return text.slice(cursor,index+1);
    }
  }
  throw new Error(`Unclosed literal after ${marker}`);
}

function evaluateLiteral(text,marker){
  return vm.runInNewContext(`(${extractLiteral(text,marker)})`,Object.create(null));
}

function parseEuroMeta(text){
  const cutoff=text.indexOf('Object.values(LL_V14_EURO_META)');
  assert.ok(cutoff>0,'Missing European metadata cutoff');
  const sandbox={};
  vm.createContext(sandbox);
  vm.runInContext(`${text.slice(0,cutoff)}\nglobalThis.__euroMeta=LL_V14_EURO_META;`,sandbox);
  return sandbox.__euroMeta;
}

const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const leagueSource=fs.readFileSync(path.join(root,'league-v2.js'),'utf8');
const leaguePoolsSource=fs.readFileSync(path.join(root,'european-leagues-pools.js'),'utf8');
const euroPoolsSource=fs.readFileSync(path.join(root,'europe-team-pools.js'),'utf8');

const tier1=evaluateLiteral(leaguePoolsSource,'const LL_TIER1_POOLS=');
const tier2=evaluateLiteral(leaguePoolsSource,'const LL_TIER2_POOLS=');
const tur1=evaluateLiteral(indexSource,'const LL_TEAMS =');
const tur2=evaluateLiteral(leagueSource,'const LL_FIRST_TEAMS=');
const superMap=evaluateLiteral(leagueSource,'const LL_SUPER_STAR_MAP=');
tur1.forEach(team=>{team.stars=superMap[team.name]||team.stars||2;});
tier1.TUR=tur1.map(team=>({...team,country:'TUR',tier:'domestic-tier1'}));
tier2.TUR=tur2.map(team=>({...team,country:'TUR',tier:'domestic-tier2'}));
const allDomestic=Object.keys(tier1).flatMap(country=>[...tier1[country],...tier2[country]]);
const euroMeta=parseEuroMeta(euroPoolsSource);
const registry=Object.create(null);
for(const team of allDomestic)registry[team.name]=team;
for(const [name,team] of Object.entries(euroMeta))if(!registry[name])registry[name]=team;

let context;
function upgradeCostBetween(fromStars,toStars){
  const costs={1:800,2:1400,3:2300,4:3500,5:5000};
  let total=0;
  for(let star=Math.max(1,Number(fromStars)||1);star<Math.min(6,Number(toStars)||1);star++)total+=costs[star]||0;
  return total;
}
function baseEnsureInvestments(state){
  if(!state.starUpgradeInvestments||typeof state.starUpgradeInvestments!=='object')state.starUpgradeInvestments={version:1,clubs:{},history:[]};
  const ledger=state.starUpgradeInvestments;
  if(!ledger.clubs||typeof ledger.clubs!=='object')ledger.clubs={};
  if(!Array.isArray(ledger.history))ledger.history=[];
  const teamName=state.playerTeam,currentStars=Number(state.teams?.[teamName]?.stars),baseStars=Number(context.LL_TEAM_REGISTRY?.[teamName]?.stars);
  if(teamName&&Number.isFinite(currentStars)&&Number.isFinite(baseStars)){
    const entry=ledger.clubs[teamName]||{spentLp:0,settledLp:0,refundedLp:0,upgrades:[],settlements:[]};
    entry.spentLp=Math.max(Number(entry.spentLp)||0,upgradeCostBetween(baseStars,currentStars));
    entry.settledLp=Math.max(0,Math.min(entry.spentLp,Number(entry.settledLp)||0));
    entry.refundedLp=Math.max(0,Number(entry.refundedLp)||0);
    if(!Array.isArray(entry.upgrades))entry.upgrades=[];
    if(!Array.isArray(entry.settlements))entry.settlements=[];
    ledger.clubs[teamName]=entry;
  }
  return ledger;
}

context={
  console,Date,
  LL_TEAMS:tur1,
  LL_FIRST_TEAMS:tur2,
  LL_TIER1_POOLS:tier1,
  LL_TIER2_POOLS:tier2,
  LL_ALL_DOMESTIC_TEAMS:allDomestic,
  LL_V14_EURO_META:euroMeta,
  LL_SUPER_STAR_MAP:superMap,
  LL_TEAM_REGISTRY:registry,
  UCL_TEAMS:[],
  llCanonicalTeamName:name=>name,
  llV2UpgradeCostBetween:upgradeCostBetween,
  llV2EnsureStarUpgradeInvestments:baseEnsureInvestments,
  llTeamDef:name=>registry[name]||null,
  lexLeague:{state:null}
};
context.llV2RepairState=state=>{context.llV2EnsureStarUpgradeInvestments(state);return state;};
vm.createContext(context);
vm.runInContext(source,context);

assert.equal(Object.keys(context.LL_DOMESTIC_STAR_REBALANCE).length,274);
assert.equal(Object.keys(context.LL_EURO_STAR_REBALANCE).length,138);
assert.equal(allDomestic.length,274);
assert.equal(Object.keys(euroMeta).length,138);
for(const team of allDomestic){
  assert.equal(team.stars,context.LL_DOMESTIC_STAR_REBALANCE[team.name],`domestic ${team.name}`);
}
for(const [name,team] of Object.entries(euroMeta)){
  const expected=context.LL_EURO_STAR_REBALANCE[name];
  assert.equal(team.stars,expected,`euro ${name}`);
}
for(const pool of Object.values(tier2))for(const team of pool)assert.ok(team.stars<=3,`${team.name} lower-tier cap`);
assert.equal(context.LL_DOMESTIC_STAR_REBALANCE['Coventry City'],2);
assert.equal(context.LL_DOMESTIC_STAR_REBALANCE['Ipswich Town'],3);
assert.equal(context.LL_DOMESTIC_STAR_REBALANCE['AFC Bournemouth'],4);
assert.equal(context.LL_DOMESTIC_STAR_REBALANCE['Manchester United'],5);
assert.equal(context.LL_DOMESTIC_STAR_REBALANCE['AZ Alkmaar U21'],2);

/* Existing paid upgrade: new base changes, purchased +1 level and actual LP remain intact. */
{
  const state={
    playerTeam:'Ipswich Town',
    teams:{'Ipswich Town':{name:'Ipswich Town',stars:5}},
    starUpgradeInvestments:{version:1,clubs:{'Ipswich Town':{spentLp:3500,settledLp:0,refundedLp:0,upgrades:[{fromStars:4,toStars:5,costLp:3500}],settlements:[]}},history:[]}
  };
  context.llV2RepairState(state);
  assert.equal(state.teams['Ipswich Town'].stars,4,'paid level preserved relative to new base');
  assert.equal(state.starUpgradeInvestments.clubs['Ipswich Town'].spentLp,3500,'actual paid LP preserved');
  assert.equal(state.teamStarRebalanceVersion,1);
}

/* Legacy paid upgrade without a ledger is inferred from the pre-rebalance base. */
{
  const state={playerTeam:'Ipswich Town',teams:{'Ipswich Town':{name:'Ipswich Town',stars:5}}};
  context.llV2RepairState(state);
  assert.equal(state.teams['Ipswich Town'].stars,4,'legacy paid level preserved');
  assert.equal(state.starUpgradeInvestments.clubs['Ipswich Town'].spentLp,3500,'legacy LP inferred from old 4→5 upgrade');
}

/* Baseline-only clubs must not receive a fake LP investment after their rating drops. */
for(const [teamName,currentStars,expectedStars] of [
  ['Coventry City',3,2],
  ['Southampton FC',4,3]
]){
  const state={playerTeam:teamName,teams:{[teamName]:{name:teamName,stars:currentStars}}};
  context.llV2RepairState(state);
  assert.equal(state.teams[teamName].stars,expectedStars,`${teamName} baseline migration`);
  assert.equal(state.starUpgradeInvestments.clubs[teamName]?.spentLp||0,0,`${teamName} no false investment`);
}

/* Non-domestic European opponents migrate to the synchronized rating too. */
{
  const state={playerTeam:'Galatasaray',teams:{Galatasaray:{name:'Galatasaray',stars:5},'Pafos FC':{name:'Pafos FC',stars:3}}};
  context.llV2RepairState(state);
  assert.equal(state.teams['Pafos FC'].stars,2,'European opponent rebalance');
}

console.log('team-star-rebalance: all checks passed');
