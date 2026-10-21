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

  // Each European tournament has its own 36-team phase. The career engine only
  // creates official knockout pairs for the competition managed by the player.
  // Simulate and SAVE the other cups' independent knockout schedules, so the
  // Europa/Conference trees do not depend on the player's qualification.
  const europeanTypes=['ucl','uel','uecl'];
  const europeanRounds=['playoff','r16','qf','sf','final'];
  function otherCupsStore(state) {
    if (!state.otherCupKnockouts || Number(state.otherCupKnockouts.season)!==Number(state.season)) {
      state.otherCupKnockouts={season:state.season,competitions:{}};
    }
    return state.otherCupKnockouts.competitions;
  }
  function makePair(a,b,stage,index) {
    return {id:`${stage}-${index+1}`,stage,a,b,legs:[],winner:null};
  }
  function simulatePair(pair,stage,legCount) {
    const totalLegs=stage==='final'?1:2;
    for(let i=(pair.legs||[]).filter(Boolean).length;i<Math.min(totalLegs,legCount);i++) {
      const home=(stage==='final'||i===0)?pair.a:pair.b;
      const away=home===pair.a?pair.b:pair.a;
      const result=typeof global.llV2SimpleEuropeScore==='function'
        ?global.llV2SimpleEuropeScore(home,away):{homeGoals:0,awayGoals:0};
      pair.legs[i]={home,away,homeGoals:Number(result.homeGoals)||0,awayGoals:Number(result.awayGoals)||0,userMatch:false};
    }
    if(!pair.winner && pair.legs.filter(Boolean).length>=totalLegs){
      const goals={[pair.a]:0,[pair.b]:0};
      pair.legs.forEach(leg=>{goals[leg.home]+=leg.homeGoals;goals[leg.away]+=leg.awayGoals;});
      // Equal aggregate goals are resolved without a speculative away-goals rule.
      // Ranking is used as a stable fallback for AI-only cups.
      pair.winner=goals[pair.a]===goals[pair.b]?pair.a:(goals[pair.a]>goals[pair.b]?pair.a:pair.b);
    }
  }
  function spectatorKnockout(state,type,table) {
    const store=otherCupsStore(state),season=Number(state.season),last=LL_EURO_LEAGUE_WEEKS[type].slice(-1)[0];
    const sorted=global.llV2SortEuropeTable(type).map(row=>row.team);
    if(sorted.length<24)return null;
    let comp=store[type];
    let changed=false;
    if (!comp || comp.version!==2 || comp.leagueEnd!==last || !comp.stages?.playoff?.pairs?.length) {
      const pairs=Array.from({length:8},(_,i)=>makePair(sorted[8+i],sorted[23-i],'playoff',i));
      comp={version:2,season,leagueEnd:last,stages:{playoff:{stage:'playoff',pairs,complete:false},r16:{stage:'r16',pairs:sorted.slice(0,8).map((team,i)=>makePair(team,null,'r16',i)),complete:false}}};
      store[type]=comp;changed=true;
    }
    // Two-legged rounds occupy two weekly slots. Final is one match.
    const current=Number(state.week)||0;
    for(let si=0;si<europeanRounds.length;si++){
      const stage=europeanRounds[si],start=last+1+2*si;
      let round=comp.stages[stage];
      if(stage==='r16' && round && comp.stages.playoff?.complete && round.pairs.some(pair=>!pair.b)){
        const winners=comp.stages.playoff.pairs.map(pair=>pair.winner);
        round.pairs.forEach((pair,i)=>{pair.b=winners[7-i];});
        changed=true;
      }
      if(!round){
        const prior=comp.stages[europeanRounds[si-1]];
        if(!prior?.complete)break;
        const winners=prior.pairs.map(pair=>pair.winner);
        if(winners.some(w=>!w))break;
        let pairs;
        if(stage==='r16')pairs=sorted.slice(0,8).map((team,i)=>makePair(team,winners[7-i],stage,i));
        else pairs=Array.from({length:winners.length/2},(_,i)=>makePair(winners[2*i],winners[2*i+1],stage,i));
        round={stage,pairs,complete:false};comp.stages[stage]=round;changed=true;
      }
      const legCount=current>=start?(stage==='final'?1:current>=start+1?2:1):0;
      if(legCount>0){
        const before=round.pairs.reduce((n,p)=>n+p.legs.filter(Boolean).length,0);
        round.pairs.forEach(pair=>simulatePair(pair,stage,legCount));
        const after=round.pairs.reduce((n,p)=>n+p.legs.filter(Boolean).length,0);
        if(after!==before)changed=true;
      }
      if(!round.complete&&round.pairs.every(pair=>!!pair.winner)){round.complete=true;changed=true;}
      if(!round.complete)break;
    }
    if(changed && typeof global.llSave==='function')global.llSave();
    return comp;
  }
  function europeanConfig(state, type) {
    if (!europeanTypes.includes(type)) return null;
    const table=typeof global.llV2EnsureEuropeStandings==='function'?global.llV2EnsureEuropeStandings(state)?.[type]:null;
    const target=LL_EURO_LEAGUE_WEEKS[type]?.length||0;
    const results=(state.results||[]).some(r=>Number(r.season)===Number(state.season)&&r.competition===type&&r.league==='euro-knockout');
    const inKnockout=state.europe?.type===type && ['playoff','r16','qf','sf','final','winner','eliminated'].includes(state.europe.phase);
    if(!(target && Number(table?.playedRounds)>=target)&&!results&&!inKnockout)return null;
    // Never fabricate a new draw for the player's career tournament: use
    // existing live ties and recorded match results there.
    const isPlayersCup=state.europe?.type===type;
    const comp=isPlayersCup
      ?(typeof global.llV11SyncEuropeKnockout==='function'?global.llV11SyncEuropeKnockout(type):null)
      :spectatorKnockout(state,type,table);
    const displayRounds=comp?.stages?.playoff?.pairs?.length?['playoff','r16','qf','sf','final']:['r16','qf','sf','final'];
    const stages=displayRounds.map(key=>({
      key,label:labels[key],matches:Array.from({length:key==='playoff'||key==='r16'?8:key==='qf'?4:key==='sf'?2:1},(_,i)=>stageMatch(comp?.stages?.[key]?.pairs?.[i],{twoLegs:key!=='final'}))
    }));
    const play=comp?.stages?.playoff?.pairs;
    const anyDraw=!!(play?.length||comp?.stages?.r16?.pairs?.length);
    // A seeded/playoff draw should be shown immediately after the league phase;
    // blank Son 16 slots are appropriate only before playoff winners emerge.
    let extra='';
    if(Array.isArray(play)&&play.length){
      extra=`<details class="ll-bracket-playoffs" ${!comp?.stages?.playoff?.complete?'open':''}><summary>Play-Off Eşleşmeleri (${play.length})</summary><div class="ll-bracket-playoff-list">`+play.map(pair=>{
        const m=stageMatch(pair,{twoLegs:true});
        return `<span>${teamLine(m.home,clubBadge,m.winner===m.home)} <b>—</b> ${teamLine(m.away,clubBadge,m.winner===m.away)} ${m.score?`<small>${safe(m.score)}</small>`:''}</span>`;
      }).join('')+'</div></details>';
    }
    const label={ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'}[type];
    const hint=!anyDraw?' · İlk eşleşmeler oluşuyor':isPlayersCup?' · Kariyer kura kayıtları':' · Diğer takımların simüle edilen maçları';
    return {title:label,detail:'Lig aşamasının ardından eleme tablosu'+hint,stages,player:state.playerTeam,badge:clubBadge,extra};
  }

  function spectatorResultsHtml(state,type) {
    if(state.europe?.type===type)return '';
    const comp=state.otherCupKnockouts?.season==state.season?state.otherCupKnockouts?.competitions?.[type]:null;
    if(!comp)return '';
    const body=europeanRounds.map(stage=>{
      const pairs=comp.stages?.[stage]?.pairs;
      if(!pairs?.length)return '';
      const rows=pairs.map(pair=>{
        const m=stageMatch(pair,{twoLegs:stage!=='final'});
        const legs=(pair.legs||[]).filter(Boolean).map(leg=>`${safe(leg.home)} ${Number(leg.homeGoals)}-${Number(leg.awayGoals)} ${safe(leg.away)}`).join(' · ');
        return `<div class="ll-cup-row"><span>${teamLine(pair.a,clubBadge,pair.winner===pair.a)}</span><span>${m.score?safe(m.score):'VS'}</span><span>${teamLine(pair.b,clubBadge,pair.winner===pair.b)}</span>${legs?`<small title="${safe(legs)}">${safe(legs)}</small>`:''}</div>`;
      }).join('');
      return `<details class="ll-round-card" ${stage==='playoff'&&!comp.stages.playoff.complete?'open':''}><summary>${safe(labels[stage])} · ${pairs.filter(pair=>pair.winner).length}/${pairs.length} tamamlandı</summary><div class="ll-cup-list ll-spectator-results">${rows}</div></details>`;
    }).join('');
    return `<div class="ll-card ll-spectator-results-card" style="margin-top:14px"><div class="ll-card-title">${safe(({ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'})[type])} · Diğer Takımların Eleme Sonuçları</div>${body}</div>`;
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
    const col=224, cardW=188, cardH=58, step=78, pad=18, head=70, len=cfg.stages.length;
    const first=Math.max(1,cfg.stages[0].matches.length);
    const stageCentres=[];
    for (let s=0;s<len;s++) {
      const matches=cfg.stages[s].matches;
      const ys=[];
      if (s===0) for(let i=0;i<matches.length;i++) ys.push(head+cardH/2+i*step);
      else for(let i=0;i<matches.length;i++) {
        const prior=stageCentres[s-1];
        const sameCount=prior.length===matches.length;
        const a=prior[sameCount?i:i*2], b=sameCount?a:prior[i*2+1];
        ys.push(a==null?head+cardH/2+i*step*(1<<s):(b==null?a:(a+b)/2));
      }
      stageCentres.push(ys);
    }
    const width=pad*2+col*len-34,height=Math.max(head+cardH+14,head+first*step+24);
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
        const slot=stage.matches.length===after.matches.length?j:Math.floor(j/2);
        // The playoff winner feeds exactly one seeded R16 match; the
        // normal remaining stages join pairs of previous winners.
        if(dest<0 && (stage.key==='playoff'||!after.matches[slot])) dest=slot;
        if(dest<0 || dest>=after.matches.length) return;
        const x1=x+cardW,x2=x+col,mid=(x1+x2)/2,y1=stageCentres[i][j],y2=stageCentres[i+1][dest];
        const tentative=!winner;
        paths.push(`<path class="ll-bracket-wire${tentative?' ll-bracket-dashed':''}" d="M ${x1} ${y1} H ${mid} V ${y2} H ${x2}"/>`);
      });
    });
    const endX=pad+(len-1)*col+cardW;
    nodes+=`<div class="ll-bracket-trophy" style="left:${endX+6}px;top:${stageCentres[len-1][0]-10}px" aria-label="Şampiyonluk">🏆</div>`;
    return `<section class="ll-knockout-bracket" aria-label="${safe(cfg.title)} eşleşme ağacı">
      <div class="ll-bracket-head"><div><strong>${safe(cfg.title)} · Eleme Ağacı</strong><small>${cfg.detail || 'Son 16 · Çeyrek Final · Yarı Final · Final'}</small></div><span>← Kaydır →</span></div>
      <div class="ll-bracket-scroll" tabindex="0" aria-label="Eşleşme ağacını yatay kaydır"><div class="ll-bracket-canvas" style="width:${width}px;height:${height}px"><svg class="ll-bracket-lines" viewBox="0 0 ${width} ${height}" aria-hidden="true">${paths.join('')}</svg>${nodes}</div></div>${cfg.extra||''}
    </section>`;
  }

  global.llKnockoutBracketHtml=bracketHtml;
  global.llNationalKnockoutBracketHtml=(rec,badge)=>bracketHtml(nationalConfig(rec,badge||(()=>'')));
  global.llEuropeanKnockoutBracketHtml=(state,type)=>bracketHtml(europeanConfig(state,type));
  global.llCupKnockoutBracketHtml=state=>bracketHtml(cupConfig(state));

  function bracketMenuActions(type) {
    const options=[['ucl','Şampiyonlar Ligi'],['uel','Avrupa Ligi'],['uecl','Konferans Ligi'],['cup','Yerel Kupa'],['wc','Dünya Kupası'],['euro','Avrupa Şampiyonası'],['league','Lig Sonuçları']];
    return `<nav class="ll-bracket-hub-tabs" aria-label="Turnuvalar">${options.map(([key,label])=>`<button class="ll-btn ${key===type?'primary':''}" onclick="llRenderKnockoutHub('${key}')">${safe(label)}</button>`).join('')}</nav>`;
  }
  function latestNational(state,type){
    const seasons=state.nationalTournaments?.seasons||{};
    return Object.values(seasons).filter(rec=>rec?.type===type&&rec.edition).sort((a,b)=>Number(b.year||0)-Number(a.year||0))[0]||null;
  }
  function unavailable(text){return `<div class="ll-bracket-wait"><strong>Henüz eleme aşamasına geçilmedi</strong><p>${safe(text)}</p></div>`;}
  // Direct entry from the career's main dashboard. All seven categories stay
  // available independently of the player's qualification.
  global.llRenderKnockoutHub=function(type=null,view='tree'){
    const state=global.lexLeague?.state;if(!state)return;
    if(!type)type=state.europe?.type||'ucl';
    if(!['ucl','uel','uecl','cup','wc','euro','league'].includes(type))type='ucl';
    if(typeof global.llSetWide==='function')global.llSetWide(true);
    const isEurope=europeanTypes.includes(type);
    let tree='',records='',showTree=view!=='results'&&type!=='league';
    if(isEurope){
      tree=global.llEuropeanKnockoutBracketHtml(state,type);
      if(!tree)tree=unavailable('Bu kupada lig aşaması tamamlanınca play-off ve üst tur eşleşmeleri burada açılacak.');
      if(typeof global.llV2EuropeTableHtml==='function'&&typeof global.llV2EuropeFixturesHtml==='function'){
        records=`<div class="ll-card"><div class="ll-card-title">Puan Durumu · ${safe(type.toUpperCase())}</div>${global.llV2EuropeTableHtml(type)}</div><div class="ll-card" style="margin-top:12px"><div class="ll-card-title">Lig ve Eleme Maç Sonuçları</div>${global.llV2EuropeFixturesHtml(type)}</div>${spectatorResultsHtml(state,type)}`;
      }
    } else if(type==='cup'){
      tree=global.llCupKnockoutBracketHtml(state)||unavailable('Kupanın ilk tur eşleşmeleri henüz oluşmadı.');
      if(typeof global.llV2CupRoundsHtml==='function')records=`<div class="ll-card"><div class="ll-card-title">Yerel Kupa · Tüm Tur Sonuçları</div>${global.llV2CupRoundsHtml()}</div>`;
    } else if(type==='wc'||type==='euro'){
      const rec=latestNational(state,type);
      tree=rec?global.llNationalKnockoutBracketHtml(rec,team=>typeof global.llNationalTeamBadge==='function'?global.llNationalTeamBadge(team):''):'';
      if(!tree)tree=unavailable('Milli turnuvanın grup aşaması tamamlanınca eleme ağacı açılır.');
      records=`<div class="ll-bracket-wait">Grup tabloları ve milli maç sonuçları <button class="ll-btn" onclick="llRenderNationalTournaments('${type}')">Milli Turnuvalar ekranında</button> korunuyor.</div>`;
    } else {
      showTree=false;
      const leagueKey=typeof global.llTeamLeague==='function'?global.llTeamLeague(state.playerTeam):'super';
      records=`<div class="ll-bracket-view-tabs"><button class="ll-btn" onclick="llRenderCompetitionCenter('league','super')">Süper Lig</button><button class="ll-btn" onclick="llRenderCompetitionCenter('league','first')">TFF 1. Lig</button></div><div class="ll-card"><div class="ll-card-title">Lig Tablosu</div>${typeof global.llTableHtml==='function'?global.llTableHtml(leagueKey):''}</div><div class="ll-card" style="margin-top:12px"><div class="ll-card-title">Lig Maç Sonuçları</div>${typeof global.llV2LeagueFixturesHtml==='function'?global.llV2LeagueFixturesHtml(leagueKey):''}</div>`;
    }
    const heading=type==='league'?'Lig Sonuçları':type==='cup'?'Yerel Kupa':type==='wc'?'Dünya Kupası':type==='euro'?'Avrupa Şampiyonası':{ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'}[type];
    const viewTabs=type==='league'?'':`<div class="ll-bracket-view-tabs"><button class="ll-btn ${showTree?'primary':''}" onclick="llRenderKnockoutHub('${type}','tree')">🏆 Eşleşme Ağacı</button><button class="ll-btn ${!showTree?'primary':''}" onclick="llRenderKnockoutHub('${type}','results')">📊 Puan Durumu ve Sonuçlar</button></div>`;
    global.llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">🏆 Turnuva <em>Eleme Ağacı</em></div><div class="ll-muted">Sezon ${safe(state.season)} · ${safe(heading)} · Takımlar, eşleşmeler ve maç sonuçları</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div>${bracketMenuActions(type)}${viewTabs}${showTree?tree:records}</div></div>`;
  };

  global.llBracketSwitchView=function(button,view){
    const root=button?.closest('.ll-bracket-center-view');if(!root)return;
    root.querySelectorAll('[data-bracket-view]').forEach(el=>{el.hidden=el.dataset.bracketView!==view;});
    root.querySelectorAll('[data-bracket-target]').forEach(el=>{const selected=el.dataset.bracketTarget===view;el.classList.toggle('primary',selected);el.setAttribute('aria-pressed',String(selected));});
  };

  // Decorate the competition center. Bracket becomes its first screen only
  // after a draw exists; its original league standings, fixtures and results
  // stay in a separately selectable tab rather than being deleted.
  const base=global.llRenderCompetitionCenter;
  if(typeof base==='function')global.llRenderCompetitionCenter=function(tab,key){
    const result=base.apply(this,arguments);
    const state=global.lexLeague?.state;
    if(!state||!['cup','europe'].includes(tab)||typeof global.llArea!=='function')return result;
    if(tab==='europe'&&key==='supercup')return result;
    const type=europeanTypes.includes(key)?key:(state.europe?.type||'ucl');
    const html=tab==='cup'?global.llCupKnockoutBracketHtml(state):global.llEuropeanKnockoutBracketHtml(state,type);
    const panel=global.llArea()?.querySelector('.ll-shell > .ll-panel');
    if(!panel||panel.querySelector('.ll-bracket-center-view'))return result;
    const status=panel.querySelector('.ll-cup-status');
    if(!status)return result;
    const rest=document.createElement('div');rest.className='ll-bracket-center-records';rest.dataset.bracketView='results';
    let cursor=status.nextElementSibling;
    while(cursor){const next=cursor.nextElementSibling;rest.appendChild(cursor);cursor=next;}
    const frame=document.createElement('div');frame.className='ll-bracket-center-view';
    frame.innerHTML=`<div class="ll-bracket-view-tabs"><button class="ll-btn ${html?'primary':''}" data-bracket-target="tree" aria-pressed="${!!html}" onclick="llBracketSwitchView(this,'tree')">🏆 Eşleşme Ağacı</button><button class="ll-btn ${html?'':'primary'}" data-bracket-target="results" aria-pressed="${!html}" onclick="llBracketSwitchView(this,'results')">📊 ${tab==='cup'?'Kupa':'Lig'} Sonuçları ve Fikstür</button><button class="ll-btn" onclick="llRenderKnockoutHub('${tab==='cup'?'cup':type}')">Tüm Turnuvalar ↗</button></div><div data-bracket-view="tree">${html||unavailable('Eleme eşleşmeleri henüz oluşmadı.')}</div>`;
    if(tab==='europe')rest.insertAdjacentHTML('beforeend',spectatorResultsHtml(state,type));
    frame.appendChild(rest);status.insertAdjacentElement('afterend',frame);
    frame.querySelector('[data-bracket-view="tree"]').hidden=!html;
    rest.hidden=!!html;
    return result;
  };

  const renderDashboard=global.llRenderDashboard;
  if(typeof renderDashboard==='function')global.llRenderDashboard=function(){
    const result=renderDashboard.apply(this,arguments);
    const area=typeof global.llArea==='function'?global.llArea():null;
    const actions=area?.querySelector('.ll-shell .ll-topbar .ll-actions');
    if(actions&&!actions.querySelector('[data-knockout-hub]'))actions.insertAdjacentHTML('beforeend','<button class="ll-btn gold" data-knockout-hub onclick="llRenderKnockoutHub()">🏆 Eleme Ağaçları</button>');
    // Show the active knockout tree directly on the career dashboard as well;
    // never replace the season's current match or league standings.
    const state=global.lexLeague?.state;
    const metrics=area?.querySelector('.ll-shell > .ll-panel > .ll-metrics');
    if(metrics&&state&&!area.querySelector('[data-dashboard-bracket]')){
      const knockout=state.europe?.type&&state.europe.phase!=='league'&&state.europe.phase!=='eliminated'
        ?global.llEuropeanKnockoutBracketHtml(state,state.europe.type):null;
      const cupFixture=state.pendingFixture?.competition==='cup';
      const activeTree=knockout||(cupFixture?global.llCupKnockoutBracketHtml(state):'');
      const block=document.createElement('div');block.dataset.dashboardBracket='';block.className='ll-dashboard-bracket-preview';
      block.innerHTML=`<div class="ll-dashboard-bracket-toolbar"><div><strong>🏆 Kupa Eşleşme Ağaçları</strong><small>Avrupa kupaları, yerel kupa, Dünya Kupası ve EURO</small></div><button class="ll-btn gold" onclick="llRenderKnockoutHub()">Tüm Eşleşmeleri Gör →</button></div>${activeTree||''}`;
      metrics.insertAdjacentElement('afterend',block);
    }
    return result;
  };
})(window);
