/* Penalty shootout presentation v15: stored kick sequence and animated summary. */
var llV15PenaltyRuntime=null;

llV12PenaltyShootout=function(state,player,opponent){
  const playerChance=llV12PenaltyChance(state,player,opponent);
  const opponentChance=llV12PenaltyChance(state,opponent,player);
  const kicks=[];
  let playerPens=0,opponentPens=0;

  for(let round=1;round<=5;round++){
    const playerScored=Math.random()<playerChance;
    const opponentScored=Math.random()<opponentChance;
    if(playerScored)playerPens++;
    if(opponentScored)opponentPens++;
    kicks.push({
      number:round,
      playerScored,
      opponentScored,
      playerScore:playerPens,
      opponentScore:opponentPens,
      suddenDeath:false
    });
    const remaining=5-round;
    if(playerPens>opponentPens+remaining||opponentPens>playerPens+remaining)break;
  }

  let suddenDeathRound=0;
  while(playerPens===opponentPens&&suddenDeathRound<20){
    suddenDeathRound++;
    const playerScored=Math.random()<playerChance;
    const opponentScored=Math.random()<opponentChance;
    if(playerScored)playerPens++;
    if(opponentScored)opponentPens++;
    kicks.push({
      number:kicks.length+1,
      playerScored,
      opponentScored,
      playerScore:playerPens,
      opponentScore:opponentPens,
      suddenDeath:true
    });
  }

  if(playerPens===opponentPens){
    const playerScored=Math.random()<.5;
    const opponentScored=!playerScored;
    if(playerScored)playerPens++;
    if(opponentScored)opponentPens++;
    kicks.push({
      number:kicks.length+1,
      playerScored,
      opponentScored,
      playerScore:playerPens,
      opponentScore:opponentPens,
      suddenDeath:true
    });
  }

  const tie=state.europe?.tie;
  return {
    player:playerPens,
    opponent:opponentPens,
    winner:playerPens>opponentPens?player:opponent,
    playerTeam:player,
    opponentTeam:opponent,
    suddenDeath:kicks.some(kick=>kick.suddenDeath),
    kicks,
    aggregate:tie?{
      player:Number(tie.playerGoals)||0,
      opponent:Number(tie.opponentGoals)||0
    }:null
  };
};

function llV15PenaltyDot(scored,teamName){
  const label=scored?'Gol':'Kaçtı';
  return `<span class="ll-penalty-dot ${scored?'scored':'missed'}" title="${llEscape(teamName)}: ${label}" aria-label="${llEscape(teamName)}: ${label}">${scored?'✓':'×'}</span>`;
}

function llV15PenaltyRow(kick,shootout){
  const roundLabel=kick.suddenDeath?`${kick.number}. Penaltı · Ani ölüm`:`${kick.number}. Penaltı`;
  return `<div class="ll-penalty-row" data-penalty-row="${kick.number}">
    <div class="ll-penalty-number">${roundLabel}</div>
    <div class="ll-penalty-attempt">${llV15PenaltyDot(kick.playerScored,shootout.playerTeam)}</div>
    <div class="ll-penalty-score">${Number(kick.playerScore)||0}–${Number(kick.opponentScore)||0}</div>
    <div class="ll-penalty-attempt">${llV15PenaltyDot(kick.opponentScored,shootout.opponentTeam)}</div>
  </div>`;
}

function llV15StopPenaltyAnimation(){
  if(!llV15PenaltyRuntime)return;
  (llV15PenaltyRuntime.timers||[]).forEach(clearTimeout);
  llV15PenaltyRuntime.timers=[];
}

function llV15FinishPenaltyAnimation(){
  const runtime=llV15PenaltyRuntime;
  if(!runtime)return;
  llV15StopPenaltyAnimation();
  const panel=document.getElementById('ll-penalty-shootout');
  const status=panel?.querySelector('.ll-penalty-final');
  const skip=panel?.querySelector('.ll-penalty-skip');
  const won=runtime.shootout.winner===runtime.shootout.playerTeam;
  if(status){
    status.hidden=false;
    status.innerHTML=`<strong>${won?'TURU GEÇTİN':'ELENDİN'}</strong><span>Penaltılar ${runtime.shootout.player}–${runtime.shootout.opponent}</span>`;
  }
  if(skip)skip.hidden=true;
  runtime.actions?.querySelectorAll('button').forEach(button=>button.disabled=false);
  if(runtime.notice)runtime.notice.innerHTML=runtime.finalNotice;
  panel?.classList.add('complete');
}

function llV15RevealPenaltyKick(index){
  const runtime=llV15PenaltyRuntime;
  if(!runtime||index>=runtime.shootout.kicks.length){
    llV15FinishPenaltyAnimation();
    return;
  }
  const rows=document.getElementById('ll-penalty-rows');
  if(rows&&!rows.querySelector(`[data-penalty-row="${runtime.shootout.kicks[index].number}"]`)){
    rows.insertAdjacentHTML('beforeend',llV15PenaltyRow(runtime.shootout.kicks[index],runtime.shootout));
    const row=rows.lastElementChild;
    requestAnimationFrame(()=>row?.classList.add('visible'));
    row?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  }
  const delay=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?140:820;
  runtime.timers.push(setTimeout(()=>llV15RevealPenaltyKick(index+1),delay));
}

function llV15SkipPenaltyAnimation(){
  const runtime=llV15PenaltyRuntime;
  if(!runtime)return;
  llV15StopPenaltyAnimation();
  const rows=document.getElementById('ll-penalty-rows');
  runtime.shootout.kicks.forEach(kick=>{
    if(!rows?.querySelector(`[data-penalty-row="${kick.number}"]`)){
      rows?.insertAdjacentHTML('beforeend',llV15PenaltyRow(kick,runtime.shootout));
    }
  });
  rows?.querySelectorAll('.ll-penalty-row').forEach(row=>row.classList.add('visible'));
  llV15FinishPenaltyAnimation();
}

function llV15PenaltyAggregate(shootout,progress){
  if(shootout.aggregate)return `${Number(shootout.aggregate.player)||0}–${Number(shootout.aggregate.opponent)||0}`;
  const match=String(progress||'').match(/Toplam\s+(\d+)\s*[-–]\s*(\d+)/i);
  return match?`${match[1]}–${match[2]}`:'Eşit';
}

const llV15RenderRoundSummaryBase=llRenderRoundSummary;
llRenderRoundSummary=function(completedWeek,lp,pg,og,comp='league',advanced=false){
  llV15StopPenaltyAnimation();
  llV15PenaltyRuntime=null;
  llV15RenderRoundSummaryBase(completedWeek,lp,pg,og,comp,advanced);
  if(!['ucl','uel','uecl'].includes(comp))return;

  const state=lexLeague.state;
  const result=[...(state.results||[])].reverse().find(item=>item.userMatch&&item.competition===comp);
  const shootout=result?.penaltyShootout;
  if(!shootout||!Array.isArray(shootout.kicks)||!shootout.kicks.length)return;

  const root=llArea();
  const notice=root?.querySelector('.ll-notice');
  const buttons=[...(root?.querySelectorAll('.ll-panel .ll-btn')||[])];
  const actions=buttons.length?buttons[buttons.length-1].parentElement:null;
  if(!notice||!actions)return;

  const stage=llV11EuroStageLabel(result.euroStage);
  const progress=state.europe?.status||`${stage} tamamlandı.`;
  const aggregate=llV15PenaltyAggregate(shootout,progress);
  const finalNotice=`+${lp} LP<br><b>${llEscape(stage)}:</b> ${llEscape(progress)}`;
  notice.innerHTML=`+${lp} LP<br><b>${llEscape(stage)}:</b> İki maçın toplamı ${aggregate}. Eşitlik bozulmadı; penaltılara gidiliyor.`;
  actions.querySelectorAll('button').forEach(button=>button.disabled=true);
  actions.insertAdjacentHTML('beforebegin',`<section class="ll-penalty-shootout" id="ll-penalty-shootout" aria-live="polite">
    <div class="ll-penalty-kicker">PENALTI ATIŞLARI</div>
    <div class="ll-penalty-heading">Toplam skor <strong>${aggregate}</strong> · Kazanan tur atlar</div>
    <div class="ll-penalty-team-head"><span aria-hidden="true"></span>
      <span>${llEscape(shootout.playerTeam)}</span>
      <b>SKOR</b>
      <span>${llEscape(shootout.opponentTeam)}</span>
    </div>
    <div class="ll-penalty-rows" id="ll-penalty-rows"></div>
    <div class="ll-penalty-final" hidden></div>
    <button class="ll-btn ll-penalty-skip" type="button" onclick="llV15SkipPenaltyAnimation()">Animasyonu Geç</button>
  </section>`);

  llV15PenaltyRuntime={shootout,notice,actions,finalNotice,timers:[]};
  const openingDelay=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?100:750;
  llV15PenaltyRuntime.timers.push(setTimeout(()=>llV15RevealPenaltyKick(0),openingDelay));
};

if(typeof document!=='undefined'&&!document.getElementById('ll-penalty-animation-style')){
  const style=document.createElement('style');
  style.id='ll-penalty-animation-style';
  style.textContent=`
    .ll-penalty-shootout{max-width:760px;margin:18px auto 4px;padding:18px;border:1px solid rgba(45,212,191,.38);border-radius:16px;background:linear-gradient(145deg,rgba(6,21,31,.96),rgba(13,31,43,.94));box-shadow:0 18px 45px rgba(0,0,0,.25);text-align:center}
    .ll-penalty-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;color:#5eead4}
    .ll-penalty-heading{margin:7px 0 15px;color:#cbd5e1;font-size:14px}
    .ll-penalty-heading strong{color:#f8fafc;font-size:18px}
    .ll-penalty-team-head,.ll-penalty-row{display:grid;align-items:center;gap:8px}
    .ll-penalty-row,.ll-penalty-team-head{grid-template-columns:minmax(90px,130px) minmax(120px,1fr) 80px minmax(120px,1fr)}
    .ll-penalty-team-head{padding:0 10px 9px;font-weight:800;color:#e2e8f0}
    .ll-penalty-team-head b{font-size:10px;letter-spacing:.14em;color:#64748b}
    .ll-penalty-team-head span:nth-child(2){text-align:center}.ll-penalty-team-head span:last-child{text-align:center}
    .ll-penalty-row{min-height:52px;margin-top:7px;padding:7px 10px;border:1px solid rgba(148,163,184,.13);border-radius:12px;background:rgba(15,23,42,.72);opacity:0;transform:translateY(10px) scale(.985);transition:opacity .32s ease,transform .32s ease,border-color .32s ease}
    .ll-penalty-row.visible{opacity:1;transform:none;border-color:rgba(94,234,212,.22)}
    .ll-penalty-number{text-align:left;color:#94a3b8;font-size:12px;font-weight:750}
    .ll-penalty-score{font-family:Georgia,serif;font-size:22px;color:#f8fafc;font-weight:800}
    .ll-penalty-attempt{display:flex;justify-content:center}
    .ll-penalty-dot{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:19px;font-weight:950;color:#071019;box-shadow:0 0 0 4px rgba(255,255,255,.035);animation:llPenaltyPop .38s cubic-bezier(.2,.9,.25,1.35)}
    .ll-penalty-dot.scored{background:#4ade80;box-shadow:0 0 18px rgba(74,222,128,.34)}
    .ll-penalty-dot.missed{background:#fb7185;box-shadow:0 0 18px rgba(251,113,133,.28)}
    .ll-penalty-final{display:flex;justify-content:center;gap:12px;align-items:center;margin-top:14px;padding:12px;border-radius:12px;background:rgba(15,118,110,.2);border:1px solid rgba(94,234,212,.32)}
    .ll-penalty-final strong{color:#86efac;letter-spacing:.06em}.ll-penalty-final span{color:#f8fafc;font-weight:800}
    .ll-penalty-skip{margin-top:14px}
    @keyframes llPenaltyPop{0%{transform:scale(.25);opacity:.2}70%{transform:scale(1.16)}100%{transform:scale(1);opacity:1}}
    @media(max-width:620px){
      .ll-penalty-shootout{padding:14px 10px}
      .ll-penalty-team-head,.ll-penalty-row{grid-template-columns:74px minmax(70px,1fr) 54px minmax(70px,1fr)}.ll-penalty-team-head{padding:0 5px 8px;font-size:11px}
      .ll-penalty-row{padding:7px 5px}
      .ll-penalty-row:after{content:'';display:none}
      .ll-penalty-number{font-size:10px}.ll-penalty-score{font-size:19px}.ll-penalty-dot{width:30px;height:30px;font-size:17px}
    }
    @media(prefers-reduced-motion:reduce){.ll-penalty-row,.ll-penalty-dot{transition:none;animation:none}}
  `;
  document.head.appendChild(style);
}
