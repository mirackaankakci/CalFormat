export interface State {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Town {
  id: string;
  name: string;
}

// API Response interface'leri
export interface ApiResponse<T> {
  success: boolean;
  data?: T[];
  count?: number;
  message?: string;
  error?: boolean;
  fallback_data?: T[];
  api_info?: {
    token_method: string;
    city_method?: string;
    district_method?: string;
    town_method?: string;
    token_obtained: boolean;
    graphql_url: string;
  };
  debug_info?: any;
  timestamp?: string;
}

class AddressService {
  private baseUrl: string;
  
  // Cache for loaded data
  private citiesCache: City[] = [];
  private districtsCache: District[] = [];

  constructor() {
    this.baseUrl = this.getBaseUrl();
  }

  // Environment bazlı URL belirleme
  private getBaseUrl(): string {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
      // Development: Vite proxy kullan (proxy ayarları vite.config.ts'de)
      return '';
    } else {
      // Production: calformat.com domain
      return 'https://calformat.com';
    }
  }

  // İlleri getir (PHP endpoint kullanarak)
  async getCities(): Promise<City[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ikas_cities.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit', // CORS için
        cache: 'no-cache',
        signal: AbortSignal.timeout(30000) // 30 saniye timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<City> = await response.json();
      
      if (result.success && result.data) {
        console.log('İller başarıyla yüklendi:', result.data.length, 'adet');
        this.citiesCache = result.data || [];
        return result.data || [];
      } else if (result.fallback_data) {
        // Fallback data kullan
        console.warn('İller API hatası, fallback data kullanılıyor:', result.message);
        this.citiesCache = result.fallback_data || [];
        return result.fallback_data || [];
      } else {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : undefined) || 'İller yüklenemedi');
      }
    } catch (error) {
      console.error('İller yüklenirken hata:', error);
      // Fallback data - İkas UUID formatında
      const fallbackCities = [
        { id: 'fb123456-7890-abcd-ef12-345678901001', name: 'İstanbul' },
        { id: 'fb123456-7890-abcd-ef12-345678901002', name: 'Ankara' },
        { id: 'fb123456-7890-abcd-ef12-345678901003', name: 'İzmir' },
        { id: 'fb123456-7890-abcd-ef12-345678901004', name: 'Bursa' },
        { id: 'fb123456-7890-abcd-ef12-345678901005', name: 'Antalya' },
        { id: 'fb123456-7890-abcd-ef12-345678901006', name: 'Kocaeli' },
        { id: 'fb123456-7890-abcd-ef12-345678901007', name: 'Konya' },
        { id: 'fb123456-7890-abcd-ef12-345678901008', name: 'Trabzon' }
      ];
      this.citiesCache = fallbackCities;
      return fallbackCities;
    }
  }

  // İlçeleri getir (PHP endpoint kullanarak)
  async getDistricts(cityId: string): Promise<District[]> {
    try {
      console.log('🔍 İlçeler yükleniyor - cityId:', cityId);
      
      if (!cityId || cityId.trim() === '') {
        throw new Error('cityId boş veya undefined');
      }
      
      const url = `${this.baseUrl}/ikas_districts_new.php?cityId=${encodeURIComponent(cityId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        cache: 'no-cache',
        signal: AbortSignal.timeout(30000)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ İlçeler API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📄 İlçeler API raw response preview:', responseText.substring(0, 200) + '...');
      
      let result: ApiResponse<District>;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Raw response excerpt:', responseText.substring(0, 500));
        throw new Error(`JSON Parse Error: ${parseError}`);
      }
      
      if (result.success && result.data) {
        console.log(`✅ İlçeler başarıyla yüklendi (${cityId}):`, result.data.length, 'adet');
        this.districtsCache = result.data || [];
        return result.data || [];
      } else if (result.fallback_data) {
        // Fallback data kullan
        console.warn(`⚠️ İlçeler API hatası (${cityId}), fallback data kullanılıyor:`, result.message);
        this.districtsCache = result.fallback_data || [];
        return result.fallback_data || [];
      } else {
        // API'den dönen hata mesajını logla ama fallback data ile devam et
        console.error(`❌ İlçeler API response (${cityId}):`, result);
        throw new Error(result.message || result.debug_info?.error_message || 'İlçeler yüklenemedi');
      }
    } catch (error) {
      console.error('❌ İlçeler yüklenirken hata:', error);
      // Fallback data - İkas UUID formatında
      const fallbackDistricts = [
        { id: 'fb123456-7890-abcd-ef12-345678901234', name: 'Kadıköy' },
        { id: 'fb123456-7890-abcd-ef12-345678901235', name: 'Beşiktaş' },
        { id: 'fb123456-7890-abcd-ef12-345678901236', name: 'Şişli' },
        { id: 'fb123456-7890-abcd-ef12-345678901237', name: 'Üsküdar' },
        { id: 'fb123456-7890-abcd-ef12-345678901238', name: 'Fatih' },
        { id: 'fb123456-7890-abcd-ef12-345678901239', name: 'Bakırköy' },
        { id: 'fb123456-7890-abcd-ef12-345678901240', name: 'Beyoğlu' },
        { id: 'fb123456-7890-abcd-ef12-345678901241', name: 'Ataşehir' },
        { id: 'fb123456-7890-abcd-ef12-345678901242', name: 'Beykoz' }
      ];
      this.districtsCache = fallbackDistricts;
      return fallbackDistricts;
    }
  }

  // Mahalleri getir (PHP endpoint kullanarak)
  async getTowns(districtId: string): Promise<Town[]> {
    try {
      const url = `${this.baseUrl}/ikas_towns.php?districtId=${encodeURIComponent(districtId)}`;
      console.log('🏘️ Mahalleler API çağrısı:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit', // CORS için
        cache: 'no-cache',
        signal: AbortSignal.timeout(30000) // 30 saniye timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mahalleler API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result: ApiResponse<Town> = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Mahalleler başarıyla yüklendi (${districtId}):`, result.data.length, 'adet');
        return result.data || [];
      } else if (result.fallback_data) {
        // Fallback data kullan
        console.warn(`⚠️ Mahalleler API hatası (${districtId}), fallback data kullanılıyor:`, result.message);
        return result.fallback_data || [];
      } else {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : undefined) || 'Mahalleler yüklenemedi');
      }
    } catch (error) {
      console.error('❌ Mahalleler yüklenirken hata:', error);
      // Fallback data - İkas UUID formatında
      return [
        { id: 'fb123456-7890-abcd-ef12-345678901301', name: 'Caferağa Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901302', name: 'Fenerbahçe Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901303', name: 'Kozyatağı Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901304', name: 'Bostancı Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901305', name: 'Göztepe Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901306', name: 'Acıbadem Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901307', name: 'Suadiye Mahallesi' },
        { id: 'fb123456-7890-abcd-ef12-345678901308', name: 'Erenköy Mahallesi' }
      ];
    }
  }

  // Helper: ID'den şehir adı al
  getCityNameById(cityId: string): string {
    const city = this.citiesCache.find(c => c.id === cityId);
    return city?.name || 'İstanbul';
  }

  // Helper: ID'den ilçe adı al
  getDistrictNameById(districtId: string): string {
    const district = this.districtsCache.find(d => d.id === districtId);
    return district?.name || 'Kadıköy';
  }
}

export const addressService = new AddressService();
