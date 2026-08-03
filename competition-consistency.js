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
  const totalLabel=playerGoals===opponentGoals?'Toplam skor e\u015fit; 90 dakika sonunda e\u015fit kal\u0131rsa penalt\u0131lar at\u0131l\u0131r.':playerGoals>opponentGoals?'Toplamda \u00f6ndesin.':'Toplamda geridesin.';
  return `<div class="ll-euro-leg-context"><div><span>\u0130LK MA\u00c7</span><b>${llEscape(opponent)} ${opponentGoals}-${playerGoals} ${llEscape(player)}</b></div><div><span>TOPLAM</span><strong>${llEscape(player)} ${playerGoals}-${opponentGoals} ${llEscape(opponent)}</strong></div><small>${totalLabel}</small></div>`;
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
  return `<div class="ll-card ll-dashboard-fixtures" data-dashboard-week-fixtures><div class="ll-card-title">${week}. Hafta E\u015fle\u015fmeleri <span class="ll-round-meta">${played}/${round.length} oynand\u0131</span></div><div class="ll-fixture-list">${round.map(fixture=>llV2FixtureRow(fixture.home,fixture.away,llV2FixtureResult(fixture.home,fixture.away,'league',week))).join('')}</div></div>`;
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


/* Season-opening presentation must follow the manager's newly selected country. */
function llCCOpeningArchiveStar(entry,country,name){
  const summary=typeof llMLArchiveSummary==='function'?llMLArchiveSummary(entry,country):null;
  const rows=[...(summary?.tier1Rows||[]),...(summary?.tier2Rows||[])];
  const row=rows.find(item=>item.team===name);
  return Number(row?.stars||0);
}
function llCCOpeningStarChanges(state,latest,country){
  const previous=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-2)||null;
  const names=[...(state.leagues?.[country]?.tier1||[]),...(state.leagues?.[country]?.tier2||[])];
  return names.map(name=>{
    const from=previous?llCCOpeningArchiveStar(previous,country,name):llCCOpeningArchiveStar(latest,country,name);
    const to=previous?llCCOpeningArchiveStar(latest,country,name):Number(state.teams?.[name]?.stars||0);
    return {name,from,to};
  }).filter(item=>item.from&&item.to&&item.from!==item.to).sort((a,b)=>Math.abs(b.to-b.from)-Math.abs(a.to-a.from)||a.name.localeCompare(b.name,'tr'));
}
function llCCOpeningTeamRows(names,emptyText){
  if(!names?.length)return `<div class="ll-muted">${llEscape(emptyText)}</div>`;
  return `<div class="ll-season-team-list">${names.map(name=>`<div class="ll-season-team-row"><strong>${llTeamLogo(name,'table')}${llEscape(name)}</strong><span>${llStars(llV2TeamStarsInState(lexLeague.state,name))}</span></div>`).join('')}</div>`;
}
function llCCPatchSeasonOpeningCountryData(){
  const state=lexLeague.state,root=llArea(),country=state?.playerCountry;
  if(!state||!root||!country||typeof llMLArchiveSummary!=='function')return;
  const latest=(state.seasonHistory||[]).find(item=>Number(item.season)===Number(state.season)-1)||null;
  const summary=latest?llMLArchiveSummary(latest,country):null;
  if(!summary)return;
  const countryMeta=llMLCountryMeta(country),tier=llMLTeamCompetition(state.playerTeam,state)?.tier||'tier2',leagueNames=state.leagues?.[country]?.[tier]||[];
  const grids=[...root.querySelectorAll('.ll-season-grid')];
  if(grids[0])grids[0].innerHTML=`<div class="ll-season-card"><div class="ll-card-title">${llEscape(llMLLeagueLabel(country,'tier1'))}'e Yükselenler</div>${llCCOpeningTeamRows(summary.promoted||[],'Yükselen takım kaydı yok.')}</div><div class="ll-season-card"><div class="ll-card-title">${llEscape(llMLLeagueLabel(country,'tier2'))}'e Düşenler</div>${llCCOpeningTeamRows(summary.relegated||[],'Düşen takım kaydı yok.')}</div>`;
  const changes=llCCOpeningStarChanges(state,latest,country),distribution=[6,5,4,3,2,1].map(star=>({star,count:leagueNames.filter(name=>llV2TeamStarsInState(state,name)===star).length})).filter(item=>item.count);
  const starCard=grids[1]?[...grids[1].querySelectorAll('.ll-season-card')].find(card=>/Yıldız Dengesi/.test(card.textContent||'')):null;
  if(starCard){
    const changeHtml=changes.length?llCCOpeningTeamRows(changes.slice(0,8).map(item=>item.name),'')+`<div class="ll-muted" style="margin-top:8px">${changes.slice(0,8).map(item=>`${llEscape(item.name)}: ${item.from}★ → ${item.to}★`).join(' · ')}</div>`:'<div class="ll-muted">Kaydedilen sezonlar arasında yıldız değişimi yok.</div>';
    starCard.innerHTML=`<div class="ll-card-title">Yıldız Dengesi ve Değişimler</div><div class="ll-muted" style="margin-bottom:9px">${llEscape(countryMeta.flag)} ${distribution.map(item=>`${item.star}★: ${item.count} takım`).join(' · ')}</div>${changeHtml}`;
  }
  const europeGrid=grids[2],europeCard=europeGrid?[...europeGrid.querySelectorAll('.ll-season-card')].find(card=>/Avrupa Temsilcileri/.test(card.textContent||'')):null;
  if(europeCard){
    const q=summary.qualifications||{ucl:[],uel:[],uecl:[]};
    europeCard.innerHTML=`<div class="ll-card-title">${llEscape(countryMeta.country)} Avrupa Temsilcileri</div><div class="ll-season-europe-grid">${['ucl','uel','uecl'].map(type=>`<div class="ll-season-europe"><b>${llEscape(llV2EuroLabel(type))}</b>${(q[type]||[]).map(name=>`<div class="ll-season-team-row"><strong>${llTeamLogo(name,'table')}${llEscape(name)}</strong><span>${name===state.playerTeam?'SEN':''}</span></div>`).join('')||'<div class="ll-muted">Temsilci yok.</div>'}</div>`).join('')}</div>`;
  }
}
const llCCSeasonOpeningCountryBase=llRenderSeasonOpening;
llRenderSeasonOpening=function(){
  llCCSeasonOpeningCountryBase();
  llCCPatchSeasonOpeningCountryData();
};


/* Explain the club-market discount wherever a regular pack price is shown. */
function llCCMarketDiscountCard(state=lexLeague.state){
  const card=llCard(llTeamState(state?.playerTeam)?.clubCards?.market);
  return card?.id==='RBU04'?card:null;
}
const llCCTransferBannerWithDiscount=llTransferWindowBanner;
llTransferWindowBanner=function(week){
  const html=llCCTransferBannerWithDiscount(week),card=llCCMarketDiscountCard();
  if(!html||!card)return html;
  return html.replace(/Kart kasas\u0131 100 AP/,'Kart kasas\u0131 <s>150 AP</s> \u2192 <b>100 AP</b> \u00b7 '+llEscape(card.name)+' indirimi aktif');
};
const llCCShopWithDiscountExplanation=llRenderShop;
llRenderShop=function(){
  llCCShopWithDiscountExplanation();
  const card=llCCMarketDiscountCard(),root=llArea();
  if(!card||!root||root.querySelector('[data-market-discount-note]'))return;
  const topbar=root.querySelector('.ll-topbar');
  if(topbar)topbar.insertAdjacentHTML('afterend','<div class="ll-notice" data-market-discount-note style="margin:12px 0;border-color:rgba(250,204,21,.58)"><b>\u2699 '+llEscape(card.name)+' indirimi aktif:</b> Bu kul\u00fcb\u00fcn kal\u0131c\u0131 market kart\u0131 normal kasa bedelini bu transfer d\u00f6neminde <s>150 AP</s> \u2192 <b>100 AP</b> yap\u0131yor.</div>');
  root.querySelectorAll('button[onclick*="llOpenShopPack"]').forEach(button=>{if(/100 AP ile Kasa A\u00e7/.test(button.textContent||''))button.textContent='100 AP \u00b7 \u0130ndirimli Kasa A\u00e7';});
};


/* Taktik Tahtasi: visible dedicated club-market offer. */
const LL_TACTIC_BOARD_ID='RBU04';
const LL_TACTIC_BOARD_COST=150;
const llTacticBoardEligibleCardsBase=llEligibleCards;
llEligibleCards=function(teamName,pos){
  return llTacticBoardEligibleCardsBase(teamName,pos).filter(card=>!card?.clubCard);
};
function llTacticBoardCard(){return llCard(LL_TACTIC_BOARD_ID);}
function llTacticBoardMarketHtml(){
  const state=lexLeague.state,team=llTeamState(state?.playerTeam),card=llTacticBoardCard();
  if(!state||!team||!card)return '';
  const owned=team?.clubCards?.market===card.id;
  const other=team?.clubCards?.market&&team.clubCards.market!==card.id?llCard(team.clubCards.market):null;
  if(owned)return '<div class="ll-card" data-tactic-board-market style="margin-top:16px;border-color:rgba(250,204,21,.7);background:linear-gradient(135deg,rgba(120,53,15,.22),rgba(14,116,144,.14))"><div class="ll-card-title">\u2699 Kul\u00fcp / Market Kart\u0131</div><div class="ll-team-name">'+llEscape(card.name)+' <span class="ll-rarity rare">NAD\u0130R</span></div><div class="ll-sub" style="margin-top:8px"><b>Aktif indirim:</b> Normal kasa <s>150 AP</s> \u2192 <b>100 AP</b>. Bu kart aktif zar yuvalar\u0131n\u0131 ve kart s\u00f6zle\u015fmelerini etkilemez.</div></div>';
  if(other)return '<div class="ll-card" data-tactic-board-market style="margin-top:16px"><div class="ll-card-title">\u2699 Kul\u00fcp / Market Kart\u0131</div><div class="ll-muted">Kul\u00fcb\u00fcn market yuvas\u0131nda '+llEscape(other.name)+' var.</div></div>';
  const disabled=Number(state.ap||0)<LL_TACTIC_BOARD_COST;
  return '<div class="ll-card" data-tactic-board-market style="margin-top:16px;border-color:rgba(250,204,21,.7);background:linear-gradient(135deg,rgba(120,53,15,.22),rgba(14,116,144,.14))"><div class="ll-card-title">\u2699 \u00d6zel Kul\u00fcp Teklifi \u00b7 Transfer D\u00f6nemi</div><div class="ll-team-name">'+llEscape(card.name)+' <span class="ll-rarity rare">NAD\u0130R</span></div><div class="ll-sub" style="margin-top:8px"><b>Kul\u00fcp / Market kart\u0131:</b> Aktif zar yuvas\u0131 i\u015fgal etmez. Bir kez al\u0131nd\u0131\u011f\u0131nda normal kasa bedeli kal\u0131c\u0131 olarak <s>150 AP</s> \u2192 <b>100 AP</b> olur.</div><button class="ll-btn gold" style="width:100%;margin-top:12px" '+(disabled?'disabled':'')+' onclick="llBuyTacticBoard()">'+LL_TACTIC_BOARD_COST+' AP ile Taktik Tahtas\u0131 Al</button></div>';
}
function llBuyTacticBoard(){
  const state=lexLeague.state;
  if(!state||!llIsTransferWindow(state.week)){alert('Taktik Tahtas\u0131 yaln\u0131zca transfer d\u00f6neminde al\u0131nabilir.');return false;}
  const team=llTeamState(state.playerTeam);llPrepareV7Team(team,state);
  const card=llTacticBoardCard();
  if(team?.clubCards?.market===card?.id){alert('Taktik Tahtas\u0131 zaten aktif. Normal kasalar 100 AP.');return false;}
  if(team?.clubCards?.market){alert('Kul\u00fcp / Market yuvas\u0131 dolu.');return false;}
  if(Number(state.ap||0)<LL_TACTIC_BOARD_COST){alert('Yetersiz AP. Gerekli: '+LL_TACTIC_BOARD_COST+' AP');return false;}
  if(!confirm(card.name+' kart\u0131 '+LL_TACTIC_BOARD_COST+' AP ile al\u0131ns\u0131n m\u0131?\n\nEtkisi: Normal kasa bedeli kal\u0131c\u0131 olarak 150 AP yerine 100 AP olur.'))return false;
  state.ap-=LL_TACTIC_BOARD_COST;team.clubCards.market=card.id;
  if(!Array.isArray(team.usedCardFamilies))team.usedCardFamilies=[];
  const family=llCardFamilyName(card);if(family&&!team.usedCardFamilies.includes(family))team.usedCardFamilies.push(family);
  llDiscoverCards([card.id]);llSave();llRenderShop();return true;
}
const llTacticBoardRenderShopBase=llRenderShop;
llRenderShop=function(){
  llTacticBoardRenderShopBase();
  const root=llArea();if(!root||root.querySelector('[data-tactic-board-market]'))return;
  const target=root.querySelector('#ll-club-card-shop')||root.querySelector('#ll-shop-offers');
  if(target)target.insertAdjacentHTML('beforebegin',llTacticBoardMarketHtml());
};

/* DIE_PROGRESSION_SYSTEM_START */
/* Three-position die progression. Team stars remain the card eligibility tier. */
var LL_DIE_PROGRESSION_SYSTEM_VERSION=1;
var LL_DIE_PROGRESSION_COSTS={1:275,2:475,3:735,4:1175,5:1675};

function llDieProgressionClampStar(value){return Math.max(1,Math.min(6,Math.round(Number(value)||1)));}
function llDieProgressionEnsureTeam(team){
  if(!team)return null;
  team.stars=llDieProgressionClampStar(team.stars);
  var progress=team.dieProgression;
  var valid=progress&&typeof progress==='object'&&Number(progress.baseStar)===team.stars&&progress.upgraded&&typeof progress.upgraded==='object';
  if(!valid){
    progress={version:LL_DIE_PROGRESSION_SYSTEM_VERSION,baseStar:team.stars,upgraded:{}};
    LL_POSITIONS.forEach(function(position){progress.upgraded[position]=false;});
    team.dieProgression=progress;
  }
  progress.version=LL_DIE_PROGRESSION_SYSTEM_VERSION;
  progress.baseStar=team.stars;
  LL_POSITIONS.forEach(function(position){progress.upgraded[position]=!!progress.upgraded[position]&&team.stars<6;});
  if(!Array.isArray(progress.history))progress.history=[];
  return progress;
}
function llDieProgressionForTeam(teamOrName){return typeof teamOrName==='string'?llDieProgressionEnsureTeam(llTeamState(teamOrName)):llDieProgressionEnsureTeam(teamOrName);}
function llDieProgressionStar(teamOrName,position){
  var team=typeof teamOrName==='string'?llTeamState(teamOrName):teamOrName,progress=llDieProgressionEnsureTeam(team);
  return Math.min(6,Number(team&&team.stars)||1)+(progress&&progress.upgraded[position]?1:0);
}
function llDieProgressionCount(teamOrName){
  var progress=llDieProgressionForTeam(teamOrName);
  return progress?LL_POSITIONS.filter(function(position){return !!progress.upgraded[position];}).length:0;
}
function llDieProgressionCost(teamOrName){
  var team=typeof teamOrName==='string'?llTeamState(teamOrName):teamOrName;
  if(!team||Number(team.stars)>=6)return 0;
  return Number(LL_DIE_PROGRESSION_COSTS[Number(team.stars)])||0;
}
function llDieProgressionRangeText(teamOrName,position){return llRangeText(llDieProgressionStar(teamOrName,position));}
function llDieProgressionStatusText(team){
  var done=llDieProgressionCount(team);
  return Number(team.stars)>=6?'6 \u2605 maks. seviye':done+'/3 zar geli\u015ftirildi';
}
function llDieProgressionRecord(team,entry){
  var progress=llDieProgressionEnsureTeam(team);
  if(!progress)return;
  progress.history.push(entry);
  progress.history=progress.history.slice(-40);
}
function llUpgradePositionDie(position){
  var state=lexLeague.state,team=llTeamState(state&&state.playerTeam);
  if(!state||!team||!LL_POSITIONS.includes(position))return;
  var progress=llDieProgressionEnsureTeam(team),fromStar=Number(team.stars)||1;
  if(fromStar>=6){alert('Tak\u0131m 6 \u2605 seviyesinde; zar geli\u015ftirme tamamland\u0131.');return;}
  if(progress.upgraded[position]){alert(position+' zar\u0131 bu y\u0131ld\u0131z basama\u011f\u0131nda zaten geli\u015ftirildi. Di\u011fer iki mevkiyi de geli\u015ftirince tak\u0131m y\u0131ld\u0131z\u0131 artar.');return;}
  var cost=llDieProgressionCost(team),before=llRangeText(fromStar),after=llRangeText(Math.min(6,fromStar+1));
  if(Number(state.lp)<cost){alert('Yetersiz LP. Gerekli: '+cost+' LP');return;}
  if(!confirm(position+' zar\u0131 '+before+' aral\u0131\u011f\u0131ndan '+after+' aral\u0131\u011f\u0131na geli\u015fecek. Bedel: '+cost+' LP. Onayl\u0131yor musun?'))return;
  state.lp-=cost;
  progress.upgraded[position]=true;
  var completed=LL_POSITIONS.every(function(pos){return progress.upgraded[pos];});
  llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'die-upgrade',position:position,fromStar:fromStar,toStar:Math.min(6,fromStar+1),costLp:cost,at:new Date().toISOString()});
  if(completed){
    team.stars=Math.min(6,fromStar+1);
    progress.baseStar=team.stars;
    LL_POSITIONS.forEach(function(pos){progress.upgraded[pos]=false;});
    llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'team-star-complete',fromStar:fromStar,toStar:team.stars,at:new Date().toISOString()});
    alert('Uc mevki de geli\u015fti. Tak\u0131m '+team.stars+' \u2605 oldu.');
  }
  llSave();llRenderDashboard();
}

function llDieProgressionPanelHtml(team){
  var progress=llDieProgressionEnsureTeam(team),done=llDieProgressionCount(team),cost=llDieProgressionCost(team),maxed=Number(team.stars)>=6;
  var rows=LL_POSITIONS.map(function(position){
    var upgraded=!!progress.upgraded[position],current=llDieProgressionStar(team,position),base=Number(team.stars)||1;
    var label=upgraded?'Geli\u015ftirildi':maxed?'Maksimum':'Geli\u015ftir';
    var disabled=upgraded||maxed?' disabled':'';
    var detail=upgraded?llRangeText(current)+' aktif':llRangeText(base)+' \u2192 '+llRangeText(Math.min(6,base+1));
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07)"><span><b>'+LL_POSITION_ICONS[position]+' '+llEscape(position)+'</b><small style="display:block;color:var(--text2);margin-top:2px">'+detail+'</small></span><button class="ll-btn '+(upgraded?'':'gold')+'" style="padding:7px 10px;font-size:12px"'+disabled+' onclick="llUpgradePositionDie(\''+position+'\')">'+label+(upgraded?'':' \u00b7 '+cost+' LP')+'</button></div>';
  }).join('');
  return '<div class="ll-card" id="ll-die-progression" style="margin-top:12px;border-color:rgba(34,211,238,.38)"><div class="ll-card-title">Zar Geli\u015fimi \u00b7 '+llDieProgressionStatusText(team)+'</div><div class="ll-sub" style="margin:6px 0 8px">Her mevki ayr\u0131 geli\u015fir. Ucuncu geli\u015fim tamamlan\u0131nca tak\u0131m y\u0131ld\u0131z\u0131 artar; kart uygunlu\u011fu o ana kadar mevcut tak\u0131m y\u0131ld\u0131z\u0131yla hesaplan\u0131r.</div>'+rows+'<div class="ll-muted" style="margin-top:8px">Bu basamak: '+done+'/3 \u00b7 Her zar geli\u015fimi '+(maxed?'tamamland\u0131':cost+' LP')+'.</div></div>';
}

var llDieProgressionRepairBase=llV2RepairState;
llV2RepairState=function(state){
  state=llDieProgressionRepairBase(state);
  if(!state)return state;
  Object.values(state.teams||{}).forEach(llDieProgressionEnsureTeam);
  state.dieProgressionSystemVersion=LL_DIE_PROGRESSION_SYSTEM_VERSION;
  return state;
};

var llDieProgressionRollBase=llRollValue;
llRollValue=function(teamName,position){
  var team=llTeamState(teamName),range=llRange(llDieProgressionStar(team,position)),min=range[0],max=range[1],locked=team.lockedDice&&team.lockedDice[position],value;
  if(Number.isFinite(locked)){delete team.lockedDice[position];value=locked;}else value=llRandomInt(min,max);
  var bonus=Number(team.nextMatchBonuses&&team.nextMatchBonuses[position]||0);
  if(bonus){delete team.nextMatchBonuses[position];value+=bonus;}
  var card=llCard(llActiveCardId(teamName,position));
  if(llBaseName(card)==='Y\u0131ld\u0131z Oyuncu'&&team.stars>=3)value=Math.max(4,value);
  return value;
};
llMakeDice=function(teamName,plusPos){
  var team=llTeamState(teamName);llEnsureTeamContracts(team);
  return LL_POSITIONS.map(function(position){return {uid:teamName+'-'+position+'-'+Math.random(),position:position,value:llRollValue(teamName,position)+(position===plusPos?1:0),cardId:llActiveCardId(teamName,position),stars:llDieProgressionStar(team,position)};});
};

var llDieProgressionAiTriggerBase=llAiTriggerProbability;
llAiTriggerProbability=function(card,teamName,position){
  if(!card)return 0;
  var team=teamName?llTeamState(teamName):null;
  if(team&&LL_POSITIONS.includes(position||card.position)){
    var originalStars=team.stars;
    try{team.stars=llDieProgressionStar(team,position||card.position);return llDieProgressionAiTriggerBase(card,teamName,position);}finally{team.stars=originalStars;}
  }
  return llDieProgressionAiTriggerBase(card,teamName,position);
};
llAiPossibleRerollValues=function(teamName,position){
  var team=llTeamState(teamName),values=llAiDieValues(llDieProgressionStar(team,position)),card=llCard(llActiveCardId(teamName,position));
  return values.map(function(value){return llBaseName(card)==='Y\u0131ld\u0131z Oyuncu'&&team.stars>=3?Math.max(4,value):value;});
};
function llDieProgressionAiReserve(teamName){
  var team=llTeamState(teamName);if(!team)return 0;llEnsureTeamContracts(team);
  return LL_POSITIONS.map(function(position){var card=llCard(team.cards[position]),contract=team.cardContracts[position];if(!card||!contract||contract.remaining>8)return 0;return typeof llAiShouldRenew==='function'&&llAiShouldRenew(teamName,position,card)?Number(llCardContractRule(card).renewLp)||0:0;}).reduce(function(sum,value){return sum+value;},0);
}
function llDieProgressionAiPositionScore(teamName,position){
  var team=llTeamState(teamName),card=llCard(team&&team.cards&&team.cards[position]),stat=team&&team.aiCardPerformance&&card?team.aiCardPerformance[card.id]:null,current=llDieProgressionStar(team,position);
  var cardScore=card&&typeof llAiCardScore==='function'?Number(llAiCardScore(card,teamName,position))||0:0;
  var triggerRate=stat&&Number(stat.matches)>0?(Number(stat.triggers)||0)/Number(stat.matches):0;
  var applicationRate=stat&&Number(stat.matches)>0?(Number(stat.applications)||0)/Number(stat.matches):0;
  var noCard=card?0:45;
  return noCard+(6-current)*12+(80-cardScore)*.35+(1-triggerRate)*7+(1-applicationRate)*5;
}
function llDieProgressionAiAdvance(teamName){
  var state=lexLeague.state,team=llTeamState(teamName);
  if(!state||!team||teamName===state.playerTeam||Number(team.stars)>=6)return {spent:false};
  var progress=llDieProgressionEnsureTeam(team),cost=llDieProgressionCost(team),reserve=llDieProgressionAiReserve(teamName);
  if(Number(team.aiLp)<cost+reserve)return {spent:false,reserve:reserve};
  var candidates=LL_POSITIONS.filter(function(position){return !progress.upgraded[position];}).sort(function(left,right){return llDieProgressionAiPositionScore(teamName,right)-llDieProgressionAiPositionScore(teamName,left)||LL_POSITIONS.indexOf(left)-LL_POSITIONS.indexOf(right);});
  var position=candidates[0];if(!position)return {spent:false};
  var fromStar=Number(team.stars)||1;
  team.aiLp-=cost;progress.upgraded[position]=true;
  var completed=LL_POSITIONS.every(function(pos){return progress.upgraded[pos];});
  llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'ai-die-upgrade',position:position,fromStar:fromStar,toStar:Math.min(6,fromStar+1),costLp:cost,at:new Date().toISOString()});
  if(completed){team.stars=Math.min(6,fromStar+1);progress.baseStar=team.stars;LL_POSITIONS.forEach(function(pos){progress.upgraded[pos]=false;});llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'ai-team-star-complete',fromStar:fromStar,toStar:team.stars,at:new Date().toISOString()});}
  team.aiLastDieUpgrade={season:Number(state.season)||1,week:Number(state.week)||1,position:position,cost:cost,completed:completed};
  return {spent:true,position:position,cost:cost,completed:completed};
}
var llDieProgressionAiRenewBase=llV4RenewAiContracts;
llV4RenewAiContracts=function(teamName){
  llDieProgressionAiRenewBase(teamName);
  return llDieProgressionAiAdvance(teamName);
};

llUpgradeStars=function(){alert('Tak\u0131m y\u0131ld\u0131z\u0131 art\u0131k tek seferde sat\u0131n al\u0131nmaz. Kadro alt\u0131ndaki Zar Geli\u015fimi panelinden Kaleci, Orta Saha ve Forvet zarlar\u0131n\u0131 ayr\u0131 geli\u015ftir.');};
var llDieProgressionDashboardBase=llRenderDashboard;
llRenderDashboard=function(){
  llDieProgressionDashboardBase();
  var state=lexLeague.state,root=typeof llArea==='function'?llArea():null,team=state&&llTeamState(state.playerTeam);
  if(!root||!team||state.seasonEnded)return;
  llDieProgressionEnsureTeam(team);
  var slots=root.querySelectorAll('.ll-squad .ll-slot');
  slots.forEach(function(slot,index){var position=LL_POSITIONS[index],die=slot.querySelector('.ll-die-mini');if(!die||!position)return;var star=llDieProgressionStar(team,position);die.className='ll-die-mini star'+star;die.textContent=llRangeText(star);});
  var legacy=root.querySelector('button[onclick="llUpgradeStars()"]');
  if(legacy)legacy.outerHTML=llDieProgressionPanelHtml(team);
};
/* DIE_PROGRESSION_SYSTEM_END */


/* Taktik Tahtası eski indirim geçişi: normal kasa bedeli sabit 150 AP. */
llCCMarketDiscountCard=function(){return null;};
llTacticBoardMarketHtml=function(){
  const state=lexLeague.state,team=llTeamState(state?.playerTeam),card=llTacticBoardCard();
  if(!state||!team||!card)return '';
  const owned=team?.clubCards?.market===card.id;
  const other=team?.clubCards?.market&&team.clubCards.market!==card.id?llCard(team.clubCards.market):null;
  if(owned)return `<div class="ll-card" data-tactic-board-market style="margin-top:16px;border-color:rgba(250,204,21,.7);background:linear-gradient(135deg,rgba(120,53,15,.22),rgba(14,116,144,.14))"><div class="ll-card-title">🏢 Kulüp / Market Kartı</div><div class="ll-team-name">${llEscape(card.name)} <span class="ll-rarity rare">NADİR</span></div><div class="ll-sub" style="margin-top:8px">Kalıcı, sözleşmesiz. Normal kart kasaları artık sabit olarak <b>150 AP</b>’dir. Bu kartın eski indirim etkisi kapalıdır.</div></div>`;
  if(other)return `<div class="ll-card" data-tactic-board-market style="margin-top:16px"><div class="ll-card-title">🏢 Kulüp / Market Kartı</div><div class="ll-muted">Kulübün market yuvasında ${llEscape(other.name)} var.</div></div>`;
  return '';
};
llBuyTacticBoard=function(){
  alert('Taktik Tahtası’nın eski kasa indirimi kapatıldı. Normal kart kasaları sabit olarak 150 AP’dir; bu kart artık yeni teklif olarak sunulmaz.');
  return false;
};
