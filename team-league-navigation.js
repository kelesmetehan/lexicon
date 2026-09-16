'use strict';

/* TEAM LEAGUE NAVIGATION v1 · 2026-09-16
 * Click a club name anywhere relevant and open that club's CURRENT simulated
 * domestic league table. No new match simulation is executed here.
 */
(function(global){
  const VERSION=1;
  const STYLE_ID='ll-team-league-nav-style';
  const VIEW_ID='ll-team-league-nav-view';
  const CLICKABLE_SELECTOR=[
    '.ll-standing-team-name',
    '.ll-fixture-team > span',
    '.ll-next-match .ll-club > b',
    '.ll-result-row > span'
  ].join(',');
  const backStack=[];
  let scanQueued=false;

  function stateNow(){return global.lexLeague?.state||null;}
  function area(){return typeof global.llArea==='function'?global.llArea():document.getElementById('app');}
  function esc(value){return typeof global.llEscape==='function'?global.llEscape(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function canonical(name){const raw=String(name||'').trim();return typeof global.llCanonicalTeamName==='function'?global.llCanonicalTeamName(raw):raw;}
  function countries(){return Array.isArray(global.LL_COUNTRY_CODES)?global.LL_COUNTRY_CODES:['TUR','ENG','GER','ESP','FRA','ITA','NED'];}
  function countryMeta(code){const map=typeof LL_COUNTRY_META!=='undefined'?LL_COUNTRY_META:global.LL_COUNTRY_META;return map?.[code]||{country:code,flag:'🌍',tier1Label:'1. Lig',tier2Label:'2. Lig'};}
  function leagueLabel(code,tier){if(typeof global.llMLLeagueLabel==='function')return global.llMLLeagueLabel(code,tier);const meta=countryMeta(code);return tier==='tier2'?(meta.tier2Label||'2. Lig'):(meta.tier1Label||'1. Lig');}

  function resolveTeam(name,state=stateNow()){
    if(!state)return null;
    const requested=String(name||'').trim();if(!requested)return null;
    const club=canonical(requested);
    let comp=null;
    if(typeof global.llMLTeamCompetition==='function')comp=global.llMLTeamCompetition(club,state)||global.llMLTeamCompetition(requested,state);
    if(!comp){
      for(const country of countries())for(const tier of ['tier1','tier2']){
        const list=state.leagues?.[country]?.[tier]||[];
        if(list.includes(club)||list.includes(requested)){comp={country,tier};break;}
      }
    }
    if(comp){
      const list=state.leagues?.[comp.country]?.[comp.tier]||[];
      const actual=list.includes(club)?club:list.includes(requested)?requested:club;
      return {requested,team:actual,country:comp.country,tier:comp.tier,playable:true,reason:null};
    }
    const registryMap=typeof LL_TEAM_REGISTRY!=='undefined'?LL_TEAM_REGISTRY:global.LL_TEAM_REGISTRY;
    const registry=registryMap?.[club]||registryMap?.[requested]||null;
    if(registry?.source==='europe-pool'||registry?.tier==='europe-pool')return {requested,team:club,country:registry.country||null,tier:null,playable:false,reason:'not-simulated'};
    return null;
  }

  function standingsRows(state,country,tier){
    if(typeof global.llMLSortRows==='function')return global.llMLSortRows(state,country,tier);
    return Object.values(state?.standings?.[country]?.[tier]||{}).sort((a,b)=>Number(b.Pts||b.pts)-Number(a.Pts||a.pts)||Number(b.GD)-Number(a.GD)||Number(b.GF)-Number(a.GF)||String(a.team).localeCompare(String(b.team),'tr'));
  }

  function logo(team){return typeof global.llTeamLogo==='function'?global.llTeamLogo(team,'table'):'⚽';}
  function stars(state,team){
    if(typeof global.llV2TeamStarsInState==='function')return global.llV2TeamStarsInState(state,team);
    const registryMap=typeof LL_TEAM_REGISTRY!=='undefined'?LL_TEAM_REGISTRY:global.LL_TEAM_REGISTRY;
    return Math.max(1,Math.min(6,Number(state?.teams?.[team]?.stars||registryMap?.[team]?.stars||1)));
  }

  function injectStyles(){
    if(typeof document==='undefined'||document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .ll-team-league-link{cursor:pointer!important;text-decoration:underline;text-decoration-style:dotted;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:rgba(45,212,191,.48);transition:color .15s ease,text-decoration-color .15s ease}
      .ll-team-league-link:hover{color:#79e7df!important;text-decoration-color:#79e7df}
      .ll-team-league-link:focus-visible{outline:2px solid #2dd4bf;outline-offset:3px;border-radius:3px}
      .ll-team-league-unavailable{cursor:help!important;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;text-decoration-color:rgba(148,163,184,.34)}
      .ll-team-league-focus{background:linear-gradient(90deg,rgba(45,212,191,.20),rgba(45,212,191,.055))!important;box-shadow:inset 3px 0 0 #2dd4bf,inset -1px 0 0 rgba(45,212,191,.18)}
      .ll-team-league-focus td{font-weight:700}.ll-team-league-focus .ll-standing-team-name{color:#79e7df}
      .ll-team-league-location{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:10px 0 14px;padding:11px 13px;border:1px solid rgba(45,212,191,.20);background:rgba(15,23,42,.48);border-radius:12px;color:#cbd5e1}
      .ll-team-league-location strong{color:#f8fafc}.ll-team-league-rank{color:#79e7df;font-weight:900}
      @media(max-width:560px){.ll-team-league-location{font-size:11px}.ll-team-league-link{text-underline-offset:2px}}
    `;document.head.appendChild(style);
  }

  function showUnavailable(info){
    const name=info?.requested||info?.team||'Bu takım';
    const message=`${name} takımının yerel ligi oyunda simüle edilmiyor. Bu nedenle canlı yerel puan durumu açılamıyor.`;
    if(typeof global.llShowModal==='function')global.llShowModal(`<div class="ll-card-title">Yerel Lig Verisi Yok</div><div class="ll-sub">${esc(message)}</div>`);
    else alert(message);
  }

  function snapshotCurrentView(){
    const root=area();if(!root)return null;
    return {html:root.innerHTML,scrollX:global.scrollX||0,scrollY:global.scrollY||0};
  }

  function renderTable(info){
    const state=stateNow(),root=area();if(!state||!root||!info?.playable)return false;
    const rows=standingsRows(state,info.country,info.tier),meta=countryMeta(info.country),target=info.team,index=rows.findIndex(row=>canonical(row.team)===canonical(target)),position=index>=0?index+1:null;
    const title=leagueLabel(info.country,info.tier),week=Math.max(0,Number(state.week||1)-1);
    const tableRows=rows.map((row,i)=>{
      const rowTeam=row.team,focus=canonical(rowTeam)===canonical(target),played=Number(row.P)||0,wins=Number(row.W)||0,draws=Number(row.D)||0,losses=Number(row.L)||0,gf=Number(row.GF)||0,ga=Number(row.GA)||0,gd=Number.isFinite(Number(row.GD))?Number(row.GD):gf-ga,pts=Number(row.Pts??row.pts)||0;
      return `<tr class="${focus?'ll-team-league-focus ':''}${rowTeam===state.playerTeam?'player ':''}" data-ll-team-nav-row="${esc(rowTeam)}"><td>${i+1}</td><td><span class="ll-standing-team">${logo(rowTeam)}<span class="ll-standing-team-name" data-ll-team-name="${esc(rowTeam)}" title="${esc(rowTeam)}">${esc(rowTeam)}</span><span class="ll-standing-stars">${stars(state,rowTeam)}★</span></span></td><td>${played}</td><td>${wins}</td><td>${draws}</td><td>${losses}</td><td>${gf}</td><td>${ga}</td><td>${gd}</td><td><b>${pts}</b></td></tr>`;
    }).join('');
    root.innerHTML=`<div class="ll-shell" id="${VIEW_ID}"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">${meta.flag||'🌍'} ${esc(title)} <em>Puan Durumu</em></div><div class="ll-muted">Sezon ${Number(state.season)||1} · ${week}. hafta tamamlandı · Takım lig konumu</div></div><button class="ll-btn" onclick="llTeamLeagueNavBack()">← Önceki Ekran</button></div><div class="ll-team-league-location">${logo(target)}<strong>${esc(target)}</strong><span>${esc(meta.country||info.country)} · ${esc(title)}</span>${position?`<span class="ll-team-league-rank">${position}. sıra</span>`:''}</div><div class="ll-notice">Bu tablo oyunun mevcut arka plan lig simülasyonunu gösterir. Bu ekranı açmak yeni maç simülasyonu çalıştırmaz.</div><div class="ll-table-wrap ll-standings-wrap" style="margin-top:14px"><table class="ll-table ll-standings-table ll-compact-standings-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`;
    queueScan();
    setTimeout(()=>{const row=root.querySelector('.ll-team-league-focus');if(row)row.scrollIntoView({block:'center',behavior:'smooth'});},40);
    return true;
  }

  function openTeamLeague(name,options={}){
    const info=resolveTeam(name);if(!info)return false;
    if(!info.playable){showUnavailable(info);return false;}
    if(options.pushHistory!==false){const snap=snapshotCurrentView();if(snap)backStack.push(snap);}
    return renderTable(info);
  }

  function back(){
    const root=area(),snap=backStack.pop();if(!root){return;}
    if(!snap){if(typeof global.llRenderDashboard==='function')global.llRenderDashboard();return;}
    root.innerHTML=snap.html;queueScan();setTimeout(()=>global.scrollTo?.(snap.scrollX,snap.scrollY),0);
  }

  function textTeamName(el){
    if(!el)return '';
    const data=el.getAttribute('data-ll-team-name');if(data)return data.trim();
    return String(el.textContent||'').replace(/\s+/g,' ').trim();
  }

  function candidateStatus(el){
    const name=textTeamName(el);if(!name||name==='BAY')return null;
    return {name,info:resolveTeam(name)};
  }

  function decorateElement(el){
    if(!el||el.closest('button,a,[role="button"]')&&!el.classList.contains('ll-standing-team-name'))return;
    const candidate=candidateStatus(el);if(!candidate?.info){el.classList.remove('ll-team-league-link','ll-team-league-unavailable');return;}
    el.setAttribute('data-ll-team-name',candidate.name);el.setAttribute('tabindex','0');
    if(candidate.info.playable){
      el.classList.add('ll-team-league-link');el.classList.remove('ll-team-league-unavailable');
      el.title=`${candidate.info.team} · ${leagueLabel(candidate.info.country,candidate.info.tier)} puan durumunu aç`;
    }else{
      el.classList.add('ll-team-league-unavailable');el.classList.remove('ll-team-league-link');
      el.title='Bu takımın yerel ligi oyunda simüle edilmiyor';
    }
  }

  function scan(root=area()||document){
    if(typeof document==='undefined'||!stateNow())return;
    injectStyles();
    const elements=[];
    if(root?.matches?.(CLICKABLE_SELECTOR))elements.push(root);
    root?.querySelectorAll?.(CLICKABLE_SELECTOR).forEach(el=>elements.push(el));
    elements.forEach(decorateElement);
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;(global.requestAnimationFrame||setTimeout)(()=>{scanQueued=false;scan();},0);}

  function clickHandler(event){
    const el=event.target?.closest?.(CLICKABLE_SELECTOR);if(!el)return;
    if(el.closest('button,a,[role="button"]')&&!el.classList.contains('ll-standing-team-name'))return;
    const candidate=candidateStatus(el);if(!candidate?.info)return;
    event.preventDefault();event.stopPropagation();
    if(candidate.info.playable)openTeamLeague(candidate.name);else showUnavailable(candidate.info);
  }
  function keyHandler(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    const el=event.target?.closest?.(CLICKABLE_SELECTOR);if(!el||(!el.classList.contains('ll-team-league-link')&&!el.classList.contains('ll-team-league-unavailable')))return;
    event.preventDefault();clickHandler(event);
  }

  function boot(){
    if(typeof document==='undefined')return;
    injectStyles();document.addEventListener('click',clickHandler,true);document.addEventListener('keydown',keyHandler,true);
    const observer=new MutationObserver(queueScan);observer.observe(document.body,{childList:true,subtree:true});queueScan();
  }

  global.llOpenTeamLeagueTable=openTeamLeague;
  global.llTeamLeagueNavBack=back;
  global.llTeamLeagueNavResolve=resolveTeam;
  global.llTeamLeagueNavigationTestApi={VERSION,resolveTeam,standingsRows,canonical,leagueLabel};
  boot();
})(globalThis);
