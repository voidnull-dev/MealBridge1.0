/* One owner for landing entrances, reveals, pointer depth and scroll parallax. */
(()=>{
 const hero=document.querySelector('.film-hero');if(!hero)return;
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),pointer=matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)'),forced=matchMedia('(forced-colors:active)');
 const signal=new AbortController(),on=(target,event,callback)=>target?.addEventListener(event,callback,{passive:true,signal:signal.signal});
 const animeReady=typeof window.anime==='function',motion=()=>animeReady&&!reduce.matches&&!forced.matches,depth=()=>motion()&&pointer.matches;
 const running=new Set(),seen=new Set(),sections=[...document.querySelectorAll('.story-scene')],footer=document.querySelector('.footer'),closing=document.querySelector('.story-closing'),chapters=[...document.querySelectorAll('.story-chapter')],journey=document.querySelector('.story-chapters'),line=document.querySelector('.story-flow');
 let dead=false,frame=0,measureFrame=0,visible=true,heroDone=false,closingDone=false,footerSeen=false;
 function animate(options){if(!motion())return null;let instance;const complete=options.complete;instance=anime({...options,complete:()=>{running.delete(instance);complete?.();}});running.add(instance);return instance;}
 window.MealBridgeAnimate=animate;
 const stages=[...document.querySelectorAll('.film-hero-media,[data-story-image]')].map(el=>{
  const img=el.querySelector('img'),plane=document.createElement('div');plane.className='landing-image-plane';el.insertBefore(plane,img);plane.append(img);el.classList.add('landing-image-stage');return {el,img,plane,target:el.closest('.film-hero')||el.closest('.story-trust')||el.closest('.story-closing')||el,x:0,y:0,tx:0,ty:0,p:0,tp:0};
 });
 const heroImage=stages[0].img,headline=[...hero.querySelectorAll('.film-line')],heroCTAs=hero.querySelector('.hero-buttons'),heroCopy=hero.querySelector('.film-hero-description'),partner=hero.querySelector('.film-partner-link');
 const finalLines=[...closing.querySelectorAll('h2>span')],finalButtons=closing.querySelector('.story-closing-actions');
 const restoreEls=[...sections,footer,heroImage,...headline,heroCTAs,heroCopy,partner,...finalLines,finalButtons];
 const geometry=new Map();let height=innerHeight,documentHeight=1;
 function rect(el){return geometry.get(el)||{top:0,left:0,width:1,height:1};}
 function measure(){measureFrame=0;if(dead)return;height=innerHeight;documentHeight=Math.max(1,document.documentElement.scrollHeight-height);for(const el of [...stages.flatMap(s=>[s.el,s.target]),journey,...chapters]){const r=el.getBoundingClientRect();geometry.set(el,{top:r.top+scrollY,left:r.left+scrollX,width:r.width,height:r.height});}request();}
 function request(){if(!dead&&!document.hidden&&!frame)frame=requestAnimationFrame(render);}
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function render(){frame=0;if(dead||document.hidden||document.querySelector('dialog[open]'))return;let unsettled=false;const scroll=scrollY;
  for(const s of stages){const b=rect(s.el),inView=b.top<scroll+height&&b.top+b.height>scroll;if(!inView)continue;const active=depth();s.tp=motion()?(scroll+height/2-b.top-b.height/2)*(active?.16:.045):0;s.tp=clamp(s.tp,active?-65:-18,active?65:18);s.p+=(s.tp-s.p)*.12;s.x+=(s.tx-s.x)*.1;s.y+=(s.ty-s.y)*.1;
   const rx=active?-s.y*4:0,ry=active?s.x*5:0,z=active?18:0;
   s.plane.style.transform=motion()?`perspective(1200px) translate3d(0, ${s.p.toFixed(3)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) translateZ(${z}px) scale(${active?1.09:1.045})`:'none';
   const moving=Math.abs(s.tp-s.p)>.05||Math.abs(s.tx-s.x)>.002||Math.abs(s.ty-s.y)>.002;s.el.classList.toggle('is-depth-active',moving);unsettled||=moving;s.el.dataset.parallax=s.p.toFixed(2);
  }
  const j=rect(journey),progress=clamp((scroll+height*.8-j.top)/j.height,0,1);line.style.strokeDasharray='1';line.style.strokeDashoffset=motion()?1-progress:0;line.dataset.progress=progress.toFixed(4);
  for(const chapter of chapters){if(scroll+height*.8>=rect(chapter).top&&!chapter.dataset.drawn){chapter.dataset.drawn='true';animate({targets:chapter.querySelectorAll('h3>span'),translateY:[24,0],opacity:[.25,1],duration:800,delay:animeReady?anime.stagger(110):0,easing:'easeOutCubic'});}}
  if(unsettled&&motion())request();
 }
 function showFooter(){if(!footerSeen||!closingDone||footer.dataset.revealed)return;footer.dataset.revealed='true';animate({targets:footer,opacity:[0,1],translateY:[20,0],duration:750,easing:'easeOutCubic'});}
 function revealSection(el){if(seen.has(el))return;seen.add(el);el.dataset.reveal='running';if(!motion()){el.style.opacity='1';el.style.transform='none';el.dataset.reveal='complete';return;}
  animate({targets:el,opacity:[0,1],translateY:[40,0],duration:900,easing:'easeOutCubic',complete:()=>{el.dataset.reveal='complete';measure();}});
  if(el===closing){animate({targets:finalLines,opacity:[0,1],translateY:[35,0],duration:850,delay:anime.stagger(180,{start:220}),easing:'easeOutCubic'});animate({targets:finalButtons,opacity:[0,1],translateY:[28,0],delay:850,duration:650,easing:'easeOutCubic',complete:()=>{closingDone=true;showFooter();}});}
 }
 const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting}of entries){if(!isIntersecting)continue;if(target===footer){footerSeen=true;if(!seen.has(closing))revealSection(closing);showFooter();}else revealSection(target);observer.unobserve(target);}},{threshold:0,rootMargin:'0px 0px -35px 0px'});
 function intro(){if(!motion()){heroDone=true;hero.dataset.motion='static';return;}hero.dataset.motion='running';anime.set(heroImage,{scale:1.16,filter:'blur(9px)'});anime.set(headline,{opacity:0,translateY:55});anime.set([heroCTAs,heroCopy,partner],{opacity:0,translateY:26});
  animate({targets:heroImage,scale:[1.16,1],filter:['blur(9px)','blur(0px)'],duration:1900,easing:'easeOutCubic',complete:()=>{heroDone=true;hero.dataset.motion='complete';}});
  animate({targets:headline,translateY:[55,0],opacity:[0,1],duration:900,delay:anime.stagger(180,{start:180}),easing:'easeOutCubic'});
  animate({targets:heroCopy,opacity:[0,1],translateY:[26,0],duration:650,delay:1050,easing:'easeOutCubic'});
  animate({targets:heroCTAs,opacity:[0,1],translateY:[26,0],duration:700,delay:1450,easing:'easeOutCubic'});
  animate({targets:partner,opacity:[0,1],translateY:[18,0],duration:650,delay:1600,easing:'easeOutCubic'});
 }
 // Hide only after the DOM and Anime.js are confirmed ready. No-JS remains readable.
 if(motion()){anime.set(sections,{opacity:0,translateY:40});anime.set(footer,{opacity:0,translateY:20});anime.set([...finalLines,finalButtons],{opacity:0,translateY:30});}
 else closingDone=true;
 sections.forEach(el=>observer.observe(el));observer.observe(footer);intro();
 for(const s of stages){on(s.target,'pointermove',e=>{if(!depth()||e.pointerType!=='mouse')return;const r=rect(s.target);s.tx=clamp((e.clientX+scrollX-r.left)/r.width*2-1,-1,1);s.ty=clamp((e.clientY+scrollY-r.top)/r.height*2-1,-1,1);request();});on(s.target,'pointerleave',()=>{s.tx=s.ty=0;request();});}
 function sync(){if(!motion()){for(const a of [...running]){a.pause();a.seek(a.duration);}running.clear();restoreEls.forEach(el=>{el.style.opacity='1';el.style.transform='none';el.style.filter='none';});stages.forEach(s=>{s.p=s.tp=s.x=s.y=s.tx=s.ty=0;s.plane.style.transform='none';});closingDone=true;line.style.strokeDashoffset=0;hero.dataset.motion='static';}else if(!depth())stages.forEach(s=>{s.x=s.y=s.tx=s.ty=0;});request();}
 on(window,'scroll',request);on(window,'resize',()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure)});on(reduce,'change',sync);on(pointer,'change',sync);on(forced,'change',sync);
 on(document,'focusin',e=>{const section=e.target.closest('.story-scene');if(section&&!seen.has(section))revealSection(section);});
 on(document,'visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(frame);frame=0;for(const a of running)a.pause();}else{for(const a of running)a.play();request();}});
 const resize=new ResizeObserver(()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure)});sections.forEach(el=>resize.observe(el));resize.observe(hero);
 const dialogs=new MutationObserver(request);document.querySelectorAll('dialog').forEach(el=>dialogs.observe(el,{attributes:true,attributeFilter:['open']}));
 on(window,'pagehide',e=>{cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);frame=measureFrame=0;for(const a of running)a.pause();if(!e.persisted){dead=true;signal.abort();observer.disconnect();resize.disconnect();dialogs.disconnect();running.clear();}});
 on(window,'pageshow',()=>{measure();for(const a of running)a.play();});document.fonts.ready.then(()=>{if(!dead)measure();});measure();rootState();
 function rootState(){document.body.dataset.landingAnimations=animeReady?'initialized':'static-no-anime';}
})();
