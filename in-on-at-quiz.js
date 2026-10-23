/* IN / ON / AT Challenge: 300 unique practice cards, 8 every 7 official matches.
   Other grammar challenges have priority; collisions are deferred. */
(function (global) {
  'use strict';
  var QUESTION_COUNT = 8;
  var DUE_EVERY = 7;
  var OFFICIAL = { league: true, cup: true, playoff: true, ucl: true, uel: true, uecl: true };
  var BANK = Array.isArray(global.LL_IN_ON_AT_BANK) ? global.LL_IN_ON_AT_BANK : [];
  if (BANK.length !== 300) { throw new Error('In / On / At question bank requires exactly 300 validated questions.'); }
  function stateNow() { return global.lexLeague && global.lexLeague.state; }
  function fixtureNow() { return typeof global.llPlayerFixture === 'function' ? global.llPlayerFixture() : null; }
  function save() { if (typeof global.llSave === 'function') global.llSave(); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function officialResults(state) {
    return (state && Array.isArray(state.results) ? state.results : []).filter(function (result) {
      return result && result.userMatch !== false && OFFICIAL[String(result.competition || 'league').toLowerCase()];
    });
  }
  function isOfficial(fixture) {
    return !!fixture && OFFICIAL[String(fixture.competition || 'league').toLowerCase()];
  }
  function ensure(state) {
    if (!state) return;
    if (!Array.isArray(state.results)) state.results = [];
    if (!Number.isFinite(state.inOnAtQuizOfficialMatches)) state.inOnAtQuizOfficialMatches = officialResults(state).length;
    if (!Number.isFinite(state.inOnAtQuizCursor)) state.inOnAtQuizCursor = 0;
    if (!Array.isArray(state.inOnAtQuizDeck)) state.inOnAtQuizDeck = [];
    if (state.inOnAtQuizDeckOrderVersion !== 1) state.inOnAtQuizDeckOrderVersion = 1;
    if (!Array.isArray(state.inOnAtQuizLastTypes)) state.inOnAtQuizLastTypes = [];
    if (!state.inOnAtQuizHistory || typeof state.inOnAtQuizHistory !== 'object') state.inOnAtQuizHistory = {};
    if (!state.inOnAtQuizStats || typeof state.inOnAtQuizStats !== 'object') {
      state.inOnAtQuizStats = { shown: 0, correct: 0, wrong: 0, recovered: 0, completed: 0 };
    }
  }
  function isDue(state, fixture) {
    ensure(state);
    return !!(state && isOfficial(fixture) && (state.inOnAtQuizPending || ((state.inOnAtQuizOfficialMatches + 1) % DUE_EVERY === 0)));
  }
  function relativeClauseIsDue() {
    try {
      return !!(global.llRelativeClauseQuiz && typeof global.llRelativeClauseQuiz.isDue === 'function' && global.llRelativeClauseQuiz.isDue());
    } catch (error) {
      return false;
    }
  }
  function gerundInfinitiveIsDue() {
    try {
      return !!(global.llGerundInfinitiveQuiz && typeof global.llGerundInfinitiveQuiz.isDue === 'function' && global.llGerundInfinitiveQuiz.isDue());
    } catch (error) { return false; }
  }
  function tenseIsDue() {
    try {
      return !!(global.llTenseQuiz && typeof global.llTenseQuiz.isDue === 'function' && global.llTenseQuiz.isDue());
    } catch (error) { return false; }
  }
  function setDashboardButton() {
    var state = stateNow();
    var fixture = fixtureNow();
    if (!state || !fixture || !isDue(state, fixture) || !global.document) return;
    if (relativeClauseIsDue() || gerundInfinitiveIsDue() || tenseIsDue()) return;
    Array.prototype.forEach.call(global.document.querySelectorAll('button[onclick*="llStartMatchPreparation"]'), function (button) {
      button.textContent = '8 IN / ON / AT Testi - Ma\u00e7a Ba\u015fla';
      button.setAttribute('aria-label', '8 IN / ON / AT Testi - Ma\u00e7a Ba\u015fla');
    });
  }

  function randomIndex(length) { return Math.floor(Math.random() * length); }
  function shuffleInPlace(items) {
    for (var index = items.length - 1; index > 0; index -= 1) {
      var swapIndex = randomIndex(index + 1);
      var temporary = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = temporary;
    }
    return items;
  }
  function questionById(id) {
    for (var index = 0; index < BANK.length; index += 1) if (BANK[index].id === id) return BANK[index];
    return null;
  }
  function balancedShuffle(questions, previousTypes) {
    // Preserve answer variety without a predictable IN-ON-AT cycle. A whole-deck
    // retry avoids end-of-deck runs when the final few answer pools get depleted.
    for (var attempt = 0; attempt < 100; attempt += 1) {
      var pools = {}, result = [], history = (previousTypes || []).slice(-2);
      questions.forEach(function (item) { (pools[item.answer] || (pools[item.answer] = [])).push(item); });
      Object.keys(pools).forEach(function (key) { shuffleInPlace(pools[key]); });
      while (result.length < questions.length) {
        var available = Object.keys(pools).filter(function (key) { return pools[key].length > 0; });
        var allowed = available.filter(function (key) {
          return history.length < 2 || !(history[history.length - 1] === key && history[history.length - 2] === key);
        });
        if (!allowed.length) break; // dead end: retry the shuffle
        var highest = Math.max.apply(Math, allowed.map(function (key) { return pools[key].length; }));
        var close = allowed.filter(function (key) { return pools[key].length >= highest - 2; });
        var different = close.filter(function (key) { return history[history.length - 1] !== key; });
        // Prefer changes, but leave room for natural two-of-a-kind sequences.
        if (different.length && Math.random() < 0.80) close = different;
        var selected = close[randomIndex(close.length)];
        result.push(pools[selected].pop());
        history.push(selected);
        if (history.length > 2) history.shift();
      }
      if (result.length === questions.length) return result;
    }
    throw new Error('IN / ON / AT soru destesini karıştırırken arka arkaya üç aynı edat engellenemedi.');
  }
  function refillDeck(state) {
    var validIds = {};
    BANK.forEach(function (question) { validIds[question.id] = true; });
    state.inOnAtQuizDeck = state.inOnAtQuizDeck.filter(function (id) { return validIds[id]; });
    if (state.inOnAtQuizDeck.length >= QUESTION_COUNT) return;
    // Append a COMPLETE new 300-question cycle only when the previous cycle has
    // fewer than 8 cards remaining. The old tail is consumed first, so every
    // 300-question cycle is exhausted before any question is repeated.
    var previous = (state.inOnAtQuizLastTypes || []).slice(-2);
    state.inOnAtQuizDeck.forEach(function (id) {
      var existing = questionById(id);
      if (existing) previous.push(existing.answer);
      if (previous.length > 2) previous.shift();
    });
    var nextCycle = balancedShuffle(BANK, previous);
    state.inOnAtQuizDeck = state.inOnAtQuizDeck.concat(nextCycle.map(function (question) { return question.id; }));
  }
  function buildQueue(state) {
    refillDeck(state);
    return state.inOnAtQuizDeck.slice(0, QUESTION_COUNT).map(questionById).filter(Boolean);
  }
  function consumeQueue(state, quiz, consumed) {
    var ids = quiz.queue.slice(0, consumed).map(function (question) { return question.id; });
    ids.forEach(function (id) {
      var current = questionById(id);
      if (current) {
        state.inOnAtQuizLastTypes.push(current.answer);
        state.inOnAtQuizLastTypes = state.inOnAtQuizLastTypes.slice(-2);
      }
      var position = state.inOnAtQuizDeck.indexOf(id);
      if (position >= 0) state.inOnAtQuizDeck.splice(position, 1);
    });
  }

  function beginInOnAtQuiz(fixture) {
    var state = stateNow();
    if (!state || !fixture) return false;
    ensure(state);
    var queue = buildQueue(state);
    if (queue.length < QUESTION_COUNT) return false;
    global.lexLeague.quiz = {
      kind: 'in-on-at',
      inOnAtQuiz: true,
      queue: queue,
      index: 0,
      correct: 0,
      revealed: false,
      committed: false,
      recoveredQuestions: 0,
      recoveryBonus: 0,
      skipped: false,
      startCursor: state.inOnAtQuizCursor,
      fixture: Object.assign({}, fixture)
    };
    state.inOnAtQuizPending = false;
    save();
    global.llRenderLeagueQuiz();
    return true;
  }

  function renderGrammarCard(content, extraClass) {
    if (typeof global.llSetWide === 'function') global.llSetWide(false);
    global.llArea().innerHTML =
      '<div class="ll-shell ll-quiz-card ll-relative-quiz ll-in-on-at-quiz ' + (extraClass || '') + '">' +
        '<div class="ll-panel ll-relative-quiz-panel">' + content + '</div>' +
      '</div>';
    return true;
  }

  function renderInOnAtQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.inOnAtQuiz || !global.llArea) return false;
    var current = quiz.queue[quiz.index];
    if (!current) return false;
    var history = (stateNow().inOnAtQuizHistory || {})[current.id] || {};
    var revealed = !!quiz.revealed;
    var prompt = esc(current.sentence).replace('______', '<strong class="ll-relative-blank">______</strong>');
    var answer = revealed ? (
      '<div class="ll-answer">' +
        '<b>Doğru edat:</b> ' + esc(current.answer.toUpperCase()) +
        '<div class="ll-grammar-full-en"><b>Konu:</b> ' + esc(current.categoryLabel) + '</div>' +
        '<div class="ll-grammar-full-en"><b>Tam cümle:</b> ' + esc(current.full) + '</div>' +
        '<div class="ll-grammar-translation"><b>Türkçesi:</b> ' + esc(current.fullTr) + '</div>' +
        '<small class="ll-relative-rule-tr"><b>Neden bu edat?</b> ' + esc(current.explanationTr) + '</small>' +
      '</div>'
    ) : '<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>';
    var questionHtml =
      '<div class="ll-topbar"><div><div class="ll-title">In / On / At <em>Challenge</em></div>' +
        '<div class="ll-muted">' + (quiz.index + 1) + '/8 · Her doğru 7 AP · 7/8: reroll · 8/8: reroll + maçlık +1</div></div>' +
        '<div class="ll-stars">Doğru: ' + quiz.correct + '/8' + (quiz.recoveredQuestions ? ' · Geri kazanım: ' + quiz.recoveredQuestions : '') + '</div></div>' +
        '<div class="ll-progress"><div style="width:' + ((quiz.index / QUESTION_COUNT) * 100) + '%"></div></div>' +
        '<div class="ll-question" onclick="llRevealQuiz()"><div>' +
        '<div class="ll-position">EDAT · IN / ON / AT</div>' +
        '<div class="ll-question-word">' + prompt + '</div>' + answer +
        (history.wrong && !revealed ? '<div class="ll-notice" style="margin-top:16px;text-align:left">Daha önce yanlış: bu kez doğru bilirsen +4 AP geri kazanırsın.</div>' : '') +
        '</div></div>' +
        '<div class="ll-quiz-actions" style="' + (revealed ? '' : 'opacity:.35;pointer-events:none') + '">' +
        '<button type="button" class="ll-btn danger" onclick="llRateLeagueQuiz(false)">✕ Bilmiyorum</button>' +
        '<button type="button" class="ll-btn primary" onclick="llRateLeagueQuiz(true)">✓ Bildim</button></div>' +
        '<button class="ll-btn" style="width:100%;margin-top:10px" onclick="llSkipLeagueQuiz()">Geç · ' + quiz.index + ' cevap üzerinden puanı al ve maça devam et</button>' +
      '</div>';
    return renderGrammarCard(questionHtml, 'll-relative-question-card ll-in-on-at-question-card');
  }

  function revealInOnAtQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.inOnAtQuiz) return false;
    quiz.revealed = true;
    global.llRenderLeagueQuiz();
    return true;
  }

  function rateInOnAtQuiz(correct) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.inOnAtQuiz || !quiz.revealed || quiz.committed) return false;
    ensure(state);
    var question = quiz.queue[quiz.index];
    var record = state.inOnAtQuizHistory[question.id] || { seen: 0, wrong: false, correct: 0 };
    record.seen += 1;
    if (correct) {
      quiz.correct += 1;
      state.inOnAtQuizStats.correct += 1;
      if (record.wrong) {
        quiz.recoveredQuestions += 1;
        quiz.recoveryBonus += 4;
        state.inOnAtQuizStats.recovered += 1;
        record.wrong = false;
      }
      record.correct += 1;
    } else {
      record.wrong = true;
      state.inOnAtQuizStats.wrong += 1;
    }
    state.inOnAtQuizStats.shown += 1;
    state.inOnAtQuizHistory[question.id] = record;
    quiz.index += 1;
    quiz.revealed = false;
    save();
    if (quiz.index >= QUESTION_COUNT) return finishInOnAtQuiz(false);
    global.llRenderLeagueQuiz();
    return true;
  }

  function finishInOnAtQuiz(skipped) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.inOnAtQuiz || quiz.committed) return false;
    ensure(state);
    quiz.committed = true;
    quiz.skipped = !!skipped;
    quiz.completed = !skipped && quiz.index >= QUESTION_COUNT;
    quiz.apEarned = (quiz.correct * 7) + quiz.recoveryBonus;
    state.ap = (Number(state.ap) || 0) + quiz.apEarned;
    if (quiz.completed) {
      state.inOnAtQuizStats.completed += 1;
      if (quiz.correct === 8) quiz.reward = 'perfect';
      else if (quiz.correct === 7) quiz.reward = 'reroll';
      else quiz.reward = 'none';
    } else quiz.reward = 'none';

    var consumed = quiz.completed ? QUESTION_COUNT : quiz.index;
    consumeQueue(state, quiz, consumed);
    state.inOnAtQuizCursor = (quiz.startCursor + consumed) % BANK.length;
    save();
    global.llRenderQuizReward();
    return true;
  }

  function skipInOnAtQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.inOnAtQuiz) return false;
    if (typeof global.confirm === 'function' && !global.confirm('IN / ON / AT Challenge s\u0131nav\u0131n\u0131 burada bitirmek istiyor musun? Mevcut do\u011frular\u0131n AP\'si verilir.')) return false;
    return finishInOnAtQuiz(true);
  }

  function renderInOnAtQuizReward() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.inOnAtQuiz || !quiz.committed || !global.llArea) return false;
    var answered = Math.max(0, Math.min(QUESTION_COUNT, Number(quiz.index || 0)));
    var recoveryAp = Number(quiz.recoveryBonus || 0);
    var rerollReady = quiz.reward === 'reroll' || quiz.reward === 'perfect';
    var icon = quiz.reward === 'perfect' ? '\ud83c\udfc6' : quiz.reward === 'reroll' ? '\ud83c\udfaf' : quiz.skipped ? '\u23ed\ufe0f' : '\ud83d\udcda';
    var metricsColumns = recoveryAp > 0 ? 'repeat(3,1fr)' : '1fr 1fr';
    var metricsWidth = recoveryAp > 0 ? '600px' : '420px';
    var notice;
    var action;

    if (quiz.skipped) {
      notice = answered + ' IN / ON / AT Challenge cevab\u0131n\u0131n AP \u00f6d\u00fcl\u00fc hesab\u0131na i\u015flendi. Cevaplanmayan sorular sonraki IN / ON / AT Challenge ma\u00e7lar\u0131nda yeniden gelebilir.';
    } else if (quiz.reward === 'perfect') {
      notice = 'Kusursuz 8/8! 1 reroll ve se\u00e7ece\u011fin mevkiye bu ma\u00e7 i\u00e7in +1 kazand\u0131n.';
    } else if (quiz.reward === 'reroll') {
      notice = '7/8 do\u011fru ile bu ma\u00e7 i\u00e7in 1 reroll kazand\u0131n.';
    } else {
      notice = 'Reroll \u00f6d\u00fcl\u00fc i\u00e7in 7 do\u011fru gerekiyordu. Kazand\u0131\u011f\u0131n AP hesab\u0131na i\u015flendi.';
    }
    if (recoveryAp > 0) notice += ' Daha \u00f6nce yanl\u0131\u015f bildi\u011fin sorular\u0131 d\u00fczeltti\u011fin i\u00e7in +' + recoveryAp + ' AP geri kazan\u0131m ald\u0131n.';

    if (quiz.reward === 'perfect') {
      var roles = [
        ['Kaleci', '\ud83e\udde4 Kaleci'],
        ['Orta Saha', '\u2699\ufe0f Orta Saha'],
        ['Forvet', '\u26bd Forvet']
      ];
      action = '<div class="ll-card-title" style="margin-top:20px">+1 Uygulanacak Zar\u0131 Se\u00e7</div><div class="ll-squad">' +
        roles.map(function (role) {
          return '<button type="button" class="ll-team-option" onclick="llBeginMatch(\'' + role[0] + '\')">' +
            '<div class="ll-team-name">' + role[1] + '</div>' +
            '<div class="ll-range">Bu ma\u00e7 zar sonucuna +1 \u00b7 1 reroll ayr\u0131ca haz\u0131r</div>' +
            '</button>';
        }).join('') + '</div>';
    } else {
      action = '<button type="button" class="ll-btn primary" style="margin-top:18px" onclick="llBeginMatch(null)">Zar D\u00fcellosuna Ge\u00e7</button>';
    }

    var rewardHtml =
      '<div style="font-size:52px">' + icon + '</div>' +
        '<div class="quiz-start-title" style="margin-top:8px">' + quiz.correct + '/' + answered + ' <em>Do\u011fru</em></div>' +
        '<div class="ll-metrics" style="grid-template-columns:' + metricsColumns + ';max-width:' + metricsWidth + ';margin:18px auto">' +
        '<div class="ll-metric"><strong>+' + Number(quiz.apEarned || 0) + '</strong><span>Toplam AP</span></div>' +
        (recoveryAp > 0 ? '<div class="ll-metric"><strong>+' + recoveryAp + '</strong><span>Hata Geri Kazan\u0131m AP</span></div>' : '') +
        '<div class="ll-metric"><strong>' + (rerollReady ? '1' : '0') + '</strong><span>Reroll</span></div></div>' +
        '<div class="ll-notice" style="text-align:left">' + notice + '</div>' +
        '<div class="ll-relative-result-actions">' + action + '</div>';
    return renderGrammarCard(rewardHtml, 'll-relative-result-card ll-in-on-at-result-card');
  }

  function wrap(name, replacement) {
    var base = global[name];
    if (typeof base !== 'function') return;
    global[name] = replacement(base);
  }

  function install() {
    wrap('llStartMatchPreparation', function (baseStart) {
      return function () {
        var state = stateNow();
        var fixture = fixtureNow();
        var due = state && fixture && isDue(state, fixture);
        var previousSuppress = global.llSuppressNormalQuizRender;
        if (due) global.llSuppressNormalQuizRender = true;
        var output;
        try { output = baseStart.apply(this, arguments); }
        finally { global.llSuppressNormalQuizRender = previousSuppress; }
        var quiz = global.lexLeague && global.lexLeague.quiz;

        if (due && quiz && (quiz.relativeClause || quiz.gerundInfinitive || quiz.tenseQuiz)) {
          ensure(state);
          state.inOnAtQuizPending = true;
          save();
        } else if (due && quiz && !quiz.inOnAtQuiz && isOfficial(quiz.fixture || fixture)) {
          beginInOnAtQuiz(quiz.fixture || fixture);
        } else if (due && (!quiz || !quiz.inOnAtQuiz)) {
          ensure(state);
          state.inOnAtQuizPending = true;
          save();
        }
        setDashboardButton();
        return output;
      };
    });

    wrap('llRenderDashboard', function (baseRenderDashboard) {
      return function () {
        var output = baseRenderDashboard.apply(this, arguments);
        setDashboardButton();
        return output;
      };
    });
    wrap('llRenderLeagueQuiz', function (baseRender) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return renderInOnAtQuiz();
        return baseRender.apply(this, arguments);
      };
    });
    wrap('llRevealQuiz', function (baseReveal) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return revealInOnAtQuiz();
        return baseReveal.apply(this, arguments);
      };
    });
    wrap('llRateLeagueQuiz', function (baseRate) {
      return function (correct) {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return rateInOnAtQuiz(!!correct);
        return baseRate.apply(this, arguments);
      };
    });
    wrap('llSkipLeagueQuiz', function (baseSkip) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return skipInOnAtQuiz();
        return baseSkip.apply(this, arguments);
      };
    });
    wrap('llFinishLeagueQuiz', function (baseFinish) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return finishInOnAtQuiz(false);
        return baseFinish.apply(this, arguments);
      };
    });
    wrap('llRenderQuizReward', function (baseReward) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.inOnAtQuiz) return renderInOnAtQuizReward();
        return baseReward.apply(this, arguments);
      };
    });
    wrap('llCommitCurrentMatch', function (baseCommit) {
      return function () {
        var state = stateNow();
        var fixture = global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.fixture || fixtureNow();
        var before = state ? officialResults(state).length : 0;
        var output = baseCommit.apply(this, arguments);
        if (state && isOfficial(fixture) && officialResults(state).length > before) {
          ensure(state);
          state.inOnAtQuizOfficialMatches = Math.max(state.inOnAtQuizOfficialMatches + 1, officialResults(state).length);
          save();
        }
        return output;
      };
    });
    setDashboardButton();
  }

  global.LL_IN_ON_AT_BANK = BANK;
  global.llInOnAtQuiz = {
    version: 1,
    questionCount: QUESTION_COUNT,
    dueEvery: DUE_EVERY,
    bankSize: BANK.length,
    isDue: function () { return isDue(stateNow(), fixtureNow()); },
    buildQueueForTest: function (state) { ensure(state); return buildQueue(state); }
  };
  install();
})(window);
