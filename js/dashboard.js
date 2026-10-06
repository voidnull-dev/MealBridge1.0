import {collectionImpact,renderCollectionImpact} from './impact.js';
import {mountDirectory} from './directory.js';
import {serviceable,COVERAGE_ERROR} from './service-region.js';
import {mountPickupLocation} from './pickup-manual.js';
import {dashboardTemplate,icon} from './dashboard-template.js';
import {expiryState} from './dashboard-data.js';

import {DEFAULT_FOOD_IMAGE,FOOD_TYPES,FOOD_LABELS,listingStatus,listingMessage,safeFoodImage,timestampMillis,validateImageSignature} from './listing-model.js';

import {mountEngagement} from './engagement.js';

export function mountDashboard(root,{sdk,profile,user,repository,logout}) {
  root.innerHTML=dashboardTemplate();
  const directory=mountDirectory(root,{sdk,profile});
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  const abort=new AbortController(),listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:800px)');
  let collectionState=null,listings=[],loaded=false,dataError=null,unsubscribeListings,destroyed=false,busy=false,editing=null,draftId,selectedFile=null,removeImage=false,objectURL=null,selectionToken=0,selectionPending=false,operation,fromCache=false;
  const pending=new Set();
  const migrated=new Set();
  let filter='all',query='',panel='overview',step=0,maxStep=0,cancelID,opener,toastTimer,interval;
  const animations=new Set();
  const animate=options=>{
    if(!window.anime||reduced.matches)return;
    let instance;const complete=options.complete;
    instance=anime({...options,complete:()=>{animations.delete(instance);complete?.();}});animations.add(instance);return instance;
  };
  const initials=name=>name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  $('#db-account-name').textContent=profile.name;$('#db-avatar').textContent=initials(profile.name);
  $('#settings-name').textContent=profile.organizationName;$('#settings-email').textContent=user.email;
  $('#settings-avatar').textContent=initials(profile.organizationName);
  for(const [id,value]of [['setting-org',profile.organizationName],['setting-city',profile.city],['setting-contact',profile.name],['setting-phone',profile.phone],['setting-pickup','Enter your Agra pickup details when posting']]){const input=$('#'+id);input.value=value;input.readOnly=true;}
  const locked=document.createElement('p');locked.className='role-lock';locked.textContent='Registered as Hostel · Locked';$('#settings-verification').after(locked);const roleNote=document.createElement('p');roleNote.className='db-settings-note';roleNote.textContent='Your organization type is permanent after registration to protect platform trust and workflow integrity.';locked.after(roleNote);if(!serviceable(profile)){$('.db-demo-banner p').textContent=COVERAGE_ERROR+' Your records remain available; new listing creation is disabled.';}
  $('#settings-verification').textContent=profile.isVerified?'Verified profile':'Awaiting organization verification';
  $('#db-greeting').textContent=`Welcome back, ${profile.name.split(/\s+/)[0]}. Let’s give surplus a second purpose.`;

  function toast(text){
    clearTimeout(toastTimer);const region=$('#surplus-wizard').open?$('#wizard-toast'):$('#db-toast');region.replaceChildren();
    const box=document.createElement('div');box.className='db-toast';const label=document.createElement('span');label.textContent=text;
    const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Dismiss notification');close.addEventListener('click',()=>box.remove(),{once:true});box.append(label,close);region.append(box);
    animate({targets:box,translateY:[8,0],duration:250,easing:'easeOutExpo'});toastTimer=setTimeout(()=>box.remove(),10000);
  }
  const actualStatus=item=>listingStatus(item);
  const active=item=>['Available','Partially Claimed'].includes(actualStatus(item));
  const dateLabel=value=>{const ms=timestampMillis(value);return ms?new Date(ms).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Syncing…';};
  const closed=item=>!['Available','Partially Claimed','Paused'].includes(actualStatus(item));
  const normalize=item=>({...item,name:item.foodName,type:FOOD_LABELS[item.foodType]||'Mixed',packing:item.packingCondition,total:item.totalBoxes,available:item.availableBoxes,claimed:item.claimedBoxes,meals:item.mealsPerBox,expiry:timestampMillis(item.expiryTime),contact:item.contactPerson});
  function stats(countUp=false){
    const impact=collectionState&&!collectionState.meta.fromCache?collectionImpact(collectionState.items):null;
    const values={meals:impact?.boxesThisMonth,success:impact?.completed,active:listings.filter(active).length,boxes:listings.filter(active).reduce((total,item)=>total+item.available,0)};
    $$('[data-stat]').forEach(element=>{const value=values[element.dataset.stat];element.textContent=value===undefined?(element.dataset.stat==='co2'?'Not measured':'—'):loaded?value.toLocaleString('en-US'):'—';});
  }

  function foodBlock(item,level=3){
    const wrapper=document.createElement('div');wrapper.className='db-listing-food';
    const thumbnail=document.createElement('div');thumbnail.className='db-food-thumbnail';
    const img=document.createElement('img');img.src=safeFoodImage(item.foodImage,item.foodImagePath,user.uid,item.id);img.alt=img.src.endsWith(DEFAULT_FOOD_IMAGE)?'Default food photo':item.name;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{if(!img.src.endsWith(DEFAULT_FOOD_IMAGE)){img.src=DEFAULT_FOOD_IMAGE;img.alt='Default food photo';}},{once:true});thumbnail.append(img);
    const content=document.createElement('div');const id=document.createElement('span');id.className='db-listing-id';id.textContent='Created '+dateLabel(item.createdAt);
    const name=document.createElement(`h${level}`);name.textContent=item.name;const type=document.createElement('span');type.className='db-food-type';type.textContent=item.type+' · '+item.packing;const score=document.createElement('span');score.className='mb-provider-score';score.dataset.providerScore=user.uid;score.textContent=engagement.summary(user.uid);content.append(id,name,type,score);wrapper.append(thumbnail,content);return wrapper;
  }
  function featured(){
    const region=$('#db-featured-listings');region.replaceChildren();
    listings.filter(active).slice(0,2).forEach(item=>{
      const card=document.createElement('article');card.className='db-featured';card.append(foodBlock(item));
      const bottom=document.createElement('div');bottom.className='db-featured-bottom';const quantity=document.createElement('span');quantity.textContent=`${item.available} / ${item.total} boxes available`;
      const urgency=document.createElement('span');urgency.className='db-urgency';const state=expiryState(item.expiry);urgency.dataset.tone=state.tone;urgency.textContent=state.label;bottom.append(quantity,urgency);card.append(bottom);region.append(card);
    });
    if(!region.children.length){const text=document.createElement('p');text.textContent=dataError?'Your listings could not be loaded. Open My listings to retry.':!loaded?'Connecting your listings…':'No food listings have been posted yet.';region.append(text);}
  }
  function renderListings(){
    const visible=listings.filter(item=>(filter==='all'||filter==='active'&&active(item)||filter==='completed'&&!active(item))&&item.name.toLowerCase().includes(query));
    const region=$('#db-listings');region.replaceChildren();
    visible.forEach(item=>{
      const status=actualStatus(item),isClosed=closed(item);const state=expiryState(item.expiry);
      const card=document.createElement('article');card.className='db-listing';card.dataset.listingId=item.id;card.append(foodBlock(item,2));
      const quantity=document.createElement('div');quantity.className='db-listing-quantity';quantity.innerHTML='<span class="db-listing-label">Available / total boxes</span><strong></strong><small></small>';quantity.querySelector('strong').textContent=`${item.available} / ${item.total}`;quantity.querySelector('small').textContent=`${item.claimed} boxes claimed · ~${item.meals} meals / box`;
      const expiry=document.createElement('div');expiry.className='db-listing-expiry';expiry.innerHTML='<span class="db-listing-label">Collection deadline</span><strong></strong><span class="db-urgency"></span>';
      expiry.querySelector('strong').textContent=status==='Collected'?'Completed':isClosed?status:state.time;
      expiry.querySelector('.db-urgency').textContent=status==='Expired'?'Expired':status==='Cancelled'?'Cancelled':status==='Paused'?'Paused':status==='Claimed'?'Claimed':state.label;expiry.querySelector('.db-urgency').dataset.tone=isClosed?'calm':state.tone;
      const action=document.createElement('div');action.className='db-listing-status';const pill=document.createElement('span');pill.className='db-pill';pill.textContent=status;action.append(pill);
      const buttons=document.createElement('div');buttons.className='db-listing-actions';
      for(const [name,text]of [['edit','Edit'],['pause',item.isPaused?'Resume':'Pause'],['cancel','Cancel']]){const button=document.createElement('button');button.type='button';button.dataset.action=name;button.dataset.id=item.id;button.textContent=text;button.disabled=isClosed||pending.has(item.id)||fromCache;button.setAttribute('aria-label',`${text} listing: ${item.name}`);buttons.append(button);}action.append(buttons);
      const detail=document.createElement('div');detail.className='db-listing-detail';
      const ready=document.createElement('span');ready.textContent='Ready '+dateLabel(item.readyTime)+' · ~'+item.totalBoxes*item.mealsPerBox+' meals total';detail.append(ready);
      if(![2,3].includes(item.schemaVersion)){const notice=document.createElement('p');notice.textContent='Private pickup upgrade required before NGO discovery.';const secure=document.createElement('button');secure.className='db-text-button';secure.textContent='Secure pickup details';secure.dataset.action='migrate';secure.dataset.id=item.id;secure.disabled=fromCache||pending.has(item.id);detail.append(notice,secure);}
      if(item.notes){const notes=document.createElement('p');notes.textContent=item.notes;detail.append(notes);}
      card.append(quantity,expiry,action,detail);region.append(card);
    });
    $('.db-nav-count').textContent=loaded?String(listings.length):'—';
    $('#db-list-count').textContent=dataError?'Connection needs attention.':!loaded?'Connecting your listings…':fromCache?'Showing cached listings. Reconnect to manage them.':`Showing ${visible.length} of ${listings.length} listings · Synced to your account`;
    $('#db-list-error').hidden=!dataError;$('#db-list-error').textContent=dataError?listingMessage(dataError):'';
    $('#db-retry-listings').hidden=!dataError;
    $('#db-list-empty').hidden=!loaded||Boolean(dataError)||visible.length>0;
    $('#db-empty-copy').textContent=listings.length?'No listings match these filters. Clear them to see your food.':'No food listings have been posted yet.';
    $('#db-clear-filters').hidden=!listings.length;
    if(!loaded&&!dataError){region.innerHTML='<div class="db-skeleton" aria-hidden="true"></div><div class="db-skeleton" aria-hidden="true"></div><div class="db-skeleton" aria-hidden="true"></div>';}
    stats();featured();
  }
  function chart(){ if(collectionState)renderCollectionImpact($('#db-chart'),collectionState.items,collectionState.meta);else $('#db-chart').textContent='Connecting your actual collection records…';$('#db-chart-data').textContent=''; }
  const engagement=mountEngagement(root,{sdk,user,profile,toast,onCollections:(items,meta)=>{collectionState={items,meta};renderCollectionImpact($('#db-chart'),items,meta);stats();},onContext:n=>{showPanel(n.relatedClaimId?'impact':n.relatedListingId?'listings':'settings');const target=root.querySelector(`[data-${n.relatedClaimId?'claim':'listing'}-id="${CSS.escape(n.relatedClaimId||n.relatedListingId)}"]`);target?.scrollIntoView({block:'center',behavior:'instant'});}});
  function closeMenu(restore=false){$('#db-sidebar').classList.remove('is-open');$('#db-menu-toggle').setAttribute('aria-expanded','false');$('#db-menu-toggle').setAttribute('aria-label','Open workspace navigation');$('#db-menu-scrim').hidden=true;$('#db-sidebar').inert=mobile.matches;if(mobile.matches)$('.db-body').inert=false;if(restore)$('#db-menu-toggle').focus();document.body.classList.remove('db-dialog-open');}
  function showPanel(name){
    if(!['overview','listings','impact','settings','partners'].includes(name))return;
    panel=name;directory.setVisible(name==='partners');$$('[data-section]').forEach(section=>{section.hidden=section.dataset.section!==name;});$$('.db-nav [data-panel]').forEach(button=>{if(button.dataset.panel===name)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    closeMenu();window.scrollTo({top:0,behavior:'instant'});$(`[data-section="${name}"] h1`).tabIndex=-1;$(`[data-section="${name}"] h1`).focus({preventScroll:true});animate({targets:$(`[data-section="${name}"]`),translateY:[10,0],duration:450,easing:'easeOutExpo'});
  }
  function syncTheme(){const choice=window.MealBridgeTheme.preference;$('#db-theme').value=choice;$('#settings-theme').value=choice;}
  listen(document,'mealbridge:theme',syncTheme);syncTheme();
  for(const select of [$('#db-theme'),$('#settings-theme')])listen(select,'change',()=>{window.MealBridgeTheme.set(select.value);syncTheme();});
  listen($('#db-menu-toggle'),'click',()=>{
    if($('#db-sidebar').classList.contains('is-open')){closeMenu(true);return;}
    $('#db-sidebar').inert=false;$('#db-sidebar').classList.add('is-open');$('#db-menu-toggle').setAttribute('aria-expanded','true');$('#db-menu-toggle').setAttribute('aria-label','Close workspace navigation');$('#db-menu-scrim').hidden=false;document.body.classList.add('db-dialog-open');$('.db-body').inert=true;$('.db-nav button').focus();
    animate({targets:$('.db-nav'),translateX:[-8,0],duration:250,easing:'easeOutExpo'});
  });
  listen($('#db-menu-scrim'),'click',()=>closeMenu(true));listen(mobile,'change',()=>closeMenu());closeMenu();
  listen(document,'keydown',event=>{
    if(!$('#db-sidebar').classList.contains('is-open'))return;
    if(event.key==='Escape'){event.preventDefault();closeMenu(true);}
    else if(event.key==='Tab'){
      const controls=[...$('#db-sidebar').querySelectorAll('a,button')].filter(element=>!element.disabled);const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const form=$('#surplus-form'),wizard=$('#surplus-wizard'),pickupLocation=mountPickupLocation(form);
  const localDate=date=>{const shifted=new Date(date.getTime()-date.getTimezoneOffset()*60000);return shifted.toISOString().slice(0,16);};
  function preview(){
    const boxes=Number(form.elements.boxes.value),meals=Number(form.elements.meals.value),ready=Date.parse(form.elements.ready.value),expiry=Date.parse(form.elements.expiry.value);
    const minutes=Math.round((expiry-ready)/60000),valid=Number.isFinite(minutes)&&minutes>0&&expiry>Date.now();
    $('#wizard-window').textContent=valid?`${Math.floor(minutes/60)}h ${minutes%60}m collection window`:'Choose a valid collection window';
    $('#wizard-expiry-label').textContent=valid?`${boxes*meals} approximate meals · ${expiryState(expiry).label}`:'Expiry must follow pickup readiness and be in the future.';
    $('#wizard-timezone').textContent=`Local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    $('#preview-name').textContent=form.elements.name.value;
    $('#preview-details').textContent=`${form.elements.type.value} · ${boxes} boxes × ~${meals} meals · ${boxes*meals} approximate meals. ${form.elements.packing.value}.`;
    $('#preview-allergens').textContent=`Allergens: ${form.elements.allergens.value}`;
    $('#preview-pickup').textContent=`Pickup: ${form.elements.location.value || 'Add a pickup location'} · Contact: ${form.elements.contact.value || 'Add a contact'}`;
  }
  function setStep(next){step=next;void pickupLocation.setOpen(wizard.open&&step===2);$$('[data-wizard-page]').forEach(fieldset=>{fieldset.hidden=Number(fieldset.dataset.wizardPage)!==step;fieldset.disabled=fieldset.hidden;});$$('[data-wizard-step]').forEach(button=>{button.disabled=Number(button.dataset.wizardStep)>maxStep;if(Number(button.dataset.wizardStep)===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});$('#wizard-back').hidden=step===0;$('#wizard-next').hidden=step===2;$('#wizard-publish').hidden=step!==2;$('#wizard-step-label').textContent=`Step ${step+1} of 3`;$('#wizard-error').hidden=true;preview();if(wizard.open){wizard.scrollTop=0;$('#wizard-title').focus();}}
  function validateStep(index){
    if(selectionPending){toast('Checking your food photo. Please wait a moment.');return false;}
    const fieldset=$(`[data-wizard-page="${index}"]`);
    for(const input of fieldset.querySelectorAll('input,select,textarea')){if(!input.checkValidity()){input.reportValidity();input.focus();return false;}if(input.required&&input.type==='text'&&!input.value.trim()){$('#wizard-error').textContent='Please enter meaningful details rather than spaces.';$('#wizard-error').hidden=false;input.focus();return false;}}
    if(index===1){const ready=Date.parse(form.elements.ready.value),expiry=Date.parse(form.elements.expiry.value);if((!editing||ready!==timestampMillis(editing.readyTime))&&ready<Date.now()-5*60000||expiry<=ready||expiry<=Date.now()){$('#wizard-error').textContent='Pickup readiness must be current or in the future, and expiry must be after readiness.';$('#wizard-error').hidden=false;$('#food-expiry').focus();return false;}}
    return true;
  }
  function openWizard(item){
    opener=document.activeElement;form.reset();$('#wizard-toast').replaceChildren();maxStep=0;
    if(busy)return;editing=item||null;draftId=item?.id||repository.newId();selectedFile=null;removeImage=false;selectionToken++;selectionPending=false;clearObjectURL();
    $('#wizard-upload').hidden=true;$('#food-image').value='';setPhoto(item?.foodImage||DEFAULT_FOOD_IMAGE,item?.foodImagePath||'');
    const ready=new Date(item?timestampMillis(item.readyTime):Date.now()+10*60000),expiry=new Date(item?item.expiry:Date.now()+4*3600000);
    form.elements.ready.value=localDate(ready);form.elements.expiry.value=localDate(expiry);
    form.elements.location.value=item?.privatePickup?.exactLocation?.address||item?.privatePickup?.exactAddress||item?.location?.address||'';form.elements.city.value=item?.location?.city||'Agra';form.elements.city.readOnly=true;form.elements.contact.value=item?.privatePickup?.contactPerson||item?.contact||profile.name;
    $('#wizard-publish').innerHTML=(item?'Save Changes':'Publish Listing')+' '+icon('arrow');
    $('#wizard-title').textContent=item?'Refine your listing.':'Give good food a second purpose.';
    if(item){for(const key of ['name','type','packing','allergens','notes'])form.elements[key].value=item[key];form.elements.notes.value=item.privatePickup?.additionalPickupInstructions||item.notes||'';form.elements.boxes.value=item.total;form.elements.meals.value=item.meals;}
    pickupLocation.reset(item?.privatePickup,item?.publicLocation);setStep(0);wizard.showModal();document.body.classList.add('db-dialog-open');$('#wizard-title').focus();animate({targets:$('.db-wizard-shell'),translateY:[10,0],duration:300,easing:'easeOutExpo'});
  }
  listen(wizard,'close',()=>{void pickupLocation.setOpen(false);selectionToken++;selectionPending=false;clearObjectURL();document.body.classList.remove('db-dialog-open');if(opener?.isConnected&&opener.getClientRects().length)opener.focus();else $('[data-post]').focus();});
  listen(form,'input',preview);listen(form,'change',preview);
  listen($('#wizard-next'),'click',()=>{if(validateStep(step)){maxStep=Math.max(maxStep,step+1);setStep(step+1);}});
  listen($('#wizard-back'),'click',()=>setStep(Math.max(0,step-1)));
  $$('[data-wizard-step]').forEach(button=>listen(button,'click',()=>{const next=Number(button.dataset.wizardStep);if(next<=step||validateStep(step))setStep(next);}));
  function clearObjectURL(){if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}}
  function setPhoto(url,path=''){
    const source=objectURL||safeFoodImage(url,path,user.uid,editing?.id||draftId);
    for(const img of [$('#food-image-preview'),$('#listing-image-preview')]){img.src=source;img.alt=source===DEFAULT_FOOD_IMAGE?'Default food photo':'Food photo preview';}
    $('#food-image-status').textContent=selectedFile?selectedFile.name:source===DEFAULT_FOOD_IMAGE?'Default food photo':'Current food photo';$('#food-image-remove').hidden=source===DEFAULT_FOOD_IMAGE;
  }
  function setBusy(value){
    busy=value;wizard.setAttribute('aria-busy',String(value));
    $$('[data-wizard-page]').forEach(fieldset=>fieldset.disabled=value||Number(fieldset.dataset.wizardPage)!==step);
    $$('.db-wizard-steps button').forEach(button=>button.disabled=value||Number(button.dataset.wizardStep)>maxStep);
    for(const button of [$('#wizard-back'),$('#wizard-next'),$('#wizard-publish'),$('[data-wizard-close]')])button.disabled=value;
    $('#wizard-publish').innerHTML=(value?'Saving…':editing?'Save Changes':'Publish Listing')+' '+icon('arrow');
  }
  listen(wizard,'cancel',event=>{if(busy){event.preventDefault();toast('Your listing is being saved. Please keep this window open.');}});
  listen($('#food-image'),'change',async()=>{
    const file=$('#food-image').files[0],token=++selectionToken;if(!file)return;selectionPending=true;$('#food-image-status').textContent='Checking food photo…';
    try{await validateImageSignature(file);if(token!==selectionToken||destroyed)return;clearObjectURL();objectURL=URL.createObjectURL(file);
      const probe=new Image();probe.src=objectURL;await probe.decode();if(token!==selectionToken||destroyed)return;selectedFile=file;removeImage=false;setPhoto(objectURL);
    }catch(error){if(token!==selectionToken||destroyed)return;clearObjectURL();selectedFile=null;$('#food-image').value='';setPhoto(removeImage?DEFAULT_FOOD_IMAGE:editing?.foodImage||DEFAULT_FOOD_IMAGE,editing?.foodImagePath);toast(error.code?listingMessage(error):'This image cannot be displayed. Choose another JPG, PNG, or WebP photo.');}
    finally{if(token===selectionToken)selectionPending=false;}
  });
  listen($('#food-image-remove'),'click',()=>{selectionToken++;selectionPending=false;clearObjectURL();selectedFile=null;removeImage=true;$('#food-image').value='';setPhoto(DEFAULT_FOOD_IMAGE);});
  listen(form,'submit',async event=>{
    event.preventDefault();if(busy)return;if(step!==2){$('#wizard-next').click();return;}
    if(!validateStep(2))return;
    for(let index=0;index<3;index++){const fieldset=$(`[data-wizard-page="${index}"]`);fieldset.disabled=false;const valid=validateStep(index);fieldset.disabled=index!==step;if(!valid){const message=$('#wizard-error').textContent,hasError=!$('#wizard-error').hidden;setStep(index);if(hasError){$('#wizard-error').textContent=message;$('#wizard-error').hidden=false;}return;}}
    const input={foodName:form.elements.name.value,foodType:FOOD_TYPES[form.elements.type.value],totalBoxes:form.elements.boxes.value,mealsPerBox:form.elements.meals.value,readyTime:Date.parse(form.elements.ready.value),expiryTime:Date.parse(form.elements.expiry.value),city:form.elements.city.value,address:form.elements.location.value,contactPerson:form.elements.contact.value,notes:form.elements.notes.value,allergens:form.elements.allergens.value,packingCondition:form.elements.packing.value,hygieneConfirmed:form.elements.hygiene.checked};
    try{Object.assign(input,pickupLocation.value());}catch(error){$('#wizard-error').textContent=error.message;$('#wizard-error').hidden=false;return;}
    operation=new AbortController();setBusy(true);$('#wizard-upload').hidden=false;$('#upload-progress').value=0;$('#upload-label').textContent=selectedFile?'Uploading food photo…':'Saving your listing…';$('#upload-message').textContent=selectedFile?'Preparing upload…':'Connecting securely…';
    try{await repository.save(draftId,input,{existing:editing,file:selectedFile,removeImage,signal:operation.signal,progress:(percent,phase)=>{if(destroyed)return;$('#upload-progress').value=percent;$('#upload-message').textContent=phase==='saving'?'Saving your listing…':`Uploading food photo · ${percent}%`;}});
      if(destroyed)return;const wasEdit=Boolean(editing);setBusy(false);wizard.close();form.reset();clearObjectURL();selectedFile=null;showPanel('listings');toast(wasEdit?'Listing updated. Your latest details are synced.':'Listing published. Good food has a new possibility.');animate({targets:$('#db-listings'),translateY:[8,0],duration:350,easing:'easeOutExpo'});
    }catch(error){if(destroyed)return;setBusy(false);$('#wizard-upload').hidden=true;$('#wizard-error').textContent=listingMessage(error);$('#wizard-error').hidden=false;toast(listingMessage(error));}
  });
  listen($('#db-settings-form'),'submit',event=>{event.preventDefault();toast('Demo preferences updated for this session. In-app delivery and your profile are unchanged.');});
  listen(root,'click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.panel)showPanel(button.dataset.panel);
    if(button.hasAttribute('data-post')&&!serviceable(profile)){toast(COVERAGE_ERROR);return;}
    if(button.hasAttribute('data-post'))openWizard();
    if(button.hasAttribute('data-wizard-close')&&!busy)wizard.close();
    if(button.dataset.listFilter){filter=button.dataset.listFilter;$$('[data-list-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderListings();}
    if(button.dataset.chart)chart(button.dataset.chart);
    if(button.dataset.action){const item=listings.find(item=>item.id===button.dataset.id);if(!item||pending.has(item.id)||fromCache)return;
      if(button.dataset.action==='edit')void editPrivate(item);
      if(button.dataset.action==='migrate')void securePickup(item);
      if(button.dataset.action==='pause')void manage(item,'pause');
      if(button.dataset.action==='cancel'){cancelID=item.id;opener=button;$('#cancel-error').hidden=true;$('#cancel-listing').showModal();document.body.classList.add('db-dialog-open');$('#cancel-keep').focus();}
    }
    if(button.hasAttribute('data-signout')){button.disabled=true;closeMenu();logout().catch(()=>{button.disabled=false;toast('Sign-out could not be completed. Check your connection and retry.');});}
  });
  listen($('#cancel-listing'),'close',()=>{document.body.classList.remove('db-dialog-open');if(opener?.isConnected)opener.focus();else $('[data-section=listings] [data-post]').focus();});
  listen($('#cancel-keep'),'click',()=>$('#cancel-listing').close());
  async function securePickup(item){pending.add(item.id);renderListings();try{await repository.migrate(item.id);if(!destroyed)toast('Pickup details secured. Active listings can now appear to NGOs.');}catch(error){if(!destroyed)toast(listingMessage(error));}finally{if(!destroyed){pending.delete(item.id);renderListings();}}}
  async function editPrivate(item){if(![2,3].includes(item.schemaVersion)){toast('Select Secure pickup details before editing this legacy listing.');return;}try{const privatePickup=await repository.readPrivate(item.id);if(!destroyed){if(!privatePickup)throw new Error('Pickup details unavailable.');openWizard({...item,privatePickup});}}catch(error){if(!destroyed)toast(listingMessage(error));}}
  async function manage(item,action){
    pending.add(item.id);renderListings();
    try{const patch=await repository.manage(item.id,action);if(destroyed)return;if(action==='cancel')$('#cancel-listing').close();toast(action==='cancel'?'Listing cancelled. Its record stays in your account.':patch.isPaused?'Listing paused. Resume when it is ready.':'Listing resumed. Your food is available again.');}
    catch(error){if(!destroyed){if(action==='cancel'){$('#cancel-error').textContent=listingMessage(error);$('#cancel-error').hidden=false;}else toast(listingMessage(error));}}
    finally{if(!destroyed){pending.delete(item.id);$('#cancel-confirm').disabled=false;$('#cancel-keep').disabled=false;renderListings();$(`[data-id="${CSS.escape(item.id)}"][data-action="pause"]`)?.focus();}}
  }
  listen($('#cancel-listing'),'cancel',event=>{if(pending.has(cancelID))event.preventDefault();});
  listen($('#cancel-confirm'),'click',()=>{const item=listings.find(item=>item.id===cancelID);if(!item||pending.has(item.id))return;$('#cancel-confirm').disabled=true;$('#cancel-keep').disabled=true;void manage(item,'cancel');});
  listen($('#db-search'),'input',()=>{query=$('#db-search').value.trim().toLowerCase();renderListings();});
  listen($('#db-clear-filters'),'click',()=>{filter='all';query='';$('#db-search').value='';$$('[data-list-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.listFilter==='all')));renderListings();$('#db-search').focus();});
  listen($('#db-retry-listings'),'click',connectListings);
  function finishMotion(){if(!reduced.matches)return;for(const instance of [...animations]){instance.pause();instance.seek(instance.duration);}animations.clear();}
  listen(reduced,'change',finishMotion);
  // One shared timer; update text in place so focused controls survive countdown ticks.
  const refresh=()=>{
    if(document.hidden||wizard.open||$('#cancel-listing').open||!loaded)return;
    $$('.db-listing').forEach(card=>{const item=listings.find(value=>value.id===card.dataset.listingId);if(!item)return;const status=actualStatus(item),state=expiryState(item.expiry);card.querySelector('.db-listing-expiry strong').textContent=closed(item)?status:state.time;const urgency=card.querySelector('.db-urgency');urgency.textContent=status==='Available'?state.label:status;urgency.dataset.tone=closed(item)?'calm':state.tone;card.querySelector('.db-pill').textContent=status;card.querySelectorAll('[data-action]').forEach(button=>button.disabled=(button.dataset.action!=='migrate'&&closed(item))||pending.has(item.id)||fromCache);});stats();featured();
  };
  function connectListings(){
    unsubscribeListings?.();loaded=false;dataError=null;renderListings();
    try{unsubscribeListings=repository.watch((items,metadata)=>{if(destroyed)return;fromCache=metadata.fromCache;if(!fromCache)for(const item of items){if(!item.serviceRegion&&!migrated.has(item.id)){migrated.add(item.id);void repository.migrateRegion(item.id).catch(()=>{if(!destroyed)toast('Coverage could not be updated. Your record is preserved. Deploy the Agra rules and retry after reloading.');});}}if(fromCache&&!items.length&&!loaded)return;loaded=true;dataError=null;listings=items.map(normalize);const focused=document.activeElement,id=focused?.dataset.id,action=focused?.dataset.action;renderListings();if(id&&action)$(`[data-id="${CSS.escape(id)}"][data-action="${CSS.escape(action)}"]`)?.focus();},error=>{if(destroyed)return;dataError=error;listings=[];loaded=false;renderListings();});}catch(error){dataError=error;listings=[];renderListings();}
  }
  interval=setInterval(refresh,15000);listen(document,'visibilitychange',()=>{if(!document.hidden)refresh();});
  listen(window,'online',()=>{if(dataError)connectListings();});
  renderListings();chart();stats(true);connectListings();if(location.hash==='#partners')showPanel('partners');animate({targets:$$('.db-stat'),translateY:[10,0],delay:window.anime?anime.stagger(45):0,duration:550,easing:'easeOutExpo'});
  return ()=>{destroyed=true;directory.destroy();pickupLocation.destroy();engagement.destroy();operation?.abort();selectionToken++;clearObjectURL();unsubscribeListings?.();clearInterval(interval);clearTimeout(toastTimer);abort.abort();for(const instance of animations)instance.pause();animations.clear();for(const dialog of $$('dialog'))if(dialog.open)dialog.close();document.body.classList.remove('db-dialog-open');};
}
