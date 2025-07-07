import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface IkasProduct {
  id: string;
  name: string;
  description: string;
  totalStock: number | null;
  weight: number | null;
  brand?: {
    id: string;
    name: string;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    prices: Array<{
      sellPrice: number;
    }>;
  }>;
}

interface ProductData {
  id: number;
  name: string;
  description?: string; // ✅ API'den gelen açıklama alanı
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  features: string[];
  stock?: number;
  brand?: string;
}

interface IkasContextType {
  products: ProductData[];
  setProducts: (products: ProductData[]) => void;
  firstProduct: ProductData | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  fetchProducts: () => Promise<void>; // ✅ Fetch fonksiyonu eklendi
  retryFetchProducts: () => Promise<void>; // ✅ Retry fonksiyonu eklendi
}

const IkasContext = createContext<IkasContextType | undefined>(undefined);

export const IkasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const firstProduct = products.length > 0 ? products[0] : null;

  // ✅ PHP API'den ürünleri getirme fonksiyonu
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 PHP API\'den ürünler getiriliyor...');
      
      // Environment'a göre URL belirleme
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isDev ? '/ikas_products.php' : 'https://calformat.com/ikas_products.php';
      
      console.log('🌍 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        cache: 'no-cache',
        signal: AbortSignal.timeout(30000) // 30 saniye timeout
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ürünler API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📄 Ürünler API raw response preview:', responseText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Raw response excerpt:', responseText.substring(0, 500));
        throw new Error(`JSON Parse Error: ${parseError}`);
      }
      
      console.log('📦 PHP API Response:', data);

      // PHP API response format kontrolü
      if (data.success && data.data) {
        // Başarılı response
        const ikasProducts = data.data;
        const transformedProducts: ProductData[] = ikasProducts.map((product: IkasProduct, index: number) => ({
          id: parseInt(product.id) || index + 1,
          name: product.name || 'İsimsiz Ürün',
          description: product.description || undefined, // ✅ API'den gelen açıklama
          price: product.variants?.[0]?.prices?.[0]?.sellPrice || 299.99,
          image: 'https://www.calformat.com/calformat.webp',
          rating: 4.8,
          reviewCount: 2847,
          features: [
            '%100 Doğal İçerik',
            'Pestisit Temizleyici', 
            'Balmumu Çözücü',
            'Mikrop Öldürücü',
            'Kolay Kullanım'
          ],
          stock: product.totalStock || 0,
          brand: product.brand?.name || 'CalFormat'
        }));

        setProducts(transformedProducts);
        console.log('✅ Ürünler başarıyla yüklendi:', transformedProducts.length);
        
      } else if (data.fallback_data) {
        // Fallback data kullan
        console.warn('⚠️ Ürünler API hatası, fallback data kullanılıyor:', data.message);
        
        const fallbackProducts = data.fallback_data || [];
        
        if (fallbackProducts.length > 0) {
          const transformedProducts: ProductData[] = fallbackProducts.map((product: any, index: number) => ({
            id: parseInt(product.id) || index + 1,
            name: product.name || 'CalFormat Ürün',
            description: product.description || undefined, // ✅ Fallback description
            price: product.variants?.[0]?.prices?.sellPrice || product.variants?.[0]?.prices?.[0]?.sellPrice || 299.99,
            image: 'https://www.calformat.com/calformat.webp',
            rating: 4.8,
            reviewCount: 2847,
            features: ['%100 Doğal İçerik', 'Pestisit Temizleyici', 'Balmumu Çözücü'],
            stock: product.totalStock || 50,
            brand: product.brand?.name || 'CalFormat'
          }));
          
          setProducts(transformedProducts);
          console.log('✅ Fallback ürünler yüklendi:', transformedProducts.length);
        } else {
          // Son çare: hard-coded fallback
          const hardcodedProducts: ProductData[] = [
            {
              id: 1,
              name: 'CalFormat Meyve Sebze Temizleme Tozu - 1kg',
              description: 'Doğal bileşenlerle hazırlanmış özel formülümüz ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyin. %100 doğal içerikli, güvenli ve etkili temizlik çözümü.',
              price: 299.99,
              image: 'https://www.calformat.com/calformat.webp',
              rating: 4.8,
              reviewCount: 2847,
              features: ['%100 Doğal İçerik', 'Pestisit Temizleyici', 'Balmumu Çözücü'],
              stock: 50,
              brand: 'CalFormat'
            }
          ];
          
          setProducts(hardcodedProducts);
        }
        
        setError(`API Uyarısı: ${data.message || 'Veri alınamadı'}`);
      } else {
        throw new Error(data.message || 'Beklenmeyen response formatı');
      }

    } catch (err) {
      console.error('❌ Ürün getirme hatası:', err);
      setError(err instanceof Error ? err.message : 'Ürünler yüklenirken hata oluştu');
        // Hata durumunda da fallback data göster
      const fallbackProducts: ProductData[] = [
        {
          id: 1,
          name: 'CalFormat Meyve Sebze Temizleme Tozu',
          description: 'Doğal bileşenlerle hazırlanmış özel formülümüz ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyin. %100 doğal içerikli, güvenli ve etkili temizlik çözümü.',
          price: 299.99,
          image: 'https://www.calformat.com/calformat.webp',
          rating: 4.8,
          reviewCount: 2847,
          features: ['%100 Doğal', 'Pestisit Temizleyici', 'Güvenli'],
          stock: 50,
          brand: 'CalFormat'
        }
      ];
      
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  // Retry fonksiyonu
  const retryFetchProducts = async () => {
    console.log('🔄 Ürünler tekrar getiriliyor...');
    await fetchProducts();
  };

  // ✅ Component mount olduğunda ürünleri getir
  React.useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <IkasContext.Provider value={{
      products,
      setProducts,
      firstProduct,
      loading,
      setLoading,
      error,
      setError,
      fetchProducts, // ✅ Fetch fonksiyonunu da provide et
      retryFetchProducts // ✅ Retry fonksiyonunu da provide et
    }}>
      {children}
    </IkasContext.Provider>
  );
};

export const useIkas = () => {
  const context = useContext(IkasContext);
  if (context === undefined) {
    throw new Error('useIkas must be used within an IkasProvider');
  }
  return context;
};
