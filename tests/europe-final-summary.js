const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const src=fs.readFileSync('outputs/league-v2.js','utf8');
const start=src.indexOf('function llV2EuropeSummaryProgress(');
assert.ok(start>=0,'summary helper missing');
let i=src.indexOf('{',start),depth=0,end=-1;
for(;i<src.length;i++){if(src[i]==='{')depth++;else if(src[i]==='}'&&--depth===0){end=i+1;break;}}
assert.ok(end>start,'summary helper malformed');
const box={LL_EURO_ROUNDS:['Son 32','Son 16','\u00c7eyrek Final','Yar\u0131 Final','Final'],LL_EURO_WEEKS:[5,11,17,23,29],lexLeague:{state:{playerTeam:'Trabzonspor'}},llV2EuroLabel:()=> '\u015eampiyonlar Ligi'};
vm.createContext(box);vm.runInContext(src.slice(start,end),box);
const f=box.llV2EuropeSummaryProgress;
assert.strictEqual(f('ucl',{round:5,winner:'Trabzonspor'},true,4,'Final'),'\u015eampiyonlar Ligi kupas\u0131n\u0131 kazand\u0131n.');
assert.strictEqual(f('ucl',{round:4},true,3,'Yar\u0131 Final'),'S\u0131radaki tur: Final \u00b7 29. hafta');
assert.strictEqual(f('ucl',{round:undefined},true,2,'\u00c7eyrek Final'),'Tur atlad\u0131n. S\u0131radaki e\u015fle\u015fme haz\u0131rlan\u0131yor.');
assert.strictEqual(f('ucl',{round:4},false,4,'Final'),'Final a\u015famas\u0131nda elendin.');
assert.ok(!src.includes('S\u0131radaki tur: ${LL_EURO_ROUNDS[Number(e?.round)||0]}'),'unguarded final lookup remains');
console.log('Europe final summary: 4/4 passed');
