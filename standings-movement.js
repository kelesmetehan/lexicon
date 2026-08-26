'use strict';

/* Standings position movement indicators.
 * Live tables compare the latest completed matchweek/round with the one immediately before it.
 * Static season-end archives intentionally do not show movement arrows.
 */
(function(){
  const VERSION=1;

  function blankRow(team){return {team,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0};}
  function apply(row,gf,ga){
    if(!row)return;
    gf=Number(gf)||0;ga=Number(ga)||0;
    row.P++;row.GF+=gf;row.GA+=ga;row.GD=row.GF-row.GA;
    if(gf>ga){row.W++;row.Pts+=3;}else if(gf===ga){row.D++;row.Pts++;}else row.L++;
  }
  function positionMap(rows,nameOf=row=>row?.team){
    const map={};(rows||[]).forEach((row,index)=>{const name=nameOf(row);if(name)map[name]=index+1;});return map;
  }
  function arrowHtml(team,currentPosition,previousPositions){
    const previous=Number(previousPositions?.[team]),current=Number(currentPosition);
    if(!Number.isFinite(previous)||!Number.isFinite(current)||previous===current)return '';
    const up=previous>current,delta=Math.abs(previous-current),label=up?`${delta} sıra yükseldi`:`${delta} sıra geriledi`;
    return `<span class="ll-rank-movement ${up?'up':'down'}" title="${label}" aria-label="${label}">${up?'▲':'▼'}</span>`;
  }

  function domesticResultMatches(result,state,country,tier,names){
    if(!result||Number(result.season)!==Number(state?.season)||result.competition!=='league')return false;
    if(!names.has(result.home)||!names.has(result.away))return false;
    const legacy=tier==='tier1'?'super':'first',resultTier=result.league;
    if(result.country&&result.country!==country)return false;
    if(resultTier&&![tier,legacy].includes(resultTier))return false;
    if(!result.country&&country!==state?.playerCountry)return false;
    return true;
  }
  function domesticPreviousPositions(state,country,tier){
    const namesList=[...(state?.leagues?.[country]?.[tier]||[])];
    if(!namesList.length)return null;
    const names=new Set(namesList),results=(state?.results||[]).filter(result=>domesticResultMatches(result,state,country,tier,names));
    const weeks=[...new Set(results.map(result=>Number(result.week)).filter(Number.isFinite))].sort((a,b)=>a-b);
    if(weeks.length<2)return null;
    const latestWeek=weeks[weeks.length-1],rows=Object.fromEntries(namesList.map(name=>[name,blankRow(name)]));
    results.filter(result=>Number(result.week)<latestWeek).forEach(result=>{apply(rows[result.home],result.homeGoals,result.awayGoals);apply(rows[result.away],result.awayGoals,result.homeGoals);});
    const seed=new Map(namesList.map((name,index)=>[name,index]));
    const sorted=Object.values(rows).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||(seed.get(a.team)??9999)-(seed.get(b.team)??9999)||String(a.team).localeCompare(String(b.team),'tr'));
    return positionMap(sorted);
  }

  function europeRoundIndex(result,type){
    const explicit=Number(result?.euroRound);if(Number.isInteger(explicit)&&explicit>=0)return explicit;
    const weeks=globalThis.LL_EURO_LEAGUE_WEEKS?.[type]||[];const index=weeks.indexOf(Number(result?.week));return index>=0?index:null;
  }
  function europePreviousPositions(state,type){
    const table=state?.europeStandings?.[type],namesList=[...(table?.teams||[])];if(!namesList.length)return null;
    const names=new Set(namesList),results=(state?.results||[]).filter(result=>Number(result.season)===Number(state.season)&&result.competition===type&&result.league==='euro-table'&&names.has(result.home)&&names.has(result.away)).map(result=>({result,round:europeRoundIndex(result,type)})).filter(item=>Number.isInteger(item.round));
    const rounds=[...new Set(results.map(item=>item.round))].sort((a,b)=>a-b);if(rounds.length<2)return null;
    const latestRound=rounds[rounds.length-1],rows=Object.fromEntries(namesList.map(name=>[name,blankRow(name)]));
    results.filter(item=>item.round<latestRound).forEach(({result})=>{apply(rows[result.home],result.homeGoals,result.awayGoals);apply(rows[result.away],result.awayGoals,result.homeGoals);});
    const sorted=Object.values(rows).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||b.W-a.W||String(a.team).localeCompare(String(b.team),'tr'));
    return positionMap(sorted);
  }

  function decorateTableElement(table,previousPositions){
    if(!table||!previousPositions)return table;
    [...table.querySelectorAll('tbody tr')].forEach((row,index)=>{
      const host=row.querySelector('.ll-standing-team'),nameNode=row.querySelector('.ll-standing-team-name');
      const team=nameNode?.getAttribute('title')||nameNode?.textContent?.trim();if(!host||!team)return;
      host.querySelector('.ll-rank-movement')?.remove();
      const html=arrowHtml(team,index+1,previousPositions);if(!html)return;
      if(nameNode)nameNode.insertAdjacentHTML('afterend',html);else host.insertAdjacentHTML('beforeend',html);
    });
    return table;
  }
  function decorateHtml(html,previousPositions){
    if(!previousPositions||typeof document==='undefined')return html;
    const template=document.createElement('template');template.innerHTML=html;const table=template.content.querySelector('table');decorateTableElement(table,previousPositions);return template.innerHTML;
  }
  function captureRows(rows,nameOf=row=>row?.team){
    if(!(rows||[]).some(row=>Number(row?.P||0)>0||Number(row?.W||0)+Number(row?.D||0)+Number(row?.L||0)>0))return null;
    return positionMap(rows,nameOf);
  }

  globalThis.LL_STANDINGS_MOVEMENT_VERSION=VERSION;
  globalThis.llStandingsMovementHtml=arrowHtml;
  globalThis.llStandingsCaptureRows=captureRows;
  globalThis.llStandingsDomesticPreviousPositions=domesticPreviousPositions;
  globalThis.llStandingsEuropePreviousPositions=europePreviousPositions;
  globalThis.llStandingsDecorateTableElement=decorateTableElement;

  if(typeof document!=='undefined'){
    const style=document.createElement('style');style.id='ll-standings-movement-style';style.textContent=`
      .ll-rank-movement{display:inline-flex;align-items:center;justify-content:center;margin-left:5px;font-size:9px;line-height:1;font-weight:900;vertical-align:middle;flex:0 0 auto;transform:translateY(-1px)}
      .ll-rank-movement.up{color:#22c55e;text-shadow:0 0 8px rgba(34,197,94,.24)}
      .ll-rank-movement.down{color:#ef4444;text-shadow:0 0 8px rgba(239,68,68,.22)}
      @media(max-width:560px){.ll-rank-movement{font-size:8px;margin-left:3px}}
    `;if(!document.getElementById(style.id))document.head.appendChild(style);
  }

  /* Active domestic league tables (dashboard, competition center and match sidebars). */
  if(typeof globalThis.llTableHtml==='function'){
    const base=globalThis.llTableHtml;
    globalThis.llTableHtml=function(key){
      const actualKey=key||((typeof llTeamLeague==='function'&&lexLeague?.state?.playerTeam)?llTeamLeague(lexLeague.state.playerTeam):'first')||'first';
      const html=base.apply(this,arguments),state=globalThis.lexLeague?.state,country=state?.playerCountry,tier=actualKey==='super'?'tier1':actualKey==='first'?'tier2':actualKey;
      return decorateHtml(html,domesticPreviousPositions(state,country,tier));
    };
  }

  /* UCL / UEL / UECL live league-phase standings. */
  if(typeof globalThis.llV2EuropeTableHtml==='function'){
    const base=globalThis.llV2EuropeTableHtml;
    globalThis.llV2EuropeTableHtml=function(type){return decorateHtml(base.apply(this,arguments),europePreviousPositions(globalThis.lexLeague?.state,type));};
  }

  /* Other-country live tables are rendered inside country-browser's closure, so decorate after render. */
  if(typeof globalThis.llCBRenderCountryBrowse==='function'){
    const base=globalThis.llCBRenderCountryBrowse;
    globalThis.llCBRenderCountryBrowse=function(code,tab='league',tier='tier1'){
      const result=base.apply(this,arguments);if(tab!=='league')return result;
      const state=globalThis.lexLeague?.state;if(!state||code===state.playerCountry)return result;
      const table=typeof llArea==='function'?llArea()?.querySelector('.ll-standings-table'):null;
      decorateTableElement(table,domesticPreviousPositions(state,code,tier==='tier2'?'tier2':'tier1'));return result;
    };
  }
})();
