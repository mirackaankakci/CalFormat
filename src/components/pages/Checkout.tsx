import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Check, User, MapPin, Loader2, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAddress } from '../../hooks/useAddress';
import sipayService, { SipayPaymentData } from '../../services/sipayService';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { 
    cities, 
    districts, 
    towns, 
    selectedCity, 
    selectedDistrict, 
    selectedTown,
    setSelectedCity,
    setSelectedDistrict,
    setSelectedTown,
    getSelectedNames
  } = useAddress();
  
  const [activeStep, setActiveStep] = useState<'bilgiler' | 'odeme' | 'onay'>('bilgiler');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isCompany, setIsCompany] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    notes: '',
    kvkkConsent: false,
    salesAgreementConsent: false,
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    installments: 1
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const total = subtotal + shipping;

  // Taksit seçeneklerini yükle
  useEffect(() => {
    const options = sipayService.getInstallmentOptions(total);
    setInstallmentOptions(options);
  }, [total]);

  // URL parametrelerini kontrol et (Sipay dönüş)
  useEffect(() => {
    const checkPaymentResult = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sipayStatus = urlParams.get('sipay_status');
      const orderNo = urlParams.get('order_no');
      const invoiceId = urlParams.get('invoice_id');

      if (sipayStatus && orderNo && invoiceId) {
        if (sipayStatus === '1') {
          // Ödeme başarılı
          setOrderData({
            success: true,
            orderId: orderNo,
            invoiceId: invoiceId,
            orderSummary: {
              items: items,
              subtotal: subtotal,
              shipping: shipping,
              total: total
            }
          });
          setActiveStep('onay');
          clearCart();
        } else {
          // Ödeme başarısız
          setOrderError('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
          setActiveStep('odeme');
        }
        
        // URL'yi temizle
        window.history.replaceState({}, '', '/checkout');
      }
    };

    checkPaymentResult();
  }, []);

  const validateStep = (step: 'bilgiler' | 'odeme' | 'onay') => {
    if (step === 'bilgiler') {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address'];
      const missing = required.filter(field => !formData[field as keyof typeof formData]);
      
      if (missing.length > 0) {
        setOrderError(`Lütfen zorunlu alanları doldurun: ${missing.join(', ')}`);
        return false;
      }
      
      if (!selectedCity || !selectedDistrict || !selectedTown) {
        setOrderError('Lütfen şehir, ilçe ve mahalle seçimi yapın');
        return false;
      }
      
      if (!formData.kvkkConsent || !formData.salesAgreementConsent) {
        setOrderError('Lütfen sözleşme onaylarını verin');
        return false;
      }
      
      return true;
    }

    if (step === 'odeme') {
      // Kart validasyonları
      if (!cardData.cardNumber || !sipayService.validateCardNumber(cardData.cardNumber)) {
        setOrderError('Lütfen geçerli bir kart numarası girin');
        return false;
      }

      if (!cardData.cardHolder.trim()) {
        setOrderError('Lütfen kart sahibinin adını girin');
        return false;
      }

      if (!cardData.expiryMonth || !cardData.expiryYear) {
        setOrderError('Lütfen kartın son kullanma tarihini girin');
        return false;
      }

      if (!sipayService.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
        setOrderError('Kartın son kullanma tarihi geçersiz');
        return false;
      }

      if (!cardData.cvv || (cardData.cvv.length !== 3 && cardData.cvv.length !== 4)) {
        setOrderError('Lütfen geçerli bir CVV girin');
        return false;
      }

      return true;
    }
    
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }
    
    if (activeStep === 'bilgiler') {
      setActiveStep('odeme');
      setOrderError(null);
    } else if (activeStep === 'odeme') {
      await processSipayPayment();
    }
  };

  const processSipayPayment = async () => {
    setIsProcessingPayment(true);
    setOrderError(null);
    
    try {
      const selectedNames = getSelectedNames();
      const invoiceId = `CALFORMAT-${Date.now()}`;
      
      // Sepet ürünlerini Sipay formatına çevir
      const cartItems = items.map(item => ({
        name: item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        description: item.name
      }));

      const paymentData: SipayPaymentData = {
        cc_holder_name: cardData.cardHolder,
        cc_no: cardData.cardNumber.replace(/\s/g, ''),
        expiry_month: cardData.expiryMonth.padStart(2, '0'),
        expiry_year: cardData.expiryYear,
        cvv: cardData.cvv,
        currency_code: 'TRY',
        installments_number: cardData.installments,
        invoice_id: invoiceId,
        invoice_description: `CalFormat Sipariş - ${invoiceId}`,
        name: formData.firstName,
        surname: formData.lastName,
        total: total,
        items: JSON.stringify(cartItems),
        cancel_url: `${window.location.origin}/checkout?status=cancel`,
        return_url: `${window.location.origin}/checkout?status=success`,
        bill_address1: formData.address,
        bill_city: selectedNames.cityName,
        bill_state: selectedNames.districtName,
        bill_postcode: '34000',
        bill_country: 'TR',
        bill_email: formData.email,
        bill_phone: formData.phone
      };

      console.log('🔄 Sipay ödeme işlemi başlatılıyor...', paymentData);

      const result = await sipayService.processPayment(paymentData);

      if (result.success && result.payment_status === 1) {
        // Ödeme başarılı
        console.log('✅ Sipay ödeme başarılı:', result);
        
        setOrderData({
          success: true,
          orderId: invoiceId,
          transactionType: result.transaction_type,
          orderSummary: {
            items: items,
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            address: selectedNames,
            formData: formData
          }
        });
        
        setActiveStep('onay');
        clearCart();
        
        // URL'yi güncelle
        window.history.replaceState({}, '', '/checkout?status=success');
        
      } else {
        // Ödeme başarısız
        console.warn('⚠️ Sipay ödeme başarısız:', result);
        throw new Error(result.data?.message || 'Ödeme işlemi başarısız oldu');
      }
      
    } catch (error) {
      console.error('❌ Sipay ödeme hatası:', error);
      setOrderError(error instanceof Error ? error.message : 'Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Kart numarası formatlaması
      const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
      setCardData(prev => ({
        ...prev,
        [name]: formatted.substring(0, 19) // Max 16 digit + 3 spaces
      }));
    } else if (name === 'cvv') {
      // CVV sadece rakam
      const cleaned = value.replace(/\D/g, '');
      setCardData(prev => ({
        ...prev,
        [name]: cleaned.substring(0, 4) // Max 4 digit for AMEX
      }));
    } else if (name === 'expiryMonth') {
      // Ay 01-12 arası
      const month = value.replace(/\D/g, '');
      if (month === '' || (parseInt(month) >= 1 && parseInt(month) <= 12)) {
        setCardData(prev => ({
          ...prev,
          [name]: month.substring(0, 2)
        }));
      }
    } else if (name === 'expiryYear') {
      // Yıl 4 haneli
      const year = value.replace(/\D/g, '');
      setCardData(prev => ({
        ...prev,
        [name]: year.substring(0, 4)
      }));
    } else {
      setCardData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (items.length === 0 && activeStep !== 'onay') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sepetiniz Boş</h2>
          <p className="text-gray-600 mb-6">Ödeme yapabilmek için sepetinize ürün eklemeniz gerekiyor.</p>
          <Link to="/" className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Sepete Dön
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Ödeme</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center gap-3 ${activeStep === 'bilgiler' ? 'text-orange-500' : activeStep === 'odeme' || activeStep === 'onay' ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  activeStep === 'bilgiler' ? 'border-orange-500 bg-orange-50' : 
                  activeStep === 'odeme' || activeStep === 'onay' ? 'border-green-500 bg-green-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  {activeStep === 'odeme' || activeStep === 'onay' ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className="font-medium">Bilgiler</span>
              </div>

              <div className={`flex items-center gap-3 ${activeStep === 'odeme' ? 'text-orange-500' : activeStep === 'onay' ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  activeStep === 'odeme' ? 'border-orange-500 bg-orange-50' : 
                  activeStep === 'onay' ? 'border-green-500 bg-green-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  {activeStep === 'onay' ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <span className="font-medium">Ödeme</span>
              </div>

              <div className={`flex items-center gap-3 ${activeStep === 'onay' ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  activeStep === 'onay' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  {activeStep === 'onay' ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <span className="font-medium">Onay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol taraf - Form */}
          <div className="lg:col-span-2">
            {orderError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 text-sm">{orderError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {activeStep === 'bilgiler' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Kişisel Bilgiler
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isCompany}
                          onChange={(e) => setIsCompany(e.target.checked)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Kurumsal fatura</span>
                      </label>
                    </div>

                    {isCompany && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Adı *</label>
                          <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required={isCompany}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Numarası *</label>
                          <input
                            type="text"
                            name="taxNumber"
                            value={formData.taxNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required={isCompany}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi *</label>
                          <input
                            type="text"
                            name="taxOffice"
                            value={formData.taxOffice}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required={isCompany}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Teslimat Adresi
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        >
                          <option value="">Şehir seçin</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          disabled={!selectedCity}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                          required
                        >
                          <option value="">İlçe seçin</option>
                          {districts.map(district => (
                            <option key={district.id} value={district.id}>{district.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle *</label>
                        <select
                          value={selectedTown}
                          onChange={(e) => setSelectedTown(e.target.value)}
                          disabled={!selectedDistrict}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                          required
                        >
                          <option value="">Mahalle seçin</option>
                          {towns.map(town => (
                            <option key={town.id} value={town.id}>{town.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adres Detayı *</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Sokak, cadde, kapı no vb."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş Notu</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Eklemek istediğiniz notlar..."
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sözleşme Onayları</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          name="kvkkConsent"
                          checked={formData.kvkkConsent}
                          onChange={handleInputChange}
                          className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          required
                        />
                        <span className="text-sm text-gray-700">
                          <Link to="/privacy-policy" className="text-orange-500 hover:underline">Gizlilik Politikası</Link> ve 
                          <Link to="/distance-sales-agreement" className="text-orange-500 hover:underline"> Mesafeli Satış Sözleşmesi</Link>'ni okudum, kabul ediyorum. *
                        </span>
                      </label>

                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          name="salesAgreementConsent"
                          checked={formData.salesAgreementConsent}
                          onChange={handleInputChange}
                          className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          required
                        />
                        <span className="text-sm text-gray-700">
                          Satış şartlarını kabul ediyorum. *
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Ödeme Adımına Geç
                  </button>
                </div>
              )}

              {activeStep === 'odeme' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Kredi Kartı Bilgileri
                    </h3>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 text-sm">
                          Tüm ödeme bilgileriniz 256-bit SSL şifrelemesi ile korunmaktadır.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* Kart Numarası */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası *</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={cardData.cardNumber}
                          onChange={handleCardInputChange}
                          placeholder="1234 5678 9012 3456"
                          autoComplete="cc-number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          maxLength={19}
                          required
                        />
                        {cardData.cardNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Kart Türü: {sipayService.getCardType(cardData.cardNumber)}
                          </p>
                        )}
                      </div>

                      {/* Kart Sahibi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kart Sahibinin Adı *</label>
                        <input
                          type="text"
                          name="cardHolder"
                          value={cardData.cardHolder}
                          onChange={handleCardInputChange}
                          placeholder="JOHN DOE"
                          autoComplete="cc-name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                          required
                        />
                      </div>

                      {/* Son Kullanma Tarihi ve CVV */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ay *</label>
                          <input
                            type="text"
                            name="expiryMonth"
                            value={cardData.expiryMonth}
                            onChange={handleCardInputChange}
                            placeholder="MM"
                            autoComplete="cc-exp-month"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            maxLength={2}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Yıl *</label>
                          <input
                            type="text"
                            name="expiryYear"
                            value={cardData.expiryYear}
                            onChange={handleCardInputChange}
                            placeholder="YYYY"
                            autoComplete="cc-exp-year"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            maxLength={4}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                          <input
                            type="text"
                            name="cvv"
                            value={cardData.cvv}
                            onChange={handleCardInputChange}
                            placeholder="123"
                            autoComplete="cc-csc"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      {/* Taksit Seçenekleri */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Seçenekleri</label>
                        <select
                          name="installments"
                          value={cardData.installments}
                          onChange={handleCardInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {installmentOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep('bilgiler')}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Geri Dön
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Ödeme İşleniyor...
                        </>
                      ) : (
                        `${total.toFixed(2)} ₺ Öde`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 'onay' && orderData && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ödemeniz Başarılı!</h3>
                    <p className="text-gray-600 mb-4">
                      Sipariş numaranız: <span className="font-medium">{orderData.orderId}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Sipariş detayları e-posta adresinize gönderildi.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Sipariş Özeti</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ürünler:</span>
                        <span>{orderData.orderSummary.subtotal.toFixed(2)} ₺</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kargo:</span>
                        <span>{orderData.orderSummary.shipping.toFixed(2)} ₺</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Toplam:</span>
                        <span>{orderData.orderSummary.total.toFixed(2)} ₺</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link 
                      to="/" 
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
                    >
                      Ana Sayfaya Dön
                    </Link>
                    <Link 
                      to="/profile" 
                      className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors text-center"
                    >
                      Siparişlerimi Görüntüle
                    </Link>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Sağ taraf - Sepet Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sepet Özeti</h3>
              
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam:</span>
                  <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kargo:</span>
                  <span>{shipping.toFixed(2)} ₺</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600">🎉 Ücretsiz kargo!</p>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span>Toplam:</span>
                  <span>{total.toFixed(2)} ₺</span>
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
