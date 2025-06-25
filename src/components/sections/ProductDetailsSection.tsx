import React from 'react';
import { Check, Award } from 'lucide-react';
import SectionTitle from '../ui/SectionTitle';

const ProductDetailsSection: React.FC = () => {
  const usageSteps = [
    { step: 1, title: "Suya Karıştırın", desc: "1 litre suya 1 çay kaşığı CalFormat ekleyin", color: "from-blue-500 to-cyan-500" },
    { step: 2, title: "Bekletin", desc: "Meyve ve sebzeleri 2-3 dakika bekletin", color: "from-purple-500 to-pink-500" },
    { step: 3, title: "Durulayın", desc: "Temiz suyla durulayın ve servis edin", color: "from-green-500 to-emerald-500" }
  ];

  const productFeatures = [
    { icon: <Check className="w-5 h-5 text-[#ee7f1a]" />, text: "250gr İçerik" },
    { icon: <Check className="w-5 h-5 text-[#ee7f1a]" />, text: "300+ Kullanım" },
    { icon: <Check className="w-5 h-5 text-[#ee7f1a]" />, text: "2 Yıl Raf Ömrü" },
    { icon: <Check className="w-5 h-5 text-[#ee7f1a]" />, text: "Çevre Dostu" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-yellow-50/50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <span className="bg-gradient-to-r from-[#ee7f1a] to-[#e5b818] text-white px-4 py-2 rounded-full text-sm font-medium">
                Kullanım Kılavuzu
              </span>
              <h3 className="text-4xl font-bold text-gray-900 mb-6 mt-4">Nasıl Kullanılır?</h3>
            </div>
            
            <div className="space-y-6">
              {usageSteps.map((item, index) => (
                <div key={index} className="flex gap-4 group cursor-pointer">
                  <div className={`bg-gradient-to-r ${item.color} text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-[#ee7f1a] transition-colors duration-300">
                      {item.title}
                    </h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-orange-200/50 p-8 shadow-xl">
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Ürün Özellikleri:</h4>
              <div className="grid grid-cols-2 gap-4">
                {productFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 group cursor-pointer">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <span className="text-gray-700 group-hover:text-[#ee7f1a] transition-colors duration-300">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ee7f1a]/10 to-[#e5b818]/10 rounded-3xl transform -rotate-6 scale-110 blur-xl"></div>
            <img 
              src="https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Temiz meyve ve sebzeler"
              className="relative w-full h-96 object-cover rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white p-6 rounded-3xl shadow-xl transform hover:rotate-12 transition-transform duration-300">
              <div className="text-3xl font-bold">%99.9</div>
              <div className="text-sm">Temizlik Oranı</div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-orange-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#ee7f1a]" />
                <span className="text-sm font-medium">Laboratuvar Onaylı</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailsSection;