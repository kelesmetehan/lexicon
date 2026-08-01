/* DIE_UPGRADE_CINEMATIC_START */
/* 3D player die-upgrade reveal. Keeps the progression rules in competition-consistency.js unchanged. */
(function(){
  'use strict';
  var LL_DIE_UPGRADE_STYLE_ID='ll-die-upgrade-cinematic-style';
  var LL_DIE_UPGRADE_ICONS={
    'Kaleci':'\u{1F9E4}',
    'Orta Saha':'\u2699\uFE0F',
    'Forvet':'\u26BD'
  };

  function llDieUpgradeEscape(value){
    if(typeof llEscape==='function')return llEscape(value);
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }

  function llDieUpgradeRange(star){
    return typeof llRangeText==='function'?llRangeText(star):({1:'1-4',2:'1-5',3:'2-6',4:'3-6',5:'3-6',6:'4-6'}[star]||String(star));
  }

  function llEnsureDieUpgradeCinematicCss(){
    if(typeof document==='undefined'||document.getElementById(LL_DIE_UPGRADE_STYLE_ID))return;
    var style=document.createElement('style');
    style.id=LL_DIE_UPGRADE_STYLE_ID;
    style.textContent=`
      .ll-trophy-cinematic.die-upgrade{background:radial-gradient(circle at 50% 37%,rgba(34,211,238,.24),rgba(2,6,23,.96) 61%,#000);}
      .ll-trophy-cinematic.die-upgrade .ll-trophy-stage{width:min(460px,calc(100vw - 32px));padding:30px 32px 28px;border:1px solid rgba(103,232,249,.42);border-radius:24px;background:linear-gradient(155deg,rgba(8,47,73,.94),rgba(15,23,42,.98) 62%);box-shadow:0 30px 90px rgba(0,0,0,.74),0 0 54px rgba(34,211,238,.18);}
      .ll-die-flip-stage{width:118px;height:118px;margin:0 auto 17px;position:relative;perspective:860px;filter:drop-shadow(0 17px 15px rgba(0,0,0,.36));}
      .ll-die-flip-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;animation:llDieUpgradeFlip 1.12s cubic-bezier(.18,.82,.22,1) both;}
      .ll-die-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.45);border-radius:23px;color:#111827;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:inset 0 2px 0 rgba(255,255,255,.52),inset 0 -7px 13px rgba(0,0,0,.26),0 11px 24px rgba(0,0,0,.32);overflow:hidden;}
      .ll-die-face::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.35),transparent 42%,rgba(0,0,0,.11));pointer-events:none;}
      .ll-die-face.front{transform:rotateY(0deg);}
      .ll-die-face.back{transform:rotateY(180deg);}
      .ll-die-face.star1{background:#f87171;}
      .ll-die-face.star2{background:#facc15;}
      .ll-die-face.star3{background:#4ade80;}
      .ll-die-face.star4{background:#38bdf8;}
      .ll-die-face.star5{background:#c084fc;}
      .ll-die-face.star6{background:linear-gradient(135deg,#fde047,#f97316);box-shadow:inset 0 2px 0 rgba(255,255,255,.52),inset 0 -7px 13px rgba(0,0,0,.30),0 0 24px rgba(250,204,21,.46);}
      .ll-die-face-label{position:absolute;top:10px;left:0;right:0;text-align:center;font-size:9px;font-weight:900;letter-spacing:1.35px;opacity:.66;}
      .ll-die-face-icon{position:relative;z-index:1;font-size:32px;line-height:1;margin-top:5px;filter:drop-shadow(0 2px 1px rgba(0,0,0,.19));}
      .ll-die-face-range{position:relative;z-index:1;margin-top:5px;font-family:inherit;font-size:21px;font-weight:900;letter-spacing:.4px;}
      .ll-die-upgrade-arrow{display:flex;align-items:center;justify-content:center;gap:10px;margin:1px 0 12px;color:#d8f9ff;font-size:18px;font-weight:800;}
      .ll-die-upgrade-arrow .range{padding:5px 9px;border-radius:999px;background:rgba(2,132,199,.2);border:1px solid rgba(103,232,249,.25);font-size:13px;letter-spacing:.35px;}
      .ll-trophy-cinematic.die-upgrade .ll-trophy-title{color:#a5f3fc;}
      .ll-trophy-cinematic.die-upgrade .ll-trophy-name{color:#f8fafc;margin-top:5px;}
      .ll-trophy-cinematic.die-upgrade .ll-trophy-detail{background:rgba(8,47,73,.54);border-color:rgba(34,211,238,.30);color:#e0f7ff;}
      .ll-trophy-cinematic.die-upgrade .ll-trophy-continue{background:linear-gradient(135deg,#22d3ee,#0ea5e9)!important;border-color:#67e8f9!important;color:#062c36!important;font-weight:800;}
      @keyframes llDieUpgradeFlip{0%{transform:rotateY(0deg) rotateX(0deg) scale(.84);opacity:0}18%{opacity:1;transform:rotateY(0deg) rotateX(-5deg) scale(1.04)}52%{transform:rotateY(94deg) rotateX(5deg) scale(1.08)}100%{transform:rotateY(180deg) rotateX(0deg) scale(1)}}
      .ll-trophy-cinematic.star-ascension{background:radial-gradient(circle at 50% 35%,rgba(250,204,21,.30),rgba(2,6,23,.97) 65%,#000);overflow:hidden;}
      .ll-trophy-cinematic.star-ascension::before{content:'';position:absolute;inset:-50%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.16) 50%,transparent 65%);animation:llDieStarSweep 2.4s ease-in-out infinite;pointer-events:none;}
      .ll-trophy-cinematic.star-ascension .ll-trophy-stage{padding:36px 40px;border:1px solid rgba(250,204,21,.35);border-radius:22px;background:linear-gradient(160deg,rgba(120,53,15,.22),rgba(2,6,23,.4));box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 60px rgba(250,204,21,.18);}
      .ll-trophy-cinematic.star-ascension .ll-trophy-icon{display:none;}
      .ll-star-ascension-row{display:flex;justify-content:center;gap:6px;margin-bottom:10px;position:relative;}
      .ll-star-ascension-row span{font-size:34px;display:inline-block;opacity:0;transform:scale(.3) rotate(-25deg);filter:drop-shadow(0 0 6px rgba(250,204,21,.55));animation:llDieStarPop .5s cubic-bezier(.2,.8,.2,1) forwards;}
      .ll-star-ascension-row span.dim{filter:none;animation:llDieStarFadeIn .4s ease forwards;}
      .ll-trophy-cinematic.star-ascension .ll-trophy-title{color:#fde68a;}
      .ll-trophy-cinematic.star-ascension .ll-trophy-name{color:#facc15;font-size:clamp(26px,7.5vw,34px);text-shadow:0 0 24px rgba(250,204,21,.5);}
      .ll-trophy-cinematic.star-ascension .ll-trophy-detail{background:linear-gradient(135deg,rgba(120,53,15,.42),rgba(15,23,42,.7));border-color:rgba(250,204,21,.4);color:#fef3c7;}
      .ll-trophy-cinematic.star-ascension .ll-trophy-continue{background:linear-gradient(135deg,#facc15,#f59e0b)!important;border-color:#f59e0b!important;color:#1c1917!important;font-weight:700;}
      @keyframes llDieStarSweep{0%{transform:translateX(-20%) translateY(-10%)}100%{transform:translateX(20%) translateY(10%)}}
      @keyframes llDieStarPop{0%{opacity:0;transform:scale(.3) rotate(-25deg)}55%{opacity:1;transform:scale(1.3) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
      @keyframes llDieStarFadeIn{to{opacity:.35;transform:scale(1) rotate(0)}}
      @media(max-width:520px){.ll-trophy-cinematic.die-upgrade .ll-trophy-stage,.ll-trophy-cinematic.star-ascension .ll-trophy-stage{padding:26px 18px 24px}.ll-die-flip-stage{width:108px;height:108px}.ll-die-face{border-radius:21px}.ll-die-face-icon{font-size:30px}.ll-die-face-range{font-size:20px}.ll-star-ascension-row span{font-size:26px}}
      @media(prefers-reduced-motion:reduce){.ll-die-flip-inner{animation:none;transform:rotateY(180deg)}.ll-trophy-cinematic.die-upgrade,.ll-trophy-cinematic.star-ascension::before,.ll-star-ascension-row span{animation:none!important}.ll-star-ascension-row span{opacity:1;transform:none}}
    `;
    document.head.appendChild(style);
  }

  function llCloseDieUpgradeAnimation(){
    var root=document.getElementById('ll-trophy-cinematic');
    var completed=root&&root.dataset&&root.dataset.teamCompleted==='true';
    var fromStar=Number(root&&root.dataset&&root.dataset.fromStar)||0;
    var toStar=Number(root&&root.dataset&&root.dataset.toStar)||0;
    var teamName=root&&root.dataset?root.dataset.teamName:'';
    if(root)root.remove();
    document.body.classList.remove('ll-cinematic-open');
    if(completed&&typeof llShowStarAscensionAnimation==='function'){
      window.setTimeout(function(){llShowStarAscensionAnimation(fromStar,toStar,teamName);},120);
    }else if(typeof llTryShowQueuedTrophyAnimation==='function'){
      window.setTimeout(llTryShowQueuedTrophyAnimation,180);
    }
  }

  function llShowStarAscensionAnimation(fromStar,toStar,teamName){
    if(typeof document==='undefined'||document.getElementById('ll-trophy-cinematic'))return false;
    llEnsureDieUpgradeCinematicCss();
    var starRow=Array.from({length:6},function(_,index){
      var star=index+1,filled=star<=toStar,isNew=star===toStar;
      return '<span class="'+(filled?'':'dim')+'" style="animation-delay:'+(isNew?.95:.12*index)+'s">'+(filled?'\u2B50':'\u2606')+'</span>';
    }).join('');
    document.body.classList.add('ll-cinematic-open');
    document.body.insertAdjacentHTML('beforeend','<div class="ll-trophy-cinematic star-ascension" id="ll-trophy-cinematic" role="dialog" aria-modal="true"><div class="ll-pack-particles"></div><div class="ll-trophy-stage"><div class="ll-star-ascension-row">'+starRow+'</div><div class="ll-trophy-title">Takım Yıldızı Yükseldi</div><div class="ll-trophy-name">'+fromStar+'★ → '+toStar+'★</div><div class="ll-trophy-sub">'+llDieUpgradeEscape(teamName)+' artık '+toStar+' yıldızlı bir takım.</div><div class="ll-trophy-detail">Üç mevkinin de zarı gelişti · Yeni zar aralıkları aktif</div><button class="ll-btn primary ll-trophy-continue" type="button" onclick="llCloseTrophyAnimation()">Devam Et</button></div></div>');
    var root=document.getElementById('ll-trophy-cinematic');
    if(typeof llTrophySpawnParticles==='function')llTrophySpawnParticles(root,96,['#facc15','#fde68a','#f59e0b','#ffffff','#fef3c7']);
    if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&typeof navigator.vibrate==='function')navigator.vibrate([25,35,65]);
    return true;
  }

  function llShowDieUpgradeAnimation(position,fromStar,toStar,progressCount,options){
    options=options||{};
    if(typeof document==='undefined'||document.getElementById('ll-trophy-cinematic'))return false;
    llEnsureDieUpgradeCinematicCss();
    var icon=LL_DIE_UPGRADE_ICONS[position]||'\u{1F3B2}';
    var fromRange=llDieUpgradeRange(fromStar),toRange=llDieUpgradeRange(toStar);
    var remaining=Math.max(0,3-Number(progressCount||0));
    var completionText=options.completed?'Üç zar tamamlandı · Takım yıldızı da yükselmeye hazır.':(remaining+' mevki daha gelişince takım yıldızı artacak.');
    document.body.classList.add('ll-cinematic-open');
    document.body.insertAdjacentHTML('beforeend','<div class="ll-trophy-cinematic die-upgrade" id="ll-trophy-cinematic" role="dialog" aria-modal="true" data-team-completed="'+(options.completed?'true':'false')+'" data-from-star="'+Number(fromStar)+'" data-to-star="'+Number(toStar)+'" data-team-name="'+llDieUpgradeEscape(options.teamName||'')+'"><div class="ll-pack-particles"></div><div class="ll-trophy-stage"><div class="ll-die-flip-stage" aria-label="Zar '+llDieUpgradeEscape(position)+' gelişimi"><div class="ll-die-flip-inner"><div class="ll-die-face front star'+Number(fromStar)+'"><span class="ll-die-face-label">MEVCUT</span><span class="ll-die-face-icon">'+icon+'</span><span class="ll-die-face-range">'+fromRange+'</span></div><div class="ll-die-face back star'+Number(toStar)+'"><span class="ll-die-face-label">YENİ</span><span class="ll-die-face-icon">'+icon+'</span><span class="ll-die-face-range">'+toRange+'</span></div></div></div><div class="ll-trophy-title">Zar Geliştirildi</div><div class="ll-trophy-name">'+llDieUpgradeEscape(position)+'</div><div class="ll-die-upgrade-arrow"><span class="range">'+fromRange+'</span><span>→</span><span class="range">'+toRange+'</span></div><div class="ll-trophy-detail">'+Number(progressCount)+'/3 zar geliştirildi · '+completionText+'</div><button class="ll-btn primary ll-trophy-continue" type="button" onclick="llCloseDieUpgradeAnimation()">'+(options.completed?'Takım Yıldızını Gör':'Devam Et')+'</button></div></div>');
    var root=document.getElementById('ll-trophy-cinematic');
    if(typeof llTrophySpawnParticles==='function')window.setTimeout(function(){if(document.getElementById('ll-trophy-cinematic')===root)llTrophySpawnParticles(root,28,['#22d3ee','#67e8f9','#bae6fd','#ffffff']);},520);
    if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&typeof navigator.vibrate==='function')window.setTimeout(function(){navigator.vibrate([18,28,42]);},460);
    window.setTimeout(function(){root&&root.querySelector('.ll-trophy-continue')?.focus();},1140);
    return true;
  }

  window.llUpgradePositionDie=function(position){
    var state=window.lexLeague&&lexLeague.state,team=state&&typeof llTeamState==='function'?llTeamState(state.playerTeam):null;
    if(!state||!team||typeof LL_POSITIONS==='undefined'||!Array.isArray(LL_POSITIONS)||!LL_POSITIONS.includes(position))return false;
    var progress=llDieProgressionEnsureTeam(team),fromStar=Number(team.stars)||1;
    if(fromStar>=6){alert('Takım 6 ★ seviyesinde; zar geliştirme tamamlandı.');return false;}
    if(progress.upgraded[position]){alert(position+' zarı bu yıldız basamağında zaten geliştirildi. Diğer iki mevkiyi de geliştirince takım yıldızı artar.');return false;}
    var cost=llDieProgressionCost(team),before=llDieUpgradeRange(fromStar),toStar=Math.min(6,fromStar+1),after=llDieUpgradeRange(toStar);
    if(Number(state.lp)<cost){alert('Yetersiz LP. Gerekli: '+cost+' LP');return false;}
    if(!confirm(position+' zarı '+before+' aralığından '+after+' aralığına gelişecek. Bedel: '+cost+' LP. Onaylıyor musun?'))return false;
    state.lp-=cost;
    progress.upgraded[position]=true;
    var completed=LL_POSITIONS.every(function(pos){return progress.upgraded[pos];});
    var progressCount=completed?3:llDieProgressionCount(team);
    llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'die-upgrade',position:position,fromStar:fromStar,toStar:toStar,costLp:cost,at:new Date().toISOString()});
    if(completed){
      team.stars=toStar;
      progress.baseStar=team.stars;
      LL_POSITIONS.forEach(function(pos){progress.upgraded[pos]=false;});
      llDieProgressionRecord(team,{season:Number(state.season)||1,week:Number(state.week)||1,type:'team-star-complete',fromStar:fromStar,toStar:team.stars,at:new Date().toISOString()});
    }
    if(typeof llSave==='function')llSave();
    if(typeof llRenderDashboard==='function')llRenderDashboard();
    window.setTimeout(function(){llShowDieUpgradeAnimation(position,fromStar,toStar,progressCount,{teamName:state.playerTeam,completed:completed});},80);
    return true;
  };

  window.llShowDieUpgradeAnimation=llShowDieUpgradeAnimation;
  window.llShowStarAscensionAnimation=llShowStarAscensionAnimation;
  window.llCloseDieUpgradeAnimation=llCloseDieUpgradeAnimation;
  window.llEnsureDieUpgradeCinematicCss=llEnsureDieUpgradeCinematicCss;
  llEnsureDieUpgradeCinematicCss();
})();
/* DIE_UPGRADE_CINEMATIC_END */
