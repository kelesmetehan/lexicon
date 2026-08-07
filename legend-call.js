/* Efsaneni Çağır — season-limited special vocabulary event for historic matches. */
(function(){
'use strict';

const VERSION=1;
const WORD_COUNT=12;
const MAX_SEASON_EVENTS=2;
const OUTCOMES={
  fail:{min:0,max:8,icon:'🌑',title:'Fırsat Kaçtı',quote:'Bu gece ekstra bir kıvılcım doğmadı.',rewardTitle:'Ödül Yok',rewardDesc:'Normal 10 kelimelik maç sınavına devam edebilirsin.',kind:'none',amount:0},
  captain:{min:9,max:9,icon:'🧣',title:'Eski Kaptan Tribüne Geldi',quote:'Yıllar önce bu formayı o giymişti. Şimdi seni izliyor.',rewardTitle:'Zar Üst Sınırı +2',rewardDesc:'Seçtiğin 1 mevki için — sadece bu maça özel',kind:'diceMax',amount:2},
  coach:{min:10,max:10,icon:'🎧',title:'Eski Teknik Direktör Locada',quote:'Bir taktik değişikliği her şeyi çevirebilir...',rewardTitle:'1 Reroll Hakkı',rewardDesc:'Bu maç için — istediğin 1 zarı yeniden atabilirsin',kind:'reroll',amount:1},
  president:{min:11,max:11,icon:'🏛️',title:'Başkan Soyunma Odasına İndi',quote:'Bu gece tarih yazılacak, hepiniz hazırsınız.',rewardTitle:'Zar Üst Sınırı +3',rewardDesc:'Seçtiğin 1 mevki için — sadece bu maça özel',kind:'diceMax',amount:3},
  legend:{min:12,max:12,icon:'⚽',title:'Efsaneni Maça Çağırdın',quote:'Tribünler ayakta... o an sahaya geri döndü.',rewardTitle:'+1 Engellenemez Sanal Gol',rewardDesc:'Bu maça özel — tüm kart etkilerinden sonra doğrudan skora eklenir',kind:'virtualGoal',amount:1}
};

function num(v,f=0){v=Number(v);return Number.isFinite(v)?v:f;}
function clamp(v,min,max){return Math.max(min,Math.min(max,num(v)));}
function positions(){
  try{if(Array.isArray(LL_POSITIONS)&&LL_POSITIONS.length)return LL_POSITIONS;}catch{}
  if(Array.isArray(globalThis.LL_POSITIONS)&&globalThis.LL_POSITIONS.length)return globalThis.LL_POSITIONS;
  return ['Kaleci','Orta Saha','Forvet'];
}
function positionIcon(position){
  try{if(typeof LL_POSITION_ICONS==='object'&&LL_POSITION_ICONS)return LL_POSITION_ICONS[position]||'🎲';}catch{}
  return globalThis.LL_POSITION_ICONS?.[position]||'🎲';
}
function esc(v){return typeof globalThis.llEscape==='function'?llEscape(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stateNow(){return globalThis.lexLeague?.state||null;}
function fixtureNow(){try{return globalThis.lexLeague?.quiz?.fixture||(typeof globalThis.llPlayerFixture==='function'?llPlayerFixture():null);}catch{return null;}}
function hash(text){let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function stableRoll(text){return (hash(text)%10000)/10000;}
function fixtureKey(state,fixture){return [num(state?.season,1),num(state?.week,1),fixture?.competition||'league',fixture?.roundLabel||'',num(fixture?.cupLeg),num(fixture?.euroLeg),fixture?.home||'',fixture?.away||''].join('~');}
function outcomeForCorrect(correct){correct=clamp(correct,0,WORD_COUNT);return correct>=12?OUTCOMES.legend:correct===11?OUTCOMES.president:correct===10?OUTCOMES.coach:correct===9?OUTCOMES.captain:OUTCOMES.fail;}
function seasonTarget(state,season){const seed=`${state?.createdAt||state?.managerProfile?.createdAt||'career'}|${season}|legend-target`;return stableRoll(seed)<.45?2:1;}
function ensureSystem(state){
  if(!state)return null;
  if(!state.legendCall||typeof state.legendCall!=='object'||Array.isArray(state.legendCall))state.legendCall={version:VERSION,seasons:{}};
  state.legendCall.version=VERSION;if(!state.legendCall.seasons||typeof state.legendCall.seasons!=='object')state.legendCall.seasons={};
  const season=String(num(state.season,1));
  if(!state.legendCall.seasons[season]||typeof state.legendCall.seasons[season]!=='object')state.legendCall.seasons[season]={target:seasonTarget(state,season),events:[],checked:{}};
  const rec=state.legendCall.seasons[season];rec.target=clamp(rec.target||seasonTarget(state,season),1,MAX_SEASON_EVENTS);if(!Array.isArray(rec.events))rec.events=[];if(!rec.checked||typeof rec.checked!=='object')rec.checked={};
  if(!Array.isArray(state.careerMemories))state.careerMemories=[];
  return rec;
}
function currentSeasonRecord(state=stateNow()){return ensureSystem(state);}
function eventByKey(state,key){const rec=currentSeasonRecord(state);return rec?.events?.find(event=>event.key===key)||null;}
function currentEvent(state=stateNow(),fixture=fixtureNow()){return state&&fixture?eventByKey(state,fixtureKey(state,fixture)):null;}

function derbyLabel(fixture,state){
  try{const d=typeof globalThis.llHistoricalDerby==='function'?llHistoricalDerby(fixture,state):null;if(d)return d.label||'Tarihî Derbi';}catch{}
  try{const key=fixture?.league||(typeof globalThis.llTeamLeague==='function'?llTeamLeague(state?.playerTeam):'super'),importance=typeof globalThis.llV2MatchImportance==='function'?llV2MatchImportance(fixture,key):'';if(/DERBİ/i.test(String(importance)))return String(importance).replace(/^[^\p{L}\p{N}]+/u,'');}catch{}
  return '';
}
function leagueMathInfo(fixture,state){
  if((fixture?.competition||'league')!=='league')return null;
  const key=fixture.league||(typeof globalThis.llTeamLeague==='function'?llTeamLeague(state.playerTeam):'super');
  if(key!=='super')return null;
  let rows=[];try{rows=typeof globalThis.llSortTable==='function'?llSortTable(key):[];}catch{}
  if(!rows.length)return null;
  const rowIndex=rows.findIndex(row=>row.team===state.playerTeam);if(rowIndex<0)return null;
  const schedule=state?.schedules?.[key]||[];const rounds=Math.max(num(schedule.length,34),1),remainingAfter=Math.max(0,rounds-num(state.week,1));
  if(remainingAfter>5)return null;
  const rank=rowIndex+1,playerPts=num(rows[rowIndex]?.Pts),leaderPts=num(rows[0]?.Pts),titleGap=Math.max(0,leaderPts-playerPts);
  if(rank<=2&&titleGap<=3*(remainingAfter+1))return {label:'Şampiyonluk Matematiği Olan Maç',code:'title-math',weight:.88};
  let relegate=3;try{if(typeof globalThis.llMLLeagueMeta==='function'){const info=typeof globalThis.llMLTeamCompetition==='function'?llMLTeamCompetition(state.playerTeam,state):null;relegate=num(llMLLeagueMeta(info?.country||state.playerCountry||'TUR','tier1')?.relegate,3);}}catch{}
  const dangerFrom=Math.max(1,rows.length-relegate-1);
  if(rank>=dangerFrom)return {label:'Küme Düşme Matematiği Olan Maç',code:'relegation-math',weight:.90};
  return null;
}
function eligibleMatch(fixture,state){
  if(!fixture||!state)return null;
  const comp=fixture.competition||'league',label=String(fixture.roundLabel||'');
  const derby=derbyLabel(fixture,state);if(derby)return {label:derby,code:'derby',weight:.62};
  if(['ucl','uel','uecl'].includes(comp)){
    if(/Final/i.test(label)&&!/Yarı|Semi/i.test(label))return {label:`${label||'Avrupa Finali'} · Efsane Gecesi`,code:'europe-final',weight:1};
    if(/Yarı|Semi/i.test(label))return {label:`${label||'Avrupa Yarı Finali'} · Efsane Gecesi`,code:'europe-sf',weight:.92};
    return null;
  }
  if(comp==='cup'&&/Final/i.test(label))return {label:label||'Yerel Kupa Finali',code:'cup-final',weight:.90};
  if(comp==='playoff'&&/Final/i.test(label))return {label:label||'Yükselme Finali',code:'playoff-final',weight:.92};
  return leagueMathInfo(fixture,state);
}
function canUseWords(){try{return typeof globalThis.loadUserWords!=='function'||loadUserWords().length>=WORD_COUNT;}catch{return true;}}
function maybeCreateEvent(state,fixture){
  const rec=currentSeasonRecord(state);if(!rec||!fixture)return null;
  const key=fixtureKey(state,fixture),existing=eventByKey(state,key);if(existing)return existing;
  if(rec.checked[key]||rec.events.length>=rec.target||rec.events.length>=MAX_SEASON_EVENTS)return null;
  const candidate=eligibleMatch(fixture,state);if(!candidate){rec.checked[key]='ineligible';return null;}
  if(!canUseWords()){rec.checked[key]='insufficient-words';return null;}
  const week=num(state.week,1),boost=rec.events.length===0&&week>=20?.14:0,weight=Math.min(1,candidate.weight+boost),roll=stableRoll(`${state.createdAt||'career'}|${key}|legend-offer`),show=weight>=1||roll<weight;
  rec.checked[key]=show?'offered':'not-selected';if(!show)return null;
  const event={key,season:num(state.season,1),week,team:state.playerTeam,home:fixture.home,away:fixture.away,opponent:fixture.home===state.playerTeam?fixture.away:fixture.home,competition:fixture.competition||'league',roundLabel:fixture.roundLabel||'',reason:candidate.label,reasonCode:candidate.code,status:'offered',createdAt:new Date().toISOString(),reward:null,quiz:null,matchCommitted:false};
  rec.events.push(event);return event;
}

function injectStyles(){
  if(typeof document==='undefined'||document.getElementById('ll-legend-call-styles'))return;
  const style=document.createElement('style');style.id='ll-legend-call-styles';style.textContent=`
.ll-legend-banner{position:relative;margin-top:13px;border-radius:14px;padding:16px;background:linear-gradient(135deg,#1b1030,#2a1650 45%,#401b52);border:1px solid rgba(232,200,112,.42);box-shadow:0 0 0 1px rgba(232,200,112,.05) inset,0 10px 30px rgba(124,58,237,.22);overflow:hidden;animation:llLegendBannerIn .65s cubic-bezier(.2,.9,.25,1.1) both}.ll-legend-banner::after{content:'';position:absolute;inset:-1px;border-radius:14px;padding:1px;background:linear-gradient(120deg,transparent,rgba(232,200,112,.9),transparent);background-size:250% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:llLegendSheen 3.2s linear infinite;pointer-events:none}.ll-legend-tagrow{display:flex;align-items:center;gap:8px;margin-bottom:7px}.ll-legend-badge{font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#1b1030;background:linear-gradient(135deg,#e8c870,#c9a84c);padding:4px 9px;border-radius:999px}.ll-legend-rare{font-size:10px;color:#aaa4b5}.ll-legend-title{font-family:'Cormorant Garamond',serif;font-size:25px;font-weight:600;color:#e8c870;margin-bottom:4px}.ll-legend-title .ll-legend-flame{display:inline-block;margin-right:8px;filter:drop-shadow(0 0 6px rgba(232,200,112,.7));animation:llLegendFlicker 2.4s ease-in-out infinite}.ll-legend-sub{font-size:12px;color:#b8b3c0;line-height:1.5}.ll-legend-sub b{color:#f8fafc}.ll-legend-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}.ll-legend-actions .ll-btn{flex:1;min-width:150px}.ll-legend-accept{background:linear-gradient(135deg,#7c3aed,#c9a84c)!important;color:#160b28!important;border-color:transparent!important}.ll-legend-cine{--legend-glow:rgba(124,58,237,.22);position:relative;overflow:hidden;max-width:720px;margin:0 auto;padding:40px 24px 30px;text-align:center;border:1px solid rgba(201,168,76,.30);border-radius:20px;background:radial-gradient(ellipse at 50% 0,var(--legend-glow),transparent 60%),linear-gradient(180deg,#161b24,#0f1218);box-shadow:0 18px 55px rgba(0,0,0,.45)}.ll-legend-particles{position:absolute;inset:0;pointer-events:none}.ll-legend-particles i{position:absolute;left:50%;top:42%;width:6px;height:6px;border-radius:2px;background:#e8c870;opacity:0;animation:llLegendBurst var(--duration,1.2s) ease-out forwards;animation-delay:var(--delay,.45s)}.ll-legend-score{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a9589;animation:llLegendFade .5s both}.ll-legend-score b{color:#e8c870;font-size:16px}.ll-legend-cine-icon{font-size:54px;margin:15px 0 5px;filter:drop-shadow(0 0 22px rgba(232,200,112,.55));animation:llLegendPop .7s cubic-bezier(.2,1.4,.4,1) .25s both}.ll-legend-cine-title{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;margin-bottom:8px;background:linear-gradient(135deg,#e8c870,#fff6e0,#c9a84c);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:llLegendTitle .7s ease .4s both,llLegendShimmer 2.4s linear 1s infinite}.ll-legend-quote{font-size:13px;color:#aaa4b5;font-style:italic;margin-bottom:18px;animation:llLegendFade .6s .7s both}.ll-legend-reward{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(201,168,76,.25);border-radius:12px;background:rgba(201,168,76,.12);animation:llLegendTitle .6s ease .9s both}.ll-legend-reward span{font-size:22px}.ll-legend-reward div{text-align:left;font-size:12px}.ll-legend-reward b{display:block;color:#e8c870;font-family:'Cormorant Garamond',serif;font-size:17px}.ll-legend-tier-note{margin:16px auto 0;max-width:600px;color:#94a3b8;font-size:11px}.ll-legend-choice{margin-top:19px}.ll-legend-sequence{margin:10px 0;padding:9px 11px;border:1px solid rgba(232,200,112,.38);border-radius:10px;background:rgba(124,58,237,.10);color:#d8d2df;font-size:11px}.ll-legend-match-badge{margin:12px 0;padding:11px 13px;border:1px solid rgba(232,200,112,.52);border-radius:11px;background:linear-gradient(135deg,rgba(124,58,237,.13),rgba(201,168,76,.08));font-size:12px}.ll-legend-memory-card{margin-top:14px}.ll-legend-memory-list{display:grid;gap:8px}.ll-legend-memory{padding:11px;border:1px solid rgba(201,168,76,.26);border-radius:11px;background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(15,23,42,.35))}.ll-legend-memory b,.ll-legend-memory span,.ll-legend-memory small{display:block}.ll-legend-memory span,.ll-legend-memory small{font-size:11px;color:#94a3b8;margin-top:3px}@keyframes llLegendBannerIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}@keyframes llLegendSheen{from{background-position:150% 0}to{background-position:-150% 0}}@keyframes llLegendFlicker{0%,100%{transform:scale(1)}30%{transform:scale(1.08) rotate(-3deg)}60%{transform:scale(.97) rotate(2deg)}}@keyframes llLegendFade{from{opacity:0}to{opacity:1}}@keyframes llLegendPop{from{opacity:0;transform:scale(.4) rotate(-15deg)}to{opacity:1;transform:scale(1)}}@keyframes llLegendTitle{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes llLegendShimmer{from{background-position:0 center}to{background-position:200% center}}@keyframes llLegendBurst{0%{transform:translate(-50%,-50%) scale(.4);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(200deg);opacity:0}}@media(max-width:650px){.ll-legend-actions{flex-direction:column}.ll-legend-cine{padding:30px 14px 24px}.ll-legend-cine-title{font-size:29px}}
  `;document.head.appendChild(style);
}
function bannerHtml(event){
  const quiz=event.quiz||{},done=event.status==='completed',progress=event.status==='accepted'&&quiz.queue?`${num(quiz.index)}/${WORD_COUNT} soru · ${num(quiz.correct)} doğru`:'';
  const reward=event.reward?`${event.reward.label}${event.reward.position?` · ${event.reward.position}`:''}`:'';
  if(event.status==='skipped'||event.matchCommitted)return '';
  const actions=event.status==='offered'
    ?`<button class="ll-btn ll-legend-accept" onclick="llLegendAccept()">Fırsatı Değerlendir · 12 Kelime</button><button class="ll-btn" onclick="llLegendSkip()">Geç</button>`
    :event.status==='accepted'
      ?`<button class="ll-btn ll-legend-accept" onclick="llLegendResume()">Özel Sınava Devam Et</button>`
      :event.status==='reward-pending'
        ?`<button class="ll-btn ll-legend-accept" onclick="llLegendResume()">Ödül Mevkisini Seç</button>`
        :done?`<button class="ll-btn ll-legend-accept" onclick="llLegendContinueNormalQuiz()">Normal 10 Kelimelik Sınava Geç</button>`:'';
  return `<div class="ll-legend-banner" data-legend-call><div class="ll-legend-tagrow"><span class="ll-legend-badge">Sezonluk Özel</span><span class="ll-legend-rare">${esc(event.reason)} · ${progress||reward||'Sadece bu maça özel'}</span></div><div class="ll-legend-title"><span class="ll-legend-flame">🔥</span>Efsaneni Çağır</div><div class="ll-legend-sub"><b>12 özel kelime</b> çöz, ödülünü al; ardından normal <b>10 kelimelik</b> maç sınavına geç. Toplam 22 kelime çözebilirsin.</div><div class="ll-legend-actions">${actions}</div></div>`;
}
function decorateDashboard(){
  const state=stateNow(),fixture=fixtureNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!fixture||!root)return;
  ensureSystem(state);let event=eventByKey(state,fixtureKey(state,fixture));if(!event)event=maybeCreateEvent(state,fixture);if(!event){if(typeof globalThis.llSave==='function')llSave();return;}
  if(root.querySelector('[data-legend-call]'))return;
  const html=bannerHtml(event);if(!html)return;
  const next=root.querySelector('.ll-next-match'),card=next?.closest('.ll-card');if(next)next.insertAdjacentHTML('beforebegin',html);else if(card)card.insertAdjacentHTML('beforeend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend',html);
  if(typeof globalThis.llSave==='function')llSave();
}
function markSpecialWordUsed(ref,state){if(!ref||!state)return;const used=new Set(ref.cycleStart?[]:(state.usedWords||[]));used.add(ref.id);state.usedWords=[...used];}
function recordSpecialWordShown(ref,state,quiz){
  if(!ref||!state||!quiz)return;if(!Array.isArray(quiz.shownWordIds))quiz.shownWordIds=[];if(quiz.shownWordIds.includes(ref.id))return;quiz.shownWordIds.push(ref.id);
  if(!Array.isArray(state.recentQuizWords))state.recentQuizWords=[];state.recentQuizWords.push(ref.id);state.recentQuizWords=state.recentQuizWords.slice(-30);
}
function quizWordHtml(event){
  const q=event.quiz;if(!q||q.index>=q.queue.length){finishSpecialQuiz(event);return;}
  const ref=q.queue[q.index],words=typeof globalThis.loadUserWords==='function'?loadUserWords():[],word=words.find(w=>w.id===ref.id);if(!word){q.index++;save();renderSpecialQuiz(event);return;}
  recordSpecialWordShown(ref,stateNow(),q);
  const question=ref.askTrToEn?String(word.tr||'').split(',')[0].trim():word.en,answer=ref.askTrToEn?word.en:word.tr;
  let example='';if(word.example){if(ref.askTrToEn&&typeof globalThis.llMaskAnswerInExample==='function')example=llMaskAnswerInExample(word.example,word.en);else example=word.example;}
  const exampleHtml=example&&typeof globalThis.llExampleSentenceHtml==='function'?llExampleSentenceHtml(word,example,`legend-${q.index}-${word.id}`):'',questionHtml=ref.askTrToEn?esc(question):`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,question):esc(question)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`,answerHtml=ref.askTrToEn?`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,answer):esc(answer)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`:esc(answer),pct=(q.index/WORD_COUNT)*100;
  llArea().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Efsaneni <em>Çağır</em></div><div class="ll-muted">Özel sınav · ${q.index+1}/${WORD_COUNT} · Her doğru normal maç AP’si kazandırır · ardından 10 kelimelik normal sınav</div></div><div class="ll-stars">Doğru: ${q.correct}/${WORD_COUNT}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-question" onclick="llLegendReveal()"><div><div class="ll-position">${ref.askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${q.revealed?`<div class="ll-answer">${answerHtml}</div>`:'<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${q.revealed?'':'opacity:.35;pointer-events:none'}"><button class="ll-btn danger" onclick="llLegendRate(false)">✗ Bilmiyorum</button><button class="ll-btn primary" onclick="llLegendRate(true)">✓ Bildim</button></div><button class="ll-btn" style="width:100%;margin-top:10px" onclick="llLegendFinishEarly()">Burada Bırak · Şu anki ${q.correct} doğru üzerinden sonucu al</button></div></div>`;
  try{if(typeof globalThis.markNewWordFrame==='function')markNewWordFrame(word,llArea().querySelector('.ll-question'));}catch{}
}
function save(){if(typeof globalThis.llSave==='function')llSave();}
function startSpecialQuiz(event){
  if(!event)return;
  if(event.quiz?.queue?.length===WORD_COUNT){event.status='accepted';save();renderSpecialQuiz(event);return;}
  const queue=typeof globalThis.llPickQuizWords==='function'?llPickQuizWords(WORD_COUNT):[];
  if(queue.length<WORD_COUNT){alert(`Efsaneni Çağır için ${WORD_COUNT} kullanılabilir kelime gerekiyor. Mevcut: ${queue.length}. Fırsat tüketilmedi.`);event.status='offered';return;}
  event.status='accepted';event.acceptedAt=new Date().toISOString();event.quiz={queue,index:0,correct:0,revealed:false,recoveredWords:0,recoveryBonus:0,completed:false,shown:0};save();renderSpecialQuiz(event);
}
function renderSpecialQuiz(event){if(!event)return;if(event.quiz?.completed){renderOutcome(event);return;}quizWordHtml(event);}
function rateSpecial(correct){
  const state=stateNow(),event=currentEvent(state),q=event?.quiz;if(!state||!event||!q||!q.revealed||q.completed)return;
  const ref=q.queue[q.index],words=typeof globalThis.loadUserWords==='function'?loadUserWords():[],card=words.find(w=>w.id===ref.id),quality=correct?5:1;
  if(card&&typeof globalThis.sm2==='function'){
    const recovered=correct&&card.isActiveMistake===true,updated=sm2(card,quality);Object.assign(card,updated);if(typeof globalThis.todayStr==='function')card.lastReviewed=todayStr();card.reviewCount=num(card.reviewCount)+1;
    if(correct)card.isActiveMistake=false;else{card.wrongCount=num(card.wrongCount)+1;card.isActiveMistake=true;}
    if(recovered){const bonus=typeof globalThis.LL_RECOVERY_AP==='number'?LL_RECOVERY_AP:3;q.recoveredWords++;q.recoveryBonus+=bonus;}
    if(typeof globalThis.saveWordsToStorage==='function')saveWordsToStorage(words);
    try{if(typeof globalThis.loadMeta==='function'&&typeof globalThis.saveMeta==='function'){const meta=loadMeta();if(!meta.activity)meta.activity={};const t=typeof globalThis.todayStr==='function'?todayStr():new Date().toISOString().slice(0,10);if(!meta.activity[t])meta.activity[t]={reviews:0,correct:0};meta.activity[t].reviews++;if(correct)meta.activity[t].correct++;saveMeta(meta);}}catch{}
  }
  markSpecialWordUsed(ref,state);if(correct)q.correct++;q.index++;q.shown++;q.revealed=false;save();if(q.index>=q.queue.length)finishSpecialQuiz(event);else renderSpecialQuiz(event);
}
function specialApPerWord(){try{return typeof globalThis.llQuizApPerWord==='function'?num(llQuizApPerWord(),5):5;}catch{return 5;}}
function finishSpecialQuiz(event){
  const state=stateNow(),q=event?.quiz;if(!state||!event||!q||q.completed)return;
  q.completed=true;q.totalAnswered=q.index;const perWord=specialApPerWord(),baseAp=num(q.correct)*perWord,recoveryAp=num(q.recoveryBonus),ap=baseAp+recoveryAp;state.ap=num(state.ap)+ap;q.apPerWord=perWord;q.baseApEarned=baseAp;q.recoveryApEarned=recoveryAp;q.apEarned=ap;
  const outcome=outcomeForCorrect(q.correct);event.reward={type:outcome.kind,amount:outcome.amount,label:outcome.rewardTitle,position:null,applied:false};event.status=outcome.kind==='diceMax'?'reward-pending':'completed';event.completedAt=new Date().toISOString();
  if(state.achievementStats){state.achievementStats.words=num(state.achievementStats.words)+num(q.correct);state.achievementStats.corrections=num(state.achievementStats.corrections)+num(q.recoveredWords);}
  save();renderOutcome(event);
}
function spawnParticles(){
  if(typeof document==='undefined')return;const host=document.querySelector('.ll-legend-particles'),event=currentEvent(),outcome=outcomeForCorrect(event?.quiz?.correct||0);if(!host||outcome===OUTCOMES.fail)return;
  const count=outcome.kind==='virtualGoal'?52:outcome.kind==='diceMax'&&outcome.amount===3?40:30;for(let i=0;i<count;i++){const p=document.createElement('i'),angle=Math.random()*Math.PI*2,dist=70+Math.random()*220;p.style.setProperty('--dx',Math.cos(angle)*dist+'px');p.style.setProperty('--dy',Math.sin(angle)*dist+'px');p.style.setProperty('--duration',(.8+Math.random()*1.1)+'s');p.style.setProperty('--delay',(.45+Math.random()*.4)+'s');host.appendChild(p);}
}
function renderOutcome(event){
  const q=event.quiz,outcome=outcomeForCorrect(q.correct),needsChoice=outcome.kind==='diceMax'&&!event.reward?.position,glow=outcome.kind==='virtualGoal'?'rgba(232,200,112,.45)':outcome.kind==='reroll'?'rgba(76,175,125,.30)':'rgba(124,58,237,.30)',continueHtml=needsChoice?`<div class="ll-legend-choice"><div class="ll-card-title">Ödülü Uygulayacağın Mevkiyi Seç</div><div class="ll-squad">${positions().map(pos=>`<button class="ll-team-option" onclick="llLegendChooseDiceBoost('${esc(pos)}')"><div class="ll-team-name">${positionIcon(pos)} ${esc(pos)}</div><div class="ll-range">Üst sınır +${outcome.amount} · sadece bu maç</div></button>`).join('')}</div></div>`:`<div class="ll-legend-choice"><button class="ll-btn ll-legend-accept" onclick="llLegendContinueNormalQuiz()">Normal 10 Kelimelik Sınava Geç</button></div>`;
  llArea().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-legend-cine" style="--legend-glow:${glow}"><div class="ll-legend-particles"></div><div class="ll-legend-score">SONUÇ &nbsp;<b>${q.correct} / ${WORD_COUNT}</b>&nbsp; DOĞRU</div><div class="ll-legend-cine-icon">${outcome.icon}</div><div class="ll-legend-cine-title">${esc(outcome.title)}</div><div class="ll-legend-quote">“${esc(outcome.quote)}”</div><div class="ll-legend-reward"><span>${outcome.kind==='reroll'?'🔁':outcome.kind==='virtualGoal'?'🎖️':outcome.kind==='diceMax'?'📈':'📚'}</span><div><b>${esc(outcome.rewardTitle)}</b>${esc(outcome.rewardDesc)}</div></div><div class="ll-legend-tier-note">+${q.apEarned} AP işlendi${q.recoveryApEarned?` · bunun +${q.recoveryApEarned} AP’si hata geri kazanımı`:''}. Bu özel sınavdan sonra normal 10 kelimelik maç sınavı ayrıca oynanacak.</div>${continueHtml}</div></div>`;
  setTimeout(spawnParticles,20);
}
function chooseDiceBoost(position){
  const state=stateNow(),event=currentEvent(state);if(!event||event.reward?.type!=='diceMax'||!positions().includes(position))return;
  event.reward.position=position;event.status='completed';save();continueNormalQuiz();
}
function continueNormalQuiz(){
  const state=stateNow(),fixture=fixtureNow(),event=currentEvent(state,fixture);if(!state||!fixture||!event||event.status!=='completed')return;
  event.normalQuizStartedAt=new Date().toISOString();save();
  if(typeof globalThis.llStartMatchPreparation==='function')llStartMatchPreparation();
}
function skipEvent(){const event=currentEvent();if(!event||event.status!=='offered')return;if(!confirm('Bu maçtaki Efsaneni Çağır fırsatını geçmek istiyor musun? Bu sezonluk fırsatlardan biri yanmış sayılacak.'))return;event.status='skipped';event.skippedAt=new Date().toISOString();save();if(typeof globalThis.llRenderDashboard==='function')llRenderDashboard();}
function finishEarly(){const event=currentEvent(),q=event?.quiz;if(!q||q.completed)return;if(!confirm(`${q.index} soru gördün ve ${q.correct} doğru yaptın. Sınavı şimdi bitirip bu doğru sayısına göre ödülü almak istiyor musun?`))return;finishSpecialQuiz(event);}

function eventForMatch(match){const state=stateNow(),fixture=match?.fixture;if(!state||!fixture)return null;const event=eventByKey(state,fixtureKey(state,fixture));return event?.status==='completed'?event:null;}
function attachRewardToMatch(match){
  const event=eventForMatch(match);if(!event||!match||event.matchCommitted)return;
  const previous=match.legendCall?.key===event.key?match.legendCall:null;
  match.legendCall={...(previous||{}),key:event.key,correct:num(event.quiz?.correct),reward:{...event.reward},reason:event.reason};
  if(event.reward?.type==='reroll'&&!match.legendCall.rerollAttached){match.baseRerolls=num(match.baseRerolls)+1;match.rerolls=num(match.rerolls)+1;match.legendCall.rerollAttached=true;}
}
function decorateMatch(){
  const match=globalThis.lexLeague?.match,root=typeof globalThis.llArea==='function'?llArea():null;if(!match?.legendCall||!root||root.querySelector('[data-legend-match]'))return;
  const r=match.legendCall.reward||{},team=typeof globalThis.llTeamState==='function'?llTeamState(match.player):null,baseRange=typeof globalThis.llRange==='function'&&team?llRange(team.stars):null;
  const detail=r.type==='diceMax'?`${r.position} zar üst sınırı +${r.amount}${baseRange?` · ${baseRange[0]}–${baseRange[1]} → ${baseRange[0]}–${baseRange[1]+num(r.amount)}`:''}`:r.type==='reroll'?'1 ek reroll hakkı':r.type==='virtualGoal'?'+1 engellenemez sanal gol · tüm kartlardan sonra skora eklenir':'Özel ödül yok';
  const html=`<div class="ll-legend-match-badge" data-legend-match><b>🔥 Efsaneni Çağır · ${num(match.legendCall.correct)}/${WORD_COUNT}</b><br>${esc(detail)}</div>`;const notice=root.querySelector('.ll-notice');if(notice)notice.insertAdjacentHTML('afterend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('afterbegin',html);
}
function applyVirtualGoal(result,aName,bName){
  const match=globalThis.lexLeague?.match,event=match?.legendCall;if(!result||!event||event.reward?.type!=='virtualGoal'||result.__legendGoalApplied)return result;
  let side=null;if(aName===match.player)side='a';else if(bName===match.player)side='b';if(!side)return result;
  if(side==='a')result.scoreA=num(result.scoreA)+1;else result.scoreB=num(result.scoreB)+1;
  if(!Array.isArray(result.events))result.events=[];if(!Array.isArray(result.eventScores))result.eventScores=[];
  result.events.push(`${match.player}: Efsaneni Çağır → tüm kart etkilerinden sonra engellenemez +1 sanal gol doğrudan skora eklendi.`);result.eventScores.push({scoreA:num(result.scoreA),scoreB:num(result.scoreB)});result.__legendGoalApplied=true;return result;
}
function addCareerMemory(state,match,event){
  if(!state||!match||!event||event.reward?.type!=='virtualGoal'||num(event.quiz?.correct)!==WORD_COUNT)return null;
  const result=match.resolution;if(!result)return null;let won=num(result.scoreA)>num(result.scoreB);
  const official=[...(state.results||[])].reverse().find(r=>r?.userMatch&&num(r.season)===num(event.season)&&r.home===event.home&&r.away===event.away&&(r.roundLabel||'')===(event.roundLabel||''));if(official?.knockoutWinner)won=official.knockoutWinner===match.player;
  if(!won)return null;
  const memoryKey=`legend-memory|${event.key}`;if(state.careerMemories.some(item=>item.key===memoryKey))return state.careerMemories.find(item=>item.key===memoryKey);
  const score=`${num(result.scoreA)}-${num(result.scoreB)}`,memory={key:memoryKey,season:event.season,week:event.week,team:match.player,opponent:match.opponent,competition:event.competition,roundLabel:event.roundLabel,reason:event.reason,score,correct:WORD_COUNT,title:'Efsaneni Çağır · Kusursuz Gece',at:new Date().toISOString()};state.careerMemories.push(memory);
  let profile=null;try{profile=typeof globalThis.llManagerProfile==='function'?llManagerProfile(state):state.managerProfile;}catch{profile=state.managerProfile;}if(!profile||typeof profile!=='object'){state.managerProfile={reputation:50};profile=state.managerProfile;}
  if(!Array.isArray(profile.reputationEvents))profile.reputationEvents=[];const repKey=`legend-reputation|${event.key}`;
  if(!profile.reputationEvents.some(item=>item.key===repKey)){
    const before=clamp(profile.reputation||50,0,100),after=clamp(before+1,0,100),delta=after-before;profile.reputation=after;if(!profile.legendCallReputationBySeason||typeof profile.legendCallReputationBySeason!=='object')profile.legendCallReputationBySeason={};profile.legendCallReputationBySeason[String(event.season)]=num(profile.legendCallReputationBySeason[String(event.season)])+Math.max(0,delta);profile.reputationEvents.push({key:repKey,season:event.season,before,delta,after,label:'Efsaneni Çağır · 12/12 ve maç galibiyeti',team:match.player,at:new Date().toISOString()});memory.reputationDelta=delta;memory.reputationBefore=before;memory.reputationAfter=after;
  }
  return memory;
}
function injectMemoryNotice(memory){if(!memory||typeof document==='undefined')return;const root=typeof globalThis.llArea==='function'?llArea():null,panel=root?.querySelector('.ll-panel');if(!panel||panel.querySelector('[data-legend-memory-notice]'))return;const html=`<div class="ll-notice" data-legend-memory-notice style="margin-top:13px;border-color:rgba(232,200,112,.55)"><b>🏅 Kariyer Anısı kaydedildi:</b> ${esc(memory.team)} ${esc(memory.score)} ${esc(memory.opponent)} · 12/12 Efsaneni Çağır${num(memory.reputationDelta)>0?` · Menajer itibarı +${num(memory.reputationDelta)}`:' · İtibar zaten maksimum seviyede'}.</div>`;const actions=panel.querySelector('div[style*="justify-content:center"]');if(actions)actions.insertAdjacentHTML('beforebegin',html);else panel.insertAdjacentHTML('beforeend',html);}
function memoriesHtml(state){const memories=[...(state?.careerMemories||[])].sort((a,b)=>num(b.season)-num(a.season)||num(b.week)-num(a.week)).slice(0,12);if(!memories.length)return '';return `<div class="ll-card ll-legend-memory-card" data-legend-memories><div class="ll-card-title">🔥 Kariyer Anıları · Efsaneni Çağır</div><div class="ll-legend-memory-list">${memories.map(m=>`<div class="ll-legend-memory"><b>S${num(m.season)} · ${esc(m.team)} ${esc(m.score)} ${esc(m.opponent)}</b><span>${esc(m.roundLabel||m.reason||m.competition)} · 12/12</span><small>${num(m.reputationDelta)>0?`+${num(m.reputationDelta)} kalıcı menajer itibarı`:'Kusursuz özel sınav ve maç galibiyeti'}</small></div>`).join('')}</div></div>`;}
function decorateProfile(tab){const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root||root.querySelector('[data-legend-memories]')||!['overview','trophies',undefined].includes(tab))return;const html=memoriesHtml(state);if(html)root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend',html);}
function decorateNormalQuiz(){const state=stateNow(),q=globalThis.lexLeague?.quiz,root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!q?.legendCallKey||!root||root.querySelector('[data-legend-sequence]'))return;const panel=root.querySelector('.ll-panel');if(panel)panel.insertAdjacentHTML('afterbegin','<div class="ll-legend-sequence" data-legend-sequence><b>🔥 Efsaneni Çağır tamamlandı.</b> Şimdi normal 10 kelimelik maç sınavındasın. Özel maç ödülün zar düellosunda otomatik uygulanacak.</div>');}

function wrap(name,builder,flag='__legendCall'){
  const base=globalThis[name];if(typeof base!=='function'||base[flag])return false;const wrapped=builder(base);wrapped[flag]=true;wrapped[`${flag}Base`]=base;globalThis[name]=wrapped;return true;
}
function install(){
  injectStyles();
  wrap('llV2RepairState',base=>function(state){const result=base.apply(this,arguments);if(result)ensureSystem(result);return result;});
  wrap('llRenderDashboard',base=>function(){const result=base.apply(this,arguments);decorateDashboard();return result;});
  wrap('llStartMatchPreparation',base=>function(){
    const state=stateNow(),fixture=fixtureNow(),event=currentEvent(state,fixture);
    if(event?.status==='offered'){document.querySelector('[data-legend-call]')?.scrollIntoView?.({behavior:'smooth',block:'center'});return;}
    if(event?.status==='accepted'&&!event.quiz?.completed){renderSpecialQuiz(event);return;}
    const result=base.apply(this,arguments);if(globalThis.lexLeague?.quiz&&event?.status==='completed'){lexLeague.quiz.legendCallKey=event.key;lexLeague.quiz.pressConferenceResolved=true;lexLeague.quiz.pressConferenceOffered=true;if(typeof globalThis.llRenderLeagueQuiz==='function')llRenderLeagueQuiz();}return result;
  });
  wrap('llRenderLeagueQuiz',base=>function(){const result=base.apply(this,arguments);decorateNormalQuiz();return result;});
  wrap('llBeginMatch',base=>function(){const result=base.apply(this,arguments);if(globalThis.lexLeague?.match){attachRewardToMatch(lexLeague.match);if(typeof globalThis.llRenderMatch==='function')llRenderMatch();}return result;});
  wrap('llRollValue',base=>function(teamName,position){
    const match=globalThis.lexLeague?.match,reward=match?.legendCall?.reward,boost=match&&teamName===match.player&&reward?.type==='diceMax'&&reward.position===position?num(reward.amount):0;if(!boost||typeof globalThis.llRandomInt!=='function')return base.apply(this,arguments);
    const randomBase=globalThis.llRandomInt;let extended=false;globalThis.llRandomInt=function(min,max){if(!extended){extended=true;return randomBase(min,num(max)+boost);}return randomBase(min,max);};try{return base.apply(this,arguments);}finally{globalThis.llRandomInt=randomBase;}
  });
  wrap('llResolveBattle',base=>function(aName,bName){return applyVirtualGoal(base.apply(this,arguments),aName,bName);});
  wrap('llRenderMatch',base=>function(){const result=base.apply(this,arguments);decorateMatch();return result;});
  wrap('llCommitCurrentMatch',base=>function(){const state=stateNow(),match=globalThis.lexLeague?.match,event=eventForMatch(match),already=event?.matchCommitted;const result=base.apply(this,arguments);if(state&&match&&event&&!already&&match.committed){event.matchCommitted=true;event.matchCommittedAt=new Date().toISOString();const memory=addCareerMemory(state,match,event);save();injectMemoryNotice(memory);}return result;});
  wrap('llRenderManagerProfile',base=>function(tab){const result=base.apply(this,arguments);decorateProfile(tab);return result;});
  const state=stateNow();if(state)ensureSystem(state);
}

globalThis.llLegendAccept=function(){const state=stateNow(),fixture=fixtureNow();let event=currentEvent(state,fixture);if(!event)event=maybeCreateEvent(state,fixture);if(event?.status==='offered')startSpecialQuiz(event);};
globalThis.llLegendSkip=skipEvent;
globalThis.llLegendResume=function(){const event=currentEvent();if(event)renderSpecialQuiz(event);};
globalThis.llLegendReveal=function(){const event=currentEvent(),q=event?.quiz;if(!q||q.completed)return;q.revealed=true;save();renderSpecialQuiz(event);};
globalThis.llLegendRate=rateSpecial;
globalThis.llLegendFinishEarly=finishEarly;
globalThis.llLegendChooseDiceBoost=chooseDiceBoost;
globalThis.llLegendContinueNormalQuiz=continueNormalQuiz;
globalThis.llLegendCallTestApi={VERSION,WORD_COUNT,MAX_SEASON_EVENTS,fixtureKey,outcomeForCorrect,ensureSystem,eligibleMatch,maybeCreateEvent,applyVirtualGoal,attachRewardToMatch,addCareerMemory,stableRoll,positions,finishSpecialQuiz,startSpecialQuiz};

install();
})();
