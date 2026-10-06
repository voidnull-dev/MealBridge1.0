import {getFirebase,ADMIN_EMAIL,SDK_VERSION} from './firebase-config.js';
import {createProfileRepository,validateProfileInput,profileDestination} from './profiles.js';
import {createAuthController} from './auth.js';

const dialog=document.getElementById('auth-dialog');
const form=document.getElementById('onboarding-form');
const googleButton=document.getElementById('google-signin');
const errorBox=document.getElementById('auth-error');
const account=document.getElementById('auth-account');
const toastRegion=document.getElementById('auth-toasts');
const inlineToastRegion=document.getElementById('auth-inline-toasts');
const views=[...document.querySelectorAll('[data-auth-view]')];
let controller,initPromise,authState={status:'initializing',user:null,profile:null},returnFocus,toastTimer;
let requestedRole=null;
// Session warm-up is passive; only an explicit user action owns error feedback.
let authInteracted=false;

const errors={
  'auth/popup-closed-by-user':['Sign-in cancelled. You can continue with Google whenever you’re ready.','neutral'],
  'auth/cancelled-popup-request':['A sign-in window is already open. Finish or close that window before trying again.','neutral'],
  'auth/popup-blocked':['Your browser blocked the Google popup. Allow popups for this site, then select Continue with Google again.','error'],
  'auth/unauthorized-domain':['This domain is not authorized for sign-in yet. Ask the project owner to add it in Firebase Authentication settings.','error'],
  'auth/operation-not-allowed':['Google sign-in has not been enabled for this project yet. Ask the project owner to enable it in Firebase Console.','error'],
  'auth/network-request-failed':['Google could not be reached. Check your connection and try again.','error'],
  'auth/invalid-api-key':['Firebase could not validate the project configuration. Ask the project owner to check the web app settings.','error'],
  'auth/account-exists-with-different-credential':['This email already uses another sign-in method in the project. Ask the project owner to resolve the account before continuing with Google.','error'],
  'permission-denied':['Your profile could not be accessed. Ask the project owner to deploy the MealBridge Firestore rules, then retry.','error'],
  'unavailable':['The profile service is temporarily unavailable. Check your connection and retry.','error'],
  'mealbridge/local-server-required':['Sign-in requires a local server or HTTPS hosting. Open this project at http://127.0.0.1:8080 instead of opening the file directly.','error'],
  'failed-precondition':['The profile database is not ready. Ask the project owner to check Firestore setup, then retry.','error']
};
function toast(message,type='neutral') {
  clearTimeout(toastTimer);toastRegion.replaceChildren();inlineToastRegion.replaceChildren();
  const item=document.createElement('div');item.className=`auth-toast auth-toast-${type}`;
  const text=document.createElement('span');text.textContent=message;
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Dismiss notification');dismiss.addEventListener('click',()=>item.remove());
  item.append(text,dismiss);(dialog.open?inlineToastRegion:toastRegion).append(item);
  window.MealBridgeAnimate?.({targets:item,translateY:[10,0],duration:300,easing:'easeOutExpo'});
  toastTimer=setTimeout(()=>item.remove(),type==='error'?15000:8000);
}
function showError(error) {
  // Browser module-load failures do not carry Firebase error codes.
  if(!error.code && (error instanceof TypeError || /dynamically imported|module script|network/i.test(error.message || ''))){
    error={code:'auth/network-request-failed'};
  }
  const [message,type]=errors[error.code] || [error.code?.startsWith('mealbridge/') ? error.message : 'We couldn’t complete that step. Check your connection and try again.','error'];
  errorBox.textContent=message;errorBox.hidden=false;toast(message,type);
}
function reportAuthError(error){if(authState.status==='profile-error')return;if(authInteracted)showError(error);}
function clearError(){errorBox.hidden=true;errorBox.textContent='';}
function view(name){
  const changed=dialog.dataset.view!==name;
  views.forEach(section=>{section.hidden=section.dataset.authView!==name;});
  const headings={login:'Welcome to the bridge.',loading:'Making the connection.',onboarding:'Your purpose. Your profile.',success:'You’re part of the movement.',retry:'Let’s reconnect.'};
  document.getElementById('auth-title').textContent=headings[name];
  dialog.dataset.view=name;
  if(changed && dialog.open && ['onboarding','success','retry'].includes(name))requestAnimationFrame(()=>document.getElementById('auth-title').focus());
}
function openDialog(){
  if(!dialog.open){returnFocus=document.activeElement;dialog.showModal();document.body.classList.add('auth-dialog-open');document.getElementById('auth-title').focus();window.MealBridgeAnimate?.({targets:dialog.querySelector('.auth-shell'),translateY:[10,0],duration:350,easing:'easeOutExpo'});}
}
function updateRole(role){
  if(!['hostel','ngo'].includes(role))return;
  form.elements.role.value=role;
  document.querySelectorAll('.onboarding-role').forEach(button=>{const selected=button.dataset.onboardingRole===role;button.setAttribute('aria-pressed',String(selected));});
}
function render(state){
  const previous=authState;authState=state;
  const signedIn=Boolean(state.user);
  account.hidden=!signedIn;
  const hostelReady=state.status==='ready'&&state.profile?.role==='hostel';
  document.getElementById('hostel-dashboard-link').hidden=!hostelReady;
  document.getElementById('hostel-dashboard-success').hidden=!hostelReady;
  const adminReady=state.status==='ready'&&state.profile?.role==='admin'&&state.user?.emailVerified&&state.user.email?.toLowerCase()===ADMIN_EMAIL;
  document.getElementById('admin-dashboard-link').hidden=!adminReady;
  document.getElementById('admin-dashboard-success').hidden=!adminReady;
  const ngoReady=state.status==='ready'&&state.profile?.role==='ngo';
  document.getElementById('ngo-dashboard-link').hidden=!ngoReady;
  document.getElementById('ngo-dashboard-success').hidden=!ngoReady;
  document.querySelectorAll('[data-auth-entry]').forEach(element=>{element.hidden=signedIn;});
  if(signedIn){
    const name=state.profile?.name || state.user.displayName || 'Google member';
    document.getElementById('account-name').textContent=name;
    document.getElementById('account-role').textContent=state.profile ? ({hostel:'Hostel',ngo:'NGO',admin:'Admin'}[state.profile.role]) : 'Profile pending';
    const initials=name.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
    const avatar=document.getElementById('account-avatar');avatar.textContent=initials;
    const image=document.getElementById('account-photo');
    // No HTML injection or arbitrary URL schemes from a stored profile.
    const photo=state.user.photoURL;
    if(photo && /^https:\/\//.test(photo)){if(image.src!==photo)image.src=photo;image.hidden=false;}else image.hidden=true;
  }
  document.querySelectorAll('[data-auth-logout]').forEach(button=>{button.disabled=state.status==='signing-out'||state.status==='signing-in';});
  googleButton.disabled=state.status==='signing-in'||state.status==='loading-profile';
  googleButton.querySelector('span').textContent=state.status==='signing-in'?'Opening Google…':'Continue with Google';
  document.getElementById('profile-submit').disabled=state.busy;
  document.getElementById('profile-submit').textContent=state.status==='saving'?'Saving your profile…':'Complete my profile';
  form.setAttribute('aria-busy',String(state.status==='saving'));
  form.querySelector('fieldset').disabled=state.status==='saving';
  if(state.status==='signed-out'){
    clearError();form.reset();requestedRole=null;updateRole('hostel');view('login');
    if(previous.user && dialog.open)dialog.close();
  }else if(['loading-profile','signing-out'].includes(state.status)){
    view('loading');document.getElementById('auth-loading-message').textContent=state.status==='signing-out'?'Signing you out securely…':'Checking your saved profile…';
  }else if(['onboarding','saving'].includes(state.status)){
    if(state.status==='onboarding' && previous.status!=='saving'){
      form.elements.name.value=state.user.displayName || '';updateRole(requestedRole || 'hostel');
    }
    view('onboarding');openDialog();
  }else if(state.status==='ready'){
    const destination=profileDestination(state.profile);
    if(destination){location.replace(destination);return;}
    view('success');document.getElementById('auth-success-copy').textContent=state.profile.role==='admin'?'Your Admin profile is ready. Open the Admin Panel to verify organizations and review MealBridge.':state.profile.role!=='admin'&&!(state.profile.isVerified&&state.profile.verificationStatus==='verified')?'Your organization is under review. MealBridge access will unlock once the Agra Admin verifies your profile. Open your workspace to review your status and edit your profile.':state.profile.role==='hostel'?'Your profile is ready. Open your food provider workspace to post and manage surplus food.':'Your profile is ready. Open your NGO workspace to explore the collection preview.';
    if(dialog.open || previous.status==='loading-profile' && previous.user && requestedRole)openDialog();
  }else if(state.status==='profile-error'){
    clearError();view('retry');openDialog();
  }
  if(state.profile&&state.profile.role!=='admin'){const verified=state.profile.isVerified&&state.profile.verificationStatus==='verified';for(const id of [state.profile.role+'-dashboard-link',state.profile.role+'-dashboard-success'])document.getElementById(id).textContent=verified?'Open workspace':'Review verification status';document.getElementById('account-role').textContent=({hostel:'Hostel',ngo:'NGO'}[state.profile.role])+' · '+(verified?'Verified':state.profile.verificationStatus==='rejected'?'Needs attention':'Pending');}
  document.getElementById('auth-status').textContent=state.status==='ready'?'Signed in. Profile ready.':state.status==='loading-profile'?'Checking profile.':state.status==='signed-out'?'Signed out.':'';
}
let sdkReachable=false;
async function checkSDKConnection(){
  if(sdkReachable || location.protocol==='file:')return;
  // Failed ES-module imports are cached by the browser. A retryable fetch first
  // keeps an offline warm-up from permanently poisoning the module map.
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),12000);
  try{
    await Promise.all(['app','auth','firestore'].map(async name=>{
      const response=await fetch(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${name}.js`,{signal:abort.signal,credentials:'omit'});
      if(!response.ok)throw new Error('SDK unavailable');
      await response.arrayBuffer();
    }));
    sdkReachable=true;
  }catch(_){
    abort.abort();
    throw Object.assign(new Error('Google could not be reached.'),{code:'auth/network-request-failed'});
  }finally{clearTimeout(timeout);}
}
async function initialize(){
  if(controller)return controller;
  if(!initPromise)initPromise=(async()=>{
    await checkSDKConnection();
    const sdk=await getFirebase();
    controller=createAuthController(sdk,createProfileRepository(sdk),{state:render,error:reportAuthError,toast,adminEmail:ADMIN_EMAIL});controller.start();return controller;
  })().catch(error=>{initPromise=null;googleButton.disabled=false;throw error;});
  return initPromise;
}
document.getElementById('account-photo').addEventListener('error',event=>{event.target.hidden=true;});
document.querySelectorAll('[data-auth-open]').forEach(element=>element.addEventListener('click',event=>{
  authInteracted=true;event.preventDefault();if(element.id==='explore-agra'&&authState.status==='ready'&&['hostel','ngo'].includes(authState.profile?.role)){location.href=authState.profile.role+'.html#partners';return;}clearError();requestedRole=element.dataset.role || null;
  view(authState.profile?'success':authState.user?(authState.status==='profile-error'?'retry':authState.status==='onboarding'?'onboarding':'loading'):'login');openDialog();
  if(authState.user && !authState.profile && requestedRole)updateRole(requestedRole);
}));
googleButton.addEventListener('click',()=>{
  authInteracted=true;clearError();
  // Firebase is initialized ahead of interaction, preserving the popup user gesture.
  if(controller){void controller.signIn();return;}
  googleButton.disabled=true;googleButton.querySelector('span').textContent='Connecting…';
  initialize().then(()=>{googleButton.disabled=false;googleButton.querySelector('span').textContent='Continue with Google';toast('Connected. Select Continue with Google to open the sign-in window.');}).catch(error=>{googleButton.disabled=false;googleButton.querySelector('span').textContent='Continue with Google';showError(error);});
});
document.querySelectorAll('[data-auth-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('close',()=>{
  document.body.classList.remove('auth-dialog-open');
  const openerVisible=returnFocus && returnFocus!==document.body && returnFocus.getClientRects().length;
  const target=openerVisible ? returnFocus : account.hidden ? (matchMedia('(max-width:600px)').matches ? document.getElementById('menu-toggle') : document.querySelector('[data-role=hostel]')) : document.querySelector('.account-profile');
  target?.focus?.({preventScroll:true});
});
dialog.addEventListener('cancel',()=>{if(authState.status==='saving')toast('Your save is still running. You can reopen your profile from the navigation.');});
document.querySelectorAll('.onboarding-role').forEach(button=>button.addEventListener('click',()=>{clearError();updateRole(button.dataset.onboardingRole);}));
form.addEventListener('submit',event=>{
  authInteracted=true;event.preventDefault();clearError();
  try{const input=validateProfileInput({...Object.fromEntries(new FormData(form))});void controller?.complete(input);}catch(error){showError(error);}
});
document.querySelectorAll('[data-auth-logout]').forEach(button=>button.addEventListener('click',()=>{authInteracted=true;clearError();void controller?.logout();}));
document.getElementById('profile-retry').addEventListener('click',()=>{authInteracted=true;clearError();void controller?.retry();});
if(location.protocol==='file:'){googleButton.disabled=true;showError({code:'mealbridge/local-server-required'});}
else {
  // Recover after offline/CDN failure, without a toast or a popup on page load.
  const warmup=()=>{void initialize().catch(()=>{});};
  warmup();window.addEventListener('online',warmup);
  window.addEventListener('pagehide',event=>{if(!event.persisted)window.removeEventListener('online',warmup);});
}
