/**
 * Config Service - Backend ayarlarını frontend'e getiren servis
 */

export interface ShippingConfig {
  default_shipping_cost: number;
  free_shipping_threshold: number;
  currency: string;
}

export interface AppConfig {
  general: {
    currency: string;
    default_shipping_cost: number;
    free_shipping_threshold: number;
    timezone: string;
    debug_mode: boolean;
  };
}

class ConfigService {
  private config: AppConfig | null = null;
  private loading: boolean = false;

  /**
   * Backend'den config ayarlarını al
   */
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config!;
    }

    if (this.loading) {
      // Loading durumunda bekle
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.config!;
    }

    this.loading = true;

    try {
      // Önce localStorage'dan kontrol et (cache)
      const cachedConfig = localStorage.getItem('app_config');
      const cacheTime = localStorage.getItem('app_config_time');
      
      // Cache 1 saat geçerli
      if (cachedConfig && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
        this.config = JSON.parse(cachedConfig);
        this.loading = false;
        return this.config!;
      }

      // Backend'den config al
      try {
        const response = await fetch('/api/config.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.config = data;
        } else {
          throw new Error('Config API hatası');
        }
      } catch (apiError) {
        console.warn('Config API\'den veri alınamadı, varsayılan değerler kullanılıyor:', apiError);
        
        // API hata durumunda varsayılan değerler
        this.config = {
          general: {
            currency: 'TRY',
            default_shipping_cost: 0.0,
            free_shipping_threshold: 0.0,
            timezone: 'Europe/Istanbul',
            debug_mode: false
          }
        };
      }

      // Cache'le
      localStorage.setItem('app_config', JSON.stringify(this.config));
      localStorage.setItem('app_config_time', Date.now().toString());

      return this.config ?? {
        general: {
          currency: 'TRY',
          default_shipping_cost: 0.0,
          free_shipping_threshold: 0.0,
          timezone: 'Europe/Istanbul',
          debug_mode: false
        }
      };

    } catch (error) {
      console.error('Config yüklenemedi:', error);
      
      // Hata durumunda varsayılan değerler
      this.config = {
        general: {
          currency: 'TRY',
          default_shipping_cost: 29.90,
          free_shipping_threshold: 150.00,
          timezone: 'Europe/Istanbul',
          debug_mode: false
        }
      };

      return this.config;

    } finally {
      this.loading = false;
    }
  }

  /**
   * Kargo ücretini hesapla
   */
  async calculateShipping(subtotal: number): Promise<{ cost: number; isFree: boolean }> {
    const config = await this.getConfig();
    const threshold = config.general.free_shipping_threshold;
    const cost = config.general.default_shipping_cost;

    if (subtotal >= threshold) {
      return { cost: 0, isFree: true };
    }

    return { cost, isFree: false };
  }

  /**
   * Kargo ayarlarını al
   */
  async getShippingConfig(): Promise<ShippingConfig> {
    const config = await this.getConfig();
    return {
      default_shipping_cost: config.general.default_shipping_cost,
      free_shipping_threshold: config.general.free_shipping_threshold,
      currency: config.general.currency
    };
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    localStorage.removeItem('app_config');
    localStorage.removeItem('app_config_time');
    this.config = null;
  }

  /**
   * Kargo ayarlarını güncelle (admin paneli için)
   */
  async updateShippingConfig(newConfig: Partial<ShippingConfig>): Promise<boolean> {
    try {
      // Config verilerini hazırla
      const configData = {
        general: {
          ...(newConfig.default_shipping_cost !== undefined && { default_shipping_cost: newConfig.default_shipping_cost }),
          ...(newConfig.free_shipping_threshold !== undefined && { free_shipping_threshold: newConfig.free_shipping_threshold }),
          ...(newConfig.currency !== undefined && { currency: newConfig.currency })
        }
      };

      // Backend'e POST request gönder
      const response = await fetch('/api/config.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Cache'i temizle ve yeni config'i yükle
          this.clearCache();
          
          // Yeni config'i hemen yükle
          this.config = result.data;
          
          // localStorage'a da kaydet
          localStorage.setItem('app_config', JSON.stringify(result.data));
          localStorage.setItem('app_config_time', Date.now().toString());
          
          return true;
        } else {
          console.error('Config güncellenemedi:', result.message);
          return false;
        }
      } else {
        const errorText = await response.text();
        console.error('Config API hatası:', response.status, errorText);
        return false;
      }

    } catch (error) {
      console.error('Kargo ayarları güncellenemedi:', error);
      return false;
    }
  }
}

// Singleton pattern
const configService = new ConfigService();
export default configService;
