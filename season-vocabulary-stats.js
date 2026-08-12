/* Season vocabulary accuracy: regular fixtures and special 12-word events. */
(function (global) {
  'use strict';

  const VERSION = 1;
  const SOURCE_META = {
    league: { label: 'Lig ma\u00e7lar\u0131', order: 1 },
    domesticCup: { label: 'Yerel kupa', order: 2 },
    playoff: { label: 'Play-off', order: 3 },
    ucl: { label: '\u015eampiyonlar Ligi', order: 4 },
    uel: { label: 'Avrupa Ligi', order: 5 },
    uecl: { label: 'Konferans Ligi', order: 6 },
    legend: { label: 'Efsaneni \u00c7a\u011f\u0131r', order: 7 },
    hell: { label: 'Cehennemi Ya\u015fat', order: 8 },
    other: { label: 'Di\u011fer resmi ma\u00e7', order: 99 }
  };

  function number(value, fallback) {
    const result = Number(value);
    return Number.isFinite(result) ? result : (fallback === undefined ? 0 : fallback);
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function stateNow() { return global.lexLeague && global.lexLeague.state ? global.lexLeague.state : null; }
  function escapeHtml(value) {
    if (typeof global.llEscape === 'function') return global.llEscape(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function blankSource() { return { total: 0, correct: 0 }; }
  function blankSources() {
    const sources = {};
    Object.keys(SOURCE_META).forEach(function (key) { sources[key] = blankSource(); });
    return sources;
  }
  function blankStats(season) {
    return {
      version: VERSION,
      season: number(season, 1),
      startedAt: new Date().toISOString(),
      total: 0,
      correct: 0,
      sources: blankSources(),
      archivedSeason: null
    };
  }
  function sourceKey(fixture, eventType) {
    if (eventType === 'legend') return 'legend';
    if (eventType === 'hell') return 'hell';
    const competition = String(fixture && fixture.competition || 'league').toLowerCase();
    if (competition === 'league') return 'league';
    if (competition === 'cup' || competition === 'domesticcup' || competition === 'domestic_cup') return 'domesticCup';
    if (competition === 'playoff' || competition === 'play-off') return 'playoff';
    if (competition === 'ucl') return 'ucl';
    if (competition === 'uel') return 'uel';
    if (competition === 'uecl') return 'uecl';
    return 'other';
  }
  function ensure(state) {
    state = state || stateNow();
    if (!state) return null;
    const season = number(state.season, 1);
    let stats = state.seasonVocabularyStats;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats) || number(stats.season, -1) !== season) {
      stats = blankStats(season);
      state.seasonVocabularyStats = stats;
    }
    stats.version = VERSION;
    stats.total = Math.max(0, number(stats.total));
    stats.correct = Math.max(0, Math.min(stats.total, number(stats.correct)));
    if (!stats.sources || typeof stats.sources !== 'object' || Array.isArray(stats.sources)) stats.sources = blankSources();
    Object.keys(SOURCE_META).forEach(function (key) {
      const item = stats.sources[key];
      if (!item || typeof item !== 'object' || Array.isArray(item)) stats.sources[key] = blankSource();
      stats.sources[key].total = Math.max(0, number(stats.sources[key].total));
      stats.sources[key].correct = Math.max(0, Math.min(stats.sources[key].total, number(stats.sources[key].correct)));
    });
    if (!Array.isArray(state.seasonVocabularyHistory)) state.seasonVocabularyHistory = [];
    return stats;
  }
  function accuracy(item) {
    const total = number(item && item.total);
    return total ? Math.round((number(item.correct) / total) * 100) : 0;
  }
  function record(options) {
    options = options || {};
    const state = stateNow();
    const quiz = options.quiz;
    const index = number(options.answerIndex, -1);
    if (!state || !quiz || index < 0) return false;
    if (!quiz.seasonVocabularyRecorded || typeof quiz.seasonVocabularyRecorded !== 'object') quiz.seasonVocabularyRecorded = {};
    const marker = String(index);
    if (quiz.seasonVocabularyRecorded[marker]) return false;
    quiz.seasonVocabularyRecorded[marker] = true;
    const stats = ensure(state);
    if (!stats) return false;
    const key = sourceKey(options.fixture || quiz.fixture, options.eventType);
    const source = stats.sources[key] || (stats.sources[key] = blankSource());
    stats.total += 1;
    source.total += 1;
    if (options.correct) {
      stats.correct += 1;
      source.correct += 1;
    }
    return true;
  }
  function archive(state) {
    state = state || stateNow();
    const stats = ensure(state);
    if (!state || !stats || stats.archivedSeason === stats.season) return null;
    const snapshot = clone(stats);
    snapshot.completedAt = new Date().toISOString();
    stats.archivedSeason = stats.season;
    const history = state.seasonVocabularyHistory;
    const oldIndex = history.findIndex(function (item) { return number(item && item.season, -1) === stats.season; });
    if (oldIndex >= 0) history[oldIndex] = snapshot; else history.push(snapshot);
    if (state.lastSeasonSummary && number(state.lastSeasonSummary.season, -1) === stats.season) state.lastSeasonSummary.vocabularyStats = clone(snapshot);
    return snapshot;
  }
  function sourceRows(stats) {
    return Object.keys(SOURCE_META).filter(function (key) { return number(stats.sources && stats.sources[key] && stats.sources[key].total) > 0; })
      .sort(function (left, right) { return SOURCE_META[left].order - SOURCE_META[right].order; })
      .map(function (key) {
        const item = stats.sources[key];
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(148,163,184,.14)"><span>' + SOURCE_META[key].label + '</span><b>' + item.correct + '/' + item.total + ' · %' + accuracy(item) + '</b></div>';
      }).join('');
  }
  function reportHtml(stats, options) {
    options = options || {};
    const empty = !stats || !number(stats.total);
    const season = number(stats && stats.season, 1);
    return '<div class="ll-card ll-season-vocabulary-report" style="margin-top:14px;border-color:rgba(45,212,191,.42)">' +
      '<div class="ll-card-title">' + (options.finished ? 'Sezonluk Kelime Performans\u0131' : 'Bu Sezon Kelime Performans\u0131') + '</div>' +
      '<div class="ll-sub" style="margin:5px 0 10px">Sezon ' + season + ' · lig, yerel kupa, play-off, Avrupa ve \u00f6zel etkinlikler birlikte hesaplan\u0131r.</div>' +
      (empty ? '<div class="ll-notice">Hen\u00fcz bu sezonda cevaplanan kelime yok. Saya\u00e7 bu g\u00fcncellemeden sonraki yeni cevaplar\u0131 do\u011fru bi\u00e7imde kaydeder.</div>' :
        '<div class="ll-metrics" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:10px 0"><div class="ll-metric"><strong>%' + accuracy(stats) + '</strong><span>Bilme oran\u0131</span></div><div class="ll-metric"><strong>' + stats.correct + '/' + stats.total + '</strong><span>Do\u011fru / cevap</span></div><div class="ll-metric"><strong>' + Object.keys(SOURCE_META).filter(function (key) { return number(stats.sources[key].total) > 0; }).length + '</strong><span>Kullan\u0131lan kaynak</span></div></div><div style="font-size:13px">' + sourceRows(stats) + '</div>') +
      '<button class="ll-btn" style="margin-top:12px" onclick="llRenderSeasonVocabularyReport()">Sezon ge\u00e7mi\u015fini g\u00f6r</button></div>';
  }
  function renderReport() {
    const state = stateNow();
    if (!state || typeof global.llArea !== 'function') return;
    const current = ensure(state);
    const history = (state.seasonVocabularyHistory || []).slice().sort(function (a, b) { return number(b.season) - number(a.season); });
    const historyHtml = history.length ? history.map(function (entry) {
      return '<div class="ll-card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;gap:12px"><b>Sezon ' + entry.season + '</b><b>%' + accuracy(entry) + ' · ' + entry.correct + '/' + entry.total + '</b></div><div style="font-size:13px;margin-top:8px">' + sourceRows(entry) + '</div></div>';
    }).join('') : '<div class="ll-notice">Tamamlanm\u0131\u015f sezon kayd\u0131 hen\u00fcz yok.</div>';
    global.llArea().innerHTML = '<div class="ll-shell"><div class="ll-panel"><div class="quiz-start-title">Kelime <em>Performans\u0131</em></div>' + reportHtml(current) + '<div class="ll-card-title" style="margin-top:20px">Tamamlanan Sezonlar</div>' + historyHtml + '<button class="ll-btn primary" style="margin-top:16px" onclick="llRenderDashboard()">Panele D\u00f6n</button></div></div>';
  }
  function decorateDashboard() {
    const state = stateNow();
    const area = typeof global.llArea === 'function' ? global.llArea() : null;
    if (!state || !area || state.seasonEnded) return;
    const stats = ensure(state);
    area.querySelectorAll('.ll-season-vocabulary-summary').forEach(function (node) { node.remove(); });
    const metrics = area.querySelector('.ll-metrics');
    const anchor = area.querySelector('.ll-grid') || metrics;
    if (anchor) anchor.insertAdjacentHTML('beforebegin', '<div class="ll-season-vocabulary-summary">' + reportHtml(stats) + '</div>');
  }
  function decorateSeasonEnd() {
    const state = stateNow();
    const area = typeof global.llArea === 'function' ? global.llArea() : null;
    if (!state || !area || !state.seasonEnded) return;
    const stats = archive(state) || ensure(state);
    area.querySelectorAll('.ll-season-vocabulary-summary').forEach(function (node) { node.remove(); });
    const panel = area.querySelector('.ll-panel') || area;
    const actions = panel.querySelector('button[onclick*="llStartNextSeason"]')?.parentElement;
    const html = '<div class="ll-season-vocabulary-summary">' + reportHtml(stats, { finished: true }) + '</div>';
    if (actions) actions.insertAdjacentHTML('beforebegin', html); else panel.insertAdjacentHTML('beforeend', html);
  }

  global.llEnsureSeasonVocabularyStats = ensure;
  global.llGetSeasonVocabularyStats = function () { return ensure(stateNow()); };
  global.llSeasonVocabularyAccuracy = function () { return accuracy(ensure(stateNow())); };
  global.llRecordSeasonVocabularyAnswer = record;
  global.llArchiveSeasonVocabularyStats = archive;
  global.llRenderSeasonVocabularyReport = renderReport;

  const oldDashboard = global.llRenderDashboard;
  if (typeof oldDashboard === 'function') {
    global.llRenderDashboard = function () {
      const result = oldDashboard.apply(this, arguments);
      try { decorateDashboard(); } catch (error) { try { global.llQuizDiagnostic?.('season_vocabulary_dashboard_error', { message: String(error && error.message || error) }); } catch (_) {} }
      return result;
    };
  }
  const oldSeasonEnd = global.llRenderSeasonEnd;
  if (typeof oldSeasonEnd === 'function') {
    global.llRenderSeasonEnd = function () {
      try { if (stateNow() && stateNow().seasonEnded) archive(stateNow()); } catch (_) {}
      const result = oldSeasonEnd.apply(this, arguments);
      try { decorateSeasonEnd(); } catch (error) { try { global.llQuizDiagnostic?.('season_vocabulary_end_error', { message: String(error && error.message || error) }); } catch (_) {} }
      return result;
    };
  }
  const oldNextSeason = global.llStartNextSeason;
  if (typeof oldNextSeason === 'function') {
    global.llStartNextSeason = function () {
      const before = stateNow();
      const oldSeason = number(before && before.season, -1);
      if (before && before.seasonEnded) archive(before);
      const result = oldNextSeason.apply(this, arguments);
      const after = stateNow();
      if (after && number(after.season, -1) !== oldSeason) ensure(after);
      return result;
    };
  }
  try { ensure(stateNow()); } catch (_) {}
})(globalThis);
