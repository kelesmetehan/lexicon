'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'..','team-star-decline.js'),'utf8');

function contextFor(state){
  const context={
    console,Proxy,Reflect,Date,Math,JSON,Object,Array,Number,String,Set,Map,
    LL_POSITIONS:['Kaleci','Orta Saha','Forvet'],
    LL_POSITION_ICONS:{Kaleci:'K','Orta Saha':'O',Forvet:'F'},
    LL_DIE_PROGRESSION_COSTS:{1:275,2:475,3:735,4:1175,5:1675},
    lexLeague:{state},
    llTeamState:name=>state.teams[name],
    llRangeText:star=>({1:'1-4',2:'1-5',3:'2-6',4:'3-6',5:'3-6',6:'4-6'}[star]),
    llEscape:value=>String(value),
    llDieProgressionCost:team=>({1:275,2:475,3:735,4:1175,5:1675}[team.stars]||0),
    llV2RepairState:s=>s,
    llV2FinalizeSeason:()=>{},
    llRenderSeasonEnd:()=>{},llRenderManagerMarket:()=>{},llRenderDashboard:()=>{},
    llSave:()=>{},
    globalThis:null
  };
  context.globalThis=context;
  vm.createContext(context);vm.runInContext(source,context);
  return context;
}
function team(stars,history=[],upgraded={}){
  return {stars,dieProgression:{baseStar:stars,upgraded:{Kaleci:false,'Orta Saha':false,Forvet:false,...upgraded},history}};
}
function row(name,position){return {team:name,position};}
function summary(season,tier1Rows,tier2Rows,extra={}){
  return {season,country:'TUR',countrySummaries:{TUR:{tier1Rows,tier2Rows,relegated:[],promoted:[],cupWinner:null,rules:{playoffTo:7}}},...extra};
}

// Threshold percentages must match the specified 18/20-team examples.
{
  const state={teams:{},season:1,playerTeam:'X',seasonHistory:[]};const c=contextFor(state);
  assert.equal(c.llStarDeclineThreshold(6,18),9);assert.equal(c.llStarDeclineThreshold(6,20),10);
  assert.equal(c.llStarDeclineThreshold(5,18),11);assert.equal(c.llStarDeclineThreshold(5,20),12);
  assert.equal(c.llStarDeclineThreshold(4,18),13);assert.equal(c.llStarDeclineThreshold(4,20),14);
  assert.equal(c.llStarDeclineThreshold(3,18),15);assert.equal(c.llStarDeclineThreshold(3,20),16);
}

// One poor season is only a warning; the second consecutive poor season drops one star.
{
  const state={season:1,playerTeam:'Other',lp:0,teams:{Elite:team(6),Other:team(1)},seasonHistory:[]};const c=contextFor(state);
  let rows=Array.from({length:18},(_,i)=>row(i===8?'Elite':'T'+i,i+1));
  let s1=summary(1,rows,[]);c.llApplyTeamStarDeclines(state,s1);
  assert.equal(state.teams.Elite.stars,6);assert.equal(state.teamStarDecline.clubs.Elite.badCount,1);
  state.season=2;state.seasonHistory.push({season:1,countrySummaries:{TUR:{promoted:[]}}});
  let s2=summary(2,rows,[]);const drops=c.llApplyTeamStarDeclines(state,s2);
  assert.equal(state.teams.Elite.stars,5);assert.equal(drops.length,1);assert.equal(state.teamStarDecline.clubs.Elite.badCount,0);
}

// Domestic cup win resets the counter even with another bad league finish.
{
  const state={season:2,playerTeam:'Other',lp:0,teams:{CupClub:team(5),Other:team(1)},seasonHistory:[],teamStarDecline:{clubs:{CupClub:{badCount:1,mode:'upper-underperformance',lastSeason:1,history:[]}},history:[],seasons:{}}};
  const c=contextFor(state),rows=Array.from({length:18},(_,i)=>row(i===10?'CupClub':'T'+i,i+1));
  const s=summary(2,rows,[]);s.countrySummaries.TUR.cupWinner='CupClub';
  c.llApplyTeamStarDeclines(state,s);assert.equal(state.teams.CupClub.stars,5);assert.equal(state.teamStarDecline.clubs.CupClub.badCount,0);
}

// Newly promoted club's first top-flight season is exempt from the long-term counter.
{
  const state={season:2,playerTeam:'Other',lp:0,teams:{NewClub:team(4),Other:team(1)},seasonHistory:[{season:1,countrySummaries:{TUR:{promoted:['NewClub']}}}]};
  const c=contextFor(state),rows=Array.from({length:18},(_,i)=>row(i===12?'NewClub':'T'+i,i+1));
  c.llApplyTeamStarDeclines(state,summary(2,rows,[]));assert.equal(state.teams.NewClub.stars,4);assert.equal(state.teamStarDecline.clubs.NewClub.badCount,0);
}

// Direct relegation always drops one star, even if the club wins the cup; never below 1.
{
  const state={season:1,playerTeam:'Other',lp:0,teams:{Drop:team(4),Floor:team(1),Other:team(1)},seasonHistory:[]};const c=contextFor(state);
  const rows=[...Array.from({length:16},(_,i)=>row('T'+i,i+1)),row('Drop',17),row('Floor',18)];
  const s=summary(1,rows,[]);s.countrySummaries.TUR.relegated=['Drop','Floor'];s.countrySummaries.TUR.cupWinner='Drop';
  const drops=c.llApplyTeamStarDeclines(state,s);assert.equal(state.teams.Drop.stars,3);assert.equal(state.teams.Floor.stars,1);assert.equal(drops.length,1);
}

// 3+ star second-tier club drops after two consecutive seasons outside the play-off line.
{
  const state={season:2,playerTeam:'Other',lp:0,teams:{Lower:team(3),Other:team(1)},seasonHistory:[],teamStarDecline:{clubs:{Lower:{badCount:1,mode:'second-tier-outside-playoff',lastSeason:1,history:[]}},history:[],seasons:{}}};
  const c=contextFor(state),lower=Array.from({length:20},(_,i)=>row(i===7?'Lower':'L'+i,i+1));
  c.llApplyTeamStarDeclines(state,summary(2,[],lower));assert.equal(state.teams.Lower.stars,2);
}

// Player decline rolls back the paid completion die, refunds 50%, and preserves other/partial die levels.
{
  const history=[
    {type:'die-upgrade',position:'Kaleci',fromStar:3,toStar:4,costLp:735},
    {type:'die-upgrade',position:'Orta Saha',fromStar:3,toStar:4,costLp:735},
    {type:'die-upgrade',position:'Forvet',fromStar:3,toStar:4,costLp:735},
    {type:'team-star-complete',fromStar:3,toStar:4},
    {type:'die-upgrade',position:'Kaleci',fromStar:4,toStar:5,costLp:1175}
  ];
  const state={season:1,playerTeam:'Player',lp:100,teams:{Player:team(4,history,{Kaleci:true})},seasonHistory:[]};const c=contextFor(state);
  c.llEnsureAbsoluteDieProgression(state.teams.Player);
  const rows=[...Array.from({length:17},(_,i)=>row('T'+i,i+1)),row('Player',18)];
  const s=summary(1,rows,[]);s.countrySummaries.TUR.relegated=['Player'];const drops=c.llApplyTeamStarDeclines(state,s);
  assert.equal(state.teams.Player.stars,3);assert.equal(state.lp,467);assert.equal(drops[0].rolledBackPosition,'Forvet');assert.equal(drops[0].refundLp,367);
  assert.equal(c.llDieProgressionStar(state.teams.Player,'Forvet'),3);
  assert.equal(c.llDieProgressionStar(state.teams.Player,'Orta Saha'),4);
  assert.equal(c.llDieProgressionStar(state.teams.Player,'Kaleci'),5);
}

// AI decline forces all three dice to the new star range and processing is idempotent.
{
  const state={season:1,playerTeam:'Player',lp:0,teams:{AI:team(4,[],{Kaleci:true}),Player:team(1)},seasonHistory:[]};const c=contextFor(state);
  const rows=[...Array.from({length:17},(_,i)=>row('T'+i,i+1)),row('AI',18)];const s=summary(1,rows,[]);s.countrySummaries.TUR.relegated=['AI'];
  c.llApplyTeamStarDeclines(state,s);const once=state.teamStarDecline.history.length;c.llApplyTeamStarDeclines(state,s);
  assert.equal(state.teams.AI.stars,3);assert.deepEqual(c.LL_POSITIONS.map(p=>c.llDieProgressionStar(state.teams.AI,p)),[3,3,3]);assert.equal(state.teamStarDecline.history.length,once);
}


// Existing three-die purchase logic continues to work through the compatibility Proxy.
{
  const state={season:1,week:1,playerTeam:'Player',lp:5000,teams:{Player:team(3)},seasonHistory:[]};
  const c=contextFor(state);
  c.llUpgradePositionDie=function(position){
    const t=state.teams.Player,p=c.llDieProgressionEnsureTeam(t),from=t.stars,cost=c.llDieProgressionCost(t);
    state.lp-=cost;p.upgraded[position]=true;
    const completed=c.LL_POSITIONS.every(pos=>p.upgraded[pos]);
    if(completed){t.stars=from+1;p.baseStar=t.stars;c.LL_POSITIONS.forEach(pos=>p.upgraded[pos]=false);}
    return completed;
  };
  assert.equal(c.llUpgradePositionDie('Kaleci'),false);
  assert.equal(c.llUpgradePositionDie('Orta Saha'),false);
  assert.equal(c.llUpgradePositionDie('Forvet'),true);
  assert.equal(state.teams.Player.stars,4);
  assert.deepEqual(c.LL_POSITIONS.map(p=>c.llDieProgressionStar(state.teams.Player,p)),[4,4,4]);
}

console.log('team-star-decline: all tests passed');
