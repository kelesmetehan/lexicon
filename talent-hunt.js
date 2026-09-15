/* Yetenek Avı — optional 20-word scouting event on weeks 10 and 24. */
(function () {
  'use strict';

  const VERSION = 1;
  const WORD_COUNT = 20;
  const EVENT_WEEKS = [10, 24];
  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];
  const OUTCOMES = {
    fail: { min: 0, max: 13, level: 0, rarity: null, title: 'Scout Raporu Tamamlandı', icon: '📋', rewardTitle: 'Kart ödülü yok', quote: 'Bu kez yeterli seviyede bir aday bulunamadı.' },
    common: { min: 14, max: 15, level: 1, rarity: 'common', title: 'Yeni Bir Aday Keşfedildi', icon: '🔎', rewardTitle: '1★ Kart', quote: 'Scout ekibin rotasyona girebilecek bir isim buldu.' },
    rare: { min: 16, max: 17, level: 2, rarity: 'rare', title: 'Dikkat Çeken Bir Yetenek', icon: '⭐', rewardTitle: '2★ Kart', quote: 'Rapor olumlu. Bu oyuncu kadrona gerçek katkı verebilir.' },
    epic: { min: 18, max: 19, level: 3, rarity: 'epic', title: 'Üst Düzey Yetenek Bulundu', icon: '🌟', rewardTitle: '3★ Kart', quote: 'Scout ekibi bu adayın peşini bırakmamanı öneriyor.' },
    legendary: { min: 20, max: 20, level: 4, rarity: 'legendary', title: 'Kusursuz Keşif', icon: '✨', rewardTitle: '4★ Kart', quote: 'Yirmide yirmi. Nadir bulunan bir yıldız radarına girdi.' }
  };

  function num(value, fallback = 0) { value = Number(value); return Number.isFinite(value) ? value : fallback; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, num(value))); }
  function stateNow() { return globalThis.lexLeague?.state || null; }
  function fixtureNow() { try { return globalThis.lexLeague?.quiz?.fixture || (typeof globalThis.llPlayerFixture === 'function' ? llPlayerFixture() : null); } catch { return null; } }
  function save() { if (typeof globalThis.llSave === 'function') llSave(); }
  function area() { return typeof globalThis.llArea === 'function' ? llArea() : document.getElementById('app'); }
  function esc(value) {
    return typeof globalThis.llEscape === 'function'
      ? llEscape(String(value ?? ''))
      : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function positions() {
    try { if (Array.isArray(LL_POSITIONS) && LL_POSITIONS.length) return LL_POSITIONS; } catch {}
    return Array.isArray(globalThis.LL_POSITIONS) && globalThis.LL_POSITIONS.length ? globalThis.LL_POSITIONS : ['Kaleci', 'Orta Saha', 'Forvet'];
  }
  function positionIcon(position) {
    try { return LL_POSITION_ICONS?.[position] || '◆'; } catch { return globalThis.LL_POSITION_ICONS?.[position] || '◆'; }
  }
  function eventWeek(state = stateNow()) { return EVENT_WEEKS.includes(num(state?.week)); }
  function eventKey(state = stateNow()) { return `${num(state?.season, 1)}~${num(state?.week, 0)}`; }
  function outcomeForCorrect(correct) {
    correct = clamp(correct, 0, WORD_COUNT);
    if (correct === 20) return OUTCOMES.legendary;
    if (correct >= 18) return OUTCOMES.epic;
    if (correct >= 16) return OUTCOMES.rare;
    if (correct >= 14) return OUTCOMES.common;
    return OUTCOMES.fail;
  }
  function rarityLabel(rarity) {
    try { return LL_RARITY_LABELS?.[rarity] || rarity || ''; } catch { return globalThis.LL_RARITY_LABELS?.[rarity] || rarity || ''; }
  }
  function rarityRank(rarity) {
    try { return num(LL_CARD_RARITY_RANK?.[rarity], RARITY_ORDER.indexOf(rarity) + 1); } catch { return RARITY_ORDER.indexOf(rarity) + 1; }
  }
  function cardPool() {
    try { return Array.isArray(LL_CARD_POOL) ? LL_CARD_POOL : []; } catch { return Array.isArray(globalThis.LL_CARD_POOL) ? globalThis.LL_CARD_POOL : []; }
  }
  function cardById(id) {
    try { if (typeof globalThis.llCard === 'function') return llCard(id); } catch {}
    return cardPool().find(card => card?.id === id) || null;
  }
  function playerTeamState(state = stateNow()) {
    if (!state?.playerTeam) return null;
    try { if (typeof globalThis.llTeamState === 'function') return llTeamState(state.playerTeam); } catch {}
    return state.teams?.[state.playerTeam] || null;
  }
  function ensureSystem(state) {
    if (!state) return null;
    if (!state.talentHunt || typeof state.talentHunt !== 'object' || Array.isArray(state.talentHunt)) state.talentHunt = { version: VERSION, seasons: {} };
    state.talentHunt.version = VERSION;
    if (!state.talentHunt.seasons || typeof state.talentHunt.seasons !== 'object') state.talentHunt.seasons = {};
    const season = String(num(state.season, 1));
    if (!state.talentHunt.seasons[season] || typeof state.talentHunt.seasons[season] !== 'object') state.talentHunt.seasons[season] = { events: {}, claimedCardIds: [] };
    const record = state.talentHunt.seasons[season];
    if (!record.events || typeof record.events !== 'object' || Array.isArray(record.events)) record.events = {};
    if (!Array.isArray(record.claimedCardIds)) record.claimedCardIds = [];
    return record;
  }
  function currentEvent(state = stateNow()) {
    const record = ensureSystem(state);
    return record?.events?.[eventKey(state)] || null;
  }
  function isEligible(state, fixture) {
    return !!state && !!fixture && !state.seasonEnded && eventWeek(state);
  }
  function maybeCreateEvent(state, fixture) {
    const record = ensureSystem(state);
    if (!record || !isEligible(state, fixture)) return null;
    const key = eventKey(state);
    if (record.events[key]) return record.events[key];
    const event = {
      key,
      season: num(state.season, 1),
      week: num(state.week),
      team: state.playerTeam,
      fixture: fixture ? { home: fixture.home || '', away: fixture.away || '', competition: fixture.competition || 'league', roundLabel: fixture.roundLabel || '' } : null,
      status: 'offered',
      position: null,
      quiz: null,
      reward: null,
      createdAt: new Date().toISOString()
    };
    record.events[key] = event;
    return event;
  }

  function injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('ll-talent-hunt-styles')) return;
    const style = document.createElement('style');
    style.id = 'll-talent-hunt-styles';
    style.textContent = `
      .ll-talent-banner .ll-legend-title .ll-legend-flame{filter:drop-shadow(0 0 7px rgba(232,200,112,.72))}
      .ll-talent-position-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:20px}
      .ll-talent-position{padding:17px 12px;border:1px solid rgba(201,168,76,.34);border-radius:14px;background:linear-gradient(145deg,rgba(74,42,110,.38),rgba(19,20,31,.82));color:#f8fafc;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
      .ll-talent-position:hover{transform:translateY(-2px);border-color:rgba(232,200,112,.72);box-shadow:0 12px 30px rgba(124,58,237,.18)}
      .ll-talent-position-icon{font-size:30px;margin-bottom:7px}.ll-talent-position b{display:block;color:#f3d98b;font-size:15px}.ll-talent-position small{display:block;margin-top:5px;color:#aaa4b5;line-height:1.4}
      .ll-talent-reward-card{width:min(460px,100%);margin:18px auto 0;padding:18px;border:1px solid rgba(201,168,76,.42);border-radius:16px;background:linear-gradient(145deg,rgba(88,50,132,.32),rgba(13,18,28,.88));text-align:left;box-shadow:0 18px 38px rgba(0,0,0,.24);animation:llLegendTitle .65s ease .7s both}
      .ll-talent-reward-card .ll-rarity{margin-bottom:8px}.ll-talent-reward-name{font-family:'Cormorant Garamond',serif;color:#fff1c3;font-size:25px;font-weight:700}.ll-talent-reward-meta{margin-top:4px;color:#aaa4b5;font-size:11px}.ll-talent-reward-copy{margin-top:12px;color:#d8d2df;font-size:12px;line-height:1.55}
      .ll-talent-outcome-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px;animation:llLegendTitle .55s ease .9s both}.ll-talent-outcome-actions .ll-btn{min-width:170px}
      .ll-talent-skip{border-color:rgba(183,135,255,.35)!important;background:rgba(38,22,67,.52)!important}
      .ll-talent-quiz-exit{width:100%;margin-top:10px;border-color:rgba(183,135,255,.35)!important;background:rgba(38,22,67,.52)!important}
      @media(max-width:650px){.ll-talent-position-grid{grid-template-columns:1fr}.ll-talent-outcome-actions{flex-direction:column}.ll-talent-outcome-actions .ll-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function spawnBannerEmbers() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.ll-talent-banner .ll-legend-banner-embers').forEach(host => {
      if (host.dataset.embersReady === '1') return;
      host.dataset.embersReady = '1';
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('i');
        p.style.setProperty('--x', `${3 + Math.random() * 94}%`);
        p.style.setProperty('--dx', `${(Math.random() - .5) * 110}px`);
        p.style.setProperty('--dy', `${-(115 + Math.random() * 105)}px`);
        p.style.setProperty('--size', `${(2.5 + Math.random() * 3.5).toFixed(1)}px`);
        p.style.setProperty('--duration', `${(1.6 + Math.random() * 1.8).toFixed(2)}s`);
        p.style.setProperty('--delay', `${(-Math.random() * 3.1).toFixed(2)}s`);
        host.appendChild(p);
      }
    });
  }
  function spawnParticles() {
    if (typeof document === 'undefined') return;
    const host = document.querySelector('.ll-talent-particles');
    if (!host || host.dataset.ready === '1') return;
    host.dataset.ready = '1';
    const colors = ['#ff5a36', '#ff7a22', '#ffd15c', '#e8c870'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('i');
      p.style.setProperty('--x', `${50 + (Math.random() - .5) * 38}%`);
      p.style.setProperty('--y', `${72 + Math.random() * 18}%`);
      p.style.setProperty('--dx', `${(Math.random() - .5) * (140 + Math.random() * 110)}px`);
      p.style.setProperty('--dy', `${-(92 + Math.random() * 176)}px`);
      p.style.setProperty('--size', `${(3 + Math.random() * 5).toFixed(1)}px`);
      p.style.setProperty('--ember', colors[i % colors.length]);
      p.style.setProperty('--duration', `${(1.8 + Math.random() * 1.8).toFixed(2)}s`);
      p.style.setProperty('--delay', `${(-Math.random() * 3.4).toFixed(2)}s`);
      host.appendChild(p);
    }
  }

  function bannerHtml(event) {
    if (!event || ['skipped', 'abandoned', 'completed'].includes(event.status)) return '';
    const progress = event.status === 'accepted' && event.quiz ? `${num(event.quiz.index)}/${WORD_COUNT} soru · ${num(event.quiz.correct)} doğru` : event.position ? `${positionIcon(event.position)} ${esc(event.position)}` : '20 soruluk özel scouting';
    let actions = '';
    if (event.status === 'offered') actions = `<button class="ll-btn ll-legend-accept" onclick="llTalentAccept()">🔎 Yetenek Avına Katıl</button><button class="ll-btn" onclick="llTalentSkipOffer()">Geç</button>`;
    else if (event.status === 'position-pending') actions = `<button class="ll-btn ll-legend-accept" onclick="llTalentResume()">Mevki Seçimine Devam Et</button>`;
    else if (event.status === 'accepted') actions = `<button class="ll-btn ll-legend-accept" onclick="llTalentResume()">Yetenek Avına Devam Et</button>`;
    else if (event.status === 'reward-pending') actions = `<button class="ll-btn ll-legend-accept" onclick="llTalentResume()">Scout Raporuna Dön</button>`;
    return `<div class="ll-legend-banner ll-talent-banner" data-talent-hunt><div class="ll-legend-banner-embers" aria-hidden="true"></div><div class="ll-legend-tagrow"><span class="ll-legend-badge">Transfer Dönemi Özel</span><span class="ll-legend-rare">${event.week}. hafta · ${progress}</span></div><div class="ll-legend-title"><span class="ll-legend-flame">🔎</span>Yetenek Avı</div><div class="ll-legend-sub">Önce <b>Kaleci / Orta Saha / Forvet</b> hedefini seç. <b>20 kelime</b> sonunda 14 doğruyla kart ödülü başlar; başarı yükseldikçe kart seviyesi yükselir. Katılım zorunlu değildir.</div><div class="ll-legend-actions">${actions}</div></div>`;
  }
  function decorateDashboard() {
    const state = stateNow(), fixture = fixtureNow(), root = area();
    if (!state || !fixture || !root) return;
    ensureSystem(state);
    let event = currentEvent(state);
    if (!event) event = maybeCreateEvent(state, fixture);
    if (!event || root.querySelector('[data-talent-hunt]')) return;
    const html = bannerHtml(event);
    if (!html) return;
    const next = root.querySelector('.ll-next-match'), card = next?.closest?.('.ll-card');
    if (next) next.insertAdjacentHTML('beforebegin', html);
    else if (card) card.insertAdjacentHTML('beforeend', html);
    else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend', html);
    setTimeout(spawnBannerEmbers, 20);
    save();
  }

  function currentCardLabel(position) {
    const team = playerTeamState();
    const card = cardById(team?.cards?.[position]);
    return card ? `${rarityLabel(card.rarity)} · ${card.name}` : 'Mevcut kart yok';
  }
  function renderPositionChoice(event) {
    if (!event) return;
    event.status = 'position-pending';
    save();
    area().innerHTML = `<div class="ll-shell ll-quiz-card"><div class="ll-legend-cine" style="--legend-glow:rgba(124,58,237,.30)"><div class="ll-legend-particles ll-talent-particles"></div><div class="ll-legend-score">YETENEK AVI · <b>${event.week}. HAFTA</b></div><div class="ll-legend-cine-icon">🔎</div><div class="ll-legend-cine-title">Hedef Mevkiyi Seç</div><div class="ll-legend-quote">“Scout ekibin yalnızca seçtiğin bölgeye odaklanacak.”</div><div class="ll-talent-position-grid">${positions().map(position => `<button class="ll-talent-position" onclick="llTalentChoosePosition('${esc(position)}')"><div class="ll-talent-position-icon">${positionIcon(position)}</div><b>${esc(position)}</b><small>${esc(currentCardLabel(position))}</small></button>`).join('')}</div><div class="ll-legend-tier-note">Seçim sınav başlamadan kilitlenir. 20 soru tamamlandığında doğru sayın kart seviyesini belirler.</div><div class="ll-talent-outcome-actions"><button class="ll-btn ll-talent-skip" onclick="llTalentSkipOffer()">Geç · Normal Sınava Devam Et</button></div></div></div>`;
    setTimeout(spawnParticles, 20);
  }

  function markWordUsed(ref, state) {
    if (!ref || !state) return;
    const used = new Set(ref.cycleStart ? [] : (state.usedWords || []));
    used.add(ref.id); state.usedWords = [...used];
  }
  function recordWordShown(ref, state, quiz) {
    if (!ref || !state || !quiz) return;
    if (!Array.isArray(quiz.shownWordRefs)) quiz.shownWordRefs = [];
    const shownKey = `${num(quiz.index)}:${ref.id}`;
    if (quiz.shownWordRefs.includes(shownKey)) return;
    quiz.shownWordRefs.push(shownKey);
    if (!Array.isArray(state.recentQuizWords)) state.recentQuizWords = [];
    state.recentQuizWords = [...state.recentQuizWords.filter(id => id !== ref.id), ref.id].slice(-30);
  }
  function renderQuiz(event) {
    const q = event?.quiz;
    if (!event || !q) return;
    if (q.completed) { renderOutcome(event); return; }
    if (q.index >= q.queue.length) { finishQuiz(event); return; }
    const ref = q.queue[q.index], words = typeof globalThis.loadUserWords === 'function' ? loadUserWords() : [], word = words.find(w => w.id === ref.id);
    if (!word) { q.index++; save(); renderQuiz(event); return; }
    recordWordShown(ref, stateNow(), q);
    const question = ref.askTrToEn ? String(word.tr || '').split(',')[0].trim() : word.en, answer = ref.askTrToEn ? word.en : word.tr;
    let example = '';
    if (word.example) {
      if (ref.askTrToEn && typeof globalThis.llMaskAnswerInExample === 'function') example = llMaskAnswerInExample(word.example, word.en);
      else example = word.example;
    }
    const exampleHtml = example && typeof globalThis.llExampleSentenceHtml === 'function' ? llExampleSentenceHtml(word, example, `talent-${q.index}-${word.id}`) : '';
    const questionHtml = ref.askTrToEn ? esc(question) : `<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml === 'function' ? llEnglishWordHtml(word, question) : esc(question)}</span>${typeof globalThis.llPronounceButton === 'function' ? llPronounceButton(word.en) : ''}</div>`;
    const answerHtml = ref.askTrToEn ? `<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml === 'function' ? llEnglishWordHtml(word, answer) : esc(answer)}</span>${typeof globalThis.llPronounceButton === 'function' ? llPronounceButton(word.en) : ''}</div>` : esc(answer);
    const fullExampleHtml = q.revealed && typeof globalThis.llFullExampleSentenceHtml === 'function' ? llFullExampleSentenceHtml(word) : '';
    const pct = (q.index / WORD_COUNT) * 100;
    area().innerHTML = `<div class="ll-shell ll-quiz-card"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Yetenek <em>Avı</em></div><div class="ll-muted">${positionIcon(event.position)} ${esc(event.position)} · ${q.index + 1}/${WORD_COUNT} · 14 doğru ve üzeri kart ödülü</div></div><div class="ll-stars">Doğru: ${q.correct}/${WORD_COUNT}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-question" onclick="llTalentReveal()"><div><div class="ll-position">${ref.askTrToEn ? 'TÜRKÇE → İNGİLİZCE' : 'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${q.revealed ? `<div class="ll-answer">${answerHtml}${fullExampleHtml}</div>` : '<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${q.revealed ? '' : 'opacity:.35;pointer-events:none'}"><button type="button" class="ll-btn danger" data-quiz-answer="unknown" onclick="llTalentRate(false)">✗ Bilmiyorum</button><button type="button" class="ll-btn primary" data-quiz-answer="known" onclick="llTalentRate(true)">✓ Bildim</button></div><button class="ll-btn ll-talent-quiz-exit" onclick="llTalentAbandon()">Yetenek Avından Çık · Normal Sınava Geç</button></div></div>`;
    area().querySelector('.ll-shell.ll-quiz-card')?.classList.add('ll-legend-quiz-theme');
    try { if (typeof globalThis.markNewWordFrame === 'function') markNewWordFrame(word, area().querySelector('.ll-question')); } catch {}
  }
  function startQuiz(event, position) {
    if (!event || !positions().includes(position)) return;
    if (event.quiz?.queue?.length === WORD_COUNT) { event.position = event.position || position; event.status = 'accepted'; save(); renderQuiz(event); return; }
    const queue = typeof globalThis.llPickQuizWords === 'function' ? llPickQuizWords(WORD_COUNT) : [];
    if (queue.length < WORD_COUNT) { alert(`Yetenek Avı için ${WORD_COUNT} kullanılabilir kelime gerekiyor. Mevcut: ${queue.length}. Hak harcanmadı.`); renderPositionChoice(event); return; }
    event.position = position;
    event.status = 'accepted';
    event.acceptedAt = new Date().toISOString();
    event.quiz = { queue, index: 0, correct: 0, revealed: false, completed: false, shown: 0, recoveryBonus: 0, recoveredWords: 0 };
    save(); renderQuiz(event);
  }
  function rateQuiz(correct) {
    const state = stateNow(), event = currentEvent(state), q = event?.quiz;
    if (!state || !event || !q || !q.revealed || q.completed || q.answerBusy) return;
    const answerIndex = num(q.index), ref = q.queue?.[answerIndex];
    if (!ref) return;
    q.answerBusy = true;
    if (correct) q.correct = num(q.correct) + 1;
    q.index = answerIndex + 1; q.shown = num(q.shown) + 1; q.revealed = false;
    try { globalThis.llRecordSeasonVocabularyAnswer?.({ correct: !!correct, fixture: fixtureNow(), quiz: q, answerIndex, eventType: 'talent' }); } catch (error) { try { globalThis.llQuizDiagnostic?.('talent_season_vocabulary_error', { question: answerIndex + 1, wordId: ref.id || null, message: String(error?.message || error) }); } catch {} }
    try { if (typeof globalThis.llPersistQuizWordRating === 'function') llPersistQuizWordRating(ref, q, !!correct, { markUsed: false }); } catch (error) { try { globalThis.llQuizDiagnostic?.('talent_quiz_answer_error', { question: answerIndex + 1, wordId: ref.id || null, message: String(error?.message || error) }); } catch {} }
    try { markWordUsed(ref, state); } catch {}
    q.answerBusy = false; save();
    if (q.index >= q.queue.length) finishQuiz(event); else renderQuiz(event);
  }
  function quizApPerWord() { try { return typeof globalThis.llQuizApPerWord === 'function' ? num(llQuizApPerWord(), 5) : 5; } catch { return 5; } }

  function eligibleRewardCards(state, position, targetRarity) {
    const team = playerTeamState(state), owned = new Set(Object.values(team?.cards || {}).filter(Boolean));
    const record = ensureSystem(state), claimed = new Set(record?.claimedCardIds || []);
    const base = cardPool().filter(card => card && card.position === position && !card.upgradeOnly && !card.clubCard && !owned.has(card.id) && !claimed.has(card.id));
    const exact = base.filter(card => card.rarity === targetRarity);
    if (exact.length) return exact;
    const targetRank = rarityRank(targetRarity);
    for (let rank = targetRank - 1; rank >= 1; rank--) {
      const pool = base.filter(card => rarityRank(card.rarity) === rank);
      if (pool.length) return pool;
    }
    for (let rank = targetRank + 1; rank <= 4; rank++) {
      const pool = base.filter(card => rarityRank(card.rarity) === rank);
      if (pool.length) return pool;
    }
    return [];
  }
  function pickRewardCard(state, position, targetRarity) {
    const pool = eligibleRewardCards(state, position, targetRarity);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  function finishQuiz(event) {
    const state = stateNow(), q = event?.quiz;
    if (!state || !event || !q || q.completed) return;
    q.completed = true; q.totalAnswered = q.index;
    const earned = num(q.correct) * quizApPerWord() + num(q.recoveryBonus);
    state.ap = num(state.ap) + earned; q.apEarned = earned;
    const outcome = outcomeForCorrect(q.correct);
    const card = outcome.rarity ? pickRewardCard(state, event.position, outcome.rarity) : null;
    event.reward = {
      level: outcome.level,
      requestedRarity: outcome.rarity,
      cardId: card?.id || null,
      actualRarity: card?.rarity || null,
      claimed: false,
      skipped: false
    };
    event.status = card ? 'reward-pending' : 'completed';
    event.completedAt = new Date().toISOString();
    if (state.achievementStats) { state.achievementStats.words = num(state.achievementStats.words) + num(q.correct); state.achievementStats.corrections = num(state.achievementStats.corrections) + num(q.recoveredWords); }
    save(); renderOutcome(event);
  }
  function cardDetailHtml(card) {
    if (!card) return '';
    let readable = { trigger: card.trigger || '', effect: card.effect || '' };
    try { if (typeof globalThis.llCardReadableText === 'function') readable = llCardReadableText(card); } catch {}
    return `<div class="ll-talent-reward-card"><div class="ll-rarity">${esc(rarityLabel(card.rarity))}</div><div class="ll-talent-reward-name">${positionIcon(card.position)} ${esc(card.name)}</div><div class="ll-talent-reward-meta">${esc(card.position)} · Yetenek Avı kartı · 0 AP</div><div class="ll-talent-reward-copy"><b>Ne zaman çalışır:</b> ${esc(readable.trigger)}<br><b>Ne yapar:</b> ${esc(readable.effect)}</div></div>`;
  }
  function renderOutcome(event) {
    const q = event?.quiz;
    if (!event || !q) return;
    const outcome = outcomeForCorrect(q.correct), card = cardById(event.reward?.cardId), hasCard = !!card && event.status === 'reward-pending';
    const actualRank = card ? rarityRank(card.rarity) : 0;
    const tierText = outcome.level ? `${outcome.rewardTitle} · ${rarityLabel(outcome.rarity)}` : 'Kart ödülü yok';
    const fallbackNote = card && actualRank !== outcome.level ? `<div class="ll-legend-tier-note">Bu mevkide ${outcome.level}★ havuzunda uygun/tekrarsız kart kalmadığı için en yakın kullanılabilir seviye getirildi.</div>` : '';
    const rewardHtml = hasCard
      ? `${cardDetailHtml(card)}<div class="ll-legend-tier-note">Kartı Al dersen ${esc(event.position)} kart yuvasına ücretsiz eklenir ve mevcut kartın yerini alır. Geç dersen bu teklif kaybolur.</div>${fallbackNote}<div class="ll-talent-outcome-actions"><button class="ll-btn ll-legend-accept" onclick="llTalentClaimReward()">Kartı Al · 0 AP</button><button class="ll-btn ll-talent-skip" onclick="llTalentSkipReward()">Geç</button></div>`
      : `<div class="ll-legend-reward"><span>📋</span><div><b>${esc(tierText)}</b>${outcome.rarity ? 'Bu seviyede uygun ve tekrarsız bir kart bulunamadı.' : '14 doğru eşiğine ulaşılmadığı için kart çıkmadı.'}</div></div><div class="ll-talent-outcome-actions"><button class="ll-btn ll-legend-accept" onclick="llTalentContinueNormalQuiz()">Normal 10 Kelimelik Sınava Geç</button></div>`;
    area().innerHTML = `<div class="ll-shell ll-quiz-card"><div class="ll-legend-cine" style="--legend-glow:${outcome.level >= 3 ? 'rgba(232,200,112,.42)' : 'rgba(124,58,237,.30)'}"><div class="ll-legend-particles ll-talent-particles"></div><div class="ll-legend-score">SONUÇ &nbsp;<b>${q.correct} / ${WORD_COUNT}</b>&nbsp; DOĞRU</div><div class="ll-legend-cine-icon">${outcome.icon}</div><div class="ll-legend-cine-title">${esc(outcome.title)}</div><div class="ll-legend-quote">“${esc(outcome.quote)}”</div><div class="ll-legend-tier-note">${positionIcon(event.position)} ${esc(event.position)} · ${esc(tierText)} · +${num(q.apEarned)} AP</div>${rewardHtml}</div></div>`;
    setTimeout(spawnParticles, 20);
  }

  function rememberCardFamily(team, card) {
    if (!team || !card) return;
    if (!Array.isArray(team.usedCardFamilies)) team.usedCardFamilies = [];
    let family = '';
    try { family = typeof llCardFamilyName === 'function' ? llCardFamilyName(card) : String(card.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); } catch { family = String(card.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); }
    if (family && !team.usedCardFamilies.includes(family)) team.usedCardFamilies.push(family);
  }
  function claimReward() {
    const state = stateNow(), event = currentEvent(state), card = cardById(event?.reward?.cardId), team = playerTeamState(state);
    if (!state || !event || event.status !== 'reward-pending' || !card || !team || !event.position) return;
    if (!team.cards || typeof team.cards !== 'object') team.cards = {};
    const oldCard = cardById(team.cards[event.position]);
    if (oldCard) rememberCardFamily(team, oldCard);
    rememberCardFamily(team, card);
    team.cards[event.position] = card.id;
    const record = ensureSystem(state);
    if (!record.claimedCardIds.includes(card.id)) record.claimedCardIds.push(card.id);
    try { if (typeof globalThis.llDiscoverCards === 'function') llDiscoverCards([card.id]); } catch {}
    event.reward.claimed = true; event.reward.claimedAt = new Date().toISOString(); event.status = 'completed';
    save(); continueNormalQuiz();
  }
  function skipReward() {
    const event = currentEvent();
    if (!event || event.status !== 'reward-pending') return;
    event.reward.skipped = true; event.reward.skippedAt = new Date().toISOString(); event.status = 'completed';
    save(); continueNormalQuiz();
  }
  function abandonQuiz() {
    const event = currentEvent(), q = event?.quiz;
    if (!event || !q || q.completed) return;
    if (!confirm(`${q.index} / ${WORD_COUNT} soru tamamlandı. Yetenek Avı'ndan çıkarsan bu haftaki hak sona erecek ve kart ödülü kazanamayacaksın. Normal maç sınavına devam etmek istiyor musun?`)) return;
    q.abandoned = true; q.abandonedAt = new Date().toISOString(); q.totalAnswered = q.index;
    event.reward = null; event.status = 'abandoned'; event.abandonedAt = new Date().toISOString();
    save(); continueNormalQuiz();
  }
  function skipOffer() {
    const event = currentEvent();
    if (!event || !['offered', 'position-pending'].includes(event.status)) return;
    if (!confirm('Bu haftaki Yetenek Avı fırsatını geçmek istiyor musun? Bu sezon aynı haftada tekrar açılamaz.')) return;
    event.status = 'skipped'; event.skippedAt = new Date().toISOString();
    save(); continueNormalQuiz();
  }
  function continueNormalQuiz() {
    const state = stateNow(), event = currentEvent(state);
    if (!state || !event || !['completed', 'skipped', 'abandoned'].includes(event.status)) return;
    event.normalQuizStartedAt = event.normalQuizStartedAt || new Date().toISOString(); save();
    if (typeof globalThis.llStartMatchPreparation === 'function') llStartMatchPreparation();
  }
  function decorateNormalQuiz() {
    const q = globalThis.lexLeague?.quiz, root = area();
    if (!q?.talentHuntKey || !root || root.querySelector('[data-talent-sequence]')) return;
    const panel = root.querySelector('.ll-panel');
    if (panel) panel.insertAdjacentHTML('afterbegin', '<div class="ll-legend-sequence" data-talent-sequence><b>🔎 Yetenek Avı tamamlandı.</b> Şimdi normal 10 kelimelik maç sınavındasın.</div>');
  }

  function wrap(name, builder, flag = '__talentHunt') {
    const base = globalThis[name];
    if (typeof base !== 'function' || base[flag]) return false;
    const wrapped = builder(base); wrapped[flag] = true; wrapped[`${flag}Base`] = base; globalThis[name] = wrapped; return true;
  }
  function install() {
    injectStyles();
    wrap('llV2RepairState', base => function (state) { const result = base.apply(this, arguments); if (result) ensureSystem(result); return result; });
    wrap('llRenderDashboard', base => function () {
      const result = base.apply(this, arguments);
      try { decorateDashboard(); } catch (error) {
        try { globalThis.llQuizDiagnostic?.('talent_hunt_dashboard_error', { message: String(error?.message || error), week: num(stateNow()?.week), season: num(stateNow()?.season) }); } catch {}
      }
      return result;
    });
    wrap('llStartMatchPreparation', base => function () {
      const state = stateNow(), fixture = fixtureNow();
      let event = currentEvent(state);
      if (!event && isEligible(state, fixture)) event = maybeCreateEvent(state, fixture);
      if (event?.status === 'offered') { document.querySelector('[data-talent-hunt]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); return; }
      if (event?.status === 'position-pending') { renderPositionChoice(event); return; }
      if (event?.status === 'accepted' && !event.quiz?.completed) { renderQuiz(event); return; }
      if (event?.status === 'reward-pending') { renderOutcome(event); return; }
      const result = base.apply(this, arguments);
      if (globalThis.lexLeague?.quiz && event && ['completed', 'skipped', 'abandoned'].includes(event.status)) {
        lexLeague.quiz.talentHuntKey = event.key;
        if (typeof globalThis.llRenderLeagueQuiz === 'function') llRenderLeagueQuiz();
      }
      return result;
    });
    wrap('llRenderLeagueQuiz', base => function () { const result = base.apply(this, arguments); decorateNormalQuiz(); return result; });
    const state = stateNow(); if (state) ensureSystem(state);
  }

  // Public dashboard hook: league-v2 also calls this after rebuilding the dashboard.
  // This makes the offer resilient to dashboard render paths/wrapper ordering and
  // safely no-ops outside weeks 10/24 or after the event has been consumed.
  globalThis.llTalentDecorateDashboard = function () {
    try { decorateDashboard(); } catch (error) {
      try { globalThis.llQuizDiagnostic?.('talent_hunt_dashboard_error', { message: String(error?.message || error), week: num(stateNow()?.week), season: num(stateNow()?.season) }); } catch {}
    }
  };
  globalThis.llIsTalentHuntWeek = function (state = stateNow()) { return eventWeek(state); };
  globalThis.llTalentAccept = function () { const state = stateNow(), fixture = fixtureNow(); let event = currentEvent(state); if (!event) event = maybeCreateEvent(state, fixture); if (event?.status === 'offered') renderPositionChoice(event); };
  globalThis.llTalentSkipOffer = skipOffer;
  globalThis.llTalentResume = function () { const event = currentEvent(); if (!event) return; if (event.status === 'position-pending') renderPositionChoice(event); else if (event.status === 'accepted') renderQuiz(event); else if (event.status === 'reward-pending') renderOutcome(event); };
  globalThis.llTalentChoosePosition = function (position) { const event = currentEvent(); if (event?.status === 'position-pending') startQuiz(event, position); };
  globalThis.llTalentReveal = function () { const event = currentEvent(), q = event?.quiz; if (!q || q.completed) return; q.revealed = true; save(); renderQuiz(event); };
  globalThis.llTalentRate = rateQuiz;
  globalThis.llTalentAbandon = abandonQuiz;
  globalThis.llTalentClaimReward = claimReward;
  globalThis.llTalentSkipReward = skipReward;
  globalThis.llTalentContinueNormalQuiz = continueNormalQuiz;
  globalThis.llTalentHuntTestApi = { VERSION, WORD_COUNT, EVENT_WEEKS, OUTCOMES, eventWeek, eventKey, outcomeForCorrect, ensureSystem, isEligible, maybeCreateEvent, eligibleRewardCards, pickRewardCard };

  install();
  // If a career dashboard was already on screen when this module loaded, decorate it now.
  setTimeout(() => globalThis.llTalentDecorateDashboard?.(), 0);
})();
