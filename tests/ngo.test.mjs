import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardAccess} from '../js/dashboard-access.js';
import {ngoDemoListings,defaultNgoFilters,filterNgoListings} from './fixtures/legacy-ngo-demo.js';
const user={uid:'collector',email:'collector@example.org',emailVerified:true};
test('NGO gate rejects foreign roles, identity mismatches, missing profiles and unverified users',()=>{
 const profile={...user,role:'ngo',serviceRegion:'agra',city:'Agra',state:'Uttar Pradesh',country:'India',isServiceable:true,isVerified:true,verificationStatus:'verified'};assert.equal(dashboardAccess(user,profile,'ngo'),'allowed');
 for(const role of ['hostel','admin'])assert.equal(dashboardAccess(user,{...profile,role},'ngo'),'denied');
 assert.equal(dashboardAccess({...user,emailVerified:false},profile,'ngo'),'denied');assert.equal(dashboardAccess(user,{...profile,uid:'other'},'ngo'),'denied');assert.equal(dashboardAccess(user,{...profile,email:'other@example.org'},'ngo'),'denied');assert.equal(dashboardAccess(null,profile,'ngo'),'signed-out');assert.equal(dashboardAccess(user,null,'ngo'),'incomplete');assert.equal(dashboardAccess(user,{...profile,role:'admin'},'admin'),'denied');
});
test('demo filters support all requested selectors without mutating source data',()=>{
 const now=1000000,items=ngoDemoListings(now),base=defaultNgoFilters();assert.equal(filterNgoListings(items,base,now).length,4);
 assert.equal(filterNgoListings(items,{...base,type:'Veg'},now).length,2);assert.equal(filterNgoListings(items,{...base,urgent:true},now)[0].id,'demo-chicken');assert.equal(filterNgoListings(items,{...base,verified:true},now).length,3);assert.equal(filterNgoListings(items,{...base,radius:2},now).length,1);assert.equal(filterNgoListings(items,{...base,boxes:15},now).length,1);assert.equal(filterNgoListings(items,{...base,pickup:'now'},now).length,2);assert.equal(filterNgoListings(items,{...base,pickup:'hour'},now).length,3);assert.equal(filterNgoListings(items,{...base,location:'EAST pune'},now)[0].id,'demo-biryani');assert.equal(filterNgoListings(items,{...base,location:'Unknown'},now).length,0);assert.equal(filterNgoListings(items,{...base,sort:'expiry'},now)[0].id,'demo-chicken');assert.equal(filterNgoListings(items,{...base,sort:'rating'},now)[0].rating,4.9);assert.equal(filterNgoListings(items,base,now+400*60000).length,0);assert.equal(items.length,4);
});
test('demo listings contain no street addresses, coordinates or provider contact',()=>{
 for(const item of ngoDemoListings())for(const forbidden of ['address','location','lat','lng','phone','email','contactPerson','hostelId'])assert.equal(forbidden in item,false);
});
