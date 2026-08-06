/* TEAM_STAR_RISE_REPORT_START */
/*
 * Season-end star-rise report.
 * Reads completed player/AI die-progression records and shows star increases
 * next to the existing star-decline information. Existing saves are supported
 * through progression history and legacy star-investment history.
 */
(function(){
  'use strict';

  var LL_TEAM_STAR_RISE_REPORT_VERSION=1;

  function deep(value){try{return JSON.parse(JSON.stringify(value));}catch(_error){return value;}}
  function escapeHtml(value){
    if(typeof llEscape==='function')return llEscape(value);
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function clampStar(value){return Math.max(1,Math.min(6,Math.round(Number(value)||1)));}
  function rangeText(star){return typeof llRangeText==='function'?llRangeText(clampStar(star)):String(clampStar(star))+'★';}
  function leagueLabel(country,tier){
    if(typeof llMLLeagueLabel==='function')return llMLLeagueLabel(country,tier);
    return tier==='tier2'?'2. Lig':'1. Lig';
  }
  function countryMeta(code){
    if(typeof llMLCountryMeta==='function')return llMLCountryMeta(code);
    return {country:code||'Lig',flag:'🌍'};
  }
  function teamLogo(name){
    if(typeof llTeamLogo==='function')return llTeamLogo(name,'table');
    return '<span class="ll-star-rise-logo-fallback">'+escapeHtml(String(name||'?').slice(0,2).toUpperCase())+'</span>';
  }

  function teamSeasonContext(state,summary,teamName){
    var countries=summary&&summary.countrySummaries&&typeof summary.countrySummaries==='object'
      ?Object.entries(summary.countrySummaries)
      :[[summary&&summary.country||state&&state.playerCountry||'TUR',{
        tier1Rows:summary&&summary.tier1Rows||summary&&summary.superRows||[],
        tier2Rows:summary&&summary.tier2Rows||summary&&summary.firstRows||[]
      }]];
    for(var countryIndex=0;countryIndex<countries.length;countryIndex++){
      var country=countries[countryIndex][0],info=countries[countryIndex][1]||{};
      var tiers=[['tier1',info.tier1Rows||[]],['tier2',info.tier2Rows||[]]];
      for(var tierIndex=0;tierIndex<tiers.length;tierIndex++){
        var tier=tiers[tierIndex][0],rows=tiers[tierIndex][1]||[];
        for(var rowIndex=0;rowIndex<rows.length;rowIndex++){
          var row=rows[rowIndex];
          if(row&&row.team===teamName){
            return {country:country,tier:tier,position:Number(row.position)||rowIndex+1,teamCount:rows.length};
          }
        }
      }
    }
    var team=state&&state.teams&&state.teams[teamName];
    return {country:team&&team.country||null,tier:team&&team.tier||null,position:0,teamCount:0};
  }

  function normalizeRise(state,summary,teamName,entry,source){
    var context=teamSeasonContext(state,summary,teamName),fromStars=clampStar(entry&&entry.fromStar||entry&&entry.fromStars),toStars=clampStar(entry&&entry.toStar||entry&&entry.toStars);
    if(toStars<=fromStars)return null;
    return {
      season:Number(entry&&entry.season)||Number(summary&&summary.season)||Number(state&&state.season)||1,
      week:Number(entry&&entry.week)||0,
      team:teamName,
      country:context.country,
      tier:context.tier,
      position:context.position,
      teamCount:context.teamCount,
      fromStars:fromStars,
      toStars:toStars,
      player:teamName===state.playerTeam,
      source:source,
      reason:source==='player'?'Üç mevki zarı tamamlandı':source==='ai'?'Yapay zekâ üç mevki zarını geliştirdi':'Takım yıldızı yatırımla yükseltildi',
      at:entry&&entry.at||null
    };
  }

  function collectSeasonStarRises(state,summary){
    if(!state||!summary)return [];
    var season=Number(summary.season)||Number(state.season)||1,records=[],seen=new Set();
    function add(item){
      if(!item)return;
      var key=[item.season,item.team,item.fromStars,item.toStars].join('|');
      if(seen.has(key))return;
      seen.add(key);records.push(item);
    }
    Object.entries(state.teams||{}).forEach(function(pair){
      var name=pair[0],team=pair[1],history=team&&team.dieProgression&&Array.isArray(team.dieProgression.history)?team.dieProgression.history:[];
      history.forEach(function(entry){
        if(!entry||Number(entry.season)!==season)return;
        if(entry.type==='team-star-complete')add(normalizeRise(state,summary,name,entry,'player'));
        if(entry.type==='ai-team-star-complete')add(normalizeRise(state,summary,name,entry,'ai'));
      });
    });
    var legacy=state.starUpgradeInvestments&&Array.isArray(state.starUpgradeInvestments.history)?state.starUpgradeInvestments.history:[];
    legacy.forEach(function(entry){
      if(!entry||entry.type!=='upgrade'||Number(entry.season)!==season||!entry.team)return;
      add(normalizeRise(state,summary,entry.team,entry,'legacy'));
    });
    records.sort(function(left,right){
      return (Number(left.country===state.playerCountry)?-1:0)-(Number(right.country===state.playerCountry)?-1:0)
        ||String(left.country||'').localeCompare(String(right.country||''),'tr')
        ||String(left.tier||'').localeCompare(String(right.tier||''),'tr')
        ||(Number(left.position)||999)-(Number(right.position)||999)
        ||String(left.team).localeCompare(String(right.team),'tr');
    });
    summary.starIncreases=deep(records);
    var archive=(state.seasonHistory||[]).find(function(item){return Number(item&&item.season)===season;});
    if(archive)archive.starIncreases=deep(records);
    state.teamStarRiseReportVersion=LL_TEAM_STAR_RISE_REPORT_VERSION;
    return records;
  }

  function reportDataForSeason(state,season){
    if(!state)return null;
    var requested=Number(season)||Number(state.lastSeasonSummary&&state.lastSeasonSummary.season)||Number(state.season)||1;
    if(state.lastSeasonSummary&&Number(state.lastSeasonSummary.season)===requested)return state.lastSeasonSummary;
    return (state.seasonHistory||[]).find(function(item){return Number(item&&item.season)===requested;})||null;
  }
  function reportCountries(summary){
    var found=[];
    (summary&&summary.starIncreases||[]).forEach(function(item){if(item&&item.country&&!found.includes(item.country))found.push(item.country);});
    if(summary&&summary.countrySummaries)Object.keys(summary.countrySummaries).forEach(function(code){if(!found.includes(code))found.push(code);});
    if(!found.length)found.push(summary&&summary.country||'TUR');
    return found;
  }
  function riseSourceText(item){
    if(item.source==='player')return 'Senin kulübün · üç zar tamamlandı';
    if(item.source==='legacy')return 'LP yatırımıyla yükseliş';
    return 'Yapay zekâ zar gelişimi';
  }
  function riseTeamCardHtml(item){
    var context=[];
    if(item.position)context.push(item.position+'. sıra');
    if(item.teamCount)context.push(item.teamCount+' takımlı lig');
    return '<article class="ll-star-rise-team-card">'
      +'<div class="ll-star-rise-team-head"><div class="ll-star-rise-team-id">'+teamLogo(item.team)+'<div><b>'+escapeHtml(item.team)+'</b><small>'+escapeHtml(leagueLabel(item.country,item.tier))+(context.length?' · '+escapeHtml(context.join(' · ')):'')+'</small></div></div>'
      +'<div class="ll-star-rise-change"><span>'+item.fromStars+'★</span><i>→</i><strong>'+item.toStars+'★</strong></div></div>'
      +'<div class="ll-star-rise-reason"><span>📈</span><div><b>Takım yıldızı yükseldi</b><p>'+escapeHtml(riseSourceText(item))+'. Yeni ortak zar seviyesi '+escapeHtml(rangeText(item.toStars))+'.</p></div></div>'
      +'</article>';
  }
  function playerRiseHtml(state,summary){
    var own=(summary&&summary.starIncreases||[]).filter(function(item){return item.team===state.playerTeam;});
    if(!own.length)return '';
    var first=own[0],last=own[own.length-1];
    return '<div class="ll-star-rise-player"><b>⬆️ Kulüp yıldızı yükseldi: '+first.fromStars+'★ → '+last.toStars+'★</b><br>'
      +escapeHtml(state.playerTeam)+' sezon içinde '+own.length+' yıldız basamağı tamamladı. Üç mevkinin ortak zar seviyesi artık '+escapeHtml(rangeText(last.toStars))+'.</div>';
  }
  function allRisesHtml(summary){
    var list=summary&&summary.starIncreases||[];
    if(!list.length)return '';
    var countries=new Set(list.map(function(item){return item.country;}).filter(Boolean));
    var playerCount=list.filter(function(item){return item.player;}).length,aiCount=list.length-playerCount;
    var preview=list.slice(0,6).map(function(item){return '<div class="ll-star-rise-row"><span>'+teamLogo(item.team)+'<span><b>'+escapeHtml(item.team)+'</b><small>'+escapeHtml(leagueLabel(item.country,item.tier))+' · '+escapeHtml(riseSourceText(item))+'</small></span></span><strong>'+item.fromStars+'★ → '+item.toStars+'★</strong></div>';}).join('');
    return '<div class="ll-card ll-star-rise-list"><div class="ll-star-rise-overview-head"><div><div class="ll-card-title">Sezon Sonu Yıldız Artış Raporu</div><div class="ll-sub">Yıldız düşüş raporunun yanında, sezon içinde tamamlanan tüm yıldız yükselişleri.</div></div><button class="ll-btn gold" onclick="llRenderStarRiseReport('+(Number(summary&&summary.season)||1)+')">Lig Lig Detayı Aç</button></div>'
      +'<div class="ll-star-rise-overview-metrics"><div><strong>'+list.length+'</strong><span>Yıldız artışı</span></div><div><strong>'+countries.size+'</strong><span>Etkilenen ülke</span></div><div><strong>'+playerCount+'</strong><span>Oyuncu kulübü</span></div><div><strong>'+aiCount+'</strong><span>Yapay zekâ kulübü</span></div></div>'
      +preview+(list.length>6?'<div class="ll-muted" style="margin-top:9px">+'+(list.length-6)+' yükseliş daha · tümünü detay ekranında görebilirsin.</div>':'')
      +'</div>';
  }

  function renderStarRiseReport(season,country,tier){
    var state=globalThis.lexLeague&&lexLeague.state,summary=reportDataForSeason(state,season);
    if(!state||!summary||typeof llArea!=='function')return;
    if(!Array.isArray(summary.starIncreases))collectSeasonStarRises(state,summary);
    injectStyles();if(typeof llSetWide==='function')llSetWide(true);
    var all=summary.starIncreases||[],countries=reportCountries(summary),defaultCountry=state.playerCountry||countries[0];
    var firstWithRise=countries.find(function(code){return all.some(function(item){return item.country===code;});});
    var selected=countries.includes(country)?country:(firstWithRise||defaultCountry||countries[0]);
    var selectedTier=tier==='tier2'?'tier2':'tier1';
    if(!tier&&!all.some(function(item){return item.country===selected&&item.tier===selectedTier;})&&all.some(function(item){return item.country===selected&&item.tier==='tier2';}))selectedTier='tier2';
    var selectedList=all.filter(function(item){return item.country===selected&&item.tier===selectedTier;}).sort(function(a,b){return (Number(a.position)||999)-(Number(b.position)||999)||String(a.team).localeCompare(String(b.team),'tr');});
    var selectedCountryList=all.filter(function(item){return item.country===selected;}),meta=countryMeta(selected),seasonNumber=Number(summary.season)||Number(season)||1;
    var back=state.seasonEnded&&state.lastSeasonSummary&&Number(state.lastSeasonSummary.season)===seasonNumber?'llRenderSeasonEnd()':(typeof llRenderSeasonArchive==='function'?"llRenderSeasonArchive("+seasonNumber+",'"+selectedTier+"','"+selected+"')":'llRenderDashboard()');
    var countryTabs=countries.map(function(code){var count=all.filter(function(item){return item.country===code;}).length,m=countryMeta(code);return '<button class="ll-star-rise-country-tab '+(code===selected?'active':'')+'" onclick="llRenderStarRiseReport('+seasonNumber+',\''+code+'\',\''+selectedTier+'\')"><span>'+escapeHtml(m.flag||'🌍')+' '+escapeHtml(m.country||code)+'</span><b>'+count+'</b></button>';}).join('');
    var tierTabs=['tier1','tier2'].map(function(code){var count=all.filter(function(item){return item.country===selected&&item.tier===code;}).length;return '<button class="ll-star-rise-league-tab '+(code===selectedTier?'active':'')+'" onclick="llRenderStarRiseReport('+seasonNumber+',\''+selected+'\',\''+code+'\')"><span>'+escapeHtml(leagueLabel(selected,code))+'</span><b>'+count+' artış</b></button>';}).join('');
    var playerCount=selectedList.filter(function(item){return item.player;}).length;
    var cards=selectedList.map(riseTeamCardHtml).join('')||'<div class="ll-star-rise-empty"><div>☆</div><b>'+escapeHtml(leagueLabel(selected,selectedTier))+' içinde yıldız artışı yok</b><span>Bu sezon bu ligde hiçbir kulüp yeni yıldız basamağı tamamlamadı.</span></div>';
    llArea().innerHTML='<div class="ll-shell"><div class="ll-panel ll-star-rise-report-panel"><div class="ll-topbar"><div><div class="ll-title">Yıldız Artış <em>Raporu</em></div><div class="ll-muted">Sezon '+seasonNumber+' · '+escapeHtml(meta.flag||'')+' '+escapeHtml(meta.country||selected)+' · Lig bazlı gelişim analizi</div></div><button class="ll-btn" onclick="'+back+'">← Geri</button></div>'
      +'<div class="ll-star-rise-hero"><div><span>SEZON '+seasonNumber+'</span><h2>'+all.length+' yıldız yükselişi gerçekleşti</h2><p>Oyuncu ve yapay zekâ kulüplerinin üç mevki zarını tamamlayarak ulaştığı yeni yıldız seviyelerini inceleyebilirsin.</p></div><div class="ll-star-rise-hero-mark">★<small>+1</small></div></div>'
      +'<div class="ll-star-rise-country-tabs">'+countryTabs+'</div><div class="ll-star-rise-league-tabs">'+tierTabs+'</div>'
      +'<div class="ll-star-rise-report-metrics"><div><strong>'+selectedList.length+'</strong><span>Bu ligde artış</span></div><div><strong>'+selectedCountryList.length+'</strong><span>'+escapeHtml(meta.country||selected)+' toplamı</span></div><div><strong>'+playerCount+'</strong><span>Oyuncu kulübü</span></div><div><strong>'+(selectedList.length-playerCount)+'</strong><span>Yapay zekâ kulübü</span></div></div>'
      +'<div class="ll-star-rise-section-title"><div><b>'+escapeHtml(leagueLabel(selected,selectedTier))+'</b><span>Yıldızı yükselen kulüpler</span></div><small>'+selectedList.length+' kayıt</small></div><div class="ll-star-rise-team-list">'+cards+'</div>'
      +'<div class="ll-card ll-star-rise-rules"><div class="ll-card-title">Yıldız Artışı Nasıl Oluşur?</div><div class="ll-sub" style="margin-top:8px">Kaleci, Orta Saha ve Forvet zarlarının üçü de bir üst seviyeye geliştirildiğinde takım yıldızı 1★ artar. Artış üst sınırı 6★’dır. Oyuncu LP, yapay zekâ ise kendi AI LP bütçesini kullanır.</div></div>'
      +'</div></div>';
  }
  globalThis.llRenderStarRiseReport=renderStarRiseReport;

  function injectStyles(){
    if(typeof document==='undefined'||document.getElementById('ll-team-star-rise-report-style'))return;
    var style=document.createElement('style');style.id='ll-team-star-rise-report-style';style.textContent=`
      .ll-star-rise-player{margin:14px 0;padding:13px 15px;border-radius:12px;line-height:1.55;background:linear-gradient(135deg,rgba(20,83,45,.30),rgba(15,23,42,.78));border:1px solid rgba(74,222,128,.52);color:#dcfce7}
      .ll-star-rise-list{margin-top:14px;border-color:rgba(74,222,128,.36);overflow:hidden;background:linear-gradient(135deg,rgba(20,83,45,.08),rgba(15,23,42,.72))}
      .ll-star-rise-overview-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .ll-star-rise-overview-metrics,.ll-star-rise-report-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:13px 0}
      .ll-star-rise-overview-metrics>div,.ll-star-rise-report-metrics>div{padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(15,23,42,.5)}
      .ll-star-rise-overview-metrics strong,.ll-star-rise-report-metrics strong{display:block;font-size:20px;color:#86efac}.ll-star-rise-overview-metrics span,.ll-star-rise-report-metrics span{display:block;margin-top:3px;color:var(--text2);font-size:11px}
      .ll-star-rise-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid rgba(255,255,255,.07)}.ll-star-rise-row:first-of-type{border-top:0}.ll-star-rise-row>span{display:flex;align-items:center;gap:9px;min-width:0}.ll-star-rise-row small{display:block;margin-top:3px;color:var(--text2);white-space:normal}.ll-star-rise-row strong{white-space:nowrap;color:#86efac}
      .ll-star-rise-report-panel{overflow:hidden}.ll-star-rise-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:14px 0 16px;padding:20px;border:1px solid rgba(74,222,128,.36);border-radius:18px;background:radial-gradient(circle at 90% 10%,rgba(74,222,128,.20),transparent 38%),linear-gradient(135deg,rgba(20,83,45,.24),rgba(15,23,42,.88))}.ll-star-rise-hero span{font-size:11px;letter-spacing:.15em;color:#86efac;font-weight:800}.ll-star-rise-hero h2{margin:5px 0 7px;font-size:25px}.ll-star-rise-hero p{margin:0;max-width:680px;color:var(--text2);line-height:1.5}.ll-star-rise-hero-mark{position:relative;flex:0 0 auto;font-size:65px;line-height:1;color:#fbbf24;text-shadow:0 0 24px rgba(251,191,36,.24)}.ll-star-rise-hero-mark small{position:absolute;right:-4px;bottom:-5px;padding:4px 7px;border-radius:999px;background:#16a34a;color:white;font-size:13px;text-shadow:none}
      .ll-star-rise-country-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 1px 9px}.ll-star-rise-country-tab{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:150px;padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(15,23,42,.48);color:var(--text);cursor:pointer}.ll-star-rise-country-tab b{display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:rgba(255,255,255,.08);font-size:11px}.ll-star-rise-country-tab.active{border-color:rgba(74,222,128,.66);background:rgba(20,83,45,.22)}.ll-star-rise-country-tab.active b{background:#16a34a;color:white}
      .ll-star-rise-league-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:4px 0 12px}.ll-star-rise-league-tab{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(15,23,42,.48);color:var(--text);cursor:pointer;text-align:left}.ll-star-rise-league-tab b{color:var(--text2);font-size:11px}.ll-star-rise-league-tab.active{border-color:rgba(74,222,128,.6);background:rgba(20,83,45,.18)}.ll-star-rise-league-tab.active b{color:#bbf7d0}
      .ll-star-rise-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:18px 0 9px}.ll-star-rise-section-title b{display:block;font-size:17px}.ll-star-rise-section-title span,.ll-star-rise-section-title small{color:var(--text2);font-size:11px}.ll-star-rise-team-list{display:grid;gap:10px}.ll-star-rise-team-card{padding:14px;border-radius:14px;border:1px solid rgba(74,222,128,.28);background:linear-gradient(135deg,rgba(20,83,45,.15),rgba(15,23,42,.72))}.ll-star-rise-team-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.ll-star-rise-team-id{display:flex;align-items:center;gap:10px;min-width:0}.ll-star-rise-team-id b{display:block}.ll-star-rise-team-id small{display:block;margin-top:4px;color:var(--text2);font-size:11px}.ll-star-rise-change{display:flex;align-items:center;gap:7px;flex:0 0 auto}.ll-star-rise-change span{color:var(--text2);font-size:18px}.ll-star-rise-change i{font-style:normal;color:#86efac}.ll-star-rise-change strong{padding:5px 9px;border-radius:9px;background:rgba(34,197,94,.16);color:#86efac;font-size:19px}.ll-star-rise-reason{display:flex;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}.ll-star-rise-reason>span{font-size:20px}.ll-star-rise-reason b{font-size:13px}.ll-star-rise-reason p{margin:4px 0 0;color:var(--text2);font-size:12px;line-height:1.5}
      .ll-star-rise-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:175px;padding:22px;border:1px dashed rgba(74,222,128,.3);border-radius:14px;background:rgba(20,83,45,.08);text-align:center}.ll-star-rise-empty>div{display:grid;place-items:center;width:48px;height:48px;margin-bottom:9px;border-radius:999px;background:rgba(34,197,94,.14);color:#86efac;font-size:25px}.ll-star-rise-empty span{margin-top:5px;color:var(--text2);font-size:12px}.ll-star-rise-rules{margin-top:18px;border-color:rgba(74,222,128,.24)}.ll-star-rise-logo-fallback{display:grid;place-items:center;width:31px;height:31px;border-radius:9px;background:rgba(255,255,255,.08);font-size:10px;font-weight:800}
      @media(max-width:760px){.ll-star-rise-overview-head{display:block}.ll-star-rise-overview-head .ll-btn{width:100%;margin-top:10px}.ll-star-rise-overview-metrics,.ll-star-rise-report-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ll-star-rise-hero{padding:16px}.ll-star-rise-hero-mark{font-size:48px}}
      @media(max-width:560px){.ll-star-rise-row{align-items:flex-start}.ll-star-rise-row strong{font-size:13px}.ll-star-rise-league-tabs{grid-template-columns:1fr}.ll-star-rise-team-head{align-items:flex-start}.ll-star-rise-team-id small{white-space:normal}.ll-star-rise-change span,.ll-star-rise-change strong{font-size:15px}.ll-star-rise-hero-mark{display:none}}
    `;document.head.appendChild(style);
  }

  function ensureSummary(){
    var state=globalThis.lexLeague&&lexLeague.state,summary=state&&state.lastSeasonSummary;
    if(!state||!summary)return [];
    return collectSeasonStarRises(state,summary);
  }
  function injectSeasonEnd(){
    if(typeof document==='undefined'||typeof llArea!=='function')return;
    var state=globalThis.lexLeague&&lexLeague.state,summary=state&&state.lastSeasonSummary,root=llArea();
    if(!state||!summary||!root||root.querySelector('[data-star-rise-summary]'))return;
    var list=Array.isArray(summary.starIncreases)?summary.starIncreases:collectSeasonStarRises(state,summary);
    if(!list.length)return;
    injectStyles();
    var html=playerRiseHtml(state,summary)+allRisesHtml(summary),decline=root.querySelector('[data-star-decline-summary]');
    if(decline)decline.insertAdjacentHTML('afterend','<div data-star-rise-summary>'+html+'</div>');
    else{
      var host=root.querySelector('.quiz-start-title')||root.querySelector('.ll-topbar');
      if(host)host.insertAdjacentHTML('afterend','<div data-star-rise-summary>'+html+'</div>');
    }
  }

  if(typeof globalThis.llV2RepairState==='function'){
    var repairBase=globalThis.llV2RepairState;
    globalThis.llV2RepairState=function(state){
      state=repairBase.apply(this,arguments);if(state)state.teamStarRiseReportVersion=LL_TEAM_STAR_RISE_REPORT_VERSION;return state;
    };
  }
  if(typeof globalThis.llV2FinalizeSeason==='function'){
    var finalizeBase=globalThis.llV2FinalizeSeason;
    globalThis.llV2FinalizeSeason=function(){
      var result=finalizeBase.apply(this,arguments),state=globalThis.lexLeague&&lexLeague.state,summary=state&&state.lastSeasonSummary;
      if(state&&summary){collectSeasonStarRises(state,summary);if(typeof llSave==='function')llSave();injectSeasonEnd();}
      return result;
    };
  }
  if(typeof globalThis.llRenderSeasonEnd==='function'){
    var renderSeasonEndBase=globalThis.llRenderSeasonEnd;
    globalThis.llRenderSeasonEnd=function(){var result=renderSeasonEndBase.apply(this,arguments);ensureSummary();injectStyles();injectSeasonEnd();return result;};
  }
  if(typeof globalThis.llRenderManagerMarket==='function'){
    var renderManagerMarketBase=globalThis.llRenderManagerMarket;
    globalThis.llRenderManagerMarket=function(){var result=renderManagerMarketBase.apply(this,arguments);ensureSummary();injectStyles();injectSeasonEnd();return result;};
  }

  injectStyles();
  if(globalThis.lexLeague&&lexLeague.state&&lexLeague.state.lastSeasonSummary)ensureSummary();
})();
/* TEAM_STAR_RISE_REPORT_END */
