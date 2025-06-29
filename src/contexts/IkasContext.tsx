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
      
      const response = await fetch('http://localhost:8080/ikas_products.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }      const data = await response.json();
      console.log('📦 PHP API Response:', data);

      // PHP API response format kontrolü
      if (data.success && data.data?.listProduct?.data) {
        // Başarılı response
        const ikasProducts = data.data.listProduct.data;
          const transformedProducts: ProductData[] = ikasProducts.map((product: IkasProduct, index: number) => ({
          id: parseInt(product.id) || index + 1,
          name: product.name || 'İsimsiz Ürün',
          description: product.description || undefined, // ✅ API'den gelen açıklama
          price: product.variants?.[0]?.prices?.[0]?.sellPrice || 299.99,
          image: 'https://www.calformat.com.tr/calformat.webp',
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
        
      } else if (data.error || !data.success) {
        // Hata durumu - fallback data kullan
        console.warn('⚠️ API hatası, fallback data kullanılıyor:', data.message);
        
        // PHP'den dönen fallback data'yı kullan
        const fallbackProducts = data.data?.listProduct?.data || [];
        
        if (fallbackProducts.length > 0) {          const transformedProducts: ProductData[] = fallbackProducts.map((product: any, index: number) => ({
            id: parseInt(product.id) || index + 1,
            name: product.name || 'CalFormat Ürün',
            description: product.description || undefined, // ✅ Fallback description
            price: product.variants?.[0]?.prices?.sellPrice || product.variants?.[0]?.prices?.[0]?.sellPrice || 299.99,
            image: 'https://www.calformat.com.tr/calformat.webp',
            rating: 4.8,
            reviewCount: 2847,
            features: ['%100 Doğal İçerik', 'Pestisit Temizleyici', 'Balmumu Çözücü'],
            stock: product.totalStock || 50,
            brand: product.brand?.name || 'CalFormat'
          }));
          
          setProducts(transformedProducts);
          console.log('✅ Fallback ürünler yüklendi:', transformedProducts.length);
        } else {          // Son çare: hard-coded fallback
          const hardcodedProducts: ProductData[] = [
            {
              id: 1,
              name: 'CalFormat Meyve Sebze Temizleme Tozu - 1kg',
              description: 'Doğal bileşenlerle hazırlanmış özel formülümüz ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyin. %100 doğal içerikli, güvenli ve etkili temizlik çözümü.',
              price: 299.99,
              image: 'https://www.calformat.com.tr/calformat.webp',
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
        throw new Error('Beklenmeyen response formatı');
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
          image: 'https://www.calformat.com.tr/calformat.webp',
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
      fetchProducts // ✅ Fetch fonksiyonunu da provide et
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
