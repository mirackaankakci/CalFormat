// Debug: Admin Control Panel
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  createdAt?: any;
}

const AdminDebug: React.FC = () => {
  const { user, userProfile, isAdmin, refreshUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      setUsers(usersList);
      console.log('🔍 Tüm kullanıcılar:', usersList);
    } catch (err) {
      console.error('❌ Kullanıcı yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };
  const makeAdmin = async (userId: string, email: string) => {
    try {
      console.log(`🔄 ${email} admin yapılıyor...`);
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
        updatedAt: new Date()
      });
      
      console.log(`✅ ${email} admin yapıldı`);
      loadUsers();
      
      // Eğer bu kullanıcı mevcut kullanıcıysa, profili yenile
      if (user?.uid === userId) {
        await refreshUserProfile();
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 2000);
      }
    } catch (err) {
      console.error('❌ Admin yapma hatası:', err);
    }
  };

  const makeUser = async (userId: string, email: string) => {
    try {
      console.log(`🔄 ${email} kullanıcı yapılıyor...`);
      await updateDoc(doc(db, 'users', userId), {
        role: 'user',
        updatedAt: new Date()
      });
      
      console.log(`✅ ${email} kullanıcı yapıldı`);
      loadUsers();
      
      // Eğer bu kullanıcı mevcut kullanıcıysa, profili yenile
      if (user?.uid === userId) {
        await refreshUserProfile();
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 2000);
      }
    } catch (err) {
      console.error('❌ Kullanıcı yapma hatası:', err);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔧 Admin Debug Panel</h1>
          {/* Mevcut Kullanıcı Bilgileri */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            Mevcut Kullanıcı {refreshing && '🔄'}
          </h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>UID:</strong> {user?.uid}</p>
            <p><strong>Email Doğrulandı:</strong> {user?.emailVerified ? '✅' : '❌'}</p>
            <p><strong>Profil Yüklendi:</strong> {userProfile ? '✅' : '❌'}</p>
            <p><strong>Rol:</strong> 
              <span className={`ml-2 px-2 py-1 rounded ${
                userProfile?.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {userProfile?.role || 'Yok'}
              </span>
            </p>
            <p><strong>Admin:</strong> {isAdmin ? '✅ EVET' : '❌ HAYIR'}</p>
            
            <button
              onClick={async () => {
                setRefreshing(true);
                await refreshUserProfile();
                setTimeout(() => setRefreshing(false), 2000);
              }}
              className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              🔄 Profili Yenile
            </button>
          </div>
        </div>

        {/* Tüm Kullanıcılar */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Tüm Kullanıcılar</h2>
          
          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="border rounded p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p><strong>Email:</strong> {u.email}</p>
                      <p><strong>Rol:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role}
                        </span>
                      </p>
                      <p><strong>ID:</strong> {u.id}</p>
                    </div>
                    
                    <div className="space-x-2">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => makeAdmin(u.id, u.email)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Admin Yap
                        </button>
                      )}
                      
                      {u.role === 'admin' && (
                        <button
                          onClick={() => makeUser(u.id, u.email)}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Kullanıcı Yap
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
