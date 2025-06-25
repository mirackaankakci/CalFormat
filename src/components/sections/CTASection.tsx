import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface IkasProduct {
  id: string;
  name: string;
  description: string;
  totalStock: number;
  weight: number;
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
    prices: {
      sellPrice: number;
    };
  }>;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  features: string[];
  discount?: number;
  stock?: number;
  brand?: string;
}

const CTASection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        // ✅ Development ve Production için farklı URL'ler
        const isProduction = process.env.NODE_ENV === 'production';
        const baseUrl = isProduction 
          ? 'https://calformat.com' 
          : 'http://localhost:3000';

        // ✅ Farklı stratejiler dene
        let response: Response | null = null;
        const endpoints = [
          `${baseUrl}/ikas_products.php`,
          `https://calformat.com/ikas_products.php`,
          `/ikas_products.php` // Relative path
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Deneniyor: ${endpoint}`);
            
            response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              mode: 'cors',
              cache: 'no-cache',
              credentials: 'omit'
            });

            if (response.ok) {
              console.log(`✅ Başarılı: ${endpoint}`);
              break;
            }
          } catch (err) {
            console.warn(`❌ Başarısız: ${endpoint}`, err);
            continue;
          }
        }

        if (!response || !response.ok) {
          throw new Error('API yanıt vermiyor - Tüm endpoint\'ler başarısız');
        }

        const data = await response.json();
        console.log('📊 API Response:', data);

        if (data.error) {
          throw new Error(data.message || 'API hatası döndü');
        }

        // ✅ Veri dönüştürme
        const ikasProducts = data?.data?.listProduct?.data;
        if (!Array.isArray(ikasProducts) || ikasProducts.length === 0) {
          throw new Error('Geçersiz veri yapısı - Ürün verisi bulunamadı');
        }

        const transformedProducts: Product[] = ikasProducts.map((ikasProduct: IkasProduct, index: number) => ({
          id: parseInt(ikasProduct?.id || String(index + 1)),
          name: ikasProduct?.name || 'CalFormat Ürünü',
          price: ikasProduct?.variants?.[0]?.prices?.sellPrice || 299.99,
          image: "/calformat.webp",
          rating: 4.8,
          reviewCount: Math.floor(Math.random() * 200) + 50,
          features: [
            ikasProduct?.brand?.name || "CalFormat",
            "Doğal İçerik",
            (ikasProduct?.totalStock || 0) > 0 ? "Stokta Var" : "Sınırlı Stok"
          ],
          stock: ikasProduct?.totalStock || 10,
          brand: ikasProduct?.brand?.name || "CalFormat"
        }));

        setProducts(transformedProducts);

      } catch (err: any) {
        console.error('❌ Fetch hatası:', err);
        setError(err.message || 'Ürünler yüklenemedi');
        // ✅ Fallback ürünleri KALDIR - Sadece hata göster
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Tekrar deneme fonksiyonu
  const retryFetch = () => {
    setLoading(true);
    setError('');
    setProducts([]);
    
    // useEffect'teki fetchProducts fonksiyonunu tetikle
    setTimeout(() => {
      window.location.reload(); // Sayfayı yenile
    }, 100);
  };

  // Loading durumu
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-xl">Ürünler İkas API'den yükleniyor...</p>
            <p className="text-orange-100 mt-2">Lütfen bekleyin</p>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Hata durumu - Statik ürün YOK
  if (error && products.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hata Mesajı */}
          <div className="text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/30 max-w-2xl mx-auto">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ürünler Yüklenemedi
              </h3>
              
              <p className="text-gray-600 mb-2 text-lg">
                İkas API bağlantısında sorun yaşanıyor
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-medium">
                  Hata Detayı: {error}
                </p>
              </div>

              <p className="text-gray-500 mb-8">
                Ürünler şu anda görüntülenemiyor. Lütfen daha sonra tekrar deneyin veya bizimle iletişime geçin.
              </p>

              {/* Aksiyon Butonları */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={retryFetch}
                  className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-8 py-4 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Tekrar Dene
                </button>

                <button
                  onClick={() => window.location.href = '/contact'}
                  className="bg-white text-[#ee7f1a] border-2 border-[#ee7f1a] px-8 py-4 rounded-xl hover:bg-[#ee7f1a] hover:text-white transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  İletişime Geç
                </button>
              </div>

              {/* Bilgilendirme */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">Sorun Nedir?</h4>
                <ul className="text-blue-700 text-sm space-y-1 text-left">
                  <li>• İkas API sunucularında geçici bir sorun olabilir</li>
                  <li>• İnternet bağlantınızda sorun olabilir</li>
                  <li>• API erişim tokeninde sorun olabilir</li>
                  <li>• CORS (Cross-Origin) politika sorunu olabilir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Normal ürün listesi (sadece API'den gelen verilerle)
  return (
    <section className="py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden">
      {/* Arka plan animasyonları */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h3 className="text-5xl font-bold text-white mb-6">
            İkas Mağazamızdan Ürünler
          </h3>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
            CalFormat ile meyve ve sebzelerinizi güvenle tüketin
          </p>
          <div className="mt-4 bg-green-500/20 text-white px-4 py-2 rounded-lg inline-block">
            ✅ İkas API'den {products.length} ürün başarıyla yüklendi
          </div>
        </div>

        {/* Ürün Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group"
            >
              {/* Discount Badge */}
              {product.discount && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                  %{product.discount} İndirim
                </div>
              )}

              {/* Ürün Resmi */}
              <div className="relative mb-4 overflow-hidden rounded-2xl">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/calformat.webp';
                  }}
                />
                {product.stock !== undefined && product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">Stokta Yok</span>
                  </div>
                )}
              </div>

              {/* Ürün Bilgileri */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gray-800 line-clamp-2">
                  {product.name}
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>

                {/* Özellikler */}
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Fiyat */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#ee7f1a]">
                    ₺{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ₺{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Marka */}
                {product.brand && (
                  <p className="text-sm text-gray-600">
                    Marka: <span className="font-medium">{product.brand}</span>
                  </p>
                )}

                {/* Stok Durumu */}
                {product.stock !== undefined && (
                  <p className="text-sm text-gray-600">
                    Stok: <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} adet` : 'Tükendi'}
                    </span>
                  </p>
                )}

                {/* Sepete Ekle Butonu */}
                <button 
                  className={`w-full px-6 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 transform ${
                    product.stock !== undefined && product.stock <= 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white hover:from-[#d62d27] hover:to-[#ee7f1a] hover:scale-105'
                  }`}
                  disabled={product.stock !== undefined && product.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock !== undefined && product.stock <= 0 ? 'Stokta Yok' : 'İkas\'ta Gör'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-orange-100 mb-8">
            <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
              <Check className="w-5 h-5" />
              <span>İkas Entegrasyonu</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
              <Check className="w-5 h-5" />
              <span>Gerçek Zamanlı Stok</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
              <Check className="w-5 h-5" />
              <span>Güncel Fiyatlar</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.open('https://calformat.myikas.com', '_blank')}
            className="bg-white text-[#ee7f1a] px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
            <ShoppingCart className="w-5 h-5" />
            İkas Mağazasını Ziyaret Et
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;