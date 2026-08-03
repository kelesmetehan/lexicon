/* Lexicon League: premium achievement unlock cinematic. */
(function(){
  'use strict';
  let queue=[];
  let showing=false;
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
  function rewardText(a){
    const ap=Number(a?.reward?.ap)||0,lp=Number(a?.reward?.lp)||0;
    return `${ap?`+${ap} AP`:''}${ap&&lp?' · ':''}${lp?`+${lp} LP`:''}`||'Kariyer rozeti';
  }
  function installStyle(){
    if(document.getElementById('ll-achievement-cinematic-styles'))return;
    const style=document.createElement('style');
    style.id='ll-achievement-cinematic-styles';
    style.textContent=`
      .ll-ac-overlay{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:18px;overflow:hidden;background:radial-gradient(circle at 50% 46%,rgba(253,224,71,.24),rgba(120,53,15,.19) 31%,rgba(2,6,23,.94) 75%);backdrop-filter:blur(8px);opacity:0;transition:opacity .3s ease}
      .ll-ac-overlay.show{opacity:1}.ll-ac-rays{position:absolute;inset:-45%;background:repeating-conic-gradient(from 0deg,rgba(250,204,21,.10) 0deg 1deg,transparent 1deg 12deg);animation:ll-ac-spin 34s linear infinite}.ll-ac-card{position:relative;width:min(540px,100%);padding:42px 34px 29px;border:1px solid rgba(253,224,71,.75);border-radius:24px;text-align:center;overflow:hidden;background:linear-gradient(145deg,rgba(51,24,7,.98),rgba(17,24,39,.98) 56%,rgba(20,83,45,.82));box-shadow:0 30px 90px rgba(0,0,0,.68),0 0 48px rgba(250,204,21,.24);transform:translateY(20px) scale(.96);transition:transform .44s cubic-bezier(.18,.9,.25,1.2)}.ll-ac-overlay.show .ll-ac-card{transform:translateY(0) scale(1)}
      .ll-ac-ring{position:absolute;left:50%;top:22%;width:172px;height:172px;border:1px solid rgba(253,224,71,.55);border-radius:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;animation:ll-ac-ring 2.5s ease-out infinite}.ll-ac-ring.r2{animation-delay:.85s}.ll-ac-badge{position:relative;margin:0 auto 19px;width:108px;height:108px;display:grid;place-items:center;border:2px solid rgba(254,240,138,.85);border-radius:50%;font-size:57px;background:radial-gradient(circle,rgba(254,240,138,.36),rgba(202,138,4,.36));box-shadow:0 0 0 8px rgba(250,204,21,.12),0 0 42px rgba(250,204,21,.65);animation:ll-ac-badge .85s .1s both cubic-bezier(.18,.89,.32,1.28)}
      .ll-ac-kicker{position:relative;color:#fde68a;font-size:11px;font-weight:900;letter-spacing:2.2px}.ll-ac-name{position:relative;margin:9px 0 10px;color:#fff7d6;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(31px,7vw,47px);font-weight:700;line-height:1}.ll-ac-desc{position:relative;margin:0 auto;color:#dbeafe;font-size:15px;line-height:1.5;max-width:410px}.ll-ac-reward{position:relative;display:inline-block;margin:18px auto 22px;padding:8px 14px;border:1px solid rgba(94,234,212,.5);border-radius:999px;color:#99f6e4;background:rgba(13,148,136,.14);font-weight:900}.ll-ac-button{position:relative;min-width:170px;border:0;border-radius:10px;padding:12px 22px;background:linear-gradient(135deg,#f6d365,#c99724);color:#1f1604;font-weight:900;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);transition:transform .16s}.ll-ac-button:hover{transform:translateY(-2px)}.ll-ac-particle{position:absolute;left:50%;top:49%;width:7px;height:7px;border-radius:50%;background:var(--p);box-shadow:0 0 11px var(--p);animation:ll-ac-particle var(--d) var(--delay) ease-out both}@keyframes ll-ac-spin{to{transform:rotate(360deg)}}@keyframes ll-ac-badge{0%{opacity:0;transform:scale(.2) rotate(-30deg)}65%{opacity:1;transform:scale(1.18) rotate(8deg)}100%{transform:scale(1) rotate(0)}}@keyframes ll-ac-ring{0%{opacity:.84;transform:translate(-50%,-50%) scale(.45)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.05)}}@keyframes ll-ac-particle{0%{opacity:0;transform:translate(0,0) scale(.4)}12%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.15)}}@media(prefers-reduced-motion:reduce){.ll-ac-rays,.ll-ac-ring,.ll-ac-badge,.ll-ac-particle{animation:none}.ll-ac-overlay,.ll-ac-card{transition:none}}@media(max-width:520px){.ll-ac-card{padding:35px 20px 24px;border-radius:19px}.ll-ac-badge{width:88px;height:88px;font-size:47px}.ll-ac-desc{font-size:14px}}
    `;
    document.head.appendChild(style);
  }
  function particles(){
    const colors=['#fde68a','#5eead4','#fda4af','#bfdbfe'];
    return Array.from({length:30},(_,i)=>{
      const angle=(i/30)*Math.PI*2+(Math.random()-.5)*.18;
      const distance=90+Math.random()*220;
      const x=Math.cos(angle)*distance,y=Math.sin(angle)*distance;
      return `<i class="ll-ac-particle" style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--p:${colors[i%colors.length]};--d:${(1.25+Math.random()*.8).toFixed(2)}s;--delay:${(Math.random()*.18).toFixed(2)}s"></i>`;
    }).join('');
  }
  function next(){
    const a=queue.shift();
    if(!a){showing=false;return;}
    showing=true;installStyle();
    document.getElementById('ll-achievement-cinematic')?.remove();
    const overlay=document.createElement('div');
    overlay.id='ll-achievement-cinematic';
    overlay.className='ll-ac-overlay';
    overlay.innerHTML=`<div class="ll-ac-rays"></div>${particles()}<section class="ll-ac-card" role="dialog" aria-modal="true" aria-label="Başarım kilidi açıldı"><i class="ll-ac-ring"></i><i class="ll-ac-ring r2"></i><div class="ll-ac-badge">🏆</div><div class="ll-ac-kicker">BAŞARIM KİLİDİ AÇILDI</div><div class="ll-ac-name">${escapeHtml(a.name)}</div><p class="ll-ac-desc">${escapeHtml(a.description)}</p><div class="ll-ac-reward">${escapeHtml(rewardText(a))} kariyer hanene işlendi</div><br><button class="ll-ac-button" type="button">Devam Et</button></section>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add('show'));
    const close=()=>{overlay.classList.remove('show');setTimeout(()=>{overlay.remove();next();},260);};
    overlay.querySelector('.ll-ac-button').addEventListener('click',close);
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  }
  globalThis.llAchievementCinematic=function(items){
    const incoming=Array.isArray(items)?items:[items];
    queue.push(...incoming.filter(Boolean));
    if(!showing)next();
  };
})();
