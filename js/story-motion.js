/* Landing story choreography; no auth, data, or dashboard responsibilities. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:1024px) and (pointer:fine)'),events=new AbortController(),running=new Set();
 const low=()=>navigator.connection?.saveData||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<4)||(navigator.deviceMemory&&navigator.deviceMemory<4);
 const rich=()=>!reduced.matches&&!low();
 const on=(target,type,fn)=>target?.addEventListener(type,fn,{passive:true,signal:events.signal});
 function animate(options){if(!window.anime||!rich())return;let a;const done=options.complete;a=anime({...options,complete:()=>{running.delete(a);done?.();}});running.add(a);return a;}
 window.MealBridgeAnimate=animate;
 const hero=document.querySelector('.film-hero');if(!hero)return;
 const photo=hero.querySelector('.film-hero-media>img'),exposure=hero.querySelector('.film-exposure'),lines=[...hero.querySelectorAll('.film-line')],copy=hero.querySelector('.film-hero-description'),actions=hero.querySelector('.hero-buttons'),partner=hero.querySelector('.film-partner-link');
 let intro,timer,scrollFrame=0,heroVisible=true;
 const introElements=[photo,exposure,...lines,copy,actions,partner];
 function finish(){clearTimeout(timer);intro?.pause();running.delete(intro);for(const el of introElements)for(const prop of ['opacity','transform','filter','clip-path','text-shadow'])el.style.removeProperty(prop);hero.dataset.motion='settled';}
 if(rich()&&window.anime){hero.dataset.motion='exposure';intro=anime.timeline({autoplay:false,easing:'easeOutExpo',complete:finish});intro.add({targets:exposure,opacity:[.96,0],duration:1300},0).add({targets:photo,clipPath:['inset(0 0 100% 0)','inset(0)'],scale:[1.07,1.025],duration:1450},100).add({targets:lines,translateY:[18,0],filter:['blur(5px)','blur(0px)'],opacity:[.4,1],delay:anime.stagger(180),duration:1000,begin:()=>hero.dataset.motion='headline'},250).add({targets:copy,translateY:[8,0],opacity:[.4,1],duration:700},1300).add({targets:actions,translateY:[12,0],opacity:[.4,1],duration:750},1570).add({targets:partner,opacity:[.5,1],duration:600},1800);running.add(intro);intro.play();timer=setTimeout(finish,2800);}else hero.dataset.motion='static';
 const reveal=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;if(el.matches('[data-story-lines]'))animate({targets:el.children,translateY:[16,0],opacity:[.55,1],filter:['blur(3px)','blur(0px)'],delay:window.anime?.stagger(130),duration:1050,easing:'easeOutExpo'});else animate({targets:el,translateY:[12,0],opacity:[.65,1],duration:1000,easing:'easeOutExpo'});el.dataset.revealed='true';reveal.unobserve(el);}},{threshold:.15});
 document.querySelectorAll('[data-story-lines],[data-story-reveal]').forEach(el=>{if(!el.closest('.story-chapter'))reveal.observe(el);});
 function sync(){document.body.classList.toggle('film-ambient',rich()&&desktop.matches);document.body.classList.toggle('film-paused',document.hidden||!heroVisible);if(!rich()){finish();for(const a of [...running]){a.pause();a.seek(a.duration);}running.clear();}else for(const a of running)document.hidden?a.pause():a.play();}
 const visible=new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;sync();});visible.observe(hero);
 on(reduced,'change',sync);on(desktop,'change',sync);on(document,'visibilitychange',sync);on(navigator.connection,'change',sync);
 on(window,'pagehide',event=>{clearTimeout(timer);cancelAnimationFrame(scrollFrame);for(const a of running)a.pause();if(!event.persisted){events.abort();visible.disconnect();reveal.disconnect();running.clear();}});on(window,'pageshow',sync);sync();
})();
