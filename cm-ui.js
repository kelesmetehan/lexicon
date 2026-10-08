/* Production presentation only. No sample states or save schema changes. */
(async()=>{
  document.title='Lexicon League';
  // Keep the old launcher in source; the desktop navigation stays in management.
  window.llGoMainMenu=function(){
    if(lexLeague.state){lexLeague.active=true;llRenderDashboard();}
    else renderLexiconLeagueLanding();
  };
  const originalModal=llShowModal;
  window.llShowModal=function(content){
    originalModal(content);
    const modal=document.getElementById('ll-modal');
    if(modal)modal.style.top=window.scrollY+'px';
  };
  window.llOpenModal=window.llShowModal;
  document.body.classList.add('cm-game');
  document.body.dataset.cmSurface='navy';
  const rail=document.createElement('aside');
  rail.className='cm-rail';
  rail.innerHTML='<div class="cm-line">LEXICON<br>LEAGUE</div><div class="cm-line cm-date">Kariyer<br>Menüsü</div><button type="button" class="ll-btn" data-cm-nav="league">Lig Tablosu</button><button type="button" class="ll-btn" data-cm-nav="profile">Hoca Profili</button><button type="button" class="ll-btn" data-cm-nav="cards">Kart Arşivi</button><button type="button" class="ll-btn" data-cm-nav="menu">Ana Menü</button><div class="cm-foot">Lexicon League<br><a href="https://www.vissel-kobe.co.jp/special/season2026/" target="_blank" rel="noreferrer">Fotoğraf kaynağı</a></div>';
  document.body.prepend(rail);
  rail.querySelector('.cm-foot').firstChild.textContent='Lexicon League';
  const careers=document.createElement('button');careers.type='button';careers.className='ll-btn';careers.dataset.cmNav='careers';careers.textContent='Kariyerler / Yedek';rail.insertBefore(careers,rail.querySelector('.cm-foot'));
  const status=document.createElement('div');status.className='cm-status';status.textContent='Lexicon League · PC ve telefon';document.body.append(status);

  rail.querySelectorAll('button').forEach(button=>button.disabled=true);
  const area=llArea();
  area.innerHTML='<div class="ll-shell"><div class="ll-panel"><div class="ll-title">Lexicon League</div><p role="status">Kariyer kayıtların yükleniyor…</p></div></div>';
  try{
    const ready=await globalThis.llStorageBootReady;
    if(ready!==true)throw new Error('Kariyer deposuna erişilemedi. Aynı tarayıcıda yeniden dene; site verilerini silme.');
    if(typeof llSaveStoreReadError!=='undefined'&&llSaveStoreReadError)throw new Error('Kariyer kaydı okunamadı. Mevcut veriler korunuyor.');
    // Show actual slots. Loading/repairing a career remains an explicit user action.
    renderLexiconLeagueLanding();
    rail.querySelectorAll('button').forEach(button=>button.disabled=false);
    rail.addEventListener('click',event=>{
      const button=event.target.closest('[data-cm-nav]');if(!button)return;
      const action=button.dataset.cmNav;
      if(action==='league'&&lexLeague.state)llOpenTeamLeagueTable(lexLeague.state.playerTeam);
      if(action==='profile')llRenderManagerProfile('overview');
      if(action==='cards')llRenderCardArchive();
      if(action==='menu')llGoMainMenu();
      if(action==='careers')renderLexiconLeagueLanding();
    });
    let scheduled=false;
    // Reapply the game's own scoped theme rules after the CM skin. Keep their
    // exact declarations and media queries; never replace event mechanics.
    const originalThemes=document.createElement('style');originalThemes.id='cm-original-themes';document.head.append(originalThemes);
    const themePattern=/ll-euro-match-|ll-(?:hell|risk|legend)-quiz-theme|data-ll-national-theme/;
    function themeRules(rules){return Array.from(rules||[]).map(rule=>{
      if(rule.selectorText){const selectors=rule.selectorText.split(',').filter(selector=>themePattern.test(selector));if(!selectors.length)return '';return selectors.map(selector=>/^\s*body\b/.test(selector)?selector.replace(/\bbody\b/,'body.cm-game'):'body.cm-game '+selector).join(',')+'{'+rule.style.cssText+'}';}
      if(rule.cssRules&&rule.conditionText){const inner=themeRules(rule.cssRules);return inner?'@media '+rule.conditionText+'{'+inner+'}':'';}
      return '';
    }).join('\n');}
    function preserveThemes(){const css=Array.from(document.querySelectorAll('style')).filter(style=>style!==originalThemes).map(style=>themeRules(style.sheet?.cssRules)).join('\n');if(originalThemes.textContent!==css)originalThemes.textContent=css;}
    const update=()=>{
      scheduled=false;
      preserveThemes();
      llArea().querySelectorAll('table').forEach(table=>{
        const heads=Array.from(table.querySelectorAll('thead th'));
        const headers=heads.map(th=>th.textContent.trim());
        // Domestic, foreign, European, national and archived standings share
        // these semantic headers. Other tables retain their native layout.
        if(!headers.includes('Takım')||!headers.includes('O')||!headers.includes('P'))return;
        table.classList.add('cm-league-table');
        const extra=headers.map(h=>['AG','YG','Kart','AI AP'].includes(h));
        table.style.setProperty('--cm-stat-count',String(headers.filter((h,i)=>!extra[i]&&h!=='#'&&h!=='Takım').length));
        function mark(cell,index){
          cell.classList.toggle('cm-stat-extra',extra[index]);
          cell.classList.toggle('cm-stat-team',headers[index]==='Takım');
          cell.classList.toggle('cm-stat-rank',headers[index]==='#');
          cell.classList.toggle('cm-stat-points',headers[index]==='P');
        }
        heads.forEach(mark);
        table.querySelectorAll('tbody tr').forEach(row=>{
          const cells=Array.from(row.cells).filter(cell=>!cell.classList.contains('cm-stat-details'));
          if(cells.length!==headers.length)return;
          cells.forEach(mark);
          const details=cells.flatMap((cell,index)=>extra[index]?[headers[index]+': '+cell.textContent.trim()]:[]).join('  ·  ');
          if(!details)return;
          let detail=row.querySelector('.cm-stat-details');
          if(!detail){detail=document.createElement('td');detail.className='cm-stat-details';detail.colSpan=headers.length;row.append(detail);}
          if(detail.textContent!==details)detail.textContent=details;
        });
      });
      const title=llArea().querySelector('.ll-title')?.textContent||'';
      const current=llArea().querySelector('#ll-team-league-nav-view')?'league':/Hoca|Menajer/.test(title)?'profile':/Kart.*Arşiv/.test(title)?'cards':null;
      rail.querySelectorAll('[data-cm-nav]').forEach(button=>{if(button.dataset.cmNav===current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
      const st=lexLeague.state;
      rail.querySelectorAll('[data-cm-nav="league"],[data-cm-nav="profile"],[data-cm-nav="cards"]').forEach(button=>button.disabled=!st);
      rail.querySelector('.cm-date').innerHTML=st?`Sezon ${st.season}<br>${st.week}. Hafta`:'Kariyer<br>Menüsü';
      const isTable=!!llArea().querySelector('#ll-team-league-nav-view');
      document.body.classList.toggle('cm-table-view',isTable);
      const outcome=llArea().querySelector('.ll-carded-outcome');
      if(outcome){outcome.setAttribute('aria-live','polite');outcome.setAttribute('aria-label','Tetiklenen kartlara göre güncel sonuç');}
      const forecastHelp=llArea().querySelector('.ll-forecast-head .ll-muted');
      const helpText='Kartlı sonuç üstte; ham zar karşılaştırması aşağıda. Her reroll sonrası yeniden hesaplanır.';
      if(forecastHelp&&forecastHelp.textContent!==helpText)forecastHelp.textContent=helpText;
    };
    new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}}).observe(llArea(),{childList:true,subtree:true});update();

  }catch(error){
    area.replaceChildren();
    const panel=document.createElement('section');panel.className='ll-panel';
    const title=document.createElement('h1');title.className='ll-title';title.textContent='Kariyer kaydı açılamadı';
    const info=document.createElement('p');info.textContent=error.message;
    const retry=document.createElement('button');retry.className='ll-btn primary';retry.textContent='Yeniden Dene';retry.addEventListener('click',()=>location.reload());
    panel.append(title,info,retry);area.append(panel);
    status.textContent='Kayıt yüklenemedi; yeni kariyer başlatılmadı.';console.error(error);
  }
})();
