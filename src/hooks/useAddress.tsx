import { useState, useEffect } from 'react';
import { addressService, type City, type District, type Town } from '../services/addressService';

export const useAddress = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedTown, setSelectedTown] = useState<string>('');

  const [loading, setLoading] = useState({
    cities: false,
    districts: false,
    towns: false
  });

  const [errors, setErrors] = useState({
    cities: null as string | null,
    districts: null as string | null,
    towns: null as string | null
  });

  // Helper: Seçili şehir/ilçe/mahalle isimlerini getir
  const getSelectedNames = () => {
    const cityName = cities.find(c => c.id === selectedCity)?.name || addressService.getCityNameById(selectedCity);
    const districtName = districts.find(d => d.id === selectedDistrict)?.name || addressService.getDistrictNameById(selectedDistrict);
    const townName = towns.find(t => t.id === selectedTown)?.name || '';
    
    return { cityName, districtName, townName };
  };

  // İlleri yükle
  const loadCities = async () => {
    setLoading(prev => ({ ...prev, cities: true }));
    setErrors(prev => ({ ...prev, cities: null }));
    try {
      const cityList = await addressService.getCities();
      setCities(cityList);
    } catch (error) {
      console.error('İller yüklenirken hata:', error);
      setErrors(prev => ({ 
        ...prev, 
        cities: error instanceof Error ? error.message : 'İller yüklenirken hata oluştu' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  // İl seçildiğinde ilçeleri yükle
  const loadDistricts = async (cityId: string) => {
    console.log('🏙️ İlçeler yükleniyor - cityId:', cityId);
    
    setLoading(prev => ({ ...prev, districts: true }));
    setErrors(prev => ({ ...prev, districts: null }));
    setDistricts([]);
    setTowns([]);
    setSelectedDistrict('');
    setSelectedTown('');
    
    try {
      const districtList = await addressService.getDistricts(cityId);
      console.log('✅ İlçeler yüklendi:', districtList.length, 'adet');
      setDistricts(districtList);
    } catch (error) {
      console.error('❌ İlçeler yüklenirken hata:', error);
      setErrors(prev => ({ 
        ...prev, 
        districts: error instanceof Error ? error.message : 'İlçeler yüklenirken hata oluştu' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  useEffect(() => {
    console.log('🔄 İl seçimi değişti:', selectedCity);
    
    if (selectedCity) {
      loadDistricts(selectedCity);
    } else {
      setDistricts([]);
      setTowns([]);
      setSelectedDistrict('');
      setSelectedTown('');
    }
  }, [selectedCity]);

  // İlçe seçildiğinde mahalleleri yükle
  const loadTowns = async (districtId: string) => {
    setLoading(prev => ({ ...prev, towns: true }));
    setErrors(prev => ({ ...prev, towns: null }));
    setTowns([]);
    setSelectedTown('');
    
    try {
      const townList = await addressService.getTowns(districtId);
      setTowns(townList);
    } catch (error) {
      console.error('Mahalleler yüklenirken hata:', error);
      setErrors(prev => ({ 
        ...prev, 
        towns: error instanceof Error ? error.message : 'Mahalleler yüklenirken hata oluştu' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, towns: false }));
    }
  };

  useEffect(() => {
    if (selectedDistrict) {
      loadTowns(selectedDistrict);
    } else {
      setTowns([]);
      setSelectedTown('');
    }
  }, [selectedDistrict]);

  return {
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
    errors,
    getSelectedNames,
    // Retry functions
    retryCities: loadCities,
    retryDistricts: () => selectedCity && loadDistricts(selectedCity),
    retryTowns: () => selectedDistrict && loadTowns(selectedDistrict)
  };
};
