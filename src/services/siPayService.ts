/**
 * SiPay Ödeme Servisi - Frontend
 * Modern, type-safe ve güvenli ödeme entegrasyonu
 */

// SiPay ödeme veri tipi
export interface SiPayPaymentData {
  // Kart bilgileri
  cc_holder_name: string;
  cc_no: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  
  // Ödeme bilgileri
  currency_code: 'TRY' | 'USD' | 'EUR';
  installments_number: number;
  total: number;
  payment_type: '2D' | '3D';
  
  // Sipariş bilgileri
  invoice_id?: string;
  invoice_description?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  
  // Müşteri bilgileri
  name: string;
  surname: string;
  bill_email: string;
  bill_phone: string;
  
  // Adres bilgileri
  bill_address1?: string;
  bill_city?: string;
  bill_state?: string;
  bill_postcode?: string;
  bill_country?: string;
  
  // URL'ler
  cancel_url?: string;
  return_url?: string;
}

// SiPay API yanıt tipi
export interface SiPayResponse {
  success: boolean;
  payment_type: '2D' | '3D';
  data?: any;
  invoice_id?: string;
  token_info?: {
    is_3d_enabled: number;
    expires_at: number;
  };
  error?: string;
  error_code?: string;
  timestamp: string;
}

// 3D Return yanıt tipi
export interface SiPay3DReturnResponse {
  success: boolean;
  payment_type: '3D_RETURN';
  payment_successful: boolean;
  payment_status: string;
  hash_validated: boolean;
  transaction_data: {
    sipay_status: string;
    order_no: string;
    invoice_id: string;
    total: number;
    currency_code: string;
    status_description: string;
    transaction_type: string;
    md_status: string;
    auth_code: string;
  };
  message: string;
  next_action: 'redirect_success' | 'redirect_cancel';
  timestamp: string;
}

// Kart doğrulama sonuçları
export interface CardValidationResult {
  isValid: boolean;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'UNKNOWN';
  errors: string[];
}

class SiPayService {
  private baseUrl = '/sipay_payment.php';
  private returnUrl = '/sipay_3d_return.php';

  /**
   * SiPay API durumunu kontrol et
   */
  async checkApiStatus(): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ SiPay API status kontrolü hatası:', error);
      throw new Error('SiPay API bağlantısı kurulamadı');
    }
  }

  /**
   * Kredi kartı numarasını Luhn algoritması ile doğrula
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Kart türünü tespit et
   */
  getCardType(cardNumber: string): 'VISA' | 'MASTERCARD' | 'AMEX' | 'UNKNOWN' {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.match(/^4/)) return 'VISA';
    if (cleaned.match(/^5[1-5]/)) return 'MASTERCARD';
    if (cleaned.match(/^3[47]/)) return 'AMEX';
    
    return 'UNKNOWN';
  }

  /**
   * Son kullanma tarihini doğrula
   */
  validateExpiry(month: string, year: string): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  }

  /**
   * Kapsamlı kart doğrulaması
   */
  validateCard(paymentData: Partial<SiPayPaymentData>): CardValidationResult {
    const errors: string[] = [];
    let isValid = true;

    // Kart numarası kontrolü
    if (!paymentData.cc_no || !this.validateCardNumber(paymentData.cc_no)) {
      errors.push('Geçersiz kart numarası');
      isValid = false;
    }

    // Son kullanma tarihi kontrolü
    if (!paymentData.expiry_month || !paymentData.expiry_year || 
        !this.validateExpiry(paymentData.expiry_month, paymentData.expiry_year)) {
      errors.push('Kartın son kullanma tarihi geçmiş');
      isValid = false;
    }

    // CVV kontrolü
    const cardType = this.getCardType(paymentData.cc_no || '');
    const expectedCvvLength = cardType === 'AMEX' ? 4 : 3;
    
    if (!paymentData.cvv || paymentData.cvv.length !== expectedCvvLength) {
      errors.push(`CVV ${expectedCvvLength} haneli olmalıdır`);
      isValid = false;
    }

    // Kart sahibi adı kontrolü
    if (!paymentData.cc_holder_name || paymentData.cc_holder_name.trim().length < 2) {
      errors.push('Kart sahibi adı gerekli');
      isValid = false;
    }

    return {
      isValid,
      cardType,
      errors
    };
  }

  /**
   * Kart numarasını maskele (güvenlik için)
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length >= 16) {
      const first6 = cleaned.substring(0, 6);
      const last4 = cleaned.substring(cleaned.length - 4);
      return `${first6}******${last4}`;
    }
    return cardNumber;
  }

  /**
   * Taksit seçeneklerini getir
   */
  getInstallmentOptions(total: number): Array<{
    value: number;
    label: string;
    monthlyAmount: number;
    totalAmount: number;
  }> {
    const installments = [
      { value: 1, label: 'Tek Çekim', rate: 0 },
      { value: 2, label: '2 Taksit', rate: 0.02 },
      { value: 3, label: '3 Taksit', rate: 0.04 },
      { value: 6, label: '6 Taksit', rate: 0.08 },
      { value: 9, label: '9 Taksit', rate: 0.12 },
      { value: 12, label: '12 Taksit', rate: 0.16 }
    ];

    return installments.map(inst => {
      const totalWithRate = total * (1 + inst.rate);
      const monthlyAmount = totalWithRate / inst.value;
      
      return {
        value: inst.value,
        label: inst.value === 1 ? inst.label : `${inst.label} (${monthlyAmount.toFixed(2)} ₺/ay)`,
        monthlyAmount: monthlyAmount,
        totalAmount: totalWithRate
      };
    });
  }

  /**
   * Ödeme işlemini başlat
   */
  async processPayment(paymentData: SiPayPaymentData): Promise<SiPayResponse> {
    try {
      console.log('💳 SiPay ödeme işlemi başlatılıyor...', {
        payment_type: paymentData.payment_type,
        total: paymentData.total,
        currency: paymentData.currency_code,
        invoice_id: paymentData.invoice_id
      });

      // Kart doğrulaması
      const validation = this.validateCard(paymentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Benzersiz invoice_id oluştur (yoksa)
      if (!paymentData.invoice_id) {
        paymentData.invoice_id = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // URL'leri ayarla (yoksa)
      if (!paymentData.cancel_url) {
        paymentData.cancel_url = `${window.location.origin}/checkout?status=cancel&invoice_id=${paymentData.invoice_id}`;
      }
      if (!paymentData.return_url) {
        paymentData.return_url = `${window.location.origin}/checkout?status=success&invoice_id=${paymentData.invoice_id}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      // 3D ödeme için HTML response kontrolü
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        // 3D ödeme HTML formu - yeni tab'da aç
        const htmlContent = await response.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
        
        return {
          success: true,
          payment_type: '3D',
          invoice_id: paymentData.invoice_id,
          timestamp: new Date().toISOString()
        };
      }

      // JSON response (2D ödeme)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SiPayResponse = await response.json();
      
      console.log('✅ SiPay ödeme yanıtı:', result);
      return result;

    } catch (error) {
      console.error('❌ SiPay ödeme hatası:', error);
      throw error;
    }
  }

  /**
   * 3D Return sonucunu işle
   */
  async handle3DReturn(urlParams: URLSearchParams): Promise<SiPay3DReturnResponse> {
    try {
      console.log('🔄 3D Return verileri işleniyor...');
      
      const returnData: Record<string, string> = {};
      urlParams.forEach((value, key) => {
        returnData[key] = value;
      });

      const response = await fetch(this.returnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(returnData)
      });

      if (!response.ok) {
        throw new Error(`3D Return HTTP hatası: ${response.status}`);
      }

      const result: SiPay3DReturnResponse = await response.json();
      console.log('✅ 3D Return işlendi:', result);
      
      return result;

    } catch (error) {
      console.error('❌ 3D Return hatası:', error);
      throw error;
    }
  }

  /**
   * URL'deki ödeme durumunu kontrol et
   */
  checkPaymentStatusFromUrl(): {
    hasPaymentResult: boolean;
    is3DReturn: boolean;
    sipayStatus?: string;
    invoiceId?: string;
    orderNo?: string;
  } {
    const urlParams = new URLSearchParams(window.location.search);
    
    const sipayStatus = urlParams.get('sipay_status');
    const invoiceId = urlParams.get('invoice_id');
    const orderNo = urlParams.get('order_no');
    const hashKey = urlParams.get('hash_key');
    
    return {
      hasPaymentResult: !!(sipayStatus && invoiceId),
      is3DReturn: !!(sipayStatus && invoiceId && hashKey),
      sipayStatus: sipayStatus || undefined,
      invoiceId: invoiceId || undefined,
      orderNo: orderNo || undefined
    };
  }

  /**
   * Test kartları listesi
   */
  getTestCards() {
    return [
      {
        name: 'Visa Test Kartı',
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123',
        type: 'VISA'
      },
      {
        name: 'Mastercard Test Kartı',
        number: '5555555555554444',
        expiry: '12/25',
        cvv: '123',
        type: 'MASTERCARD'
      },
      {
        name: 'American Express Test Kartı',
        number: '378282246310005',
        expiry: '12/25',
        cvv: '1234',
        type: 'AMEX'
      }
    ];
  }
}

// Singleton instance
export const siPayService = new SiPayService();
export default siPayService;