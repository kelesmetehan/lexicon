const fs=require('fs'),vm=require('vm'),assert=require('assert');
class FakeEl{
 constructor(){this.innerHTML='';this.textContent='';this.children=[];this.attributes={};this.style={};}
 querySelector(){return null;} querySelectorAll(){return [];} insertAdjacentHTML(_p,h){this.innerHTML+=h;}
 appendChild(x){this.children.push(x);return x;} setAttribute(k,v){this.attributes[k]=v;}
}
function contextFor(state){
 const area=new FakeEl(),head=new FakeEl();
 const document={head,body:new FakeEl(),getElementById(){return null;},createElement(){return new FakeEl();},createTreeWalker(){return {nextNode(){return null;}}}};
 const c={console,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Intl,setTimeout:(fn)=>fn(),clearTimeout(){},document,NodeFilter:{SHOW_TEXT:4},alert(){},confirm(){return true;},globalThis:null};
 c.globalThis=c;c.window=c;c.lexLeague={state,quiz:null,match:null};c.llArea=()=>area;c.llSetWide=()=>{};c.llSave=()=>{c.__saved=(c.__saved||0)+1};
 c.llRenderDashboard=()=>{area.innerHTML='<div class="ll-topbar"></div>';};c.llRenderSeasonEnd=c.llRenderDashboard;c.llRenderManagerMarket=c.llRenderDashboard;c.llRenderVacantManagerJobs=c.llRenderDashboard;c.llRenderAchievements=c.llRenderDashboard;c.llRenderSeasonArchive=c.llRenderDashboard;
 c.llRenderSeasonOpening=c.llRenderDashboard;c.llRenderMatch=c.llRenderDashboard;c.llRenderShop=c.llRenderDashboard;c.llShowVacantJobReport=()=>{};
 c.llEscape=s=>String(s);c.llMLCountryMeta=code=>({country:code||'TUR',flag:'🏳️'});c.llMLLeagueLabel=(_c,t)=>t==='tier2'?'İkinci Lig':'Üst Lig';c.llMLCountryForTeam=()=>state.playerCountry||'TUR';c.llTeamLogo=()=>'';
 c.LL_ACHIEVEMENTS=[];c.LL_DOMESTIC_CUP_NAMES={TUR:'Türkiye Kupası'};c.llManagerProfile=typeof state.__managerProfileGlobal==='undefined'?undefined:state.__managerProfileGlobal;
 c.llShopCost=()=>150;c.llOpenPremiumPack=()=>true;c.llBeginMatch=()=>true;c.llRollValue=(min,max)=>max;c.llCommitCurrentMatch=()=>true;c.llV2RepairState=s=>s;
 c.llManagerBuildOffers=()=>[];c.llEnsureManagerMarket=()=>({});c.llApplyForVacantClub=()=>true;c.llChooseManagerOffer=()=>true;c.llAcceptVacantClub=()=>true;
 return {c,area};
}
function run(c,file){vm.runInNewContext(fs.readFileSync(file,'utf8'),c,{filename:file});}
function legacyStates(){return [
 {season:1,playerTeam:'Galatasaray',playerCountry:'TUR',managerProfile:{reputation:67},seasonHistory:[],trophies:[],achievements:{unlocked:{}}},
 {season:4,playerTeam:'Galatasaray',playerCountry:'TUR',managerProfile:{reputation:'67',history:null},seasonHistory:null,trophies:null,achievements:null},
 {season:6,playerTeam:'Galatasaray',playerCountry:'TUR',managerProfile:'legacy',seasonHistory:{bad:true},trophies:{bad:true},achievements:{unlocked:[]},__managerProfileGlobal:{reputation:52}},
 {season:8,playerTeam:'Galatasaray',playerCountry:'TUR',managerProfile:{history:{},reputation:80},seasonHistory:[{season:1,country:'TUR',tier1Rows:null,tier2Rows:null}],trophies:'bad',achievements:{unlocked:{old:{season:1}}}}
];}
for(const [i,state] of legacyStates().entries()){
 const {c,area}=contextFor(state);run(c,'manager-profile-overview.js');run(c,'board-confidence-reputation.js');
 assert.equal(typeof c.llRenderManagerProfile,'function');
 const ok=c.llRenderManagerProfile('overview');assert.notEqual(ok,false,`legacy ${i} profile returned false`);assert(area.innerHTML.includes('Hoca <em>Profili</em>'),`legacy ${i} profile missing`);
 for(const tab of ['seasons','clubs','trophies']){assert.notEqual(c.llRenderManagerProfile(tab),false);assert(area.innerHTML.length>100);}
 assert(state.managerCareerOverview && Array.isArray(state.managerCareerOverview.seasons));
 assert(state.boardConfidence && Number.isFinite(state.boardConfidence.value));
 assert(state.managerProfile && typeof state.managerProfile==='object');
}
// Confidence bands and effective reputation
{
 const state={season:1,playerTeam:'A',playerCountry:'TUR',managerProfile:{reputation:60},boardConfidence:{season:1,value:85,startValue:60,history:[],meetings:[]}};const {c}=contextFor(state);run(c,'manager-profile-overview.js');run(c,'board-confidence-reputation.js');
 assert.equal(c.llBoardConfidenceStatus(85).key,'strong');assert.equal(c.llBoardConfidenceStatus(45).key,'uneasy');assert.equal(c.llBoardConfidenceStatus(20).key,'danger');assert.equal(c.llBoardConfidenceStatus(5).key,'dismissal');
 assert.equal(c.llBoardEffectiveReputation(state),65);state.boardConfidence.value=20;assert.equal(c.llBoardEffectiveReputation(state),50);
}
// Shop surcharge integration
{
 const state={season:1,playerTeam:'A',playerCountry:'TUR',ap:1000,managerProfile:{reputation:50},boardConfidence:{season:1,value:45,startValue:60,history:[],meetings:[]}};const {c}=contextFor(state);run(c,'manager-profile-overview.js');run(c,'board-confidence-reputation.js');assert.equal(c.llShopCost(),180);
 state.boardConfidence.value=60;assert.equal(c.llShopCost(),150);
}
// Press conference API and one-match boost selection
{
 const state={season:1,playerTeam:'A',playerCountry:'TUR',managerProfile:{reputation:50},boardConfidence:{value:60}};const {c}=contextFor(state);run(c,'manager-profile-overview.js');run(c,'board-confidence-reputation.js');
 assert.equal(typeof c.llStartPressConferenceQuiz,'function');assert.equal(typeof c.llChoosePressBoost,'function');assert.equal(typeof c.llContinueAfterPressConference,'function');
}
console.log('PASS e2e-new-features: legacy profile, tabs, confidence, reputation, shop, press APIs');
