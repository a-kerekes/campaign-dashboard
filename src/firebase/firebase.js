import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwxv-aNrM0vosqKmh2Fw7WuQKqLVapwkA",
  authDomain: "campaign-dashboard-9dccd.firebaseapp.com",
  projectId: "campaign-dashboard-9dccd",
  storageBucket: "campaign-dashboard-9dccd.firebasestorage.app",
  messagingSenderId: "375350079183",
  appId: "1:375350079183:web:fc2f6b13b41fbedbfbd1ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export default app;
