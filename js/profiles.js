import {ADMIN_EMAIL} from './firebase-config.js';
import {REGION,isAgraCity,serviceable,regionError} from './service-region.js';
import {publicOrganization,safeOrganizationImage} from './organizations.js';

export const isAdminIdentity = user => Boolean(user?.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
export const profileError = (code,message) => Object.assign(new Error(message),{code});
export function validateProfileInput(input,{stored=false}={}) {
  const profile = {
    role: input.role,
    name: String(input.name || '').trim(),
    organizationName: String(input.organizationName || '').trim(),
    phone: String(input.phone || '').trim(),
    city: String(input.city || '').trim()
  };
  if (!['hostel','ngo'].includes(profile.role)) throw profileError('mealbridge/invalid-profile','Choose Hostel / Food Provider or NGO / Food Collector.');
  for(const [key,label,max] of [['name','Full name',100],['organizationName','Organization name',160],['city','City / location',120]]) {
    if(profile[key].length<2 || profile[key].length>max) throw profileError('mealbridge/invalid-profile',`${label} must contain 2–${max} characters.`);
  }
  const digits=profile.phone.replace(/\D/g,'');
  if(!/^\+?[0-9 ()-]+$/.test(profile.phone) || digits.length<7 || digits.length>15 || profile.phone.length>32) throw profileError('mealbridge/invalid-profile','Enter a phone number with 7–15 digits, including country code where needed.');
  if(!stored){if(!isAgraCity(profile.city))throw regionError();const locality=String(input.locality||'').trim();if(locality.length<2||locality.length>120)throw profileError('mealbridge/invalid-profile','Enter your organization’s Agra locality.');profile.city='Agra';Object.assign(profile,REGION,{locality,shortDescription:String(input.shortDescription||'').trim().slice(0,280)});}
  return profile;
}
function validStoredProfile(profile,user) {
  if(profile.uid!==user.uid || profile.email!==user.email || !['hostel','ngo','admin'].includes(profile.role)) throw profileError('mealbridge/profile-integrity','Your saved profile needs support. Sign out and contact the project owner.');
  if(profile.role==='admin' && !isAdminIdentity(user)) throw profileError('mealbridge/profile-integrity','This account cannot use an admin profile.');
  if(profile.role!=='admin') validateProfileInput(profile,{stored:true});
  if(profile.onboardingCompleted!==undefined&&profile.onboardingCompleted!==true)throw profileError('mealbridge/profile-integrity','Your saved profile needs support. Contact the project owner; do not register again.');
  // Legacy profiles were completed before the explicit flag existed. Never rewrite them on login.
  return {...profile,onboardingCompleted:true};
}
export function profileDestination(profile){
  if(!profile || profile.onboardingCompleted!==true)return null;
  if(profile.role==='admin')return 'admin.html';
  return ['hostel','ngo'].includes(profile.role)?profile.role+'.html':null;
}
function online() {
  if(globalThis.navigator?.onLine===false) throw profileError('mealbridge/offline','You’re offline. Reconnect before loading or saving your profile.');
}
export function createProfileRepository(sdk) {
  const ref = user => sdk.doc(sdk.db,'users',user.uid);
  return {
    async read(user) {
      online();
      const snapshot=await sdk.getDoc(ref(user));
      // getDoc can fall back to cache: cached absence must never trigger registration.
      if(snapshot.metadata?.fromCache || snapshot.metadata?.hasPendingWrites)throw profileError('unavailable','The profile server could not be reached.');
      return snapshot.exists()?validStoredProfile(snapshot.data(),user):null;
    },
    watch(user,next,error){return sdk.onSnapshot(ref(user),{includeMetadataChanges:true},snap=>{try{if(snap.exists())next(validStoredProfile(snap.data(),user),snap.metadata);else if(!snap.metadata.fromCache)error(profileError('mealbridge/profile-integrity','Your saved profile is unavailable. Retry the connection.')); }catch(e){error(e);}},error);},
    async update(user,input,{requestReview=false}={}){
      online();return sdk.runTransaction(sdk.db,async tx=>{const snapshot=await tx.get(ref(user)),orgRef=sdk.doc(sdk.db,'organizations',user.uid),org=await tx.get(orgRef);if(!snapshot.exists())throw profileError('mealbridge/profile-integrity','Your profile is unavailable.');const current=validStoredProfile(snapshot.data(),user);if(!['hostel','ngo'].includes(current.role)||!serviceable(current))throw regionError();const fields=validateProfileInput({...input,role:current.role,city:current.city});const photoURL=String(input.photoURL||'').trim();if(photoURL&&!safeOrganizationImage(photoURL,user.uid))throw profileError('mealbridge/invalid-profile','Use your Google photo or an image uploaded to your MealBridge profile.');const patch={name:fields.name,organizationName:fields.organizationName,phone:fields.phone,locality:fields.locality,shortDescription:fields.shortDescription,photoURL,updatedAt:sdk.serverTimestamp()};if(requestReview){if(current.verificationStatus!=='rejected')throw profileError('mealbridge/profile-integrity','Only rejected profiles can request a new review.');Object.assign(patch,{verificationRequestedAt:sdk.serverTimestamp()});}tx.update(ref(user),patch);if(org.exists())tx.update(orgRef,{organizationName:patch.organizationName,photoURL:patch.photoURL,locality:patch.locality,shortDescription:patch.shortDescription});return {...current,...patch};});
    },
    async create(user,input) {
      online();
      if(!user.email || !user.emailVerified) throw profileError('mealbridge/unverified-email','A verified Google account is required.');
      return sdk.runTransaction(sdk.db,async transaction=>{
        const snapshot=await transaction.get(ref(user));
        if(snapshot.exists())return validStoredProfile(snapshot.data(),user);
        const fields=isAdminIdentity(user) ? {
        role:'admin',name:(user.displayName?.trim().length>=2 ? user.displayName.trim() : 'MealBridge Admin').slice(0,100),organizationName:'',phone:'',city:''
      } : validateProfileInput(input);
        const orgRef=sdk.doc(sdk.db,'organizations',user.uid);
        const org=fields.role==='admin'?null:await transaction.get(orgRef);
        if(org?.exists())throw profileError('mealbridge/profile-integrity','Your organization already exists. Contact support to restore the linked profile.');
        const profile={onboardingCompleted:true,uid:user.uid,email:user.email,photoURL:user.photoURL || '',...fields,isVerified:false,...(fields.role==='admin'?{}:{verificationStatus:'pending',verificationRequestedAt:sdk.serverTimestamp()}),createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp()};
        transaction.set(ref(user),profile);
        if(profile.role!=='admin')transaction.set(orgRef,publicOrganization(profile));
        return profile;
      },{maxAttempts:3});
    }
  };
}
