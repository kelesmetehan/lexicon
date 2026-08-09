'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','outputs','multi-league-engine.js'),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`);assert(start>=0,`${name} bulunamadı`);const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;for(let i=brace;i<source.length;i++){const c=source[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);}throw new Error(`${name} gövdesi eksik`);}
const context={LL_COUNTRY_CODES:['TUR','ENG'],llV3ResolveEuropeQualifications:()=>({ucl:['Fallback UCL'],uel:['Fallback UEL'],uecl:['Fallback UECL']}),llDeep:value=>JSON.parse(JSON.stringify(value))};
vm.createContext(context);
vm.runInContext(`${extract('llMLPreviousCountrySummaries')}\n${extract('llMLResolveEuropeParticipants')}\nglobalThis.resolve=llMLResolveEuropeParticipants;`,context);
const state={season:4,playerCountry:'TUR',playerTeam:'Trabzonspor',seasonHistory:[{season:3,countrySummaries:{TUR:{qualifications:{ucl:['Trabzonspor','Fenerbahçe'],uel:['Trabzonspor','Beşiktaş'],uecl:['Samsunspor']}},ENG:{qualifications:{ucl:['Arsenal'],uel:['Aston Villa'],uecl:['Crystal Palace']}}}}]};
const resolved=context.resolve(state),all=['ucl','uel','uecl'].flatMap(type=>resolved[type]);
assert.strictEqual(all.filter(name=>name==='Trabzonspor').length,1,'Trabzonspor yalnızca bir Avrupa kupasında yer almalı');
assert(resolved.ucl.includes('Trabzonspor'),'üst seviye bilet (Şampiyonlar Ligi) korunmalı');
assert.strictEqual(new Set(all).size,all.length,'hiçbir takım kupalar arasında iki kez yer alamaz');
assert.strictEqual(state.europeQualificationSources.teams.Trabzonspor.competition,'ucl','katılım kaynağı üst seviye kupayı göstermeli');
console.log('Europe cross-competition participant integrity: 4 checks passed.');
