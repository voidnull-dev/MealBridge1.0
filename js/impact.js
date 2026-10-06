import {timestampMillis} from './listing-model.js';
export function collectionImpact(claims,now=Date.now()){
 const date=new Date(now),months=Array.from({length:6},(_,i)=>{const start=new Date(date.getFullYear(),date.getMonth()-5+i,1),end=new Date(start.getFullYear(),start.getMonth()+1,1);return {start:+start,end:+end,label:start.toLocaleDateString(undefined,{month:'short',year:'2-digit'}),boxes:0,collections:0};});
 for(const c of claims){if(c.claimStatus!=='collected')continue;const time=timestampMillis(c.updatedAt),period=months.find(m=>time>=m.start&&time<m.end);if(period){period.boxes+=Number.isInteger(c.requestedBoxes)?c.requestedBoxes:0;period.collections++;}}
 return {months,boxesThisMonth:months.at(-1).boxes,completed:claims.filter(c=>c.claimStatus==='collected').length};
}
export function renderCollectionImpact(target,claims,metadata){
 target.replaceChildren();if(metadata?.fromCache){target.textContent='Waiting for confirmed collection records…';return;}
 const impact=collectionImpact(claims);if(!impact.completed){target.textContent='Your verified impact will appear here after your first collection.';return;}
 const max=Math.max(1,...impact.months.map(m=>m.boxes)),list=document.createElement('ol');list.className='real-impact-chart';list.setAttribute('aria-label','Food boxes collected in the last six calendar months');
 for(const month of impact.months){const row=document.createElement('li'),label=document.createElement('span'),bar=document.createElement('span'),value=document.createElement('strong');label.textContent=month.label;bar.className='real-impact-bar';bar.setAttribute('aria-hidden','true');bar.style.width=month.boxes/max*100+'%';value.textContent=month.boxes+' boxes';row.append(label,bar,value);list.append(row);}target.append(list);
}
