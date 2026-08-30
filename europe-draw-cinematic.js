/* Europe Draw Cinematic v4
   - Kullanıcının yüklediği cinematic draw akışı baz alınmıştır.
   - Kura öncesi kısa kelime turu eklendi (zar yok).
   - Katılımcı 36 takım özeti ve kendi takımının altta sabit şeritte görünmesi korunur.
   - Rakipler motorun gerçek fikstüründen sırayla, animasyonla açılır.
   - UCL/UEL 8 rakip (4H/4A), UECL 6 rakip (3H/3A). */
(()=>{
  if(typeof window==='undefined')return;

  const LABELS={ucl:'Şampiyonlar Ligi',uel:'Avrupa Ligi',uecl:'Konferans Ligi'};
  const CONFIG={
    ucl:{drawCount:8,home:4,away:4},
    uel:{drawCount:8,home:4,away:4},
    uecl:{drawCount:6,home:3,away:3}
  };
  const THEME={
    ucl:{
      panel:'linear-gradient(135deg,#111CA4 0%,#0C178E 55%,#061163 100%)',
      soft:'linear-gradient(180deg,rgba(11,29,141,.96),rgba(4,11,69,.96))',
      home:'#0D3BFD',away:'#001E5D',
      accent:['#D8B858','#6C0BC8','#A42CF2'],
      bottom:'linear-gradient(90deg,#0E0089,#1A00B8)',
      btn:'#0D3BFD'
    },
    uel:{
      panel:'linear-gradient(135deg,#8a3d00 0%,#5c2600 55%,#1b0d00 100%)',
      soft:'linear-gradient(180deg,rgba(92,38,0,.96),rgba(25,11,0,.96))',
      home:'#FF7A00',away:'#2A1000',
      accent:['#D8B858','#B8330B','#FF6A00'],
      bottom:'linear-gradient(90deg,#5c1e00,#8a3d00)',
      btn:'#FF7A00'
    },
    uecl:{
      panel:'linear-gradient(135deg,#0B6B3F 0%,#074A2B 55%,#031B10 100%)',
      soft:'linear-gradient(180deg,rgba(7,74,43,.96),rgba(2,27,16,.96))',
      home:'#00D97E',away:'#012B1A',
      accent:['#D8B858','#0B8A4F','#00D97E'],
      bottom:'linear-gradient(90deg,#053D24,#0B6B3F)',
      btn:'#00D97E'
    }
  };

  function escapeHtml(v){return typeof llEscape==='function'?llEscape(v):String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
  function area(){return typeof llArea==='function'?llArea():document.getElementById('flashcard-area');}
  function normalizeType(type){return ['ucl','uel','uecl'].includes(type)?type:(window.lexLeague?.state?.europe?.type||'ucl');}
  function getState(){return window.lexLeague?.state||null;}
  function deepClone(v){try{return JSON.parse(JSON.stringify(v));}catch{return v;}}

  function ensureStyle(){
    if(document.getElementById('ll-draw-style-v4'))return;
    if(!document.getElementById('ll-draw-font-link')){
      const link=document.createElement('link');
      link.id='ll-draw-font-link';link.rel='stylesheet';
      link.href='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&display=swap';
      document.head.appendChild(link);
    }
    const style=document.createElement('style');
    style.id='ll-draw-style-v4';
    style.textContent=`
      .ll-draw-shell{font-family:'Barlow Condensed',sans-serif;color:#fff}
      .ll-draw-card{border-radius:12px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.55);margin:10px 0;font-family:'Barlow Condensed',sans-serif}
      .ll-draw-intro{padding:16px 16px 14px;border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.35)}
      .ll-draw-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 14px}
      .ll-draw-metric{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px 8px;text-align:center}
      .ll-draw-metric strong{display:block;font-size:26px;letter-spacing:1px}
      .ll-draw-metric span{display:block;font-size:12px;opacity:.86;letter-spacing:1px;text-transform:uppercase}
      .ll-draw-pool{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px;max-height:290px;overflow:auto}
      .ll-draw-pool-title{font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
      .ll-draw-pool-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .ll-draw-pool-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.14);font-size:16px;letter-spacing:.8px}
      .ll-draw-pool-item .ll-team-logo-wrap img,.ll-draw-pool-item .ll-team-logo-fallback{width:26px;height:26px}
      .ll-draw-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
      .ll-draw-note{font-size:14px;line-height:1.45;opacity:.95;text-align:left}
      .ll-draw-note b{color:#fff}
      .ll-draw-quiz{padding:14px 16px 16px;border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.35)}
      .ll-draw-progress{font-size:15px;letter-spacing:1px;text-transform:uppercase;opacity:.9;text-align:center;margin-bottom:10px}
      .ll-draw-question{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:16px;text-align:center}
      .ll-draw-question .ll-position{font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:.82;margin-bottom:8px}
      .ll-draw-question .ll-question-word{font-size:32px;font-weight:800;line-height:1.15;margin:8px 0 10px}
      .ll-draw-question .ll-answer{margin-top:16px;background:rgba(0,0,0,.18);padding:12px;border-radius:10px;font-size:23px;font-weight:700}
      .ll-draw-question .ll-answer-example{margin-top:10px;font-size:13px;opacity:.95;line-height:1.45}
      .ll-draw-question .word-ex,.ll-draw-question .quiz-example{margin-top:10px}
      .ll-draw-row{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);min-height:22px}
      .ll-draw-row:last-child{border-bottom:none}
      .ll-draw-row .ll-team-logo-wrap{opacity:0;transition:opacity .3s}
      .ll-draw-row .ll-team-logo-wrap img,.ll-draw-row .ll-team-logo-fallback{width:32px;height:32px}
      .ll-draw-row.is-revealed .ll-team-logo-wrap{opacity:1}
      .ll-draw-nm{flex:1;font-size:23px;font-weight:600;letter-spacing:1.5px;color:#F8F9FF;text-transform:uppercase;opacity:0;transition:opacity .3s}
      .ll-draw-row.is-revealed .ll-draw-nm{opacity:1}
      .ll-draw-tag{width:36px;height:25px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;letter-spacing:1px;opacity:0;transition:opacity .3s}
      .ll-draw-row.is-revealed .ll-draw-tag{opacity:1}
      .ll-draw-row.is-current{animation:llPotRowIn .45s ease-out}
      @keyframes llPotRowIn{from{transform:translateY(-6px);opacity:0}to{transform:translateY(0);opacity:1}}
      .ll-draw-accentline{height:3px;width:100%;display:flex}
      .ll-draw-bottom{padding:11px 0;text-align:center;font-family:'Barlow Condensed',sans-serif}
      .ll-draw-bottom-nm{font-size:24px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F8F9FF;display:flex;align-items:center;justify-content:center;gap:10px}
      .ll-draw-bottom-nm .ll-team-logo-wrap img,.ll-draw-bottom-nm .ll-team-logo-fallback{width:28px;height:28px}
      .ll-draw-actions-inline{display:flex;justify-content:center;margin-top:14px;gap:10px;flex-wrap:wrap}
      .ll-draw-btn{padding:12px 24px;border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:17px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;color:#fff}
      .ll-draw-btn.secondary{background:rgba(255,255,255,.14)!important;border:1px solid rgba(255,255,255,.18)}
      .ll-draw-btn:disabled{opacity:.5;cursor:default}
      .ll-draw-done{text-align:center;margin-top:8px;font-size:12.5px;opacity:.8;color:#fff}
      @media (max-width:700px){
        .ll-draw-metrics{grid-template-columns:1fr}
        .ll-draw-pool-grid{grid-template-columns:1fr}
        .ll-draw-question .ll-question-word{font-size:26px}
        .ll-draw-row{padding:10px 12px;gap:10px}
        .ll-draw-nm{font-size:19px;letter-spacing:1px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMetaStore(state){
    if(!state)return {};
    if(!state.europeDrawState || typeof state.europeDrawState!=='object')state.europeDrawState={};
    const key=String(state.season||1);
    if(!state.europeDrawState[key] || typeof state.europeDrawState[key]!=='object')state.europeDrawState[key]={};
    return state.europeDrawState[key];
  }
  function getMeta(type){
    const state=getState();
    const bucket=ensureMetaStore(state);
    if(!bucket[type] || typeof bucket[type]!=='object')bucket[type]={completed:false,quizDone:false,quizCorrect:0,quizTotal:0,completedAt:null};
    return bucket[type];
  }
  function patchMeta(type,patch){
    const state=getState();
    if(!state)return;
    const bucket=ensureMetaStore(state);
    bucket[type]={...(bucket[type]||{}),...patch};
    try{if(typeof llSave==='function')llSave();}catch(error){console.warn('Europe draw save failed',error);}
  }

  function competitionTeamsFor(type){
    const state=getState();
    const tables=typeof llV2EnsureEuropeStandings==='function'?llV2EnsureEuropeStandings(state):state?.europeStandings;
    const teams=[...(tables?.[type]?.teams||[])];
    return teams;
  }
  function playerOpponentsFor(type){
    const state=getState();
    const tables=typeof llV2EnsureEuropeStandings==='function'?llV2EnsureEuropeStandings(state):state?.europeStandings;
    const table=tables?.[type];
    const player=state?.playerTeam;
    const rounds=Array.isArray(table?.fixtures)?table.fixtures:[];
    const list=[];
    rounds.forEach(round=>{
      (round||[]).forEach(fixture=>{
        if(fixture.home===player)list.push({opponent:fixture.away,home:true});
        else if(fixture.away===player)list.push({opponent:fixture.home,home:false});
      });
    });
    return list;
  }

  function shuffle(list){
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }
  function selectQuizWords(limit=3){
    const all=typeof loadUserWords==='function'?loadUserWords():[];
    const words=(Array.isArray(all)?all:[]).filter(word=>String(word?.en||'').trim()&&String(word?.tr||'').trim());
    if(!words.length)return [];
    const urgent=shuffle(words.filter(word=>word.isActiveMistake || Number(word.interval||0)<=1));
    const fresh=shuffle(words.filter(word=>Number(word.reviewCount||0)<3 && !word.isActiveMistake));
    const regular=shuffle(words.filter(word=>!urgent.includes(word) && !fresh.includes(word)));
    const merged=[...urgent,...fresh,...regular];
    const seen=new Set();
    const out=[];
    for(const word of merged){
      const key=String(word.id||word.en||Math.random());
      if(seen.has(key))continue;
      seen.add(key);
      out.push(deepClone(word));
      if(out.length>=limit)break;
    }
    return out;
  }
  function applyWordResult(refWord,correct){
    try{
      const words=typeof loadUserWords==='function'?loadUserWords():[];
      if(!Array.isArray(words))return;
      const idx=words.findIndex(word=>String(word?.id||'')===String(refWord?.id||''));
      if(idx<0)return;
      const word=words[idx];
      word.reviewCount=(Number(word.reviewCount)||0)+1;
      if(!correct)word.wrongCount=(Number(word.wrongCount)||0)+1;
      if(typeof calculateSM2==='function'){
        if(correct){
          Object.assign(word,calculateSM2(word,4));
          word.state=Number(word.interval||0)>=20?'review':'due';
          word.isActiveMistake=false;
        }else{
          const update=calculateSM2(word,2);
          Object.assign(word,update);
          word.interval=1;
          word.repetitions=0;
          word.state='due';
          word.isActiveMistake=true;
          if(typeof todayStr==='function')word.nextReview=todayStr();
        }
      }
      if(typeof saveWordsToStorage==='function')saveWordsToStorage(words);
    }catch(error){console.warn('Europe draw quiz word persist failed',error);}
  }

  function competitionNotice(type){
    const cfg=CONFIG[type]||CONFIG.ucl;
    return `36 takımlı lig aşaması: <b>${cfg.drawCount} farklı rakip</b> · <b>${cfg.home} iç saha / ${cfg.away} deplasman</b>. Kura öncesinde kısa bir kelime turu var; zar yok, sadece öğrenme ve açılış hissi.`;
  }
  function competitionSummaryText(type){
    const cfg=CONFIG[type]||CONFIG.ucl;
    return `${cfg.drawCount} rakip adım adım seçilecek. Kendi takımın en altta sabit şeritte kalır.`;
  }
  function modal(html){ if(typeof llShowModal==='function') llShowModal(html); }
  function logoHtml(name,size='table'){ return typeof llTeamLogo==='function'?llTeamLogo(name,size):`<span>${escapeHtml(name)}</span>`; }
  function pronounceBtn(en,small=false){ return typeof llPronounceButton==='function'?llPronounceButton(en,small):''; }
  function englishHtml(word,text){ return typeof llEnglishWordHtml==='function'?llEnglishWordHtml(word,text):escapeHtml(text||word?.en||''); }
  function exampleHtml(word,example,token,compact=false){ return typeof llExampleSentenceHtml==='function'?llExampleSentenceHtml(word,example,token,compact):''; }

  function renderIntro(type,replay=false){
    ensureStyle();
    const theme=THEME[type]||THEME.ucl;
    const label=LABELS[type]||type.toUpperCase();
    const cfg=CONFIG[type]||CONFIG.ucl;
    const entrants=competitionTeamsFor(type);
    const state=getState();
    const player=state?.playerTeam||'';
    const meta=getMeta(type);
    const entrantsHtml=entrants.map(team=>`<div class="ll-draw-pool-item">${logoHtml(team,'table')}<div>${escapeHtml(team)}</div></div>`).join('');
    const doneNotice=meta.completed?`<div class="ll-draw-note" style="margin-top:10px"><b>Kura daha önce izlendi.</b> İstersen aşağıdan animasyonu tekrar oynatabilir veya doğrudan kura özetini görebilirsin.</div>`:'';
    const html=`
      <div class="ll-draw-shell">
        <div class="ll-rarity">${label.toUpperCase()} KURASI</div>
        <div class="quiz-start-title" style="font-size:26px;margin:4px 0 10px">🎱 İnteraktif <em>Kura Çekimi</em></div>
        <div class="ll-draw-intro" style="background:${theme.soft}">
          <div class="ll-draw-note">${competitionNotice(type)}</div>
          <div class="ll-draw-metrics">
            <div class="ll-draw-metric"><strong>36</strong><span>Katılımcı Takım</span></div>
            <div class="ll-draw-metric"><strong>${cfg.drawCount}</strong><span>Rakip Sayısı</span></div>
            <div class="ll-draw-metric"><strong>${cfg.home}/${cfg.away}</strong><span>İç Saha / Deplasman</span></div>
          </div>
          <div class="ll-draw-pool">
            <div class="ll-draw-pool-title">Turnuvadaki Takımlar</div>
            <div class="ll-draw-pool-grid">${entrantsHtml}</div>
          </div>
          <div class="ll-draw-card" style="background:${theme.panel};margin-top:12px">
            <div class="ll-draw-accentline"><div style="flex:0 0 15%;background:${theme.accent[0]}"></div><div style="flex:1;background:linear-gradient(90deg,${theme.accent[1]},${theme.accent[2]})"></div></div>
            <div class="ll-draw-bottom" style="background:${theme.bottom}"><div class="ll-draw-bottom-nm">${logoHtml(player,'table')}${escapeHtml(player)}</div></div>
          </div>
          <div class="ll-draw-note" style="margin-top:12px">${competitionSummaryText(type)}</div>
          ${doneNotice}
          <div class="ll-draw-actions">
            ${meta.completed
              ? `<button class="ll-draw-btn" style="background:${theme.btn}" onclick="llEuropeDrawReplay('${type}')">Animasyonu Tekrar Oynat</button><button class="ll-draw-btn secondary" onclick="llEuropeDrawOpenSummary('${type}')">Kura Özeti</button>`
              : `<button class="ll-draw-btn" style="background:${theme.btn}" onclick="llEuropeDrawStartQuiz('${type}')">Kelime Turuyla Devam Et</button>`}
          </div>
        </div>
      </div>`;
    modal(html);
  }

  function buildQuestionState(type){
    const queue=selectQuizWords(3).map((word,index)=>({
      ref:word,
      askTrToEn:index%2===0,
      revealed:false
    }));
    return {type,queue,index:0,correct:0};
  }

  function renderQuiz(){
    ensureStyle();
    const session=window.llEuropeDrawQuiz;
    if(!session)return;
    const theme=THEME[session.type]||THEME.ucl;
    const label=LABELS[session.type]||session.type.toUpperCase();
    const item=session.queue[session.index];
    if(!item){renderQuizSummary();return;}
    const word=item.ref;
    const question=item.askTrToEn?String(word.tr||'').split(',')[0].trim():word.en;
    const answer=item.askTrToEn?word.en:word.tr;
    let example='';
    if(String(word.example||'').trim()){
      example=item.askTrToEn&&typeof llMaskAnswerInExample==='function'?llMaskAnswerInExample(word.example,word.en):word.example;
    }
    const qHtml=item.askTrToEn?escapeHtml(question):`<div class="pronounce-line"><span>${englishHtml(word,question)}</span>${pronounceBtn(word.en)}</div>`;
    const aHtml=item.askTrToEn?`<div class="pronounce-line"><span>${englishHtml(word,answer)}</span>${pronounceBtn(word.en)}</div>`:escapeHtml(answer);
    const answerExample=item.revealed&&String(word.example||'').trim()?`<div class="ll-draw-question ll-draw-answer-example"></div>`:'';
    const exHtml=example?exampleHtml(word,example,`euro-draw-${session.index}-${word.id||session.index}`):'';
    const fullExample=item.revealed&&String(word.example||'').trim()?`<div class="ll-draw-question ll-answer-example"><span style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8;margin-bottom:4px">Cümle içinde</span>“${escapeHtml(word.example)}”</div>`:'';
    const html=`
      <div class="ll-draw-shell">
        <div class="ll-rarity">${label.toUpperCase()} KURASI</div>
        <div class="quiz-start-title" style="font-size:25px;margin:4px 0 10px">📚 Kura Öncesi <em>Kelime Turu</em></div>
        <div class="ll-draw-quiz" style="background:${theme.soft}">
          <div class="ll-draw-progress">Soru ${session.index+1} / ${session.queue.length}</div>
          <div class="ll-draw-question">
            <div class="ll-position">${item.askTrToEn?'Türkçe → İngilizce':'İngilizce → Türkçe'}</div>
            <div class="ll-question-word">${qHtml}</div>
            ${exHtml}
            ${item.revealed?`<div class="ll-answer">${aHtml}</div>${fullExample}`:`<div class="ll-muted" style="margin-top:14px">Önce cevabı göster, sonra kendini değerlendir.</div>`}
          </div>
          <div class="ll-draw-actions">
            ${item.revealed
              ? `<button class="ll-draw-btn" style="background:${theme.btn}" onclick="llEuropeDrawAnswer(true)">Doğru Bildim</button><button class="ll-draw-btn secondary" onclick="llEuropeDrawAnswer(false)">Yanlış Bildim</button>`
              : `<button class="ll-draw-btn" style="background:${theme.btn}" onclick="llEuropeDrawReveal()">Cevabı Göster</button>`}
            <button class="ll-draw-btn secondary" onclick="llEuropeDrawCancelQuiz()">Geri</button>
          </div>
        </div>
      </div>`;
    modal(html);
  }

  function renderQuizSummary(){
    const session=window.llEuropeDrawQuiz;
    if(!session)return;
    const theme=THEME[session.type]||THEME.ucl;
    const label=LABELS[session.type]||session.type.toUpperCase();
    patchMeta(session.type,{quizDone:true,quizCorrect:session.correct,quizTotal:session.queue.length});
    const html=`
      <div class="ll-draw-shell">
        <div class="ll-rarity">${label.toUpperCase()} KURASI</div>
        <div class="quiz-start-title" style="font-size:25px;margin:4px 0 10px">✅ Kelime Turu <em>Tamamlandı</em></div>
        <div class="ll-draw-quiz" style="background:${theme.soft};text-align:center">
          <div style="font-size:54px">🎱</div>
          <div class="quiz-start-title" style="margin-top:4px">${session.correct}/${session.queue.length} <em>Doğru</em></div>
          <div class="ll-draw-note" style="text-align:center;margin-top:10px">Zar yok. Şimdi gerçek fikstürdeki rakiplerin sırayla animasyonla açılacak.</div>
          <div class="ll-draw-actions"><button class="ll-draw-btn" style="background:${theme.btn}" onclick="llEuropeDrawEnter('${session.type}')">Kura Sahnesine Geç</button></div>
        </div>
      </div>`;
    modal(html);
  }

  function renderDrawCard(replay=false){
    const draw=window.llEuropeDraw;
    if(!draw)return;
    const theme=THEME[draw.type]||THEME.ucl;
    const label=LABELS[draw.type]||draw.type;
    const total=draw.order.length;
    const done=draw.revealed>=total;
    const rowsHtml=draw.order.map((item,i)=>{
      const isRevealed=i<draw.revealed;
      const isCurrent=i===draw.revealed-1;
      const tagColor=item.home?theme.home:theme.away;
      return `<div class="ll-draw-row ${isRevealed?'is-revealed':''} ${isCurrent?'is-current':''}">${logoHtml(item.opponent,'table')}<div class="ll-draw-nm">${escapeHtml(item.opponent)}</div><div class="ll-draw-tag" style="background:${tagColor}">${item.home?'H':'A'}</div></div>`;
    }).join('');
    const player=getState()?.playerTeam||'';
    const html=`
      <div class="ll-draw-shell">
        <div class="ll-rarity">${label.toUpperCase()} KURASI</div>
        <div class="quiz-start-title" style="font-size:24px;margin:4px 0 10px">🎱 Kura <em>Çekimi</em></div>
        <div class="ll-draw-card" style="background:${theme.panel}">
          <div class="ll-pot-rows">${rowsHtml}</div>
          <div class="ll-draw-accentline">
            <div style="flex:0 0 15%;background:${theme.accent[0]}"></div>
            <div style="flex:1;background:linear-gradient(90deg,${theme.accent[1]},${theme.accent[2]})"></div>
          </div>
          <div class="ll-draw-bottom" style="background:${theme.bottom}"><div class="ll-draw-bottom-nm">${logoHtml(player,'table')}${escapeHtml(player)}</div></div>
        </div>
        <div class="ll-draw-actions-inline">
          <button class="ll-draw-btn" style="background:${theme.btn}" ${draw.running||done?'disabled':''} onclick="llEuropeDrawStart()">${draw.running?'Kura Çekiliyor...':done?'Kura Tamamlandı':'Kurayı Çek'}</button>
          ${done?`<button class="ll-draw-btn secondary" onclick="llEuropeDrawCloseToEurope('${draw.type}')">Avrupa Merkezine Dön</button>`:''}
        </div>
        <div class="ll-draw-done">${done?`Toplam ${total} rakibin belli oldu. İyi şanslar! ⚽`:`Rakipler sırayla isim + logo + iç saha/deplasman rozetiyle açılacak.`}</div>
      </div>`;
    modal(html);
    if(done)patchMeta(draw.type,{completed:true,completedAt:new Date().toISOString()});
  }

  window.llEuropeDrawOpen=function(type){
    type=normalizeType(type);
    const order=playerOpponentsFor(type);
    if(!order.length){ alert('Bu turnuva için fikstür henüz oluşturulmadı.'); return; }
    renderIntro(type);
  };
  window.llShowEuropeDraw=window.llEuropeDrawOpen;

  window.llEuropeDrawStartQuiz=function(type){
    type=normalizeType(type);
    const queue=selectQuizWords(3);
    if(!queue.length){
      window.llEuropeDrawQuiz=null;
      window.llEuropeDrawEnter(type);
      return;
    }
    window.llEuropeDrawQuiz=buildQuestionState(type);
    renderQuiz();
  };
  window.llEuropeDrawCancelQuiz=function(){
    const session=window.llEuropeDrawQuiz;
    if(!session)return;
    renderIntro(session.type);
  };
  window.llEuropeDrawReveal=function(){
    const session=window.llEuropeDrawQuiz;
    if(!session)return;
    const item=session.queue[session.index];
    if(!item)return;
    item.revealed=true;
    renderQuiz();
  };
  window.llEuropeDrawAnswer=function(correct){
    const session=window.llEuropeDrawQuiz;
    if(!session)return;
    const item=session.queue[session.index];
    if(!item)return;
    applyWordResult(item.ref,!!correct);
    if(correct)session.correct++;
    session.index++;
    if(session.index>=session.queue.length){renderQuizSummary();return;}
    renderQuiz();
  };
  window.llEuropeDrawEnter=function(type){
    type=normalizeType(type);
    const order=playerOpponentsFor(type);
    if(!order.length){ alert('Bu turnuva için fikstür henüz oluşturulmadı.'); return; }
    window.llEuropeDrawQuiz=null;
    window.llEuropeDraw={type,order,revealed:0,running:false};
    renderDrawCard();
  };
  window.llEuropeDrawOpenSummary=function(type){
    type=normalizeType(type);
    const order=playerOpponentsFor(type);
    if(!order.length){ alert('Bu turnuva için fikstür henüz oluşturulmadı.'); return; }
    window.llEuropeDraw={type,order,revealed:order.length,running:false};
    renderDrawCard();
  };
  window.llEuropeDrawReplay=function(type){
    type=normalizeType(type);
    const order=playerOpponentsFor(type);
    if(!order.length){ alert('Bu turnuva için fikstür henüz oluşturulmadı.'); return; }
    window.llEuropeDraw={type,order,revealed:0,running:false};
    renderDrawCard(true);
  };
  window.llEuropeDrawStart=function(){
    const draw=window.llEuropeDraw;
    if(!draw||draw.running||draw.revealed>=draw.order.length)return;
    draw.running=true;
    renderDrawCard();
    const step=()=>{
      draw.revealed++;
      const finished=draw.revealed>=draw.order.length;
      if(finished)draw.running=false;
      renderDrawCard();
      if(!finished)setTimeout(step,650);
    };
    setTimeout(step,350);
  };
  window.llEuropeDrawCloseToEurope=function(type){
    if(typeof llCloseModal==='function')try{llCloseModal();}catch{}
    if(typeof llRenderCompetitionCenter==='function')llRenderCompetitionCenter('europe',normalizeType(type));
  };

  if(typeof llRenderCompetitionCenter==='function'){
    const base=llRenderCompetitionCenter;
    window.llRenderCompetitionCenter=function(tab='league',key=null){
      base(tab,key);
      if(tab!=='europe')return;
      const state=getState();
      const type=normalizeType(key);
      if(state?.europe?.type!==type)return;
      if(!playerOpponentsFor(type).length)return;
      const titles=[...(area()?.querySelectorAll('.ll-card-title')||[])];
      const target=titles.find(node=>String(node.textContent||'').includes('Tüm Eşleşmeler'));
      if(target&&!target.querySelector('.ll-draw-open-btn')){
        const meta=getMeta(type);
        const btn=document.createElement('button');
        btn.className='ll-btn gold ll-draw-open-btn';
        btn.style.cssText='float:right;font-size:12px;padding:4px 10px';
        btn.textContent=meta.completed?'🎱 Kura Özeti':'🎱 Kura Çekimi';
        btn.onclick=()=>window.llEuropeDrawOpen(type);
        target.appendChild(btn);
      }
    };
  }
})();
