/* TEAM_STAR_DECLINE_SYSTEM_START */
/*
 * Controlled club-star decline.
 * - Direct top-flight relegation: -1 star.
 * - Two consecutive severe underperformances: -1 star.
 * - Domestic / European cup wins reset the consecutive-underperformance counter.
 * - Newly promoted clubs are exempt from the top-flight counter in their first season.
 * - At most one star can be lost per season; minimum is 1 star.
 * - AI clubs fully adopt the new star's die range.
 * - For the player's club, the die that completed the lost star is rolled back and
 *   50% of that die's LP cost is refunded. Other paid die progress is preserved.
 */
(function(){
  'use strict';

  var LL_TEAM_STAR_DECLINE_VERSION=1;
  var LL_DIE_PROGRESSION_ABSOLUTE_VERSION=2;
  var LL_STAR_DECLINE_UPPER_RATES={3:.8,4:.7,5:.6,6:.5};
  var LL_STAR_DECLINE_POSITIONS=typeof LL_POSITIONS!=='undefined'&&Array.isArray(LL_POSITIONS)
    ?LL_POSITIONS
    :['Kaleci','Orta Saha','Forvet'];

  function clampStar(value){return Math.max(1,Math.min(6,Math.round(Number(value)||1)));}
  function deep(value){try{return JSON.parse(JSON.stringify(value));}catch(_error){return value;}}
  function escapeHtml(value){
    if(typeof llEscape==='function')return llEscape(value);
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function rangeText(star){return typeof llRangeText==='function'?llRangeText(clampStar(star)):String(clampStar(star))+'★';}

  /*
   * Existing saves store only `baseStar + upgraded boolean`. Decline may leave
   * one die below and other dice above the club star, so absolute per-position
   * levels are retained. A Proxy keeps all existing upgrade/cinematic code working.
   */
  function syncUpgradeTarget(team,progress){
    var target=progress.__upgradeTarget;
    if(!target||typeof target!=='object')target={};
    LL_STAR_DECLINE_POSITIONS.forEach(function(position){
      target[position]=clampStar(progress.positionStars[position])>clampStar(team.stars);
    });
    try{Object.defineProperty(progress,'__upgradeTarget',{value:target,writable:true,configurable:true,enumerable:false});}
    catch(_error){progress.__upgradeTarget=target;}
    return target;
  }

  function createUpgradeProxy(team,progress){
    var target=syncUpgradeTarget(team,progress);
    if(typeof Proxy==='undefined')return target;
    return new Proxy(target,{
      get:function(object,property){
        if(LL_STAR_DECLINE_POSITIONS.includes(property)){
          var active=clampStar(progress.positionStars[property])>clampStar(team.stars);
          object[property]=active;
          return active;
        }
        return object[property];
      },
      set:function(object,property,value){
        if(LL_STAR_DECLINE_POSITIONS.includes(property)){
          var clubStar=clampStar(team.stars),current=clampStar(progress.positionStars[property]);
          if(value){
            if(current<=clubStar)progress.positionStars[property]=Math.min(6,clubStar+1);
          }else if(current<=clubStar){
            progress.positionStars[property]=clubStar;
          }
          object[property]=clampStar(progress.positionStars[property])>clubStar;
          return true;
        }
        object[property]=value;
        return true;
      },
      ownKeys:function(object){return Reflect.ownKeys(object);},
      getOwnPropertyDescriptor:function(object,property){
        return Object.getOwnPropertyDescriptor(object,property)||{enumerable:true,configurable:true,writable:true,value:object[property]};
      }
    });
  }

  function ensureAbsoluteProgress(team){
    if(!team)return null;
    team.stars=clampStar(team.stars);
    var progress=team.dieProgression&&typeof team.dieProgression==='object'?team.dieProgression:{};
    var oldBase=clampStar(progress.baseStar||team.stars);
    var oldUpgraded=progress.upgraded&&typeof progress.upgraded==='object'?progress.upgraded:{};
    if(!progress.positionStars||typeof progress.positionStars!=='object'){
      progress.positionStars={};
      LL_STAR_DECLINE_POSITIONS.forEach(function(position){
        progress.positionStars[position]=Math.min(6,oldBase+(oldUpgraded[position]?1:0));
      });
    }
    LL_STAR_DECLINE_POSITIONS.forEach(function(position){
      var level=Number(progress.positionStars[position]);
      progress.positionStars[position]=Number.isFinite(level)?clampStar(level):team.stars;
    });
    var minimum=Math.min.apply(null,LL_STAR_DECLINE_POSITIONS.map(function(position){return progress.positionStars[position];}));
    if(minimum>team.stars){
      /* External baseline migrations may raise all dice together. */
      LL_STAR_DECLINE_POSITIONS.forEach(function(position){progress.positionStars[position]=team.stars;});
    }else if(minimum<team.stars){
      /* Absolute die levels are the authoritative source after this migration. */
      team.stars=clampStar(minimum);
    }
    progress.version=LL_DIE_PROGRESSION_ABSOLUTE_VERSION;
    progress.baseStar=team.stars;
    if(!Array.isArray(progress.history))progress.history=[];
    progress.upgraded=createUpgradeProxy(team,progress);
    team.dieProgression=progress;
    return progress;
  }

  function dieLevel(teamOrName,position){
    var team=typeof teamOrName==='string'&&typeof llTeamState==='function'?llTeamState(teamOrName):teamOrName;
    var progress=ensureAbsoluteProgress(team);
    return progress&&LL_STAR_DECLINE_POSITIONS.includes(position)?clampStar(progress.positionStars[position]):clampStar(team&&team.stars);
  }
  function dieProgressCount(teamOrName){
    var team=typeof teamOrName==='string'&&typeof llTeamState==='function'?llTeamState(teamOrName):teamOrName;
    var progress=ensureAbsoluteProgress(team),base=clampStar(team&&team.stars);
    return progress?LL_STAR_DECLINE_POSITIONS.filter(function(position){return progress.positionStars[position]>base;}).length:0;
  }
  function progressionStatus(team){
    if(!team)return '—';
    if(clampStar(team.stars)>=6)return '6 ★ maks. seviye';
    return dieProgressCount(team)+'/3 zar geliştirildi';
  }
  function progressionPanel(team){
    var progress=ensureAbsoluteProgress(team),base=clampStar(team.stars),done=dieProgressCount(team);
    var cost=typeof llDieProgressionCost==='function'?Number(llDieProgressionCost(team))||0:0,maxed=base>=6;
    var rows=LL_STAR_DECLINE_POSITIONS.map(function(position){
      var level=dieLevel(team,position),ahead=level>base,canUpgrade=!maxed&&!ahead;
      var icon=typeof LL_POSITION_ICONS==='object'?(LL_POSITION_ICONS[position]||'🎲'):'🎲';
      var detail=ahead?rangeText(level)+' aktif':rangeText(base)+' → '+rangeText(Math.min(6,base+1));
      var label=ahead?(level>base+1?'Korunan '+level+'★':'Geliştirildi'):maxed?'Maksimum':'Geliştir';
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07)"><span><b>'+icon+' '+escapeHtml(position)+'</b><small style="display:block;color:var(--text2);margin-top:2px">'+detail+'</small></span><button class="ll-btn '+(canUpgrade?'gold':'')+'" style="padding:7px 10px;font-size:12px"'+(canUpgrade?'':' disabled')+' onclick="llUpgradePositionDie(\''+position+'\')">'+label+(canUpgrade?' · '+cost+' LP':'')+'</button></div>';
    }).join('');
    return '<div class="ll-card" id="ll-die-progression" style="margin-top:12px;border-color:rgba(34,211,238,.38)"><div class="ll-card-title">Zar Gelişimi · '+progressionStatus(team)+'</div><div class="ll-sub" style="margin:6px 0 8px">Her mevki ayrı gelişir. Takım yıldızı, üç zarın ortak ulaştığı en düşük seviyedir. Yıldız düşüşünde korunmuş zar yatırımları kaybolmaz.</div>'+rows+'<div class="ll-muted" style="margin-top:8px">Bu basamak: '+done+'/3 · Her yeni zar gelişimi '+(maxed?'tamamlandı':cost+' LP')+'.</div></div>';
  }

  /* Replace only progression helpers. Existing purchase, cinematic and achievement wrappers remain intact. */
  globalThis.llDieProgressionEnsureTeam=ensureAbsoluteProgress;
  globalThis.llDieProgressionForTeam=function(teamOrName){
    return ensureAbsoluteProgress(typeof teamOrName==='string'&&typeof llTeamState==='function'?llTeamState(teamOrName):teamOrName);
  };
  globalThis.llDieProgressionStar=dieLevel;
  globalThis.llDieProgressionCount=dieProgressCount;
  globalThis.llDieProgressionRangeText=function(teamOrName,position){return rangeText(dieLevel(teamOrName,position));};
  globalThis.llDieProgressionStatusText=progressionStatus;
  globalThis.llDieProgressionPanelHtml=progressionPanel;

  function ensureLedger(state){
    if(!state)return null;
    var ledger=state.teamStarDecline&&typeof state.teamStarDecline==='object'?state.teamStarDecline:{};
    ledger.version=LL_TEAM_STAR_DECLINE_VERSION;
    if(!ledger.clubs||typeof ledger.clubs!=='object')ledger.clubs={};
    if(!Array.isArray(ledger.history))ledger.history=[];
    if(!ledger.seasons||typeof ledger.seasons!=='object')ledger.seasons={};
    state.teamStarDecline=ledger;
    return ledger;
  }
  function clubLedger(ledger,name){
    var club=ledger.clubs[name]&&typeof ledger.clubs[name]==='object'?ledger.clubs[name]:{};
    club.badCount=Math.max(0,Math.min(1,Number(club.badCount)||0));
    club.mode=club.mode||null;
    club.lastSeason=Math.max(0,Number(club.lastSeason)||0);
    if(!Array.isArray(club.history))club.history=[];
    ledger.clubs[name]=club;
    return club;
  }
  function upperThreshold(stars,teamCount){
    var rate=LL_STAR_DECLINE_UPPER_RATES[clampStar(stars)];
    if(!rate)return null;
    return Math.max(1,Math.min(Number(teamCount)||1,Math.ceil((Number(teamCount)||1)*rate)));
  }
  function previousPromotionSet(state,season,country){
    var previous=(state.seasonHistory||[]).find(function(item){return Number(item.season)===Number(season)-1;});
    if(!previous)return new Set();
    var info=previous.countrySummaries&&previous.countrySummaries[country];
    var names=info&&Array.isArray(info.promoted)?info.promoted:(country===(previous.country||state.playerCountry||'TUR')?previous.promoted:[]);
    return new Set(names||[]);
  }
  function seasonCountries(state,summary){
    if(summary.countrySummaries&&typeof summary.countrySummaries==='object')return Object.entries(summary.countrySummaries);
    var country=summary.country||state.playerCountry||'TUR';
    return [[country,{
      tier1Rows:summary.tier1Rows||summary.superRows||[],
      tier2Rows:summary.tier2Rows||summary.firstRows||[],
      relegated:summary.relegated||[],promoted:summary.promoted||[],cupWinner:summary.cupWinner||null,
      rules:{playoffTo:7}
    }]];
  }
  function trophyWinners(state,summary,countries){
    var winners=new Set();
    countries.forEach(function(pair){var info=pair[1];if(info&&info.cupWinner)winners.add(info.cupWinner);});
    if(summary.cupWinner)winners.add(summary.cupWinner);
    ['ucl','uel','uecl'].forEach(function(type){if(summary.champions&&summary.champions[type])winners.add(summary.champions[type]);});
    if(state.europe&&state.europe.winner)winners.add(state.europe.winner);
    (state.trophies||[]).filter(function(item){return Number(item&&item.season)===Number(summary.season)&&/Kupa|Şampiyonlar|Avrupa Ligi|Konferans/i.test(String(item&&item.name||''));}).forEach(function(){if(state.playerTeam)winners.add(state.playerTeam);});
    return winners;
  }
  function lastPaidCompletionUpgrade(team,oldStars){
    var progress=ensureAbsoluteProgress(team),history=progress&&progress.history||[];
    for(var index=history.length-1;index>=0;index--){
      var entry=history[index];
      if(entry&&entry.type==='die-upgrade'&&Number(entry.toStar)===Number(oldStars)&&LL_STAR_DECLINE_POSITIONS.includes(entry.position)&&dieLevel(team,entry.position)===oldStars){
        return entry;
      }
    }
    return null;
  }
  function pushProgressHistory(team,entry){
    var progress=ensureAbsoluteProgress(team);
    progress.history.push(entry);
    progress.history=progress.history.slice(-60);
  }
  function applyStarLoss(state,name,reason,context){
    var team=state.teams&&state.teams[name];
    if(!team)return null;
    var fromStars=clampStar(team.stars);
    if(fromStars<=1)return null;
    var toStars=fromStars-1,isPlayer=name===state.playerTeam,progress=ensureAbsoluteProgress(team);
    var refundLp=0,rolledBackPosition=null,paidEntry=null;

    if(isPlayer)paidEntry=lastPaidCompletionUpgrade(team,fromStars);
    if(isPlayer&&paidEntry){
      rolledBackPosition=paidEntry.position;
      progress.positionStars[rolledBackPosition]=toStars;
      team.stars=toStars;
      refundLp=Math.floor(Math.max(0,Number(paidEntry.costLp)||Number(typeof LL_DIE_PROGRESSION_COSTS==='object'&&LL_DIE_PROGRESSION_COSTS[toStars])||0)/2);
      state.lp=(Number(state.lp)||0)+refundLp;
    }else{
      LL_STAR_DECLINE_POSITIONS.forEach(function(position){progress.positionStars[position]=toStars;});
      team.stars=toStars;
    }
    progress.baseStar=team.stars;
    progress.upgraded=createUpgradeProxy(team,progress);
    var record={
      season:Number(context.season)||Number(state.season)||1,team:name,country:context.country||null,tier:context.tier||null,
      position:Number(context.position)||0,threshold:Number(context.threshold)||0,playoffTo:Number(context.playoffTo)||0,
      reason:reason,fromStars:fromStars,toStars:toStars,player:isPlayer,rolledBackPosition:rolledBackPosition,
      refundLp:refundLp,refundedCostLp:paidEntry?Number(paidEntry.costLp)||0:0,at:new Date().toISOString()
    };
    pushProgressHistory(team,{type:isPlayer?'star-decline-player':'star-decline-ai',season:record.season,fromStar:fromStars,toStar:toStars,position:rolledBackPosition,refundLp:refundLp,reason:reason,at:record.at});
    return record;
  }
  function resetCounter(club,season,reason){
    club.badCount=0;club.mode=null;club.lastSeason=Number(season)||0;club.lastResult=reason;
  }
  function addBadSeason(club,season,mode){
    var consecutive=club.mode===mode&&Number(club.lastSeason)===Number(season)-1;
    club.badCount=consecutive?Math.min(2,(Number(club.badCount)||0)+1):1;
    club.mode=mode;club.lastSeason=Number(season)||0;club.lastResult='bad-season';
    return club.badCount;
  }
  function updateArchive(state,summary){
    var entry=(state.seasonHistory||[]).find(function(item){return Number(item.season)===Number(summary.season);});
    if(!entry)return;
    entry.starDeclines=deep(summary.starDeclines||[]);
    entry.starDeclineEvaluations=deep(summary.starDeclineEvaluations||[]);
  }

  function applySeasonDeclines(state,summary){
    if(!state||!summary)return [];
    var ledger=ensureLedger(state),season=Number(summary.season)||Number(state.season)||1,key=String(season);
    if(ledger.seasons[key]){
      summary.starDeclines=deep(ledger.seasons[key].declines||[]);
      summary.starDeclineEvaluations=deep(ledger.seasons[key].evaluations||[]);
      return summary.starDeclines;
    }
    var countries=seasonCountries(state,summary),winners=trophyWinners(state,summary,countries),declines=[],evaluations=[];

    countries.forEach(function(pair){
      var country=pair[0],info=pair[1]||{},promotedLastYear=previousPromotionSet(state,season,country);
      var relegated=new Set(info.relegated||[]),playoffTo=Math.max(1,Number(info.rules&&info.rules.playoffTo)||7);
      [['tier1',info.tier1Rows||[]],['tier2',info.tier2Rows||[]]].forEach(function(tierPair){
        var tier=tierPair[0],rows=tierPair[1]||[],count=rows.length;
        rows.forEach(function(row,index){
          var name=row&&row.team;if(!name||!state.teams||!state.teams[name])return;
          var team=state.teams[name],stars=clampStar(team.stars),position=Number(row.position)||index+1,club=clubLedger(ledger,name);
          var wonCup=winners.has(name),isRelegated=tier==='tier1'&&relegated.has(name),newlyPromoted=tier==='tier1'&&promotedLastYear.has(name);
          var threshold=tier==='tier1'?upperThreshold(stars,count):null,mode=null,bad=false,status='safe';

          if(isRelegated){
            status='direct-relegation';
            var direct=applyStarLoss(state,name,'Üst ligden küme düşme',{season:season,country:country,tier:tier,position:position});
            if(direct)declines.push(direct);
            resetCounter(club,season,wonCup?'trophy-reset-after-relegation':'direct-relegation');
          }else if(wonCup){
            status='trophy-reset';resetCounter(club,season,'trophy-reset');
          }else if(newlyPromoted){
            status='newly-promoted-exempt';resetCounter(club,season,'newly-promoted-exempt');
          }else if(tier==='tier1'&&threshold&&stars>=3){
            mode='upper-underperformance';bad=position>=threshold;
          }else if(tier==='tier2'&&stars>=3){
            mode='second-tier-outside-playoff';bad=position>playoffTo;
          }else{
            resetCounter(club,season,'not-eligible');
          }

          if(!isRelegated&&!wonCup&&!newlyPromoted&&mode){
            if(bad){
              var countBad=addBadSeason(club,season,mode);status='bad-'+countBad;
              if(countBad>=2){
                var label=mode==='upper-underperformance'?'Yıldız seviyesinin çok altında iki sezon':'İkinci ligde iki sezon play-off hattı dışında';
                var decline=applyStarLoss(state,name,label,{season:season,country:country,tier:tier,position:position,threshold:threshold,playoffTo:playoffTo});
                if(decline)declines.push(decline);
                resetCounter(club,season,'declined');status=decline?'declined':'floor-1-star';
              }
            }else{
              resetCounter(club,season,'good-season');status='counter-reset';
            }
          }

          club.lastEvaluation={season:season,country:country,tier:tier,position:position,starsBefore:stars,starsAfter:clampStar(team.stars),threshold:threshold,playoffTo:playoffTo,status:status,badCount:club.badCount,trophyReset:wonCup,newlyPromotedExempt:newlyPromoted,relegated:isRelegated};
          club.history.push(deep(club.lastEvaluation));club.history=club.history.slice(-12);
          evaluations.push({team:name,...deep(club.lastEvaluation)});
        });
      });
    });

    ledger.history.push.apply(ledger.history,deep(declines));ledger.history=ledger.history.slice(-180);
    ledger.seasons[key]={season:season,declines:deep(declines),evaluations:deep(evaluations),processedAt:new Date().toISOString()};
    summary.starDeclines=deep(declines);summary.starDeclineEvaluations=deep(evaluations);
    updateArchive(state,summary);
    return declines;
  }

  function playerCounter(state){
    var ledger=ensureLedger(state),club=ledger&&ledger.clubs&&ledger.clubs[state.playerTeam];
    return club||null;
  }
  function declineReasonText(item){
    if(!item)return '';
    if(item.reason==='Üst ligden küme düşme')return item.position+'. sırada üst ligden düşme';
    if(item.threshold)return item.position+'. sıra · eşik '+item.threshold+'. sıra veya altı · iki sezon üst üste';
    if(item.playoffTo)return item.position+'. sıra · play-off hattı '+item.playoffTo+'. sıra · iki sezon üst üste dışında';
    return item.reason;
  }
  function playerDeclineHtml(state,summary){
    var list=summary&&summary.starDeclines||[],own=list.find(function(item){return item.team===state.playerTeam;});
    var counter=playerCounter(state);
    if(own){
      var dice=own.rolledBackPosition
        ?'<br><b>Geri alınan zar:</b> '+escapeHtml(own.rolledBackPosition)+' · '+rangeText(own.fromStars)+' → '+rangeText(own.toStars)+(own.refundLp?' · <b>+'+own.refundLp+' LP iade</b>':'')
        :'<br><b>Zar aralığı:</b> Tüm mevkiler '+rangeText(own.toStars)+' seviyesine çekildi.';
      return '<div class="ll-star-decline-player"><b>⬇️ Kulüp yıldızı düştü: '+own.fromStars+'★ → '+own.toStars+'★</b><br>'+escapeHtml(declineReasonText(own))+dice+'<br><span>Bir sezonda en fazla 1★ düşüş uygulanır. Alt sınır 1★.</span></div>';
    }
    if(counter&&counter.badCount===1){
      var e=counter.lastEvaluation||{},condition=e.tier==='tier2'?'play-off hattı dışında':'yıldız eşiğinin altında';
      return '<div class="ll-star-decline-warning"><b>⚠️ Sürekli kötü performans sayacı: 1/2</b><br>'+escapeHtml(condition)+' bir sezon daha tamamlanırsa kulüp 1★ kaybeder. Kupa veya Avrupa şampiyonluğu sayacı sıfırlar.</div>';
    }
    return '';
  }
  function allDeclinesHtml(summary){
    var list=summary&&summary.starDeclines||[];
    if(!list.length)return '';
    return '<div class="ll-card ll-star-decline-list"><div class="ll-card-title">Sezon Sonu Yıldız Düşüşleri</div>'+list.map(function(item){
      return '<div class="ll-star-decline-row"><span><b>'+escapeHtml(item.team)+'</b><small>'+escapeHtml(declineReasonText(item))+'</small></span><strong>'+item.fromStars+'★ → '+item.toStars+'★</strong></div>';
    }).join('')+'</div>';
  }
  function injectStyles(){
    if(typeof document==='undefined'||document.getElementById('ll-team-star-decline-style'))return;
    var style=document.createElement('style');style.id='ll-team-star-decline-style';style.textContent='\
      .ll-star-decline-player,.ll-star-decline-warning{margin:14px 0;padding:13px 15px;border-radius:12px;line-height:1.55;background:linear-gradient(135deg,rgba(127,29,29,.28),rgba(15,23,42,.78));border:1px solid rgba(248,113,113,.58);color:#fee2e2}.ll-star-decline-warning{background:linear-gradient(135deg,rgba(120,53,15,.24),rgba(15,23,42,.78));border-color:rgba(251,191,36,.48);color:#fef3c7}.ll-star-decline-player span,.ll-star-decline-warning span{font-size:12px;opacity:.82}.ll-star-decline-list{margin-top:14px;border-color:rgba(248,113,113,.34)}.ll-star-decline-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid rgba(255,255,255,.07)}.ll-star-decline-row:first-of-type{border-top:0}.ll-star-decline-row span{min-width:0}.ll-star-decline-row small{display:block;margin-top:3px;color:var(--text2);white-space:normal}.ll-star-decline-row strong{white-space:nowrap;color:#fca5a5}@media(max-width:560px){.ll-star-decline-row{align-items:flex-start}.ll-star-decline-row strong{font-size:13px}}';
    document.head.appendChild(style);
  }
  function injectSeasonEnd(){
    if(typeof document==='undefined'||typeof llArea!=='function')return;
    var state=globalThis.lexLeague&&lexLeague.state,summary=state&&state.lastSeasonSummary,root=llArea();
    if(!state||!summary||!root||root.querySelector('[data-star-decline-summary]'))return;
    var html=playerDeclineHtml(state,summary)+allDeclinesHtml(summary);if(!html)return;
    var host=root.querySelector('.quiz-start-title')||root.querySelector('.ll-topbar');
    if(host)host.insertAdjacentHTML('afterend','<div data-star-decline-summary>'+html+'</div>');
  }
  function injectDashboard(){
    if(typeof document==='undefined'||typeof llArea!=='function')return;
    var state=globalThis.lexLeague&&lexLeague.state,root=llArea();if(!state||state.seasonEnded||!root||root.querySelector('[data-star-decline-counter]'))return;
    var html=playerDeclineHtml(state,state.lastSeasonSummary||{});if(!html||html.indexOf('1/2')<0)return;
    var host=root.querySelector('#ll-die-progression')||root.querySelector('.ll-squad');
    if(host)host.insertAdjacentHTML('afterend','<div data-star-decline-counter>'+html+'</div>');
  }

  if(typeof globalThis.llV2RepairState==='function'){
    var repairBase=globalThis.llV2RepairState;
    globalThis.llV2RepairState=function(state){
      state=repairBase.apply(this,arguments);if(!state)return state;
      ensureLedger(state);Object.values(state.teams||{}).forEach(ensureAbsoluteProgress);
      state.teamStarDeclineVersion=LL_TEAM_STAR_DECLINE_VERSION;
      return state;
    };
  }
  if(typeof globalThis.llV2FinalizeSeason==='function'){
    var finalizeBase=globalThis.llV2FinalizeSeason;
    globalThis.llV2FinalizeSeason=function(){
      var result=finalizeBase.apply(this,arguments),state=globalThis.lexLeague&&lexLeague.state,summary=state&&state.lastSeasonSummary;
      if(!state||!summary)return result;
      var declines=applySeasonDeclines(state,summary);
      if(declines.length&&state.managerMarket&&state.managerMarket.status==='pending'){
        state.managerMarket=null;
        if(!state.careerEnded&&typeof llEnsureManagerMarket==='function')llEnsureManagerMarket(state);
      }
      updateArchive(state,summary);
      if(typeof llSave==='function')llSave();
      injectSeasonEnd();
      return result;
    };
  }
  if(typeof globalThis.llRenderSeasonEnd==='function'){
    var seasonEndBase=globalThis.llRenderSeasonEnd;
    globalThis.llRenderSeasonEnd=function(){var result=seasonEndBase.apply(this,arguments);injectStyles();injectSeasonEnd();return result;};
  }
  if(typeof globalThis.llRenderManagerMarket==='function'){
    var managerMarketBase=globalThis.llRenderManagerMarket;
    globalThis.llRenderManagerMarket=function(){var result=managerMarketBase.apply(this,arguments);injectStyles();injectSeasonEnd();return result;};
  }
  if(typeof globalThis.llRenderDashboard==='function'){
    var dashboardBase=globalThis.llRenderDashboard;
    globalThis.llRenderDashboard=function(){var result=dashboardBase.apply(this,arguments);injectStyles();injectDashboard();return result;};
  }

  globalThis.llStarDeclineThreshold=upperThreshold;
  globalThis.llApplyTeamStarDeclines=applySeasonDeclines;
  globalThis.llEnsureAbsoluteDieProgression=ensureAbsoluteProgress;
  globalThis.LL_TEAM_STAR_DECLINE_VERSION=LL_TEAM_STAR_DECLINE_VERSION;

  injectStyles();
  if(globalThis.lexLeague&&lexLeague.state){
    ensureLedger(lexLeague.state);Object.values(lexLeague.state.teams||{}).forEach(ensureAbsoluteProgress);
  }
})();
/* TEAM_STAR_DECLINE_SYSTEM_END */
