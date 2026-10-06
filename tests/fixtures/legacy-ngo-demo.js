// Fictional discovery only: no UID, coordinates, street address, or provider contact.
export function ngoDemoListings(now=Date.now()){
 return [
 {id:'demo-rice',name:'Rice, dal & seasonal vegetables',provider:'Riverstone Hostel',verified:true,type:'Veg',boxes:18,meals:4,distance:1.2,city:'Pune',area:'Central Pune',ready:now-10*60000,expiry:now+95*60000,rating:4.9,allergens:'None declared',packing:'Sealed food-safe boxes',notes:'Freshly packed individual portions. Please plan a prompt collection.',image:'assets/images/hero-meal.jpg'},
 {id:'demo-biryani',name:'Vegetable biryani & raita',provider:'Oakwood Student Living',verified:true,type:'Veg',boxes:12,meals:3,distance:2.4,city:'Pune',area:'East Pune',ready:now+45*60000,expiry:now+240*60000,rating:4.8,allergens:'Milk, nuts',packing:'Covered food-safe containers',notes:'Raita is packed separately. Suitable transport containers are recommended.',image:'assets/images/ingredients.jpg'},
 {id:'demo-chicken',name:'Chicken curry & steamed rice',provider:'Campus Kitchen Collective',verified:false,type:'Non-Veg',boxes:8,meals:4,distance:4.6,city:'Pune',area:'West Pune',ready:now-5*60000,expiry:now+24*60000,rating:4.7,allergens:'Milk',packing:'Sealed food-safe boxes',notes:'This demo pickup window is closing soon.',image:'assets/images/hero-meal.jpg'},
 {id:'demo-mixed',name:'Sandwiches & fruit portions',provider:'Greenfield Residence',verified:true,type:'Mixed',boxes:10,meals:2,distance:6.1,city:'Pune',area:'North Pune',ready:now+90*60000,expiry:now+360*60000,rating:4.9,allergens:'Wheat, milk, egg',packing:'Individually wrapped portions',notes:'Vegetarian and non-vegetarian sandwiches are labeled separately.',image:'assets/images/ingredients.jpg'}
 ];
}
export const defaultNgoFilters=()=>({location:'',radius:10,type:'all',boxes:1,pickup:'any',urgent:false,verified:false,sort:'nearest'});
export function filterNgoListings(items,filters,now=Date.now()){
 const text=String(filters.location||'').trim().toLowerCase();
 return items.filter(item=>item.expiry>now&&(!text||`${item.city} ${item.area}`.toLowerCase().includes(text))&&item.distance<=Number(filters.radius)&&item.boxes>=Number(filters.boxes)&&(filters.type==='all'||item.type===filters.type)&&(!filters.urgent||item.expiry-now<=30*60000)&&(!filters.verified||item.verified)&&(filters.pickup==='any'||filters.pickup==='now'&&item.ready<=now||filters.pickup==='hour'&&item.ready<=now+60*60000)).sort((a,b)=>filters.sort==='expiry'?a.expiry-b.expiry:filters.sort==='rating'?b.rating-a.rating||a.distance-b.distance:a.distance-b.distance);
}
