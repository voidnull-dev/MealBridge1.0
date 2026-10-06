import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardAccess} from '../js/dashboard-access.js';
import {expiryState} from '../js/dashboard-data.js';
const user={uid:'provider',email:'provider@example.org',emailVerified:true};
const profile={...user,role:'hostel',serviceRegion:'agra',city:'Agra',state:'Uttar Pradesh',country:'India',isServiceable:true,isVerified:true,verificationStatus:'verified'};
test('dashboard requires authenticated, verified identity and matching hostel profile',()=>{
 assert.equal(dashboardAccess(user,profile),'allowed');
 for(const state of ['pending','rejected'])assert.equal(dashboardAccess(user,{...profile,isVerified:false,verificationStatus:state}),state);assert.equal(dashboardAccess(user,{...profile,isVerified:true,verificationStatus:'pending'}),'pending');
 for(const patch of [{city:'Pune'},{state:'Punjab'},{country:'Pakistan'},{isServiceable:false}])assert.equal(dashboardAccess(user,{...profile,...patch}),'outside');
 assert.equal(dashboardAccess(null,profile),'signed-out');
 assert.equal(dashboardAccess(user,null),'incomplete');
 for(const role of ['ngo','admin','unknown'])assert.equal(dashboardAccess(user,{...profile,role}),'denied');
 assert.equal(dashboardAccess({...user,emailVerified:false},profile),'denied');
 assert.equal(dashboardAccess(user,{...profile,uid:'other'}),'denied');
 assert.equal(dashboardAccess(user,{...profile,email:'other@example.org'}),'denied');
});
test('expiry urgency changes at collection-window boundaries',()=>{
 const now=1000000;
 for(const [minutes,label]of [[-1,'Expired'],[0,'Expired'],[30,'Urgent: expires soon'],[31,'Pickup window closing'],[120,'Pickup window closing'],[121,'Plenty of time']])assert.equal(expiryState(now+minutes*60000,now).label,label);
 assert.equal(expiryState(now+121*60000,now).time,'2h 1m');
});
