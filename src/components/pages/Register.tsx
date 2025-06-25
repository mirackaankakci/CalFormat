// components/pages/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.displayName.trim()) {
      errors.push('İsim zorunludur');
    } else if (formData.displayName.length < 2) {
      errors.push('İsim en az 2 karakter olmalıdır');
    }
    
    if (!formData.email.trim()) {
      errors.push('E-posta zorunludur');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Geçerli bir e-posta adresi girin');
    }
    
    if (!formData.password) {
      errors.push('Şifre zorunludur');
    } else if (formData.password.length < 6) {
      errors.push('Şifre en az 6 karakter olmalıdır');
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.push('Şifreler eşleşmiyor');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      const user = userCredential.user;

      // Profil güncelle
      await updateProfile(user, {
        displayName: formData.displayName.trim()
      });

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        role: 'user', // Varsayılan rol
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // E-posta doğrulama gönder
      await sendEmailVerification(user);

      alert('Kayıt başarılı! E-posta adresinize doğrulama linki gönderildi.');
      navigate('/verify-email');

    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Bu e-posta adresi zaten kullanımda');
          break;
        case 'auth/weak-password':
          setError('Şifre çok zayıf');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz e-posta adresi');
          break;
        case 'auth/operation-not-allowed':
          setError('E-posta/şifre ile kayıt devre dışı');
          break;
        default:
          setError('Kayıt olurken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            <span className="text-[#ee7f1a]">CalFormat</span>'a Katılın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{' '}
            <Link
              to="/admin-login"
              className="font-medium text-[#ee7f1a] hover:text-[#d62d27] transition-colors"
            >
              mevcut hesabınızla giriş yapın
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İsim */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                İsim Soyisim
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="İsim Soyisim"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="E-posta adresiniz"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="Şifreniz (en az 6 karakter)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent disabled:opacity-50"
                  placeholder="Şifrenizi tekrar girin"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] hover:from-[#d62d27] hover:to-[#ee7f1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ee7f1a] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Kayıt olunuyor...
                  </>
                ) : (
                  'Kayıt Ol'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Zaten hesabınız var mı?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[#ee7f1a] hover:text-[#d62d27] transition-colors"
                >
                  Giriş Yapın
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;