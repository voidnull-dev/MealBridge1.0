import {serviceable} from './service-region.js';
import {eventNotification} from './notifications.js';
import {isAdminIdentity} from './profiles.js';
import {listingStatus,timestampMillis,listingError} from './listing-model.js';
export const adminAccess=(user,profile)=>Boolean(isAdminIdentity(user)&&profile?.uid===user.uid&&profile.email===user.email&&profile.role==='admin');
export const verificationState=user=>user.isVerified===true&&user.verificationStatus==='verified'?'verified':user.verificationStatus==='rejected'?'rejected':'pending';
export function adminMetrics(users,listings,claims,now=Date.now()){
 const organizations=users.filter(u=>['hostel','ngo'].includes(u.role)),active=l=>['Available','Partially Claimed'].includes(listingStatus(l,now));
 return {users:users.length,hostels:users.filter(u=>u.role==='hostel').length,ngos:users.filter(u=>u.role==='ngo').length,pending:organizations.filter(u=>verificationState(u)==='pending').length,verified:organizations.filter(u=>verificationState(u)==='verified').length,listings:listings.filter(active).length,claims:claims.filter(c=>['claimed','enRoute'].includes(c.claimStatus)).length,boxes:claims.filter(c=>c.claimStatus!=='cancelled').reduce((sum,c)=>sum+(c.requestedBoxes||0),0),urgent:listings.filter(l=>active(l)&&timestampMillis(l.expiryTime)-now<=1800000).length,meals:listings.reduce((sum,l)=>sum+(l.collectedBoxes||0)*(l.mealsPerBox||0),0)};
}
export function organizationFilter(users,{search='',role='all',state='all'}={}){const q=search.trim().toLocaleLowerCase();return users.filter(u=>['hostel','ngo'].includes(u.role)&&(role==='all'||u.role===role)&&(state==='all'||verificationState(u)===state)&&(!q||[u.name,u.email,u.organizationName,u.city].some(v=>String(v||'').toLocaleLowerCase().includes(q)))).sort((a,b)=>timestampMillis(b.createdAt)-timestampMillis(a.createdAt)||a.uid.localeCompare(b.uid));}
export const adminError=(error)=>error?.code?.startsWith('mealbridge/')?error.message:error?.code==='permission-denied'?'Admin access was denied. Deploy the Phase 7 rules and sign in with the authorized Google account, then retry.':'The operation could not be confirmed. Reconnect and review the latest data before retrying.';
export function createAdminRepository(sdk,{user,profile}){
 function session(){if(!adminAccess(sdk.auth.currentUser,profile)||sdk.auth.currentUser.uid!==user.uid)throw listingError('mealbridge/admin-session','Your administrator session changed. Sign in again.');if(globalThis.navigator?.onLine===false)throw listingError('mealbridge/offline','Reconnect before administering MealBridge.');}
 const ref=(name,id)=>sdk.doc(sdk.db,name,id);
 async function identity(tx){session();const snap=await tx.get(ref('users',user.uid));if(!snap.exists()||!adminAccess(user,snap.data()))throw listingError('mealbridge/admin-session','A matching administrator profile is required.');}
 function audit(tx,kind,id,action){const event=sdk.doc(sdk.collection(sdk.db,'adminActivity'));tx.set(event,{adminUid:user.uid,targetKind:kind,targetId:id,action,createdAt:sdk.serverTimestamp()});}
 return {
  watch(name,next,error){session();if(!['users','listings','claims','adminActivity'].includes(name))throw listingError('mealbridge/admin-query','Unsupported administrative collection.');const q=name==='adminActivity'?sdk.query(sdk.collection(sdk.db,name),sdk.orderBy('createdAt','desc'),sdk.limit(40)):sdk.collection(sdk.db,name);return sdk.onSnapshot(q,{includeMetadataChanges:true},snapshot=>next(snapshot.docs.map(doc=>({...doc.data(),id:doc.id})),{fromCache:snapshot.metadata.fromCache,pending:snapshot.metadata.hasPendingWrites}),error);},
  async details(kind,id){session();const snap=await sdk.getDocFromServer(ref(kind,id));return snap.exists()?snap.data():null;},
  async verify(uid,status,note='',publicNote=''){
   session();note=String(note).trim();publicNote=String(publicNote).trim();if(publicNote.length>500)throw listingError('mealbridge/admin-input','Keep the user-facing note within 500 characters.');if(!['pending','verified','rejected'].includes(status)||note.length>1000)throw listingError('mealbridge/admin-input','Choose a verification state and keep the internal note within 1,000 characters.');
   return sdk.runTransaction(sdk.db,async tx=>{await identity(tx);const snap=await tx.get(ref('users',uid));const organization=await tx.get(ref('organizations',uid));if(!snap.exists()||!['hostel','ngo'].includes(snap.data().role))throw listingError('mealbridge/admin-target','Only partner organizations can be reviewed.');
    if(status==='verified'&&!serviceable(snap.data()))throw listingError('mealbridge/coverage','Only organizations in the Agra service region can be verified.');
    const changed=['verified','rejected'].includes(status)&&verificationState(snap.data())!==status,notificationId=changed?sdk.doc(sdk.collection(sdk.db,'notifications')).id:null;
    const stamp=sdk.serverTimestamp(),patch={isVerified:status==='verified',verificationStatus:status,verificationReviewedAt:stamp,verificationReviewedBy:user.uid,updatedAt:stamp,verificationPublicNote:status==='rejected'?publicNote:sdk.deleteField(),verifiedAt:status==='verified'?stamp:sdk.deleteField(),verifiedBy:status==='verified'?user.uid:sdk.deleteField()};session();tx.update(ref('users',uid),patch);if(organization.exists())tx.update(ref('organizations',uid),{isVerified:status==='verified',verificationStatus:status});
    // Internal notes never enter users/{uid}, which its owner can read.
    tx.set(ref('organizationModeration',uid),{organizationId:uid,verificationStatus:status,internalNote:note,reviewedBy:user.uid,reviewedAt:stamp,...(notificationId?{notificationId}:{})});
    tx.set(ref('organizationStatus',uid),{isVerified:status==='verified',verificationStatus:status,updatedAt:stamp});audit(tx,'organization',uid,status);if(notificationId)eventNotification(sdk,tx,notificationId,{recipientId:uid,type:status});
   },{maxAttempts:3});
  },
  async moderate(id,action){session();if(!['pause','resume','cancel'].includes(action))throw listingError('mealbridge/admin-input','Unknown moderation action.');return sdk.runTransaction(sdk.db,async tx=>{await identity(tx);const snap=await tx.get(ref('listings',id));if(!snap.exists())throw listingError('mealbridge/admin-target','This listing no longer exists.');const current=snap.data();
   if(['cancelled','collected'].includes(current.status))throw listingError('mealbridge/admin-closed','This listing is already closed.');if(action!=='cancel'&&(!['available','partiallyClaimed'].includes(current.status)||timestampMillis(current.expiryTime)<=Date.now()||current.availableBoxes<=0))throw listingError('mealbridge/admin-closed','Only unexpired listings with available boxes can be paused or resumed.');
   if(action==='pause'&&current.isPaused||action==='resume'&&!current.isPaused)throw listingError('mealbridge/admin-stale','The listing changed. Review its latest moderation state.');
   session();tx.update(ref('listings',id),action==='cancel'?{status:'cancelled',isPaused:false,updatedAt:sdk.serverTimestamp()}:{isPaused:action==='pause',updatedAt:sdk.serverTimestamp()});audit(tx,'listing',id,action);
  },{maxAttempts:3});}
 };
}
