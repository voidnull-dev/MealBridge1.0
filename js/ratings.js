import {dashboardAccess} from './dashboard-access.js';
import {timestampMillis,listingError} from './listing-model.js';
import {eventNotification} from './notifications.js';
export const ratingId=(uid,id)=>`${uid}_${id}`;
export const ratingCategories=Object.freeze({ngo:[['foodCondition','Food condition'],['pickupExperience','Pickup experience']],hostel:[['pickupPunctuality','Pickup punctuality'],['communication','Communication']]});
export function validateRating(input,role){
 const score=value=>{const n=Number(value);if(!Number.isInteger(n)||n<1||n>5)throw listingError('mealbridge/rating','Choose a score from 1 to 5 for every category.');return n;};
 if(!ratingCategories[role])throw listingError('mealbridge/rating-role','Only collection partners can rate a handoff.');
 const feedback=String(input.feedback||'').trim();if(feedback.length>1000)throw listingError('mealbridge/rating-feedback','Keep feedback within 1,000 characters.');
 return {overallRating:score(input.overallRating),categoryRatings:Object.fromEntries(ratingCategories[role].map(([key])=>[key,score(input.categoryRatings?.[key])])),feedback};
}
export function ratingSummary(items){if(!items.length)return {count:0,average:null,label:'No ratings received yet.'};const average=items.reduce((sum,r)=>sum+r.overallRating,0)/items.length;return {count:items.length,average,label:`${average.toFixed(1)} / 5 · ${items.length} ${items.length===1?'review':'reviews'}`};}
export function createRatingRepository(sdk,{user,profile}){
 function session(){if(sdk.auth.currentUser?.uid!==user.uid||!sdk.auth.currentUser.emailVerified||(profile.role!=='admin'&&dashboardAccess(sdk.auth.currentUser,profile,profile.role)!=='allowed'))throw listingError('mealbridge/session','Your session changed. Sign in again.');}
 const watch=(q,next,error)=>{session();return sdk.onSnapshot(q,{includeMetadataChanges:true},snap=>next(snap.docs.map(d=>({...d.data(),id:d.id})),snap.metadata),error);};
 return {
  watchSent:(next,error)=>watch(sdk.query(sdk.collection(sdk.db,'ratings'),sdk.where('fromUserId','==',user.uid)),next,error),
  watchReceived:(next,error)=>watch(sdk.query(sdk.collection(sdk.db,'ratings'),sdk.where('toUserId','==',user.uid)),next,error),
  watchAll:(next,error)=>watch(sdk.collection(sdk.db,'ratings'),next,error),
  watchProvider:(uid,next,error)=>watch(sdk.query(sdk.collection(sdk.db,'ratingScores'),sdk.where('toUserId','==',uid)),next,error),
  watchCollections:(next,error)=>watch(sdk.query(sdk.collection(sdk.db,'claims'),sdk.where(profile.role==='hostel'?'hostelId':'ngoId','==',user.uid)),next,error),
  async submit(id,input){session();const fields=validateRating(input,profile.role),rid=ratingId(user.uid,id),publicScoreId=profile.role==='ngo'?sdk.doc(sdk.collection(sdk.db,'ratingScores')).id:null;
   if(globalThis.navigator?.onLine===false)throw listingError('mealbridge/offline','Reconnect before submitting feedback.');
   return sdk.runTransaction(sdk.db,async tx=>{
    const [claim,existing,saved]=await Promise.all([tx.get(sdk.doc(sdk.db,'claims',id)),tx.get(sdk.doc(sdk.db,'ratings',rid)),tx.get(sdk.doc(sdk.db,'users',user.uid))]);
    if(existing.exists())throw listingError('mealbridge/rating-duplicate','You have already rated this collection.');
    const c=claim.data(),role=saved.data()?.role;if(!claim.exists()||dashboardAccess(user,saved.data(),profile.role)!=='allowed'||role!==profile.role||c.claimStatus!=='collected'||c[role==='hostel'?'hostelId':'ngoId']!==user.uid)throw listingError('mealbridge/rating-claim','Only a partner in a completed collection can rate it.');
    const toRole=role==='hostel'?'ngo':'hostel',toUserId=c[toRole==='hostel'?'hostelId':'ngoId'];if(!toUserId||toUserId===user.uid)throw listingError('mealbridge/rating-self','You cannot rate your own organization.');session();
    tx.set(sdk.doc(sdk.db,'ratings',rid),{claimId:id,listingId:c.listingId,fromUserId:user.uid,fromRole:role,toUserId,toRole,...fields,...(publicScoreId?{publicScoreId}:{}),createdAt:sdk.serverTimestamp()});
    // Score-only public projection; feedback, sender and claim stay private.
    if(toRole==='hostel'){tx.set(sdk.doc(sdk.db,'ratingScores',publicScoreId),{toUserId,overallRating:fields.overallRating,createdAt:sdk.serverTimestamp()});tx.set(sdk.doc(sdk.db,'ratingScoreLinks',publicScoreId),{ratingId:rid});}
    eventNotification(sdk,tx,`rating_${rid}`,{recipientId:toUserId,type:'rating',listingId:c.listingId,claimId:id});return rid;
   },{maxAttempts:3});
  }
 };
}
export const ratingDate=value=>timestampMillis(value)?new Date(timestampMillis(value)).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Syncing…';
