import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#ee7f1a] via-[#d62d27] to-[#e5b818] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h3 className="text-5xl font-bold text-white mb-6">
          Ailenizin Sağlığını Korumaya Başlayın
        </h3>
        <p className="text-xl text-orange-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          CalFormat ile meyve ve sebzelerinizi güvenle tüketin. 
          30 günlük memnuniyet garantisi ile risk almadan deneyin.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-white border border-white/30 transform hover:scale-105 transition-transform duration-300">
            <div className="text-4xl font-bold">₺799,00</div>
            <div className="text-orange-100 text-lg">Tek ödeme</div>
          </div>
          <div className="text-white text-3xl font-bold animate-pulse">+</div>
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-white border border-white/30 transform hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold">ÜCRETSİZ</div>
            <div className="text-orange-100 text-lg">Kargo</div>
          </div>
        </div>
        
        <button className="group bg-white text-[#ee7f1a] px-12 py-5 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-bold text-xl shadow-2xl flex items-center gap-3 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <ShoppingCart className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
          <span className="relative z-10">Şimdi Sipariş Verin</span>
        </button>
        
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-orange-100">
          {[
            { icon: <Check className="w-5 h-5" />, text: "30 Gün Garanti" },
            { icon: <Check className="w-5 h-5" />, text: "Ücretsiz Kargo" },
            { icon: <Check className="w-5 h-5" />, text: "Güvenli Ödeme" },
            { icon: <Check className="w-5 h-5" />, text: "24/7 Destek" }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 hover:text-white transition-colors duration-300 cursor-pointer">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;