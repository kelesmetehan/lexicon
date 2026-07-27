/* Müsabaka Merkezi ülke seçici: Ligler sekmesine, oyuncunun kariyer ülkesi
 * dışındaki ülkelerin 1. ve 2. kademe kulüp listelerini salt-okunur biçimde
 * gösteren bir ülke seçici ekler. Diğer ülkelerde canlı puan durumu/simülasyon
 * yoktur (kariyer yalnızca tek ülkede işler); bu yüzden burada sadece güncel
 * kulüp havuzu (yıldız, pot, forma) bilgi amaçlı listelenir.
 */
(function(){
  function llCBCountries(){
    return (typeof LL_COUNTRY_CODES!=='undefined'?LL_COUNTRY_CODES:['TUR','ENG','GER','ESP','FRA','ITA','NED']);
  }
  function llCBMeta(code){
    return (typeof LL_COUNTRY_META!=='undefined'&&LL_COUNTRY_META[code])||{country:code,flag:'🌍',tier1Label:'1. Kademe',tier2Label:'2. Kademe'};
  }
  function llCBTierPool(code,tier){
    const pools=tier==='tier1'?(typeof LL_TIER1_POOLS!=='undefined'?LL_TIER1_POOLS:null):(typeof LL_TIER2_POOLS!=='undefined'?LL_TIER2_POOLS:null);
    if(pools&&pools[code])return pools[code];
    if(code==='TUR'&&typeof LL_TEAMS!=='undefined'&&typeof LL_FIRST_TEAMS!=='undefined')return tier==='tier1'?LL_TEAMS:LL_FIRST_TEAMS;
    return [];
  }
  function llCBClubRowHtml(team){
    const flag=team.flag||'⚽';
    return `<div class="ll-cup-row"><span>${flag} ${llEscape(team.name)}</span><b>${llStars(team.stars||1)}</b></div>`;
  }
  function llCBSelectorHtml(activeCode){
    const codes=llCBCountries();
    return `<select class="ll-btn" style="cursor:pointer" onchange="llCBSelectCountry(this.value)">${codes.map(code=>{
      const meta=llCBMeta(code);
      return `<option value="${code}" ${code===activeCode?'selected':''}>${meta.flag||''} ${llEscape(meta.country||code)}</option>`;
    }).join('')}</select>`;
  }
  window.llCBRenderCountryBrowse=function(code){
    const s=lexLeague.state;if(!s){renderLexiconLeagueLanding();return;}
    const codes=llCBCountries();
    if(!codes.includes(code))code=s.playerCountry||'TUR';
    const playerCountry=s.playerCountry||'TUR';
    if(code===playerCountry){llRenderCompetitionCenter('league');return;}
    const meta=llCBMeta(code),tier1=llCBTierPool(code,'tier1'),tier2=llCBTierPool(code,'tier2');
    const body=`<div class="ll-card"><div class="ll-card-title">${meta.flag||''} ${llEscape(meta.country||code)} · ${llEscape(meta.tier1Label||'1. Kademe')}</div><div class="ll-cup-list">${tier1.map(llCBClubRowHtml).join('')||'<div class="ll-muted" style="padding:8px 4px">Kulüp verisi bulunamadı.</div>'}</div></div><div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${meta.flag||''} ${llEscape(meta.country||code)} · ${llEscape(meta.tier2Label||'2. Kademe')}</div><div class="ll-cup-list">${tier2.map(llCBClubRowHtml).join('')||'<div class="ll-muted" style="padding:8px 4px">Kulüp verisi bulunamadı.</div>'}</div></div>`;
    llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Müsabaka <em>Merkezi</em></div><div class="ll-muted">Ülke gözlem modu · canlı puan durumu yalnızca kendi kariyer ülkende işler</div></div><button class="ll-btn" onclick="llRenderCompetitionCenter('league')">← Ligler ve Fikstür</button></div><div class="ll-comp-tabs"><button class="ll-comp-tab active">Ligler ve Fikstür</button><button class="ll-comp-tab" onclick="llRenderCompetitionCenter('cup')">${llEscape((typeof LL_DOMESTIC_CUP_NAMES!=='undefined'&&LL_DOMESTIC_CUP_NAMES[playerCountry])||'Kupa')}</button><button class="ll-comp-tab" onclick="llRenderCompetitionCenter('europe')">Avrupa Kupaları</button></div><div class="ll-subtabs" style="align-items:center;gap:10px"><span class="ll-muted">Ülke:</span>${llCBSelectorHtml(code)}</div><div class="ll-notice">Bu görünüm bilgi amaçlıdır: ${llEscape(meta.country||code)} liglerinde kariyerin olmadığı için canlı puan durumu ve fikstür üretilmez, yalnızca güncel kulüp havuzu listelenir.</div>${body}</div></div>`;
  };
  window.llCBSelectCountry=function(code){llCBRenderCountryBrowse(code);};
  const llCBRenderCompetitionCenterBase=window.llRenderCompetitionCenter;
  window.llRenderCompetitionCenter=function(tab='league',key=null){
    llCBRenderCompetitionCenterBase(tab,key);
    if(tab!=='league')return;
    const s=lexLeague.state;if(!s)return;
    const subtabs=llArea().querySelector('.ll-subtabs');
    if(!subtabs||subtabs.querySelector('.ll-cb-country'))return;
    const wrap=document.createElement('span');
    wrap.className='ll-cb-country';
    wrap.style.marginLeft='auto';
    wrap.style.display='inline-flex';
    wrap.style.alignItems='center';
    wrap.style.gap='6px';
    wrap.innerHTML=`<span class="ll-muted">Diğer ülke:</span>${llCBSelectorHtml(s.playerCountry||'TUR')}`;
    subtabs.style.display='flex';
    subtabs.style.flexWrap='wrap';
    subtabs.appendChild(wrap);
  };
})();
