const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const leagueSource=fs.readFileSync(path.join(root,'outputs','league-v2.js'),'utf8');
const managerSource=fs.readFileSync(path.join(root,'outputs','manager-market.js'),'utf8');
const diagnosticSource=fs.readFileSync(path.join(root,'outputs','diagnostics.js'),'utf8');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');

function extractFunction(source,name){
  const start=source.indexOf('function '+name+'(');assert(start>=0,'Fonksiyon bulunamadı: '+name);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escaped=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escaped){escaped=false;continue;}if(ch==='\\'){escaped=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('Fonksiyon kapanışı bulunamadı: '+name);
}

const targetSandbox={LL_ALL_TEAMS:[],lexLeague:{state:null}};vm.createContext(targetSandbox);
const targetNames=['llV2TeamStarsInState','llV2TeamTargetOptions','llV2PreviousTeamContext','llV2ContextualTeamTargetOptions','llV2TeamTierIndex','llV2TeamTargetSignature','llV2CreateTeamSeasonTargets','llV2EnsureTeamSeasonTargets'];
vm.runInContext('const LL_TEAM_TARGET_VERSION=4;\n'+targetNames.map(name=>extractFunction(leagueSource,name)).join('\n'),targetSandbox);
const state={season:2,teams:{'Düşen FK':{stars:3},'Rakip FK':{stars:2}},leagues:{super:[],first:['Düşen FK','Rakip FK']},seasonHistory:[{season:1,superRows:[{team:'Düşen FK',position:18}],firstRows:[],relegated:['Düşen FK'],promoted:[]}],teamSeasonTargets:null};
let targets=targetSandbox.llV2EnsureTeamSeasonTargets(state);
assert.equal(targets.version,4);
assert.equal(targets.targets['Düşen FK'].league,'first');
assert.match(targets.targets['Düşen FK'].label,/geri yüksel|yeniden yüksel|şampiyonu olarak geri dön/);
const oldSignature=targets.signature;state.teams['Düşen FK'].stars=2;targets=targetSandbox.llV2EnsureTeamSeasonTargets(state);
assert.notEqual(targets.signature,oldSignature,'Yıldız değişince hedef imzası yenilenmeli');
assert.match(targets.targets['Düşen FK'].label,/Play-Off|ilk 8/);
assert(managerSource.includes("(summary?.relegated||[]).includes(team)"),'Teklif ekranı düşen takımı dikkate almalı');

const words=[{id:'a',en:'alpha',tr:'alfa'},{id:'b',en:'bravo',tr:'bravo'},{id:'c',en:'charlie',tr:'charlie'},{id:'d',en:'delta',tr:'delta'}];
let saves=0;
const diagSandbox={console,Date,Math,Blob:class{},URL:{},setTimeout,clearTimeout,loadUserWords:()=>words,llShuffle:items=>[...items],llSave:()=>{saves++;}};
vm.createContext(diagSandbox);
vm.runInContext("let lexLeague={state:{usedWords:['a','b','c'],recentQuizWords:['c']},quiz:null};",diagSandbox);
vm.runInContext(diagnosticSource,diagSandbox);
let queue=diagSandbox.llPickQuizWords(3);
assert.deepEqual(queue.map(ref=>ref.id),['d','a','b'],'Döngü sınırında yakın zamanda görülen kelime ertelenmeli');
assert.equal(queue[1].cycleStart,true,'İkinci döngünün başladığı öğe işaretlenmeli');
assert.equal(new Set(queue.map(ref=>ref.id)).size,queue.length,'Aynı maçta kelime tekrarlanmamalı');
vm.runInContext("lexLeague.state.usedWords=[];lexLeague.state.recentQuizWords=['a'];",diagSandbox);
queue=diagSandbox.llPickQuizWords(2);assert.deepEqual(queue.map(ref=>ref.id),['b','c'],'Yakın kelime, alternatifler varken seçilmemeli');
vm.runInContext("lexLeague.quiz={index:0,shownWordIds:[]};",diagSandbox);diagSandbox.llRecordQuizWordShown(queue[0],words[1]);diagSandbox.llRecordQuizWordShown(queue[0],words[1]);
assert.equal(vm.runInContext("lexLeague.quiz.shownWordIds.length",diagSandbox),1,'Aynı soru yeniden render edilince iki kez kaydedilmemeli');
assert.equal(saves,1,'Yeni gösterilen kelime bir kez kaydedilmeli');
assert(/diagnostics\.js\?v=/.test(html));
assert(html.includes("llRecordQuizWordShown(ref,word)"));
assert(diagnosticSource.includes('Hata Kaydını İndir'));
console.log('Hedef yenileme, kelime yakın tekrar koruması ve hata kaydı testleri geçti.');
