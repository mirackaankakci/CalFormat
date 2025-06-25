import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // ✅ Ekleyin

const firebaseConfig = {
  // Firebase Console'dan aldığınız config
  apiKey: "AIzaSyAykdlTycDZKtk7u---bHpVeyhVlZPzcvA",
  authDomain: "calformat-blog.firebaseapp.com",
  projectId: "calformat-blog",
  storageBucket: "calformat-blog.firebasestorage.app",
  messagingSenderId: "1038738497276",
  appId: "1:1038738497276:web:a34299f7ee3cfcc2ab8179",
  measurementId: "G-MKLQM2DZMQ"

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ Ekleyin
export default app;