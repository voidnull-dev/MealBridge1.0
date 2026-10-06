import {getFirebase,getFirebaseStorage} from './firebase-config.js';
import {createProfileRepository} from './profiles.js';
import {dashboardAccess} from './dashboard-access.js';
import {mountVerification} from './verification.js';

export function startPartnerGate(role){
 const gate=document.getElementById('access-gate'),root=document.getElementById(role==='hostel'?'dashboard-root':'ngo-root'),title=document.getElementById('access-title'),message=document.getElementById('access-message'),retry=document.getElementById('gate-retry');
 let sdk,user,version=0,mountVersion=0,stopAuth,stopProfile,cleanup,reviewCleanup,currentMode;
 const review=document.createElement('main');review.className='verification';review.hidden=true;gate.after(review);
 const notice=document.createElement('p');notice.className='verification-unlocked';notice.setAttribute('role','status');notice.hidden=true;root.before(notice);
 function conceal(){++mountVersion;cleanup?.();cleanup=undefined;reviewCleanup?.destroy();reviewCleanup=undefined;root.hidden=true;root.replaceChildren();review.hidden=true;review.replaceChildren();gate.hidden=false;notice.hidden=true;document.querySelector('.skip-link').href='#access-gate';}
 function fail(error){conceal();currentMode=null;title.textContent='Let’s reconnect.';message.textContent='We could not load your MealBridge profile. Check your connection and try again.';retry.textContent='Retry Profile Connection';retry.hidden=false;}
 async function render(profile,token,metadata={}){
  if(token!==version)return;
  // Cached approval cannot unlock operations; server confirmation is required.
  if(metadata.fromCache||metadata.hasPendingWrites){if(cleanup&&!(profile?.isVerified&&profile?.verificationStatus==='verified')){conceal();currentMode=null;}if(!cleanup){title.textContent='Confirming verification.';message.textContent='Waiting for your current profile from Firestore…';}return;}
  const access=dashboardAccess(user,profile,role),was=currentMode;
  if(access==='allowed'&&was==='allowed')return;
  if(['pending','rejected'].includes(access)&&was===access){reviewCleanup?.update(profile);return;}
  conceal();currentMode=access;retry.hidden=true;
  if(['pending','rejected'].includes(access)){
   gate.hidden=true;review.hidden=false;review.id='verification-main';document.querySelector('.skip-link').href='#verification-main';reviewCleanup=mountVerification(review,{sdk,user,profile,repository:createProfileRepository(sdk),refresh:async()=>render(await createProfileRepository(sdk).read(user),token),logout:()=>sdk.signOut(sdk.auth)});return;
  }
  if(access!=='allowed'){title.textContent=access==='outside'?'MealBridge currently serves Agra.':access==='incomplete'?'Finish your partner profile.':'This workspace belongs to another role.';message.textContent=access==='outside'?'Your service region is outside the Agra network. Contact the administrator for assistance.':access==='incomplete'?'Complete onboarding on MealBridge before returning.':'Return to MealBridge to open the workspace for your permanent role.';return;}
  const mountToken=mountVersion;
  try{
   if(role==='hostel'){
    const [{mountDashboard},{createListingRepository}]=await Promise.all([import('./dashboard.js'),import('./listings.js')]);if(token!==version||mountToken!==mountVersion)return;cleanup=mountDashboard(root,{sdk,user,profile,repository:createListingRepository(sdk,{user,profile,getStorage:getFirebaseStorage}),logout:()=>sdk.signOut(sdk.auth)});
   }else{
    const [{mountNgo},{createClaimRepository}]=await Promise.all([import('./ngo.js'),import('./claims.js')]);if(token!==version||mountToken!==mountVersion)return;cleanup=mountNgo(root,{sdk,user,profile,repository:createClaimRepository(sdk,{user,profile}),logout:()=>sdk.signOut(sdk.auth)});
   }
   root.hidden=false;gate.hidden=true;document.querySelector('.skip-link').href=role==='hostel'?'#dashboard-main':'#ngo-main';if(['pending','rejected'].includes(was)){notice.textContent='Your organization has been verified. Welcome to the MealBridge Agra network.';notice.hidden=false;}
  }catch(error){if(token===version&&mountToken===mountVersion)fail(error);}
 }
 async function check(next){const token=++version;stopProfile?.();stopProfile=undefined;user=next;currentMode=null;conceal();retry.hidden=true;title.textContent='Connecting your workspace.';message.textContent='Checking your Google session and organization verification…';if(!user){title.textContent='Your next connection starts here.';message.textContent='Sign in with Google on MealBridge to continue.';return;}try{const repository=createProfileRepository(sdk),profile=await repository.read(user);if(token!==version)return;await render(profile,token);if(token!==version)return;stopProfile=repository.watch(user,(saved,meta)=>void render(saved,token,meta),error=>{if(token===version)fail(error);});}catch(error){if(token===version)fail(error);}}
 async function initialize(){stopAuth?.();try{sdk=await getFirebase();stopAuth=sdk.onAuthStateChanged(sdk.auth,next=>void check(next),fail);}catch(error){fail(error);}}
 retry.addEventListener('click',()=>sdk?void check(user):void initialize());
 window.addEventListener('pagehide',()=>{++version;stopAuth?.();stopProfile?.();conceal();});window.addEventListener('pageshow',e=>{if(e.persisted)void initialize();});void initialize();
}
