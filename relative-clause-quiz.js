/* Relative Clause match quiz. Kept separate from vocabulary statistics. */
(function (global) {
  'use strict';

  var QUESTION_COUNT = 8;
  var OFFICIAL = { league: true, cup: true, playoff: true, ucl: true, uel: true, uecl: true };
  // Soru ipucu vermemesi icin Ingilizce kalir; cevap acildiginda
  // ayni gramer kurali Turkce olarak da gosterilir. Unicode kacis dizileri,
  // Windows/GitHub kodlama farklarinda Turkce metnin bozulmasini engeller.
  var TURKISH_RULES = {
    'Use who for a person.': 'Ki\u015filer i\u00e7in "who" kullan\u0131l\u0131r.',
    'Use who for people.': '\u0130nsanlar i\u00e7in "who" kullan\u0131l\u0131r.',
    'Use which or that for a club or thing.': 'Kul\u00fcp veya nesneler i\u00e7in "which" ya da "that" kullan\u0131l\u0131r.',
    'Use which or that for a thing.': 'Nesneler i\u00e7in "which" ya da "that" kullan\u0131l\u0131r.',
    'That or who is possible as the object; that is the preferred answer.': 'Nesne g\u00f6revinde "that" veya "who" kullan\u0131labilir; bu soruda beklenen cevap "that"t\u0131r.',
    'Who, whom, or that can be used as the object; who is the preferred answer.': 'Nesne g\u00f6revinde "who", "whom" veya "that" kullan\u0131labilir; bu soruda beklenen cevap "who"dur.',
    'Use whose for possession.': 'Sahiplik belirtmek i\u00e7in "whose" kullan\u0131l\u0131r.',
    'Use where for a place.': 'Yer bildiren yap\u0131larda "where" kullan\u0131l\u0131r.',
    'Use when for time.': 'Zaman bildiren yap\u0131larda "when" kullan\u0131l\u0131r.',
    'Use why after reason.': '"Reason" kelimesinden sonra neden belirtmek i\u00e7in "why" kullan\u0131l\u0131r.',
    'A non-defining clause uses which, not that.': 'Virg\u00fclle ayr\u0131lan ek bilgi c\u00fcmleci\u011finde "that" de\u011fil, "which" kullan\u0131l\u0131r.',
    'A non-defining clause about a thing uses which.': 'Nesne hakk\u0131nda virg\u00fclle ayr\u0131lan ek bilgi c\u00fcmleci\u011finde "which" kullan\u0131l\u0131r.',
    'A non-defining clause about a person uses who.': 'Ki\u015fi hakk\u0131nda virg\u00fclle ayr\u0131lan ek bilgi c\u00fcmleci\u011finde "who" kullan\u0131l\u0131r.',
    'Combine the two sentences with who.': '\u0130ki c\u00fcmleyi "who" kullanarak tek c\u00fcmlede birle\u015ftir.',
    'Use which after the formal preposition from.': 'Resm\u00ee kullan\u0131mdaki "from" edat\u0131ndan sonra "which" kullan\u0131l\u0131r.',
    'After a formal preposition, use whom.': 'Resm\u00ee kullan\u0131mdaki bir edattan sonra ki\u015fi i\u00e7in "whom" kullan\u0131l\u0131r.',
    'In which means where in this formal structure.': 'Bu resm\u00ee yap\u0131da "in which", "where" yerine ge\u00e7er.',
    'On which means when in this formal structure.': 'Bu resm\u00ee yap\u0131da "on which", zaman belirten "when" yerine ge\u00e7er.'
  };
  var TURKISH_SENTENCES = {
    'RC001': "89. dakikada galibiyet gol\u00fcn\u00fc atan oyuncu ma\u00e7\u0131n adam\u0131 se\u00e7ildi.",
    'RC002': "Galatasaray, tarihte en \u00e7ok S\u00fcper Lig \u015fampiyonlu\u011fu kazanan kul\u00fcpt\u00fcr.",
    'RC003': "Teknik direkt\u00f6r\u00fcn ge\u00e7en yaz transfer etti\u011fi forvet \u015fimdiden 12 gol att\u0131.",
    'RC004': "Messi'nin 30 metreden kulland\u0131\u011f\u0131 serbest vuru\u015f do\u011frudan doksana gitti.",
    'RC005': "Tak\u0131m\u0131 \u015fampiyonlu\u011fa ta\u015f\u0131yan teknik direkt\u00f6r iki hafta sonra istifa etti.",
    'RC006': "Herkesin hakk\u0131nda konu\u015ftu\u011fu gen\u00e7 yetenek sadece 17 ya\u015f\u0131nda.",
    'RC007': "Ge\u00e7en sezon kald\u0131rd\u0131\u011f\u0131m\u0131z kupa art\u0131k kul\u00fcp m\u00fczesinde.",
    'RC008': "Hatas\u0131 ma\u00e7\u0131 kaybetmemize neden olan savunma oyuncusu ma\u00e7tan sonra \u00f6z\u00fcr diledi.",
    'RC009': "Penisilini ke\u015ffeden bilim insan\u0131 t\u0131bb\u0131n gidi\u015fat\u0131n\u0131 de\u011fi\u015ftirdi.",
    'RC010': "Her ak\u015fam keman \u00e7alan bir kom\u015fum var.",
    'RC011': "D\u00fcn tan\u0131\u015ft\u0131\u011f\u0131n adam benim amcam.",
    'RC012': "Ge\u00e7en y\u0131l yazd\u0131\u011f\u0131 roman \u00e7ok satanlar aras\u0131na girdi.",
    'RC013': "Buras\u0131 \u015fehirdeki en iyi deniz \u00fcr\u00fcnlerini servis eden restoran.",
    'RC014': "Erken bitiren \u00f6\u011frenciler s\u0131n\u0131ftan \u00e7\u0131kabilir.",
    'RC015': "\u0130ki y\u0131l \u00f6nce ald\u0131\u011f\u0131m diz\u00fcst\u00fc bilgisayar\u0131m h\u00e2l\u00e2 kusursuz \u00e7al\u0131\u015f\u0131yor.",
    'RC016': "\u0130ki k\u0131tay\u0131 birbirine ba\u011flayan \u0130stanbul, tarih dolu bir \u015fehirdir.",
    'RC017': "Almanya'da ya\u015fayan erkek karde\u015fim gelecek ay bizi ziyarete geliyor.",
    'RC018': "Hakemin 90. dakikada verdi\u011fi karar oyunu de\u011fi\u015ftirdi.",
    'RC019': "Vizyonu ve pas menzili inan\u0131lmaz olan orta saha oyuncusu tak\u0131m\u0131n kalbidir.",
    'RC020': "Frans\u0131zca yaz\u0131lm\u0131\u015f olan mektubu anlamak zordu.",
    'RC021': "S\u00f6zle\u015fmesi haziranda sona erecek oyuncu \u015fimdiden Avrupa'dan ilgi \u00e7ekti.",
    'RC022': "Tak\u0131m\u0131n her sabah antrenman yapt\u0131\u011f\u0131 saha buras\u0131.",
    'RC023': "2005, \u0130stanbul'un futbol d\u00fcnyas\u0131n\u0131n merkezi h\u00e2line geldi\u011fi y\u0131ld\u0131.",
    'RC024': "Finalin oynanaca\u011f\u0131 \u015fehir muhte\u015fem bir atmosfer haz\u0131rlad\u0131.",
    'RC025': "Refleksleri bug\u00fcn bizi kurtaran kaleci ligin en iyilerinden biri.",
    'RC026': "Hakemin son d\u00fcd\u00fc\u011f\u00fc \u00e7ald\u0131\u011f\u0131 an\u0131 h\u00e2l\u00e2 hat\u0131rl\u0131yorum.",
    'RC027': "Altyap\u0131s\u0131 bu kadar \u00e7ok mill\u00ee tak\u0131m oyuncusu yeti\u015ftiren kul\u00fcp ger\u00e7ekten \u00f6zel.",
    'RC028': "Buras\u0131 b\u00fcy\u00fckannemin do\u011fdu\u011fu k\u00f6y.",
    'RC029': "\u0130lk kez bulu\u015ftu\u011fumuz kafe kapand\u0131.",
    'RC030': "Mezun oldu\u011fumuz g\u00fcn\u00fc h\u00e2l\u00e2 hat\u0131rl\u0131yorum.",
    'RC031': "Yaz, turistlerin bu \u015fehre ak\u0131n etti\u011fi mevsimdir.",
    'RC032': "Kimse onun neden bu kadar aniden ayr\u0131ld\u0131\u011f\u0131n\u0131 bilmiyor.",
    'RC033': "Eserleri burada sergilenen sanat\u00e7\u0131 Paris'te ya\u015f\u0131yor.",
    'RC034': "Babas\u0131 \u00fcnl\u00fc bir y\u00f6netmen olan bir k\u0131z tan\u0131yorum.",
    'RC035': "Pencerenin yan\u0131nda duran adam benim patronum.",
    'RC036': "Ge\u00e7en hafta hat-trick yapan kanat oyuncusu \u00e7ok h\u0131zl\u0131.",
    'RC037': "Bu, Ronaldo'nun finalde giydi\u011fi forma.",
    'RC038': "Teknik direkt\u00f6r, antrenmana ge\u00e7 gelen oyuncuya k\u0131zg\u0131nd\u0131.",
    'RC039': "2005 \u015eampiyonlar Ligi finalinin oynand\u0131\u011f\u0131 stadyumu ziyaret ettik.",
    'RC040': "Liderli\u011fi t\u00fcm tak\u0131ma ilham veren kaptan kupay\u0131 kald\u0131rd\u0131.",
    'RC041': "Her \u015feyin de\u011fi\u015fti\u011fi ma\u00e7 oydu.",
    'RC042': "Performanslar\u0131 ola\u011fan\u00fcst\u00fc olan gen\u00e7 bek sadece 18 ya\u015f\u0131nda.",
    'RC043': "Bu, galibiyet gol\u00fcn\u00fc haz\u0131rlayan pas.",
    'RC044': "Televizyonda g\u00f6rd\u00fc\u011f\u00fcn kad\u0131n \u00fcnl\u00fc bir gazeteci.",
    'RC045': "Erkek karde\u015fi Barcelona'da oynayan bir arkada\u015f\u0131m var.",
    'RC046': "Ge\u00e7en yaz kald\u0131\u011f\u0131m\u0131z otel buras\u0131.",
    'RC047': "D\u00fcn ald\u0131\u011f\u0131m kitap masan\u0131n \u00fczerinde.",
    'RC048': "Bana \u00e7ok yard\u0131mc\u0131 olan \u00f6\u011fretmen \u00e7ok nazikti.",
    'RC049': "Serbest vuru\u015fun verildi\u011fi oyuncu, o vuru\u015ftan do\u011frudan gol att\u0131.",
    'RC050': "Daha \u00f6nce hi\u00e7 \u015fampiyonluk kazanmam\u0131\u015f olan teknik direkt\u00f6r sonunda kupay\u0131 kald\u0131rd\u0131.",
    'RC051': "Finalin oynand\u0131\u011f\u0131 stadyum 75.000'den fazla ki\u015fi kapasitelidir.",
    'RC052': "Eskiden birlikte oynad\u0131\u011f\u0131m forvet art\u0131k bir \u015eampiyonlar Ligi kul\u00fcb\u00fcnde.",
    'RC053': "\u00c7al\u0131\u015fkanl\u0131\u011f\u0131yla tan\u0131nan favori oyuncum ko\u015fmay\u0131 hi\u00e7 b\u0131rakmaz.",
    'RC054': "Bu kadar \u00e7ok y\u0131ld\u0131z\u0131n yeti\u015fti\u011fi altyap\u0131 d\u00fcnyaca \u00fcnl\u00fcd\u00fcr.",
    'RC055': "Ligi kazand\u0131\u011f\u0131m\u0131z gece asla unutulmayacak.",
    'RC056': "Taraftarlar\u0131 en tutkulular aras\u0131nda g\u00f6sterilen kul\u00fcp her i\u00e7 saha ma\u00e7\u0131nda stad\u0131 tamamen doldurdu."
  };
  function turkishExplanation(question) {
    return TURKISH_RULES[question.explanation] || ('Bu c\u00fcmlede do\u011fru Relative Clause yap\u0131s\u0131 "' + question.answer + '" olur.');
  }
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
    var question = { id: row[0], sentence: row[1], answer: row[2], full: row[3] || row[1].replace('______', row[2]), explanation: row[4] };
    question.fullTr = TURKISH_SENTENCES[question.id] || question.full;
    question.explanationTr = turkishExplanation(question);
    return question;
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

/* Relative Clause is rendered through the same narrow quiz shell at every
 * stage.  Keeping question and reward inside this one helper prevents the
 * result view from inheriting a wide match/table layout. */
function renderRelativeCard(content, extraClass) {
  if (typeof global.llSetWide === 'function') global.llSetWide(false);
  global.llArea().innerHTML =
    '<div class="ll-shell ll-quiz-card ll-relative-quiz ' + (extraClass || '') + '">' +
      '<div class="ll-panel ll-relative-quiz-panel">' + content + '</div>' +
    '</div>';
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
      '<div class="ll-answer"><b>' + esc(current.answer) + '</b><div>' + esc(current.fullTr || current.full) + '</div>' +
      '<small class="ll-relative-rule-en">' + esc(current.explanation) + '</small>' +
      '<small class="ll-relative-rule-tr"><b>T\u00fcrk\u00e7e a\u00e7\u0131klama:</b> ' + esc(current.explanationTr) + '</small></div>'
    ) : '<div class="ll-muted" style="margin-top:25px">Cevab\u0131 a\u00e7mak i\u00e7in karta t\u0131kla</div>';
  var questionHtml =
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
    '</div>';
  return renderRelativeCard(questionHtml, 'll-relative-question-card');
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
    var answered = Math.max(0, Math.min(QUESTION_COUNT, Number(quiz.index || 0)));
    var recoveryAp = Number(quiz.recoveryBonus || 0);
    var rerollReady = quiz.reward === 'reroll' || quiz.reward === 'perfect';
    var icon = quiz.reward === 'perfect' ? '\ud83c\udfc6' : quiz.reward === 'reroll' ? '\ud83c\udfaf' : quiz.skipped ? '\u23ed\ufe0f' : '\ud83d\udcda';
    var metricsColumns = recoveryAp > 0 ? 'repeat(3,1fr)' : '1fr 1fr';
    var metricsWidth = recoveryAp > 0 ? '600px' : '420px';
    var notice;
    var action;

    if (quiz.skipped) {
      notice = answered + ' Relative Clause cevab\u0131n\u0131n AP \u00f6d\u00fcl\u00fc hesab\u0131na i\u015flendi. Cevaplanmayan sorular sonraki Relative Clause ma\u00e7lar\u0131nda yeniden gelebilir.';
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
  return renderRelativeCard(rewardHtml, 'll-relative-result-card');
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
