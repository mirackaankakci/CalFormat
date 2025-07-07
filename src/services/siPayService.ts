// Sipay Ödeme Servisi
import { makeSecureRequest } from '../utils/secureRequest';

export interface SipayPaymentData {
  cc_holder_name: string;
  cc_no: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  currency_code: 'TRY' | 'USD' | 'EUR';
  installments_number: number;
  invoice_id: string;
  invoice_description: string;
  name: string;
  surname: string;
  total: number;
  items: string; // JSON string of cart items
  cancel_url: string;
  return_url: string;
  bill_address1?: string;
  bill_city?: string;
  bill_state?: string;
  bill_postcode?: string;
  bill_country?: string;
  bill_email?: string;
  bill_phone?: string;
}

export interface SipayResponse {
  success: boolean;
  data?: any;
  payment_status?: number;
  transaction_type?: string;
  invoice_id?: string;
  api_info?: {
    token_method: string;
    payment_method: string;
    http_code: number;
    hash_key: string;
  };
  message?: string;
  error?: boolean;
  debug_info?: any;
  timestamp: string;
}

export interface SipayTokenResponse {
  success: boolean;
  token_obtained: boolean;
  token_method: string;
  config_info: {
    token_url: string;
    payment_url: string;
    app_id: string;
    merchant_id: string;
  };
  test_data: {
    currency_codes: string[];
    max_installments: number;
    supported_cards: string[];
  };
  timestamp: string;
}

class SipayService {
  private baseUrl = '/sipay_payment.php';

  /**
   * Sipay token test - bağlantı kontrolü
   */
  async testToken(): Promise<SipayTokenResponse> {
    try {
      console.log('🔍 Sipay token test ediliyor...');
      
      const response = await makeSecureRequest<SipayTokenResponse>(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Sipay token test sonucu:', response);
      return response;
    } catch (error) {
      console.error('❌ Sipay token test hatası:', error);
      throw new Error('Sipay token test edilemedi');
    }
  }

  /**
   * Kredi kartı numarasını formatla (****-****-****-1234)
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length >= 16) {
      return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
    }
    return cardNumber;
  }

  /**
   * Kredi kartı numarasını maskele (güvenlik için)
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
   * Kart son kullanma tarihini validate et
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
   * Luhn algoritması ile kart numarası validate et
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
  getCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.match(/^4/)) return 'VISA';
    if (cleaned.match(/^5[1-5]/)) return 'MASTERCARD';
    if (cleaned.match(/^3[47]/)) return 'AMEX';
    if (cleaned.match(/^6/)) return 'DISCOVER';
    
    return 'UNKNOWN';
  }

  /**
   * Sipay ile ödeme işlemi gerçekleştir
   */
  async processPayment(paymentData: SipayPaymentData): Promise<SipayResponse> {
    try {
      console.log('💳 Sipay ödeme işlemi başlatılıyor...', {
        invoice_id: paymentData.invoice_id,
        total: paymentData.total,
        currency: paymentData.currency_code,
        installments: paymentData.installments_number
      });

      // Kart numarası validasyonu
      if (!this.validateCardNumber(paymentData.cc_no)) {
        throw new Error('Geçersiz kart numarası');
      }

      // Son kullanma tarihi validasyonu
      if (!this.validateExpiry(paymentData.expiry_month, paymentData.expiry_year)) {
        throw new Error('Kartın son kullanma tarihi geçmiş');
      }

      // CVV validasyonu
      const cardType = this.getCardType(paymentData.cc_no);
      const cvvLength = cardType === 'AMEX' ? 4 : 3;
      if (paymentData.cvv.length !== cvvLength) {
        throw new Error(`CVV ${cvvLength} haneli olmalıdır`);
      }

      const response = await makeSecureRequest<SipayResponse>(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('✅ Sipay ödeme yanıtı:', response);

      // Ödeme durumunu kontrol et
      if (response.success && response.payment_status === 1) {
        console.log('🎉 Ödeme başarılı!', {
          transaction_type: response.transaction_type,
          invoice_id: response.invoice_id
        });
      } else {
        console.warn('⚠️ Ödeme başarısız:', response);
        
        // API'den gelen hata mesajlarını kullanıcı dostu hale getir
        if (response.data && response.data.status_description) {
          const errorMsg = response.data.status_description;
          if (errorMsg.includes('Items must be an array')) {
            throw new Error('Sepet bilgileri işlenirken hata oluştu. Lütfen tekrar deneyin.');
          } else if (errorMsg.includes('Invalid card')) {
            throw new Error('Geçersiz kart bilgileri. Lütfen bilgilerinizi kontrol edin.');
          } else if (errorMsg.includes('Insufficient funds')) {
            throw new Error('Kartınızda yeterli bakiye bulunmuyor.');
          } else if (errorMsg.includes('Invalid hash key') || errorMsg.includes('Hash validation failed')) {
            throw new Error('Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.');
          } else {
            throw new Error(`Ödeme hatası: ${errorMsg}`);
          }
        } else if (response.message && response.message.includes('Hash validation failed')) {
          throw new Error('Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.');
        } else {
          throw new Error('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Sipay ödeme hatası:', error);
      throw error;
    }
  }

  /**
   * 3D Return verilerini işle (hash validation dahil)
   */
  async handle3DReturn(): Promise<any> {
    try {
      console.log('🔄 3D Return verileri işleniyor...');
      
      // URL parametrelerinden 3D return verilerini al
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const invoiceId = urlParams.get('invoice_id');
      const transactionId = urlParams.get('transaction_id');
      const total = urlParams.get('total');
      const currencyCode = urlParams.get('currency_code');
      const hashKey = urlParams.get('hash_key');
      const statusDescription = urlParams.get('status_description');
      
      if (!invoiceId || !total || !currencyCode || !hashKey) {
        throw new Error('3D Return verileri eksik');
      }
      
      // Hash validation için backend'e gönder
      const returnData = {
        payment_status: paymentStatus || '0',
        invoice_id: invoiceId,
        transaction_id: transactionId || '',
        total: total,
        currency_code: currencyCode,
        hash_key: hashKey,
        status_description: statusDescription || ''
      };
      
      const response = await makeSecureRequest('/sipay_3d_return.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(returnData).toString(),
      });
      
      console.log('✅ 3D Return işlendi:', response);
      
      if (!response.success) {
        if (response.error === 'Hash validation failed') {
          throw new Error('Güvenlik doğrulaması başarısız. Ödeme güvenilir değil.');
        } else {
          throw new Error(response.message || '3D Return işleminde hata oluştu');
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ 3D Return hatası:', error);
      throw error;
    }
  }

  /**
   * Ödeme durumunu kontrol et
   */
  async checkPaymentStatus(invoiceId: string): Promise<any> {
    try {
      console.log('🔍 Ödeme durumu kontrol ediliyor:', invoiceId);
      
      // Bu endpoint'i ileride ekleyebiliriz
      // Şimdilik client-side'da URL parametrelerini kontrol edeceğiz
      
      const urlParams = new URLSearchParams(window.location.search);
      const sipayStatus = urlParams.get('sipay_status');
      const orderNo = urlParams.get('order_no');
      const returnedInvoiceId = urlParams.get('invoice_id');
      
      return {
        sipay_status: sipayStatus,
        order_no: orderNo,
        invoice_id: returnedInvoiceId,
        is_success: sipayStatus === '1',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Ödeme durumu kontrol hatası:', error);
      throw error;
    }
  }

  /**
   * Taksit seçeneklerini getir
   */
  getInstallmentOptions(total: number): Array<{value: number, label: string, monthlyAmount: number}> {
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
        monthlyAmount: monthlyAmount
      };
    });
  }
}

export const sipayService = new SipayService();
export default sipayService;