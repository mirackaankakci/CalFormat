import React from 'react';
import { Leaf } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <img src='/logo.png' width="200px"></img>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Doğal ve güvenli temizlik çözümleri ile ailenizin sağlığını koruyoruz.
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-6 text-lg">Ürünler</h5>
            <ul className="space-y-3 text-gray-400">
              {["Meyve Sebze Tozu", "Doğal Temizleyici", "Çok Amaçlı Temizlik"].map((item, index) => (
                <li key={index} className="hover:text-[#ee7f1a] transition-colors duration-300 cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-6 text-lg">Destek</h5>
            <ul className="space-y-3 text-gray-400">
              {["SSS", "İletişim", "Geri İade", "Kargo Takip"].map((item, index) => (
                <li key={index} className="hover:text-[#ee7f1a] transition-colors duration-300 cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-6 text-lg">İletişim</h5>
            <div className="space-y-3 text-gray-400">
              <p className="hover:text-[#ee7f1a] transition-colors duration-300">
                info@calformat.com
              </p>
              <p className="hover:text-[#ee7f1a] transition-colors duration-300">
                0850 123 45 67
              </p>
              <p className="text-sm">
                7/24 Müşteri Hizmetleri
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2024 CalFormat. Tüm hakları saklıdır. | 
            <span className="text-[#ee7f1a] hover:text-[#d62d27] transition-colors duration-300 cursor-pointer"> Gizlilik Politikası</span> | 
            <span className="text-[#ee7f1a] hover:text-[#d62d27] transition-colors duration-300 cursor-pointer"> Kullanım Şartları</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;