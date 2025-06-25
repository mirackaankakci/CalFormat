// pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, LogIn, Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { loginRateLimit } from '../../utils/security';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // Giriş yapmaya çalıştığı sayfa
  const from = (location.state as any)?.from?.pathname || '/';

  // ✅ Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (user && userProfile) {
      navigate(from, { replace: true });
    }
  }, [user, userProfile, navigate, from]);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.email.trim()) {
      errors.push('E-posta zorunludur');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Geçerli bir e-posta adresi girin');
    }
    
    if (!formData.password.trim()) {
      errors.push('Şifre zorunludur');
    } else if (formData.password.length < 6) {
      errors.push('Şifre en az 6 karakter olmalıdır');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Form validasyonu
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    // ✅ Rate limiting kontrolü
    const userKey = formData.email.toLowerCase();
    if (!loginRateLimit.isAllowed(userKey)) {
      setError('Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔐 Giriş yapılıyor:', formData.email);

      // ✅ Firebase Auth ile giriş
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email.trim().toLowerCase(), 
        formData.password
      );
      
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth başarılı:', firebaseUser.uid);

      // ✅ Kullanıcı profilini kontrol et
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      

      const userData = userDoc.data();
      console.log('👤 Kullanıcı profili:', userData);

      // ✅ E-posta doğrulama kontrolü
      if (!firebaseUser.emailVerified) {
        console.log('📧 E-posta doğrulanmamış, yönlendiriliyor...');
        navigate('/verify-email', { replace: true });
        return;
      }

      // ✅ Başarılı giriş
      console.log('🎉 Giriş başarılı, yönlendiriliyor:', from);
      
      // Admin kontrolü
      if (userData?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/admin' ? '/' : from, { replace: true });
      }
      
    } catch (err: any) {
      console.error('❌ Giriş hatası:', err);
      
      // ✅ Detaylı hata mesajları
      let errorMessage = 'Giriş yapılırken hata oluştu.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'E-posta veya şifre hatalı.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Bu kullanıcı hesabı devre dışı bırakılmış.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'E-posta veya şifre hatalı.';
          break;
        default:
          errorMessage = 'Giriş yapılırken beklenmeyen bir hata oluştu.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata mesajını temizle
    if (error) setError('');
  };

  // ✅ Loading durumu
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#ee7f1a] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Giriş kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Geri Dön */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <span className="text-[#ee7f1a]">CalFormat</span> Giriş
            </h1>
            <p className="text-gray-600">
              Hesabınıza giriş yapın
            </p>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          {/* Alt Linkler */}
          <div className="mt-8 text-center space-y-3">
            <div className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <Link
                to="/register"
                className="font-medium text-[#ee7f1a] hover:text-[#d62d27] transition-colors"
              >
                Kayıt Olun
              </Link>
            </div>
            
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;