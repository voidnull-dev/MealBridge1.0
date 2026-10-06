import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthController} from '../js/auth.js';
import {createProfileRepository,validateProfileInput,isAdminIdentity} from '../js/profiles.js';
import {ADMIN_EMAIL} from '../js/firebase-config.js';

const user={uid:'test-member',email:'member@example.org',emailVerified:true,displayName:'Test Member',photoURL:''};
const fields={locality:'Tajganj',registrationLocation:{city:'Agra',state:'Uttar Pradesh',country:'India',locality:'Tajganj',latitude:27.1753,longitude:78.0098},role:'ngo',name:'Test Member',organizationName:'Community Table',phone:'+91 98765 43210',city:'Agra',serviceRegion:'agra',state:'Uttar Pradesh',country:'India',isServiceable:true};
const stored={...fields,uid:user.uid,email:user.email,photoURL:'',isVerified:false,createdAt:{seconds:1},updatedAt:{seconds:1}};
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(profile=null) {
  let listener;const states=[],errors=[],writes=[];
  const sdk={auth:{},provider:{},onAuthStateChanged:(auth,callback)=>{listener=callback;return ()=>{};},signInWithPopup:async()=>{listener(user);return {user};},signOut:async()=>listener(null)};
  const profiles={read:async()=>profile,create:async(active,input)=>{const result={...stored,...input,uid:active.uid};writes.push(result);return result;}};
  const controller=createAuthController(sdk,profiles,{state:state=>states.push(state),error:error=>errors.push(error),toast:()=>{},adminEmail:ADMIN_EMAIL});controller.start();
  return {controller,sdk,profiles,states,errors,writes,emit:active=>listener(active)};
}
test('new Google user requires onboarding; saved profile becomes ready',async()=>{
  const env=setup();await env.controller.signIn();await nextTick();assert.equal(env.states.at(-1).status,'onboarding');
  await env.controller.complete(fields);assert.equal(env.states.at(-1).status,'ready');assert.equal(env.writes.length,1);
});
test('returning user skips onboarding and never rewrites profile',async()=>{
  const env=setup(stored);env.emit(user);await nextTick();assert.equal(env.states.at(-1).status,'ready');assert.equal(env.writes.length,0);
});
test('intended verified admin bootstraps profile and skips partner form',async()=>{
  const env=setup();env.profiles.create=async(active)=>({uid:active.uid,role:'admin'});
  env.emit({...user,email:ADMIN_EMAIL});await nextTick();assert.equal(env.states.at(-1).profile.role,'admin');assert(!env.states.some(state=>state.status==='onboarding'));
});
test('unverified intended email does not enter admin bootstrap',async()=>{
  const env=setup();env.emit({...user,email:ADMIN_EMAIL,emailVerified:false});await nextTick();assert.equal(env.states.at(-1).status,'onboarding');assert.equal(env.writes.length,0);
});
test('profile read failure remains signed in and retries successfully',async()=>{
  const env=setup(stored);env.profiles.read=async()=>{throw {code:'permission-denied'};};env.emit(user);await nextTick();assert.equal(env.states.at(-1).status,'profile-error');assert.equal(env.states.at(-1).user.uid,user.uid);
  env.profiles.read=async()=>stored;await env.controller.retry();assert.equal(env.states.at(-1).status,'ready');
});
test('failed save preserves onboarding state',async()=>{
  const env=setup();env.emit(user);await nextTick();env.profiles.create=async()=>{throw {code:'permission-denied'};};await env.controller.complete(fields);assert.equal(env.states.at(-1).status,'onboarding');assert.equal(env.states.at(-1).busy,false);
});
test('sign-out invalidates a late profile response',async()=>{
  const env=setup();let resolve;env.profiles.read=()=>new Promise(done=>{resolve=done;});env.emit(user);await env.controller.logout();resolve(stored);await nextTick();assert.equal(env.states.at(-1).status,'signed-out');assert.equal(env.states.at(-1).user,null);
});
test('save finishing after logout cannot restore a signed-in UI',async()=>{
  const env=setup();env.emit(user);await nextTick();let resolve;env.profiles.create=()=>new Promise(done=>{resolve=done;});const saving=env.controller.complete(fields);await env.controller.logout();resolve(stored);await saving;assert.equal(env.states.at(-1).status,'signed-out');
});
test('duplicate popup attempts issue only one Firebase request',async()=>{
  const env=setup();let calls=0,finish;env.sdk.signInWithPopup=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};const first=env.controller.signIn();await env.controller.signIn();assert.equal(calls,1);finish({user});await first;
});
test('normal profile validation rejects admin role and invalid phone',()=>{
  assert.throws(()=>validateProfileInput({...fields,role:'admin'}));assert.throws(()=>validateProfileInput({...fields,phone:'abcdefg'}));assert.throws(()=>validateProfileInput({...fields,organizationName:'  '}));assert.equal(isAdminIdentity(user),false);
});
test('repository derives identity, timestamps, and false verification, ignoring supplied privileged fields',async()=>{
  let saved;
  const sdk={db:{},doc:()=>user.uid,serverTimestamp:()=>({sentinel:true}),runTransaction:async(db,callback)=>callback({get:async()=>({exists:()=>false}),set:(uid,value)=>{if(value.email)saved=value;}})};
  const repo=createProfileRepository(sdk);await repo.create(user,{...fields,uid:'other',email:ADMIN_EMAIL,isVerified:true});assert.equal(saved.uid,user.uid);assert.equal(saved.email,user.email);assert.equal(saved.isVerified,false);assert.deepEqual(saved.createdAt,{sentinel:true});
});
test('repository transaction preserves an existing partner role',async()=>{
  const sdk={db:{},doc:()=>user.uid,runTransaction:async(db,callback)=>callback({get:async()=>({exists:()=>true,data:()=>stored}),set:()=>assert.fail('Existing document overwritten')})};
  const result=await createProfileRepository(sdk).create(user,{...fields,role:'hostel'});assert.equal(result.role,'ngo');
});
test('repository refuses a tampered normal admin profile',async()=>{
  const sdk={db:{},doc:()=>user.uid,getDoc:async()=>({exists:()=>true,data:()=>({...stored,role:'admin'})})};
  await assert.rejects(createProfileRepository(sdk).read(user),error=>error.code==='mealbridge/profile-integrity');
});
test('existing roles are never silently migrated, including intended admin identity',async()=>{
  const admin={...user,email:ADMIN_EMAIL};let updated;
  const sdk={db:{},doc:()=>user.uid,serverTimestamp:()=>({sentinel:true}),runTransaction:async(db,callback)=>callback({get:async()=>({exists:()=>true,data:()=>({...stored,email:ADMIN_EMAIL})}),update:(uid,value)=>{updated=value;}})};
  const result=await createProfileRepository(sdk).create(admin,{});assert.equal(result.role,'ngo');assert.equal(updated,undefined);
});


test('returning administrator does not invoke creation',async()=>{
 const env=setup({...stored,role:'admin',email:ADMIN_EMAIL,onboardingCompleted:true});env.profiles.create=()=>assert.fail('create called for returning admin');env.emit({...user,email:ADMIN_EMAIL});await nextTick();assert.equal(env.states.at(-1).status,'ready');
});
test('cached absence cannot trigger onboarding',async()=>{
 const sdk={db:{},doc:(_,collection,uid)=>collection+'/'+uid,getDoc:async()=>({exists:()=>false,metadata:{fromCache:true}})};
 await assert.rejects(createProfileRepository(sdk).read(user),e=>e.code==='unavailable');
});
test('legacy profile reads only users/uid and never writes or queries organization',async()=>{
 const refs=[];const sdk={db:{},doc:(_,collection,uid)=>{refs.push(collection+'/'+uid);return uid;},getDoc:async()=>({exists:()=>true,data:()=>stored,metadata:{fromCache:false}}),runTransaction:()=>assert.fail('read performed a write transaction')};
 const profile=await createProfileRepository(sdk).read(user);assert.equal(profile.onboardingCompleted,true);assert.deepEqual(refs,['users/'+user.uid]);assert.equal(profile.role,stored.role);assert.equal(profile.isVerified,stored.isVerified);
});
test('existing explicitly incomplete document fails safely rather than re-registering',async()=>{
 const sdk={db:{},doc:()=>user.uid,getDoc:async()=>({exists:()=>true,data:()=>({...stored,onboardingCompleted:false}),metadata:{fromCache:false}})};
 await assert.rejects(createProfileRepository(sdk).read(user),e=>e.code==='mealbridge/profile-integrity');
});
test('completion cannot be replayed over an existing profile',async()=>{
 const env=setup(stored);env.emit(user);await nextTick();await env.controller.complete({...fields,role:'hostel'});assert.equal(env.writes.length,0);assert.equal(env.states.at(-1).profile.role,'ngo');
});
