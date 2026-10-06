// Controller is independent of DOM and accepts a Firebase adapter for isolated tests.
export function createAuthController(sdk,profiles,callbacks) {
  let user=null,profile=null,generation=0,busy=false,popupBusy=false,unsubscribe,stopProfile,canOnboard=false;
  const publish=(status,extra={})=>callbacks.state({status,user,profile,busy,...extra});
  const failure=error=>{if(['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname))console.debug('[MealBridge auth/profile]',error);callbacks.error(error);};
  async function resolveProfile(nextUser) {
    const token=++generation;stopProfile?.();stopProfile=undefined;
    user=nextUser;profile=null;canOnboard=false;
    if(!user){busy=false;publish('signed-out');return;}
    busy=true;publish('loading-profile');
    try {
      const intendedAdmin=user.emailVerified && user.email?.toLowerCase()===callbacks.adminEmail;
      const found=await profiles.read(user);
      if(token!==generation)return;
      const result=!found&&intendedAdmin ? await profiles.create(user,{}) : found;
      if(intendedAdmin&&result?.role!=='admin')throw {code:'mealbridge/profile-integrity',message:'Your saved administrator profile needs support.'};
      if(token!==generation)return;
      profile=result;busy=false;canOnboard=!result&&!intendedAdmin;
      publish(profile?'ready':'onboarding');
      if(profile&&profiles.watch)stopProfile=profiles.watch(user,(next,meta)=>{if(token!==generation||meta.fromCache||meta.hasPendingWrites)return;if(!next){publish('profile-error');failure({code:'unavailable'});return;}profile=next;publish('ready');},error=>{if(token===generation){profile=null;publish('profile-error');failure(error);}});
    } catch(error) {if(token===generation){busy=false;publish('profile-error');failure(error);}}
  }
  return {
    start(){unsubscribe?.();unsubscribe=sdk.onAuthStateChanged(sdk.auth,nextUser=>{void resolveProfile(nextUser);},error=>{publish('auth-error');failure(error);});},
    async signIn(){
      if(popupBusy || busy)return;
      popupBusy=true;publish('signing-in');callbacks.toast('Opening a secure Google sign-in window…','loading');
      try {await sdk.signInWithPopup(sdk.auth,sdk.provider);callbacks.toast('Signed in with Google. Checking your profile…','success');}
      catch(error){if(!user)publish('signed-out');failure(error);}
      finally{popupBusy=false;}
    },
    async complete(input){
      if(!user || busy || profile || !canOnboard)return;
      const token=generation,activeUser=user;
      busy=true;publish('saving');callbacks.toast('Saving your partner profile securely…','loading');
      try {
        const saved=await profiles.create(activeUser,input);
        if(token!==generation)return;
        profile=saved;busy=false;canOnboard=false;publish('ready',{newlyCompleted:true});
        if(profiles.watch)stopProfile=profiles.watch(user,(next,meta)=>{if(token!==generation||meta.fromCache||meta.hasPendingWrites)return;if(!next){publish('profile-error');failure({code:'unavailable'});return;}profile=next;publish('ready');},failure);
        callbacks.toast('Profile saved. Your organization is awaiting Admin verification.','success');
      }catch(error){if(token===generation){busy=false;publish('onboarding');failure(error);}}
    },
    async logout(){
      // Sign out also invalidates an in-flight profile read/save response.
      if(popupBusy)return;
      const previous={user,profile};stopProfile?.();stopProfile=undefined;++generation;busy=true;publish('signing-out');
      try{await sdk.signOut(sdk.auth);user=null;profile=null;busy=false;publish('signed-out');callbacks.toast('You’re signed out. See you at the bridge.','success');}
      catch(error){user=previous.user;profile=previous.profile;busy=false;publish(profile?'ready':user?'profile-error':'signed-out');failure(error);}
    },
    retry(){if(user&&!busy)return resolveProfile(user);},
    destroy(){++generation;unsubscribe?.();stopProfile?.();}
  };
}
