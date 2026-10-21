/* Lexicon League: read-only, tournament-wide knockout bracket.
 * Reads already-established fixtures; never draws opponents, simulates matches or saves data.
 */
(function (global) {
  'use strict';
  const labels = {r32:'Son 32', r16:'Son 16', playoff:'Play-Off', qf:'Çeyrek Final', sf:'Yarı Final', final:'Final'};
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const has = (list, team) => list.some(m => m.home === team || m.away === team);
  const stageMatch = (raw, opts={}) => {
    if (!raw) return null;
    const home = raw.home || raw.a || null, away = raw.away || raw.b || null;
    const legs = Array.isArray(raw.legs) ? raw.legs.filter(Boolean) : null;
    const done = raw.played === true || !!raw.winner;
    let score = '';
    if (legs && legs.length) {
      const goals = {[home]:0, [away]:0};
      legs.forEach(leg => {
        goals[leg.home] = (goals[leg.home] || 0) + (Number(leg.homeGoals) || 0);
        goals[leg.away] = (goals[leg.away] || 0) + (Number(leg.awayGoals) || 0);
      });
      score = `${goals[home] || 0}-${goals[away] || 0}`;
      if (legs.length === 1 && !raw.winner && opts.twoLegs) score += ' · 1. maç';
    } else if (raw.played === true && Number.isFinite(Number(raw.homeGoals)) && Number.isFinite(Number(raw.awayGoals))) {
      score = `${Number(raw.homeGoals)}-${Number(raw.awayGoals)}`;
      const penalties = raw.penalties || raw.penaltyShootout;
      if (penalties && penalties.home != null && penalties.away != null) score += ` · P ${penalties.home}-${penalties.away}`;
    }
    const winner = raw.winner || raw.knockoutWinner || raw.penaltyShootout?.winner || null;
    return {home,away,score,winner,played:done || (legs && legs.length > 0),id:raw.id || null};
  };

  // WC match IDs are ordered here by the real FIFA round-to-round path, not by their numeric IDs.
  const wcIds = {
    r32:['M74','M77','M73','M75','M83','M84','M81','M82','M76','M78','M79','M80','M86','M88','M85','M87'],
    r16:['M89','M90','M93','M94','M91','M92','M95','M96'],
    qf:['M97','M98','M99','M100'],sf:['M101','M102'],final:['M104']
  };
  const euroIds = {
    r16:['E1','E2','E3','E4','E5','E6','E7','E8'],
    qf:['E9','E10','E11','E12'],sf:['E13','E14'],final:['E15']
  };
  const ordered = (list, ids) => {
    const byId = new Map((list || []).map(match => [match.id, match]));
    return ids.map(id => byId.get(id) || null);
  };

  function nationalConfig(rec, badge) {
    const ed=rec?.edition, bracket=ed?.bracket || {};
    const wc=rec?.type==='wc';
    const ids=wc?wcIds:euroIds;
    const first=wc?'r32':'r16';
    if (!Array.isArray(bracket[first]) || !bracket[first].length) return null; // group stage still ongoing
    const stages=Object.keys(ids).map(key=>({key,label:labels[key],matches:ordered(bracket[key],ids[key]).map(x=>stageMatch(x))}));
    const third=wc&&Array.isArray(bracket.third)?bracket.third[0]:null;
    return {title:wc?'Dünya Kupası':'Avrupa Şampiyonası',detail:`${safe(rec.year || '')} · Eleme aşaması`,stages,player:rec.selectedTeam,badge,extra:third?`<div class="ll-bracket-third"><strong>Üçüncülük Maçı</strong><span>${badge(third.home)} ${safe(third.home)} — ${badge(third.away)} ${safe(third.away)} ${third.played?`· ${safe(stageMatch(third).score)}`:''}</span></div>`:''};
  }

  function europeanConfig(state, type) {
    if (!['ucl','uel','uecl'].includes(type)) return null;
    const table=typeof global.llV2EnsureEuropeStandings==='function'?global.llV2EnsureEuropeStandings(state)?.[type]:null;
    const target=typeof LL_EURO_LEAGUE_WEEKS!=='undefined'?LL_EURO_LEAGUE_WEEKS[type]?.length:0;
    const comp=typeof global.llV11SyncEuropeKnockout==='function'?global.llV11SyncEuropeKnockout(type):null;
    const results=(state.results || []).some(r=>r.season===state.season && r.competition===type && r.league==='euro-knockout');
    const inKnockout=state.europe?.type===type && ['playoff','r16','qf','sf','final','winner','eliminated'].includes(state.europe.phase);
    if (!(target && Number(table?.playedRounds)>=target) && !results && !inKnockout) return null;
    const stages=['r16','qf','sf','final'].map((key,index)=>({
      key,label:labels[key],matches:Array.from({length:8>>index},(_,i)=>stageMatch(comp?.stages?.[key]?.pairs?.[i],{twoLegs:key!=='final'}))
    }));
    const play=comp?.stages?.playoff?.pairs;
    let extra='';
    if (Array.isArray(play)&&play.length) {
      extra=`<details class="ll-bracket-playoffs" ${state.europe?.type===type&&state.europe.phase==='playoff'?'open':''}><summary>Play-Off Eşleşmeleri</summary><div class="ll-bracket-playoff-list">`+play.map(pair=>{
        const m=stageMatch(pair,{twoLegs:true});
        return `<span>${teamLine(m.home, null, false)} <b>—</b> ${teamLine(m.away, null, false)} ${m.score?`<small>${safe(m.score)}</small>`:''}</span>`;
      }).join('')+'</div></details>';
    }
    const label={ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'}[type];
    return {title:label,detail:'Lig aşamasının ardından eleme tablosu',stages,player:state.playerTeam,badge:clubBadge,extra};
  }

  function clubBadge(team) {
    return team && typeof global.llTeamLogo==='function'?global.llTeamLogo(team,'table'):'';
  }
  function cupConfig(state) {
    const cup=state?.cup;
    if (!cup || !cup.history || !(cup.history[0]?.length || cup.pending || cup.round>0)) return null;
    if (typeof global.llV2CupRoundField!=='function' || typeof LL_CUP_ROUNDS==='undefined') return null;
    const results=(state.results || []).filter(r=>r.competition==='cup' && Number(r.season)===Number(state.season));
    let previous=0;
    const stages=LL_CUP_ROUNDS.map((label,index)=>{
      const field=global.llV2CupRoundField(index);
      const entries=[];
      if (Array.isArray(field)) for (let n=0;n<field.length;n+=2) {
        const home=field[n] || null,away=field[n+1] || null;
        const result=results.find(r=>typeof global.llV2CupResultRound==='function' && global.llV2CupResultRound(r)===index && ((r.home===home&&r.away===away)||(r.home===away&&r.away===home)));
        const m=stageMatch(result?{...result,played:true,winner:typeof global.llV2CupRecordedWinner==='function'?global.llV2CupRecordedWinner(result):result.knockoutWinner}: {home,away});
        if (home && !away) {m.winner=home;m.played=true;m.score='BAY';}
        entries.push(m);
      }
      // No invented opponents: future rounds contain explicitly empty slots.
      const count=Math.max(entries.length,index===0?0:Math.ceil(previous/2),1);
      previous=count;
      while (entries.length<count) entries.push(null);
      return {key:`cup-${index}`,label,matches:entries};
    });
    const title=typeof global.llDomesticCupLabelForFixture==='function'?global.llDomesticCupLabelForFixture(null,state):'Yerel Kupa';
    return {title,detail:'Yerel kupa eleme turları',stages,player:state.playerTeam,badge:clubBadge};
  }

  function teamLine(name, badge, win) {
    if (!name) return '<span class="ll-bracket-team ll-bracket-tbd">Henüz belli değil</span>';
    const emblem=badge?badge(name):'';
    return `<span class="ll-bracket-team${win?' ll-bracket-winner':''}">${emblem}<span title="${safe(name)}">${safe(name)}</span></span>`;
  }
  function matchCard(m, cfg, left, top, width) {
    if (!m) return `<div class="ll-bracket-match ll-bracket-empty" style="left:${left}px;top:${top}px;width:${width}px"><span class="ll-bracket-team ll-bracket-tbd">Henüz belli değil</span><span class="ll-bracket-team ll-bracket-tbd">Henüz belli değil</span></div>`;
    const player=m.home===cfg.player||m.away===cfg.player;
    return `<div class="ll-bracket-match${player?' ll-bracket-player':''}${m.winner?' ll-bracket-finished':''}" style="left:${left}px;top:${top}px;width:${width}px" role="group" aria-label="${safe(m.home || 'Bekleniyor')} - ${safe(m.away || 'Bekleniyor')}">
      ${teamLine(m.home,cfg.badge,m.winner===m.home)}${teamLine(m.away,cfg.badge,m.winner===m.away)}${m.score?`<small class="ll-bracket-score">${safe(m.score)}</small>`:''}</div>`;
  }

  function bracketHtml(cfg) {
    if (!cfg?.stages?.length || !cfg.stages[0].matches.length) return '';
    const col=242, cardW=204, cardH=70, step=91, pad=20, head=82, len=cfg.stages.length;
    const first=Math.max(1,cfg.stages[0].matches.length);
    const stageCentres=[];
    for (let s=0;s<len;s++) {
      const matches=cfg.stages[s].matches;
      const ys=[];
      if (s===0) for(let i=0;i<matches.length;i++) ys.push(head+cardH/2+i*step);
      else for(let i=0;i<matches.length;i++) {
        const prior=stageCentres[s-1];
        const a=prior[i*2], b=prior[i*2+1];
        ys.push(a==null?head+cardH/2+i*step*(1<<s):(b==null?a:(a+b)/2));
      }
      stageCentres.push(ys);
    }
    const width=pad*2+col*len-25,height=Math.max(head+cardH+16,head+first*step+30);
    const paths=[];let nodes='';
    cfg.stages.forEach((stage,i)=>{
      const x=pad+i*col;
      nodes+=`<div class="ll-bracket-round-title" style="left:${x}px;top:20px;width:${cardW}px">${safe(stage.label)}</div>`;
      stage.matches.forEach((m,j)=>nodes+=matchCard(m,cfg,x,stageCentres[i][j]-cardH/2,cardW));
      if (i===len-1) return;
      const after=cfg.stages[i+1];
      stage.matches.forEach((m,j)=>{
        let dest=-1;
        const winner=m?.winner || (m?.home&&!m.away?m.home:null);
        if(winner) dest=after.matches.findIndex(next=>next && has([next],winner));
        // Draw prospective paths only into undisclosed slots, never imply a false named pairing.
        if(dest<0 && !after.matches[Math.floor(j/2)]) dest=Math.floor(j/2);
        if(dest<0 || dest>=after.matches.length) return;
        const x1=x+cardW,x2=x+col,mid=(x1+x2)/2,y1=stageCentres[i][j],y2=stageCentres[i+1][dest];
        const tentative=!winner;
        paths.push(`<path class="ll-bracket-wire${tentative?' ll-bracket-dashed':''}" d="M ${x1} ${y1} H ${mid} V ${y2} H ${x2}"/>`);
      });
    });
    const endX=pad+(len-1)*col+cardW;
    nodes+=`<div class="ll-bracket-trophy" style="left:${endX+8}px;top:${stageCentres[len-1][0]-13}px" aria-label="Şampiyonluk">🏆</div>`;
    return `<section class="ll-knockout-bracket" aria-label="${safe(cfg.title)} eşleşme ağacı">
      <div class="ll-bracket-head"><div><strong>${safe(cfg.title)} · Eleme Ağacı</strong><small>${cfg.detail || 'Son 16 · Çeyrek Final · Yarı Final · Final'}</small></div><span>← Kaydır →</span></div>
      <div class="ll-bracket-scroll" tabindex="0" aria-label="Eşleşme ağacını yatay kaydır"><div class="ll-bracket-canvas" style="width:${width}px;height:${height}px"><svg class="ll-bracket-lines" viewBox="0 0 ${width} ${height}" aria-hidden="true">${paths.join('')}</svg>${nodes}</div></div>${cfg.extra||''}
    </section>`;
  }

  global.llKnockoutBracketHtml=bracketHtml;
  global.llNationalKnockoutBracketHtml=(rec,badge)=>bracketHtml(nationalConfig(rec,badge||(()=>'')));
  global.llEuropeanKnockoutBracketHtml=(state,type)=>bracketHtml(europeanConfig(state,type));
  global.llCupKnockoutBracketHtml=state=>bracketHtml(cupConfig(state));

  // Only tournament center tabs are decorated. The football simulation and saves are untouched.
  const base=global.llRenderCompetitionCenter;
  if (typeof base==='function') global.llRenderCompetitionCenter=function(tab,key){
    const result=base.apply(this,arguments);
    const state=global.lexLeague?.state;
    if (!state || !['cup','europe'].includes(tab) || typeof global.llArea!=='function')return result;
    const type=['ucl','uel','uecl'].includes(key)?key:(state.europe?.type||'ucl');
    const html=tab==='cup'?global.llCupKnockoutBracketHtml(state):global.llEuropeanKnockoutBracketHtml(state,type);
    if(html){
      const panel=global.llArea()?.querySelector('.ll-panel');
      const anchor=panel?.querySelector('.ll-cup-status');
      if(anchor)anchor.insertAdjacentHTML('afterend',html);
    }
    return result;
  };
})(window);
