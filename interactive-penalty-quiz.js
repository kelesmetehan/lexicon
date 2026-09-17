/* Interactive penalty shootout quiz — every word is one user penalty. */
(function(global){
'use strict';

const VERSION=1;
const DEMO_SESSION_KEY='llInteractivePenaltyDemoUsed';
const MAX_SUDDEN_DEATH_ROUNDS=40;
let runtime=null;

function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function esc(value){return typeof global.llEscape==='function'?global.llEscape(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stateNow(){return global.lexLeague?.state||null;}
function area(){return typeof global.llArea==='function'?global.llArea():document.getElementById('app');}
function save(){try{global.llSave?.();}catch(_){}}
function deep(value){try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}}
function reduceMotion(){return !!global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function teamLogo(name,variant='match'){try{return global.llTeamLogo?.(name,variant)||'⚽';}catch(_){return '⚽';}}
function fixtureNow(){try{return global.lexLeague?.match?.fixture||global.lexLeague?.quiz?.fixture||global.llPlayerFixture?.()||null;}catch(_){return null;}}
function playerTeam(){return global.lexLeague?.match?.player||stateNow()?.playerTeam||'Sen';}
function opponentTeam(){const match=global.lexLeague?.match;if(match?.opponent)return match.opponent;const state=stateNow(),fixture=fixtureNow();if(fixture&&state?.playerTeam)return fixture.home===state.playerTeam?fixture.away:fixture.home;return 'Rakip';}
function starsFor(name){try{return Math.max(1,Math.min(6,num(stateNow()?.teams?.[name]?.stars||global.llTeamDef?.(name)?.stars,3)));}catch(_){return 3;}}
function opponentChance(player,opponent){try{if(typeof global.llV12PenaltyChance==='function')return Math.max(.60,Math.min(.84,num(global.llV12PenaltyChance(stateNow(),opponent,player),.72)));}catch(_){}return Math.max(.60,Math.min(.84,.72+(starsFor(opponent)-starsFor(player))*.03));}
function isNationalMatch(match,state){
  const fx=match?.fixture||{};
  if(fx.nationalTournament||fx.league==='national'||fx.nationalFixtureId||fx.competition==='national')return true;
  try{const rec=global.llNationalTournamentTestApi?.activeNationalRecord?.(state);return !!(rec&&match?.player===rec.selectedTeam);}catch(_){return false;}
}
function nationalStage(match,state){
  const fx=match?.fixture||{};
  if(fx.nationalStage)return fx.nationalStage;
  try{return global.llNationalTournamentTestApi?.activeNationalRecord?.(state)?.edition?.stage||'group';}catch(_){return 'group';}
}
function shootoutRequirement(match,state){
  if(!match||match.committed||!match.resolution)return null;
  const pg=num(match.resolution.scoreA),og=num(match.resolution.scoreB),fx=match.fixture||{},comp=fx.competition||'league';
  if(isNationalMatch(match,state)){
    const stage=nationalStage(match,state);if(stage&&stage!=='group'&&pg===og)return {kind:'national',comp:'national',stage,label:fx.roundLabel||stage};
    return null;
  }
  if(comp==='supercup'||comp==='playoff')return pg===og?{kind:'single',comp,stage:fx.roundLabel||'',label:fx.roundLabel||comp}:null;
  if(comp==='cup'){
    const cup=state?.cup||state?.cups?.[state?.playerCountry||'TUR']||null;
    const usesTwoLegs=typeof global.llMLCupUsesTwoLegs==='function'?!!global.llMLCupUsesTwoLegs(cup):false;
    const roundIsFinal=typeof global.llMLCupRoundIsFinal==='function'?!!global.llMLCupRoundIsFinal(num(cup?.round)):false;
    const sameTie=usesTwoLegs&&!roundIsFinal&&cup?.pending&&(!fx.cupTieId||!cup.pending.tieId||fx.cupTieId===cup.pending.tieId);
    if(sameTie&&num(fx.cupLeg)===1)return null;
    if(sameTie&&num(fx.cupLeg)===2){
      const playerTotal=num(cup.pending?.firstLeg?.playerGoals)+pg,opponentTotal=num(cup.pending?.firstLeg?.opponentGoals)+og;
      return playerTotal===opponentTotal?{kind:'cup-aggregate',comp,stage:fx.roundLabel||'',label:fx.roundLabel||'Kupa rövanşı',aggregate:{player:playerTotal,opponent:opponentTotal}}:null;
    }
    return pg===og?{kind:'single',comp,stage:fx.roundLabel||'',label:fx.roundLabel||comp}:null;
  }
  if(['ucl','uel','uecl'].includes(comp)){
    const e=state?.europe,tie=e?.tie;if(!e||e.phase==='league'||!tie)return null;
    const decisive=tie.stage==='final'||num(tie.leg)===2;if(!decisive)return null;
    const playerTotal=num(tie.playerGoals)+pg,opponentTotal=num(tie.opponentGoals)+og;
    if(playerTotal!==opponentTotal)return null;
    return {kind:'europe',comp,stage:tie.stage,label:fx.roundLabel||tie.stage,aggregate:{player:playerTotal,opponent:opponentTotal}};
  }
  return null;
}

function injectStyles(){
  if(typeof document==='undefined'||document.getElementById('ll-interactive-penalty-style'))return;
  const style=document.createElement('style');style.id='ll-interactive-penalty-style';style.textContent=`
    .ll-ip-shell{position:relative;isolation:isolate;overflow:hidden;min-height:610px;border-radius:24px;background:radial-gradient(ellipse at 50% 105%,rgba(16,185,129,.24),transparent 42%),radial-gradient(circle at 50% 14%,rgba(59,130,246,.12),transparent 35%),linear-gradient(180deg,#06121c,#071a20 57%,#04100d);box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 0 0 1px rgba(94,234,212,.19);color:#f8fafc;padding:24px}
    .ll-ip-shell:before{content:'';position:absolute;inset:0;z-index:-2;background:repeating-linear-gradient(90deg,transparent 0 8%,rgba(255,255,255,.018) 8.1% 8.3%,transparent 8.4% 16%);opacity:.65}
    .ll-ip-shell:after{content:'';position:absolute;left:-10%;right:-10%;bottom:-65px;height:210px;z-index:-2;border-radius:50%;background:repeating-linear-gradient(0deg,rgba(22,163,74,.18) 0 13px,rgba(16,185,129,.10) 13px 26px);transform:perspective(380px) rotateX(58deg);filter:blur(.3px)}
    .ll-ip-spotlights{position:absolute;inset:0;z-index:-1;pointer-events:none;background:conic-gradient(from 205deg at 12% 0,transparent 0 14deg,rgba(226,232,240,.09) 15deg 21deg,transparent 22deg 360deg),conic-gradient(from 145deg at 88% 0,transparent 0 14deg,rgba(226,232,240,.08) 15deg 21deg,transparent 22deg 360deg);animation:llIpLights 4.8s ease-in-out infinite alternate}
    .ll-ip-kicker{text-align:center;font-size:11px;font-weight:950;letter-spacing:.22em;color:#5eead4;text-transform:uppercase}
    .ll-ip-title{text-align:center;margin-top:7px;font-family:'Cormorant Garamond',serif;font-size:clamp(34px,6vw,52px);font-weight:800;line-height:1;color:#fff;text-shadow:0 0 25px rgba(45,212,191,.24)}
    .ll-ip-sub{text-align:center;margin:10px auto 0;max-width:620px;color:#a8c8cc;font-size:13px;line-height:1.55}
    .ll-ip-versus{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:15px;margin:23px auto 15px;max-width:680px}
    .ll-ip-team{display:flex;align-items:center;gap:9px;min-width:0;font-weight:900}.ll-ip-team.away{justify-content:flex-end;text-align:right}.ll-ip-team .ll-team-logo,.ll-ip-team img{width:38px;height:38px;object-fit:contain}.ll-ip-vs{color:#64748b;font-size:11px;font-weight:900;letter-spacing:.15em}
    .ll-ip-board{max-width:720px;margin:0 auto 16px;padding:12px 14px;border:1px solid rgba(94,234,212,.22);border-radius:15px;background:rgba(2,13,18,.66);box-shadow:inset 0 0 28px rgba(20,184,166,.05)}
    .ll-ip-board-row{display:grid;grid-template-columns:minmax(90px,1.3fr) minmax(155px,3fr) 54px;align-items:center;gap:10px;padding:5px 0}.ll-ip-board-team{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;font-weight:850;color:#cbd5e1}.ll-ip-dots{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:2px}.ll-ip-dot{width:19px;height:19px;flex:0 0 19px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(148,163,184,.28);background:rgba(30,41,59,.55);font-size:11px;font-weight:1000}.ll-ip-dot.goal{background:#10b981;color:#022c22;border-color:#6ee7b7;box-shadow:0 0 13px rgba(16,185,129,.32)}.ll-ip-dot.miss{background:#ef4444;color:#fff;border-color:#fca5a5;box-shadow:0 0 13px rgba(239,68,68,.23)}.ll-ip-board-score{text-align:right;font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:900;color:#fff}
    .ll-ip-question-wrap{max-width:720px;margin:0 auto}.ll-ip-round-label{text-align:center;margin:14px 0 9px;color:#f8fafc;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.ll-ip-round-label.sudden{color:#fbbf24;text-shadow:0 0 14px rgba(245,158,11,.4)}
    .ll-ip-question{cursor:pointer;padding:24px 20px;border:1px solid rgba(94,234,212,.32);border-radius:17px;background:linear-gradient(145deg,rgba(8,30,37,.92),rgba(7,20,28,.92));text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.22),inset 0 0 35px rgba(45,212,191,.035)}.ll-ip-direction{font-size:10px;font-weight:900;letter-spacing:.12em;color:#5eead4}.ll-ip-word{margin-top:10px;font-size:clamp(27px,5vw,39px);font-family:'Cormorant Garamond',serif;font-weight:800;color:#fff}.ll-ip-answer{margin-top:15px;padding-top:14px;border-top:1px solid rgba(148,163,184,.16);font-size:21px;color:#fde68a}.ll-ip-hint{margin-top:17px;color:#64748b;font-size:11px}
    .ll-ip-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.ll-ip-actions .ll-btn{min-height:48px;font-weight:900}.ll-ip-actions .goal{background:linear-gradient(135deg,#059669,#10b981)!important;color:#ecfdf5!important;border-color:#6ee7b7!important}.ll-ip-actions .miss{background:linear-gradient(135deg,#991b1b,#dc2626)!important;color:#fff!important;border-color:#fca5a5!important}
    .ll-ip-intro-card,.ll-ip-final-card{max-width:720px;margin:80px auto 0;text-align:center}.ll-ip-intro-icon{font-size:70px;filter:drop-shadow(0 0 20px rgba(94,234,212,.25));animation:llIpBallPulse 1.8s ease-in-out infinite}.ll-ip-intro-card .ll-btn,.ll-ip-final-card .ll-btn{margin-top:24px;min-width:250px;background:linear-gradient(135deg,#0f766e,#14b8a6)!important;color:#f0fdfa!important}
    .ll-ip-kick-stage{max-width:720px;margin:24px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:13px}.ll-ip-kick-card{position:relative;overflow:hidden;min-height:240px;border:1px solid rgba(148,163,184,.20);border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(6,21,28,.95));display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;opacity:.5;transform:scale(.97)}.ll-ip-kick-card.reveal{animation:llIpKickReveal .45s ease forwards}.ll-ip-kick-card.rival{animation-delay:.72s}.ll-ip-kick-who{position:absolute;top:13px;left:0;right:0;text-align:center;font-size:10px;letter-spacing:.16em;color:#94a3b8;font-weight:900}.ll-ip-goal-frame{position:relative;width:150px;height:86px;margin-top:10px;border:5px solid rgba(226,232,240,.8);border-bottom-width:7px;border-radius:5px 5px 2px 2px;background:repeating-linear-gradient(45deg,rgba(226,232,240,.09) 0 2px,transparent 2px 10px),repeating-linear-gradient(-45deg,rgba(226,232,240,.07) 0 2px,transparent 2px 10px)}.ll-ip-ball{position:absolute;left:50%;bottom:-32px;font-size:30px;transform:translateX(-50%);filter:drop-shadow(0 5px 4px rgba(0,0,0,.4))}.ll-ip-kick-card.reveal .ll-ip-ball.goal{animation:llIpGoalBall .72s cubic-bezier(.3,.7,.2,1) .12s both}.ll-ip-kick-card.reveal .ll-ip-ball.miss-left{animation:llIpMissLeft .72s ease .12s both}.ll-ip-kick-card.reveal .ll-ip-ball.miss-right{animation:llIpMissRight .72s ease .12s both}.ll-ip-kick-card.reveal .ll-ip-ball.saved{animation:llIpSaved .72s ease .12s both}.ll-ip-kick-card.rival .ll-ip-ball{animation-delay:.84s!important}.ll-ip-kick-result{margin-top:45px;font-size:22px;font-weight:1000;letter-spacing:.04em;opacity:0}.ll-ip-kick-card.reveal .ll-ip-kick-result{animation:llIpResult .32s ease .62s forwards}.ll-ip-kick-card.rival .ll-ip-kick-result{animation-delay:1.34s}.ll-ip-kick-result.goal{color:#6ee7b7}.ll-ip-kick-result.miss{color:#fca5a5}.ll-ip-kick-reason{margin-top:3px;font-size:11px;color:#94a3b8;opacity:0}.ll-ip-kick-card.reveal .ll-ip-kick-reason{animation:llIpResult .3s ease .72s forwards}.ll-ip-kick-card.rival .ll-ip-kick-reason{animation-delay:1.44s}
    .ll-ip-round-score{max-width:420px;margin:15px auto 0;text-align:center;padding:9px 12px;border-radius:999px;border:1px solid rgba(94,234,212,.22);background:rgba(2,13,18,.78);font-size:12px;color:#cbd5e1;animation:llIpResult .35s ease 1.55s both}.ll-ip-round-score b{font-size:19px;color:#fff;margin:0 8px}
    .ll-ip-sudden{max-width:620px;margin:110px auto 0;text-align:center}.ll-ip-sudden strong{display:block;font-family:'Cormorant Garamond',serif;font-size:52px;color:#fbbf24;text-shadow:0 0 25px rgba(245,158,11,.4);animation:llIpSudden .75s ease both}.ll-ip-sudden span{display:block;margin-top:8px;color:#fde68a;font-size:13px;letter-spacing:.08em}
    .ll-ip-final-word{font-family:'Cormorant Garamond',serif;font-size:clamp(46px,8vw,70px);font-weight:900}.ll-ip-final-word.win{color:#6ee7b7;text-shadow:0 0 28px rgba(16,185,129,.35)}.ll-ip-final-word.loss{color:#fca5a5;text-shadow:0 0 28px rgba(239,68,68,.25)}.ll-ip-final-score{margin-top:12px;font-size:20px;color:#e2e8f0}.ll-ip-final-score b{font-size:34px;color:#fff}.ll-ip-final-copy{margin:10px auto 0;max-width:560px;color:#94a3b8;line-height:1.55;font-size:12px}
    .ll-ip-demo-box{margin-top:10px;padding:10px 12px;border:1px dashed rgba(45,212,191,.34);border-radius:12px;background:rgba(6,78,76,.11);font-size:11px;color:#99f6e4}.ll-ip-demo-box .ll-btn{width:100%;margin-top:7px}
    @keyframes llIpLights{from{opacity:.55;filter:blur(0)}to{opacity:1;filter:blur(1px)}}@keyframes llIpBallPulse{0%,100%{transform:scale(1) rotate(-5deg)}50%{transform:scale(1.13) rotate(6deg)}}@keyframes llIpKickReveal{to{opacity:1;transform:scale(1);box-shadow:0 18px 42px rgba(0,0,0,.32)}}@keyframes llIpGoalBall{0%{transform:translateX(-50%) translateY(0) scale(1)}60%{transform:translateX(18px) translateY(-78px) scale(.72)}100%{transform:translateX(22px) translateY(-64px) scale(.58)}}@keyframes llIpMissLeft{to{transform:translateX(-112px) translateY(-73px) scale(.65) rotate(-30deg)}}@keyframes llIpMissRight{to{transform:translateX(72px) translateY(-74px) scale(.65) rotate(30deg)}}@keyframes llIpSaved{0%{transform:translateX(-50%) translateY(0)}65%{transform:translateX(-18px) translateY(-55px) scale(.78)}100%{transform:translateX(-8px) translateY(-45px) scale(.72)}}@keyframes llIpResult{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes llIpSudden{0%{opacity:0;transform:scale(.65)}60%{opacity:1;transform:scale(1.08)}100%{transform:scale(1)}}
    @media(max-width:640px){.ll-ip-shell{padding:17px 11px;min-height:640px}.ll-ip-versus{gap:7px}.ll-ip-team{font-size:12px}.ll-ip-team .ll-team-logo,.ll-ip-team img{width:31px;height:31px}.ll-ip-kick-stage{grid-template-columns:1fr 1fr;gap:7px}.ll-ip-kick-card{min-height:205px;padding:11px 7px}.ll-ip-goal-frame{width:115px;height:70px}.ll-ip-actions{grid-template-columns:1fr}.ll-ip-board-row{grid-template-columns:80px minmax(130px,1fr) 42px}.ll-ip-dot{width:17px;height:17px;flex-basis:17px}.ll-ip-intro-card,.ll-ip-final-card{margin-top:62px}}
    @media(prefers-reduced-motion:reduce){.ll-ip-spotlights,.ll-ip-intro-icon,.ll-ip-kick-card,.ll-ip-ball,.ll-ip-kick-result,.ll-ip-kick-reason,.ll-ip-round-score,.ll-ip-sudden strong{animation:none!important;opacity:1!important;transform:none!important}.ll-ip-kick-card{opacity:1}}
  `;document.head.appendChild(style);
}

function dotsHtml(kicks,side){
  const minSlots=5,slots=Math.max(minSlots,kicks.length+(kicks.length>=5?1:0));
  const out=[];for(let i=0;i<slots;i++){const kick=kicks[i];const scored=kick?(side==='player'?kick.playerScored:kick.opponentScored):null;out.push(`<span class="ll-ip-dot ${scored===true?'goal':scored===false?'miss':''}">${scored===true?'✓':scored===false?'×':''}</span>`);}return out.join('');
}
function boardHtml(rt){
  return `<div class="ll-ip-board"><div class="ll-ip-board-row"><div class="ll-ip-board-team">${esc(rt.playerTeam)}</div><div class="ll-ip-dots">${dotsHtml(rt.kicks,'player')}</div><div class="ll-ip-board-score">${rt.playerPens}</div></div><div class="ll-ip-board-row"><div class="ll-ip-board-team">${esc(rt.opponentTeam)}</div><div class="ll-ip-dots">${dotsHtml(rt.kicks,'opponent')}</div><div class="ll-ip-board-score">${rt.opponentPens}</div></div></div>`;
}
function versusHtml(rt){return `<div class="ll-ip-versus"><div class="ll-ip-team">${teamLogo(rt.playerTeam,'table')}<span>${esc(rt.playerTeam)}</span></div><div class="ll-ip-vs">PENALTILAR</div><div class="ll-ip-team away"><span>${esc(rt.opponentTeam)}</span>${teamLogo(rt.opponentTeam,'table')}</div></div>`;}
function shell(inner){return `<div class="ll-shell ll-quiz-card"><div class="ll-ip-shell"><div class="ll-ip-spotlights"></div>${inner}</div></div>`;}
function renderIntro(){
  if(!runtime)return;area().innerHTML=shell(`<div class="ll-ip-kicker">90 DAKİKA YETMEDİ</div><div class="ll-ip-title">Kader Penaltılarda</div>${versusHtml(runtime)}<div class="ll-ip-intro-card"><div class="ll-ip-intro-icon">⚽</div><div class="ll-ip-sub"><b>Her kelime bir penaltı.</b><br>Bildim dersen gol. Bilemedim dersen penaltın kaçar. Rakibin atışı ise sen karar verdikten sonra ortaya çıkar.</div><button class="ll-btn primary" onclick="llPenaltyQuizBegin()">Penaltılara Başla</button>${runtime.demo?'<div class="ll-ip-demo-box">Demo modu · maç/kariyer sonucu değişmez, kelime istatistikleri kaydedilmez.</div>':''}</div>`);
}
function ensureQueue(rt,count=6){
  if(!rt)return false;rt.queue=Array.isArray(rt.queue)?rt.queue:[];const have=rt.queue.length-rt.wordIndex;if(have>=count)return true;
  let picked=[];try{picked=typeof global.llPickQuizWords==='function'?global.llPickQuizWords(Math.max(count-have,6)):[];}catch(_){}
  const used=new Set(rt.queue.map(ref=>ref?.id));for(const ref of picked||[]){if(ref?.id&&!used.has(ref.id)){rt.queue.push(ref);used.add(ref.id);}}
  if(rt.queue.length-rt.wordIndex>=1)return true;
  try{const words=global.loadUserWords?.()||[];for(const word of words){if(word?.id&&!used.has(word.id)){rt.queue.push({id:word.id,askTrToEn:Math.random()<.5});used.add(word.id);}}}catch(_){}
  return rt.queue.length-rt.wordIndex>=1;
}
function wordForCurrent(rt){if(!ensureQueue(rt,1))return null;const ref=rt.queue[rt.wordIndex];let word=null;try{word=(global.loadUserWords?.()||[]).find(item=>item.id===ref.id)||null;}catch(_){}return word?{ref,word}:null;}
function markWordUsed(ref,state){if(!ref||!state)return;const used=new Set(ref.cycleStart?[]:(state.usedWords||[]));used.add(ref.id);state.usedWords=[...used];}
function persistAnswer(rt,correct,ref){
  if(rt.demo||!ref)return;const state=stateNow();if(!state)return;
  const quiz={queue:rt.queue,index:rt.wordIndex,correct:rt.knowledgeCorrect,revealed:true,shown:rt.wordIndex+1,eventType:'penalty-shootout'};
  try{global.llRecordSeasonVocabularyAnswer?.({correct:!!correct,fixture:rt.fixture,quiz,answerIndex:rt.wordIndex,eventType:'penalty-shootout'});}catch(_){}
  try{global.llPersistQuizWordRating?.(ref,quiz,!!correct,{markUsed:false});}catch(_){}
  try{markWordUsed(ref,state);}catch(_){}
  save();
}
function renderQuestion(){
  const rt=runtime;if(!rt)return;const pack=wordForCurrent(rt);if(!pack){abortToAutomatic('Penaltı sınavı için kullanılabilir kelime bulunamadı. Otomatik penaltı sistemine dönülüyor.');return;}
  const {ref,word}=pack,askTrToEn=!!ref.askTrToEn,question=askTrToEn?String(word.tr||'').split(',')[0].trim():word.en,answer=askTrToEn?word.en:word.tr;
  let example='';if(word.example)example=askTrToEn&&typeof global.llMaskAnswerInExample==='function'?global.llMaskAnswerInExample(word.example,word.en):word.example;
  const exampleHtml=example&&typeof global.llExampleSentenceHtml==='function'?global.llExampleSentenceHtml(word,example,`penalty-${rt.round}-${word.id}`):'';
  const spoken=text=>`<div class="pronounce-line"><span>${typeof global.llEnglishWordHtml==='function'?global.llEnglishWordHtml(word,text):esc(text)}</span>${typeof global.llPronounceButton==='function'?global.llPronounceButton(word.en):''}</div>`;
  const qHtml=askTrToEn?esc(question):spoken(question),aHtml=askTrToEn?spoken(answer):esc(answer),fullExample=rt.revealed&&typeof global.llFullExampleSentenceHtml==='function'?global.llFullExampleSentenceHtml(word):'';
  const sudden=rt.round>5;
  area().innerHTML=shell(`<div class="ll-ip-kicker">${sudden?'ANI ÖLÜM':'PENALTI ATIŞLARI'} · ${rt.round}. ATIŞ</div>${versusHtml(rt)}${boardHtml(rt)}<div class="ll-ip-question-wrap"><div class="ll-ip-round-label ${sudden?'sudden':''}">${sudden?'⚠ Bu turda eşitlik bozulursa seri biter':'Her doğru cevap = GOL'}</div><div class="ll-ip-question" onclick="llPenaltyQuizReveal()"><div class="ll-ip-direction">${askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-ip-word">${qHtml}</div>${exampleHtml}${rt.revealed?`<div class="ll-ip-answer">${aHtml}${fullExample}</div>`:'<div class="ll-ip-hint">Cevabı açmak için karta tıkla</div>'}</div><div class="ll-ip-actions" style="${rt.revealed?'':'opacity:.35;pointer-events:none'}"><button class="ll-btn miss" onclick="llPenaltyQuizRate(false)">✕ Bilemedim · Penaltı Kaçar</button><button class="ll-btn goal" onclick="llPenaltyQuizRate(true)">✓ Bildim · GOL</button></div></div>`);
  try{global.markNewWordFrame?.(word,area().querySelector('.ll-ip-question'));}catch(_){}
}
function reveal(){if(!runtime||runtime.phase!=='question'||runtime.revealed)return;runtime.revealed=true;renderQuestion();}
function missVisual(){return ['saved','miss-left','miss-right'][Math.floor(Math.random()*3)];}
function missReason(cls){return cls==='saved'?'Kaleci kurtardı':cls==='miss-left'?'Dışarı gitti':'Direkten/dışarı';}
function opponentForRound(rt,index){return !!rt.opponentPlan[index];}
function renderKickAnimation(kick){
  const rt=runtime;if(!rt)return;const playerClass=kick.playerScored?'goal':kick.playerMissVisual,oppClass=kick.opponentScored?'goal':kick.opponentMissVisual;
  area().innerHTML=shell(`<div class="ll-ip-kicker">${kick.suddenDeath?'ANI ÖLÜM · ':''}${kick.number}. PENALTI</div>${versusHtml(rt)}${boardHtml({...rt,kicks:rt.kicks.slice(0,-1),playerPens:rt.playerPens-(kick.playerScored?1:0),opponentPens:rt.opponentPens-(kick.opponentScored?1:0)})}<div class="ll-ip-kick-stage"><div class="ll-ip-kick-card reveal"><div class="ll-ip-kick-who">SEN · ${esc(rt.playerTeam)}</div><div class="ll-ip-goal-frame"><span class="ll-ip-ball ${playerClass}">⚽</span></div><div class="ll-ip-kick-result ${kick.playerScored?'goal':'miss'}">${kick.playerScored?'GOL!':'KAÇTI!'}</div><div class="ll-ip-kick-reason">${kick.playerScored?'Ağlar sarsıldı':esc(kick.playerMissReason)}</div></div><div class="ll-ip-kick-card reveal rival"><div class="ll-ip-kick-who">RAKİP · ${esc(rt.opponentTeam)}</div><div class="ll-ip-goal-frame"><span class="ll-ip-ball ${oppClass}">⚽</span></div><div class="ll-ip-kick-result ${kick.opponentScored?'goal':'miss'}">${kick.opponentScored?'GOL!':'KAÇTI!'}</div><div class="ll-ip-kick-reason">${kick.opponentScored?'Rakip golü buldu':esc(kick.opponentMissReason)}</div></div></div><div class="ll-ip-round-score">${kick.suddenDeath?'Ani ölüm':'Seri'} · <b>${kick.playerScore} – ${kick.opponentScore}</b></div>`);
}
function isDecided(rt){
  const n=rt.kicks.length,p=rt.playerPens,o=rt.opponentPens;
  if(n<5){const remaining=5-n;return p>o+remaining||o>p+remaining;}
  if(n===5)return p!==o;
  return p!==o;
}
function rate(correct){
  const rt=runtime;if(!rt||rt.phase!=='question'||!rt.revealed||rt.busy)return;const pack=wordForCurrent(rt);if(!pack)return;rt.busy=true;rt.knowledgeCorrect+=correct?1:0;persistAnswer(rt,correct,pack.ref);
  const index=rt.kicks.length,playerScored=!!correct,opponentScored=opponentForRound(rt,index);if(playerScored)rt.playerPens++;if(opponentScored)rt.opponentPens++;
  const kick={number:index+1,playerScored,opponentScored,playerScore:rt.playerPens,opponentScore:rt.opponentPens,suddenDeath:index>=5,playerMissVisual:playerScored?'goal':missVisual(),opponentMissVisual:opponentScored?'goal':missVisual()};kick.playerMissReason=playerScored?'':missReason(kick.playerMissVisual);kick.opponentMissReason=opponentScored?'':missReason(kick.opponentMissVisual);rt.kicks.push(kick);rt.wordIndex++;rt.revealed=false;rt.phase='animation';renderKickAnimation(kick);
  const delay=reduceMotion()?430:2150;setTimeout(()=>{if(runtime!==rt)return;if(isDecided(rt)){finishInteractive();return;}if(rt.kicks.length===5&&rt.playerPens===rt.opponentPens){renderSuddenDeathIntro();return;}if(rt.kicks.length>=5+MAX_SUDDEN_DEATH_ROUNDS){/* Safety valve: keep the decision tied to the user's next answer, but force the opponent to miss that next kick. */rt.opponentPlan[rt.kicks.length]=false;}rt.round=rt.kicks.length+1;rt.phase='question';rt.busy=false;renderQuestion();},delay);
}
function renderSuddenDeathIntro(){
  const rt=runtime;if(!rt)return;rt.phase='sudden-intro';area().innerHTML=shell(`${versusHtml(rt)}${boardHtml(rt)}<div class="ll-ip-sudden"><strong>ANI ÖLÜM</strong><span>Artık her kelime son kelimen olabilir.</span></div>`);setTimeout(()=>{if(runtime!==rt)return;rt.round=rt.kicks.length+1;rt.phase='question';rt.busy=false;renderQuestion();},reduceMotion()?350:1450);
}
function makeShootout(rt){return {player:rt.playerPens,opponent:rt.opponentPens,scoreA:rt.playerPens,scoreB:rt.opponentPens,winner:rt.playerPens>rt.opponentPens?rt.playerTeam:rt.opponentTeam,playerTeam:rt.playerTeam,opponentTeam:rt.opponentTeam,suddenDeath:rt.kicks.some(k=>k.suddenDeath),interactive:true,quizCorrect:rt.knowledgeCorrect,quizAnswered:rt.kicks.length,kicks:deep(rt.kicks)};}
function renderFinal(){
  const rt=runtime;if(!rt)return;const won=rt.playerPens>rt.opponentPens;area().innerHTML=shell(`<div class="ll-ip-kicker">PENALTI ATIŞLARI TAMAMLANDI</div>${versusHtml(rt)}${boardHtml(rt)}<div class="ll-ip-final-card"><div class="ll-ip-final-word ${won?'win':'loss'}">${won?'KAZANDIN!':'ELENDİN'}</div><div class="ll-ip-final-score">Penaltılar <b>${rt.playerPens} – ${rt.opponentPens}</b></div><div class="ll-ip-final-copy">${won?'Son kelimeye kadar kontrol sendeydi. Seri senin lehine bitti.':'Penaltı serisi rakibin lehine sonuçlandı.'}${rt.demo?' Bu yalnızca demoydu; kariyer kaydına işlenmedi.':''}</div><button class="ll-btn primary" onclick="llPenaltyQuizFinishCommit()">${rt.demo?'Dashboarda Dön':'Maç Sonucunu Gör'}</button></div>`);
}
function finishInteractive(){const rt=runtime;if(!rt)return;rt.phase='final';rt.busy=false;rt.shootout=makeShootout(rt);renderFinal();}
function remapShootoutForArgs(rt,first,second){
  const source=rt.shootout||makeShootout(rt),same=first===rt.playerTeam&&second===rt.opponentTeam,reverse=first===rt.opponentTeam&&second===rt.playerTeam;
  if(!same&&!reverse)return null;if(same)return deep(source);
  const kicks=source.kicks.map(k=>({number:k.number,playerScored:k.opponentScored,opponentScored:k.playerScored,playerScore:k.opponentScore,opponentScore:k.playerScore,suddenDeath:!!k.suddenDeath}));
  return {...deep(source),player:source.opponent,opponent:source.player,scoreA:source.opponent,scoreB:source.player,playerTeam:first,opponentTeam:second,kicks};
}
function commitCompleted(){
  const rt=runtime;if(!rt||rt.phase!=='final')return;if(rt.demo){runtime=null;global.llPenaltySequenceActive=false;global.llRenderDashboard?.();return;}
  const base=rt.baseCommit,original=global.llV12PenaltyShootout;if(typeof base!=='function'){runtime=null;global.llPenaltySequenceActive=false;return;}
  rt.phase='committing';
  global.llV12PenaltyShootout=function(state,first,second){const mapped=remapShootoutForArgs(rt,first,second);return mapped||original.apply(this,arguments);};
  try{base();}finally{global.llV12PenaltyShootout=original;runtime=null;global.llPenaltySequenceActive=false;}
}
function begin(){const rt=runtime;if(!rt||!['intro','sudden-intro'].includes(rt.phase))return;rt.phase='question';rt.round=rt.kicks.length+1;rt.busy=false;renderQuestion();}
function buildOpponentPlan(player,opponent){const chance=opponentChance(player,opponent),plan=[];for(let i=0;i<5+MAX_SUDDEN_DEATH_ROUNDS+2;i++)plan.push(Math.random()<chance);return {chance,plan};}
function startInteractive(context){
  if(runtime)return false;const state=stateNow(),player=context.playerTeam||playerTeam(),opponent=context.opponentTeam||opponentTeam(),built=buildOpponentPlan(player,opponent);
  runtime={version:VERSION,demo:!!context.demo,baseCommit:context.baseCommit||null,requirement:context.requirement||null,fixture:context.fixture||fixtureNow(),playerTeam:player,opponentTeam:opponent,opponentChance:built.chance,opponentPlan:built.plan,kicks:[],playerPens:0,opponentPens:0,knowledgeCorrect:0,round:1,phase:'intro',revealed:false,busy:false,queue:[],wordIndex:0};
  if(!ensureQueue(runtime,5)){runtime=null;return false;}global.llPenaltySequenceActive=true;renderIntro();return true;
}
function abortToAutomatic(message){const rt=runtime;if(!rt)return;const base=rt.baseCommit,isDemo=rt.demo;runtime=null;global.llPenaltySequenceActive=false;if(message&&typeof global.alert==='function')global.alert(message);if(isDemo){global.llRenderDashboard?.();return;}base?.();}

function demo(){
  if(runtime)return;const state=stateNow();if(!state)return;try{global.sessionStorage?.setItem(DEMO_SESSION_KEY,'1');}catch(_){}const player=state.playerTeam||playerTeam(),opponent=opponentTeam();if(!startInteractive({demo:true,playerTeam:player,opponentTeam:opponent,fixture:fixtureNow()})){global.alert?.('Penaltı demosu için en az 5 kullanılabilir kelime gerekiyor.');}
}
function injectDemoButton(){
  if(typeof document==='undefined'||runtime)return;let used=false;try{used=global.sessionStorage?.getItem(DEMO_SESSION_KEY)==='1';}catch(_){}if(used)return;const root=area();if(!root||root.querySelector('[data-penalty-quiz-demo]'))return;const next=root.querySelector('.ll-next-match'),card=next?.closest('.ll-card');if(!card)return;const box=document.createElement('div');box.className='ll-ip-demo-box';box.setAttribute('data-penalty-quiz-demo','');box.innerHTML='<b>🥅 Tek Seferlik Penaltı Demo</b><br>Yeni kelime-penaltı sistemini kariyer sonucunu değiştirmeden test et.<button class="ll-btn" type="button" onclick="llPenaltyQuizDemo()">Penaltı Demo\'yu Başlat</button>';card.appendChild(box);
}

injectStyles();
const BASE_COMMIT=global.llCommitCurrentMatch;
if(typeof BASE_COMMIT==='function')global.llCommitCurrentMatch=function(){
  if(runtime)return false;const state=stateNow(),match=global.lexLeague?.match,requirement=shootoutRequirement(match,state);if(!requirement)return BASE_COMMIT.apply(this,arguments);
  const started=startInteractive({demo:false,baseCommit:BASE_COMMIT,requirement,fixture:match.fixture,playerTeam:match.player,opponentTeam:match.opponent});
  if(!started)return BASE_COMMIT.apply(this,arguments);return false;
};
const BASE_DASH=global.llRenderDashboard;
if(typeof BASE_DASH==='function')global.llRenderDashboard=function(){const result=BASE_DASH.apply(this,arguments);setTimeout(injectDemoButton,0);return result;};

global.llPenaltyQuizBegin=begin;
global.llPenaltyQuizReveal=reveal;
global.llPenaltyQuizRate=rate;
global.llPenaltyQuizFinishCommit=commitCompleted;
global.llPenaltyQuizDemo=demo;
global.llInteractivePenaltyTestApi={VERSION,shootoutRequirement,isNationalMatch,nationalStage,opponentChance,isDecided:rt=>isDecided(rt),makeShootout:rt=>makeShootout(rt)};
setTimeout(injectDemoButton,0);
})(globalThis);
