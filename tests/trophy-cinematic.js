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
    LL_CUP_ROUNDS:['1. Tur','Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],
    LL_EURO_KNOCKOUT_LABELS:{playoff:'Eleme Turu Play-Off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',final:'Final'},
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
  const state={season:2,playerTeam:'Leeds United',playerCountry:'ENG',pendingFixture:{roundLabel:'Son 16'},cup:{country:'ENG',name:'FA Cup',winner:null,alive:true,round:2,pending:{pair:['Leeds United','Chelsea']}},trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=winner=>{state.cup.pending=null;state.cup.round=3;state.cup.alive=false;};
  ctx.llV2FinishEuropeRound=()=>{};
  ctx.llV2FinalizeSeason=()=>{};
  vm.runInContext(source,ctx);
  ctx.llV2FinishCupRound('Chelsea');
  assert.equal(state.achievementCinematics.queue[0].kind,'domestic-cup-elimination');
  assert.equal(state.achievementCinematics.queue[0].detail,'Son 16');
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
  const state={season:4,playerTeam:'Leeds United',playerCountry:'ENG',europe:{type:'ucl',phase:'league',leagueRank:null,status:'',tie:null},trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=()=>{};
  ctx.llV2FinishEuropeRound=()=>{state.europe.leagueRank=29;state.europe.phase='eliminated';state.europe.status='Lig aşamasını ilk 24 dışında tamamladı';};
  ctx.llV2FinalizeSeason=()=>{};
  vm.runInContext(source,ctx);
  ctx.llV2FinishEuropeRound('Leeds United');
  assert.equal(state.achievementCinematics.queue[0].kind,'europe-league-elimination');
  assert.equal(state.achievementCinematics.queue[0].detail,'Lig aşaması · 29. sıra');
}

{
  const state={season:5,playerTeam:'Leeds United',playerCountry:'ENG',europe:{type:'ucl',phase:'qf',tie:{stage:'qf',opponent:'Real Madrid',playerGoals:1,opponentGoals:2,penalties:null}},trophies:[]};
  const ctx=contextFor(state);
  ctx.llV2FinishCupRound=()=>{};
  ctx.llV2FinishEuropeRound=()=>{state.europe.phase='eliminated';state.europe.tie={stage:'qf',opponent:'Real Madrid',playerGoals:3,opponentGoals:4,penalties:null};state.europe.status='Çeyrek Final aşamasında elendi · Toplam 3-4';};
  ctx.llV2FinalizeSeason=()=>{};
  vm.runInContext(source,ctx);
  ctx.llV2FinishEuropeRound('Real Madrid');
  assert.equal(state.achievementCinematics.queue[0].kind,'europe-knockout-elimination');
  assert.equal(state.achievementCinematics.queue[0].detail,'Toplam 3-4');
}

{
  const state={season:6,playerTeam:'Leeds United',playerCountry:'ENG',trophies:[]};
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
