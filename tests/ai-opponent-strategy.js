'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'outputs','lexicon-fixed.html'),'utf8');
const core=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).find(source=>source.includes('LL_BALANCED_CARD_POOL'));
if(!core)throw new Error('Main runtime not found.');
const storage=new Map(),context={console,Math,structuredClone:global.structuredClone,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:{classList:{add(){},remove(){}},insertAdjacentHTML(){}},createElement:()=>({style:{},classList:{add(){},remove(){}},setAttribute(){},appendChild(){},click(){},remove(){}})},navigator:{},location:{reload(){}},window:null,confirm:()=>true,alert(){},Audio:function(){},speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:function(){}};context.window=context;vm.createContext(context);
vm.runInContext(core.replace(/initDatabase\(\);\s*renderPreStart\(\);\s*$/,''),context,{filename:'core.js',timeout:20000});
vm.runInContext(fs.readFileSync(path.join(ROOT,'outputs','league-v2.js'),'utf8'),context,{filename:'league-v2.js',timeout:20000});
vm.runInContext(fs.readFileSync(path.join(ROOT,'outputs','ai-opponent-strategy.js'),'utf8'),context,{filename:'ai-opponent-strategy.js',timeout:20000});
vm.runInContext(`globalThis.__ai={lexLeague,llNewState,llTeamState,llV4CreateEuroTeam,llAiTriggerProbability,llAiCardScore,llCard,LL_CARD_POOL,llAiOpenElitePack,llAutoRerollWithCredits,llRecordMatch,LL_COMP_REWARDS,llRange,llV2RepairState};llSave=function(){};`,context);
const api=context.__ai;
api.lexLeague.state=api.llNewState('Ümraniyespor');
const foreign=api.llV4CreateEuroTeam(api.lexLeague.state,'Real Madrid');
assert(foreign.aiAp>=2000,'Six-star foreign giant must receive a star-sized initial AP budget.');
assert(foreign.aiLp>=480,'Six-star foreign giant must receive a star-sized LP budget.');
assert.strictEqual(Object.values(foreign.cards).filter(Boolean).length,3,'Foreign European teams must enter with three role cards.');

const lowOnly=api.LL_CARD_POOL.find(card=>card.name==='Kale Direği'&&/1 gelirse/.test(card.trigger));
const team=api.llTeamState('Sivasspor');team.stars=3;
assert.strictEqual(api.llAiTriggerProbability(lowOnly,'Sivasspor','Kaleci'),0,'A trigger outside the team die range must have zero probability.');
team.aiCardPerformance={[lowOnly.id]:{matches:10,wins:0,draws:0,losses:10,triggers:0,applications:0}};
const poorScore=api.llAiCardScore(lowOnly,'Sivasspor','Kaleci');delete team.aiCardPerformance[lowOnly.id];
assert(api.llAiCardScore(lowOnly,'Sivasspor','Kaleci')>poorScore,'Bad real card performance must reduce AI valuation.');

team.stars=4;team.aiAp=1200;team.aiElitePaidSeason=0;team.usedCardFamilies=[];team.cards={Kaleci:null,'Orta Saha':null,Forvet:null};team.cardContracts={};
const elite=api.llAiOpenElitePack('Sivasspor','paid');
assert(elite.spent,'Eligible four-star AI must open one paid elite role pack.');
assert.strictEqual(team.aiAp,300,'Elite AI pack must cost 900 AP.');
assert.strictEqual(team.aiElitePaidSeason,api.lexLeague.state.season,'Paid elite pack must be limited by season.');
assert(!api.llAiOpenElitePack('Sivasspor','paid').spent,'AI must not buy a second paid elite pack in the same season.');

const player='Ümraniyespor',ai='Batman Petrolspor';api.llTeamState(player).stars=2;api.llTeamState(ai).stars=2;api.llTeamState(player).cards={Kaleci:null,'Orta Saha':null,Forvet:null};api.llTeamState(ai).cards={Kaleci:null,'Orta Saha':null,Forvet:null};api.llTeamState(player).cardContracts={};api.llTeamState(ai).cardContracts={};
const make=(name,values)=>['Kaleci','Orta Saha','Forvet'].map((position,index)=>({uid:`${name}-${position}`,position,value:values[index],cardId:null,stars:2}));
const events=[];context.Math.random=()=>.999;const rerolled=api.llAutoRerollWithCredits(ai,make(ai,[5,2,1]),{general:1,Kaleci:0,'Orta Saha':0},0,player,make(player,[3,4,5]),{aHome:false,eventSink:events});
assert.strictEqual(rerolled.find(die=>die.position==='Orta Saha').value,5,'AI must reroll the losing die with the best match-result upside.');
assert.strictEqual(rerolled.find(die=>die.position==='Forvet').value,1,'AI must not blindly reroll the lowest but strategically hopeless die.');
assert(events.some(event=>event.includes('Orta Saha')&&event.includes('Akıllı reroll')),'AI reroll decision must be logged with role and reason.');
const skipEvents=[],winning=api.llAutoRerollWithCredits(ai,make(ai,[5,5,5]),{general:1,Kaleci:0,'Orta Saha':0},0,player,make(player,[1,1,1]),{aHome:false,eventSink:skipEvents});
assert.deepStrictEqual(Array.from(winning,d=>d.value),[5,5,5],'AI must preserve a winning carded result.');assert.strictEqual(skipEvents.length,0,'Skipped rerolls must not create a false action log.');

const rewardTeam=api.llTeamState(ai);rewardTeam.stars=3;const beforeAp=rewardTeam.aiAp,beforeLp=rewardTeam.aiLp;api.llRecordMatch(ai,player,2,1,1,true,'league','first');
assert.strictEqual(rewardTeam.aiAp-beforeAp,api.LL_COMP_REWARDS.league.ap*7,'AI AP must use competition AP and star-based preparation.');
assert.strictEqual(rewardTeam.aiLp-beforeLp,api.LL_COMP_REWARDS.league.win,'AI LP must match the competition win reward.');

const migrated=api.llNewState(player);migrated.season=2;migrated.seasonHistory=[{season:1,promoted:[ai]}];migrated.teams[ai].aiEliteVouchers=0;migrated.teams[ai].aiPromotionRewardSeasons=[];const promotionApBefore=Number(migrated.teams[ai].aiAp)||0;api.llV2RepairState(migrated);assert.strictEqual(migrated.teams[ai].aiEliteVouchers,1,'The latest promotion reward must migrate into an existing career.');assert.strictEqual(migrated.teams[ai].aiAp,promotionApBefore+300,'Promotion support AP must reach the AI balance, not only its transfer log.');api.llV2RepairState(migrated);assert.strictEqual(migrated.teams[ai].aiEliteVouchers,1,'Promotion migration must be idempotent.');assert.strictEqual(migrated.teams[ai].aiAp,promotionApBefore+300,'Promotion AP migration must be idempotent.');

console.log('AI opponent strategy tests passed: 18 assertions.');
