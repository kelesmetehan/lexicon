'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('outputs/derby-achievements.js','utf8');
function baseState(){return {season:1,week:1,playerCountry:'ENG',playerTeam:'Liverpool FC',ap:200,lp:0,teams:{'Liverpool FC':{stars:1,cards:{},lastResults:['W','W','D']},'Everton FC':{stars:1,cards:{},lastResults:['L','W']}},results:[]};}
global.lexLeague={state:baseState(),match:null,quiz:null};
global.llV2RepairState=s=>s;global.llRenderDashboard=()=>{};global.llV2MatchImportance=()=>'';global.llFinishLeagueQuiz=()=>{};global.llCommitCurrentMatch=()=>{const f=lexLeague.match.fixture;lexLeague.state.results.push({season:lexLeague.state.season,week:lexLeague.state.week,home:f.home,away:f.away,homeGoals:2,awayGoals:0,userMatch:true,competition:'league'});};global.llChooseManagerOffer=()=>{};global.llUpgradeCard=()=>{};global.llUpgradePositionDie=()=>{};global.llV2FinalizeSeason=()=>{};global.llPlayerFixture=()=>({home:'Liverpool FC',away:'Everton FC',competition:'league'});global.llSortTable=()=>[{team:'Liverpool FC'},{team:'Everton FC'}];global.llTeamLeague=()=> 'super';global.llCard=()=>null;global.LL_CARD_RARITY_RANK={};global.llSave=()=>{};global.llEscape=x=>String(x);global.llSetWide=()=>{};global.llArea=()=>({innerHTML:''});global.llCloseModal=()=>{};global.llShowModal=()=>{};global.alert=()=>{};
vm.runInThisContext(source,{filename:'derby-achievements.js'});
llV2RepairState(lexLeague.state);
const f=llPlayerFixture();
assert.equal(llHistoricalDerby(f,lexLeague.state).label,'Merseyside Derbisi');
assert.equal(llHistoricalDerby({home:'Liverpool FC',away:'Sunderland AFC'},lexLeague.state),null);
const o=llDerbyOddsForFixture(f,lexLeague.state);assert(Object.values(o).every(v=>v>=1.5&&v<=4),'odds must stay in the approved range');
global.document={querySelector:()=>null,querySelectorAll:()=>[]};
llOpenDerbyBet();llSetDerbyBetDraft('win',40);llConfirmDerbyBet();
assert.equal(lexLeague.state.ap,160,'stake must be deducted immediately');
assert.equal(lexLeague.state.derbyBetSeason.used,1,'one seasonal coupon consumed');
lexLeague.match={fixture:f};
llCommitCurrentMatch();
const bet=Object.values(lexLeague.state.derbyBets)[0];
assert.equal(bet.settled,true);assert.equal(bet.won,true);assert.equal(bet.actualOutcome,'win');assert.equal(lexLeague.state.achievementStats.derbyWins,1);assert(lexLeague.state.lp>=20,'correct derby coupon and derby bonus must grant LP');
console.log('derby-achievements.test.js: PASS');

