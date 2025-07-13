import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Check, User, MapPin, Loader2, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAddress } from '../../hooks/useAddress';
import sipayService, { SiPayPaymentData } from '../../services/siPayService';
import configService from '../../services/configService';

const Checkout: React.FC = () => {
  const { items, clearCart, createOrder } = useCart();
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
    getSelectedNames,
    getSelectedAddressInfo
  } = useAddress();
  
  const [activeStep, setActiveStep] = useState<'bilgiler' | 'odeme' | 'onay'>('bilgiler');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isCompany, setIsCompany] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState(0.0);
  const [shippingThreshold, setShippingThreshold] = useState(0.0);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    addressLine2: '',
    notes: '',
    kvkkConsent: false,
    salesAgreementConsent: false,
  });

  const [cardData, setCardData] = useState({
    cardNumber: '', // Production - Boş kart bilgileri
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '', // Production - Gerçek CVV girilecek
    installments: 1
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > shippingThreshold ? 0 : shippingCost;
  const total = subtotal + shipping;

  // Taksit seçeneklerini yükle
  useEffect(() => {
    const options = sipayService.getInstallmentOptions(total);
    setInstallmentOptions(options);
  }, [total]);

  // Kargo ayarlarını yükle
  useEffect(() => {
    const loadShippingConfig = async () => {
      try {
        const config = await configService.getShippingConfig();
        setShippingCost(config.default_shipping_cost);
        setShippingThreshold(config.free_shipping_threshold);
      } catch (error) {
        console.error('Kargo ayarları yüklenemedi:', error);
        // Varsayılan değerler zaten set
      }
    };

    loadShippingConfig();
  }, []);

  // URL parametrelerini kontrol et (Sipay dönüş)
  useEffect(() => {
    const checkPaymentResult = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const invoiceId = urlParams.get('invoice_id');
      const orderNo = urlParams.get('order_no');
      
      // Sipay parametreleri (3D dönüş)
      const sipayStatus = urlParams.get('sipay_status');
      const hashBypass = urlParams.get('hash_bypass');
      
      console.log('🔍 URL Parametreleri:', {
        status,
        invoiceId,
        orderNo,
        sipayStatus,
        hashBypass,
        allParams: Object.fromEntries(urlParams.entries())
      });

      // 3D ödeme başarılı dönüş (farklı kombinasyonları destekle)
      if (
        (status === 'success' && invoiceId) ||
        (sipayStatus === '1' && invoiceId) ||
        (status === 'success' && sipayStatus === '1' && invoiceId) ||
        (hashBypass === '1' && sipayStatus === '1' && invoiceId)
      ) {
        console.log('✅ 3D ödeme başarılı tespit edildi!', { 
          status, 
          sipayStatus, 
          invoiceId, 
          orderNo,
          hashBypass: hashBypass === '1' ? 'Hash validation bypassed' : 'Normal validation'
        });
        
        // localStorage'dan form verilerini oku
        const savedData = localStorage.getItem('checkout_form_data');
        if (savedData) {
          console.log('💾 3D ödeme sonrası localStorage\'dan veri okunuyor...');
          
          let parsedData: any;
          try {
            parsedData = JSON.parse(savedData);
            console.log('📋 localStorage\'dan okunan veri:', parsedData);
            
            const { 
              formData: savedFormData, 
              selectedNames: savedSelectedNames, 
              isCompany: savedIsCompany, 
              selectedCity: savedSelectedCity, 
              selectedDistrict: savedSelectedDistrict, 
              selectedTown: savedSelectedTown,
              addressInfo: savedAddressInfo, // Kaydedilen adres bilgilerini al
              cartItems: savedCartItems,
              subtotal: savedSubtotal,
              shipping: savedShipping,
              total: savedTotal,
              invoiceId: savedInvoiceId,
              timestamp: savedTimestamp
            } = parsedData;
            
            // Sipariş oluşturma API'sini çağır
            console.log('📦 3D ödeme sonrası sipariş oluşturuluyor...');
            console.log('💾 localStorage veriler:', { 
              savedCartItems, 
              savedSubtotal, 
              savedShipping, 
              savedTotal,
              savedInvoiceId,
              savedTimestamp,
              savedAddressInfo
            });
            
            // ✅ GELİŞTİRİLMİŞ ADRES VALİDASYONU
            if (!savedSelectedCity || !savedSelectedDistrict) {
              throw new Error('Adres bilgileri eksik');
            }
            
            // Adres bilgilerini al - önce savedAddressInfo'yu kontrol et
            let finalAddressInfo;
            if (savedAddressInfo && savedAddressInfo.city && savedAddressInfo.district) {
              finalAddressInfo = savedAddressInfo;
            } else {
              // Fallback: getSelectedAddressInfo kullan
              setSelectedCity(savedSelectedCity);
              setSelectedDistrict(savedSelectedDistrict);
              if (savedSelectedTown) setSelectedTown(savedSelectedTown);
              finalAddressInfo = getSelectedAddressInfo();
            }
            
            // Form verilerini de state'e geri yükle
            setFormData(savedFormData);
            setIsCompany(savedIsCompany);

            const orderPayload = {
              firstName: savedFormData.firstName,
              lastName: savedFormData.lastName,
              email: savedFormData.email,
              phone: savedFormData.phone,
              shippingAddress: savedFormData.address,
              shippingAddressLine2: savedFormData.addressLine2 || '',
              shippingCity: finalAddressInfo.city.name,
              shippingDistrict: finalAddressInfo.district.name,
              shippingTown: finalAddressInfo.town.name || '',
              shippingPostalCode: '34000',
              shippingCityId: finalAddressInfo.city.id,
              shippingDistrictId: finalAddressInfo.district.id,
              shippingTownId: finalAddressInfo.town.id || '',
              billingAddress: savedFormData.address,
              billingAddressLine2: savedFormData.addressLine2 || '',
              billingCity: finalAddressInfo.city.name,
              billingDistrict: finalAddressInfo.district.name,
              billingPostalCode: '34000',
              billingCityId: finalAddressInfo.city.id,
              billingDistrictId: finalAddressInfo.district.id,
              isCompany: savedIsCompany,
              companyName: savedIsCompany ? savedFormData.companyName : '',
              taxNumber: savedIsCompany ? savedFormData.taxNumber : '',
              taxOffice: savedIsCompany ? savedFormData.taxOffice : '',
              isDifferentBillingAddress: false
            };
            
            console.log('📋 Sipariş payload:', orderPayload);
            
            const orderResult = await createOrder(orderPayload);
            console.log('✅ 3D ödeme sonrası sipariş başarıyla oluşturuldu:', orderResult);
            
            setOrderData({
              success: true,
              orderId: orderResult.orderId || orderNo || invoiceId || savedInvoiceId,
              orderNumber: orderResult.orderNumber || `#${orderNo || invoiceId || savedInvoiceId}`,
              invoiceId: invoiceId || savedInvoiceId,
              orderSummary: {
                items: savedCartItems || items,
                subtotal: savedSubtotal || subtotal,
                shipping: savedShipping || shipping,
                total: savedTotal || total
              }
            });
            
            // localStorage'ı temizle
            localStorage.removeItem('checkout_form_data');
            
          } catch (orderError) {
            console.error('❌ 3D ödeme sonrası sipariş oluşturma hatası:', orderError);
            
            // Yine localStorage'dan değerleri oku çünkü catch bloğunda da bunlara ihtiyacımız var
            const { 
              cartItems: savedCartItems,
              subtotal: savedSubtotal,
              shipping: savedShipping,
              total: savedTotal,
              invoiceId: savedInvoiceId
            } = parsedData;
            
            setOrderData({
              success: true,
              orderId: orderNo || invoiceId || savedInvoiceId,
              orderNumber: `#${orderNo || invoiceId || savedInvoiceId}`,
              invoiceId: invoiceId || savedInvoiceId,
              orderSummary: {
                items: savedCartItems || items,
                subtotal: savedSubtotal || subtotal,
                shipping: savedShipping || shipping,
                total: savedTotal || total
              },
              orderError: 'Ödeme başarılı ancak sipariş kaydedilemedi. Lütfen müşteri hizmetleri ile iletişime geçin.'
            });
            
            // localStorage'ı temizle
            localStorage.removeItem('checkout_form_data');
          }
        } else {
          // Fallback: Form verisi yoksa basit sipariş kaydı
          console.warn('⚠️ 3D ödeme sonrası localStorage\'da form verisi bulunamadı!');
          
          setOrderData({
            success: true,
            orderId: orderNo || invoiceId,
            orderNumber: `#${orderNo || invoiceId}`,
            invoiceId: invoiceId,
            orderSummary: {
              items: items,
              subtotal: subtotal,
              shipping: shipping,
              total: total
            },
            orderError: 'Ödeme başarılı ancak sipariş bilgileri eksik. Lütfen müşteri hizmetleri ile iletişime geçin.'
          });
        }
        
        setActiveStep('onay');
        clearCart();
        
        // URL'yi temizle
        window.history.replaceState({}, '', '/checkout');
      } 
      // 3D ödeme başarısız dönüş (farklı kombinasyonları destekle)
      else if (
        (status === 'failed' && invoiceId) ||
        (status === 'cancel' && invoiceId) ||
        (sipayStatus === '0' && invoiceId) ||
        (status === 'failed' && sipayStatus === '0' && invoiceId)
      ) {
        console.log('❌ 3D ödeme başarısız tespit edildi!', { status, sipayStatus, invoiceId, orderNo });
        
        setOrderError('3D güvenli ödeme işlemi başarısız oldu veya iptal edildi. Lütfen tekrar deneyin.');
        setActiveStep('odeme');
        
        // localStorage'ı temizle
        localStorage.removeItem('checkout_form_data');
        
        // URL'yi temizle
        window.history.replaceState({}, '', '/checkout');
      }
      
      // Hiçbir 3D ödeme sonucu yoksa normal akışa devam et
      else if (status || sipayStatus) {
        console.log('⚠️ Bilinmeyen 3D ödeme durumu:', { status, sipayStatus, invoiceId, orderNo });
        
        // URL'yi temizle
        window.history.replaceState({}, '', '/checkout');
      }
    };

    checkPaymentResult();
  }, [items, subtotal, shipping, total, clearCart, createOrder, getSelectedAddressInfo]);

  const validateStep = (step: 'bilgiler' | 'odeme' | 'onay') => {
    if (step === 'bilgiler') {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address'];
      const fieldLabels: Record<string, string> = {
        firstName: 'Ad',
        lastName: 'Soyad',
        email: 'E-posta',
        phone: 'Telefon',
        address: 'Adres'
      };
      
      const missing = required.filter(field => !formData[field as keyof typeof formData]);
      
      if (missing.length > 0) {
        const missingLabels = missing.map(field => fieldLabels[field] || field);
        setOrderError(`Lütfen şu alanları doldurun: ${missingLabels.join(', ')}`);
        return false;
      }
      
      // ✅ GELİŞTİRİLMİŞ ADRES VALİDASYONU
      if (!selectedCity || !selectedDistrict) {
        setOrderError('Lütfen il ve ilçe seçimi yapın. Adres bilgileri olmadan sipariş oluşturulamaz.');
        return false;
      }

      // ✅ DAHA ESNEK İKAS ID FORMAT KONTROLÜ
      const isValidIkasId = (id: string) => {
        return id && id.trim() !== '' && (
          // UUID formatı (standart)
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
          // İkas özel UUID formatı (fb ile başlayan)
          /^fb[0-9a-f]{6}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
          // Sayısal ID formatı
          /^\d+$/.test(id) ||
          // Tire ile ayrılmış ID formatı (34-020 gibi)
          /^\d+-\d+$/.test(id) ||
          // Alphanumeric ID formatı
          /^[a-zA-Z0-9-_]+$/.test(id)
        );
      };

      if (!isValidIkasId(selectedCity)) {
        console.warn('⚠️ Form validation - Şehir ID formatı:', selectedCity);
        // ID formatı geçersiz olsa bile devam et, backend'de fallback var
      }

      if (!isValidIkasId(selectedDistrict)) {
        console.warn('⚠️ Form validation - İlçe ID formatı:', selectedDistrict);
        // ID formatı geçersiz olsa bile devam et, backend'de fallback var
      }

      // ✅ ADRES İSİMLERİNİ KONTROL ET
      const addressInfo = getSelectedAddressInfo();
      if (!addressInfo.city.name || !addressInfo.district.name) {
        setOrderError('İl ve ilçe adları zorunludur. Lütfen seçimlerinizi kontrol edin.');
        return false;
      }
      
      if (!formData.kvkkConsent || !formData.salesAgreementConsent) {
        setOrderError('Lütfen sözleşme onaylarını verin');
        return false;
      }

      // ✅ DEBUG LOGLARI
      console.log('📍 Form Validation Adres Bilgileri:', {
        selectedCity,
        selectedDistrict,
        addressInfo,
        cityName: addressInfo.city.name,
        districtName: addressInfo.district.name
      });
      
      return true;
    }

    if (step === 'odeme') {
      // Kart validasyonları
      if (!cardData.cardNumber || !sipayService.validateCardNumber(cardData.cardNumber)) {
        setOrderError('Lütfen geçerli bir kart numarası girin (16 haneli, boşluksuz)');
        return false;
      }

      if (!cardData.cardHolder.trim()) {
        setOrderError('Lütfen kart üzerindeki ismi tam olarak yazın');
        return false;
      }

      if (!cardData.expiryMonth || !cardData.expiryYear) {
        setOrderError('Lütfen kartın son kullanma tarihini seçin');
        return false;
      }

      if (!sipayService.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
        setOrderError('Kartınızın son kullanma tarihi geçmiş veya geçersiz');
        return false;
      }

      if (!cardData.cvv || (cardData.cvv.length !== 3 && cardData.cvv.length !== 4)) {
        setOrderError('Lütfen kartın arkasındaki 3 veya 4 haneli güvenlik kodunu (CVV) girin');
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
        price: item.price,
        quantity: item.quantity,
        description: item.name
      }));

      // Kargo ücreti varsa items'e ekle
      if (shipping > 0) {
        cartItems.push({
          name: 'Kargo',
          price: shipping,
          quantity: 1,
          description: 'Kargo ücreti'
        });
      }

      const paymentData: SiPayPaymentData = {
        payment_type: '3D',
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
        items: cartItems,
        cancel_url: `${window.location.origin}/sipay_3d_return.php`,
        return_url: `${window.location.origin}/sipay_3d_return.php`,
        bill_address1: formData.address,
        bill_city: selectedNames.cityName,
        bill_state: selectedNames.districtName,
        bill_postcode: '34000',
        bill_country: 'TR',
        bill_email: formData.email,
        bill_phone: formData.phone
      };

      // 3D ödeme öncesi form verilerini localStorage'a kaydet
      const addressInfo = getSelectedAddressInfo();
      const checkoutData = {
        formData,
        selectedNames,
        isCompany,
        selectedCity,
        selectedDistrict,
        selectedTown,
        addressInfo, // Adres bilgilerini de ekle
        cartItems: items, // Sepet ürünlerini de kaydet
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        invoiceId: invoiceId, // Invoice ID'yi de kaydet
        timestamp: Date.now() // Timestamp ekle
      };
      
      localStorage.setItem('checkout_form_data', JSON.stringify(checkoutData));
      console.log('💾 3D ödeme öncesi localStorage\'a kaydedildi:', checkoutData);

      const result = await sipayService.processPayment(paymentData);

      console.log('📋 Sipay response:', result);

      // Response success kontrolü - Sipay format'ına göre
      const isPaymentSuccess = result.success && result.data && (
        (result.data.status_code === 100) || // API level success
        (result.data.sipay_status === 1) ||  // Payment level success
        (result.data.data && result.data.data.sipay_status === 1) // Nested data success
      );

      if (isPaymentSuccess) {
        // 3D ödeme için HTML response check
        if (paymentData.payment_type === '3D' && result.data.form_html) {
          console.log('🔄 3D ödeme formu submit ediliyor...');
          
          // Sayfayı temizle ve direkt HTML'i yaz
          document.open();
          document.write(result.data.form_html);
          document.close();
          
          // İşlem tamamlandı, return'den geleni bekle
          return;
        }
        
        // 2D ödeme başarılı veya 3D ödeme tamamlandı
        console.log('✅ Sipay ödeme başarılı:', result);
        
        // Sipariş oluşturma API'sini çağır
        try {
          console.log('📦 Sipariş oluşturuluyor...');
          
          // ✅ GELİŞTİRİLMİŞ ADRES VALİDASYONU
          if (!selectedCity || !selectedDistrict) {
            throw new Error('Lütfen il ve ilçe seçimi yapınız');
          }

          // ✅ DAHA ESNEK İKAS ID FORMAT KONTROLÜ
          const isValidIkasId = (id: string) => {
            return id && id.trim() !== '' && (
              // UUID formatı (standart)
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
              // İkas özel UUID formatı (fb ile başlayan)
              /^fb[0-9a-f]{6}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
              // Sayısal ID formatı
              /^\d+$/.test(id) ||
              // Tire ile ayrılmış ID formatı (34-020 gibi)
              /^\d+-\d+$/.test(id) ||
              // Alphanumeric ID formatı
              /^[a-zA-Z0-9-_]+$/.test(id)
            );
          };

          if (!isValidIkasId(selectedCity)) {
            console.warn('⚠️ Geçersiz şehir ID formatı:', selectedCity);
            // ID formatı geçersiz olsa bile devam et
          }

          if (!isValidIkasId(selectedDistrict)) {
            console.warn('⚠️ Geçersiz ilçe ID formatı:', selectedDistrict);
            // ID formatı geçersiz olsa bile devam et
          }

          const addressInfo = getSelectedAddressInfo();

          // ✅ ADRES BİLGİLERİNİ DOĞRULA
          if (!addressInfo.city.name || !addressInfo.district.name) {
            throw new Error('İl ve ilçe adları zorunludur');
          }

          // ✅ DEBUG LOGLARI - ADRES BİLGİLERİNİ DETAYLI GÖSTER
          console.log('📍 Checkout Adres Bilgileri:', {
            selectedCity,
            selectedDistrict,
            selectedTown,
            addressInfo,
            cityName: addressInfo.city.name,
            districtName: addressInfo.district.name
          });

          // Adres bilgilerini doğru şekilde hazırla - İkas API formatına uygun
          const orderPayload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            shippingAddress: formData.address,
            shippingAddressLine2: formData.addressLine2 || '',
            shippingCity: addressInfo.city.name,
            shippingDistrict: addressInfo.district.name,
            shippingTown: addressInfo.town.name || '',
            shippingPostalCode: '34000',
            shippingCityId: addressInfo.city.id,
            shippingDistrictId: addressInfo.district.id,
            shippingTownId: addressInfo.town.id || '',
            billingAddress: formData.address,
            billingAddressLine2: formData.addressLine2 || '',
            billingCity: addressInfo.city.name,
            billingDistrict: addressInfo.district.name,
            billingPostalCode: '34000',
            billingCityId: addressInfo.city.id,
            billingDistrictId: addressInfo.district.id,
            isCompany: isCompany,
            companyName: isCompany ? formData.companyName : '',
            taxNumber: isCompany ? formData.taxNumber : '',
            taxOffice: isCompany ? formData.taxOffice : '',
            isDifferentBillingAddress: false
          };
          
          const orderResult = await createOrder(orderPayload);
          console.log('✅ Sipariş başarıyla oluşturuldu:', orderResult);
          
          setOrderData({
            success: true,
            orderId: orderResult.orderId || invoiceId,
            orderNumber: orderResult.orderNumber || `#${invoiceId}`,
            invoiceId: invoiceId,
            transactionType: paymentData.payment_type || '2D',
            orderSummary: {
              items: items,
              subtotal: subtotal,
              shipping: shipping,
              total: total,
              address: selectedNames,
              formData: formData
            }
          });
          
        } catch (orderError) {
          console.error('❌ Sipariş oluşturma hatası:', orderError);
          // Ödeme başarılı ama sipariş oluşturulamadı durumu
          setOrderData({
            success: true,
            orderId: invoiceId,
            orderNumber: `#${invoiceId}`,
            invoiceId: invoiceId,
            transactionType: paymentData.payment_type || '2D',
            orderSummary: {
              items: items,
              subtotal: subtotal,
              shipping: shipping,
              total: total,
              address: selectedNames,
              formData: formData
            },
            orderError: 'Ödeme başarılı ancak sipariş kaydedilemedi. Lütfen müşteri hizmetleri ile iletişime geçin.'
          });
        }
        
        setActiveStep('onay');
        clearCart();
        
        // URL'yi güncelle
        window.history.replaceState({}, '', '/checkout?status=success');
        
      } else {
        // Ödeme başarısız veya belirsiz durum
        console.warn('⚠️ Sipay ödeme başarısız:', result);
        
        // Sipay hata mesajını göster
        let errorMessage = 'Ödeme işlemi başarısız oldu. ';
        
        // Sipay response'dan hata mesajı al
        if (result.data) {
          if (result.data.status_description && result.data.status_description !== "Payment process successful") {
            errorMessage += result.data.status_description;
          } else if (result.data.error) {
            errorMessage += result.data.error;
          } else if (result.data.data && result.data.data.error) {
            errorMessage += result.data.data.error;
          } else {
            errorMessage += 'Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.';
          }
        } else if (result.error) {
          errorMessage += result.error;
        } else {
          errorMessage += 'Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.';
        }
        
        throw new Error(errorMessage);
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle</label>
                        <select
                          value={selectedTown}
                          onChange={(e) => setSelectedTown(e.target.value)}
                          disabled={!selectedDistrict}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                        >
                          <option value="">Mahalle seçin (isteğe bağlı)</option>
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

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adres Detayı 2 (İsteğe Bağlı)</label>
                      <textarea
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Apartman, daire, kat bilgisi vb."
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
                  {/* Ödeme Güvenlik Bilgisi */}

                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Kredi Kartı Bilgileri</h3>
                        <p className="text-sm text-gray-600">Güvenli ödeme için kart bilgilerinizi girin</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-blue-900 text-sm font-medium">256-bit SSL Şifrelemesi</p>
                          <p className="text-blue-700 text-xs">Tüm ödeme bilgileriniz bankacılık seviyesinde korunmaktadır</p>
                        </div>
                      </div>
                    </div>

                    {/* Sipay Bilgilendirme */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-purple-900 text-sm font-bold">Sipay Güvenli Ödeme Sistemi</p>
                            <p className="text-purple-700 text-xs">Türkiye'nin güvenilir ödeme altyapısı</p>
                          </div>
                        </div>
                        <img 
                          src="/sipay_logo.svg" 
                          alt="Sipay Logo" 
                          className="h-8 opacity-80"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-purple-700 font-medium">PCI DSS Sertifikalı</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-purple-700 font-medium">Tüm banka kartları desteklenir</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-purple-700 font-medium">7/24 Müşteri Desteği</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-purple-700 font-medium">Anında işlem onayı</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-white/60 rounded-lg">
                        <p className="text-xs text-purple-800 leading-relaxed">
                          <span className="font-semibold">Sipay</span> ile güvenli ödeme yapıyorsunuz. 
                          Kart bilgileriniz şifrelenerek saklanır ve hiçbir zaman üçüncü kişilerle paylaşılmaz.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Kart Numarası */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kart Numarası *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="cardNumber"
                            value={cardData.cardNumber}
                            onChange={handleCardInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono tracking-wider"
                            maxLength={19}
                            required
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        {cardData.cardNumber && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm text-blue-600 font-medium">
                              Kart Türü: {sipayService.getCardType(cardData.cardNumber)}
                            </p>
                          </div>
                        )}
                        
                        {/* Gerçek Kart Test Bilgilendirmesi */}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-blue-700 font-medium">� Gerçek Kart Test Modu:</p>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCardData({
                                    cardNumber: '4508 0345 0803 4509',
                                    cardHolder: 'TEST USER',
                                    expiryMonth: '12',
                                    expiryYear: '26',
                                    cvv: '000',
                                    installments: 1
                                  });
                                }}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-1 rounded"
                              >
                                Test Kartı
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardData({
                                    cardNumber: '',
                                    cardHolder: '',
                                    expiryMonth: '',
                                    expiryYear: '',
                                    cvv: '',
                                    installments: 1
                                  });
                                }}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                              >
                                Temizle
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-red-600 space-y-1">
                            <div>• 🚨 <strong>GERÇEK ÖDEME MODU - Kartınızdan para çekilecektir!</strong></div>
                            <div>• 💳 Lütfen gerçek kart bilgilerinizi dikkatli girin</div>
                            <div>• �️ 3D Secure doğrulaması aktif</div>
                            <div>• � Sorun yaşarsanız müşteri hizmetleri ile iletişime geçin</div>
                            <div>• � Tüm ödemeler SSL ile şifrelenir</div>
                            <div className="text-xs text-red-700 mt-1 font-semibold">⚠️ Bu gerçek bir ödeme işlemidir!</div>
                          </div>
                        </div>
                      </div>

                      {/* Kart Sahibi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kart Sahibinin Adı *</label>
                        <input
                          type="text"
                          name="cardHolder"
                          value={cardData.cardHolder}
                          onChange={handleCardInputChange}
                          placeholder="JOHN DOE"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-lg font-medium tracking-wide"
                          required
                        />
                      </div>

                      {/* Son Kullanma Tarihi ve CVV */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ay *</label>
                          <input
                            type="text"
                            name="expiryMonth"
                            value={cardData.expiryMonth}
                            onChange={handleCardInputChange}
                            placeholder="MM"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                            maxLength={2}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Yıl *</label>
                          <input
                            type="text"
                            name="expiryYear"
                            value={cardData.expiryYear}
                            onChange={handleCardInputChange}
                            placeholder="YYYY"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                            maxLength={4}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
                          <div className="relative">
                            <input
                              type="text"
                              name="cvv"
                              value={cardData.cvv}
                              onChange={handleCardInputChange}
                              placeholder="123"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                              maxLength={4}
                              required
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Taksit Seçenekleri 
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
                      */}
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
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          3D Güvenli Ödeme İşleniyor...
                        </>
                      ) : (
                        <>
                          <Lock className="h-5 w-5" />
                          {total.toFixed(2)} ₺ - 3D Güvenli Öde
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sipay Güven Rozeti */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src="/sipay_logo.svg" 
                          alt="Sipay" 
                          className="h-6 opacity-70"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-sm text-gray-600 font-medium">ile güvenli ödeme</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>SSL</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>PCI DSS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>3D Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'onay' && orderData && (
                <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
                  <div className="max-w-4xl mx-auto">
                    {/* Başarı Animasyonu */}
                    <div className="text-center mb-12">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                          <Check className="h-12 w-12 text-white animate-bounce" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                          ✨
                        </div>
                      </div>
                      
                      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        🎉 Siparişiniz <span className="text-green-600">Tamamlandı!</span>
                      </h1>
                      
                      <p className="text-xl text-gray-600 mb-2">
                        Ödemeniz başarıyla alındı ve siparişiniz hazırlanmaya başladı.
                      </p>
                      
                      <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        Sipariş Numaranız: <span className="font-bold">{orderData.orderNumber || orderData.orderId}</span>
                      </div>
                    </div>

                    {/* Sipariş Detayları Kartı */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            📦
                          </div>
                          Sipariş Detayları
                        </h2>
                      </div>
                      
                      <div className="p-8">
                        {/* Sipariş Öğeleri */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            🛍️ Satın Aldığınız Ürünler
                          </h3>
                          <div className="space-y-4">
                            {orderData.orderSummary.items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    🧽
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                                  </div>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {(item.price * item.quantity).toFixed(2)} ₺
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ödeme Özeti */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            💳 Ödeme Özeti
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                              <span>Ürünler Toplamı:</span>
                              <span className="font-medium">{orderData.orderSummary.subtotal.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Kargo Ücreti:</span>
                              <span className="font-medium">
                                {orderData.orderSummary.shipping === 0 ? (
                                  <span className="text-green-600 font-bold">🎉 ÜCRETSİZ</span>
                                ) : (
                                  `${orderData.orderSummary.shipping.toFixed(2)} ₺`
                                )}
                              </span>
                            </div>
                            <div className="border-t border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900">
                              <span>Toplam Tutar:</span>
                              <span className="text-green-600">{orderData.orderSummary.total.toFixed(2)} ₺</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bilgilendirme Kartları */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            📧
                          </div>
                          <h3 className="font-semibold text-blue-900">E-posta Onayı</h3>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Sipariş detayları ve kargo takip bilgileri e-posta adresinize gönderildi.
                        </p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            🚚
                          </div>
                          <h3 className="font-semibold text-purple-900">Kargo Süreci</h3>
                        </div>
                        <p className="text-purple-700 text-sm">
                          Siparişiniz 1-2 iş günü içinde kargoya verilecek ve size ulaştırılacaktır.
                        </p>
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link 
                        to="/" 
                        className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-4 px-8 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 text-center flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        🏠 Ana Sayfaya Dön
                      </Link>
                      <Link 
                        to="/contact" 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        📞 Bize Ulaşın
                      </Link>
                      <Link 
                        to="/blogs" 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-8 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-center flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        📝 Blog'a Git
                      </Link>
                    </div>

                    {/* Teşekkür Mesajı */}
                    <div className="text-center mt-12 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        💚 CalFormat Ailesine Hoş Geldiniz!
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Doğal ve sağlıklı beslenme yolculuğunuzda yanınızdayız. 
                        Siparişiniz için teşekkür ederiz!
                      </p>
                    </div>

                    {/* Hata Mesajı (varsa) */}
                    {orderData.orderError && (
                      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                          <h3 className="font-semibold text-yellow-800">Önemli Bilgilendirme</h3>
                        </div>
                        <p className="text-yellow-700">{orderData.orderError}</p>
                      </div>
                    )}
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
                {shipping === 0 ? (
                  <p className="text-xs text-green-600">🎉 Ücretsiz kargo!</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {(shippingThreshold - subtotal).toFixed(2)} ₺ daha alışveriş yapın, kargo ücretsiz olsun! 
                  </p>
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
