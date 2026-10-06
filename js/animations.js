/* Film choreography: presentation only, with static HTML as the default. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)');
  const lowPower=()=>navigator.connection?.saveData||(navigator.deviceMemory&&navigator.deviceMemory<4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<4);
  const rich=()=>!reduced.matches&&!lowPower();
  const events=new AbortController(),running=new Set();
  const on=(target,type,fn,options={})=>target?.addEventListener(type,fn,{...options,signal:events.signal});
  function animate(options){
    if(!window.anime||reduced.matches)return null;
    let animation;const complete=options.complete;
    animation=anime({...options,complete:a=>{running.delete(animation);complete?.(a);}});running.add(animation);return animation;
  }
  window.MealBridgeAnimate=animate;
  const hero=document.querySelector('.film-hero');if(!hero)return;
  function words(element){
    if(element.dataset.wordsReady)return [...element.querySelectorAll('.film-word')];
    element.dataset.wordsReady='true';const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const text of nodes){const fragment=document.createDocumentFragment();for(const word of text.textContent.split(/(\s+)/)){if(!word)continue;if(/^\s+$/.test(word))fragment.append(document.createTextNode(word));else{const span=document.createElement('span');span.className='film-word';span.textContent=word;fragment.append(span);}}text.replaceWith(fragment);}
    return [...element.querySelectorAll('.film-word')];
  }
  const title=document.querySelector('#hero-title'),photo=hero.querySelector('.film-hero-media>img'),exposure=hero.querySelector('.film-exposure');
  const copy=hero.querySelector('.film-hero-description'),actions=hero.querySelector('.hero-buttons'),partner=hero.querySelector('.film-partner-link');
  let introTimer=0,intro;
  function finishIntro(){
    clearTimeout(introTimer);intro?.pause();if(intro)running.delete(intro);
    [photo,exposure,copy,actions,partner,...title.querySelectorAll('.film-word'),title.querySelector('.film-impact-word')].forEach(el=>{if(el)for(const prop of ['transform','opacity','filter','clip-path','text-shadow'])el.style.removeProperty(prop);});
    hero.dataset.motion='settled';
  }
  if(rich()&&window.anime){
    const units=words(title);hero.dataset.motion='exposure';
    intro=anime.timeline({autoplay:false,easing:'easeOutExpo',complete:finishIntro});
    intro.add({targets:exposure,opacity:[.98,0],duration:1250},0)
      .add({targets:photo,clipPath:['inset(0 0 100% 0)','inset(0 0 0% 0)'],scale:[1.1,1.025],duration:1400,easing:'easeOutQuart'},80)
      .add({targets:units,translateY:['85%',0],opacity:[.25,1],filter:['blur(6px)','blur(0px)'],delay:anime.stagger(90),duration:1050,begin:()=>{hero.dataset.motion='headline';}},260)
      .add({targets:'.film-impact-word',textShadow:['0 0 0px rgba(92,222,173,0)','0 0 22px rgba(92,222,173,.19)','0 0 0px rgba(92,222,173,0)'],duration:950},1200)
      .add({targets:copy,translateY:[9,0],opacity:[.35,1],duration:500,begin:()=>{hero.dataset.motion='support';}},1630)
      .add({targets:actions,translateY:[22,0],opacity:[.3,1],duration:730,easing:'easeOutElastic(1, .7)',begin:()=>{hero.dataset.motion='actions';}},1940)
      .add({targets:partner,opacity:[.3,1],duration:450},2210);
    running.add(intro);intro.play();introTimer=setTimeout(finishIntro,3100);
  }else hero.dataset.motion='static';
  const revealed=new IntersectionObserver(entries=>{
    for(const {target,isIntersecting}of entries){if(!isIntersecting)continue;
      if(target.matches('[data-film-text]')){
        if(rich()&&window.anime)animate({targets:words(target),translateY:[16,0],filter:['blur(3px)','blur(0px)'],opacity:[.5,1],duration:850,delay:anime.stagger(50),easing:'easeOutExpo'});
      }else if(target.matches('.film-connection')){
        const path=target.querySelector('.bridge-flow');
        if(animate({targets:path,strokeDashoffset:[1,0],duration:1800,easing:'easeInOutCubic',complete:()=>{target.dataset.motion='connected';}}))target.dataset.motion='connecting';
        else target.dataset.motion='static';
      }else animate({targets:target,translateY:[18,0],opacity:[.6,1],duration:750,easing:'easeOutExpo',complete:()=>{target.style.removeProperty('transform');target.style.removeProperty('opacity');}});
      revealed.unobserve(target);
    }
  },{threshold:.18});
  document.querySelectorAll('[data-film-text],[data-film-reveal],.film-connection').forEach(el=>revealed.observe(el));
  let heroVisible=true,scrollFrame=0;
  const heroObserver=new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;sync();});heroObserver.observe(hero);
  const resets=[];
  function sync(){
    document.body.classList.toggle('film-ambient',rich()&&pointer.matches);
    document.body.classList.toggle('film-paused',document.hidden||!heroVisible);
    if(reduced.matches){finishIntro();for(const animation of [...running]){animation.pause();animation.seek(animation.duration);}running.clear();resets.forEach(reset=>reset());document.querySelector('.film-problem-photo')?.style.removeProperty('--photo-depth');}
    else for(const animation of running)document.hidden?animation.pause():animation.play();
  }
  function depth(){scrollFrame=0;if(!rich()||!pointer.matches||document.hidden||document.querySelector('dialog[open]'))return;
    const image=document.querySelector('.film-problem-photo'),rect=image.getBoundingClientRect();
    if(rect.bottom>0&&rect.top<innerHeight){const amount=Math.max(-1,Math.min(1,(rect.top+rect.height/2-innerHeight/2)/innerHeight));image.style.setProperty('--photo-depth',`${-20+amount*20}px`);}
  }
  on(window,'scroll',()=>{if(rich()&&pointer.matches&&!scrollFrame)scrollFrame=requestAnimationFrame(depth);},{passive:true});
  on(document,'visibilitychange',sync);on(reduced,'change',sync);on(pointer,'change',sync);on(navigator.connection,'change',sync);
  document.querySelectorAll('.film-feature:not(.film-feature-inline),.hero-buttons .button,.join-actions>.button').forEach(el=>{
    let frame=0,x=0,y=0;
    const reset=()=>{cancelAnimationFrame(frame);frame=0;['--tilt-x','--tilt-y','--magnet-x','--magnet-y','--shine-x','--shine-y'].forEach(p=>el.style.removeProperty(p));};resets.push(reset);
    on(el,'pointermove',event=>{if(!rich()||!pointer.matches||event.pointerType!=='mouse')return;x=event.clientX;y=event.clientY;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const r=el.getBoundingClientRect(),dx=(x-r.left)/r.width-.5,dy=(y-r.top)/r.height-.5;if(el.classList.contains('film-feature')){el.style.setProperty('--tilt-x',`${-dy*2}deg`);el.style.setProperty('--tilt-y',`${dx*2}deg`);el.style.setProperty('--shine-x',`${(dx+.5)*100}%`);el.style.setProperty('--shine-y',`${(dy+.5)*100}%`);}else{el.style.setProperty('--magnet-x',`${dx*7}px`);el.style.setProperty('--magnet-y',`${dy*5}px`);}});},{passive:true});
    on(el,'pointerleave',reset);on(el,'blur',reset);
  });
  on(window,'pagehide',event=>{clearTimeout(introTimer);cancelAnimationFrame(scrollFrame);scrollFrame=0;resets.forEach(reset=>reset());for(const animation of running)animation.pause();if(!event.persisted){events.abort();revealed.disconnect();heroObserver.disconnect();running.clear();}});
  on(window,'pageshow',sync);sync();
})();
