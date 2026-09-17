/* Zarı Kilitle — optional 6-word pre-match risk event. */
(function () {
  'use strict';

  const VERSION = 1;
  const WORD_COUNT = 6;
  const OFFERS_PER_SEASON = 4;
  const EXCLUDED_WEEKS = new Set([1, 10, 24, 34]);
  const DEMO_FLAG = 'diceLockRiskDemoUsed';

  function num(value, fallback = 0) { value = Number(value); return Number.isFinite(value) ? value : fallback; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, num(value))); }
  function stateNow() { return globalThis.lexLeague?.state || null; }
  function fixtureNow() {
    try { return globalThis.lexLeague?.quiz?.fixture || (typeof globalThis.llPlayerFixture === 'function' ? llPlayerFixture() : null); } catch { return null; }
  }
  function positions() {
    try { if (Array.isArray(LL_POSITIONS) && LL_POSITIONS.length) return LL_POSITIONS; } catch {}
    return Array.isArray(globalThis.LL_POSITIONS) && globalThis.LL_POSITIONS.length ? globalThis.LL_POSITIONS : ['Kaleci', 'Orta Saha', 'Forvet'];
  }
  function icon(position) {
    try { return LL_POSITION_ICONS?.[position] || '🎲'; } catch { return globalThis.LL_POSITION_ICONS?.[position] || '🎲'; }
  }
  function esc(value) {
    return typeof globalThis.llEscape === 'function'
      ? llEscape(String(value ?? ''))
      : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function save() { try { globalThis.llSave?.(); } catch {} }
  function area() { return typeof globalThis.llArea === 'function' ? llArea() : document.getElementById('app'); }
  function fixtureKey(state, fixture) {
    return [num(state?.season, 1), num(state?.week, 1), fixture?.competition || 'league', fixture?.roundLabel || '', num(fixture?.cupLeg), num(fixture?.euroLeg), fixture?.home || '', fixture?.away || ''].join('~');
  }
  function dieValue(correct) { return clamp(correct, 1, 6); }

  function buildSchedule() {
    const pool = [];
    for (let week = 2; week <= 33; week++) if (!EXCLUDED_WEEKS.has(week)) pool.push(week);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, OFFERS_PER_SEASON).sort((a, b) => a - b);
  }
  function ensureSystem(state) {
    if (!state) return null;
    if (!state.diceLockRisk || typeof state.diceLockRisk !== 'object' || Array.isArray(state.diceLockRisk)) state.diceLockRisk = { version: VERSION, seasons: {} };
    state.diceLockRisk.version = VERSION;
    if (!state.diceLockRisk.seasons || typeof state.diceLockRisk.seasons !== 'object') state.diceLockRisk.seasons = {};
    const season = String(num(state.season, 1));
    if (!state.diceLockRisk.seasons[season] || typeof state.diceLockRisk.seasons[season] !== 'object') {
      state.diceLockRisk.seasons[season] = { schedule: buildSchedule(), events: [], checked: {} };
    }
    const record = state.diceLockRisk.seasons[season];
    if (!Array.isArray(record.schedule) || !record.schedule.length) record.schedule = buildSchedule();
    if (!Array.isArray(record.events)) record.events = [];
    if (!record.checked || typeof record.checked !== 'object') record.checked = {};
    return record;
  }
  function seasonRecord(state = stateNow()) { return ensureSystem(state); }
  function eventByKey(state, key) { return seasonRecord(state)?.events?.find(event => event.key === key) || null; }
  function currentEvent(state = stateNow(), fixture = fixtureNow()) { return state && fixture ? eventByKey(state, fixtureKey(state, fixture)) : null; }

  function conflictingSpecialEvent(state, fixture) {
    const key = fixtureKey(state, fixture), season = String(num(state?.season, 1));
    const hell = state?.welcomeToHell?.seasons?.[season]?.events;
    if (Array.isArray(hell) && hell.some(e => e?.key === key && !['skipped', 'cancelled', 'expired'].includes(e.status))) return true;
    const legend = state?.legendCall?.seasons?.[season]?.events;
    if (Array.isArray(legend) && legend.some(e => e?.key === key && !['skipped', 'cancelled', 'expired'].includes(e.status))) return true;
    return false;
  }
  function canUseWords() {
    try { return typeof globalThis.loadUserWords !== 'function' || loadUserWords().length >= WORD_COUNT; } catch { return true; }
  }
  function isEligible(state, fixture) {
    if (!state || !fixture || fixture.competition !== 'league') return false;
    if (!seasonRecord(state)?.schedule?.includes(num(state.week))) return false;
    try { if (typeof globalThis.llIsTalentHuntWeek === 'function' && llIsTalentHuntWeek(state)) return false; } catch {}
    if (conflictingSpecialEvent(state, fixture)) return false;
    return canUseWords();
  }
  function maybeCreateEvent(state, fixture) {
    const record = seasonRecord(state);
    if (!record || !fixture) return null;
    const key = fixtureKey(state, fixture);
    const existing = eventByKey(state, key);
    if (existing) return existing;
    if (record.checked[key] || !isEligible(state, fixture)) return null;
    record.checked[key] = true;
    const event = {
      key, season: num(state.season, 1), week: num(state.week, 1), competition: fixture.competition || 'league',
      home: fixture.home, away: fixture.away, team: state.playerTeam, status: 'offered', position: null,
      quiz: null, lockedValue: null, appliedToMatch: false, matchCommitted: false, demo: false, createdAt: new Date().toISOString()
    };
    record.events.push(event);
    return event;
  }

  function injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('ll-dice-lock-risk-styles')) return;
    const style = document.createElement('style');
    style.id = 'll-dice-lock-risk-styles';
    style.textContent = `
      .ll-risk-banner{position:relative;overflow:hidden;margin-top:13px;padding:17px;border:1px solid rgba(245,158,11,.58);border-radius:15px;background:radial-gradient(circle at 88% 12%,rgba(245,158,11,.20),transparent 32%),linear-gradient(135deg,#21170b,#2d1b0b 56%,#111014);box-shadow:0 14px 34px rgba(100,55,5,.24),inset 0 0 26px rgba(251,191,36,.06);animation:llRiskIn .5s cubic-bezier(.18,.92,.28,1.1) both}.ll-risk-banner:before{content:'';position:absolute;inset:-80% -30%;background:linear-gradient(110deg,transparent 42%,rgba(255,238,178,.16) 50%,transparent 58%);transform:translateX(-80%);animation:llRiskSheen 3.6s linear infinite}.ll-risk-banner>*{position:relative;z-index:1}.ll-risk-kicker{font-size:9px;font-weight:950;letter-spacing:.12em;color:#fcd34d;text-transform:uppercase}.ll-risk-title{margin-top:4px;font-family:'Cormorant Garamond',serif;font-size:31px;font-weight:800;color:#fff1c2}.ll-risk-slogan{margin-top:4px;font-size:16px;font-weight:950;color:#fff;text-transform:uppercase;letter-spacing:.025em}.ll-risk-copy{max-width:720px;margin-top:7px;color:#d6c3a1;font-size:12px;line-height:1.55}.ll-risk-pos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.ll-risk-pos{padding:11px 9px;border:1px solid rgba(251,191,36,.28);border-radius:12px;background:rgba(36,24,9,.7);color:#ffefbd;font-weight:900;cursor:pointer;transition:.18s ease}.ll-risk-pos:hover{transform:translateY(-2px);border-color:rgba(251,191,36,.7);box-shadow:0 8px 22px rgba(120,72,8,.18)}.ll-risk-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.ll-risk-actions .ll-btn{flex:1}.ll-risk-accept{background:linear-gradient(135deg,#b45309,#f59e0b)!important;color:#fff!important;border-color:rgba(254,243,199,.4)!important}.ll-risk-demo{margin-top:10px;padding:9px 11px;border:1px dashed rgba(56,189,248,.35);border-radius:11px;background:rgba(8,47,73,.25);color:#bae6fd;font-size:11px}.ll-risk-demo .ll-btn{margin-top:7px;width:100%}.ll-risk-die-stage{display:flex;align-items:center;justify-content:center;min-height:150px;margin:10px 0 15px}.ll-risk-die{--risk-scale:1;display:flex;align-items:center;justify-content:center;width:88px;height:88px;border-radius:19px;border:2px solid rgba(253,230,138,.82);background:linear-gradient(145deg,#fbbf24,#b45309);color:#1c1205;font-size:48px;font-weight:1000;box-shadow:0 18px 42px rgba(180,83,9,.28),inset 0 0 18px rgba(255,255,255,.2);transform:scale(var(--risk-scale));transition:transform .42s cubic-bezier(.18,.95,.25,1.2),filter .25s ease}.ll-risk-die.pulse{animation:llRiskDiePulse .58s cubic-bezier(.18,.95,.25,1.3)}.ll-risk-die-caption{margin-top:13px;text-align:center;color:#fcd34d;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ll-risk-final{position:relative;max-width:720px;margin:0 auto;padding:33px 22px;text-align:center;border:1px solid rgba(245,158,11,.48);border-radius:20px;background:radial-gradient(circle at 50% 8%,rgba(245,158,11,.18),transparent 45%),linear-gradient(180deg,#23170b,#101014);box-shadow:0 25px 65px rgba(0,0,0,.48)}.ll-risk-final .ll-risk-die{margin:22px auto}.ll-risk-match-badge{margin-top:11px;padding:10px 12px;border:1px solid rgba(245,158,11,.36);border-radius:11px;background:rgba(69,39,5,.28);color:#fde68a;font-size:11px;line-height:1.45}.ll-risk-locked .ll-die{box-shadow:0 0 0 2px rgba(245,158,11,.35),0 15px 30px rgba(180,83,9,.18)!important}.ll-risk-locked .ll-die-info:after{content:'KİLİTLİ';display:inline-block;margin-top:4px;padding:2px 6px;border-radius:999px;background:rgba(180,83,9,.24);color:#fcd34d;font-size:8px;font-weight:950;letter-spacing:.08em}.ll-risk-last-word{margin:0 auto 10px;max-width:500px;padding:8px 10px;border:1px solid rgba(245,158,11,.32);border-radius:10px;background:rgba(120,53,15,.18);color:#fde68a;font-size:11px;font-weight:800}
      @keyframes llRiskIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}@keyframes llRiskSheen{to{transform:translateX(85%)}}@keyframes llRiskDiePulse{0%{transform:scale(var(--risk-scale)) rotate(0)}40%{transform:scale(calc(var(--risk-scale) + .22)) rotate(-5deg);filter:brightness(1.35)}72%{transform:scale(calc(var(--risk-scale) + .08)) rotate(3deg)}100%{transform:scale(var(--risk-scale)) rotate(0)}}
      @media(max-width:650px){.ll-risk-pos-grid{grid-template-columns:1fr}.ll-risk-title{font-size:27px}.ll-risk-slogan{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function bannerHtml(event, state) {
    if (!event || !['offered', 'position'].includes(event.status)) return '';
    const positionButtons = positions().map(position => `<button class="ll-risk-pos" onclick="llDiceLockChoosePosition('${esc(position)}')">${icon(position)} ${esc(position)}<br><span style="font-size:9px;opacity:.72">BU ZARI RİSKE AT</span></button>`).join('');
    return `<div class="ll-risk-banner" data-dice-lock-risk><div class="ll-risk-kicker">⚠ MAÇ ÖNCESİ RİSK</div><div class="ll-risk-title">🎲 Zarı Kilitle</div><div class="ll-risk-slogan">Taraftar arkanda. Riski al.</div><div class="ll-risk-copy"><strong>Bir mevki seç.</strong> 6 kelimeyi çöz. Doğru sayın, seçtiğin mevkinin bu maçtaki <strong>doğrudan zar değeri</strong> olur. Bu zar daha sonra reroll edilemez ve +1 bonusundan etkilenmez.</div><div class="ll-risk-pos-grid">${positionButtons}</div><div class="ll-risk-actions"><button class="ll-btn" onclick="llDiceLockSkip()">Güvenli Oyna · Geç</button></div></div>`;
  }

  function demoHtml(state) {
    if (!state || state[DEMO_FLAG]) return '';
    return `<div class="ll-risk-demo" data-dice-lock-demo><b>🧪 Tek Seferlik Demo</b><br>Zarı Kilitle'yi mevcut maçta bir kez test et. Sezonluk 4 teklif hakkından düşmez.<button class="ll-btn" onclick="llDiceLockStartDemo()">Zarı Kilitle Demo'yu Başlat</button></div>`;
  }

  function decorateDashboard() {
    const state = stateNow(), fixture = fixtureNow(), root = area();
    if (!state || !fixture || !root) return;
    ensureSystem(state);
    let event = currentEvent(state, fixture);
    if (!event) event = maybeCreateEvent(state, fixture);
    if (event && !root.querySelector('[data-dice-lock-risk]')) {
      const html = bannerHtml(event, state);
      if (html) {
        const next = root.querySelector('.ll-next-match'), card = next?.closest('.ll-card');
        if (next) next.insertAdjacentHTML('beforebegin', html); else if (card) card.insertAdjacentHTML('beforeend', html); else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend', html);
      }
    }
    if (!state[DEMO_FLAG] && !root.querySelector('[data-dice-lock-demo]')) {
      const next = root.querySelector('.ll-next-match'), card = next?.closest('.ll-card');
      if (card) card.insertAdjacentHTML('beforeend', demoHtml(state)); else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend', demoHtml(state));
    }
    save();
  }

  function startDemo() {
    const state = stateNow(), fixture = fixtureNow();
    if (!state || !fixture || state[DEMO_FLAG]) return;
    const record = seasonRecord(state), key = fixtureKey(state, fixture);
    let event = eventByKey(state, key);
    if (event && !event.demo && !['skipped', 'cancelled'].includes(event.status)) {
      document.querySelector('[data-dice-lock-risk]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!event) {
      event = { key, season:num(state.season,1), week:num(state.week,1), competition:fixture.competition||'league', home:fixture.home, away:fixture.away, team:state.playerTeam, status:'offered', position:null, quiz:null, lockedValue:null, appliedToMatch:false, matchCommitted:false, demo:true, createdAt:new Date().toISOString() };
      record.events.push(event);
    } else {
      event.position=null; event.quiz=null; event.lockedValue=null; event.appliedToMatch=false; event.matchCommitted=false;
    }
    event.demo = true; event.status = 'offered';
    state[DEMO_FLAG] = true; save();
    if (typeof globalThis.llRenderDashboard === 'function') llRenderDashboard();
    setTimeout(() => document.querySelector('[data-dice-lock-risk]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 30);
  }

  function choosePosition(position) {
    const event = currentEvent();
    if (!event || !['offered', 'position'].includes(event.status) || !positions().includes(position)) return;
    event.position = position; event.status = 'position'; save(); startQuiz(event);
  }

  function markWordUsed(ref, state) {
    if (!ref || !state) return;
    const used = new Set(ref.cycleStart ? [] : (state.usedWords || [])); used.add(ref.id); state.usedWords = [...used];
  }
  function recordWordShown(ref, state, quiz) {
    if (!ref || !state || !quiz) return;
    if (!Array.isArray(quiz.shownWordRefs)) quiz.shownWordRefs = [];
    const shownKey = `${Number(quiz.index)||0}:${ref.id}`;
    if (quiz.shownWordRefs.includes(shownKey)) return;
    quiz.shownWordRefs.push(shownKey);
    if (!Array.isArray(state.recentQuizWords)) state.recentQuizWords = [];
    state.recentQuizWords = [...state.recentQuizWords.filter(id => id !== ref.id), ref.id].slice(-30);
  }

  function startQuiz(event) {
    if (!event?.position) return;
    if (event.quiz?.queue?.length === WORD_COUNT) { event.status = 'quiz'; save(); renderQuiz(event); return; }
    const queue = typeof globalThis.llPickQuizWords === 'function' ? llPickQuizWords(WORD_COUNT) : [];
    if (queue.length < WORD_COUNT) { alert(`Zarı Kilitle için ${WORD_COUNT} kullanılabilir kelime gerekiyor. Mevcut: ${queue.length}.`); event.status='offered'; event.position=null; save(); return; }
    event.status = 'quiz'; event.acceptedAt = new Date().toISOString();
    event.quiz = { queue, index:0, correct:0, revealed:false, completed:false, shown:0, lastCorrect:false };
    save(); renderQuiz(event);
  }

  function renderQuiz(event) {
    const quiz = event?.quiz;
    if (!event || !quiz) return;
    if (quiz.completed) { renderOutcome(event); return; }
    if (quiz.index >= quiz.queue.length) { finishQuiz(event); return; }
    const ref = quiz.queue[quiz.index], words = typeof globalThis.loadUserWords === 'function' ? loadUserWords() : [], word = words.find(item => item.id === ref.id);
    if (!word) { quiz.index++; save(); renderQuiz(event); return; }
    recordWordShown(ref, stateNow(), quiz);
    const askTrToEn = !!ref.askTrToEn, question = askTrToEn ? String(word.tr || '').split(',')[0].trim() : word.en, answer = askTrToEn ? word.en : word.tr;
    let example=''; if(word.example) example=askTrToEn&&typeof globalThis.llMaskAnswerInExample==='function'?llMaskAnswerInExample(word.example,word.en):word.example;
    const exampleHtml=example&&typeof globalThis.llExampleSentenceHtml==='function'?llExampleSentenceHtml(word,example,`dice-lock-${quiz.index}-${word.id}`):'';
    const spoken=text=>`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,text):esc(text)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`;
    const questionHtml=askTrToEn?esc(question):spoken(question), answerHtml=askTrToEn?spoken(answer):esc(answer), fullExampleHtml=quiz.revealed&&typeof globalThis.llFullExampleSentenceHtml==='function'?llFullExampleSentenceHtml(word):'';
    const currentValue=dieValue(quiz.correct), pct=(quiz.index/WORD_COUNT)*100, scale=(.88 + currentValue*.055).toFixed(3), finalWord=quiz.index===WORD_COUNT-1;
    area().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">🎲 Zarı <em>Kilitle</em></div><div class="ll-muted">${icon(event.position)} ${esc(event.position)} · ${quiz.index+1}/${WORD_COUNT} · doğru sayısı = kilitli zar</div></div><div class="ll-stars">Doğru: ${quiz.correct}/${WORD_COUNT}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-risk-die-stage"><div><div class="ll-risk-die ${quiz.lastCorrect?'pulse':''}" style="--risk-scale:${scale}">${currentValue}</div><div class="ll-risk-die-caption">Şu an kilitlenecek zar: ${currentValue}</div></div></div>${finalWord&&quiz.correct===5?'<div class="ll-risk-last-word">🔥 SON KELİME · Doğru bilirsen zarın doğrudan 6 olacak.</div>':''}<div class="ll-question" onclick="llDiceLockReveal()"><div><div class="ll-position">${askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${quiz.revealed?`<div class="ll-answer">${answerHtml}${fullExampleHtml}</div>`:'<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${quiz.revealed?'':'opacity:.35;pointer-events:none'}"><button type="button" class="ll-btn danger" onclick="llDiceLockRate(false)">✕ Bilmiyorum</button><button type="button" class="ll-btn primary" onclick="llDiceLockRate(true)">✓ Bildim</button></div></div></div>`;
    quiz.lastCorrect=false;
    try { globalThis.markNewWordFrame?.(word, area().querySelector('.ll-question')); } catch {}
  }

  function rateQuiz(correct) {
    const state=stateNow(), event=currentEvent(state), quiz=event?.quiz;
    if(!state||!event||!quiz||!quiz.revealed||quiz.completed||quiz.answerBusy)return;
    const index=num(quiz.index),ref=quiz.queue?.[index]; if(!ref)return;
    quiz.answerBusy=true; if(correct)quiz.correct++; quiz.lastCorrect=!!correct; quiz.index=index+1; quiz.shown=num(quiz.shown)+1; quiz.revealed=false;
    try{globalThis.llRecordSeasonVocabularyAnswer?.({correct:!!correct,fixture:fixtureNow(),quiz,answerIndex:index,eventType:'dice-lock-risk'});}catch{}
    try{globalThis.llPersistQuizWordRating?.(ref,quiz,!!correct,{markUsed:false});}catch{}
    try{markWordUsed(ref,state);}catch{}
    quiz.answerBusy=false; save(); if(quiz.index>=quiz.queue.length)finishQuiz(event);else renderQuiz(event);
  }

  function finishQuiz(event) {
    const quiz=event?.quiz;if(!event||!quiz||quiz.completed)return;
    quiz.completed=true;quiz.totalAnswered=quiz.index;event.lockedValue=dieValue(quiz.correct);event.status='completed';event.completedAt=new Date().toISOString();save();renderOutcome(event);
  }
  function renderOutcome(event) {
    const value=dieValue(event.quiz?.correct),scale=(.88+value*.055).toFixed(3);
    area().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-risk-final"><div class="ll-risk-kicker">${event.demo?'🧪 DEMO · ':''}SONUÇ · ${num(event.quiz?.correct)}/${WORD_COUNT} DOĞRU</div><div class="ll-risk-title">ZAR KİLİTLENDİ</div><div class="ll-risk-die pulse" style="--risk-scale:${scale}">${value}</div><div style="font-size:17px;font-weight:950;color:#fff1c2">${icon(event.position)} ${esc(event.position)} zarı bu maç <b>${value}</b>.</div><div class="ll-risk-copy" style="margin:12px auto 0">Bu değer doğrudan uygulanır. +1 maç bonusu ve reroll bu zarı değiştiremez.${event.demo?' Demo sezonluk teklif hakkını tüketmez.':''}</div><button class="ll-btn ll-risk-accept" style="margin-top:18px;min-width:240px" onclick="llDiceLockContinue()">Normal Maç Sınavına Geç</button></div></div>`;
  }
  function continueNormalQuiz() {
    const event=currentEvent(); if(!event||event.status!=='completed')return; event.normalQuizStartedAt=new Date().toISOString();save(); globalThis.llStartMatchPreparation?.();
  }
  function skipEvent() {
    const event=currentEvent(); if(!event||!['offered','position'].includes(event.status))return; event.status='skipped';event.skippedAt=new Date().toISOString();save();globalThis.llRenderDashboard?.();
  }

  function eventForMatch(match) {
    const state=stateNow(),fixture=match?.fixture,event=state&&fixture?eventByKey(state,fixtureKey(state,fixture)):null;
    return event?.status==='completed'&&event.position&&Number.isFinite(num(event.lockedValue,NaN))?event:null;
  }
  function attachRewardToMatch(match) {
    const event=eventForMatch(match); if(!event||!match)return;
    match.diceLockRisk={key:event.key,position:event.position,value:dieValue(event.lockedValue),correct:num(event.quiz?.correct),demo:!!event.demo};
  }
  function applyLockToDice(match,dice) {
    const lock=match?.diceLockRisk;if(!lock||!Array.isArray(dice))return dice;
    const die=dice.find(d=>d.position===lock.position);if(die){die.value=lock.value;die.riskLocked=true;die.riskLockValue=lock.value;}
    return dice;
  }
  function decorateMatch() {
    const match=globalThis.lexLeague?.match,lock=match?.diceLockRisk,root=area();if(!lock||!root)return;
    const playerSide=root.querySelector('.ll-battle .ll-dice-side');
    playerSide?.querySelectorAll('.ll-die-row').forEach(row=>{const label=row.querySelector('.ll-die-pos')?.textContent||'';if(label.includes(lock.position))row.classList.add('ll-risk-locked');});
    if(root.querySelector('[data-dice-lock-match]'))return;
    const html=`<div class="ll-risk-match-badge" data-dice-lock-match><b>🎲 Zarı Kilitle · ${lock.correct}/${WORD_COUNT}</b><br>${icon(lock.position)} ${esc(lock.position)} zarı bu maç doğrudan <b>${lock.value}</b> · reroll ve +1 etkisiz${lock.demo?' · demo':''}.</div>`;
    const notice=root.querySelector('.ll-notice');if(notice)notice.insertAdjacentHTML('afterend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('afterbegin',html);
  }

  function wrap(name,builder,flag='__diceLockRisk') {
    const base=globalThis[name];if(typeof base!=='function'||base[flag])return false;const wrapped=builder(base);wrapped[flag]=true;wrapped[`${flag}Base`]=base;globalThis[name]=wrapped;return true;
  }
  function install() {
    injectStyles();
    wrap('llV2RepairState',base=>function(state){const result=base.apply(this,arguments);if(result)ensureSystem(result);return result;});
    wrap('llRenderDashboard',base=>function(){const result=base.apply(this,arguments);decorateDashboard();return result;});
    wrap('llStartMatchPreparation',base=>function(){const event=currentEvent();if(event?.status==='offered'||event?.status==='position'){document.querySelector('[data-dice-lock-risk]')?.scrollIntoView?.({behavior:'smooth',block:'center'});return;}if(event?.status==='quiz'&&!event.quiz?.completed){renderQuiz(event);return;}return base.apply(this,arguments);});
    wrap('llBeginMatch',base=>function(){const result=base.apply(this,arguments);if(globalThis.lexLeague?.match){attachRewardToMatch(lexLeague.match);globalThis.llRenderMatch?.();}return result;});
    wrap('llMakeDice',base=>function(teamName,plusPos){const match=globalThis.lexLeague?.match,lock=match?.diceLockRisk;const effectivePlus=lock&&teamName===match.player&&plusPos===lock.position?null:plusPos;const dice=base.call(this,teamName,effectivePlus);return lock&&teamName===match.player?applyLockToDice(match,dice):dice;});
    wrap('llCanRerollDie',base=>function(match,position){if(match?.diceLockRisk?.position===position)return false;return base.apply(this,arguments);});
    wrap('llRenderMatch',base=>function(){const result=base.apply(this,arguments);decorateMatch();return result;});
    wrap('llCommitCurrentMatch',base=>function(){const event=eventForMatch(globalThis.lexLeague?.match),already=event?.matchCommitted;const result=base.apply(this,arguments);if(event&&!already&&globalThis.lexLeague?.match?.committed){event.matchCommitted=true;event.matchCommittedAt=new Date().toISOString();save();}return result;});
    const state=stateNow();if(state)ensureSystem(state);
  }

  globalThis.llDiceLockChoosePosition=choosePosition;
  globalThis.llDiceLockSkip=skipEvent;
  globalThis.llDiceLockStartDemo=startDemo;
  globalThis.llDiceLockReveal=function(){const event=currentEvent(),quiz=event?.quiz;if(!quiz||quiz.completed)return;quiz.revealed=true;save();renderQuiz(event);};
  globalThis.llDiceLockRate=rateQuiz;
  globalThis.llDiceLockContinue=continueNormalQuiz;
  globalThis.llDiceLockRiskTestApi={VERSION,WORD_COUNT,OFFERS_PER_SEASON,fixtureKey,dieValue,ensureSystem,isEligible,maybeCreateEvent,applyLockToDice};

  install();
})();
