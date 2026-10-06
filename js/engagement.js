import {createRatingRepository,ratingId,ratingCategories,ratingSummary,ratingDate} from './ratings.js';

import {createNotificationRepository} from './notifications.js';

import {timestampMillis} from './listing-model.js';



const bell='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';

const star='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z"/></svg>';

const close='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

export function mountEngagement(root,{sdk,user,profile,toast,onContext=()=>{},onScore=()=>{},onCollections=()=>{}}){

 const ratings=createRatingRepository(sdk,{user,profile}),notifications=createNotificationRepository(sdk,user),abort=new AbortController(),scores=new Map(),food=new Map(),partners=new Map(),animation=new Set(),motion=matchMedia('(prefers-reduced-motion:reduce)');

 const $=s=>root.querySelector(s),on=(n,e,fn)=>n.addEventListener(e,fn,{signal:abort.signal});let dead=false,inbox=[],sent=[],received=[],collections=[],notifyReady=false,rateReady=false,rateCache=true,notifyCache=true,busy=false,readBusy=false,current,opener,watchGeneration=0,notifyGeneration=0,historyGeneration=0,reviewStop;

 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};

 const actionHandlers=new WeakMap();on(root,'click',event=>{const b=event.target.closest('button');if(b&&!b.disabled)actionHandlers.get(b)?.();});

 const action=(text,fn,cls='db-text-button')=>{const b=node('button',cls,text);b.type='button';actionHandlers.set(b,fn);return b;};

 const shell=node('div','mb-engagement');shell.innerHTML=`

 <dialog class="db-dialog db-wizard mb-inbox" id="mb-inbox" aria-labelledby="mb-inbox-title"><div class="db-wizard-shell"><button class="icon-button db-wizard-close" data-mb-close aria-label="Close notifications">${close}</button><h2 id="mb-inbox-title" tabindex="-1">Your connections, in motion.</h2><p class="mb-intro">Updates from your MealBridge community.</p><div class="mb-inbox-toolbar"><button class="db-text-button" id="mb-read-all">Mark all as read</button><button class="db-text-button" id="mb-open-reviews">${profile.role==='admin'?'All partner ratings':'Received ratings'}</button></div><p id="mb-notify-error" role="alert" hidden></p><button class="db-text-button" id="mb-notify-retry" hidden>Retry notifications</button><div id="mb-notify-list" aria-busy="true"></div></div></dialog>

 <dialog class="db-dialog db-wizard mb-rating" id="mb-rating" aria-labelledby="mb-rating-title"><div class="db-wizard-shell"><button class="icon-button db-wizard-close" data-mb-close aria-label="Close rating">${close}</button><h2 id="mb-rating-title" tabindex="-1">A good handoff deserves a word.</h2><p class="mb-intro" id="mb-rating-context"></p><form id="mb-rating-form"><div id="mb-rating-fields"></div><div class="db-field"><label for="mb-feedback">Written feedback <span class="db-muted">· optional</span></label><textarea id="mb-feedback" maxlength="1000" rows="3" placeholder="What worked well? What could improve?"></textarea><small>Shared with this collection partner and MealBridge admin.</small></div><p id="mb-rating-error" role="alert" hidden></p><div class="mb-rating-actions"><button class="button secondary" type="button" data-mb-close>Maybe later</button><button class="button primary" id="mb-rating-submit">Submit rating</button></div></form></div></dialog>

 <dialog class="db-dialog db-wizard mb-reviews" id="mb-reviews" aria-labelledby="mb-reviews-title"><div class="db-wizard-shell"><button class="icon-button db-wizard-close" data-mb-close aria-label="Close reviews">${close}</button><h2 id="mb-reviews-title" tabindex="-1">${profile.role==='admin'?'Partner feedback.':'Words from your partners.'}</h2><p class="mb-intro" id="mb-reviews-summary">Connecting ratings…</p><div id="mb-reviews-list"></div><p id="mb-review-error" role="alert" hidden></p><button class="db-text-button" id="mb-review-retry" hidden>Retry ratings</button></div></dialog>`;root.append(shell);

 const bellButton=node('button','icon-button mb-bell');bellButton.type='button';bellButton.innerHTML=bell+'<span class="mb-unread" hidden></span>';bellButton.setAttribute('aria-label','Notifications, connecting');bellButton.setAttribute('aria-haspopup','dialog');bellButton.setAttribute('aria-controls','mb-inbox');$('.db-topbar-actions').prepend(bellButton);

 const dialogs=[...shell.querySelectorAll('dialog')],ratingDialog=$('#mb-rating'),notifyDialog=$('#mb-inbox'),reviewsDialog=$('#mb-reviews');

 function animate(target){if(motion.matches||!window.anime)return;let a;a=anime({targets:target,translateY:[6,0],duration:240,easing:'easeOutExpo',complete:()=>animation.delete(a)});animation.add(a);}

 function open(dialog){if(dead)return;const origin=document.activeElement;for(const d of dialogs)if(d.open)d.close();opener=origin?.isConnected?origin:bellButton;dialog.showModal();document.body.classList.add('db-dialog-open');dialog.querySelector('h2').focus();animate(dialog.querySelector('.db-wizard-shell'));}

 for(const d of dialogs){on(d,'close',()=>{if(!dialogs.some(x=>x.open))document.body.classList.remove('db-dialog-open');if(opener?.isConnected&&opener.getClientRects().length&&!opener.disabled)opener.focus();else bellButton.focus();if(d===reviewsDialog&&profile.role==='admin'){reviewStop?.();reviewStop=null;}});on(d,'cancel',e=>{if(d===ratingDialog&&busy)e.preventDefault();});}

 on(shell,'click',e=>{const b=e.target.closest('[data-mb-close]');if(b&&!busy)b.closest('dialog').close();});on(bellButton,'click',()=>open(notifyDialog));

 function notice(region,title,copy){region.replaceChildren();const box=node('div','mb-empty'),heading=node('h3','',title),p=node('p','',copy);box.append(heading,p);region.append(box);}

 function ratingState(){for(const b of root.querySelectorAll('[data-rate-claim]')){const done=sent.some(r=>r.claimId===b.dataset.rateClaim);b.disabled=done||!rateReady||rateCache;b.textContent=done?'Rating submitted':profile.role==='hostel'?'Rate NGO':'Rate Hostel';}$('#mb-rating-submit').disabled=busy||!rateReady||rateCache;}

 function displayScores(){for(const e of root.querySelectorAll('[data-provider-score]'))e.textContent=summary(e.dataset.providerScore);onScore();}

 function summary(uid){const entry=scores.get(uid);return !entry?.ready?'Ratings loading…':entry.error?'Ratings unavailable':ratingSummary(entry.items).label;}

 function setProviders(ids){const wanted=new Set(ids);for(const [uid,entry]of scores)if(!wanted.has(uid)){entry.stop();scores.delete(uid);}for(const uid of wanted)if(!scores.has(uid)){const entry={items:[],ready:false,stop:()=>{}};scores.set(uid,entry);entry.stop=ratings.watchProvider(uid,items=>{if(dead||scores.get(uid)!==entry)return;entry.items=items;entry.ready=true;entry.error=false;displayScores();},()=>{if(dead)return;entry.ready=true;entry.error=true;displayScores();});}displayScores();}

 function renderReviews(){const region=$('#mb-reviews-list');region.replaceChildren();$('#mb-reviews-summary').textContent=received.length?ratingSummary(received).label:'No ratings received yet.';if(!received.length){notice(region,'Every handoff starts a conversation.','Feedback will appear after a completed collection is rated.');return;}for(const r of [...received].sort((a,b)=>timestampMillis(b.createdAt)-timestampMillis(a.createdAt))){const card=node('article','mb-review');card.append(node('h3','',`${r.overallRating} / 5 · ${r.fromRole==='ngo'?'Food collector':'Food provider'}`),node('p','mb-meta',`${ratingDate(r.createdAt)} · Collection ${r.claimId}`));if(profile.role==='admin')card.append(node('p','mb-meta',`From ${r.fromUserId} → ${r.toUserId}`));const dl=node('dl','mb-categories');for(const [key,label]of ratingCategories[r.fromRole]||[]){const div=node('div');div.append(node('dt','',label),node('dd','',`${r.categoryRatings?.[key]} / 5`));dl.append(div);}card.append(dl,node('p','mb-feedback',r.feedback||'No written feedback.'));region.append(card);}}

 let sentStop,receivedStop,notifyStop,collectionStop;

 function connectRatings(){const token=++watchGeneration;sentStop?.();receivedStop?.();rateReady=false;rateCache=true;ratingState();$('#mb-review-error').hidden=true;$('#mb-review-retry').hidden=true;if(profile.role==='admin')return;

  sentStop=ratings.watchSent((items,meta)=>{if(dead||token!==watchGeneration)return;sent=items;rateReady=true;rateCache=meta.fromCache;ratingState();},error=>{if(dead||token!==watchGeneration)return;rateReady=false;ratingState();$('#mb-review-error').textContent='Your ratings could not be checked. Deploy the Phase 8 rules and retry.';$('#mb-review-error').hidden=false;$('#mb-review-retry').hidden=false;});

  receivedStop=ratings.watchReceived(items=>{if(dead||token!==watchGeneration)return;received=items;renderReviews();},()=>{if(dead||token!==watchGeneration)return;received=[];$('#mb-review-error').textContent='Received ratings could not be loaded. Reconnect and retry.';$('#mb-review-error').hidden=false;$('#mb-review-retry').hidden=false;});

 }

 function review(){open(reviewsDialog);if(profile.role==='admin'){reviewStop?.();$('#mb-reviews-summary').textContent='Connecting all partner ratings…';reviewStop=ratings.watchAll(items=>{if(!dead){received=items;renderReviews();}},()=>{if(!dead){$('#mb-review-error').hidden=false;$('#mb-review-error').textContent='Admin rating data could not be loaded. Retry after checking the deployed rules.';$('#mb-review-retry').hidden=false;}});}else renderReviews();}

 on($('#mb-open-reviews'),'click',review);on($('#mb-review-retry'),'click',()=>{if(profile.role==='admin')review();else connectRatings();});

 function stars(key,label){const field=node('fieldset','mb-stars'),legend=node('legend','',label);field.append(legend);const options=node('div','mb-star-options');for(let i=1;i<=5;i++){const wrap=node('label'),input=node('input');input.type='radio';input.name=key;input.value=i;input.required=true;input.setAttribute('aria-label',`${i} ${i===1?'star':'stars'}: ${label}`);const face=node('span','mb-star-face');face.innerHTML=star;wrap.append(input,face);options.append(wrap);}field.append(options);return field;}

 on(ratingDialog,'change',event=>{const field=event.target.closest('.mb-stars');if(!field)return;const value=Number(field.querySelector(':checked')?.value||0);for(const wrap of field.querySelector('.mb-star-options').children)wrap.classList.toggle('is-filled',Number(wrap.querySelector('input').value)<=value);});

 function openRating(claim){if(profile.role==='admin')return;if(!rateReady||rateCache){toast('Reconnect so we can check your previous ratings before you submit.');return;}if(!claim||claim.claimStatus!=='collected'||claim[profile.role==='hostel'?'hostelId':'ngoId']!==user.uid){toast('Ratings are available only for your completed collections.');return;}if(sent.some(r=>r.claimId===claim.id)){review();return;}current=claim;$('#mb-rating-form').reset();$('#mb-rating-error').hidden=true;$('#mb-rating-context').textContent=`${profile.role==='hostel'?'Rate NGO':'Rate Hostel'} · ${profile.role==='hostel'?(claim.ngoName||'Food collector'):(claim.partnerName||partners.get(claim.listingId)||'Food provider')} · ${claim.requestedBoxes} boxes collected`;const fields=$('#mb-rating-fields');fields.replaceChildren(stars('overallRating','Overall experience'));for(const [key,label]of ratingCategories[profile.role])fields.append(stars(key,label));ratingState();open(ratingDialog);}

 function rateButton(claim){const b=action(profile.role==='hostel'?'Rate NGO':'Rate Hostel',()=>openRating(claim),'button secondary');b.dataset.rateClaim=claim.id;b.disabled=!rateReady||rateCache||sent.some(r=>r.claimId===claim.id);if(sent.some(r=>r.claimId===claim.id))b.textContent='Rating submitted';return b;}

 on($('#mb-rating-form'),'submit',async e=>{e.preventDefault();if(busy||!e.target.reportValidity())return;busy=true;const data=new FormData(e.target),id=current.id;$('#mb-rating-error').hidden=true;for(const n of ratingDialog.querySelectorAll('input,textarea,button'))n.disabled=true;$('#mb-rating-submit').textContent='Saving your feedback…';try{await ratings.submit(id,{overallRating:data.get('overallRating'),categoryRatings:Object.fromEntries(ratingCategories[profile.role].map(([key])=>[key,data.get(key)])),feedback:$('#mb-feedback').value});if(dead)return;if(!sent.some(r=>r.claimId===id))sent.push({id:ratingId(user.uid,id),claimId:id});ratingDialog.close();toast('Thank you. Your rating has been shared with your collection partner.');}catch(error){if(!dead){$('#mb-rating-error').hidden=false;$('#mb-rating-error').textContent=error.code?.startsWith('mealbridge/')?error.message:'Feedback could not be saved. Check your connection and deployed Phase 8 rules, then retry.';}}finally{if(!dead){busy=false;for(const n of ratingDialog.querySelectorAll('input,textarea,button'))n.disabled=false;$('#mb-rating-submit').textContent='Submit rating';ratingState();}}});

 async function mark(ids){if(readBusy||notifyCache)return false;readBusy=true;renderInbox();try{await notifications.markRead(ids);if(!dead)$('#mb-notify-error').hidden=true;return !dead;}catch(_){if(!dead){$('#mb-notify-error').hidden=false;$('#mb-notify-error').textContent='Read status could not be saved. Reconnect and retry.';}return false;}finally{if(!dead){readBusy=false;renderInbox();}}}

 function renderInbox(){const focused=document.activeElement,restore=focused?.closest('#mb-notify-list'),key=focused?.closest('[data-notification-id]')?.dataset.notificationId,readFocus=focused?.dataset.mbRead;const unread=inbox.filter(n=>!n.isRead).length,badge=bellButton.querySelector('.mb-unread');badge.hidden=!unread;badge.textContent=unread>99?'99+':unread;bellButton.setAttribute('aria-label',notifyReady?`Notifications, ${unread} unread`:'Notifications, connecting');const region=$('#mb-notify-list');region.replaceChildren();region.setAttribute('aria-busy',String(!notifyReady));$('#mb-read-all').disabled=!unread||readBusy||notifyCache;if(!notifyReady){notice(region,'Connecting your inbox…','Your account updates will appear here.');return;}if(!inbox.length){notice(region,'You’re all caught up.','New updates will appear as your next connection unfolds.');return;}for(const n of [...inbox].sort((a,b)=>timestampMillis(b.createdAt)-timestampMillis(a.createdAt))){const row=node('article','mb-notification'+(!n.isRead?' is-unread':''));row.dataset.notificationId=n.id;row.append(node('h3','',n.title),node('p','',n.message),node('time','mb-meta',ratingDate(n.createdAt)));const actions=node('div','mb-notification-actions');if(n.type==='rating')actions.append(action('View rating',()=>{notifyDialog.close();review();}));else actions.append(action(n.relatedClaimId?'Open collection':n.relatedListingId?'Open listing':'View profile',()=>{notifyDialog.close();onContext(n);}));if(!n.isRead){const b=action(readBusy?'Saving…':'Mark as read',()=>void mark([n.id]));b.dataset.mbRead='true';b.disabled=readBusy||notifyCache;actions.append(b);}row.append(actions);region.append(row);}if(restore&&notifyDialog.open){const row=[...region.children].find(e=>e.dataset.notificationId===key),target=readFocus?row?.querySelector('[data-mb-read]:not(:disabled)'):row?.querySelector('button:not(:disabled)');(target||row?.querySelector('button:not(:disabled)')||$('#mb-inbox-title')).focus();}}

 function connectNotifications(){const token=++notifyGeneration;notifyStop?.();notifyReady=false;notifyCache=true;renderInbox();$('#mb-notify-error').hidden=true;$('#mb-notify-retry').hidden=true;let first=true,known=new Set();notifyStop=notifications.watch((items,meta)=>{if(dead||token!==notifyGeneration)return;const fresh=first?[]:items.filter(n=>!known.has(n.id)&&!n.isRead);known=new Set(items.map(n=>n.id));first=false;inbox=items;notifyReady=true;notifyCache=meta.fromCache;renderInbox();if(fresh.length&&!meta.fromCache)toast(fresh.length===1?fresh[0].title:`${fresh.length} new MealBridge updates.`);},()=>{if(dead||token!==notifyGeneration)return;notifyReady=false;notifyCache=true;inbox=[];renderInbox();$('#mb-notify-error').textContent='Your inbox could not be loaded. Deploy the Phase 8 rules, reconnect and retry.';$('#mb-notify-error').hidden=false;$('#mb-notify-retry').hidden=false;});}

 on($('#mb-notify-retry'),'click',connectNotifications);on($('#mb-read-all'),'click',()=>void mark(inbox.filter(n=>!n.isRead).map(n=>n.id)));

 const history=root.querySelector(profile.role==='hostel'?'#db-history':'#ngo-history');

 function renderHistory(){if(!history)return;history.replaceChildren();const complete=collections.filter(c=>c.claimStatus==='collected').sort((a,b)=>timestampMillis(b.updatedAt)-timestampMillis(a.updatedAt));if(!complete.length){notice(history,'Your first successful handoff starts here.','Completed collections will appear with a partner rating action.');return;}for(const c of complete){const row=node('article','mb-collection');row.dataset.claimId=c.id;row.append(node('h3','',food.get(c.listingId)||'Collected surplus food'),node('p','mb-meta',`${profile.role==='hostel'?(c.ngoName||'Food collector'):(partners.get(c.listingId)||'Food provider')} · ${c.requestedBoxes} boxes · ${ratingDate(c.updatedAt)}`),rateButton(c));history.append(row);}}

 function connectHistory(){if(!history)return;const token=++historyGeneration;collectionStop?.();history.textContent='Connecting collection history…';collectionStop=ratings.watchCollections(async (items,meta)=>{if(dead||token!==historyGeneration)return;collections=items;onCollections(items,meta);renderHistory();for(const c of items.filter(c=>c.claimStatus==='collected'))if(!food.has(c.listingId)){food.set(c.listingId,'Collected surplus food');try{const snap=await sdk.getDocFromServer(sdk.doc(sdk.db,'listings',c.listingId));if(dead||token!==historyGeneration)return;if(snap.exists()){food.set(c.listingId,snap.data().foodName);partners.set(c.listingId,snap.data().hostelName);}renderHistory();}catch(_){/* Collected context remains usable without a food title. */}}},()=>{if(dead)return;notice(history,'Collection history needs attention.','Reconnect and check the deployed Phase 8 rules.');history.append(action('Retry history',connectHistory));});}

 on(motion,'change',()=>{if(motion.matches){for(const a of animation){a.pause();a.seek(a.duration);}animation.clear();}});renderInbox();connectRatings();connectNotifications();connectHistory();if(profile.role==='hostel')setProviders([user.uid]);

 return {openRating,rateButton,summary,setProviders,refresh:()=>{ratingState();displayScores();},destroy(){dead=true;abort.abort();sentStop?.();receivedStop?.();notifyStop?.();collectionStop?.();reviewStop?.();for(const e of scores.values())e.stop();scores.clear();for(const a of animation)a.pause();animation.clear();for(const d of dialogs)if(d.open)d.close();shell.remove();bellButton.remove();inbox=sent=received=collections=[];document.body.classList.remove('db-dialog-open');}};

}

