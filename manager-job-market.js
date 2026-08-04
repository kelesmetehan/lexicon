'use strict';

/*
 * FM-style vacant managerial jobs and board application reports.
 * Existing incoming offers remain guaranteed; vacancies require an application.
 */
(function(){
  var LL_MANAGER_JOB_MARKET_VERSION=1;
  var LL_MANAGER_JOB_SECURITY_VERSION=1;
  var LL_JOB_VACANCY_THRESHOLD=75;
  var LL_JOB_REPUTATION_REQUIREMENTS={1:28,2:36,3:46,4:58,5:70,6:82};
  var LL_JOB_ACCEPTANCE_THRESHOLDS={1:55,2:60,3:66,4:73,5:81,6:89};
  var LL_JOB_WIN_RATE_REQUIREMENTS={
    tier1:{1:28,2:32,3:38,4:44,5:50,6:56},
    tier2:{1:30,2:35,3:40,4:46,5:52,6:58}
  };

  function deep(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0));}
  function escapeHtml(value){
    if(typeof globalThis.llEscape==='function')return llEscape(String(value==null?'':value));
    return String(value==null?'':value).replace(/[&<>'"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];});
  }
  function teamArg(name){return encodeURIComponent(String(name||''));}
  function countryCodes(summary){
    if(Array.isArray(globalThis.LL_COUNTRY_CODES)&&LL_COUNTRY_CODES.length)return LL_COUNTRY_CODES.filter(function(code){return summary?.countrySummaries?.[code]||summary?.leagueRows?.[code];});
    return Object.keys(summary?.countrySummaries||summary?.leagueRows||{});
  }
  function countryMeta(code){
    if(typeof globalThis.llMLCountryMeta==='function')return llMLCountryMeta(code);
    return globalThis.LL_COUNTRY_META?.[code]||{country:code,flag:'🌍'};
  }
  function leagueLabel(country,tier){
    if(typeof globalThis.llMLLeagueLabel==='function')return llMLLeagueLabel(country,tier);
    return tier==='tier1'?'1. Lig':'2. Lig';
  }
  function teamLogo(name){
    try{return typeof globalThis.llTeamLogo==='function'?llTeamLogo(name,'match'):'<span class="ll-job-logo-fallback">'+escapeHtml(String(name||'').slice(0,2).toUpperCase())+'</span>';}
    catch{return '<span class="ll-job-logo-fallback">'+escapeHtml(String(name||'').slice(0,2).toUpperCase())+'</span>';}
  }
  function starText(stars){return typeof globalThis.llStars==='function'?llStars(stars):'★'.repeat(Math.max(1,Number(stars)||1));}
  function getCountrySummary(summary,country){
    if(summary?.countrySummaries?.[country])return summary.countrySummaries[country];
    if((summary?.country||'TUR')===country)return {
      country:country,
      tier1Rows:summary.tier1Rows||summary.superRows||[],
      tier2Rows:summary.tier2Rows||summary.firstRows||[],
      relegated:summary.relegated||[],promoted:summary.promoted||[],cupWinner:summary.cupWinner||null,
      rules:{relegateCount:(summary.relegated||[]).length,playoffTo:7}
    };
    return null;
  }
  function rowPosition(row,index){return Math.max(1,Number(row?.position)||index+1);}
  function rowWinRate(row){return Number(row?.P)>0?Math.round((Number(row.W||0)/Number(row.P))*1000)/10:0;}
  function previousPromoted(state,season,country){
    var prior=(state.seasonHistory||[]).find(function(item){return Number(item?.season)===Number(season)-1;});
    if(!prior)return new Set();
    var info=prior.countrySummaries?.[country];
    return new Set(info?.promoted||((prior.country||state.playerCountry||'TUR')===country?prior.promoted:[])||[]);
  }
  function expectedPosition(stars,tier,teamCount,info){
    stars=clamp(Math.round(stars),1,6);teamCount=Math.max(2,Number(teamCount)||2);
    if(tier==='tier1'){
      var rates={6:.15,5:.25,4:.40,3:.60};
      if(rates[stars])return Math.max(1,Math.ceil(teamCount*rates[stars]));
      var relegationPlaces=Math.max(2,Number(info?.rules?.relegateCount)||(info?.relegated||[]).length||3);
      return Math.max(1,teamCount-relegationPlaces);
    }
    var playoffTo=Math.max(4,Number(info?.rules?.playoffTo)||7);
    if(stars===6)return 1;
    if(stars===5)return 2;
    if(stars===4)return Math.min(teamCount,playoffTo);
    if(stars===3)return Math.max(1,Math.ceil(teamCount*.50));
    if(stars===2)return Math.max(1,Math.ceil(teamCount*.70));
    return Math.max(1,teamCount-3);
  }
  function expectedLabel(stars,tier,position,teamCount,info){
    if(tier==='tier1'&&stars<=2)return 'Küme düşme hattının üzerinde bitir';
    if(tier==='tier2'&&stars===4)return 'Play-off hattına gir (ilk '+position+')';
    if(tier==='tier2'&&stars>=5)return stars===6?'Şampiyon ol':'İlk 2 içinde bitir';
    return 'Ligi ilk '+position+' içinde bitir';
  }
  function lowWinRateFloor(stars,tier){return Number(LL_JOB_WIN_RATE_REQUIREMENTS[tier]?.[stars]||35);}
  function ensureSecurity(state){
    if(!state.clubManagerSecurity||typeof state.clubManagerSecurity!=='object')state.clubManagerSecurity={version:LL_MANAGER_JOB_SECURITY_VERSION,clubs:{},seasons:{}};
    var ledger=state.clubManagerSecurity;
    ledger.version=LL_MANAGER_JOB_SECURITY_VERSION;
    if(!ledger.clubs||typeof ledger.clubs!=='object')ledger.clubs={};
    if(!ledger.seasons||typeof ledger.seasons!=='object')ledger.seasons={};
    return ledger;
  }
  function clubSecurity(ledger,name){
    var club=ledger.clubs[name]&&typeof ledger.clubs[name]==='object'?ledger.clubs[name]:{};
    club.failedTargetStreak=Math.max(0,Number(club.failedTargetStreak)||0);
    club.lastSeason=Math.max(0,Number(club.lastSeason)||0);
    if(!Array.isArray(club.history))club.history=[];
    ledger.clubs[name]=club;
    return club;
  }
  function vacancyPrimaryReason(factors){
    var ordered=['relegation','severe-underperformance','consecutive-failure','elite-collapse','low-win-rate','target-missed'];
    for(var i=0;i<ordered.length;i++){
      var found=factors.find(function(item){return item.code===ordered[i]&&item.points>0;});
      if(found)return found;
    }
    return factors.find(function(item){return item.points>0;})||{code:'board-change',label:'Yönetim değişim kararı',detail:'Kulüp yönetimi yeni bir teknik direktör arıyor.',points:0};
  }
  function buildVacancies(state,market){
    var summary=state.lastSeasonSummary||{},season=Number(summary.season)||Number(state.season)||1,ledger=ensureSecurity(state),seasonKey=String(season);
    if(ledger.seasons[seasonKey]?.vacancies)return deep(ledger.seasons[seasonKey].vacancies);
    var vacancies=[];
    countryCodes(summary).forEach(function(country){
      var info=getCountrySummary(summary,country);if(!info)return;
      var priorPromoted=previousPromoted(state,season,country),relegated=new Set(info.relegated||[]),promoted=new Set(info.promoted||[]),cupWinner=info.cupWinner||null;
      [['tier1',info.tier1Rows||[]],['tier2',info.tier2Rows||[]]].forEach(function(pair){
        var tier=pair[0],rows=pair[1]||[],teamCount=rows.length;
        rows.forEach(function(row,index){
          var team=row?.team;if(!team)return;
          var stars=clamp(Math.round(state.teams?.[team]?.stars||globalThis.LL_TEAM_REGISTRY?.[team]?.stars||1),1,6),position=rowPosition(row,index),winRate=rowWinRate(row),expected=expectedPosition(stars,tier,teamCount,info),gap=Math.max(0,position-expected),targetMet=position<=expected;
          var club=clubSecurity(ledger,team),consecutive=Number(club.lastSeason)===season-1&&!targetMet?club.failedTargetStreak+1:(!targetMet?1:0);
          if(targetMet||promoted.has(team)||cupWinner===team||position===1)consecutive=0;
          club.failedTargetStreak=consecutive;club.lastSeason=season;
          var isRelegated=tier==='tier1'&&relegated.has(team),newlyPromoted=tier==='tier1'&&priorPromoted.has(team),champion=position===1,promotedNow=tier==='tier2'&&promoted.has(team),wonCup=cupWinner===team,severeGap=Math.max(3,Math.ceil(teamCount*.15)),floor=lowWinRateFloor(stars,tier),factors=[];
          function factor(code,label,detail,points){factors.push({code:code,label:label,detail:detail,points:points});}
          if(isRelegated)factor('relegation','Küme düşme','Kulüp üst ligden düştüğü için yönetim teknik direktör değişikliğini gündeme aldı.',90);
          if(!targetMet)factor('target-missed','Yönetim hedefi kaçtı','Beklenti '+expected+'. sıra veya üstüydü; takım sezonu '+position+'. sırada tamamladı.',20);
          if(gap>=severeGap)factor('severe-underperformance','Beklentinin çok altında kalma','Takım hedef sırasının '+gap+' basamak altında kaldı.',45);
          if(consecutive>=2)factor('consecutive-failure','Üst üste hedef başarısızlığı','Yönetim hedefi art arda '+consecutive+' sezondur tamamlanamadı.',35);
          if(winRate<floor)factor('low-win-rate','Düşük galibiyet oranı','Galibiyet oranı %'+winRate+'; kulübün asgari beklentisi %'+floor+'.',25);
          if(tier==='tier1'&&stars>=5&&position>Math.ceil(teamCount*.50))factor('elite-collapse','Büyük kulüpte ağır düşüş','Yüksek yıldızlı kulüp ligi alt yarıda tamamladı.',20);
          if(newlyPromoted)factor('promotion-patience','Yeni yükselen takıma sabır','Kulüp üst ligdeki ilk sezonu olduğu için yönetim ek tolerans tanıdı.',-35);
          if(promotedNow)factor('promotion-success','Yükselme başarısı','Takım üst lige yükseldi; teknik direktörün görevi güvence altında.',-100);
          if(wonCup)factor('trophy-protection','Kupa başarısı','Kupa kazanımı teknik direktörün görevini güvenceye aldı.',-100);
          if(champion)factor('champion-protection','Şampiyonluk','Lig şampiyonluğu teknik direktörün görevini güvenceye aldı.',-100);
          var securityScore=factors.reduce(function(sum,item){return sum+Number(item.points||0);},0),threshold=newlyPromoted?100:LL_JOB_VACANCY_THRESHOLD,becomesVacant=securityScore>=threshold&&!promotedNow&&!wonCup&&!champion;
          club.lastEvaluation={season:season,country:country,tier:tier,position:position,stars:stars,expectedPosition:expected,winRate:winRate,targetMet:targetMet,failedTargetStreak:consecutive,securityScore:securityScore,threshold:threshold,vacant:becomesVacant,factors:deep(factors)};
          club.history.push(deep(club.lastEvaluation));club.history=club.history.slice(-10);
          if(!becomesVacant||team===market.fromTeam)return;
          var nextLeague=typeof globalThis.llManagerNextLeague==='function'?llManagerNextLeague(summary,team):(isRelegated?'first':tier==='tier1'?'super':'first'),primary=vacancyPrimaryReason(factors);
          vacancies.push({
            team:team,country:country,tier:tier,stars:stars,position:position,teamCount:teamCount,winRate:winRate,
            expectedPosition:expected,expectedLabel:expectedLabel(stars,tier,expected,teamCount,info),failedTargetStreak:consecutive,
            securityScore:securityScore,securityThreshold:threshold,reasonCode:primary.code,reason:primary.label,reasonDetail:primary.detail,
            factors:factors.filter(function(item){return item.points!==0;}),nextLeague:nextLeague,nextTier:nextLeague==='super'?'tier1':'tier2',
            nextLeagueLabel:leagueLabel(country,nextLeague==='super'?'tier1':'tier2'),targetLabel:typeof globalThis.llManagerProjectedTarget==='function'?llManagerProjectedTarget(state,{...summary,country:country,promoted:info.promoted||[],relegated:info.relegated||[],superRows:info.tier1Rows||[],firstRows:info.tier2Rows||[]},team).label:'Yeni sezon hedefi belirlenecek'
          });
        });
      });
    });
    vacancies.sort(function(a,b){return b.securityScore-a.securityScore||b.stars-a.stars||a.team.localeCompare(b.team,'tr');});
    ledger.seasons[seasonKey]={season:season,vacancies:deep(vacancies),processedAt:new Date().toISOString()};
    return vacancies;
  }

  function currentPerformance(state,market){
    var summary=state.lastSeasonSummary||{},performance=typeof globalThis.llManagerPerformance==='function'?llManagerPerformance(state,summary):null;
    return performance||{from:market.fromTeam,winRate:Number(market.winRate)||0,primaryAchieved:!!market.primaryAchieved,superChampion:false,cupFinal:false,europeSuccess:false,europeTrophy:false,promoted:false};
  }
  function careerAchievementValue(state,performance){
    var trophies=(state.trophies||[]).length,value=Math.min(9,trophies*3);
    if(performance.superChampion)value+=6;
    if(performance.promoted)value+=4;
    if(performance.cupFinal)value+=3;
    if(performance.europeSuccess)value+=6;
    if(performance.primaryAchieved)value+=2;
    return Math.min(20,value);
  }
  function achievementRequirement(stars){return {1:0,2:0,3:3,4:6,5:10,6:14}[stars]||0;}
  function applicationEvaluation(state,market,vacancy){
    var profile=typeof globalThis.llManagerProfile==='function'?llManagerProfile(state):(state.managerProfile||{reputation:50}),performance=currentPerformance(state,market),reputation=clamp(profile.reputation,0,100),stars=clamp(vacancy.stars,1,6),tier=vacancy.nextTier||vacancy.tier||'tier1',requiredRep=LL_JOB_REPUTATION_REQUIREMENTS[stars],requiredWin=LL_JOB_WIN_RATE_REQUIREMENTS[tier]?.[stars]||40,achievementValue=careerAchievementValue(state,performance),requiredAchievement=achievementRequirement(stars),currentStars=clamp(market.fromStars||state.teams?.[market.fromTeam]?.stars||1,1,6),starGap=stars-currentStars,sameCountry=vacancy.country===state.playerCountry;
    var prestigeUnlocked=!!market.prestigeEligible||!!performance.europeTrophy||reputation>=78;
    var repPoints=Math.round(Math.min(30,(reputation/Math.max(1,requiredRep))*30));
    var performancePoints=Math.round(Math.min(15,(Number(market.winRate||performance.winRate||0)/Math.max(1,requiredWin))*15))+(market.primaryAchieved?10:0);
    performancePoints=Math.min(25,performancePoints);
    var achievementPoints=requiredAchievement===0?20:Math.round(Math.min(20,(achievementValue/requiredAchievement)*20));
    var levelPoints=starGap<=0?15:starGap===1?12:starGap===2&&prestigeUnlocked?9:starGap===2?3:0;
    var foreignPass=true,foreignDetail='Aynı ülke deneyimi';
    if(!sameCountry){
      if(stars<=4){foreignPass=reputation>=50;foreignDetail='Yurt dışı için en az 50 itibar';}
      else if(stars===5){foreignPass=reputation>=65&&(performance.superChampion||performance.europeSuccess||achievementValue>=10);foreignDetail='5★ yabancı kulüp: 65 itibar + büyük başarı';}
      else{foreignPass=reputation>=80&&performance.europeTrophy&&performance.superChampion;foreignDetail='6★ yabancı kulüp: 80 itibar + Avrupa kupası + lig şampiyonluğu';}
    }
    var countryPoints=sameCountry?10:(foreignPass?10:Math.round(Math.min(9,reputation/10)));
    var repPass=reputation>=requiredRep,performancePass=Number(market.winRate||performance.winRate||0)>=requiredWin&&!!market.primaryAchieved,achievementPass=achievementValue>=requiredAchievement,levelPass=starGap<=1||(starGap===2&&prestigeUnlocked),urgencyDiscount=vacancy.reasonCode==='relegation'||vacancy.securityScore>=100?5:0,requiredScore=Math.max(50,LL_JOB_ACCEPTANCE_THRESHOLDS[stars]-urgencyDiscount),total=repPoints+performancePoints+achievementPoints+levelPoints+countryPoints,mandatoryPass=repPass&&levelPass&&foreignPass,accepted=total>=requiredScore&&mandatoryPass;
    var criteria=[
      {code:'reputation',label:'Menajer itibarı',weight:30,current:reputation+'/100',required:'En az '+requiredRep,points:repPoints,pass:repPass,detail:'Kulüp yıldızı yükseldikçe yönetimin itibar beklentisi artar.'},
      {code:'form',label:'Son sezon performansı',weight:25,current:'%'+Number(market.winRate||performance.winRate||0)+' · Ana hedef '+(market.primaryAchieved?'tamam':'başarısız'),required:'%'+requiredWin+' + ana hedef',points:performancePoints,pass:performancePass,detail:'Galibiyet oranı ve ana yönetim hedefi birlikte değerlendirilir.'},
      {code:'achievements',label:'Kariyer başarıları',weight:20,current:achievementValue+' başarı puanı',required:requiredAchievement?requiredAchievement+' başarı puanı':'Özel başarı şartı yok',points:achievementPoints,pass:achievementPass,detail:'Kupalar, şampiyonluk, yükselme ve Avrupa başarısı değer katar.'},
      {code:'level',label:'Kulüp seviyesi uyumu',weight:15,current:currentStars+'★ → '+stars+'★',required:'Normalde en fazla +1★ sıçrama',points:levelPoints,pass:levelPass,detail:starGap<=1?'Kariyer basamağı kulüp seviyesiyle uyumlu.':prestigeUnlocked?'Prestij başarısı daha büyük sıçramayı açtı.':'Bu kulüp mevcut kariyer basamağının fazla üzerinde.'},
      {code:'country',label:'Ülke ve prestij uyumu',weight:10,current:sameCountry?'Aynı ülke':'Yurt dışı başvurusu',required:foreignDetail,points:countryPoints,pass:foreignPass,detail:sameCountry?'Lig ve ülke adaptasyonu hazır kabul edildi.':foreignDetail}
    ];
    return {team:vacancy.team,season:Number(market.season)||Number(state.season)||1,accepted:accepted,totalScore:total,requiredScore:requiredScore,mandatoryPass:mandatoryPass,criteria:criteria,reputation:reputation,currentStars:currentStars,targetStars:stars,starGap:starGap,urgencyDiscount:urgencyDiscount,boardDecision:accepted?'Yönetim başvurunu kabul etti. Sözleşme imzalamaya davet edildin.':'Yönetim başvurunu şu aşamada yeterli bulmadı.',evaluatedAt:new Date().toISOString()};
  }

  function ensureJobMarket(state,market){
    if(!state||!market||market.status!=='pending'||!state.lastSeasonSummary)return market;
    var offered=new Set((market.offers||[]).map(function(item){return item.team;}));
    var available=buildVacancies(state,market).filter(function(item){return !offered.has(item.team);});
    if(Number(market.vacancyVersion)!==LL_MANAGER_JOB_MARKET_VERSION){
      market.vacancyVersion=LL_MANAGER_JOB_MARKET_VERSION;
      market.vacancies=available;
      market.applications={};
    }else{
      market.vacancies=available;
      if(!market.applications||typeof market.applications!=='object')market.applications={};
    }
    return market;
  }

  function injectStyles(){
    if(typeof document==='undefined'||document.getElementById('ll-manager-job-market-style'))return;
    var style=document.createElement('style');style.id='ll-manager-job-market-style';style.textContent='\
      .ll-job-nav{display:flex;gap:9px;margin:13px 0 16px;flex-wrap:wrap}.ll-job-nav .ll-btn{min-width:180px}.ll-job-hero{display:flex;justify-content:space-between;gap:18px;padding:19px;margin:12px 0 16px;border:1px solid rgba(96,165,250,.32);border-radius:18px;background:radial-gradient(circle at 92% 12%,rgba(59,130,246,.20),transparent 38%),linear-gradient(135deg,rgba(30,58,138,.17),rgba(15,23,42,.86))}.ll-job-hero h2{margin:4px 0 7px;font-size:25px}.ll-job-hero p{margin:0;max-width:720px;color:var(--text2);line-height:1.5}.ll-job-hero-badge{display:grid;place-items:center;min-width:92px;height:92px;border-radius:20px;border:1px solid rgba(147,197,253,.36);background:rgba(30,64,175,.18);font-size:38px}.ll-job-country-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 9px}.ll-job-country-tab{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:145px;padding:10px 12px;border:1px solid rgba(255,255,255,.10);border-radius:11px;background:rgba(15,23,42,.48);color:var(--text);cursor:pointer}.ll-job-country-tab b{display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:rgba(255,255,255,.08);font-size:11px}.ll-job-country-tab.active{border-color:rgba(96,165,250,.68);background:rgba(30,64,175,.18)}.ll-job-tier-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:13px}.ll-job-tier-tab{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(15,23,42,.48);color:var(--text);cursor:pointer}.ll-job-tier-tab.active{border-color:rgba(45,212,191,.58);background:rgba(13,148,136,.14)}.ll-job-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px}.ll-job-card{padding:15px;border:1px solid rgba(96,165,250,.27);border-radius:15px;background:linear-gradient(145deg,rgba(30,58,138,.12),rgba(15,23,42,.76))}.ll-job-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ll-job-team{display:flex;align-items:center;gap:10px;min-width:0}.ll-job-team b{display:block}.ll-job-team small{display:block;margin-top:4px;color:var(--text2);font-size:11px}.ll-job-score{flex:0 0 auto;text-align:right}.ll-job-score strong{display:block;color:#fbbf24;font-size:19px}.ll-job-score span{font-size:10px;color:var(--text2)}.ll-job-reason{margin:12px 0;padding:10px;border-radius:10px;border:1px solid rgba(248,113,113,.24);background:rgba(127,29,29,.13)}.ll-job-reason b{font-size:12px;color:#fecaca}.ll-job-reason p{margin:4px 0 0;color:var(--text2);font-size:11px;line-height:1.45}.ll-job-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}.ll-job-facts div{padding:8px;border-radius:9px;background:rgba(255,255,255,.035)}.ll-job-facts span{display:block;color:var(--text2);font-size:10px}.ll-job-facts b{display:block;margin-top:3px;font-size:12px}.ll-job-status{margin:10px 0;padding:9px;border-radius:9px;font-size:12px}.ll-job-status.accepted{background:rgba(22,101,52,.20);color:#bbf7d0;border:1px solid rgba(74,222,128,.28)}.ll-job-status.rejected{background:rgba(127,29,29,.18);color:#fecaca;border:1px solid rgba(248,113,113,.25)}.ll-job-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:190px;padding:24px;border:1px dashed rgba(74,222,128,.27);border-radius:14px;background:rgba(20,83,45,.07);text-align:center}.ll-job-empty div{font-size:35px}.ll-job-empty span{margin-top:6px;color:var(--text2);font-size:12px}.ll-job-rules{margin-top:18px}.ll-job-table-wrap{overflow-x:auto;margin-top:10px}.ll-job-table{width:100%;border-collapse:collapse;min-width:700px;font-size:12px}.ll-job-table th,.ll-job-table td{padding:10px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;vertical-align:top}.ll-job-table th{color:#93c5fd;font-size:11px}.ll-job-report-backdrop{position:fixed;inset:0;z-index:10040;display:grid;place-items:center;padding:20px;background:rgba(2,6,23,.82);backdrop-filter:blur(6px)}.ll-job-report{width:min(780px,100%);max-height:90vh;overflow:auto;padding:20px;border:1px solid rgba(96,165,250,.42);border-radius:20px;background:linear-gradient(160deg,#0f172a,#111827 68%,#172554);box-shadow:0 30px 100px rgba(0,0,0,.68)}.ll-job-report-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.ll-job-report-head h2{margin:4px 0 6px}.ll-job-decision{margin:14px 0;padding:13px;border-radius:12px}.ll-job-decision.accepted{border:1px solid rgba(74,222,128,.35);background:rgba(22,101,52,.19);color:#dcfce7}.ll-job-decision.rejected{border:1px solid rgba(248,113,113,.34);background:rgba(127,29,29,.17);color:#fee2e2}.ll-job-criteria{display:grid;gap:8px}.ll-job-criterion{display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(180px,1.5fr) 70px 70px;gap:10px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:rgba(15,23,42,.50)}.ll-job-criterion .detail{color:var(--text2);font-size:10px;line-height:1.4}.ll-job-criterion .points{text-align:right;font-weight:800}.ll-job-pass{padding:5px 7px;border-radius:999px;text-align:center;font-size:10px;font-weight:800}.ll-job-pass.yes{background:rgba(22,101,52,.25);color:#bbf7d0}.ll-job-pass.no{background:rgba(127,29,29,.24);color:#fecaca}.ll-job-report-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:15px;flex-wrap:wrap}.ll-job-logo-fallback{display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,.08);font-weight:800}@media(max-width:720px){.ll-job-hero-badge{display:none}.ll-job-tier-tabs{grid-template-columns:1fr}.ll-job-criterion{grid-template-columns:1fr auto}.ll-job-criterion .detail{grid-column:1/-1}.ll-job-criterion .points{text-align:left}.ll-job-report{padding:15px}}@media(max-width:520px){.ll-job-nav .ll-btn{width:100%;min-width:0}.ll-job-list{grid-template-columns:1fr}.ll-job-facts{grid-template-columns:1fr}.ll-job-report-head{display:block}.ll-job-report-head .ll-btn{margin-top:10px}}';
    document.head.appendChild(style);
  }

  function navHtml(active,market){
    var count=(market.vacancies||[]).length;
    return '<div class="ll-job-nav"><button class="ll-btn '+(active==='offers'?'primary':'')+'" onclick="llRenderManagerMarket(\'super\')">📨 Gelen Teklifler</button><button class="ll-btn '+(active==='vacancies'?'primary':'')+'" onclick="llRenderVacantManagerJobs()">🪑 Boştaki Kulüpler · '+count+'</button></div>';
  }
  function injectOfferNavigation(){
    if(typeof document==='undefined'||typeof globalThis.llArea!=='function')return;
    var state=globalThis.lexLeague?.state,market=state?.managerMarket,root=llArea();
    if(!root||market?.status!=='pending'||root.querySelector('[data-manager-job-nav]'))return;
    var host=root.querySelector('.ll-topbar')||root.querySelector('.ll-title');
    if(host)host.insertAdjacentHTML('afterend','<div data-manager-job-nav>'+navHtml('offers',market)+'</div>');
  }
  function applicationCriteriaTable(){
    return '<div class="ll-card ll-job-rules"><div class="ll-card-title">Başvurun Nasıl Değerlendirilir?</div><div class="ll-sub">Toplam 100 puan üzerinden hesaplanır. İtibar, kulüp seviyesi ve yabancı ülke koşulları zorunlu barajdır.</div><div class="ll-job-table-wrap"><table class="ll-job-table"><thead><tr><th>Kriter</th><th>Ağırlık</th><th>Yönetimin baktığı veri</th><th>Temel kural</th></tr></thead><tbody>'+
      '<tr><td><b>Menajer itibarı</b></td><td>30</td><td>Profil itibarı</td><td>1★: 28 · 2★: 36 · 3★: 46 · 4★: 58 · 5★: 70 · 6★: 82</td></tr>'+
      '<tr><td><b>Son sezon performansı</b></td><td>25</td><td>Galibiyet oranı + ana hedef</td><td>Kulüp seviyesine göre %28–58 galibiyet ve ana hedef başarısı</td></tr>'+
      '<tr><td><b>Kariyer başarıları</b></td><td>20</td><td>Kupa, şampiyonluk, yükselme, Avrupa</td><td>3★ ve üzeri kulüpler giderek daha yüksek başarı geçmişi ister</td></tr>'+
      '<tr><td><b>Kulüp seviyesi uyumu</b></td><td>15</td><td>Mevcut kulüp yıldızı → hedef kulüp yıldızı</td><td>Normal sıçrama en fazla +1★; prestij başarısı +2★ kapısını açabilir</td></tr>'+
      '<tr><td><b>Ülke ve prestij uyumu</b></td><td>10</td><td>Aynı ülke / yabancı lig deneyimi</td><td>5★ ve 6★ yabancı kulüplerde büyük başarı ve yüksek itibar zorunlu</td></tr>'+
      '</tbody></table></div></div>';
  }
  function vacancyRulesTable(){
    return '<div class="ll-card ll-job-rules"><div class="ll-card-title">Bir Kulüp Nasıl Boşa Çıkar?</div><div class="ll-sub">Koltuk risk puanı 75’e ulaşırsa görev boşalır. Yeni yükselen kulüpte ilk sezon barajı 100’dür.</div><div class="ll-job-table-wrap"><table class="ll-job-table"><thead><tr><th>Durum</th><th>Risk etkisi</th><th>Açıklama</th></tr></thead><tbody>'+
      '<tr><td><b>Üst ligden küme düşme</b></td><td>+90</td><td>Yerleşik üst lig kulübünde çoğunlukla doğrudan boşluk oluşturur.</td></tr>'+
      '<tr><td><b>Yönetim hedefini kaçırma</b></td><td>+20</td><td>Kulübün yıldızına göre beklenen sıra tamamlanamazsa eklenir.</td></tr>'+
      '<tr><td><b>Beklentinin çok altında kalma</b></td><td>+45</td><td>Hedef sıradan lig büyüklüğünün yaklaşık %15’i kadar daha aşağıda bitirme.</td></tr>'+
      '<tr><td><b>İki sezon üst üste başarısızlık</b></td><td>+35</td><td>Yönetim hedefi art arda iki sezon kaçarsa sabır ciddi biçimde azalır.</td></tr>'+
      '<tr><td><b>Düşük galibiyet oranı</b></td><td>+25</td><td>Yıldız ve lig seviyesine göre belirlenen asgari oranın altında kalma.</td></tr>'+
      '<tr><td><b>5★–6★ kulübün alt yarıya düşmesi</b></td><td>+20</td><td>Büyük kulüplerde beklenti çöküşü ayrıca cezalandırılır.</td></tr>'+
      '<tr><td><b>Yeni yükselen takım toleransı</b></td><td>−35 ve baraj 100</td><td>Üst ligde ilk sezon yönetim daha sabırlıdır.</td></tr>'+
      '<tr><td><b>Şampiyonluk / yükselme / kupa</b></td><td>−100</td><td>Başarı teknik direktörün görevini güvenceye alır.</td></tr>'+
      '</tbody></table></div></div>';
  }
  function vacancyCard(vacancy,application){
    var status=application?'<div class="ll-job-status '+(application.accepted?'accepted':'rejected')+'"><b>'+(application.accepted?'✓ Başvuru kabul edildi':'✕ Başvuru reddedildi')+'</b> · '+application.totalScore+'/'+application.requiredScore+' puan</div>':'';
    var button=application?'<button class="ll-btn '+(application.accepted?'gold':'')+'" style="width:100%" onclick="llShowVacantJobReport(decodeURIComponent(\''+teamArg(vacancy.team)+'\'))">Değerlendirme Raporunu Gör</button>':'<button class="ll-btn primary" style="width:100%" onclick="llApplyForVacantClub(decodeURIComponent(\''+teamArg(vacancy.team)+'\'))">Kulübe Başvur</button>';
    return '<div class="ll-job-card"><div class="ll-job-card-head"><div class="ll-job-team">'+teamLogo(vacancy.team)+'<div><b>'+escapeHtml(vacancy.team)+'</b><small>'+escapeHtml(countryMeta(vacancy.country).flag||'')+' '+escapeHtml(countryMeta(vacancy.country).country||vacancy.country)+' · '+escapeHtml(vacancy.nextLeagueLabel)+'</small><div class="ll-stars">'+starText(vacancy.stars)+'</div></div></div><div class="ll-job-score"><strong>'+vacancy.securityScore+'</strong><span>koltuk risk puanı</span></div></div><div class="ll-job-reason"><b>'+escapeHtml(vacancy.reason)+'</b><p>'+escapeHtml(vacancy.reasonDetail)+'</p></div><div class="ll-job-facts"><div><span>Sezon sırası</span><b>'+vacancy.position+'. / '+vacancy.teamCount+'</b></div><div><span>Galibiyet oranı</span><b>%'+vacancy.winRate+'</b></div><div><span>Yönetim beklentisi</span><b>'+escapeHtml(vacancy.expectedLabel)+'</b></div><div><span>Yeni sezon hedefi</span><b>'+escapeHtml(vacancy.targetLabel)+'</b></div></div>'+status+button+'</div>';
  }
  function renderVacantJobs(country,tier){
    var state=globalThis.lexLeague?.state,market=state&&typeof globalThis.llEnsureManagerMarket==='function'?llEnsureManagerMarket(state):state?.managerMarket;
    if(!state||!market||market.status!=='pending'){if(typeof globalThis.llRenderSeasonEnd==='function')llRenderSeasonEnd();return;}
    ensureJobMarket(state,market);injectStyles();if(typeof globalThis.llSetWide==='function')llSetWide(true);
    var vacancies=market.vacancies||[],countries=countryCodes(state.lastSeasonSummary),firstCountry=countries.find(function(code){return vacancies.some(function(item){return item.country===code;});})||state.playerCountry||countries[0],selected=countries.includes(country)?country:firstCountry,selectedTier=tier==='tier2'?'tier2':'tier1';
    if(!tier&&!vacancies.some(function(item){return item.country===selected&&item.nextTier===selectedTier;})&&vacancies.some(function(item){return item.country===selected&&item.nextTier==='tier2';}))selectedTier='tier2';
    var list=vacancies.filter(function(item){return item.country===selected&&item.nextTier===selectedTier;}),applications=market.applications||{},meta=countryMeta(selected),countryTabs=countries.map(function(code){var count=vacancies.filter(function(item){return item.country===code;}).length,m=countryMeta(code);return '<button class="ll-job-country-tab '+(code===selected?'active':'')+'" onclick="llRenderVacantManagerJobs(\''+code+'\',\''+selectedTier+'\')"><span>'+escapeHtml(m.flag||'🌍')+' '+escapeHtml(m.country||code)+'</span><b>'+count+'</b></button>';}).join(''),tierTabs=['tier1','tier2'].map(function(t){var count=vacancies.filter(function(item){return item.country===selected&&item.nextTier===t;}).length;return '<button class="ll-job-tier-tab '+(t===selectedTier?'active':'')+'" onclick="llRenderVacantManagerJobs(\''+selected+'\',\''+t+'\')"><span>'+escapeHtml(leagueLabel(selected,t))+'</span><b>'+count+' boşluk</b></button>';}).join(''),cards=list.map(function(item){return vacancyCard(item,applications[item.team]);}).join('')||'<div class="ll-job-empty"><div>✓</div><b>'+escapeHtml(meta.country||selected)+' · '+escapeHtml(leagueLabel(selected,selectedTier))+' içinde boş kulüp yok</b><span>Bu ligde hiçbir yönetim teknik direktör değişikliği eşiğine ulaşmadı.</span></div>';
    llArea().innerHTML='<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Teknik Direktör <em>Kariyer Merkezi</em></div><div class="ll-muted">Sezon '+market.season+' sonrası · Gelen teklifler garanti, boş kulüp başvuruları yönetim değerlendirmesine tabidir</div></div><button class="ll-btn" onclick="llRenderSeasonEnd()">← Sezon Sonu</button></div>'+navHtml('vacancies',market)+'<div class="ll-job-hero"><div><span class="ll-rarity">FM TARZI İŞ PAZARI</span><h2>'+vacancies.length+' kulüpte teknik direktör koltuğu boş</h2><p>Ülke ve ligleri gez, uygun gördüğün kulübe başvur. Yönetim itibarını, son sezonunu, başarılarını, kariyer sıçramanı ve ülke uyumunu ayrı ayrı raporlar.</p></div><div class="ll-job-hero-badge">🪑</div></div><div class="ll-metrics"><div class="ll-metric"><strong>'+vacancies.length+'</strong><span>Toplam boş kulüp</span></div><div class="ll-metric"><strong>'+Object.keys(applications).length+'</strong><span>Yaptığın başvuru</span></div><div class="ll-metric"><strong>'+Object.values(applications).filter(function(item){return item.accepted;}).length+'</strong><span>Kabul edilen</span></div><div class="ll-metric"><strong>'+llManagerProfile(state).reputation+'/100</strong><span>Menajer itibarı</span></div></div><div class="ll-job-country-tabs">'+countryTabs+'</div><div class="ll-job-tier-tabs">'+tierTabs+'</div><div class="ll-card-title" style="margin:15px 0 10px">'+escapeHtml(meta.flag||'')+' '+escapeHtml(meta.country||selected)+' · '+escapeHtml(leagueLabel(selected,selectedTier))+'</div><div class="ll-job-list">'+cards+'</div>'+applicationCriteriaTable()+vacancyRulesTable()+'</div></div>';
  }

  function closeReport(){document.getElementById('ll-job-report-backdrop')?.remove();document.body?.classList.remove('ll-cinematic-open');}
  function showReport(team){
    var state=globalThis.lexLeague?.state,market=state?.managerMarket,application=market?.applications?.[team],vacancy=(market?.vacancies||[]).find(function(item){return item.team===team;});
    if(!state||!market||!application||!vacancy)return;
    closeReport();injectStyles();document.body.classList.add('ll-cinematic-open');
    var rows=application.criteria.map(function(item){return '<div class="ll-job-criterion"><div><b>'+escapeHtml(item.label)+'</b><div class="detail">'+escapeHtml(item.current)+' · Gereken: '+escapeHtml(item.required)+'</div></div><div class="detail">'+escapeHtml(item.detail)+'</div><div class="points">'+item.points+'/'+item.weight+'</div><div class="ll-job-pass '+(item.pass?'yes':'no')+'">'+(item.pass?'GEÇTİ':'KALDI')+'</div></div>';}).join(''),sign=application.accepted?'<button class="ll-btn gold" onclick="llAcceptVacantClub(decodeURIComponent(\''+teamArg(team)+'\'))">Sözleşmeyi İmzala</button>':'';
    document.body.insertAdjacentHTML('beforeend','<div class="ll-job-report-backdrop" id="ll-job-report-backdrop" role="dialog" aria-modal="true"><div class="ll-job-report"><div class="ll-job-report-head"><div><span class="ll-rarity">YÖNETİM DEĞERLENDİRME RAPORU</span><h2>'+escapeHtml(team)+'</h2><div class="ll-sub">'+starText(vacancy.stars)+' · '+escapeHtml(vacancy.nextLeagueLabel)+' · Başvuru puanı '+application.totalScore+'/'+application.requiredScore+'</div></div><button class="ll-btn" onclick="llCloseVacantJobReport()">✕ Kapat</button></div><div class="ll-job-decision '+(application.accepted?'accepted':'rejected')+'"><b>'+(application.accepted?'✓ BAŞVURU KABUL EDİLDİ':'✕ BAŞVURU REDDEDİLDİ')+'</b><br>'+escapeHtml(application.boardDecision)+(application.urgencyDiscount?'<br><small>Kulübün acil teknik direktör ihtiyacı kabul barajını '+application.urgencyDiscount+' puan düşürdü.</small>':'')+'</div><div class="ll-job-criteria">'+rows+'</div><div class="ll-job-report-actions"><button class="ll-btn" onclick="llCloseVacantJobReport()">Listeye Dön</button>'+sign+'</div></div></div>');
  }
  function apply(team){
    var state=globalThis.lexLeague?.state,market=state&&typeof globalThis.llEnsureManagerMarket==='function'?llEnsureManagerMarket(state):state?.managerMarket;if(!state||!market||market.status!=='pending')return;
    ensureJobMarket(state,market);var vacancy=(market.vacancies||[]).find(function(item){return item.team===team;});if(!vacancy)return;
    if(!market.applications[team]){market.applications[team]=applicationEvaluation(state,market,vacancy);if(typeof globalThis.llSave==='function')llSave();}
    showReport(team);
  }
  function accept(team){
    var state=globalThis.lexLeague?.state,market=state?.managerMarket,application=market?.applications?.[team],vacancy=(market?.vacancies||[]).find(function(item){return item.team===team;});
    if(!state||!market||market.status!=='pending'||!application?.accepted||!vacancy)return;
    var target=typeof globalThis.llManagerOffer==='function'?llManagerOffer(state,state.lastSeasonSummary,team,'application'):{team:team,stars:vacancy.stars,nextLeagueLabel:vacancy.nextLeagueLabel,targetLabel:vacancy.targetLabel,europe:'Avrupa durumu belirlenecek',kind:'application'},fromTeam=market.fromTeam,refundPreview=typeof globalThis.llV2StarUpgradeRefundPreview==='function'?llV2StarUpgradeRefundPreview(state,fromTeam):{refundLp:0,refundableSpentLp:0},refundText=refundPreview.refundLp?' Ayrılık nedeniyle '+refundPreview.refundableSpentLp+' LP yıldız yatırımının yarısı olan '+refundPreview.refundLp+' LP iade edilecek.':'';
    if(!confirm(team+' kulübü başvurunu kabul etti. Sözleşmeyi imzalayıp takımı devralmak istiyor musun?'+refundText))return;
    var refund=typeof globalThis.llV2SettleStarUpgradeRefund==='function'?llV2SettleStarUpgradeRefund(state,fromTeam,team):{refundLp:0,refundableSpentLp:0};
    market.status='chosen';market.selectedTeam=team;market.switched=team!==fromTeam;market.selectedKind='application';market.chosenAt=new Date().toISOString();market.starUpgradeRefundLp=refund.refundLp||0;market.starUpgradeRefundSpentLp=refund.refundableSpentLp||0;market.selectedApplicationScore=application.totalScore;
    var profile=typeof globalThis.llManagerProfile==='function'?llManagerProfile(state):(state.managerProfile||{history:[]});if(!Array.isArray(profile.history))profile.history=[];
    profile.history.push({season:market.season,from:fromTeam,to:team,kind:'application',fired:market.fired,winRate:market.winRate,reputation:profile.reputation,applicationScore:application.totalScore,starUpgradeRefundLp:market.starUpgradeRefundLp});profile.currentTeam=team;
    state.lastSeasonSummary.nextManagerTeam=team;state.playerTeam=team;
    if(typeof globalThis.llMLCountryForTeam==='function')state.playerCountry=llMLCountryForTeam(team,state)||state.playerCountry;
    if(typeof globalThis.llMLAttachLegacyAliases==='function')llMLAttachLegacyAliases(state);
    if(typeof globalThis.llSave==='function')llSave();closeReport();if(typeof globalThis.llRenderSeasonEnd==='function')llRenderSeasonEnd();
    if(typeof globalThis.llShowManagerSigning==='function')requestAnimationFrame(function(){llShowManagerSigning({...target,kind:'application',starUpgradeRefundLp:market.starUpgradeRefundLp},false,fromTeam);});
  }

  if(typeof globalThis.llEnsureManagerMarket==='function'){
    var ensureBase=globalThis.llEnsureManagerMarket;
    globalThis.llEnsureManagerMarket=function(state){var market=ensureBase.apply(this,arguments);return ensureJobMarket(state||globalThis.lexLeague?.state,market);};
  }
  if(typeof globalThis.llRenderManagerMarket==='function'){
    var renderMarketBase=globalThis.llRenderManagerMarket;
    globalThis.llRenderManagerMarket=function(){var result=renderMarketBase.apply(this,arguments);injectStyles();var state=globalThis.lexLeague?.state;if(state?.managerMarket)ensureJobMarket(state,state.managerMarket);injectOfferNavigation();return result;};
  }
  if(typeof globalThis.llV2RepairState==='function'){
    var repairBase=globalThis.llV2RepairState;
    globalThis.llV2RepairState=function(state){state=repairBase.apply(this,arguments);if(state)ensureSecurity(state);return state;};
  }

  globalThis.llRenderVacantManagerJobs=renderVacantJobs;
  globalThis.llApplyForVacantClub=apply;
  globalThis.llShowVacantJobReport=showReport;
  globalThis.llCloseVacantJobReport=closeReport;
  globalThis.llAcceptVacantClub=accept;
  globalThis.llBuildManagerVacancies=buildVacancies;
  globalThis.llEvaluateManagerApplication=applicationEvaluation;
  globalThis.LL_MANAGER_JOB_MARKET_VERSION=LL_MANAGER_JOB_MARKET_VERSION;
  injectStyles();
  if(globalThis.lexLeague?.state)ensureSecurity(lexLeague.state);
})();
