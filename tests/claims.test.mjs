import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRealListings,realFilters,claimInput,discoverable,claimId} from '../js/claims.js';
const now=Date.now(),item={serviceRegion:'agra',city:'Agra',isServiceable:true,id:'a',schemaVersion:2,hostelId:'provider',foodName:'Rice portions',hostelName:'Riverstone',hostelVerified:true,foodType:'veg',location:{city:'Agra',serviceRegion:'agra',state:'Uttar Pradesh',country:'India',isServiceable:true},availableBoxes:12,status:'partiallyClaimed',isPaused:false,createdAt:now,readyTime:now+60000,expiryTime:now+3600000};
test('real discovery excludes legacy, own, paused, closed, empty, and expired food',()=>{
 assert(discoverable(item,'ngo',now));for(const patch of [{schemaVersion:1},{hostelId:'ngo'},{isPaused:true},{status:'claimed'},{status:'cancelled'},{availableBoxes:0},{expiryTime:now}])assert(!discoverable({...item,...patch},'ngo',now));
});
test('live filters search food/provider/city, type, boxes, urgency, verification and ordering',()=>{
 const data=[item,{...item,id:'b',foodName:'Chicken',foodType:'nonVeg',hostelVerified:false,availableBoxes:5,expiryTime:now+1200000,readyTime:now-1000,createdAt:now+1000}];
 const ids=patch=>filterRealListings(data,{...realFilters(),...patch},'ngo',now).map(d=>d.id);
 assert.deepEqual(ids({}),['a']);for(const location of ['Rice','riverstone','agra'])assert(ids({location}).includes('a'));assert.deepEqual(ids({type:'veg'}),['a']);assert.deepEqual(ids({boxes:10}),['a']);assert.deepEqual(ids({urgent:true}),[]);assert.deepEqual(ids({verified:true}),['a']);assert.deepEqual(ids({pickup:'now'}),[]);assert.deepEqual(ids({sort:'expiry'}),['a']);assert.deepEqual(ids({sort:'boxes'}),['a']);assert.equal(data[0].id,'a');
});
test('exact claims validate integer stock and safe ETA; privileged fields are ignored',()=>{
 const valid={requestedBoxes:3,pickupETA:now+600000,ngoNote:' Team pickup ',ngoId:'attacker',claimStatus:'collected'};assert.deepEqual(claimInput(valid,item,now),{requestedBoxes:3,pickupETA:now+600000,ngoNote:'Team pickup'});
 for(const patch of [{requestedBoxes:0},{requestedBoxes:1.5},{requestedBoxes:13},{pickupETA:now-1},{pickupETA:now+30000},{pickupETA:now+3600000},{ngoNote:'x'.repeat(501)}])assert.throws(()=>claimInput({...valid,...patch},item,now));assert.equal(claimId('ngo','food'),'ngo_food');
});

