const fs=require('fs');
const path=require('path');
const assert=require('assert');
const vm=require('vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'outputs','europe-knockout-center.js'),'utf8');
const rows=Array.from({length:36},(_,index)=>({team:`Takım ${index+1}`,Pts:36-index,GD:0,GF:0,W:0}));
rows[8].team='Trabzonspor';
rows[23].team='Bodø/Glimt';

const runtimeState={
  season:3,
  playerTeam:'Trabzonspor',
  europe:{
    type:'uel',
    phase:'playoff',
    seedRank:9,
    alive:true,
    status:'9. sıra · Eleme turu play-off',
    tie:{stage:'playoff',opponent:'Bodø/Glimt',leg:2}
  },
  results:[
    ...Array.from({length:8},(_,index)=>({
      season:3,
      competition:'uel',
      league:'euro-table',
      userMatch:true,
      home:'Trabzonspor',
      away:`Lig Rakibi ${index+1}`,
      homeGoals:4,
      awayGoals:0
    })),
    {
      season:3,
      competition:'uel',
      league:'euro-knockout',
      userMatch:true,
      home:'Bodø/Glimt',
      away:'Trabzonspor',
      homeGoals:1,
      awayGoals:0
    }
  ],
  pendingFixture:null
};

const context={
  console,
  Math,
  lexLeague:{state:runtimeState},
  LL_EURO_KNOCKOUT_LABELS:{playoff:'Eleme Turu Play-Off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',final:'Final'},
  LL_EURO_LEAGUE_WEEKS:{uel:[4,7,10,13,16,19,22,25]},
  llV2SortEuropeTable:()=>rows,
  llV2SimpleEuropeScore:()=>({homeGoals:1,awayGoals:0}),
  llV2FixtureRow:(home,away,result)=>`${home} ${result?`${result.homeGoals} - ${result.awayGoals}`:'VS'} ${away}`,
  llV2EnsureEuropeStandings:()=>({uel:{fixtures:[],playedRounds:8}}),
  llTeamLogo:()=>'',
  llEscape:value=>String(value),
  llRecordMatch(){},
  llV2FinishEuropeRound(){},
  llRenderCompetitionCenter(){},
  llArea:()=>({querySelectorAll:()=>[],querySelector:()=>null}),
  llSave(){},
  llRenderRoundSummary(){},
  llV2EuroLabel:()=> 'Avrupa Ligi'
};

vm.createContext(context);
vm.runInContext(source,context,{filename:'europe-knockout-center.js'});

const road=vm.runInContext("llV2EuropeRoadHtml('uel')",context);
const fixtures=vm.runInContext("llV11EuropeKnockoutFixturesHtml('uel')",context);

assert(road.includes('Eleme Turu Play-Off'));
assert(road.includes('Bodø/Glimt'));
assert(road.includes('1 - 0'));
assert(!road.includes('Kupa kazanıldı'));
assert(!road.includes('Lig Rakibi 1'));
assert(fixtures.includes('Eleme Aşaması · Tüm Takımlar'));
assert(fixtures.includes('Takım 10'));
assert(fixtures.includes('1 - 0'));

console.log('Europe knockout runtime: 8 checks passed.');
