import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createListingRepository} from '../js/listings.js';
import {createClaimRepository,claimId} from '../js/claims.js';
if(!process.env.MEALBRIDGE_TEST_TOOLS)throw new Error('Set MEALBRIDGE_TEST_TOOLS to external Firebase test tooling.');
const load=createRequire(pathToFileURL(resolve(process.env.MEALBRIDGE_TEST_TOOLS,'package.json')));
const {initializeTestEnvironment,assertSucceeds,assertFails}=load('@firebase/rules-unit-testing');
const sdk=load('firebase/firestore');
const {doc,getDoc,getDocs,updateDoc,setDoc,deleteDoc,writeBatch,Timestamp,serverTimestamp,collection,query,where}=sdk;
const env=await initializeTestEnvironment({projectId:'demo-mealbridge',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
let checks=0;const ok=async task=>{const result=await assertSucceeds(task);checks++;return result;},no=async task=>{await assert.rejects(task,e=>e.code==='permission-denied'||e.code?.startsWith('mealbridge/'));checks++;};
const identities={};
for(const [uid,role]of [['owner','hostel'],['foreign','hostel'],['ngo','ngo'],['ngo2','ngo'],['admin','admin']]){
 const email=uid==='admin'?'suryanshdevniranjan@gmail.com':`${uid}@example.org`,user={uid,email,emailVerified:true},profile={uid,email,name:'Partner Name',role,organizationName:uid+' kitchen',phone:'+919876543210',city:'Pune',photoURL:'',isVerified:false,createdAt:Timestamp.now(),updatedAt:Timestamp.now()};
 const db=env.authenticatedContext(uid,{email,email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();identities[uid]={user,profile,db};
}
const anonymous=env.unauthenticatedContext().firestore();
const adapter=who=>({...sdk,db:identities[who].db,auth:{currentUser:identities[who].user}});
const provider=createListingRepository(adapter('owner'),{...identities.owner,getStorage:()=>{throw new Error('No image in this test');}});
const ngoRepo=who=>createClaimRepository(adapter(who),identities[who]);
const input=()=>({foodName:'Rice and vegetables',foodType:'veg',totalBoxes:10,mealsPerBox:4,readyTime:Date.now()+60000,expiryTime:Date.now()+3600000,city:'Pune',address:'Private Gate 9, Example Street',contactPerson:'Aarav Sharma',notes:'Private pickup instructions',allergens:'None declared',packingCondition:'Sealed food-safe boxes',hygieneConfirmed:true});
const fields=quantity=>({requestedBoxes:quantity,pickupETA:Date.now()+600000,ngoNote:'Two volunteers arriving'});
const ref=(who,kind,id)=>doc(identities[who].db,kind,id),food=(who,id)=>ref(who,'listings',id),privateRef=(who,id)=>ref(who,'listingPrivate',id);
async function seed(id,patch={}){await provider.save(id,input());if(Object.keys(patch).length)await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'listings',id),patch));}
try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{for(const {user,profile}of Object.values(identities))await setDoc(doc(ctx.firestore(),'users',user.uid),profile);});
 await ok(provider.save('live',input()));
 const pub=(await ok(getDoc(food('ngo','live')))).data();assert.deepEqual(pub.location,{city:'Pune'});assert.equal(pub.contactPerson,undefined);assert.equal(pub.notes,undefined);assert.equal(pub.schemaVersion,2);checks+=4;
 await no(getDoc(privateRef('ngo','live')));await ok(getDoc(privateRef('owner','live')));await no(getDoc(privateRef('foreign','live')));await ok(getDoc(privateRef('admin','live')));await no(getDoc(doc(anonymous,'listings','live')));
 const discovery=query(collection(identities.ngo.db,'listings'),where('schemaVersion','==',2),where('status','in',['available','partiallyClaimed']),where('isPaused','==',false),where('availableBoxes','>',0));await ok(getDocs(discovery));await new Promise((resolve,reject)=>{let stop;stop=ngoRepo('ngo').watchListings(items=>{if(items.some(d=>d.id==='live')){stop();resolve();}},reject);});checks++;await no(getDocs(collection(identities.ngo.db,'listings')));
 await no(updateDoc(food('owner','live'),{contactPerson:'Public contact leak',updatedAt:serverTimestamp()}));await no(updateDoc(food('owner','live'),{location:{city:'Pune',address:'Public address leak'},updatedAt:serverTimestamp()}));
 await no(updateDoc(food('ngo','live'),{availableBoxes:9,claimedBoxes:1,status:'partiallyClaimed',updatedAt:serverTimestamp()}));
 const fake={listingId:'live',ngoId:'ngo',ngoName:identities.ngo.profile.organizationName,hostelId:'owner',requestedBoxes:2,pickupETA:Timestamp.fromMillis(Date.now()+600000),ngoNote:'',claimStatus:'claimed',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 await no(setDoc(ref('ngo','claims',claimId('ngo','live')),fake));
 const invalidBatch=writeBatch(identities.ngo.db);invalidBatch.set(ref('ngo','claims',claimId('ngo','live')),fake);invalidBatch.update(food('ngo','live'),{availableBoxes:5,claimedBoxes:5,status:'partiallyClaimed',updatedAt:serverTimestamp()});await no(invalidBatch.commit());
 await ok(ngoRepo('ngo').claim('live',fields(3)));let current=(await getDoc(food('owner','live'))).data();assert.equal(current.availableBoxes,7);assert.equal(current.claimedBoxes,3);assert.equal(current.status,'partiallyClaimed');checks+=3;
 await new Promise((resolve,reject)=>{let stop;stop=ngoRepo('ngo').watchClaims(items=>{if(items.some(d=>d.listingId==='live'&&d.requestedBoxes===3)){stop();resolve();}},reject);});checks++;await ok(getDoc(privateRef('ngo','live')));await no(getDoc(privateRef('ngo2','live')));await no(ngoRepo('ngo').claim('live',fields(1)));await no(ngoRepo('ngo2').claim('live',fields(8)));await no(ngoRepo('ngo2').claim('live',fields(0)));await no(ngoRepo('ngo2').claim('live',fields(1.5)));await no(ngoRepo('ngo2').claim('live',{...fields(1),pickupETA:Date.now()+7200000}));
 await no(updateDoc(ref('ngo','claims',claimId('ngo','live')),{claimStatus:'collected',updatedAt:serverTimestamp()}));
 await no(updateDoc(ref('ngo','claims',claimId('ngo','live')),{requestedBoxes:7,updatedAt:serverTimestamp()}));
 await no(getDoc(ref('ngo2','claims',claimId('ngo','live'))));await no(getDocs(collection(identities.ngo.db,'claims')));await ok(getDocs(query(collection(identities.ngo.db,'claims'),where('ngoId','==','ngo'))));
 await ok(ngoRepo('ngo').progress(claimId('ngo','live'),'enRoute'));const wrongProgress=writeBatch(identities.ngo.db);wrongProgress.update(ref('ngo','claims',claimId('ngo','live')),{claimStatus:'collected',updatedAt:serverTimestamp()});wrongProgress.update(food('ngo','live'),{collectedBoxes:3,status:'cancelled',updatedAt:serverTimestamp()});await no(wrongProgress.commit());await ok(ngoRepo('ngo').progress(claimId('ngo','live'),'collected'));await no(getDoc(privateRef('ngo','live')));current=(await getDoc(food('owner','live'))).data();assert.equal(current.collectedBoxes,3);assert.equal(current.status,'partiallyClaimed');checks+=2;
 await ok(ngoRepo('ngo2').claim('live',fields(7)));assert.equal((await getDoc(food('owner','live'))).data().status,'claimed');checks++;
 await ok(ngoRepo('ngo2').progress(claimId('ngo2','live'),'enRoute'));await ok(ngoRepo('ngo2').progress(claimId('ngo2','live'),'collected'));current=(await getDoc(food('owner','live'))).data();assert.equal(current.status,'collected');assert.equal(current.collectedBoxes,10);checks+=2;
 await no(ngoRepo('ngo2').progress(claimId('ngo2','live'),'collected'));await no(updateDoc(food('ngo','live'),{status:'available',updatedAt:serverTimestamp()}));
 for(const [id,patch]of [['paused',{isPaused:true}],['expired',{expiryTime:Timestamp.fromMillis(Date.now()-1000)}],['cancelled',{status:'cancelled'}],['full',{availableBoxes:0,claimedBoxes:10,status:'claimed'}]]){await seed(id,patch);await no(ngoRepo('ngo').claim(id,fields(1)));await no(getDoc(privateRef('ngo',id)));}
 await seed('race');const race=await Promise.allSettled([ngoRepo('ngo').claim('race',fields(7)),ngoRepo('ngo2').claim('race',fields(7))]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);current=(await getDoc(food('owner','race'))).data();assert.equal(current.availableBoxes,3);assert.equal(current.claimedBoxes,7);checks+=3;
 await no(createClaimRepository(adapter('owner'),identities.owner).claim('race',fields(1)));await no(createClaimRepository(adapter('admin'),identities.admin).claim('race',fields(1)));
 await no(updateDoc(ref('ngo','users','ngo'),{role:'admin',updatedAt:serverTimestamp()}));
 await no(deleteDoc(ref('ngo','claims',claimId('ngo','live'))));await no(setDoc(privateRef('ngo','race'),{hostelId:'ngo',exactAddress:'Fake Address',contactPerson:'Fake Name',contactPhone:'',additionalPickupInstructions:''}));
 // Legacy private fields cannot be discovered or read by an NGO, even when active.
 await env.withSecurityRulesDisabled(async c=>{const legacy={...pub};delete legacy.schemaVersion;delete legacy.hostelVerified;delete legacy.collectedBoxes;legacy.location.address=input().address;legacy.contactPerson=input().contactPerson;legacy.notes=input().notes;await setDoc(doc(c.firestore(),'listings','legacy'),legacy);});
 await no(getDoc(food('ngo','legacy')));assert(!(await getDocs(discovery)).docs.some(d=>d.id==='legacy'));checks++;
 await ok(provider.migrate('legacy'));assert.equal((await getDoc(food('ngo','legacy'))).data().location.address,undefined);checks++;await no(getDoc(privateRef('ngo','legacy')));
 await seed('edit');const prior={...(await getDoc(food('owner','edit'))).data(),id:'edit'};await ok(provider.save('edit',{...input(),foodName:'Updated portions'},{existing:prior}));await ok(provider.manage('edit','pause'));await ok(provider.manage('edit','pause'));await ok(provider.manage('edit','cancel'));
 await seed('revoke');await ngoRepo('ngo').claim('revoke',fields(1));await provider.manage('revoke','cancel');await no(getDoc(privateRef('ngo','revoke')));await no(ngoRepo('ngo').progress(claimId('ngo','revoke'),'enRoute'));
 console.log(`PASS: ${checks} Phase 6 emulator assertions: public/private separation, atomic allocation, progress/collection, concurrent overclaim prevention, duplicate protection, role/query/field/expiry boundaries, migration, provider regressions.`);
}finally{await env.cleanup();}
