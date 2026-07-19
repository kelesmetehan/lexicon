const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'outputs','lexicon-fixed.html'),'utf8');
const league=fs.readFileSync(path.join(root,'outputs','league-v2.js'),'utf8');
const manager=fs.readFileSync(path.join(root,'outputs','manager-market.js'),'utf8');

new Function(league);
new Function(manager);
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim())new Function(match[1]);
}

assert(league.includes("llShowPackOpening('elite',pending.offers"),'Elite package must launch the cinematic with saved offers.');
assert(html.includes("llShowPackOpening('regular',pending.offers"),'Regular package must launch the cinematic with saved offers.');
assert(html.includes('s.pendingRegularPack=pending'),'Regular offers must be persisted before the cinematic.');
assert(league.includes('regularPending=s.pendingRegularPack'),'The shop must restore a pending regular package.');
assert(league.includes('packPending=!!(pending||regularPending)'),'A second package must be blocked while a choice is pending.');
assert(league.includes('function llSkipPackAnimation()'),'The cinematic must have a separate animation-skip action.');
assert(league.includes('function llDiscardOpenedPack()'),'Discarding a paid package must be a separate confirmed action.');
assert(league.includes("runtime.mode==='elite'"),'Elite and regular reveal behavior must remain distinct.');
assert(manager.includes('llShowManagerSigning(target,staying,fromTeam)'),'A real manager choice must launch the signing presentation.');
assert(manager.includes('target.targetLabel')&&manager.includes('target.europe')&&manager.includes('target.position'),'Signing details must include target, Europe and last position.');
assert(manager.indexOf('llSave();llRenderSeasonEnd();requestAnimationFrame')>manager.indexOf("market.status='chosen'"),'The manager choice must be saved before animation starts.');
assert(html.includes('@media(max-width:600px)')&&html.includes('scroll-snap-type:x mandatory'),'Two cards must remain usable on mobile.');
assert(html.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion behavior must be present.');
assert(html.includes('league-v2.js?v=20260719-2')&&html.includes('manager-market.js?v=20260719-1'),'Script cache versions must be updated.');
console.log('Presentation flows: 14 checks passed.');