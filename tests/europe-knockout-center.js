const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'outputs','europe-knockout-center.js'),'utf8');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');

new Function(source);

function functionSource(name){
  const start=source.indexOf(`function ${name}(`);
  assert(start>=0,`${name} must exist`);
  const brace=source.indexOf('{',start);
  let depth=0;
  for(let index=brace;index<source.length;index++){
    if(source[index]==='{')depth++;
    else if(source[index]==='}'&&--depth===0)return source.slice(start,index+1);
  }
  throw new Error(`${name} function body is incomplete`);
}

const stages=['playoff','r16','qf','sf','final'];
const tagLegacy=new Function('LL_V11_EURO_STAGES',`${functionSource('llV11TagLegacyPlayerKnockoutResults')};return llV11TagLegacyPlayerKnockoutResults;`)(stages);
const state={
  season:3,
  playerTeam:'Trabzonspor',
  europe:{type:'uel',phase:'playoff',seedRank:9,status:'9. sıra · Eleme turu play-off'},
  results:[
    {season:3,competition:'uel',league:'euro-table',userMatch:true,home:'Trabzonspor',away:'Marseille'},
    {season:3,competition:'uel',league:'euro-knockout',userMatch:true,home:'Bodø/Glimt',away:'Trabzonspor'}
  ]
};
const knockoutResults=tagLegacy(state,'uel');

assert.strictEqual(knockoutResults.length,1,'League-phase results must never enter the knockout journey.');
assert.strictEqual(knockoutResults[0].euroStage,'playoff','The first legacy knockout result for a 9-24 seed must be the play-off.');
assert.strictEqual(knockoutResults[0].euroLeg,1,'The first legacy knockout result must be the first leg.');
assert.strictEqual(state.results[0].euroStage,undefined,'League-phase history must remain untouched.');
assert(source.includes("result.league==='euro-knockout'"),'Knockout reads must require the euro-knockout record type.');
assert(source.includes('result.euroStage=stage')&&source.includes('result.euroLeg=leg'),'New knockout results must store stage and leg metadata.');
assert(source.includes('Eleme Aşaması · Tüm Takımlar'),'The competition center must display every knockout pairing.');
assert(source.includes("label.textContent='Lig Aşaması'"),'The 8/8 metric must be labelled as league phase, not all tournament rounds.');
assert(html.indexOf('europe-knockout-center.js?v=20260723-1')>html.indexOf('manager-market.js?v=20260719-1'),'The knockout correction layer must load after the existing game layers.');

console.log('Europe knockout center: 9 checks passed.');
