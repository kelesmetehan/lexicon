const fs=require('fs');
const path=require('path');
const assert=require('assert');
const vm=require('vm');

const root=path.resolve(__dirname,'..');
const center=fs.readFileSync(path.join(root,'outputs','europe-knockout-center.js'),'utf8');
const tiebreak=fs.readFileSync(path.join(root,'outputs','europe-knockout-tiebreak.js'),'utf8');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');

new Function(tiebreak);

const rows=Array.from({length:36},(_,index)=>({team:`Takım ${index+1}`,Pts:36-index,GD:0,GF:0,W:0}));
rows[8].team='Trabzonspor';
rows[23].team='Bodø/Glimt';

function gameState(phase='playoff'){
  return {
    season:3,
    week:27,
    playerTeam:'Trabzonspor',
    teams:{
      Trabzonspor:{stars:4},
      'Bodø/Glimt':{stars:4}
    },
    trophies:[],
    europe:{
      type:'uel',
      phase,
      seedRank:9,
      alive:phase!=='eliminated',
      status:'Eleme Turu Play-Off',
      tie:{stage:'playoff',opponent:'Bodø/Glimt',leg:2,playerGoals:0,opponentGoals:1}
    },
    results:[{
      season:3,
      competition:'uel',
      league:'euro-knockout',
      userMatch:true,
      home:'Trabzonspor',
      away:'Bodø/Glimt',
      homeGoals:1,
      awayGoals:0,
      euroStage:'playoff',
      euroLeg:2
    }],
    pendingFixture:null
  };
}

const context={
  console,
  Math,
  lexLeague:{state:gameState()},
  LL_EURO_KNOCKOUT_LABELS:{playoff:'Eleme Turu Play-Off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',final:'Final'},
  LL_EURO_LEAGUE_WEEKS:{uel:[4,7,10,13,16,19,22,25]},
  llV2SortEuropeTable:()=>rows,
  llV2SimpleEuropeScore:()=>({homeGoals:1,awayGoals:0}),
  llV2FixtureRow:(home,away,result)=>`${home} ${result?`${result.homeGoals} - ${result.awayGoals}`:'VS'} ${away}`,
  llV2EnsureEuropeStandings:()=>({uel:{fixtures:[],playedRounds:8}}),
  llTeamLogo:()=>'',
  llTeamDef:name=>({name,stars:4}),
  llEscape:value=>String(value),
  llRecordMatch(){},
  llV2FinishEuropeRound(){},
  llV2RepairState:state=>state,
  llV3EnterEuropeKnockout(){},
  llRenderCompetitionCenter(){},
  llArea:()=>({querySelectorAll:()=>[],querySelector:()=>null}),
  llSave(){},
  llRenderRoundSummary(){},
  llV2EuroLabel:()=> 'Avrupa Ligi'
};

vm.createContext(context);
vm.runInContext(center,context,{filename:'europe-knockout-center.js'});
vm.runInContext(tiebreak,context,{filename:'europe-knockout-tiebreak.js'});

vm.runInContext("llV12PenaltyShootout=()=>({player:5,opponent:4,winner:'Trabzonspor',playerTeam:'Trabzonspor',opponentTeam:'Bodø/Glimt',suddenDeath:false})",context);
vm.runInContext('llV2FinishEuropeRound()',context);
assert.strictEqual(context.lexLeague.state.europe.phase,'r16');
assert.strictEqual(context.lexLeague.state.europe.alive,true);
assert(context.lexLeague.state.europe.status.includes('Penaltılar 5-4'));
assert.strictEqual(context.lexLeague.state.results[0].penaltyShootout.winner,'Trabzonspor');

context.lexLeague.state=gameState();
vm.runInContext("llV12PenaltyShootout=()=>({player:3,opponent:4,winner:'Bodø/Glimt',playerTeam:'Trabzonspor',opponentTeam:'Bodø/Glimt',suddenDeath:false})",context);
vm.runInContext('llV2FinishEuropeRound()',context);
assert.strictEqual(context.lexLeague.state.europe.phase,'eliminated');
assert(context.lexLeague.state.europe.status.includes('Toplam 1-1 · Penaltılar 3-4'));

const legacy=gameState('eliminated');
legacy.europe.tie.playerGoals=1;
legacy.europe.tie.opponentGoals=1;
context.lexLeague.state=legacy;
vm.runInContext("llV12PenaltyShootout=()=>({player:5,opponent:4,winner:'Trabzonspor',playerTeam:'Trabzonspor',opponentTeam:'Bodø/Glimt',suddenDeath:false})",context);
assert.strictEqual(vm.runInContext('llV12RepairLegacyAggregateTie(lexLeague.state)',context),true);
assert.strictEqual(context.lexLeague.state.europe.phase,'r16');
assert.strictEqual(context.lexLeague.state.results[0].penaltyShootout.winner,'Trabzonspor');

assert(html.indexOf('europe-knockout-tiebreak.js?v=20260723-1')>html.indexOf('europe-knockout-center.js?v=20260723-1'));
assert(!tiebreak.includes('Math.random()<.5?tie.playerGoals>tie.opponentGoals'));

console.log('Europe knockout tiebreak: 11 checks passed.');
