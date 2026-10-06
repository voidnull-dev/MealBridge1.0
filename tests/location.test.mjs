import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinates,approximateLocation,haversine,locationFields,distanceLabel} from '../js/location-model.js';
import {filterRealListings,realFilters} from '../js/claims.js';
import {validateListingInput} from '../js/listing-model.js';
import {navigationURL} from '../js/routing.js';
test('public coordinates are coarse bounded cell centers and never the exact pin',()=>{
 for(const [latitude,longitude] of [[18.520412,73.856701],[18.53,73.85],[-90,-180],[90,180],[0,0],[-23.55,-46.63]]){
  const exact={latitude,longitude},pub=approximateLocation(exact,'Pune','Shivajinagar');assert(coordinates(pub));assert.notDeepEqual({latitude:pub.latitude,longitude:pub.longitude},exact);assert(Math.abs(pub.latitude-latitude)<=.021);assert(Math.abs(pub.longitude-longitude)<=.011);assert.deepEqual(Object.keys(pub).sort(),['city','latitude','locality','longitude']);
 }
 for(const bad of [null,{latitude:'18',longitude:73},{latitude:91,longitude:0},{latitude:0,longitude:Infinity}])assert(!coordinates(bad));
});
test('Haversine handles datelines, missing pins, identical locations and approximate labels',()=>{
 assert.equal(haversine({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
 assert(Math.abs(haversine({latitude:0,longitude:0},{latitude:0,longitude:1})-111.195)<.01);
 assert(haversine({latitude:0,longitude:179.99},{latitude:0,longitude:-179.99})<3);
 assert.equal(haversine(null,{latitude:0,longitude:0}),null);assert.equal(distanceLabel(null,null),'Distance unavailable');
});
test('distance radius and nearest sorting use only public pins and preserve prior filters',()=>{
 const origin={latitude:18.52,longitude:73.85},now=Date.now(),base={city:'Agra',serviceRegion:'agra',state:'Uttar Pradesh',country:'India',isServiceable:true,schemaVersion:3,hostelVerified:true,hostelId:'hostel',foodName:'Rice',foodType:'veg',location:{city:'Pune'},status:'available',isPaused:false,availableBoxes:8,expiryTime:now+3600000,createdAt:now};
 const items=[{...base,id:'far',publicLocation:{latitude:19,longitude:74}},{...base,id:'near',publicLocation:{latitude:18.53,longitude:73.85}},{...base,id:'legacy',schemaVersion:2}];
 assert.deepEqual(filterRealListings(items,{...realFilters(),radius:'2',sort:'nearest'},'ngo',now,origin).map(i=>i.id),['near']);
 assert.deepEqual(filterRealListings(items,{...realFilters(),sort:'nearest'},'ngo',now,origin).map(i=>i.id),['near','far','legacy']);
 assert.equal(filterRealListings(items,{...realFilters(),radius:'2'},'ngo',now,null).length,3);
 assert.equal(filterRealListings(items,{...realFilters(),type:'nonVeg'},'ngo',now,origin).length,0);
});
test('pin validation rejects malformed coordinates and navigation includes only coordinates',()=>{
 const exact={address:'Private Gate 9',latitude:18.520412,longitude:73.856701};const fields=locationFields(exact,'Pune','Shivajinagar');assert.equal(fields.exactLocation.address,'Private Gate 9');assert.equal(fields.publicLocation.address,undefined);
 assert.throws(()=>locationFields({...exact,latitude:NaN},'Pune','Area'));assert.throws(()=>locationFields(exact,'P','Area'));
 const url=new URL(navigationURL({latitude:18.52,longitude:73.85},exact));assert.equal(url.hostname,'www.openstreetmap.org');assert(!url.href.includes('Private'));assert.equal(url.searchParams.get('route'),'18.52,73.85;18.520412,73.856701');
});
