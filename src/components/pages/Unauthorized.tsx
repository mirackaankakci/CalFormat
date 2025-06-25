// components/pages/Unauthorized.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Erişim <span className="text-red-600">Reddedildi</span>
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8 text-lg">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. 
            Bu işlemi gerçekleştirmek için yönetici yetkileriniz olması gerekiyor.
          </p>

          {/* Error Code */}
          <div className="bg-gray-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Hata Kodu:</span> 403 - Forbidden Access
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              <Home className="w-5 h-5" />
              Ana Sayfaya Dön
            </Link>
            
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Bloglara Dön
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Eğer bu bir hata olduğunu düşünüyorsanız, lütfen{' '}
              <a 
                href="mailto:admin@calformat.com"
                className="text-[#ee7f1a] hover:text-[#d62d27] font-medium"
              >
                yönetici ile iletişime geçin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;