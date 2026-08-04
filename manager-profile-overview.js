/* Manager profile, career overview and loyalty achievements. */
(function(){
'use strict';

const VERSION=1;
const CUSTOM_ACHIEVEMENTS=[
  ['club_loyalty_3','Kulübün Adamı','Aynı kulüpte art arda 3 sezon tamamla.',50,60,(x)=>Number(x.managerCareer?.longestTenure||0)>=3,(x)=>`${Math.min(3,Number(x.managerCareer?.longestTenure||0))}/3 sezon`],
  ['club_legend_5','Kulüp Efsanesi','Aynı kulüpte art arda 5 sezon tamamla.',125,175,(x)=>Number(x.managerCareer?.longestTenure||0)>=5,(x)=>`${Math.min(5,Number(x.managerCareer?.longestTenure||0))}/5 sezon`],
  ['club_dynasty_8','Hanedanlık','Aynı kulüpte art arda 8 sezon tamamla.',225,300,(x)=>Number(x.managerCareer?.longestTenure||0)>=8,(x)=>`${Math.min(8,Number(x.managerCareer?.longestTenure||0))}/8 sezon`],
  ['club_three_trophies','Dolu Müze','Aynı kulüple en az 3 büyük kupa veya lig şampiyonluğu kazan.',100,125,(x)=>Number(x.managerCareer?.maxClubTrophies||0)>=3,(x)=>`${Math.min(3,Number(x.managerCareer?.maxClubTrophies||0))}/3 kupa`],
  ['same_season_double','Çifte Taç','Aynı sezonda lig şampiyonluğu ve yerel kupayı kazan.',175,200,(x)=>x.managerCareer?.doubleCrown===true,()=>`Lig + yerel kupa bekleniyor`],
  ['rebuild_master','Yeniden İnşa Ustası','Aynı kulübü üst lige çıkarıp daha sonraki bir sezonda üst lig şampiyonu yap.',200,225,(x)=>x.managerCareer?.rebuildMaster===true,()=>`Terfi sonrası üst lig şampiyonluğu bekleniyor`],
  ['continental_legacy','Kıtalararası Miras','Aynı kulüple üst lig şampiyonluğu ve Avrupa kupası kazan.',300,350,(x)=>x.managerCareer?.continentalLegacy===true,()=>`Aynı kulüpte lig + Avrupa kupası bekleniyor`],
  ['three_countries_manager','Dünya Gezgini','En az 3 farklı ülkede teknik direktörlük yap.',100,125,(x)=>Number(x.managerCareer?.countryCount||0)>=3,(x)=>`${Math.min(3,Number(x.managerCareer?.countryCount||0))}/3 ülke`]
].map(([id,name,description,ap,lp,check,progress])=>({id,name,description,reward:{ap,lp},check,progress}));

function num(value,fallback=0){value=Number(value);return Number.isFinite(value)?value:fallback;}
function esc(value){return typeof globalThis.llEscape==='function'?llEscape(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function arr(value){return Array.isArray(value)?value:[];}
function obj(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function unique(values){return [...new Set(arr(values).filter(Boolean))];}
function countryMeta(code){try{return globalThis.llMLCountryMeta?.(code)||{country:code,flag:'🌍'};}catch{return {country:code,flag:'🌍'};}}
function leagueLabel(code,tier){try{return globalThis.llMLLeagueLabel?.(code,tier)||(tier==='tier1'?'Üst Lig':'İkinci Lig');}catch{return tier==='tier1'?'Üst Lig':'İkinci Lig';}}
function teamCountry(team,state){try{return globalThis.llMLCountryForTeam?.(team,state)||state?.playerCountry||'TUR';}catch{return state?.playerCountry||'TUR';}}
function cupName(code){return globalThis.LL_DOMESTIC_CUP_NAMES?.[code]||`${countryMeta(code).country} Kupası`;}
function isEuropeTrophy(name){return /Şampiyonlar|Avrupa Ligi|Konferans|Champions|Europa|Conference/i.test(String(name||''));}
function isTopLeagueTitle(record){return record?.tier==='tier1'&&record?.position===1;}

function ensureCareer(state){
  if(!state)return null;
  if(!state.managerCareerOverview||typeof state.managerCareerOverview!=='object')state.managerCareerOverview={version:VERSION,seasons:[],createdAt:new Date().toISOString(),migrated:false};
  const career=state.managerCareerOverview;
  if(!Array.isArray(career.seasons))career.seasons=[];
  career.version=VERSION;
  if(!career.migrated)migrateArchive(state,career);
  syncStats(state,career);
  return career;
}

function inferHistoricalTeam(state,season){
  const changes=[...arr(state.managerProfile?.history)].filter(item=>Number.isFinite(Number(item?.season))).sort((a,b)=>num(a.season)-num(b.season));
  const exact=changes.find(item=>num(item.season)===num(season));
  if(exact?.from)return exact.from;
  const prior=changes.filter(item=>num(item.season)<num(season)).at(-1);
  if(prior?.to)return prior.to;
  if(changes[0]?.from)return changes[0].from;
  return state.playerTeam||state.managerProfile?.currentTeam||'Bilinmeyen Kulüp';
}

function archivedCountrySummary(entry,code){
  if(entry?.countrySummaries?.[code])return entry.countrySummaries[code];
  if((entry?.country||'TUR')===code)return {tier1Rows:entry.tier1Rows||entry.superRows||[],tier2Rows:entry.tier2Rows||entry.firstRows||[],cupWinner:entry.cupWinner||null,promoted:entry.promoted||[],relegated:entry.relegated||[],qualifications:entry.qualifications||{ucl:[],uel:[],uecl:[]}};
  return null;
}

function seasonRecord(state,summary,team,source='live'){
  const season=num(summary?.season,state?.season||1);
  const country=summary?.country||teamCountry(team,state);
  const info=archivedCountrySummary(summary,country)||summary||{};
  const tier1=info.tier1Rows||summary?.superRows||[];
  const tier2=info.tier2Rows||summary?.firstRows||[];
  let tier='tier1',rows=tier1,row=tier1.find(item=>item.team===team);
  if(!row){tier='tier2';rows=tier2;row=tier2.find(item=>item.team===team);}
  const position=num(row?.position,rows.findIndex(item=>item.team===team)+1);
  const trophies=unique(arr(state.trophies).filter(item=>num(item?.season)===season).map(item=>item?.name));
  const leagueChampion=position===1;
  const domesticCupWon=info?.cupWinner===team;
  const promoted=(info?.promoted||summary?.promoted||[]).includes(team);
  const relegated=(info?.relegated||summary?.relegated||[]).includes(team);
  const honors=[];
  if(leagueChampion)honors.push(`${leagueLabel(country,tier)} Şampiyonluğu`);
  if(domesticCupWon)honors.push(cupName(country));
  trophies.forEach(name=>honors.push(name));
  const qualifications=info?.qualifications||summary?.qualifications||{};
  const euro=Object.entries({ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'}).find(([key])=>(qualifications[key]||[]).includes(team));
  const market=state.managerMarket&&num(state.managerMarket.season)===season?state.managerMarket:null;
  return {
    version:VERSION,source,season,team,country,tier,
    leagueLabel:leagueLabel(country,tier),position,teamCount:rows.length,
    P:num(row?.P),W:num(row?.W),D:num(row?.D),L:num(row?.L),GF:num(row?.GF),GA:num(row?.GA),GD:num(row?.GD),Pts:num(row?.Pts),
    winRate:num(row?.P)?Math.round(num(row?.W)/num(row?.P)*1000)/10:0,
    primaryAchieved:market?!!market.primaryAchieved:null,
    goalsDone:market?num(market.goalsDone):null,goalsTotal:market?num(market.goalsTotal):null,
    promoted,relegated,leagueChampion,domesticCupWon,europeQualification:euro?.[1]||null,
    europeTrophy:trophies.some(isEuropeTrophy),trophies:unique(honors),
    capturedAt:new Date().toISOString()
  };
}

function migrateArchive(state,career){
  const archives=[...arr(state.seasonHistory)].sort((a,b)=>num(a.season)-num(b.season));
  archives.forEach(entry=>{
    const season=num(entry?.season);
    if(!season||career.seasons.some(item=>num(item.season)===season))return;
    const team=entry.playerTeam||inferHistoricalTeam(state,season);
    career.seasons.push(seasonRecord(state,entry,team,'archive'));
  });
  career.seasons.sort((a,b)=>num(a.season)-num(b.season));
  career.migrated=true;
  career.migratedAt=new Date().toISOString();
}

function aggregateCareer(career){
  const seasons=[...arr(career?.seasons)].sort((a,b)=>num(a.season)-num(b.season));
  const clubs={};
  let longestTenure=0,currentTenure=0,currentTenureTeam=null,streak=0,previousTeam=null,previousSeason=null,doubleCrown=false,rebuildMaster=false,continentalLegacy=false;
  seasons.forEach(record=>{
    const club=clubs[record.team]||(clubs[record.team]={team:record.team,country:record.country,seasons:[],P:0,W:0,D:0,L:0,GF:0,GA:0,trophies:[],promotions:0,relegations:0,topLeagueTitles:0,europeTitles:0});
    club.seasons.push(record.season);['P','W','D','L','GF','GA'].forEach(key=>club[key]+=num(record[key]));
    club.trophies.push(...(record.trophies||[]).map(name=>({season:record.season,name})));
    if(record.promoted)club.promotions++;
    if(record.relegated)club.relegations++;
    if(isTopLeagueTitle(record))club.topLeagueTitles++;
    if(record.europeTrophy)club.europeTitles++;
    if(record.leagueChampion&&record.domesticCupWon)doubleCrown=true;
    if(record.team===previousTeam&&num(record.season)===num(previousSeason)+1)streak++;else streak=1;
    if(streak>longestTenure)longestTenure=streak;
    previousTeam=record.team;previousSeason=record.season;currentTenure=streak;currentTenureTeam=record.team;
  });
  Object.values(clubs).forEach(club=>{
    club.trophies=club.trophies.filter((item,index,list)=>list.findIndex(other=>other.season===item.season&&other.name===item.name)===index);
    const clubRecords=seasons.filter(record=>record.team===club.team);
    const promotedSeason=Math.min(...clubRecords.filter(record=>record.promoted).map(record=>record.season));
    if(Number.isFinite(promotedSeason)&&clubRecords.some(record=>record.season>promotedSeason&&isTopLeagueTitle(record)))rebuildMaster=true;
    if(club.topLeagueTitles>0&&club.europeTitles>0)continentalLegacy=true;
  });
  const countries=unique(seasons.map(record=>record.country));
  const total=seasons.reduce((sum,record)=>{['P','W','D','L','GF','GA'].forEach(key=>sum[key]+=num(record[key]));return sum;},{P:0,W:0,D:0,L:0,GF:0,GA:0});
  const allTrophies=Object.values(clubs).flatMap(club=>club.trophies.map(item=>({...item,team:club.team})));
  return {seasons,clubs,total,allTrophies,longestTenure,currentTenure,currentTenureTeam,doubleCrown,rebuildMaster,continentalLegacy,countries,maxClubTrophies:Math.max(0,...Object.values(clubs).map(club=>club.trophies.length))};
}

function syncStats(state,career=state?.managerCareerOverview){
  if(!state)return null;
  if(!state.achievementStats||typeof state.achievementStats!=='object')state.achievementStats={seasons:{},starMilestones:{}};
  const aggregate=aggregateCareer(career);
  state.achievementStats.managerCareer={
    completedSeasons:aggregate.seasons.length,longestTenure:aggregate.longestTenure,currentTenure:aggregate.currentTenure,currentTenureTeam:aggregate.currentTenureTeam,
    maxClubTrophies:aggregate.maxClubTrophies,doubleCrown:aggregate.doubleCrown,rebuildMaster:aggregate.rebuildMaster,continentalLegacy:aggregate.continentalLegacy,
    countryCount:aggregate.countries.length,clubCount:Object.keys(aggregate.clubs).length
  };
  career.summary={...state.achievementStats.managerCareer,total:aggregate.total,trophyCount:aggregate.allTrophies.length};
  return aggregate;
}

function captureSeason(state,summary){
  if(!state||!summary)return null;
  const career=ensureCareer(state),season=num(summary.season),team=summary.playerTeam||state.managerMarket?.fromTeam||state.playerTeam;
  const record=seasonRecord(state,summary,team,'live');
  const index=career.seasons.findIndex(item=>num(item.season)===season);
  if(index>=0)career.seasons[index]=record;else career.seasons.push(record);
  career.seasons.sort((a,b)=>num(a.season)-num(b.season));
  career.lastCapturedSeason=season;
  syncStats(state,career);
  return record;
}

globalThis.llEnsureManagerCareerOverview=ensureCareer;
globalThis.llManagerProfileCaptureSeason=captureSeason;
globalThis.llManagerCareerAggregate=function(state=globalThis.lexLeague?.state){const career=ensureCareer(state);return career?aggregateCareer(career):null;};

function registerAchievements(){
  const list=globalThis.LL_ACHIEVEMENTS;
  if(!Array.isArray(list))return;
  CUSTOM_ACHIEVEMENTS.forEach(item=>{if(!list.some(existing=>existing.id===item.id))list.push(item);});
}

function evaluateHistoricalCustom(state){
  if(!state)return [];
  registerAchievements();ensureCareer(state);
  if(!state.achievements||typeof state.achievements!=='object')state.achievements={version:2,unlocked:{}};
  if(!state.achievements.unlocked||typeof state.achievements.unlocked!=='object')state.achievements.unlocked={};
  const unlocked=[];
  CUSTOM_ACHIEVEMENTS.forEach(item=>{
    if(state.achievements.unlocked[item.id]||!item.check(state.achievementStats,state))return;
    state.achievements.unlocked[item.id]={season:state.season,team:state.playerTeam,at:new Date().toISOString(),source:'career-migration',reward:{...item.reward}};
    state.ap=num(state.ap)+num(item.reward.ap);state.lp=num(state.lp)+num(item.reward.lp);unlocked.push(item);
  });
  return unlocked;
}

function managerStatus(reputation,aggregate){
  if(aggregate.longestTenure>=8)return 'Hanedanlık Kurucusu';
  if(aggregate.longestTenure>=5)return 'Kulüp Efsanesi';
  if(reputation>=90)return 'Dünya Çapında Hoca';
  if(reputation>=80)return 'Elit Teknik Direktör';
  if(reputation>=65)return 'Üst Düzey Teknik Direktör';
  if(reputation>=50)return 'Saygın Teknik Direktör';
  if(reputation>=30)return 'Gelişen Teknik Direktör';
  return 'Yerel Teknik Direktör';
}
function goalText(record){if(record.primaryAchieved===null)return 'Arşiv verisi';return record.primaryAchieved?'✓ Başarıldı':'✕ Kaçırıldı';}
function resultBadges(record){const items=[];if(record.leagueChampion)items.push('🏆 Lig şampiyonu');if(record.domesticCupWon)items.push('🏆 Yerel kupa');if(record.europeTrophy)items.push('🌍 Avrupa kupası');if(record.promoted)items.push('⬆ Terfi');if(record.relegated)items.push('⬇ Küme düşme');if(record.europeQualification)items.push(`✈ ${record.europeQualification}`);return items.length?items.join(' · '):'Özel başarı yok';}
function trophyIcon(name){return isEuropeTrophy(name)?'🌍':/Lig|League|Bundesliga|Ligue|Serie|Eredivisie|Şampiyonluğu/i.test(name)?'👑':'🏆';}
function backAction(state){return state?.seasonEnded?'llRenderSeasonEnd()':'llRenderDashboard()';}
function nav(tab){return `<div class="ll-profile-tabs"><button class="ll-btn ${tab==='overview'?'primary':''}" onclick="llRenderManagerProfile('overview')">Genel Bakış</button><button class="ll-btn ${tab==='seasons'?'primary':''}" onclick="llRenderManagerProfile('seasons')">Sezonlar</button><button class="ll-btn ${tab==='clubs'?'primary':''}" onclick="llRenderManagerProfile('clubs')">Kulüpler</button><button class="ll-btn ${tab==='trophies'?'primary':''}" onclick="llRenderManagerProfile('trophies')">Kupa Odası</button></div>`;}

function overviewHtml(state,aggregate){
  const recent=[...aggregate.seasons].sort((a,b)=>b.season-a.season).slice(0,4);
  const clubs=Object.values(aggregate.clubs).sort((a,b)=>b.seasons.length-a.seasons.length||b.trophies.length-a.trophies.length).slice(0,4);
  const unlocked=Object.entries(obj(state.achievements?.unlocked)).sort((a,b)=>num(b[1]?.season)-num(a[1]?.season)).slice(0,6);
  return `<div class="ll-profile-overview-grid"><div class="ll-card"><div class="ll-card-title">Son Sezonlar</div><div class="ll-profile-season-cards">${recent.length?recent.map(record=>`<div class="ll-profile-mini-season"><b>S${record.season} · ${esc(record.team)}</b><span>${esc(record.leagueLabel)} · ${record.position||'—'}/${record.teamCount||'—'}</span><span>${record.W}G ${record.D}B ${record.L}M · %${record.winRate}</span><small>${esc(resultBadges(record))}</small></div>`).join(''):'<div class="ll-muted">Henüz tamamlanmış sezon yok.</div>'}</div><button class="ll-btn" style="margin-top:12px" onclick="llRenderManagerProfile('seasons')">Tüm Sezonları Aç</button></div><div class="ll-card"><div class="ll-card-title">Kulüp Kariyeri</div><div class="ll-profile-club-list">${clubs.map(club=>`<div class="ll-profile-club-row"><span>${typeof globalThis.llTeamLogo==='function'?llTeamLogo(club.team,'table'):''}</span><div><b>${esc(club.team)}</b><small>${club.seasons.length} sezon · ${club.trophies.length} kupa · ${club.W} galibiyet</small></div></div>`).join('')||'<div class="ll-muted">Kulüp geçmişi oluşmadı.</div>'}</div><button class="ll-btn" style="margin-top:12px" onclick="llRenderManagerProfile('clubs')">Kulüp Detayları</button></div></div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Son Açılan Başarımlar</div><div class="ll-profile-achievements">${unlocked.length?unlocked.map(([id,data])=>{const item=arr(globalThis.LL_ACHIEVEMENTS).find(a=>a&&a.id===id);return `<div><span>🏅</span><b>${esc(item?.name||id)}</b><small>S${num(data?.season)} · ${esc(data?.team||'Kariyer')}</small></div>`;}).join(''):'<div class="ll-muted">Henüz açılan başarım yok.</div>'}</div><button class="ll-btn" style="margin-top:12px" onclick="llRenderAchievements()">Tüm Başarımlar</button></div>`;
}
function seasonsHtml(aggregate){return `<div class="ll-card"><div class="ll-card-title">Sezon Sezon Kariyer Özeti</div><div class="ll-table-wrap"><table class="ll-table ll-profile-table"><thead><tr><th>Sezon</th><th>Kulüp</th><th>Lig</th><th>Sıra</th><th>O</th><th>G-B-M</th><th>Puan</th><th>Galibiyet</th><th>Hedef</th><th>Sezon Özeti</th></tr></thead><tbody>${[...aggregate.seasons].sort((a,b)=>b.season-a.season).map(record=>`<tr><td><b>S${record.season}</b></td><td><span class="ll-standing-team">${typeof globalThis.llTeamLogo==='function'?llTeamLogo(record.team,'table'):''}<span>${esc(record.team)}</span></span></td><td>${countryMeta(record.country).flag} ${esc(record.leagueLabel)}</td><td>${record.position||'—'}/${record.teamCount||'—'}</td><td>${record.P}</td><td>${record.W}-${record.D}-${record.L}</td><td>${record.Pts}</td><td>%${record.winRate}</td><td>${esc(goalText(record))}</td><td>${esc(resultBadges(record))}</td></tr>`).join('')||'<tr><td colspan="10">Henüz tamamlanmış sezon yok.</td></tr>'}</tbody></table></div></div>`;}
function clubsHtml(aggregate){return `<div class="ll-profile-club-grid">${Object.values(aggregate.clubs).sort((a,b)=>b.seasons.length-a.seasons.length||b.trophies.length-a.trophies.length).map(club=>{const rate=club.P?Math.round(club.W/club.P*1000)/10:0;return `<div class="ll-card ll-profile-club-card"><div class="ll-profile-club-head"><div>${typeof globalThis.llTeamLogo==='function'?llTeamLogo(club.team,'match'):''}</div><div><div class="ll-team-name">${esc(club.team)}</div><div class="ll-sub">${countryMeta(club.country).flag} ${esc(countryMeta(club.country).country)} · S${Math.min(...club.seasons)}–S${Math.max(...club.seasons)}</div></div></div><div class="ll-metrics ll-profile-club-metrics"><div class="ll-metric"><strong>${club.seasons.length}</strong><span>Sezon</span></div><div class="ll-metric"><strong>${club.W}</strong><span>Galibiyet</span></div><div class="ll-metric"><strong>%${rate}</strong><span>Oran</span></div><div class="ll-metric"><strong>${club.trophies.length}</strong><span>Kupa</span></div></div><div class="ll-sub">${club.promotions?`⬆ ${club.promotions} terfi · `:''}${club.topLeagueTitles?`👑 ${club.topLeagueTitles} üst lig şampiyonluğu · `:''}${club.europeTitles?`🌍 ${club.europeTitles} Avrupa kupası · `:''}${club.relegations?`⬇ ${club.relegations} küme düşme`:''}</div></div>`;}).join('')||'<div class="ll-notice">Henüz kulüp kariyeri kaydı yok.</div>'}</div>`;}
function trophiesHtml(state,aggregate){
  const customIds=new Set(CUSTOM_ACHIEVEMENTS.map(item=>item.id));
  return `<div class="ll-card"><div class="ll-card-title">Kupa ve Şampiyonluk Odası</div><div class="ll-profile-trophy-grid">${aggregate.allTrophies.length?aggregate.allTrophies.sort((a,b)=>b.season-a.season).map(item=>`<div class="ll-profile-trophy"><span>${trophyIcon(item.name)}</span><div><b>${esc(item.name)}</b><small>S${item.season} · ${esc(item.team)}</small></div></div>`).join(''):'<div class="ll-muted">Henüz kazanılmış kupa veya lig şampiyonluğu yok.</div>'}</div></div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Sadakat ve Teknik Direktörlük Başarımları</div><div class="ll-achievement-grid">${CUSTOM_ACHIEVEMENTS.map(item=>{const done=state.achievements?.unlocked?.[item.id];return `<div class="ll-achievement-card ${done?'done':''}"><div class="ll-achievement-card-head"><span>${done?'🏆':'🔒'}</span><b>${esc(item.name)}</b></div><div class="ll-sub">${esc(item.description)}</div><div class="ll-achievement-progress">${done?`Açıldı · S${num(done.season)} · ${esc(done.team||'Kariyer')}`:esc(item.progress(state.achievementStats,state))}</div><div class="ll-achievement-reward">+${item.reward.ap} AP · +${item.reward.lp} LP</div></div>`;}).join('')}</div></div>`;
}

globalThis.llRenderManagerProfile=function(tab='overview'){
  const state=globalThis.lexLeague?.state;
  const area=typeof globalThis.llArea==='function'?globalThis.llArea():null;
  if(!state||!area)return false;
  try{
    registerAchievements();
    const career=ensureCareer(state),aggregate=aggregateCareer(career),profile=(typeof globalThis.llManagerProfile==='function'?globalThis.llManagerProfile(state):null)||obj(state.managerProfile)||{reputation:50};
    const reputation=Math.max(0,Math.min(100,num(profile.reputation,50))),status=managerStatus(reputation,aggregate),currentTeam=state.playerTeam||profile.currentTeam||'—',winRate=aggregate.total.P?Math.round(aggregate.total.W/aggregate.total.P*1000)/10:0;
    const unlockedCount=Object.keys(obj(state.achievements?.unlocked)).length,totalAchievements=arr(globalThis.LL_ACHIEVEMENTS).length;
    const safeTab=['overview','seasons','clubs','trophies'].includes(tab)?tab:'overview';
    const content=safeTab==='seasons'?seasonsHtml(aggregate):safeTab==='clubs'?clubsHtml(aggregate):safeTab==='trophies'?trophiesHtml(state,aggregate):overviewHtml(state,aggregate);
    globalThis.llSetWide?.(true);
    area.innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Hoca <em>Profili</em></div><div class="ll-muted">Kariyer geçmişi, sezon karneleri, kulüp mirası ve kupa odası</div></div><button class="ll-btn" onclick="${backAction(state)}">← Geri</button></div><div class="ll-profile-hero"><div class="ll-profile-avatar">🧥</div><div class="ll-profile-identity"><span class="ll-rarity">${esc(status)}</span><h2>Teknik Direktör Profili</h2><div class="ll-profile-current">${typeof globalThis.llTeamLogo==='function'?llTeamLogo(currentTeam,'table'):''}<b>${esc(currentTeam)}</b><span>${countryMeta(state.playerCountry||teamCountry(currentTeam,state)).flag} ${esc(countryMeta(state.playerCountry||teamCountry(currentTeam,state)).country)}</span></div></div><div class="ll-profile-reputation"><strong>${reputation}</strong><span>İtibar / 100</span><div><i style="width:${reputation}%"></i></div></div></div><div class="ll-metrics ll-profile-main-metrics"><div class="ll-metric"><strong>${aggregate.seasons.length}</strong><span>Tamamlanan Sezon</span></div><div class="ll-metric"><strong>${Object.keys(aggregate.clubs).length}</strong><span>Çalışılan Kulüp</span></div><div class="ll-metric"><strong>${aggregate.allTrophies.length}</strong><span>Kupa ve Şampiyonluk</span></div><div class="ll-metric"><strong>${aggregate.total.W}</strong><span>Lig Galibiyeti</span></div><div class="ll-metric"><strong>%${winRate}</strong><span>Lig Galibiyet Oranı</span></div><div class="ll-metric"><strong>${unlockedCount}/${totalAchievements}</strong><span>Başarım</span></div></div>${nav(safeTab)}${content}</div></div>`;
    return true;
  }catch(error){
    console.error('[Hoca Profili] Açılış hatası:',error);
    area.innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Hoca <em>Profili</em></div><div class="ll-muted">Eski kayıt verileri güvenli biçimde hazırlanamadı.</div></div><button class="ll-btn" onclick="${backAction(state)}">← Geri</button></div><div class="ll-notice"><b>Profil açılırken bir kayıt uyumluluğu sorunu oluştu.</b><br>Oyununuz silinmedi. Ana ekrana dönüp kaydı bir kez yenileyin. Teknik ayrıntı: ${esc(error?.message||error)}</div></div></div>`;
    return false;
  }
};

function injectStyles(){if(typeof document==='undefined'||document.getElementById('ll-manager-profile-styles'))return;const style=document.createElement('style');style.id='ll-manager-profile-styles';style.textContent=`
.ll-profile-hero{display:grid;grid-template-columns:auto 1fr minmax(170px,230px);gap:18px;align-items:center;padding:20px;margin:15px 0;border:1px solid rgba(94,234,212,.32);border-radius:18px;background:radial-gradient(circle at 12% 20%,rgba(45,212,191,.18),transparent 36%),linear-gradient(135deg,rgba(15,23,42,.96),rgba(30,41,59,.78))}.ll-profile-avatar{width:78px;height:78px;border-radius:22px;display:grid;place-items:center;font-size:42px;background:rgba(2,6,23,.65);border:1px solid rgba(250,204,21,.35)}.ll-profile-identity h2{margin:4px 0 8px;font-size:27px}.ll-profile-current{display:flex;align-items:center;gap:8px;color:#cbd5e1}.ll-profile-current img{width:28px;height:28px}.ll-profile-current span{font-size:12px;color:#94a3b8}.ll-profile-reputation{text-align:center;padding:13px;border-radius:14px;background:rgba(2,6,23,.48)}.ll-profile-reputation strong{display:block;font-size:34px;color:#fde68a}.ll-profile-reputation span{font-size:11px;color:#94a3b8}.ll-profile-reputation div{height:7px;border-radius:999px;background:rgba(148,163,184,.18);overflow:hidden;margin-top:9px}.ll-profile-reputation i{display:block;height:100%;background:linear-gradient(90deg,#2dd4bf,#facc15);border-radius:inherit}.ll-profile-main-metrics{grid-template-columns:repeat(6,minmax(110px,1fr))}.ll-profile-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.ll-profile-overview-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}.ll-profile-season-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ll-profile-mini-season{padding:11px;border-radius:11px;border:1px solid rgba(148,163,184,.2);background:rgba(2,6,23,.34);display:flex;flex-direction:column;gap:4px}.ll-profile-mini-season span,.ll-profile-mini-season small{font-size:11px;color:#94a3b8}.ll-profile-mini-season small{color:#5eead4}.ll-profile-club-list{display:flex;flex-direction:column;gap:8px}.ll-profile-club-row{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;padding:8px;border-radius:10px;background:rgba(2,6,23,.34)}.ll-profile-club-row img{width:30px;height:30px}.ll-profile-club-row small{display:block;color:#94a3b8;margin-top:2px}.ll-profile-achievements{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px}.ll-profile-achievements>div{display:grid;grid-template-columns:auto 1fr;column-gap:8px;padding:10px;border:1px solid rgba(250,204,21,.22);border-radius:10px;background:rgba(250,204,21,.06)}.ll-profile-achievements small{grid-column:2;color:#94a3b8}.ll-profile-table{min-width:1180px}.ll-profile-club-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:13px}.ll-profile-club-head{display:flex;gap:12px;align-items:center}.ll-profile-club-head img{width:58px;height:58px}.ll-profile-club-metrics{grid-template-columns:repeat(4,1fr);margin:13px 0}.ll-profile-club-metrics .ll-metric{padding:9px 6px}.ll-profile-trophy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.ll-profile-trophy{display:flex;gap:12px;align-items:center;padding:13px;border-radius:12px;border:1px solid rgba(250,204,21,.3);background:linear-gradient(135deg,rgba(250,204,21,.1),rgba(15,23,42,.35))}.ll-profile-trophy>span{font-size:32px}.ll-profile-trophy small{display:block;color:#94a3b8;margin-top:3px}@media(max-width:900px){.ll-profile-main-metrics{grid-template-columns:repeat(3,1fr)}.ll-profile-overview-grid{grid-template-columns:1fr}.ll-profile-hero{grid-template-columns:auto 1fr}.ll-profile-reputation{grid-column:1/-1}.ll-profile-season-cards{grid-template-columns:1fr}}@media(max-width:560px){.ll-profile-hero{grid-template-columns:1fr;text-align:center}.ll-profile-avatar{margin:auto}.ll-profile-current{justify-content:center;flex-wrap:wrap}.ll-profile-main-metrics{grid-template-columns:repeat(2,1fr)}.ll-profile-tabs .ll-btn{flex:1 1 44%}.ll-profile-club-grid{grid-template-columns:1fr}}
`;document.head.appendChild(style);}

function injectProfileButton(){
  if(typeof document==='undefined'||typeof globalThis.llArea!=='function')return;
  const root=llArea(),topbar=root?.querySelector?.('.ll-topbar');if(!topbar||topbar.querySelector('[data-manager-profile]'))return;
  let actions=topbar.querySelector('.ll-actions');if(!actions){actions=document.createElement('div');actions.className='ll-actions';topbar.appendChild(actions);}
  actions.insertAdjacentHTML('beforeend','<button class="ll-btn" data-manager-profile onclick="llRenderManagerProfile(\'overview\')">Hoca Profili</button>');
}
function wrapRender(name){const base=globalThis[name];if(typeof base!=='function'||base.__managerProfileOverview)return;const wrapped=function(){const result=base.apply(this,arguments);injectProfileButton();return result;};wrapped.__managerProfileOverview=true;globalThis[name]=wrapped;}

function install(){
  injectStyles();registerAchievements();
  ['llRenderDashboard','llRenderSeasonEnd','llRenderManagerMarket','llRenderVacantManagerJobs','llRenderAchievements','llRenderSeasonArchive'].forEach(wrapRender);
  const state=globalThis.lexLeague?.state;if(state){const newUnlocks=evaluateHistoricalCustom(state);if(newUnlocks.length&&typeof globalThis.llSave==='function')llSave();injectProfileButton();}
}
install();
})();
