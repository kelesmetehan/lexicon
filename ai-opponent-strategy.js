'use strict';

/* AI Opponent Strategy V1 — star budgets, elite packs, card fit and card-aware rerolls. */
const LL_AI_STRATEGY_VERSION=1;
const LL_AI_NORMAL_PACK_COST=150;
const LL_AI_MIN_CARD_GAIN=3;
const LL_AI_STARTING_AP={1:300,2:450,3:650,4:1100,5:1500,6:2000};
const LL_AI_STARTING_LP={1:80,2:120,3:180,4:260,5:360,6:480};
const LL_AI_PROMOTION_LP=120;

function llAiClampStar(value){return Math.max(1,Math.min(6,Number(value)||1));}
function llAiDomesticNames(){return new Set((typeof LL_ALL_TEAMS!=='undefined'?LL_ALL_TEAMS:[]).map(team=>team.name));}
function llAiIsForeignTeam(name){return !!name&&!llAiDomesticNames().has(name);}
function llAiEnsurePerformance(team){if(!team.aiCardPerformance||typeof team.aiCardPerformance!=='object')team.aiCardPerformance={};return team.aiCardPerformance;}
function llAiEnsureHistory(team){if(!Array.isArray(team.aiTransferHistory))team.aiTransferHistory=[];if(!Array.isArray(team.aiPromotionRewardSeasons))team.aiPromotionRewardSeasons=[];team.aiEliteVouchers=Math.max(0,Number(team.aiEliteVouchers)||0);team.aiElitePaidSeason=Math.max(0,Number(team.aiElitePaidSeason)||0);}
function llAiEnsureTeamStrategy(state,name){
  const team=state?.teams?.[name];if(!team||name===state.playerTeam)return team;
  const stars=llAiClampStar(team.stars),foreign=llAiIsForeignTeam(name);llEnsureTeamContracts(team);llPrepareV7Team(team,state);llAiEnsurePerformance(team);llAiEnsureHistory(team);
  if(Number(team.aiStrategyVersion)!==LL_AI_STRATEGY_VERSION){
    const apFloor=LL_AI_STARTING_AP[stars]+(foreign?300:0),lpFloor=LL_AI_STARTING_LP[stars]+(foreign?80:0);
    team.aiAp=Math.max(Number(team.aiAp)||0,apFloor);team.aiLp=Math.max(Number(team.aiLp)||0,lpFloor);team.aiStrategyVersion=LL_AI_STRATEGY_VERSION;
  }
  if(foreign&&typeof llV4FreeCardForState==='function')LL_POSITIONS.forEach(position=>{if(!team.cards?.[position])llV4FreeCardForState(state,name,position);});
  llEnsureTeamContracts(team);return team;
}
function llAiGrantPromotionReward(state,name,season){
  const team=state?.teams?.[name];if(!team||name===state.playerTeam)return false;llAiEnsureHistory(team);const key=Math.max(1,Number(season)||Number(state.season)||1);if(team.aiPromotionRewardSeasons.includes(key))return false;team.aiPromotionRewardSeasons.push(key);team.aiEliteVouchers++;team.aiAp=(Number(team.aiAp)||0)+LL_PROMOTION_SUPPORT_AP;team.aiLp=(Number(team.aiLp)||0)+LL_AI_PROMOTION_LP;llAiRememberTransfer(team,{type:'promotion-reward',season:key,cost:0,ap:LL_PROMOTION_SUPPORT_AP,lp:LL_AI_PROMOTION_LP,eliteVoucher:1});return true;
}
function llAiEnsureStrategyState(state){
  if(!state)return state;Object.keys(state.teams||{}).forEach(name=>llAiEnsureTeamStrategy(state,name));const previous=(state.seasonHistory||[]).find(entry=>Number(entry.season)===Number(state.season)-1);(previous?.promoted||[]).forEach(name=>llAiGrantPromotionReward(state,name,previous.season));state.aiStrategyVersion=LL_AI_STRATEGY_VERSION;return state;
}

const llAiV1RepairBase=llV2RepairState;
llV2RepairState=function(state){return llAiEnsureStrategyState(llAiV1RepairBase(state));};
const llAiV1EuroCreateBase=llV4CreateEuroTeam;
llV4CreateEuroTeam=function(state,name){const team=llAiV1EuroCreateBase(state,name);llAiEnsureTeamStrategy(state,name);return team;};

function llAiOpponentStarEstimate(teamName){
  const state=lexLeague.state,league=llTeamLeague(teamName),names=league?(state?.leagues?.[league]||[]):[];
  const rivals=names.filter(name=>name!==teamName).map(name=>llAiClampStar(state?.teams?.[name]?.stars));
  if(rivals.length)return Math.max(1,Math.min(6,Math.round(rivals.reduce((sum,value)=>sum+value,0)/rivals.length)));
  return Math.max(2,Math.min(6,llAiClampStar(llTeamState(teamName)?.stars)));
}
function llAiDieValues(stars){const [min,max]=llRange(llAiClampStar(stars)),values=[];for(let value=min;value<=max;value++)values.push(value);return values;}
function llAiThreeDiceProbability(values,predicate){let hit=0,total=0;for(const a of values)for(const b of values)for(const c of values){total++;if(predicate([a,b,c]))hit++;}return total?hit/total:0;}
function llAiJointProbability(left,right,predicate){let hit=0,total=0;for(const a of left)for(const b of right){total++;if(predicate(a,b))hit++;}return total?hit/total:0;}
function llAiSumDistribution(values){const counts=new Map();for(const a of values)for(const b of values)for(const c of values){const sum=a+b+c;counts.set(sum,(counts.get(sum)||0)+1);}return {counts,total:values.length**3};}
function llAiTriggerProbability(card,teamName='',position=card?.position){
  if(!card)return 0;const team=teamName?llTeamState(teamName):null,stars=llAiClampStar(team?.stars||card.minStar||3),ownValues=llAiDieValues(stars),oppValues=llAiDieValues(llAiOpponentStarEstimate(teamName)),base=llBaseName(card),trigger=String(card.trigger||'');
  if(/her maç başında|maç başında/i.test(trigger)||['Metronom','Reflex','Kalenin Efendisi','Sarsılmaz'].includes(base))return 1;
  if(base==='Yıldız Oyuncu')return stars>=3?1:0;
  if(base==='Ev Sahibi Avantajı'||base==='Deplasman Ruhu'||base==='Deplasman Disiplini')return .5;
  if(base==='Dev Avcısı')return .38;
  if(base==='Moral Bozukluğu')return .22;
  if(base==='Hat-trick Ruhu'){const form=teamName?llHatTrickForm(teamName,card):null;return form?.played>=form?.windowSize?(form.active?1:.12):.42;}
  if(base==='Sakin Kafa')return llAiJointProbability(ownValues,oppValues,(own,opp)=>own<opp);
  if(base==='Penaltı Ustası'||base==='Çalım')return llAiJointProbability(ownValues,oppValues,(own,opp)=>own===opp);
  if(base==='Son Vuruş')return llAiJointProbability(ownValues,oppValues,(own,opp)=>own===opp+1);
  if(base==='Çift Ayak')return llAiJointProbability(ownValues,oppValues,(own,opp)=>(card.upgradeLevel||own%2===0)&&own===opp-1);
  if(base==='Panenka')return llAiThreeDiceProbability(oppValues,values=>new Set(values).size<3);
  if(base==='Üçlü Hücum')return llAiThreeDiceProbability(ownValues,values=>values[0]===values[1]&&values[1]===values[2]);
  if(base==='İkili Pres')return llAiThreeDiceProbability(ownValues,values=>{const counts=values.reduce((map,value)=>(map[value]=(map[value]||0)+1,map),{});return Object.values(counts).sort().join(',')==='1,2'&&counts[values[1]]===2;});
  if(base==='Kusursuz Hat')return llAiThreeDiceProbability(ownValues,values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[1]===sorted[0]+1&&sorted[2]===sorted[1]+1;});
  if(base==='Dengeli On Bir')return llAiThreeDiceProbability(ownValues,values=>Math.max(...values)-Math.min(...values)<=1);
  if(base==='Çift Kanat')return llAiThreeDiceProbability(ownValues,values=>values[0]===values[2]&&(card.upgradeRule==='direct-play'||values[1]!==values[0]));
  if(base==='Altın Seri')return llAiThreeDiceProbability(ownValues,values=>(card.upgradeLevel?[8,12,13]:[8,13]).includes(values.reduce((sum,value)=>sum+value,0)));
  if(base==='Bitiricilik'||base==='Kale Duvarı'){
    const threshold=llThreshold(trigger,99),distribution=llAiSumDistribution(base==='Bitiricilik'?ownValues:oppValues),hits=[...distribution.counts].reduce((sum,[value,count])=>sum+(value>=threshold?count:0),0);return hits/distribution.total;
  }
  if(base==='Alan Hakimiyeti'){
    const own=llAiSumDistribution(ownValues),opp=llAiSumDistribution(oppValues);let hits=0;for(const [a,ac] of own.counts)for(const [b,bc] of opp.counts)if(a>b)hits+=ac*bc;return hits/(own.total*opp.total);
  }
  if(base==='Takım Kimyası')return team&&LL_POSITIONS.every(pos=>pos===position||llCardContractSlotActive(team,pos))?1:.25;
  if(base==='Nadir Kimya'){const others=LL_POSITIONS.filter(pos=>pos!==position).map(pos=>llCard(team?.cards?.[pos]));return others.length===2&&others.every(item=>item&&(LL_CARD_RARITY_RANK[item.rarity]||0)>=LL_CARD_RARITY_RANK.rare)?1:.18;}
  if(base==='Boş Kadro')return team&&LL_POSITIONS.some(pos=>pos!==position&&!llCardContractSlotActive(team,pos))?1:.08;
  if(base==='Son Dakika Golü'||base==='Son Perde'||base==='Fırsatçı')return .34;
  if(base==='Şans Faktörü')return card.upgradeRule==='chance-pity'?Math.min(.5,.10+(Number(team?.chanceMisses)||0)*.10):.10;
  if(/Kendi zarın/i.test(trigger))return ownValues.filter(value=>llOwnTrigger(card,value)).length/ownValues.length;
  if(/Rakip zar/i.test(trigger))return oppValues.filter(value=>llOppTrigger(card,value)).length/oppValues.length;
  if(/toplam/i.test(trigger))return .38;
  return .32;
}
function llAiCardStat(team,cardId){const id=LL_LEGACY_CARD_REPLACEMENTS[cardId]||cardId,stat=team?.aiCardPerformance?.[id];return stat&&typeof stat==='object'?stat:null;}
function llAiCardEffectPower(card){
  const effect=String(card?.effect||''),amount=Math.max(1,llEffectAmount(card,1));let power=18;
  if(/otomatik.*(?:kazan|galibiyet)/i.test(effect))power+=92;
  if(/sanal gol|skor bonusu/i.test(effect))power+=62*amount;
  if(/x[23]|çarpan/i.test(effect))power+=54*Math.max(1,amount-1);
  if(/reroll|yeniden at|yeniden attır/i.test(effect))power+=38*amount;
  if(/bloke|berabere say/i.test(effect))power+=42;
  if(/gol elenir|gol.*sil/i.test(effect))power+=48*amount;
  if(/azalt|düşür|aktar|zarına \+|zarı \+/i.test(effect))power+=31*amount;
  if(/kart.*etkisiz/i.test(effect))power+=55*amount;
  return power;
}
function llAiSynergyBonus(teamName,card,position){
  const team=llTeamState(teamName);if(!team||!card)return 0;const base=llBaseName(card),others=LL_POSITIONS.filter(pos=>pos!==position).map(pos=>llCard(llCardContractSlotActive(team,pos)?team.cards[pos]:null)).filter(Boolean);let bonus=0;
  if(base==='Takım Kimyası'&&others.length===2)bonus+=34;
  if(base==='Nadir Kimya'&&others.length===2&&others.every(item=>(LL_CARD_RARITY_RANK[item.rarity]||0)>=LL_CARD_RARITY_RANK.rare))bonus+=32;
  const isThreshold=['Bitiricilik','Alan Hakimiyeti','Kale Duvarı'].includes(base),isDiceBoost=/aktar|zarına \+|zarı \+/i.test(card.effect||'');
  if(isThreshold&&others.some(item=>/aktar|zarına \+|zarı \+/i.test(item.effect||'')))bonus+=13;
  if(isDiceBoost&&others.some(item=>['Bitiricilik','Alan Hakimiyeti'].includes(llBaseName(item))))bonus+=11;
  if(others.length===2)bonus+=4;return bonus;
}
function llAiCardScore(card,teamName='',position=card?.position){
  if(!card)return -100000;const rarityRank=LL_CARD_RARITY_RANK[card.rarity]||1,theoretical=llAiTriggerProbability(card,teamName,position),team=teamName?llTeamState(teamName):null,stat=llAiCardStat(team,card.id),matches=Math.max(0,Number(stat?.matches)||0);
  let triggerRate=theoretical,effectRate=.72,outcomeRate=.5;
  if(matches){const prior=5;triggerRate=((Number(stat.triggers)||0)+(theoretical*prior))/(matches+prior);const triggers=Math.max(0,Number(stat.triggers)||0);effectRate=triggers?Math.min(1,(Number(stat.applications)||0)/triggers):.25;const applications=Math.max(0,Number(stat.applications)||0);outcomeRate=applications?((Number(stat.appliedWins)||0)+.35*(Number(stat.appliedDraws)||0))/applications:((Number(stat.wins)||0)+.35*(Number(stat.draws)||0))/matches;}
  const reliability=.24+.76*Math.max(.03,Math.min(1,triggerRate)),performance=matches>=3?((effectRate-.5)*22+(outcomeRate-.45)*18):0;
  return rarityRank*18+llAiCardEffectPower(card)*reliability+llAiSynergyBonus(teamName,card,position)+performance;
}
function llAiTargetPosition(teamName){
  const team=llTeamState(teamName);llEnsureTeamContracts(team);const inactive=LL_POSITIONS.filter(pos=>!llCardContractSlotActive(team,pos));if(inactive.length)return inactive.sort((a,b)=>LL_POSITIONS.indexOf(a)-LL_POSITIONS.indexOf(b))[0];
  return [...LL_POSITIONS].sort((a,b)=>llAiCardScore(llCard(team.cards[a]),teamName,a)-llAiCardScore(llCard(team.cards[b]),teamName,b))[0];
}
function llAiRememberTransfer(team,entry){llAiEnsureHistory(team);team.aiTransferHistory.push({season:Number(lexLeague.state?.season)||1,week:Number(lexLeague.state?.week)||1,...entry});team.aiTransferHistory=team.aiTransferHistory.slice(-80);}
function llAiInstallCard(teamName,position,card){
  const team=llTeamState(teamName),old=llCard(team?.cards?.[position]);if(!team||!card)return false;if(old?.id===card.id)return false;
  if(old)llReleaseCardToMarket(team,old);team.cards[position]=card.id;const family=llCardFamilyName(card);if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);llConsumeReleasedBase(team,card.id);llResetCardContract(team,position,card.id);return true;
}
function llAiShopAttempt(teamName){
  const team=llTeamState(teamName);if(!team||Number(team.aiAp)<LL_AI_NORMAL_PACK_COST)return {spent:false,upgraded:false};llAiEnsureTeamStrategy(lexLeague.state,teamName);const position=llAiTargetPosition(teamName),pool=llEligibleCards(teamName,position),offers=llPickDistinctOfferPair(pool);if(offers.length<2)return {spent:false,upgraded:false};
  team.aiAp-=LL_AI_NORMAL_PACK_COST;const current=llCardContractSlotActive(team,position)?llCard(team.cards[position]):null,best=[...offers].sort((a,b)=>llAiCardScore(b,teamName,position)-llAiCardScore(a,teamName,position))[0],oldScore=llAiCardScore(current,teamName,position),newScore=llAiCardScore(best,teamName,position);let upgraded=false;
  if(best.clubCard){llPrepareV7Team(team,lexLeague.state);if(!team.clubCards.market){team.clubCards.market=best.id;upgraded=true;}}
  else if(!current||newScore>oldScore+LL_AI_MIN_CARD_GAIN)upgraded=llAiInstallCard(teamName,position,best);
  llAiRememberTransfer(team,{type:'normal',cost:LL_AI_NORMAL_PACK_COST,position,offers:offers.map(card=>card.id),selected:upgraded?best.id:null,rejected:!upgraded});return {spent:true,upgraded,position,oldId:current?.id||null,newId:upgraded?best.id:null};
}
function llAiPremiumPool(teamName,position){return llEligibleCards(teamName,position).filter(card=>card.position===position&&['epic','legendary'].includes(card.rarity)&&Number(card.minStar||1)<=llAiClampStar(llTeamState(teamName)?.stars));}
function llAiPremiumPlan(teamName){
  const team=llTeamState(teamName),plans=LL_POSITIONS.map(position=>{const pool=llAiPremiumPool(teamName,position),families=new Set(pool.map(llCardFamilyName));if(families.size<2)return null;const best=[...pool].sort((a,b)=>llAiCardScore(b,teamName,position)-llAiCardScore(a,teamName,position))[0],current=llCardContractSlotActive(team,position)?llCard(team.cards[position]):null;return {position,pool,gain:llAiCardScore(best,teamName,position)-llAiCardScore(current,teamName,position)};}).filter(Boolean);
  return plans.sort((a,b)=>b.gain-a.gain)[0]||null;
}
function llAiOpenElitePack(teamName,source='paid'){
  const team=llTeamState(teamName),season=Number(lexLeague.state?.season)||1;if(!team)return {spent:false,upgraded:false};llAiEnsureTeamStrategy(lexLeague.state,teamName);
  if(source==='paid'&&(llAiClampStar(team.stars)<4||team.aiElitePaidSeason===season||Number(team.aiAp)<LL_PREMIUM_PACK_COST))return {spent:false,upgraded:false};
  if(source==='voucher'&&Number(team.aiEliteVouchers)<1)return {spent:false,upgraded:false};const plan=llAiPremiumPlan(teamName);if(!plan)return {spent:false,upgraded:false};const offers=llV3PickPremiumPair(plan.pool);if(offers.length<2)return {spent:false,upgraded:false};
  if(source==='paid'){team.aiAp-=LL_PREMIUM_PACK_COST;team.aiElitePaidSeason=season;}else team.aiEliteVouchers--;
  const current=llCardContractSlotActive(team,plan.position)?llCard(team.cards[plan.position]):null,best=[...offers].sort((a,b)=>llAiCardScore(b,teamName,plan.position)-llAiCardScore(a,teamName,plan.position))[0],upgraded=!current||llAiCardScore(best,teamName,plan.position)>llAiCardScore(current,teamName,plan.position)+LL_AI_MIN_CARD_GAIN?llAiInstallCard(teamName,plan.position,best):false;
  llAiRememberTransfer(team,{type:'elite',source,cost:source==='paid'?LL_PREMIUM_PACK_COST:0,position:plan.position,offers:offers.map(card=>card.id),selected:upgraded?best.id:null,rejected:!upgraded});return {spent:true,upgraded,position:plan.position,newId:upgraded?best.id:null};
}
function llAiShouldRenew(teamName,position,card){
  if(!card)return false;const score=llAiCardScore(card,teamName,position),pool=llEligibleCards(teamName,position).filter(item=>!item.clubCard),top=[...pool].sort((a,b)=>llAiCardScore(b,teamName,position)-llAiCardScore(a,teamName,position)).slice(0,5),benchmark=top.length?top.reduce((sum,item)=>sum+llAiCardScore(item,teamName,position),0)/top.length:score;
  return score>=Math.max(42,benchmark*.76);
}
function llAiRenewContractsSmart(teamName){
  const team=llTeamState(teamName);llEnsureTeamContracts(team);const due=LL_POSITIONS.map(position=>({position,card:llCard(team.cards[position]),contract:team.cardContracts[position]})).filter(item=>item.card&&item.contract&&item.contract.remaining<=10).sort((a,b)=>llAiCardScore(b.card,teamName,b.position)-llAiCardScore(a.card,teamName,a.position));
  due.forEach(item=>{const rule=llCardContractRule(item.card),keep=llAiShouldRenew(teamName,item.position,item.card);if(keep&&Number(team.aiLp)>=rule.renewLp){team.aiLp-=rule.renewLp;llResetCardContract(team,item.position,item.card.id);llAiRememberTransfer(team,{type:'renew',position:item.position,cardId:item.card.id,cost:rule.renewLp});}else if(item.contract.remaining<=0){team.cards[item.position]=null;delete team.cardContracts[item.position];llReleaseCardToMarket(team,item.card);llAiRememberTransfer(team,{type:'release',position:item.position,cardId:item.card.id,cost:0});}});
}
function llAiUpgradeCards(teamName){
  const state=lexLeague.state,team=llTeamState(teamName);if(!team)return;llEnsureTeamContracts(team);llEnsureUpgradeState(team,state);
  while(team.cardUpgradesUsed<LL_CARD_UPGRADE_LIMIT){
    const reserve=LL_POSITIONS.map(position=>({position,card:llCard(team.cards[position]),contract:team.cardContracts[position]})).filter(item=>item.card&&item.contract&&item.contract.remaining<=6&&llAiShouldRenew(teamName,item.position,item.card)).reduce((sum,item)=>sum+llCardContractRule(item.card).renewLp,0);
    const choices=LL_POSITIONS.map(position=>{const current=llCard(team.cards[position]),target=llUpgradeTarget(current?.id),cost=llUpgradeCost(current);return {position,current,target,cost,gain:target?llAiCardScore(target,teamName,position)-llAiCardScore(current,teamName,position):-Infinity};}).filter(item=>item.target&&item.cost&&item.gain>=6&&llCardContractSlotActive(team,item.position)&&Number(team.aiLp)>=item.cost+reserve).sort((a,b)=>(b.gain/b.cost)-(a.gain/a.cost));
    const choice=choices[0];if(!choice)break;team.aiLp-=choice.cost;const contract=team.cardContracts[choice.position];team.cards[choice.position]=choice.target.id;if(contract)contract.cardId=choice.target.id;team.cardUpgradesUsed++;llAiRememberTransfer(team,{type:'upgrade',position:choice.position,from:choice.current.id,to:choice.target.id,cost:choice.cost});
  }
}
function llV4RenewAiContracts(teamName){
  const team=llTeamState(teamName);if(!team||teamName===lexLeague.state?.playerTeam)return;llAiEnsureTeamStrategy(lexLeague.state,teamName);llAiRenewContractsSmart(teamName);
  while(Number(team.aiEliteVouchers)>0){const result=llAiOpenElitePack(teamName,'voucher');if(!result.spent)break;}
  llAiOpenElitePack(teamName,'paid');let attempts=0;while(Number(team.aiAp)>=LL_AI_NORMAL_PACK_COST&&attempts<16){const result=llAiShopAttempt(teamName);if(!result.spent)break;attempts++;}
  llAiRenewContractsSmart(teamName);llAiUpgradeCards(teamName);
}

function llAiCompetitionAp(teamName,competition){const team=llTeamState(teamName),reward=LL_COMP_REWARDS[competition]||LL_COMP_REWARDS.league,correct=Math.max(5,Math.min(10,4+llAiClampStar(team?.stars)));return reward.ap*correct;}
const llAiV1RecordMatchBase=llRecordMatch;
llRecordMatch=function(home,away,hg,ag,week,userMatch=false,competition='league',league=null){
  const state=lexLeague.state;[home,away].forEach(name=>{if(!state.teams?.[name])llV4CreateEuroTeam(state,name);llAiEnsureTeamStrategy(state,name);});const before={};[home,away].forEach(name=>{if(name!==state.playerTeam){const team=state.teams[name];before[name]={ap:Number(team.aiAp)||0,lp:Number(team.aiLp)||0};}});
  llAiV1RecordMatchBase(home,away,hg,ag,week,userMatch,competition,league);const reward=LL_COMP_REWARDS[competition]||LL_COMP_REWARDS.league;
  [[home,hg,ag],[away,ag,hg]].forEach(([name,gf,ga])=>{if(name===state.playerTeam||!before[name])return;const team=state.teams[name];team.aiAp=before[name].ap+llAiCompetitionAp(name,competition);team.aiLp=before[name].lp+(gf>ga?reward.win:gf===ga?reward.draw:reward.loss);team.aiLastReward={season:state.season,week,competition,ap:team.aiAp-before[name].ap,lp:team.aiLp-before[name].lp,result:gf>ga?'G':gf===ga?'B':'M'};});
};
function llAiRecordCardPerformance(teamName,dice,result,conditionIds=[],appliedIds=[]){
  const team=llTeamState(teamName);if(!team||teamName===lexLeague.state?.playerTeam)return;const stats=llAiEnsurePerformance(team),condition=new Set(conditionIds||[]),applied=new Set(appliedIds||[]),ids=[...new Set((dice||[]).map(die=>LL_LEGACY_CARD_REPLACEMENTS[die.cardId]||die.cardId).filter(id=>llCard(id)))];
  ids.forEach(id=>{const stat=stats[id]&&typeof stats[id]==='object'?stats[id]:{};['matches','wins','draws','losses','triggers','applications','appliedWins','appliedDraws','appliedLosses'].forEach(key=>stat[key]=Math.max(0,Number(stat[key])||0));stat.matches++;if(result==='win')stat.wins++;else if(result==='draw')stat.draws++;else stat.losses++;if(condition.has(id))stat.triggers++;if(applied.has(id)){stat.applications++;if(result==='win')stat.appliedWins++;else if(result==='draw')stat.appliedDraws++;else stat.appliedLosses++;}stats[id]=stat;});
}
const llAiV1ApplyLocksBase=llApplyLocks;
llApplyLocks=function(resolution,aName,bName){if(resolution){llAiRecordCardPerformance(aName,resolution.aDice,resolution.scoreA>resolution.scoreB?'win':resolution.scoreA===resolution.scoreB?'draw':'loss',resolution.conditionMetCardIds?.a,resolution.appliedCardIds?.a);llAiRecordCardPerformance(bName,resolution.bDice,resolution.scoreB>resolution.scoreA?'win':resolution.scoreB===resolution.scoreA?'draw':'loss',resolution.conditionMetCardIds?.b,resolution.appliedCardIds?.b);}return llAiV1ApplyLocksBase(resolution,aName,bName);};

const llAiV1FinalizeSeasonBase=llV2FinalizeSeason;
llV2FinalizeSeason=function(playoffWinner){
  llAiV1FinalizeSeasonBase(playoffWinner);const state=lexLeague.state,summary=state?.lastSeasonSummary;if(!summary)return;
  (summary.promoted||[]).filter(name=>name!==state.playerTeam).forEach(name=>{const team=state.teams?.[name];if(!team)return;llAiEnsureHistory(team);const season=Number(summary.season)||Number(state.season)||1;if(team.aiPromotionRewardSeasons.includes(season))return;team.aiPromotionRewardSeasons.push(season);team.aiEliteVouchers++;team.aiLp=(Number(team.aiLp)||0)+LL_AI_PROMOTION_LP;llAiRememberTransfer(team,{type:'promotion-reward',season,cost:0,ap:LL_PROMOTION_SUPPORT_AP,lp:LL_AI_PROMOTION_LP,eliteVoucher:1});});llSave();
};

function llAiSeed(text){let hash=2166136261;for(const char of String(text)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function llAiWithSeed(seed,callback){const original=Math.random;let state=(seed>>>0)||1;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);try{return callback();}finally{Math.random=original;}}
function llAiSnapshotTransient(name){const team=llTeamState(name);return team?{lockedDice:llDeep(team.lockedDice||{}),nextMatchBonuses:llDeep(team.nextMatchBonuses||{})}:null;}
function llAiRestoreTransient(name,snapshot){const team=llTeamState(name);if(team&&snapshot){team.lockedDice=snapshot.lockedDice;team.nextMatchBonuses=snapshot.nextMatchBonuses;}}
function llAiBattleOutcome(teamName,dice,opponentName,opponentDice,ctx={},seed=1){
  const ownSnapshot=llAiSnapshotTransient(teamName),oppSnapshot=llAiSnapshotTransient(opponentName);try{return llAiWithSeed(seed,()=>{const resolution=llResolveBattle(teamName,opponentName,llDeep(dice),llDeep(opponentDice),{aHome:!!ctx.aHome,competition:ctx.competition||'league'});return {for:resolution.scoreA,against:resolution.scoreB};});}finally{llAiRestoreTransient(teamName,ownSnapshot);llAiRestoreTransient(opponentName,oppSnapshot);}
}
function llAiOutcomeValue(outcome){if(outcome.for>outcome.against)return 3+(outcome.for-outcome.against)*.025;if(outcome.for===outcome.against)return 1;return (outcome.for-outcome.against)*.012;}
function llAiPossibleRerollValues(teamName,position){const team=llTeamState(teamName),values=llAiDieValues(team?.stars),card=llCard(llActiveCardId(teamName,position));return values.map(value=>llBaseName(card)==='Yıldız Oyuncu'&&team.stars>=3?Math.max(4,value):value);}
function llAiEvaluateRerollTarget(teamName,dice,opponentName,opponentDice,position,ctx,current,seed){
  const values=llAiPossibleRerollValues(teamName,position),own=llFindPosition(dice,position),opp=llFindPosition(opponentDice,position);if(!own||!opp||!values.length)return null;let total=0,wins=0,draws=0;
  values.forEach(value=>{const trial=llDeep(dice),target=llFindPosition(trial,position);target.value=value;const outcome=llAiBattleOutcome(teamName,trial,opponentName,opponentDice,ctx,seed);total+=llAiOutcomeValue(outcome);if(outcome.for>outcome.against)wins++;else if(outcome.for===outcome.against)draws++;});
  const expected=total/values.length,duelPriority=own.value<opp.value?.05:own.value===opp.value?.012:-.035;return {position,expected:expected+duelPriority,rawExpected:expected,wins:wins/values.length,draws:draws/values.length,duelState:own.value<opp.value?'kaybedilen':own.value===opp.value?'berabere':'kazanılan',current};
}
function llAutoRerollWithCredits(teamName,dice,credits={},general=0,opponentName=null,opponentDice=null,ctx={}){
  const out=llOrderDiceByPosition(llDeep(dice)),match=lexLeague.match;if((!opponentName||!opponentDice?.length)&&match?.opponent===teamName){opponentName=match.player;opponentDice=match.playerDice;ctx={aHome:!match.playerHome,eventSink:(match.aiRerollEvents=match.aiRerollEvents||[])};}
  if(!opponentName||!opponentDice?.length)return llAutoReroll(teamName,out,(Number(credits.general)||0)+Math.max(0,Number(general)||0));
  const available={Kaleci:Math.max(0,Number(credits.Kaleci)||0),'Orta Saha':Math.max(0,Number(credits['Orta Saha'])||0),general:Math.max(0,Number(credits.general)||0)+Math.max(0,Number(general)||0)},events=ctx.eventSink||[],seed=llAiSeed(`${lexLeague.state?.season}|${lexLeague.state?.week}|${teamName}|${opponentName}`),runCredit=(kind)=>{
    if(available[kind]<=0)return false;const current=llAiBattleOutcome(teamName,out,opponentName,opponentDice,ctx,seed),currentValue=llAiOutcomeValue(current);if(current.for>current.against){available[kind]=0;return false;}const positions=kind==='general'?LL_POSITIONS:[kind],options=positions.map(position=>llAiEvaluateRerollTarget(teamName,out,opponentName,opponentDice,position,ctx,current,seed)).filter(Boolean).sort((a,b)=>b.expected-a.expected),best=options[0];available[kind]--;
    if(!best||best.rawExpected<=currentValue+.005)return false;const die=llFindPosition(out,best.position),old=die.value;die.value=llRollValue(teamName,best.position);if(best.position==='Forvet'&&llBaseName(llCard(die.cardId))==='Plan B'&&die.value<old){const rolled=die.value;die.value=old;events.push(teamName+': Plan B \u2192 Forvet reroll sonucu '+rolled+' geldi ve eski '+old+' korundu; reroll hakk\u0131 harcand\u0131.');}const after=llAiBattleOutcome(teamName,out,opponentName,opponentDice,ctx,seed),reason=best.duelState==='kaybedilen'?'kaybedilen düelloda maç sonucunu geliştirme ihtimali en yüksekti':'kartlı maç sonucunda en yüksek beklenen değeri verdi';events.push(`${teamName}: Akıllı reroll → ${best.position} zarı ${old}→${die.value}; tahmini kartlı skor ${current.for}-${current.against}→${after.for}-${after.against}. Gerekçe: ${reason}.`);return true;
  };
  for(const kind of ['Kaleci','Orta Saha','general'])while(available[kind]>0){const used=runCredit(kind);if(!used&&kind==='general')break;}
  return out;
}
const llAiV1SimulateMatchBase=llSimulateMatch;
llSimulateMatch=function(home,away,competition='league'){
  let homeDice=llMakeDice(home),awayDice=llMakeDice(away),scouting=llPrepareScouting(home,away,homeDice,awayDice,{aHome:true}),homeCredits=llRerollCreditsFromDice(homeDice,scouting.disabled.a),awayCredits=llRerollCreditsFromDice(awayDice,scouting.disabled.b);
  homeDice=llAutoRerollWithCredits(home,homeDice,homeCredits,llTakeCarriedRerolls(home),away,awayDice,{aHome:true,competition});awayDice=llAutoRerollWithCredits(away,awayDice,awayCredits,llTakeCarriedRerolls(away),home,homeDice,{aHome:false,competition});scouting=llPrepareScouting(home,away,homeDice,awayDice,{aHome:true,randoms:scouting.randoms});const resolution=llResolveBattle(home,away,homeDice,awayDice,{aHome:true,competition,scouting});return {homeGoals:resolution.scoreA,awayGoals:resolution.scoreB,resolution};
};
function llAiAttachRerollEvents(resolution,events){if(!resolution||!events?.length)return;const unseen=events.filter(event=>!resolution.events?.includes(event));if(!unseen.length)return;resolution.events=[...unseen,...(resolution.events||[])];resolution.eventScores=[...unseen.map(()=>null),...(resolution.eventScores||[])];}
const llAiV1RefreshProjectionBase=llRefreshMatchProjection;
llRefreshMatchProjection=function(match){llAiV1RefreshProjectionBase(match);llAiAttachRerollEvents(match?.projectedResolution,match?.aiRerollEvents);};

if(lexLeague.state){llAiEnsureStrategyState(lexLeague.state);llSave();}
