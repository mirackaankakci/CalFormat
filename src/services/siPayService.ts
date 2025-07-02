export interface SiPayPaymentData {
  // Kart bilgileri
  cc_holder_name: string;
  cc_no: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  
  // Ödeme bilgileri
  total: number;
  currency_code?: string; // USD, TRY, EUR
  installments_number?: number;
  invoice_id: string; // Benzersiz sipariş numarası
  invoice_description: string;
  
  // Müşteri bilgileri
  name: string;
  surname: string;
  
  // Sepet ürünleri
  items: string; // JSON string
  
  // URL'ler
  cancel_url: string;
  return_url: string;
  
  // Fatura adresi
  bill_address1?: string;
  bill_address2?: string;
  bill_city?: string;
  bill_postcode?: string;
  bill_state?: string;
  bill_country?: string;
  bill_email: string;
  bill_phone: string;
  
  // İşlem tipi
  transaction_type?: 'Auth' | 'PreAuth';
  
  // IP adresi (gerekli)
  ip?: string;
  
  // Komisyon ayarları
  is_commission_from_user?: string; // "1" ise aktif
  commission_by?: 'merchant' | 'user';
  
  // Kart programı (opsiyonel)
  card_program?: 'WORLD' | 'BONUS' | 'MAXIMUM' | 'BANKKART_COMBO' | 'PARAF' | 'AXESS' | 'ADVANT' | 'CARD_FNS';
  
  // Webhook anahtarı
  sale_web_hook_key?: string;
  
  // Yinelenen ödeme
  order_type?: number; // 1 ise yinelenen ödeme
  recurring_payment_number?: number;
  recurring_payment_cycle?: 'D' | 'M' | 'Y';
  recurring_payment_interval?: string;
  recurring_web_hook_key?: string;
  
  // Sigorta ödemeleri için
  vpos_type?: 'insurance';
  identity_number?: string; // TCKN/VKN/TIN (10-11 basamak)
}

// 2D (Non-Secure) ödeme yanıtı
export interface SiPay2DPaymentResponse {
  success: boolean;
  data?: {
    payment_status: number; // 1: başarılı, 0: başarısız
    transaction_type: 'Auth' | 'PreAuth';
    order_id: string;
    invoice_id: string;
    total: number;
    currency_code: string;
    hash_key: string;
    sipay_status: number;
    status_description: string;
    merchant_commission?: number;
    user_commission?: number;
    transaction_date?: string;
  };
  error?: string;
  message?: string;
  test_mode?: boolean;
}

export interface SiPayTokenResponse {
  success: boolean;
  data?: {
    status_code: number;
    status_description: string;
    data: {
      token: string;
      is_3d: number;
    };
  };
  error?: string;
  message?: string;
}

export interface SiPayPaymentResponse {
  success: boolean;
  payment_form?: string;
  invoice_id?: string;
  payment_url?: string;
  form_data?: any;
  error?: string;
  message?: string;
}

// 2D (Non-Secure) ödeme yanıtı
export interface SiPay2DPaymentResponse {
  success: boolean;
  data?: {
    payment_status: number; // 1 = başarılı, 0 = başarısız
    transaction_type: string; // Auth, PreAuth
    order_id: string;
    invoice_id: string;
    total: number;
    currency_code: string;
    sipay_status: number;
    status_description: string;
    hash_key?: string;
    merchant_commission?: number;
    user_commission?: number;
    transaction_date?: string;
  };
  error?: string;
  message?: string;
  test_mode?: boolean;
  timestamp?: string;
}

class SiPayService {
  private baseUrl: string;

  constructor() {
    // Environment bazlı URL belirleme
    const isDev = window.location.hostname === 'localhost';
    this.baseUrl = isDev ? '' : '/';
  }

  // Token alma
  async getToken(): Promise<SiPayTokenResponse> {
    try {
      console.log('🔑 SiPay token alınıyor...');

      const response = await fetch(`${this.baseUrl}sipay_token.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors', // CORS modunu açıkça belirt
        credentials: 'omit',
        cache: 'no-cache'
      });

      console.log('📊 Token response status:', response.status);
      console.log('📊 Token response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📄 Token API yanıtı:', result);
      
      if (result.success) {
        console.log('✅ SiPay token başarıyla alındı:', result.data);
        return result;
      } else {
        throw new Error(result.message || 'Token alınamadı');
      }
    } catch (error) {
      console.error('❌ SiPay token alma hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token alma hatası'
      };
    }
  }

  // 3D Ödeme hazırlama
  async preparePayment(paymentData: SiPayPaymentData): Promise<SiPayPaymentResponse> {
    try {
      console.log('SiPay ödeme hazırlanıyor:', paymentData);

      const response = await fetch(`${this.baseUrl}sipay_prepare_payment.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        cache: 'no-cache',
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('SiPay ödeme hazırlandı:', result);
        return result;
      } else {
        throw new Error(result.message || 'Ödeme hazırlanamadı');
      }
    } catch (error) {
      console.error('SiPay ödeme hazırlama hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ödeme hazırlama hatası'
      };
    }
  }

  // 3D ödeme formunu submit et - Geliştirilmiş yöntem
  async submitPaymentForm(formData: any, paymentUrl: string): Promise<void> {
    try {
      console.log('SiPay form submit ediliyor:', { formData, paymentUrl });
      
      // Önce server-side redirect ile deneyelim (daha güvenilir)
      try {
        const response = await fetch(`${this.baseUrl}sipay_form_redirect.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            form_data: formData,
            payment_url: paymentUrl
          })
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Yeni pencere açmayı dene
          const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          
          if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(html);
            newWindow.document.close();
            console.log('✅ SiPay formu yeni pencerede açıldı');
            return;
          } else {
            // Popup engellenirse mevcut pencerede aç
            document.open();
            document.write(html);
            document.close();
            console.log('✅ SiPay formu mevcut pencerede açıldı');
            return;
          }
        } else {
          throw new Error('Server-side redirect failed');
        }
      } catch (serverError) {
        console.warn('Server-side redirect başarısız, client-side deneniyor:', serverError);
        
        // Fallback: Client-side form oluştur
        const formHtml = this.createPaymentFormHtml(formData, paymentUrl);
        
        // Yeni pencere dene
        const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (newWindow) {
          newWindow.document.write(formHtml);
          newWindow.document.close();
          console.log('✅ SiPay formu client-side yeni pencerede açıldı');
        } else {
          // Son çare: Mevcut pencerede
          document.open();
          document.write(formHtml);
          document.close();
          console.log('✅ SiPay formu client-side mevcut pencerede açıldı');
        }
      }
      
    } catch (error) {
      console.error('❌ Tüm SiPay form submit yöntemleri başarısız:', error);
      alert('Ödeme sayfasına yönlendirilemiyor. Lütfen sayfayı yenileyin ve tekrar deneyin.');
    }
  }

  // HTML form oluştur
  private createPaymentFormHtml(formData: any, paymentUrl: string): string {
    let formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SiPay Güvenli Ödeme</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #ee7f1a, #d62d27);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          }
          .loading { margin: 20px 0; }
          .spinner { 
            border: 4px solid rgba(255,255,255,0.2);
            border-radius: 50%; 
            border-top: 4px solid #ffffff; 
            width: 50px; 
            height: 50px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 30px;
          }
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
          h2 { margin: 0 0 15px 0; font-size: 24px; }
          p { margin: 10px 0; opacity: 0.9; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">CalFormat</div>
          <div class="loading">
            <div class="spinner"></div>
            <h2>Güvenli ödeme sayfasına yönlendiriliyorsunuz</h2>
            <p>SiPay güvenli ödeme sistemine bağlanıyor...</p>
            <p><small>Bu işlem birkaç saniye sürebilir.</small></p>
          </div>
          <form id="sipay_form" method="POST" action="${paymentUrl}" style="display: none;">
    `;
    
    // Form alanlarını ekle
    Object.keys(formData).forEach(key => {
      const value = String(formData[key] || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      formHtml += `<input type="hidden" name="${key}" value="${value}">`;
    });
    
    formHtml += `
          </form>
          <script>
            console.log('SiPay form hazırlandı, submit ediliyor...');
            
            // 2 saniye sonra formu submit et
            setTimeout(function() {
              try {
                document.getElementById('sipay_form').submit();
                console.log('SiPay form submit edildi');
              } catch (error) {
                console.error('Form submit hatası:', error);
                alert('Ödeme sayfasına yönlendirilemiyor. Lütfen tekrar deneyin.');
              }
            }, 2000);
          </script>
        </div>
      </body>
      </html>
    `;
    
    return formHtml;
  }

  // URL'den ödeme sonucunu parse et
  parsePaymentResult(): { payment: string; order_id?: string; invoice_id?: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    
    if (payment) {
      return {
        payment,
        order_id: urlParams.get('order_id') || undefined,
        invoice_id: urlParams.get('invoice_id') || undefined
      };
    }
    
    return null;
  }

  // 2D (Non-Secure) Ödeme
  async makePayment2D(paymentData: SiPayPaymentData): Promise<SiPay2DPaymentResponse> {
    try {
      console.log('💳 SiPay 2D ödeme başlatılıyor:', paymentData);

      const response = await fetch(`${this.baseUrl}sipay_payment_2d.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        cache: 'no-cache',
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ SiPay 2D ödeme başarılı:', result);
        return result;
      } else {
        throw new Error(result.message || '2D ödeme başarısız');
      }
    } catch (error) {
      console.error('❌ SiPay 2D ödeme hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '2D ödeme hatası'
      };
    }
  }

  // Ödeme durumu kontrol et
  async checkPaymentStatus(invoiceId: string): Promise<any> {
    try {
      console.log('🔍 Ödeme durumu kontrol ediliyor:', invoiceId);

      const response = await fetch(`${this.baseUrl}sipay_check_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ invoice_id: invoiceId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Ödeme durumu:', result);
      return result;
    } catch (error) {
      console.error('❌ Ödeme durumu kontrol hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Durum kontrol hatası'
      };
    }
  }

  // Pre-Auth ödemeyi onaylama
  async confirmPayment(invoiceId: string): Promise<any> {
    try {
      console.log('✅ Pre-Auth ödeme onaylanıyor:', invoiceId);

      const response = await fetch(`${this.baseUrl}sipay_confirm_payment.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ invoice_id: invoiceId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🎉 Pre-Auth ödeme onaylandı:', result);
      return result;
    } catch (error) {
      console.error('❌ Pre-Auth ödeme onaylama hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ödeme onaylama hatası'
      };
    }
  }

  // Client IP adresini al
  async getClientIP(): Promise<string> {
    try {
      // Gerçek IP almak için farklı servisler deneyelim
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch (error) {
      console.warn('IP alınamadı, fallback kullanılıyor:', error);
      return '127.0.0.1';
    }
  }

  // Hash key oluştur (frontend'de test için)
  createHashKey(data: any, merchantKey: string): string {
    // Bu normalde backend'de yapılmalı, burada sadece test için
    const hashString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&') + merchantKey;
    
    // Basit hash (gerçek projede SHA256 kullanın)
    return btoa(hashString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  // Callback URL'lerini oluştur
  createCallbackUrls(): { return_url: string; cancel_url: string } {
    const baseUrl = window.location.origin;
    return {
      return_url: `${baseUrl}/odeme-basarili`,
      cancel_url: `${baseUrl}/odeme-basarisiz`
    };
  }
}

export const siPayService = new SiPayService();
