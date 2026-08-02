/* CLUB FACILITY PROGRESSION — career-only AP / LP investment system. */
(function(){
  'use strict';

  const LL_FACILITY_VERSION=1;
  const LL_FACILITY_COSTS={
    small:[{ap:150,lp:100},{ap:250,lp:200},{ap:350,lp:350},{ap:450,lp:500},{ap:550,lp:700},{ap:650,lp:950}],
    medium:[{ap:200,lp:150},{ap:350,lp:300},{ap:500,lp:500},{ap:650,lp:700},{ap:800,lp:1000},{ap:950,lp:1350}],
    large:[{ap:300,lp:200},{ap:500,lp:400},{ap:700,lp:700},{ap:900,lp:1000},{ap:1150,lp:1450},{ap:1350,lp:1950}]
  };
  /* Values are deliberately discrete: the player sees the exact reward before every purchase. */
  const LL_FACILITY_REWARDS={
    league:[{ap:5,win:50,draw:20,loss:5},{ap:5,win:52,draw:21,loss:5},{ap:5,win:55,draw:22,loss:5},{ap:6,win:57,draw:23,loss:6},{ap:6,win:59,draw:24,loss:6},{ap:6,win:61,draw:25,loss:6},{ap:6,win:64,draw:25,loss:6}],
    cup:[{ap:5,win:60,draw:20,loss:8},{ap:5,win:63,draw:21,loss:8},{ap:5,win:65,draw:22,loss:9},{ap:6,win:68,draw:23,loss:9},{ap:6,win:71,draw:23,loss:9},{ap:6,win:73,draw:24,loss:10},{ap:6,win:76,draw:25,loss:10}],
    playoff:[{ap:5,win:60,draw:20,loss:8},{ap:5,win:63,draw:21,loss:8},{ap:5,win:65,draw:22,loss:9},{ap:6,win:68,draw:23,loss:9},{ap:6,win:71,draw:23,loss:9},{ap:6,win:73,draw:24,loss:10},{ap:6,win:76,draw:25,loss:10}],
    ucl:[{ap:7,win:90,draw:40,loss:15},{ap:7,win:94,draw:42,loss:16},{ap:8,win:98,draw:44,loss:16},{ap:8,win:102,draw:46,loss:17},{ap:8,win:106,draw:47,loss:18},{ap:9,win:110,draw:49,loss:18},{ap:9,win:114,draw:51,loss:19}],
    uel:[{ap:7,win:85,draw:35,loss:12},{ap:7,win:89,draw:37,loss:13},{ap:8,win:93,draw:38,loss:13},{ap:8,win:97,draw:40,loss:14},{ap:8,win:100,draw:41,loss:14},{ap:9,win:104,draw:43,loss:15},{ap:9,win:108,draw:44,loss:15}],
    uecl:[{ap:6,win:80,draw:30,loss:10},{ap:6,win:84,draw:31,loss:11},{ap:7,win:87,draw:33,loss:11},{ap:7,win:91,draw:34,loss:12},{ap:7,win:95,draw:35,loss:12},{ap:8,win:98,draw:37,loss:13},{ap:8,win:102,draw:38,loss:13}]
  };
  const LL_FACILITY_LABELS={league:'Lig',cup:'Yerel Kupa',playoff:'Play-Off',ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'};

  function llFacilityNumber(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback;}
  function llFacilityEnsure(state){
    if(!state)return null;
    let facility=state.clubFacility;
    if(!facility||typeof facility!=='object'||Array.isArray(facility))facility={};
    facility.version=LL_FACILITY_VERSION;
    facility.level=Math.max(0,Math.min(6,Math.floor(llFacilityNumber(facility.level,0))));
    if(!Array.isArray(facility.history))facility.history=[];
    state.clubFacility=facility;
    return facility;
  }
  function llFacilityLevel(state){return llFacilityEnsure(state)?.level||0;}
  function llFacilityReward(competition,state){
    const rows=LL_FACILITY_REWARDS[competition]||LL_FACILITY_REWARDS.league;
    return rows[Math.max(0,Math.min(6,llFacilityLevel(state)))]||rows[0];
  }
  function llFacilityTeamStars(state){
    try{return Math.max(1,Math.min(6,Math.floor(llFacilityNumber(llTeamState(state.playerTeam)?.stars,1))));}catch(error){return 1;}
  }
  function llFacilityBand(stars){return stars<=2?'small':stars<=4?'medium':'large';}
  function llFacilityBandLabel(band){return band==='small'?'Küçük kulüp (1–2★)':band==='medium'?'Orta kulüp (3–4★)':'Büyük kulüp (5–6★)';}
  function llFacilityNextCost(state){
    const level=llFacilityLevel(state);
    if(level>=6)return null;
    const stars=llFacilityTeamStars(state),band=llFacilityBand(stars),cost=LL_FACILITY_COSTS[band][level];
    return {...cost,stars,band,nextLevel:level+1};
  }
  function llFacilityRewardsTableHtml(state){
    const level=llFacilityLevel(state);
    const rows=['league','cup','playoff','ucl','uel','uecl'].map(key=>{
      const reward=llFacilityReward(key,state);
      return `<tr><td>${LL_FACILITY_LABELS[key]}</td><td>${reward.ap}</td><td>${reward.win}</td><td>${reward.draw}</td><td>${reward.loss}</td></tr>`;
    }).join('');
    return `<div class="ll-card" data-facility-reward-table><div class="ll-card-title">AP / LP Ödülleri · Tesis Sv. ${level}</div><div class="ll-table-wrap"><table class="ll-table" style="min-width:520px"><thead><tr><th>Organizasyon</th><th>Doğru AP</th><th>Galibiyet LP</th><th>Beraberlik LP</th><th>Mağlubiyet LP</th></tr></thead><tbody>${rows}</tbody></table></div><div class="ll-muted" style="margin-top:9px">Teknik direktör gelişimi yalnızca senin doğru cevap AP’ni ve resmi maç LP’ni etkiler. Hata geri kazanımı, hedef ödülleri, zarlar, kartlar ve AI ekonomisi değişmez.</div></div>`;
  }
  function llFacilityPanelHtml(state){
    const facility=llFacilityEnsure(state),level=facility.level,current=llFacilityReward('league',state),next=llFacilityNextCost(state);
    const progress=`${'●'.repeat(level)}${'○'.repeat(6-level)}`;
    const currentText=`Lig: doğru ${current.ap} AP · G ${current.win} LP · B ${current.draw} LP · M ${current.loss} LP`;
    const upgrade=next
      ?`<div class="ll-facility-next"><div><b>Sonraki seviye: ${next.nextLevel}/6</b><span>${next.stars}★ takımın · ${llFacilityBandLabel(next.band)} maliyeti</span><small>Bedel: <strong>${next.ap} AP + ${next.lp} LP</strong></small></div><button class="ll-btn gold" ${Number(state.ap||0)<next.ap||Number(state.lp||0)<next.lp?'disabled':''} onclick="llUpgradeClubFacility()">Gelişimi Yükselt</button></div>`
      :`<div class="ll-facility-next"><div><b>Teknik direktör gelişimi maksimum seviyede</b><span>Tüm resmi maç ve kelime AP bonusları aktif.</span></div></div>`;
    return `<div class="ll-card ll-club-facility" data-club-facility style="margin-top:12px"><div class="ll-card-title">🎓 Teknik Direktör Gelişimi · Seviye ${level}/6</div><div class="ll-facility-top"><div class="ll-facility-progress" aria-label="Teknik direktör seviyesi ${level}/6">${progress}</div><div class="ll-muted">Teknik direktör kariyerine aittir; takım değiştirsen de korunur.</div></div><div class="ll-facility-current"><b>Aktif kazanç</b><span>${currentText}</span></div>${upgrade}<details class="ll-facility-details"><summary>Bu seviyedeki tüm ödülleri gör</summary><div class="ll-table-wrap" style="margin-top:10px"><table class="ll-table" style="min-width:470px"><thead><tr><th>Organizasyon</th><th>Doğru AP</th><th>G</th><th>B</th><th>M</th></tr></thead><tbody>${['league','cup','playoff','ucl','uel','uecl'].map(key=>{const reward=llFacilityReward(key,state);return `<tr><td>${LL_FACILITY_LABELS[key]}</td><td>${reward.ap}</td><td>${reward.win}</td><td>${reward.draw}</td><td>${reward.loss}</td></tr>`;}).join('')}</tbody></table></div></details></div>`;
  }
  function llFacilityInjectCss(){
    if(document.getElementById('ll-club-facility-css'))return;
    const style=document.createElement('style');style.id='ll-club-facility-css';style.textContent=`
      .ll-club-facility{border-color:rgba(222,181,61,.42);background:linear-gradient(135deg,rgba(177,126,31,.10),rgba(18,29,40,.84) 48%)}
      .ll-facility-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 10px}.ll-facility-progress{letter-spacing:4px;color:var(--gold);font-size:17px;white-space:nowrap}
      .ll-facility-current{border:1px solid rgba(68,207,215,.24);border-radius:9px;padding:9px 10px;display:grid;gap:3px;font-size:12px}.ll-facility-current b{color:#7cf2e7}.ll-facility-current span{color:var(--text2)}
      .ll-facility-next{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;border-top:1px solid rgba(255,255,255,.08);padding-top:10px}.ll-facility-next>div{display:grid;gap:3px}.ll-facility-next b{font-size:13px}.ll-facility-next span,.ll-facility-next small{color:var(--text3);font-size:11px}.ll-facility-next small strong{color:var(--gold)}
      .ll-facility-details{margin-top:11px;color:var(--text2);font-size:12px}.ll-facility-details summary{cursor:pointer;color:#84e8df;font-weight:700}@media(max-width:620px){.ll-facility-top,.ll-facility-next{align-items:flex-start;flex-direction:column}.ll-facility-next .ll-btn{width:100%}}
    `;document.head.appendChild(style);
  }
  window.llUpgradeClubFacility=function(){
    const state=lexLeague?.state;if(!state)return false;
    const facility=llFacilityEnsure(state),cost=llFacilityNextCost(state);
    if(!cost){alert('Teknik direktör gelişimi zaten maksimum seviyede.');return false;}
    if(Number(state.ap||0)<cost.ap||Number(state.lp||0)<cost.lp){alert(`Yetersiz puan. Seviye ${cost.nextLevel} için ${cost.ap} AP ve ${cost.lp} LP gerekli.`);return false;}
    const nextLeague=LL_FACILITY_REWARDS.league[cost.nextLevel];
    const message=`Teknik Direktör Gelişimi Seviye ${facility.level} → ${cost.nextLevel}\n\nMaliyet: ${cost.ap} AP + ${cost.lp} LP\nYeni lig ödülü: doğru ${nextLeague.ap} AP · galibiyet ${nextLeague.win} LP · beraberlik ${nextLeague.draw} LP · mağlubiyet ${nextLeague.loss} LP\n\nTeknik direktör kariyerine aittir; takım değiştirsen de korunur. Onaylıyor musun?`;
    if(!confirm(message))return false;
    state.ap-=cost.ap;state.lp-=cost.lp;facility.level=cost.nextLevel;
    facility.history.push({season:Number(state.season)||1,week:Number(state.week)||1,level:facility.level,spentAp:cost.ap,spentLp:cost.lp,team:state.playerTeam,stars:cost.stars,band:cost.band,at:new Date().toISOString()});
    if(typeof llSave==='function')llSave();
    if(typeof llRenderDashboard==='function')llRenderDashboard();
    return true;
  };

  /* Existing and imported careers receive a level-0 facility without changing any current reward. */
  if(typeof llV2RepairState==='function'){
    const llFacilityRepairBase=llV2RepairState;
    llV2RepairState=function(state){state=llFacilityRepairBase(state);llFacilityEnsure(state);return state;};
  }

  /* Only the player-facing reward table is replaced; LL_COMP_REWARDS remains the neutral AI/base economy. */
  if(typeof llV2RewardTable==='function')llV2RewardTable=function(){return llFacilityRewardsTableHtml(lexLeague?.state);};

  /* The quiz's per-correct AP uses the active facility level. Recovery AP stays fixed by design. */
  if(typeof llQuizApPerWord==='function')llQuizApPerWord=function(){
    try{return llFacilityReward(llPlayerFixture()?.competition||'league',lexLeague?.state).ap;}catch(error){return 5;}
  };
  if(typeof llFinishLeagueQuiz==='function')llFinishLeagueQuiz=function(){
    const quiz=lexLeague.quiz;if(!quiz||quiz.committed)return;quiz.committed=true;
    const competition=llPlayerFixture()?.competition||'league',reward=llFacilityReward(competition,lexLeague.state),baseAp=Number(quiz.correct||0)*reward.ap,recoveryAp=Number(quiz.recoveryBonus||0),ap=baseAp+recoveryAp;
    lexLeague.state.ap+=ap;
    const completed=!quiz.skipped&&quiz.index>=quiz.queue.length;let bonus='none';
    if(completed&&quiz.correct===10){bonus='perfect';lexLeague.state.lp+=10;}else if(completed&&quiz.correct===9)bonus='reroll';
    quiz.baseApEarned=baseAp;quiz.recoveryApEarned=recoveryAp;quiz.apEarned=ap;quiz.reward=bonus;quiz.totalAnswered=Number.isFinite(quiz.totalAnswered)?quiz.totalAnswered:quiz.index;
    if(typeof llSave==='function')llSave();if(typeof llRenderQuizReward==='function')llRenderQuizReward();
  };

  /* Match LP is adjusted only after the official player result is recorded, including a decisive domestic penalty shootout. */
  if(typeof llRenderRoundSummary==='function'){
    const llFacilityRoundSummaryBase=llRenderRoundSummary;
    llRenderRoundSummary=function(completedWeek,lp,pg,og,competition='league',advanced=false){
      llFacilityRoundSummaryBase(completedWeek,lp,pg,og,competition,advanced);
      const state=lexLeague?.state;if(!state)return;
      const record=[...(state.results||[])].reverse().find(item=>item&&item.userMatch&&item.competition===competition&&Number(item.season)===Number(state.season)&&!item.facilityRewardApplied);
      if(!record)return;
      const reward=llFacilityReward(competition,state);
      const penalties=record.lpDecision==='penalties';
      const outcome=penalties?(advanced?'win':'loss'):(Number(pg)>Number(og)?'win':Number(pg)===Number(og)?'draw':'loss');
      const awarded=llFacilityNumber(lp,0),target=llFacilityNumber(reward[outcome],awarded),bonus=target-awarded;
      record.facilityRewardApplied=true;record.facilityLevel=llFacilityLevel(state);record.facilityBaseLp=awarded;record.facilityBonusLp=bonus;record.facilityTotalLp=target;
      if(bonus!==0)state.lp=Math.max(0,Number(state.lp||0)+bonus);
      const notice=typeof llArea==='function'?llArea()?.querySelector('.ll-panel .ll-notice'):null;
      const facilityNote=`<div data-facility-result style="margin-top:7px;color:#83f1d6"><b>Teknik Direktör Sv. ${llFacilityLevel(state)}:</b> ${bonus>=0?'+':''}${bonus} LP · Resmi maç ödülü: ${target} LP</div>`;
      if(notice){
        notice.innerHTML=notice.innerHTML.replace(`+${awarded} LP`,`+${target} LP`);
        if(!notice.querySelector('[data-facility-result]'))notice.insertAdjacentHTML('beforeend',facilityNote);
      }
      /* The penalty animation owns the notice again after the last kick; give it the manager-adjusted final text too. */
      if(typeof llV15PenaltyRuntime!=='undefined'&&llV15PenaltyRuntime?.notice===notice){
        llV15PenaltyRuntime.finalNotice=String(llV15PenaltyRuntime.finalNotice||'').replace(`+${awarded} LP`,`+${target} LP`);
        if(!String(llV15PenaltyRuntime.finalNotice||'').includes('Kul?p Tesisi'))llV15PenaltyRuntime.finalNotice+=facilityNote;
      }
      if(typeof llSave==='function')llSave();
    };
  }

  /* The dashboard panel is rendered after every existing dashboard decorator. */
  if(typeof llRenderDashboard==='function'){
    const llFacilityDashboardBase=llRenderDashboard;
    llRenderDashboard=function(){
      llFacilityDashboardBase();llFacilityInjectCss();
      const state=lexLeague?.state,root=typeof llArea==='function'?llArea():null;
      if(!state||!root||state.seasonEnded||root.querySelector('[data-club-facility]'))return;
      llFacilityEnsure(state);
      const column=root.querySelector('.ll-grid')?.firstElementChild;if(!column)return;
      const rewardCard=[...column.children].find(node=>node.textContent?.includes('AP / LP Ödülleri'));
      if(rewardCard)rewardCard.insertAdjacentHTML('beforebegin',llFacilityPanelHtml(state));else column.insertAdjacentHTML('beforeend',llFacilityPanelHtml(state));
    };
  }

  /* Normal packs are a fixed 150 AP economy rule. The legacy Taktik Tahtas? discount is disabled without altering saved squads. */
  const LL_STANDARD_PACK_COST=150;
  if(typeof llShopCost==='function')llShopCost=function(){return LL_STANDARD_PACK_COST;};
  if(typeof llCCMarketDiscountCard==='function')llCCMarketDiscountCard=function(){return null;};
  if(typeof llTacticBoardShopHtml==='function')llTacticBoardShopHtml=function(){return '';};
  window.llBuyTacticBoard=function(){alert('Normal kart kasalar? sabit olarak 150 APdir. Taktik Tahtas?n?n eski kasa indirimi art?k kullan?lm?yor.');return false;};
  try{const retired=typeof llCard==='function'?llCard('RBU04'):null;if(retired){retired.trigger='Eski kural';retired.effect='Normal kart kasalar? art?k sabit olarak 150 APdir. Bu kart?n eski indirim etkisi kapal?d?r.';}}catch(error){}

  llFacilityInjectCss();
})();
/* CLUB_FACILITY_PROGRESSION_END */
