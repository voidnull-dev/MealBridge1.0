import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createListingRepository} from '../js/listings.js';
import {createClaimRepository} from '../js/claims.js';
import {createAdminRepository} from '../js/admin-data.js';
import {createRatingRepository,ratingId} from '../js/ratings.js';
import {createNotificationRepository,notificationCopy} from '../js/notifications.js';
const load=createRequire(pathToFileURL(resolve(process.env.MEALBRIDGE_TEST_TOOLS,'package.json'))),sdk=load('firebase/firestore'),{initializeTestEnvironment}=load('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc,writeBatch,Timestamp,serverTimestamp}=sdk;
const env=await initializeTestEnvironment({projectId:'demo-mealbridge',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}}),identities={};
const token=email=>({email,email_verified:true,firebase:{sign_in_provider:'google.com'}});
for(const [uid,role]of [['hostel','hostel'],['ngo','ngo'],['other','ngo'],['foreign','hostel'],['admin','admin']]){const email=uid==='admin'?'suryanshdevniranjan@gmail.com':uid+'@example.org',user={uid,email,emailVerified:true},profile={uid,email,role,name:'Partner Person',organizationName:uid+' organization',phone:'+919876543210',city:'Pune',photoURL:'',isVerified:false,createdAt:Timestamp.now(),updatedAt:Timestamp.now()};identities[uid]={user,profile,db:env.authenticatedContext(uid,token(email)).firestore()};}
const adapter=uid=>({...sdk,db:identities[uid].db,auth:{currentUser:identities[uid].user}}),ref=(uid,name,id)=>doc(identities[uid].db,name,id),rate=uid=>createRatingRepository(adapter(uid),identities[uid]),inbox=uid=>createNotificationRepository(adapter(uid),identities[uid].user),claims=createClaimRepository(adapter('ngo'),identities.ngo),provider=createListingRepository(adapter('hostel'),{...identities.hostel,getStorage:()=>{throw Error('No upload');}}),admin=createAdminRepository(adapter('admin'),identities.admin);
let count=0;const yes=async p=>{const result=await p;count++;return result;},no=async p=>{await assert.rejects(p,e=>e.code==='permission-denied'||e.code?.startsWith('mealbridge/'));count++;};
const ownNotifications=uid=>getDocs(query(collection(identities[uid].db,'notifications'),where('recipientId','==',uid)));
const payload={foodName:'Fresh vegetable meals',foodType:'veg',totalBoxes:6,mealsPerBox:4,readyTime:Date.now()+10000,expiryTime:Date.now()+3600000,city:'Pune',address:'Private pickup gate',contactPerson:'Provider Person',notes:'Call at gate',allergens:'Milk',packingCondition:'Sealed food-safe boxes',hygieneConfirmed:true};
const ngoRating={overallRating:5,categoryRatings:{foodCondition:4,pickupExperience:5},feedback:'Excellent food. PRIVATE FEEDBACK'},hostelRating={overallRating:4,categoryRatings:{pickupPunctuality:4,communication:5},feedback:'Clear communication.'};
const notification=(type,recipientId,listingId='food',claimId='ngo_food')=>({recipientId,type,title:notificationCopy[type][0],message:notificationCopy[type][1],relatedListingId:listingId,relatedClaimId:claimId,isRead:false,createdAt:serverTimestamp()});
const observe=(subscribe,predicate)=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{stop?.();reject(Error('Realtime listener timeout'));},10000);let stop;stop=subscribe(items=>{if(predicate(items)){clearTimeout(timeout);stop?.();resolve(items);}},reject);});
try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{for(const i of Object.values(identities))await setDoc(doc(c.firestore(),'users',i.user.uid),i.profile);});
 await yes(provider.save('food',payload));const published=await yes(getDoc(ref('hostel','notifications','listing_food_published')));assert.equal(published.data().recipientId,'hostel');assert.equal(published.data().type,'published');count+=2;
 const live=observe((next,error)=>inbox('hostel').watch(next,error),items=>items.some(n=>n.type==='claimed'));
 await yes(claims.claim('food',{requestedBoxes:6,pickupETA:Date.now()+600000,ngoNote:''}));await yes(live);
 for(const id of ['claim_ngo_food_claimed_hostel','claim_ngo_food_claimed_ngo','claim_ngo_food_fullyClaimed_hostel'])await yes(getDoc(ref(id.endsWith('_ngo')?'ngo':'hostel','notifications',id)));
 await no(rate('ngo').submit('ngo_food',ngoRating));await no(rate('hostel').submit('ngo_food',hostelRating));
 await yes(claims.progress('ngo_food','enRoute'));for(const who of ['hostel','ngo'])await yes(getDoc(ref(who,'notifications','claim_ngo_food_enRoute_'+who)));
 await no(rate('ngo').submit('ngo_food',ngoRating));await yes(claims.progress('ngo_food','collected'));
 for(const who of ['hostel','ngo'])await yes(getDoc(ref(who,'notifications','claim_ngo_food_collected_'+who)));
 await yes(rate('ngo').submit('ngo_food',ngoRating));await yes(rate('hostel').submit('ngo_food',hostelRating));
 await no(rate('ngo').submit('ngo_food',ngoRating));await no(rate('hostel').submit('ngo_food',hostelRating));await no(rate('other').submit('ngo_food',ngoRating));await no(rate('foreign').submit('ngo_food',hostelRating));
 const nRid=ratingId('ngo','ngo_food'),hRid=ratingId('hostel','ngo_food');const saved=(await yes(getDoc(ref('hostel','ratings',nRid)))).data();assert.equal(saved.feedback,ngoRating.feedback);assert.equal(saved.toUserId,'hostel');assert.equal(saved.fromRole,'ngo');assert(saved.createdAt.toMillis());count+=4;
 await yes(getDoc(ref('ngo','ratings',hRid)));await yes(getDoc(ref('ngo','ratings',nRid)));await yes(getDocs(collection(identities.admin.db,'ratings')));await no(getDoc(ref('other','ratings',nRid)));await no(getDocs(collection(identities.ngo.db,'ratings')));
 await yes(getDocs(query(collection(identities.hostel.db,'ratings'),where('toUserId','==','hostel'))));await yes(getDocs(query(collection(identities.ngo.db,'ratings'),where('fromUserId','==','ngo'))));
 const publicScores=(await yes(getDocs(query(collection(identities.other.db,'ratingScores'),where('toUserId','==','hostel'))))).docs;assert.equal(publicScores.length,1);assert.equal(publicScores[0].id,saved.publicScoreId);assert(!publicScores[0].id.includes('ngo_food'));count+=2;await no(getDoc(ref('other','ratingScoreLinks',saved.publicScoreId)));assert.deepEqual(Object.keys(publicScores[0].data()).sort(),['createdAt','overallRating','toUserId']);count+=2;
 await no(updateDoc(ref('ngo','ratings',nRid),{overallRating:1}));await no(deleteDoc(ref('hostel','ratings',nRid)));await no(updateDoc(ref('admin','ratings',nRid),{feedback:'changed'}));await no(deleteDoc(ref('admin','ratings',nRid)));await no(updateDoc(ref('ngo','ratingScores',saved.publicScoreId),{overallRating:1}));await no(setDoc(ref('other','ratingScores','forged'),{toUserId:'hostel',overallRating:5,createdAt:serverTimestamp()}));
 for(const who of ['hostel','ngo'])await yes(getDoc(ref(who,'notifications','rating_'+ratingId(who==='hostel'?'ngo':'hostel','ngo_food'))));
 await yes(admin.verify('hostel','verified','PRIVATE ADMIN NOTE'));await yes(admin.verify('ngo','rejected','PRIVATE INTERNAL NOTE'));
 await no(getDocs(collection(identities.admin.db,'notifications')));const all=(await Promise.all(['hostel','ngo'].map(uid=>yes(ownNotifications(uid))))).flatMap(s=>s.docs.map(d=>({...d.data(),id:d.id})));for(const type of Object.keys(notificationCopy)){assert(all.some(n=>n.type===type),'Missing event '+type);count++;}assert(!all.some(n=>JSON.stringify(n).includes('PRIVATE')));count++;
 const own=(await yes(ownNotifications('ngo'))).docs;assert(own.every(d=>d.data().recipientId==='ngo'));count++;
 const readStream=observe((next,error)=>inbox('ngo').watch(next,error),items=>items.some(n=>n.id===own[0].id&&n.isRead));await yes(inbox('ngo').markRead([own[0].id]));await yes(readStream);
 await yes(inbox('ngo').markRead(own.map(d=>d.id)));assert((await ownNotifications('ngo')).docs.every(d=>d.data().isRead));count++;
 await no(getDoc(ref('admin','notifications',own[0].id)));await no(getDoc(ref('other','notifications',own[0].id)));await no(getDocs(collection(identities.ngo.db,'notifications')));await no(getDocs(query(collection(identities.ngo.db,'notifications'),where('recipientId','==','hostel'))));
 for(const patch of [{message:'Spoofed'},{recipientId:'other'},{type:'published'},{isRead:false},{createdAt:Timestamp.now()}])await no(updateDoc(ref('ngo','notifications',own[0].id),patch));
 await no(updateDoc(ref('admin','notifications',own[0].id),{isRead:true}));await no(deleteDoc(ref('ngo','notifications',own[0].id)));
 for(const [uid,id,n]of [['ngo','spoof',notification('claimed','ngo')],['hostel','listing_fake_published',notification('published','hostel','fake','')],['ngo','claim_ngo_food_collected_hostel_replay',notification('collected','hostel')],['admin','fake-verification',notification('verified','ngo','','')],['ngo','rating_fake',notification('rating','hostel')]])await no(setDoc(ref(uid,'notifications',id),n));
 // A legitimate unrated member bypasses client validation; each invalid batch
 // includes the paired projection/link so denial tests the rating itself.
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'claims','other_invalid'),{listingId:'food',ngoId:'other',hostelId:'hostel',claimStatus:'collected'});await setDoc(doc(c.firestore(),'claims','other_self'),{listingId:'food',ngoId:'other',hostelId:'other',claimStatus:'collected'});});
 let invalidIndex=0;
 for(const patch of [{overallRating:6},{overallRating:2.5},{feedback:'x'.repeat(1001)},{fromUserId:'ngo'},{toUserId:'foreign'},{listingId:'wrong'},{categoryRatings:{foodCondition:5}},{categoryRatings:{foodCondition:5,pickupExperience:5,communication:5}},{toRole:'ngo'},{createdAt:Timestamp.fromMillis(1)}]){
  const sid='invalid-'+(++invalidIndex),d={...saved,claimId:'other_invalid',fromUserId:'other',publicScoreId:sid,createdAt:serverTimestamp(),...patch},batch=writeBatch(identities.other.db);
  batch.set(ref('other','ratings','other_other_invalid'),d);batch.set(ref('other','ratingScoreLinks',sid),{ratingId:'other_other_invalid'});batch.set(ref('other','ratingScores',sid),{toUserId:d.toUserId,overallRating:d.overallRating,createdAt:serverTimestamp()});await no(batch.commit());
 }
 await no(rate('other').submit('other_self',ngoRating));
 const selfBatch=writeBatch(identities.other.db);selfBatch.set(ref('other','ratings','other_other_self'),{...saved,claimId:'other_self',fromUserId:'other',toUserId:'other',publicScoreId:'self-score',createdAt:serverTimestamp()});selfBatch.set(ref('other','ratingScoreLinks','self-score'),{ratingId:'other_other_self'});selfBatch.set(ref('other','ratingScores','self-score'),{toUserId:'other',overallRating:5,createdAt:serverTimestamp()});await no(selfBatch.commit());
 await no(setDoc(ref('other','ratings','other_other_invalid'),{...saved,claimId:'other_invalid',fromUserId:'other',publicScoreId:'missing-pair',createdAt:serverTimestamp()}));
 await no(setDoc(ref('hostel','ratings','random-id'),{...(await getDoc(ref('ngo','ratings',hRid))).data(),createdAt:serverTimestamp()}));
 const anonymous=env.unauthenticatedContext().firestore();await no(getDocs(collection(anonymous,'ratings')));await no(getDocs(collection(anonymous,'ratingScores')));await no(getDocs(collection(anonymous,'notifications')));
 const badProvider=env.authenticatedContext('ngo',{...token('ngo@example.org'),firebase:{sign_in_provider:'password'}}).firestore();await no(getDocs(query(collection(badProvider,'ratings'),where('fromUserId','==','ngo'))));await no(getDocs(query(collection(badProvider,'notifications'),where('recipientId','==','ngo'))));
 // Own Hostel claim reads are now needed, while other providers remain denied.
 await yes(getDocs(query(collection(identities.hostel.db,'claims'),where('hostelId','==','hostel'))));await no(getDoc(ref('foreign','claims','ngo_food')));await no(updateDoc(ref('hostel','claims','ngo_food'),{claimStatus:'claimed',updatedAt:serverTimestamp()}));
 console.log(`PASS: ${count} Phase 8 emulator assertions: end-to-end collection, two-way immutable ratings, private feedback/public numeric scores, all eight atomic event types, own real-time inbox/read status, spoof/replay/tamper/foreign/anonymous/provider denials and Hostel claim read boundaries.`);
}finally{await env.cleanup();}
