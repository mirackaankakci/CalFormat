import React from 'react';
import { Leaf, ShoppingCart } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src='/logo.png' width="200px"></img>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Stokta
              </span>
              <span>Ücretsiz Kargo</span>
              <span>30 Gün Garanti</span>
            </div>
            <button className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Sepet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;