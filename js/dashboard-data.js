// Illustrative impact/history only. Food listings now come from the owner-scoped Firestore repository.
export const collectionHistory=[
  {partner:'Community Table',food:'Rice, dal & vegetables',meals:96,when:'Yesterday, 6:40 PM',status:'Collected'},
  {partner:'Nourish Together',food:'Vegetable biryani',meals:72,when:'2 days ago, 7:15 PM',status:'Collected'},
  {partner:'Hope Kitchen',food:'Breakfast portions',meals:48,when:'3 days ago, 9:30 AM',status:'Collected'}
];
export function expiryState(expiry,now=Date.now()) {
  const minutes=Math.max(0,Math.ceil((expiry-now)/60000));
  return {minutes,label:minutes===0?'Expired':minutes<=30?'Urgent: expires soon':minutes<=120?'Pickup window closing':'Plenty of time',tone:minutes<=30?'urgent':minutes<=120?'closing':'calm',time:minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60}m`:`${minutes}m`};
}

