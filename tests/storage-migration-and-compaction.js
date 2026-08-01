const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('outputs/indexeddb-storage.js','utf8');
const marker='globalThis.llCompactCompletedSeasonResults=function(state,completedSeason){';
const start=source.indexOf(marker);
const end=source.indexOf('\n  };\n\n  if(llIdbBaseFailure)',start);
assert(start>=0&&end>start,'Compaction function was not found.');
const context={globalThis:{}};
vm.runInNewContext(source.slice(start,end+5),context);
const state={playerTeam:'Player',results:[
  {season:1,home:'A',away:'B',userMatch:false},
  {season:1,home:'Player',away:'B',userMatch:false},
  {season:1,home:'A',away:'Player',userMatch:true},
  {season:2,home:'C',away:'D',userMatch:false}
]};
const result=context.globalThis.llCompactCompletedSeasonResults(state,1);
assert.equal(result.removed,1);
assert.equal(state.results.length,3);
assert(state.results.some(r=>r.home==='Player'&&r.away==='B'),'Player matches must survive even on legacy saves.');
assert(state.results.some(r=>r.userMatch===true),'Explicit user matches must survive.');
assert(state.results.some(r=>r.season===2),'Future/current season matches must survive.');
assert.equal(state.storageCompaction.retainedUserResults,2);
const league=fs.readFileSync('outputs/league-v2.js','utf8');
const seasonFn=league.slice(league.indexOf('function llStartNextSeason(){'),league.indexOf('\nfunction llDevelopOpponents'));
assert(seasonFn.indexOf('llCompactCompletedSeasonResults(s,s.season)')<seasonFn.indexOf('s.season++'),'Compaction must happen before incrementing the season.');
assert(source.includes('indexedDB.open(LL_IDB_NAME,LL_IDB_VERSION)'),'IndexedDB open path missing.');
assert(source.includes('await llIdbRead(LL_IDB_KEY)'),'Migration verification read missing.');
assert(source.includes("localStorage.removeItem(LL_SAVE_SLOTS_KEY)"),'Legacy slot cleanup missing.');
assert(!source.slice(source.indexOf('function llIdbClearMovedLegacy'),source.indexOf('function llIdbInitialize')).includes('removeItem(LL_SAVE_KEY)'),'Legacy v1 must require manual cleanup, not automatic deletion.');
assert(source.includes('llOpenStorageHealth'),'Storage Health UI missing.');
console.log('Storage migration and compaction checks passed.');
