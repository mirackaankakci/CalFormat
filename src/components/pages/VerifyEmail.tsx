// components/pages/VerifyEmail.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Kullanıcı zaten doğrulanmışsa ana sayfaya yönlendir
    if (user?.emailVerified) {
      navigate('/');
      return;
    }

    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate, resendCooldown]);

  const handleResendEmail = async () => {
    if (!user || resendCooldown > 0) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await sendEmailVerification(user);
      setMessage('Doğrulama e-postası yeniden gönderildi!');
      setResendCooldown(60); // 60 saniye cooldown
    } catch (error: any) {
      console.error('E-posta gönderme hatası:', error);
      
      switch (error.code) {
        case 'auth/too-many-requests':
          setError('Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz e-posta adresi.');
          break;
        default:
          setError('E-posta gönderilirken hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Kullanıcı bilgilerini yenile
      await reload(user);
      
      if (user.emailVerified) {
        setMessage('E-posta başarıyla doğrulandı! Yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('E-posta henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin.');
      }
    } catch (error: any) {
      setError('Doğrulama kontrolü sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Kullanıcı bilgileri yükleniyor...</p>
          <Link to="/login" className="text-[#ee7f1a] hover:text-[#d62d27] mt-4 inline-block">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-100 rounded-full">
              <Mail className="w-16 h-16 text-yellow-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            E-posta <span className="text-[#ee7f1a]">Doğrulama</span>
          </h1>

          {/* User Email */}
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Doğrulama e-postası gönderildi:</p>
            <p className="font-semibold text-gray-900">{user.email}</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {message}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="text-left bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Doğrulama Adımları:
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>E-posta kutunuzu kontrol edin</li>
              <li>CalFormat'tan gelen doğrulama e-postasını bulun</li>
              <li>E-postadaki "E-postayı Doğrula" linkine tıklayın</li>
              <li>Aşağıdaki "Doğrulamayı Kontrol Et" butonuna tıklayın</li>
            </ol>
            <p className="text-xs text-blue-600 mt-3">
              💡 E-postayı göremiyorsanız spam/junk klasörünü de kontrol edin.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Check Verification */}
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white py-3 px-4 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <CheckCircle className="w-5 h-5" />
              Doğrulamayı Kontrol Et
            </button>

            {/* Resend Email */}
            <button
              onClick={handleResendEmail}
              disabled={loading || resendCooldown > 0}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              {resendCooldown > 0 
                ? `Tekrar Gönder (${resendCooldown}s)`
                : 'E-postayı Tekrar Gönder'
              }
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-2">
            <Link
              to="/"
              className="block text-[#ee7f1a] hover:text-[#d62d27] font-medium transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
            <Link
              to="/admin-login"
              className="block text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Farklı hesapla giriş yap
            </Link>
          </div>

          {/* Support */}
          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Sorun mu yaşıyorsunuz?{' '}
              <a 
                href="mailto:support@calformat.com"
                className="text-[#ee7f1a] hover:text-[#d62d27]"
              >
                Destek ekibiyle iletişime geçin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;