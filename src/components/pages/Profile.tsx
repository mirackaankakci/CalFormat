// components/pages/Profile.tsx
import React, { useState } from 'react';
import { updateProfile, updatePassword, sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, Save, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      setError('İsim boş olamaz');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Firebase Auth'da güncelle
      if (user) {
        await updateProfile(user, {
          displayName: formData.displayName.trim()
        });

        // Firestore'da güncelle
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: formData.displayName.trim(),
          updatedAt: new Date()
        });

        await refreshUserProfile();
        setMessage('Profil başarıyla güncellendi!');
      }
    } catch (error: any) {
      setError('Profil güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (user) {
        await updatePassword(user, formData.newPassword);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setMessage('Şifre başarıyla güncellendi!');
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setError('Şifre değiştirmek için tekrar giriş yapmanız gerekiyor');
      } else {
        setError('Şifre güncellenirken hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await sendEmailVerification(user);
      setMessage('Doğrulama e-postası gönderildi!');
    } catch (error: any) {
      setError('E-posta gönderilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Profil <span className="text-[#ee7f1a]">Ayarları</span>
          </h1>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profil Bilgileri */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-[#ee7f1a]" />
              Profil Bilgileri
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İsim Soyisim
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  />
                  {user?.emailVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Doğrulandı</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Doğrulanmadı</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleEmailVerification}
                        disabled={loading}
                        className="text-sm text-[#ee7f1a] hover:text-[#d62d27] font-medium disabled:opacity-50"
                      >
                        Doğrula
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userProfile?.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userProfile?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white py-3 px-4 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Profili Güncelle
              </button>
            </form>
          </div>

          {/* Şifre Değiştirme */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#ee7f1a]" />
              Şifre Değiştir
            </h2>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre Tekrar
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="Yeni şifreyi tekrar girin"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-5 h-5" />
                Şifreyi Güncelle
              </button>
            </form>
          </div>
        </div>

        {/* Hesap Bilgileri */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hesap Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Kayıt Tarihi:</span>
              <span className="ml-2 text-gray-600">
                {userProfile?.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'Bilinmiyor'}
              </span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Kullanıcı ID:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs">{user?.uid}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">E-posta Durumu:</span>
              <span className={`ml-2 ${user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;