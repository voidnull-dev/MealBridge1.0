// UI gate mirrors deployed profile approval and Agra coverage; rules enforce data access.
export function dashboardAccess(user,profile,role='hostel') {
  if(!user)return 'signed-out';
  if(!profile)return 'incomplete';
  if(!user.emailVerified || profile.uid!==user.uid || profile.email!==user.email)return 'denied';
  if(!['hostel','ngo'].includes(role)||profile.role!==role)return 'denied';
  if(profile.serviceRegion!=='agra'||profile.isServiceable!==true||profile.city!=='Agra'||profile.state!=='Uttar Pradesh'||profile.country!=='India')return 'outside';
  return profile.isVerified===true&&profile.verificationStatus==='verified'?'allowed':profile.verificationStatus==='rejected'?'rejected':'pending';
}
