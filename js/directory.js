import {filterOrganizations,watchOrganizations,safeOrganizationImage} from './organizations.js';

import {LOCALITIES,serviceable,COVERAGE_ERROR} from './service-region.js';

import {icon} from './dashboard-template.js';



export function mountDirectory(root,{sdk,profile}){

 const role=profile.role==='hostel'?'ngo':'hostel',plural=role==='ngo'?'NGOs':'Hostels';

 const nav=root.querySelector('.db-nav'),button=document.createElement('button');button.dataset.panel='partners';button.innerHTML=icon('overview')+'<span>Discover Partners</span>';nav.insertBefore(button,nav.querySelector('[data-panel=settings]'));

 const section=document.createElement('section');section.dataset.section='partners';section.hidden=true;section.setAttribute('aria-labelledby','partners-title');section.innerHTML=`<div class="db-section-title"><div><h1 id="partners-title" tabindex="-1">Good neighbours.<br>Greater possibilities<span>.</span></h1><p>Discover ${plural} in Agra. Build trust before the next handoff.</p></div><span class="db-pill">Agra, Uttar Pradesh</span></div><div class="partner-search"><label for="partners-search">Search ${plural} in Agra</label><input id="partners-search" type="search" maxlength="160" placeholder="Organization, locality or area" autocomplete="off"></div><div class="partner-chips" role="group" aria-label="Agra locality"><button type="button" data-locality="all" aria-pressed="true">All Agra</button>${LOCALITIES.map(n=>`<button type="button" data-locality="${n}" aria-pressed="false">${n}</button>`).join('')}</div><div class="partner-controls"><label class="partner-check"><input id="partners-verified" type="checkbox">Verified only</label><div class="db-field"><label for="partners-sort">Sort organizations</label><select id="partners-sort"><option value="recent">Recently joined</option><option value="alpha">Alphabetical</option></select></div></div><p id="partners-status" role="status" aria-live="polite"></p><div id="partners-grid" class="partner-grid" aria-busy="true"></div><div id="partners-empty" class="db-empty" hidden><h2>No matching organizations found in Agra.</h2><p>Try another locality or remove a filter. New partners appear here automatically.</p><button class="button secondary" type="button" id="partners-reset">Clear filters</button></div><button class="button secondary" id="partners-retry" type="button" hidden>Retry partner discovery</button><p class="db-settings-note">Public organization information only. Personal contact details and pickup locations stay private.</p>`;

 root.querySelector('.db-main').insertBefore(section,root.querySelector('.db-footer'));

 const dialog=document.createElement('dialog');dialog.className='db-dialog partner-dialog';dialog.id='partner-profile';dialog.setAttribute('aria-labelledby','partner-profile-title');dialog.innerHTML='<div class="db-wizard-shell"><button type="button" class="icon-button db-dialog-close" data-partner-close aria-label="Close organization profile">×</button><div id="partner-profile-content"></div><button type="button" class="button secondary" data-partner-close>Close</button></div>';root.append(dialog);

 const $=s=>section.querySelector(s),abort=new AbortController(),on=(n,e,fn)=>n.addEventListener(e,fn,{signal:abort.signal});let items=[],stop,visible=false,dead=false,opener,locality='all',epoch=0;

 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};

 const label=p=>p.role==='ngo'?'NGO / Food Collector':'Hostel / Food Provider';

 const rating=p=>p.ratingCount>0?`${Number(p.averageRating).toFixed(1)} / 5 · ${p.ratingCount} reviews`:'No ratings received yet.';

 const joined=p=>{const ms=p.joinedAt?.toMillis?.()??(p.joinedAt?.seconds? p.joinedAt.seconds*1000:p.joinedAt);return Number.isFinite(ms)?new Date(ms).toLocaleDateString(undefined,{month:'short',year:'numeric'}):'Date pending';};

 function image(p){const region=node('div','partner-image'),url=safeOrganizationImage(p.photoURL,p.uid);if(url){const img=node('img');img.src=url;img.alt=p.organizationName;img.loading='lazy';img.width=96;img.height=96;img.addEventListener('error',()=>{img.remove();region.textContent=p.organizationName.slice(0,2).toUpperCase();},{once:true});region.append(img);}else region.textContent=p.organizationName.slice(0,2).toUpperCase();return region;}

 function badges(p){const n=node('div','partner-badges');n.append(node('span','db-pill',label(p)),node('span','db-pill',p.isVerified?'Verified':'Pending'));return n;}

 function detail(p){const hadFocus=dialog.querySelector('#partner-profile-content').contains(document.activeElement);const region=dialog.querySelector('#partner-profile-content');region.replaceChildren(image(p));const h=node('h2','',p.organizationName);h.id='partner-profile-title';h.tabIndex=-1;region.append(h,badges(p),node('p','partner-locality',p.locality+', Agra'),node('p','',p.shortDescription||'This partner has not added a public description yet.'),node('p','',rating(p)),node('p','db-muted','Joined '+joined(p)));

 const dl=node('dl','partner-totals');for(const [key,name]of (p.role==='hostel'?[['listingsCreated','Listings created'],['mealsShared','Meals shared']]:[['mealsCollected','Meals collected'],['collectionsCompleted','Collections completed']])){const g=node('div');g.append(node('dt','',name),node('dd','',Number.isFinite(p.publicStats?.[key])?String(p.publicStats[key]):'Not yet published'));dl.append(g);}region.append(dl);dialog.dataset.uid=p.uid;if(hadFocus)h.focus({preventScroll:true});

 }

 function render(meta={}){if(dead)return;const filtered=filterOrganizations(items,{search:$('#partners-search').value,locality,verified:$('#partners-verified').checked,sort:$('#partners-sort').value},role),grid=$('#partners-grid');grid.replaceChildren();grid.setAttribute('aria-busy','false');$('#partners-empty').hidden=filtered.length>0;$('#partners-status').textContent=`${filtered.length} ${plural} in Agra${meta.fromCache?' · cached; reconnect for current availability':''}`;

 for(const p of filtered){const card=node('article','db-panel partner-card');card.append(image(p),badges(p),node('h2','',p.organizationName),node('p','partner-locality',p.locality+', Agra'),node('p','partner-description',p.shortDescription||'A new connection in Agra’s food-rescue community.'),node('p','partner-rating',rating(p)),node('p','db-muted','Joined '+joined(p)));const b=node('button','button secondary','View Profile');b.type='button';b.dataset.partner=p.uid;b.setAttribute('aria-label','View '+p.organizationName+' profile');card.append(b);grid.append(card);}

 if(dialog.open){const p=items.find(p=>p.uid===dialog.dataset.uid&&['pending','verified'].includes(p.verificationStatus));if(p)detail(p);else dialog.close();}

 }

 function connect(){stop?.();stop=undefined;const token=++epoch;if(!visible||dead)return;if(!serviceable(profile)){$('#partners-status').textContent=COVERAGE_ERROR;$('#partners-grid').replaceChildren();$('#partners-grid').setAttribute('aria-busy','false');return;}$('#partners-retry').hidden=true;$('#partners-empty').hidden=true;$('#partners-status').textContent='Finding your Agra partners…';$('#partners-grid').setAttribute('aria-busy','true');$('#partners-grid').innerHTML='<div class="db-skeleton" aria-hidden="true"></div><div class="db-skeleton" aria-hidden="true"></div><div class="db-skeleton" aria-hidden="true"></div>';

 stop=watchOrganizations(sdk,role,(data,meta)=>{if(dead||token!==epoch)return;items=data;render(meta);},()=>{if(dead||token!==epoch)return;items=[];$('#partners-grid').replaceChildren();$('#partners-grid').setAttribute('aria-busy','false');$('#partners-status').textContent='Partners could not be loaded. Check your connection and the deployed directory rules, then retry.';$('#partners-retry').hidden=false;});}

 for(const [selector,event]of [['#partners-search','input'],['#partners-verified','change'],['#partners-sort','change']])on($(selector),event,()=>render());

 on(section,'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.locality){locality=b.dataset.locality;section.querySelectorAll('[data-locality]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));render();}if(b.dataset.partner){const p=items.find(p=>p.uid===b.dataset.partner);if(p){opener=b;detail(p);document.body.classList.add('db-dialog-open');dialog.showModal();dialog.querySelector('h2').focus();}}});

 on($('#partners-reset'),'click',()=>{locality='all';$('#partners-search').value='';$('#partners-verified').checked=false;$('#partners-sort').value='recent';section.querySelectorAll('[data-locality]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.locality==='all')));render();});on($('#partners-retry'),'click',connect);

 on(dialog,'click',e=>{if(e.target.closest('[data-partner-close]'))dialog.close();});on(dialog,'close',()=>{document.body.classList.remove('db-dialog-open');if(opener?.isConnected)opener.focus();else $('#partners-title').focus();});

 return {setVisible(value){visible=value;connect();if(!value&&dialog.open)dialog.close();},destroy(){dead=true;epoch++;stop?.();abort.abort();if(dialog.open)dialog.close();document.body.classList.remove('db-dialog-open');dialog.remove();}};

}



