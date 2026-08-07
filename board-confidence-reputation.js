/* Board confidence, critical-match press conferences and reputation integration. */
(function(){
'use strict';

const VERSION=3;
const REPUTATION_SYSTEM_VERSION=3;
const DISMISSAL_REPUTATION_PENALTY=5;
const STARTING_CONFIDENCE=75;
const PRESS_WORD_COUNT=5;
const INTERIM_EVERY=5;
const REGULAR_PACK_SURCHARGE_RATE=.20;
const MARKET_REP_MODIFIERS={strong:5,danger:-10,dismissal:-15};

function num(value,fallback=0){value=Number(value);return Number.isFinite(value)?value:fallback;}
function clamp(value,min,max){return Math.max(min,Math.min(max,num(value)));}
function esc(value){
  if(typeof globalThis.llEscape==='function')return llEscape(String(value??''));
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function deep(value){return value==null?value:JSON.parse(JSON.stringify(value));}
function stateNow(){return globalThis.lexLeague?.state||null;}
function fixtureNow(){try{return globalThis.lexLeague?.quiz?.fixture||(typeof globalThis.llPlayerFixture==='function'?llPlayerFixture():null);}catch{return null;}}
function teamStars(state,team){
  try{return clamp(typeof globalThis.llV2TeamStarsInState==='function'?llV2TeamStarsInState(state,team):state?.teams?.[team]?.stars,1,6);}
  catch{return clamp(state?.teams?.[team]?.stars||1,1,6);}
}
function currentLeague(state){
  try{return typeof globalThis.llTeamLeague==='function'?llTeamLeague(state?.playerTeam):'first';}
  catch{return 'first';}
}
function sortedRows(state,key=currentLeague(state)){
  try{return typeof globalThis.llSortTable==='function'?llSortTable(key):[];}
  catch{return [];}
}
function primaryGoal(state){
  const goals=Array.isArray(state?.seasonGoals?.items)?state.seasonGoals.items:[];
  return goals.find(goal=>goal?.id==='club_primary')||goals[0]||{id:'club_primary',type:'league_position',value:10,label:'Yönetim hedefi'};
}
function sideGoals(state){return (Array.isArray(state?.seasonGoals?.items)?state.seasonGoals.items:[]).filter(goal=>goal?.id!=='club_primary');}
function targetPosition(goal,rows,state){
  const count=Math.max(1,rows?.length||18),type=goal?.type;
  if(type==='champion')return 1;
  if(type==='direct_promote')return 2;
  if(type==='promote')return Math.min(7,count);
  if(type==='playoff')return Math.min(7,count);
  if(type==='league_position')return clamp(goal?.value||Math.ceil(count*.55),1,count);
  const stars=teamStars(state,state?.playerTeam);
  return clamp(Math.ceil(count*(stars>=6?.30:stars===5?.40:stars===4?.50:stars===3?.62:stars===2?.75:.85)),1,count);
}
function startingConfidence(){
  // EA FC benzeri, güvenli fakat hâlâ performansa duyarlı kariyer başlangıcı.
  return STARTING_CONFIDENCE;
}
function confidenceStatus(value){
  value=clamp(value,0,100);
  if(value>=80)return {key:'strong',label:'Çok Güçlü Destek',effect:'Menajer piyasasında +5 geçici itibar desteği.',tone:'strong'};
  if(value>=55)return {key:'normal',label:'Normal',effect:'Yönetim olağan desteğini sürdürüyor.',tone:'normal'};
  if(value>=35)return {key:'uneasy',label:'Tedirgin',effect:'Transfer kasalarının AP maliyeti %20 artar.',tone:'uneasy'};
  if(value>=15)return {key:'danger',label:'Tehlikeli',effect:'Gelen teklifler azalır; başvurularda −10 geçici itibar etkisi uygulanır.',tone:'danger'};
  return {key:'dismissal',label:'Kovulma Riski',effect:'Sezon sonunda yönetim toplantısı ve yüksek kovulma riski.',tone:'dismissal'};
}
function reputationTier(value){
  value=clamp(value,0,100);
  if(value>=90)return 'Dünya Çapında';
  if(value>=76)return 'Kıtasal Seviye';
  if(value>=61)return 'Ulusal Seviye';
  if(value>=41)return 'Ulusal Aday';
  if(value>=21)return 'Bölgesel Seviye';
  return 'Yerel Seviye';
}
function ensureProfile(state){
  if(typeof globalThis.llManagerProfile==='function'){
    try{
      const profile=llManagerProfile(state);
      if(profile&&typeof profile==='object'&&!Array.isArray(profile)){
        if(!Array.isArray(profile.history))profile.history=[];
        if(!Array.isArray(profile.reputationHistory))profile.reputationHistory=[];
        if(!Array.isArray(profile.reputationEvents))profile.reputationEvents=[];
        profile.reputation=clamp(profile.reputation||50,0,100);
        return profile;
      }
    }catch(error){console.warn('[Yönetim Güveni] Menajer profili onarımı atlandı:',error);}
  }
  if(!state.managerProfile||typeof state.managerProfile!=='object'||Array.isArray(state.managerProfile))state.managerProfile={reputation:50,failedPrimaryStreak:0,lastEvaluatedSeason:0,currentTeam:state.playerTeam,history:[]};
  if(!Array.isArray(state.managerProfile.history))state.managerProfile.history=[];
  if(!Array.isArray(state.managerProfile.reputationHistory))state.managerProfile.reputationHistory=[];
  if(!Array.isArray(state.managerProfile.reputationEvents))state.managerProfile.reputationEvents=[];
  state.managerProfile.reputation=clamp(state.managerProfile.reputation||50,0,100);
  return state.managerProfile;
}
function boardSnapshot(state){
  const goal=primaryGoal(state);
  return {id:goal?.id||'club_primary',type:goal?.type||'league_position',value:goal?.value??null,label:goal?.label||'Yönetim hedefi'};
}
function ensureBoard(state){
  if(!state)return null;
  const season=num(state.season,1);
  if(!state.boardConfidence||typeof state.boardConfidence!=='object'||Array.isArray(state.boardConfidence)||num(state.boardConfidence.season)!==season){
    const start=startingConfidence(state);
    state.boardConfidence={
      version:VERSION,season,value:start,startValue:start,status:confidenceStatus(start).key,
      matchCount:0,leagueMatchCount:0,badStreak:0,lossStreak:0,reviewEvery:INTERIM_EVERY,
      primaryGoal:boardSnapshot(state),history:[],meetings:[],createdAt:new Date().toISOString(),
      lastDelta:0,lastReasons:['Sezon başlangıcı yönetim değerlendirmesi'],finalized:false
    };
  }
  const board=state.boardConfidence;
  // V1 kayıtlarında hedef zorluğuna göre 55-70 arası haksız derecede düşük bir
  // başlangıç uygulanıyordu. Kazanılan/kaybedilen güven farkını koruyarak tabanı
  // bir kez 75'e taşır; sonraki açılışlarda tekrar çalışmaz.
  if(num(board.version)===1){
    const oldStart=clamp(board.startValue||board.value,0,100);
    const adjustment=STARTING_CONFIDENCE-oldStart;
    if(adjustment>0){
      board.value=clamp(num(board.value,oldStart)+adjustment,0,100);
      board.startValue=STARTING_CONFIDENCE;
      board.migration={fromVersion:1,toVersion:VERSION,oldStart,newStart:STARTING_CONFIDENCE,adjustment,appliedAt:new Date().toISOString()};
    }
  }
  board.version=VERSION;board.value=clamp(board.value,0,100);board.startValue=clamp(board.startValue||board.value,0,100);
  board.matchCount=Math.max(0,num(board.matchCount));board.leagueMatchCount=Math.max(0,num(board.leagueMatchCount));
  board.badStreak=Math.max(0,num(board.badStreak));board.lossStreak=Math.max(0,num(board.lossStreak));
  if(!Array.isArray(board.history))board.history=[];if(!Array.isArray(board.meetings))board.meetings=[];
  if(!board.primaryGoal)board.primaryGoal=boardSnapshot(state);
  board.status=confidenceStatus(board.value).key;
  return board;
}
function marketModifier(state){
  const status=confidenceStatus(ensureBoard(state)?.value||0).key;
  if(status==='strong')return MARKET_REP_MODIFIERS.strong;
  if(status==='danger')return MARKET_REP_MODIFIERS.danger;
  if(status==='dismissal')return MARKET_REP_MODIFIERS.dismissal;
  return 0;
}
function effectiveReputation(state,base){
  return clamp(num(base,ensureProfile(state).reputation)+marketModifier(state),0,100);
}
globalThis.llBoardEffectiveReputation=function(state=stateNow(),base){return effectiveReputation(state,base);};
globalThis.llBoardConfidenceStatus=confidenceStatus;
globalThis.llManagerReputationTier=reputationTier;
globalThis.llEnsureBoardConfidence=ensureBoard;

function fixtureKey(state,fixture,week){
  return [state?.season||0,week||state?.week||0,fixture?.competition||'league',fixture?.roundLabel||'',fixture?.home||'',fixture?.away||''].join('~');
}
function activeScheduleLength(state,key){
  try{
    const legacy=state?.schedules?.[key];
    if(Array.isArray(legacy))return legacy.length;
    const country=state?.playerCountry||'TUR',tier=key==='super'?'tier1':'tier2';
    const nested=state?.schedules?.[country]?.[tier];
    if(Array.isArray(nested))return nested.length;
  }catch{}
  return key==='super'?34:38;
}
function derbyInfo(f,state){
  try{return typeof globalThis.llHistoricalDerby==='function'?llHistoricalDerby(f,state):null;}
  catch{return null;}
}
function europeKnockoutLabel(f,state){
  const label=String(f?.roundLabel||'');
  const stage=String(state?.europe?.phase||state?.europe?.stage||state?.europe?.tie?.stage||'');
  const knockout=/Play-?Off|Eleme|Son 16|Çeyrek|Yarı|Final|Rövanş|Round of 16|Quarter|Semi/i;
  return knockout.test(label)||/playoff|r16|qf|sf|final/i.test(stage);
}
function leagueCriticality(f,state){
  const key=f?.league||currentLeague(state),rows=sortedRows(state,key),count=rows.length;
  if(!count)return null;
  const player=state.playerTeam,index=rows.findIndex(row=>row.team===player),rank=index>=0?index+1:count;
  const target=targetPosition(primaryGoal(state),rows,state),rounds=activeScheduleLength(state,key),week=num(state.week,1),remaining=Math.max(0,rounds-week);
  const playerRow=rows[index]||{},boundaryRow=rows[Math.max(0,Math.min(count-1,target-1))]||{};
  const pointGap=Math.abs(num(playerRow.Pts)-num(boundaryRow.Pts));
  if(week>=rounds-2&&(Math.abs(rank-target)<=4||rank<=3||rank>count-4))return {label:'Sezonun Son 3 Haftasında Kritik Maç',code:'last-three'};
  if(remaining<=6&&pointGap<=3)return {label:'Hedefin Matematiksel Olarak Netleşebileceği Maç',code:'mathematical'};
  if(key==='super'&&remaining<=7&&rank<=2)return {label:'Şampiyonluk Yarışı Kritik Maçı',code:'title-race'};
  if(key==='super'&&remaining<=7&&rank>count-5)return {label:'Küme Düşme Hattı Kritik Maçı',code:'relegation-race'};
  if(key==='super'&&remaining<=7&&rank<=7)return {label:'Avrupa Yarışı Kritik Maçı',code:'europe-race'};
  if(key==='first'&&remaining<=7&&rank<=8)return {label:'Yükselme Yarışı Kritik Maçı',code:'promotion-race'};
  return null;
}
function criticalMatchInfo(f=fixtureNow(),state=stateNow()){
  if(!f||!state)return {critical:false,label:'',code:''};
  const comp=f.competition||'league',derby=derbyInfo(f,state);
  if(derby)return {critical:true,label:derby.label||'Derbi',code:'derby',derby:true};
  if(comp==='playoff')return {critical:true,label:f.roundLabel||'Play-Off Maçı',code:'playoff'};
  if(['ucl','uel','uecl'].includes(comp)&&europeKnockoutLabel(f,state))return {critical:true,label:`${f.roundLabel||'Avrupa Eleme Turu'} Basın Toplantısı`,code:'europe-knockout'};
  if(comp==='cup'&&/Final/i.test(String(f.roundLabel||'')))return {critical:true,label:f.roundLabel||'Kupa Finali',code:'cup-final'};
  if(comp==='league'){
    let importance='';
    try{importance=typeof globalThis.llV2MatchImportance==='function'?llV2MatchImportance(f,f.league||currentLeague(state)):'';}catch{}
    if(importance)return {critical:true,label:String(importance).replace(/^[^\p{L}\p{N}]+/u,''),code:'league-importance'};
    const leagueInfo=leagueCriticality(f,state);if(leagueInfo)return {critical:true,...leagueInfo};
  }
  return {critical:false,label:'',code:''};
}
globalThis.llCriticalMatchInfo=criticalMatchInfo;

function expectedResultDelta(state,match,pg,og,critical){
  const playerStars=teamStars(state,match.player),oppStars=teamStars(state,match.opponent),home=!!match.playerHome;
  const reasons=[];let delta=0;
  if(pg>og){
    delta=oppStars>=playerStars||!home||critical.critical?4:2;
    reasons.push(delta===4?'Zorlu veya kritik maçta galibiyet':'Hedefe uygun galibiyet');
  }else if(pg===og){
    if(oppStars>playerStars){delta=2;reasons.push('Daha güçlü rakibe karşı değerli beraberlik');}
    else if(home&&oppStars<playerStars){delta=-3;reasons.push('Evinde daha zayıf rakibe puan kaybı');}
    else{delta=0;reasons.push('Dengeli beraberlik');}
  }else{
    delta=home?-5:-3;
    reasons.push(home?'Evinde mağlubiyet':'Deplasmanda mağlubiyet');
    if(oppStars<playerStars){delta=Math.max(-6,delta-1);reasons.push('Daha zayıf rakibe kayıp');}
    if(critical.critical){delta-=4;reasons.push('Kritik maç kaybı ek yaptırımı');}
  }
  return {delta:clamp(delta,-10,4),reasons};
}
function interimReview(state,board){
  const key=currentLeague(state),rows=sortedRows(state,key),playerIndex=rows.findIndex(row=>row.team===state.playerTeam);
  if(playerIndex<0||!rows.length)return {delta:0,reasons:[]};
  const rank=playerIndex+1,target=targetPosition(primaryGoal(state),rows,state),gap=rank-target;
  if(gap<=-3)return {delta:10,reasons:[`Ara değerlendirme: ${rank}. sıra, ${target}. sıra hedefinin belirgin üzerinde`]};
  if(gap<=-1)return {delta:6,reasons:[`Ara değerlendirme: hedef sıralamanın üzerinde`]};
  if(gap>=5)return {delta:-12,reasons:[`Ara değerlendirme: hedefin ${gap} basamak gerisinde`]};
  if(gap>=2)return {delta:-8,reasons:[`Ara değerlendirme: hedef sıralamanın gerisinde`]};
  return {delta:0,reasons:[`Ara değerlendirme: hedef çizgisine yakın (${rank}. / hedef ${target}.)`]};
}
function updateBoardAfterMatch(state,match,weekBefore){
  const board=ensureBoard(state),fixture=match?.fixture;if(!board||!fixture||!match?.resolution)return null;
  const key=fixtureKey(state,fixture,weekBefore);
  if(board.history.some(item=>item.key===key))return null;
  const pg=num(match.resolution.scoreA),og=num(match.resolution.scoreB),critical=match.boardCriticalInfo||criticalMatchInfo(fixture,state),base=expectedResultDelta(state,match,pg,og,critical);
  let delta=base.delta,reasons=[...base.reasons],interim=null;
  board.matchCount++;
  if((fixture.competition||'league')==='league'){
    board.leagueMatchCount++;
    if(board.leagueMatchCount%num(board.reviewEvery,INTERIM_EVERY)===0){
      interim=interimReview(state,board);delta+=interim.delta;reasons.push(...interim.reasons);
    }
  }
  const before=board.value,after=clamp(before+delta,0,100),negative=delta<0;
  board.value=after;board.lastDelta=after-before;board.lastReasons=reasons;board.status=confidenceStatus(after).key;
  if(pg<og){board.lossStreak++;board.badStreak++;}
  else if(negative){board.lossStreak=0;board.badStreak++;}
  else if(delta>0){board.lossStreak=0;board.badStreak=0;}
  else board.lossStreak=0;
  const entry={key,season:state.season,week:weekBefore,competition:fixture.competition||'league',roundLabel:fixture.roundLabel||'',home:fixture.home,away:fixture.away,opponent:match.opponent,playerHome:!!match.playerHome,score:`${pg}-${og}`,before,delta:after-before,after,reasons,critical:critical.critical,criticalLabel:critical.label||'',interim:interim?deep(interim):null,at:new Date().toISOString()};
  board.history.push(entry);board.history=board.history.slice(-120);
  return entry;
}
function confidenceBarHtml(state,context='dashboard'){
  const board=ensureBoard(state),status=confidenceStatus(board.value),goal=primaryGoal(state),sides=sideGoals(state),last=board.history.at(-1);
  return `<div class="ll-board-confidence ll-board-${status.tone}" data-board-confidence>
    <div class="ll-board-head"><div><span class="ll-rarity">YÖNETİM KURULU GÜVENİ</span><h3>${status.label}</h3></div><strong>${board.value}<small>/100</small></strong></div>
    <div class="ll-board-bar"><i style="width:${board.value}%"></i></div>
    <div class="ll-board-grid"><div><b>Ana hedef</b><span>${esc(goal?.label||'Belirlenmedi')}</span></div><div><b>Yan hedefler</b><span>${sides.length?sides.slice(0,2).map(item=>esc(item.label)).join(' · '):'Yan hedef yok'}</span></div><div><b>Durum etkisi</b><span>${esc(status.effect)}</span></div></div>
    ${last&&context!=='opening'?`<div class="ll-board-last ${last.delta>=0?'positive':'negative'}"><b>Son değişim: ${last.delta>=0?'+':''}${last.delta}</b><span>${esc(last.reasons.join(' · '))}</span></div>`:''}
  </div>`;
}
function injectBoardDashboard(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root||root.querySelector('[data-board-confidence]'))return;
  const metrics=root.querySelector('.ll-metrics'),grid=root.querySelector('.ll-grid');
  const host=document.createElement('div');host.innerHTML=confidenceBarHtml(state,'dashboard');const card=host.firstElementChild;
  if(grid)grid.insertAdjacentElement('beforebegin',card);else if(metrics)metrics.insertAdjacentElement('afterend',card);
}
function injectBoardOpening(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root||root.querySelector('[data-board-confidence]'))return;
  const hero=root.querySelector('.ll-season-opening-hero');
  if(hero)hero.insertAdjacentHTML('afterend',confidenceBarHtml(state,'opening'));
}
function injectBoardSeasonEnd(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root||root.querySelector('[data-board-confidence]'))return;
  const board=ensureBoard(state);board.finalized=true;board.finalValue=board.value;
  const title=root.querySelector('.quiz-start-title'),metrics=root.querySelector('.ll-metrics');
  if(metrics)metrics.insertAdjacentHTML('afterend',confidenceBarHtml(state,'season-end'));
  else if(title)title.insertAdjacentHTML('afterend',confidenceBarHtml(state,'season-end'));
}
function injectRoundConfidence(entry){
  if(!entry||typeof document==='undefined')return;
  const root=typeof globalThis.llArea==='function'?llArea():null,panel=root?.querySelector('.ll-panel');if(!panel||panel.querySelector('[data-board-match-change]'))return;
  const status=confidenceStatus(entry.after);
  const html=`<div class="ll-board-match-change ${entry.delta>=0?'positive':'negative'}" data-board-match-change><b>Yönetim güveni ${entry.delta>=0?'+':''}${entry.delta}: ${entry.before} → ${entry.after}</b><span>${esc(entry.reasons.join(' · '))}</span><small>${esc(status.label)} · ${esc(status.effect)}</small></div>`;
  const actions=panel.querySelector('div[style*="justify-content:center"]');if(actions)actions.insertAdjacentHTML('beforebegin',html);else panel.insertAdjacentHTML('beforeend',html);
}

function showBoardMeeting(force=false){
  const state=stateNow(),board=ensureBoard(state);if(!state||!board)return;
  const rule=dismissalRule(ensureProfile(state).reputation),threshold=rule.threshold;
  if(!force&&!(board.value<=threshold&&board.badStreak>=rule.badStreak))return;
  const key=`${state.season}-${board.matchCount}-${board.value}`;
  if(!force&&board.meetings.some(item=>item.key===key))return;
  board.meetings.push({key,value:board.value,badStreak:board.badStreak,at:new Date().toISOString()});
  document.getElementById('ll-board-meeting')?.remove();document.body.classList.add('ll-cinematic-open');
  document.body.insertAdjacentHTML('beforeend',`<div id="ll-board-meeting" class="ll-board-meeting-backdrop" role="dialog" aria-modal="true"><div class="ll-board-meeting"><div class="ll-board-meeting-icon">⚠️</div><span class="ll-rarity">ACİL YÖNETİM TOPLANTISI</span><h2>Görevin ciddi risk altında</h2><p>Güven ${board.value}/100 seviyesine düştü ve ${board.badStreak} olumsuz sonuçluk seri oluştu. ${esc(rule.label)}: sezon sonu değerlendirmesinde güven eşiği <b>${threshold}</b>, gereken kötü seri <b>${rule.badStreak}</b> maçtır.</p><div class="ll-notice"><b>Bu toplantı anında kovulma değildir.</b> Mevcut oyundaki küme düşme ve üst üste ana hedef başarısızlığı kriterleri aynen devam eder. Buna ek olarak sezon sonunda çok düşük güven ve kötü seri birlikte değerlendirilir.</div><button class="ll-btn danger" onclick="llCloseBoardMeeting()">Toplantı Notunu Aldım</button></div></div>`);
  if(typeof globalThis.llSave==='function')llSave();
}
globalThis.llShowBoardMeeting=showBoardMeeting;
globalThis.llCloseBoardMeeting=function(){document.getElementById('ll-board-meeting')?.remove();document.body.classList.remove('ll-cinematic-open');};

function pressEligible(state,quiz){
  const info=criticalMatchInfo(fixtureNow(),state),answered=num(quiz?.totalAnswered,quiz?.index);
  return !!(info.critical&&!quiz?.skipped&&answered>=10&&quiz?.queue?.length>=10);
}
function showPressOffer(normalPlusPos){
  const state=stateNow(),q=globalThis.lexLeague?.quiz,info=criticalMatchInfo(fixtureNow(),state);if(!state||!q||!info.critical){startMatchBase?.(normalPlusPos);return;}
  q.normalPlusPos=normalPlusPos||null;q.pressConferenceOffered=true;
  llArea().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel" style="text-align:center"><div class="ll-press-icon">🎙️</div><span class="ll-rarity">ÇOK ÖNEMLİ MAÇ</span><div class="quiz-start-title" style="margin-top:8px">Basın <em>Toplantısı</em></div><div class="ll-sub">${esc(info.label)}</div><div class="ll-press-offer"><b>Bu maç çok kritik.</b><span>Basın toplantısına katılırsan normal 10 kelimelik döngünün devamındaki 5 kelime sorulur.</span><ul><li>5/5 doğru: Seçtiğin mevkinin zar üst sınırı bu maç için +1.</li><li>4/5 veya altı: Bonus yok; kelimeler öğrenilmiş sayılır.</li><li>Boost maç sonunda tamamen silinir.</li></ul></div><div class="ll-actions" style="justify-content:center;margin-top:18px"><button class="ll-btn gold" onclick="llStartPressConferenceQuiz()">Katıl · 5 Ek Kelime</button><button class="ll-btn" onclick="llSkipPressConference()">Geç · Normal Maça Devam</button></div></div></div>`;
}
function startPressQuiz(){
  const state=stateNow(),q=globalThis.lexLeague?.quiz;if(!state||!q)return;
  const queue=typeof globalThis.llPickQuizWords==='function'?llPickQuizWords(PRESS_WORD_COUNT):[];
  if(queue.length<PRESS_WORD_COUNT){q.pressConferenceResolved=true;alert(`Basın toplantısı için 5 kullanılabilir kelime gerekiyor. Mevcut: ${queue.length}. Maça normal bonuslarla devam edilecek.`);startMatchBase?.(q.normalPlusPos||null);return;}
  globalThis.lexLeague.pressQuiz={queue,index:0,correct:0,revealed:false,recoveredWords:0,recoveryBonus:0,normalPlusPos:q.normalPlusPos||null,critical:criticalMatchInfo(fixtureNow(),state),completed:false};
  renderPressQuiz();
}
function renderPressQuiz(){
  const pq=globalThis.lexLeague?.pressQuiz;if(!pq)return;
  if(pq.index>=pq.queue.length){finishPressQuiz();return;}
  const ref=pq.queue[pq.index],words=typeof globalThis.loadUserWords==='function'?loadUserWords():[],word=words.find(item=>item.id===ref.id);
  if(!word){pq.index++;renderPressQuiz();return;}
  if(typeof globalThis.llRecordQuizWordShown==='function')llRecordQuizWordShown(ref,word);
  const question=ref.askTrToEn?String(word.tr||'').split(',')[0].trim():word.en,answer=ref.askTrToEn?word.en:word.tr;
  let example='';if(word.example)example=ref.askTrToEn&&typeof globalThis.llMaskAnswerInExample==='function'?llMaskAnswerInExample(word.example,word.en):word.example;
  const exampleHtml=example&&typeof globalThis.llExampleSentenceHtml==='function'?llExampleSentenceHtml(word,example,`press-${pq.index}-${word.id}`):'';
  const questionHtml=ref.askTrToEn?esc(question):`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,question):esc(question)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`;
  const answerHtml=ref.askTrToEn?`<div class="pronounce-line"><span>${typeof globalThis.llEnglishWordHtml==='function'?llEnglishWordHtml(word,answer):esc(answer)}</span>${typeof globalThis.llPronounceButton==='function'?llPronounceButton(word.en):''}</div>`:esc(answer);
  const pct=(pq.index/pq.queue.length)*100;
  llArea().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Basın Toplantısı <em>Kelime Boost</em></div><div class="ll-muted">Normal sınavın devamı · ${pq.index+1}/5 · Boost için kusursuz 5/5 gerekir</div></div><div class="ll-stars">Doğru: ${pq.correct}/5</div></div><div class="ll-progress"><div style="width:${pct}%"></div></div><div class="ll-question" onclick="llRevealPressQuiz()"><div><div class="ll-position">${ref.askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-question-word">${questionHtml}</div>${exampleHtml}${pq.revealed?`<div class="ll-answer">${answerHtml}</div>`:'<div class="ll-muted" style="margin-top:25px">Cevabı açmak için karta tıkla</div>'}</div></div><div class="ll-quiz-actions" style="${pq.revealed?'':'opacity:.35;pointer-events:none'}"><button class="ll-btn danger" onclick="llRatePressQuiz(false)">✗ Bilmiyorum</button><button class="ll-btn primary" onclick="llRatePressQuiz(true)">✓ Bildim</button></div><div class="ll-muted" style="text-align:center;margin-top:10px">Katılım başladıktan sonra 5 kelimenin tamamı cevaplanır.</div></div></div>`;
  if(typeof globalThis.markNewWordFrame==='function')markNewWordFrame(word,llArea().querySelector('.ll-question'));
}
function ratePressQuiz(correct){
  const pq=globalThis.lexLeague?.pressQuiz;if(!pq||!pq.revealed)return;
  const ref=pq.queue[pq.index],words=typeof globalThis.loadUserWords==='function'?loadUserWords():[],card=words.find(item=>item.id===ref.id),quality=correct?5:1;
  if(card&&typeof globalThis.sm2==='function'){
    const recovered=correct&&card.isActiveMistake===true,updated=sm2(card,quality);Object.assign(card,updated);
    if(typeof globalThis.todayStr==='function')card.lastReviewed=todayStr();card.reviewCount=num(card.reviewCount)+1;
    if(correct)card.isActiveMistake=false;else{card.wrongCount=num(card.wrongCount)+1;card.isActiveMistake=true;}
    if(recovered){const bonus=typeof globalThis.LL_RECOVERY_AP==='number'?LL_RECOVERY_AP:3;pq.recoveredWords++;pq.recoveryBonus+=bonus;}
    if(typeof globalThis.saveWordsToStorage==='function')saveWordsToStorage(words);
    if(typeof globalThis.loadMeta==='function'&&typeof globalThis.saveMeta==='function'){
      const meta=loadMeta();if(!meta.activity)meta.activity={};const today=typeof globalThis.todayStr==='function'?todayStr():new Date().toISOString().slice(0,10);
      if(!meta.activity[today])meta.activity[today]={reviews:0,correct:0};meta.activity[today].reviews++;if(correct)meta.activity[today].correct++;saveMeta(meta);
    }
  }
  if(typeof globalThis.llMarkQuizWordUsed==='function')llMarkQuizWordUsed(ref);if(correct)pq.correct++;
  pq.index++;pq.revealed=false;if(typeof globalThis.llSave==='function')llSave();renderPressQuiz();
}
function finishPressQuiz(){
  const state=stateNow(),pq=globalThis.lexLeague?.pressQuiz,q=globalThis.lexLeague?.quiz;if(!state||!pq||pq.completed)return;
  pq.completed=true;const baseAp=pq.correct*(typeof globalThis.llQuizApPerWord==='function'?llQuizApPerWord():10),ap=baseAp+num(pq.recoveryBonus);state.ap=num(state.ap)+ap;
  if(state.achievementStats){state.achievementStats.words=num(state.achievementStats.words)+pq.correct;state.achievementStats.corrections=num(state.achievementStats.corrections)+pq.recoveredWords;}
  if(q)q.pressConferenceResolved=true;
  if(typeof globalThis.llSave==='function')llSave();
  const perfect=pq.correct===PRESS_WORD_COUNT;
  llArea().innerHTML=`<div class="ll-shell ll-quiz-card"><div class="ll-panel" style="text-align:center"><div class="ll-press-icon">${perfect?'⚡':'🎙️'}</div><span class="ll-rarity">BASIN TOPLANTISI SONUCU</span><div class="quiz-start-title" style="margin-top:8px">${pq.correct}/5 <em>Doğru</em></div><div class="ll-metrics" style="max-width:420px;margin:18px auto"><div class="ll-metric"><strong>+${ap}</strong><span>Ek AP</span></div><div class="ll-metric"><strong>${perfect?'+1':'0'}</strong><span>Zar Üst Sınırı</span></div></div>${perfect?`<div class="ll-press-success"><b>Kelime Boost kazanıldı.</b><span>Bir mevki seç. Örneğin normal aralık 2–5 ise bu maçta 2–6 olur. Etki yalnızca bu maçta ve seçilen mevkide geçerlidir.</span></div><div class="ll-card-title" style="margin-top:18px">Boost Uygulanacak Mevki</div><div class="ll-squad">${LL_POSITIONS.map(pos=>`<button class="ll-team-option" onclick="llChoosePressBoost('${esc(pos)}')"><div class="ll-team-name">${LL_POSITION_ICONS[pos]} ${esc(pos)}</div><div class="ll-range">${esc(pos)} zarının üst sınırı +1</div></button>`).join('')}</div>`:`<div class="ll-notice" style="text-align:left"><b>Boost kazanılmadı.</b> 5/5 gerektiği için zar aralığı değişmeyecek. Beş kelimenin tamamı normal öğrenme geçmişine işlendi.</div><button class="ll-btn primary" style="margin-top:18px" onclick="llContinueAfterPressConference()">Normal Maça Devam</button>`}</div></div>`;
}
function choosePressBoost(position){
  const pq=globalThis.lexLeague?.pressQuiz;if(!pq||!LL_POSITIONS.includes(position))return;
  pq.boostPos=position;startActualMatch(pq.normalPlusPos||null,position);
}
function startActualMatch(normalPlusPos,pressBoostPos=null){
  const q=globalThis.lexLeague?.quiz;if(q)q.pressConferenceResolved=true;
  const critical=criticalMatchInfo(fixtureNow(),stateNow());
  startMatchBase?.(normalPlusPos||null);
  if(globalThis.lexLeague?.match){
    lexLeague.match.boardCriticalInfo=critical;
    lexLeague.match.pressBoostPos=pressBoostPos||null;
    lexLeague.match.pressConference=pressBoostPos?{perfect:true,position:pressBoostPos,correct:5,total:5}:{perfect:false,correct:num(lexLeague.pressQuiz?.correct),total:5};
    if(typeof globalThis.llRenderMatch==='function')llRenderMatch();
  }
}
globalThis.llStartPressConferenceQuiz=startPressQuiz;
globalThis.llRevealPressQuiz=function(){const pq=globalThis.lexLeague?.pressQuiz;if(!pq)return;pq.revealed=true;renderPressQuiz();};
globalThis.llRatePressQuiz=ratePressQuiz;
globalThis.llSkipPressConference=function(){const q=globalThis.lexLeague?.quiz;if(q)q.pressConferenceResolved=true;startActualMatch(q?.normalPlusPos||null,null);};
globalThis.llChoosePressBoost=choosePressBoost;
globalThis.llContinueAfterPressConference=function(){const pq=globalThis.lexLeague?.pressQuiz;startActualMatch(pq?.normalPlusPos||globalThis.lexLeague?.quiz?.normalPlusPos||null,null);};

let startMatchBase=null;
function installBeginMatch(){
  if(typeof globalThis.llBeginMatch!=='function'||globalThis.llBeginMatch.__boardPress)return;
  startMatchBase=globalThis.llBeginMatch;
  const wrapped=function(plusPos){
    const state=stateNow(),q=globalThis.lexLeague?.quiz,fixture=fixtureNow(),critical=criticalMatchInfo(fixture,state);
    if(state&&q&&!q.pressConferenceResolved&&!q.pressConferenceOffered&&pressEligible(state,q)){showPressOffer(plusPos);return;}
    const result=startMatchBase.apply(this,arguments);
    if(globalThis.lexLeague?.match)lexLeague.match.boardCriticalInfo=critical;
    return result;
  };
  wrapped.__boardPress=true;globalThis.llBeginMatch=wrapped;
}
function installRollValue(){
  if(typeof globalThis.llRollValue!=='function'||globalThis.llRollValue.__boardPress)return;
  const base=globalThis.llRollValue;
  const wrapped=function(teamName,pos){
    const match=globalThis.lexLeague?.match,boost=!!(match&&teamName===match.player&&pos===match.pressBoostPos);
    if(!boost||typeof globalThis.llRandomInt!=='function')return base.apply(this,arguments);
    const randomBase=globalThis.llRandomInt;let extended=false;
    globalThis.llRandomInt=function(min,max){
      if(!extended){extended=true;return randomBase(min,num(max)+1);}
      return randomBase(min,max);
    };
    try{return base.apply(this,arguments);}finally{globalThis.llRandomInt=randomBase;}
  };
  wrapped.__boardPress=true;wrapped.__boardPressBase=base;globalThis.llRollValue=wrapped;
}
function decorateMatch(){
  const match=globalThis.lexLeague?.match,root=typeof globalThis.llArea==='function'?llArea():null;if(!match?.pressBoostPos||!root||root.querySelector('[data-press-boost]'))return;
  const notice=root.querySelector('.ll-notice');
  const range=typeof globalThis.llRange==='function'?llRange(llTeamState(match.player).stars):[1,4],text=`${range[0]}–${range[1]} → ${range[0]}–${range[1]+1}`;
  const html=`<div class="ll-press-boost-badge" data-press-boost><b>⚡ Basın Toplantısı Boostu: ${esc(match.pressBoostPos)}</b><span>Zar üst sınırı bu maç için +1 · ${text} · maç sonunda silinir.</span></div>`;
  if(notice)notice.insertAdjacentHTML('afterend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('afterbegin',html);
}

function overTarget(state,summary,performance){
  if(!performance?.primaryAchieved)return false;
  const rows=performance.league==='super'?summary?.superRows||[]:summary?.firstRows||[],goal=primaryGoal(state),target=targetPosition(goal,rows,state),position=num(performance.position,99);
  if(goal.type==='champion')return false;
  if(goal.type==='direct_promote')return position===1;
  if(goal.type==='promote'||goal.type==='playoff')return position<=2;
  return position<=Math.max(1,target-2);
}
function veryBadSeason(state,summary,performance){
  if(performance?.primaryAchieved)return false;
  const rows=performance.league==='super'?summary?.superRows||[]:summary?.firstRows||[],target=targetPosition(primaryGoal(state),rows,state),gap=num(performance.position,rows.length)-target,board=ensureBoard(state);
  return gap>=Math.max(4,Math.ceil((rows.length||18)*.20))||board.value<=25;
}
function reputationAchievementFactor(stars){
  stars=clamp(stars,1,6);
  if(stars>=6)return .50;
  if(stars===5)return .65;
  if(stars===4)return .80;
  return 1;
}
function scaledReputationPoints(base,stars,minimum=1){return Math.max(minimum,Math.round(num(base)*reputationAchievementFactor(stars)));}
function reputationSeasonPositiveCap(reputation){
  reputation=clamp(reputation,0,100);
  if(reputation>=95)return 1;
  if(reputation>=90)return 2;
  if(reputation>=85)return 3;
  if(reputation>=75)return 5;
  if(reputation>=60)return 7;
  return 8;
}
function europeReputationGain(state,performance,stars){
  if(performance?.europeTrophy)return {points:scaledReputationPoints(9,stars,4),label:`Avrupa kupası (${stars}★ kulüp beklentisi uygulandı)`};
  if(performance?.europeSuccess)return {points:scaledReputationPoints(6,stars,3),label:`Avrupa’da yarı final veya final (${stars}★ kulüp beklentisi uygulandı)`};
  const results=(state?.results||[]).filter(item=>Number(item?.season||state.season)===Number(state.season)&&['ucl','uel','uecl'].includes(item?.competition));
  const knockout=results.some(item=>/Play-?Off|Eleme|Son 16|Çeyrek|Yarı|Final/i.test(String(item?.roundLabel||'')));
  return knockout?{points:scaledReputationPoints(3,stars,2),label:`Avrupa’da eleme turuna çıkış (${stars}★ kulüp beklentisi uygulandı)`}:{points:0,label:''};
}
function currentTenure(state,team){
  try{
    if(typeof globalThis.llManagerProfileCaptureSeason==='function'&&state.lastSeasonSummary)llManagerProfileCaptureSeason(state,state.lastSeasonSummary);
    const aggregate=typeof globalThis.llManagerCareerAggregate==='function'?llManagerCareerAggregate(state):null;
    if(aggregate?.currentTenureTeam===team)return num(aggregate.currentTenure);
  }catch{}
  const history=state?.managerProfile?.history||[];let tenure=1,current=team;
  for(let i=history.length-1;i>=0;i--){const item=history[i];if(item?.to===current&&item?.from===current)tenure++;else if(item?.to&&item.to!==current)break;}
  return tenure;
}
function evaluateReputation(state,summary,performance){
  const profile=ensureProfile(state),season=num(summary?.season,state?.season);
  if(num(profile.lastEvaluatedSeason)===season)return profile;
  profile.failedPrimaryStreak=performance.primaryAchieved?0:num(profile.failedPrimaryStreak)+1;
  const reasons=[];let positive=0,negative=0;
  const add=(points,label)=>{points=num(points);if(!points)return;if(points>0)positive+=points;else negative+=points;reasons.push({points,label});};
  const clubStars=teamStars(state,performance.from),factor=reputationAchievementFactor(clubStars);
  if(performance.superChampion)add(scaledReputationPoints(8,clubStars,4),`Lig şampiyonluğu · ${clubStars}★ kulüp beklentisi`);
  if(performance.promoted)add(6,'Üst lige yükselme');
  const cupWinner=summary?.countrySummaries?.[state.playerCountry||'TUR']?.cupWinner||summary?.cupWinner;
  if(cupWinner===performance.from)add(scaledReputationPoints(4,clubStars,2),`Yerel kupa · ${clubStars}★ kulüp beklentisi`);
  const europe=europeReputationGain(state,performance,clubStars);add(europe.points,europe.label);
  const tenure=currentTenure(state,performance.from);if(tenure>=3&&tenure%3===0)add(1,`Aynı kulüpte ${tenure}. sezon istikrarı`);
  if(overTarget(state,summary,performance))add(2,'Sezonu ana hedefin belirgin üzerinde bitirme');
  if(!performance.primaryAchieved)add(-2,'Ana hedef başarısızlığı');
  if(performance.superRelegated)add(-10,'Küme düşme');
  if(veryBadSeason(state,summary,performance))add(-4,'Ana hedefin çok altında biten sezon');
  const before=clamp(profile.reputation||50,0,100),legendPositive=Math.max(0,num(profile.legendCallReputationBySeason?.[String(season)])),capBasis=clamp(before-legendPositive,0,100),totalPositiveCap=reputationSeasonPositiveCap(capBasis),positiveCap=Math.max(0,totalPositiveCap-legendPositive),appliedPositive=Math.min(positive,positiveCap);
  if(positive>positiveCap)reasons.push({points:-(positive-positiveCap),label:`İtibar seviyesi nedeniyle sezonluk artış sınırı (+${totalPositiveCap}; Efsaneni Çağır +${legendPositive} dahil)`});
  const delta=appliedPositive+negative,after=clamp(before+delta,0,100);
  profile.reputation=after;profile.lastEvaluatedSeason=season;profile.lastSeasonDelta=after-before;profile.lastSeasonWinRate=performance.winRate;profile.lastPrimaryAchieved=performance.primaryAchieved;
  profile.reputationSystemVersion=REPUTATION_SYSTEM_VERSION;if(!Array.isArray(profile.reputationHistory))profile.reputationHistory=[];
  profile.reputationHistory.push({season,before,delta:after-before,after,reasons,tenure,clubStars,expectationFactor:factor,positiveBeforeCap:positive,positiveCap:totalPositiveCap,legendPositive,remainingPositiveCap:positiveCap,negative,systemVersion:REPUTATION_SYSTEM_VERSION,at:new Date().toISOString()});profile.reputationHistory=profile.reputationHistory.slice(-30);
  return profile;
}
function installManagerEvaluate(){globalThis.llManagerEvaluate=evaluateReputation;}

function dismissalRule(reputation){
  reputation=clamp(reputation,0,100);
  if(reputation>=75)return {threshold:6,badStreak:4,label:'Yüksek itibar nedeniyle ek sabır'};
  if(reputation<=30)return {threshold:10,badStreak:2,label:'Düşük itibar nedeniyle daha kısa sabır'};
  return {threshold:10,badStreak:3,label:'Standart yönetim eşiği'};
}
function dismissalThreshold(reputation){return dismissalRule(reputation).threshold;}
function boardDismissal(state){
  const board=ensureBoard(state),rep=ensureProfile(state).reputation,rule=dismissalRule(rep);
  return {dismiss:board.value<=rule.threshold&&board.badStreak>=rule.badStreak,threshold:rule.threshold,requiredBadStreak:rule.badStreak,ruleLabel:rule.label,confidence:board.value,badStreak:board.badStreak,reputation:rep};
}
function candidatesFromSummary(state,summary,options={}){
  const source=summary?.leagueRows||{},countries=globalThis.LL_COUNTRY_CODES||Object.keys(source),rows=[];
  countries.forEach(country=>['tier1','tier2'].forEach(tier=>(source?.[country]?.[tier]||[]).forEach(row=>{
    const team=row?.team;if(!team||team===state.playerTeam)return;
    rows.push({team,country,tier,stars:teamStars(state,team)});
  })));
  return rows.filter(item=>(!options.tier||item.tier===options.tier)&&item.stars<=num(options.maxStars,6));
}
function uniqueOffers(items){const seen=new Set();return (items||[]).filter(item=>item?.team&&!seen.has(item.team)&&seen.add(item.team));}
function managerOfferTarget(effective,status,fired){
  effective=clamp(effective,0,100);
  let target=effective<40?1:effective<60?2:3;
  if(fired||status==='dismissal')target=Math.min(target,2);
  return Math.max(1,target);
}
function managerOfferQualityCap(performance,currentStars,status){
  let cap=6;
  if(!performance?.primaryAchieved)cap=Math.min(cap,4);
  if(status==='danger')cap=Math.min(cap,4);
  if(status==='dismissal')cap=Math.min(cap,3);
  if(performance?.league==='first'&&performance?.promoted)cap=Math.min(cap,currentStars);
  return clamp(cap,1,6);
}
function offerCandidateNextLeague(summary,item){
  try{return typeof globalThis.llManagerNextLeague==='function'?llManagerNextLeague(summary,item.team)==='super':item.tier==='tier1';}
  catch{return item.tier==='tier1';}
}
function offerCandidateAllowed(state,summary,performance,profile,fired,currentStars,qualityCap,item){
  if(!item||item.team===performance.from||num(item.stars)>qualityCap)return false;
  const promotionStarCap=performance.league==='first'&&performance.promoted;
  if(typeof globalThis.llMLForeignOfferStarCap==='function'){
    try{
      const foreignCap=llMLForeignOfferStarCap(state,performance,profile,fired,currentStars,item,promotionStarCap);
      if(num(item.stars)>num(foreignCap,6))return false;
    }catch{}
  }
  return true;
}
function refillManagerOffers(state,summary,performance,profile,fired,offers,target,qualityCap){
  const currentStars=teamStars(state,performance.from),used=new Set(),countryCounts=new Map();
  offers=uniqueOffers(offers).filter(offer=>{
    if(num(offer.stars)>qualityCap)return false;
    const item={team:offer.team,country:offer.country||'',tier:offer.nextLeague==='super'?'tier1':'tier2',stars:num(offer.stars)};
    if(!offerCandidateAllowed(state,summary,performance,profile,fired,currentStars,qualityCap,item))return false;
    used.add(offer.team);countryCounts.set(item.country,(countryCounts.get(item.country)||0)+1);return true;
  });
  const all=candidatesFromSummary(state,summary,{maxStars:qualityCap}).filter(item=>offerCandidateAllowed(state,summary,performance,profile,fired,currentStars,qualityCap,item));
  const tier1=all.filter(item=>item.tier==='tier1'&&offerCandidateNextLeague(summary,item));
  const fallback=all.filter(item=>!tier1.includes(item));
  const seed=`${summary?.season||state?.season||0}|${performance.from}|board-offers`;
  const hash=value=>typeof globalThis.llManagerHash==='function'?llManagerHash(value):String(value).split('').reduce((acc,ch)=>((acc*33)^ch.charCodeAt(0))>>>0,5381);
  const addFrom=pool=>{
    while(offers.length<target){
      let available=pool.filter(item=>!used.has(item.team));
      if(!available.length)break;
      const diversified=available.filter(item=>(countryCounts.get(item.country)||0)<2);
      if(diversified.length)available=diversified;
      available.sort((a,b)=>(countryCounts.get(a.country)||0)-(countryCounts.get(b.country)||0)||num(b.stars)-num(a.stars)||hash(a.team+seed)-hash(b.team+seed)||a.team.localeCompare(b.team,'tr'));
      const item=available[0];
      try{
        const offer=llManagerOffer(state,summary,item.team,'safe');offer.boardAdjusted=true;offer.country=item.country;
        offers.push(offer);used.add(item.team);countryCounts.set(item.country,(countryCounts.get(item.country)||0)+1);
      }catch{used.add(item.team);}
    }
  };
  addFrom(tier1);addFrom(fallback);
  return uniqueOffers(offers).slice(0,target);
}
function buildMarketOffers(base,state,summary,performance,profile,fired){
  const baseRep=clamp(profile?.reputation||50,0,100),effective=effectiveReputation(state,baseRep),proxy={...profile,reputation:effective},built=base(state,summary,performance,proxy,fired)||{offers:[]};
  let offers=uniqueOffers(built.offers||[]),currentStars=teamStars(state,performance.from),status=confidenceStatus(ensureBoard(state).value).key;
  const makeOffer=item=>{
    try{const offer=llManagerOffer(state,summary,item.team,'safe');offer.boardAdjusted=true;offer.country=item.country;return offer;}catch{return null;}
  };
  if(effective<=30){
    const pool=candidatesFromSummary(state,summary,{tier:'tier2',maxStars:Math.min(2,currentStars)}).sort((a,b)=>(a.country===state.playerCountry?-1:1)-(b.country===state.playerCountry?-1:1)||a.stars-b.stars||a.team.localeCompare(b.team,'tr'));
    offers=uniqueOffers(pool.map(makeOffer).filter(Boolean)).slice(0,status==='dismissal'?1:2);
    if(!offers.length)offers=uniqueOffers((built.offers||[]).filter(item=>num(item.stars)<=2)).slice(0,2);
  }else if(effective<=60){
    const maxStars=effective<=45?3:4,maxJump=1;
    offers=offers.filter(item=>num(item.stars)<=maxStars&&num(item.stars)<=currentStars+maxJump);
    if(offers.length<3){
      const pool=candidatesFromSummary(state,summary,{maxStars}).filter(item=>item.stars<=currentStars+maxJump).sort((a,b)=>(a.tier==='tier1'?-1:1)-(b.tier==='tier1'?-1:1)||b.stars-a.stars||a.team.localeCompare(b.team,'tr'));
      offers=uniqueOffers([...offers,...pool.map(makeOffer).filter(Boolean)]).slice(0,3);
    }
  }
  const target=managerOfferTarget(effective,status,fired),qualityCap=managerOfferQualityCap(performance,currentStars,status);
  offers=offers.filter(item=>num(item.stars)<=qualityCap);
  offers=refillManagerOffers(state,summary,performance,proxy,fired,offers,target,qualityCap);
  built.offers=offers;built.offerCountTarget=target;built.offerQualityCap=qualityCap;built.effectiveReputation=effective;built.baseReputation=baseRep;built.boardConfidence=ensureBoard(state).value;built.boardMarketModifier=marketModifier(state);
  built.progression=!!built.progression&&effective>=31&&status!=='danger'&&status!=='dismissal';
  built.prestige=!!built.prestige&&effective>=61&&status!=='danger'&&status!=='dismissal';
  return built;
}
function installManagerBuildOffers(){
  if(typeof globalThis.llManagerBuildOffers!=='function'||globalThis.llManagerBuildOffers.__boardRep)return;
  const base=globalThis.llManagerBuildOffers;
  const wrapped=function(state,summary,performance,profile,fired){return buildMarketOffers(base,state,summary,performance,profile,fired);};
  wrapped.__boardRep=true;globalThis.llManagerBuildOffers=wrapped;
}
function applyDismissalReputationPenalty(state,market){
  if(!state||!market?.fired)return false;
  const profile=ensureProfile(state),season=num(market.season,state.season),team=market.fromTeam||state.playerTeam,key=`dismissal-reputation-${season}-${team}`;
  if(!Array.isArray(profile.reputationEvents))profile.reputationEvents=[];
  if(profile.reputationEvents.some(item=>item.key===key))return false;
  const before=clamp(profile.reputation,0,100),after=clamp(before-DISMISSAL_REPUTATION_PENALTY,0,100),points=after-before;
  const event={key,season,before,delta:points,after,label:'Takımdan kovulma',team,at:new Date().toISOString()};profile.reputation=after;profile.reputationEvents.push(event);
  if(!Array.isArray(profile.reputationHistory))profile.reputationHistory=[];
  const report=[...profile.reputationHistory].reverse().find(item=>num(item?.season)===season&&!item?.event);
  if(report){
    if(!Array.isArray(report.reasons))report.reasons=[];report.reasons.push({points,label:event.label});report.after=after;report.delta=after-num(report.before,before);report.dismissalPenalty=points;profile.lastSeasonDelta=report.delta;
  }else profile.reputationHistory.push({season,before,delta:points,after,reasons:[{points,label:event.label}],event:true,dismissalPenalty:points,at:event.at});
  profile.reputationHistory=profile.reputationHistory.slice(-30);market.dismissalReputationPenalty=points;market.reputationAfterDismissal=after;
  return true;
}
function installEnsureMarket(){
  if(typeof globalThis.llEnsureManagerMarket!=='function'||globalThis.llEnsureManagerMarket.__boardRep)return;
  const base=globalThis.llEnsureManagerMarket;
  const wrapped=function(state=stateNow()){
    const market=base.apply(this,arguments);if(!state||!market)return market;
    const board=ensureBoard(state),profile=ensureProfile(state),dismissal=boardDismissal(state),status=confidenceStatus(board.value);
    let performance={from:market.fromTeam,league:null,promoted:false,primaryAchieved:market.primaryAchieved};
    try{if(state.lastSeasonSummary)performance=llManagerPerformance(state,state.lastSeasonSummary);}catch{}
    if(market.status==='pending'&&dismissal.dismiss&&!market.fired){
      market.fired=true;market.canStay=false;market.fireReason=`Yönetim güveni ${board.value}/100 seviyesine düştü ve ${board.badStreak} maçlık olumsuz seri oluştu. ${reputationTier(profile.reputation)} itibar seviyende güven eşiği ${dismissal.threshold}, gereken kötü seri ${dismissal.requiredBadStreak} maçtır.`;market.boardDismissal=true;
    }
    const penaltyApplied=applyDismissalReputationPenalty(state,market);
    if(market.status==='pending'&&(penaltyApplied||market.boardDismissal)){
      try{
        const rebuilt=llManagerBuildOffers(state,state.lastSeasonSummary,performance,profile,true);
        market.offers=rebuilt.offers;market.offerCountTarget=rebuilt.offerCountTarget;market.offerQualityCap=rebuilt.offerQualityCap;market.progressionEligible=false;market.prestigeEligible=false;
      }catch{}
    }
    const effective=effectiveReputation(state,profile.reputation);
    market.boardConfidence=board.value;market.boardConfidenceStatus=status.label;market.baseReputation=profile.reputation;market.effectiveReputation=effective;market.boardMarketModifier=marketModifier(state);
    market.offerCountTarget=managerOfferTarget(effective,status.key,market.fired);market.offerQualityCap=managerOfferQualityCap(performance,num(market.fromStars,teamStars(state,market.fromTeam)),status.key);
    if(typeof globalThis.llSave==='function')llSave();return market;
  };
  wrapped.__boardRep=true;globalThis.llEnsureManagerMarket=wrapped;
}

function decorateManagerMarket(){
  const state=stateNow(),market=state?.managerMarket,root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!market||!root||root.querySelector('[data-board-market]'))return;
  const mod=num(market.boardMarketModifier),status=confidenceStatus(market.boardConfidence);
  const count=Array.isArray(market.offers)?market.offers.length:0,target=num(market.offerCountTarget,count),cap=num(market.offerQualityCap,6);
  const firingText=num(market.dismissalReputationPenalty)<0?` Kovulma nedeniyle profil itibarına ayrıca <b>${market.dismissalReputationPenalty}</b> uygulandı.`:'';
  const notice=`<div class="ll-notice ll-board-market-note" data-board-market><b>Yönetim desteği ve itibar:</b> Profil itibarı ${market.baseReputation}/100 (${esc(reputationTier(market.baseReputation))}); güven ${market.boardConfidence}/100 olduğu için piyasada ${mod>0?'+':''}${mod} geçici etki uygulanıyor.${firingText} <b>${count} doğrudan teklif</b> üretildi${target?` (hedef ${target})`:''}; mevcut sezon ve güven durumu teklif seviyesini en fazla ${cap}★ ile sınırlandırıyor. Düşük güven, yüksek itibarlı bir menajeri tek teklife düşürmez.</div>`;
  const metrics=root.querySelector('.ll-metrics');if(metrics)metrics.insertAdjacentHTML('afterend',notice);
}
function adjustApplication(team){
  const state=stateNow(),market=state?.managerMarket,application=market?.applications?.[team],vacancy=(market?.vacancies||[]).find(item=>item.team===team);
  if(!state||!application||!vacancy||application.boardIntegrationVersion===VERSION)return application;
  const profile=ensureProfile(state),baseRep=profile.reputation,effective=effectiveReputation(state,baseRep),criterion=(application.criteria||[]).find(item=>item.code==='reputation');
  if(criterion){
    const required=num(String(criterion.required||'').match(/\d+/)?.[0],({1:28,2:36,3:46,4:58,5:70,6:82}[vacancy.stars]||50)),oldPoints=num(criterion.points);
    const newPoints=Math.round(Math.min(30,(effective/Math.max(1,required))*30)),pass=effective>=required;
    criterion.points=newPoints;criterion.pass=pass;criterion.current=`${baseRep}/100${marketModifier(state)?` · yönetim etkisi ${marketModifier(state)>0?'+':''}${marketModifier(state)} → ${effective}`:''}`;
    criterion.detail=`Profil itibarı ${reputationTier(baseRep)}. Yönetim güveni başvuru değerlendirmesinde geçici itibar etkisi oluşturur.`;
    application.totalScore=num(application.totalScore)-oldPoints+newPoints;
    const levelPass=(application.criteria||[]).find(item=>item.code==='level')?.pass!==false,countryPass=(application.criteria||[]).find(item=>item.code==='country')?.pass!==false;
    application.mandatoryPass=pass&&levelPass&&countryPass;application.accepted=application.totalScore>=application.requiredScore&&application.mandatoryPass;
  }
  application.baseReputation=baseRep;application.effectiveReputation=effective;application.boardConfidence=ensureBoard(state).value;application.boardModifier=marketModifier(state);application.boardIntegrationVersion=VERSION;
  application.boardDecision=application.accepted?'Yönetim başvurunu kabul etti. Sözleşme imzalamaya davet edildin.':'Yönetim; itibar, güven desteği ve diğer zorunlu kriterler birlikte değerlendirildiğinde başvurunu yeterli bulmadı.';
  return application;
}
function installApplicationWrapper(){
  if(typeof globalThis.llApplyForVacantClub==='function'&&!globalThis.llApplyForVacantClub.__boardRep){
    const base=globalThis.llApplyForVacantClub;
    const wrapped=function(team){const result=base.apply(this,arguments),app=adjustApplication(team);if(app){if(typeof globalThis.llSave==='function')llSave();if(typeof globalThis.llCloseVacantJobReport==='function')llCloseVacantJobReport();if(typeof globalThis.llShowVacantJobReport==='function')llShowVacantJobReport(team);}return result;};
    wrapped.__boardRep=true;globalThis.llApplyForVacantClub=wrapped;
  }
}
function applyCleanDepartureBonus(state,market,fromTeam,toTeam){
  if(!state||!market||market.fired||!fromTeam||!toTeam||fromTeam===toTeam)return;
  const profile=ensureProfile(state),season=num(market.season,state.season),key=`clean-departure-${season}-${fromTeam}-${toTeam}`;
  if(!Array.isArray(profile.reputationEvents))profile.reputationEvents=[];
  if(profile.reputationEvents.some(item=>item.key===key))return;
  const before=profile.reputation,after=clamp(before+1,0,100);profile.reputation=after;
  const event={key,season,before,delta:after-before,after,label:'Başarılı ve temiz kulüp ayrılığı',at:new Date().toISOString()};profile.reputationEvents.push(event);
  if(!Array.isArray(profile.reputationHistory))profile.reputationHistory=[];profile.reputationHistory.push({season,before,delta:after-before,after,reasons:[{points:after-before,label:event.label}],event:true,at:event.at});
}
function installDepartureWrappers(){
  if(typeof globalThis.llChooseManagerOffer==='function'&&!globalThis.llChooseManagerOffer.__boardDeparture){
    const base=globalThis.llChooseManagerOffer;
    const wrapped=function(teamName){const state=stateNow(),market=state?.managerMarket,from=market?.fromTeam,result=base.apply(this,arguments);if(state&&market?.status==='chosen')applyCleanDepartureBonus(state,market,from,teamName);if(typeof globalThis.llSave==='function')llSave();return result;};
    wrapped.__boardDeparture=true;globalThis.llChooseManagerOffer=wrapped;
  }
  if(typeof globalThis.llAcceptVacantClub==='function'&&!globalThis.llAcceptVacantClub.__boardDeparture){
    const base=globalThis.llAcceptVacantClub;
    const wrapped=function(teamName){const state=stateNow(),market=state?.managerMarket,from=market?.fromTeam,result=base.apply(this,arguments);if(state&&market?.status==='chosen')applyCleanDepartureBonus(state,market,from,teamName);if(typeof globalThis.llSave==='function')llSave();return result;};
    wrapped.__boardDeparture=true;globalThis.llAcceptVacantClub=wrapped;
  }
}

function tedirginPackPenalty(state=stateNow()){return confidenceStatus(ensureBoard(state)?.value||0).key==='uneasy';}
function installShopCost(){
  if(typeof globalThis.llShopCost!=='function'||globalThis.llShopCost.__boardCost)return;
  const base=globalThis.llShopCost;
  const wrapped=function(){const cost=num(base.apply(this,arguments),150);return tedirginPackPenalty()?Math.ceil(cost*(1+REGULAR_PACK_SURCHARGE_RATE)/10)*10:cost;};
  wrapped.__boardCost=true;wrapped.__baseCost=base;globalThis.llShopCost=wrapped;
}
function installPremiumPack(){
  if(typeof globalThis.llOpenPremiumPack!=='function'||globalThis.llOpenPremiumPack.__boardCost)return;
  const base=globalThis.llOpenPremiumPack;
  const wrapped=function(position,source='paid'){
    const state=stateNow(),baseCost=typeof LL_PREMIUM_PACK_COST==='number'?LL_PREMIUM_PACK_COST:900;
    if(!state||source!=='paid'||!tedirginPackPenalty(state)||state.pendingPremiumPack||state.pendingRegularPack)return base.apply(this,arguments);
    const total=Math.ceil(baseCost*(1+REGULAR_PACK_SURCHARGE_RATE)/10)*10,surcharge=total-baseCost;
    if(state.ap<total){alert(`Yetersiz AP. Tedirgin yönetim nedeniyle gerekli: ${total} AP`);return;}
    const beforePending=state.pendingPremiumPack,beforeAp=state.ap;state.ap-=surcharge;
    const result=base.apply(this,arguments),opened=state.pendingPremiumPack&&state.pendingPremiumPack!==beforePending;
    if(!opened){state.ap=beforeAp;}else{
      state.pendingPremiumPack.cost=total;state.pendingPremiumPack.boardSurcharge=surcharge;
      const root=typeof document!=='undefined'?document.getElementById('ll-pack-cinematic'):null;
      if(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))if(node.nodeValue?.includes(`${baseCost} AP`))node.nodeValue=node.nodeValue.replace(new RegExp(`${baseCost} AP`,'g'),`${total} AP`);}
    }
    if(typeof globalThis.llSave==='function')llSave();return result;
  };
  wrapped.__boardCost=true;globalThis.llOpenPremiumPack=wrapped;
}
function decorateShop(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root||!tedirginPackPenalty(state)||root.querySelector('[data-board-shop]'))return;
  const baseCost=typeof LL_PREMIUM_PACK_COST==='number'?LL_PREMIUM_PACK_COST:900,total=Math.ceil(baseCost*1.2/10)*10;
  root.querySelectorAll('.ll-card-title,.ll-btn,.ll-sub,.ll-muted').forEach(node=>{if(node.textContent?.includes(`${baseCost} AP`))node.innerHTML=node.innerHTML.replace(new RegExp(`${baseCost} AP`,'g'),`${total} AP`);});
  const topbar=root.querySelector('.ll-topbar');if(topbar)topbar.insertAdjacentHTML('afterend',`<div class="ll-notice ll-board-shop-note" data-board-shop><b>⚠ Yönetim tedirgin:</b> Güven 35–54 aralığında olduğu için bu transfer döneminde ücretli normal ve elit paket maliyetleri %20 arttı. Kart havuzu ve kart gücü değişmedi.</div>`);
}
function decorateProfile(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null;if(!state||!root)return;
  const profile=ensureProfile(state),repBox=root.querySelector('.ll-profile-reputation');
  if(repBox&&!repBox.querySelector('[data-reputation-tier]')){
    const span=repBox.querySelector('span');if(span){span.setAttribute('data-reputation-tier','');span.textContent=`İtibar: ${reputationTier(profile.reputation)} (${profile.reputation})`;}
  }
  if(!root.querySelector('[data-profile-board]')){
    const hero=root.querySelector('.ll-profile-hero'),board=ensureBoard(state),status=confidenceStatus(board.value),history=Array.isArray(profile.reputationHistory)?profile.reputationHistory:[],lastRep=[...history].at(-1),reasons=Array.isArray(lastRep?.reasons)?lastRep.reasons:[];
    const reasonText=reasons.map(item=>`${num(item?.points)>=0?'+':''}${num(item?.points)} ${item?.label||''}`).join(' · ');
    const html=`<div class="ll-card ll-profile-board-card" data-profile-board><div class="ll-card-title">Yönetim ve İtibar Özeti</div><div class="ll-profile-board-grid"><div><b>${board.value}/100</b><span>Yönetim Güveni · ${esc(status.label)}</span></div><div><b>${profile.reputation}/100</b><span>${esc(reputationTier(profile.reputation))}</span></div><div><b>${lastRep?`${num(lastRep.delta)>=0?'+':''}${num(lastRep.delta)}`:'—'}</b><span>Son İtibar Değişimi</span></div></div>${lastRep&&reasonText?`<div class="ll-muted" style="margin-top:9px">${esc(reasonText)}</div>`:''}</div>`;
    if(hero)hero.insertAdjacentHTML('afterend',html);
  }
}
function decorateSeasonEndReputation(){
  const state=stateNow(),root=typeof globalThis.llArea==='function'?llArea():null,profile=state&&ensureProfile(state);if(!state||!root||!profile||root.querySelector('[data-reputation-report]'))return;
  const history=Array.isArray(profile.reputationHistory)?profile.reputationHistory:[],report=[...history].filter(item=>num(item?.season)===num(state.lastSeasonSummary?.season||state.season)).at(-1);
  if(!report)return;
  const reasons=Array.isArray(report.reasons)?report.reasons:[],rows=reasons.map(item=>{const points=num(item?.points);return `<div><span>${esc(item?.label||'İtibar değişimi')}</span><b class="${points>=0?'positive':'negative'}">${points>=0?'+':''}${points}</b></div>`;}).join('')||'<div><span>Bu sezon itibar değişimi oluşmadı.</span><b>0</b></div>';
  const html=`<div class="ll-card ll-reputation-report" data-reputation-report><div class="ll-card-title">Menajer İtibarı Raporu</div><div class="ll-sub">${esc(reputationTier(report.before))} ${report.before} → ${esc(reputationTier(report.after))} ${report.after}</div><div class="ll-reputation-rows">${rows}</div></div>`;
  const board=root.querySelector('[data-board-confidence]');if(board)board.insertAdjacentHTML('afterend',html);else root.querySelector('.ll-panel')?.insertAdjacentHTML('beforeend',html);
}

function wrap(name,fn,flag='__boardSystems'){
  const base=globalThis[name];if(typeof base!=='function'||base[flag])return;
  const wrapped=fn(base);wrapped[flag]=true;globalThis[name]=wrapped;
}
function injectStyles(){
  if(typeof document==='undefined'||document.getElementById('ll-board-systems-styles'))return;
  const style=document.createElement('style');style.id='ll-board-systems-styles';style.textContent=`
.ll-board-confidence{margin:14px 0;padding:16px;border:1px solid rgba(94,234,212,.35);border-radius:16px;background:linear-gradient(135deg,rgba(15,23,42,.92),rgba(30,41,59,.66));box-shadow:0 12px 32px rgba(2,6,23,.22)}.ll-board-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.ll-board-head h3{margin:3px 0 0;font-size:20px}.ll-board-head>strong{font-size:35px;color:#f8fafc}.ll-board-head>strong small{font-size:13px;color:#94a3b8}.ll-board-bar{height:12px;margin:12px 0;border-radius:999px;background:rgba(148,163,184,.18);overflow:hidden}.ll-board-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ef4444 0%,#f59e0b 38%,#22c55e 75%,#14b8a6 100%);box-shadow:0 0 18px rgba(45,212,191,.35)}.ll-board-grid{display:grid;grid-template-columns:1.15fr 1.15fr .9fr;gap:10px}.ll-board-grid>div{padding:10px;border-radius:10px;background:rgba(2,6,23,.35)}.ll-board-grid b,.ll-board-grid span{display:block}.ll-board-grid b{font-size:11px;color:#fde68a;text-transform:uppercase;letter-spacing:.5px}.ll-board-grid span{font-size:12px;color:#cbd5e1;margin-top:4px}.ll-board-last,.ll-board-match-change{display:flex;flex-direction:column;gap:3px;margin-top:10px;padding:10px 12px;border-radius:10px}.ll-board-last.positive,.ll-board-match-change.positive{background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.35)}.ll-board-last.negative,.ll-board-match-change.negative{background:rgba(244,63,94,.10);border:1px solid rgba(244,63,94,.35)}.ll-board-last span,.ll-board-match-change span,.ll-board-match-change small{font-size:11px;color:#cbd5e1}.ll-board-dismissal{border-color:rgba(244,63,94,.7);box-shadow:0 0 28px rgba(244,63,94,.10)}.ll-board-danger{border-color:rgba(249,115,22,.58)}.ll-board-uneasy{border-color:rgba(250,204,21,.48)}.ll-board-strong{border-color:rgba(45,212,191,.62)}.ll-press-icon{font-size:56px;margin-bottom:6px}.ll-press-offer,.ll-press-success{max-width:650px;margin:18px auto 0;text-align:left;padding:16px;border:1px solid rgba(250,204,21,.46);border-radius:14px;background:linear-gradient(135deg,rgba(250,204,21,.12),rgba(30,41,59,.42))}.ll-press-offer b,.ll-press-offer span,.ll-press-success b,.ll-press-success span{display:block}.ll-press-offer span,.ll-press-success span{color:#cbd5e1;margin-top:5px}.ll-press-offer ul{margin:12px 0 0;padding-left:20px;color:#cbd5e1;font-size:12px}.ll-press-boost-badge{margin:13px 0;padding:11px 13px;border:1px solid rgba(250,204,21,.65);border-radius:11px;background:rgba(250,204,21,.10);text-align:left}.ll-press-boost-badge b,.ll-press-boost-badge span{display:block}.ll-press-boost-badge span{font-size:11px;color:#cbd5e1;margin-top:3px}.ll-board-meeting-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:18px;background:rgba(2,6,23,.84);backdrop-filter:blur(10px)}.ll-board-meeting{width:min(620px,100%);padding:25px;border:1px solid rgba(244,63,94,.68);border-radius:20px;background:radial-gradient(circle at 50% 0,rgba(244,63,94,.18),transparent 38%),#0f172a;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.55)}.ll-board-meeting-icon{font-size:58px}.ll-board-meeting h2{margin:7px 0}.ll-board-meeting p{color:#cbd5e1;line-height:1.55}.ll-profile-board-card{margin:14px 0}.ll-profile-board-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.ll-profile-board-grid>div{padding:12px;border-radius:11px;background:rgba(2,6,23,.35);text-align:center}.ll-profile-board-grid b,.ll-profile-board-grid span{display:block}.ll-profile-board-grid b{font-size:22px;color:#fde68a}.ll-profile-board-grid span{font-size:11px;color:#94a3b8;margin-top:3px}.ll-reputation-report{margin-top:14px}.ll-reputation-rows{display:grid;gap:6px;margin-top:10px}.ll-reputation-rows>div{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border-radius:9px;background:rgba(2,6,23,.34)}.ll-reputation-rows b.positive{color:#4ade80}.ll-reputation-rows b.negative{color:#fb7185}.ll-board-shop-note,.ll-board-market-note{margin:12px 0}@media(max-width:760px){.ll-board-grid{grid-template-columns:1fr}.ll-profile-board-grid{grid-template-columns:1fr}.ll-board-head{align-items:flex-start}.ll-board-head>strong{font-size:30px}}
`;document.head.appendChild(style);
}

function install(){
  injectStyles();
  wrap('llV2RepairState',base=>function(state){const result=base.apply(this,arguments);if(result){ensureProfile(result);ensureBoard(result);}return result;});
  installManagerEvaluate();installManagerBuildOffers();installEnsureMarket();installApplicationWrapper();installDepartureWrappers();
  installBeginMatch();installRollValue();installShopCost();installPremiumPack();
  wrap('llRenderDashboard',base=>function(){const state=stateNow();if(state)ensureBoard(state);const result=base.apply(this,arguments);injectBoardDashboard();return result;});
  wrap('llRenderSeasonOpening',base=>function(){const state=stateNow();if(state)ensureBoard(state);const result=base.apply(this,arguments);injectBoardOpening();return result;});
  wrap('llRenderSeasonEnd',base=>function(){const result=base.apply(this,arguments);injectBoardSeasonEnd();decorateSeasonEndReputation();return result;});
  wrap('llRenderMatch',base=>function(){const result=base.apply(this,arguments);decorateMatch();return result;});
  wrap('llRenderShop',base=>function(){const result=base.apply(this,arguments);decorateShop();return result;});
  wrap('llRenderManagerMarket',base=>function(){const result=base.apply(this,arguments);decorateManagerMarket();return result;});
  wrap('llRenderVacantManagerJobs',base=>function(){const market=stateNow()?.managerMarket;Object.keys(market?.applications||{}).forEach(adjustApplication);if(typeof globalThis.llSave==='function')llSave();return base.apply(this,arguments);});
  wrap('llShowVacantJobReport',base=>function(team){adjustApplication(team);if(typeof globalThis.llSave==='function')llSave();return base.apply(this,arguments);});
  wrap('llRenderManagerProfile',base=>function(){const result=base.apply(this,arguments);try{decorateProfile();}catch(error){console.error('[Hoca Profili] Yönetim özeti eklenemedi:',error);}return result;});
  wrap('llCommitCurrentMatch',base=>function(){
    const state=stateNow(),match=globalThis.lexLeague?.match,weekBefore=num(state?.week),already=match?.__boardConfidenceProcessed;
    const result=base.apply(this,arguments);
    if(state&&match&&!already&&!match.__boardConfidenceProcessed&&match.committed){
      match.__boardConfidenceProcessed=true;const entry=updateBoardAfterMatch(state,match,weekBefore);
      if(entry){if(typeof globalThis.llSave==='function')llSave();injectRoundConfidence(entry);const rule=dismissalRule(ensureProfile(state).reputation);if(entry.after<=rule.threshold&&ensureBoard(state).badStreak>=rule.badStreak)setTimeout(()=>showBoardMeeting(false),120);}
    }
    return result;
  });
  const initial=stateNow();if(initial){ensureProfile(initial);ensureBoard(initial);}
}
install();
})();