'use strict';
const assert=require('assert');
const vm=require('vm');
const {loadRuntime,reportRunner}=require('./multi-league-test-helpers');
const {context,api}=loadRuntime();
const run=reportRunner('europe-first-season-qualification');
for(const country of api.LL_COUNTRY_CODES){
  run.check(`${country} first season has 36 unique clubs per European competition`,()=>{
    const team=api.LL_TIER2_POOLS[country][0].name;
    context.__testTeam=team;
    const state=vm.runInContext('llNewState(globalThis.__testTeam)',context);
    context.__testState=state;
    const qualifiers=vm.runInContext('llMLResolveEuropeParticipants(globalThis.__testState)',context);
    const all=[];
    for(const type of ['ucl','uel','uecl']){
      assert.strictEqual(qualifiers[type].length,14,`${type} must have 14 domestic qualifiers`);
      const table=state.europeStandings[type];
      assert.strictEqual(table.teams.length,36,`${type} must have 36 clubs`);
      assert.strictEqual(table.fixtures.length,type==='uecl'?6:8,`${type} league phase must have correct rounds`);
      assert(table.fixtures.every(round=>round.length===18),`${type} must have 18 fixtures per round`);
      all.push(...table.teams);
    }
    assert.strictEqual(new Set(all).size,108,'No club may appear in more than one European competition.');
  });
}
run.finish({countries:api.LL_COUNTRY_CODES.length});
