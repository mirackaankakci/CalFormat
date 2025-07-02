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

  // Helper: Seçili şehir/ilçe/mahalle isimlerini getir
  const getSelectedNames = () => {
    const cityName = cities.find(c => c.id === selectedCity)?.name || addressService.getCityNameById(selectedCity);
    const districtName = districts.find(d => d.id === selectedDistrict)?.name || addressService.getDistrictNameById(selectedDistrict);
    const townName = towns.find(t => t.id === selectedTown)?.name || '';
    
    return { cityName, districtName, townName };
  };

  // İlleri yükle
  useEffect(() => {
    const loadCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        const cityList = await addressService.getCities();
        setCities(cityList);
      } catch (error) {
        console.error('İller yüklenirken hata:', error);
      } finally {
        setLoading(prev => ({ ...prev, cities: false }));
      }
    };

    loadCities();
  }, []);

  // İl seçildiğinde ilçeleri yükle
  useEffect(() => {
    if (selectedCity) {
      const loadDistricts = async () => {
        setLoading(prev => ({ ...prev, districts: true }));
        setDistricts([]);
        setTowns([]);
        setSelectedDistrict('');
        setSelectedTown('');
        
        try {
          const districtList = await addressService.getDistricts(selectedCity);
          setDistricts(districtList);
        } catch (error) {
          console.error('İlçeler yüklenirken hata:', error);
        } finally {
          setLoading(prev => ({ ...prev, districts: false }));
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
      setTowns([]);
      setSelectedDistrict('');
      setSelectedTown('');
    }
  }, [selectedCity]);

  // İlçe seçildiğinde mahalleleri yükle
  useEffect(() => {
    if (selectedDistrict) {
      const loadTowns = async () => {
        setLoading(prev => ({ ...prev, towns: true }));
        setTowns([]);
        setSelectedTown('');
        
        try {
          const townList = await addressService.getTowns(selectedDistrict);
          setTowns(townList);
        } catch (error) {
          console.error('Mahalleler yüklenirken hata:', error);
        } finally {
          setLoading(prev => ({ ...prev, towns: false }));
        }
      };

      loadTowns();
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
    getSelectedNames
  };
};
