/* Zarı Kilitle — optional 6-word pre-match risk event. */
(function () {
  'use strict';

  const VERSION = 2;
  const WORD_COUNT = 6;
  const OFFERS_PER_SEASON = 4;
  const EXCLUDED_WEEKS = new Set([1, 10, 24, 34]);

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

  function competitionLabel(fixture) {
    const label = String(fixture?.competitionLabel || '').trim();
    if (label) return label;
    const key = String(fixture?.competition || '').toLowerCase();
    if (key === 'league') return 'Lig maçı';
    if (key === 'cup') return 'Kupa maçı';
    if (key === 'europe') return 'Avrupa maçı';
    if (key === 'national') return 'Milli maç';
    return key ? key : 'Maç';
  }
  function fixtureMeta(state = stateNow(), fixture = fixtureNow()) {
    const home = fixture?.home || state?.playerTeam || 'Ev Sahibi';
    const away = fixture?.away || 'Rakip';
    const round = fixture?.roundLabel ? String(fixture.roundLabel) : (state ? `${num(state.week, 1)}. Hafta` : '');
    const metaParts = [round, competitionLabel(fixture)].filter(Boolean);
    return {
      home,
      away,
      versus: `${home} vs ${away}`,
      meta: metaParts.join(' · '),
      full: [`${home} vs ${away}`, ...metaParts].filter(Boolean).join(' · ')
    };
  }

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
    const obsoleteDemoKeys = record.events.filter(event => event?.demo === true).map(event => event.key).filter(Boolean);
    if (obsoleteDemoKeys.length) {
      record.events = record.events.filter(event => event?.demo !== true);
      obsoleteDemoKeys.forEach(key => { delete record.checked[key]; });
    }
    if (Object.prototype.hasOwnProperty.call(state, 'diceLockRiskDemoUsed')) delete state.diceLockRiskDemoUsed;
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
      quiz: null, lockedValue: null, appliedToMatch: false, matchCommitted: false, createdAt: new Date().toISOString()
    };
    record.events.push(event);
    return event;
  }

  function injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('ll-dice-lock-risk-styles')) return;
    const style = document.createElement('style');
    style.id = 'll-dice-lock-risk-styles';
    style.textContent = `
      .ll-risk-banner{--risk:#f59e0b;--risk2:#fbbf24;--risk3:#f97316;position:relative;isolation:isolate;overflow:hidden;margin:0 0 13px;padding:16px;border:1px solid rgba(251,191,36,.62);border-radius:15px;background:radial-gradient(circle at 85% 0,rgba(245,158,11,.25),transparent 38%),linear-gradient(135deg,#24140a,#35200d 52%,#181114);box-shadow:0 12px 32px rgba(120,60,10,.28),inset 0 0 26px rgba(251,191,36,.08);animation:llRiskBannerIn .55s cubic-bezier(.18,.92,.28,1.1) both}
      .ll-risk-banner:before{content:'';position:absolute;inset:0;background:linear-gradient(108deg,transparent 22%,rgba(255,220,128,.14) 48%,transparent 72%);transform:translateX(-125%);animation:llRiskSheen 4s linear infinite}
      .ll-risk-banner>*{position:relative;z-index:1}
      .ll-risk-tag{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#ffe4b5}
      .ll-risk-tag b{padding:4px 8px;border-radius:999px;color:#27170a;background:linear-gradient(135deg,#fbbf24,#f59e0b);font-size:9px}
      .ll-risk-match-meta{opacity:.92}
      .ll-risk-title{margin-top:6px;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:29px;line-height:1;color:#ffefcc;text-shadow:0 0 19px rgba(245,158,11,.28)}
      .ll-risk-title span{display:inline-block;animation:llRiskTitlePop 1.8s ease-in-out infinite}
      .ll-risk-slogan{margin-top:6px;font-size:15px;font-weight:950;color:#fff4de;text-transform:uppercase;letter-spacing:.04em}
      .ll-risk-copy{max-width:700px;margin-top:8px;color:#e6c7a2;font-size:12px;line-height:1.55}
      .ll-risk-copy strong{color:#fff6e5}
      .ll-risk-pos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}
      .ll-risk-pos{padding:11px 9px;border:1px solid rgba(251,191,36,.28);border-radius:12px;background:linear-gradient(180deg,rgba(53,34,12,.88),rgba(27,18,11,.86));color:#ffefbd;font-weight:900;cursor:pointer;transition:.18s ease}
      .ll-risk-pos:hover{transform:translateY(-2px);border-color:rgba(251,191,36,.7);box-shadow:0 8px 22px rgba(120,72,8,.18)}
      .ll-risk-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}
      .ll-risk-actions .ll-btn{flex:1;min-width:170px}
      .ll-risk-accept{background:linear-gradient(135deg,#b45309,#f59e0b)!important;color:#fffaf0!important;border-color:rgba(254,243,199,.4)!important}
      .ll-risk-banner-embers,.ll-risk-quiz-embers,.ll-risk-lock-embers{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
      .ll-risk-banner-embers i,.ll-risk-quiz-embers i,.ll-risk-lock-embers i{position:absolute;left:var(--x);bottom:-18px;width:var(--size);height:calc(var(--size)*1.38);border-radius:50% 50% 50% 0;background:radial-gradient(circle at 30% 25%,#fff9d1 0 14%,#ffcd57 31%,#ff9d28 61%,rgba(255,91,27,0) 76%);box-shadow:0 0 11px rgba(255,164,39,.82);opacity:0;animation:llRiskEmber var(--duration) linear var(--delay) infinite}
      .ll-risk-die-stage{display:flex;align-items:center;justify-content:center;min-height:150px;margin:8px 0 14px}
      .ll-risk-die{--risk-scale:1;display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:21px;border:2px solid rgba(253,230,138,.86);background:linear-gradient(145deg,#fbbf24,#b45309);color:#1c1205;font-size:52px;font-weight:1000;box-shadow:0 18px 42px rgba(180,83,9,.28),inset 0 0 18px rgba(255,255,255,.2);transform:scale(var(--risk-scale));transition:transform .42s cubic-bezier(.18,.95,.25,1.2),filter .25s ease}
      .ll-risk-die.pulse{animation:llRiskDiePulse .58s cubic-bezier(.18,.95,.25,1.3)}
      .ll-risk-die-caption{margin-top:13px;text-align:center;color:#fcd34d;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .ll-risk-last-word{margin:0 auto 10px;max-width:500px;padding:8px 10px;border:1px solid rgba(245,158,11,.32);border-radius:10px;background:rgba(120,53,15,.18);color:#fde68a;font-size:11px;font-weight:800}
      .ll-risk-quiz-theme{position:relative;isolation:isolate;overflow:hidden;border-radius:24px;background:radial-gradient(ellipse at 6% 92%,rgba(191,116,21,.22),transparent 37%),radial-gradient(ellipse at 92% 10%,rgba(255,160,38,.14),transparent 38%),#100d0f;box-shadow:0 0 0 1px rgba(255,176,54,.24),0 30px 74px rgba(0,0,0,.52),0 0 78px rgba(198,128,20,.14)}
      .ll-risk-quiz-theme .ll-panel{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(251,191,36,.82);border-radius:24px;background:radial-gradient(circle at 87% 8%,rgba(245,158,11,.22),transparent 31%),radial-gradient(circle at 8% 102%,rgba(180,105,20,.25),transparent 42%),linear-gradient(145deg,rgba(30,16,18,.96),rgba(66,39,18,.94) 54%,rgba(20,16,19,.97));box-shadow:inset 0 0 0 1px rgba(255,214,116,.08),0 0 28px rgba(238,153,25,.16),inset 0 0 55px rgba(255,180,55,.08)}
      .ll-risk-quiz-theme .ll-panel:before{content:'';position:absolute;inset:-35%;z-index:0;background:repeating-conic-gradient(from 200deg at 54% 106%,rgba(255,180,54,.12) 0deg 1deg,transparent 1.8deg 13deg);opacity:.58;animation:llRiskQuizRays 18s linear infinite}
      .ll-risk-quiz-theme .ll-panel:after{content:'';position:absolute;left:-12%;right:-12%;bottom:-16px;height:112px;z-index:0;background:radial-gradient(ellipse at 18% 96%,rgba(255,179,34,.26),transparent 38%),radial-gradient(ellipse at 52% 100%,rgba(255,208,65,.18),transparent 36%),radial-gradient(ellipse at 84% 94%,rgba(220,126,26,.22),transparent 42%);filter:blur(7px);animation:llRiskQuizGlow 2.8s ease-in-out infinite}
      .ll-risk-quiz-theme .ll-panel>*{position:relative;z-index:1}
      .ll-risk-quiz-theme .ll-topbar{border-bottom-color:rgba(255,205,83,.18)}
      .ll-risk-quiz-theme .ll-title em{color:#fbbf24;text-shadow:0 0 16px rgba(245,158,11,.42)}
      .ll-risk-quiz-theme .ll-stars{color:#fcd34d}
      .ll-risk-quiz-theme .ll-progress{background:rgba(255,173,116,.14)}
      .ll-risk-quiz-theme .ll-progress>div{background:linear-gradient(90deg,#b45309,#f59e0b,#fcd34d);box-shadow:0 0 14px rgba(245,158,11,.52)}
      .ll-risk-quiz-theme .ll-question{border:2px solid transparent;border-left-color:rgba(245,158,11,.92);border-bottom-color:rgba(245,158,11,.86);border-top-color:rgba(251,191,36,.55);border-right-color:rgba(56,189,248,.42);background:radial-gradient(circle at 93% 4%,rgba(56,189,248,.08),transparent 25%),radial-gradient(circle at 10% 99%,rgba(244,146,26,.15),transparent 34%),repeating-linear-gradient(137deg,rgba(255,205,155,.035) 0 1px,transparent 1px 13px),linear-gradient(145deg,rgba(39,29,27,.96),rgba(16,22,24,.97));box-shadow:-8px 0 22px rgba(240,145,20,.12),8px 0 25px rgba(29,116,229,.08),inset 0 0 42px rgba(0,0,0,.40)}
      .ll-risk-quiz-theme .ll-question-word,.ll-risk-quiz-theme .ll-answer{color:#fff1cf}
      .ll-risk-quiz-theme .ll-position{color:#f7c766}
      .ll-risk-quiz-theme .ll-btn.primary{background:linear-gradient(135deg,#b45309,#f59e0b)!important;border-color:rgba(255,225,184,.42)!important;color:#fff8ec!important}
      .ll-risk-quiz-theme .ll-btn.danger{border-color:rgba(255,165,84,.25)!important;background:rgba(80,45,20,.45)!important}
      .ll-risk-fixture-chip{display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 11px;border:1px solid rgba(251,191,36,.28);border-radius:999px;background:rgba(77,49,9,.28);font-size:11px;color:#fde68a}
      .ll-risk-fixture-chip b{color:#fff4cf}
      .ll-risk-final{position:relative;isolation:isolate;max-width:760px;min-height:460px;margin:0 auto;overflow:hidden;padding:38px 23px 30px;text-align:center;border:1px solid rgba(251,191,36,.55);border-radius:22px;background:radial-gradient(ellipse at 50% 20%,rgba(196,120,25,.28),transparent 54%),linear-gradient(180deg,#2a1808,#100e12 88%);box-shadow:0 24px 65px rgba(0,0,0,.55),0 0 45px rgba(189,114,22,.12)}
      .ll-risk-final:before{content:'';position:absolute;inset:-30%;z-index:-1;background:repeating-conic-gradient(from 0deg at 50% 48%,rgba(255,181,61,.10) 0deg 1deg,transparent 1.6deg 13deg);opacity:.68;animation:llRiskRays 16s linear infinite}
      .ll-risk-score{font-size:11px;letter-spacing:.14em;color:#e8c997;text-transform:uppercase}
      .ll-risk-score b{font-size:17px;color:#ffdd9b}
      .ll-risk-result-title{font-family:'Cormorant Garamond',serif;font-size:38px;line-height:1.03;font-weight:700;color:#ffefcc;text-shadow:0 0 22px rgba(245,158,11,.30);animation:llRiskRise .55s ease .28s both}
      .ll-risk-quote{margin:9px auto 18px;max-width:530px;color:#e3bf92;font-size:13px;font-style:italic;animation:llRiskRise .55s ease .42s both}
      .ll-risk-reward{display:inline-block;min-width:min(460px,100%);padding:13px 18px;border:1px solid rgba(251,191,36,.28);border-radius:13px;background:rgba(245,158,11,.10);color:#f7e0bb;font-size:13px;animation:llRiskRise .55s ease .56s both}
      .ll-risk-reward b{display:block;margin-bottom:3px;color:#fcd34d;font-family:'Cormorant Garamond',serif;font-size:20px}
      .ll-risk-choice{margin-top:21px;animation:llRiskRise .55s ease .7s both}
      .ll-risk-choice .ll-btn{min-width:260px}
      .ll-risk-lock-flip-stage{width:126px;height:126px;margin:18px auto 14px;position:relative;perspective:860px;filter:drop-shadow(0 17px 15px rgba(0,0,0,.36));animation:llRiskRise .55s ease .18s both}
      .ll-risk-lock-flip-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;animation:llRiskLockFlip 1.08s cubic-bezier(.18,.82,.22,1) both}
      .ll-risk-lock-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.45);border-radius:24px;color:#1f1206;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:inset 0 2px 0 rgba(255,255,255,.52),inset 0 -7px 13px rgba(0,0,0,.26),0 11px 24px rgba(0,0,0,.32);overflow:hidden}
      .ll-risk-lock-face::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.35),transparent 42%,rgba(0,0,0,.11));pointer-events:none}
      .ll-risk-lock-face.front{transform:rotateY(0deg);background:linear-gradient(145deg,#fde68a,#f59e0b)}
      .ll-risk-lock-face.back{transform:rotateY(180deg);background:linear-gradient(145deg,#fbbf24,#b45309)}
      .ll-risk-lock-label{position:absolute;top:10px;left:0;right:0;text-align:center;font-size:9px;font-weight:900;letter-spacing:1.35px;opacity:.7}
      .ll-risk-lock-icon{position:relative;z-index:1;font-size:34px;line-height:1;margin-top:5px;filter:drop-shadow(0 2px 1px rgba(0,0,0,.19))}
      .ll-risk-lock-value{position:relative;z-index:1;margin-top:6px;font-size:28px;font-weight:1000;letter-spacing:.4px}
      .ll-risk-lock-sub{margin-top:4px;font-size:11px;font-weight:900;color:#3b2207;opacity:.82}
      .ll-risk-match-badge{margin-top:11px;padding:10px 12px;border:1px solid rgba(245,158,11,.36);border-radius:11px;background:rgba(69,39,5,.28);color:#fde68a;font-size:11px;line-height:1.45}
      .ll-risk-locked .ll-die{box-shadow:0 0 0 2px rgba(245,158,11,.35),0 15px 30px rgba(180,83,9,.18)!important}
      .ll-risk-locked .ll-die-info:after{content:'KİLİTLİ';display:inline-block;margin-top:4px;padding:2px 6px;border-radius:999px;background:rgba(180,83,9,.24);color:#fcd34d;font-size:8px;font-weight:950;letter-spacing:.08em}
      .ll-risk-upgrade-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 50% 45%,rgba(245,158,11,.20),transparent 32%),rgba(4,4,7,.92);backdrop-filter:blur(7px);overflow:hidden;animation:llRiskUpgradeFadeIn .18s ease both}
      .ll-risk-upgrade-overlay:before{content:'';position:absolute;inset:-35%;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,194,74,.11) 0deg 1.1deg,transparent 1.8deg 11deg);animation:llRiskUpgradeRays 4.2s linear infinite}
      .ll-risk-upgrade-overlay:after{content:'';position:absolute;width:min(76vw,560px);height:min(76vw,560px);border-radius:50%;border:1px solid rgba(251,191,36,.22);box-shadow:0 0 80px rgba(245,158,11,.18),inset 0 0 90px rgba(245,158,11,.08);animation:llRiskUpgradeHalo 1.35s ease-out both}
      .ll-risk-upgrade-overlay.maxed{background:radial-gradient(circle at 50% 45%,rgba(250,204,21,.30),transparent 30%),radial-gradient(circle at 50% 50%,rgba(255,255,255,.05),transparent 42%),rgba(4,4,7,.94);animation:llRiskUpgradeMaxShake .42s ease .88s both,llRiskUpgradeFadeIn .18s ease both}
      .ll-risk-upgrade-card{position:relative;z-index:2;width:min(92vw,620px);text-align:center;color:#fff7df;isolation:isolate}
      .ll-risk-upgrade-kicker{font-size:11px;font-weight:1000;letter-spacing:.22em;text-transform:uppercase;color:#fcd34d;text-shadow:0 0 16px rgba(245,158,11,.5);animation:llRiskUpgradeRise .36s ease both}
      .ll-risk-upgrade-title{margin-top:7px;font-family:'Cormorant Garamond',serif;font-size:clamp(30px,7vw,56px);line-height:.98;font-weight:800;text-transform:uppercase;letter-spacing:.02em;text-shadow:0 0 30px rgba(245,158,11,.38);animation:llRiskUpgradeRise .45s cubic-bezier(.2,.9,.2,1) .08s both}
      .ll-risk-upgrade-sub{margin-top:9px;font-size:12px;font-weight:850;color:#e8c58e;letter-spacing:.04em;animation:llRiskUpgradeRise .4s ease .16s both}
      .ll-risk-upgrade-stage{position:relative;width:220px;height:220px;margin:22px auto 12px;display:grid;place-items:center;perspective:900px;filter:drop-shadow(0 22px 24px rgba(0,0,0,.55))}
      .ll-risk-upgrade-ring,.ll-risk-upgrade-ring:before,.ll-risk-upgrade-ring:after{position:absolute;content:'';inset:18px;border-radius:50%;border:2px solid rgba(251,191,36,.35);box-shadow:0 0 28px rgba(245,158,11,.18)}
      .ll-risk-upgrade-ring{animation:llRiskUpgradeRing 1.28s cubic-bezier(.18,.82,.2,1) both}
      .ll-risk-upgrade-ring:before{inset:18px;border-style:dashed;animation:llRiskUpgradeSpinRing 2.4s linear infinite}
      .ll-risk-upgrade-ring:after{inset:-18px;border-color:rgba(255,255,255,.12);animation:llRiskUpgradeRingOuter 1.28s ease-out both}
      .ll-risk-upgrade-die{position:relative;width:126px;height:126px;transform-style:preserve-3d;animation:llRiskUpgradeDie 1.28s cubic-bezier(.16,.88,.18,1.08) both}
      .ll-risk-upgrade-die:before{content:'✦';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:27px;border:2px solid rgba(255,245,205,.62);background:linear-gradient(145deg,#6f3b08,#b86a0b 58%,#6a3406);color:#ffe8a5;font-size:34px;font-weight:1000;line-height:1;transform:rotateY(180deg) translateZ(2px);backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:inset 0 3px 0 rgba(255,255,255,.24),inset 0 -13px 24px rgba(35,14,0,.34),0 0 35px rgba(245,158,11,.22);text-shadow:0 0 18px rgba(255,225,130,.45)}
      .ll-risk-upgrade-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:27px;border:2px solid rgba(255,245,205,.78);backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;color:#261506;font-size:70px;font-weight:1000;line-height:1;box-shadow:inset 0 3px 0 rgba(255,255,255,.58),inset 0 -13px 24px rgba(88,36,0,.28),0 0 44px rgba(245,158,11,.28)}
      .ll-risk-upgrade-face:after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.42),transparent 37%,rgba(94,40,0,.14));pointer-events:none}
      .ll-risk-upgrade-face.old{background:linear-gradient(145deg,#d4a33c,#8f4d08);transform:translateZ(3px);animation:llRiskUpgradeOldFace .18s ease .58s both}
      .ll-risk-upgrade-face.new{background:linear-gradient(145deg,#fff1a7,#f59e0b 62%,#b45309);transform:translateZ(4px);opacity:0;text-shadow:0 2px 0 rgba(255,255,255,.2);animation:llRiskUpgradeNewFace .22s ease .78s both}
      .ll-risk-upgrade-overlay.hold .ll-risk-upgrade-face.new{font-size:64px}
      .ll-risk-upgrade-burst{position:absolute;inset:0;pointer-events:none}
      .ll-risk-upgrade-burst i{position:absolute;left:50%;top:50%;width:5px;height:20px;border-radius:999px;background:linear-gradient(#fff7c2,#f59e0b);box-shadow:0 0 12px rgba(251,191,36,.95);transform-origin:50% 108px;opacity:0;animation:llRiskUpgradeSpark .78s ease-out calc(.66s + var(--d)) both;transform:translate(-50%,-50%) rotate(var(--r)) translateY(-86px) scale(.4)}
      .ll-risk-upgrade-value{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:800;color:#fff0c7;animation:llRiskUpgradeValue .52s cubic-bezier(.2,.9,.18,1.15) .76s both}
      .ll-risk-upgrade-value b{color:#fbbf24;font-size:1.18em}
      .ll-risk-upgrade-max{margin-top:7px;font-size:12px;font-weight:1000;letter-spacing:.17em;text-transform:uppercase;color:#fde68a;text-shadow:0 0 18px rgba(250,204,21,.6);animation:llRiskUpgradeMaxText .56s cubic-bezier(.2,.9,.18,1.2) .9s both}
      .ll-risk-upgrade-overlay.exiting{animation:llRiskUpgradeFadeOut .22s ease both}
      @keyframes llRiskBannerIn{from{opacity:0;transform:translateY(15px) scale(.97)}to{opacity:1;transform:none}}
      @keyframes llRiskSheen{to{transform:translateX(135%)}}
      @keyframes llRiskTitlePop{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.08)}}
      @keyframes llRiskDiePulse{0%{transform:scale(var(--risk-scale)) rotate(0)}40%{transform:scale(calc(var(--risk-scale) + .22)) rotate(-5deg);filter:brightness(1.35)}72%{transform:scale(calc(var(--risk-scale) + .08)) rotate(3deg)}100%{transform:scale(var(--risk-scale)) rotate(0)}}
      @keyframes llRiskQuizRays{to{transform:rotate(1turn)}}
      @keyframes llRiskQuizGlow{0%,100%{opacity:.6;transform:translateY(0) scale(.94)}50%{opacity:1;transform:translateY(-7px) scale(1.05)}}
      @keyframes llRiskEmber{0%{opacity:0;transform:translateX(-50%) translateY(0) scale(.35)}10%{opacity:.90}64%{opacity:.68}100%{opacity:0;transform:translateX(calc(-50% + var(--dx))) translateY(var(--dy)) scale(.18) rotate(150deg)}}
      @keyframes llRiskRays{to{transform:rotate(1turn)}}
      @keyframes llRiskRise{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:none}}
      @keyframes llRiskLockFlip{0%{transform:rotateY(0deg) rotateX(0deg) scale(.84);opacity:0}18%{opacity:1;transform:rotateY(0deg) rotateX(-5deg) scale(1.04)}52%{transform:rotateY(94deg) rotateX(5deg) scale(1.08)}100%{transform:rotateY(180deg) rotateX(0deg) scale(1)}}
      @keyframes llRiskUpgradeFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes llRiskUpgradeFadeOut{to{opacity:0;transform:scale(1.018)}}
      @keyframes llRiskUpgradeRise{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
      @keyframes llRiskUpgradeRays{to{transform:rotate(1turn)}}
      @keyframes llRiskUpgradeHalo{0%{opacity:0;transform:scale(.45)}34%{opacity:1}100%{opacity:.2;transform:scale(1.24)}}
      @keyframes llRiskUpgradeRing{0%{opacity:0;transform:scale(.38) rotate(-18deg)}36%{opacity:1;transform:scale(1.08) rotate(5deg)}100%{opacity:.5;transform:scale(1) rotate(0)}}
      @keyframes llRiskUpgradeRingOuter{0%{opacity:0;transform:scale(.6)}58%{opacity:.8}100%{opacity:0;transform:scale(1.55)}}
      @keyframes llRiskUpgradeSpinRing{to{transform:rotate(1turn)}}
      @keyframes llRiskUpgradeDie{0%{opacity:0;transform:translateY(44px) rotateX(-34deg) rotateY(0deg) scale(.58)}22%{opacity:1;transform:translateY(0) rotateX(6deg) rotateY(0deg) scale(.95)}44%{transform:translateY(-9px) rotateX(-8deg) rotateY(88deg) scale(1.13)}58%{transform:translateY(-6px) rotateX(2deg) rotateY(180deg) scale(1.28)}76%{transform:translateY(-2px) rotateX(3deg) rotateY(286deg) scale(1.30)}88%{transform:translateY(0) rotateX(0) rotateY(374deg) scale(1.11)}100%{transform:translateY(0) rotateX(0) rotateY(360deg) scale(1)}}
      @keyframes llRiskUpgradeOldFace{from{opacity:1}to{opacity:0}}
      @keyframes llRiskUpgradeNewFace{from{opacity:0;filter:brightness(1.8)}to{opacity:1;filter:brightness(1)}}
      @keyframes llRiskUpgradeSpark{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) translateY(-68px) scale(.25)}22%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) translateY(-142px) scale(.9)}}
      @keyframes llRiskUpgradeValue{from{opacity:0;transform:translateY(10px) scale(.82)}to{opacity:1;transform:none}}
      @keyframes llRiskUpgradeMaxText{0%{opacity:0;transform:scale(.72);letter-spacing:.28em}70%{opacity:1;transform:scale(1.09)}100%{opacity:1;transform:scale(1)}}
      @keyframes llRiskUpgradeMaxShake{0%,100%{transform:none}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
      @media(max-width:650px){.ll-risk-pos-grid{grid-template-columns:1fr}.ll-risk-title{font-size:27px}.ll-risk-slogan{font-size:13px}.ll-risk-result-title{font-size:32px}.ll-risk-reward{min-width:100%}.ll-risk-actions{flex-direction:column}.ll-risk-final{min-height:420px;padding:30px 14px 24px}}
      @media(prefers-reduced-motion:reduce){.ll-risk-banner:before,.ll-risk-title span,.ll-risk-die.pulse,.ll-risk-quiz-theme .ll-panel:before,.ll-risk-quiz-theme .ll-panel:after,.ll-risk-banner-embers i,.ll-risk-quiz-embers i,.ll-risk-lock-embers i,.ll-risk-lock-flip-inner,.ll-risk-final:before,.ll-risk-upgrade-overlay:before,.ll-risk-upgrade-overlay:after,.ll-risk-upgrade-ring,.ll-risk-upgrade-ring:before,.ll-risk-upgrade-ring:after,.ll-risk-upgrade-die,.ll-risk-upgrade-burst i,.ll-risk-upgrade-kicker,.ll-risk-upgrade-title,.ll-risk-upgrade-sub,.ll-risk-upgrade-value,.ll-risk-upgrade-max{animation:none!important}.ll-risk-lock-flip-inner{transform:rotateY(180deg)}.ll-risk-upgrade-die{transform:none}.ll-risk-upgrade-face.old{display:none}.ll-risk-upgrade-face.new{opacity:1;animation:none!important}.ll-risk-banner-embers i,.ll-risk-quiz-embers i,.ll-risk-lock-embers i{opacity:.35;transform:translateX(-50%) translateY(-48px)}}
    `;
    document.head.appendChild(style);
  }

  function createRiskEmbers(scope = document) {
    scope.querySelectorAll('.ll-risk-banner-embers,.ll-risk-quiz-embers,.ll-risk-lock-embers').forEach(host => {
      if (host.dataset.embersReady === '1') return;
      host.dataset.embersReady = '1';
      const isBanner = host.classList.contains('ll-risk-banner-embers');
      const isLock = host.classList.contains('ll-risk-lock-embers');
      const count = isBanner ? 18 : isLock ? 30 : 26;
      for (let i = 0; i < count; i++) {
        const ember = document.createElement('i');
        ember.style.setProperty('--x', `${isBanner ? 3 + Math.random() * 94 : 30 + Math.random() * 40}%`);
        ember.style.setProperty('--dx', `${(Math.random() - .5) * (isBanner ? 105 : 190)}px`);
        ember.style.setProperty('--dy', `${-(isBanner ? 115 + Math.random() * 105 : 80 + Math.random() * 180)}px`);
        ember.style.setProperty('--size', `${isBanner ? 2.4 + Math.random() * 3.6 : 3 + Math.random() * 5}px`);
        ember.style.setProperty('--duration', `${isBanner ? 1.6 + Math.random() * 1.8 : 1.8 + Math.random() * 1.7}s`);
        ember.style.setProperty('--delay', `${-Math.random() * 3.1}s`);
        host.appendChild(ember);
      }
    });
  }

function bannerHtml(event, state) {
    if (!event || !['offered', 'position'].includes(event.status)) return '';
    const positionButtons = positions().map(position => `<button class="ll-risk-pos" onclick="llDiceLockChoosePosition('${esc(position)}')">${icon(position)} ${esc(position)}<br><span style="font-size:9px;opacity:.72">BU ZARI RİSKE AT</span></button>`).join('');
    const info = fixtureMeta(state, fixtureNow());
    const tagLabel = 'Maç Öncesi Risk';
    return `<div class="ll-risk-banner" data-dice-lock-risk><div class="ll-risk-banner-embers" aria-hidden="true"></div><div class="ll-risk-tag"><b>${tagLabel}</b><span class="ll-risk-match-meta">${esc(info.versus)} · ${esc(info.meta || 'Özel maç')}</span></div><div class="ll-risk-title"><span>🎲</span> Zarı Kilitle</div><div class="ll-risk-slogan">Taraftar arkanda. Riski al.</div><div class="ll-risk-copy"><strong>Bir mevki seç.</strong> 6 kelimeyi çöz. Doğru sayın, seçtiğin mevkinin bu maçtaki <strong>doğrudan zar değeri</strong> olur. Bu zar daha sonra reroll edilemez ve +1 bonusundan etkilenmez.</div><div class="ll-risk-pos-grid">${positionButtons}</div><div class="ll-risk-actions"><button class="ll-btn" onclick="llDiceLockSkip()">Güvenli Oyna · Geç</button></div></div>`;
  }

function decorateDashboard() {
    const state = stateNow(), fixture = fixtureNow(), root = area();
    if (!state || !fixture || !root) return;
    ensureSystem(state);
    let event = currentEvent(state, fixture);
    if (!event) event = maybeCreateEvent(state, fixture);
    const next = root.querySelector('.ll-next-match'), card = next?.closest('.ll-card');
    if (event && !root.querySelector('[data-dice-lock-risk]')) {
      const html = bannerHtml(event, state);
      if (html) {
        if (next) next.insertAdjacentHTML('beforebegin', html);
        else if (card) card.insertAdjacentHTML('afterbegin', html);
        else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend', html);
      }
    }
    setTimeout(() => createRiskEmbers(root), 20);
    save();
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
    const info = fixtureMeta();
    area().innerHTML=`<div class="ll-shell ll-quiz-card ll-risk-quiz-theme"><div class="ll-panel"><div class="ll-risk-quiz-embers"></div><div class="ll-risk-fixture-chip"><span>🎯 <b>${esc(info.versus)}</b></span><span>${esc(info.meta || 'Özel maç')}</span></div><div class="ll-topbar"><div><div class="ll-title">🎲 Zarı <em>Kilitle</em></div><div class="ll-muted">${icon(event.position)} ${esc(event.position)} · ${quiz.index+1}/${WORD_COUNT} · doğru sayısı = kilitli zar</div></div><div class="ll-stars">Doğru: ${quiz.correct}/${WORD_COUNT}</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-risk-die-stage"><div><div class="ll-risk-die" style="--risk-scale:${scale}">${currentValue}</div><div class="ll-risk-die-caption">Şu an kilitlenecek zar: ${currentValue}</div></div></div>${finalWord&&quiz.correct===5?'<div class="ll-risk-last-word">🔥 SON KELİME · Doğru bilirsen zarın doğrudan 6 olacak.</div>':''}<div class="ll-question" onclick="llDiceLockReveal()"><div><div class="ll-position">${askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${quiz.revealed?`<div class="ll-answer">${answerHtml}${fullExampleHtml}</div>`:'<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${quiz.revealed?'':'opacity:.35;pointer-events:none'}"><button type="button" class="ll-btn danger" onclick="llDiceLockRate(false)">✕ Bilmiyorum</button><button type="button" class="ll-btn primary" onclick="llDiceLockRate(true)">✓ Bildim</button></div></div></div></div>`;
    quiz.lastCorrect=false;
    setTimeout(() => createRiskEmbers(area()), 20);
    try { globalThis.markNewWordFrame?.(word, area().querySelector('.ll-question')); } catch {}
  }


  function playDieUpgradeCinematic(event, fromValue, toValue, done) {
    const finish = typeof done === 'function' ? done : function(){};
    if (typeof document === 'undefined') { finish(); return; }
    document.querySelectorAll('.ll-risk-upgrade-overlay').forEach(node => node.remove());
    const upgraded = toValue > fromValue;
    const maxed = upgraded && toValue === 6;
    const overlay = document.createElement('div');
    overlay.className = `ll-risk-upgrade-overlay${maxed ? ' maxed' : ''}${upgraded ? '' : ' hold'}`;
    const sparks = Array.from({length:maxed ? 28 : 20}, (_, i) => {
      const r = Math.round((360 / (maxed ? 28 : 20)) * i + ((i % 3) - 1) * 4);
      const d = ((i % 7) * .018).toFixed(3);
      return `<i style="--r:${r}deg;--d:${d}s"></i>`;
    }).join('');
    const headline = maxed ? 'MAKSİMUM ZAR!' : upgraded ? 'ZAR GÜÇLENİYOR' : 'ZAR ENERJİ TOPLADI';
    const valueLine = upgraded
      ? `<span>${fromValue}</span> <span style="opacity:.55">→</span> <b>${toValue}</b>`
      : `<span>${fromValue}</span> <span style="opacity:.65">·</span> <b>+1 DOĞRU</b>`;
    const sub = maxed
      ? 'Son sınır aşıldı. Seçtiğin mevki artık 6.'
      : upgraded
        ? `${icon(event?.position)} ${esc(event?.position)} zarı yeni seviyesine çıkıyor.`
        : 'İlk doğru cevap geldi. Bir sonraki doğru zar değerini yükseltecek.';
    overlay.innerHTML = `<div class="ll-risk-upgrade-card"><div class="ll-risk-upgrade-kicker">✓ DOĞRU CEVAP</div><div class="ll-risk-upgrade-title">${headline}</div><div class="ll-risk-upgrade-sub">${sub}</div><div class="ll-risk-upgrade-stage"><div class="ll-risk-upgrade-ring"></div><div class="ll-risk-upgrade-burst">${sparks}</div><div class="ll-risk-upgrade-die"><div class="ll-risk-upgrade-face old">${fromValue}</div><div class="ll-risk-upgrade-face new">${toValue}</div></div></div><div class="ll-risk-upgrade-value">${valueLine}</div>${maxed?'<div class="ll-risk-upgrade-max">🔥 ZAR 6 · TAM GÜÇ</div>':''}</div>`;
    document.body.appendChild(overlay);
    try { if (navigator.vibrate) navigator.vibrate(maxed ? [35,35,70] : [25,25,45]); } catch {}
    const reduced = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const hold = reduced ? 520 : (maxed ? 2050 : 1700);
    setTimeout(() => {
      overlay.classList.add('exiting');
      setTimeout(() => { overlay.remove(); finish(); }, reduced ? 30 : 220);
    }, hold);
  }

function rateQuiz(correct) {
    const state=stateNow(), event=currentEvent(state), quiz=event?.quiz;
    if(!state||!event||!quiz||!quiz.revealed||quiz.completed||quiz.answerBusy)return;
    const index=num(quiz.index),ref=quiz.queue?.[index]; if(!ref)return;
    const beforeCorrect=num(quiz.correct), fromValue=dieValue(beforeCorrect);
    quiz.answerBusy=true;
    if(correct)quiz.correct++;
    const toValue=dieValue(quiz.correct);
    quiz.lastCorrect=false;
    quiz.index=index+1;
    quiz.shown=num(quiz.shown)+1;
    quiz.revealed=false;
    try{globalThis.llRecordSeasonVocabularyAnswer?.({correct:!!correct,fixture:fixtureNow(),quiz,answerIndex:index,eventType:'dice-lock-risk'});}catch{}
    try{globalThis.llPersistQuizWordRating?.(ref,quiz,!!correct,{markUsed:false});}catch{}
    try{markWordUsed(ref,state);}catch{}
    quiz.answerBusy=false;
    save();
    const advance=()=>{ if(quiz.index>=quiz.queue.length)finishQuiz(event);else renderQuiz(event); };
    if(correct) playDieUpgradeCinematic(event,fromValue,toValue,advance);
    else advance();
  }

  function finishQuiz(event) {
    const quiz=event?.quiz;if(!event||!quiz||quiz.completed)return;
    quiz.completed=true;quiz.totalAnswered=quiz.index;event.lockedValue=dieValue(quiz.correct);event.status='completed';event.completedAt=new Date().toISOString();save();renderOutcome(event);
  }
  function renderOutcome(event) {
    const value = dieValue(event.quiz?.correct);
    const info = fixtureMeta();
    area().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-risk-final"><div class="ll-risk-lock-embers"></div><div class="ll-risk-score">SONUÇ · <b>${num(event.quiz?.correct)}/${WORD_COUNT}</b> DOĞRU</div><div class="ll-risk-lock-flip-stage" aria-label="${esc(event.position)} zarı kilitlendi"><div class="ll-risk-lock-flip-inner"><div class="ll-risk-lock-face front"><span class="ll-risk-lock-label">RİSK</span><span class="ll-risk-lock-icon">${icon(event.position)}</span><span class="ll-risk-lock-value">?</span><span class="ll-risk-lock-sub">Seçilen mevki</span></div><div class="ll-risk-lock-face back"><span class="ll-risk-lock-label">KİLİTLENDİ</span><span class="ll-risk-lock-icon">${icon(event.position)}</span><span class="ll-risk-lock-value">${value}</span><span class="ll-risk-lock-sub">Doğrudan zar</span></div></div></div><div class="ll-risk-result-title">Zar Kilitlendi</div><div class="ll-risk-quote">“Taraftar arkanda. Riski aldın. Şimdi sonucu sahaya taşı.”</div><div class="ll-risk-reward"><b>${icon(event.position)} ${esc(event.position)} · ${value}</b>Bu maçta seçtiğin mevkinin zarı doğrudan <strong>${value}</strong> olarak uygulanır. Reroll ve 10/10 +1 bonusu bu zarı değiştiremez.</div><div class="ll-risk-match-badge"><b>🎯 ${esc(info.versus)}</b><br>${esc(info.meta || 'Özel maç')} · Bu sonuç yalnızca bu maça uygulanır.</div><div class="ll-risk-choice"><button class="ll-btn ll-risk-accept" onclick="llDiceLockContinue()">Normal Maç Sınavına Geç</button></div></div></div>`;
    setTimeout(() => createRiskEmbers(area()), 20);
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
    match.diceLockRisk={key:event.key,position:event.position,value:dieValue(event.lockedValue),correct:num(event.quiz?.correct)};
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
    const html=`<div class="ll-risk-match-badge" data-dice-lock-match><b>🎲 Zarı Kilitle · ${lock.correct}/${WORD_COUNT}</b><br>${icon(lock.position)} ${esc(lock.position)} zarı bu maç doğrudan <b>${lock.value}</b> · reroll ve +1 etkisiz.</div>`;
    const notice=root.querySelector('.ll-notice');if(notice)notice.insertAdjacentHTML('afterend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('afterbegin',html);
  }

  function wrap(name,builder,flag='__diceLockRisk') {
    const base=globalThis[name];if(typeof base!=='function'||base[flag])return false;const wrapped=builder(base);wrapped[flag]=true;wrapped[`${flag}Base`]=base;globalThis[name]=wrapped;return true;
  }
  function install() {
    try { document.querySelectorAll('[data-dice-lock-demo]').forEach(node => node.remove()); } catch {}
    try { delete globalThis.llDiceLockStartDemo; } catch { globalThis.llDiceLockStartDemo = undefined; }
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
  globalThis.llDiceLockReveal=function(){const event=currentEvent(),quiz=event?.quiz;if(!quiz||quiz.completed)return;quiz.revealed=true;save();renderQuiz(event);};
  globalThis.llDiceLockRate=rateQuiz;
  globalThis.llDiceLockContinue=continueNormalQuiz;
  globalThis.llDiceLockRiskTestApi={VERSION,WORD_COUNT,OFFERS_PER_SEASON,fixtureKey,dieValue,ensureSystem,isEligible,maybeCreateEvent,applyLockToDice};

  install();
})();
