'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('outputs/competition-consistency.js','utf8');
const state={season:1,week:8,playerTeam:'A',results:[]};
const context={
  console,Math,lexLeague:{state},
  llEscape:value=>String(value??''),
  llV2CupMatchWon:()=>false,
  llV2SimFixture:()=>null,
  llV2FixtureRow:()=>'<div class="fixture"></div>',
  llRenderCompetitionCenter:()=>{},
  llRenderDashboard:()=>{},
  llPlayerFixture:()=>null,
  llCurrentRound:()=>[],
  llV2FixtureResult:()=>null,
  llRenderRoundSummary:()=>{},
  llRenderManagerMarket:()=>{},
  llRenderSeasonOpening:()=>{},
  llTransferWindowBanner:()=>'',
  llRenderShop:()=>{},
  llEligibleCards:()=>[],
  llV2RepairState:value=>value,
  llRollValue:()=>1,
  llAiTriggerProbability:()=>0,
  llV4RenewAiContracts:()=>{},
  llV2MatchImportance:()=>'',
  llV11ResolvePair:()=>null,
  llV11PairTotals:pair=>{const totals={[pair.a]:0,[pair.b]:0};(pair.legs||[]).forEach(leg=>{totals[leg.home]+=leg.homeGoals;totals[leg.away]+=leg.awayGoals;});return totals;},
  llSimulateMatch:()=>({homeGoals:1,awayGoals:1,resolution:null}),
  llRecordMatch:(home,away,hg,ag,week,userMatch,competition,league)=>state.results.push({season:1,home,away,homeGoals:hg,awayGoals:ag,week,userMatch,competition,league}),
  llApplyLocks:()=>{},
  llV12PenaltyShootout:(_state,a,b)=>({winner:a,scoreA:5,scoreB:4,kicks:[],playerTeam:a,opponentTeam:b}),
  llTeamLeague:()=> 'first',
  llArea:()=>({querySelector:()=>null}),
  globalThis:null
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context);
assert.strictEqual(vm.runInContext("llV2CupMatchWon({playerTeam:'A',results:[{competition:'cup',home:'A',away:'B',homeGoals:0,awayGoals:0,knockoutWinner:'A'}]})",context),true,'penalty cup win must count toward target');
assert.strictEqual(vm.runInContext("llV2SimFixture({home:'A',away:'B'},'cup')",context),'A','drawn computer cup match must use the stored shootout winner');
assert.strictEqual(state.results[0].penaltyShootout.scoreA,5,'computer cup shootout must persist score');
assert.strictEqual(state.results[0].knockoutWinner,'A','computer cup shootout must persist winner');
assert.strictEqual(vm.runInContext("llV11ResolvePair({a:'A',b:'B',legs:[{home:'A',away:'B',homeGoals:1,awayGoals:1},{home:'B',away:'A',homeGoals:0,awayGoals:0}]},'r16')",context),'A','level European aggregate must use shootout winner');
assert(vm.runInContext("llV2FixtureRow('A','B',{homeGoals:0,awayGoals:0,knockoutWinner:'A',penaltyShootout:{scoreA:5,scoreB:4,winner:'A'}})",context).includes('Penaltılar 5-4'),'bracket row must reveal penalty score');
console.log('competition consistency: 6 checks passed.');
