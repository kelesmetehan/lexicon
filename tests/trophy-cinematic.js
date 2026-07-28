'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'..','trophy-cinematic.js'),'utf8');

function contextFor(state){
  const context={
    console,
    lexLeague:{state},
    LL_DOMESTIC_CUP_NAMES:{ENG:'FA Cup',TUR:'Ziraat Türkiye Kupası'},
    llEscape:value=>String(value??''),
    llSave:()=>{},
    llV2RepairState:value=>value,
    llRenderRoundSummary:()=>{},
    llRenderSeasonEnd:()=>{},
    llRenderDashboard:()=>{},
    llMLLeagueLabel:(country,tier)=>tier==='tier1'?'Premier League':'Championship',
    llMLTeamCompetition:()=>({country:'ENG',tier:'tier2'}),
    llTeamLeague:()=> 'first',
    setTimeout:()=>{},
    clearTimeout:()=>{},
    globalThis:null
  };
  context.globalThis=context;
  vm.createContext(context);
  return context;
}

{
  const state={season:2,playerTeam:'Leeds United',playerCountry:'ENG',cup:{country:'ENG',name:'FA Cup',winner:null},trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=winner=>{state.cup.winner=winner;state.trophies.push({season:2,name:'Ziraat Türkiye Kupası'});};
  ctx.llV2FinishEuropeRound=()=>{};
  ctx.llV2FinalizeSeason=()=>{};
  vm.runInContext(source,ctx);
  ctx.llV2FinishCupRound('Leeds United');
  assert.equal(state.achievementCinematics.queue.length,1);
  assert.equal(state.achievementCinematics.queue[0].name,'FA Cup');
  assert.equal(state.trophies[0].name,'FA Cup');
}

{
  const state={season:3,playerTeam:'Leeds United',playerCountry:'ENG',europe:{type:'uel',phase:'final',winner:null},trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=()=>{};
  ctx.llV2FinishEuropeRound=()=>{state.europe.phase='winner';state.europe.winner=state.playerTeam;};
  ctx.llV2FinalizeSeason=()=>{};
  vm.runInContext(source,ctx);
  ctx.llV2FinishEuropeRound('Leeds United');
  assert.equal(state.achievementCinematics.queue[0].name,'UEFA Avrupa Ligi');
}

{
  const state={season:4,playerTeam:'Leeds United',playerCountry:'ENG',trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=()=>{};
  ctx.llV2FinishEuropeRound=()=>{};
  ctx.llV2FinalizeSeason=()=>{
    state.lastSeasonSummary={
      countrySummaries:{ENG:{tier2Rows:[{team:'Leeds United'}],promoted:['Leeds United']}},
      promoted:['Leeds United']
    };
  };
  vm.runInContext(source,ctx);
  ctx.llV2FinalizeSeason(null);
  assert.deepEqual(state.achievementCinematics.queue.map(x=>x.kind),['league-title','promotion']);
  assert.equal(state.achievementCinematics.queue[1].name,'Premier League');
}

console.log('trophy-cinematic: all checks passed');
