'use strict';

/* Multi-country domestic league engine.
 * Serialized saves use {COUNTRY:{tier1,tier2}} exclusively. Non-enumerable
 * super/first/cup accessors are a runtime-only bridge for the proven match UI.
 */
var LL_MULTI_LEAGUE_ENGINE_VERSION=1;
var LL_COUNTRY_CODES=['TUR','ENG','GER','ESP','FRA','ITA','NED'];
var LL_MULTI_MANAGER_OFFER_COUNT=5; // Five exposes several countries without an 8+ choice wall.

function llMLCountryMeta(country){return LL_COUNTRY_META[country]||LL_COUNTRY_META.TUR;}
function llMLLeagueMeta(country,tier){return LL_LEAGUE_META?.[country]?.[tier]||{label:tier==='tier1'?'1. Lig':'2. Lig',promoteDirect:2,promotePlayoff:1,playoffFrom:3,playoffTo:7,relegate:3,teamCount:0,seasonGoalThresholds:{top40:.4,top50:.5,top75:.75}};}
function llMLLeagueLabel(country,tier){return llMLLeagueMeta(country,tier).label;}
function llMLTeamCompetition(name,state=lexLeague?.state){
  const canonical=typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name;
  for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1','tier2'])if(state?.leagues?.[country]?.[tier]?.includes(canonical)||LL_TEAM_REGISTRY?.[canonical]?.country===country&&LL_TEAM_REGISTRY[canonical].tier===tier)return {country,tier};
  return null;
}
function llMLCountryForTeam(name,state=lexLeague?.state){return llMLTeamCompetition(name,state)?.country||LL_TEAM_REGISTRY?.[name]?.country||null;}
function llMLTierForTeam(name,state=lexLeague?.state){return llMLTeamCompetition(name,state)?.tier||LL_TEAM_REGISTRY?.[name]?.tier||null;}
function llMLTeamState(def){
  const stars=Math.max(1,Math.min(6,Number(def?.stars)||1));
  return {name:def.name,stars,cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,aiLp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};
}
function llMLCloneLeaguePools(){const out={};for(const country of LL_COUNTRY_CODES)out[country]={tier1:(LL_TIER1_POOLS[country]||[]).map(team=>team.name),tier2:(LL_TIER2_POOLS[country]||[]).map(team=>team.name)};return out;}
function llMLNextPowerOfTwo(value){let size=1;while(size<Math.max(2,Number(value)||2))size*=2;return size;}
function llMLCreateCup(state,country){
  const domestic=llShuffle([...(state.leagues[country]?.tier1||[]),...(state.leagues[country]?.tier2||[])]),bracket=llMLNextPowerOfTwo(domestic.length),preliminaryCount=Math.max(0,2*(domestic.length-bracket/2)),preliminary=domestic.slice(0,preliminaryCount),byes=domestic.slice(preliminaryCount),field=[...preliminary,...byes.flatMap(team=>[team,null])];
  return {country,name:LL_DOMESTIC_CUP_NAMES[country],round:0,field,alive:country===state.playerCountry,winner:null,pending:null,formatVersion:3,bracketSize:bracket,preliminaryTeamCount:preliminaryCount,history:{0:[...field]}};
}
function llMLAttachLegacyAliases(state){
  if(!state)return state;const country=LL_COUNTRY_CODES.includes(state.playerCountry)?state.playerCountry:'TUR';state.playerCountry=country;
  const alias=(object,key,get,set)=>{try{delete object[key];Object.defineProperty(object,key,{configurable:true,enumerable:false,get,set});}catch{}};
  alias(state.leagues,'super',()=>state.leagues[country].tier1,value=>{state.leagues[country].tier1=value;});
  alias(state.leagues,'first',()=>state.leagues[country].tier2,value=>{state.leagues[country].tier2=value;});
  alias(state.standings,'super',()=>state.standings[country].tier1,value=>{state.standings[country].tier1=value;});
  alias(state.standings,'first',()=>state.standings[country].tier2,value=>{state.standings[country].tier2=value;});
  alias(state.schedules,'super',()=>state.schedules[country].tier1,value=>{state.schedules[country].tier1=value;});
  alias(state.schedules,'first',()=>state.schedules[country].tier2,value=>{state.schedules[country].tier2=value;});
  alias(state,'cup',()=>state.cups[country],value=>{state.cups[country]=value;});return state;
}
function llMLMigrateNested(value,oldA,oldB){
  if(value?.TUR?.tier1&&value?.TUR?.tier2)return value;
  const first=Array.isArray(value?.[oldA])?value[oldA]:null,second=Array.isArray(value?.[oldB])?value[oldB]:null;
  return {TUR:{tier1:first||[],tier2:second||[]}};
}
function llMLMigrateNestedObjects(value,oldA,oldB){
  if(value?.TUR?.tier1&&value?.TUR?.tier2)return value;
  return {TUR:{tier1:value?.[oldA]&&typeof value[oldA]==='object'?value[oldA]:{},tier2:value?.[oldB]&&typeof value[oldB]==='object'?value[oldB]:{}}};
}
function llMLMigrateNestedSchedules(value){
  if(value?.TUR?.tier1&&value?.TUR?.tier2)return value;
  return {TUR:{tier1:Array.isArray(value?.super)?value.super:[],tier2:Array.isArray(value?.first)?value.first:[]}};
}
function llMLNormalizeState(state){
  if(!state)return state;
  const legacyCup=state.cup&&!state.cups?state.cup:null;
  state.leagues=llMLMigrateNested(state.leagues,'super','first');
  state.standings=llMLMigrateNestedObjects(state.standings,'super','first');
  state.schedules=llMLMigrateNestedSchedules(state.schedules);
  state.cups=state.cups&&typeof state.cups==='object'?state.cups:{};if(legacyCup&&!state.cups.TUR)state.cups.TUR=legacyCup;
  const inferred=llMLCountryForTeam(state.playerTeam,{leagues:state.leagues})||LL_TEAM_REGISTRY?.[state.playerTeam]?.country||state.playerCountry||'TUR';state.playerCountry=LL_COUNTRY_CODES.includes(inferred)?inferred:'TUR';
  const initial=llMLCloneLeaguePools();
  for(const country of LL_COUNTRY_CODES){
    if(!state.leagues[country])state.leagues[country]=initial[country];
    for(const tier of ['tier1','tier2']){
      if(!Array.isArray(state.leagues[country][tier])||!state.leagues[country][tier].length)state.leagues[country][tier]=[...initial[country][tier]];
      if(!state.standings[country])state.standings[country]={};
      const names=state.leagues[country][tier],rows=state.standings[country][tier];
      if(!rows||typeof rows!=='object'||Array.isArray(rows))state.standings[country][tier]=llBlankStandings(names);else{for(const name of names)if(!rows[name])rows[name]=llBlankStanding(name);for(const name of Object.keys(rows))if(!names.includes(name))delete rows[name];}
      if(!state.schedules[country])state.schedules[country]={};
      if(!Array.isArray(state.schedules[country][tier])||!state.schedules[country][tier].length)state.schedules[country][tier]=llGenerateSchedule(names);
    }
    if(!state.cups[country])state.cups[country]=llMLCreateCup(state,country);else{state.cups[country].country=country;state.cups[country].name=LL_DOMESTIC_CUP_NAMES[country];if(country!==state.playerCountry)state.cups[country].alive=false;}
  }
  if(!state.teams||typeof state.teams!=='object')state.teams={};
  for(const def of LL_ALL_DOMESTIC_TEAMS){
    if(!state.teams[def.name])state.teams[def.name]=llMLTeamState(def);
    else{
      const savedStars=Number(state.teams[def.name].stars);
      state.teams[def.name].stars=Number.isFinite(savedStars)&&savedStars>=1&&savedStars<=6?Math.round(savedStars):def.stars;
    }
  }
  /* Keep active saves' text in the club's own domestic vocabulary without
     replacing their selected objectives or progress. */
  const playerComp=llMLTeamCompetition(state.playerTeam,state);
  if(playerComp&&!state.seasonGoals?.evaluated&&Array.isArray(state.seasonGoals?.items)){
    state.seasonGoals.items=state.seasonGoals.items.map(goal=>llMLLocalizeGoal(goal,playerComp.country,playerComp.tier));
    state.seasonGoals.country=playerComp.country;state.seasonGoals.tier=playerComp.tier;
  }
  state.multiLeagueVersion=LL_MULTI_LEAGUE_ENGINE_VERSION;return llMLAttachLegacyAliases(state);
}

var llMLRepairBase=llV2RepairState;
llV2RepairState=function(state){state=llMLNormalizeState(state);state=llMLRepairBase(state);return llMLNormalizeState(state);};
var llMLNewStateBase=llNewState;
llNewState=function(teamName){const state=llMLNewStateBase(teamName);state.playerCountry=LL_TEAM_REGISTRY?.[teamName]?.country||'TUR';return llV2RepairState(state);};
var llMLTeamDefBase=llTeamDef;
llTeamDef=function(name){const canonical=typeof llCanonicalTeamName==='function'?llCanonicalTeamName(name):name,def=LL_TEAM_REGISTRY?.[canonical];return def?{name:def.name,short:def.short,stars:def.stars,icon:def.icon,logo:def.logo,country:def.country,tier:def.tier,source:def.source}:llMLTeamDefBase(name);};
llV2TeamStarsInState=function(state,name){return Math.max(1,Math.min(6,Number(state?.teams?.[name]?.stars||LL_TEAM_REGISTRY?.[name]?.stars||1)));};
/* Yeni sezonun tüm değerleri sıfırken, ülkenin kaynak başlangıç dizilimi alfabetik sıranın önüne geçer.
   Puan/averaj oluştuğunda normal lig sıralama kuralları aynen uygulanır. */
function llMLPoolSeed(state,country,tier,name){const names=state?.leagues?.[country]?.[tier]||[],index=names.indexOf(name);return index>=0?index:Number.MAX_SAFE_INTEGER;}
const llMLSortTableBase=llSortTable;
llSortTable=function(key=llTeamLeague(lexLeague.state.playerTeam)||'first'){
  const state=lexLeague.state,country=state?.playerCountry,tier=key==='super'?'tier1':key==='first'?'tier2':key,rows=state?.standings?.[country]?.[tier];
  if(!rows)return llMLSortTableBase(key);
  return Object.values(rows).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||llMLPoolSeed(state,country,tier,a.team)-llMLPoolSeed(state,country,tier,b.team)||a.team.localeCompare(b.team,'tr'));
};
llAiDomesticNames=function(){return new Set(LL_ALL_DOMESTIC_TEAMS.map(team=>team.name));};
/* Domestic identity checks must include every simulated country, not only Turkey. */
llV4EnsureEuropeTeams=function(state,tables=state?.europeStandings){if(!state||!tables)return;const domestic=new Set(LL_ALL_DOMESTIC_TEAMS.map(team=>team.name));['ucl','uel','uecl'].forEach(type=>(tables[type]?.teams||[]).forEach(name=>{if(domestic.has(name))return;const team=llV4CreateEuroTeam(state,name);LL_POSITIONS.forEach(position=>{if(!team.cards[position])llV4FreeCardForState(state,name,position);});llEnsureTeamContracts(team);}));};
llTeamLeague=function(name){const comp=llMLTeamCompetition(name,lexLeague.state);if(!comp||comp.country!==lexLeague.state?.playerCountry)return null;return comp.tier==='tier1'?'super':'first';};
llLeagueLabel=function(key,country=lexLeague.state?.playerCountry||'TUR'){const tier=key==='super'?'tier1':key==='first'?'tier2':key;return llMLLeagueLabel(country,tier);};
llLeaguePositionLabel=function(name){const comp=llMLTeamCompetition(name,lexLeague.state);if(!comp)return 'Avrupa kupası rakibi';const rows=Object.values(lexLeague.state.standings?.[comp.country]?.[comp.tier]||{}).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.team.localeCompare(b.team,'tr')),position=rows.findIndex(row=>row.team===name)+1;return `${llMLCountryMeta(comp.country).country} · ${llMLLeagueLabel(comp.country,comp.tier)} · ${position>0?position+'. sıra':'Sıralama yok'}`;};
llAssignStarterCardsToAi=function(){const state=lexLeague.state;if(!state||state.starterAiAssigned)return;LL_ALL_DOMESTIC_TEAMS.map(team=>team.name).filter(name=>name!==state.playerTeam).forEach(name=>{llAiEnsureTeamStrategy?.(state,name);llAssignAiCard(name);});state.starterAiAssigned=true;};

var LL_CAREER_START_MAX_STARS=2;
function llMLCareerStartTeams(country){return (LL_TIER2_POOLS[country]||[]).filter(team=>{const stars=Number(team?.stars);return Number.isFinite(stars)&&stars>=1&&stars<=LL_CAREER_START_MAX_STARS;});}
function llMLSelectCountry(country){if(!LL_COUNTRY_CODES.includes(country)||!llMLCareerStartTeams(country).length)return;globalThis.llPendingCareerCountry=country;llRenderTeamSelect(country);}
llRenderTeamSelect=function(country=null){
  lexLeague.active=true;llSetWide(true);
  if(!country){llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Kariyer Ülkesi <em>Seç</em></div><div class="ll-muted">Yeni kariyer yalnızca ikinci kademedeki 1 veya 2 yıldızlı kulüplerle başlatılabilir.</div></div><button class="ll-btn" onclick="renderLexiconLeagueLanding()">← Geri</button></div><div class="ll-team-grid">${LL_COUNTRY_CODES.map(code=>{const meta=llMLCountryMeta(code),total=(LL_TIER2_POOLS[code]||[]).length,eligible=llMLCareerStartTeams(code);return `<button class="ll-team-option" ${eligible.length?`onclick="llMLSelectCountry('${code}')"`:'disabled'}><div class="ll-team-name"><span style="font-size:2rem">${meta.flag}</span><span>${llEscape(meta.country)}</span></div><div class="ll-stars">${llEscape(llMLLeagueLabel(code,'tier2'))}</div><div class="ll-range">${eligible.length} uygun kulüp / ${total} · Yalnızca 1–2 yıldız</div></button>`;}).join('')}</div></div></div>`;return;}
  if(!LL_COUNTRY_CODES.includes(country)){llRenderTeamSelect();return;}globalThis.llPendingCareerCountry=country;const meta=llMLCountryMeta(country),total=(LL_TIER2_POOLS[country]||[]).length,teams=llMLCareerStartTeams(country);
  llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">${meta.flag} ${llEscape(llMLLeagueLabel(country,'tier2'))}'den <em>Başla</em></div><div class="ll-muted">${teams.length} uygun kulüp / ${total} · Yalnızca 1★ veya 2★ · Hedef ${llEscape(llMLLeagueLabel(country,'tier1'))}</div></div><button class="ll-btn" onclick="llRenderTeamSelect()">← Ülkeler</button></div>${teams.length?`<div class="ll-team-grid">${teams.map(team=>`<button class="ll-team-option" onclick="llStartCareer('${llEscape(team.name)}')"><div class="ll-team-name team-with-logo">${llTeamLogo(team,'compact')}<span>${llEscape(team.name)}</span></div><div class="ll-stars">${llStars(team.stars)}</div><div class="ll-range">Zar aralığı ${llRangeText(team.stars)}</div></button>`).join('')}</div>`:`<div class="ll-card"><div class="ll-sub">Bu ülkede başlangıç şartına uyan 1 veya 2 yıldızlı kulüp bulunmuyor.</div></div>`}</div></div>`;
};
var llMLStartCareerBase=llStartCareer;
llStartCareer=function(teamName){const def=LL_TEAM_REGISTRY?.[teamName],country=globalThis.llPendingCareerCountry||def?.country,poolTeam=(LL_TIER2_POOLS[country]||[]).find(team=>team.name===teamName),stars=Number(poolTeam?.stars??def?.stars),isSelectedTier2=!!def&&!!poolTeam&&def.country===country&&(def.tier==='tier2'||def.tier==='domestic-tier2'),isEligibleStars=Number.isFinite(stars)&&stars>=1&&stars<=LL_CAREER_START_MAX_STARS;if(!isSelectedTier2||!isEligibleStars){alert('Yeni kariyer yalnızca seçtiğin ülkenin ikinci kademesindeki 1 veya 2 yıldızlı kulüplerle başlatılabilir.');return;}llMLStartCareerBase(teamName);if(lexLeague.state){lexLeague.state.playerCountry=country;llV2RepairState(lexLeague.state);llSave();}globalThis.llPendingCareerCountry=null;};

function llMLScalePosition(value,count){return Math.max(1,Math.min(count,Math.round(Number(value)*count/20)));}
function llMLCompetitionText(value,country,tier){
  const top=llMLLeagueLabel(country,'tier1'),second=llMLLeagueLabel(country,'tier2'),cup=LL_DOMESTIC_CUP_NAMES[country]||llMLCountryMeta(country).cupName;
  return String(value||'')
    .replace(/Ziraat Türkiye Kupası|Türkiye Kupası/g,cup)
    .replace(/Süper Lig/g,top)
    .replace(/TFF 1\. Lig/g,second);
}
function llMLLocalizeGoal(goal,country,tier){
  const out=llDeep(goal||{}),league=llMLLeagueLabel(country,tier),top=llMLLeagueLabel(country,'tier1');
  if(out.type==='champion')out.label=`${league} şampiyonu${/geri dön/i.test(String(out.label||''))?' olarak geri dön':' ol'}`;
  else if(out.type==='survive'||out.type==='first_survive')out.label=`${league}’de kümede kal`;
  else if(out.type==='promote')out.label=`${top}’e${/yeniden/i.test(String(out.label||''))?' yeniden':''} yüksel`;
  else out.label=llMLCompetitionText(out.label,country,tier);
  return out;
}
function llMLScaleGoal(goal,count,cupName,country='TUR',tier='tier1'){
  const out=llMLLocalizeGoal(goal,country,tier);
  if(out.type==='league_position'&&out.value){out.value=llMLScalePosition(out.value,count);out.label=String(out.label).replace(/ilk\s+\d+/i,`ilk ${out.value}`);}
  out.label=llMLCompetitionText(out.label,country,tier).replace(/Türkiye Kupası/g,cupName||LL_DOMESTIC_CUP_NAMES[country]||'Türkiye Kupası');
  return out;
}
var llMLPreviousTeamContextBase=llV2PreviousTeamContext;
llV2PreviousTeamContext=function(state,name){const previous=(state?.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-1);if(previous?.countrySummaries){for(const country of LL_COUNTRY_CODES){const summary=previous.countrySummaries[country];if(!summary)continue;for(const [tier,legacy] of [['tier1','super'],['tier2','first']]){const rows=summary[`${tier}Rows`]||previous.leagueRows?.[country]?.[tier]||[],index=rows.findIndex(row=>row.team===name);if(index>=0)return {country,tier,league:legacy,position:Number(rows[index]?.position)||index+1,promoted:(summary.promoted||[]).includes(name),relegated:(summary.relegated||[]).includes(name)};}}}return llMLPreviousTeamContextBase(state,name);};
function llMLTargetSignature(state){return LL_COUNTRY_CODES.flatMap(country=>['tier1','tier2'].flatMap(tier=>(state.leagues[country]?.[tier]||[]).map(name=>`${country}|${tier}|${name}|${llV2TeamStarsInState(state,name)}`))).sort().join('¦');}
const LL_ML_TARGET_TEXT_VERSION=LL_TEAM_TARGET_VERSION+101;
llV2CreateTeamSeasonTargets=function(state){const targets={};for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1','tier2']){const legacy=tier==='tier1'?'super':'first',names=state.leagues[country]?.[tier]||[],count=names.length,cup=LL_DOMESTIC_CUP_NAMES[country];for(const name of names){const stars=llV2TeamStarsInState(state,name),same=names.filter(item=>llV2TeamStarsInState(state,item)===stars).sort((a,b)=>a.localeCompare(b,'tr')),options=llV2ContextualTeamTargetOptions(state,name,legacy,stars).map(goal=>llMLScaleGoal(goal,count,cup,country,tier)),choice=options[Math.max(0,same.indexOf(name))%options.length];targets[name]={...choice,team:name,country,tier,league:legacy,stars};}}return {version:LL_ML_TARGET_TEXT_VERSION,season:state.season,signature:llMLTargetSignature(state),targets,evaluated:false,results:{}};};
llV2EnsureTeamSeasonTargets=function(state=lexLeague.state){if(!state)return null;const current=state.teamSeasonTargets,signature=llMLTargetSignature(state),expected=LL_ALL_DOMESTIC_TEAMS.length;if(!current||current.version!==LL_ML_TARGET_TEXT_VERSION||current.season!==state.season||current.signature!==signature||Object.keys(current.targets||{}).length!==expected)state.teamSeasonTargets=llV2CreateTeamSeasonTargets(state);return state.teamSeasonTargets;};
var llMLCreateSeasonGoalsBase=llV2CreateSeasonGoals;
llV2CreateSeasonGoals=function(state){const goals=llMLCreateSeasonGoalsBase(state),comp=llMLTeamCompetition(state.playerTeam,state),count=state.leagues[comp.country][comp.tier].length,base=comp.tier==='tier1'?18:20,roundRatio=Math.max(.5,(count-1)/(base-1)),cup=LL_DOMESTIC_CUP_NAMES[comp.country];goals.country=comp.country;goals.tier=comp.tier;goals.items=goals.items.map(goal=>{const scaled=llMLScaleGoal(goal,count,cup,comp.country,comp.tier);if(['wins','goals_for'].includes(scaled.type)){scaled.value=Math.max(1,Math.round(scaled.value*roundRatio));scaled.label=scaled.type==='wins'?`En az ${scaled.value} lig maçı kazan`:`Ligde en az ${scaled.value} gol at`;}return scaled;});return goals;};

function llMLPreviousCountrySummaries(state){
  const season=Number(state?.season)-1;
  const archived=[...(state?.seasonHistory||[])].sort((a,b)=>Number(b.season)-Number(a.season)).find(item=>Number(item.season)===season&&item.countrySummaries);
  if(archived?.countrySummaries)return archived.countrySummaries;
  return Number(state?.lastSeasonSummary?.season)===season?state.lastSeasonSummary.countrySummaries:null;
}
function llMLSeedEuropeQualifications(state,country){
  const teams=[...(state?.leagues?.[country]?.tier1||[])].sort((a,b)=>llV2TeamStarsInState(state,b)-llV2TeamStarsInState(state,a)||String(a).localeCompare(String(b)));
  if(teams.length<6)return {ucl:[],uel:[],uecl:[]};
  return llV2Qualifications(teams.map(team=>({team})),teams[2]||null);
}
function llMLResolveEuropeParticipants(state){
  const fallback=llV3ResolveEuropeQualifications(state),summaries=llMLPreviousCountrySummaries(state);
  const participants={ucl:[],uel:[],uecl:[]},used=new Set(),sources={};
  for(const type of ['ucl','uel','uecl']){
    for(const country of LL_COUNTRY_CODES){
      const countryQualifications=summaries?.[country]?.qualifications||llMLSeedEuropeQualifications(state,country);
      for(const team of countryQualifications?.[type]||[]){
        if(!team||used.has(team))continue;
        participants[type].push(team);used.add(team);
        sources[team]={country,competition:type,reason:summaries?.[country]?.qualifications?'previous-season domestic qualification':'initial seeded domestic qualification'};
      }
    }
    for(const team of fallback[type]||[]){
      if(participants[type].length>=14||used.has(team))continue;
      participants[type].push(team);used.add(team);
      sources[team]={country:state.playerCountry||'TUR',competition:type,reason:'legacy qualification fallback'};
    }
  }
  state.europeQualificationSources={season:Number(state.season),teams:sources};
  return participants;
}
function llMLApplyStanding(state,country,tier,name,gf,ga){const row=state.standings[country][tier][name];if(!row)return;row.P++;row.GF+=gf;row.GA+=ga;row.GD=row.GF-row.GA;if(gf>ga){row.W++;row.Pts+=3;}else if(gf===ga){row.D++;row.Pts++;}else row.L++;const team=state.teams[name];if(team){team.lastResults=Array.isArray(team.lastResults)?team.lastResults:[];team.lastResults.push(gf>ga?'W':gf===ga?'D':'L');team.lastResults=team.lastResults.slice(-5);if(gf>ga)team.wins=(Number(team.wins)||0)+1;}}
function llMLRewardAi(state,name,gf,ga,competition='league'){if(name===state.playerTeam)return;const team=state.teams[name];if(!team)return;const reward=typeof LL_COMP_REWARDS==='object'?(LL_COMP_REWARDS[competition]||LL_COMP_REWARDS.league):{win:50,draw:20,loss:5,ap:5};team.aiAp=(Number(team.aiAp)||0)+Math.max(5,Number(reward.ap)||5)*(4+Math.min(6,team.stars));team.aiLp=(Number(team.aiLp)||0)+(gf>ga?Number(reward.win)||50:gf===ga?Number(reward.draw)||20:Number(reward.loss)||5);}
function llMLRecordDataMatch(state,country,tier,fixture,score,week,competition='league',cupRound=null){if(competition==='league'){llMLApplyStanding(state,country,tier,fixture.home,score.homeGoals,score.awayGoals);llMLApplyStanding(state,country,tier,fixture.away,score.awayGoals,score.homeGoals);}llMLRewardAi(state,fixture.home,score.homeGoals,score.awayGoals,competition);llMLRewardAi(state,fixture.away,score.awayGoals,score.homeGoals,competition);state.results.push({season:state.season,week,home:fixture.home,away:fixture.away,homeGoals:score.homeGoals,awayGoals:score.awayGoals,userMatch:false,competition,league:tier,country,cupRound});}
function llMLHasFixtureResult(state,country,tier,fixture,week){return (state.results||[]).some(result=>Number(result.season)===Number(state.season)&&result.competition==='league'&&result.country===country&&result.league===tier&&Number(result.week)===Number(week)&&result.home===fixture.home&&result.away===fixture.away);}
function llMLSimulateFixture(state,country,tier,fixture,week,competition='league',cupRound=null){const sim=llSimulateMatch(fixture.home,fixture.away,competition);llMLRecordDataMatch(state,country,tier,fixture,sim,week,competition,cupRound);if(sim.resolution)llApplyLocks(sim.resolution,fixture.home,fixture.away);return sim.homeGoals===sim.awayGoals?(Math.random()<.5?fixture.home:fixture.away):sim.homeGoals>sim.awayGoals?fixture.home:fixture.away;}
function llMLSimulateCountryWeek(state,country,week){for(const tier of ['tier1','tier2'])for(const fixture of state.schedules[country]?.[tier]?.[week-1]||[])if(!llMLHasFixtureResult(state,country,tier,fixture,week))llMLSimulateFixture(state,country,tier,fixture,week);llMLProgressBackgroundCup(state,country,week);}
function llMLProgressBackgroundCup(state,country,week){const cup=state.cups[country];if(!cup||cup.winner||country===state.playerCountry)return;while(cup.round<LL_CUP_WEEKS.length&&week>=LL_CUP_WEEKS[cup.round]){cup.history=cup.history||{};cup.history[cup.round]=[...cup.field];const next=[];for(let i=0;i<cup.field.length;i+=2){const home=cup.field[i],away=cup.field[i+1];if(!home&&!away)continue;if(!home||!away){next.push(home||away);continue;}next.push(llMLSimulateFixture(state,country,null,{home,away},week,'cup',cup.round));}cup.field=next;cup.round++;if(next.length===1){cup.winner=next[0];cup.alive=false;break;}}}
function llMLSimulateBackgroundWeek(state,week){const start=typeof performance!=='undefined'?performance.now():Date.now();for(const country of LL_COUNTRY_CODES)if(country!==state.playerCountry)llMLSimulateCountryWeek(state,country,week);state.lastBackgroundSimulation={season:state.season,week,durationMs:Math.round(((typeof performance!=='undefined'?performance.now():Date.now())-start)*100)/100,countries:LL_COUNTRY_CODES.length-1};return state.lastBackgroundSimulation;}
var llMLCommitBase=llCommitCurrentMatch;
llCommitCurrentMatch=function(){const state=lexLeague.state,match=lexLeague.match,week=Number(state?.week)||0,competition=match?.fixture?.competition||'league',already=!!match?.committed;llMLCommitBase();if(!already&&competition==='league'&&state&&Number(state.week)>week){llMLSimulateBackgroundWeek(state,week);llSave();}};

function llMLSortRows(state,country,tier){return Object.values(state.standings[country]?.[tier]||{}).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||llMLPoolSeed(state,country,tier,a.team)-llMLPoolSeed(state,country,tier,b.team)||a.team.localeCompare(b.team,'tr'));}
function llMLFinishCountryLeagues(state,country){for(const tier of ['tier1','tier2'])for(let w=0;w<(state.schedules[country]?.[tier]?.length||0);w++)for(const fixture of state.schedules[country][tier][w])if(!llMLHasFixtureResult(state,country,tier,fixture,w+1))llMLSimulateFixture(state,country,tier,fixture,w+1);}
function llMLKnockoutWinner(state,names){let field=[...names];while(field.length>1){const next=[];for(let i=0;i<field.length;i+=2){const a=field[i],b=field[i+1];if(!b){next.push(a);continue;}const as=llV2TeamStarsInState(state,a),bs=llV2TeamStarsInState(state,b),chance=.5+(as-bs)*.07;next.push(Math.random()<Math.max(.18,Math.min(.82,chance))?a:b);}field=next;}return field[0];}
function llMLCountrySeasonSummary(state,country){const tier1=llMLSortRows(state,country,'tier1'),tier2=llMLSortRows(state,country,'tier2'),topMeta=llMLLeagueMeta(country,'tier1'),lowerMeta=llMLLeagueMeta(country,'tier2'),relegateCount=Math.max(0,Number(topMeta.relegate)||0),directCount=Math.max(0,Number(lowerMeta.promoteDirect)||0),playoffCount=Math.max(0,Number(lowerMeta.promotePlayoff)||0),playoffFrom=Math.max(directCount+1,Number(lowerMeta.playoffFrom)||directCount+1),playoffTo=Math.max(playoffFrom,Number(lowerMeta.playoffTo)||playoffFrom+4),relegated=relegateCount?tier1.slice(-relegateCount).map(row=>row.team):[],direct=tier2.slice(0,directCount).map(row=>row.team),playoffWinner=playoffCount?llMLKnockoutWinner(state,tier2.slice(playoffFrom-1,playoffTo).map(row=>row.team)):null,promoted=[...direct,...(playoffWinner?[playoffWinner]:[])],cupWinner=state.cups[country]?.winner||null;return {country,tier1Rows:llV2SnapshotRows(tier1,state),tier2Rows:llV2SnapshotRows(tier2,state),relegated,promoted,playoffWinner,cupWinner,qualifications:llV2Qualifications(tier1,cupWinner),rules:{relegateCount,directCount,playoffCount,playoffFrom,playoffTo}};}
function llMLPrepareAllCountrySummaries(state){const countrySummaries={},leagueRows={};for(const country of LL_COUNTRY_CODES){if(country!==state.playerCountry){llMLFinishCountryLeagues(state,country);while(!state.cups[country]?.winner)llMLProgressBackgroundCup(state,country,999);}const summary=llMLCountrySeasonSummary(state,country);countrySummaries[country]=summary;leagueRows[country]={tier1:summary.tier1Rows,tier2:summary.tier2Rows};}state.__mlFinalRows={countrySummaries,leagueRows};return state.__mlFinalRows;}
var llMLFinalizeBase=llV2FinalizeSeason;
var llMLArchiveBase=llV2ArchiveSeason;
llV2ArchiveSeason=function(state,summary){
  const entry=llMLArchiveBase(state,summary);
  if(entry&&summary?.countrySummaries){
    entry.country=summary.country||state?.playerCountry||'TUR';
    entry.countrySummaries=llDeep(summary.countrySummaries);
    entry.leagueRows=llDeep(summary.leagueRows||{});
  }
  return entry;
};
function llMLActivePromotedTeams(active,country,playoffWinner){const meta=llMLLeagueMeta(country,'tier2'),directCount=Math.max(0,Number(active?.rules?.directCount??meta.promoteDirect)||0),playoffCount=Math.max(0,Number(active?.rules?.playoffCount??meta.promotePlayoff)||0),direct=(active?.tier2Rows||[]).slice(0,directCount).map(row=>row.team),winner=playoffWinner||active?.playoffWinner||null;return [...direct,...(playoffCount&&winner?[winner]:[])];}
llV2FinalizeSeason=function(playoffWinner){const state=lexLeague.state,prepared=llMLPrepareAllCountrySummaries(state);llMLFinalizeBase(playoffWinner);const summary=state.lastSeasonSummary;if(!summary)return;const active=prepared.countrySummaries[state.playerCountry];active.promoted=llMLActivePromotedTeams(active,state.playerCountry,playoffWinner);active.playoffWinner=active.promoted.includes(playoffWinner)?playoffWinner:(active.playoffWinner||null);summary.leagueRows=prepared.leagueRows;summary.countrySummaries=prepared.countrySummaries;summary.country=state.playerCountry;summary.superRows=active.tier1Rows;summary.firstRows=active.tier2Rows;summary.tier1Rows=active.tier1Rows;summary.tier2Rows=active.tier2Rows;summary.relegated=[...(active.relegated||[])];summary.promoted=[...(active.promoted||[])];summary.playoffWinner=active.playoffWinner;summary.cupWinner=active.cupWinner;summary.qualifications=llDeep(active.qualifications||{ucl:[],uel:[],uecl:[]});summary.countrySummaries[state.playerCountry]={...active};summary.leagueRows[state.playerCountry]={tier1:active.tier1Rows,tier2:active.tier2Rows};delete state.__mlFinalRows;state.managerMarket=null;if(typeof llEnsureManagerMarket==='function')llEnsureManagerMarket(state);llV2ArchiveSeason(state,summary);llSave();};
function llMLApplyMovements(state,summary){for(const country of LL_COUNTRY_CODES){const info=summary.countrySummaries?.[country];if(!info)continue;const tier1=new Set(state.leagues[country].tier1),tier2=new Set(state.leagues[country].tier2);for(const name of info.relegated||[]){tier1.delete(name);tier2.add(name);}for(const name of info.promoted||[]){tier2.delete(name);tier1.add(name);if(name!==state.playerTeam)llAiGrantPromotionReward?.(state,name,summary.season);}state.leagues[country]={tier1:[...tier1],tier2:[...tier2]};}}
llStartNextSeason=function(){
  const state=lexLeague.state;if(!state)return;
  if(state.careerEnded){renderLexiconLeagueLanding();return;}
  const market=state.seasonEnded&&typeof llEnsureManagerMarket==='function'?llEnsureManagerMarket(state):null;
  if(market?.status==='pending'){llRenderManagerMarket('super');return;}
  const summary=state.lastSeasonSummary;if(!summary)return;
  const selectedTeam=market?.status==='chosen'&&market.selectedTeam?market.selectedTeam:state.playerTeam;
  if(!selectedTeam||!state.teams?.[selectedTeam]){alert('Yeni sezon başlatılamadı: seçilen kulüp kariyer verisinde bulunamadı.');return;}
  const snapshot=typeof llDeep==='function'?llDeep(state):JSON.parse(JSON.stringify(state));
  try{
    state.playerTeam=selectedTeam;
    if(summary)summary.nextManagerTeam=selectedTeam;
    llMLApplyMovements(state,summary);
    state.playerCountry=llMLCountryForTeam(state.playerTeam,state)||state.playerCountry;
    state.season++;
    state.week=1;
    state.seasonEnded=false;
    state.standings={};state.schedules={};state.cups={};
    for(const country of LL_COUNTRY_CODES){
      if(!state.leagues?.[country]?.tier1||!state.leagues?.[country]?.tier2)throw new Error(`Lig yapısı eksik: ${country}`);
      state.standings[country]={};state.schedules[country]={};
      for(const tier of ['tier1','tier2']){
        state.standings[country][tier]=llBlankStandings(state.leagues[country][tier]);
        state.schedules[country][tier]=llGenerateSchedule(state.leagues[country][tier]);
      }
      state.cups[country]=llMLCreateCup(state,country);
    }
    state.pendingFixture=null;state.playoff=null;state.results=[];state.europeStandings=null;
    state.aiTransferWindows={};state.aiContractWindows={};state.teamSeasonTargets=null;state.seasonGoals=null;
    Object.values(state.teams).forEach(team=>{team.lastResults=[];team.wins=0;team.lockedDice={};});
    const active=summary.countrySummaries?.[state.playerCountry];
    const rawQ=active?.qualifications||{};
    const q={ucl:Array.isArray(rawQ.ucl)?[...rawQ.ucl]:[],uel:Array.isArray(rawQ.uel)?[...rawQ.uel]:[],uecl:Array.isArray(rawQ.uecl)?[...rawQ.uecl]:[]};
    const type=q.ucl.includes(state.playerTeam)?'ucl':q.uel.includes(state.playerTeam)?'uel':q.uecl.includes(state.playerTeam)?'uecl':null;
    state.europeQualifications=llDeep(q);
    state.europe=type?{type,phase:'league',round:0,alive:true,pending:null,winner:null,usedOpponents:[],status:'Lig aşaması başlamadı'}:null;
    llV2RepairState(state);
    if(typeof llManagerProfile==='function')llManagerProfile(state).currentTeam=state.playerTeam;
    state.managerMarket=null;
    llSave();
    llRenderDashboard();
  }catch(error){
    console.error('[Yeni Sezon] Sezon geçişi başarısız; önceki state geri yüklendi.',error);
    Object.keys(state).forEach(key=>delete state[key]);Object.assign(state,snapshot);
    if(typeof llSave==='function')llSave();
    alert('Yeni sezon başlatılırken bir hata oluştu. Kariyer kaydı korunarak sezon sonu ekranına geri dönüldü.');
    if(typeof llRenderSeasonEnd==='function')llRenderSeasonEnd();
  }
};

llManagerSeasonRow=function(summary,team){for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1','tier2']){const rows=summary?.leagueRows?.[country]?.[tier]||[],index=rows.findIndex(row=>row.team===team);if(index>=0)return {row:rows[index],country,tier,league:tier==='tier1'?'super':'first',position:index+1};}const superIndex=(summary?.superRows||[]).findIndex(row=>row.team===team);if(superIndex>=0)return {row:summary.superRows[superIndex],country:summary.country||'TUR',tier:'tier1',league:'super',position:superIndex+1};const firstIndex=(summary?.firstRows||[]).findIndex(row=>row.team===team);return firstIndex>=0?{row:summary.firstRows[firstIndex],country:summary.country||'TUR',tier:'tier2',league:'first',position:firstIndex+1}:{row:null,country:null,tier:null,league:null,position:0};};
llManagerNextLeague=function(summary,team){const current=llManagerSeasonRow(summary,team),info=summary?.countrySummaries?.[current.country];if((info?.promoted||[]).includes(team))return 'super';if((info?.relegated||[]).includes(team))return 'first';return current.league||'first';};
llManagerNextTeams=function(summary,league,country=summary?.country||'TUR'){const info=summary?.countrySummaries?.[country],tier1=new Set((summary?.leagueRows?.[country]?.tier1||[]).map(row=>row.team)),tier2=new Set((summary?.leagueRows?.[country]?.tier2||[]).map(row=>row.team));for(const team of info?.relegated||[]){tier1.delete(team);tier2.add(team);}for(const team of info?.promoted||[]){tier2.delete(team);tier1.add(team);}return [...(league==='super'?tier1:tier2)];};
llManagerOffer=function(state,summary,team,kind){const current=llManagerSeasonRow(summary,team),nextLeague=llManagerNextLeague(summary,team),country=current.country||llMLCountryForTeam(team,state),tier=nextLeague==='super'?'tier1':'tier2',info=summary.countrySummaries?.[country]||{},promoted=(info.promoted||[]).includes(team),relegated=(info.relegated||[]).includes(team),target=llManagerProjectedTarget(state,{...summary,country,promoted:info.promoted||[],relegated:info.relegated||[],superRows:summary.leagueRows?.[country]?.tier1||[],firstRows:summary.leagueRows?.[country]?.tier2||[]},team),movement=promoted?`${llMLLeagueLabel(country,'tier1')} ligine yükseldi`:relegated?`${llMLLeagueLabel(country,'tier2')} ligine düştü`:'Liginde kaldı',q=info.qualifications||{},europe=(q.ucl||[]).includes(team)?'Şampiyonlar Ligi':(q.uel||[]).includes(team)?'Avrupa Ligi':(q.uecl||[]).includes(team)?'Konferans Ligi':'Avrupa bileti yok',localizedTarget=llMLLocalizeGoal(target,country,tier);return {team,kind,country,stars:llV2TeamStarsInState(state,team),lastLeague:current.league,lastLeagueLabel:`${llMLCountryMeta(country).country} · ${llMLLeagueLabel(country,current.tier||'tier2')}`,position:current.position,nextLeague,nextLeagueLabel:`${llMLCountryMeta(country).country} · ${llMLLeagueLabel(country,tier)}`,movement,targetLabel:localizedTarget.label||'Sezon hedefi belirlenecek',europe};};
llManagerBuildOffers=function(state,summary,performance,profile,fired){const source=summary.leagueRows||state.__mlFinalRows?.leagueRows||{},currentStars=llV2TeamStarsInState(state,performance.from),promotionStarCap=performance.league==='first'&&performance.promoted,all=[];for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1','tier2'])for(const row of source[country]?.[tier]||[])if(row.team!==performance.from)all.push({team:row.team,country,stars:llV2TeamStarsInState(state,row.team),nextLeague:llManagerNextLeague({...summary,leagueRows:source},row.team)});const eligible=promotionStarCap?all.filter(item=>item.stars<=currentStars):all,chosen=[],used=new Set(),usedCountries=new Map(),seed=`${summary.season}|${performance.from}`;const add=(candidate,kind)=>{if(!candidate||used.has(candidate.team))return;used.add(candidate.team);usedCountries.set(candidate.country,(usedCountries.get(candidate.country)||0)+1);chosen.push(llManagerOffer(state,{...summary,leagueRows:source},candidate.team,kind));};const progression=!promotionStarCap&&!fired&&performance.winRate>=55&&performance.primaryAchieved&&currentStars<6,prestige=!promotionStarCap&&!fired&&(performance.superChampion||performance.cupFinal||performance.europeSuccess)&&profile.reputation>=55;if(prestige)add(llManagerStablePick(eligible.filter(item=>item.nextLeague==='super'&&item.stars>currentStars&&item.stars<=Math.min(6,currentStars+(performance.europeTrophy?2:1))),seed+'|prestige',true),'prestige');if(progression)add(llManagerStablePick(eligible.filter(item=>item.stars===currentStars+1&&!used.has(item.team)),seed+'|progress'),'progress');const safe=eligible.filter(item=>item.stars<=currentStars&&!used.has(item.team)).sort((a,b)=>(usedCountries.get(a.country)||0)-(usedCountries.get(b.country)||0)||Math.abs(currentStars-a.stars)-Math.abs(currentStars-b.stars)||llManagerHash(a.team+seed)-llManagerHash(b.team+seed));for(const candidate of safe){if(chosen.length>=LL_MULTI_MANAGER_OFFER_COUNT)break;add(candidate,'safe');}for(const candidate of eligible.filter(item=>!used.has(item.team))){if(chosen.length>=LL_MULTI_MANAGER_OFFER_COUNT)break;add(candidate,'safe');}return {offers:chosen.slice(0,LL_MULTI_MANAGER_OFFER_COUNT),progression,prestige,promotionStarCap};};
var llMLEnsureManagerBase=llEnsureManagerMarket;
llEnsureManagerMarket=function(state=lexLeague.state){if(state?.managerMarket&&state.managerMarket.version!==LL_MANAGER_MARKET_VERSION+1)state.managerMarket=null;const market=llMLEnsureManagerBase(state);if(market)market.version=LL_MANAGER_MARKET_VERSION+1;return market;};
var llMLChooseOfferBase=llChooseManagerOffer;
llChooseManagerOffer=function(teamName){llMLChooseOfferBase(teamName);if(lexLeague.state?.playerTeam===teamName){lexLeague.state.playerCountry=llMLCountryForTeam(teamName,lexLeague.state)||lexLeague.state.playerCountry;llMLAttachLegacyAliases(lexLeague.state);llSave();}};

function llMLRelabelRenderedScreen(root,country=lexLeague.state?.playerCountry||'TUR'){
  if(!root)return;
  const meta=llMLCountryMeta(country),cup=LL_DOMESTIC_CUP_NAMES[country]||meta.cupName;
  const replacements=[
    [/Türkiye'nin Avrupa Temsilcileri/g,`${meta.country} Avrupa Temsilcileri`],
    [/Ziraat Türkiye Kupası/g,cup],[/Türkiye Kupası/g,cup],
    [/Süper Lig/g,llMLLeagueLabel(country,'tier1')],[/TFF 1\. Lig/g,llMLLeagueLabel(country,'tier2')]
  ];
  const replace=value=>replacements.reduce((text,[pattern,next])=>String(text||'').replace(pattern,next),String(value||''));
  const visit=node=>{
    if(node?.nodeType===3){node.nodeValue=replace(node.nodeValue);return;}
    if(node?.getAttribute)for(const attr of ['title','aria-label']){const value=node.getAttribute(attr);if(value)node.setAttribute(attr,replace(value));}
    for(const child of [...(node?.childNodes||[])])visit(child);
  };
  visit(root);
  root.querySelectorAll?.('button').forEach(button=>{
    if(button.textContent.trim()==='Diğer Lig')button.textContent=`${meta.flag} Diğer Lig`;
  });
}

var llMLCompetitionBase=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=llTeamLeague(lexLeague.state?.playerTeam)||'first'){llMLCompetitionBase(tab,key);const country=lexLeague.state?.playerCountry||'TUR',root=llArea();if(!root)return;llMLRelabelRenderedScreen(root,country);const buttons=[...root.querySelectorAll('.ll-subtabs button')];if(tab==='league'&&buttons.length>=2){buttons[0].textContent=llMLLeagueLabel(country,'tier1');buttons[1].textContent=llMLLeagueLabel(country,'tier2');}};
var llMLDashboardBase=llRenderDashboard;
llRenderDashboard=function(){llMLDashboardBase();const state=lexLeague.state;if(!state||state.seasonEnded)return;llMLRelabelRenderedScreen(llArea(),state.playerCountry);};
llV9SeasonStarChanges=function(state,latest){const older=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-2),changes=[];for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1','tier2'])for(const name of state.leagues[country]?.[tier]||[]){const from=older?llV9ArchiveStar(older,name):llV9ArchiveStar(latest,name),to=older?llV9ArchiveStar(latest,name):Number(state.teams?.[name]?.stars||0);if(from&&to&&from!==to)changes.push({name,from,to});}return changes.sort((a,b)=>Math.abs(b.to-b.from)-Math.abs(a.to-a.from)||a.name.localeCompare(b.name,'tr'));};

llV2RepairState(lexLeague.state);
/* Multi-country archive and presentation hardening. */
const LL_ML_CAREER_LOSS_PLACES={TUR:4,ENG:3,GER:2,ESP:4,FRA:2,ITA:3,NED:0};
function llMLCareerLossPlaces(country=lexLeague.state?.playerCountry||'TUR'){return Math.max(0,Number(LL_ML_CAREER_LOSS_PLACES[country])||0);}
function llMLCareerLossRange(country,total){const count=llMLCareerLossPlaces(country);return count?`${Math.max(1,Number(total)-count+1)}–${Number(total)}`:'—';}
llV5IsFirstLeagueRelegated=function(position,total=llMLLeagueMeta(lexLeague.state?.playerCountry||'TUR','tier2').teamCount||20){const count=llMLCareerLossPlaces();return count>0&&Number(position)>Math.max(0,Number(total)-count);};
llV5DecorateFirstTableHtml=function(html,withLegend=true){const template=document.createElement('template');template.innerHTML=html;const country=lexLeague.state?.playerCountry||'TUR',count=llMLCareerLossPlaces(country),rows=[...template.content.querySelectorAll('tbody tr')];if(count)rows.slice(-count).forEach(row=>row.classList.add('relegation-zone'));const legend=template.content.querySelector('.ll-zone-legend');if(withLegend&&legend&&count&&!legend.querySelector('.ll-first-career-loss'))legend.insertAdjacentHTML('beforeend',`<span class="ll-first-career-loss"><i class="ll-zone-dot relegation"></i>${llMLCareerLossRange(country,rows.length)}: oynanmayan alt lige düşer; kariyer sona erer</span>`);return template.innerHTML;};
function llMLRelabelCareerEnd(root,country){if(!root)return;const count=llMLCareerLossPlaces(country),total=llMLLeagueMeta(country,'tier2').teamCount||20,range=llMLCareerLossRange(country,total);const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes)node.nodeValue=node.nodeValue.replace(/17–20/g,range).replace(/son 4 sıra/gi,`son ${count} sıra`).replace(/TFF 2\. Lig/g,'oynanmayan alt lig');}
function llMLArchiveSummary(entry,country){if(entry?.countrySummaries?.[country])return entry.countrySummaries[country];if((entry?.country||'TUR')===country)return {country,tier1Rows:entry.superRows||[],tier2Rows:entry.firstRows||[],cupWinner:entry.cupWinner||null,relegated:entry.relegated||[],promoted:entry.promoted||[],playoffWinner:entry.playoffWinner||null,qualifications:entry.qualifications||{ucl:[],uel:[],uecl:[]}};return null;}
function llMLArchivedTableHtml(summary,country,tier){const rows=tier==='tier1'?(summary?.tier1Rows||[]):(summary?.tier2Rows||[]),q=summary?.qualifications||{ucl:[],uel:[],uecl:[]},ucl=new Set(q.ucl||[]),uel=new Set(q.uel||[]),uecl=new Set(q.uecl||[]),meta=llMLLeagueMeta(country,tier),relegate=Math.max(0,Number(summary?.rules?.relegateCount??meta.relegate)||0),direct=Math.max(0,Number(summary?.rules?.directCount??meta.promoteDirect)||0),playoffFrom=Math.max(direct+1,Number(summary?.rules?.playoffFrom)||direct+1),playoffTo=Math.max(playoffFrom,Number(summary?.rules?.playoffTo)||playoffFrom+4);return `<div class="ll-table-wrap ll-standings-wrap"><table class="ll-table ll-standings-table ll-compact-standings-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((row,index)=>{const euro=tier==='tier1'?(ucl.has(row.team)?'ucl-zone ':uel.has(row.team)?'uel-zone ':uecl.has(row.team)?'uecl-zone ':''):'';const movement=tier==='tier1'&&relegate&&index>=rows.length-relegate?'relegation-zone ':tier==='tier2'&&index<direct?'champion-zone ':tier==='tier2'&&index+1>=playoffFrom&&index+1<=playoffTo?'playoff-zone ':'';return `<tr class="${row.team===lexLeague.state.playerTeam?'player ':''}${movement}${euro}"><td>${index+1}</td><td><span class="ll-standing-team">${llTeamLogo(row.team,'table')}<span class="ll-standing-team-name" title="${llEscape(row.team)}">${llEscape(row.team)}</span><span class="ll-standing-stars">${Number(row.stars||llV2TeamStarsInState(lexLeague.state,row.team))}★</span></span></td><td>${Number(row.P)||0}</td><td>${Number(row.W)||0}</td><td>${Number(row.D)||0}</td><td>${Number(row.L)||0}</td><td>${Number(row.GF)||0}</td><td>${Number(row.GA)||0}</td><td>${Number(row.GD)||0}</td><td><b>${Number(row.Pts)||0}</b></td></tr>`;}).join('')}</tbody></table></div>`;}
llRenderSeasonArchive=function(season=null,tier='tier1',country=lexLeague.state?.playerCountry||'TUR'){const state=lexLeague.state,history=[...(state?.seasonHistory||[])].sort((a,b)=>b.season-a.season);llSetWide(true);if(!history.length){llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-title">Sezon <em>Arşivi</em></div><div class="ll-notice">Henüz tamamlanmış sezon yok.</div><button class="ll-btn" onclick="${state?.seasonEnded?'llRenderSeasonEnd()':'llRenderDashboard()'}">← Geri</button></div></div>`;return;}const requested=Number(season),entry=history.find(item=>Number(item.season)===requested)||history[0],countries=LL_COUNTRY_CODES.filter(code=>llMLArchiveSummary(entry,code)),selected=countries.includes(country)?country:(countries[0]||entry.country||'TUR'),selectedTier=tier==='tier2'?'tier2':'tier1',summary=llMLArchiveSummary(entry,selected),meta=llMLCountryMeta(selected),back=state.seasonEnded?'llRenderSeasonEnd()':'llRenderDashboard()';llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Sezon ${entry.season} <em>Arşivi</em></div><div class="ll-muted">${meta.flag} ${llEscape(meta.country)} · Kaydedilmiş sezon sonu verisi</div></div><button class="ll-btn" onclick="${back}">← Geri</button></div><div class="ll-actions" style="margin-bottom:12px">${history.map(item=>`<button class="ll-btn ${item===entry?'primary':''}" onclick="llRenderSeasonArchive(${item.season},'${selectedTier}','${selected}')">S${item.season}</button>`).join('')}</div><div class="ll-actions" style="margin-bottom:12px">${countries.map(code=>`<button class="ll-btn ${code===selected?'primary':''}" onclick="llRenderSeasonArchive(${entry.season},'${selectedTier}','${code}')">${llMLCountryMeta(code).flag} ${llEscape(llMLCountryMeta(code).country)}</button>`).join('')}</div><div class="ll-actions" style="margin-bottom:12px"><button class="ll-btn ${selectedTier==='tier1'?'primary':''}" onclick="llRenderSeasonArchive(${entry.season},'tier1','${selected}')">${llEscape(llMLLeagueLabel(selected,'tier1'))}</button><button class="ll-btn ${selectedTier==='tier2'?'primary':''}" onclick="llRenderSeasonArchive(${entry.season},'tier2','${selected}')">${llEscape(llMLLeagueLabel(selected,'tier2'))}</button></div><div class="ll-metrics"><div class="ll-metric"><strong>${llEscape(summary?.cupWinner||'—')}</strong><span>${llEscape(LL_DOMESTIC_CUP_NAMES[selected])}</span></div><div class="ll-metric"><strong>${(summary?.promoted||[]).length}</strong><span>Yükselen</span></div><div class="ll-metric"><strong>${(summary?.relegated||[]).length}</strong><span>Düşen</span></div><div class="ll-metric"><strong>${summary?.playoffWinner?llEscape(summary.playoffWinner):'—'}</strong><span>Play-off</span></div></div><div class="ll-card-title" style="margin:16px 0 9px">${llEscape(llMLLeagueLabel(selected,selectedTier))} · Sezon ${entry.season}</div>${llMLArchivedTableHtml(summary,selected,selectedTier)}</div></div>`;};
const llMLSeasonOpeningBase=llRenderSeasonOpening;
llRenderSeasonOpening=function(){llMLSeasonOpeningBase();llMLRelabelRenderedScreen(llArea(),lexLeague.state?.playerCountry||'TUR');};
const llMLSeasonEndBase=llRenderSeasonEnd;
llRenderSeasonEnd=function(){llMLSeasonEndBase();const country=lexLeague.state?.playerCountry||'TUR';llMLRelabelRenderedScreen(llArea(),country);if(lexLeague.state?.careerEnded)llMLRelabelCareerEnd(llArea(),country);};
const llMLManagerMarketBase=llRenderManagerMarket;
llRenderManagerMarket=function(tableKey='super'){llMLManagerMarketBase(tableKey);llMLRelabelRenderedScreen(llArea(),lexLeague.state?.playerCountry||'TUR');};
const llMLCareerFinalizeBase=llV2FinalizeSeason;
llV2FinalizeSeason=function(playoffWinner){llMLCareerFinalizeBase(playoffWinner);const state=lexLeague.state;if(!state)return;const country=state.playerCountry||'TUR';if(state.careerEnded){state.careerEndReason=`${llMLLeagueLabel(country,'tier2')} küme düşme hattında sezonu tamamlama`;if(state.lastSeasonSummary)state.lastSeasonSummary.careerEndReason=state.careerEndReason;}llSave();};


/* FOREIGN_MANAGER_OFFER_CAP_START */
/* Foreign managerial offers are deliberately gated so cross-country careers progress credibly. */
var LL_ML_FOREIGN_OFFER_RULES_VERSION=3;
function llMLForeignOfferStarCap(state,performance,profile,fired,currentStars,candidate,promotionStarCap){
  var cap=candidate.country===state.playerCountry?6:4;
  var majorDomestic=!fired&&!!performance.superChampion&&!!performance.primaryAchieved&&Number(performance.winRate)>=60&&Number(profile.reputation)>=65;
  var eliteContinental=!fired&&!!performance.europeTrophy&&Number(profile.reputation)>=70;
  var worldElite=eliteContinental&&!!performance.superChampion&&Number(currentStars)>=5&&Number(profile.reputation)>=80;
  if(candidate.country!==state.playerCountry){
    if(worldElite)cap=6;
    else if(majorDomestic||eliteContinental)cap=5;
  }
  /* Ana hedef kaçırıldıysa yüksek profil itibarı teklif sayısını korur; ancak
     başarısız sezon 5-6 yıldızlı doğrudan teklif üretmez. */
  if(!performance.primaryAchieved)cap=Math.min(cap,4);
  if(promotionStarCap)cap=Math.min(cap,Math.max(1,Number(currentStars)||1));
  return cap;
}

llManagerBuildOffers=function(state,summary,performance,profile,fired){
  var source=summary?.leagueRows||state.__mlFinalRows?.leagueRows||{};
  var currentStars=llV2TeamStarsInState(state,performance.from);
  var promotionStarCap=performance.league==='first'&&performance.promoted;
  var all=[];
  for(const country of LL_COUNTRY_CODES)for(const tier of ['tier1'])for(const row of source[country]?.[tier]||[]){
    if(row.team===performance.from)continue;
    all.push({team:row.team,country:country,stars:llV2TeamStarsInState(state,row.team),nextLeague:llManagerNextLeague(summary,row.team,country),tier:tier});
  }
  var capFor=function(item){return llMLForeignOfferStarCap(state,performance,profile,fired,currentStars,item,promotionStarCap);};
  var eligible=all.filter(function(item){return item.tier==='tier1'&&item.nextLeague==='super'&&Number(item.stars)<=capFor(item);});
  var chosen=[],used=new Set(),usedCountries=new Map(),seed=String(summary.season||state.season||1)+'|'+String(performance.from||'');
  var add=function(candidate,kind){
    if(!candidate||used.has(candidate.team)||chosen.length>=3)return false;
    var sameCountry=usedCountries.get(candidate.country)||0;
    if(sameCountry>=2)return false;
    used.add(candidate.team);usedCountries.set(candidate.country,sameCountry+1);
    var offer=llManagerOffer(state,summary,candidate.team,kind);
    offer.foreign=candidate.country!==state.playerCountry;
    offer.foreignStarCap=capFor(candidate);
    offer.foreignElite=offer.foreign&&Number(candidate.stars)>4;
    chosen.push(offer);
    return true;
  };
  var progression=!promotionStarCap&&!fired&&Number(performance.winRate)>=55&&!!performance.primaryAchieved&&Number(currentStars)<6;
  var prestige=!promotionStarCap&&!fired&&(!!performance.superChampion||!!performance.cupFinal||!!performance.europeSuccess)&&Number(profile.reputation)>=55;
  var stepCap=Math.min(6,Number(currentStars)+(performance.europeTrophy?2:1));
  if(prestige){
    var prestigePool=eligible.filter(function(item){return item.nextLeague==='super'&&Number(item.stars)>Number(currentStars)&&Number(item.stars)<=Math.min(stepCap,capFor(item));}).sort(function(a,b){return Number(b.stars)-Number(a.stars)||String(a.team).localeCompare(String(b.team),'tr');});
    add(llManagerStablePick(prestigePool,seed+'|prestige'),'prestige');
  }
  if(progression){
    var progressionPool=eligible.filter(function(item){return item.nextLeague==='super'&&Number(item.stars)===Number(currentStars)+1;}).sort(function(a,b){return String(a.team).localeCompare(String(b.team),'tr');});
    add(llManagerStablePick(progressionPool,seed+'|progress'),'progress');
  }
  var safePool=eligible.filter(function(item){return Number(item.stars)<=Number(currentStars)&&item.nextLeague==='super';}).sort(function(a,b){return Number(b.stars)-Number(a.stars)||String(a.team).localeCompare(String(b.team),'tr');});
  for(const candidate of safePool){if(chosen.length>=3)break;add(candidate,'safe');}
  var fallback=eligible.slice().sort(function(a,b){return Number(b.stars)-Number(a.stars)||String(a.team).localeCompare(String(b.team),'tr');});
  for(const candidate of fallback){if(chosen.length>=3)break;add(candidate,'safe');}
  return {offers:chosen,progression:progression,prestige:prestige,promotionStarCap:promotionStarCap,foreignOfferRulesVersion:LL_ML_FOREIGN_OFFER_RULES_VERSION};
};

var llMLForeignOfferEnsureBase=llEnsureManagerMarket;
llEnsureManagerMarket=function(state=lexLeague.state){
  /* v4 additionally clears offer cards made before country-aware labels were saved. */
  if(state?.managerMarket?.status==='pending'&&(Number(state.managerMarket.foreignOfferRulesVersion)!==4||Number(state.managerMarket.version)!==LL_MANAGER_MARKET_VERSION+2))state.managerMarket=null;
  var market=llMLForeignOfferEnsureBase(state);
  if(market){market.foreignOfferRulesVersion=4;market.version=LL_MANAGER_MARKET_VERSION+2;}
  return market;
};

var llMLForeignOfferRenderBase=llRenderManagerMarket;
llRenderManagerMarket=function(tableKey='super'){
  llMLForeignOfferRenderBase(tableKey);
  var state=lexLeague.state,market=state?.managerMarket,root=llArea();
  if(!root||market?.status!=='pending'||root.querySelector('.ll-foreign-offer-rule'))return;
  var host=root.querySelector('.ll-metrics')||root.querySelector('.ll-panel');
  if(host)host.insertAdjacentHTML('afterend','<div class="ll-notice ll-foreign-offer-rule"><b>Yurt d\u0131\u015f\u0131 teklif dengesi:</b> Normal teklifler en fazla 4\u2605. Ana hedef ba\u015far\u0131s\u0131zsa do\u011frudan teklifler 4\u2605 ile s\u0131n\u0131rlan\u0131r; 5\u2605 i\u00e7in b\u00fcy\u00fck ba\u015far\u0131, 6\u2605 i\u00e7in Avrupa kupas\u0131 + lig \u015fampiyonlu\u011fu gerekir.</div>');
};
/* FOREIGN_MANAGER_OFFER_CAP_END */

/* DOMESTIC_CUP_TWO_LEGS_V1_START
 * New cups: every round before the final is home-and-away. Existing saves keep
 * their already-created single-leg cup, so an in-progress career is never
 * rewritten halfway through a tournament.
 */
var LL_DOMESTIC_CUP_TWO_LEG_VERSION=4;
var LL_DOMESTIC_CUP_TIE_WEEKS=[[2,3],[6,7],[10,12],[15,16],[20,21],[26]];
function llMLCupUsesTwoLegs(cup){return Number(cup&&cup.formatVersion)>=LL_DOMESTIC_CUP_TWO_LEG_VERSION;}
function llMLCupRoundWeeks(round){return LL_DOMESTIC_CUP_TIE_WEEKS[Number(round)]||[Number(LL_CUP_WEEKS&&LL_CUP_WEEKS[round])||1];}
function llMLCupRoundIsFinal(round){return Number(round)>=Number(LL_CUP_ROUNDS.length)-1;}
function llMLCupTieId(state,round,pair){return 'domestic-s'+Number(state.season)+'-r'+Number(round)+'-'+String(pair&&pair[0]||'').replace(/[^a-z0-9]+/ig,'_')+'-'+String(pair&&pair[1]||'').replace(/[^a-z0-9]+/ig,'_');}
function llMLCupAggregate(pair,first,second){
  var a=pair&&pair[0],b=pair&&pair[1],score=function(result,team){if(!result)return 0;return result.home===team?Number(result.homeGoals)||0:result.away===team?Number(result.awayGoals)||0:0;};
  return {a:score(first,a)+score(second,a),b:score(first,b)+score(second,b)};
}
function llMLCupRecordLeg(state,fixture,score,week,round,leg,tieId,userMatch){
  if(userMatch)llRecordMatch(fixture.home,fixture.away,score.homeGoals,score.awayGoals,week,true,'cup',null);
  else llMLRecordDataMatch(state,llMLCountryForTeam(fixture.home,state)||state.playerCountry,null,fixture,score,week,'cup',round);
  var result=state.results[state.results.length-1];
  if(result)Object.assign(result,{cupRound:Number(round),cupLeg:Number(leg),cupTieId:tieId,roundLabel:(LL_CUP_ROUNDS[round]||'Cup')+(llMLCupRoundIsFinal(round)?'':' \u00b7 '+(Number(leg)===1?'1. Ma\u00e7':'R\u00f6van\u015f'))});
  return result;
}
function llMLCupSimLeg(state,fixture,week,round,leg,tieId){
  var sim=llSimulateMatch(fixture.home,fixture.away,'cup');
  var result=llMLCupRecordLeg(state,fixture,sim,week,round,leg,tieId,false);
  if(sim.resolution)llApplyLocks(sim.resolution,fixture.home,fixture.away);
  return result;
}
function llMLCupSimTie(state,pair,round,weeks){
  var firstFixture={home:pair[0],away:pair[1]},tieId=llMLCupTieId(state,round,pair),first=llMLCupSimLeg(state,firstFixture,weeks[0],round,1,tieId);
  if(llMLCupRoundIsFinal(round)){
    var finalShootout=Number(first.homeGoals)===Number(first.awayGoals)&&typeof llV12PenaltyShootout==='function'?llV12PenaltyShootout(state,pair[0],pair[1]):null;
    var finalWinner=finalShootout?finalShootout.winner:Number(first.homeGoals)===Number(first.awayGoals)?(Math.random()<.5?pair[0]:pair[1]):Number(first.homeGoals)>Number(first.awayGoals)?pair[0]:pair[1];
    if(finalShootout){finalShootout.aggregate={player:Number(first.homeGoals)||0,opponent:Number(first.awayGoals)||0};first.penaltyShootout=finalShootout;first.decisionResult=finalWinner===pair[0]?'penalties-win':'penalties-loss';}
    first.knockoutWinner=finalWinner;return finalWinner;
  }
  var secondFixture={home:pair[1],away:pair[0]},second=llMLCupSimLeg(state,secondFixture,weeks[1],round,2,tieId),aggregate=llMLCupAggregate(pair,first,second),winner;
  if(aggregate.a===aggregate.b){
    var shootout=typeof llV12PenaltyShootout==='function'?llV12PenaltyShootout(state,pair[0],pair[1]):null;
    winner=shootout?shootout.winner:(Math.random()<.5?pair[0]:pair[1]);
    if(shootout){shootout.aggregate={player:aggregate.a,opponent:aggregate.b};second.penaltyShootout=shootout;second.decisionResult=winner===pair[0]?'penalties-win':'penalties-loss';}
  }else winner=aggregate.a>aggregate.b?pair[0]:pair[1];
  first.aggregate={home:aggregate.a,away:aggregate.b};second.aggregate={home:aggregate.a,away:aggregate.b};second.knockoutWinner=winner;
  return winner;
}

var llMLCreateCupSingleLegBase=llMLCreateCup;
llMLCreateCup=function(state,country){
  var cup=llMLCreateCupSingleLegBase(state,country);
  cup.formatVersion=LL_DOMESTIC_CUP_TWO_LEG_VERSION;
  cup.tieWeeks=LL_DOMESTIC_CUP_TIE_WEEKS.map(function(weeks){return weeks.slice();});
  return cup;
};

var llMLBackgroundCupSingleLegBase=llMLProgressBackgroundCup;
llMLProgressBackgroundCup=function(state,country,week){
  var cup=state.cups&&state.cups[country];
  if(!llMLCupUsesTwoLegs(cup))return llMLBackgroundCupSingleLegBase(state,country,week);
  if(!cup||cup.winner||country===state.playerCountry)return;
  while(cup.round<LL_CUP_ROUNDS.length){
    var round=Number(cup.round),weeks=llMLCupRoundWeeks(round),pending=cup.backgroundTieRound;
    if(pending&&Number(pending.round)===round){
      if(Number(week)<Number(weeks[1]||weeks[0]))return;
      for(const tie of pending.ties){
        if(tie.bye)continue;
        var winner=llMLCupSimTie(state,tie.pair,round,weeks);
        pending.next.push(winner);
      }
      cup.field=pending.next;cup.backgroundTieRound=null;cup.round++;
      if(cup.field.length===1){cup.winner=cup.field[0];cup.alive=false;return;}
      continue;
    }
    if(Number(week)<Number(weeks[0]))return;
    cup.history=cup.history||{};cup.history[round]=[...cup.field];
    var ties=[],next=[];
    for(var i=0;i<cup.field.length;i+=2){
      var a=cup.field[i],b=cup.field[i+1];
      if(!a&&!b)continue;
      if(!a||!b){next.push(a||b);ties.push({bye:true,pair:[a,b]});continue;}
      ties.push({bye:false,pair:[a,b]});
    }
    if(llMLCupRoundIsFinal(round)){
      for(const tie of ties)if(!tie.bye)next.push(llMLCupSimTie(state,tie.pair,round,weeks));
      cup.field=next;cup.round++;if(next.length===1){cup.winner=next[0];cup.alive=false;}return;
    }
    cup.backgroundTieRound={round:round,ties:ties,next:next};
    if(Number(week)<Number(weeks[1]))return;
  }
};

var llMLCupRepairSingleLegBase=llV2RepairCupProgress;
llV2RepairCupProgress=function(state){
  var cup=state&&state.cup;
  if(!llMLCupUsesTwoLegs(cup))return llMLCupRepairSingleLegBase(state);
  cup.history=cup.history||{};
  if(!cup.history[cup.round]&&Array.isArray(cup.field))cup.history[cup.round]=[...cup.field];
  return cup;
};

var llMLCupEnsureSingleLegBase=llV2EnsureCup;
llV2EnsureCup=function(){
  var state=lexLeague.state,cup=state&&state.cup;
  if(!llMLCupUsesTwoLegs(cup))return llMLCupEnsureSingleLegBase();
  if(!cup||cup.winner||cup.round>=LL_CUP_ROUNDS.length||state.pendingFixture)return;
  var round=Number(cup.round),weeks=llMLCupRoundWeeks(round);
  if(cup.pending){
    if(Number(cup.pending.leg)!==2||Number(state.week)<Number(weeks[1]||weeks[0]))return;
    state.pendingFixture={home:cup.pending.pair[1],away:cup.pending.pair[0],competition:'cup',cupLeg:2,cupTieId:cup.pending.tieId,roundLabel:(LL_CUP_ROUNDS[round]||'Cup')+' \u00b7 R\u00f6van\u015f'};return;
  }
  if(Number(state.week)<Number(weeks[0]))return;
  cup.history=cup.history||{};cup.history[round]=[...cup.field];
  var next=[],playerPair=null;
  for(var i=0;i<cup.field.length;i+=2){
    var a=cup.field[i],b=cup.field[i+1];
    if(!a&&!b)continue;
    if(!a||!b){next.push(a||b);continue;}
    if(a===state.playerTeam||b===state.playerTeam){playerPair=[a,b];continue;}
    next.push(llMLCupSimTie(state,[a,b],round,weeks));
  }
  if(playerPair){
    var tieId=llMLCupTieId(state,round,playerPair);
    cup.pending={next:next,pair:playerPair,round:round,tieId:tieId,leg:1,firstLeg:null};
    state.pendingFixture={home:playerPair[0],away:playerPair[1],competition:'cup',cupLeg:1,cupTieId:tieId,roundLabel:(LL_CUP_ROUNDS[round]||'Cup')+(llMLCupRoundIsFinal(round)?'':' \u00b7 1. Ma\u00e7')};
  }else{
    cup.field=next;cup.round++;if(cup.field.length===1){cup.winner=cup.field[0];cup.alive=false;}
  }
};

var llMLCupFinishSingleLegBase=llV2FinishCupRound;
llV2FinishCupRound=function(winner){
  var cup=lexLeague.state&&lexLeague.state.cup;
  if(!llMLCupUsesTwoLegs(cup))return llMLCupFinishSingleLegBase(winner);
  if(!cup||!cup.pending)return;
  cup.pending.next.push(winner);cup.field=cup.pending.next;cup.pending=null;cup.round++;
  if(winner!==lexLeague.state.playerTeam)cup.alive=false;
  if(cup.field.length===1){cup.winner=cup.field[0];if(cup.winner===lexLeague.state.playerTeam)lexLeague.state.trophies.push({season:lexLeague.state.season,name:cup.name||'Local Cup'});}
};

/* The multi-league wrapper calls llMLCommitBase, so replacing that inner handler
 * keeps background-country simulation intact while teaching the player cup about
 * the first leg, aggregate and second-leg-only shootout. */
llMLCommitBase=function(){
  var match=lexLeague.match;if(!match||match.committed||!match.resolution)return;
  match.committed=true;
  var state=lexLeague.state,fixture=match.fixture,competition=fixture.competition||'league',resolution=match.resolution,hg=match.playerHome?resolution.scoreA:resolution.scoreB,ag=match.playerHome?resolution.scoreB:resolution.scoreA,pg=resolution.scoreA,og=resolution.scoreB,reward=LL_COMP_REWARDS[competition]||LL_COMP_REWARDS.league;
  var lp=pg>og?reward.win:pg===og?reward.draw:reward.loss;state.lp+=lp;
  var rolled=(match.playerDice||[]).map(function(die){return die.cardId;}).filter(Boolean),used=rolled.length?rolled:LL_POSITIONS.map(function(position){return llTeamState(match.player).cards[position];}).filter(Boolean),met=llTriggeredPlayerCardIds(match),applied=llAppliedPlayerCardIds(match);
  llRecordPlayerCardPerformance(used,pg>og?'win':pg===og?'draw':'loss',competition,pg,og,met,applied);
  llRecordMatch(fixture.home,fixture.away,hg,ag,state.week,true,competition,fixture.league||null);llApplyLocks(resolution,match.player,match.opponent);
  var recorded=state.results[state.results.length-1],cup=state.cup,isDouble=competition==='cup'&&llMLCupUsesTwoLegs(cup)&&!llMLCupRoundIsFinal(cup.round)&&cup&&cup.pending&&fixture.cupTieId===cup.pending.tieId,firstLeg=isDouble&&Number(fixture.cupLeg)===1,secondLeg=isDouble&&Number(fixture.cupLeg)===2,aggregate=null;
  if(recorded&&competition==='cup')Object.assign(recorded,{country:llMLCountryForTeam(fixture.home,state)||state.playerCountry,cupRound:Number(cup&&cup.round),cupLeg:Number(fixture.cupLeg)||1,cupTieId:fixture.cupTieId||null,roundLabel:fixture.roundLabel||null});
  if(secondLeg)aggregate={player:(Number(cup.pending.firstLeg&&cup.pending.firstLeg.playerGoals)||0)+pg,opponent:(Number(cup.pending.firstLeg&&cup.pending.firstLeg.opponentGoals)||0)+og};
  var needsPens=(competition==='playoff'&&pg===og)||(competition==='cup'&&!firstLeg&&(secondLeg?aggregate.player===aggregate.opponent:pg===og));
  var shootout=needsPens&&typeof llV12PenaltyShootout==='function'?llV12PenaltyShootout(state,match.player,match.opponent):null;
  if(shootout)shootout.aggregate=aggregate||{player:pg,opponent:og};
  var winner=firstLeg?null:shootout?shootout.winner:secondLeg?(aggregate.player>aggregate.opponent?match.player:match.opponent):(pg===og?(Math.random()<.5?match.player:match.opponent):pg>og?match.player:match.opponent);
  if(recorded&&competition!=='league'){
    recorded.knockoutWinner=winner;
    if(aggregate)recorded.aggregate={player:aggregate.player,opponent:aggregate.opponent};
    if(firstLeg)recorded.decisionResult='first-leg';
    else if(shootout){recorded.penaltyShootout=Object.assign({},shootout);recorded.regulationResult='draw';recorded.decisionResult=winner===match.player?'penalties-win':'penalties-loss';var decidedLp=winner===match.player?reward.win:reward.loss;state.lp+=decidedLp-lp;lp=decidedLp;recorded.lpAwarded=lp;recorded.lpDecision='penalties';}
    else{recorded.decisionResult=winner===match.player?'win':'loss';recorded.lpAwarded=lp;}
  }
  if(competition==='league'){llV2PlayLeagueWeek('super',fixture.league==='super'?fixture:null);llV2PlayLeagueWeek('first',fixture.league==='first'?fixture:null);llDevelopOpponents(state.week);state.week++;}
  else if(competition==='cup'){
    if(firstLeg){cup.pending.firstLeg={playerGoals:pg,opponentGoals:og,home:fixture.home,away:fixture.away};cup.pending.leg=2;}
    else llV2FinishCupRound(winner);
  }else if(['ucl','uel','uecl'].includes(competition))llV2FinishEuropeRound(winner);
  else if(competition==='playoff')llV2FinishPlayoffMatch(winner);
  state.pendingFixture=null;llSave();llRenderRoundSummary(state.week-(competition==='league'?1:0),lp,pg,og,competition,winner===match.player);
  if(secondLeg&&!shootout){var notice=llArea()&&llArea().querySelector('.ll-notice');if(notice)notice.innerHTML+='<br><b>Toplam skor:</b> '+aggregate.player+'-'+aggregate.opponent+' \u00b7 '+(winner===match.player?'Tur atlad\u0131n':'Elendin');}
};

var llMLCupRoundsSingleLegBase=llV2CupRoundsHtml;
llV2CupRoundsHtml=function(){
  var state=lexLeague.state,cup=state&&state.cup;
  if(!llMLCupUsesTwoLegs(cup))return llMLCupRoundsSingleLegBase();
  var results=(state.results||[]).filter(function(result){return result.competition==='cup';});
  return '<div class="ll-round-list">'+LL_CUP_ROUNDS.map(function(name,round){
    var field=llV2CupRoundField(round),pairs=[];if(field)for(var i=0;i<field.length;i+=2)pairs.push([field[i]||null,field[i+1]||null]);
    var done=!!cup.winner||round<Number(cup.round),current=round===Number(cup.round),weeks=llMLCupRoundWeeks(round);
    var body=pairs.length?pairs.map(function(pair){
      var home=pair[0],away=pair[1];if(!home||!away)return llV2FixtureRow(home,away,null);
      var roundResults=results.filter(function(result){return Number(result.cupRound)===round&&(result.home===home&&result.away===away||result.home===away&&result.away===home);});
      var first=roundResults.find(function(result){return Number(result.cupLeg||1)===1&&result.home===home;})||roundResults.find(function(result){return Number(result.cupLeg||1)===1;})||null;
      var second=roundResults.find(function(result){return Number(result.cupLeg)===2;})||null;
      if(llMLCupRoundIsFinal(round))return llV2FixtureRow(home,away,first);
      var total=first&&second?llMLCupAggregate(pair,first,second):null,advance=second&&second.knockoutWinner?(second.knockoutWinner===home?home:away):null;
      return '<div class="ll-cup-tie"><div class="ll-muted" style="padding:7px 4px 2px">1. ma\u00e7</div>'+llV2FixtureRow(home,away,first)+'<div class="ll-muted" style="padding:7px 4px 2px">R\u00f6van\u015f</div>'+llV2FixtureRow(away,home,second)+(total?'<div class="ll-muted" style="padding:7px 4px 10px"><b>Toplam '+total.a+'-'+total.b+'</b>'+(advance?' \u00b7 '+llEscape(advance)+' tur atlad\u0131':'')+'</div>':'')+'</div>';
    }).join(''):'<div class="ll-muted" style="padding:4px 4px 10px">E\u015fle\u015fmeler \u00f6nceki tur tamamlan\u0131nca belli olacak.</div>';
    var status=done?'Tamamland\u0131':current?'G\u00fcncel tur':'Bekliyor',date=llMLCupRoundIsFinal(round)?weeks[0]+'. hafta':weeks[0]+'-'+weeks[1]+'. haftalar';
    return '<details class="ll-round-card" '+(current&&!cup.winner?'open':'')+'><summary><span>'+llEscape(name)+'</span><span class="ll-round-meta">'+date+' \u00b7 '+status+'</span></summary><div class="ll-fixture-list">'+body+'</div></details>';
  }).join('')+'</div>';
};

var llMLCupDashboardBase=llRenderDashboard;
llRenderDashboard=function(){
  llMLCupDashboardBase();
  var state=lexLeague.state,fixture=typeof llPlayerFixture==='function'?llPlayerFixture():null,cup=state&&state.cup,root=llArea();
  if(!root||!fixture||fixture.competition!=='cup'||Number(fixture.cupLeg)!==2||!llMLCupUsesTwoLegs(cup)||!cup.pending||!cup.pending.firstLeg||root.querySelector('.ll-cup-first-leg'))return;
  var first=cup.pending.firstLeg,player=state.playerTeam,opponent=fixture.home===player?fixture.away:fixture.home,playerWasHome=first.home===player,playerGoals=playerWasHome?first.playerGoals:first.opponentGoals,opponentGoals=playerWasHome?first.opponentGoals:first.playerGoals;
  var host=root.querySelector('.ll-next-match');
  if(host)host.insertAdjacentHTML('afterend','<div class="ll-notice ll-cup-first-leg" style="margin-top:10px"><b>\u0130lk ma\u00e7:</b> '+llEscape(player)+' '+Number(playerGoals)+'-'+Number(opponentGoals)+' '+llEscape(opponent)+'. R\u00f6van\u015fta toplam skor belirleyici olacak.</div>');
};
/* DOMESTIC_CUP_TWO_LEGS_V1_END */
/* New careers used to inherit the old Turkish cup object created before the
 * multi-league bridge. Rebuild every country cup once at career creation only. */
var llMLNewStateCupFormatBase=llNewState;
llNewState=function(playerTeam){
  var state=llMLNewStateCupFormatBase(playerTeam);
  if(state&&state.cups&&state.leagues){
    for(const country of LL_COUNTRY_CODES)state.cups[country]=llMLCreateCup(state,country);
    llMLAttachLegacyAliases(state);
  }
  return state;
};
/* DOMESTIC_CUP_TWO_LEGS_NEW_CAREER_FIX_END */
/* SEASON_CALENDAR_V1_START
 * The game uses an in-world calendar, not the device clock. Season 1 is
 * 2026/27; every following season advances one calendar year. This is fully
 * deterministic, so old saves need no migration of every historical result.
 */
var LL_CALENDAR_VERSION=1;
var LL_CALENDAR_FIRST_SEASON_YEAR=2026;
function llCalendarEnsureState(state){
  if(!state)return state;
  if(!Number.isInteger(Number(state.calendarStartYear))||Number(state.calendarStartYear)<2000)state.calendarStartYear=LL_CALENDAR_FIRST_SEASON_YEAR;
  state.calendarVersion=LL_CALENDAR_VERSION;
  return state;
}
function llCalendarSeasonYear(state){return Number(state&&state.calendarStartYear)||LL_CALENDAR_FIRST_SEASON_YEAR;}
function llCalendarSeasonStartYear(state){return llCalendarSeasonYear(state)+Math.max(0,Number(state&&state.season||1)-1);}
function llCalendarSeasonLabel(state){var year=llCalendarSeasonStartYear(state);return year+'/'+String(year+1).slice(-2);}
function llCalendarCompetitionOffset(competition){
  if(['ucl','uel','uecl'].includes(String(competition)))return 5; // Thursday
  if(String(competition)==='cup')return 3; // Tuesday
  if(String(competition)==='playoff')return 0; // Saturday
  return 0; // League Saturday
}
function llCalendarDate(state,week,competition='league'){
  var year=llCalendarSeasonStartYear(state),safeWeek=Math.max(1,Number(week)||1);
  // 8 August 2026 is a Saturday; UTC prevents a locale/DST date shift.
  return new Date(Date.UTC(year,7,8+(safeWeek-1)*7+llCalendarCompetitionOffset(competition),12,0,0));
}
function llCalendarDateText(state,week,competition='league'){
  try{return llCalendarDate(state,week,competition).toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});}
  catch{return String(week)+'. hafta';}
}
function llCalendarMatchText(state,fixture,week){
  var competition=fixture&&fixture.competition||'league';
  return llCalendarDateText(state,week==null?state&&state.week:week,competition)+' · '+(String(competition)==='league'?'Lig maçı':String(competition)==='cup'?'Yerel kupa':String(competition)==='playoff'?'Play-off':'Avrupa maçı');
}
var llCalendarRepairStateBase=llV2RepairState;
llV2RepairState=function(state){return llCalendarEnsureState(llCalendarRepairStateBase(state));};

function llCalendarDecorateDashboard(){
  var state=lexLeague.state,root=typeof llArea==='function'?llArea():null,fixture=typeof llPlayerFixture==='function'?llPlayerFixture():null;
  if(!state||!root||!fixture)return;
  var brand=root.querySelector&&root.querySelector('.ll-brand .ll-muted');
  if(brand&&!brand.querySelector?.('.ll-season-calendar'))brand.insertAdjacentHTML('beforeend','<span class="ll-season-calendar"> · '+llEscape(llCalendarSeasonLabel(state))+'</span>');
  var match=root.querySelector&&root.querySelector('.ll-next-match');
  if(match&&!root.querySelector('.ll-match-date'))match.insertAdjacentHTML('beforebegin','<div class="ll-match-date" style="margin:8px 0 10px;text-align:center;font-size:12px;font-weight:800;letter-spacing:.03em;color:#67e8f9">📅 '+llEscape(llCalendarMatchText(state,fixture))+'</div>');
}
var llCalendarDashboardBase=llRenderDashboard;
llRenderDashboard=function(){llCalendarDashboardBase();llCalendarDecorateDashboard();};

var llCalendarMatchRenderBase=llRenderMatch;
llRenderMatch=function(){
  llCalendarMatchRenderBase();
  var state=lexLeague.state,root=typeof llArea==='function'?llArea():null,fixture=lexLeague.match&&lexLeague.match.fixture;
  if(!state||!root||!fixture||root.querySelector('.ll-duel-date'))return;
  var top=root.querySelector('.ll-topbar');
  if(top)top.insertAdjacentHTML('afterend','<div class="ll-duel-date" style="text-align:center;margin:3px 0 13px;font-size:13px;font-weight:800;color:#67e8f9">📅 '+llEscape(llCalendarMatchText(state,fixture))+'</div>');
};

var llCalendarRoundSummaryBase=llRenderRoundSummary;
llRenderRoundSummary=function(completedWeek,lp,pg,og,competition,advanced){
  llCalendarRoundSummaryBase(completedWeek,lp,pg,og,competition,advanced);
  var state=lexLeague.state,root=typeof llArea==='function'?llArea():null;
  if(!state||!root||root.querySelector('.ll-result-date'))return;
  var title=root.querySelector('.quiz-start-title');
  if(title)title.insertAdjacentHTML('afterend','<div class="ll-result-date" style="margin:8px 0 12px;font-size:13px;font-weight:800;color:#67e8f9">📅 '+llEscape(llCalendarDateText(state,completedWeek,competition||'league'))+'</div>');
};
/* SEASON_CALENDAR_V1_END */
