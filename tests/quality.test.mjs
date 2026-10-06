import test from 'node:test';
import assert from 'node:assert/strict';
import {routeTo,clearRouteCache} from '../js/routing.js';
import {searchAddress} from '../js/location-search.js';
const original=globalThis.fetch;
test('map service failures stay actionable, malformed road data is rejected and repeated routes are cached',async()=>{
 const config={leafletCSS:'https://unpkg.com/leaflet.css',leafletJS:'https://unpkg.com/leaflet.js',tiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',geocoder:'https://nominatim.openstreetmap.org/search',router:'https://router.project-osrm.org/route/v1/driving'};
 let calls=0,mode='network';globalThis.fetch=async url=>{if(url==='map-services.json')return {ok:true,json:async()=>config};calls++;if(mode==='network')throw new TypeError('secret low-level network diagnostic');if(mode==='rate')return {ok:false,status:429};if(mode==='invalid')return {ok:true,json:async()=>({code:'Ok',routes:[{distance:1000,duration:300,geometry:{type:'LineString',coordinates:[[73,18],[NaN,19]]}}]})};return {ok:true,json:async()=>({code:'Ok',routes:[{distance:1000,duration:300,geometry:{type:'LineString',coordinates:[[73,18],[73.01,18.01]]}}]})};};
 const a={latitude:18,longitude:73},b={latitude:18.01,longitude:73.01};
 try{
  await assert.rejects(routeTo(a,b),e=>e.message.includes('Check your connection')&&!e.message.includes('secret'));
  mode='invalid';await assert.rejects(routeTo(a,b),/No road route/);
  mode='good';const r=await routeTo(a,b);assert.equal(r.distance,1);assert.equal(r.minutes,5);const before=calls;await routeTo(a,b);assert.equal(calls,before);
  const c=new AbortController();c.abort();clearRouteCache();await assert.rejects(routeTo(a,b,{signal:c.signal}),/cancelled/);
  globalThis.navigator??={};mode='network';await assert.rejects(searchAddress('Quality connection test'),e=>e.message.includes('Check your connection')&&!e.message.includes('secret'));
  mode='rate';await assert.rejects(searchAddress('Quality rate limit test'),/Wait at least a minute/);const blocked=calls;await assert.rejects(searchAddress('Another rate limited test'),/Wait at least a minute/);assert.equal(calls,blocked);
 }finally{globalThis.fetch=original;clearRouteCache();}
});
