const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('outputs/league-v2.js', 'utf8');
const marker = '/* Local career slots and portable JSON backups.';
const start = source.indexOf(marker);
assert(start >= 0, 'save-slot block missing');
const block = source.slice(start);

function career(team, season = 1, week = 1) {
  return {
    version: 2, season, week, playerTeam: team, ap: 10, lp: 20,
    teams: {[team]: {name: team, stars: 2}},
    leagues: {super: [], first: [team]},
    standings: {super: {}, first: {[team]: {team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0}}},
    starterPackClaimed: true, seasonEnded: false, createdAt: '2026-01-01T00:00:00.000Z'
  };
}

const data = new Map();
const localStorage = {
  getItem: key => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: key => data.delete(key)
};
localStorage.setItem('lexicon_league_save_v2', JSON.stringify(career('Ümraniyespor')));
localStorage.setItem('lexicon_words', JSON.stringify([{id: 1, en: 'proof'}]));
localStorage.setItem('lexicon_meta', JSON.stringify({cycle: 4}));

const area = {innerHTML: '', querySelector: () => null};
const context = {
  console, localStorage, JSON, Date, Intl, Blob, URL, setTimeout,
  LL_V2_SAVE_KEY: 'lexicon_league_save_v2', DB_KEY: 'lexicon_words', META_KEY: 'lexicon_meta',
  lexLeague: {state: null, active: false},
  alert: () => {}, confirm: () => true,
  llSave() {}, llLoad() {}, llContinueGame() {}, llResetGame() {}, llStartCareer() {},
  renderLexiconLeagueLanding() {}, llRenderTeamSelect() {}, llRenderDashboard() {},
  llV2RepairState: state => state, llSetWide() {}, llClearTransient() {}, llSetEuropeMatchTheme() {},
  llArea: () => area, llRenderStarterShop() {}, llRenderSeasonEnd() {}, llOpenModal() {}, llCloseModal() {},
  llTeamLogo: name => `<logo>${name}</logo>`, llEscape: value => String(value), llStars: n => '*'.repeat(n),
  llLeagueLabel: key => key, llNewState: team => career(team), llAssignStarterCardsToAi() {}, llGoMainMenu() {},
  location: {reload() {}}, document: {body: {appendChild() {}}, createElement: () => ({click() {}, remove() {}}), getElementById: () => null}
};
vm.createContext(context);
vm.runInContext(block, context, {filename: 'save-slots-block.js'});

let store = JSON.parse(localStorage.getItem('lexicon_league_save_slots_v1'));
assert.strictEqual(store.slots['1'].state.playerTeam, 'Ümraniyespor', 'legacy save must migrate to slot 1');
assert.strictEqual(store.slots['2'], null);
assert.strictEqual(store.slots['3'], null);

vm.runInContext("llSetActiveSaveSlot(2); lexLeague.state = (" + career.toString() + ")('Bursaspor', 2, 7); llSave();", context);
store = JSON.parse(localStorage.getItem('lexicon_league_save_slots_v1'));
assert.strictEqual(store.slots['1'].state.playerTeam, 'Ümraniyespor', 'slot 1 must not be overwritten');
assert.strictEqual(store.slots['2'].state.playerTeam, 'Bursaspor', 'slot 2 must save independently');
assert.strictEqual(store.activeSlot, 2);

const backup = vm.runInContext('llBuildFullBackup()', context);
assert.strictEqual(backup.type, 'full');
assert.strictEqual(backup.careerSlots['1'].state.playerTeam, 'Ümraniyespor');
assert.strictEqual(backup.careerSlots['2'].state.playerTeam, 'Bursaspor');
assert.strictEqual(backup.vocabulary.words[0].en, 'proof');
assert.strictEqual(backup.vocabulary.meta.cycle, 4);
assert.strictEqual(vm.runInContext('llValidateBackup(llBuildFullBackup()).type', context), 'full');
assert.throws(() => vm.runInContext("llValidateBackup({app:'wrong'})", context), /geçerli/);

vm.runInContext('llResetGame(1)', context);
store = JSON.parse(localStorage.getItem('lexicon_league_save_slots_v1'));
assert.strictEqual(store.slots['1'], null, 'deleting one slot must clear only that slot');
assert.strictEqual(store.slots['2'].state.playerTeam, 'Bursaspor');
assert.deepStrictEqual(JSON.parse(localStorage.getItem('lexicon_words')), [{id: 1, en: 'proof'}], 'deleting career must not delete vocabulary');

console.log('save slots and backup: 12 checks passed');