// Operational Agra coverage envelope, not a municipal boundary polygon.
// Keep the same envelope in firestore.rules; trusted geocoding is a future upgrade.
export const REGION=Object.freeze({serviceRegion:'agra',city:'Agra',state:'Uttar Pradesh',country:'India',isServiceable:true});
export const AGRA_CENTER=Object.freeze({latitude:27.1753,longitude:78.0098});
export const LOCALITIES=['Tajganj','Dayal Bagh','Civil Lines','Sikandra','Kamla Nagar','Fatehabad Road'];
export const COVERAGE_ERROR='MealBridge is currently available only in the Agra region.';
export const regionError=()=>Object.assign(new Error(COVERAGE_ERROR),{code:'mealbridge/coverage'});
export const isAgraCity=value=>/^agra(?:,\s*uttar pradesh(?:,\s*india)?)?$/i.test(String(value||'').trim());
export const inAgra=p=>Boolean(p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.latitude>=27.05&&p.latitude<=27.35&&p.longitude>=77.85&&p.longitude<=78.20);
export function validateAgraPlace(p){if(!isAgraCity(p?.city)||String(p.state||'').toLowerCase()!=='uttar pradesh'||String(p.country||'').toLowerCase()!=='india'||!inAgra(p))throw regionError();return {...p,...REGION};}
export function serviceable(p){return p?.serviceRegion==='agra'&&p.isServiceable===true&&isAgraCity(p.city||p.location?.city);}
export function legacyRegion(p){return isAgraCity(p.city||p.location?.city)?{...REGION}:{serviceRegion:'outside',isServiceable:false};}
