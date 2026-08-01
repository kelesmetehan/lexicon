/* Lexicon League local IndexedDB careers and storage health. */
(function(){
  'use strict';
  var LL_IDB_NAME='lexicon-league-local';
  var LL_IDB_VERSION=1;
  var LL_IDB_STORE='appState';
  var LL_IDB_KEY='careerSlots';
  var llIdbDb=null;
  var llIdbReady=false;
  var llIdbUnavailable=false;
  var llIdbCache=null;
  var llIdbInitPromise=null;
  var llIdbWriteChain=Promise.resolve();
  var llIdbLastError=null;
  var llIdbBaseEnsure=typeof llEnsureSaveSlots==='function'?llEnsureSaveSlots:null;
  var llIdbBasePersist=typeof llPersistStoreAndMirror==='function'?llPersistStoreAndMirror:null;
  var llIdbBaseMirror=typeof llMirrorActiveCareer==='function'?llMirrorActiveCareer:null;
  var llIdbBaseApplyCareer=typeof llApplyCareerImport==='function'?llApplyCareerImport:null;
  var llIdbBaseApplyFull=typeof llApplyFullBackup==='function'?llApplyFullBackup:null;
  var llIdbBaseFailure=typeof llStorageFailure==='function'?llStorageFailure:null;

  function llIdbClone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function llStorageProblemKind(error){var name=String(error&&error.name||'');var message=String(error&&error.message||error||'');if(/QuotaExceeded|quota|storage full|disk full/i.test(name+' '+message))return 'Kota dolu / yazma siniri';if(name==='SyntaxError'||/JSON|bozuk|parse/i.test(message))return 'Kayit bozulmasi / JSON okuma hatasi';if(/Security|NotAllowed|InvalidState/i.test(name))return 'Tarayici izin veya gizli mod kisiti';return 'Diger depolama hatasi';}
  function llIdbError(error,where){
    llIdbLastError={name:String(error&&error.name||'Error'),message:String(error&&error.message||error||'Bilinmeyen hata'),kind:llStorageProblemKind(error),where:where||'IndexedDB',at:new Date().toISOString()};
    globalThis.llLastStorageFailure=llIdbLastError;
    console.error('Lexicon League IndexedDB:',where,error);
  }
  function llIdbStoreLooksValid(store){return !!store&&typeof store==='object'&&store.slots&&typeof store.slots==='object';}
  function llIdbNormalizeStore(store){
    if(!llIdbStoreLooksValid(store))return typeof llSlotEmptyStore==='function'?llSlotEmptyStore():{version:1,activeSlot:1,slots:{'1':null,'2':null,'3':null}};
    var normalized=typeof llSlotEmptyStore==='function'?llSlotEmptyStore():{version:1,activeSlot:1,slots:{'1':null,'2':null,'3':null}};
    for(var slot=1;slot<=3;slot++){
      var raw=store.slots[String(slot)];
      normalized.slots[String(slot)]=raw&&typeof llSlotNormalizeRecord==='function'?llSlotNormalizeRecord(raw):raw||null;
    }
    normalized.activeSlot=typeof llSlotNumber==='function'?(llSlotNumber(store.activeSlot)||1):(Number(store.activeSlot)||1);
    if(!normalized.slots[String(normalized.activeSlot)]){
      for(var i=1;i<=3;i++)if(normalized.slots[String(i)]){normalized.activeSlot=i;break;}
    }
    return normalized;
  }
  function llIdbOpen(){
    if(llIdbDb)return Promise.resolve(llIdbDb);
    if(!globalThis.indexedDB)return Promise.reject(new Error('IndexedDB bu tarayıcıda kullanılamıyor.'));
    return new Promise(function(resolve,reject){
      var request=indexedDB.open(LL_IDB_NAME,LL_IDB_VERSION);
      request.onupgradeneeded=function(){var db=request.result;if(!db.objectStoreNames.contains(LL_IDB_STORE))db.createObjectStore(LL_IDB_STORE);};
      request.onsuccess=function(){llIdbDb=request.result;llIdbDb.onversionchange=function(){try{llIdbDb.close();}catch(e){}};resolve(llIdbDb);};
      request.onerror=function(){reject(request.error||new Error('IndexedDB açılamadı.'));};
      request.onblocked=function(){reject(new Error('IndexedDB başka bir sekme tarafından kilitli.'));};
    });
  }
  function llIdbRead(key){return llIdbOpen().then(function(db){return new Promise(function(resolve,reject){var req=db.transaction(LL_IDB_STORE,'readonly').objectStore(LL_IDB_STORE).get(key);req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error||new Error('IndexedDB okunamadı.'));};});});}
  function llIdbWrite(key,value){return llIdbOpen().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction(LL_IDB_STORE,'readwrite');tx.objectStore(LL_IDB_STORE).put(value,key);tx.oncomplete=function(){resolve(true);};tx.onerror=function(){reject(tx.error||new Error('IndexedDB yazılamadı.'));};tx.onabort=function(){reject(tx.error||new Error('IndexedDB işlemi iptal edildi.'));};});});}
  function llIdbLegacyStore(){
    var store=llIdbBaseEnsure?llIdbBaseEnsure():null;
    return llIdbNormalizeStore(store);
  }
  function llIdbHasCareer(store){return !!(store&&store.slots&&Object.keys(store.slots).some(function(key){return !!store.slots[key];}));}
  function llIdbClearMovedLegacy(){
    try{
      localStorage.removeItem(LL_SAVE_SLOTS_KEY);
      localStorage.removeItem(LL_ACTIVE_SLOT_KEY);
      localStorage.removeItem(LL_V2_SAVE_KEY);
    }catch(error){llIdbError(error,'Eski kopya temizleme');}
  }
  async function llIdbInitialize(){
    if(llIdbReady||llIdbUnavailable)return llIdbReady;
    if(llIdbInitPromise)return llIdbInitPromise;
    llIdbInitPromise=(async function(){
      try{
        var stored=await llIdbRead(LL_IDB_KEY);
        if(stored&&llIdbStoreLooksValid(stored.store)){
          llIdbCache=llIdbNormalizeStore(stored.store);
          llIdbReady=true;
          return true;
        }
        var legacy=llIdbLegacyStore();
        Object.keys(legacy.slots||{}).forEach(function(slot){var record=legacy.slots[slot],state=record&&record.state;if(!state||typeof globalThis.llCompactCompletedSeasonResults!=='function')return;var cutoff=state.seasonEnded?Number(state.season):Number(state.season)-1;if(cutoff>=1)globalThis.llCompactCompletedSeasonResults(state,cutoff);});
        var packet={version:1,savedAt:new Date().toISOString(),store:llIdbClone(legacy)};
        await llIdbWrite(LL_IDB_KEY,packet);
        var verify=await llIdbRead(LL_IDB_KEY);
        if(!verify||!llIdbStoreLooksValid(verify.store))throw new Error('Taşınan kariyer doğrulanamadı.');
        llIdbCache=llIdbNormalizeStore(verify.store);
        llIdbReady=true;
        if(llIdbHasCareer(legacy))llIdbClearMovedLegacy();
        return true;
      }catch(error){llIdbUnavailable=true;llIdbError(error,'Kariyer taşıma');return false;}
      finally{
        setTimeout(function(){
          if(typeof renderLexiconLeagueLanding==='function'&&document.querySelector('.ll-save-grid'))renderLexiconLeagueLanding();
        },0);
      }
    })();
    return llIdbInitPromise;
  }
  function llIdbQueueStore(store){
    llIdbCache=llIdbNormalizeStore(store);
    var snapshot=llIdbClone(llIdbCache);
    llIdbWriteChain=llIdbWriteChain.catch(function(){return false;}).then(function(){return llIdbWrite(LL_IDB_KEY,{version:1,savedAt:new Date().toISOString(),store:snapshot});}).catch(function(error){llIdbError(error,'Arka plan kaydı');return false;});
    return true;
  }
  async function llIdbCommitStore(store){
    llIdbCache=llIdbNormalizeStore(store);
    await llIdbWrite(LL_IDB_KEY,{version:1,savedAt:new Date().toISOString(),store:llIdbClone(llIdbCache)});
    return true;
  }
  async function llIdbFlush(){try{return await llIdbWriteChain;}catch(error){llIdbError(error,'Kaydı tamamlama');return false;}}

  globalThis.llCompactCompletedSeasonResults=function(state,completedSeason){
    if(!state||!Array.isArray(state.results))return {removed:0,kept:0};
    var cutoff=Number(completedSeason);
    if(!Number.isFinite(cutoff))return {removed:0,kept:state.results.length};
    var before=state.results.length;
    state.results=state.results.filter(function(result){
      if(!result||typeof result!=='object')return false;
      var isPlayerMatch=result.userMatch===true||result.home===state.playerTeam||result.away===state.playerTeam;
      if(isPlayerMatch)return true;
      var season=Number(result.season);
      return !Number.isFinite(season)||season>cutoff;
    });
    var removed=Math.max(0,before-state.results.length);
    var history=state.storageCompaction&&typeof state.storageCompaction==='object'?state.storageCompaction:{};
    history.version=1;history.lastAt=new Date().toISOString();history.lastCompletedSeason=cutoff;history.removedBackgroundResults=removed;history.retainedUserResults=state.results.filter(function(result){return result&&((result.userMatch===true)||(result.home===state.playerTeam)||(result.away===state.playerTeam));}).length;history.totalRemoved=Number(history.totalRemoved||0)+removed;
    state.storageCompaction=history;
    return {removed:removed,kept:state.results.length};
  };

  if(llIdbBaseFailure){
    llStorageFailure=function(error,prefix){
      globalThis.llLastStorageFailure={name:String(error&&error.name||'Error'),message:String(error&&error.message||error||'Bilinmeyen hata'),kind:llStorageProblemKind(error),where:prefix||'Tarayici depolamasi',at:new Date().toISOString()};
      return llIdbBaseFailure(error,prefix);
    };
  }
  llEnsureSaveSlots=function(){return llIdbReady?llIdbClone(llIdbCache):llIdbLegacyStore();};
  llPersistStoreAndMirror=function(store){
    if(!llIdbReady)return llIdbBasePersist?llIdbBasePersist(store):false;
    return llIdbQueueStore(store);
  };
  llMirrorActiveCareer=function(){
    if(llIdbReady)return true;
    return llIdbBaseMirror?llIdbBaseMirror():true;
  };

  if(llIdbBaseApplyCareer){
    llApplyCareerImport=async function(slot){
      if(!llIdbReady)return llIdbBaseApplyCareer(slot);
      var selected=typeof llSlotNumber==='function'?llSlotNumber(slot):Number(slot),record=llSaveSlotPendingImport;
      if(!selected||!record)return;
      var store=llEnsureSaveSlots(),existing=store.slots[String(selected)];
      if(existing&&!confirm(selected+'. yuvadaki '+existing.state.playerTeam+' kariyerinin üzerine yazılsın mı?'))return;
      try{
        var state=llRepairPortableCareer(record.state);
        llDownloadJson('lexicon-league-aktarim-oncesi_'+llBackupFileStamp()+'.json',llBuildFullBackup());
        store.slots[String(selected)]={state:llIdbClone(state),updatedAt:record.updatedAt||new Date().toISOString()};
        store.activeSlot=selected;
        await llIdbCommitStore(store);
        lexLeague.state=null;llSaveSlotPendingImport=null;
        if(typeof llCloseModal==='function')llCloseModal();
        renderLexiconLeagueLanding();
        if(typeof llSetBackupStatus==='function')llSetBackupStatus('Kariyer IndexedDB depolamasına içe aktarıldı.');
        alert('Kariyer başarıyla içe aktarıldı. Kelime ilerlemesi değiştirilmedi.');
      }catch(error){llIdbError(error,'Kariyer içe aktarma');alert('Kariyer içe aktarılamadı: '+(error.message||'Bilinmeyen hata'));}
    };
  }
  if(llIdbBaseApplyFull){
    llApplyFullBackup=async function(validated){
      if(!llIdbReady)return llIdbBaseApplyFull(validated);
      var careerCount=Object.values(validated.slots).filter(Boolean).length,wordCount=validated.words.length;
      if(!confirm('Yedekte '+careerCount+' kariyer ve '+wordCount+' kelime kaydı var.\n\nMevcut üç kariyer yuvası ve ortak kelime ilerlemesi bu yedekle değiştirilecek. Devam edilsin mi?'))return;
      var wordSnapshot=typeof llStorageSnapshot==='function'?llStorageSnapshot([DB_KEY,META_KEY]):{};
      try{
        var repaired={};
        for(var slot=1;slot<=3;slot++){
          var record=validated.slots[String(slot)];
          repaired[String(slot)]=record?{state:llRepairPortableCareer(record.state),updatedAt:record.updatedAt||new Date().toISOString()}:null;
        }
        llDownloadJson('lexicon-league-aktarim-oncesi_'+llBackupFileStamp()+'.json',llBuildFullBackup());
        var store={version:1,activeSlot:validated.activeSlot,slots:repaired};
        if(!store.slots[String(store.activeSlot)]){for(var i=1;i<=3;i++)if(store.slots[String(i)]){store.activeSlot=i;break;}}
        localStorage.setItem(DB_KEY,JSON.stringify(validated.words));
        localStorage.setItem(META_KEY,JSON.stringify(validated.meta));
        await llIdbCommitStore(store);
        lexLeague.state=null;
        alert('Tam yedek başarıyla içe aktarıldı. Sayfa yenilenecek.');
        location.reload();
      }catch(error){
        try{if(typeof llRestoreStorageSnapshot==='function')llRestoreStorageSnapshot(wordSnapshot);}catch(rollbackError){}
        llIdbError(error,'Tam yedek içe aktarma');
        alert('Tam yedek içe aktarılamadı: '+(error.message||'Bilinmeyen hata'));
      }
    };
  }

  function llStorageBytes(value){
    try{return new Blob([String(value==null?'':value)]).size;}catch(error){return unescape(encodeURIComponent(String(value==null?'':value))).length;}
  }
  function llStorageFormat(bytes){var value=Number(bytes)||0;if(value<1024)return value+' B';if(value<1024*1024)return (value/1024).toFixed(1)+' KB';return (value/(1024*1024)).toFixed(2)+' MB';}
  function llStorageLocalRows(){
    var keys=[
      {key:typeof LL_SAVE_KEY!=='undefined'?LL_SAVE_KEY:'lexicon_league_save_v1',label:'Eski v1 kariyer'},
      {key:typeof LL_V2_SAVE_KEY!=='undefined'?LL_V2_SAVE_KEY:'lexicon_league_save_v2',label:'Eski v2 kariyer'},
      {key:typeof LL_SAVE_SLOTS_KEY!=='undefined'?LL_SAVE_SLOTS_KEY:'lexicon_league_save_slots_v1',label:'Yerel yuva kopyasi'},
      {key:typeof DB_KEY!=='undefined'?DB_KEY:'lexicon_db',label:'Kelime veri tabani'},
      {key:typeof META_KEY!=='undefined'?META_KEY:'lexicon_meta',label:'Kelime istatistikleri'}
    ];
    return keys.map(function(item){var value=null;try{value=localStorage.getItem(item.key);}catch(error){}return {label:item.label,key:item.key,bytes:value==null?0:llStorageBytes(value),exists:value!=null};});
  }
  function llStorageHealthHtml(){
    var rows=llStorageLocalRows(),localTotal=rows.reduce(function(sum,row){return sum+row.bytes;},0),idbBytes=llIdbCache?llStorageBytes(JSON.stringify(llIdbCache)):0,compact=lexLeague.state&&lexLeague.state.storageCompaction;
    var localRows=rows.map(function(row){return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span>'+row.label+'</span><b>'+llStorageFormat(row.bytes)+(row.exists?'':' · yok')+'</b></div>';}).join('');
    var failure=globalThis.llLastStorageFailure||llIdbLastError;if(typeof llSaveStoreReadError!=='undefined'&&llSaveStoreReadError)failure={kind:'Kayit bozulmasi / JSON okuma hatasi',name:'SaveStoreReadError',message:'Kariyer yuvalari okunamadi; eski veri silinmedi.'};
    return '<div id="ll-storage-health-content"><div class="ll-card-title">Depolama Sağlığı</div><div class="ll-sub" style="margin:7px 0 12px">Kariyer kayıtları '+(llIdbReady?'IndexedDB’de tutuluyor.':'hazırlanıyor; geçici olarak eski yerel kayıt kullanılıyor.')+' Bu cihazdaki başka tarayıcılara veya PC’ye otomatik gitmez.</div><div class="ll-metrics" style="grid-template-columns:repeat(2,minmax(0,1fr));margin:8px 0"><div class="ll-metric"><strong>'+llStorageFormat(idbBytes)+'</strong><span>IndexedDB kariyer verisi</span></div><div class="ll-metric"><strong>'+llStorageFormat(localTotal)+'</strong><span>localStorage anahtarları</span></div></div><div id="ll-storage-estimate" class="ll-notice" style="margin:9px 0">Tarayıcı kotası hesaplanıyor…</div><div class="ll-card" style="padding:12px;margin-top:10px"><b>localStorage ayrıntısı</b>'+localRows+'</div>'+(compact?'<div class="ll-notice" style="margin-top:10px">Son sıkıştırma: Sezon '+compact.lastCompletedSeason+' · '+compact.removedBackgroundResults+' arka plan maçı temizlendi · '+compact.retainedUserResults+' oyuncu maçı korundu.</div>':'')+(failure?'<div class="ll-notice" style="margin-top:10px;border-color:#e05c5c"><b>Son depolama hatası:</b> '+String(failure.kind||'Diger depolama hatasi')+' — '+String(failure.name||'Hata')+' — '+String(failure.message||'Bilinmeyen hata')+'</div>':'<div class="ll-notice" style="margin-top:10px">Kaydedilmiş kota veya bozuk kayıt hatası yok.</div>')+'<div class="ll-actions" style="margin-top:12px"><button class="ll-btn primary" onclick="llExportFullBackup()">Tam Yedek İndir</button><button class="ll-btn" onclick="llStorageCompactNow()">Eski Sezonları Sıkıştır</button><button class="ll-btn danger" onclick="llStorageClearLegacyV1()">Eski v1 Kaydını Temizle</button></div></div>';
  }
  globalThis.llOpenStorageHealth=function(){
    if(typeof llShowModal!=='function'){alert('Depolama Sağlığı ekranı bu sayfada açılamadı.');return;}
    llShowModal(llStorageHealthHtml());
    if(navigator.storage&&typeof navigator.storage.estimate==='function')navigator.storage.estimate().then(function(estimate){var node=document.getElementById('ll-storage-estimate');if(node)node.innerHTML='<b>Tarayıcı alanı:</b> '+llStorageFormat(estimate.usage||0)+' kullanılıyor / '+llStorageFormat(estimate.quota||0)+' kota. Bu değer tüm site verisini kapsayan tarayıcı tahminidir.';}).catch(function(error){var node=document.getElementById('ll-storage-estimate');if(node)node.textContent='Tarayıcı kota bilgisini vermedi: '+(error.message||'bilinmeyen hata');});
  };
  globalThis.llStorageCompactNow=function(){
    var state=lexLeague.state;if(!state){alert('Sıkıştırmak için bir kariyer aç.');return;}
    var cutoff=state.seasonEnded?Number(state.season):Number(state.season)-1;
    if(cutoff<1){alert('Henüz sıkıştırılacak bitmiş sezon yok.');return;}
    if(!confirm('Sezon arşivindeki puan tabloları, kupalar ve senin maçların korunacak. Eski arka plan maç kayıtları kaldırılsın mı?'))return;
    var result=globalThis.llCompactCompletedSeasonResults(state,cutoff);llSave();alert(result.removed+' arka plan maç kaydı temizlendi. '+result.kept+' kayıt korundu.');llOpenStorageHealth();
  };
  globalThis.llStorageClearLegacyV1=function(){
    var key=typeof LL_SAVE_KEY!=='undefined'?LL_SAVE_KEY:'lexicon_league_save_v1';
    if(!localStorage.getItem(key)){alert('Temizlenecek eski v1 kaydı bulunmuyor.');return;}
    if(!confirm('Eski v1 kaydı silinmeden önce tam yedek indirilecek. Devam edilsin mi?'))return;
    try{llExportFullBackup();localStorage.removeItem(key);alert('Eski v1 kopyası temizlendi. Aktif IndexedDB kariyerin korunuyor.');llOpenStorageHealth();}catch(error){llIdbError(error,'Eski v1 temizleme');alert('Eski v1 kaydı temizlenemedi: '+(error.message||'bilinmeyen hata'));}
  };
  var llIdbLandingBase=renderLexiconLeagueLanding;
  renderLexiconLeagueLanding=function(){
    llIdbLandingBase();
    var panel=llArea&&llArea()?llArea().querySelector('.ll-backup-panel'):null;
    if(panel&&!panel.querySelector('#ll-storage-health-launcher'))panel.insertAdjacentHTML('beforeend','<div id="ll-storage-health-launcher" class="ll-notice" style="margin-top:12px;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><span><b>Depolama Sağlığı:</b> Kariyer kaydının boyutunu, kota durumunu ve eski kopyaları gör.</span><button class="ll-btn" onclick="llOpenStorageHealth()">Depolama Sağlığı</button></div>');
  };
  globalThis.addEventListener('pagehide',function(){if(llIdbReady)llIdbFlush();});
  llIdbInitialize();
})();
