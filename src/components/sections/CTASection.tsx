import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, Star, Loader2, AlertCircle, RefreshCw, Leaf, Shield, Zap, Award, Truck, Phone } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useIkas } from '../../contexts/IkasContext';

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
    prices: Array<{  // ✅ Prices artık array
      sellPrice: number;
    }>;
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
  variants?: Array<{id: string}>;
}

const CTASection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { products: ikasProducts, loading: ikasLoading, error: ikasError, retryFetchProducts } = useIkas();
  // ✅ Sepete ekleme fonksiyonu
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variantId: product.variants?.[0]?.id || "7868c357-4726-432a-ad5d-49619e6a508b" // Fallback variant ID
    });
    
    // Basit bildirim
    if (window.confirm(`${product.name} sepete eklendi! Sepeti görüntülemek ister misiniz?`)) {
      navigate('/cart');
    }
  };

  // IkasContext'ten gelen verileri Product formatına dönüştür
  useEffect(() => {
    if (ikasProducts && ikasProducts.length > 0) {
      const transformedProducts: Product[] = ikasProducts.map((ikasProduct, index) => ({
        id: ikasProduct.id,
        name: ikasProduct.name || 'CalFormat Ürünü',
        price: ikasProduct.price,
        image: ikasProduct.image || "/calformat.webp",
        rating: ikasProduct.rating || 4.8,
        reviewCount: ikasProduct.reviewCount || 100,
        features: ikasProduct.features || ["Doğal İçerik", "Kaliteli", "Güvenli"],
        stock: ikasProduct.stock ?? 999,
        brand: ikasProduct.brand || "CalFormat",
        variants: [{ id: "7868c357-4726-432a-ad5d-49619e6a508b" }] // Fallback variant
      }));
      
      setProducts(transformedProducts);
      setLoading(false);
      setError('');
    } else if (ikasError) {
      setLoading(false);
      setError(ikasError);
    } else {
      setLoading(ikasLoading);
    }
  }, [ikasProducts, ikasLoading, ikasError]);

  // ✅ Tekrar deneme fonksiyonu
  const retryFetch = () => {
    console.log('🔄 Ürünler yeniden getiriliyor...');
    retryFetchProducts();
  };
  // Loading durumu
  if (loading) {
    return (
      <section className="py-32 md:py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white">
            <div className="relative inline-block">
              <Loader2 className="w-16 h-16 md:w-12 md:h-12 animate-spin mx-auto mb-6" />
              <div className="absolute inset-0 w-16 h-16 md:w-12 md:h-12 border-2 border-white/20 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-3xl md:text-xl font-bold mb-4">Ürünler Yükleniyor</h3>
            <p className="text-lg md:text-base">İkas API'den en güncel ürün bilgileri getiriliyor...</p>
            <p className="text-orange-100 mt-3 text-base md:text-sm">Lütfen bekleyin, bu birkaç saniye sürebilir</p>
            
            {/* Mobil için ek loading indicator */}
            <div className="mt-8 md:hidden">
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  // ✅ Hata durumu - Statik ürün YOK
  if (error && products.length === 0) {
    return (
      <section className="py-40 md:py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden min-h-screen md:min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hata Mesajı */}
          <div className="text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 max-w-2xl mx-auto">
              <div className="relative mb-6">
                <AlertCircle className="w-20 h-20 md:w-16 md:h-16 text-red-500 mx-auto" />
                <div className="absolute inset-0 w-20 h-20 md:w-16 md:h-16 border-2 border-red-200 rounded-full animate-ping mx-auto"></div>
              </div>
              
              <h3 className="text-4xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-4">
                Ürünler Yüklenemedi
              </h3>
              
              <p className="text-gray-600 mb-4 text-xl md:text-lg">
                İkas API bağlantısında sorun yaşanıyor
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-4 mb-8 md:mb-6">
                <p className="text-red-700 font-medium text-lg md:text-base">
                  <Shield className="w-5 h-5 inline mr-2" />
                  Hata Detayı: {error}
                </p>
              </div>

              <p className="text-gray-500 mb-10 md:mb-8 text-lg md:text-base">
                Ürünler şu anda görüntülenemiyor. Lütfen daha sonra tekrar deneyin veya bizimle iletişime geçin.
              </p>

              {/* Aksiyon Butonları */}
              <div className="flex flex-col gap-6 md:gap-4 justify-center">
                <button
                  onClick={retryFetch}
                  className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-10 py-6 md:px-8 md:py-4 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-bold text-xl md:text-lg shadow-lg flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-6 h-6 md:w-5 md:h-5" />
                  Tekrar Dene
                </button>

                <button
                  onClick={() => window.location.href = '/contact'}
                  className="bg-white text-[#ee7f1a] border-2 border-[#ee7f1a] px-10 py-6 md:px-8 md:py-4 rounded-xl hover:bg-[#ee7f1a] hover:text-white transition-all duration-300 transform hover:scale-105 font-bold text-xl md:text-lg shadow-lg flex items-center justify-center gap-3"
                >
                  <Phone className="w-6 h-6 md:w-5 md:h-5" />
                  İletişime Geç
                </button>
              </div>

              {/* Bilgilendirme */}
              <div className="mt-10 md:mt-8 p-6 md:p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-4 md:mb-2 text-lg md:text-base flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sorun Nedir?
                </h4>
                <ul className="text-blue-700 text-base md:text-sm space-y-2 md:space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    İkas API sunucularında geçici bir sorun olabilir
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    İnternet bağlantınızda sorun olabilir
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    API erişim tokeninde sorun olabilir
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    CORS (Cross-Origin) politika sorunu olabilir
                  </li>
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
    <section className="py-32 md:py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden min-h-screen md:min-h-0">
      {/* Arka plan animasyonları */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 md:w-32 md:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 md:w-40 md:h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-24 md:h-24 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 md:mb-16">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 md:mb-6">
            <Leaf className="w-6 h-6 md:w-5 md:h-5 text-white" />
            <span className="text-white font-medium text-lg md:text-base">%100 Doğal Ürünler</span>
          </div>
          
          <h3 className="text-6xl md:text-5xl font-bold text-white mb-8 md:mb-6 leading-tight">
            Mağazamızdan
            <br />
            <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              Premium Ürünler
            </span>
          </h3>
          
          <p className="text-2xl md:text-xl text-orange-100 max-w-4xl mx-auto leading-relaxed mb-8 md:mb-6">
            CalFormat ile meyve ve sebzelerinizi güvenle tüketin
          </p>
          
        </div>        {/* Ürün Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8 mb-16 md:mb-12">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-6 shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group relative"
            >
              {/* Discount Badge */}
              {product.discount && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-2 md:px-3 md:py-1 rounded-full text-base md:text-sm font-bold z-10 shadow-lg">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    %{product.discount} İndirim
                  </span>
                </div>
              )}

              {/* Ürün Resmi */}
              <div className="relative mb-6 md:mb-4 overflow-hidden rounded-2xl">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-56 md:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/calformat.webp';
                  }}
                />
                
                {/* Kalite rozetleri */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Ürün Bilgileri */}
              <div className="space-y-5 md:space-y-4">
                <h4 className="text-2xl md:text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
                  {product.name}
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-3 md:gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 md:w-4 md:h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-base md:text-sm text-gray-600 font-medium">
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>

                {/* Özellikler */}
                <div className="flex flex-wrap gap-3 md:gap-2">
                  {product.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="bg-green-100 text-green-800 px-4 py-2 md:px-3 md:py-1 rounded-full text-sm md:text-xs font-medium flex items-center gap-2 md:gap-1"
                    >
                      <Check className="w-4 h-4 md:w-3 md:h-3" />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Fiyat */}
                <div className="flex items-center gap-4 md:gap-3">
                  <span className="text-3xl md:text-2xl font-bold text-[#ee7f1a] flex items-center gap-1">
                    <span>₺</span>{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl md:text-lg text-gray-500 line-through">
                      ₺{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Marka */}
                {product.brand && (
                  <p className="text-base md:text-sm text-gray-600 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Marka: <span className="font-medium">{product.brand}</span>
                  </p>
                )}

                {/* Sepete Ekle Butonu */}
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="w-full px-8 py-5 md:px-6 md:py-3 rounded-xl font-bold text-xl md:text-lg shadow-lg flex items-center justify-center gap-3 md:gap-2 transition-all duration-300 transform bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white hover:from-[#d62d27] hover:to-[#ee7f1a] hover:scale-105 hover:shadow-xl"
                >
                  <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
                  Sepete Ekle
                </button>
              </div>
            </div>
          ))}
        </div>        {/* CTA */}
      </div>
    </section>
  );
};

export default CTASection;