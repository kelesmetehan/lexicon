'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','manager-job-market.js'),'utf8');

function row(team,position,wins=8,played=20){return {team,position,W:wins,P:played,D:2,L:played-wins-2,GF:24,GA:20,GD:4,Pts:wins*3+2};}
function contextFor(state){
  const context={
    console,Date,Math,JSON,Object,Array,Number,String,Set,Map,encodeURIComponent,decodeURIComponent,
    LL_COUNTRY_CODES:['TUR','ENG'],
    LL_COUNTRY_META:{TUR:{country:'Türkiye',flag:'🇹🇷'},ENG:{country:'İngiltere',flag:'🏴'}},
    llMLCountryMeta:code=>code==='TUR'?{country:'Türkiye',flag:'🇹🇷'}:{country:'İngiltere',flag:'🏴'},
    llMLLeagueLabel:(country,tier)=>country+' '+tier,
    llManagerNextLeague:(summary,team)=>Object.values(summary.countrySummaries||{}).some(info=>(info.relegated||[]).includes(team))?'first':'super',
    llManagerProjectedTarget:()=>({label:'İlk 8'}),
    llManagerProfile:s=>s.managerProfile,
    llManagerPerformance:s=>s.__performance,
    llEnsureManagerMarket:s=>s.managerMarket,
    llRenderManagerMarket:()=>{},llV2RepairState:s=>s,
    lexLeague:{state},document:undefined,globalThis:null
  };
  context.globalThis=context;vm.createContext(context);vm.runInContext(source,context);return context;
}
function fixture(){
  const state={
    season:3,playerCountry:'TUR',playerTeam:'User FC',
    teams:{'User FC':{stars:3},'Relegated FC':{stars:4},'Promoted FC':{stars:4},'Big Collapse':{stars:6},'Safe FC':{stars:3},'English Low':{stars:5}},
    managerProfile:{reputation:76,history:[]},trophies:[{season:2,name:'Kupa'}],seasonHistory:[],
    __performance:{winRate:61,primaryAchieved:true,superChampion:true,cupFinal:false,europeSuccess:false,europeTrophy:false,promoted:false},
    managerMarket:{status:'pending',season:3,fromTeam:'User FC',fromStars:3,winRate:61,primaryAchieved:true,prestigeEligible:true,offers:[],applications:{}},
    lastSeasonSummary:{season:3,starDeclineEvaluations:[],countrySummaries:{
      TUR:{tier1Rows:[row('User FC',1,12),row('Safe FC',6,8),row('Big Collapse',14,4),row('Relegated FC',18,3)],tier2Rows:[row('Promoted FC',1,14)],relegated:['Relegated FC'],promoted:['Promoted FC'],cupWinner:'User FC',rules:{relegateCount:1,playoffTo:4}},
      ENG:{tier1Rows:[row('English Low',17,4)],tier2Rows:[],relegated:[],promoted:[],cupWinner:null,rules:{relegateCount:3,playoffTo:6}}
    },leagueRows:{}}
  };
  state.lastSeasonSummary.leagueRows={TUR:{tier1:state.lastSeasonSummary.countrySummaries.TUR.tier1Rows,tier2:state.lastSeasonSummary.countrySummaries.TUR.tier2Rows},ENG:{tier1:state.lastSeasonSummary.countrySummaries.ENG.tier1Rows,tier2:[]}};
  return state;
}

// Relegation and severe underperformance create vacancies; promotion protects the manager.
{
  const state=fixture(),context=contextFor(state),vacancies=context.llBuildManagerVacancies(state,state.managerMarket);
  assert(vacancies.some(item=>item.team==='Relegated FC'));
  assert(vacancies.some(item=>item.team==='Big Collapse'));
  assert(vacancies.some(item=>item.team==='English Low'));
  assert(!vacancies.some(item=>item.team==='Promoted FC'));
  assert(!vacancies.some(item=>item.team==='User FC'));
}

// A strong manager can be accepted by a four-star club in urgent need.
{
  const state=fixture(),context=contextFor(state),vacancy={team:'Relegated FC',country:'TUR',stars:4,nextTier:'tier2',reasonCode:'relegation',securityScore:100};
  const report=context.llEvaluateManagerApplication(state,state.managerMarket,vacancy);
  assert.equal(report.accepted,true);assert(report.totalScore>=report.requiredScore);assert.equal(report.criteria.length,5);
}

// Low reputation and weak performance cannot unlock an elite foreign club.
{
  const state=fixture();state.managerProfile.reputation=30;state.managerMarket.winRate=25;state.managerMarket.primaryAchieved=false;state.__performance={winRate:25,primaryAchieved:false,superChampion:false,cupFinal:false,europeSuccess:false,europeTrophy:false,promoted:false};
  const context=contextFor(state),vacancy={team:'Elite',country:'ENG',stars:6,nextTier:'tier1',reasonCode:'severe-underperformance',securityScore:90},report=context.llEvaluateManagerApplication(state,state.managerMarket,vacancy);
  assert.equal(report.accepted,false);assert(report.criteria.some(item=>item.code==='country'&&!item.pass));
}

// Vacancy/security processing is idempotent for the same season.
{
  const state=fixture(),context=contextFor(state),first=context.llBuildManagerVacancies(state,state.managerMarket),before=state.clubManagerSecurity.clubs['Big Collapse'].history.length,second=context.llBuildManagerVacancies(state,state.managerMarket);
  assert.deepEqual(second,first);assert.equal(state.clubManagerSecurity.clubs['Big Collapse'].history.length,before);
}

console.log('manager-job-market: all tests passed');
