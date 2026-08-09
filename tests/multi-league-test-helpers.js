'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {performance}=require('perf_hooks');
const ROOT=path.resolve(__dirname,'..');
const OUTPUTS=path.join(ROOT,'outputs');
function fakeNode(){return {innerHTML:'',textContent:'',style:{},dataset:{},children:[],classList:{add(){},remove(){},contains(){return false;}},setAttribute(){},removeAttribute(){},appendChild(){},prepend(){},remove(){},click(){},insertAdjacentHTML(){},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};}
function loadRuntime(options={}){
  const html=fs.readFileSync(path.join(OUTPUTS,'lexicon-fixed.html'),'utf8');
  const core=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).find(source=>source.includes('LL_BALANCED_CARD_POOL'));
  if(!core)throw new Error('Main inline runtime not found.');
  const storage=new Map(),area=fakeNode();
  const context={console,Math,Date,Set,Map,WeakMap,structuredClone:global.structuredClone,performance,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:fn=>{if(typeof fn==='function')fn();return 0;},cancelAnimationFrame(){},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key),key:index=>[...storage.keys()][index]||null,get length(){return storage.size;}},document:{head:fakeNode(),documentElement:fakeNode(),getElementById:id=>id==='flashcard-area'?area:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:{classList:{add(){},remove(){}},insertAdjacentHTML(){},appendChild(){}},createElement:()=>fakeNode()},navigator:{},location:{href:'http://localhost/',reload(){}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:function(){},FileReader:function(){},Audio:function(){},speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:function(){},alert(){},confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}})};
  context.window=context;context.globalThis=context;context.addEventListener=function(){};context.removeEventListener=function(){};vm.createContext(context);
  vm.runInContext(core.replace(/initDatabase\(\);\s*renderPreStart\(\);\s*$/,''),context,{filename:'lexicon-fixed.inline.js',timeout:30000});
  const scripts=['league-v2.js','save-backup-hardening.js','manager-market.js','europe-knockout-center.js','europe-knockout-tiebreak.js','europe-team-pools.js','european-leagues-pools.js','last-champions.js','penalty-shootout-animation.js','ai-opponent-strategy.js','multi-league-engine.js'];
  for(const file of scripts)vm.runInContext(fs.readFileSync(path.join(OUTPUTS,file),'utf8'),context,{filename:file,timeout:30000});
  if(options.noRender!==false)vm.runInContext(`llSave=function(){};llRenderDashboard=function(){};llRenderSeasonEnd=function(){};llRenderManagerMarket=function(){};llRenderStarterShop=function(){};llRenderRoundSummary=function(){};`,context);
  vm.runInContext(`globalThis.__ml={LL_COUNTRY_CODES,LL_COUNTRY_META,LL_LEAGUE_META,LL_TIER1_POOLS,LL_TIER2_POOLS,LL_ALL_DOMESTIC_TEAMS,LL_TEAM_REGISTRY,LL_DOMESTIC_CUP_NAMES,LL_MULTI_MANAGER_OFFER_COUNT,LL_MANAGER_MARKET_VERSION,lexLeague,llNewState,llV2RepairState,llMLNormalizeState,llMLAttachLegacyAliases,llMLCreateCup,llMLNextPowerOfTwo,llMLScalePosition,llMLTeamCompetition,llMLSimulateBackgroundWeek,llMLFinishCountryLeagues,llMLCountrySeasonSummary,llMLApplyMovements,llMLSortRows,llManagerBuildOffers,llManagerSeasonRow,llManagerNextLeague,llRenderTeamSelect,llStartCareer,llValidateImportedCareer,llBlankStandings,llBlankStanding,llGenerateSchedule,llTeamDef,llTeamLeague,llLeagueLabel,llRenderDashboard,llStartNextSeason,llMLCareerLossPlaces,llMLCareerLossRange,llV5IsFirstLeagueRelegated,llMLArchiveSummary,llMLActivePromotedTeams,llV2PreviousTeamContext,llV2CreateTeamSeasonTargets,llAutoRerollWithCredits,llAiBattleOutcome,llAiEvaluateRerollTarget,llAiPossibleRerollValues,llRange,LL_CARD_POOL};`,context);
  return {context,api:context.__ml,area,storage};
}
function reportRunner(name){const checks=[],failures=[];return {check(label,fn){try{fn();checks.push(label);}catch(error){failures.push({label,message:error.stack||String(error)});}},finish(extra={}){const report={generatedAt:new Date().toISOString(),passed:checks.length,failed:failures.length,checks,failures,...extra};fs.writeFileSync(path.join(__dirname,`${name}.report.json`),`${JSON.stringify(report,null,2)}\n`,'utf8');if(failures.length){console.error(`${name}: ${failures.length} failed`);process.exitCode=1;}else console.log(`${name}: ${checks.length} checks passed.`);return report;}};}
module.exports={loadRuntime,reportRunner,ROOT,OUTPUTS};
