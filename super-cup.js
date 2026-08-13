/* UEFA Super Cup: Champions League winner vs Europa League winner, once per season. */
(function () {
  'use strict';

  const LL_SUPER_CUP_NAME = 'UEFA Süper Kupa';
  const LL_SUPER_CUP_ACHIEVEMENT = 'uefa-super-cup';

  function stateOf() {
    return globalThis.lexLeague && globalThis.lexLeague.state;
  }

  function escape(value) {
    return typeof globalThis.llEscape === 'function' ? globalThis.llEscape(value) : String(value == null ? '' : value);
  }

  function standingsChampion(state, competition, excluded) {
    if (state && state.europe && state.europe.type === competition && state.europe.winner && state.europe.winner !== excluded) {
      return state.europe.winner;
    }
    try {
      const table = typeof globalThis.llV2SortEuropeTable === 'function' ? globalThis.llV2SortEuropeTable(competition) : [];
      const row = table.find(item => item && item.team && item.team !== excluded);
      return row ? row.team : null;
    } catch (error) {
      return null;
    }
  }

  function fixtureFrom(superCup) {
    return {
      home: superCup.uclWinner,
      away: superCup.uelWinner,
      competition: 'supercup',
      league: 'uefa-supercup',
      neutral: true,
      roundLabel: 'UEFA Süper Kupa · Tek Maç',
      dateLabel: 'Sezon Sonu · UEFA Süper Kupa'
    };
  }

  function latestSuperCupResult(state, season) {
    return (state.results || []).slice().reverse().find(result =>
      Number(result.season) === Number(season) && result.competition === 'supercup'
    ) || null;
  }

  function writeHistory(state, superCup) {
    if (!Array.isArray(state.superCupHistory)) state.superCupHistory = [];
    const record = {
      season: Number(superCup.season),
      name: LL_SUPER_CUP_NAME,
      uclWinner: superCup.uclWinner,
      uelWinner: superCup.uelWinner,
      winner: superCup.winner,
      home: superCup.home,
      away: superCup.away,
      homeGoals: superCup.homeGoals,
      awayGoals: superCup.awayGoals,
      penalties: superCup.penalties || null
    };
    const index = state.superCupHistory.findIndex(item => Number(item.season) === Number(record.season));
    if (index >= 0) state.superCupHistory[index] = record;
    else state.superCupHistory.push(record);
    return record;
  }

  function unlockAchievement(state, superCup) {
    if (superCup.winner !== state.playerTeam) return;
    if (!state.superCupAchievements || typeof state.superCupAchievements !== 'object') state.superCupAchievements = {};
    if (state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT]) return;

    const reward = { ap: 100, lp: 120 };
    state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT] = {
      season: Number(state.season),
      team: state.playerTeam,
      ...reward
    };
    state.ap = Number(state.ap || 0) + reward.ap;
    state.lp = Number(state.lp || 0) + reward.lp;
  }

  function finishSuperCup(winner) {
    const state = stateOf();
    const superCup = state && state.superCup;
    if (!state || !superCup || superCup.status === 'completed') return;

    const result = latestSuperCupResult(state, superCup.season);
    superCup.status = 'completed';
    superCup.winner = winner || (result && result.homeGoals > result.awayGoals ? result.home : result && result.away);
    superCup.home = result ? result.home : superCup.uclWinner;
    superCup.away = result ? result.away : superCup.uelWinner;
    superCup.homeGoals = result ? Number(result.homeGoals || 0) : Number(superCup.homeGoals || 0);
    superCup.awayGoals = result ? Number(result.awayGoals || 0) : Number(superCup.awayGoals || 0);
    superCup.penalties = result && result.penaltyShootout ? result.penaltyShootout : null;
    writeHistory(state, superCup);

    if (superCup.winner === state.playerTeam) {
      if (!Array.isArray(state.trophies)) state.trophies = [];
      if (!state.trophies.some(trophy => Number(trophy.season) === Number(state.season) && trophy.name === LL_SUPER_CUP_NAME)) {
        state.trophies.push({ season: state.season, name: LL_SUPER_CUP_NAME });
      }
      unlockAchievement(state, superCup);
    }
    if (typeof globalThis.llSave === 'function') globalThis.llSave();
  }

  function simulateSuperCup(state, superCup) {
    let score;
    if (typeof globalThis.llV2SimpleEuropeScore === 'function') score = globalThis.llV2SimpleEuropeScore(superCup.uclWinner, superCup.uelWinner);
    else {
      const team = name => (globalThis.llTeamDef && globalThis.llTeamDef(name)) || { stars: 3 };
      const homeStars = Number(team(superCup.uclWinner).stars || 3);
      const awayStars = Number(team(superCup.uelWinner).stars || 3);
      score = { homeGoals: Math.max(0, Math.floor(Math.random() * 4) + (homeStars >= awayStars ? 1 : 0)), awayGoals: Math.max(0, Math.floor(Math.random() * 4) + (awayStars > homeStars ? 1 : 0)) };
    }
    let winner = score.homeGoals === score.awayGoals
      ? (Math.random() < .5 ? superCup.uclWinner : superCup.uelWinner)
      : (score.homeGoals > score.awayGoals ? superCup.uclWinner : superCup.uelWinner);
    const penalties = score.homeGoals === score.awayGoals ? { home: winner === superCup.uclWinner ? 5 : 4, away: winner === superCup.uelWinner ? 5 : 4, winner } : null;
    if (typeof globalThis.llRecordMatch === 'function') {
      globalThis.llRecordMatch(superCup.uclWinner, superCup.uelWinner, score.homeGoals, score.awayGoals, state.week, false, 'supercup', 'uefa-supercup');
      const result = latestSuperCupResult(state, state.season);
      if (result && penalties) result.penaltyShootout = penalties;
    }
    finishSuperCup(winner);
  }

  function ensureSuperCupAtSeasonEnd(state) {
    if (!state || state.seasonEnded) return false;
    const season = Number(state.season);
    if ((state.superCupHistory || []).some(record => Number(record.season) === season)) return false;

    let superCup = state.superCup;
    if (!superCup || Number(superCup.season) !== season) {
      const uclWinner = standingsChampion(state, 'ucl');
      const uelWinner = standingsChampion(state, 'uel', uclWinner);
      if (!uclWinner || !uelWinner || uclWinner === uelWinner) return false;
      superCup = state.superCup = {
        season,
        uclWinner,
        uelWinner,
        status: 'pending',
        playerParticipant: state.playerTeam === uclWinner || state.playerTeam === uelWinner
      };
    }

    if (superCup.status === 'completed') return false;
    if (superCup.playerParticipant) {
      if (!state.pendingFixture) state.pendingFixture = fixtureFrom(superCup);
      return true;
    }
    simulateSuperCup(state, superCup);
    return false;
  }

  function recordForSeason(state, season) {
    const current = state && state.superCup;
    if (current && Number(current.season) === Number(season) && current.status === 'completed') return current;
    return (state && state.superCupHistory || []).find(item => Number(item.season) === Number(season)) || null;
  }

  function renderSuperCupArchive() {
    const state = stateOf();
    if (!state || typeof globalThis.llArea !== 'function') return;
    const rows = (state.superCupHistory || []).slice().sort((a, b) => Number(b.season) - Number(a.season));
    const pending = state.superCup && state.superCup.status !== 'completed' ? state.superCup : null;
    const area = globalThis.llArea();
    area.innerHTML = `<div class="ll-shell"><div class="ll-header"><div><h1>UEFA <em>Süper Kupa</em></h1><p>Şampiyonlar Ligi ve Avrupa Ligi şampiyonları arasındaki sezon sonu tek maç.</p></div><button class="ll-btn" onclick="llRenderSeasonArchive()">← Sezon Arşivi</button></div><section class="ll-panel"><h3>🏆 UEFA SÜPER KUPA GEÇMİŞİ</h3>${pending ? `<div class="ll-notice">S${escape(pending.season)} eşleşmesi bekliyor: <b>${escape(pending.uclWinner)}</b> vs <b>${escape(pending.uelWinner)}</b></div>` : ''}${rows.length ? `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>Sezon</th><th>Şampiyonlar Ligi şampiyonu</th><th>Avrupa Ligi şampiyonu</th><th>Skor</th><th>Kazanan</th></tr></thead><tbody>${rows.map(row => { const score = `${row.homeGoals}-${row.awayGoals}${row.penalties ? ` · Penaltılar ${row.penalties.home}-${row.penalties.away}` : ''}`; return `<tr><td>S${escape(row.season)}</td><td>${escape(row.uclWinner)}</td><td>${escape(row.uelWinner)}</td><td>${escape(score)}</td><td><b>${escape(row.winner)}</b></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="ll-muted">Henüz oynanmış bir UEFA Süper Kupa yok.</p>'}</section></div>`;
  }

  function attachToSeasonArchive() {
    if (typeof globalThis.llRenderSeasonArchive !== 'function') return;
    const original = globalThis.llRenderSeasonArchive;
    globalThis.llRenderSeasonArchive = function () {
      const value = original.apply(this, arguments);
      const area = typeof globalThis.llArea === 'function' ? globalThis.llArea() : null;
      if (!area || area.querySelector('[data-supercup-tab]')) return value;
      const controls = area.querySelector('.ll-actions') || area.querySelector('.ll-header > div:last-child');
      if (controls) controls.insertAdjacentHTML('beforeend', '<button class="ll-btn" data-supercup-tab onclick="llRenderSuperCupArchive()">UEFA Süper Kupa</button>');
      return value;
    };
  }

  function attachArchivePersistence() {
    if (typeof globalThis.llV2ArchiveSeason !== 'function') return;
    const original = globalThis.llV2ArchiveSeason;
    globalThis.llV2ArchiveSeason = function (state, summary) {
      const entry = original.apply(this, arguments);
      const record = recordForSeason(state, summary && summary.season);
      if (entry && record) entry.superCup = JSON.parse(JSON.stringify(record));
      return entry;
    };
  }

  function attachAchievementScreen() {
    if (typeof globalThis.llRenderAchievements !== 'function') return;
    const original = globalThis.llRenderAchievements;
    globalThis.llRenderAchievements = function () {
      const value = original.apply(this, arguments);
      const state = stateOf();
      const area = typeof globalThis.llArea === 'function' ? globalThis.llArea() : null;
      if (!state || !area || area.querySelector('[data-supercup-achievement]')) return value;
      const unlock = state.superCupAchievements && state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT];
      const panel = area.querySelector('.ll-panel:last-child') || area.querySelector('.ll-shell');
      if (panel) panel.insertAdjacentHTML('beforeend', `<section class="ll-panel" data-supercup-achievement><h3>UEFA SÜPER KUPA</h3><div class="ll-achievement ${unlock ? 'unlocked' : ''}"><div class="ll-achievement-icon">🏆</div><div><strong>Süper Kupa Ustası</strong><p>UEFA Süper Kupa'yı kazan.</p>${unlock ? `<small>Açıldı · S${escape(unlock.season)} · ${escape(unlock.team)}</small>` : '<small>Henüz kazanılmadı</small>'}<b>+100 AP · +120 LP</b></div></div></section>`);
      return value;
    };
  }

  function attachSeasonStartReset() {
    if (typeof globalThis.llStartNextSeason !== 'function') return;
    const original = globalThis.llStartNextSeason;
    globalThis.llStartNextSeason = function () {
      const state = stateOf();
      const value = original.apply(this, arguments);
      if (state && state.superCup && state.superCup.status === 'completed') {
        state.superCup = null;
        if (typeof globalThis.llSave === 'function') globalThis.llSave();
      }
      return value;
    };
  }

  globalThis.llEnsureSuperCupAtSeasonEnd = ensureSuperCupAtSeasonEnd;
  globalThis.llFinishSuperCup = finishSuperCup;
  globalThis.llRenderSuperCupArchive = renderSuperCupArchive;
  attachArchivePersistence();
  attachToSeasonArchive();
  attachAchievementScreen();
  attachSeasonStartReset();
}());
