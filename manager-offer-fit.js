/* Manager market fit v1: offers are scored, never padded to an arbitrary count. */
(function(){
  'use strict';
  const VERSION=4;
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  /* Reads legacy double-encoded UI values without changing valid text. */
  const readable=value=>{
    const text=String(value??'');
    if(!/[ÃÂÅâ]/.test(text))return text;
    try{return decodeURIComponent(escape(text));}catch{return text;}
  };
  const esc=value=>typeof globalThis.llEscape==='function'?llEscape(readable(value)):readable(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const countries=()=>globalThis.LL_COUNTRY_CODES||['TUR','ENG','DEU','ESP','FRA','ITA','NLD'];
  const meta=country=>typeof globalThis.llMLCountryMeta==='function'?llMLCountryMeta(country):{country:String(country||''),flag:''};
  const leagueLabel=(country,tier)=>typeof globalThis.llMLLeagueLabel==='function'?llMLLeagueLabel(country,tier):tier==='tier1'?'Üst Lig':'2. Lig';
  const teamStars=(state,team)=>typeof globalThis.llV2TeamStarsInState==='function'?number(llV2TeamStarsInState(state,team),1):number(state?.teams?.[team]?.stars,1);
  const hash=value=>typeof globalThis.llManagerHash==='function'?number(llManagerHash(String(value)),0):String(value).split('').reduce((a,ch)=>((a*33)^ch.charCodeAt(0))>>>0,5381);

  function seasonRows(summary,country,tier){return summary?.leagueRows?.[country]?.[tier]||[];}
  function qualification(summary,country,team){
    const q=summary?.countrySummaries?.[country]?.qualifications||{};
    if((q.ucl||[]).includes(team))return 'Şampiyonlar Ligi';
    if((q.uel||[]).includes(team))return 'Avrupa Ligi';
    if((q.uecl||[]).includes(team))return 'Konferans Ligi';
    return 'Avrupa bileti yok';
  }
  function expectedRank(stars,tier,size){
    const table=tier==='tier2'?[2,4,7,10,13,16]:[3,5,8,10,13,15];
    const base=table[clamp(number(stars,1),1,6)-1];
    return clamp(Math.round(base*(Math.max(12,number(size,18))/18)),1,Math.max(1,number(size,18)));
  }
  function candidateStatus(item){
    const pos=number(item.position,item.teamCount), expected=expectedRank(item.stars,item.tier,item.teamCount);
    const gap=pos-expected;
    const relegated=!!item.relegated;
    const crisis=relegated||gap>=Math.max(4,Math.round(item.teamCount*.22))||(item.stars>=5&&pos>=Math.ceil(item.teamCount*.58));
    return {expected,gap,relegated,crisis,underperformed:gap>=3};
  }
  function targetFor(item){
    const name=leagueLabel(item.country,item.nextTier),pos=item.position,size=item.teamCount,stars=item.stars,status=candidateStatus(item);
    if(item.nextTier==='tier2'){
      if(stars>=5)return pos<=3?`${name}'den doğrudan yüksel`:`${name}'de Play-Off bileti al`;
      if(stars===4)return status.relegated?`${name}'de ilk 6'ya gir`:`${name}'de Play-Off bileti al`;
      if(stars===3)return pos<=8?`${name}'de ilk 10 içinde bitir`:`${name}'de kalıcı ol`;
      return `${name}'de kümede kal`;
    }
    if(stars>=6){
      if(pos<=3&&!status.underperformed)return `${name} şampiyonu ol`;
      return status.crisis?`${name}'de ilk 4 içinde bitir`:`${name}'de Şampiyonlar Ligi bileti al`;
    }
    if(stars===5){
      if(pos<=4&&!status.underperformed)return `${name}'de ilk 3 içinde bitir`;
      return status.crisis?`${name}'de ilk 6 içinde bitir`:`${name}'de Avrupa bileti al`;
    }
    if(stars===4){
      /* 4★ club is not automatically a top-three favourite in a major league. */
      if(status.crisis)return `${name}'de ilk 10 içinde bitir`;
      if(pos<=5)return `${name}'de Avrupa bileti al`;
      return `${name}'de ilk 8 içinde bitir`;
    }
    if(stars===3)return pos<=7?`${name}'de ilk 10 içinde bitir`:`${name}'de kümede kal`;
    return `${name}'de kümede kal`;
  }
  /* Goal labels are stored in season data too, so normalize before saving. */
  const targetForRaw=targetFor;
  targetFor=function(item){return readable(targetForRaw(item));};
  function managerFacts(state,summary,performance,profile){
    const country=state.playerCountry||typeof globalThis.llMLCountryForTeam==='function'&&llMLCountryForTeam(performance.from,state)||'TUR';
    const cupWinner=summary?.countrySummaries?.[country]?.cupWinner||summary?.cupWinner;
    const cupChampion=cupWinner===performance.from;
    const baseRep=number(profile?.reputation,50);
    let effective=baseRep;
    try{if(typeof globalThis.effectiveReputation==='function')effective=number(effectiveReputation(state,baseRep),baseRep);}catch{}
    /* Technical-director development belongs to the career, not the club.
       Its small +0..6 contribution complements, never replaces, results and reputation. */
    const boardAdjustedReputation=effective;
    let developmentLevel=number(state?.clubFacility?.level,0);
    try{if(typeof globalThis.llFacilityLevel==='function')developmentLevel=number(llFacilityLevel(state),developmentLevel);}catch{}
    developmentLevel=clamp(Math.floor(developmentLevel),0,6);
    const developmentBonus=developmentLevel;
    effective=clamp(boardAdjustedReputation+developmentBonus,0,100);
    const score=clamp(
      (number(performance.winRate)-40)*.7+
      (performance.primaryAchieved?9:0)+
      (performance.superChampion?15:0)+
      (cupChampion?12:(performance.cupFinal?6:0))+
      (performance.europeTrophy?18:(performance.europeSuccess?8:0))+
      (effective-35)*.45-
      (performance.superRelegated?13:0),0,100);
    const reasons=[];
    if(performance.superChampion)reasons.push('Lig şampiyonluğu');
    if(cupChampion)reasons.push('Yerel kupa şampiyonluğu');
    else if(performance.cupFinal)reasons.push('Yerel kupa finali');
    if(performance.europeTrophy)reasons.push('Avrupa kupası zaferi');
    else if(performance.europeSuccess)reasons.push('Avrupa’da yarı final/final');
    if(number(performance.winRate)>=55)reasons.push(`%${Math.round(number(performance.winRate))} lig galibiyet oranı`);
    if(performance.primaryAchieved)reasons.push('Ana kulüp hedefi başarısı');
    if(developmentLevel>0)reasons.push(`Teknik Direktör Gelişimi Sv. ${developmentLevel}/6 (+${developmentBonus} teklif profili)`);
    return {country,cupChampion,effective,score,reasons,baseReputation:baseRep,boardAdjustedReputation,developmentLevel,developmentBonus};
  }
  function collectCandidates(state,summary,performance){
    const out=[];
    for(const country of countries())for(const tier of ['tier1','tier2']){
      const rows=seasonRows(summary,country,tier);
      const info=summary?.countrySummaries?.[country]||{};
      rows.forEach((row,index)=>{
        const team=row?.team;
        if(!team||team===performance.from||(typeof globalThis.llIsReserveTeam==='function'&&llIsReserveTeam(team)))return;
        const promoted=(info.promoted||[]).includes(team),relegated=(info.relegated||[]).includes(team);
        const nextTier=promoted?'tier1':relegated?'tier2':tier;
        out.push({team,country,tier,nextTier,stars:teamStars(state,team),position:index+1,teamCount:rows.length,promoted,relegated,row});
      });
    }
    return out;
  }
  function allowedCandidate(item,currentStars,manager,fired){
    const status=candidateStatus(item),lowerGap=currentStars-item.stars;
    /* A successful established coach does not get a random 1–2★ lower-tier filler offer. */
    if(!fired&&manager.score>=55&&item.stars<=2)return false;
    if(!fired&&currentStars>=4&&item.nextTier==='tier2'&&item.stars<=2)return false;
    /* A relegated, close-strength project remains plausible; ordinary large drops do not. */
    if(!fired&&lowerGap>=2&&!status.crisis)return false;
    if(!fired&&lowerGap>=3)return false;
    if(item.stars===6&&manager.score<63)return false;
    if(item.stars===5&&manager.score<48)return false;
    if(item.stars>currentStars+2&&manager.score<78)return false;
    if(fired&&item.stars>Math.max(3,currentStars))return false;
    return true;
  }
  function classify(item,currentStars){
    const status=candidateStatus(item);
    if(status.crisis&&(item.stars>=Math.max(3,currentStars-1)||item.relegated))return item.relegated?'rebuild':'crisis';
    if(item.nextTier==='tier2'&&item.stars>=currentStars-1)return 'challenge';
    if(item.stars>currentStars)return 'prestige';
    if(item.stars===currentStars)return 'progress';
    return 'safe';
  }
  function kindLabel(kind){return ({prestige:'PRESTİJ TEKLİFİ',progress:'GELİŞİM TEKLİFİ',safe:'GÜVENLİ TEKLİF',rebuild:'YENİDEN YAPILANMA PROJESİ',crisis:'KRİZ KULÜBÜ',challenge:'ZORLU MEYDAN OKUMA',stay:'MEVCUT KULÜP'})[kind]||'TEKLİF';}
  function fitScore(item,currentStars,manager){
    const status=candidateStatus(item),gap=item.stars-currentStars,prestige={TUR:2,ENG:8,ESP:7,ITA:7,DEU:7,FRA:5,NLD:4}[item.country]||3;
    /* The market should value NEXT SEASON European qualification, not just a club's name.
       UCL qualifiers get a meaningful premium; UEL/UECL remain progressively smaller bonuses. */
    const europeLabel=qualification(manager.summary,item.country,item.team);
    const europe={
      'Şampiyonlar Ligi':15,
      'Avrupa Ligi':8,
      'Konferans Ligi':4
    }[europeLabel]||0;
    /* Successful league finishes deserve extra market pull on top of the European ticket. */
    const leagueFinish=item.nextTier==='tier1'?(item.position===1?5:item.position===2?3:0):0;
    /* Crisis projects stay attractive, but no longer dominate successful UCL-qualified clubs. */
    const rebuild=status.crisis?(item.stars>=4?10:6):0;
    const tier=(item.nextTier==='tier1'?8:0)+(item.relegated?3:0);
    const starFit=gap>=0?gap*7:-Math.abs(gap)*5;
    return manager.score*.28+prestige+rebuild+europe+leagueFinish+tier+starFit+(status.underperformed?3:0);
  }
  function offerFrom(state,summary,item,kind,manager){
    const base=typeof globalThis.llManagerOffer==='function'?llManagerOffer(state,summary,item.team,kind):{};
    const status=candidateStatus(item),rankText=`${leagueLabel(item.country,item.tier)}'i ${item.position}. bitirdi`;
    const clubReason=status.relegated?`${rankText}; küme düştü ve hızlı dönüş için yeni teknik direktör arıyor.`:
      status.crisis?`${rankText}; ${item.stars}★ seviyesine göre beklentinin altında kaldı ve yeniden yapılanma istiyor.`:
      `${rankText}; gelecek sezon hedefi için yönetim kadrosunu güçlendirmek istiyor.`;
    const managerReason=manager.reasons.slice(0,3).join(' · ')||`%${Math.round(number(manager.performance.winRate))} lig galibiyet oranı`;
    return {...base,team:item.team,country:item.country,stars:item.stars,kind,kindLabel:kindLabel(kind),position:item.position,
      nextLeague:item.nextTier==='tier1'?'super':'first',nextLeagueLabel:`${meta(item.country).country} · ${leagueLabel(item.country,item.nextTier)}`,
      lastLeagueLabel:`${meta(item.country).country} · ${leagueLabel(item.country,item.tier)}`,
      movement:item.promoted?`${leagueLabel(item.country,'tier1')} ligine yükseldi`:item.relegated?`${leagueLabel(item.country,'tier2')} ligine düştü`:'Liginde kaldı',
      targetLabel:targetFor(item),europe:qualification(summary,item.country,item.team),whyManager:managerReason,whyClub:clubReason,
      riskLabel:status.crisis?'Risk yüksek: hedef düşürüldü; hızlı toparlanma bekleniyor.':item.nextTier==='tier2'?'Yükselme yarışı ve daha dar hata payı.':'Kulüp hedefi mevcut güç ve son sezon performansına göre belirlendi.',
      fitVersion:VERSION,fitScore:Math.round(fitScore(item,teamStars(state,manager.performance.from),manager))};
  }
  function buildOffers(state,summary,performance,profile,fired){
    const manager=managerFacts(state,summary,performance,profile);manager.summary=summary;manager.performance=performance;
    const currentStars=teamStars(state,performance.from);
    const maxOffers=fired?2:manager.effective>=82?6:manager.effective>=68?5:manager.effective>=54?4:manager.effective>=40?3:2;
    const candidates=collectCandidates(state,summary,performance).filter(item=>allowedCandidate(item,currentStars,manager,fired));
    const seed=`${summary?.season||state.season}|${performance.from}|fit-v${VERSION}`;
    const sorted=candidates.sort((a,b)=>fitScore(b,currentStars,manager)-fitScore(a,currentStars,manager)||hash(a.team+seed)-hash(b.team+seed));
    const offers=[],countryCounts=new Map();
    for(const item of sorted){
      if(offers.length>=maxOffers)break;
      const count=countryCounts.get(item.country)||0;
      if(count>=2)continue;
      const kind=classify(item,currentStars);
      offers.push(offerFrom(state,summary,item,kind,manager));countryCounts.set(item.country,count+1);
    }
    return {offers,progression:offers.some(item=>item.kind==='progress'||item.kind==='prestige'),prestige:offers.some(item=>item.kind==='prestige'),promotionStarCap:false,
      offerCountTarget:maxOffers,offerCountActual:offers.length,effectiveReputation:manager.effective,baseReputation:manager.baseReputation,boardAdjustedReputation:manager.boardAdjustedReputation,
      developmentLevel:manager.developmentLevel,developmentBonus:manager.developmentBonus,managerFitVersion:VERSION};
  }
  function installOfferRenderer(){
    const base=globalThis.llManagerOfferHtml;
    if(typeof base!=='function'||base.__fitRenderer)return;
    const renderer=function(offer,canChoose=true){
      if(!offer?.fitVersion)return base(offer,canChoose);
      const color=offer.kind==='prestige'?'rgba(234,179,8,.8)':/rebuild|crisis/.test(offer.kind)?'rgba(249,115,22,.8)':offer.kind==='challenge'?'rgba(168,85,247,.7)':'rgba(45,212,191,.55)';
      const logo=typeof globalThis.llTeamLogo==='function'?llTeamLogo(offer.team,'match'):'';
      const stars=typeof globalThis.llStars==='function'?llStars(offer.stars):`${offer.stars}★`;
       const teamArgument=JSON.stringify(String(offer.team||'')).replace(/"/g,'&quot;');
       const button=canChoose?`<button class="ll-btn ${offer.kind==='prestige'?'gold':'primary'}" style="width:100%;margin-top:13px" onclick="llChooseManagerOffer(${teamArgument})">Teklifi Kabul Et</button>`:'';
      return `<div class="ll-offer ll-fit-offer" style="border-color:${color}"><div class="ll-rarity">${esc(offer.kindLabel||kindLabel(offer.kind))}</div><div style="display:flex;align-items:center;gap:10px;margin:9px 0"><div style="width:45px">${logo}</div><div><div class="ll-team-name">${esc(offer.team)}</div><div class="ll-stars">${stars}</div></div></div><div class="ll-sub"><b>Son sezon:</b> ${esc(offer.lastLeagueLabel)} · ${number(offer.position)||'—'}. sıra · ${esc(offer.movement)}<br><b>Gelecek sezon:</b> ${esc(offer.nextLeagueLabel)}<br><b>Yönetim hedefi:</b> ${esc(offer.targetLabel)}<br><b>Avrupa:</b> ${esc(offer.europe)}</div><div class="ll-fit-reason"><b>Neden sen?</b> ${esc(offer.whyManager)}<br><b>Kulüp durumu:</b> ${esc(offer.whyClub)}<br><b>Proje notu:</b> ${esc(offer.riskLabel)}</div>${button}</div>`;
    };
    renderer.__fitRenderer=true;globalThis.llManagerOfferHtml=renderer;
  }
  /* Club goals must reflect both club strength and its latest season. This wrapper
     is used for the real next-season target object, not only offer-card text. */
  function realisticTargetOptions(state,name,league,stars){
    const previous=typeof globalThis.llV2PreviousTeamContext==='function'?llV2PreviousTeamContext(state,name):null;
    const tier=previous?.tier||(league==='super'?'tier1':'tier2');
    const size=state?.leagues?.[previous?.country||state?.playerCountry||'TUR']?.[tier]?.length||20;
    const item={name,team:name,country:previous?.country||state?.playerCountry||'TUR',tier,nextTier:tier,stars:number(stars,1),position:number(previous?.position,expectedRank(stars,tier,size)),teamCount:size,promoted:!!previous?.promoted,relegated:!!previous?.relegated};
    const reward=(ap,lp)=>({ap,lp});
    const target=targetFor(item),status=candidateStatus(item);
    if(tier==='tier2'){
      if(item.stars>=5)return [{type:'direct_promote',label:target,reward:reward(160,210)}];
      if(item.stars===4)return [{type:'playoff',label:target,reward:reward(130,125)}];
      if(item.stars===3)return [{type:'league_position',value:10,label:target,reward:reward(115,95)}];
      if(item.stars===2)return [{type:'league_position',value:14,label:target,reward:reward(105,75)}];
      return [{type:'first_survive',label:target,reward:reward(100,65)}];
    }
    if(item.stars>=6)return [{type:status.crisis?'league_position':'champion',value:status.crisis?4:undefined,label:target,reward:reward(status.crisis?185:230,status.crisis?195:250)}];
    if(item.stars===5)return [{type:status.crisis?'league_position':item.position<=4?'league_position':'europe',value:status.crisis?6:item.position<=4?3:undefined,label:target,reward:reward(180,185)}];
    if(item.stars===4)return [{type:status.crisis?'league_position':item.position<=5?'europe':'league_position',value:status.crisis?10:item.position<=5?undefined:8,label:target,reward:reward(155,145)}];
    if(item.stars===3)return [{type:item.position<=7?'league_position':'survive',value:item.position<=7?10:undefined,label:target,reward:reward(130,105)}];
    return [{type:'survive',label:target,reward:reward(115,85)}];
  }
  function installRealisticTargets(){
    const baseOptions=globalThis.llV2ContextualTeamTargetOptions;
    if(typeof baseOptions!=='function'||baseOptions.__managerFitV1)return;
    const options=function(state,name,league,stars){
      try{return realisticTargetOptions(state,name,league,stars);}catch{return baseOptions(state,name,league,stars);}
    };
    options.__managerFitV1=true;globalThis.llV2ContextualTeamTargetOptions=options;
    const baseCreate=globalThis.llV2CreateTeamSeasonTargets;
    if(typeof baseCreate==='function'&&!baseCreate.__managerFitV1){
      const create=function(state){const targetSet=baseCreate(state);targetSet.managerFitTargetVersion=VERSION;return targetSet;};
      create.__managerFitV1=true;globalThis.llV2CreateTeamSeasonTargets=create;
    }
    const baseEnsure=globalThis.llV2EnsureTeamSeasonTargets;
    if(typeof baseEnsure==='function'&&!baseEnsure.__managerFitV1){
      const ensure=function(state=globalThis.lexLeague?.state){
        if(state?.teamSeasonTargets&&number(state.teamSeasonTargets.managerFitTargetVersion)!==VERSION)state.teamSeasonTargets=null;
        return baseEnsure.apply(this,arguments);
      };
      ensure.__managerFitV1=true;globalThis.llV2EnsureTeamSeasonTargets=ensure;
    }
  }
  /* The base reputation model already rewards a cup winner. Keep the distinction
     explicit: a cup title receives a larger once-per-season manager-market bonus
     than simply reaching the final. */
  function installCupPrestige(){
    const base=globalThis.llManagerEvaluate;
    if(typeof base!=='function'||base.__managerFitV1)return;
    const evaluate=function(state,summary,performance){
      const profile=base.apply(this,arguments);if(!profile)return profile;
      const season=number(summary?.season,state?.season),team=performance?.from||state?.playerTeam;
      const key=`${season}|${team}`,tags=profile.managerFitCupPrestigeTags||(profile.managerFitCupPrestigeTags=[]);
      if(tags.includes(key))return profile;
      const country=state?.playerCountry||managerFacts(state,summary,performance,profile).country;
      const winner=summary?.countrySummaries?.[country]?.cupWinner||summary?.cupWinner;
      const extra=winner===team?2:performance?.cupFinal?1:0;
      if(extra){
        profile.reputation=clamp(number(profile.reputation)+extra,0,100);
        const history=profile.reputationHistory?.[profile.reputationHistory.length-1];
        if(history&&number(history.season)===season){history.delta=number(history.delta)+extra;history.after=profile.reputation;history.reasons=(history.reasons||[]).concat([{points:extra,label:winner===team?'Kupa sampiyonlugu piyasa itibari':'Kupa finali piyasa itibari'}]);}
      }
      tags.push(key);profile.managerFitCupPrestigeTags=tags.slice(-40);return profile;
    };
    evaluate.__managerFitV1=true;globalThis.llManagerEvaluate=evaluate;
  }
  function installMarketScreen(){
    const base=globalThis.llRenderManagerMarket;
    if(typeof base!=='function'||base.__managerFitScreen)return;
    const render=function(){
      const result=base.apply(this,arguments);
      const state=globalThis.lexLeague?.state,market=state?.managerMarket;
      if(!market?.managerFitVersion||typeof document==='undefined')return result;
      const notices=[...document.querySelectorAll('.ll-notice')];
      const oldNotice=notices.find(node=>/Teklif ölçütü|Teklif \u00f6l\u00e7\u00fct\u00fc/.test(node.textContent||''));
      if(oldNotice){
        const actual=number(market.offerCountActual,market.offers?.length||0);
        const possible=number(market.offerCountTarget,actual);
        const level=clamp(number(market.developmentLevel),0,6),bonus=clamp(number(market.developmentBonus),0,6),before=number(market.boardAdjustedReputation,number(market.baseReputation,50)),after=number(market.effectiveReputation,before+bonus);
        const developmentLine=`<br><span class="ll-muted"><b>Teknik Direktör Gelişimi:</b> Sv. ${level}/6 → teklif profiline <b>+${bonus}</b> katkı (${before} → ${after} etkin itibar). Tek başına büyük kulüp eşiğini garanti etmez; başarı, form ve itibarla birlikte değerlendirilir.</span>`;
        const cleanMarketNotice=`<b>Teklif havuzu:</b> Bu sezon profilin ve kul\u00fcplerin durumu ile uyumlu <b>${actual}</b> teklif bulundu (en fazla ${possible}). Say\u0131y\u0131 doldurmak i\u00e7in alakas\u0131z kul\u00fcp eklenmez.<br><span class="ll-muted">Kul\u00fcpler; son lig s\u0131ras\u0131, hedef bask\u0131s\u0131, Avrupa bileti, y\u0131ld\u0131z dengesi, itibar\u0131n ve ba\u015far\u0131lar\u0131n \u00fczerinden karar verir.</span>${developmentLine}`;
        oldNotice.innerHTML=cleanMarketNotice;
      }
      return result;
    };
    render.__managerFitScreen=true;globalThis.llRenderManagerMarket=render;
  }
  function install(){
    if(typeof globalThis.llManagerBuildOffers!=='function'||globalThis.llManagerBuildOffers.__fitV1)return;
    globalThis.llManagerBuildOffers=function(state,summary,performance,profile,fired){return buildOffers(state,summary,performance,profile,fired);};
    globalThis.llManagerBuildOffers.__fitV1=true;
    const ensure=globalThis.llEnsureManagerMarket;
    if(typeof ensure==='function'&&!ensure.__fitV1){
      const wrapped=function(state=globalThis.lexLeague?.state){
        if(state?.managerMarket?.status==='pending'&&number(state.managerMarket.managerFitVersion)!==VERSION)state.managerMarket=null;
        const market=ensure.apply(this,arguments);
        if(market){market.managerFitVersion=VERSION;market.offerCountActual=market.offers?.length||0;}
        return market;
      };
      wrapped.__fitV1=true;globalThis.llEnsureManagerMarket=wrapped;
    }
    installOfferRenderer();
    installRealisticTargets();
    installCupPrestige();
    installMarketScreen();
    if(typeof document!=='undefined'&&!document.getElementById('ll-manager-fit-style')){
      const style=document.createElement('style');style.id='ll-manager-fit-style';style.textContent='.ll-fit-reason{margin-top:10px;padding:9px 10px;border-radius:9px;background:rgba(8,18,34,.72);border:1px solid rgba(45,212,191,.22);font-size:11px;line-height:1.5;color:#cbd5e1}.ll-fit-reason b{color:#5eead4}.ll-fit-offer{min-width:250px}';document.head.appendChild(style);
    }
  }
  install();
})();
