import {REGION,isAgraCity,inAgra,regionError} from './service-region.js';
import {locationFields} from './location-model.js';
export const DEFAULT_FOOD_IMAGE='assets/images/hero-meal.jpg';
export const MAX_IMAGE_BYTES=5*1024*1024;
export const FOOD_TYPES={Veg:'veg','Non-Veg':'nonVeg',Mixed:'mixed'};
export const FOOD_LABELS={veg:'Veg',nonVeg:'Non-Veg',mixed:'Mixed'};
export const PACKING=['Sealed food-safe boxes','Individually wrapped portions','Covered food-safe containers'];
export const listingError=(code,message)=>Object.assign(new Error(message),{code});
export function validateImageFile(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||!/\.(jpe?g|png|webp)$/i.test(file.name))throw listingError('mealbridge/image-type','Choose a JPG, PNG, or WebP food image.');
 if(!Number.isFinite(file.size)||file.size<=0||file.size>=MAX_IMAGE_BYTES)throw listingError('mealbridge/image-size','Choose an image smaller than 5 MB.');
 return file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
}
export async function validateImageSignature(file){
 validateImageFile(file);const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const text=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
 const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/png'?[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value):text(0,4)==='RIFF'&&text(8,12)==='WEBP';
 if(!valid)throw listingError('mealbridge/image-type','The image contents do not match its file type. Choose another food photo.');
}
export function validateListingInput(input,{now=Date.now(),existing=null}={}){
 const text=(key,label,min,max)=>{const value=String(input[key]??'').trim();if(value.length<min||value.length>max)throw listingError('mealbridge/invalid-listing',`${label} must contain ${min}–${max} characters.`);return value;};
 const integer=(key,label,max)=>{const value=Number(input[key]);if(!Number.isInteger(value)||value<1||value>max)throw listingError('mealbridge/invalid-listing',`${label} must be a whole number from 1 to ${max}.`);return value;};
 const readyTime=Number(input.readyTime),expiryTime=Number(input.expiryTime);
 if(!Number.isFinite(readyTime)||!Number.isFinite(expiryTime)||expiryTime<=now||expiryTime<=readyTime||(!existing||readyTime!==timestampMillis(existing.readyTime))&&readyTime<now-5*60000)throw listingError('mealbridge/invalid-listing','Pickup readiness must be current or in the future, and expiry must follow readiness.');
 if(!['veg','nonVeg','mixed'].includes(input.foodType)||!PACKING.includes(input.packingCondition)||input.hygieneConfirmed!==true)throw listingError('mealbridge/invalid-listing','Choose a food type and packing condition, and confirm hygienic handling.');
 const totalBoxes=integer('totalBoxes','Number of boxes',500);
 if(totalBoxes<(existing?.claimedBoxes||0))throw listingError('mealbridge/invalid-listing','Total boxes cannot be less than already claimed boxes.');
 if(!isAgraCity(input.city)||!inAgra(input.exactLocation))throw regionError();
 const geo=input.exactLocation?locationFields({...input.exactLocation,address:input.address},'Agra',input.locality||input.publicLocation?.locality):{};
 if(existing?.schemaVersion===3&&!geo.exactLocation)throw listingError('mealbridge/invalid-listing','Keep a valid pickup pin when editing this listing.');
 return {...geo,...REGION,locality:geo.publicLocation?.locality||'Agra',foodName:text('foodName','Food name',2,120),foodType:input.foodType,totalBoxes,mealsPerBox:integer('mealsPerBox','Meals per box',50),readyTime,expiryTime,location:{city:'Agra',address:text('address','Pickup location',5,240)},contactPerson:text('contactPerson','Contact person',2,100),notes:text('notes','Notes',0,500),allergens:text('allergens','Allergen information',1,200),packingCondition:input.packingCondition,hygieneConfirmed:true};
}
export function timestampMillis(value){return typeof value?.toMillis==='function'?value.toMillis():typeof value?.seconds==='number'?value.seconds*1000:typeof value==='number'?value:0;}
export function listingStatus(item,now=Date.now()){
 if(item.status==='collected')return 'Collected';
 if(item.status==='cancelled')return 'Cancelled';
 if(item.status==='expired'||timestampMillis(item.expiryTime)<=now)return 'Expired';
 if(item.isPaused)return 'Paused';
 if(item.status==='claimed'||item.availableBoxes===0)return 'Claimed';
 return item.availableBoxes>0?(item.claimedBoxes>0?'Partially Claimed':'Available'):'Claimed';
}
export function safeFoodImage(url,path,uid,id){
 if(url===DEFAULT_FOOD_IMAGE&&!path)return url;
 if(typeof path!=='string'||!path.startsWith(`listing-images/${uid}/${id}_`))return DEFAULT_FOOD_IMAGE;
 try{const parsed=new URL(url);if(parsed.protocol==='https:'&&parsed.hostname==='firebasestorage.googleapis.com'&&decodeURIComponent(parsed.pathname)===`/v0/b/meal-f9e82.firebasestorage.app/o/${path}`)return url;}catch(_){}
 return DEFAULT_FOOD_IMAGE;
}
export function listingMessage(error){
 const code=error?.code||'';
 if(code.startsWith('mealbridge/'))return error.message;
 if(code.includes('unauthorized')||code.includes('permission-denied'))return 'Access was denied. Ask the project owner to deploy the MealBridge Firestore and Storage rules, then retry.';
 if(code.includes('quota-exceeded'))return 'Image storage has reached its quota. Contact the project owner or publish without a photo.';
 if(code.includes('bucket-not-found')||code.includes('project-not-found'))return 'Image storage is not configured. Ask the project owner to enable the configured Firebase Storage bucket.';
 if(code.includes('canceled'))return 'Upload cancelled. Your form details are preserved.';
 if(code.includes('unavailable')||code.includes('offline')||code.includes('retry-limit'))return 'Connection interrupted. Your details are preserved; reconnect and retry.';
 return 'The listing could not be saved. Your details are preserved. Check your connection and retry.';
}

