// Public Firebase web configuration, not a secret. Security lives in deployed rules.
export const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyDTp3nlCQi8cl88pepgR6u33Y9kKsmrVks',
  authDomain: 'meal-f9e82.firebaseapp.com',
  projectId: 'meal-f9e82',
  storageBucket: 'meal-f9e82.firebasestorage.app',
  messagingSenderId: '525300262745',
  appId: '1:525300262745:web:a9ad3c1202f9372999ce48',
  measurementId: 'G-SD5RSS447H'
});
export const ADMIN_EMAIL = 'suryanshdevniranjan@gmail.com';
export const SDK_VERSION = '12.4.0';
let initialization;

export function getFirebase() {
  if (location.protocol === 'file:') return Promise.reject(Object.assign(new Error('Use a local server for authentication.'), {code:'mealbridge/local-server-required'}));
  if (!initialization) initialization = initialize().catch(error => { initialization = undefined; throw error; });
  return initialization;
}
async function initialize() {
  const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
  const [appSDK, authSDK, firestoreSDK] = await Promise.all([
    import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`)
  ]);
  const app = appSDK.getApps().find(item => item.name === '[DEFAULT]') || appSDK.initializeApp(firebaseConfig);
  const auth = authSDK.getAuth(app);
  try { await authSDK.setPersistence(auth, authSDK.browserLocalPersistence); }
  catch (cause) { throw Object.assign(new Error('Allow browser storage for MealBridge, then retry sign-in.'), {code:'mealbridge/persistence-unavailable',cause}); }
  const provider = new authSDK.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  const db = firestoreSDK.getFirestore(app);
  // Storage is lazy-loaded only when a provider uses an image operation.
  return {app,auth,db,provider,...authSDK,...firestoreSDK};
}
let storageInitialization;
export function getFirebaseStorage() {
  if(!storageInitialization)storageInitialization=Promise.all([
    getFirebase(),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-storage.js`)
  ]).then(([sdk,storageSDK])=>({...storageSDK,storage:storageSDK.getStorage(sdk.app)})).catch(error=>{storageInitialization=undefined;throw error;});
  return storageInitialization;
}
