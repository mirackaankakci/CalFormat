// pages/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ArrowLeft, Plus, Shield, User, Loader2, Check, X } from 'lucide-react';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  createdAt?: any;
}

const AdminUsers: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    displayName: ''
  });
  const [error, setError] = useState<string>('');

  // Kullanıcıları yükle
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
      console.log('Kullanıcılar yüklendi:', usersList.length);
    } catch (err) {
      console.error('Kullanıcı yükleme hatası:', err);
      setError('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı rolü güncelle
  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setUpdating(userId);
      console.log('Kullanıcı rolü güncelleniyor:', userId, newRole);
      
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date()
      });

      // Local state'i güncelle
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      console.log('Kullanıcı rolü güncellendi');
    } catch (err) {
      console.error('Rol güncelleme hatası:', err);
      setError('Rol güncellenirken hata oluştu');
    } finally {
      setUpdating(null);
    }
  };

  // Yeni kullanıcı ekle
  const addNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      setError('Email ve şifre zorunludur');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Yeni kullanıcı oluşturuluyor:', newUser.email);

      // Authentication'da kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );

      // Firestore'da profil oluştur
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName || newUser.email,
        createdAt: new Date()
      });

      console.log('Yeni kullanıcı oluşturuldu:', userCredential.user.uid);

      // Form'u temizle
      setNewUser({
        email: '',
        password: '',
        role: 'user',
        displayName: ''
      });
      setShowAddUser(false);

      // Kullanıcıları yeniden yükle
      await loadUsers();

      alert('Kullanıcı başarıyla oluşturuldu!');

    } catch (err: any) {
      console.error('Kullanıcı oluşturma hatası:', err);
      
      let errorMessage = 'Kullanıcı oluşturulurken hata oluştu';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf (en az 6 karakter)';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Yetkiniz Yok</h3>
            <p className="text-gray-600">Bu sayfaya sadece admin kullanıcılar erişebilir.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors duration-300 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Blog Yönetimine Dön
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Kullanıcı <span className="text-[#ee7f1a]">Yönetimi</span>
            </h1>
            <p className="text-gray-600 mt-2">Kullanıcı rollerini yönetin ve yeni admin kullanıcılar ekleyin</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-4 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Kullanıcı
          </button>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Yeni Kullanıcı Formu */}
        {showAddUser && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Yeni Kullanıcı Ekle</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={addNewUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="email"
                placeholder="Email adresi"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="Şifre (min 6 karakter)"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent"
                required
                minLength={6}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent"
              >
                <option value="user">Normal Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ekle
              </button>
            </form>
          </div>
        )}

        {/* Kullanıcı Listesi */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-[#ee7f1a] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Kullanıcılar yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.role === 'admin' ? (
                              <Shield className="w-5 h-5 text-[#ee7f1a]" />
                            ) : (
                              <User className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || 'İsimsiz'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-[#ee7f1a] text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <button
                              onClick={() => updateUserRole(user.id, 'user')}
                              disabled={updating === user.id}
                              className="text-red-600 hover:text-red-800 transition-colors duration-300 disabled:opacity-50 flex items-center gap-1"
                            >
                              {updating === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              Admin Kaldır
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(user.id, 'admin')}
                              disabled={updating === user.id}
                              className="text-green-600 hover:text-green-800 transition-colors duration-300 disabled:opacity-50 flex items-center gap-1"
                            >
                              {updating === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Admin Yap
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Henüz kullanıcı bulunamadı.</p>
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-[#ee7f1a]" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Admin Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <User className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Normal Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;