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
 const geoInput=()=>({...input(),exactLocation:{address:'Private Gate 9, Example Street',latitude:18.520412,longitude:73.856701},locality:'Shivajinagar'});
 await ok(provider.save('geo',geoInput()));
 const pub=(await ok(getDoc(food('ngo','geo')))).data(),priv=(await ok(getDoc(privateRef('owner','geo')))).data();
 assert.equal(pub.schemaVersion,3);assert.equal(pub.publicLocation.latitude,18.53);assert.equal(pub.publicLocation.longitude,73.85);assert.equal(pub.publicLocation.address,undefined);assert.equal(pub.exactLocation,undefined);assert.equal(priv.exactLocation.latitude,18.520412);checks+=6;
 await no(getDoc(privateRef('ngo','geo')));await no(getDoc(privateRef('ngo2','geo')));await no(getDoc(privateRef('foreign','geo')));await ok(getDoc(privateRef('admin','geo')));
 const discovery=query(collection(identities.ngo.db,'listings'),where('schemaVersion','in',[2,3]),where('status','in',['available','partiallyClaimed']),where('isPaused','==',false),where('availableBoxes','>',0));await ok(getDocs(discovery));
 for(const patch of [{publicLocation:{...pub.publicLocation,latitude:priv.exactLocation.latitude,longitude:priv.exactLocation.longitude}},{publicLocation:{...pub.publicLocation,address:priv.exactAddress}},{location:{city:'Pune',address:priv.exactAddress}},{exactLocation:priv.exactLocation}])await no(updateDoc(food('owner','geo'),{...patch,updatedAt:serverTimestamp()}));
 await no(updateDoc(privateRef('owner','geo'),{exactLocation:{...priv.exactLocation,latitude:19.52}}));
 await no(updateDoc(privateRef('owner','geo'),{exactLocation:{...priv.exactLocation,address:'Wrong private address'}}));
 await no(updateDoc(privateRef('foreign','geo'),{exactLocation:priv.exactLocation}));
 await no(updateDoc(food('ngo','geo'),{publicLocation:pub.publicLocation,updatedAt:serverTimestamp()}));
 await no(provider.save('geo',input(),{existing:pub}));
 const next={...geoInput(),exactLocation:{address:'Private Gate 9, Example Street',latitude:18.560412,longitude:73.896701}};await ok(provider.save('geo',next,{existing:pub}));
 const edited=(await ok(getDoc(food('ngo','geo')))).data();assert.equal(edited.publicLocation.latitude,18.57);checks++;
 await ok(ngoRepo('ngo').claim('geo',fields(2)));await ok(getDoc(privateRef('ngo','geo')));await no(getDoc(privateRef('ngo2','geo')));
 await no(updateDoc(privateRef('ngo','geo'),{exactLocation:priv.exactLocation}));
 await ok(ngoRepo('ngo').progress('ngo_geo','enRoute'));await ok(getDoc(privateRef('ngo','geo')));
 await ok(ngoRepo('ngo').progress('ngo_geo','collected'));await no(getDoc(privateRef('ngo','geo')));
 for(const [id,point]of [['coincident',{latitude:18.53,longitude:73.85}],['north',{latitude:90,longitude:180}],['south',{latitude:-90,longitude:-180}]])await ok(provider.save(id,{...geoInput(),exactLocation:{address:input().address,...point}}));
 await ok(provider.save('cancelled-geo',geoInput()));await ok(ngoRepo('ngo').claim('cancelled-geo',fields(1)));await ok(provider.manage('cancelled-geo','cancel'));await no(getDoc(privateRef('ngo','cancelled-geo')));
 await ok(provider.save('expired-geo',geoInput()));await ok(ngoRepo('ngo').claim('expired-geo',fields(1)));await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'listings','expired-geo'),{expiryTime:Timestamp.fromMillis(1)}));await no(sdk.getDocFromServer(privateRef('ngo','expired-geo')));
 console.log(`PASS: ${checks} Phase 9 map/privacy emulator assertions.`);
}finally{await env.cleanup();}

