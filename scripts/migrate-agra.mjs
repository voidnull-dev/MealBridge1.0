// Privileged operator tool. Never load in the browser; Hosting excludes scripts/.
// Install firebase-admin in an external tools directory and use ADC credentials.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {legacyRegion,inAgra,serviceable} from '../js/service-region.js';
import {publicOrganization} from '../js/organizations.js';
if(!process.env.MEALBRIDGE_ADMIN_TOOLS)throw Error('Set MEALBRIDGE_ADMIN_TOOLS to an external directory containing firebase-admin.');
const args=process.argv.slice(2);if(args[args.indexOf('--project')+1]!=='meal-f9e82'||!args.includes('--project'))throw Error('Explicit --project meal-f9e82 is required.');
const require=createRequire(pathToFileURL(resolve(process.env.MEALBRIDGE_ADMIN_TOOLS,'package.json'))),{initializeApp,applicationDefault}=require('firebase-admin/app'),{getFirestore,FieldValue}=require('firebase-admin/firestore');
initializeApp({projectId:'meal-f9e82',credential:applicationDefault()});const db=getFirestore(),apply=args.includes('--apply');
if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Clear FIRESTORE_EMULATOR_HOST before running this production migration tool.');
const [users,listings,claims,ratings,privateRows]=await Promise.all(['users','listings','claims','ratings','listingPrivate'].map(c=>db.collection(c).get()));
const pins=new Map(privateRows.docs.map(d=>[d.id,d.data().exactLocation]));
let classifiedUsers=0,classifiedListings=0,projections=0;
for(const doc of users.docs){const u=doc.data();if(!['hostel','ngo'].includes(u.role))continue;const patch=u.serviceRegion?{}:{...legacyRegion(u),locality:u.locality||(legacyRegion(u).isServiceable?'Agra':'')},result={...u,...patch};if(Object.keys(patch).length){classifiedUsers++;if(apply&&!serviceable(result))await db.runTransaction(async tx=>{const latest=await tx.get(doc.ref);if(!latest.exists()||latest.data().serviceRegion||!['hostel','ngo'].includes(latest.data().role))return;const fresh=latest.data(),region=legacyRegion(fresh);if(!region.isServiceable)tx.update(doc.ref,{...region,locality:fresh.locality||'',updatedAt:FieldValue.serverTimestamp()});});}
 if(!serviceable(result))continue;
 const publicProfile=publicOrganization(result),owned=listings.docs.map(d=>d.data()).filter(l=>l.hostelId===doc.id),collected=claims.docs.map(d=>d.data()).filter(c=>c.ngoId===doc.id&&c.claimStatus==='collected'),foods=new Map(listings.docs.map(d=>[d.id,d.data()]));
 publicProfile.publicStats=u.role==='hostel'?{listingsCreated:owned.length,mealsShared:owned.reduce((n,l)=>n+(l.collectedBoxes||0)*(l.mealsPerBox||0),0)}:{collectionsCompleted:collected.length,mealsCollected:collected.reduce((n,c)=>n+(c.requestedBoxes||0)*(foods.get(c.listingId)?.mealsPerBox||0),0)};
 const received=ratings.docs.map(d=>d.data()).filter(d=>d.toUserId===doc.id&&Number.isInteger(d.overallRating)&&d.overallRating>=1&&d.overallRating<=5);publicProfile.ratingCount=received.length;publicProfile.averageRating=received.length?received.reduce((n,d)=>n+d.overallRating,0)/received.length:0;
 projections++;if(apply)await db.runTransaction(async tx=>{const latest=await tx.get(doc.ref);if(!latest.exists())return;const fresh=latest.data();if(!['hostel','ngo'].includes(fresh.role))return;const regionPatch=fresh.serviceRegion?{}:{...legacyRegion(fresh),locality:fresh.locality||(legacyRegion(fresh).isServiceable?'Agra':'')},active={...fresh,...regionPatch};if(Object.keys(regionPatch).length)tx.update(doc.ref,{...regionPatch,updatedAt:FieldValue.serverTimestamp()});if(serviceable(active))tx.set(db.collection('organizations').doc(doc.id),{...publicOrganization(active),publicStats:publicProfile.publicStats,averageRating:publicProfile.averageRating,ratingCount:publicProfile.ratingCount});});
}
for(const doc of listings.docs){const l=doc.data();if(l.serviceRegion)continue;let patch=legacyRegion(l);if(l.schemaVersion===3&&!inAgra(pins.get(doc.id)))patch={serviceRegion:'outside',isServiceable:false};classifiedListings++;if(apply)await doc.ref.update({...patch,locality:l.publicLocation?.locality||(patch.isServiceable?'Agra':''),updatedAt:FieldValue.serverTimestamp()});}
console.log(JSON.stringify({mode:apply?'APPLIED':'DRY RUN — no writes',project:'meal-f9e82',classifiedUsers,classifiedListings,publicProjections:projections},null,2));
// No deletion, role rewrite, bulk geocoding or private-field logging. Rerunning
// safely refreshes only public totals/ratings and missing coverage metadata.

