/* Lexicon League · WC / EURO Interactive Draw v1
   - WC: FIFA-style dark navy broadcast package, pale team rows, cyan/green neon accents.
   - EURO: royal-blue flat broadcast package, dark-blue pot headers, yellow POT titles.
   - Draw does NOT regenerate tournament groups. It reveals ONLY the managed national team's
     existing 3 group opponents through a pot-based ceremony; group/knockout logic stays untouched.
   - EURO uses the official EURO 2024 pot membership represented by this game's 24-team template.
   - WC uses the game's 48-team field and maps one team per group to each of four 12-team pots
     by group strength order. The managed team stays fixed in its 4-team group and exactly 3 opponents are revealed.
   - Before the first draw: 3 vocabulary questions, no dice.
*/
(function(global){
'use strict';

const VERSION=2;
const QUIZ_SIZE=3;
const TYPES=['wc','euro'];
const LABELS={wc:'Dünya Kupası',euro:'Avrupa Şampiyonası'};
const GROUP_LABEL={wc:'GROUP',euro:'GRUP'};
const EURO_POTS={
  1:['Germany','Portugal','France','Spain','Belgium','England'],
  2:['Hungary','Türkiye','Romania','Denmark','Albania','Austria'],
  3:['Netherlands','Scotland','Croatia','Slovenia','Slovakia','Czechia'],
  4:['Italy','Serbia','Switzerland','Poland','Ukraine','Georgia']
};
const THEME={
  wc:{
    bg:'linear-gradient(145deg,#020B22 0%,#04112D 52%,#061531 100%)',
    panel:'#08142F',row:'#C7CBE6',rowBorder:'#AEB4D3',rowText:'#0F172E',
    title:'#F8F8FA',muted:'#D9DEEE',accent:'#36DFFF',accent2:'#30F0A8',accent3:'#7757FF',gold:'#B8923F',
    group:'#142A74',group2:'#1A3480',button:'#16358A'
  },
  euro:{
    bg:'linear-gradient(145deg,#2348D9 0%,#1F49D8 55%,#173DBD 100%)',
    panel:'#214DDB',row:'rgba(20,61,190,.52)',rowBorder:'#4B73E8',rowText:'#F4F6FB',
    title:'#F4F6FB',muted:'#DCE3F7',accent:'#E9C43A',accent2:'#7EA0FF',accent3:'#10368E',gold:'#E9C43A',
    group:'#10368E',group2:'#163F9F',button:'#10368E'
  }
};

function stateNow(){return global.lexLeague?.state||null;}
function api(){return global.llNationalTournamentTestApi||null;}
function esc(v){return typeof global.llEscape==='function'?global.llEscape(v):String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
function deep(v){try{return JSON.parse(JSON.stringify(v));}catch(_){return v;}}
function save(){try{if(typeof global.llSave==='function')global.llSave();}catch(error){console.warn('[National Draw] save failed',error);}}
function logo(name,variant='table'){return typeof global.llTeamLogo==='function'?global.llTeamLogo(name,variant):`<span>${esc(name)}</span>`;}
function starsFor(name){return Math.max(1,Math.min(6,Number(api()?.teamRegistry?.[name]?.stars)||3));}
function groupsFor(type){return type==='wc'?(api()?.wcGroups||{}):(api()?.euroGroups||{});}
function activeRecord(type=null){const state=stateNow();const rec=api()?.activeNationalRecord?.(state)||null;return rec&&(!type||rec.type===type)?rec:null;}
function currentRecord(type){const state=stateNow();return api()?.nationalRecordForType?.(state,type)||null;}
function drawState(rec){
  if(!rec?.edition)return null;
  if(!rec.edition.drawCeremony||typeof rec.edition.drawCeremony!=='object')rec.edition.drawCeremony={version:VERSION,completed:false,quizDone:false,quizCorrect:0,quizTotal:0,prompted:false,completedAt:null};
  const d=rec.edition.drawCeremony;
  const previousVersion=Number(d.version)||1;
  /* Existing saves that already played a national group match must never be blocked by a newly-added ceremony. */
  const played=Number(rec.edition.groupRound||0)>0||Object.values(rec.edition.groupMatches||{}).some(matches=>(matches||[]).some(match=>match?.played));
  /* v1 revealed every team in the tournament. Before the first match, reopen that old draw once so
     the corrected v2 ceremony can reveal exactly the managed team's 3 group opponents. Keep an
     already-completed vocabulary warm-up so the user does not have to answer it twice. */
  if(previousVersion<VERSION&&!played){d.completed=false;d.completedAt=null;d.prompted=false;}
  d.version=VERSION;
  if(played&&!d.completed){d.completed=true;d.migratedFromPlayedTournament=true;d.completedAt=d.completedAt||new Date().toISOString();save();}
  return d;
}
function drawRequired(rec){const d=drawState(rec);return !!(rec?.status==='active'&&rec?.edition?.stage==='group'&&!rec?.edition?.completed&&!d?.completed);}

function wcPots(){
  const groups=groupsFor('wc'),pots={1:[],2:[],3:[],4:[]};
  Object.keys(groups).sort().forEach(group=>{
    const ranked=[...(groups[group]||[])].sort((a,b)=>starsFor(b)-starsFor(a)||String(a).localeCompare(String(b),'en'));
    ranked.forEach((team,index)=>pots[index+1].push(team));
  });
  return pots;
}
function potsFor(type){return type==='euro'?deep(EURO_POTS):wcPots();}
function teamPot(type,team){const pots=potsFor(type);for(const p of [1,2,3,4])if((pots[p]||[]).includes(team))return p;return 4;}
function groupOf(type,team){for(const [g,teams] of Object.entries(groupsFor(type)))if((teams||[]).includes(team))return g;return null;}
function managedTeamFor(type){
  const rec=activeRecord(type)||currentRecord(type);
  return rec?.selectedTeam||rec?.edition?.managedTeam||null;
}
function buildSequence(type,managedTeam=null){
  const team=managedTeam||managedTeamFor(type);
  const group=groupOf(type,team);
  const teams=group?(groupsFor(type)?.[group]||[]):[];
  if(!team||teams.length!==4||!teams.includes(team))return [];
  const opponents=teams.filter(name=>name!==team);
  if(opponents.length!==3)return [];
  return opponents.map(name=>({pot:teamPot(type,name),group,team:name})).sort((a,b)=>a.pot-b.pot||String(a.team).localeCompare(String(b.team),'en'));
}

function ensureStyles(){
  if(typeof document==='undefined'||document.getElementById('ll-national-draw-css'))return;
  if(!document.getElementById('ll-national-draw-font')){
    const link=document.createElement('link');link.id='ll-national-draw-font';link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Oswald:wght@600;700&display=swap';document.head.appendChild(link);
  }
  const style=document.createElement('style');style.id='ll-national-draw-css';style.textContent=`
    .ll-nd-root{font-family:'Barlow Condensed',sans-serif;color:#f8fafc;min-width:0}
    .ll-national-draw-modal-card{width:min(1180px,calc(100vw - 28px))!important;max-height:calc(100dvh - 24px)!important;padding:14px!important;background:#030917!important;border-color:rgba(255,255,255,.14)!important}
    .ll-nd-stage{border-radius:15px;overflow:hidden;position:relative;min-height:420px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
    .ll-nd-stage:before,.ll-nd-stage:after{content:'';position:absolute;pointer-events:none;opacity:.46}
    .ll-nd-stage.wc:before{left:-8%;right:-8%;bottom:10%;height:2px;background:linear-gradient(90deg,transparent,#36DFFF,#30F0A8,transparent);transform:rotate(-2deg);box-shadow:0 -62px 0 rgba(119,87,255,.5),0 -124px 0 rgba(54,223,255,.24)}
    .ll-nd-stage.wc:after{width:58%;height:260px;right:-12%;top:5%;border:2px solid rgba(54,223,255,.18);border-radius:50%;transform:rotate(-18deg)}
    .ll-nd-stage.euro:before{inset:0;background:linear-gradient(105deg,transparent 0 68%,rgba(255,255,255,.045) 68% 70%,transparent 70%),linear-gradient(15deg,transparent 0 82%,rgba(233,196,58,.07) 82% 84%,transparent 84%)}
    .ll-nd-head{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px 10px}
    .ll-nd-brand{display:flex;align-items:center;gap:12px;min-width:0}
    .ll-nd-trophy{font-size:42px;line-height:1;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}
    .ll-nd-kicker{font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:.84}
    .ll-nd-title{font-family:'Oswald','Barlow Condensed',sans-serif;font-size:30px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;line-height:1.04}
    .ll-nd-progress{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:right;opacity:.9}
    .ll-nd-layout{position:relative;z-index:2;display:grid;grid-template-columns:minmax(250px,320px) 1fr;gap:14px;padding:8px 16px 16px}
    .ll-nd-pot-panel{border-radius:12px;padding:14px;min-width:0}
    .ll-nd-pot-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px}
    .ll-nd-pot-label{font-family:'Oswald','Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    .ll-nd-stage.wc .ll-nd-pot-label{font-size:21px;color:#F8F8FA}.ll-nd-stage.euro .ll-nd-pot-label{font-size:22px;color:#E9C43A}
    .ll-nd-pot-number{font-family:'Oswald',sans-serif;font-weight:700;line-height:.8}.ll-nd-stage.wc .ll-nd-pot-number{font-size:72px;color:#F3F4F8}.ll-nd-stage.euro .ll-nd-pot-number{font-size:42px;color:#E9C43A}
    .ll-nd-pot-list{display:flex;flex-direction:column;gap:5px}
    .ll-nd-pot-team{display:flex;align-items:center;gap:8px;border-radius:7px;padding:6px 8px;min-height:31px;font-weight:700;letter-spacing:.55px;text-transform:uppercase;transition:transform .22s,opacity .22s,filter .22s}
    .ll-nd-pot-team .ll-national-logo-wrap,.ll-nd-pot-team .ll-team-logo-wrap{width:24px;height:24px;min-width:24px}.ll-nd-pot-team img,.ll-nd-pot-team .ll-team-logo-fallback{max-width:24px!important;max-height:24px!important}
    .ll-nd-pot-team.used{opacity:.28;filter:grayscale(.85)}
    .ll-nd-pot-team.current{transform:translateX(5px) scale(1.02);box-shadow:0 0 0 2px currentColor,0 8px 22px rgba(0,0,0,.25)}
    .ll-nd-stage.wc .ll-nd-pot-panel{background:rgba(8,20,47,.92);border:1px solid rgba(63,215,255,.12)}
    .ll-nd-stage.wc .ll-nd-pot-team{background:#C7CBE6;color:#0F172E;border:1px solid #AEB4D3}
    .ll-nd-stage.euro .ll-nd-pot-panel{background:rgba(32,77,219,.78);border:1px solid rgba(75,115,232,.8)}
    .ll-nd-stage.euro .ll-nd-pot-head{background:#10368E;margin:-14px -14px 10px;padding:12px 14px;border-radius:11px 11px 0 0}
    .ll-nd-stage.euro .ll-nd-pot-team{background:rgba(16,54,142,.38);color:#F4F6FB;border:1px solid rgba(75,115,232,.55)}
    .ll-nd-groups{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-content:start;min-width:0}
    .ll-nd-stage.wc .ll-nd-groups{grid-template-columns:repeat(4,minmax(0,1fr))}
    .ll-nd-group{border-radius:9px;overflow:hidden;background:rgba(2,11,34,.48);border:1px solid rgba(255,255,255,.1);min-width:0}
    .ll-nd-group-title{padding:7px 9px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;background:#142A72;color:#D9DEEE}
    .ll-nd-stage.euro .ll-nd-group-title{background:#10368E;color:#F4F6FB}
    .ll-nd-group-slots{display:flex;flex-direction:column;gap:1px;padding:5px}
    .ll-nd-group-slot{display:flex;align-items:center;gap:6px;min-height:29px;padding:4px 6px;border-radius:5px;font-size:13px;font-weight:700;min-width:0;background:rgba(255,255,255,.05);opacity:.35}
    .ll-nd-group-slot.revealed{opacity:1;animation:llNdTeamIn .34s ease-out}
    .ll-nd-group-slot.current{box-shadow:inset 0 0 0 1px rgba(54,223,255,.78)}
    .ll-nd-stage.euro .ll-nd-group-slot.current{box-shadow:inset 0 0 0 1px #E9C43A}
    .ll-nd-group-slot .ll-national-logo-wrap,.ll-nd-group-slot .ll-team-logo-wrap{width:21px;height:21px;min-width:21px}.ll-nd-group-slot img,.ll-nd-group-slot .ll-team-logo-fallback{max-width:21px!important;max-height:21px!important}
    .ll-nd-group-team{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @keyframes llNdTeamIn{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:none}}
    .ll-nd-current{position:relative;z-index:2;margin:0 16px 14px;padding:12px 14px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:12px;text-align:center;font-size:22px;font-weight:800;letter-spacing:1px;text-transform:uppercase;min-height:52px}
    .ll-nd-stage.wc .ll-nd-current{background:rgba(8,20,47,.88);border:1px solid rgba(54,223,255,.24)}.ll-nd-stage.euro .ll-nd-current{background:#10368E;border:1px solid rgba(233,196,58,.35)}
    .ll-nd-current .ll-national-logo-wrap,.ll-nd-current .ll-team-logo-wrap{width:34px;height:34px}.ll-nd-current img,.ll-nd-current .ll-team-logo-fallback{max-width:34px!important;max-height:34px!important}
    .ll-nd-actions{position:relative;z-index:2;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:0 16px 18px}
    .ll-nd-btn{border:0;border-radius:8px;color:white;padding:11px 20px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer}.ll-nd-btn:disabled{opacity:.5;cursor:default}.ll-nd-btn.secondary{background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.18)}
    .ll-nd-intro-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:0 16px 16px;position:relative;z-index:2}
    .ll-nd-intro-pot{border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
    .ll-nd-intro-pot h4{margin:0;padding:9px 10px;text-align:center;font-family:'Oswald',sans-serif;letter-spacing:1px;text-transform:uppercase}
    .ll-nd-stage.wc .ll-nd-intro-pot{background:#08142F}.ll-nd-stage.wc .ll-nd-intro-pot h4{color:#F8F8FA;background:#061126}.ll-nd-stage.euro .ll-nd-intro-pot{background:rgba(33,77,219,.75)}.ll-nd-stage.euro .ll-nd-intro-pot h4{background:#10368E;color:#E9C43A}
    .ll-nd-intro-pot-list{padding:8px;display:flex;flex-direction:column;gap:5px}.ll-nd-intro-pot .ll-nd-pot-team{font-size:13px}
    .ll-nd-quiz{position:relative;z-index:2;margin:4px 16px 16px;padding:18px;border-radius:12px;background:rgba(0,0,0,.19);border:1px solid rgba(255,255,255,.13);text-align:center}
    .ll-nd-q-progress{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;opacity:.85;margin-bottom:10px}.ll-nd-question{font-size:32px;font-weight:800;line-height:1.15}.ll-nd-answer{font-size:24px;font-weight:700;margin-top:14px;padding:11px;border-radius:9px;background:rgba(0,0,0,.2)}
    .ll-national-draw-entry{margin-top:14px;border:1px solid rgba(233,196,58,.34)!important;background:linear-gradient(100deg,rgba(15,23,42,.52),rgba(30,64,175,.2))!important}
    .ll-national-draw-entry .ll-card-title{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
    @media(max-width:900px){.ll-nd-layout{grid-template-columns:1fr}.ll-nd-pot-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.ll-nd-groups,.ll-nd-stage.wc .ll-nd-groups{grid-template-columns:repeat(3,minmax(0,1fr))}.ll-nd-intro-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:600px){.ll-national-draw-modal-card{width:calc(100vw - 12px)!important;padding:7px!important}.ll-nd-head{padding:14px 12px 8px}.ll-nd-title{font-size:23px}.ll-nd-trophy{font-size:34px}.ll-nd-layout{padding:6px 9px 12px}.ll-nd-groups,.ll-nd-stage.wc .ll-nd-groups{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.ll-nd-pot-list{grid-template-columns:1fr 1fr}.ll-nd-intro-grid{padding:0 9px 12px;gap:7px}.ll-nd-pot-team{font-size:12px;padding:5px}.ll-nd-group-slot{font-size:11px;padding:3px 4px}.ll-nd-current{margin:0 9px 10px;font-size:17px}.ll-nd-question{font-size:26px}}
  `;document.head.appendChild(style);
}

function showModal(html){
  if(typeof global.llShowModal!=='function')return;
  global.llShowModal(html);
  const card=document.querySelector('#ll-modal .ll-modal-card');if(card)card.classList.add('ll-national-draw-modal-card');
}
function themeStyle(type){return THEME[type]||THEME.wc;}
function titleHtml(type,sub='FINAL DRAW'){
  const year=currentRecord(type)?.year||activeRecord(type)?.year||'';
  return `<div class="ll-nd-head"><div class="ll-nd-brand"><div class="ll-nd-trophy">${type==='wc'?'🏆':'🏟️'}</div><div><div class="ll-nd-kicker">${type==='wc'?'FIFA WORLD CUP':'UEFA EURO'} ${esc(year)}</div><div class="ll-nd-title">${esc(sub)}</div></div></div><div class="ll-nd-progress" id="ll-nd-progress"></div></div>`;
}
function stageOpen(type,inner){const t=themeStyle(type);return `<div class="ll-nd-root"><div class="ll-nd-stage ${type}" style="background:${t.bg}">${inner}</div></div>`;}
function potItem(type,team,classes=''){return `<div class="ll-nd-pot-team ${classes}">${logo(team,'table')}<span>${esc(team)}</span></div>`;}

function selectWords(limit=QUIZ_SIZE){
  const all=typeof global.loadUserWords==='function'?global.loadUserWords():[];const words=(Array.isArray(all)?all:[]).filter(w=>String(w?.en||'').trim()&&String(w?.tr||'').trim());if(!words.length)return [];
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const priority=shuffle(words.filter(w=>w.isActiveMistake||Number(w.interval||0)<=1));const fresh=shuffle(words.filter(w=>Number(w.reviewCount||0)<3&&!priority.includes(w)));const rest=shuffle(words.filter(w=>!priority.includes(w)&&!fresh.includes(w)));const out=[],seen=new Set();
  for(const w of [...priority,...fresh,...rest]){const key=String(w.id||w.en);if(seen.has(key))continue;seen.add(key);out.push(deep(w));if(out.length>=limit)break;}return out;
}
function persistWord(ref,correct){
  try{const words=typeof global.loadUserWords==='function'?global.loadUserWords():[];if(!Array.isArray(words))return;const index=words.findIndex(w=>String(w?.id||'')===String(ref?.id||''));if(index<0)return;const w=words[index];w.reviewCount=(Number(w.reviewCount)||0)+1;if(!correct)w.wrongCount=(Number(w.wrongCount)||0)+1;
    if(typeof global.calculateSM2==='function'){if(correct){Object.assign(w,global.calculateSM2(w,4));w.state=Number(w.interval||0)>=20?'review':'due';w.isActiveMistake=false;}else{Object.assign(w,global.calculateSM2(w,2));w.interval=1;w.repetitions=0;w.state='due';w.isActiveMistake=true;if(typeof global.todayStr==='function')w.nextReview=global.todayStr();}}
    if(typeof global.saveWordsToStorage==='function')global.saveWordsToStorage(words);
  }catch(error){console.warn('[National Draw] vocabulary persist failed',error);}
}

function renderIntro(type){
  ensureStyles();const rec=activeRecord(type);if(!rec?.edition)return;const d=drawState(rec),pots=potsFor(type),t=themeStyle(type);
  const potCards=[1,2,3,4].map(p=>`<div class="ll-nd-intro-pot"><h4>POT ${p}</h4><div class="ll-nd-intro-pot-list">${(pots[p]||[]).map(team=>potItem(type,team)).join('')}</div></div>`).join('');
  const content=titleHtml(type,'FINAL DRAW')+`<div style="position:relative;z-index:2;padding:0 18px 13px;color:${t.muted};font-size:15px;line-height:1.45"><b style="color:${t.title}">${type==='wc'?'48 takım · 12 grup':'24 takım · 6 grup'}</b> · 4 pot · her grup 4 takım. <b style="color:${t.title}">Senin takımın + tam 3 rakip</b>. Kura başlamadan önce ${QUIZ_SIZE} kelimelik kısa tur var. Zar kullanılmaz; ardından yalnızca senin 3 grup rakibin kendi potlarından sırayla açılır.</div><div class="ll-nd-intro-grid">${potCards}</div><div class="ll-nd-actions">${d.completed?`<button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawReplay('${type}')">Kurayı Tekrar İzle</button><button class="ll-nd-btn secondary" onclick="llNationalDrawClose('${type}')">Turnuvaya Dön</button>`:d.quizDone?`<button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawEnter('${type}')">Kura Sahnesine Geç</button>`:`<button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawQuizStart('${type}')">Kelime Turunu Başlat</button>`}</div>`;
  showModal(stageOpen(type,content));
}

function renderQuiz(){
  ensureStyles();const q=global.llNationalDrawQuiz;if(!q)return;const type=q.type,t=themeStyle(type),item=q.queue[q.index];if(!item){renderQuizDone();return;}const w=item.word,question=item.askTrToEn?String(w.tr||'').split(',')[0].trim():w.en,answer=item.askTrToEn?w.en:w.tr;
  let example='';if(w.example){example=item.askTrToEn&&typeof global.llMaskAnswerInExample==='function'?global.llMaskAnswerInExample(w.example,w.en):w.example;}
  const qHtml=item.askTrToEn?esc(question):`<div class="pronounce-line" style="justify-content:center"><span>${typeof global.llEnglishWordHtml==='function'?global.llEnglishWordHtml(w,question):esc(question)}</span>${typeof global.llPronounceButton==='function'?global.llPronounceButton(w.en):''}</div>`;
  const aHtml=item.askTrToEn?`<div class="pronounce-line" style="justify-content:center"><span>${typeof global.llEnglishWordHtml==='function'?global.llEnglishWordHtml(w,answer):esc(answer)}</span>${typeof global.llPronounceButton==='function'?global.llPronounceButton(w.en):''}</div>`:esc(answer);
  const exHtml=example&&typeof global.llExampleSentenceHtml==='function'?global.llExampleSentenceHtml(w,example,`national-draw-${q.index}-${w.id||q.index}`):'';
  const content=titleHtml(type,'DRAW WARM-UP')+`<div class="ll-nd-quiz"><div class="ll-nd-q-progress">Kura Öncesi Kelime · ${q.index+1}/${q.queue.length}</div><div class="ll-position">${item.askTrToEn?'TÜRKÇE → İNGİLİZCE':'İNGİLİZCE → TÜRKÇE'}</div><div class="ll-nd-question">${qHtml}</div>${exHtml}${item.revealed?`<div class="ll-nd-answer">${aHtml}</div>${w.example?`<div style="margin-top:9px;font-size:13px;opacity:.9">“${esc(w.example)}”</div>`:''}`:`<div style="margin-top:16px;opacity:.76">Cevabı göster, sonra kendini değerlendir.</div>`}</div><div class="ll-nd-actions">${item.revealed?`<button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawQuizAnswer(true)">Doğru Bildim</button><button class="ll-nd-btn secondary" onclick="llNationalDrawQuizAnswer(false)">Yanlış Bildim</button>`:`<button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawQuizReveal()">Cevabı Göster</button>`}</div>`;
  showModal(stageOpen(type,content));
}
function renderQuizDone(){
  const q=global.llNationalDrawQuiz;if(!q)return;const rec=activeRecord(q.type),d=drawState(rec),t=themeStyle(q.type);d.quizDone=true;d.quizCorrect=q.correct;d.quizTotal=q.queue.length;save();
  const content=titleHtml(q.type,'DRAW READY')+`<div class="ll-nd-quiz"><div style="font-size:58px">🎱</div><div class="ll-nd-title" style="margin-top:7px">${q.correct}/${q.queue.length} DOĞRU</div><div style="margin-top:10px;opacity:.88">Kelime turu tamamlandı. Şimdi kendi takımın grupta sabit kalacak ve tam 3 grup rakibin potlardan sırayla açılacak.</div></div><div class="ll-nd-actions"><button class="ll-nd-btn" style="background:${t.button}" onclick="llNationalDrawEnter('${q.type}')">Kura Sahnesine Geç</button></div>`;
  showModal(stageOpen(q.type,content));
}

function revealedSet(session){return new Set(session.sequence.slice(0,session.revealed).map(x=>x.team));}
function groupSlotsHtml(session){
  const rec=activeRecord(session.type)||currentRecord(session.type),managed=rec?.selectedTeam||rec?.edition?.managedTeam||managedTeamFor(session.type),group=groupOf(session.type,managed),teams=group?(groupsFor(session.type)?.[group]||[]):[],revealed=revealedSet(session),current=session.revealed>0?session.sequence[session.revealed-1]:null;
  if(!group||teams.length!==4)return `<div class="ll-nd-group"><div class="ll-nd-group-title">GRUP BULUNAMADI</div></div>`;
  const ordered=[managed,...teams.filter(team=>team!==managed).sort((a,b)=>teamPot(session.type,a)-teamPot(session.type,b)||String(a).localeCompare(String(b),'en'))];
  return `<div class="ll-nd-group" style="grid-column:1/-1"><div class="ll-nd-group-title">${GROUP_LABEL[session.type]} ${group} · SENİN GRUBUN</div><div class="ll-nd-group-slots">${ordered.map(team=>{const isManaged=team===managed,isVisible=isManaged||revealed.has(team);return `<div class="ll-nd-group-slot ${isVisible?'revealed':''} ${current?.team===team?'current':''}">${isVisible?logo(team,'table'):''}<span class="ll-nd-group-team">${isVisible?esc(team):'—'}</span>${isManaged?'<span style="margin-left:auto;font-size:10px;letter-spacing:1px;opacity:.78">SEN</span>':''}</div>`;}).join('')}</div></div>`;
}
function renderDraw(){
  ensureStyles();const s=global.llNationalDraw;if(!s)return;const t=themeStyle(s.type),currentPot=s.sequence[Math.min(s.revealed,s.sequence.length-1)]?.pot||4,pots=potsFor(s.type),revealed=revealedSet(s),current=s.revealed>0?s.sequence[s.revealed-1]:null,done=s.revealed>=s.sequence.length;
  const potTeams=(pots[currentPot]||[]).map(team=>potItem(s.type,team,`${revealed.has(team)?'used':''} ${current?.team===team?'current':''}`)).join('');
  const currentHtml=current?`${logo(current.team,'match')}<span>${esc(current.team)} → ${GROUP_LABEL[s.type]} ${esc(current.group)}</span>`:`<span>${done?'KURA TAMAMLANDI':'POT 1 HAZIR'}</span>`;
  const content=titleHtml(s.type,'FINAL DRAW')+`<div style="position:relative;z-index:2;padding:0 18px 4px;color:${t.muted};font-size:14px">Doğrudan grup aşaması · kendi takımın + <b style="color:${t.title}">3 rakip</b> · toplam 3 grup maçı.</div><div class="ll-nd-layout"><div class="ll-nd-pot-panel"><div class="ll-nd-pot-head"><div class="ll-nd-pot-label">POT</div><div class="ll-nd-pot-number">${currentPot}</div></div><div class="ll-nd-pot-list">${potTeams}</div></div><div class="ll-nd-groups">${groupSlotsHtml(s)}</div></div><div class="ll-nd-current">${currentHtml}</div><div class="ll-nd-actions"><button class="ll-nd-btn" style="background:${t.button}" ${s.running||done?'disabled':''} onclick="llNationalDrawStart()">${s.running?'KURA ÇEKİLİYOR...':done?'3 RAKİP BELLİ OLDU':'3 RAKİBİ ÇEK'}</button>${done?`<button class="ll-nd-btn secondary" onclick="llNationalDrawClose('${s.type}')">Turnuvaya Devam Et</button>`:''}</div>`;
  showModal(stageOpen(s.type,content));
  const progress=document.getElementById('ll-nd-progress');if(progress)progress.textContent=done?`${s.sequence.length}/${s.sequence.length} · COMPLETE`:`${s.revealed}/${s.sequence.length} · POT ${currentPot}`;
  if(done){const rec=activeRecord(s.type),d=drawState(rec);if(d&&!d.completed){d.completed=true;d.completedAt=new Date().toISOString();save();}}
}

function injectEntry(){
  const state=stateNow();if(!state||typeof document==='undefined')return;const rec=api()?.activeNationalRecord?.(state);if(!rec?.edition||!TYPES.includes(rec.type))return;const root=document.querySelector(`[data-ll-national-theme="${rec.type}"] .ll-panel`);if(!root||root.querySelector('[data-national-draw-entry]'))return;const d=drawState(rec),status=d.completed?'Kura tamamlandı':'İlk maçtan önce tamamlanmalı';
  const card=document.createElement('div');card.className='ll-card ll-national-draw-entry';card.dataset.nationalDrawEntry='1';card.innerHTML=`<div class="ll-card-title"><span>🎱 ${esc(LABELS[rec.type])} Kura Çekimi</span><button class="ll-btn gold" data-national-draw-open>${d.completed?'Kurayı Tekrar Gör':'Kurayı Başlat'}</button></div><div class="ll-sub">${esc(status)} · ${rec.type==='wc'?'4 × 12 takımlı pot · 12 grup':'4 × 6 takımlı pot · 6 grup'} · <b>senin takımın + 3 rakip</b> · 3 grup maçı · kura öncesi ${QUIZ_SIZE} kelime · zar yok.</div>`;
  const statusBlock=root.querySelector('.ll-cup-status');if(statusBlock)statusBlock.insertAdjacentElement('afterend',card);else root.prepend(card);
  card.querySelector('[data-national-draw-open]')?.addEventListener('click',()=>renderIntro(rec.type));
  if(drawRequired(rec)){
    /* Kura tamamlanmadan sabit grupları veya ilk rakibi ekranda gösterme; aksi halde törenin sürprizi bozulur. */
    const groupsTitle=[...root.querySelectorAll('.ll-card-title')].find(node=>String(node.textContent||'').trim()==='Gruplar');
    const groupsCard=groupsTitle?.closest('.ll-card');if(groupsCard)groupsCard.style.display='none';
    const nextCard=root.querySelector('.ll-national-next');if(nextCard)nextCard.style.display='none';
    const matchButton=[...root.querySelectorAll('button')].find(btn=>String(btn.textContent||'').includes('10 Kelimelik Milli Maça Başla'));
    if(matchButton){matchButton.textContent='🎱 Önce Kura Çekimini Tamamla';matchButton.onclick=()=>renderIntro(rec.type);}
  }
}
function maybeAutoPrompt(){
  const rec=api()?.activeNationalRecord?.(stateNow());if(!drawRequired(rec))return;const d=drawState(rec);if(d.prompted)return;d.prompted=true;save();setTimeout(()=>renderIntro(rec.type),80);
}
function afterNationalRender(){injectEntry();maybeAutoPrompt();}

/* Public actions */
global.llNationalDrawOpen=function(type){type=TYPES.includes(type)?type:(activeRecord()?.type||'wc');const rec=activeRecord(type);if(!rec?.edition){if(typeof global.alert==='function')global.alert('Aktif milli turnuva bulunamadı.');return;}renderIntro(type);};
global.llNationalDrawQuizStart=function(type){const rec=activeRecord(type);if(!rec)return;const words=selectWords(QUIZ_SIZE);if(!words.length){const d=drawState(rec);d.quizDone=true;d.quizCorrect=0;d.quizTotal=0;save();global.llNationalDrawEnter(type);return;}global.llNationalDrawQuiz={type,queue:words.map((word,index)=>({word,revealed:false,askTrToEn:index%2===0})),index:0,correct:0};renderQuiz();};
global.llNationalDrawQuizReveal=function(){const q=global.llNationalDrawQuiz;if(!q)return;q.queue[q.index].revealed=true;renderQuiz();};
global.llNationalDrawQuizAnswer=function(correct){const q=global.llNationalDrawQuiz;if(!q)return;const item=q.queue[q.index];persistWord(item.word,!!correct);if(correct)q.correct++;q.index++;if(q.index>=q.queue.length)renderQuizDone();else renderQuiz();};
global.llNationalDrawEnter=function(type){const rec=activeRecord(type);if(!rec)return;const sequence=buildSequence(type,rec.selectedTeam);if(sequence.length!==3){if(typeof global.alert==='function')global.alert('Milli kura grubu geçersiz: tam 3 rakip bulunamadı.');return;}global.llNationalDrawQuiz=null;global.llNationalDraw={type,sequence,revealed:0,running:false};renderDraw();};
global.llNationalDrawReplay=function(type){const rec=activeRecord(type)||currentRecord(type);const sequence=buildSequence(type,rec?.selectedTeam);if(sequence.length!==3){if(typeof global.alert==='function')global.alert('Milli kura grubu geçersiz: tam 3 rakip bulunamadı.');return;}global.llNationalDraw={type,sequence,revealed:0,running:false,replay:true};renderDraw();};
global.llNationalDrawStart=function(){const s=global.llNationalDraw;if(!s||s.running||s.revealed>=s.sequence.length)return;s.running=true;renderDraw();const delay=s.type==='wc'?390:520;const tick=()=>{s.revealed++;const done=s.revealed>=s.sequence.length;if(done)s.running=false;renderDraw();if(!done)setTimeout(tick,delay);};setTimeout(tick,420);};
global.llNationalDrawClose=function(type){try{if(typeof global.llCloseModal==='function')global.llCloseModal();}catch(_){}if(typeof global.llRenderNationalTournaments==='function')global.llRenderNationalTournaments(type);};

/* Integrate without altering the tournament engine's group generation. */
const BASE_NATIONAL_RENDER=global.llRenderNationalTournaments;
if(typeof BASE_NATIONAL_RENDER==='function')global.llRenderNationalTournaments=function(){const result=BASE_NATIONAL_RENDER.apply(this,arguments);afterNationalRender();return result;};
const BASE_DASH=global.llRenderDashboard;
if(typeof BASE_DASH==='function')global.llRenderDashboard=function(){const result=BASE_DASH.apply(this,arguments);afterNationalRender();return result;};
const BASE_START_PREP=global.llStartMatchPreparation;
if(typeof BASE_START_PREP==='function')global.llStartMatchPreparation=function(){const state=stateNow(),fx=state?.pendingFixture,rec=api()?.activeNationalRecord?.(state);if(fx?.nationalTournament&&drawRequired(rec)){renderIntro(rec.type);return;}return BASE_START_PREP.apply(this,arguments);};

/* Debug helpers for regression tests. */
global.llNationalDrawTestApi={VERSION,EURO_POTS,wcPots,potsFor,teamPot,groupOf,buildSequence,drawRequired,drawState};

ensureStyles();setTimeout(afterNationalRender,0);
})(globalThis);
