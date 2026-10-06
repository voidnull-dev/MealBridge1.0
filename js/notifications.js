// Phase 8 client events are atomic with their source write. Rules validate each
// event against get/getAfter; trusted generation belongs in future Functions.
export const notificationCopy=Object.freeze({
 published:['Listing published','Your surplus food listing is now available for collection.'],
 claimed:['Food claimed','A collection has been reserved. Open the claim to review its progress.'],
 fullyClaimed:['Listing fully claimed','All available boxes in this listing have been reserved.'],
 enRoute:['Collector on the way','The NGO has marked this collection as en route.'],
 collected:['Food collected','This collection is complete. You can now share a partner rating.'],
 verified:['Organization verified','Your organization has been verified by MealBridge.'],
 rejected:['Verification review completed','Your organization verification was rejected. Contact MealBridge for follow-up.'],
 rating:['New partner feedback','A collection partner has shared a rating with your organization.']
});
export function eventNotification(sdk,tx,id,{recipientId,type,listingId='',claimId=''}){
 const [title,message]=notificationCopy[type];
 tx.set(sdk.doc(sdk.db,'notifications',id),{recipientId,title,message,type,relatedListingId:listingId,relatedClaimId:claimId,isRead:false,createdAt:sdk.serverTimestamp()});
}
export function claimNotifications(sdk,tx,id,claim,type){
 for(const [role,recipientId]of [['hostel',claim.hostelId],['ngo',claim.ngoId]])eventNotification(sdk,tx,`claim_${id}_${type}_${role}`,{recipientId,type,listingId:claim.listingId,claimId:id});
}
export function createNotificationRepository(sdk,user){
 const session=()=>{if(sdk.auth.currentUser?.uid!==user.uid||!sdk.auth.currentUser.emailVerified)throw Error('Sign in again to read your notifications.');};
 return {
  watch(next,error){session();return sdk.onSnapshot(sdk.query(sdk.collection(sdk.db,'notifications'),sdk.where('recipientId','==',user.uid)),{includeMetadataChanges:true},snap=>next(snap.docs.map(d=>({...d.data(),id:d.id})),snap.metadata),error);},
  async markRead(ids){session();if(globalThis.navigator?.onLine===false)throw Error('Reconnect before marking notifications as read.');
   // Chunking supports large inboxes without Firestore's 500-write batch limit.
   for(let start=0;start<ids.length;start+=100){const chunk=ids.slice(start,start+100);await sdk.runTransaction(sdk.db,async tx=>{const docs=await Promise.all(chunk.map(id=>tx.get(sdk.doc(sdk.db,'notifications',id))));session();docs.forEach((d,i)=>{if(d.exists()&&d.data().recipientId===user.uid&&!d.data().isRead)tx.update(sdk.doc(sdk.db,'notifications',chunk[i]),{isRead:true});});});}
  }
 };
}
