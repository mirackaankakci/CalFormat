// Firebase Admin kullanıcılarını listeleyen script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAykdlTycDZKtk7u---bHpVeyhVlZPzcvA",
  authDomain: "calformat-blog.firebaseapp.com",
  projectId: "calformat-blog",
  storageBucket: "calformat-blog.firebasestorage.app",
  messagingSenderId: "1038738497276",
  appId: "1:1038738497276:web:a34299f7ee3cfcc2ab8179",
  measurementId: "G-MKLQM2DZMQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function listUsers() {
  try {
    console.log('🔍 Firebase kullanıcıları aranıyor...');
    
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        role: userData.role,
        displayName: userData.displayName,
        createdAt: userData.createdAt
      });
    });
    
    console.log('👥 Bulunan kullanıcılar:', users.length);
    
    // Admin kullanıcıları filtrele
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log('👑 Admin kullanıcılar:', adminUsers.length);
    
    // Tüm kullanıcıları göster
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Kullanıcı:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   İsim: ${user.displayName || 'Belirtilmemiş'}`);
      console.log(`   ID: ${user.id}`);
      if (user.role === 'admin') {
        console.log('   🚨 BU BİR ADMİN KULLANICI!');
      }
    });
    
    // Admin emaillerini listele
    if (adminUsers.length > 0) {
      console.log('\n🔑 Admin Email Adresleri:');
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
      });
    } else {
      console.log('\n⚠️ Hiç admin kullanıcı bulunamadı!');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

// Script'i çalıştır
listUsers();
