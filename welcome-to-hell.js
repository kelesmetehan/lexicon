/* Cehennemi Yaşat — home-only, season-limited pressure event for elite opponents. */
(function () {
  'use strict';

  const VERSION = 1;
  const WORD_COUNT = 12;
  const MAX_USES_PER_SEASON = 2;
  const OUTCOMES = {
    fail: { min: 0, max: 8, range: null, title: 'Baskı Etkisiz Kaldı', quote: 'Tribünler denedi; büyük takım bu gece soğukkanlı kaldı.', reward: 'Etki yok' },
    nine: { min: 9, max: 9, range: [4, 5], title: 'Baskı Hissediliyor', quote: 'Rakibin güvenli alanı daraldı.', reward: 'Rakip zarı 4–5' },
    ten: { min: 10, max: 10, range: [3, 6], title: 'Sahaya Korku Çöktü', quote: 'Tribün baskısı rakibin alt sınırını kırdı.', reward: 'Rakip zarı 3–6' },
    eleven: { min: 11, max: 11, range: [1, 6], title: 'Cehennem Kapıları Açıldı', quote: 'Rakip artık her sonuca açık.', reward: 'Rakip zarı 1–6' },
    twelve: { min: 12, max: 12, range: [1, 5], title: 'Cehennemi Yaşat', quote: 'Welcome to Hell. Rakibin istikrarı tamamen çöktü.', reward: 'Rakip zarı 1–5' }
  };

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
  function positionIcon(position) {
    try { return LL_POSITION_ICONS?.[position] || '🎲'; } catch { return globalThis.LL_POSITION_ICONS?.[position] || '🎲'; }
  }
  function esc(value) {
    return typeof globalThis.llEscape === 'function'
      ? llEscape(String(value ?? ''))
      : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fixtureKey(state, fixture) {
    return [num(state?.season, 1), num(state?.week, 1), fixture?.competition || 'league', fixture?.roundLabel || '', num(fixture?.cupLeg), num(fixture?.euroLeg), fixture?.home || '', fixture?.away || ''].join('~');
  }
  function outcomeForCorrect(correct) {
    correct = clamp(correct, 0, WORD_COUNT);
    if (correct >= 12) return OUTCOMES.twelve;
    if (correct === 11) return OUTCOMES.eleven;
    if (correct === 10) return OUTCOMES.ten;
    if (correct === 9) return OUTCOMES.nine;
    return OUTCOMES.fail;
  }
  function save() { if (typeof globalThis.llSave === 'function') llSave(); }
  function area() { return typeof globalThis.llArea === 'function' ? llArea() : document.getElementById('app'); }
  function isHome(state, fixture) { return fixture?.home === state?.playerTeam; }
  function opponentFor(state, fixture) { return isHome(state, fixture) ? fixture?.away : fixture?.home; }
  function opponentStars(state, fixture) {
    const opponent = opponentFor(state, fixture);
    try { return num(globalThis.llTeamState?.(opponent)?.stars); } catch { return 0; }
  }
  function competitionLabel(fixture) {
    const c = fixture?.competition || 'league';
    if (c === 'league') return 'Lig maçı';
    if (c === 'cup') return 'Yerel kupa maçı';
    if (c === 'playoff') return 'Play-off maçı';
    if (c === 'ucl') return 'Şampiyonlar Ligi';
    if (c === 'uel') return 'Avrupa Ligi';
    if (c === 'uecl') return 'Konferans Ligi';
    return 'Resmî maç';
  }
  function ensureSystem(state) {
    if (!state) return null;
    if (!state.welcomeToHell || typeof state.welcomeToHell !== 'object' || Array.isArray(state.welcomeToHell)) state.welcomeToHell = { version: VERSION, seasons: {} };
    state.welcomeToHell.version = VERSION;
    if (!state.welcomeToHell.seasons || typeof state.welcomeToHell.seasons !== 'object') state.welcomeToHell.seasons = {};
    const season = String(num(state.season, 1));
    if (!state.welcomeToHell.seasons[season] || typeof state.welcomeToHell.seasons[season] !== 'object') {
      state.welcomeToHell.seasons[season] = { uses: 0, events: [], checked: {} };
    }
    const record = state.welcomeToHell.seasons[season];
    record.uses = clamp(record.uses, 0, MAX_USES_PER_SEASON);
    if (!Array.isArray(record.events)) record.events = [];
    if (!record.checked || typeof record.checked !== 'object') record.checked = {};
    return record;
  }
  function seasonRecord(state = stateNow()) { return ensureSystem(state); }
  function eventByKey(state, key) { return seasonRecord(state)?.events?.find(event => event.key === key) || null; }
  function currentEvent(state = stateNow(), fixture = fixtureNow()) { return state && fixture ? eventByKey(state, fixtureKey(state, fixture)) : null; }
  function legendaryEventBlocks(state, fixture) {
    const season = String(num(state?.season, 1));
    const events = state?.legendCall?.seasons?.[season]?.events;
    const key = fixtureKey(state, fixture);
    return Array.isArray(events) && events.some(event => event?.key === key && !['skipped', 'cancelled', 'expired'].includes(event.status));
  }
  function canUseWords() {
    try { return typeof globalThis.loadUserWords !== 'function' || loadUserWords().length >= WORD_COUNT; } catch { return true; }
  }
  function isEligible(state, fixture) {
    if (!state || !fixture || !isHome(state, fixture)) return false;
    if (legendaryEventBlocks(state, fixture)) return false;
    return opponentStars(state, fixture) >= 5;
  }
  function maybeCreateEvent(state, fixture) {
    const record = seasonRecord(state);
    if (!record || !fixture) return null;
    const key = fixtureKey(state, fixture);
    const existing = eventByKey(state, key);
    if (existing) return existing;
    if (record.checked[key] || record.uses >= MAX_USES_PER_SEASON || !isEligible(state, fixture) || !canUseWords()) return null;
    record.checked[key] = 'offered';
    const event = {
      key,
      season: num(state.season, 1),
      week: num(state.week, 1),
      team: state.playerTeam,
      home: fixture.home,
      away: fixture.away,
      opponent: opponentFor(state, fixture),
      opponentStars: opponentStars(state, fixture),
      competition: fixture.competition || 'league',
      roundLabel: fixture.roundLabel || '',
      status: 'offered',
      createdAt: new Date().toISOString(),
      quiz: null,
      reward: null,
      matchCommitted: false
    };
    record.events.push(event);
    return event;
  }

  function injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('ll-welcome-to-hell-styles')) return;
    const style = document.createElement('style');
    style.id = 'll-welcome-to-hell-styles';
    style.textContent = `
      .ll-hell-banner{--hell:#d43a2f;--hell2:#ff5a3c;--ember:#ff8a3d;position:relative;overflow:hidden;margin-top:13px;padding:16px;border:1px solid rgba(255,110,75,.64);border-radius:15px;background:radial-gradient(circle at 85% 0,rgba(255,78,42,.26),transparent 38%),linear-gradient(135deg,#241011,#3b1516 52%,#1b1111);box-shadow:0 12px 32px rgba(120,15,12,.26),inset 0 0 26px rgba(255,102,42,.08);animation:llHellBannerIn .55s cubic-bezier(.18,.92,.28,1.1) both}.ll-hell-banner:before{content:'';position:absolute;inset:0;background:linear-gradient(108deg,transparent 22%,rgba(255,206,128,.16) 48%,transparent 72%);transform:translateX(-125%);animation:llHellSheen 4s linear infinite}.ll-hell-banner>*{position:relative;z-index:1}.ll-hell-tag{display:flex;gap:8px;align-items:center;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#ffd7b6}.ll-hell-tag b{padding:4px 8px;border-radius:999px;color:#210c0c;background:linear-gradient(135deg,#ffb052,#ff693f);font-size:9px}.ll-hell-title{margin-top:6px;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:29px;line-height:1;color:#ffe2bc;text-shadow:0 0 19px rgba(255,90,50,.32)}.ll-hell-title span{display:inline-block;animation:llHellFlame 1.8s ease-in-out infinite}.ll-hell-copy{max-width:700px;margin-top:7px;color:#d9b5ab;font-size:12px;line-height:1.55}.ll-hell-copy strong{color:#fff3dd}.ll-hell-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}.ll-hell-actions .ll-btn{flex:1;min-width:170px}.ll-hell-accept{background:linear-gradient(135deg,#d93b2e,#ff8843)!important;color:#fff8eb!important;border-color:rgba(255,221,177,.44)!important}.ll-hell-cine{--hell:#d43a2f;position:relative;isolation:isolate;max-width:740px;min-height:430px;margin:0 auto;overflow:hidden;padding:37px 23px 29px;text-align:center;border:1px solid rgba(255,123,72,.55);border-radius:22px;background:radial-gradient(ellipse at 50% 20%,rgba(196,38,25,.33),transparent 54%),linear-gradient(180deg,#251111,#100e12 88%);box-shadow:0 24px 65px rgba(0,0,0,.55),0 0 45px rgba(189,32,22,.15)}.ll-hell-cine:before{content:'';position:absolute;inset:-30%;z-index:-1;background:repeating-conic-gradient(from 0deg at 50% 48%,rgba(255,122,61,.10) 0deg 1deg,transparent 1.6deg 13deg);opacity:.68;animation:llHellRays 16s linear infinite}.ll-hell-embers{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none}.ll-hell-embers i{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);border-radius:50% 50% 50% 0;background:radial-gradient(circle at 32% 28%,#fff6c7 0 15%,#ffce59 33%,#ff6035 64%,rgba(255,53,28,0) 74%);box-shadow:0 0 10px #ff5d33;opacity:0;animation:llHellEmber var(--duration) cubic-bezier(.17,.74,.31,1) var(--delay) infinite}.ll-hell-score{font-size:11px;letter-spacing:.14em;color:#dda9a1;text-transform:uppercase}.ll-hell-score b{font-size:17px;color:#ffca9b}.ll-hell-icon{margin:16px 0 4px;font-size:58px;filter:drop-shadow(0 0 18px rgba(255,78,36,.7));animation:llHellPop .65s cubic-bezier(.2,1.45,.3,1) .15s both}.ll-hell-result-title{font-family:'Cormorant Garamond',serif;font-size:38px;line-height:1.03;font-weight:700;color:#ffe0bc;text-shadow:0 0 22px rgba(255,76,32,.42);animation:llHellRise .55s ease .28s both}.ll-hell-quote{margin:9px auto 18px;max-width:530px;color:#d7aaa3;font-size:13px;font-style:italic;animation:llHellRise .55s ease .42s both}.ll-hell-reward{display:inline-block;min-width:min(430px,100%);padding:13px 18px;border:1px solid rgba(255,135,75,.38);border-radius:13px;background:rgba(255,93,48,.12);color:#f7d2bb;font-size:13px;animation:llHellRise .55s ease .56s both}.ll-hell-reward b{display:block;margin-bottom:3px;color:#ffb47c;font-family:'Cormorant Garamond',serif;font-size:20px}.ll-hell-choice{margin-top:21px;animation:llHellRise .55s ease .7s both}.ll-hell-choice .ll-card-title{margin-bottom:9px;color:#ffd7ae}.ll-hell-match-badge{margin:12px 0;padding:11px 13px;border:1px solid rgba(255,119,64,.54);border-radius:11px;background:linear-gradient(135deg,rgba(190,34,23,.19),rgba(255,123,54,.08));font-size:12px}.ll-hell-match-badge b{color:#ffcca4}@keyframes llHellBannerIn{from{opacity:0;transform:translateY(15px) scale(.97)}to{opacity:1;transform:none}}@keyframes llHellSheen{to{transform:translateX(135%)}}@keyframes llHellFlame{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.12) rotate(3deg)}}@keyframes llHellRays{to{transform:rotate(1turn)}}@keyframes llHellEmber{0%,8%{opacity:0;transform:translate(-50%,-50%) scale(.25)}14%{opacity:.96}58%{opacity:.7}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.7) rotate(170deg)}}@keyframes llHellPop{from{opacity:0;transform:scale(.35) rotate(-16deg)}to{opacity:1;transform:none}}@keyframes llHellRise{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:none}}@media(max-width:650px){.ll-hell-actions{flex-direction:column}.ll-hell-cine{min-height:400px;padding:30px 14px 24px}.ll-hell-result-title{font-size:32px}}
    `;
    document.head.appendChild(style);
  }
  function bannerHtml(event, state) {
    if (!event || ['skipped', 'completed', 'match-committed'].includes(event.status)) return '';
    const remaining = Math.max(0, MAX_USES_PER_SEASON - num(seasonRecord(state)?.uses));
    const progress = event.status === 'accepted' && event.quiz ? `${num(event.quiz.index)}/${WORD_COUNT} soru · ${num(event.quiz.correct)} doğru` : `${remaining} sezonluk hak kaldı`;
    const actions = event.status === 'offered'
      ? `<button class="ll-btn ll-hell-accept" onclick="llHellAccept()">🔥 Cehennemi Yaşat · 12 Kelime</button><button class="ll-btn" onclick="llHellSkip()">Geç</button>`
      : `<button class="ll-btn ll-hell-accept" onclick="llHellResume()">Özel Sınava Devam Et</button>`;
    return `<div class="ll-hell-banner" data-welcome-to-hell><div class="ll-hell-tag"><b>Ev Sahibi Özel</b><span>${esc(event.opponent)} · ${event.opponentStars}★ · ${esc(progress)}</span></div><div class="ll-hell-title"><span>🔥</span> Cehennemi Yaşat</div><div class="ll-hell-copy">Evindeki <strong>5★ veya 6★</strong> rakibin 1 mevki zarını yalnızca bu maç için boz. <strong>12 kelime</strong> çöz, ardından hedef mevkiyi seç; normal 10 kelimelik maç sınavı ayrıca oynanır.</div><div class="ll-hell-actions">${actions}</div></div>`;
  }
  function decorateDashboard() {
    const state = stateNow(), fixture = fixtureNow(), root = area();
    if (!state || !fixture || !root) return;
    ensureSystem(state);
    let event = eventByKey(state, fixtureKey(state, fixture));
    if (!event) event = maybeCreateEvent(state, fixture);
    if (!event || root.querySelector('[data-welcome-to-hell]')) return;
    const html = bannerHtml(event, state);
    if (!html) return;
    const next = root.querySelector('.ll-next-match'), card = next?.closest('.ll-card');
    if (next) next.insertAdjacentHTML('beforebegin', html);
    else if (card) card.insertAdjacentHTML('beforeend', html);
    else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend', html);
    save();
  }
  function markWordUsed(ref, state) {
    if (!ref || !state) return;
    const used = new Set(ref.cycleStart ? [] : (state.usedWords || []));
    used.add(ref.id); state.usedWords = [...used];
  }
  function recordWordShown(ref, state, quiz) {
    if (!ref || !state || !quiz) return;
    if (!Array.isArray(quiz.shownWordIds)) quiz.shownWordIds = [];
    if (quiz.shownWordIds.includes(ref.id)) return;
    quiz.shownWordIds.push(ref.id);
    if (!Array.isArray(state.recentQuizWords)) state.recentQuizWords = [];
    state.recentQuizWords.push(ref.id); state.recentQuizWords = state.recentQuizWords.slice(-30);
  }
  function renderQuiz(event) {
    const quiz = event?.quiz;
    if (!event || !quiz) return;
    if (quiz.completed) { renderOutcome(event); return; }
    if (quiz.index >= quiz.queue.length) { finishQuiz(event); return; }
    const ref = quiz.queue[quiz.index];
    const words = typeof globalThis.loadUserWords === 'function' ? loadUserWords() : [];
    const word = words.find(item => item.id === ref.id);
    if (!word) { quiz.index++; save(); renderQuiz(event); return; }
    recordWordShown(ref, stateNow(), quiz);
    const askTrToEn = !!ref.askTrToEn;
    const question = askTrToEn ? String(word.tr || '').split(',')[0].trim() : word.en;
    const answer = askTrToEn ? word.en : word.tr;
    let example = '';
    if (word.example) example = askTrToEn && typeof globalThis.llMaskAnswerInExample === 'function' ? llMaskAnswerInExample(word.example, word.en) : word.example;
    const exampleHtml = example && typeof globalThis.llExampleSentenceHtml === 'function' ? llExampleSentenceHtml(word, example, `hell-${quiz.index}-${word.id}`) : '';
    const spoken = text => `<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml === 'function' ? llEnglishWordHtml(word, text) : esc(text)}</span>${typeof globalThis.llPronounceButton === 'function' ? llPronounceButton(word.en) : ''}</div>`;
    const questionHtml = askTrToEn ? esc(question) : spoken(question);
    const answerHtml = askTrToEn ? spoken(answer) : esc(answer);
    const pct = (quiz.index / WORD_COUNT) * 100;
    area().innerHTML = `<div class="ll-shell ll-quiz-card"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Cehennemi <em>Yaşat</em></div><div class="ll-muted">Ev sahibi özel sınavı · ${quiz.index + 1}/${WORD_COUNT} · Her doğru normal maç AP'si kazandırır · sonra normal 10 kelimelik sınav</div></div><div class="ll-stars">Doğru: ${quiz.correct}/${WORD_COUNT}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-question" onclick="llHellReveal()"><div><div class="ll-position">${askTrToEn ? 'TÜRKÇE → İNGİLİZCE' : 'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${quiz.revealed ? `<div class="ll-answer">${answerHtml}</div>` : '<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${quiz.revealed ? '' : 'opacity:.35;pointer-events:none'}"><button type="button" class="ll-btn danger" onclick="llHellRate(false)">✕ Bilmiyorum</button><button type="button" class="ll-btn primary" onclick="llHellRate(true)">✓ Bildim</button></div><button class="ll-btn" style="width:100%;margin-top:10px" onclick="llHellFinishEarly()">Burada Bırak · Şu anki ${quiz.correct} doğru üzerinden sonucu al</button></div></div>`;
    try { if (typeof globalThis.markNewWordFrame === 'function') markNewWordFrame(word, area().querySelector('.ll-question')); } catch {}
  }
  function startQuiz(event) {
    if (!event) return;
    if (event.quiz?.queue?.length === WORD_COUNT) { event.status = 'accepted'; save(); renderQuiz(event); return; }
    const queue = typeof globalThis.llPickQuizWords === 'function' ? llPickQuizWords(WORD_COUNT) : [];
    if (queue.length < WORD_COUNT) { alert(`Cehennemi Yaşat için ${WORD_COUNT} kullanılabilir kelime gerekiyor. Mevcut: ${queue.length}. Hak harcanmadı.`); return; }
    event.status = 'accepted'; event.acceptedAt = new Date().toISOString();
    event.quiz = { queue, index: 0, correct: 0, revealed: false, completed: false, shown: 0, recoveryBonus: 0, recoveredWords: 0 };
    save(); renderQuiz(event);
  }
  function rateQuiz(correct) {
    const state = stateNow(), event = currentEvent(state), quiz = event?.quiz;
    if (!state || !event || !quiz || !quiz.revealed || quiz.completed || quiz.answerBusy) return;
    const index = num(quiz.index), ref = quiz.queue?.[index];
    if (!ref) return;
    quiz.answerBusy = true;
    if (correct) quiz.correct++;
    quiz.index = index + 1; quiz.shown = num(quiz.shown) + 1; quiz.revealed = false;
    try { if (typeof globalThis.llPersistQuizWordRating === 'function') llPersistQuizWordRating(ref, quiz, !!correct, { markUsed: false }); } catch (error) { try { globalThis.llQuizDiagnostic?.('hell_quiz_answer_error', { wordId: ref.id || null, message: String(error?.message || error) }); } catch {} }
    try { markWordUsed(ref, state); } catch {}
    quiz.answerBusy = false; save();
    if (quiz.index >= quiz.queue.length) finishQuiz(event); else renderQuiz(event);
  }
  function quizApPerWord() { try { return typeof globalThis.llQuizApPerWord === 'function' ? num(llQuizApPerWord(), 5) : 5; } catch { return 5; } }
  function finishQuiz(event) {
    const state = stateNow(), quiz = event?.quiz;
    if (!state || !event || !quiz || quiz.completed) return;
    quiz.completed = true; quiz.totalAnswered = quiz.index;
    const earned = num(quiz.correct) * quizApPerWord() + num(quiz.recoveryBonus);
    state.ap = num(state.ap) + earned; quiz.apEarned = earned;
    const outcome = outcomeForCorrect(quiz.correct);
    event.reward = { type: outcome.range ? 'opponentRange' : 'none', range: outcome.range ? [...outcome.range] : null, label: outcome.reward, position: null, applied: false };
    event.status = outcome.range ? 'reward-pending' : 'completed'; event.completedAt = new Date().toISOString();
    const record = seasonRecord(state);
    if (!event.useConsumed) { record.uses = clamp(num(record.uses) + 1, 0, MAX_USES_PER_SEASON); event.useConsumed = true; }
    if (state.achievementStats) { state.achievementStats.words = num(state.achievementStats.words) + num(quiz.correct); state.achievementStats.corrections = num(state.achievementStats.corrections) + num(quiz.recoveredWords); }
    save(); renderOutcome(event);
  }
  function createEmbers() {
    const host = document.querySelector('.ll-hell-embers');
    if (!host) return;
    for (let i = 0; i < 34; i++) {
      const ember = document.createElement('i');
      ember.style.setProperty('--x', `${32 + Math.random() * 36}%`);
      ember.style.setProperty('--y', `${74 + Math.random() * 18}%`);
      ember.style.setProperty('--dx', `${(Math.random() - .5) * 240}px`);
      ember.style.setProperty('--dy', `${-(80 + Math.random() * 210)}px`);
      ember.style.setProperty('--size', `${3 + Math.random() * 5}px`);
      ember.style.setProperty('--duration', `${1.8 + Math.random() * 1.7}s`);
      ember.style.setProperty('--delay', `${-Math.random() * 3.1}s`);
      host.appendChild(ember);
    }
  }
  function renderOutcome(event) {
    const quiz = event.quiz, outcome = outcomeForCorrect(quiz.correct), needsChoice = !!outcome.range && !event.reward?.position;
    const choice = needsChoice
      ? `<div class="ll-hell-choice"><div class="ll-card-title">Rakibin zarı daralacak mevkiyi seç</div><div class="ll-squad">${positions().map(position => `<button class="ll-team-option" onclick="llHellChoosePosition('${esc(position)}')"><div class="ll-team-name">${positionIcon(position)} ${esc(position)}</div><div class="ll-range">${outcome.range[0]}–${outcome.range[1]} · sadece rakipte, sadece bu maç</div></button>`).join('')}</div></div>`
      : `<div class="ll-hell-choice"><button class="ll-btn ll-hell-accept" onclick="llHellContinueNormalQuiz()">Normal 10 Kelimelik Sınava Geç</button></div>`;
    area().innerHTML = `<div class="ll-shell ll-quiz-card"><div class="ll-hell-cine"><div class="ll-hell-embers"></div><div class="ll-hell-score">SONUÇ · <b>${quiz.correct} / ${WORD_COUNT}</b> DOĞRU</div><div class="ll-hell-icon">${outcome.range ? '🔥' : '🌫️'}</div><div class="ll-hell-result-title">${esc(outcome.title)}</div><div class="ll-hell-quote">“${esc(outcome.quote)}”</div><div class="ll-hell-reward"><b>${esc(outcome.reward)}</b>${outcome.range ? `${esc(event.opponent)} takımının seçilen mevki zarı bu maç yalnızca ${outcome.range[0]}–${outcome.range[1]} aralığında atılacak.` : 'Sezonluk hak kullanıldı; normal maç sınavına devam edebilirsin.'}</div><div class="ll-muted" style="margin-top:15px">+${num(quiz.apEarned)} AP işlendi. Bu özel sınavdan sonra normal 10 kelimelik maç sınavı ayrıca oynanacak.</div>${choice}</div></div>`;
    setTimeout(createEmbers, 20);
  }
  function choosePosition(position) {
    const event = currentEvent();
    if (!event || event.status !== 'reward-pending' || !positions().includes(position)) return;
    event.reward.position = position; event.reward.applied = true; event.status = 'completed'; save(); continueNormalQuiz();
  }
  function continueNormalQuiz() {
    const state = stateNow(), fixture = fixtureNow(), event = currentEvent(state, fixture);
    if (!state || !fixture || !event || event.status !== 'completed') return;
    event.normalQuizStartedAt = new Date().toISOString(); save();
    if (typeof globalThis.llStartMatchPreparation === 'function') llStartMatchPreparation();
  }
  function skipEvent() {
    const event = currentEvent();
    if (!event || event.status !== 'offered') return;
    event.status = 'skipped'; event.skippedAt = new Date().toISOString(); save();
    if (typeof globalThis.llRenderDashboard === 'function') llRenderDashboard();
  }
  function finishEarly() {
    const event = currentEvent(), quiz = event?.quiz;
    if (!quiz || quiz.completed) return;
    if (!confirm(`${quiz.index} soru gördün ve ${quiz.correct} doğru yaptın. Bu sonuçla özel sınavı bitirmek istiyor musun?`)) return;
    finishQuiz(event);
  }
  function eventForMatch(match) {
    const state = stateNow(), fixture = match?.fixture;
    const event = state && fixture ? eventByKey(state, fixtureKey(state, fixture)) : null;
    return event?.status === 'completed' && event.reward?.type === 'opponentRange' && event.reward?.position ? event : null;
  }
  function attachRewardToMatch(match) {
    const event = eventForMatch(match);
    if (!event || !match || event.matchCommitted) return;
    match.hellCall = { key: event.key, correct: num(event.quiz?.correct), opponent: event.opponent, position: event.reward.position, range: [...event.reward.range] };
  }
  function decorateMatch() {
    const match = globalThis.lexLeague?.match, hell = match?.hellCall, root = area();
    if (!hell || !root || root.querySelector('[data-hell-match]')) return;
    const html = `<div class="ll-hell-match-badge" data-hell-match><b>🔥 Cehennemi Yaşat · ${hell.correct}/${WORD_COUNT}</b><br>${esc(hell.opponent)} · ${positionIcon(hell.position)} ${esc(hell.position)} zarı bu maç ${hell.range[0]}–${hell.range[1]} aralığında atılır.</div>`;
    const notice = root.querySelector('.ll-notice');
    if (notice) notice.insertAdjacentHTML('afterend', html); else root.querySelector('.ll-panel')?.insertAdjacentHTML('afterbegin', html);
  }
  function wrap(name, builder, flag = '__welcomeToHell') {
    const base = globalThis[name];
    if (typeof base !== 'function' || base[flag]) return false;
    const wrapped = builder(base); wrapped[flag] = true; wrapped[`${flag}Base`] = base; globalThis[name] = wrapped; return true;
  }
  function install() {
    injectStyles();
    wrap('llV2RepairState', base => function (state) { const result = base.apply(this, arguments); if (result) ensureSystem(result); return result; });
    wrap('llRenderDashboard', base => function () { const result = base.apply(this, arguments); decorateDashboard(); return result; });
    wrap('llStartMatchPreparation', base => function () {
      const state = stateNow(), fixture = fixtureNow(), event = currentEvent(state, fixture);
      if (event?.status === 'offered') { document.querySelector('[data-welcome-to-hell]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); return; }
      if (event?.status === 'accepted' && !event.quiz?.completed) { renderQuiz(event); return; }
      const result = base.apply(this, arguments);
      if (globalThis.lexLeague?.quiz && event?.status === 'completed') lexLeague.quiz.welcomeToHellKey = event.key;
      return result;
    });
    wrap('llBeginMatch', base => function () { const result = base.apply(this, arguments); if (globalThis.lexLeague?.match) { attachRewardToMatch(lexLeague.match); if (typeof globalThis.llRenderMatch === 'function') llRenderMatch(); } return result; });
    wrap('llRollValue', base => function (teamName, position) {
      const hell = globalThis.lexLeague?.match?.hellCall;
      if (!hell || teamName !== hell.opponent || position !== hell.position || !Array.isArray(hell.range) || typeof globalThis.llRandomInt !== 'function') return base.apply(this, arguments);
      const randomInt = globalThis.llRandomInt; let intercepted = false;
      globalThis.llRandomInt = function (min, max) {
        if (!intercepted) { intercepted = true; return randomInt(num(hell.range[0]), num(hell.range[1])); }
        return randomInt(min, max);
      };
      try { return base.apply(this, arguments); } finally { globalThis.llRandomInt = randomInt; }
    });
    wrap('llRenderMatch', base => function () { const result = base.apply(this, arguments); decorateMatch(); return result; });
    wrap('llCommitCurrentMatch', base => function () {
      const event = eventForMatch(globalThis.lexLeague?.match), already = event?.matchCommitted;
      const result = base.apply(this, arguments);
      if (event && !already && globalThis.lexLeague?.match?.committed) { event.matchCommitted = true; event.matchCommittedAt = new Date().toISOString(); save(); }
      return result;
    });
    const state = stateNow(); if (state) ensureSystem(state);
  }

  globalThis.llHellAccept = function () { const state = stateNow(), fixture = fixtureNow(); let event = currentEvent(state, fixture); if (!event) event = maybeCreateEvent(state, fixture); if (event?.status === 'offered') startQuiz(event); };
  globalThis.llHellSkip = skipEvent;
  globalThis.llHellResume = function () { const event = currentEvent(); if (event) renderQuiz(event); };
  globalThis.llHellReveal = function () { const event = currentEvent(), quiz = event?.quiz; if (!quiz || quiz.completed) return; quiz.revealed = true; save(); renderQuiz(event); };
  globalThis.llHellRate = rateQuiz;
  globalThis.llHellFinishEarly = finishEarly;
  globalThis.llHellChoosePosition = choosePosition;
  globalThis.llHellContinueNormalQuiz = continueNormalQuiz;
  globalThis.llWelcomeToHellTestApi = { VERSION, WORD_COUNT, MAX_USES_PER_SEASON, OUTCOMES, fixtureKey, outcomeForCorrect, ensureSystem, isEligible, maybeCreateEvent, attachRewardToMatch };

  install();
})();
