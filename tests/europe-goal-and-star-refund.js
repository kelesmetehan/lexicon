'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');
const inline=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).find(source=>source.includes('LL_BALANCED_CARD_POOL'));
if(!inline)throw new Error('Main inline runtime not found.');
const storage=new Map();
const area={innerHTML:'',querySelector(){return null;},querySelectorAll(){return [];}};
const dummyNode={style:{},hidden:false,classList:{add(){},remove(){},contains(){return false;}},setAttribute(){},getAttribute(){return null;},appendChild(){},insertAdjacentHTML(){},remove(){},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},click(){},focus(){},select(){},childNodes:[]};
const context={console,Math,Date,JSON,structuredClone:global.structuredClone,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,String(val)),removeItem:key=>storage.delete(key)},document:{getElementById:id=>id==='quiz-area'?area:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({...dummyNode,content:{querySelectorAll:()=>[]}}),body:{...dummyNode}},navigator:{},location:{reload(){}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:function(){},FileReader:function(){},Audio:function(){},speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:function(){},alert(){},confirm(){return true;}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(inline.replace(/initDatabase\(\);\s*renderPreStart\(\);\s*$/,''),context,{filename:'index-inline.js',timeout:20000});
for(const file of ['league-v2.js','manager-market.js','europe-team-pools.js','european-leagues-pools.js','ai-opponent-strategy.js','multi-league-engine.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'outputs',file),'utf8'),context,{filename:file,timeout:20000});
}
vm.runInContext(`llSave=function(){};llRenderDashboard=function(){};llRenderSeasonEnd=function(){};llShowManagerSigning=function(){};`,context);

const api=vm.runInContext(`({lexLeague,LL_TIER2_POOLS,LL_MANAGER_MARKET_VERSION,LL_ML_FOREIGN_OFFER_RULES_VERSION,llNewState,llV2RepairState,llV2CreateSeasonGoals,llV2EuropeGoalForTeam,llV2GoalStatus,llUpgradeStars,llV2StarUpgradeRefundPreview,llV2SettleStarUpgradeRefund,llChooseManagerOffer})`,context);
const starter=api.LL_TIER2_POOLS.TUR.find(team=>team.stars===1)||api.LL_TIER2_POOLS.TUR[0];
const other=api.LL_TIER2_POOLS.TUR.find(team=>team.name!==starter.name)||api.LL_TIER2_POOLS.TUR[1];
let state=api.llNewState(starter.name);api.lexLeague.state=state;

// No Europe participation means no Europe-specific objective.
state.europe=null;state.seasonGoals=null;api.llV2RepairState(state);
assert(!state.seasonGoals.items.some(goal=>goal.id==='europe_expectation'));

// A European participant receives exactly one star-scaled objective.
state.europeQualifications={ucl:[state.playerTeam,'Galatasaray'],uel:['Fenerbahçe','Beşiktaş'],uecl:['Trabzonspor','Başakşehir']};state.europe={type:'ucl',phase:'league',round:0,alive:true};state.seasonGoals=null;api.llV2RepairState(state);
let euroGoal=state.seasonGoals.items.find(goal=>goal.id==='europe_expectation');
assert(euroGoal);assert.strictEqual(euroGoal.type,'europe_win_one');assert(/Şampiyonlar Ligi/.test(euroGoal.label));
state.teams[state.playerTeam].stars=4;state.seasonGoals=null;api.llV2RepairState(state);
euroGoal=state.seasonGoals.items.find(goal=>goal.id==='europe_expectation');
assert.strictEqual(euroGoal.type,'europe_stage');assert.strictEqual(euroGoal.value,'qf');
state.europe={type:'ucl',phase:'eliminated',tie:{stage:'qf'}};
assert.strictEqual(api.llV2GoalStatus(state,euroGoal).achieved,true);

// LP investment records exact varying star costs and refunds half once on club change.
state=api.llNewState(starter.name);api.lexLeague.state=state;state.lp=10000;
api.llUpgradeStars();api.llUpgradeStars();
assert.strictEqual(state.teams[starter.name].stars,3);
assert.strictEqual(state.lp,7800); // 800 + 1400
let preview=api.llV2StarUpgradeRefundPreview(state,starter.name);
assert.strictEqual(preview.refundableSpentLp,2200);assert.strictEqual(preview.refundLp,1100);
state.seasonEnded=true;state.lastSeasonSummary={season:1,nextManagerTeam:null};state.managerMarket={version:api.LL_MANAGER_MARKET_VERSION+1,foreignOfferRulesVersion:api.LL_ML_FOREIGN_OFFER_RULES_VERSION,season:1,fromTeam:starter.name,fromStars:3,status:'pending',canStay:true,offers:[{team:other.name,kind:'safe',stars:other.stars,lastLeague:'first',lastLeagueLabel:'Lig',position:5,nextLeague:'first',nextLeagueLabel:'Lig',movement:'Liginde kaldı',targetLabel:'Hedef',europe:'Avrupa bileti yok'}],fired:false,winRate:60,primaryAchieved:true,goalsDone:4,goalsTotal:4};
api.llChooseManagerOffer(other.name);
assert.strictEqual(state.playerTeam,other.name);assert.strictEqual(state.lp,8900);assert.strictEqual(state.managerMarket.starUpgradeRefundLp,1100);
preview=api.llV2StarUpgradeRefundPreview(state,starter.name);assert.strictEqual(preview.refundLp,0);
const again=api.llV2SettleStarUpgradeRefund(state,starter.name,'Başka Takım');assert.strictEqual(again.refundLp,0);assert.strictEqual(state.lp,8900);
console.log('Europe objective and star-refund system: 16 checks passed.');
