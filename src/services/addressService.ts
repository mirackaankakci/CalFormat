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

class AddressService {
  private baseUrl = "https://calformat.com/"
  
  // Cache for loaded data
  private citiesCache: City[] = [];
  private districtsCache: District[] = [];

  // Environment bazlı URL belirleme
  private getBaseUrl(): string {
    const isDev = window.location.hostname === 'localhost';
    
    if (isDev) {
      // Development: Vite proxy kullan
      return '';
    } else {
      // Production: public klasörüne işaret et
      return '/';
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
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('İller başarıyla yüklendi:', result.data.length, 'adet');
        this.citiesCache = result.data || [];
        return result.data || [];
      } else {
        throw new Error(result.error || 'İller yüklenemedi');
      }
    } catch (error) {
      console.error('İller yüklenirken hata:', error);
      // Fallback data
      const fallbackCities = [
        { id: 'dcb9135c-4b84-4c06-9a42-f359317a9b78', name: 'İstanbul' },
        { id: 'ankara-id', name: 'Ankara' },
        { id: 'izmir-id', name: 'İzmir' }
      ];
      this.citiesCache = fallbackCities;
      return fallbackCities;
    }
  }

  // İlçeleri getir (PHP endpoint kullanarak)
  async getDistricts(cityId: string): Promise<District[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ikas_districts.php?cityId=${encodeURIComponent(cityId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit', // CORS için
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`İlçeler başarıyla yüklendi (${cityId}):`, result.data.length, 'adet');
        this.districtsCache = result.data || [];
        return result.data || [];
      } else {
        throw new Error(result.error || 'İlçeler yüklenemedi');
      }
    } catch (error) {
      console.error('İlçeler yüklenirken hata:', error);
      // Fallback data
      const fallbackDistricts = [
        { id: '2a4e8b8c-f3c9-4e8d-9f7a-8b2c3d4e5f6g', name: 'Kadıköy' },
        { id: 'besiktas-id', name: 'Beşiktaş' },
        { id: 'sisli-id', name: 'Şişli' }
      ];
      this.districtsCache = fallbackDistricts;
      return fallbackDistricts;
    }
  }

  // Mahalleri getir (PHP endpoint kullanarak)
  async getTowns(districtId: string): Promise<Town[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ikas_towns.php?districtId=${encodeURIComponent(districtId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit', // CORS için
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Mahalleler başarıyla yüklendi (${districtId}):`, result.data.length, 'adet');
        return result.data || [];
      } else {
        throw new Error(result.error || 'Mahalleler yüklenemedi');
      }
    } catch (error) {
      console.error('Mahalleler yüklenirken hata:', error);
      // Fallback data
      return [
        { id: 'caddebostan-town-id', name: 'Caddebostan' },
        { id: 'fenerbahce-town-id', name: 'Fenerbahçe' },
        { id: 'goztepe-town-id', name: 'Göztepe' }
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
