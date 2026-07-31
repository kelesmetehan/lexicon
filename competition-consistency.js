/* Competition consistency layer: domestic penalties, decisions and high-stakes visibility. */
const LL_COMPETITION_CONSISTENCY_VERSION='2026-07-31.1';

function llCCPenaltyText(result){
  const pen=result&&result.penaltyShootout;
  if(!pen)return '';
  const winner=result.knockoutWinner||pen.winner||'';
  const score=(pen.scoreA!=null&&pen.scoreB!=null)?`${pen.scoreA}-${pen.scoreB}`:'';
  return `<div class="ll-muted" style="padding:5px 4px 8px;color:#f2c65d"><b>Penaltılar ${score}</b>${winner?` · ${llEscape(winner)} tur atladı`:''}</div>`;
}

function llCCMatchDecision(result,team){
  if(!result)return '';
  const pen=result.penaltyShootout;
  if(!pen)return result.knockoutWinner?`${result.knockoutWinner===team?'Tur atladı':'Elendi'}`:'';
  const score=(pen.scoreA!=null&&pen.scoreB!=null)?`${pen.scoreA}-${pen.scoreB}`:'?';
  return `Penaltılar ${score} · ${result.knockoutWinner===team?'Tur atladı':'Elendi'}`;
}

/* A cup win is a knockout decision, not only a regulation-time score win. */
llV2CupMatchWon=function(state,team=state.playerTeam){
  return (state.results||[]).some(result=>result.competition==='cup'&&(result.home===team||result.away===team)&&(
    result.knockoutWinner===team||
    (result.home===team&&Number(result.homeGoals)>Number(result.awayGoals))||
    (result.away===team&&Number(result.awayGoals)>Number(result.homeGoals))
  ));
};

/* Computer-run domestic ties now use exactly the same stored shootout object as the player. */
const llCCBaseV2SimFixture=llV2SimFixture;
llV2SimFixture=function(fixture,competition='league',league=null,week=lexLeague.state.week){
  const sim=llSimulateMatch(fixture.home,fixture.away);
  llRecordMatch(fixture.home,fixture.away,sim.homeGoals,sim.awayGoals,week,false,competition,league);
  if(sim.resolution)llApplyLocks(sim.resolution,fixture.home,fixture.away);
  const record=lexLeague.state.results[lexLeague.state.results.length-1];
  let winner=sim.homeGoals>sim.awayGoals?fixture.home:sim.awayGoals>sim.homeGoals?fixture.away:null;
  if(!winner&&['cup','playoff'].includes(competition)&&typeof llV12PenaltyShootout==='function'){
    const shootout=llV12PenaltyShootout(lexLeague.state,fixture.home,fixture.away);
    shootout.aggregate={home:sim.homeGoals,away:sim.awayGoals};
    winner=shootout.winner;
    if(record){record.penaltyShootout={...shootout};record.knockoutWinner=winner;record.regulationResult='draw';record.decisionResult=winner===fixture.home?'home-penalties':'away-penalties';}
  }
  if(!winner)winner=Math.random()<.5?fixture.home:fixture.away;
  if(record&&['cup','playoff'].includes(competition)&&!record.knockoutWinner){record.knockoutWinner=winner;record.decisionResult=winner===fixture.home?'home-win':'away-win';}
  return winner;
};

/* The country-agnostic background simulator receives the same persistent result. */
if(typeof llMLSimulateFixture==='function'){
  llMLSimulateFixture=function(state,country,tier,fixture,week,competition='league',cupRound=null){
    const sim=llSimulateMatch(fixture.home,fixture.away);
    llMLRecordDataMatch(state,country,tier,fixture,sim,week,competition,cupRound);
    if(sim.resolution)llApplyLocks(sim.resolution,fixture.home,fixture.away);
    const record=state.results[state.results.length-1];
    let winner=sim.homeGoals>sim.awayGoals?fixture.home:sim.awayGoals>sim.homeGoals?fixture.away:null;
    if(!winner&&['cup','playoff'].includes(competition)&&typeof llV12PenaltyShootout==='function'){
      const shootout=llV12PenaltyShootout(state,fixture.home,fixture.away);
      shootout.aggregate={home:sim.homeGoals,away:sim.awayGoals};
      winner=shootout.winner;
      if(record){record.penaltyShootout={...shootout};record.knockoutWinner=winner;record.regulationResult='draw';record.decisionResult=winner===fixture.home?'home-penalties':'away-penalties';}
    }
    if(!winner)winner=Math.random()<.5?fixture.home:fixture.away;
    if(record&&['cup','playoff'].includes(competition)&&!record.knockoutWinner){record.knockoutWinner=winner;record.decisionResult=winner===fixture.home?'home-win':'away-win';}
    return winner;
  };
}

/* European background knockout ties no longer use a hidden coin toss when aggregate scores are level. */
if(typeof llV11ResolvePair==='function'){
  llV11ResolvePair=function(pair,stage){
    const expected=stage==='final'?1:2;
    if(!pair||(pair.legs||[]).filter(Boolean).length<expected)return null;
    const totals=llV11PairTotals(pair),a=Number(totals[pair.a]||0),b=Number(totals[pair.b]||0);
    if(a!==b)return a>b?pair.a:pair.b;
    if(!pair.penalties&&typeof llV12PenaltyShootout==='function'){
      const shootout=llV12PenaltyShootout(lexLeague.state,pair.a,pair.b);
      shootout.aggregate={[pair.a]:a,[pair.b]:b};
      pair.penalties=shootout;
    }
    return pair.penalties?.winner||(Math.random()<.5?pair.a:pair.b);
  };
}

/* Every domestic-cup row exposes its actual decision, including shootouts. */
const llCCBaseFixtureRow=llV2FixtureRow;
llV2FixtureRow=function(home,away,result=null){
  const html=llCCBaseFixtureRow(home,away,result);
  const detail=llCCPenaltyText(result);
  return detail?html+detail:html;
};

/* TFF 1 Lig play-off results get a small dedicated bracket below the schedule. */
const llCCBaseCompetitionCenter=llRenderCompetitionCenter;
llRenderCompetitionCenter=function(tab='league',key=llTeamLeague(lexLeague.state.playerTeam)||'first'){
  llCCBaseCompetitionCenter(tab,key);
  if(tab!=='league')return;
  const state=lexLeague.state,results=(state.results||[]).filter(result=>result.competition==='playoff'&&Number(result.season)===Number(state.season));
  if(!results.length)return;
  const body=results.map((result,index)=>{
    const decision=llCCMatchDecision(result,state.playerTeam);
    return `<div class="ll-fixture-list" style="margin:8px 0"><div class="ll-muted" style="padding:4px"><b>${llEscape(result.roundLabel||`Play-Off ${index+1}. maç`)}</b></div>${llV2FixtureRow(result.home,result.away,result)}${decision?`<div class="ll-muted" style="padding:2px 4px 8px;color:#79e7df">${llEscape(decision)}</div>`:''}</div>`;
  }).join('');
  const panel=llArea().querySelector('.ll-panel');
  if(panel)panel.insertAdjacentHTML('beforeend',`<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">TFF 1. Lig · Yükselme Play-Off Eşleşmeleri</div>${body}</div>`);
};

/* The season summary tells the truth: the 90-minute card result was a draw, the tournament decision came via penalties. */
const llCCBaseRoundSummary=llRenderRoundSummary;
llRenderRoundSummary=function(completedWeek,lp,pg,og,competition='league',advanced=false){
  llCCBaseRoundSummary(completedWeek,lp,pg,og,competition,advanced);
  if(!['cup','playoff'].includes(competition)||Number(pg)!==Number(og))return;
  const state=lexLeague.state,record=[...(state.results||[])].reverse().find(result=>result.userMatch&&result.competition===competition&&result.penaltyShootout);
  if(!record)return;
  const score=`${record.penaltyShootout.scoreA}-${record.penaltyShootout.scoreB}`;
  const title=llArea().querySelector('.quiz-start-title');
  if(title)title.innerHTML=`${competition==='cup'?'Türkiye Kupası':'Play-Off'} · ${advanced?'Penaltılarda Galibiyet':'Penaltılarda Elenme'} <em>${score}</em>`;
  const detail=llArea().querySelector('.quiz-bonus');
  if(detail)detail.insertAdjacentHTML('beforeend',`<br><b>90 dakika:</b> ${pg}-${og} · <b>Penaltılar:</b> ${score} · ${advanced?'Tur atladın':'Elendin'} · LP ${record.lpDecision==='penalties'?'karara göre hesaplandı':'bilgisi kaydedildi'}`);
};

/* European elimination and multi-country derbies/big races are visible on the next-match card. */
const LL_CC_DERBIES={
  TUR:[['Galatasaray','Fenerbahçe'],['Galatasaray','Beşiktaş'],['Fenerbahçe','Beşiktaş']],
  ENG:[['Manchester United','Liverpool'],['Arsenal','Tottenham Hotspur'],['Manchester City','Manchester United'],['Liverpool','Everton']],
  ESP:[['Real Madrid','Barcelona'],['Real Madrid','Atlético Madrid'],['Sevilla','Real Betis']],
  GER:[['Bayern München','Borussia Dortmund']],
  ITA:[['Inter','AC Milan'],['Roma','Lazio'],['Juventus','Torino']],
  FRA:[['Paris Saint-Germain','Marseille'],['Lyon','Saint-Étienne']],
  NED:[['Ajax','Feyenoord'],['Ajax','PSV Eindhoven']]
};
const llCCBaseImportance=llV2MatchImportance;
llV2MatchImportance=function(fixture,key){
  const competition=fixture?.competition||'league';
  if(['ucl','uel','uecl'].includes(competition)){
    const label=String(fixture.roundLabel||'');
    const knockout=Number(fixture.euroLeg)>0||/(Eleme|Son 16|Çeyrek|Yarı|Final)/i.test(label);
    if(!knockout)return '🌍 AVRUPA LİG AŞAMASI MAÇI';
    if(/Final/i.test(label))return '🏆 AVRUPA FİNALİ';
    return Number(fixture.euroLeg)===2?'🌍 AVRUPA ELEME RÖVANŞI':'🌍 AVRUPA ELEME MAÇI';
  }
  let base='';try{base=llCCBaseImportance(fixture,key);}catch(e){}
  if(base)return base;
  const state=lexLeague.state;
  let country=state?.playerCountry||'TUR';
  try{country=llMLTeamCompetition(fixture.home,state)?.country||country;}catch(e){}
  const pair=[fixture.home,fixture.away].sort().join('|');
  const derby=(LL_CC_DERBIES[country]||[]).some(item=>item.slice().sort().join('|')===pair);
  if(derby)return '🔥 BÜYÜK DERBİ';
  if(competition!=='league'||Number(state?.week)<15)return '';
  try{
    const info=llMLTeamCompetition(fixture.home,state),meta=LL_MULTI_LEAGUES?.[info.country],rows=Object.values(state.standings?.[info.country]?.[info.tier]||{}).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF),positions=[fixture.home,fixture.away].map(team=>rows.findIndex(row=>row.team===team)+1);
    if(info.tier===1&&positions.some(position=>position>rows.length-Number(meta?.relegate||3)))return '⚠️ DÜŞME HATTI MAÇI';
    if(info.tier===2&&positions.some(position=>position>0&&position<=Number(meta?.playoffTo||6)))return '⬆️ YÜKSELME YARIŞI MAÇI';
    if(info.tier===1&&positions.some(position=>position>0&&position<=6))return '🌍 AVRUPA YARIŞI MAÇI';
  }catch(e){}
  return '';
};

/* European knockout second-leg context on the match dashboard. */
function llCCEuropeFirstLegContextHtml(fixture){
  const state=lexLeague.state,e=state?.europe,comp=fixture?.competition;
  if(!state||!e||!['ucl','uel','uecl'].includes(comp)||fixture?.league!=='euro-knockout'||Number(e?.tie?.leg)!==2)return '';
  const player=state.playerTeam,opponent=e.tie?.opponent;
  if(!player||!opponent)return '';
  const first=[...(state.results||[])].reverse().find(result=>result?.userMatch&&result.competition===comp&&result.league==='euro-knockout'&&result.home===opponent&&result.away===player);
  if(!first)return '';
  const playerGoals=Number(first.awayGoals)||0,opponentGoals=Number(first.homeGoals)||0;
  const totalLabel=playerGoals===opponentGoals?'Toplam skor e?it; 90 dakika sonunda e?it kal?rsa penalt?lar at?l?r.':playerGoals>opponentGoals?'Toplamda ?ndesin.':'Toplamda geridesin.';
  return `<div class="ll-euro-leg-context"><div><span>?LK MA?</span><b>${llEscape(opponent)} ${opponentGoals}?${playerGoals} ${llEscape(player)}</b></div><div><span>TOPLAM</span><strong>${llEscape(player)} ${playerGoals}?${opponentGoals} ${llEscape(opponent)}</strong></div><small>${totalLabel}</small></div>`;
}
const llCCDashboardWithLegContext=llRenderDashboard;
llRenderDashboard=function(){
  llCCDashboardWithLegContext();
  const fixture=llPlayerFixture(),context=llCCEuropeFirstLegContextHtml(fixture);
  if(!context)return;
  const card=llArea()?.querySelector('.ll-next-match')?.closest('.ll-card');
  if(card&&!card.querySelector('.ll-euro-leg-context'))card.querySelector('.ll-next-match')?.insertAdjacentHTML('beforebegin',context);
};


/* Current domestic matchweek fixtures beside dashboard standings. */
function llCCDashboardWeekFixturesHtml(key){
  const state=lexLeague.state,week=Math.max(1,Number(state?.week)||1),round=llCurrentRound(key)||[];
  if(!round.length)return '';
  const played=round.filter(fixture=>llV2FixtureResult(fixture.home,fixture.away,'league',week)).length;
  return `<div class="ll-card ll-dashboard-fixtures" data-dashboard-week-fixtures><div class="ll-card-title">${week}. Hafta ? E?le?meler <span class="ll-round-meta">${played}/${round.length} oynand?</span></div><div class="ll-fixture-list">${round.map(fixture=>llV2FixtureRow(fixture.home,fixture.away,llV2FixtureResult(fixture.home,fixture.away,'league',week))).join('')}</div></div>`;
}
const llCCDashboardWithWeekFixtures=llRenderDashboard;
llRenderDashboard=function(){
  llCCDashboardWithWeekFixtures();
  const fixture=llPlayerFixture();
  if(!fixture||fixture.competition!=='league')return;
  const key=fixture.league||llTeamLeague(lexLeague.state?.playerTeam)||'first',html=llCCDashboardWeekFixturesHtml(key);
  if(!html)return;
  const grid=llArea()?.querySelector('.ll-grid'),column=grid?.lastElementChild;
  if(column&&!column.querySelector('[data-dashboard-week-fixtures]'))column.insertAdjacentHTML('beforeend',html);
};


/* Archived domestic standings for every simulated country at season end. */
function llCCSeasonEndCountrySummaries(entry){
  const codes=(typeof LL_COUNTRY_CODES!=='undefined'&&Array.isArray(LL_COUNTRY_CODES))?LL_COUNTRY_CODES:[entry?.country||'TUR'];
  return codes.filter(code=>typeof llMLArchiveSummary==='function'&&llMLArchiveSummary(entry,code));
}
function llCCSeasonEndCountryStandingsHtml(entry,requestedCountry,requestedTier){
  const countries=llCCSeasonEndCountrySummaries(entry);
  if(!countries.length)return '';
  const fallback=entry?.country||countries[0];
  const country=countries.includes(requestedCountry)?requestedCountry:(countries.includes(fallback)?fallback:countries[0]);
  const tier=requestedTier==='tier2'?'tier2':'tier1';
  const summary=llMLArchiveSummary(entry,country),meta=llMLCountryMeta(country),leagueLabel=llMLLeagueLabel(country,tier),cupNames=typeof LL_DOMESTIC_CUP_NAMES!=='undefined'?LL_DOMESTIC_CUP_NAMES:{},cupName=cupNames[country]||'Yerel Kupa';
  const champion=summary?.tier1Rows?.[0]?.team||'—';
  const countryTabs=countries.map(code=>{const item=llMLCountryMeta(code);return `<button class="ll-btn ${code===country?'primary':''}" type="button" onclick="llCCSelectSeasonEndStandings('${code}','${tier}')">${llEscape(item.flag)} ${llEscape(item.country)}</button>`;}).join('');
  const tierTabs=['tier1','tier2'].map(item=>`<button class="ll-btn ${item===tier?'primary':''}" type="button" onclick="llCCSelectSeasonEndStandings('${country}','${item}')">${llEscape(llMLLeagueLabel(country,item))}</button>`).join('');
  return `<div class="ll-card-title">Sezon Sonu Puan Durumu <span style="color:var(--text3);font-size:.76em">${llEscape(meta.flag)} ${llEscape(meta.country)}</span></div><div class="ll-actions" style="margin:0 0 10px">${countryTabs}</div><div class="ll-actions" style="margin:0 0 10px">${tierTabs}</div><div class="ll-notice" style="margin:0 0 12px"><b>${llEscape(leagueLabel)} şampiyonu:</b> ${llEscape(champion)} · <b>${llEscape(cupName)}:</b> ${llEscape(summary?.cupWinner||'—')}</div>${llMLArchivedTableHtml(summary,country,tier)}`;
}
function llCCInjectSeasonEndCountryStandings(country,tier){
  const state=lexLeague.state,entry=state?.lastSeasonSummary,root=llArea();
  if(!state||!entry||!root||typeof llMLArchivedTableHtml!=='function')return;
  const host=[...root.querySelectorAll('.ll-card')].find(card=>/Sezon Sonu Puan Durumu/i.test(card.querySelector('.ll-card-title')?.textContent||''));
  if(!host)return;
  const currentCountry=country||state.__ccSeasonEndCountry||state.playerCountry||entry.country;
  const currentTier=tier||state.__ccSeasonEndTier||'tier1';
  const html=llCCSeasonEndCountryStandingsHtml(entry,currentCountry,currentTier);
  if(html)host.innerHTML=html;
}
function llCCSelectSeasonEndStandings(country,tier){
  const state=lexLeague.state;
  if(!state)return;
  state.__ccSeasonEndCountry=country;
  state.__ccSeasonEndTier=tier==='tier2'?'tier2':'tier1';
  llCCInjectSeasonEndCountryStandings(state.__ccSeasonEndCountry,state.__ccSeasonEndTier);
}
const llCCManagerMarketWithSeasonEndCountries=llRenderManagerMarket;
llRenderManagerMarket=function(tableKey='super'){
  llCCManagerMarketWithSeasonEndCountries(tableKey);
  const defaultTier=String(tableKey)==='first'?'tier2':'tier1';
  llCCInjectSeasonEndCountryStandings(lexLeague.state?.__ccSeasonEndCountry||lexLeague.state?.playerCountry,lexLeague.state?.__ccSeasonEndTier||defaultTier);
};
