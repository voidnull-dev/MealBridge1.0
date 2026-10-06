import {watchOrganizations} from './organizations.js';
import {serviceable} from './service-region.js';
import {haversine} from './location-model.js';
import {eventNotification,claimNotifications} from './notifications.js';
import {dashboardAccess} from './dashboard-access.js';
import {listingError,timestampMillis} from './listing-model.js';

// One immutable claim per NGO/listing. Deterministic IDs make duplicate protection
// and rules getAfter pairing possible without queries inside a transaction.
export const claimId=(uid,id)=>`${uid}_${id}`;
export function discoverable(item,uid,now=Date.now()){
 return item.hostelVerified===true&&serviceable(item)&&[2,3].includes(item.schemaVersion)&&item.hostelId!==uid&&['available','partiallyClaimed'].includes(item.status)&&item.isPaused===false&&item.availableBoxes>0&&timestampMillis(item.expiryTime)>now;
}
export const realFilters=()=>({location:'',type:'all',boxes:1,pickup:'any',urgent:false,verified:true,sort:'newest',radius:'any'});
export function filterRealListings(items,filters,uid,now=Date.now(),origin=null){
 const distance=item=>haversine(origin,item.publicLocation);
 const needle=filters.location.toLocaleLowerCase().trim();
 return items.filter(item=>discoverable(item,uid,now)&&(filters.radius===undefined||filters.radius==='any'||!origin||(distance(item)!==null&&distance(item)<=Number(filters.radius)))&&(!needle||[item.foodName,item.hostelName,item.location?.city,item.publicLocation?.locality].some(value=>String(value||'').toLocaleLowerCase().includes(needle)))&&(filters.type==='all'||item.foodType===filters.type)&&item.availableBoxes>=filters.boxes&&(!filters.urgent||timestampMillis(item.expiryTime)-now<=1800000)&&(!filters.verified||item.hostelVerified===true)&&(filters.pickup==='any'||timestampMillis(item.readyTime)<=now+(filters.pickup==='hour'?3600000:0))).sort((a,b)=>(filters.sort==='nearest'?((distance(a)??Infinity)-(distance(b)??Infinity)):filters.sort==='expiry'?timestampMillis(a.expiryTime)-timestampMillis(b.expiryTime):filters.sort==='boxes'?b.availableBoxes-a.availableBoxes:timestampMillis(b.createdAt)-timestampMillis(a.createdAt))||a.id.localeCompare(b.id));
}
export function claimInput(input,item,now=Date.now()){
 const requestedBoxes=Number(input.requestedBoxes),pickupETA=Number(input.pickupETA),ngoNote=String(input.ngoNote||'').trim();
 if(!Number.isInteger(requestedBoxes)||requestedBoxes<1||requestedBoxes>item.availableBoxes)throw listingError('mealbridge/availability','This listing was updated before your claim could be completed. Please review the latest availability.');
 if(!Number.isFinite(pickupETA)||pickupETA<now||pickupETA<timestampMillis(item.readyTime)||pickupETA>=timestampMillis(item.expiryTime))throw listingError('mealbridge/eta','Choose a pickup ETA after readiness and before expiry.');
 if(ngoNote.length>500)throw listingError('mealbridge/note','Keep your note within 500 characters.');
 return {requestedBoxes,pickupETA,ngoNote};
}
export function createClaimRepository(sdk,{user,profile}){
 const listing=id=>sdk.doc(sdk.db,'listings',id),claim=id=>sdk.doc(sdk.db,'claims',id);
 function session(){if(dashboardAccess(sdk.auth.currentUser,profile,'ngo')!=='allowed'||sdk.auth.currentUser.uid!==user.uid)throw listingError('mealbridge/session','Your NGO session changed. Sign in again.');if(globalThis.navigator?.onLine===false)throw listingError('mealbridge/offline','Reconnect before updating a claim.');}
 async function role(tx){session();const saved=await tx.get(sdk.doc(sdk.db,'users',user.uid));if(!saved.exists()||dashboardAccess(user,saved.data(),'ngo')!=='allowed')throw listingError('mealbridge/role','A current NGO profile is required.');return saved.data();}
 function watch(q,next,error){session();return sdk.onSnapshot(q,{includeMetadataChanges:true},snap=>next(snap.docs.map(doc=>({...doc.data(),id:doc.id})),{fromCache:snap.metadata.fromCache,pending:snap.metadata.hasPendingWrites}),error);}
 return {
  watchListings(next,error){
   session();const providers=new Map();let dead=false;
   const emit=()=>{if(dead)return;next([...providers.values()].flatMap(p=>p.items),{fromCache:[...providers.values()].some(p=>p.cache),pending:false});};
   // One query per approved provider makes the owner verification lookup provable
   // in rules and avoids the ten-document access budget of a broad mixed-owner query.
   const stop=watchOrganizations(sdk,'hostel',(orgs,metadata)=>{
    if(dead)return;const ids=new Set(orgs.map(o=>o.uid));for(const [uid,p]of providers)if(!ids.has(uid)){p.stop();providers.delete(uid);}
    for(const org of orgs)if(!providers.has(org.uid)){
     const entry={items:[],cache:true,stop:()=>{}};providers.set(org.uid,entry);
     entry.stop=watch(sdk.query(sdk.collection(sdk.db,'listings'),sdk.where('hostelId','==',org.uid),sdk.where('serviceRegion','==','agra'),sdk.where('isServiceable','==',true),sdk.where('schemaVersion','in',[2,3]),sdk.where('status','in',['available','partiallyClaimed']),sdk.where('isPaused','==',false),sdk.where('availableBoxes','>',0)),(items,meta)=>{if(dead||providers.get(org.uid)!==entry)return;entry.items=items.map(i=>({...i,hostelVerified:true}));entry.cache=meta.fromCache;emit();},e=>{if(dead||providers.get(org.uid)!==entry)return;entry.items=[];entry.cache=true;emit();if(e.code!=='permission-denied')error(e);});
    }
    if(metadata.fromCache&&orgs.length===0)next([],{fromCache:true,pending:false});else emit();
   },error);
   return ()=>{dead=true;stop();for(const p of providers.values())p.stop();providers.clear();};
  },
  watchClaims(next,error){return watch(sdk.query(sdk.collection(sdk.db,'claims'),sdk.where('ngoId','==',user.uid)),next,error);},
  watchListing(id,next,error){session();return sdk.onSnapshot(listing(id),{includeMetadataChanges:true},snap=>next(snap.exists()?{...snap.data(),id}:null,{fromCache:snap.metadata.fromCache}),error);},
  async readListing(id){session();const snap=await sdk.getDocFromServer(listing(id));return snap.exists()?{...snap.data(),id}:null;},
  async readPrivate(id){session();const snap=await sdk.getDocFromServer(sdk.doc(sdk.db,'listingPrivate',id));return snap.exists()?snap.data():null;},
  async claim(id,input){
   session();return sdk.runTransaction(sdk.db,async tx=>{
    const saved=await role(tx),current=await tx.get(listing(id)),existing=await tx.get(claim(claimId(user.uid,id)));
    if(existing.exists())throw listingError('mealbridge/duplicate','You already have a claim for this listing. Open Active claims.');
    const provider=current.exists()?await tx.get(sdk.doc(sdk.db,'organizations',current.data().hostelId)):null;
    if(!current.exists()||!provider?.exists()||!discoverable({...current.data(),hostelVerified:provider.data().isVerified===true&&provider.data().verificationStatus==='verified'},user.uid))throw listingError('mealbridge/availability','This listing was updated before your claim could be completed. Please review the latest availability.');
    if(!serviceable(saved))throw listingError('mealbridge/coverage','MealBridge is currently available only in the Agra region.');
    const item=current.data(),fields=claimInput(input,item),availableBoxes=item.availableBoxes-fields.requestedBoxes;
    session();tx.set(claim(claimId(user.uid,id)),{listingId:id,ngoId:user.uid,ngoName:saved.organizationName,hostelId:item.hostelId,...fields,pickupETA:sdk.Timestamp.fromMillis(fields.pickupETA),claimStatus:'claimed',createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp()});
    tx.update(listing(id),{availableBoxes,claimedBoxes:item.claimedBoxes+fields.requestedBoxes,status:availableBoxes?'partiallyClaimed':'claimed',updatedAt:sdk.serverTimestamp()});
    const cid=claimId(user.uid,id),event={hostelId:item.hostelId,ngoId:user.uid,listingId:id};claimNotifications(sdk,tx,cid,event,'claimed');if(!availableBoxes)eventNotification(sdk,tx,`claim_${cid}_fullyClaimed_hostel`,{recipientId:item.hostelId,type:'fullyClaimed',listingId:id,claimId:cid});
    return cid;
   },{maxAttempts:5});
  },
  async progress(id,target){
   session();return sdk.runTransaction(sdk.db,async tx=>{
    await role(tx);const snap=await tx.get(claim(id));if(!snap.exists())throw listingError('mealbridge/missing','This claim no longer exists.');const current=snap.data();
    if(current.ngoId!==user.uid||id!==claimId(user.uid,current.listingId)||!((current.claimStatus==='claimed'&&target==='enRoute')||(current.claimStatus==='enRoute'&&target==='collected')))throw listingError('mealbridge/progress','This claim has changed. Review its latest progress.');
    const food=await tx.get(listing(current.listingId));if(!food.exists())throw listingError('mealbridge/missing','The related listing is unavailable.');const item=food.data();
    if(item.status==='cancelled'||timestampMillis(item.expiryTime)<=Date.now())throw listingError('mealbridge/closed','This listing is cancelled or expired. Do not collect this food.');
    session();tx.update(claim(id),{claimStatus:target,updatedAt:sdk.serverTimestamp()});claimNotifications(sdk,tx,id,current,target);
    if(target==='collected'){const collectedBoxes=item.collectedBoxes+current.requestedBoxes;tx.update(listing(current.listingId),{collectedBoxes,status:item.availableBoxes===0&&collectedBoxes===item.claimedBoxes?'collected':item.status,updatedAt:sdk.serverTimestamp()});}
   },{maxAttempts:5});
  }
 };
}
export function claimMessage(error){if(error?.code?.startsWith('mealbridge/'))return error.message;if(error?.code==='failed-precondition')return 'Discovery needs a Firestore index. Ask the project owner to deploy firestore.indexes.json, then retry.';if(error?.code==='permission-denied')return 'Access was denied. Check the deployed Phase 6 Firestore rules and your NGO profile, then retry.';if(error?.code==='aborted')return 'This listing was updated before your claim could be completed. Please review the latest availability.';return 'Your change could not be confirmed. Reconnect and review Active claims before retrying.';}
