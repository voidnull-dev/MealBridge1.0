import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createListingRepository} from '../js/listings.js';
// Optional verification dependencies live OUTSIDE the static frontend.
if(!process.env.MEALBRIDGE_TEST_TOOLS)throw new Error('Set MEALBRIDGE_TEST_TOOLS to an external folder containing firebase-tools, firebase, and @firebase/rules-unit-testing. See PHASE4.md.');
const load=createRequire(pathToFileURL(resolve(process.env.MEALBRIDGE_TEST_TOOLS,'package.json')));
const {initializeTestEnvironment,assertSucceeds,assertFails}=load('@firebase/rules-unit-testing');
const firestoreSDK=load('firebase/firestore'),storageSDK=load('firebase/storage');
const {doc,setDoc,getDoc,getDocs,query,collection,where,updateDoc,deleteDoc,serverTimestamp,Timestamp,writeBatch}=firestoreSDK;
const {ref,uploadBytes,getDownloadURL,deleteObject}=storageSDK;
const env=await initializeTestEnvironment({projectId:'demo-mealbridge',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync(new URL('../storage.rules',import.meta.url),'utf8')}});
const claims=email=>({email,email_verified:true,firebase:{sign_in_provider:'google.com'}});
const owner=env.authenticatedContext('owner',claims('owner@example.org')),other=env.authenticatedContext('other',claims('other@example.org')),ngo=env.authenticatedContext('ngo',claims('ngo@example.org')),admin=env.authenticatedContext('admin',claims('suryanshdevniranjan@gmail.com')),anonymous=env.unauthenticatedContext();
const future=()=>Timestamp.fromMillis(Date.now()+3600000);
const data=()=>({schemaVersion:2,hostelVerified:false,collectedBoxes:0,hostelId:'owner',hostelName:'Riverstone',foodName:'Vegetable portions',foodImage:'assets/images/hero-meal.jpg',foodImagePath:'',foodType:'veg',totalBoxes:12,availableBoxes:12,claimedBoxes:0,mealsPerBox:4,readyTime:Timestamp.fromMillis(Date.now()+600000),expiryTime:future(),location:{city:'Pune'},allergens:'Milk',packingCondition:'Sealed food-safe boxes',hygieneConfirmed:true,status:'available',isPaused:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
let checks=0;
async function allowed(p){await assertSucceeds(p);checks++}async function denied(p){await assertFails(p);checks++}
try{
 await env.withSecurityRulesDisabled(async ctx=>{for(const [uid,role]of [['owner','hostel'],['other','hostel'],['ngo','ngo'],['admin','admin']])await setDoc(doc(ctx.firestore(),'users',uid),{uid,email:uid+'@example.org',role,name:'Provider Name',organizationName:'Riverstone',city:'Pune',phone:'+919876543210',isVerified:false});});
 const db=owner.firestore(),listing=doc(db,'listings','listing1');
 const initial=writeBatch(db);initial.set(listing,data());initial.set(doc(db,'listingPrivate','listing1'),{hostelId:'owner',exactAddress:'Riverstone Gate 2',contactPerson:'Aarav Sharma',contactPhone:'+919876543210',additionalPickupInstructions:'East gate'});await allowed(initial.commit());await allowed(getDoc(listing));await allowed(getDocs(query(collection(db,'listings'),where('hostelId','==','owner'))));
 await denied(getDocs(collection(db,'listings')));await denied(getDoc(doc(other.firestore(),'listings','listing1')));await allowed(getDoc(doc(ngo.firestore(),'listings','listing1')));await allowed(getDoc(doc(admin.firestore(),'listings','listing1')));await denied(getDoc(doc(anonymous.firestore(),'listings','listing1')));
 await denied(setDoc(doc(other.firestore(),'listings','stolen'),data()));await denied(setDoc(doc(ngo.firestore(),'listings','ngo-listing'),{...data(),hostelId:'ngo'}));
 for(const patch of [{hostelId:'other'},{claimedBoxes:1},{foodType:'unknown'},{totalBoxes:0},{totalBoxes:2.5},{mealsPerBox:0},{availableBoxes:11},{hygieneConfirmed:false},{expiryTime:Timestamp.fromMillis(1)},{createdAt:Timestamp.fromMillis(1)},{status:'claimed'},{extra:true},{foodImage:'https://attacker.example/photo.jpg',foodImagePath:'listing-images/owner/listing1_a.jpg'}])await denied(setDoc(doc(db,'listings','invalid'+checks),{...data(),...patch}));
 await allowed(updateDoc(listing,{isPaused:true,updatedAt:serverTimestamp()}));await allowed(updateDoc(listing,{isPaused:false,updatedAt:serverTimestamp()}));
 await allowed(updateDoc(listing,{foodName:'Updated portions',totalBoxes:15,availableBoxes:15,updatedAt:serverTimestamp()}));
 for(const patch of [{hostelId:'other'},{hostelName:'Spoofed hostel'},{claimedBoxes:1,availableBoxes:14},{createdAt:Timestamp.fromMillis(1)},{status:'claimed'},{isPaused:true,foodName:'Combined invalid change'},{totalBoxes:10,availableBoxes:15}])await denied(updateDoc(listing,{...patch,updatedAt:serverTimestamp()}));
 await denied(updateDoc(doc(other.firestore(),'listings','listing1'),{isPaused:true,updatedAt:serverTimestamp()}));await denied(deleteDoc(listing));
 await allowed(updateDoc(listing,{status:'cancelled',isPaused:false,updatedAt:serverTimestamp()}));await denied(updateDoc(listing,{status:'available',updatedAt:serverTimestamp()}));await denied(updateDoc(listing,{foodName:'Revived',updatedAt:serverTimestamp()}));
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'listings','expired'),{...data(),createdAt:Timestamp.now(),updatedAt:Timestamp.now(),expiryTime:Timestamp.fromMillis(1)}));await denied(updateDoc(doc(db,'listings','expired'),{isPaused:true,updatedAt:serverTimestamp()}));await denied(updateDoc(doc(db,'listings','expired'),{expiryTime:future(),updatedAt:serverTimestamp()}));
 const storage=owner.storage('gs://meal-f9e82.firebasestorage.app'),path='listing-images/owner/listing2_unique.png',imageRef=ref(storage,path),metadata={contentType:'image/png',customMetadata:{hostelId:'owner',listingId:'listing2'}};
 await allowed(uploadBytes(imageRef,new Uint8Array([137,80,78,71]),metadata));await allowed(getDownloadURL(imageRef));
 await denied(uploadBytes(imageRef,new Uint8Array([137]),metadata)); // no overwrite
 await denied(uploadBytes(ref(other.storage('gs://meal-f9e82.firebasestorage.app'),path),new Uint8Array([137]),metadata));
 await denied(uploadBytes(ref(ngo.storage('gs://meal-f9e82.firebasestorage.app'),'listing-images/ngo/listing2_x.png'),new Uint8Array([137]),{...metadata,customMetadata:{hostelId:'ngo',listingId:'listing2'}}));
 await denied(uploadBytes(ref(storage,'listing-images/owner/listing2_text.svg'),new Uint8Array([1]),{...metadata,contentType:'image/svg+xml'}));
 await denied(uploadBytes(ref(storage,'listing-images/owner/listing2_big.png'),new Uint8Array(5*1024*1024),metadata));
 await denied(uploadBytes(ref(storage,'listing-images/owner/listing2_wrong.jpg'),new Uint8Array([1]),metadata));
 await denied(uploadBytes(ref(storage,'listing-images/owner/listing2_empty.png'),new Uint8Array(),metadata));
 await denied(getDownloadURL(ref(other.storage('gs://meal-f9e82.firebasestorage.app'),path)));await allowed(deleteObject(imageRef));
 // Exercise the SHIPPED repository with real SDK transactions, uploads and listener.
 // Emulator URLs are mapped to the production URL format only for rule validation.
 const identity={uid:'owner',email:'owner@example.org',emailVerified:true},profile={...identity,role:'hostel',organizationName:'Riverstone',name:'Provider Name',city:'Pune'};
 const sdk={...firestoreSDK,db,auth:{currentUser:identity}};
 const repo=createListingRepository(sdk,{user:identity,profile,getStorage:async()=>({...storageSDK,storage,getDownloadURL:async ref=>{const url=new URL(await storageSDK.getDownloadURL(ref));return 'https://firebasestorage.googleapis.com'+url.pathname+url.search;}})});
 const form=()=>({foodName:'Repository integration meal',foodType:'veg',totalBoxes:10,mealsPerBox:3,readyTime:Date.now()+600000,expiryTime:Date.now()+3600000,city:'Pune',address:'Riverstone Gate 2',contactPerson:'Aarav Sharma',notes:'East gate',allergens:'Milk',packingCondition:'Sealed food-safe boxes',hygieneConfirmed:true});
 await repo.save('integrationA',form());checks++;assert.equal((await getDoc(doc(db,'listings','integrationA'))).data().foodImage,'assets/images/hero-meal.jpg');checks++;
 const photo=new Blob([fs.readFileSync(new URL('../assets/images/hero-meal.jpg',import.meta.url))],{type:'image/jpeg'});photo.name='food.jpg';
 await repo.save('integrationB',form(),{file:photo});checks++;let saved=(await getDoc(doc(db,'listings','integrationB'))).data();assert(saved.foodImage.includes('listing-images%2Fowner%2FintegrationB_'));checks++;
 await new Promise((resolve,reject)=>{let stop;const timer=setTimeout(()=>reject(new Error('Realtime timeout')),8000);stop=repo.watch(items=>{if(items.some(item=>item.id==='integrationB')){clearTimeout(timer);stop?.();resolve();}},reject);});checks++;
 await repo.save('integrationB',{...form(),foodName:'Edited integration meal'},{existing:saved,file:photo});checks++;saved=(await getDoc(doc(db,'listings','integrationB'))).data();assert.equal(saved.foodName,'Edited integration meal');checks++;
 await repo.manage('integrationB','pause');checks++;assert((await getDoc(doc(db,'listings','integrationB'))).data().isPaused);checks++;
 await repo.manage('integrationB','pause');checks++;assert(!(await getDoc(doc(db,'listings','integrationB'))).data().isPaused);checks++;
 await repo.manage('integrationB','cancel');checks++;assert.equal((await getDoc(doc(db,'listings','integrationB'))).data().status,'cancelled');checks++;
 console.log('PASS: '+checks+' real Firestore/Storage emulator assertions, including shipped repository creation with/without image, realtime listener, image replacement, edit, pause/resume and cancel. No production data touched.');
}finally{await env.cleanup();}
