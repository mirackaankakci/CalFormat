import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { benefits } from '../../data/benefits';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useIkas } from '../../contexts/IkasContext';
import { cleanAndTruncateHtml } from '../../utils/textUtils';

interface HeroSectionProps {
  isVisible: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isVisible }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { firstProduct } = useIkas();
  // ✅ API'den gelen ilk ürün varsa onu kullan, yoksa fallback
  const product = firstProduct || {
    id: 1,
    name: "CalFormat Meyve & Sebze Temizleme Tozu",
    description: "Doğal bileşenlerle hazırlanmış özel formülümüz ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyin. %100 doğal içerikli, güvenli ve etkili temizlik çözümü.",
    price: 799.00,
    image: "/calformat.webp",
    rating: 4.9,
    reviewCount: 2847,
    features: ["Doğal İçerik", "Etkili Temizlik", "Güvenli"],
    stock: 999,
    brand: "CalFormat"
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variantId: "7868c357-4726-432a-ad5d-49619e6a508b" // Varsayılan variant ID
    });
    
    // Sepet sayfasına yönlendir
    navigate('/cart');
  };
  
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-8 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="bg-gradient-to-r from-[#ee7f1a] to-[#e5b818] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  %100 Doğal Ürün
                </span>
                <div className="flex items-center gap-1">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-1 text-[#ee7f1a] text-xs bg-orange-50 px-2 py-1 rounded-full">
                      {benefit.icon}
                      <span className="hidden sm:inline">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>
                <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                {product.brand || "CalFormat"}
                <span className="bg-gradient-to-r from-[#ee7f1a] via-[#d62d27] to-[#e5b818] bg-clip-text text-transparent block animate-pulse">
                  {product.name.includes('Temizleme') ? 'Temizleme Tozu' : product.name}
                </span>
              </h2>              <p className="text-xl text-gray-600 leading-relaxed">
                {/* HTML etiketlerini temizle ve düzgün formatlayın */}
                {product.description ? (
                  // HTML etiketlerini temizle ve metin olarak göster
                  cleanAndTruncateHtml(product.description, 35)
                ) : (
                  // Fallback açıklama
                  <>
                    Doğal bileşenlerle hazırlanmış özel formülümüz ile meyve ve sebzelerinizdeki 
                    <span className="font-semibold text-[#ee7f1a]"> pestisit, balmumu ve zararlı kalıntıları</span> etkili şekilde temizleyin.
                  </>
                )}
              </p>
            </div>
              <div className="flex items-center gap-6">
              <div className="flex items-center">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className={`w-6 h-6 ${star <= Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'} animate-pulse`} style={{animationDelay: `${star * 100}ms`}} />
                ))}
                <span className="ml-3 text-gray-600 font-medium">
                  ({product.rating}/5) - {product.reviewCount.toLocaleString()} yorum
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                className="group bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-8 py-4 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg flex items-center justify-center gap-3 relative overflow-hidden"
              >                <div className="absolute inset-0 bg-gradient-to-r from-[#d62d27] to-[#ee7f1a] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ShoppingCart className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Hemen Satın Al - ₺{product.price.toFixed(2)}</span>
              </button>
              <button className="border-2 border-[#ee7f1a] text-[#ee7f1a] px-8 py-4 rounded-full hover:bg-gradient-to-r hover:from-[#ee7f1a] hover:to-[#d62d27] hover:text-white transition-all duration-300 font-semibold text-lg transform hover:scale-105">
                Daha Fazla Bilgi
              </button>
            </div>
          </div>

          <div className={`relative transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ee7f1a]/20 to-[#e5b818]/20 rounded-3xl transform rotate-6 scale-105 blur-xl"></div>
              <div className="relative bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-100 rounded-3xl p-8 transform rotate-3 shadow-2xl hover:rotate-1 transition-transform duration-500">              <img 
                src={product.image}
                alt={product.name}
                className="w-full h-96 object-cover rounded-2xl shadow-lg transform -rotate-3 hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = '/calformat.webp';
                }}
              />
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#d62d27] to-[#ee7f1a] text-white p-3 rounded-2xl shadow-xl animate-bounce">
                  <div className="text-lg font-bold">%30</div>
                  <div className="text-xs">İNDİRİM</div>
                </div>
              </div>              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    {product.stock && product.stock > 0 
                      ? `${product.stock > 999 ? '999+' : product.stock} Stokta Mevcut`
                      : 'Stokta Mevcut'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;