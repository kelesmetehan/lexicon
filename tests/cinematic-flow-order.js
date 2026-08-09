const fs=require('fs');
const assert=require('assert');

const achievement=fs.readFileSync('outputs/achievement-cinematic.js','utf8');
const penalty=fs.readFileSync('outputs/penalty-shootout-animation.js','utf8');
const trophy=fs.readFileSync('outputs/trophy-cinematic.js','utf8');

new Function(achievement);
new Function(penalty);
new Function(trophy);

function indexOfOrFail(source,needle,label){
  const index=source.indexOf(needle);
  assert(index>=0,`${label}: missing ${needle}`);
  return index;
}

/* The lock must exist before the base round renderer can schedule any result cinematic. */
const lockIndex=indexOfOrFail(penalty,'globalThis.llPenaltySequenceActive=isPenaltyResult;','penalty lock');
const baseIndex=indexOfOrFail(penalty,'llV15RenderRoundSummaryBase(completedWeek,lp,pg,og,comp,advanced);','base summary render');
assert(lockIndex<baseIndex,'penalty lock must start before the base result summary renders');

/* No delayed achievement is allowed to consume the queue while a blocking result UI exists. */
assert(achievement.includes('function isBlocked()'),'achievement blocker is defined');
assert(achievement.includes('globalThis.llPenaltySequenceActive'),'achievement blocker checks penalty transition lock');
assert(achievement.includes('#ll-penalty-shootout'),'achievement blocker checks visible penalty panel');
assert(achievement.includes('#ll-trophy-cinematic'),'achievement blocker checks trophy cinematic');
assert(achievement.includes('globalThis.llTryShowQueuedAchievements=function(){return next();};'),'achievement queue exposes an explicit drain function');
assert(achievement.includes('if(isBlocked()){retryLater();return false;}'),'achievement waits instead of displaying above a blocker');

/* The Continue action is the sole point that releases a shootout result into the cinematic queues. */
const releaseIndex=indexOfOrFail(penalty,'globalThis.llPenaltySequenceActive=false;','penalty release');
const postPenaltyTrophyIndex=indexOfOrFail(penalty,"const trophyShown=typeof llTryShowQueuedTrophyAnimation==='function'&&llTryShowQueuedTrophyAnimation();",'post-penalty trophy handoff');
assert(releaseIndex<postPenaltyTrophyIndex,'penalty lock must release before trophy handoff');
assert(penalty.includes("if(!trophyShown&&typeof llTryShowQueuedAchievements==='function')llTryShowQueuedAchievements();"),'achievement queue only drains if no trophy starts after penalty');

/* Trophy screens are also blockers and hand control to achievements only after Continue. */
assert(trophy.includes('#ll-achievement-cinematic'),'trophy queue treats achievement screen as blocking');
assert(trophy.includes('globalThis.llPenaltySequenceActive'),'trophy queue respects pending penalty flow');
assert(trophy.includes("if(!trophyShown&&typeof globalThis.llTryShowQueuedAchievements==='function')globalThis.llTryShowQueuedAchievements();"),'trophy Continue drains achievements only after all queued trophies');

/* Runtime check: an achievement remains queued during a shootout and opens only after release. */
const vm=require('vm');
const nodes={};
function element(tag){
  return {
    tagName:tag,id:'',className:'',innerHTML:'',style:{},
    classList:{add(){},remove(){}},
    addEventListener(){},
    querySelector(){return {addEventListener(){}};}
  };
}
const document={
  head:{appendChild(node){nodes[node.id]=node;}},
  body:{appendChild(node){nodes[node.id]=node;}},
  createElement:element,
  getElementById:id=>nodes[id]||null,
  querySelector:selector=>selector.includes('#ll-penalty-shootout')&&nodes['ll-penalty-shootout']?nodes['ll-penalty-shootout']:null
};
const context={document,console,requestAnimationFrame:callback=>callback(),window:{setTimeout(){return 1;}}};
vm.createContext(context);
vm.runInContext(achievement,context);
context.llPenaltySequenceActive=true;
context.llAchievementCinematic({name:'Finali Kazandın',description:'Test',reward:{ap:10,lp:10}});
assert(!nodes['ll-achievement-cinematic'],'achievement must not open during penalty lock');
context.llPenaltySequenceActive=false;
context.llTryShowQueuedAchievements();
assert(nodes['ll-achievement-cinematic'],'achievement opens after the penalty lock is released');

console.log('Cinematic flow ordering: 16 checks passed.');
