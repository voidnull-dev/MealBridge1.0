import {serviceable,regionError,legacyRegion,inAgra} from './service-region.js';
import {DEFAULT_FOOD_IMAGE,validateImageFile,validateImageSignature,validateListingInput,listingError,timestampMillis} from './listing-model.js';
import {eventNotification} from './notifications.js';
import {dashboardAccess} from './dashboard-access.js';

// Injectable SDK adapters keep live operations separate from DOM and enable isolated tests.
export function createListingRepository(sdk,{user,profile,getStorage}){
 const assertSession=()=>{if(dashboardAccess(sdk.auth.currentUser,profile)!=='allowed'||sdk.auth.currentUser.uid!==user.uid)throw listingError('mealbridge/session','Your Hostel session changed. Sign in again before saving.');if(globalThis.navigator?.onLine===false)throw listingError('mealbridge/offline','You’re offline. Reconnect before saving your listing.');};
 const listingRef=id=>sdk.doc(sdk.db,'listings',id);
 const version=data=>`${data.updatedAt?.seconds??timestampMillis(data.updatedAt)}:${data.updatedAt?.nanoseconds??0}`;
 const owned=data=>{if(!data||data.hostelId!==user.uid)throw listingError('mealbridge/ownership','This listing belongs to another food provider.');};
 const editable=data=>{owned(data);if(!['available','partiallyClaimed'].includes(data.status)||timestampMillis(data.expiryTime)<=Date.now())throw listingError('mealbridge/closed','This listing is closed or expired and can no longer be changed.');};
 async function verifyHostel(transaction){assertSession();const saved=await transaction.get(sdk.doc(sdk.db,'users',user.uid));if(!saved.exists()||dashboardAccess(user,saved.data())!=='allowed')throw listingError('mealbridge/role','A current Hostel profile is required to manage listings.');return saved.data();}
 async function cleanupUpload(upload,id){
  if(!upload?.path)return;
  // Never remove a possibly committed image after an ambiguous network failure.
  try{const document=await sdk.getDocFromServer(listingRef(id));if(document.exists()&&document.data().foodImagePath===upload.path)return;await (await getStorage()).deleteObject(upload.ref);}catch(_){/* Owner-scoped orphan cleanup can be retried by a future server job. */}
 }
 async function uploadImage(file,id,progress,signal){
  if(!file)return null;assertSession();await validateImageSignature(file);const ext=validateImageFile(file),storageSDK=await getStorage();assertSession();
  if(signal?.aborted)throw listingError('mealbridge/cancelled','Upload cancelled.');
  const path=`listing-images/${user.uid}/${id}_${crypto.randomUUID()}.${ext}`,ref=storageSDK.ref(storageSDK.storage,path);
  const task=storageSDK.uploadBytesResumable(ref,file,{contentType:file.type,customMetadata:{hostelId:user.uid,listingId:id}});
  const cancel=()=>task.cancel();signal?.addEventListener('abort',cancel,{once:true});
  try{await new Promise((resolve,reject)=>task.on('state_changed',snapshot=>progress?.(Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100)),reject,resolve));const url=await storageSDK.getDownloadURL(task.snapshot.ref);return {path,url,ref};}
  catch(error){await cleanupUpload({path,ref},id);throw error;}
  finally{signal?.removeEventListener('abort',cancel);}
 }
 return {
  async migrateRegion(id){assertSession();return sdk.runTransaction(sdk.db,async tx=>{const snap=await tx.get(listingRef(id));if(!snap.exists())return;const current=snap.data();owned(current);if(current.serviceRegion)return;let region=legacyRegion(current);if(current.schemaVersion===3){const pickup=await tx.get(sdk.doc(sdk.db,'listingPrivate',id));if(!inAgra(pickup.data()?.exactLocation))region={serviceRegion:'outside',isServiceable:false};}tx.update(listingRef(id),{...region,locality:current.publicLocation?.locality||(region.isServiceable?'Agra':''),updatedAt:sdk.serverTimestamp()});});},
  newId:()=>sdk.doc(sdk.collection(sdk.db,'listings')).id,
  async readPrivate(id){assertSession();const snap=await sdk.getDocFromServer(sdk.doc(sdk.db,'listingPrivate',id));return snap.exists()?snap.data():null;},
  async migrate(id){assertSession();return sdk.runTransaction(sdk.db,async tx=>{const saved=await verifyHostel(tx),snap=await tx.get(listingRef(id));if(!snap.exists())throw listingError('mealbridge/missing','Listing unavailable.');const current=snap.data();owned(current);if([2,3].includes(current.schemaVersion))return;const {contactPerson,notes,location,...publicFields}=current;tx.set(sdk.doc(sdk.db,'listingPrivate',id),{hostelId:user.uid,exactAddress:location.address,contactPerson,contactPhone:saved.phone||'',additionalPickupInstructions:notes||''});tx.set(listingRef(id),{...publicFields,...legacyRegion(current),locality:current.locality||'Agra',location:{city:'Agra'},schemaVersion:2,hostelVerified:saved.isVerified===true,collectedBoxes:0,updatedAt:sdk.serverTimestamp()});});},
  watch(next,error){assertSession();return sdk.onSnapshot(sdk.query(sdk.collection(sdk.db,'listings'),sdk.where('hostelId','==',user.uid)),{includeMetadataChanges:true},snapshot=>{
    const items=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).filter(item=>item.hostelId===user.uid).sort((a,b)=>timestampMillis(b.createdAt)-timestampMillis(a.createdAt)||b.id.localeCompare(a.id));next(items,{fromCache:snapshot.metadata.fromCache,pending:snapshot.metadata.hasPendingWrites});
   },error);},
  async save(id,input,{existing=null,file=null,removeImage=false,progress,signal}={}){
   assertSession();if(!serviceable(profile))throw regionError();let fields=validateListingInput(input,{existing}),upload;
   if(existing)editable(existing);
   try{
    upload=await uploadImage(file,id,progress,signal);if(signal?.aborted)throw listingError('mealbridge/cancelled','Saving cancelled.');
    assertSession();progress?.(100,'saving');
    await sdk.runTransaction(sdk.db,async transaction=>{
     const savedProfile=await verifyHostel(transaction),snapshot=await transaction.get(listingRef(id));if(!serviceable(savedProfile))throw regionError();
     if(existing){if(!snapshot.exists())throw listingError('mealbridge/missing','This listing is no longer available.');const current=snapshot.data();editable(current);if(version(current)!==version(existing))throw listingError('mealbridge/conflict','This listing changed while you were editing. Close and reopen it to review the latest details.');fields=validateListingInput(input,{existing:current});}
     else if(snapshot.exists())throw listingError('mealbridge/conflict','This listing has already been published. Close this form and check your listings before retrying.');
     const photo=upload?{foodImage:upload.url,foodImagePath:upload.path}:existing&&!removeImage?{foodImage:existing.foodImage,foodImagePath:existing.foodImagePath||''}:{foodImage:DEFAULT_FOOD_IMAGE,foodImagePath:''};
     const {contactPerson,notes,location,exactLocation,...publicFields}=fields;
     const payload={...publicFields,location:{city:location.city},schemaVersion:exactLocation?3:2,hostelVerified:savedProfile.isVerified===true,status:existing?(fields.totalBoxes===(existing.claimedBoxes||0)?((existing.collectedBoxes||0)===(existing.claimedBoxes||0)?'collected':'claimed'):(existing.claimedBoxes>0?'partiallyClaimed':'available')):'available',readyTime:sdk.Timestamp.fromMillis(fields.readyTime),expiryTime:sdk.Timestamp.fromMillis(fields.expiryTime),...photo,availableBoxes:fields.totalBoxes-(existing?.claimedBoxes||0),updatedAt:sdk.serverTimestamp()};
     transaction.set(sdk.doc(sdk.db,'listingPrivate',id),{hostelId:user.uid,exactAddress:location.address,...(exactLocation?{exactLocation}:{}),contactPerson,contactPhone:savedProfile.phone||'',additionalPickupInstructions:notes});
     if(existing){const {contactPerson:oldContact,notes:oldNotes,location:oldLocation,...oldPublic}=snapshot.data();transaction.set(listingRef(id),{...oldPublic,...payload,collectedBoxes:oldPublic.collectedBoxes||0});}
     else {transaction.set(listingRef(id),{...payload,hostelId:user.uid,hostelName:savedProfile.organizationName||savedProfile.name,claimedBoxes:0,collectedBoxes:0,status:'available',isPaused:false,createdAt:sdk.serverTimestamp()});eventNotification(sdk,transaction,`listing_${id}_published`,{recipientId:user.uid,type:'published',listingId:id});}
    },{maxAttempts:3});
   }catch(error){await cleanupUpload(upload,id);throw error;}
   // Old images are removed only after the replacement document has committed.
   if(existing?.foodImagePath&&(upload||removeImage)&&existing.foodImagePath.startsWith(`listing-images/${user.uid}/${id}_`)){
    try{const storageSDK=await getStorage();await storageSDK.deleteObject(storageSDK.ref(storageSDK.storage,existing.foodImagePath));}catch(_){/* Keep the saved listing; later orphan cleanup handles this file. */}
   }
   return id;
  },
  async manage(id,action){
   assertSession();if(!['pause','cancel'].includes(action))throw listingError('mealbridge/action','Unknown listing action.');
   return sdk.runTransaction(sdk.db,async transaction=>{await verifyHostel(transaction);const snapshot=await transaction.get(listingRef(id));if(!snapshot.exists())throw listingError('mealbridge/missing','This listing no longer exists.');const current=snapshot.data();editable(current);const patch=action==='cancel'?{status:'cancelled',isPaused:false}:{isPaused:!current.isPaused};transaction.update(listingRef(id),{...patch,updatedAt:sdk.serverTimestamp()});return patch;},{maxAttempts:3});
  }
 };
}
