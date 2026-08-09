const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const base=fs.readFileSync('outputs/europe-knockout-tiebreak.js','utf8');
const animation=fs.readFileSync('outputs/penalty-shootout-animation.js','utf8');
const html=fs.readFileSync('outputs/lexicon-fixed.html','utf8');

new Function(animation);

function loadWithRandom(values){
  let index=0;
  const randomMath=Object.create(Math);
  randomMath.random=()=>values[index++]??.1;
  const context={
    console,
    Math:randomMath,
    setTimeout:()=>0,
    clearTimeout(){},
    requestAnimationFrame:callback=>callback(),
    window:{matchMedia:()=>({matches:false})},
    lexLeague:{state:null},
    llTeamDef:()=>({stars:4}),
    llEscape:value=>String(value),
    llV2RepairState:state=>state,
    llV11ImportPlayerLegs(){},
    llV11PlayerPair:()=>null,
    llV11PlayerKnockoutResults:()=>[],
    llV11KnockoutPairHtml:()=>'', 
    llRenderCompetitionCenter(){},
    llRenderRoundSummary(){},
    llArea:()=>null,
    llSave(){},
    LL_EURO_KNOCKOUT_LABELS:{playoff:'Eleme Turu Play-Off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',final:'Final'},
    LL_V11_EURO_STAGES:['playoff','r16','qf','sf','final']
  };
  vm.createContext(context);
  vm.runInContext(base,context);
  vm.runInContext(animation,context);
  return context;
}

function state(){
  return {
    playerTeam:'Trabzonspor',
    teams:{Trabzonspor:{stars:4},Marseille:{stars:4}},
    europe:{tie:{playerGoals:4,opponentGoals:4}}
  };
}

let context=loadWithRandom([.1,.9,.1,.9,.1,.9]);
let shootout=vm.runInContext("llV12PenaltyShootout(__state,'Trabzonspor','Marseille')",Object.assign(context,{__state:state()}));
assert.strictEqual(shootout.kicks.length,3,'series should stop when the opponent can no longer catch up');
assert.deepStrictEqual(JSON.parse(JSON.stringify(shootout.kicks.map(kick=>[kick.playerScore,kick.opponentScore]))),[[1,0],[2,0],[3,0]]);
assert.strictEqual(shootout.winner,'Trabzonspor');
assert.deepStrictEqual(JSON.parse(JSON.stringify(shootout.aggregate)),{player:4,opponent:4});

context=loadWithRandom([.1,.1,.1,.1,.1,.1,.1,.1,.1,.1,.1,.9]);
shootout=vm.runInContext("llV12PenaltyShootout(__state,'Trabzonspor','Marseille')",Object.assign(context,{__state:state()}));
assert.strictEqual(shootout.kicks.length,6);
assert.strictEqual(shootout.kicks[5].suddenDeath,true);
assert.strictEqual(shootout.player,6);
assert.strictEqual(shootout.opponent,5);

assert(/penalty-shootout-animation\.js\?v=/.test(html));
assert(animation.includes('PENALTI ATIŞLARI'));
assert(animation.includes('Animasyonu Geç'));

console.log('Penalty shootout animation: 11 checks passed.');
