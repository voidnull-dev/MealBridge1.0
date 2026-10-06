export function coordinates(value){return Boolean(value&&typeof value.latitude==='number'&&typeof value.longitude==='number'&&Number.isFinite(value.latitude)&&Number.isFinite(value.longitude)&&Math.abs(value.latitude)<=90&&Math.abs(value.longitude)<=180);}
export function approximateLocation(exact,city,locality){
 if(!coordinates(exact))throw Error('Select a valid pickup pin before publishing.');
 const cell=(n,max)=>n===max?max-.01:(Math.floor(n*50)*2+1)/100;
 let latitude=cell(exact.latitude,90);const longitude=cell(exact.longitude,180);
 // A coincident cell-center pin is shifted one coarse cell, never published exact.
 if(Math.abs(latitude-exact.latitude)<1e-8&&Math.abs(longitude-exact.longitude)<1e-8)latitude=Number((latitude>=89.99?latitude-.02:latitude+.02).toFixed(2));
 return {city:String(city).trim(),locality:String(locality||city).trim(),latitude,longitude};
}
export function haversine(a,b){if(!coordinates(a)||!coordinates(b))return null;const rad=n=>n*Math.PI/180,dl=rad(b.latitude-a.latitude),dn=rad(b.longitude-a.longitude),s=Math.sin(dl/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dn/2)**2;return 6371*2*Math.atan2(Math.sqrt(s),Math.sqrt(Math.max(0,1-s)));}
export const distanceLabel=(origin,point)=>{const km=haversine(origin,point);return km===null?'Distance unavailable':`${km.toFixed(1)} km away · approximate`;};
export function locationFields(exact,city,locality){
 if(!coordinates(exact)||typeof exact.address!=='string'||exact.address.trim().length<5||exact.address.trim().length>240)throw Error('Choose a valid exact pickup address and map pin.');
 const publicLocation=approximateLocation(exact,city,locality);if(publicLocation.city.length<2||publicLocation.city.length>120||publicLocation.locality.length<2||publicLocation.locality.length>120)throw Error('Enter a city and locality between 2 and 120 characters.');
 return {exactLocation:{address:exact.address.trim(),latitude:exact.latitude,longitude:exact.longitude},publicLocation};
}
