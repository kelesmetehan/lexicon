const fs=require('fs');
const path=require('path');
const assert=require('assert');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const league=fs.readFileSync(path.join(root,'outputs','league-v2.js'),'utf8');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');

new Function(league);
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim())new Function(match[1]);
}

assert(league.includes('function llV3SeasonAchievement(state,summary=state?.lastSeasonSummary)'));
assert(league.includes("position===1")&&league.includes("summary.cupWinner===team")&&league.includes("summary.promoted.includes(team)"));
assert(league.includes('state.sealedRegularPacks++'));
assert(!league.includes('state.sealedPremiumPacks++'));
assert(!league.includes('Bir ücretsiz Elit Rol Paketi kazandın'));
assert(league.includes('Yönetim hedeflerini tamamlamak tek başına paket vermez'));
assert(league.includes("llOpenShopPack('${pos}','achievement')"));
assert(html.includes("function llOpenShopPack(pos,source='paid')"));
assert(html.includes('if(achievement)s.sealedRegularPacks--;else s.ap-=cost;'));
assert(html.includes("source:achievement?'achievement':'paid'"));
assert(html.includes("llShowPackOpening('regular',pending.offers,{cost:achievement?0:cost,source:pending.source})"));
assert(league.includes("llOpenShopPack('${pos}','achievement')"));

const blockStart=league.indexOf('const LL_PREMIUM_PACK_COST=900;');
const blockEnd=league.indexOf('function llV3PremiumPool(position)',blockStart);
assert(blockStart>=0&&blockEnd>blockStart,'Reward helper source block was not found.');
const context={
  console,Date,
  LL_POSITIONS:['Kaleci','Orta Saha','Forvet'],
  llCard:()=>({}),
};
vm.createContext(context);
vm.runInContext(league.slice(blockStart,blockEnd),context);
const api=vm.runInContext('({llV3EnsurePremiumState,llV3SeasonAchievement,llV3GrantAchievementPack,llV3AchievementRewardRecord})',context);

function baseState(){
  return {
    season:2,playerTeam:'Test FC',seasonEnded:true,trophies:[],
    sealedPremiumPacks:2,sealedRegularPacks:0,premiumPackHistory:[],regularRewardHistory:[],
    seasonGoals:{season:2,evaluated:true,results:[{id:'club_primary',achieved:true}]},
  };
}
function summary(extra={}){
  return {season:2,playerTeam:'Test FC',playerPosition:5,playerLeague:'super',cupWinner:'Other FC',promoted:[],...extra};
}

{
  const state=baseState();
  api.llV3EnsurePremiumState(state);
  assert.strictEqual(state.sealedPremiumPacks,0,'Old free elite vouchers must be retired.');
  assert.strictEqual(api.llV3GrantAchievementPack(state,summary()),false,'Completing management goals alone must not grant a pack.');
  assert.strictEqual(state.sealedRegularPacks,0);
}
for(const [label,extra,statePatch] of [
  ['league title',{playerPosition:1},{}],
  ['domestic cup',{cupWinner:'Test FC'},{}],
  ['promotion',{promoted:['Test FC']},{}],
  ['European cup',{}, {trophies:[{season:2,name:'UEFA Avrupa Ligi'}]}],
]){
  const state=Object.assign(baseState(),statePatch);
  assert.strictEqual(api.llV3GrantAchievementPack(state,summary(extra)),true,`${label} must grant the reward.`);
  assert.strictEqual(state.sealedRegularPacks,1,`${label} must grant exactly one regular pack.`);
  assert.strictEqual(api.llV3GrantAchievementPack(state,summary(extra)),false,`${label} must not grant twice in the same season.`);
  assert.strictEqual(state.sealedRegularPacks,1);
  const record=api.llV3AchievementRewardRecord(state,2);
  assert.strictEqual(record.packType,'regular');
  assert.strictEqual(record.valueAp,150);
}
{
  const state=baseState();
  assert.strictEqual(api.llV3GrantAchievementPack(state,summary({playerPosition:1,cupWinner:'Test FC',promoted:['Test FC']})),true);
  assert.strictEqual(state.sealedRegularPacks,1,'Multiple achievements in one season must still grant one pack.');
  assert.strictEqual(api.llV3AchievementRewardRecord(state,2).reasons.length,3);
}

console.log('Achievement regular-pack reward tests passed.');
