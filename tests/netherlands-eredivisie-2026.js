'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..','outputs'),pools=fs.readFileSync(path.join(root,'european-leagues-pools.js'),'utf8');
const poolContext={LL_TEAMS:[],LL_FIRST_TEAMS:[],LL_V14_EURO_META:{},LL_EURO_LOGO_IDS:{}};vm.createContext(poolContext);vm.runInContext(`${pools}\nglobalThis.OUT={teams:LL_TIER1_POOLS.NED,meta:LL_COUNTRY_META.NED};`,poolContext);
const expected=['ADO Den Haag','AZ Alkmaar','Ajax Amsterdam','SC Cambuur Leeuwarden','Excelsior Rotterdam','FC Groningen','FC Twente Enschede','FC Utrecht','Feyenoord Rotterdam','Fortuna Sittard','Go Ahead Eagles','NEC Nijmegen','PEC Zwolle','PSV Eindhoven','SC Heerenveen','Sparta Rotterdam','SC Telstar','Willem II Tilburg'];
assert.deepStrictEqual(Array.from(poolContext.OUT.teams.map(team=>team.name)),expected,'Eredivisie 18 takımı verilen sırayla eşleşmeli');
assert.strictEqual(poolContext.OUT.teams.length,18,'Eredivisie 18 takımlı kalmalı');
assert.strictEqual(poolContext.OUT.meta.relegate,2,'Hollanda’da 17–18 doğrudan düşmeli');
const source=fs.readFileSync(path.join(root,'multi-league-engine.js'),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`);assert(start>=0,`${name} bulunamadı`);const brace=source.indexOf('{',start);let depth=0,quote=null,escaped=false;for(let i=brace;i<source.length;i++){const char=source[i];if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote=null;continue;}if(char==='"'||char==="'"||char==='`'){quote=char;continue;}if(char==='{')depth++;else if(char==='}'&&--depth===0)return source.slice(start,i+1);}throw Error(`${name} gövdesü eksik`);}
const sortContext={Number};vm.createContext(sortContext);vm.runInContext(`${extract('llMLPoolSeed')}\n${extract('llMLSortRows')}\nglobalThis.sort=llMLSortRows;`,sortContext);
const standings=Object.fromEntries(expected.map(team=>[team,{team,Pts:0,GD:0,GF:0}]));const state={leagues:{NED:{tier1:expected}},standings:{NED:{tier1:standings}}};assert.deepStrictEqual(Array.from(sortContext.sort(state,'NED','tier1').map(row=>row.team)),expected,'Sıfır puanda kaynak dizilimi korunmalı');
console.log('Netherlands Eredivisie 2026: 4 checks passed.');
