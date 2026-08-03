const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync(require('path').join(__dirname,'..','competition-badge-dice.js'),'utf8');
let inserted='';
const topbar={insertAdjacentHTML(_where,html){inserted+=html;}};
const root={
  querySelector(selector){
    if(selector==='[data-competition-badge-dashboard]')return inserted.includes('data-competition-badge-dashboard')?{}:null;
    if(selector==='.ll-topbar')return topbar;
    if(selector==='.ll-panel')return {insertAdjacentHTML(_where,html){inserted+=html;}};
    return null;
  }
};
const styleIds=new Set();
const document={
  head:{appendChild(node){if(node.id)styleIds.add(node.id);}},
  createElement(){return {id:'',textContent:''};},
  getElementById(id){return styleIds.has(id)?{}:null;}
};
const state={
  season:2,
  seasonEnded:false,
  playerTeam:'Test FC',
  teams:{'Test FC':{stars:3,lockedDice:{},nextMatchBonuses:{},cards:{Kaleci:null,'Orta Saha':null,Forvet:null}}},
  competitionDiceBadges:[{key:'1:league',sourceCompetition:'league',targetCompetition:'league',scope:'exact',role:'Kaleci',awardedSeason:1,activeSeason:2,homeOnly:true}]
};
const sandbox={
  console,document,setTimeout:fn=>fn(),
  lexLeague:{state,match:{player:'Test FC',playerHome:true,fixture:{competition:'league'}}},
  LL_POSITION_ICONS:{Kaleci:'🧤','Orta Saha':'⚙️',Forvet:'⚽'},
  llArea:()=>root,
  llTeamState:name=>state.teams[name],
  llRange:stars=>stars<=1?[1,4]:stars===2?[1,5]:stars===3?[2,6]:stars===4?[3,6]:[4,6],
  llDieProgressionStar:(_team,position)=>position==='Kaleci'?4:3,
  llRandomInt:(_min,max)=>max,
  llEscape:value=>String(value),
  llPlayerFixture:()=>({competition:'league'}),
  llCard:()=>null,llActiveCardId:()=>null,llBaseName:()=>'',
  llRollValue:()=>6,
  llMakeDice:()=>[],
  llDieRow:()=>'<div class="ll-die "><div class="ll-die-card"></div></div>',
  llRenderMatch:()=>{},llV2FinishCupRound:()=>{},llV2FinishEuropeRound:()=>{},llV2FinalizeSeason:()=>{},llStartNextSeason:()=>{},
  llRenderDashboard:()=>{},llSave:()=>{},llShowModal:()=>{},llCloseModal:()=>{}
};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'competition-badge-dice.js'});

sandbox.llRenderDashboard();
assert(inserted.includes('Sezonluk Rozetli Zar'),'dashboard badge panel was not inserted');
assert(inserted.includes('Kaleci zarı: 3-7'),'position-specific upgraded die range was not displayed');
assert(inserted.includes('Lig Şampiyonluğu · yalnızca iç saha maçları'),'competition and home-only rule were not displayed');
assert.strictEqual((inserted.match(/data-competition-badge-dashboard/g)||[]).length,1,'dashboard badge panel was inserted more than once');
sandbox.llRenderDashboard();
assert.strictEqual((inserted.match(/data-competition-badge-dashboard/g)||[]).length,1,'dashboard badge panel duplicated after rerender');
assert.strictEqual(sandbox.llRollValue('Test FC','Kaleci'),7,'active badge did not keep the die ceiling at 7');

console.log('competition-badge-dashboard: all checks passed');
