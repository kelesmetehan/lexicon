/* Country observer: uses already-simulated multi-league data. It never runs a new simulation. */
(function(){
  function llCBCountries(){return typeof LL_COUNTRY_CODES!=='undefined'?LL_COUNTRY_CODES:['TUR','ENG','GER','ESP','FRA','ITA','NED'];}
  function llCBMeta(code){return (typeof LL_COUNTRY_META!=='undefined'&&LL_COUNTRY_META[code])||{country:code,flag:'🌍',tier1Label:'1. Kademe',tier2Label:'2. Kademe'};}
  function llCBSelectorHtml(activeCode,tab='league',tier='tier1'){
    return `<select class="ll-btn" style="cursor:pointer" onchange="llCBSelectCountry(this.value,'${tab}','${tier}')">${llCBCountries().map(code=>{const meta=llCBMeta(code);return `<option value="${code}" ${code===activeCode?'selected':''}>${meta.flag||''} ${llEscape(meta.country||code)}</option>`;}).join('')}</select>`;
  }
  function llCBSortRows(state,code,tier){return Object.values(state.standings?.[code]?.[tier]||{}).sort((a,b)=>Number(b.Pts)-Number(a.Pts)||Number(b.GD)-Number(a.GD)||Number(b.GF)-Number(a.GF)||String(a.team).localeCompare(String(b.team),'tr'));}
  function llCBLogo(name){return typeof llTeamLogo==='function'?llTeamLogo(name,'table'):'⚽';}
  function llCBLeagueTable(state,code,tier){
    const rows=llCBSortRows(state,code,tier),meta=llCBMeta(code);
    return `<div class="ll-card"><div class="ll-card-title">${meta.flag||''} ${llEscape(typeof llMLLeagueLabel==='function'?llMLLeagueLabel(code,tier):(tier==='tier1'?meta.tier1Label:meta.tier2Label))} · Canlı Puan Durumu</div><div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${index+1}</td><td>${llCBLogo(row.team)}${llEscape(row.team)} <span class="ll-stars">${llStars(Number(state.teams?.[row.team]?.stars||1))}</span></td><td>${Number(row.P)||0}</td><td>${Number(row.W)||0}</td><td>${Number(row.D)||0}</td><td>${Number(row.L)||0}</td><td>${Number(row.GF)||0}</td><td>${Number(row.GA)||0}</td><td>${Number(row.GD)||0}</td><td><b>${Number(row.Pts)||0}</b></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function llCBCupRoundName(cup,round,field){
    const count=(field||[]).filter(Boolean).length;
    if(round===0&&Number(cup?.preliminaryTeamCount)>0)return 'Ön Eleme';
    if(count<=2)return 'Final';if(count<=4)return 'Yarı Final';if(count<=8)return 'Çeyrek Final';if(count<=16)return 'Son 16';if(count<=32)return 'Son 32';return `${round+1}. Tur`;
  }
  function llCBFixtureHtml(home,away,result){
    const score=result?`${Number(result.homeGoals)||0} - ${Number(result.awayGoals)||0}`:'VS',pen=result?.penaltyShootout,penScore=pen&&pen.scoreA!=null&&pen.scoreB!=null?`${pen.scoreA}-${pen.scoreB}`:'';
    return `<div class="ll-fixture-row"><div class="ll-fixture-team">${llCBLogo(home)}<span>${llEscape(home||'BAY')}</span></div><div class="ll-fixture-score">${score}</div><div class="ll-fixture-team away"><span>${llEscape(away||'BAY')}</span>${llCBLogo(away)}</div></div>${penScore?`<div class="ll-muted" style="padding:4px;color:#f2c65d"><b>Penaltılar ${penScore}</b>${result.knockoutWinner?` · ${llEscape(result.knockoutWinner)} tur atladı`:''}</div>`:''}`;
  }
  function llCBLastCupWinner(state,code){
    const previous=[...(state.seasonHistory||[])].sort((a,b)=>Number(b.season)-Number(a.season)).find(entry=>entry?.countrySummaries?.[code]);
    return previous?.countrySummaries?.[code]?.cupWinner||'Henüz belirlenmedi';
  }
  function llCBCupHtml(state,code){
    const cup=state.cups?.[code],meta=llCBMeta(code),results=(state.results||[]).filter(result=>Number(result.season)===Number(state.season)&&result.competition==='cup'&&result.country===code),history=cup?.history||{},rounds=[...new Set([...Object.keys(history).map(Number),...results.map(result=>Number(result.cupRound)).filter(Number.isFinite),Number(cup?.round||0)])].filter(Number.isFinite).sort((a,b)=>a-b);
    const roundsHtml=rounds.map(round=>{const field=history[round]||(round===Number(cup?.round)?cup.field:null),pairs=[];if(Array.isArray(field))for(let index=0;index<field.length;index+=2)pairs.push([field[index]||null,field[index+1]||null]);const matches=results.filter(result=>Number(result.cupRound)===round);const content=pairs.length?pairs.map(([home,away])=>llCBFixtureHtml(home,away,matches.find(result=>result.home===home&&result.away===away))).join(''):matches.length?matches.map(result=>llCBFixtureHtml(result.home,result.away,result)).join(''):'<div class="ll-muted" style="padding:6px 4px">Bu tur için henüz maç yok.</div>';return `<details class="ll-round-card" ${round===Number(cup?.round)&&!cup?.winner?'open':''}><summary><span>${llEscape(llCBCupRoundName(cup,round,field))}</span><span class="ll-round-meta">${matches.length?`${matches.length} maç işlendi`:'Bekliyor'}</span></summary><div class="ll-fixture-list">${content}</div></details>`;}).join('');
    return `<div class="ll-cup-status"><div class="ll-metric"><strong>${llEscape(cup?.winner||'Devam ediyor')}</strong><span>Bu sezon kupa durumu</span></div><div class="ll-metric"><strong>${llEscape(llCBLastCupWinner(state,code))}</strong><span>Son şampiyon</span></div><div class="ll-metric"><strong>${results.length}</strong><span>İşlenen maç</span></div></div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${meta.flag||''} ${llEscape(cup?.name||LL_DOMESTIC_CUP_NAMES?.[code]||'Yerel Kupa')} · Turlar ve Eşleşmeler</div>${roundsHtml||'<div class="ll-muted">Kupa takvimi henüz başlamadı.</div>'}</div>`;
  }
  window.llCBRenderCountryBrowse=function(code,tab='league',tier='tier1'){
    const state=lexLeague.state;if(!state){renderLexiconLeagueLanding();return;}
    const codes=llCBCountries();if(!codes.includes(code))code=state.playerCountry||'TUR';
    const playerCountry=state.playerCountry||'TUR';if(code===playerCountry){llRenderCompetitionCenter(tab==='cup'?'cup':'league');return;}
    const meta=llCBMeta(code),safeTier=tier==='tier2'?'tier2':'tier1',isCup=tab==='cup',leagueName=typeof llMLLeagueLabel==='function'?llMLLeagueLabel(code,safeTier):(safeTier==='tier1'?meta.tier1Label:meta.tier2Label),body=isCup?llCBCupHtml(state,code):llCBLeagueTable(state,code,safeTier);
    const leagueTabs=!isCup?`<div class="ll-subtabs" style="align-items:center;gap:10px"><button class="ll-btn ${safeTier==='tier1'?'primary':''}" onclick="llCBRenderCountryBrowse('${code}','league','tier1')">${llEscape(typeof llMLLeagueLabel==='function'?llMLLeagueLabel(code,'tier1'):meta.tier1Label)}</button><button class="ll-btn ${safeTier==='tier2'?'primary':''}" onclick="llCBRenderCountryBrowse('${code}','league','tier2')">${llEscape(typeof llMLLeagueLabel==='function'?llMLLeagueLabel(code,'tier2'):meta.tier2Label)}</button><span style="margin-left:auto" class="ll-muted">Ülke:</span>${llCBSelectorHtml(code,tab,safeTier)}</div>`:`<div class="ll-subtabs" style="align-items:center;gap:10px"><span class="ll-muted">Ülke:</span>${llCBSelectorHtml(code,tab,safeTier)}</div>`;
    llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Müsabaka <em>Merkezi</em></div><div class="ll-muted">Ülke gözlem modu · mevcut arka plan simülasyon kayıtları</div></div><button class="ll-btn" onclick="llRenderCompetitionCenter('league')">← Ligler ve Fikstür</button></div><div class="ll-comp-tabs"><button class="ll-comp-tab ${!isCup?'active':''}" onclick="llCBRenderCountryBrowse('${code}','league','${safeTier}')">Ligler ve Fikstür</button><button class="ll-comp-tab ${isCup?'active':''}" onclick="llCBRenderCountryBrowse('${code}','cup','${safeTier}')">${llEscape(LL_DOMESTIC_CUP_NAMES?.[code]||meta.cupName||'Yerel Kupa')}</button><button class="ll-comp-tab" onclick="llRenderCompetitionCenter('europe')">Avrupa Kupaları</button></div>${leagueTabs}<div class="ll-notice">${isCup?'Yerel kupa eşleşmeleri, sonuçlar ve penaltı kararları arka plan simülasyonundan okunur.':'Puan durumu arka plan simülasyonunun mevcut haftaya kadar işlediği sonuçları gösterir.'} Yeni simülasyon çalıştırılmaz.</div>${body}</div></div>`;
  };
  window.llCBSelectCountry=function(code,tab='league',tier='tier1'){llCBRenderCountryBrowse(code,tab,tier);};
  const llCBRenderCompetitionCenterBase=window.llRenderCompetitionCenter;
  window.llRenderCompetitionCenter=function(tab='league',key=null){
    llCBRenderCompetitionCenterBase(tab,key);if(tab!=='league')return;
    const state=lexLeague.state;if(!state)return;const subtabs=llArea().querySelector('.ll-subtabs');if(!subtabs||subtabs.querySelector('.ll-cb-country'))return;
    const wrap=document.createElement('span');wrap.className='ll-cb-country';wrap.style.marginLeft='auto';wrap.style.display='inline-flex';wrap.style.alignItems='center';wrap.style.gap='6px';wrap.innerHTML=`<span class="ll-muted">Diğer ülke:</span>${llCBSelectorHtml(state.playerCountry||'TUR')}`;subtabs.style.display='flex';subtabs.style.flexWrap='wrap';subtabs.appendChild(wrap);
  };
})();