'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'outputs', 'lexicon-fixed.html');
const LEAGUE_PATH = path.join(ROOT, 'outputs', 'league-v2.js');
const REPORT_PATH = path.join(__dirname, 'card-upgrade-system.report.json');
const POSITIONS = ['Kaleci', 'Orta Saha', 'Forvet'];

function loadRuntime() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const core = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .find(source => source.includes('LL_BALANCED_CARD_POOL'));
  if (!core) throw new Error('Main game script was not found.');

  const storage = new Map();
  const context = {
    console,
    Math,
    structuredClone: global.structuredClone,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      body: { classList: { add() {}, remove() {} } },
      createElement: () => ({
        style: {},
        classList: { add() {}, remove() {} },
        setAttribute() {},
        appendChild() {},
        click() {},
        remove() {}
      })
    },
    navigator: {},
    Audio: function Audio() {},
    speechSynthesis: { cancel() {}, speak() {} },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {}
  };
  context.window = context;
  context.__confirmResult = true;
  context.__confirmMessages = [];
  context.__alerts = [];
  context.confirm = message => {
    context.__confirmMessages.push(String(message));
    return context.__confirmResult;
  };
  context.alert = message => context.__alerts.push(String(message));
  vm.createContext(context);
  vm.runInContext(core.replace(/initDatabase\(\);\s*renderPreStart\(\);\s*$/, ''), context, {
    filename: 'lexicon-fixed.inline.js',
    timeout: 15000
  });
  vm.runInContext(fs.readFileSync(LEAGUE_PATH, 'utf8'), context, {
    filename: 'league-v2.js',
    timeout: 15000
  });
  vm.runInContext(`
    llSave=function(){};
    llRenderShop=function(){};
    llRenderDashboard=function(){};
    llShowModal=function(content){globalThis.__modalContent=content;};
    globalThis.__upgradeApi={
      LL_CARD_POOL,LL_CARD_UPGRADE_DEFINITIONS,LL_CARD_UPGRADE_LIMIT,LL_POSITIONS,
      lexLeague,llCard,llCardFamilyName,llCardDisplayRarity,llCardUpgradeBadgeHtml,llCardUpgradePreviewHtml,llShowCardPopup,
      llUpgradeTarget,llUpgradeCost,llUpgradeCard,llEnsureUpgradeState,llAiUpgradeCards,llV4RenewAiContracts,
      llEnsureTeamContracts,llChooseShopCard,llEligibleCards,llReleaseExpiredCard,
      llPrepareUpgradeReleaseTeam,llReleaseUpgradedCardToMarket
    };
  `, context);
  return { context, api: context.__upgradeApi };
}

function makeTeam(name, cards, extras = {}) {
  return {
    name,
    stars: 3,
    cards: { Kaleci: null, 'Orta Saha': null, Forvet: null, ...cards },
    usedCardFamilies: [],
    reserveCards: [],
    clubCards: { market: null },
    releasedBaseCards: [],
    cardContracts: {},
    cardUpgradeSeason: 1,
    cardUpgradesUsed: 0,
    lastResults: [],
    wins: 0,
    lockedDice: {},
    aiAp: 0,
    aiLp: 0,
    nextMatchRerolls: 0,
    sixStreaks: {},
    nextMatchBonuses: {},
    dieHistory: {},
    ...extras
  };
}

const { context, api } = loadRuntime();
const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}
function setState(player, opponents = [], overrides = {}) {
  const teams = Object.fromEntries([player, ...opponents].map(team => [team.name, team]));
  api.lexLeague.state = {
    season: 1,
    week: 1,
    seasonEnded: false,
    playerTeam: player.name,
    lp: 1000,
    ap: 1000,
    teams,
    discoveredCards: [],
    cardPerformance: {},
    ...overrides
  };
  api.lexLeague.shop = { position: null, offers: [] };
  Object.values(teams).forEach(team => {
    POSITIONS.forEach(pos => {
      const card = api.llCard(team.cards[pos]);
      if (card) team.usedCardFamilies.push(api.llCardFamilyName(card));
    });
    team.usedCardFamilies = [...new Set(team.usedCardFamilies)];
    api.llPrepareUpgradeReleaseTeam(team);
    api.llEnsureTeamContracts(team);
  });
  context.__confirmResult = true;
  context.__confirmMessages.length = 0;
  context.__alerts.length = 0;
  return api.lexLeague.state;
}

check('player upgrade spends the correct LP and stops at two upgrades per season', () => {
  const player = makeTeam('Test FK', { Kaleci: 'RBK02', 'Orta Saha': 'RBM05', Forvet: 'RBF05' });
  const state = setState(player);
  api.llUpgradeCard('Kaleci');
  api.llUpgradeCard('Orta Saha');
  const lpAfterTwo = state.lp;
  api.llUpgradeCard('Forvet');
  assert.strictEqual(player.cards.Kaleci, 'UPK01');
  assert.strictEqual(player.cards['Orta Saha'], 'UPM01');
  assert.strictEqual(player.cards.Forvet, 'RBF05');
  assert.strictEqual(player.cardUpgradesUsed, api.LL_CARD_UPGRADE_LIMIT);
  assert.strictEqual(state.lp, 660);
  assert.strictEqual(state.lp, lpAfterTwo);
});

check('upgrades are blocked outside the transfer window', () => {
  const player = makeTeam('Test FK', { Kaleci: 'RBK02' });
  const state = setState(player, [], { week: 4 });
  api.llUpgradeCard('Kaleci');
  assert.strictEqual(player.cards.Kaleci, 'RBK02');
  assert.strictEqual(player.cardUpgradesUsed, 0);
  assert.strictEqual(state.lp, 1000);
  assert(context.__alerts.some(message => message.includes('transfer döneminde')));
});

check('epic and legendary cards never have an upgrade target', () => {
  const highCards = api.LL_CARD_POOL.filter(card => card.rarity === 'epic' || card.rarity === 'legendary');
  assert(highCards.length > 0);
  assert(highCards.every(card => api.llUpgradeTarget(card.id) === null));
  assert(api.LL_CARD_UPGRADE_DEFINITIONS.every(item => ['common', 'rare'].includes(api.llCard(item.from).rarity)));
});

check('AI teams spend AI LP and obey the two-upgrade seasonal limit', () => {
  const player = makeTeam('Player FK', {});
  const ai = makeTeam('AI FK', { Kaleci: 'RBK02', 'Orta Saha': 'RBM05', Forvet: 'RBF05' }, { aiLp: 1000 });
  setState(player, [ai]);
  api.llV4RenewAiContracts(ai.name);
  const upgraded = POSITIONS.map(pos => api.llCard(ai.cards[pos])).filter(card => card?.upgradeLevel);
  const expectedSpend = upgraded.reduce((sum, card) => sum + api.llUpgradeCost(api.llCard(card.upgradeFrom)), 0);
  assert.strictEqual(upgraded.length, 2);
  assert.strictEqual(ai.cardUpgradesUsed, 2);
  assert.strictEqual(1000 - ai.aiLp, expectedSpend);
  assert.strictEqual(ai.releasedBaseCards.length, 0);
});

check('upgradeable and upgraded cards have consistent badges and plus rarity labels', () => {
  const base = api.llCard('RBK02');
  const upgraded = api.llCard('UPK01');
  assert(api.llCardUpgradeBadgeHtml(base).includes('GELİŞTİRİLEBİLİR'));
  assert(api.llCardUpgradeBadgeHtml(upgraded).includes('GELİŞTİRİLMİŞ'));
  assert(api.llCardDisplayRarity(upgraded).endsWith('+'));
  assert(!api.llCardDisplayRarity(base).endsWith('+'));
  const htmlSource = fs.readFileSync(HTML_PATH, 'utf8');
  const leagueSource = fs.readFileSync(LEAGUE_PATH, 'utf8');
  assert(htmlSource.includes('${llCardUpgradeBadgeHtml(card)}<span style="display:block">'));
  assert(htmlSource.includes('${llCardDisplayRarity(c)}</div>${llCardUpgradeBadgeHtml(c)}<div class="ll-team-name"'));
  assert(htmlSource.includes('${llEscape(c.name)}${llCardUpgradeBadgeHtml(c)}'));
  assert(htmlSource.includes('${llEscape(x.card.name)}</b>${llCardUpgradeBadgeHtml(x.card)}'));
  assert(leagueSource.includes('${llRarityLabel(card)}</div>${llCardUpgradeBadgeHtml(card)}<div class="quiz-start-title"'));
  assert(leagueSource.includes('${llCardUpgradeBadgeHtml(card)}<div class="ll-muted" style="margin:7px 0">${llRarityLabel(card)}'));
});

check('replacing an upgraded card warns, preserves history and returns only its base card to the pool', () => {
  const player = makeTeam('Test FK', { Kaleci: 'UPK01' });
  const performance = { wins: 4, draws: 2, losses: 1, triggers: 3 };
  const state = setState(player, [], {
    discoveredCards: ['RBK02', 'UPK01'],
    cardPerformance: { UPK01: { ...performance } }
  });
  api.lexLeague.shop = { position: 'Kaleci', offers: ['RBK04'], mode: 'standard' };
  api.llChooseShopCard('RBK04');
  assert.strictEqual(player.cards.Kaleci, 'RBK04');
  assert(player.releasedBaseCards.includes('RBK02'));
  assert(!player.usedCardFamilies.includes(api.llCardFamilyName(api.llCard('RBK02'))));
  assert.deepStrictEqual(state.cardPerformance.UPK01, performance);
  assert(state.discoveredCards.includes('UPK01'));
  assert(context.__confirmMessages.some(message => message.includes('geliştirmesi kalıcı olarak kaybolacak')));
  const family = api.llCardFamilyName(api.llCard('RBK02'));
  const recoverableFamilyCards = api.llEligibleCards(player.name, 'Kaleci').filter(card => api.llCardFamilyName(card) === family);
  assert.deepStrictEqual(Array.from(recoverableFamilyCards, card => card.id), ['RBK02']);

  api.lexLeague.shop = { position: 'Kaleci', offers: ['RBK02'], mode: 'standard' };
  api.llChooseShopCard('RBK02');
  assert.strictEqual(player.cards.Kaleci, 'RBK02');
  assert(!player.releasedBaseCards.includes('RBK02'));
});

check('the player can cancel the permanent upgrade-loss warning', () => {
  const player = makeTeam('Test FK', { Kaleci: 'UPK01' });
  setState(player);
  api.lexLeague.shop = { position: 'Kaleci', offers: ['RBK04'], mode: 'standard' };
  context.__confirmResult = false;
  const result = api.llChooseShopCard('RBK04');
  assert.strictEqual(result, false);
  assert.strictEqual(player.cards.Kaleci, 'UPK01');
  assert.strictEqual(player.releasedBaseCards.length, 0);
});

check('a replaced normal card can also be found again later', () => {
  const player = makeTeam('Test FK', { Kaleci: 'RBK04' });
  setState(player);
  api.lexLeague.shop = { position: 'Kaleci', offers: ['RBK02'], mode: 'standard' };
  api.llChooseShopCard('RBK02');
  assert(player.releasedBaseCards.includes('RBK04'));
  const family = api.llCardFamilyName(api.llCard('RBK04'));
  const recoverable = api.llEligibleCards(player.name, 'Kaleci').filter(card => api.llCardFamilyName(card) === family);
  assert.deepStrictEqual(Array.from(recoverable, card => card.id), ['RBK04']);
});
check('releasing an expired upgraded card also returns its base version', () => {
  const player = makeTeam('Test FK', { Kaleci: 'UPK01' });
  setState(player);
  player.cardContracts.Kaleci.remaining = 0;
  api.llReleaseExpiredCard('Kaleci');
  assert.strictEqual(player.cards.Kaleci, null);
  assert(player.releasedBaseCards.includes('RBK02'));
});


check('card detail popup opens and includes the deterministic upgrade preview', () => {
  const player = makeTeam('Test FK', { Kaleci: 'RBK02' });
  setState(player);
  context.__modalContent = '';
  api.llShowCardPopup('RBK02', player.name);
  assert(context.__modalContent.includes('Geli&#351;tirme &#246;nizlemesi'));
  assert(context.__modalContent.includes('Yaygın+'));
});

check('season opening and domestic-European ranking hooks are installed', () => {
  const leagueSource = fs.readFileSync(LEAGUE_PATH, 'utf8');
  assert(leagueSource.includes('function llRenderSeasonOpening()'));
  assert(leagueSource.includes('function llV9EuropeanPosition'));
  assert(leagueSource.includes('function llV9DecorateDashboard'));
  assert(leagueSource.includes('seasonOpeningViewed'));
});

const report = {
  generatedAt: new Date().toISOString(),
  passed: checks.length,
  failed: 0,
  checks,
  upgradeDefinitions: api.LL_CARD_UPGRADE_DEFINITIONS.length,
  upgradeLimitPerSeason: api.LL_CARD_UPGRADE_LIMIT
};
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Card upgrade system: ${checks.length} checks passed.`);

