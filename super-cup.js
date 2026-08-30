/* UEFA Super Cup: Champions League winner vs Europa League winner, once per season. */
(function () {
  'use strict';

  const LL_SUPER_CUP_NAME = 'UEFA Süper Kupa';
  const LL_SUPER_CUP_ACHIEVEMENT = 'uefa-super-cup';
  // Süper Kupa prestij ağırlıklıdır; ekonomik ödül bilinçli olarak küçüktür.
  const LL_SUPER_CUP_REWARD = Object.freeze({ ap: 30, lp: 40 });

  function stateOf() {
    return globalThis.lexLeague && globalThis.lexLeague.state;
  }

  function escape(value) {
    return typeof globalThis.llEscape === 'function' ? globalThis.llEscape(value) : String(value == null ? '' : value);
  }

  // Eski sürümde açılan başarımlar daha yüksek ödül taşımış olabilir. Yeni ekonomik
  // dengeye geçerken geçmiş bakiyeyi geri alma; yalnızca başarı metadata'sını yeni değere getir.
  function migrateAchievementReward(state) {
    if (!state || !state.superCupAchievements || typeof state.superCupAchievements !== 'object') return false;
    const achievement = state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT];
    if (!achievement || Number(achievement.rewardVersion || 0) >= 2) return false;
    const paidAp = Number(achievement.ap || 100);
    const paidLp = Number(achievement.lp || 120);
    state.ap = Number(state.ap || 0) + Math.max(0, LL_SUPER_CUP_REWARD.ap - paidAp);
    state.lp = Number(state.lp || 0) + Math.max(0, LL_SUPER_CUP_REWARD.lp - paidLp);
    achievement.ap = LL_SUPER_CUP_REWARD.ap;
    achievement.lp = LL_SUPER_CUP_REWARD.lp;
    achievement.rewardVersion = 2;
    return true;
  }

  // UEFA Süper Kupa katılımcıları puan tablosundan seçilmez. Kaynak,
  // Avrupa kupalarının kalıcı şampiyon kaydıdır (last-champions.js).
  function europeanChampion(state, season, competition, excluded) {
    if (!state || !['ucl', 'uel'].includes(competition)) return null;

    // Kullanıcının gerçekten kazandığı kupa varsa bunu her şeyin önünde tut.
    if (Number(season) === Number(state.season) && state.europe &&
        state.europe.type === competition && state.europe.winner &&
        state.europe.winner !== excluded) {
      return state.europe.winner;
    }

    // Sezon sonunda last-champions motoru AI kupalarının da şampiyonlarını
    // tek ve kalıcı kaynağa yazar. Böylece Süper Kupa ve "Son şampiyon"
    // rozeti hiçbir zaman farklı takımlar göstermez.
    try {
      if (typeof globalThis.llV13CaptureEuropeanChampions === 'function') {
        const summary = Number(state.lastSeasonSummary?.season) === Number(season) ? state.lastSeasonSummary : null;
        globalThis.llV13CaptureEuropeanChampions(state, season, summary);
      } else if (typeof globalThis.llV13EnsureChampionHistory === 'function') {
        globalThis.llV13EnsureChampionHistory(state);
      }
    } catch (error) {
      // Yanlış bir puan-tablosu şampiyonu üretmektense eşleşmeyi beklet.
    }

    const record = (state.competitionChampions || []).find(item =>
      Number(item?.season) === Number(season) &&
      item?.competition === competition &&
      item?.team && item.team !== excluded
    );
    if (record) return record.team;

    const archived = (state.seasonHistory || []).find(item => Number(item?.season) === Number(season));
    const archivedWinner = archived?.champions?.[competition];
    if (archivedWinner && archivedWinner !== excluded) return archivedWinner;

    const trophy = (state.trophies || []).find(item => {
      if (Number(item?.season) !== Number(season)) return false;
      const name = String(item?.name || '').toLocaleLowerCase('tr');
      return competition === 'ucl' ? name.includes('şampiyonlar') : name.includes('avrupa ligi');
    });
    if (trophy?.team && trophy.team !== excluded) return trophy.team;
    return null;
  }

  function managerTeamForSeason(state, season) {
    if (typeof globalThis.llV13ManagerTeamForSeason === 'function') {
      try { return globalThis.llV13ManagerTeamForSeason(state, season); } catch (error) {}
    }
    const archived = (state.seasonHistory || []).find(item => Number(item?.season) === Number(season));
    return archived?.playerTeam || (Number(season) === Number(state.season) ? state.playerTeam : null);
  }

  function winnerSide(record) {
    const home = record.home || record.uclWinner;
    const away = record.away || record.uelWinner;
    if (record.winner === home || record.winner === record.uclWinner) return 'home';
    if (record.winner === away || record.winner === record.uelWinner) return 'away';
    const hg = Number(record.homeGoals), ag = Number(record.awayGoals);
    if (Number.isFinite(hg) && Number.isFinite(ag) && hg !== ag) return hg > ag ? 'home' : 'away';
    const ph = Number(record.penalties?.home), pa = Number(record.penalties?.away);
    if (Number.isFinite(ph) && Number.isFinite(pa) && ph !== pa) return ph > pa ? 'home' : 'away';
    return 'home';
  }

  // Eski sürüm, Süper Kupa finalistlerini Avrupa puan tablosunun ilk
  // sıralarından seçiyordu. AI-vs-AI geçmiş kayıtlarını kalıcı kupa
  // şampiyonlarıyla eşleştir; skorun/penaltının hangi tarafı kazandığını
  // koru. Kullanıcının bizzat oynadığı eski bir maçı otomatik değiştirme.
  function repairLegacySuperCupHistory(state) {
    if (!state || !Array.isArray(state.superCupHistory) || !state.superCupHistory.length) return false;
    if (typeof globalThis.llV13EnsureChampionHistory === 'function') {
      try { globalThis.llV13EnsureChampionHistory(state); } catch (error) {}
    }
    let changed = false;
    state.superCupHistory.forEach(record => {
      const season = Number(record?.season);
      if (!season) return;
      const uclWinner = europeanChampion(state, season, 'ucl');
      const uelWinner = europeanChampion(state, season, 'uel', uclWinner);
      if (!uclWinner || !uelWinner || uclWinner === uelWinner) return;
      const oldHome = record.home || record.uclWinner;
      const oldAway = record.away || record.uelWinner;
      if (oldHome === uclWinner && oldAway === uelWinner &&
          record.uclWinner === uclWinner && record.uelWinner === uelWinner) return;

      const managerTeam = managerTeamForSeason(state, season);
      if (managerTeam && [oldHome, oldAway, record.winner].includes(managerTeam)) {
        record.legacyChampionMismatch = true;
        return;
      }

      const side = winnerSide(record);
      record.uclWinner = uclWinner;
      record.uelWinner = uelWinner;
      record.home = uclWinner;
      record.away = uelWinner;
      record.winner = side === 'home' ? uclWinner : uelWinner;
      if (record.penalties && typeof record.penalties === 'object') {
        record.penalties.winner = record.winner;
      }
      record.source = 'champion-history-repair-v2';
      delete record.legacyChampionMismatch;
      const archive = (state.seasonHistory || []).find(item => Number(item?.season) === season);
      if (archive && archive.superCup) archive.superCup = JSON.parse(JSON.stringify(record));
      changed = true;
    });
    return changed;
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

    const reward = LL_SUPER_CUP_REWARD;
    state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT] = {
      season: Number(state.season),
      team: state.playerTeam,
      ...reward,
      rewardVersion: 2
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
    if (repairLegacySuperCupHistory(state) && typeof globalThis.llSave === 'function') globalThis.llSave();
    const season = Number(state.season);
    if ((state.superCupHistory || []).some(record => Number(record.season) === season)) return false;

    let superCup = state.superCup;
    if (!superCup || Number(superCup.season) !== season) {
      const uclWinner = europeanChampion(state, season, 'ucl');
      const uelWinner = europeanChampion(state, season, 'uel', uclWinner);
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
    if (repairLegacySuperCupHistory(state) && typeof globalThis.llSave === 'function') globalThis.llSave();
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

  function superCupScoreText(record) {
    if (!record || record.homeGoals == null || record.awayGoals == null) return '—';
    const base = `${Number(record.homeGoals)} - ${Number(record.awayGoals)}`;
    const penalties = record.penalties;
    if (!penalties || penalties.home == null || penalties.away == null) return base;
    return `${base} · Penaltılar ${Number(penalties.home)} - ${Number(penalties.away)}`;
  }

  function superCupFixtureHtml(home, away, record) {
    const teamLogo = typeof globalThis.llTeamLogo === 'function'
      ? globalThis.llTeamLogo
      : name => `<span>${escape(name || '—')}</span>`;
    const score = record ? superCupScoreText(record) : 'VS';
    return `<div class="ll-next-match" style="margin-top:10px">
      <div class="ll-club"><div class="ll-club-icon">${teamLogo(home, 'match')}</div><b>${escape(home || '—')}</b><span class="ll-muted">Şampiyonlar Ligi şampiyonu</span></div>
      <div class="ll-vs">${escape(score)}</div>
      <div class="ll-club"><div class="ll-club-icon">${teamLogo(away, 'match')}</div><b>${escape(away || '—')}</b><span class="ll-muted">Avrupa Ligi şampiyonu</span></div>
    </div>`;
  }

  function superCupHistoryTableHtml(state) {
    const rows = (state.superCupHistory || []).slice().sort((a, b) => Number(b.season) - Number(a.season));
    if (!rows.length) return '<div class="ll-muted" style="padding:8px 2px">Henüz tamamlanmış bir UEFA Süper Kupa maçı yok.</div>';
    return `<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>Sezon</th><th>Şampiyonlar Ligi</th><th>Avrupa Ligi</th><th>Skor</th><th>Şampiyon</th></tr></thead><tbody>${rows.map(row => `<tr><td>S${escape(row.season)}</td><td>${escape(row.uclWinner || row.home || '—')}</td><td>${escape(row.uelWinner || row.away || '—')}</td><td>${escape(superCupScoreText(row))}</td><td><b>${escape(row.winner || '—')}</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderSuperCupCompetitionCenter() {
    const state = stateOf();
    if (!state || typeof globalThis.llArea !== 'function') return;
    if (repairLegacySuperCupHistory(state) && typeof globalThis.llSave === 'function') globalThis.llSave();
    if (typeof globalThis.llSetWide === 'function') globalThis.llSetWide(true);

    const current = state.superCup && Number(state.superCup.season) === Number(state.season) ? state.superCup : null;
    const history = (state.superCupHistory || []).slice().sort((a, b) => Number(b.season) - Number(a.season));
    const latest = history[0] || (current && current.status === 'completed' ? current : null);
    const currentRecord = current && current.status === 'completed' ? (recordForSeason(state, state.season) || current) : null;
    const lastChampion = latest && latest.winner ? latest.winner : '—';
    const lastSeason = latest ? `S${latest.season}` : '—';
    const status = current
      ? current.status === 'completed'
        ? `Şampiyon: ${current.winner || '—'}`
        : `${current.uclWinner || '—'} vs ${current.uelWinner || '—'}`
      : 'Finalistler henüz belli değil';

    const cupLabel = typeof globalThis.llDomesticCupLabelForFixture === 'function'
      ? globalThis.llDomesticCupLabelForFixture(null, state)
      : 'Yerel Kupa';
    const leagueKey = typeof globalThis.llTeamLeague === 'function' ? (globalThis.llTeamLeague(state.playerTeam) || 'first') : 'first';

    const tabs = `<div class="ll-comp-tabs"><button class="ll-comp-tab" onclick="llRenderCompetitionCenter('league','${leagueKey}')">Ligler ve Fikstür</button><button class="ll-comp-tab" onclick="llRenderCompetitionCenter('cup','${leagueKey}')">${escape(cupLabel)}</button><button class="ll-comp-tab active" onclick="llRenderCompetitionCenter('europe','ucl')">Avrupa Kupaları</button></div>`;
    const subtabs = `<div class="ll-subtabs"><button class="ll-btn" onclick="llRenderCompetitionCenter('europe','ucl')">Şampiyonlar Ligi</button><button class="ll-btn" onclick="llRenderCompetitionCenter('europe','uel')">Avrupa Ligi</button><button class="ll-btn" onclick="llRenderCompetitionCenter('europe','uecl')">Konferans Ligi</button><button class="ll-btn primary" data-supercup-competition-tab onclick="llRenderCompetitionCenter('europe','supercup')">UEFA Süper Kupa</button></div>`;

    let currentHtml;
    if (current && current.status !== 'completed') {
      currentHtml = `<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">UEFA Süper Kupa · Bu Sezon</div>${superCupFixtureHtml(current.uclWinner, current.uelWinner, null)}<div class="ll-notice" style="margin-top:12px">Şampiyonlar Ligi ve Avrupa Ligi şampiyonları arasındaki tek maç henüz oynanmadı.</div></div>`;
    } else if (currentRecord) {
      currentHtml = `<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">UEFA Süper Kupa · Bu Sezon</div>${superCupFixtureHtml(currentRecord.home || currentRecord.uclWinner, currentRecord.away || currentRecord.uelWinner, currentRecord)}<div class="ll-notice" style="margin-top:12px"><b>Şampiyon:</b> ${escape(currentRecord.winner || '—')}</div></div>`;
    } else {
      currentHtml = `<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">UEFA Süper Kupa · Bu Sezon</div><div class="ll-notice">Bu sezonun eşleşmesi, Şampiyonlar Ligi ve Avrupa Ligi şampiyonları belli olduktan sonra yeni sezon açılışında oluşturulur.</div></div>`;
    }

    const latestHtml = latest
      ? `<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Son Oynanan UEFA Süper Kupa</div>${superCupFixtureHtml(latest.home || latest.uclWinner, latest.away || latest.uelWinner, latest)}<div class="ll-notice" style="margin-top:12px"><b>Son şampiyon:</b> ${escape(latest.winner || '—')} · Sezon ${escape(latest.season)}</div></div>`
      : '';

    globalThis.llArea().innerHTML = `<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Müsabaka <em>Merkezi</em></div><div class="ll-muted">Sezon ${escape(state.season)} · Avrupa kupaları ve UEFA Süper Kupa</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div>${tabs}${subtabs}<div class="ll-cup-status"><div class="ll-metric"><strong>${escape(status)}</strong><span>Bu Sezon</span></div><div class="ll-metric"><strong>${escape(lastChampion)}</strong><span>Son Şampiyon</span></div><div class="ll-metric"><strong>${escape(lastSeason)}</strong><span>Son Oynanan Sezon</span></div></div><div class="ll-notice">UEFA Süper Kupa, Şampiyonlar Ligi şampiyonu ile Avrupa Ligi şampiyonu arasında sezon açılışında tek maç üzerinden oynanır.</div>${currentHtml}${latestHtml}<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">UEFA Süper Kupa · Geçmiş</div>${superCupHistoryTableHtml(state)}</div></div></div>`;
  }

  function attachToCompetitionCenter() {
    if (typeof globalThis.llRenderCompetitionCenter !== 'function') return;
    const original = globalThis.llRenderCompetitionCenter;
    globalThis.llRenderCompetitionCenter = function (tab, key) {
      if (tab === 'europe' && key === 'supercup') {
        renderSuperCupCompetitionCenter();
        return;
      }
      const value = original.apply(this, arguments);
      if (tab !== 'europe') return value;
      const area = typeof globalThis.llArea === 'function' ? globalThis.llArea() : null;
      if (!area || area.querySelector('[data-supercup-competition-tab]')) return value;
      const subtabs = area.querySelector('.ll-subtabs');
      if (subtabs) subtabs.insertAdjacentHTML('beforeend', '<button class="ll-btn" data-supercup-competition-tab onclick="llRenderCompetitionCenter(\'europe\',\'supercup\')">UEFA Süper Kupa</button>');
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

  function superCupAchievementCard(unlock) {
    const progress = unlock
      ? `Açıldı · S${escape(unlock.season)}${unlock.team ? ` · ${escape(unlock.team)}` : ''}`
      : 'Yalnızca yeni sezondaki canlı şampiyonlukla açılır';
    return `<div class="ll-achievement-card ${unlock ? 'done' : ''}" data-supercup-achievement>
      <div class="ll-achievement-card-head"><span>${unlock ? '🏆' : '🔒'}</span><b>UEFA Süper Kupa Şampiyonu</b></div>
      <div class="ll-sub">UEFA Süper Kupa'yı kazan.</div>
      <div class="ll-achievement-progress">${progress}</div>
      <div class="ll-achievement-reward">+${LL_SUPER_CUP_REWARD.ap} AP · +${LL_SUPER_CUP_REWARD.lp} LP</div>
    </div>`;
  }

  function attachAchievementScreen() {
    if (typeof globalThis.llRenderAchievements !== 'function') return;
    const original = globalThis.llRenderAchievements;
    globalThis.llRenderAchievements = function () {
      const value = original.apply(this, arguments);
      const state = stateOf();
      const area = typeof globalThis.llArea === 'function' ? globalThis.llArea() : null;
      if (migrateAchievementReward(state) && typeof globalThis.llSave === 'function') globalThis.llSave();
      if (!state || !area || area.querySelector('[data-supercup-achievement]')) return value;
      const titleBlock = area.querySelector('[data-competition-title-achievements]');
      const grids = titleBlock ? titleBlock.querySelectorAll('.ll-achievement-grid') : [];
      const europeGrid = grids.length ? grids[grids.length - 1] : null;
      if (!europeGrid) return value;
      const unlock = state.superCupAchievements && state.superCupAchievements[LL_SUPER_CUP_ACHIEVEMENT];
      europeGrid.insertAdjacentHTML('beforeend', superCupAchievementCard(unlock));
      return value;
      const panel = area.querySelector('.ll-panel:last-child') || area.querySelector('.ll-shell');
      if (panel) panel.insertAdjacentHTML('beforeend', `<section class="ll-panel" data-supercup-achievement><h3>UEFA SÜPER KUPA</h3><div class="ll-achievement ${unlock ? 'unlocked' : ''}"><div class="ll-achievement-icon">🏆</div><div><strong>Süper Kupa Ustası</strong><p>UEFA Süper Kupa'yı kazan.</p>${unlock ? `<small>Açıldı · S${escape(unlock.season)} · ${escape(unlock.team)}</small>` : '<small>Henüz kazanılmadı</small>'}<b>+30 AP · +40 LP</b></div></div></section>`);
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
  globalThis.llRenderSuperCupCompetitionCenter = renderSuperCupCompetitionCenter;
  globalThis.llMigrateSuperCupAchievementReward = migrateAchievementReward;
  globalThis.llRepairLegacySuperCupHistory = repairLegacySuperCupHistory;
  attachArchivePersistence();
  attachToSeasonArchive();
  attachToCompetitionCenter();
  attachAchievementScreen();
  attachSeasonStartReset();
}());
