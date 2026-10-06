import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createListingRepository} from '../js/listings.js';
import {validateListingInput,validateImageFile,validateImageSignature,listingStatus,DEFAULT_FOOD_IMAGE,MAX_IMAGE_BYTES,safeFoodImage} from '../js/listing-model.js';
const user={uid:'owner',email:'owner@example.org',emailVerified:true};
const profile={...user,role:'hostel',isVerified:true,verificationStatus:'verified',name:'Food Provider',organizationName:'Riverstone',city:'Agra',serviceRegion:'agra',state:'Uttar Pradesh',country:'India',isServiceable:true};
const input=()=>({exactLocation:{address:'Riverstone Gate 2',latitude:27.1753,longitude:78.0098},locality:'Tajganj',foodName:'Vegetable portions',foodType:'veg',totalBoxes:12,mealsPerBox:4,readyTime:Date.now()+600000,expiryTime:Date.now()+3600000,city:'Agra',serviceRegion:'agra',state:'Uttar Pradesh',country:'India',isServiceable:true,address:'Riverstone Gate 2',contactPerson:'Aarav Sharma',notes:'Use the east gate',allergens:'Milk',packingCondition:'Sealed food-safe boxes',hygieneConfirmed:true});
const stamp=ms=>({seconds:Math.floor(ms/1000),nanoseconds:(ms%1000)*1000000,toMillis(){return ms;}});
function fixture(){
 const docs=new Map([['users/owner',profile]]),uploads=[],deleted=[],queries=[],writes=[];let callback,failWrite=false,uploadError=null;
 const snapshot=ref=>({exists:()=>docs.has(ref),data:()=>docs.get(ref)});
 const sdk={auth:{currentUser:user},db:{},doc:(db,collection,id)=>typeof db==='string'?`listings/new-id`:`${collection}/${id}`,collection:(db,name)=>name,where:(field,op,value)=>({field,op,value}),query:(collection,where)=>{queries.push(where);return collection;},Timestamp:{fromMillis:stamp},serverTimestamp:()=>stamp(Date.now()),getDocFromServer:async ref=>snapshot(ref),onSnapshot:(query,options,next)=>{callback=next;return ()=>{callback=null;}},runTransaction:async(db,fn)=>{const changes=[];await fn({get:async ref=>snapshot(ref),set:(ref,value)=>changes.push([ref,value]),update:(ref,value)=>changes.push([ref,{...docs.get(ref),...value}])});if(failWrite)throw {code:'permission-denied'};for(const [ref,value]of changes){docs.set(ref,value);writes.push(ref);}return {isPaused:docs.get('listings/new-id')?.isPaused};}};
 const storageSDK={storage:{},ref:(storage,path)=>({path}),uploadBytesResumable:(ref,file)=>{uploads.push(ref.path);const task={snapshot:{ref},cancel(){},on:(event,progress,error,complete)=>queueMicrotask(()=>{if(uploadError)error(uploadError);else{progress({bytesTransferred:file.size,totalBytes:file.size});complete();}})};return task;},getDownloadURL:async ref=>'https://firebasestorage.googleapis.com/v0/b/meal-f9e82.firebasestorage.app/o/'+encodeURIComponent(ref.path)+'?alt=media&token=test',deleteObject:async ref=>deleted.push(ref.path)};
 const repo=createListingRepository(sdk,{user,profile,getStorage:async()=>storageSDK});
 return {repo,sdk,docs,uploads,deleted,queries,writes,emit:()=>callback?.({docs:[...docs].filter(([ref])=>ref.startsWith('listings/')).map(([ref,value])=>({id:ref.split('/')[1],data:()=>value})),metadata:{fromCache:false,hasPendingWrites:false}}),failWrite:()=>failWrite=true,failUpload:()=>uploadError={code:'storage/unauthorized'}};
}
const png=()=>{const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],{type:'image/png'});blob.name='food.png';return blob;};
test('listing input rejects privileged fields, bad quantities, unsafe timing and missing hygiene',()=>{
 assert.equal(validateListingInput({...input(),hostelId:'attacker',status:'claimed'}).hostelId,undefined);
 for(const patch of [{totalBoxes:0},{totalBoxes:1.5},{mealsPerBox:51},{hygieneConfirmed:false},{expiryTime:Date.now()-1},{foodType:'unknown'},{city:' '},{readyTime:Date.now()-3600000}])assert.throws(()=>validateListingInput({...input(),...patch}));
});
test('images reject unsupported, oversized, empty and MIME-spoofed files',async()=>{
 assert.equal(validateImageFile(png()),'png');await validateImageSignature(png());
 for(const file of [{name:'food.svg',type:'image/svg+xml',size:100},{name:'food.png',type:'image/png',size:MAX_IMAGE_BYTES},{name:'food.jpg',type:'image/jpeg',size:0}])assert.throws(()=>validateImageFile(file));
 const spoof=new Blob(['fake photo'],{type:'image/png'});spoof.name='food.png';await assert.rejects(()=>validateImageSignature(spoof));
});
test('no-image creation derives owner/profile fields, counters and server timestamps',async()=>{
 const f=fixture();await f.repo.save('new-id',input());const saved=f.docs.get('listings/new-id');assert.equal(saved.hostelId,user.uid);assert.equal(saved.hostelName,profile.organizationName);assert.equal(saved.foodImage,DEFAULT_FOOD_IMAGE);assert.equal(saved.foodImagePath,'');assert.equal(saved.availableBoxes,12);assert.equal(saved.claimedBoxes,0);assert.equal(saved.status,'available');assert.equal(saved.isPaused,false);assert(saved.createdAt.toMillis());assert.deepEqual(saved.location,{city:'Agra'});assert.equal(saved.contactPerson,undefined);assert.equal(saved.notes,undefined);const pickup=f.docs.get('listingPrivate/new-id');assert.equal(pickup.exactAddress,input().address);assert.equal(pickup.contactPerson,input().contactPerson);assert.equal(pickup.additionalPickupInstructions,input().notes);assert.equal(saved.schemaVersion,3);assert.equal(saved.collectedBoxes,0);
});
test('image upload precedes document creation and persists owner-scoped path and URL',async()=>{
 const f=fixture(),progress=[];await f.repo.save('new-id',input(),{file:png(),progress:value=>progress.push(value)});const saved=f.docs.get('listings/new-id');assert(f.uploads[0].startsWith('listing-images/owner/new-id_'));assert.equal(saved.foodImagePath,f.uploads[0]);assert(saved.foodImage.includes(encodeURIComponent(saved.foodImagePath)));assert(progress.includes(100));assert.equal(f.deleted.length,0);
});
test('failed write cleans only the new unreferenced image; upload failure writes no listing',async()=>{
 const f=fixture();f.failWrite();await assert.rejects(()=>f.repo.save('new-id',input(),{file:png()}));assert.equal(f.docs.has('listings/new-id'),false);assert.deepEqual(f.deleted,f.uploads);
 const g=fixture();g.failUpload();await assert.rejects(()=>g.repo.save('new-id',input(),{file:png()}));assert.equal(g.writes.length,0);
});
test('edits preserve immutable ownership and cancellation cannot be revived',async()=>{
 const f=fixture();await f.repo.save('new-id',input());const original=f.docs.get('listings/new-id');await f.repo.save('new-id',{...input(),foodName:'Updated portions',totalBoxes:15},{existing:original});const saved=f.docs.get('listings/new-id');assert.equal(saved.foodName,'Updated portions');assert.equal(saved.createdAt,original.createdAt);assert.equal(saved.hostelId,user.uid);assert.equal(saved.availableBoxes,15);await f.repo.manage('new-id','pause');assert.equal(f.docs.get('listings/new-id').isPaused,true);await f.repo.manage('new-id','pause');assert.equal(f.docs.get('listings/new-id').isPaused,false);await f.repo.manage('new-id','cancel');assert.equal(f.docs.get('listings/new-id').status,'cancelled');await assert.rejects(()=>f.repo.manage('new-id','pause'));await assert.rejects(()=>f.repo.save('new-id',input(),{existing:f.docs.get('listings/new-id')}));
});
test('owner, current role, session and expired listing checks block writes',async()=>{
 const f=fixture();f.docs.set('listings/other',{hostelId:'someone-else',status:'available',expiryTime:stamp(Date.now()+100000)});await assert.rejects(()=>f.repo.manage('other','cancel'));
 f.docs.set('users/owner',{...profile,role:'ngo'});await assert.rejects(()=>f.repo.save('new-id',input()));assert.equal(f.writes.length,0);
 f.sdk.auth.currentUser=null;await assert.rejects(()=>f.repo.save('new-id',input()));
});
test('stale edit is rejected and replacement uploads are cleaned without removing old photo',async()=>{
 const f=fixture();await f.repo.save('new-id',input(),{file:png()});const original=f.docs.get('listings/new-id');f.docs.set('listings/new-id',{...original,updatedAt:stamp(original.updatedAt.toMillis()+100)});await assert.rejects(()=>f.repo.save('new-id',input(),{existing:original,file:png()}));assert(f.deleted.includes(f.uploads[1]));assert(!f.deleted.includes(original.foodImagePath));
});
test('real-time query scopes owner, sorts newest first and unsubscribes',async()=>{
 const f=fixture();f.docs.set('listings/a',{hostelId:user.uid,createdAt:stamp(1)});f.docs.set('listings/b',{hostelId:user.uid,createdAt:stamp(2)});f.docs.set('listings/foreign',{hostelId:'other',createdAt:stamp(3)});let result;const stop=f.repo.watch(items=>result=items,()=>{});f.emit();assert.deepEqual(f.queries[0],{field:'hostelId',op:'==',value:user.uid});assert.deepEqual(result.map(item=>item.id),['b','a']);stop();
});
test('status precedence and image URL protection',()=>{
 const item={expiryTime:stamp(Date.now()+100000),availableBoxes:12,status:'available'};assert.equal(listingStatus(item),'Available');assert.equal(listingStatus({...item,isPaused:true}),'Paused');assert.equal(listingStatus({...item,status:'cancelled',isPaused:true}),'Cancelled');assert.equal(listingStatus({...item,expiryTime:stamp(1),isPaused:true}),'Expired');assert.equal(listingStatus({...item,status:'claimed'}),'Claimed');assert.equal(safeFoodImage('javascript:alert(1)','listing-images/owner/new-id_test.jpg','owner','new-id'),DEFAULT_FOOD_IMAGE);
});
