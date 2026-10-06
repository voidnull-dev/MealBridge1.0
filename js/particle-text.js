/* Living type: irregular light particles resolve into a crisp cached glyph mask.
   Repaints are event-driven and bounded; no perpetual dot-matrix/idle loop. */
(() => {
  const host=document.querySelector('.particle-phrase'),source=host?.querySelector('.particle-source'),canvas=host?.querySelector('canvas');
  if(!host||!source||!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:1024px)'),forced=matchMedia('(forced-colors:active)');
  const eligible=()=>desktop.matches&&!reduced.matches&&!forced.matches;
  const events=new AbortController(),on=(target,type,fn,options={})=>target?.addEventListener(type,fn,{...options,signal:events.signal});
  const mask=document.createElement('canvas'),field=document.createElement('canvas'),ink=mask.getContext('2d',{willReadFrequently:true}),wash=field.getContext('2d');
  if(!ink||!wash)return;
  const clamp=n=>Math.max(0,Math.min(1,n));
  let width=0,height=0,ratio=1,particles=[],colors=[],frame=0,last=0,visible=false,gatherStart=0,until=0,revision=0,resizeTimer=0;
  let dissolve=0,targetDissolve=0,mouse={x:0,y:0,tx:0,ty:0,strength:0,active:false};
  function pause(){cancelAnimationFrame(frame);frame=0;}
  function permitted(){return eligible()&&visible&&!document.hidden&&!document.querySelector('dialog[open]');}
  function schedule(milliseconds=1500){if(!permitted()||!particles.length)return;until=Math.max(until,performance.now()+milliseconds);if(!frame)frame=requestAnimationFrame(tick);}
  function reset(){pause();particles=[];host.classList.remove('is-rendered');canvas.width=canvas.height=0;mask.width=mask.height=field.width=field.height=0;canvas.dataset.state='static';delete canvas.dataset.particles;}
  async function resize(){
    const token=++revision;pause();host.classList.remove('is-rendered');
    if(!eligible()){reset();return;}
    await document.fonts.ready;if(token!==revision||!eligible())return;
    const rect=source.getBoundingClientRect(),style=getComputedStyle(source);
    width=Math.round(rect.width);height=Math.round(rect.height);if(!width||!height)return;
    ratio=Math.min(devicePixelRatio||1,1.25);
    for(const item of [canvas,mask,field]){item.width=Math.ceil(width*ratio);item.height=Math.ceil(height*ratio);}
    for(const context of [ctx,ink,wash])context.setTransform(ratio,0,0,ratio,0,0);
    ink.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    if('letterSpacing'in ink)ink.letterSpacing=style.letterSpacing;
    ink.textAlign='center';ink.textBaseline='middle';
    const theme=getComputedStyle(document.documentElement),fg=theme.getPropertyValue('--fg').trim(),accent=theme.getPropertyValue('--accent').trim();
    colors=[accent,theme.getPropertyValue('--film-mint').trim(),fg,theme.getPropertyValue('--film-amber').trim()];
    const lines=source.innerText.split('\n').map(s=>s.trim()).filter(Boolean),lineHeight=parseFloat(style.lineHeight);
    lines.forEach((line,i)=>{ink.fillStyle=i?accent:fg;ink.fillText(line,width/2,lineHeight*(i+.5),width);});
    const data=ink.getImageData(0,0,mask.width,mask.height).data,candidates=[];let seed=27;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let y=0;y<height;y+=3)for(let x=0;x<width;x+=3){const px=x+random()*3,py=y+random()*3,ix=Math.min(mask.width-1,Math.floor(px*ratio)),iy=Math.min(mask.height-1,Math.floor(py*ratio));if(data[(iy*mask.width+ix)*4+3]>100)candidates.push({x:px,y:py});}
    const budget=navigator.connection?.saveData||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<4)?1000:2600;
    const count=Math.min(budget,candidates.length);particles=[];
    for(let i=0;i<count;i++){const p=candidates[Math.floor(i*candidates.length/count)],angle=random()*Math.PI*2;particles.push({...p,dx:Math.cos(angle)*(45+random()*180),dy:Math.sin(angle)*(20+random()*75),size:.7+random()*1.2,color:i%43===0?3:i%3});}
    canvas.dataset.particles=String(particles.length);gatherStart=performance.now();dissolve=targetDissolve=0;
    mouse={x:width/2,y:height/2,tx:width/2,ty:height/2,strength:0,active:false};
    if(visible){canvas.dataset.state='gathering';schedule(2450);}
  }
  function paint(gather){
    ctx.clearRect(0,0,width,height);
    const formed=clamp((gather-.3)/.7),smooth=formed*formed*(3-2*formed);
    if(mouse.strength>.01){
      wash.globalCompositeOperation='source-over';wash.clearRect(0,0,width,height);wash.drawImage(mask,0,0,width,height);
      wash.globalCompositeOperation='destination-out';const gradient=wash.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,100);
      gradient.addColorStop(0,`rgba(0,0,0,${mouse.strength*.94})`);gradient.addColorStop(.5,`rgba(0,0,0,${mouse.strength*.55})`);gradient.addColorStop(1,'rgba(0,0,0,0)');
      wash.fillStyle=gradient;wash.fillRect(mouse.x-100,mouse.y-100,200,200);wash.globalCompositeOperation='source-over';
    }
    ctx.globalAlpha=smooth*(1-dissolve);ctx.drawImage(mouse.strength>.01?field:mask,0,0,width,height);
    const spread=Math.pow(1-gather,2)+dissolve*.75;
    for(const p of particles){
      const dx=p.x-mouse.x,dy=p.y-mouse.y,distance=Math.hypot(dx,dy),near=Math.pow(clamp(1-distance/110),2)*mouse.strength;
      const force=near*42,x=p.x+p.dx*spread+dx/Math.max(1,distance)*force,y=p.y+p.dy*spread+dissolve*45+dy/Math.max(1,distance)*force;
      const alpha=clamp((1-gather)*.85+dissolve*.5+near*.9)*(1-dissolve*.75);if(alpha<.008)continue;
      ctx.globalAlpha=alpha;ctx.fillStyle=colors[p.color];ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;host.classList.add('is-rendered');
  }
  function tick(now){
    frame=0;if(!eligible()){reset();return;}if(!permitted())return;
    if(now-last>=1000/30){last=now;mouse.x+=(mouse.tx-mouse.x)*.22;mouse.y+=(mouse.ty-mouse.y)*.22;mouse.strength+=((mouse.active?1:0)-mouse.strength)*.16;dissolve+=(targetDissolve-dissolve)*.17;
      const gather=clamp((now-gatherStart)/2300);paint(gather);
      canvas.dataset.state=gather<1?'gathering':dissolve>.02?'dissolving':mouse.strength>.02?'reacting':'settled';
      if(now>=until&&gather===1){paint(1);return;}
    }
    frame=requestAnimationFrame(tick);
  }
  const intersection=new IntersectionObserver(entries=>{const entry=entries[0],was=visible;visible=entry.isIntersecting;if(!visible){pause();return;}if(!was&&particles.length){gatherStart=performance.now();canvas.dataset.state='gathering';schedule(2450);}},{threshold:[0,.1]});intersection.observe(host);
  const sizes=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,100);});sizes.observe(source);
  on(host,'pointermove',event=>{if(event.pointerType!=='mouse'||!eligible())return;const r=host.getBoundingClientRect();mouse.tx=event.clientX-r.left;mouse.ty=event.clientY-r.top;mouse.active=true;schedule(1600);},{passive:true});
  on(host,'pointerleave',()=>{mouse.active=false;schedule(1600);},{passive:true});
  let scrollFrame=0;
  on(window,'scroll',()=>{if(!visible||!eligible()||scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const r=host.getBoundingClientRect(),distance=Math.abs(r.top+r.height/2-innerHeight/2)/((innerHeight+r.height)/2);targetDissolve=clamp((distance-.5)/.5);schedule(650);});},{passive:true});
  function sync(){if(!eligible()){reset();return;}if(!permitted())pause();else if(!particles.length)resize();else schedule(650);}
  on(reduced,'change',resize);on(desktop,'change',resize);on(forced,'change',resize);on(navigator.connection,'change',resize);
  on(document,'visibilitychange',sync);on(document,'mealbridge:theme',resize);
  const dialogs=new MutationObserver(sync);document.querySelectorAll('dialog').forEach(dialog=>dialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
  on(window,'pagehide',event=>{pause();clearTimeout(resizeTimer);cancelAnimationFrame(scrollFrame);if(!event.persisted){events.abort();intersection.disconnect();sizes.disconnect();dialogs.disconnect();reset();}});
  on(window,'pageshow',sync);resize();
})();
