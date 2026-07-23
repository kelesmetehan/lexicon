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
assert(html.includes('league-v2.js?v=20260723-2')&&html.includes('save-backup-hardening.js?v=20260721-2')&&html.includes('manager-market.js?v=20260719-1'),'Script cache versions must be updated.');
assert(league.includes('Bu Kariyeri Dışa Aktar'),'Single-career export must be explicitly labelled.');
assert(league.includes('Tam Yedek İndir (Her Şey)'),'Full backup must be explicitly labelled.');
assert(league.includes('Kelimeler dahil değildir'),'Single-career export scope must be explained.');
assert(league.includes('mevcut tüm kariyer ve kelime verilerini değiştirir'),'Full import overwrite risk must be explicit.');assert(league.includes('function llPaidPremiumPackUsed(state)'),'Paid elite use must be derived from paid package history.');
assert(league.includes("item?.source==='paid'"),'A free objective pack must not consume the paid elite allowance.');
assert(league.includes("'Dashboarda Dön'")&&league.includes("'Sezon Bilgileri'"),'Mid-season season information must not offer to start the season again.');
assert(league.includes('function llV10RecentFormHtml(name,count=5)')&&league.includes('llV10RecentFormHtml(name,5)')&&league.includes('Son ${count}')&&league.includes("symbol=gf>ga?'G':gf===ga?'B':'M'"),'Dashboard must show both teams last five official results as G/B/M.');
assert(html.includes('function llOfficialTeamResults')&&html.includes("['league','cup','playoff','ucl','uel','uecl']"),'Hat-trick form and dashboard form must share every official competition.');
const paidHelperSource=league.match(/function llPaidPremiumPackUsed\(state\)\{[^}]+\}/)?.[0];
assert(paidHelperSource,'Paid elite helper source must be available.');
const paidHelper=new Function(`${paidHelperSource};return llPaidPremiumPackUsed;`)();
assert.strictEqual(paidHelper({season:4,premiumPackHistory:[{season:4,source:'voucher'}]}),false,'A free objective pack must leave the paid package available.');
assert.strictEqual(paidHelper({season:4,premiumPackHistory:[{season:4,source:'paid'}]}),true,'A paid package in the same season must consume the allowance.');
console.log('Presentation flows: 25 checks passed.');