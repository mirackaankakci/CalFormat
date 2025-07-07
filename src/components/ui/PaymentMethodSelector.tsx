import React, { useState } from 'react';
import { CreditCard, Shield, Zap, CheckCircle } from 'lucide-react';

interface PaymentMethodSelectorProps {
  onPaymentMethodSelect: (method: '2D' | '3D') => void;
  selectedMethod?: '2D' | '3D';
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  onPaymentMethodSelect, 
  selectedMethod 
}) => {
  const [selected, setSelected] = useState<'2D' | '3D'>(selectedMethod || '3D');

  const handleSelection = (method: '2D' | '3D') => {
    setSelected(method);
    onPaymentMethodSelect(method);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Ödeme Güvenlik Yöntemini Seçin
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3D Secure Ödeme */}
        <div 
          onClick={() => handleSelection('3D')}
          className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selected === '3D' 
              ? 'border-green-500 bg-green-50 shadow-lg' 
              : 'border-gray-200 hover:border-green-300 hover:shadow-md'
          }`}
        >
          {selected === '3D' && (
            <CheckCircle className="absolute top-3 right-3 w-6 h-6 text-green-500" />
          )}
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                3D Secure Ödeme
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                En güvenli ödeme yöntemi. Bankanızın doğrulama sayfasına yönlendirileceksiniz.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Banka doğrulaması</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Maksimum güvenlik</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>SMS doğrulama</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ İşlem 30-60 saniye sürebilir
              </div>
            </div>
          </div>
        </div>

        {/* 2D Hızlı Ödeme */}
        <div 
          onClick={() => handleSelection('2D')}
          className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selected === '2D' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          {selected === '2D' && (
            <CheckCircle className="absolute top-3 right-3 w-6 h-6 text-blue-500" />
          )}
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Hızlı Ödeme (2D)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Direkt kart işlemi. Hızlı ve pratik ödeme yöntemi.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Anında işlem</span>
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Hızlı sonuç</span>
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Pratik kullanım</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ⚡ İşlem 5-10 saniye sürer
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Seçiminiz: {selected === '3D' ? '3D Secure Ödeme' : 'Hızlı Ödeme (2D)'}</p>
            <p>
              {selected === '3D' 
                ? 'Bankanızın güvenlik sayfasında SMS ile doğrulama yapacaksınız.' 
                : 'Kart bilgileriniz ile direkt ödeme işlemi gerçekleştirilecek.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
