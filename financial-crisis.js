/* Lexicon League — Financial Crisis card-retention event. */
(function(){
  'use strict';

  const VERSION=2;
  const QUIZ_SIZE=20;
  const BONUS_AP=30;
  const BONUS_LP=50;
  const GAP_CHANCES={1:.10,2:.35,3:1};
  const SYSTEM_KEY='financialCrisis';
  const OVERLAY_ID='ll-financial-crisis-overlay';
  const STYLE_ID='ll-financial-crisis-style';

  function num(value,fallback=0){value=Number(value);return Number.isFinite(value)?value:fallback;}
  function stateNow(){return globalThis.lexLeague?.state||null;}
  function area(){return typeof globalThis.llArea==='function'?llArea():document.getElementById('app');}
  function save(){try{if(typeof globalThis.llSave==='function')llSave();}catch{}}
  function esc(value){return typeof globalThis.llEscape==='function'?llEscape(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function positions(){try{return Array.isArray(LL_POSITIONS)&&LL_POSITIONS.length?[...LL_POSITIONS]:['Kaleci','Orta Saha','Forvet'];}catch{return ['Kaleci','Orta Saha','Forvet'];}}
  function posIcon(pos){try{return LL_POSITION_ICONS?.[pos]||'🎴';}catch{return '🎴';}}
  function transferWeeks(){
    try{if(Array.isArray(LL_TRANSFER_WEEKS)&&LL_TRANSFER_WEEKS.length)return [...LL_TRANSFER_WEEKS].map(Number).filter(Number.isFinite);}catch{}
    return [10,18,24,30];
  }
  function triggerWeeks(){
    return [...new Set(transferWeeks().flatMap(w=>[w-2,w-1]).filter(w=>w>0))].sort((a,b)=>a-b);
  }
  function chanceForGap(gap){gap=Math.max(1,Math.floor(num(gap,1)));return gap>=3?1:(GAP_CHANCES[gap]||GAP_CHANCES[1]);}
  function outcomeForScore(correct){
    correct=Math.max(0,Math.min(QUIZ_SIZE,Math.floor(num(correct))));
    if(correct<=11)return {key:'sold',title:'KART SATILDI',tone:'danger',description:'Mali kriz çözülemedi. Riskteki kart slottan çıkarıldı.'};
    if(correct<=14)return {key:'rights-reset',title:'KART KURTULDU · AĞIR MALİYET',tone:'warning',description:'Yönetim satıştan vazgeçti ancak kartın mevcut maç hakkı sıfırlandı.'};
    if(correct<=17)return {key:'safe',title:'KRİZ AŞILDI',tone:'safe',description:'Kart ve mevcut maç hakları aynen korundu.'};
    return {key:'bonus',title:'KRİZ TAMAMEN AŞILDI',tone:'bonus',description:`Kart korundu. Üstün performans için +${BONUS_AP} AP · +${BONUS_LP} LP.`};
  }

  function ensureSystem(state=stateNow()){
    if(!state)return null;
    let sys=state[SYSTEM_KEY];
    if(!sys||typeof sys!=='object'||Array.isArray(sys)){
      const currentSeason=Math.max(1,Math.floor(num(state.season,1)));
      sys={version:VERSION,createdAt:new Date().toISOString(),plans:{},events:[],lastCrisisSeason:null,bootstrappedExisting:currentSeason>2};
      /* Existing careers should not receive a forced crisis immediately on install.
         Treat the previous season as the last cycle anchor; the new feature is then
         guaranteed to appear within the following three seasons. */
      if(currentSeason>2)sys.lastCrisisSeason=currentSeason-1;
      state[SYSTEM_KEY]=sys;
    }
    sys.version=VERSION;
    if(!sys.plans||typeof sys.plans!=='object')sys.plans={};
    if(!Array.isArray(sys.events))sys.events=[];
    if(sys.lastCrisisSeason!=null)sys.lastCrisisSeason=Math.max(1,Math.floor(num(sys.lastCrisisSeason)));
    return sys;
  }
  function latestUnfinishedEvent(state=stateNow()){
    const sys=ensureSystem(state);if(!sys)return null;
    for(let i=sys.events.length-1;i>=0;i--){const e=sys.events[i];if(e&&['pending','quiz','result'].includes(e.status))return e;}
    return null;
  }
  /*
   * Mali Kriz aday havuzu sözleşme durumundan bağımsızdır.
   * Slotta kart varsa remaining=0 olsa bile kriz ekranında gösterilir ve
   * satış riski için seçilebilir. Bu kural normal maç kart aktifliğini etkilemez.
   */
  function occupiedSlots(state=stateNow()){
    if(!state)return [];
    let team=null;try{team=typeof globalThis.llTeamState==='function'?llTeamState(state.playerTeam):state.teams?.[state.playerTeam];}catch{team=state.teams?.[state.playerTeam];}
    if(!team)return [];
    try{if(typeof globalThis.llEnsureTeamContracts==='function')llEnsureTeamContracts(team);}catch{}
    return positions()
      .filter(pos=>!!team.cards?.[pos])
      .map(pos=>{
        const cardId=team.cards[pos];
        const contract=team.cardContracts?.[pos];
        const remaining=contract&&contract.cardId===cardId?Math.max(0,num(contract.remaining)):null;
        const total=contract&&contract.cardId===cardId?Math.max(0,num(contract.total)):null;
        return {
          position:pos,
          cardId,
          remaining,
          total,
          contractExpired:remaining===0
        };
      });
  }
  function buildSeasonPlan(state=stateNow()){
    const sys=ensureSystem(state);if(!sys)return null;
    const season=Math.max(1,Math.floor(num(state.season,1))),key=String(season);
    if(sys.plans[key])return sys.plans[key];
    let selected=false,chance=0,gap=null;
    if(season===1){selected=false;chance=0;}
    else if(!sys.bootstrappedExisting&&sys.lastCrisisSeason==null&&season===2){selected=true;chance=1;gap=1;}
    else{
      const anchor=sys.lastCrisisSeason==null?Math.max(1,season-1):sys.lastCrisisSeason;
      gap=Math.max(1,season-anchor);chance=chanceForGap(gap);selected=Math.random()<chance;
    }
    const allWeeks=triggerWeeks(),currentWeek=Math.max(1,Math.floor(num(state.week,1))),available=allWeeks.filter(w=>w>=currentWeek);
    let targetWeek=null;
    if(selected&&available.length){
      /* Equal chance across the 1–2 week pre-transfer windows. */
      targetWeek=available[Math.floor(Math.random()*available.length)];
    }
    const plan={season,selected,chance,gap,targetWeek,triggerWeeks:allWeeks,createdAt:new Date().toISOString(),eventId:null,skippedNoCards:[]};
    sys.plans[key]=plan;save();return plan;
  }
  function nextEligibleTarget(plan,afterWeek){return (plan?.triggerWeeks||triggerWeeks()).find(w=>w>afterWeek)||null;}
  function maybeScheduleAfterLeagueMatch(state,completedWeek){
    const sys=ensureSystem(state);if(!sys||latestUnfinishedEvent(state))return null;
    const season=Math.max(1,Math.floor(num(state.season,1))),plan=buildSeasonPlan(state);if(!plan||!plan.selected||plan.eventId||num(plan.season)!==season)return null;
    completedWeek=Math.floor(num(completedWeek));
    if(completedWeek!==num(plan.targetWeek))return null;
    const slots=occupiedSlots(state);
    if(!slots.length){
      plan.skippedNoCards.push(completedWeek);plan.targetWeek=nextEligibleTarget(plan,completedWeek);save();return null;
    }
    const risk=slots[Math.floor(Math.random()*slots.length)];
    const id=`financial-crisis-${season}-${completedWeek}-${Date.now()}`;
    const event={id,season,completedWeek,status:'pending',createdAt:new Date().toISOString(),team:state.playerTeam,riskPosition:risk.position,riskCardId:risk.cardId,visibleCards:slots.map(x=>({...x})),quiz:null,result:null};
    sys.events.push(event);sys.lastCrisisSeason=season;plan.eventId=id;save();return event;
  }

  function currentTeam(state=stateNow()){
    if(!state)return null;try{return typeof globalThis.llTeamState==='function'?llTeamState(state.playerTeam):state.teams?.[state.playerTeam];}catch{return state.teams?.[state.playerTeam]||null;}
  }
  function riskCardStillPresent(event,state=stateNow()){
    const team=currentTeam(state);return !!team&&team.cards?.[event?.riskPosition]===event?.riskCardId;
  }
  function riskCardName(event){try{return globalThis.llCard?.(event?.riskCardId)?.name||event?.riskCardId||'Kart';}catch{return event?.riskCardId||'Kart';}}
  function cardRarityLabel(card){
    try{if(typeof globalThis.llRarityLabel==='function')return llRarityLabel(card);}catch{}
    return card?.rarity||'';
  }
  function contractText(team,pos){
    try{
      if(typeof globalThis.llEnsureTeamContracts==='function')llEnsureTeamContracts(team);
      const c=team?.cardContracts?.[pos];return c?`${num(c.remaining)}/${num(c.total)} maç hakkı`:'Maç hakkı bilgisi yok';
    }catch{return 'Maç hakkı bilgisi yok';}
  }
  function simpleCardHtml(slot,event,state){
    const team=currentTeam(state),isRisk=slot.position===event.riskPosition&&slot.cardId===event.riskCardId;
    let inner='';
    try{
      if(typeof globalThis.llCardHtml==='function')inner=llCardHtml(slot.cardId,state.playerTeam,'Kart yok');
    }catch{}
    if(!inner){
      let card=null;try{card=globalThis.llCard?.(slot.cardId);}catch{}
      inner=`<div class="ll-ability ${esc(card?.rarity||'')}"><b>${esc(card?.name||slot.cardId)}</b><br><span>${esc(card?.trigger||'')}</span><br><span>${esc(card?.effect||'')}</span><span class="ll-ability-performance">${esc(contractText(team,slot.position))}</span></div>`;
    }
    return `<div class="ll-fc-slot ${isRisk?'risk':''}" style="--fc-delay:${event.visibleCards.indexOf(slot)*.12}s"><div class="ll-slot-head"><span class="ll-position">${posIcon(slot.position)} ${esc(slot.position)}</span>${isRisk?'<span class="ll-fc-risk-badge">SATIŞ RİSKİ</span>':''}</div>${inner}</div>`;
  }

  function injectStyles(){
    if(typeof document==='undefined'||document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:16px;overflow:auto;background:rgba(2,6,12,.62);backdrop-filter:blur(9px) saturate(.72);-webkit-backdrop-filter:blur(9px) saturate(.72);animation:llFcFade .25s ease both}
      .ll-fc-dialog{position:relative;width:min(980px,100%);padding:24px;border:1px solid rgba(248,113,113,.52);border-radius:22px;background:radial-gradient(circle at 50% 0,rgba(239,68,68,.15),transparent 38%),linear-gradient(155deg,rgba(10,15,24,.97),rgba(21,14,18,.98));box-shadow:0 30px 100px rgba(0,0,0,.72),0 0 55px rgba(239,68,68,.14);overflow:hidden}
      .ll-fc-dialog:before{content:'';position:absolute;inset:-45%;pointer-events:none;background:repeating-conic-gradient(from 12deg,rgba(248,113,113,.045) 0 1deg,transparent 1deg 16deg);animation:llFcRotate 26s linear infinite}
      .ll-fc-content{position:relative;z-index:1}.ll-fc-kicker{color:#fca5a5;font-size:10px;font-weight:950;letter-spacing:2.2px;text-transform:uppercase}.ll-fc-title{margin:5px 0 4px;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(38px,8vw,64px);font-weight:700;line-height:.95;color:#fff1f2;text-shadow:0 0 24px rgba(239,68,68,.25)}
      .ll-fc-copy{max-width:720px;color:#cbd5e1;font-size:13px;line-height:1.6}.ll-fc-copy strong{color:#fecaca}.ll-fc-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:19px}.ll-fc-slot{position:relative;padding:12px;border:1px solid rgba(148,163,184,.16);border-radius:15px;background:rgba(15,23,42,.72);opacity:0;transform:translateY(18px) scale(.97);animation:llFcCardIn .48s cubic-bezier(.2,.88,.3,1.15) var(--fc-delay) forwards}.ll-fc-slot.risk{border-color:rgba(248,113,113,.8);box-shadow:0 0 0 2px rgba(239,68,68,.10),0 0 30px rgba(239,68,68,.15);animation:llFcCardIn .48s cubic-bezier(.2,.88,.3,1.15) var(--fc-delay) forwards,llFcRisk 1.8s ease-in-out calc(var(--fc-delay) + .6s) infinite}.ll-fc-risk-badge{padding:4px 7px;border-radius:999px;background:rgba(127,29,29,.72);border:1px solid rgba(248,113,113,.58);color:#fecaca;font-size:8px;font-weight:950;letter-spacing:.8px}.ll-fc-slot .ll-ability{width:100%;text-align:left}.ll-fc-actions{display:flex;gap:10px;align-items:stretch;margin-top:18px}.ll-fc-actions .ll-btn{flex:1}.ll-fc-primary{background:linear-gradient(135deg,#dc2626,#f97316)!important;border-color:rgba(254,202,202,.5)!important;color:white!important}.ll-fc-skip{width:100%;margin-top:9px!important;border-color:rgba(248,113,113,.34)!important;color:#fecaca!important;background:rgba(69,10,10,.34)!important}.ll-fc-warning{margin-top:9px;color:#fca5a5;font-size:10px;text-align:center}
      .ll-fc-quiz{background:radial-gradient(circle at 50% 0,rgba(220,38,38,.13),transparent 40%),linear-gradient(180deg,#090d13,#10141b)}.ll-fc-quiz .ll-question{border-color:rgba(248,113,113,.5);box-shadow:inset 0 0 40px rgba(127,29,29,.12)}.ll-fc-quiz .ll-btn.primary{background:linear-gradient(135deg,#dc2626,#f97316)!important}.ll-fc-result{max-width:720px;margin:0 auto;text-align:center}.ll-fc-result-icon{font-size:64px;margin:5px 0 10px}.ll-fc-result-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(34px,7vw,53px);font-weight:700}.ll-fc-result.danger .ll-fc-result-title{color:#fca5a5}.ll-fc-result.warning .ll-fc-result-title{color:#fde68a}.ll-fc-result.safe .ll-fc-result-title{color:#99f6e4}.ll-fc-result.bonus .ll-fc-result-title{color:#fde68a}.ll-fc-result-detail{margin:12px auto 0;padding:14px;border:1px solid rgba(255,255,255,.10);border-radius:13px;background:rgba(15,23,42,.66);color:#cbd5e1;line-height:1.6}
      @keyframes llFcFade{from{opacity:0}to{opacity:1}}@keyframes llFcRotate{to{transform:rotate(360deg)}}@keyframes llFcCardIn{to{opacity:1;transform:none}}@keyframes llFcRisk{0%,100%{box-shadow:0 0 0 2px rgba(239,68,68,.10),0 0 23px rgba(239,68,68,.12)}50%{box-shadow:0 0 0 2px rgba(248,113,113,.28),0 0 42px rgba(239,68,68,.30)}}
      @media(max-width:760px){#${OVERLAY_ID}{align-items:start;padding:12px}.ll-fc-dialog{padding:18px 13px;margin-top:3vh}.ll-fc-cards{grid-template-columns:1fr}.ll-fc-actions{flex-direction:column}.ll-fc-title{font-size:44px}}@media(prefers-reduced-motion:reduce){.ll-fc-dialog:before,.ll-fc-slot,.ll-fc-slot.risk{animation:none;opacity:1;transform:none}}
    `;document.head.appendChild(style);
  }
  function otherCinematicOpen(){
    if(typeof document==='undefined')return true;
    return !!document.querySelector('#ll-trophy-cinematic,#ll-achievement-cinematic,#ll-pack-cinematic,#ll-manager-signing,.ll-signing-cinematic,#ll-relegation-cinematic,#ll-penalty-shootout,#ll-board-meeting');
  }
  function setSequenceActive(active){globalThis.llFinancialCrisisSequenceActive=!!active;}
  function removeOverlay(){if(typeof document==='undefined')return;document.getElementById(OVERLAY_ID)?.remove();document.body?.classList.remove('ll-cinematic-open');}
  function isDashboardVisible(){const root=area();return !!root?.querySelector('.ll-squad')&&!!root?.querySelector('.ll-next-match');}

  function renderCrisisOverlay(event){
    const state=stateNow();if(!state||!event||event.status!=='pending'||typeof document==='undefined')return false;
    if(document.getElementById(OVERLAY_ID))return true;
    if(otherCinematicOpen()){setTimeout(()=>{const latest=latestUnfinishedEvent();if(latest?.status==='pending'&&isDashboardVisible())renderCrisisOverlay(latest);},260);return false;}
    if(!isDashboardVisible())return false;
    if(!riskCardStillPresent(event,state)){
      const slots=occupiedSlots(state);if(!slots.length){event.status='done';event.cancelledReason='no-cards';save();return false;}
      const risk=slots[Math.floor(Math.random()*slots.length)];event.riskPosition=risk.position;event.riskCardId=risk.cardId;event.visibleCards=slots.map(x=>({...x}));save();
    }
    setSequenceActive(true);injectStyles();document.body?.classList.add('ll-cinematic-open');
    const overlay=document.createElement('div');overlay.id=OVERLAY_ID;overlay.innerHTML=`<section class="ll-fc-dialog" role="dialog" aria-modal="true" aria-label="Mali kriz"><div class="ll-fc-content"><div class="ll-fc-kicker">YÖNETİM BİLDİRİMİ · SEZON ${event.season}</div><div class="ll-fc-title">🚨 MALİ KRİZ</div><div class="ll-fc-copy">Kulüp yönetimi acil mali önlem kararı aldı. Kadrodaki kartlardan biri satış riski altında. <strong>Bir kart satılacak. Krizi aşmaya çalış.</strong><br>20 soruluk sınavda <b>15 veya daha fazla</b> doğru kartı kayıpsız korur.</div><div class="ll-fc-cards">${(event.visibleCards||occupiedSlots(state)).map(slot=>simpleCardHtml(slot,event,state)).join('')}</div><div class="ll-fc-actions"><button class="ll-btn ll-fc-primary" type="button" onclick="llFinancialCrisisStartQuiz()">Krizi Çöz · 20 Soru</button></div><button class="ll-btn ll-fc-skip" type="button" onclick="llFinancialCrisisSkip()">Geç · Riskteki Kartı Kaybet</button><div class="ll-fc-warning">Geç seçeneği ${esc(riskCardName(event))} kartını doğrudan slottan çıkarır.</div></div></section>`;
    document.body.appendChild(overlay);return true;
  }

  function recordWordShown(ref,state,quiz){
    if(!ref||!state||!quiz)return;if(!Array.isArray(quiz.shownWordRefs))quiz.shownWordRefs=[];
    const key=`${num(quiz.index)}:${ref.id}`;if(quiz.shownWordRefs.includes(key))return;quiz.shownWordRefs.push(key);
    if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];state.recentQuizWords=[...state.recentQuizWords.filter(id=>id!==ref.id),ref.id].slice(-30);
  }
  function markWordUsed(ref,state){if(!ref||!state)return;const used=new Set(ref.cycleStart?[]:(state.usedWords||[]));used.add(ref.id);state.usedWords=[...used];}
  function renderQuiz(event){
    const state=stateNow(),quiz=event?.quiz;if(!state||!event||!quiz)return;
    removeOverlay();setSequenceActive(true);injectStyles();
    if(quiz.index>=quiz.queue.length){finishQuiz(event);return;}
    const ref=quiz.queue[quiz.index],words=typeof globalThis.loadUserWords==='function'?loadUserWords():[],word=words.find(item=>item.id===ref.id);
    if(!word){quiz.index++;save();renderQuiz(event);return;}
    recordWordShown(ref,state,quiz);
    const askTrToEn=!!ref.askTrToEn,question=askTrToEn?String(word.tr||'').split(',')[0].trim():word.en,answer=askTrToEn?word.en:word.tr;
    let example='';if(word.example)example=askTrToEn&&typeof globalThis.llMaskAnswerInExample==='function'?llMaskAnswerInExample(word.example,word.en):word.example;
    const exampleHtml=example&&typeof globalThis.llExampleSentenceHtml==='function'?llExampleSentenceHtml(word,example,`financial-${quiz.index}-${word.id}`):'';
    const spoken=text=>`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,text):esc(text)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`;
    const questionHtml=askTrToEn?esc(question):spoken(question),answerHtml=askTrToEn?spoken(answer):esc(answer);
    const fullExampleHtml=quiz.revealed&&typeof globalThis.llFullExampleSentenceHtml==='function'?llFullExampleSentenceHtml(word):'';
    const pct=(quiz.index/QUIZ_SIZE)*100;
    area().innerHTML=`<div class="ll-shell ll-quiz-card ll-fc-quiz"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Mali <em>Kriz</em></div><div class="ll-muted">${quiz.index+1}/${QUIZ_SIZE} · Riskteki kart: ${esc(riskCardName(event))}</div></div><div class="ll-stars">Doğru: ${quiz.correct}/${QUIZ_SIZE}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-question" onclick="llFinancialCrisisReveal()"><div><div class="ll-position">${askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${quiz.revealed?`<div class="ll-answer">${answerHtml}${fullExampleHtml}</div>`:'<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${quiz.revealed?'':'opacity:.35;pointer-events:none'}"><button type="button" class="ll-btn danger" onclick="llFinancialCrisisRate(false)">✕ Bilmiyorum</button><button type="button" class="ll-btn primary" onclick="llFinancialCrisisRate(true)">✓ Bildim</button></div></div></div>`;
    try{if(typeof globalThis.markNewWordFrame==='function')markNewWordFrame(word,area().querySelector('.ll-question'));}catch{}
  }
  function startQuiz(){
    const state=stateNow(),event=latestUnfinishedEvent(state);if(!state||!event||event.status!=='pending')return;
    if(!event.quiz){
      const queue=typeof globalThis.llPickQuizWords==='function'?llPickQuizWords(QUIZ_SIZE):[];
      if(!Array.isArray(queue)||queue.length<QUIZ_SIZE){alert(`Mali Kriz sınavı için ${QUIZ_SIZE} kullanılabilir kelime gerekiyor. Mevcut: ${queue?.length||0}. Kartın henüz etkilenmedi.`);return;}
      event.quiz={queue,index:0,correct:0,revealed:false,completed:false,shownWordRefs:[],answerBusy:false};
    }
    event.status='quiz';event.startedAt=event.startedAt||new Date().toISOString();save();renderQuiz(event);
  }
  function rate(correct){
    const state=stateNow(),event=latestUnfinishedEvent(state),quiz=event?.quiz;if(!state||!event||event.status!=='quiz'||!quiz||!quiz.revealed||quiz.answerBusy)return;
    const index=num(quiz.index),ref=quiz.queue?.[index];if(!ref)return;quiz.answerBusy=true;if(correct)quiz.correct++;quiz.index=index+1;quiz.revealed=false;
    try{globalThis.llRecordSeasonVocabularyAnswer?.({correct:!!correct,fixture:null,quiz,answerIndex:index,eventType:'financial-crisis'});}catch{}
    try{if(typeof globalThis.llPersistQuizWordRating==='function')llPersistQuizWordRating(ref,quiz,!!correct,{markUsed:false});}catch{}
    try{markWordUsed(ref,state);}catch{}
    quiz.answerBusy=false;save();if(quiz.index>=QUIZ_SIZE)finishQuiz(event);else renderQuiz(event);
  }

  function applyOutcome(event,outcomeKey,correct=null,source='quiz'){
    const state=stateNow(),team=currentTeam(state);if(!state||!team||!event)return null;
    const pos=event.riskPosition,cardId=event.riskCardId,stillThere=team.cards?.[pos]===cardId;
    let beforeContract=null,afterContract=null,removed=false,bonusAp=0,bonusLp=0;
    try{if(typeof globalThis.llEnsureTeamContracts==='function')llEnsureTeamContracts(team);}catch{}
    const contract=team.cardContracts?.[pos];if(contract)beforeContract={cardId:contract.cardId,remaining:num(contract.remaining),total:num(contract.total)};
    if(outcomeKey==='sold'){
      if(stillThere){team.cards[pos]=null;if(team.cardContracts)delete team.cardContracts[pos];removed=true;}
    }else if(outcomeKey==='rights-reset'){
      if(stillThere){
        try{if(typeof globalThis.llEnsureTeamContracts==='function')llEnsureTeamContracts(team);}catch{}
        const c=team.cardContracts?.[pos];if(c)c.remaining=0;
      }
    }else if(outcomeKey==='bonus'){
      bonusAp=BONUS_AP;bonusLp=BONUS_LP;state.ap=num(state.ap)+bonusAp;state.lp=num(state.lp)+bonusLp;
    }
    const c2=team.cardContracts?.[pos];if(c2)afterContract={cardId:c2.cardId,remaining:num(c2.remaining),total:num(c2.total)};
    event.result={key:outcomeKey,correct:correct==null?null:num(correct),source,cardId,cardName:riskCardName(event),position:pos,removed,beforeContract,afterContract,bonusAp,bonusLp,resolvedAt:new Date().toISOString()};
    event.status='result';event.resolvedAt=event.result.resolvedAt;save();return event.result;
  }
  function finishQuiz(event){
    const quiz=event?.quiz;if(!event||!quiz||quiz.completed)return;quiz.completed=true;quiz.completedAt=new Date().toISOString();
    const outcome=outcomeForScore(quiz.correct);applyOutcome(event,outcome.key,quiz.correct,'quiz');
    const state=stateNow();if(state?.achievementStats){state.achievementStats.words=num(state.achievementStats.words)+num(quiz.correct);}
    save();renderResult(event);
  }
  function skip(){
    const event=latestUnfinishedEvent();if(!event||event.status!=='pending')return;
    applyOutcome(event,'sold',null,'skip');removeOverlay();renderResult(event);
  }
  function renderResult(event){
    const result=event?.result;if(!event||event.status!=='result'||!result)return;
    removeOverlay();setSequenceActive(true);injectStyles();
    const out=outcomeForScore(result.correct==null?0:result.correct),skipped=result.source==='skip';
    const display=skipped?{...out,title:'KART SATILDI',tone:'danger',description:'Krizi çözmeden geçtin. Riskteki kart doğrudan slottan çıkarıldı.'}:out;
    const contractLine=result.key==='rights-reset'&&result.beforeContract?`${result.beforeContract.remaining}/${result.beforeContract.total} → 0/${result.beforeContract.total} maç hakkı`:result.key==='sold'?`${esc(result.position)} slotu boşaltıldı.`:result.key==='bonus'?`+${result.bonusAp} AP · +${result.bonusLp} LP`:'Kart ve maç hakları korundu.';
    const icon=result.key==='sold'?'💸':result.key==='rights-reset'?'⚠️':result.key==='bonus'?'🏆':'🛡️';
    const scoreText=skipped?'Sınava girilmedi':`${num(result.correct)} / ${QUIZ_SIZE} doğru`;
    area().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel ll-fc-result ${display.tone}"><div class="ll-fc-kicker">MALİ KRİZ SONUCU · ${esc(scoreText)}</div><div class="ll-fc-result-icon">${icon}</div><div class="ll-fc-result-title">${esc(display.title)}</div><div class="ll-fc-result-detail"><b>${esc(result.cardName)}</b> · ${posIcon(result.position)} ${esc(result.position)}<br>${esc(display.description)}<br><b>${esc(contractLine)}</b></div><button class="ll-btn primary" style="margin-top:18px;min-width:210px" onclick="llFinancialCrisisContinue()">Devam Et</button></div></div>`;
  }
  function continueAfterResult(){
    const event=latestUnfinishedEvent();if(!event||event.status!=='result')return;
    event.status='done';event.finishedAt=new Date().toISOString();save();setSequenceActive(false);removeOverlay();
    if(typeof globalThis.llRenderDashboard==='function')llRenderDashboard();
    setTimeout(()=>{try{if(globalThis.llTryShowQueuedDieCinematic?.())return;if(globalThis.llTryShowQueuedTrophyAnimation?.())return;globalThis.llTryShowQueuedAchievements?.();}catch{}},80);
  }
  function showPendingAfterDashboard(){
    const state=stateNow(),event=latestUnfinishedEvent(state);if(!state||!event)return;
    if(event.status==='pending')renderCrisisOverlay(event);else if(event.status==='quiz'){setSequenceActive(true);renderQuiz(event);}else if(event.status==='result'){setSequenceActive(true);renderResult(event);}
  }

  function wrap(name,builder,flag='__financialCrisis'){
    const base=globalThis[name];if(typeof base!=='function'||base[flag])return false;const wrapped=builder(base);wrapped[flag]=true;wrapped[`${flag}Base`]=base;globalThis[name]=wrapped;return true;
  }
  function install(){
    injectStyles();
    wrap('llV2RepairState',base=>function(state){const result=base.apply(this,arguments);if(result)ensureSystem(result);return result;});
    wrap('llCommitCurrentMatch',base=>function(){
      const state=stateNow(),match=globalThis.lexLeague?.match,already=!!match?.committed,completedWeek=num(state?.week),competition=match?.fixture?.competition||'league';
      const result=base.apply(this,arguments);
      if(state&&match&&!already&&match.committed&&competition==='league'){buildSeasonPlan(state);maybeScheduleAfterLeagueMatch(state,completedWeek);save();}
      return result;
    });
    wrap('llRenderDashboard',base=>function(){const state=stateNow();if(state){ensureSystem(state);buildSeasonPlan(state);}const result=base.apply(this,arguments);showPendingAfterDashboard();return result;});
    const initial=stateNow();if(initial){ensureSystem(initial);buildSeasonPlan(initial);}
  }

  globalThis.llFinancialCrisisStartQuiz=startQuiz;
  globalThis.llFinancialCrisisSkip=skip;
  globalThis.llFinancialCrisisReveal=function(){const event=latestUnfinishedEvent(),quiz=event?.quiz;if(!event||event.status!=='quiz'||!quiz||quiz.completed)return;quiz.revealed=true;save();renderQuiz(event);};
  globalThis.llFinancialCrisisRate=rate;
  globalThis.llFinancialCrisisContinue=continueAfterResult;
  globalThis.llFinancialCrisisTestApi={VERSION,QUIZ_SIZE,BONUS_AP,BONUS_LP,chanceForGap,outcomeForScore,triggerWeeks,ensureSystem,buildSeasonPlan,maybeScheduleAfterLeagueMatch,applyOutcome,occupiedSlots};
  install();
})();
