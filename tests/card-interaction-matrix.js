'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'outputs', 'lexicon-fixed.html');
const LEAGUE_V2_PATH = path.join(ROOT, 'outputs', 'league-v2.js');
const REPORT_PATH = path.join(__dirname, 'card-interaction-matrix.report.json');
const POSITIONS = ['Kaleci', 'Orta Saha', 'Forvet'];
const ALLOWED_POSITIONS = new Set([...POSITIONS, 'Evrensel', 'Kulüp/Market']);
const RARITY_RANK = { common: 1, rare: 2, epic: 3, legendary: 4 };

function loadGameRuntime() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const core = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .find(source => source.includes('LL_BALANCED_CARD_POOL'));
  if (!core) throw new Error('Main game script was not found.');

  const storage = new Map();
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0.38196601125;
  const context = {
    console,
    Math: deterministicMath,
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
    alert() {},
    confirm: () => true,
    Audio: function Audio() {},
    speechSynthesis: { cancel() {}, speak() {} },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {}
  };
  context.window = context;
  vm.createContext(context);

  const coreWithoutBoot = core.replace(/initDatabase\(\);\s*renderPreStart\(\);\s*$/, '');
  vm.runInContext(coreWithoutBoot, context, { filename: 'lexicon-fixed.inline.js', timeout: 15000 });
  vm.runInContext(fs.readFileSync(LEAGUE_V2_PATH, 'utf8'), context, {
    filename: 'league-v2.js',
    timeout: 15000
  });
  vm.runInContext(
    'globalThis.__matrixApi={LL_CARD_POOL,llResolveBattle,llPrepareScouting,llBaseName,llCard,lexLeague,llEnsureTeamContracts};',
    context
  );
  return context.__matrixApi;
}

const api = loadGameRuntime();
const cards = [...api.LL_CARD_POOL];
const family = card => api.llBaseName(card);
const cardById = new Map(cards.map(card => [card.id, card]));
const families = [...new Set(cards.map(family))].sort((a, b) => a.localeCompare(b, 'tr'));
const variants = cards.flatMap(card =>
  (card.clubCard ? [] : card.position === 'Evrensel' ? POSITIONS : [card.position]).map(slot => ({ card, slot }))
);
const catalogFailures = [];
const balanceWarnings = [];
function auditCatalog() {
  const seenIds = new Set();
  for (const card of cards) {
    if (!card.id || seenIds.has(card.id)) catalogFailures.push(`Duplicate or empty card id: ${card.id || '(empty)'}`);
    seenIds.add(card.id);
    if (!ALLOWED_POSITIONS.has(card.position)) catalogFailures.push(`${card.id}: invalid position ${card.position}`);
    if (!RARITY_RANK[card.rarity]) catalogFailures.push(`${card.id}: invalid rarity ${card.rarity}`);
    if (!Number.isInteger(card.minStar) || card.minStar < 1 || card.minStar > 6) catalogFailures.push(`${card.id}: invalid minStar ${card.minStar}`);
    for (const field of ['name', 'trigger', 'effect']) {
      if (typeof card[field] !== 'string' || !card[field].trim()) catalogFailures.push(`${card.id}: empty ${field}`);
    }
  }
  for (const base of families) {
    const members = cards.filter(card => family(card) === base);
    const positions = [...new Set(members.map(card => card.position))];
    if (positions.length > 1) catalogFailures.push(`${base}: family spans incompatible positions: ${positions.join(', ')}`);
    const ordered = members.slice().sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] || a.minStar - b.minStar);
    let highestRequiredStar = 0;
    let previous = null;
    for (const card of ordered) {
      if (previous && RARITY_RANK[card.rarity] > RARITY_RANK[previous.rarity] && card.minStar < highestRequiredStar) {
        balanceWarnings.push({ type: 'min-star-regression', family: base, lower: `${previous.id}/${previous.rarity}/${highestRequiredStar} star`, higher: `${card.id}/${card.rarity}/${card.minStar} star` });
      }
      highestRequiredStar = Math.max(highestRequiredStar, card.minStar);
      previous = card;
    }
  }
  const mechanics = new Map();
  for (const card of cards) {
    const key = `${card.rarity}|${card.trigger}|${card.effect}`;
    if (!mechanics.has(key)) mechanics.set(key, []);
    mechanics.get(key).push(card);
  }
  for (const group of mechanics.values()) {
    const distinctFamilies = [...new Set(group.map(family))];
    if (distinctFamilies.length > 1) {
      balanceWarnings.push({ type: 'cross-family-mechanic-duplicate', rarity: group[0].rarity, families: distinctFamilies, cards: group.map(card => card.id) });
    }
  }
}
auditCatalog();

function uniqueScenarios() {
  const raw = [
    [[1, 1, 1], [1, 1, 1]], [[2, 2, 2], [3, 3, 3]], [[3, 3, 3], [2, 2, 2]],
    [[4, 4, 4], [4, 4, 4]], [[5, 5, 5], [6, 6, 6]], [[6, 6, 6], [5, 5, 5]],
    [[5, 4, 4], [2, 4, 3]], [[2, 3, 4], [4, 3, 2]], [[4, 2, 4], [3, 3, 3]],
    [[6, 1, 5], [1, 6, 2]], [[1, 4, 6], [6, 4, 1]], [[3, 5, 6], [4, 5, 5]],
    [[2, 4, 6], [3, 5, 6]], [[4, 6, 5], [5, 4, 6]], [[5, 5, 2], [5, 3, 2]],
    [[3, 2, 6], [4, 5, 1]]
  ];
  for (let value = 1; value <= 6; value++) {
    raw.push([[value, 2, 5], [value, 4, 3]]);
    raw.push([[2, value, 5], [4, value, 3]]);
    raw.push([[2, 5, value], [4, 3, value]]);
  }
  const seen = new Set();
  return raw.filter(([a, b]) => {
    const key = `${a.join('')}:${b.join('')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const scenarios = uniqueScenarios();
const blankCards = () => ({ Kaleci: null, 'Orta Saha': null, Forvet: null });

function teamState(name, assignedCards, stars = 6) {
  return {
    name,
    stars,
    cards: { ...blankCards(), ...assignedCards },
    cardContracts: {},
    usedCardFamilies: [],
    lastResults: ['L', 'L'],
    wins: 6,
    lockedDice: {},
    aiAp: 1000,
    aiLp: 1000,
    nextMatchRerolls: 0,
    sixStreaks: { Kaleci: 2, 'Orta Saha': 2, Forvet: 2 },
    nextMatchBonuses: {}
  };
}

function formResults() {
  const results = [];
  for (let index = 0; index < 6; index++) {
    results.push({ season: 2, home: 'A', away: `AX${index}`, homeGoals: 2, awayGoals: 0 });
    results.push({ season: 2, home: 'B', away: `BX${index}`, homeGoals: 2, awayGoals: 0 });
  }
  return results;
}

function installState(cardsA, cardsB, options = {}) {
  const a = teamState('A', cardsA, options.starsA || 6);
  const b = teamState('B', cardsB, options.starsB || 6);
  if(options.dieHistoryA)a.dieHistory=options.dieHistoryA;if(options.dieHistoryB)b.dieHistory=options.dieHistoryB;
  api.lexLeague.state = {
    season: 2,
    week: 10,
    playerTeam: 'A',
    teams: { A: a, B: b },
    results: formResults(),
    ap: 0,
    lp: 0
  };
  api.lexLeague.match = null;
  api.llEnsureTeamContracts(a);
  api.llEnsureTeamContracts(b);
}

function makeDice(teamName, values, assignedCards) {
  return POSITIONS.map((position, index) => ({
    uid: `${teamName}-${position}`,
    position,
    value: values[index],
    stars: api.lexLeague.state.teams[teamName].stars,
    cardId: assignedCards[position] || null
  }));
}

function normalizeTriggered(result, side) {
  return (result.triggeredCardIds?.[side] || [])
    .map(id => `${id}:${family(cardById.get(id))}`)
    .sort();
}

function normalizeLocks(locks) {
  return Object.entries(locks || {}).sort(([a], [b]) => a.localeCompare(b));
}

const failures = [];
const symmetryFailures = [];
const triggerLogFailures = [];
const triggeredFamilies = new Set();
const triggeredCardIds = new Set();
let resolutions = 0;

function remember(list, item, limit = 80) {
  if (list.length < limit) list.push(item);
}

function validateResult(result, label, cardsA, cardsB) {
  resolutions++;
  const issue = message => remember(failures, `${label}: ${message}`);
  if (!result || !Number.isInteger(result.scoreA) || !Number.isInteger(result.scoreB)) issue('Score is not an integer.');
  if (result.scoreA < 0 || result.scoreB < 0) issue(`Negative score: ${result.scoreA}-${result.scoreB}`);
  if (!Array.isArray(result.aDice) || !Array.isArray(result.bDice) || result.aDice.length !== 3 || result.bDice.length !== 3) issue('Die array is not 3x3.');
  [...(result.aDice || []), ...(result.bDice || [])].forEach(die => {
    if (!Number.isFinite(die.value) || die.value < 1) issue(`Invalid die: ${die.position}=${die.value}`);
  });
  if (!Array.isArray(result.pairs) || result.pairs.length !== 3) issue('Duel pair count is not 3.');
  if (!Array.isArray(result.events) || !Array.isArray(result.eventScores) || result.events.length !== result.eventScores.length) issue('Log and intermediate-score lengths differ.');
  (result.eventScores || []).forEach((score, index) => {
    if (score === null) return;
    if (!Number.isInteger(score.scoreA) || !Number.isInteger(score.scoreB) || score.scoreA < 0 || score.scoreB < 0) issue(`Invalid intermediate score at ${index}.`);
  });

  const activeIds = { a: new Set(Object.values(cardsA).filter(Boolean)), b: new Set(Object.values(cardsB).filter(Boolean)) };
  for (const side of ['a', 'b']) {
    for (const id of result.triggeredCardIds?.[side] || []) {
      if (!activeIds[side].has(id)) issue(`Unattached card triggered on ${side}: ${id}`);
      const card = cardById.get(id);
      if (card) {
        triggeredFamilies.add(family(card));
        triggeredCardIds.add(id);
      }
    }
  }

  const idsByTeam = { A: result.triggeredCardIds?.a || [], B: result.triggeredCardIds?.b || [] };
  for (const event of result.events || []) {
    const match = event.match(/^(A|B):\s+(.+?)(?:\s+→|\s+\()/);
    if (!match || /bulunamadı|sağlanmadı|tetiklenmedi/i.test(event)) continue;
    const [, teamName, eventBase] = match;
    const attached = Object.values(teamName === 'A' ? cardsA : cardsB)
      .filter(Boolean).map(id => cardById.get(id)).filter(Boolean);
    if (!attached.some(card => family(card) === eventBase)) continue;
    if (!idsByTeam[teamName].some(id => family(cardById.get(id)) === eventBase)) {
      remember(triggerLogFailures, `${label}: logged ${teamName}/${eventBase} is missing from triggeredCardIds.`);
    }
  }
}

function resolve(cardsA, cardsB, valuesA, valuesB, options = {}) {
  installState(cardsA, cardsB, options);
  const aDice=makeDice('A',valuesA,cardsA),bDice=makeDice('B',valuesB,cardsB),ctx={aHome:options.aHome!==false};
  if(options.forceChance){
    ctx.scouting=api.llPrepareScouting('A','B',aDice,bDice,ctx);
    ctx.scouting.randoms.a.chance={active:true,index:1};
  }
  const result=api.llResolveBattle('A','B',aDice,bDice,ctx);
  validateResult(result, options.label || 'matrix', cardsA, cardsB);
  return result;
}

const assignment = variant => ({ [variant.slot]: variant.card.id });
function fullAssignment(seedVariants) {
  const assigned = {};
  const usedIds = new Set();
  const usedFamilies = new Set();
  for (const variant of seedVariants) {
    if (assigned[variant.slot] && assigned[variant.slot] !== variant.card.id) throw new Error(`Slot collision: ${variant.slot}`);
    assigned[variant.slot] = variant.card.id;
    usedIds.add(variant.card.id);
    usedFamilies.add(family(variant.card));
  }
  for (const slot of POSITIONS) {
    if (assigned[slot]) continue;
    const filler = variants.find(v => v.slot === slot && v.card.position === slot && !usedIds.has(v.card.id) && !usedFamilies.has(family(v.card))) || variants.find(v => v.slot === slot && !usedIds.has(v.card.id) && !usedFamilies.has(family(v.card)));
    if (!filler) throw new Error(`No neutral filler found for ${slot}`);
    assigned[slot] = filler.card.id;
    usedIds.add(filler.card.id);
    usedFamilies.add(family(filler.card));
  }
  return assigned;
}

function compareSymmetry(first, swapped, label) {
  const firstA = first.aDice.map(die => die.value);
  const firstB = first.bDice.map(die => die.value);
  const swapA = swapped.aDice.map(die => die.value);
  const swapB = swapped.bDice.map(die => die.value);
  const same = first.scoreA === swapped.scoreB
    && first.scoreB === swapped.scoreA
    && JSON.stringify(firstA) === JSON.stringify(swapB)
    && JSON.stringify(firstB) === JSON.stringify(swapA)
    && JSON.stringify(normalizeTriggered(first, 'a')) === JSON.stringify(normalizeTriggered(swapped, 'b'))
    && JSON.stringify(normalizeTriggered(first, 'b')) === JSON.stringify(normalizeTriggered(swapped, 'a'))
    && JSON.stringify(normalizeLocks(first.nextLocks?.a)) === JSON.stringify(normalizeLocks(swapped.nextLocks?.b))
    && JSON.stringify(normalizeLocks(first.nextLocks?.b)) === JSON.stringify(normalizeLocks(swapped.nextLocks?.a));
  if (!same) {
    remember(symmetryFailures, {
      label,
      first: { score: [first.scoreA, first.scoreB], dice: [firstA, firstB], triggers: [normalizeTriggered(first, 'a'), normalizeTriggered(first, 'b')] },
      swapped: { score: [swapped.scoreA, swapped.scoreB], dice: [swapA, swapB], triggers: [normalizeTriggered(swapped, 'a'), normalizeTriggered(swapped, 'b')] }
    });
  }
}

let crossTeamCases = 0;
for (const left of variants) {
  for (const right of variants) {
    const cardsA = assignment(left);
    const cardsB = assignment(right);
    for (const [valuesA, valuesB] of scenarios) {
      const label = `opponent:${left.card.id}/${left.slot} x ${right.card.id}/${right.slot} @ ${valuesA.join('')}-${valuesB.join('')}`;
      const first = resolve(cardsA, cardsB, valuesA, valuesB, { aHome: true, label });
      const swapped = resolve(cardsB, cardsA, valuesB, valuesA, { aHome: false, label: `${label}:swapped` });
      compareSymmetry(first, swapped, label);
      crossTeamCases++;
    }
  }
}

let sameTeamCases = 0;
for (let leftIndex = 0; leftIndex < variants.length; leftIndex++) {
  const left = variants[leftIndex];
  for (let rightIndex = leftIndex + 1; rightIndex < variants.length; rightIndex++) {
    const right = variants[rightIndex];
    if (left.slot === right.slot || family(left.card) === family(right.card)) continue;
    const cardsA = { [left.slot]: left.card.id, [right.slot]: right.card.id };
    for (const [valuesA, valuesB] of scenarios) {
      const label = `same-team:${left.card.id}/${left.slot}+${right.card.id}/${right.slot} @ ${valuesA.join('')}-${valuesB.join('')}`;
      resolve(cardsA, blankCards(), valuesA, valuesB, { aHome: true, label });
      sameTeamCases++;
    }
  }
}
// Put every compatible same-team pair inside a complete three-slot lineup.
const chainScenarios = scenarios.filter((_, index) => [0, 4, 6, 9, 12, 15].includes(index));
let fullLineSameTeamCases = 0;
for (let leftIndex = 0; leftIndex < variants.length; leftIndex++) {
  const left = variants[leftIndex];
  for (let rightIndex = leftIndex + 1; rightIndex < variants.length; rightIndex++) {
    const right = variants[rightIndex];
    if (left.slot === right.slot || family(left.card) === family(right.card)) continue;
    const cardsA = fullAssignment([left, right]);
    for (const [valuesA, valuesB] of chainScenarios) {
      const label = `full-line-same-team:${left.card.id}/${left.slot}+${right.card.id}/${right.slot} @ ${valuesA.join('')}-${valuesB.join('')}`;
      resolve(cardsA, blankCards(), valuesA, valuesB, { aHome: true, label });
      fullLineSameTeamCases++;
    }
  }
}
// Repeat every opposing card pair while both clubs have all three slots filled.
const fullLineCrossScenarios = chainScenarios.slice(0, 4);
let fullLineCrossTeamCases = 0;
for (const left of variants) {
  for (const right of variants) {
    const cardsA = fullAssignment([left]);
    const cardsB = fullAssignment([right]);
    for (const [valuesA, valuesB] of fullLineCrossScenarios) {
      const label = `full-line-opponent:${left.card.id}/${left.slot} x ${right.card.id}/${right.slot} @ ${valuesA.join('')}-${valuesB.join('')}`;
      const first = resolve(cardsA, cardsB, valuesA, valuesB, { aHome: true, label });
      const swapped = resolve(cardsB, cardsA, valuesB, valuesA, { aHome: false, label: `${label}:swapped` });
      compareSymmetry(first, swapped, label);
      fullLineCrossTeamCases++;
    }
  }
}

function firstCard(base, predicate = () => true) {
  const card = cards.find(item => family(item) === base && predicate(item));
  if (!card) throw new Error(`Target card not found: ${base}`);
  return card;
}

const chemistry = firstCard('Takım Kimyası');
resolve(
  { Kaleci: chemistry.id, 'Orta Saha': firstCard('Pas Ustası', c => c.position === 'Orta Saha').id, Forvet: firstCard('Bitiricilik', c => c.position === 'Forvet').id },
  blankCards(), [2, 4, 5], [3, 3, 4], { label: 'special:Takım Kimyası' }
);

const rareChemistry = firstCard('Nadir Kimya');
resolve(
  { Kaleci: rareChemistry.id, 'Orta Saha': firstCard('Pas Ustası', c => c.rarity === 'rare' && c.position === 'Orta Saha').id, Forvet: firstCard('Bitiricilik', c => c.rarity === 'rare' && c.position === 'Forvet').id },
  blankCards(), [2, 4, 5], [3, 3, 4], { label: 'special:Nadir Kimya' }
);

const giantHunter = firstCard('Dev Avcısı');
resolve({ Kaleci: giantHunter.id }, blankCards(), [3, 4, 5], [6, 5, 4], {
  starsA: 2, starsB: 6, label: 'special:Dev Avcısı'
});

const chanceFactor=firstCard('Şans Faktörü');
resolve({Kaleci:chanceFactor.id},blankCards(),[2,2,2],[5,5,5],{
  forceChance:true,label:'special:Şans Faktörü'
});

resolve({Kaleci:'UPU04'},blankCards(),[2,2,2],[5,5,5],{
  forceChance:true,label:'special:UPU04 chance-pity'
});
resolve({Kaleci:'UPU07'},blankCards(),[3,4,5],[6,6,4],{
  starsA:2,starsB:6,label:'special:UPU07 giant-killer'
});
resolve({Kaleci:'UPU03'},blankCards(),[6,3,4],[2,3,5],{
  dieHistoryA:{Kaleci:[6,2],'Orta Saha':[],Forvet:[]},label:'special:UPU03 form-burst'
});
const battleExemptFamilies = new Set(['Taktik Tahtası']);
const uncoveredFamilies = families.filter(name => !triggeredFamilies.has(name) && !battleExemptFamilies.has(name));
const uncoveredCards = cards
  .filter(card => !triggeredCardIds.has(card.id) && !battleExemptFamilies.has(family(card)))
  .map(card => card.id);
const report = {
  generatedAt: new Date().toISOString(),
  cards: cards.length,
  families: families.length,
  slotVariants: variants.length,
  scenarios: scenarios.length,
  crossTeamCases,
  sameTeamCases,
  fullLineSameTeamCases,
  fullLineCrossTeamCases,
  resolutions,
  triggeredFamilyCount: triggeredFamilies.size,
  uncoveredFamilies,
  triggeredCardCount: triggeredCardIds.size,
  invariantFailureCount: failures.length,
  uncoveredCards,
  catalogFailureCount: catalogFailures.length,
  catalogFailures,
  balanceWarningCount: balanceWarnings.length,
  balanceWarnings,
  triggerLogFailureCount: triggerLogFailures.length,
  symmetryFailureCount: symmetryFailures.length,
  invariantFailures: failures,
  triggerLogFailures,
  symmetryFailures
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  cards: report.cards,
  families: report.families,
  slotVariants: report.slotVariants,
  scenarios: report.scenarios,
  crossTeamCases: report.crossTeamCases,
  sameTeamCases: report.sameTeamCases,
  resolutions: report.resolutions,
  fullLineSameTeamCases: report.fullLineSameTeamCases,
  fullLineCrossTeamCases: report.fullLineCrossTeamCases,
  uncoveredFamilies: report.uncoveredFamilies,
  invariantFailureCount: report.invariantFailureCount,
  uncoveredCards: report.uncoveredCards,
  catalogFailureCount: report.catalogFailureCount,
  balanceWarningCount: report.balanceWarningCount,
  triggeredCardCount: report.triggeredCardCount,
  triggerLogFailureCount: report.triggerLogFailureCount,
  symmetryFailureCount: report.symmetryFailureCount,
  report: path.relative(ROOT, REPORT_PATH)
}, null, 2));

if (failures.length || triggerLogFailures.length || symmetryFailures.length || uncoveredFamilies.length || uncoveredCards.length || catalogFailures.length) {
  process.exitCode = 1;
}
