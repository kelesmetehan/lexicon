'use strict';
const assert=require('assert');
const {loadRuntime,reportRunner}=require('./multi-league-test-helpers');
const {api,area}=loadRuntime();const run=reportRunner('background-simulation'),state=api.llNewState('Birmingham City');api.lexLeague.state=state;const beforeHtml=area.innerHTML,start=performance.now(),metric=api.llMLSimulateBackgroundWeek(state,1),elapsed=performance.now()-start;
run.check('all six non-player countries play both tiers in week one',()=>{for(const country of api.LL_COUNTRY_CODES.filter(code=>code!==state.playerCountry))for(const tier of ['tier1','tier2']){const expected=(state.schedules[country][tier][0]||[]).length*2,played=Object.values(state.standings[country][tier]).reduce((sum,row)=>sum+row.P,0);assert.strictEqual(played,expected,`${country} ${tier}`);}});
run.check('background simulation creates country-tagged data only',()=>{const background=state.results.filter(r=>r.country&&r.country!==state.playerCountry);assert(background.length>80);assert(background.every(r=>r.userMatch===false));});
run.check('background simulation never renders DOM',()=>assert.strictEqual(area.innerHTML,beforeHtml));
run.check('one parallel week stays below 100ms',()=>assert(elapsed<100,`${elapsed.toFixed(2)}ms`));
run.finish({durationMs:Number(elapsed.toFixed(2)),engineDurationMs:metric.durationMs,results:state.results.length});