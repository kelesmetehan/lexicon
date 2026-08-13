/* Relative Clause match quiz. Kept separate from vocabulary statistics. */
(function (global) {
  'use strict';

  var QUESTION_COUNT = 8;
  var OFFICIAL = { league: true, cup: true, playoff: true, ucl: true, uel: true, uecl: true };
  var BANK_ROWS = [
    ['RC001','The player ______ scored the winning goal in the 89th minute was named man of the match.','who',null,'Use who for a person.'],
    ['RC002','Galatasaray is the club ______ has won the most Super Lig titles in history.','which',null,'Use which or that for a club or thing.'],
    ['RC003','The striker ______ the manager signed last summer has already scored 12 goals.','that',null,'That or who is possible as the object; that is the preferred answer.'],
    ['RC004','The free kick ______ Messi took from 30 yards went straight into the top corner.','which',null,'Use which or that for a thing.'],
    ['RC005','The coach ______ led the team to the championship resigned two weeks later.','who',null,'Use who for a person.'],
    ['RC006','The young talent ______ everyone is talking about is only 17 years old.','that',null,'That or who is possible as the object; that is the preferred answer.'],
    ['RC007','The trophy ______ we lifted last season is now in the club museum.','which',null,'Use which or that for a thing.'],
    ['RC008','The defender ______ mistake cost us the game apologized after the match.','whose',null,'Use whose for possession.'],
    ['RC009','The scientist ______ discovered penicillin changed the course of medicine.','who',null,'Use who for a person.'],
    ['RC010','I have a neighbor ______ plays the violin every evening.','who',null,'Use who for a person.'],
    ['RC011','The man ______ you met yesterday is my uncle.','who',null,'Who, whom, or that can be used as the object; who is the preferred answer.'],
    ['RC012','The novel ______ she wrote last year became a bestseller.','which',null,'Use which or that for a thing.'],
    ['RC013','This is the restaurant ______ serves the best seafood in town.','which',null,'Use which or that for a thing.'],
    ['RC014','The students ______ finish early can leave the classroom.','who',null,'Use who for people.'],
    ['RC015','My laptop, ______ I bought two years ago, still works perfectly.','which',null,'A non-defining clause uses which, not that.'],
    ['RC016','Istanbul, ______ connects two continents, is a city full of history.','which',null,'A non-defining clause about a thing uses which.'],
    ['RC017','My brother, ______ lives in Germany, is visiting us next month.','who',null,'A non-defining clause about a person uses who.'],
    ['RC018','The decision ______ the referee made in the 90th minute changed the game.','which',null,'Use which or that for a thing.'],
    ['RC019','The midfielder ______ vision and passing range are incredible is the heart of the team.','whose',null,'Use whose for possession.'],
    ['RC020','The letter ______ was written in French was hard to understand.','which',null,'Use which or that for a thing.'],
    ['RC021','The player ______ contract expires in June has already attracted interest from Europe.','whose',null,'Use whose for possession.'],
    ['RC022','That is the pitch ______ the team trains every morning.','where',null,'Use where for a place.'],
    ['RC023','2005 was the year ______ Istanbul became the center of the football world.','when',null,'Use when for time.'],
    ['RC024','The city ______ the final will be played has prepared an amazing atmosphere.','where',null,'Use where for a place.'],
    ['RC025','The goalkeeper ______ reflexes saved us today is one of the best in the league.','whose',null,'Use whose for possession.'],
    ['RC026','I still remember the moment ______ the referee blew the final whistle.','when',null,'Use when for time.'],
    ['RC027','The club ______ academy produces so many national team players is truly special.','whose',null,'Use whose for possession.'],
    ['RC028','This is the village ______ my grandmother was born.','where',null,'Use where for a place.'],
    ['RC029','The cafe ______ we first met has closed down.','where',null,'Use where for a place.'],
    ['RC030','I still remember the day ______ we graduated.','when',null,'Use when for time.'],
    ['RC031','Summer is the season ______ tourists flood this city.','when',null,'Use when for time.'],
    ['RC032','Nobody knows the reason ______ he left so suddenly.','why',null,'Use why after reason.'],
    ['RC033','The artist ______ paintings are exhibited here lives in Paris.','whose',null,'Use whose for possession.'],
    ['RC034','I know a girl ______ father is a famous director.','whose',null,'Use whose for possession.'],
    ['RC035','The man ______ is standing by the window is my boss.','who',null,'Use who for a person.'],
    ['RC036','The winger is very fast. He scored a hat-trick last week.','who','The winger who scored a hat-trick last week is very fast.','Combine the two sentences with who.'],
    ['RC037','This is the jersey. Ronaldo wore it in the final.','which','This is the jersey which Ronaldo wore in the final.','Use which or that for a thing.'],
    ['RC038','The manager was angry with the player. The player arrived late to training.','who','The manager was angry with the player who arrived late to training.','Use who for a person.'],
    ['RC039','We visited the stadium. The 2005 Champions League final was played there.','where','We visited the stadium where the 2005 Champions League final was played.','Use where for a place.'],
    ['RC040','The captain lifted the trophy. His leadership inspired the whole team.','whose','The captain whose leadership inspired the whole team lifted the trophy.','Use whose for possession.'],
    ['RC041','That was the match. Everything changed after that match.','when','That was the match when everything changed.','Use when for time.'],
    ['RC042','The young full-back is only 18. His performances have been outstanding.','whose','The young full-back whose performances have been outstanding is only 18.','Use whose for possession.'],
    ['RC043','This is the pass. It created the winning goal.','which','This is the pass which created the winning goal.','Use which or that for a thing.'],
    ['RC044','The woman is a famous journalist. You saw her on television.','who','The woman who you saw on television is a famous journalist.','Who, whom, or that can be used as the object; who is the preferred answer.'],
    ['RC045','I have a friend. His brother plays for Barcelona.','whose','I have a friend whose brother plays for Barcelona.','Use whose for possession.'],
    ['RC046','This is the hotel. We stayed there last summer.','where','This is the hotel where we stayed last summer.','Use where for a place.'],
    ['RC047','The book is on the table. I bought it yesterday.','which','The book which I bought yesterday is on the table.','Use which or that for a thing.'],
    ['RC048','The teacher was very kind. She helped me a lot.','who','The teacher who helped me a lot was very kind.','Use who for a person.'],
    ['RC049','The player to ______ the free kick was given scored directly from it.','whom',null,'After a formal preposition, use whom.'],
    ['RC050','The coach, ______ had never won a title before, finally lifted the trophy.','who',null,'A non-defining clause about a person uses who.'],
    ['RC051','The stadium in ______ the final was held holds more than 75,000 people.','which',null,'In which means where in this formal structure.'],
    ['RC052','The striker with ______ I used to play is now at a Champions League club.','whom',null,'After a formal preposition, use whom.'],
    ['RC053','My favorite player, ______ is known for his work rate, never stops running.','who',null,'A non-defining clause about a person uses who.'],
    ['RC054','The academy from ______ so many stars have emerged is world famous.','which',null,'Use which after the formal preposition from.'],
    ['RC055','The night on ______ we won the league will never be forgotten.','which',null,'On which means when in this formal structure.'],
    ['RC056','The club, ______ fans are known as the most passionate, sold out every home game.','whose',null,'Use whose for possession.']
  ];
  var BANK = BANK_ROWS.map(function (row) {
    return { id: row[0], sentence: row[1], answer: row[2], full: row[3] || row[1].replace('______', row[2]), explanation: row[4] };
  });

  function stateNow() { return global.lexLeague && global.lexLeague.state; }
  function fixtureNow() { return typeof global.llPlayerFixture === 'function' ? global.llPlayerFixture() : null; }
  function save() { if (typeof global.llSave === 'function') global.llSave(); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function ensure(state) {
    if (!state) return;
    if (!Array.isArray(state.results)) state.results = [];
    if (!Number.isFinite(state.relativeClauseOfficialMatches)) state.relativeClauseOfficialMatches = officialResults(state).length;
    if (!Number.isFinite(state.relativeClauseCursor)) state.relativeClauseCursor = 0;
    if (!state.relativeClauseHistory || typeof state.relativeClauseHistory !== 'object') state.relativeClauseHistory = {};
    if (!state.relativeClauseStats || typeof state.relativeClauseStats !== 'object') {
      state.relativeClauseStats = { shown: 0, correct: 0, wrong: 0, recovered: 0, completed: 0 };
    }
  }
  function officialResults(state) {
    return (state && Array.isArray(state.results) ? state.results : []).filter(function (result) {
      return result && result.userMatch !== false && OFFICIAL[String(result.competition || 'league').toLowerCase()];
    });
  }
  function isOfficial(fixture) {
    return !!fixture && OFFICIAL[String(fixture.competition || 'league').toLowerCase()];
  }
  function isDue(state, fixture) {
    ensure(state);
    return !!(state && isOfficial(fixture) && (state.relativeClausePending || ((state.relativeClauseOfficialMatches + 1) % 5 === 0)));
  }
  function setDashboardButton() {
    var state = stateNow();
    var fixture = fixtureNow();
    if (!state || !fixture || !isDue(state, fixture) || !global.document) return;
    Array.prototype.forEach.call(global.document.querySelectorAll('button[onclick*="llStartMatchPreparation"]'), function (button) {
      button.textContent = '8 Relative Clause - Ma\u00e7a Ba\u015fla';
      button.setAttribute('aria-label', '8 Relative Clause - Ma\u00e7a Ba\u015fla');
    });
  }
  function buildQueue(state) {
    var start = ((state.relativeClauseCursor % BANK.length) + BANK.length) % BANK.length;
    var output = [];
    for (var index = 0; index < QUESTION_COUNT; index += 1) output.push(BANK[(start + index) % BANK.length]);
    return output;
  }
  function beginRelativeQuiz(fixture) {
    var state = stateNow();
    if (!state || !fixture) return false;
    ensure(state);
    var queue = buildQueue(state);
    global.lexLeague.quiz = {
      kind: 'relative-clause',
      relativeClause: true,
      queue: queue,
      index: 0,
      correct: 0,
      revealed: false,
      committed: false,
      recoveredQuestions: 0,
      recoveryBonus: 0,
      skipped: false,
      startCursor: state.relativeClauseCursor,
      fixture: Object.assign({}, fixture)
    };
    state.relativeClausePending = false;
    save();
    global.llRenderLeagueQuiz();
    return true;
  }

  function renderRelativeQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.relativeClause || !global.llArea) return false;
    var current = quiz.queue[quiz.index];
    if (!current) return false;
    var history = (stateNow().relativeClauseHistory || {})[current.id] || {};
    var revealed = !!quiz.revealed;
    var prompt = esc(current.sentence).replace('______', '<strong class="ll-relative-blank">______</strong>');
    var answer = revealed ? (
      '<div class="ll-answer"><b>' + esc(current.answer) + '</b><div>' + esc(current.full) + '</div>' +
      '<small>' + esc(current.explanation) + '</small></div>'
    ) : '<div class="ll-muted" style="margin-top:25px">Cevab\u0131 a\u00e7mak i\u00e7in karta t\u0131kla</div>';
    global.llArea().innerHTML =
      '<div class="ll-shell ll-quiz-card ll-relative-quiz"><div class="ll-panel">' +
      '<div class="ll-topbar"><div><div class="ll-title">Relative Clause <em>Ma\u00e7\u0131</em></div>' +
      '<div class="ll-muted">' + (quiz.index + 1) + '/8 \u00b7 Her do\u011fru 7 AP \u00b7 7/8: reroll \u00b7 8/8: reroll + ma\u00e7l\u0131k +1</div></div>' +
      '<div class="ll-stars">Do\u011fru: ' + quiz.correct + '/8' + (quiz.recoveredQuestions ? ' \u00b7 Geri kazan\u0131m: ' + quiz.recoveredQuestions : '') + '</div></div>' +
      '<div class="ll-progress"><div style="width:' + ((quiz.index / QUESTION_COUNT) * 100) + '%"></div></div>' +
      '<div class="ll-question" onclick="llRevealQuiz()"><div>' +
      '<div class="ll-position">RELATIVE CLAUSE</div>' +
      '<div class="ll-question-word">' + prompt + '</div>' + answer +
      (history.wrong && !revealed ? '<div class="ll-notice" style="margin-top:16px;text-align:left">Daha \u00f6nce yanl\u0131\u015f: bu kez do\u011fru bilirsen +4 AP geri kazan\u0131rs\u0131n.</div>' : '') +
      '</div></div>' +
      '<div class="ll-quiz-actions" style="' + (revealed ? '' : 'opacity:.35;pointer-events:none') + '">' +
      '<button type="button" class="ll-btn danger" onclick="llRateLeagueQuiz(false)">\u2715 Bilmiyorum</button>' +
      '<button type="button" class="ll-btn primary" onclick="llRateLeagueQuiz(true)">\u2713 Bildim</button></div>' +
      '<button class="ll-btn" style="width:100%;margin-top:10px" onclick="llSkipLeagueQuiz()">Ge\u00e7 \u00b7 ' + quiz.index + ' cevap \u00fczerinden puan\u0131 al ve ma\u00e7a devam et</button>' +
      '</div></div>';
    return true;
  }
  function revealRelativeQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.relativeClause) return false;
    quiz.revealed = true;
    global.llRenderLeagueQuiz();
    return true;
  }
  function rateRelativeQuiz(correct) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.relativeClause || !quiz.revealed || quiz.committed) return false;
    ensure(state);
    var question = quiz.queue[quiz.index];
    var record = state.relativeClauseHistory[question.id] || { seen: 0, wrong: false, correct: 0 };
    record.seen += 1;
    if (correct) {
      quiz.correct += 1;
      state.relativeClauseStats.correct += 1;
      if (record.wrong) {
        quiz.recoveredQuestions += 1;
        quiz.recoveryBonus += 4;
        state.relativeClauseStats.recovered += 1;
        record.wrong = false;
      }
      record.correct += 1;
    } else {
      record.wrong = true;
      state.relativeClauseStats.wrong += 1;
    }
    state.relativeClauseStats.shown += 1;
    state.relativeClauseHistory[question.id] = record;
    quiz.index += 1;
    quiz.revealed = false;
    save();
    if (quiz.index >= QUESTION_COUNT) return finishRelativeQuiz(false);
    global.llRenderLeagueQuiz();
    return true;
  }
  function finishRelativeQuiz(skipped) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.relativeClause || quiz.committed) return false;
    ensure(state);
    quiz.committed = true;
    quiz.skipped = !!skipped;
    quiz.completed = !skipped && quiz.index >= QUESTION_COUNT;
    quiz.apEarned = (quiz.correct * 7) + quiz.recoveryBonus;
    state.ap = (Number(state.ap) || 0) + quiz.apEarned;
    if (quiz.completed) {
      state.relativeClauseStats.completed += 1;
      if (quiz.correct === 8) quiz.reward = 'perfect';
      else if (quiz.correct === 7) quiz.reward = 'reroll';
      else quiz.reward = 'none';
    } else quiz.reward = 'none';
    // Normal kelime sinavindaki gibi "Burada Birak" ile cevaplanmayan
    // maddeleri harcama: sonraki Relative Clause turunda tekrar gorulebilirler.
    var consumed = quiz.completed ? QUESTION_COUNT : quiz.index;
    state.relativeClauseCursor = (quiz.startCursor + consumed) % BANK.length;
    save();
    global.llRenderQuizReward();
    return true;
  }
  function skipRelativeQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.relativeClause) return false;
    if (typeof global.confirm === 'function' && !global.confirm('Relative Clause s\u0131nav\u0131n\u0131 burada bitirmek istiyor musun? Mevcut do\u011frular\u0131n AP\'si verilir.')) return false;
    return finishRelativeQuiz(true);
  }
  function renderRelativeReward() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.relativeClause || !quiz.committed || !global.llArea) return false;
    var extra = quiz.recoveryBonus ? ' + ' + quiz.recoveryBonus + ' AP hata geri kazan\u0131m\u0131' : '';
    var next = '';
    if (quiz.reward === 'perfect') {
      var roles = [['Kaleci','\ud83e\udde4 Kaleci'],['Orta Saha','\u2699\ufe0f Orta Saha'],['Forvet','\u26bd Forvet']];
      next = '<p>8/8: 1 reroll ve se\u00e7ece\u011fin mevkiye bu ma\u00e7 i\u00e7in +1 kazand\u0131n.</p><div class="ll-reward-choices">' +
        roles.map(function (role) { return '<button class="ll-btn" onclick="llBeginMatch(\'' + role[0] + '\')">' + role[1] + ' +1 ile ma\u00e7a gir</button>'; }).join('') + '</div>';
    } else if (quiz.reward === 'reroll') {
      next = '<p>7/8: Bu ma\u00e7 i\u00e7in 1 reroll kazand\u0131n.</p><button class="ll-btn" onclick="llBeginMatch()">Ma\u00e7a Gir</button>';
    } else {
      next = '<p>Reroll \u00f6d\u00fcl\u00fc i\u00e7in 7 do\u011fru gerekiyordu. Kazand\u0131\u011f\u0131n AP ile ma\u00e7a devam edebilirsin.</p><button class="ll-btn" onclick="llBeginMatch()">Ma\u00e7a Gir</button>';
    }
    global.llArea().innerHTML =
      '<section class="ll-shell ll-reward"><h1>Relative Clause <em>Sonucu</em></h1>' +
      '<div class="ll-result-score">' + quiz.correct + '/8</div><b>+' + quiz.apEarned + ' AP' + esc(extra) + '</b>' + next + '</section>';
    return true;
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
        var output = baseStart.apply(this, arguments);
        var quiz = global.lexLeague && global.lexLeague.quiz;
        if (due && quiz && !quiz.relativeClause && isOfficial(quiz.fixture || fixture)) {
          beginRelativeQuiz(quiz.fixture || fixture);
        } else if (due && (!quiz || !quiz.relativeClause)) {
          ensure(state);
          state.relativeClausePending = true;
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
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return renderRelativeQuiz();
        return baseRender.apply(this, arguments);
      };
    });
    wrap('llRevealQuiz', function (baseReveal) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return revealRelativeQuiz();
        return baseReveal.apply(this, arguments);
      };
    });
    wrap('llRateLeagueQuiz', function (baseRate) {
      return function (correct) {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return rateRelativeQuiz(!!correct);
        return baseRate.apply(this, arguments);
      };
    });
    wrap('llSkipLeagueQuiz', function (baseSkip) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return skipRelativeQuiz();
        return baseSkip.apply(this, arguments);
      };
    });
    wrap('llFinishLeagueQuiz', function (baseFinish) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return finishRelativeQuiz(false);
        return baseFinish.apply(this, arguments);
      };
    });
    wrap('llRenderQuizReward', function (baseReward) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.relativeClause) return renderRelativeReward();
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
          state.relativeClauseOfficialMatches = Math.max(state.relativeClauseOfficialMatches + 1, officialResults(state).length);
          save();
        }
        return output;
      };
    });
    setDashboardButton();
  }

  global.LL_RELATIVE_CLAUSE_BANK = BANK;
  global.llRelativeClauseQuiz = { version: 1, questionCount: QUESTION_COUNT, bankSize: BANK.length, isDue: function () { return isDue(stateNow(), fixtureNow()); } };
  install();
})(window);
