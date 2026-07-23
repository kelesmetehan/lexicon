const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('outputs/last-champions.js','utf8');
const context={
  console,
  UCL_TEAMS:[
    {name:'Real Madrid'},{name:'Barcelona'},{name:'Bayern München'},
    {name:'Liverpool'},{name:'Inter'},{name:'Paris Saint-Germain'}
  ],
  lexLeague:{state:null},
  llTeamDef:name=>({name,stars:name==='Real Madrid'?6:5}),
  llEscape:value=>String(value),
  llTeamLogo:()=>'',llArea:()=>({querySelectorAll:()=>[]}),
  llSave:()=>{},document:undefined,
  llV2RepairState:state=>state,
  llV2ArchiveSeason:(state,summary)=>summary,
  llV2FinalizeSeason:()=>{},
  llV2FinishCupRound:()=>{},
  llV2FinishEuropeRound:()=>{},
  llRenderCompetitionCenter:()=>{}
};
vm.createContext(context);
vm.runInContext(source,context);

const row=team=>({team,P:38,W:20,D:10,L:8,GF:60,GA:35,GD:25,Pts:70});
const state={
  season:3,
  playerTeam:'Trabzonspor',
  teams:{},
  trophies:[{season:2,name:'UEFA Avrupa Ligi',team:'Trabzonspor'}],
  managerProfile:{history:[{season:1,from:'Ümraniyespor',to:'Trabzonspor'},{season:2,from:'Trabzonspor',to:'Trabzonspor'}]},
  seasonHistory:[
    {season:1,superRows:[row('Galatasaray')],firstRows:[row('Bodrum FK')],cupWinner:'Fenerbahçe',qualifications:{ucl:['Galatasaray'],uel:['Fenerbahçe'],uecl:['Başakşehir']}},
    {season:2,superRows:[row('Trabzonspor')],firstRows:[row('Sivasspor')],cupWinner:'Beşiktaş',qualifications:{ucl:['Trabzonspor'],uel:['Beşiktaş'],uecl:['Göztepe']}}
  ],
  cup:{winner:null},
  europe:null
};
context.lexLeague.state=state;
context.llV13EnsureChampionHistory(state);

assert.strictEqual(context.llV13LastChampion(state,'super').team,'Trabzonspor');
assert.strictEqual(context.llV13LastChampion(state,'first').team,'Sivasspor');
assert.strictEqual(context.llV13LastChampion(state,'cup').team,'Beşiktaş');
assert.strictEqual(context.llV13LastChampion(state,'uel').team,'Trabzonspor');
for(const season of [1,2]){
  for(const competition of ['super','first','cup','ucl','uel','uecl']){
    assert.ok(state.competitionChampions.some(item=>item.season===season&&item.competition===competition),`${season}/${competition} missing`);
  }
}
assert.ok(state.seasonHistory.every(entry=>entry.champions&&entry.champions.super&&entry.champions.ucl));

state.cup.winner='Konyaspor';
context.llV13EnsureChampionHistory(state);
assert.strictEqual(context.llV13LastChampion(state,'cup').team,'Konyaspor');
assert.strictEqual(context.llV13LastChampion(state,'cup').season,3);

assert.ok(source.includes('Son şampiyon:'));
assert.ok(source.includes('Henüz belirlenmedi'));
console.log('last champions tests passed');
