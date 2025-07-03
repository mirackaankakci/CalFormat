import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Check, User, MapPin, Phone, Mail, Loader2, ChevronDown } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAddress } from '../../hooks/useAddress';
import { siPayService, type SiPayPaymentData } from '../../services/siPayService';

const Checkout: React.FC = () => {
  const { items, createOrder, clearCart } = useCart();
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
    loading,
    getSelectedNames
  } = useAddress();
  
  const [activeStep, setActiveStep] = useState<'bilgiler' | 'odeme' | 'onay'>('bilgiler');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  // Ödeme yöntemi seçimi
  const [paymentMethod, setPaymentMethod] = useState<'2d' | '3d'>('2d'); // Varsayılan olarak 2D
  
  // Yeni state'ler
  const [isCompany, setIsCompany] = useState(false);
  const [isDifferentBillingAddress, setIsDifferentBillingAddress] = useState(false);
  
  // Fatura adresi için ayrı state'ler
  const [billingSelectedCity, setBillingSelectedCity] = useState<string>('');
  const [billingSelectedDistrict, setBillingSelectedDistrict] = useState<string>('');
  const [billingSelectedTown, setBillingSelectedTown] = useState<string>('');
  
  const [formData, setFormData] = useState({
    // Kişisel Bilgiler
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Kurumsal Bilgiler
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    
    // Teslimat Adresi
    shippingAddressLine1: '',
    shippingAddressLine2: '',
    shippingPostalCode: '',
    
    // Fatura Adresi
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingPostalCode: '',
    billingCompanyName: '',
    billingTaxNumber: '',
    billingTaxOffice: '',
    
    // Ödeme Bilgileri
    kartNumarasi: '',
    kartSahibi: '',
    sonKullanma: '',
    cvv: '',
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const total = subtotal + shipping;

  // Ödeme sonucunu kontrol et
  useEffect(() => {
    const paymentResult = siPayService.parsePaymentResult();
    if (paymentResult) {
      console.log('Ödeme sonucu:', paymentResult);
      setPaymentResult(paymentResult);
      
      if (paymentResult.payment === 'success') {
        setActiveStep('onay');
        setOrderData({
          success: true,
          orderId: paymentResult.order_id,
          invoiceId: paymentResult.invoice_id,
          orderSummary: {
            subtotal,
            shipping,
            total,
            items: [...items]
          }
        });
        // URL'i temizle
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentResult.payment === 'failed') {
        setOrderError('Ödeme başarısız oldu. Lütfen tekrar deneyin.');
      }
    }
  }, [items, subtotal, shipping, total]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Kart numarası formatla (4'lü gruplar halinde)
    if (name === 'kartNumarasi') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }
    
    // Son kullanma tarihi formatla (MM/YY)
    if (name === 'sonKullanma') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    }
    
    // CVV sadece rakam
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) formattedValue = formattedValue.slice(0, 4);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleNextStep = async () => {
    if (activeStep === 'bilgiler') {
      setActiveStep('odeme');
    } else if (activeStep === 'odeme') {
      // SiPay ödeme işlemini başlat (2D veya 3D)
      setIsProcessingPayment(true);
      setOrderError(null);
      
      try {
        // Şehir, ilçe, mahalle isimlerini al
        const { cityName: selectedCityName, districtName: selectedDistrictName, townName: selectedTownName } = getSelectedNames();
        const { cityName: billingCityName, districtName: billingDistrictName, townName: billingTownName } = getSelectedNames();

        // Kart son kullanma tarihini ayır
        const [expiry_month, expiry_year] = formData.sonKullanma.split('/');
        
        // Sepet ürünlerini JSON string'e dönüştür
        const itemsJson = JSON.stringify(items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })));

        // Callback URL'lerini oluştur
        const { return_url, cancel_url } = siPayService.createCallbackUrls();

        // SiPay ödeme verilerini hazırla
        const paymentData: SiPayPaymentData = {
          // Kart bilgileri
          cc_holder_name: formData.kartSahibi,
          cc_no: formData.kartNumarasi.replace(/\s/g, ''), // Boşlukları kaldır
          expiry_month: expiry_month.padStart(2, '0'),
          expiry_year: '20' + expiry_year, // 26 -> 2026
          cvv: formData.cvv,
          
          // Ödeme bilgileri
          total: total,
          currency_code: 'TRY',
          installments_number: 1,
          invoice_id: `CAL${Date.now()}`, // Benzersiz sipariş numarası
          invoice_description: `CalFormat Sipariş - ${items.length} ürün`,
          
          // Müşteri bilgileri
          name: formData.firstName,
          surname: formData.lastName,
          
          // Sepet ürünleri
          items: itemsJson,
          
          // URL'ler
          return_url,
          cancel_url,
          
          // Fatura adresi
          bill_address1: isDifferentBillingAddress ? formData.billingAddressLine1 : formData.shippingAddressLine1,
          bill_address2: isDifferentBillingAddress ? formData.billingAddressLine2 : formData.shippingAddressLine2,
          bill_city: billingCityName,
          bill_postcode: isDifferentBillingAddress ? formData.billingPostalCode : formData.shippingPostalCode,
          bill_state: billingDistrictName,
          bill_country: 'Türkiye',
          bill_email: formData.email,
          bill_phone: formData.phone,
          
          // İşlem tipi
          transaction_type: 'Auth', // Direkt ödeme
          
          // IP adresi
          ip: await siPayService.getClientIP()
        };

        console.log(`SiPay ${paymentMethod.toUpperCase()} ödeme başlatılıyor...`, paymentData);
        
        if (paymentMethod === '2d') {
          // 2D (Non-Secure) Ödeme - Direkt işlem
          const result = await siPayService.makePayment2D(paymentData);
          
          if (result.success && result.data) {
            if (result.data.payment_status === 1) {
              // Ödeme başarılı - Ikas API'sine sipariş oluştur
              console.log('✅ 2D Ödeme başarılı:', result.data);
              console.log('📦 Ikas API\'sine sipariş oluşturuluyor...');
              
              try {
                // Sipariş verilerini hazırla
                const orderData = {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  companyName: formData.companyName,
                  taxNumber: formData.taxNumber,
                  taxOffice: formData.taxOffice,
                  
                  // Teslimat Adresi
                  shippingAddress: formData.shippingAddressLine1 + (formData.shippingAddressLine2 ? ' ' + formData.shippingAddressLine2 : ''),
                  shippingAddressLine2: formData.shippingAddressLine2,
                  shippingCity: selectedCityName,
                  shippingDistrict: selectedDistrictName,
                  shippingTown: selectedTownName,
                  shippingPostalCode: formData.shippingPostalCode,
                  shippingCityId: selectedCity,
                  shippingDistrictId: selectedDistrict,
                  shippingTownId: selectedTown,
                  
                  // Fatura Adresi
                  billingAddress: isDifferentBillingAddress ? 
                    formData.billingAddressLine1 + (formData.billingAddressLine2 ? ' ' + formData.billingAddressLine2 : '') :
                    formData.shippingAddressLine1 + (formData.shippingAddressLine2 ? ' ' + formData.shippingAddressLine2 : ''),
                  billingAddressLine2: isDifferentBillingAddress ? formData.billingAddressLine2 : formData.shippingAddressLine2,
                  billingCity: isDifferentBillingAddress ? billingCityName : selectedCityName,
                  billingDistrict: isDifferentBillingAddress ? billingDistrictName : selectedDistrictName,
                  billingTown: isDifferentBillingAddress ? billingTownName : selectedTownName,
                  billingPostalCode: isDifferentBillingAddress ? formData.billingPostalCode : formData.shippingPostalCode,
                  billingCityId: isDifferentBillingAddress ? billingSelectedCity : selectedCity,
                  billingDistrictId: isDifferentBillingAddress ? billingSelectedDistrict : selectedDistrict,
                  billingTownId: isDifferentBillingAddress ? billingSelectedTown : selectedTown,
                  
                  isCompany,
                  isDifferentBillingAddress
                };
                
                console.log('📦 Sipariş verisi hazırlandı:', orderData);
                const orderPayload = await createOrder(orderData);
                
                if (orderPayload.success) {
                  console.log('✅ Ikas siparişi başarıyla oluşturuldu:', orderPayload.data);
                  
                  setActiveStep('onay');
                  setOrderData({
                    success: true,
                    orderId: result.data.order_id,
                    invoiceId: result.data.invoice_id,
                    ikasOrderId: orderPayload.data?.orderId,
                    paymentMethod: '2D',
                    transactionType: result.data.transaction_type,
                    orderSummary: {
                      subtotal,
                      shipping,
                      total,
                      items: [...items]
                    }
                  });
                  
                  // Sepeti temizle
                  clearCart();
                  
                  // Pre-Auth ise kullanıcıya bilgi ver
                  if (result.data.transaction_type === 'PreAuth') {
                    console.log('ℹ️ Pre-Auth ödeme - manuel onay gerekli');
                  }
                } else {
                  console.error('❌ Ikas sipariş oluşturma hatası:', orderPayload.message);
                  throw new Error('Ödeme başarılı ancak sipariş oluşturulamadı: ' + orderPayload.message);
                }
              } catch (ikasError) {
                console.error('❌ Ikas sipariş oluşturma hatası:', ikasError);
                
                // Ödeme başarılı ama sipariş oluşturulamadı - kullanıcıya bilgi ver
                setActiveStep('onay');
                setOrderData({
                  success: true,
                  orderId: result.data.order_id,
                  invoiceId: result.data.invoice_id,
                  paymentMethod: '2D',
                  transactionType: result.data.transaction_type,
                  warning: 'Ödemeniz başarılı ancak sipariş kaydında sorun yaşandı. Lütfen müşteri hizmetleri ile iletişime geçin.',
                  orderSummary: {
                    subtotal,
                    shipping,
                    total,
                    items: [...items]
                  }
                });
              }
            } else {
              // Ödeme başarısız
              throw new Error(result.data.status_description || '2D ödeme başarısız');
            }
          } else {
            throw new Error(result.error || '2D ödeme işlemi başarısız');
          }
        } else {
          // 3D Secure Ödeme - Form yönlendirmeli
          
          // Checkout verilerini localStorage'a kaydet (3D callback için)
          const checkoutData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            companyName: formData.companyName,
            taxNumber: formData.taxNumber,
            taxOffice: formData.taxOffice,
            shippingAddress: formData.shippingAddressLine1 + (formData.shippingAddressLine2 ? ' ' + formData.shippingAddressLine2 : ''),
            shippingAddressLine2: formData.shippingAddressLine2,
            shippingCity: selectedCityName,
            shippingDistrict: selectedDistrictName,
            shippingTown: selectedTownName,
            shippingPostalCode: formData.shippingPostalCode,
            shippingCityId: selectedCity,
            shippingDistrictId: selectedDistrict,
            shippingTownId: selectedTown,
            billingAddress: isDifferentBillingAddress ? 
              formData.billingAddressLine1 + (formData.billingAddressLine2 ? ' ' + formData.billingAddressLine2 : '') :
              formData.shippingAddressLine1 + (formData.shippingAddressLine2 ? ' ' + formData.shippingAddressLine2 : ''),
            billingAddressLine2: isDifferentBillingAddress ? formData.billingAddressLine2 : formData.shippingAddressLine2,
            billingCity: isDifferentBillingAddress ? billingCityName : selectedCityName,
            billingDistrict: isDifferentBillingAddress ? billingDistrictName : selectedDistrictName,
            billingTown: isDifferentBillingAddress ? billingTownName : selectedTownName,
            billingPostalCode: isDifferentBillingAddress ? formData.billingPostalCode : formData.shippingPostalCode,
            billingCityId: isDifferentBillingAddress ? billingSelectedCity : selectedCity,
            billingDistrictId: isDifferentBillingAddress ? billingSelectedDistrict : selectedDistrict,
            billingTownId: isDifferentBillingAddress ? billingSelectedTown : selectedTown,
            isCompany,
            isDifferentBillingAddress
          };
          
          localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
          console.log('💾 Checkout verileri localStorage\'a kaydedildi');
          
          const result = await siPayService.preparePayment(paymentData);
          
          if (result.success && result.form_data && result.payment_url) {
            console.log('SiPay 3D formu hazırlandı, yönlendiriliyor...');
            // SiPay 3D formunu submit et (async)
            await siPayService.submitPaymentForm(result.form_data, result.payment_url);
          } else {
            throw new Error(result.message || '3D ödeme formu hazırlanamadı');
          }
        }
        
      } catch (error) {
        console.error('SiPay ödeme hatası:', error);
        setOrderError(error instanceof Error ? error.message : 'Ödeme işlemi başlatılamadı');
        setIsProcessingPayment(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep === 'odeme') setActiveStep('bilgiler');
    else if (activeStep === 'onay') setActiveStep('odeme');
  };

  const isFormValid = () => {
    if (activeStep === 'bilgiler') {
      // Temel bilgiler
      const basicValid = formData.firstName && formData.lastName && formData.email && formData.phone && 
                         formData.shippingAddressLine1 && selectedCity && selectedDistrict && formData.shippingPostalCode;
      
      // Kurumsal bilgiler kontrolü
      const companyValid = !isCompany || (formData.companyName && formData.taxNumber && formData.taxOffice);
      
      // Farklı fatura adresi kontrolü
      const billingValid = !isDifferentBillingAddress || 
                          (formData.billingAddressLine1 && billingSelectedCity && billingSelectedDistrict && formData.billingPostalCode);
      
      return basicValid && companyValid && billingValid;
    } else if (activeStep === 'odeme') {
      // Kart bilgileri kontrolü
      const cardValid = formData.kartNumarasi && formData.kartSahibi && formData.sonKullanma && formData.cvv;
      
      // Kart numarası format kontrolü (en az 13 karakter)
      const cardNumberValid = formData.kartNumarasi.replace(/\s/g, '').length >= 13;
      
      // Son kullanma tarihi format kontrolü (MM/YY)
      const expiryValid = /^\d{2}\/\d{2}$/.test(formData.sonKullanma);
      
      // CVV kontrolü (3-4 haneli)
      const cvvValid = /^\d{3,4}$/.test(formData.cvv);
      
      return cardValid && cardNumberValid && expiryValid && cvvValid;
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
                  <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-orange-100">Müşteri Tipi</h2>
                  
                  {/* Müşteri Tipi Seçimi */}
                  <div className="mb-8">
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          checked={!isCompany}
                          onChange={() => setIsCompany(false)}
                          className="w-4 h-4 text-[#ee7f1a] border-gray-300 focus:ring-[#ee7f1a]"
                        />
                        <span className="ml-2 text-gray-700">Bireysel Müşteri</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          checked={isCompany}
                          onChange={() => setIsCompany(true)}
                          className="w-4 h-4 text-[#ee7f1a] border-gray-300 focus:ring-[#ee7f1a]"
                        />
                        <span className="ml-2 text-gray-700">Kurumsal Müşteri</span>
                      </label>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-orange-100">
                    {isCompany ? 'Kurumsal Bilgiler' : 'Kişisel Bilgiler'}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          id="firstName" 
                          name="firstName" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="Adınız"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        name="lastName" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="Soyadınız"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="ornek@mail.com"
                          required
                        />
                        <Mail className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="05XX XXX XX XX"
                          required
                        />
                        <Phone className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Kurumsal Bilgiler */}
                  {isCompany && (
                    <>
                      <h3 className="text-lg font-medium mb-4 mt-8">Kurumsal Bilgiler</h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı *</label>
                          <input 
                            type="text" 
                            id="companyName" 
                            name="companyName" 
                            value={formData.companyName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                            placeholder="Şirket Adı"
                            required={isCompany}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-2">Vergi Numarası *</label>
                            <input 
                              type="text" 
                              id="taxNumber" 
                              name="taxNumber" 
                              value={formData.taxNumber}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                              placeholder="Vergi Numarası"
                              required={isCompany}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="taxOffice" className="block text-sm font-medium text-gray-700 mb-2">Vergi Dairesi *</label>
                            <input 
                              type="text" 
                              id="taxOffice" 
                              name="taxOffice" 
                              value={formData.taxOffice}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                              placeholder="Vergi Dairesi"
                              required={isCompany}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <h2 className="text-xl font-semibold mb-6 mt-10 pb-4 border-b border-orange-100">Teslimat Adresi</h2>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="shippingAddressLine1" className="block text-sm font-medium text-gray-700 mb-2">Adres Satır 1 *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          id="shippingAddressLine1" 
                          name="shippingAddressLine1" 
                          value={formData.shippingAddressLine1}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="Sokak, Bina No"
                          required
                        />
                        <MapPin className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="shippingAddressLine2" className="block text-sm font-medium text-gray-700 mb-2">Adres Satır 2</label>
                      <input 
                        type="text" 
                        id="shippingAddressLine2" 
                        name="shippingAddressLine2" 
                        value={formData.shippingAddressLine2}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="Daire No, Kat (Opsiyonel)"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="shippingPostalCode" className="block text-sm font-medium text-gray-700 mb-2">Posta Kodu *</label>
                      <input 
                        type="text" 
                        id="shippingPostalCode" 
                        name="shippingPostalCode" 
                        value={formData.shippingPostalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="34000"
                        required
                      />
                    </div>
                    
                    <h3 className="text-lg font-medium mb-4 mt-6">Konum Bilgileri</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
                        <div className="relative">
                          <select 
                            id="city"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                            disabled={loading.cities}
                            required
                          >
                            <option value="">Şehir Seçiniz</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                          {loading.cities && <Loader2 className="absolute right-8 top-3 text-gray-400 w-5 h-5 animate-spin" />}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">İlçe *</label>
                        <div className="relative">
                          <select 
                            id="district"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                            disabled={!selectedCity || loading.districts}
                            required
                          >
                            <option value="">İlçe Seçiniz</option>
                            {districts.map(district => (
                              <option key={district.id} value={district.id}>{district.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                          {loading.districts && <Loader2 className="absolute right-8 top-3 text-gray-400 w-5 h-5 animate-spin" />}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">Mahalle</label>
                        <div className="relative">
                          <select 
                            id="town"
                            value={selectedTown}
                            onChange={(e) => setSelectedTown(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                            disabled={!selectedDistrict || loading.towns}
                          >
                            <option value="">Mahalle Seçiniz (Opsiyonel)</option>
                            {towns.map(town => (
                              <option key={town.id} value={town.id}>{town.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                          {loading.towns && <Loader2 className="absolute right-8 top-3 text-gray-400 w-5 h-5 animate-spin" />}
                        </div>
                      </div>
                    </div>
                    
                    {/* Fatura Adresi Seçeneği */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDifferentBillingAddress}
                          onChange={(e) => setIsDifferentBillingAddress(e.target.checked)}
                          className="w-4 h-4 text-[#ee7f1a] border-gray-300 rounded focus:ring-[#ee7f1a]"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Fatura adresim farklı</span>
                      </label>
                    </div>
                    
                    {/* Fatura Adresi Alanları */}
                    {isDifferentBillingAddress && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Fatura Adresi</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <label htmlFor="billingAddressLine1" className="block text-sm font-medium text-gray-700 mb-2">Fatura Adres Satır 1 *</label>
                            <input 
                              type="text" 
                              id="billingAddressLine1" 
                              name="billingAddressLine1" 
                              value={formData.billingAddressLine1}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                              placeholder="Fatura Adresi - Sokak, Bina No"
                              required={isDifferentBillingAddress}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="billingAddressLine2" className="block text-sm font-medium text-gray-700 mb-2">Fatura Adres Satır 2</label>
                            <input 
                              type="text" 
                              id="billingAddressLine2" 
                              name="billingAddressLine2" 
                              value={formData.billingAddressLine2}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                              placeholder="Daire No, Kat (Opsiyonel)"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div>
                              <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-2">Fatura Şehir *</label>
                              <div className="relative">
                                <select 
                                  id="billingCity"
                                  value={billingSelectedCity}
                                  onChange={(e) => setBillingSelectedCity(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                                  required={isDifferentBillingAddress}
                                >
                                  <option value="">Şehir Seçiniz</option>
                                  {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="billingDistrict" className="block text-sm font-medium text-gray-700 mb-2">Fatura İlçe *</label>
                              <div className="relative">
                                <select 
                                  id="billingDistrict"
                                  value={billingSelectedDistrict}
                                  onChange={(e) => setBillingSelectedDistrict(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                                  disabled={!billingSelectedCity}
                                  required={isDifferentBillingAddress}
                                >
                                  <option value="">İlçe Seçiniz</option>
                                  {districts.map(district => (
                                    <option key={district.id} value={district.id}>{district.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="billingTown" className="block text-sm font-medium text-gray-700 mb-2">Fatura Mahalle</label>
                              <div className="relative">
                                <select 
                                  id="billingTown"
                                  value={billingSelectedTown}
                                  onChange={(e) => setBillingSelectedTown(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200 appearance-none bg-white"
                                  disabled={!billingSelectedDistrict}
                                >
                                  <option value="">Mahalle Seçiniz</option>
                                  {towns.map(town => (
                                    <option key={town.id} value={town.id}>{town.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-2">Fatura Posta Kodu *</label>
                              <input 
                                type="text" 
                                id="billingPostalCode" 
                                name="billingPostalCode" 
                                value={formData.billingPostalCode}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                                placeholder="34000"
                                required={isDifferentBillingAddress}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                  
                  {/* Ödeme Yöntemi Seçimi */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Ödeme Yöntemi</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 2D Ödeme (Varsayılan) */}
                      <div 
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          paymentMethod === '2d' 
                            ? 'border-[#ee7f1a] bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('2d')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 border-2 rounded-full ${
                              paymentMethod === '2d' 
                                ? 'border-[#ee7f1a] bg-[#ee7f1a]' 
                                : 'border-gray-300'
                            }`}>
                              {paymentMethod === '2d' && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Hızlı Ödeme</p>
                              <p className="text-sm text-gray-600">Doğrudan kart ile ödeme</p>
                            </div>
                          </div>
                          <div className="text-green-600 text-sm font-medium">Önerilen</div>
                        </div>
                      </div>
                      
                      {/* 3D Secure Ödeme */}
                      <div 
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          paymentMethod === '3d' 
                            ? 'border-[#ee7f1a] bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('3d')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 border-2 rounded-full ${
                              paymentMethod === '3d' 
                                ? 'border-[#ee7f1a] bg-[#ee7f1a]' 
                                : 'border-gray-300'
                            }`}>
                              {paymentMethod === '3d' && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">3D Secure Ödeme</p>
                              <p className="text-sm text-gray-600">Ekstra güvenlik ile ödeme</p>
                            </div>
                          </div>
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-100/50 to-yellow-100/50 p-5 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-white p-2 rounded-full">
                        <CreditCard className="w-5 h-5 text-[#ee7f1a]" />
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">
                          {paymentMethod === '3d' ? 'Güvenli 3D Ödeme' : 'Hızlı Güvenli Ödeme'}
                        </p>
                        <p className="text-sm text-gray-600">SiPay güvenli ödeme sistemi ile korunuyorsunuz</p>
                      </div>
                    </div>
                    
                    {/* Test kartı bilgileri */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-2">Test Kartı Bilgileri:</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p><strong>Kart No:</strong> 4508 0345 0803 4509 (Visa) veya 5406 6754 0667 5403 (MasterCard)</p>
                        <p><strong>Son Kullanma:</strong> 12/26</p>
                        <p><strong>CVV:</strong> 000</p>
                        {paymentMethod === '3d' && <p><strong>3D Şifre:</strong> a</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="kartNumarasi" className="block text-sm font-medium text-gray-700 mb-2">Kart Numarası *</label>
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
                          required
                        />
                        <div className="absolute right-3 top-3 flex gap-1">
                          <div className="text-xs text-gray-500">VISA/MC</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="kartSahibi" className="block text-sm font-medium text-gray-700 mb-2">Kart Üzerindeki İsim *</label>
                      <input 
                        type="text" 
                        id="kartSahibi" 
                        name="kartSahibi" 
                        value={formData.kartSahibi}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                        placeholder="Ad Soyad"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sonKullanma" className="block text-sm font-medium text-gray-700 mb-2">Son Kullanma Tarihi *</label>
                        <input 
                          type="text" 
                          id="sonKullanma" 
                          name="sonKullanma" 
                          value={formData.sonKullanma}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="12/26"
                          maxLength={5}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
                        <input 
                          type="text" 
                          id="cvv" 
                          name="cvv" 
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none transition-all duration-200" 
                          placeholder="000"
                          maxLength={4}
                          required
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
                      disabled={!isFormValid() || isProcessingPayment}
                      className={`px-8 py-3 rounded-full font-medium text-white flex items-center gap-2 ${isFormValid() && !isProcessingPayment ? 'bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] hover:shadow-lg transform hover:scale-105 transition-all duration-300' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Ödeme Hazırlanıyor...
                        </>
                      ) : (
                        <>
                          Güvenli Ödeme Yap
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Test Butonu - Geliştirme amaçlı */}
                  {window.location.hostname === 'localhost' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Test Alanı</h4>
                      <button
                        onClick={async () => {
                          console.log('🧪 SiPay token test başlatılıyor...');
                          const tokenResult = await siPayService.getToken();
                          console.log('🧪 Token test sonucu:', tokenResult);
                          if (tokenResult.success) {
                            alert('Token başarıyla alındı! Console\'u kontrol edin.');
                          } else {
                            alert('Token alma hatası: ' + tokenResult.error);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        SiPay Token Test
                      </button>
                    </div>
                  )}
                  
                  {/* Hata mesajı */}
                  {orderError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-600 text-sm">{orderError}</p>
                    </div>
                  )}
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
                        <span className="font-medium">
                          {paymentResult?.invoice_id || orderData?.invoiceId || 
                            `#CAL${Math.floor(Math.random() * 100000)}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Tarih:</span>
                        <span className="font-medium">{new Date().toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">Ödeme Durumu:</span>
                        <span className="font-medium text-green-600">
                          {paymentResult?.payment === 'success' ? 'Başarılı' : 'Onaylandı'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Toplam:</span>
                        <span className="font-medium text-[#ee7f1a]">
                          ₺{(orderData?.orderSummary?.total || total).toFixed(2)}
                        </span>
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
                  {(activeStep === 'onay' && orderData?.orderSummary ? orderData.orderSummary.items : items).map((item: any) => (
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
                  <span>₺{(activeStep === 'onay' && orderData?.orderSummary ? orderData.orderSummary.subtotal : subtotal).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Kargo</span>
                  <span>
                    {(activeStep === 'onay' && orderData?.orderSummary ? orderData.orderSummary.shipping : shipping) === 0 ? 
                      "Ücretsiz" : 
                      `₺${(activeStep === 'onay' && orderData?.orderSummary ? orderData.orderSummary.shipping : shipping).toFixed(2)}`
                    }
                  </span>
                </div>
                
                <div className="border-t border-dashed border-orange-100 pt-4 mt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Toplam</span>
                    <span className="text-[#ee7f1a]">₺{(activeStep === 'onay' && orderData?.orderSummary ? orderData.orderSummary.total : total).toFixed(2)}</span>
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