import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Check, User, MapPin, Phone, Mail } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const Checkout: React.FC = () => {
  const { items } = useCart();
  const [activeStep, setActiveStep] = useState<'bilgiler' | 'odeme' | 'onay'>('bilgiler');
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    adres: '',
    ilce: '',
    sehir: '',
    postaKodu: '',
    kartNumarasi: '',
    kartSahibi: '',
    sonKullanma: '',
    cvv: '',
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    if (activeStep === 'bilgiler') setActiveStep('odeme');
    else if (activeStep === 'odeme') setActiveStep('onay');
  };

  const handlePrevStep = () => {
    if (activeStep === 'odeme') setActiveStep('bilgiler');
    else if (activeStep === 'onay') setActiveStep('odeme');
  };

  const isFormValid = () => {
    if (activeStep === 'bilgiler') {
      return formData.ad && formData.soyad && formData.email && formData.telefon && 
             formData.adres && formData.ilce && formData.sehir && formData.postaKodu;
    } else if (activeStep === 'odeme') {
      return formData.kartNumarasi && formData.kartSahibi && formData.sonKullanma && formData.cvv;
    }
    return true;
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/cart" className="flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Sepete Dön
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-10">Ödeme</h1>

        {/* İlerleme çubuğu */}
        <div className="mb-12">
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] rounded-full transition-all duration-500"
                style={{ 
                  width: activeStep === 'bilgiler' ? '33%' : 
                         activeStep === 'odeme' ? '66%' : '100%' 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-4">
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${activeStep === 'bilgiler' || activeStep === 'odeme' || activeStep === 'onay' ? 'bg-[#ee7f1a] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Bilgiler</span>
              </div>
              
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${activeStep === 'odeme' || activeStep === 'onay' ? 'bg-[#ee7f1a] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Ödeme</span>
              </div>
              
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${activeStep === 'onay' ? 'bg-[#ee7f1a] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Onay</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Bilgiler Adımı */}
              {activeStep === 'bilgiler' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-orange-100">Kişisel Bilgiler</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          id="ad" 
                          name="ad" 
                          value={formData.ad}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="Adınız"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="soyad" className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                      <input 
                        type="text" 
                        id="soyad" 
                        name="soyad" 
                        value={formData.soyad}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="Soyadınız"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="ornek@mail.com"
                        />
                        <Mail className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          id="telefon" 
                          name="telefon" 
                          value={formData.telefon}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="05XX XXX XX XX"
                        />
                        <Phone className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-6 mt-10 pb-4 border-b border-orange-100">Teslimat Adresi</h2>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="adres" className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          id="adres" 
                          name="adres" 
                          value={formData.adres}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="Sokak, Mahalle, Bina No, Daire No"
                        />
                        <MapPin className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="ilce" className="block text-sm font-medium text-gray-700 mb-2">İlçe</label>
                        <input 
                          type="text" 
                          id="ilce" 
                          name="ilce" 
                          value={formData.ilce}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="İlçe"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="sehir" className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                        <input 
                          type="text" 
                          id="sehir" 
                          name="sehir" 
                          value={formData.sehir}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="Şehir"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="postaKodu" className="block text-sm font-medium text-gray-700 mb-2">Posta Kodu</label>
                      <input 
                        type="text" 
                        id="postaKodu" 
                        name="postaKodu" 
                        value={formData.postaKodu}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="34000"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-10 flex justify-end">
                    <button 
                      onClick={handleNextStep}
                      disabled={!isFormValid()}
                      className={`px-8 py-3 rounded-full font-medium text-white flex items-center gap-2 ${isFormValid() ? 'bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] hover:shadow-lg transform hover:scale-105 transition-all duration-300' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      Devam Et
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* Ödeme Adımı */}
              {activeStep === 'odeme' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-orange-100">Ödeme Bilgileri</h2>
                  
                  <div className="bg-gradient-to-r from-orange-100/50 to-yellow-100/50 p-5 rounded-2xl mb-8">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full">
                        <CreditCard className="w-5 h-5 text-[#ee7f1a]" />
                      </div>
                      <p className="text-gray-700">Tüm kredi kartı bilgileriniz güvenle işlenir ve saklanmaz.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="kartNumarasi" className="block text-sm font-medium text-gray-700 mb-2">Kart Numarası</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          id="kartNumarasi" 
                          name="kartNumarasi" 
                          value={formData.kartNumarasi}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        <div className="absolute right-3 top-3 flex gap-1">
                          <img src="/visa.svg" alt="Visa" className="h-5" />
                          <img src="/mastercard.svg" alt="Mastercard" className="h-5" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="kartSahibi" className="block text-sm font-medium text-gray-700 mb-2">Kart Üzerindeki İsim</label>
                      <input 
                        type="text" 
                        id="kartSahibi" 
                        name="kartSahibi" 
                        value={formData.kartSahibi}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="Ad Soyad"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sonKullanma" className="block text-sm font-medium text-gray-700 mb-2">Son Kullanma Tarihi</label>
                        <input 
                          type="text" 
                          id="sonKullanma" 
                          name="sonKullanma" 
                          value={formData.sonKullanma}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="AA/YY"
                          maxLength={5}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input 
                          type="text" 
                          id="cvv" 
                          name="cvv" 
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-10 flex justify-between">
                    <button 
                      onClick={handlePrevStep}
                      className="px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Geri Dön
                    </button>
                    
                    <button 
                      onClick={handleNextStep}
                      disabled={!isFormValid()}
                      className={`px-8 py-3 rounded-full font-medium text-white flex items-center gap-2 ${isFormValid() ? 'bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] hover:shadow-lg transform hover:scale-105 transition-all duration-300' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      Siparişi Tamamla
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* Onay Adımı */}
              {activeStep === 'onay' && (
                <div className="p-6">
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Siparişiniz Alındı!</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Siparişiniz başarıyla alınmıştır. Ödemeniz onaylandığında size bir e-posta göndereceğiz.
                    </p>
                    
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 w-full max-w-md">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Sipariş Numarası:</span>
                        <span className="font-medium">#CAL{Math.floor(Math.random() * 100000)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Tarih:</span>
                        <span className="font-medium">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Toplam:</span>
                        <span className="font-medium text-[#ee7f1a]">₺{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Link 
                      to="/"
                      className="px-8 py-3 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium"
                    >
                      Ana Sayfaya Dön
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {/* Sipariş Özeti */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-24">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                <h2 className="text-xl font-semibold text-gray-900">Sipariş Özeti</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-50">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">Adet: {item.quantity}</span>
                          <span className="text-sm font-medium">₺{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Ara Toplam</span>
                  <span>₺{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Kargo</span>
                  <span>{shipping === 0 ? "Ücretsiz" : `₺${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="border-t border-dashed border-orange-100 pt-4 mt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Toplam</span>
                    <span className="text-[#ee7f1a]">₺{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5 text-[#ee7f1a]" />
                  <div className="text-sm">
                    <p className="font-medium">Hızlı Teslimat</p>
                    <p className="text-gray-500">1-3 iş günü içinde kargoya verilir</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#ee7f1a]" />
                  <div className="text-sm">
                    <p className="font-medium">Güvenli Ödeme</p>
                    <p className="text-gray-500">SSL sertifikalı güvenli ödeme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;