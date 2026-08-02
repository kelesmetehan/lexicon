/* Competition Badge Dice v1: one-season, home-only title rewards for the player. */
(()=>{
  const LL_BADGE_POSITIONS=['Kaleci','Orta Saha','Forvet'];
  const LL_BADGE_EURO_TYPES=['ucl','uel','uecl'];
  const LL_BADGE_LABELS={league:'Lig Sampiyonlugu',cup:'Yerel Kupa',ucl:'Sampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'};
  const llBadgeText=key=>LL_BADGE_LABELS[key]||key||'Yarisma';
  function llBadgeEnsure(state){
    if(!state)return [];
    if(!Array.isArray(state.competitionDiceBadges))state.competitionDiceBadges=[];
    state.competitionDiceBadges=state.competitionDiceBadges.filter(badge=>badge&&Number(badge.activeSeason||0)>=Number(state.season||1));
    return state.competitionDiceBadges;
  }
  function llBadgeKey(season,competition){return `${Number(season)||0}:${competition}`;}
  function llBadgeAward(state,competition){
    if(!state||!['league','cup',...LL_BADGE_EURO_TYPES].includes(competition))return null;
    const badges=llBadgeEnsure(state),key=llBadgeKey(state.season,competition);
    if(badges.some(badge=>badge.key===key))return null;
    const badge={key,sourceCompetition:competition,targetCompetition:competition,scope:LL_BADGE_EURO_TYPES.includes(competition)?'europe':'exact',role:null,awardedSeason:Number(state.season||1),activeSeason:Number(state.season||1)+1,homeOnly:true};
    badges.push(badge);state.competitionDiceBadges=badges;return badge;
  }
  function llBadgeCurrentFixture(){return lexLeague?.match?.fixture||llPlayerFixture?.()||null;}
  function llBadgeForFixture(state,fixture,position){
    if(!state||!fixture||!LL_BADGE_POSITIONS.includes(position))return null;
    const competition=fixture.competition||'league';
    return llBadgeEnsure(state).find(badge=>Number(badge.activeSeason)===Number(state.season)&&badge.role===position&&badge.targetCompetition===competition)||null;
  }
  function llBadgeIsActive(teamName,position){
    const state=lexLeague?.state,match=lexLeague?.match,fixture=llBadgeCurrentFixture();
    return !!(state&&match&&teamName===state.playerTeam&&match.playerHome&&llBadgeForFixture(state,fixture,position));
  }
  function llBadgeRange(teamName,position){
    const team=llTeamState(teamName),normal=llRange(team?.stars||1);
    return llBadgeIsActive(teamName,position)?[normal[0],Math.max(normal[1],7)]:normal;
  }
  function llBadgeCompetitionForNextSeason(state,badge){
    if(badge.scope!=='europe')return badge.sourceCompetition;
    const next=state.europe?.type;
    return LL_BADGE_EURO_TYPES.includes(next)?next:badge.sourceCompetition;
  }
  function llBadgePrepareNewSeason(state){
    llBadgeEnsure(state).forEach(badge=>{
      if(Number(badge.activeSeason)===Number(state.season))badge.targetCompetition=llBadgeCompetitionForNextSeason(state,badge);
    });
  }
  function llBadgePending(state){return llBadgeEnsure(state).filter(badge=>Number(badge.activeSeason)===Number(state.season)&&!LL_BADGE_POSITIONS.includes(badge.role));}
  function llBadgeSelectionHtml(badge){
    const target=llBadgeText(badge.targetCompetition);
    return `<div class="ll-card-title">\uD83C\uDFC5 Rozetli Zar \u00d6d\u00fcl\u00fc</div><div class="ll-sub" style="margin:8px 0 14px"><b>${llEscape(target)}</b> zaferi i\u00e7in bir rol se\u00e7. Bu rol, Sezon ${Number(badge.activeSeason)} boyunca yaln\u0131zca ${llEscape(target)} i\u00e7 saha ma\u00e7lar\u0131nda normal tavan\u0131 yerine <b>7</b> atabilir.</div><div class="ll-save-grid">${LL_BADGE_POSITIONS.map(position=>`<button class="ll-team-option" onclick="llChooseCompetitionBadgeRole('${llEscape(badge.key)}','${llEscape(position)}')"><b>${LL_POSITION_ICONS[position]} ${llEscape(position)}</b><div class="ll-range">Rozetli aral\u0131k: normal taban \u2192 7</div></button>`).join('')}</div>`;
  }
  window.llChooseCompetitionBadgeRole=function(key,position){
    const state=lexLeague?.state,badge=llBadgeEnsure(state).find(item=>item.key===key);
    if(!badge||!LL_BADGE_POSITIONS.includes(position))return;
    badge.role=position;badge.selectedAt=new Date().toISOString();
    if(typeof llSave==='function')llSave();
    if(typeof llCloseModal==='function')llCloseModal();
    if(typeof llRenderDashboard==='function')llRenderDashboard();
  };
  function llBadgePromptSelection(){
    const state=lexLeague?.state,pending=llBadgePending(state)[0];
    if(!pending||typeof llShowModal!=='function'||document.getElementById('ll-modal'))return;
    llShowModal(llBadgeSelectionHtml(pending));
  }
  function llBadgeAwardNotice(badge){
    if(!badge)return;
    const state=lexLeague?.state;
    state.badgeAwardNotice=`${llBadgeText(badge.sourceCompetition)} zaferi: sonraki sezon Rozetli Zar Odulu hazir.`;
    if(typeof llSave==='function')llSave();
  }
  const llBadgeRollValueBase=llRollValue;
  llRollValue=function(teamName,position){
    const team=llTeamState(teamName),range=llBadgeRange(teamName,position),locked=team?.lockedDice?.[position];
    let value;
    if(Number.isFinite(locked)){delete team.lockedDice[position];value=locked;}
    else if(range[1]!==llRange(team?.stars||1)[1])value=llRandomInt(range[0],range[1]);
    else return llBadgeRollValueBase(teamName,position);
    const bonus=Number(team?.nextMatchBonuses?.[position]||0);
    if(bonus){delete team.nextMatchBonuses[position];value+=bonus;}
    const card=llCard(llActiveCardId(teamName,position));
    if(llBaseName(card)==='Y\u0131ld\u0131z Oyuncu'&&team.stars>=3)value=Math.max(4,value);
    return value;
  };
  const llBadgeMakeDiceBase=llMakeDice;
  llMakeDice=function(teamName,plusPos=null){
    const dice=llBadgeMakeDiceBase(teamName,plusPos);
    dice.forEach(die=>{die.badgeActive=llBadgeIsActive(teamName,die.position);});
    return dice;
  };
  const llBadgeDieRowBase=llDieRow;
  llDieRow=function(die,...args){
    let html=llBadgeDieRowBase(die,...args);
    if(!die?.badgeActive)return html;
    html=html.replace('class="ll-die ',`class="ll-die ll-badge-die ${Number(die.value)===7?'ll-badge-seven':''} `);
    html=html.replace('<div class="ll-die-card">',`<div class="ll-die-card"><span class="ll-badge-mark">\uD83C\uDFC5 Rozetli: ${llRange(llTeamState(lexLeague.state.playerTeam).stars)[0]}-7</span><br>`);
    return html;
  };
  const llBadgeRenderMatchBase=llRenderMatch;
  llRenderMatch=function(){
    llBadgeRenderMatchBase();
    const state=lexLeague?.state,match=lexLeague?.match,fixture=llBadgeCurrentFixture();
    if(!state||!match||!fixture||!match.playerHome)return;
    const badges=LL_BADGE_POSITIONS.map(position=>({position,badge:llBadgeForFixture(state,fixture,position)})).filter(item=>item.badge);
    if(!badges.length)return;
    const host=llArea()?.querySelector('.ll-next-match');if(!host||host.querySelector('[data-competition-badge]'))return;
    const text=badges.map(item=>`${LL_POSITION_ICONS[item.position]} ${item.position}: ${llRange(llTeamState(state.playerTeam).stars)[0]}-7`).join(' \u00b7 ');
    host.insertAdjacentHTML('afterend',`<div class="ll-competition-badge" data-competition-badge>\uD83C\uDFC5 <b>${llEscape(llBadgeText(fixture.competition||'league'))} Rozeti aktif</b> \u00b7 ${llEscape(text)} \u00b7 7 geldiginde cyan zar</div>`);
  };
  const llBadgeFinishCupRoundBase=llV2FinishCupRound;
  llV2FinishCupRound=function(winner){
    const before=lexLeague?.state?.cup?.winner||null;
    const result=llBadgeFinishCupRoundBase(winner),state=lexLeague?.state;
    if(!before&&state?.cup?.winner===state.playerTeam)llBadgeAwardNotice(llBadgeAward(state,'cup'));
    return result;
  };
  const llBadgeFinishEuropeRoundBase=llV2FinishEuropeRound;
  llV2FinishEuropeRound=function(winner){
    const before=lexLeague?.state?.europe?.winner||null;
    const result=llBadgeFinishEuropeRoundBase(winner),state=lexLeague?.state,type=state?.europe?.type;
    if(!before&&state?.europe?.phase==='winner'&&state.europe.winner===state.playerTeam&&LL_BADGE_EURO_TYPES.includes(type))llBadgeAwardNotice(llBadgeAward(state,type));
    return result;
  };
  const llBadgeFinalizeSeasonBase=llV2FinalizeSeason;
  llV2FinalizeSeason=function(...args){
    const result=llBadgeFinalizeSeasonBase(...args),state=lexLeague?.state,summary=state?.lastSeasonSummary;
    const champion=summary?.tier1Rows?.[0]?.team||summary?.superRows?.[0]?.team;
    if(champion&&champion===state.playerTeam)llBadgeAwardNotice(llBadgeAward(state,'league'));
    return result;
  };
  const llBadgeStartNextSeasonBase=llStartNextSeason;
  llStartNextSeason=function(...args){
    const result=llBadgeStartNextSeasonBase(...args),state=lexLeague?.state;
    if(state){llBadgePrepareNewSeason(state);if(typeof llSave==='function')llSave();}
    return result;
  };
  const llBadgeRenderDashboardBase=llRenderDashboard;
  llRenderDashboard=function(){llBadgeRenderDashboardBase();setTimeout(llBadgePromptSelection,0);};
  function llBadgeInjectCss(){
    if(document.getElementById('ll-competition-badge-style'))return;
    const style=document.createElement('style');style.id='ll-competition-badge-style';style.textContent=`
      .ll-competition-badge{margin:12px 0 0;padding:10px 13px;border:1px solid rgba(34,211,238,.72);border-radius:10px;background:linear-gradient(90deg,rgba(8,47,73,.82),rgba(8,145,178,.14));color:#baf6ff;font-size:12px;line-height:1.5}.ll-badge-mark{display:inline-block;margin-bottom:3px;color:#67e8f9;font-size:10px;font-weight:800;letter-spacing:.04em}.ll-die.ll-badge-seven{background:#22d3ee!important;color:#082f49!important;border-color:#a5f3fc!important;box-shadow:0 0 0 3px rgba(34,211,238,.22),0 0 22px rgba(34,211,238,.42)}
    `;document.head.appendChild(style);
  }
  llBadgeInjectCss();
})();
